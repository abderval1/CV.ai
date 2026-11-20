import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore
} from '../lib/firebase';
import {
  NotificationEventType,
  NotificationPreferences,
  User,
  UserNotificationItem
} from '../types/cv';

const PREFS_STORAGE_PREFIX = 'ce_notif_prefs_v1_';
const ITEMS_STORAGE_PREFIX = 'ce_notif_items_v1_';
export const NOTIFICATION_PREFS_EVENT = 'ce-notification-prefs-updated';
export const SYSTEM_NOTIFICATION_EVENT = 'ce-system-notification';

function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('curriculopro_auth_token') ||
      sessionStorage.getItem('curriculopro_auth_token')
    );
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers
  });
}

function sanitizeSafeId(raw?: string): string {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  return cleaned || `ntf_${Date.now()}`;
}

export function getDefaultNotificationPreferences(userId = 'default'): NotificationPreferences {
  return {
    id: 'notifications',
    userId: String(userId || 'default').slice(0, 128),
    systemEnabled: true,
    emailEnabled: true,
    events: {
      translation: { system: true, email: true },
      export: { system: true, email: true },
      resumeUpdate: { system: true, email: false }
    },
    updatedAt: new Date().toISOString()
  };
}

export function sanitizeNotificationPreferences(
  userId: string,
  raw?: Partial<NotificationPreferences> | null
): NotificationPreferences {
  const defaults = getDefaultNotificationPreferences(userId);
  const eventsRaw = raw?.events;
  return {
    id: 'notifications',
    userId: String(userId || defaults.userId).slice(0, 128),
    systemEnabled: typeof raw?.systemEnabled === 'boolean' ? raw.systemEnabled : defaults.systemEnabled,
    emailEnabled: typeof raw?.emailEnabled === 'boolean' ? raw.emailEnabled : defaults.emailEnabled,
    events: {
      translation: {
        system:
          typeof eventsRaw?.translation?.system === 'boolean'
            ? eventsRaw.translation.system
            : defaults.events.translation.system,
        email:
          typeof eventsRaw?.translation?.email === 'boolean'
            ? eventsRaw.translation.email
            : defaults.events.translation.email
      },
      export: {
        system:
          typeof eventsRaw?.export?.system === 'boolean'
            ? eventsRaw.export.system
            : defaults.events.export.system,
        email:
          typeof eventsRaw?.export?.email === 'boolean'
            ? eventsRaw.export.email
            : defaults.events.export.email
      },
      resumeUpdate: {
        system:
          typeof eventsRaw?.resumeUpdate?.system === 'boolean'
            ? eventsRaw.resumeUpdate.system
            : defaults.events.resumeUpdate.system,
        email:
          typeof eventsRaw?.resumeUpdate?.email === 'boolean'
            ? eventsRaw.resumeUpdate.email
            : defaults.events.resumeUpdate.email
      }
    },
    updatedAt:
      typeof raw?.updatedAt === 'string' && raw.updatedAt.length >= 10
        ? raw.updatedAt.slice(0, 50)
        : new Date().toISOString()
  };
}

export function getCachedNotificationPreferences(userId?: string): NotificationPreferences {
  const uid = String(userId || 'default');
  try {
    const raw = localStorage.getItem(`${PREFS_STORAGE_PREFIX}${uid}`);
    if (raw) {
      return sanitizeNotificationPreferences(uid, JSON.parse(raw));
    }
  } catch {
    // ignore storage errors
  }
  return getDefaultNotificationPreferences(uid);
}

function setCachedNotificationPreferences(userId: string, prefs: NotificationPreferences) {
  try {
    localStorage.setItem(`${PREFS_STORAGE_PREFIX}${userId}`, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function getCachedNotifications(userId?: string): UserNotificationItem[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${ITEMS_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function setCachedNotifications(userId: string, items: UserNotificationItem[]) {
  try {
    localStorage.setItem(`${ITEMS_STORAGE_PREFIX}${userId}`, JSON.stringify(items.slice(0, 40)));
  } catch {
    // ignore
  }
}

function mergeNotificationLists(
  primary: UserNotificationItem[],
  secondary: UserNotificationItem[]
): UserNotificationItem[] {
  const map = new Map<string, UserNotificationItem>();
  for (const item of [...primary, ...secondary]) {
    if (!item?.id) continue;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
    } else {
      map.set(item.id, {
        ...prev,
        ...item,
        read: Boolean(prev.read || item.read)
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 40);
}

export async function loadNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const cached = getCachedNotificationPreferences(userId);
  let resolved = cached;

  // 1. Try Firestore when Firebase Auth matches userId
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const path = `users/${userId}/preferences/notifications`;
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'preferences', 'notifications'));
      if (snap.exists()) {
        resolved = sanitizeNotificationPreferences(userId, snap.data() as Partial<NotificationPreferences>);
        setCachedNotificationPreferences(userId, resolved);
        return resolved;
      }
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }
  }

  // 2. Fallback to backend Express preferences endpoint
  if (getAuthToken()) {
    try {
      const res = await apiFetch('/api/auth/notification-preferences', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data?.preferences) {
          resolved = sanitizeNotificationPreferences(userId, data.preferences);
          setCachedNotificationPreferences(userId, resolved);
        }
      }
    } catch {
      // ignore offline/network errors
    }
  }

  return resolved;
}

export async function saveNotificationPreferences(
  userId: string,
  prefsInput: NotificationPreferences
): Promise<NotificationPreferences> {
  const normalized = sanitizeNotificationPreferences(userId, {
    ...prefsInput,
    id: 'notifications',
    userId,
    updatedAt: new Date().toISOString()
  });

  setCachedNotificationPreferences(userId, normalized);

  // 1. Persist to Firestore subcollection when Firebase user is authenticated
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const path = `users/${userId}/preferences/notifications`;
    try {
      await setDoc(
        doc(db, 'users', userId, 'preferences', 'notifications'),
        sanitizeForFirestore(normalized)
      );
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      console.warn('Aviso ao gravar preferências no Firestore:', err);
    }
  }

  // 2. Sync to backend Express API
  if (getAuthToken()) {
    try {
      const res = await apiFetch('/api/auth/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify(normalized)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('Aviso ao sincronizar preferências no servidor:', errData?.error || res.status);
      }
    } catch {
      // ignore offline fallback
    }
  }

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_PREFS_EVENT, {
      detail: { userId, preferences: normalized }
    })
  );

  return normalized;
}

export async function fetchUserNotifications(userId: string): Promise<UserNotificationItem[]> {
  if (!userId) return [];
  const cached = getCachedNotifications(userId);
  let firestoreItems: UserNotificationItem[] = [];
  let serverItems: UserNotificationItem[] = [];

  if (auth.currentUser && auth.currentUser.uid === userId) {
    const colPath = `users/${userId}/notifications`;
    try {
      const q = query(
        collection(db, 'users', userId, 'notifications'),
        where('userId', '==', userId),
        limit(40)
      );
      const snap = await getDocs(q);
      firestoreItems = snap.docs.map((d) => d.data() as UserNotificationItem);
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, colPath);
      }
    }
  }

  if (getAuthToken()) {
    try {
      const res = await apiFetch('/api/notifications', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.notifications)) {
          serverItems = data.notifications as UserNotificationItem[];
        }
      }
    } catch {
      // ignore
    }
  }

  const merged = mergeNotificationLists(mergeNotificationLists(firestoreItems, serverItems), cached);
  setCachedNotifications(userId, merged);
  return merged;
}

export function subscribeToUserNotifications(
  userId: string,
  onUpdate: (items: UserNotificationItem[]) => void
): () => void {
  if (!userId) return () => {};

  onUpdate(getCachedNotifications(userId));

  let unsubFirestore = () => {};
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const colPath = `users/${userId}/notifications`;
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('userId', '==', userId),
      limit(40)
    );
    unsubFirestore = onSnapshot(
      q,
      (snap) => {
        const fsItems = snap.docs.map((d) => d.data() as UserNotificationItem);
        const merged = mergeNotificationLists(fsItems, getCachedNotifications(userId));
        setCachedNotifications(userId, merged);
        onUpdate(merged);
      },
      (err) => {
        const msg = String(err?.message || err?.code || '');
        if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.LIST, colPath);
        }
      }
    );
  }

  // Hydrate server items initially
  void fetchUserNotifications(userId).then(onUpdate).catch(() => {});

  const localEventHandler = (ev: Event) => {
    const detail = (ev as CustomEvent)?.detail;
    if (detail?.userId === userId) {
      onUpdate(getCachedNotifications(userId));
    }
  };
  window.addEventListener(SYSTEM_NOTIFICATION_EVENT, localEventHandler);

  return () => {
    unsubFirestore();
    window.removeEventListener(SYSTEM_NOTIFICATION_EVENT, localEventHandler);
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  if (!userId || !notificationId) return;
  const cached = getCachedNotifications(userId).map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );
  setCachedNotifications(userId, cached);

  if (auth.currentUser && auth.currentUser.uid === userId && /^[a-zA-Z0-9_\-]{1,128}$/.test(notificationId)) {
    const path = `users/${userId}/notifications/${notificationId}`;
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        await updateDoc(docRef, { read: true });
      }
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  }

  if (getAuthToken()) {
    try {
      await apiFetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'PATCH'
      });
    } catch {
      // ignore
    }
  }

  window.dispatchEvent(new CustomEvent(SYSTEM_NOTIFICATION_EVENT, { detail: { userId } }));
}

export async function markAllNotificationsAsRead(
  userId: string,
  items: UserNotificationItem[]
): Promise<void> {
  if (!userId) return;
  const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
  const updated = items.map((i) => ({ ...i, read: true }));
  setCachedNotifications(userId, updated);

  if (auth.currentUser && auth.currentUser.uid === userId) {
    await Promise.all(
      unreadIds.map(async (id) => {
        if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(id)) return;
        const docRef = doc(db, 'users', userId, 'notifications', id);
        try {
          const existingSnap = await getDoc(docRef);
          if (existingSnap.exists()) {
            await updateDoc(docRef, { read: true });
          }
        } catch (err: any) {
          const msg = String(err?.message || err?.code || '');
          if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/notifications/${id}`);
          }
        }
      })
    );
  }

  if (getAuthToken()) {
    try {
      await apiFetch('/api/notifications/all/read', { method: 'PATCH' });
    } catch {
      // ignore
    }
  }

  window.dispatchEvent(new CustomEvent(SYSTEM_NOTIFICATION_EVENT, { detail: { userId } }));
}

export async function clearUserNotifications(
  userId: string,
  items: UserNotificationItem[]
): Promise<void> {
  if (!userId) return;
  setCachedNotifications(userId, []);

  if (auth.currentUser && auth.currentUser.uid === userId) {
    await Promise.all(
      items.map(async (item) => {
        if (!item?.id || !/^[a-zA-Z0-9_\-]{1,128}$/.test(item.id)) return;
        const docRef = doc(db, 'users', userId, 'notifications', item.id);
        try {
          const existingSnap = await getDoc(docRef);
          if (existingSnap.exists()) {
            await deleteDoc(docRef);
          }
        } catch (err: any) {
          const msg = String(err?.message || err?.code || '');
          if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
            handleFirestoreError(
              err,
              OperationType.DELETE,
              `users/${userId}/notifications/${item.id}`
            );
          }
        }
      })
    );
  }

  if (getAuthToken()) {
    try {
      await apiFetch('/api/notifications', { method: 'DELETE' });
    } catch {
      // ignore
    }
  }

  window.dispatchEvent(new CustomEvent(SYSTEM_NOTIFICATION_EVENT, { detail: { userId } }));
}

export interface DispatchNotificationInput {
  user?: User | null;
  eventType: NotificationEventType;
  title: string;
  message: string;
  targetResource?: string;
}

export async function dispatchUserNotification(
  input: DispatchNotificationInput
): Promise<{
  dispatched: boolean;
  channelSystem: boolean;
  channelEmail: boolean;
  notification?: UserNotificationItem;
}> {
  const userId = input.user?.id || auth.currentUser?.uid;
  if (!userId) {
    return { dispatched: false, channelSystem: false, channelEmail: false };
  }

  const prefs = getCachedNotificationPreferences(userId);
  const eventConfig =
    input.eventType === 'translation'
      ? prefs.events.translation
      : input.eventType === 'export'
      ? prefs.events.export
      : prefs.events.resumeUpdate;

  const channelSystem = Boolean(prefs.systemEnabled && eventConfig.system);
  const channelEmail = Boolean(prefs.emailEnabled && eventConfig.email);

  if (!channelSystem && !channelEmail) {
    return { dispatched: false, channelSystem: false, channelEmail: false };
  }

  const notifId = sanitizeSafeId(`ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const createdAt = new Date().toISOString();
  const safeTitle = String(input.title || 'Notificação').trim().slice(0, 140) || 'Notificação';
  const safeMessage =
    String(input.message || 'Atualização concluída na sua conta.').trim().slice(0, 500) ||
    'Atualização concluída na sua conta.';
  const safeTarget = input.targetResource
    ? String(input.targetResource).trim().slice(0, 180)
    : undefined;

  let emailDeliveryStatus: 'not_requested' | 'sent' | 'queued' = channelEmail
    ? 'queued'
    : 'not_requested';

  // Server dispatch (for both persistence + email delivery when configured)
  if (getAuthToken()) {
    try {
      const res = await apiFetch('/api/notifications/dispatch', {
        method: 'POST',
        body: JSON.stringify({
          id: notifId,
          eventType: input.eventType,
          title: safeTitle,
          message: safeMessage,
          channelSystem,
          channelEmail,
          targetResource: safeTarget,
          createdAt
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.emailDeliveryStatus === 'sent' || data?.emailDeliveryStatus === 'queued') {
          emailDeliveryStatus = data.emailDeliveryStatus;
        }
      }
    } catch {
      // fallback to local & Firestore persistence
    }
  }

  const notification: UserNotificationItem = {
    id: notifId,
    userId,
    eventType: input.eventType,
    title: safeTitle,
    message: safeMessage,
    channelSystem,
    channelEmail,
    emailDeliveryStatus,
    read: !channelSystem,
    createdAt,
    ...(safeTarget ? { targetResource: safeTarget } : {})
  };

  if (auth.currentUser && auth.currentUser.uid === userId) {
    const path = `users/${userId}/notifications/${notifId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'notifications', notifId), sanitizeForFirestore(notification));
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  }

  const nextList = mergeNotificationLists([notification], getCachedNotifications(userId));
  setCachedNotifications(userId, nextList);

  window.dispatchEvent(
    new CustomEvent(SYSTEM_NOTIFICATION_EVENT, {
      detail: {
        userId,
        notification,
        showToast: channelSystem
      }
    })
  );

  return {
    dispatched: true,
    channelSystem,
    channelEmail,
    notification
  };
}
