import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { authorizedFetch, getClientAuthToken } from '../utils/authHeaders';
import { SupportChatMessage, SupportChatThread, SupportThreadStatus } from '../types/cv';

export type SupportWsStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SupportChatRealtimeEvent {
  type: 'support_chat_update' | 'connected' | 'pong';
  action?: string;
  thread?: SupportChatThread;
  message?: SupportChatMessage;
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text().catch(() => '');
  let data: (T & { error?: string }) | null = null;
  if (text.trim().startsWith('{') || text.trim().startsWith('[') || contentType.includes('application/json')) {
    try {
      data = JSON.parse(text) as T & { error?: string };
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Servidor API indisponível ou resposta inválida (HTML recebido).');
  }
  return data;
}

/**
 * Syncs support message / thread snapshot to Firestore when the caller has a Firebase Auth session.
 * Never throws or blocks primary backend REST + WebSocket persistence.
 */
async function syncSupportToFirestore(
  thread: SupportChatThread,
  message?: SupportChatMessage,
  isAdminAction = false
): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser) return;

  const targetThreadId = isAdminAction ? thread.id : fbUser.uid;
  if (!targetThreadId || !/^[a-zA-Z0-9_\-]{1,128}$/.test(targetThreadId)) return;

  try {
    const threadRef = doc(db, 'supportThreads', targetThreadId);
    const existingSnap = await getDoc(threadRef).catch(() => null);
    const existingData = existingSnap && existingSnap.exists() ? (existingSnap.data() as Partial<SupportChatThread>) : null;

    // Preserve immutable createdAt/userId on existing Firestore docs so rules validation (incoming().createdAt == existing().createdAt) always passes across cold Lambdas
    const resolvedCreatedAt = existingData?.createdAt || thread.createdAt || new Date().toISOString();
    const resolvedUserId = existingData?.userId || (isAdminAction ? thread.userId : fbUser.uid);
    const resolvedUnreadByAdmin = isAdminAction
      ? Number(thread.unreadByAdmin) || 0
      : Math.max(Number(thread.unreadByAdmin) || 1, (Number(existingData?.unreadByAdmin) || 0) + (message ? 1 : 0));

    const threadDocData = sanitizeForFirestore({
      id: targetThreadId,
      userId: resolvedUserId,
      userName: thread.userName || existingData?.userName || 'Utilizador',
      userEmail: thread.userEmail || existingData?.userEmail || fbUser.email || '',
      ...(thread.userAvatarUrl || existingData?.userAvatarUrl
        ? { userAvatarUrl: thread.userAvatarUrl || existingData?.userAvatarUrl }
        : {}),
      userPlan: thread.userPlan || existingData?.userPlan || 'free',
      status: thread.status || 'open',
      lastMessageText: (thread.lastMessageText || existingData?.lastMessageText || '').slice(0, 500),
      ...(thread.lastMessageSenderRole
        ? { lastMessageSenderRole: thread.lastMessageSenderRole }
        : existingData?.lastMessageSenderRole
        ? { lastMessageSenderRole: existingData.lastMessageSenderRole }
        : {}),
      lastMessageAt: thread.lastMessageAt || new Date().toISOString(),
      unreadByUser: Number(thread.unreadByUser) || 0,
      unreadByAdmin: resolvedUnreadByAdmin,
      createdAt: resolvedCreatedAt,
      updatedAt: thread.updatedAt || new Date().toISOString()
    });

    await setDoc(threadRef, threadDocData, { merge: true });

    if (message && /^[a-zA-Z0-9_\-]{1,128}$/.test(message.id)) {
      const msgDocData = sanitizeForFirestore({
        id: message.id,
        threadId: targetThreadId,
        senderId: isAdminAction ? message.senderId : fbUser.uid,
        senderName: message.senderName || 'Utilizador',
        senderRole: message.senderRole,
        text: message.text,
        createdAt: message.createdAt
      });
      await setDoc(doc(db, 'supportThreads', targetThreadId, 'messages', message.id), msgDocData, {
        merge: true
      });
    }
  } catch (error: any) {
    if (String(error?.code || '').includes('permission-denied')) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `supportThreads/${targetThreadId}`);
      } catch {
        // non-blocking secondary sync
      }
    }
  }
}

export async function fetchMySupportThread(): Promise<SupportChatThread> {
  const res = await authorizedFetch('/api/support-chat/thread', { method: 'GET', cache: 'no-store' });
  const data = await parseJsonResponse<{ thread?: SupportChatThread }>(res);
  if (!data?.thread || !data.thread.id) {
    throw new Error('Resposta de conversa de suporte inválida.');
  }
  return {
    ...data.thread,
    messages: Array.isArray(data.thread.messages) ? data.thread.messages : []
  };
}

export async function sendUserSupportMessage(text: string): Promise<{
  thread: SupportChatThread;
  message: SupportChatMessage;
}> {
  const res = await authorizedFetch('/api/support-chat/messages', {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  const data = await parseJsonResponse<{ thread?: SupportChatThread; message?: SupportChatMessage }>(res);
  if (!data?.thread || !data?.message) {
    throw new Error('Não foi possível confirmar o envio da mensagem no servidor.');
  }
  const normalizedThread: SupportChatThread = {
    ...data.thread,
    messages: Array.isArray(data.thread.messages) ? data.thread.messages : [data.message]
  };
  void syncSupportToFirestore(normalizedThread, data.message, false);
  return { thread: normalizedThread, message: data.message };
}

export async function markMySupportThreadRead(): Promise<void> {
  try {
    await authorizedFetch('/api/support-chat/read', { method: 'POST' });
  } catch {
    // non-critical read marker failure
  }
  const fbUser = auth.currentUser;
  if (fbUser?.uid && /^[a-zA-Z0-9_\-]{1,128}$/.test(fbUser.uid)) {
    try {
      const threadRef = doc(db, 'supportThreads', fbUser.uid);
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        await setDoc(
          threadRef,
          { unreadByUser: 0, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch {
      // ignore if rules reject or offline
    }
  }
}

function mergeSupportMessagesList(
  a: SupportChatMessage[] = [],
  b: SupportChatMessage[] = []
): SupportChatMessage[] {
  const byId = new Map<string, SupportChatMessage>();
  for (const m of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    if (m?.id) byId.set(m.id, m);
  }
  return Array.from(byId.values()).sort(
    (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
  );
}

function mergeSupportThreads(
  primary: SupportChatThread[],
  secondary: SupportChatThread[]
): SupportChatThread[] {
  const map = new Map<string, SupportChatThread>();
  for (const th of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    if (!th?.id) continue;
    const prev = map.get(th.id);
    if (!prev) {
      map.set(th.id, { ...th, messages: Array.isArray(th.messages) ? th.messages : [] });
    } else {
      const prevTs = new Date(prev.updatedAt || prev.lastMessageAt || 0).getTime();
      const curTs = new Date(th.updatedAt || th.lastMessageAt || 0).getTime();
      const newer = curTs >= prevTs ? th : prev;
      const older = curTs >= prevTs ? prev : th;
      map.set(th.id, {
        ...older,
        ...newer,
        messages: mergeSupportMessagesList(older?.messages, newer?.messages)
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
  );
}

async function fetchFirestoreAdminThreads(): Promise<SupportChatThread[]> {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, 'supportThreads'), orderBy('lastMessageAt', 'desc'), limit(80));
    const snap = await getDocs(q);
    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const th = d.data() as SupportChatThread;
        let msgs: SupportChatMessage[] = [];
        try {
          const msgSnap = await getDocs(
            query(collection(db, 'supportThreads', d.id, 'messages'), orderBy('createdAt', 'asc'), limit(150))
          );
          msgs = msgSnap.docs.map((m) => m.data() as SupportChatMessage);
        } catch {
          // ignore subcollection read errors
        }
        return {
          ...th,
          id: th.id || d.id,
          messages: msgs
        };
      })
    );
    return items.filter((t) => (t.messages && t.messages.length > 0) || Boolean(t.lastMessageText));
  } catch {
    return [];
  }
}

export async function fetchAdminSupportThreads(): Promise<{
  threads: SupportChatThread[];
  unreadTotal: number;
}> {
  const [backendResult, fsThreads] = await Promise.all([
    authorizedFetch('/api/admin/support-chat/threads', {
      method: 'GET',
      cache: 'no-store'
    })
      .then((res) => parseJsonResponse<{ threads: SupportChatThread[]; unreadTotal: number }>(res))
      .catch(() => ({ threads: [] as SupportChatThread[], unreadTotal: 0 })),
    fetchFirestoreAdminThreads()
  ]);

  const merged = mergeSupportThreads(backendResult.threads || [], fsThreads);
  const unreadTotal = merged.reduce((sum, t) => sum + (Number(t.unreadByAdmin) || 0), 0);
  return { threads: merged, unreadTotal };
}

export async function sendAdminSupportReply(
  threadId: string,
  text: string,
  threadHint?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPlan?: 'free' | 'pro' | 'executive';
    userAvatarUrl?: string;
  }
): Promise<{ thread: SupportChatThread; message: SupportChatMessage }> {
  try {
    const res = await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, userMeta: threadHint })
    });
    const data = await parseJsonResponse<{ thread?: SupportChatThread; message?: SupportChatMessage }>(res);
    if (!data?.thread || !data?.message) {
      throw new Error('Resposta inválida do servidor ao responder chat.');
    }
    const normalizedThread: SupportChatThread = {
      ...data.thread,
      messages: Array.isArray(data.thread.messages) ? data.thread.messages : [data.message]
    };
    void syncSupportToFirestore(normalizedThread, data.message, true);
    return { thread: normalizedThread, message: data.message };
  } catch (err) {
    // Fallback direct Firestore reply if serverless backend instance is cold and user is Firebase Admin
    const fbAdmin = auth.currentUser;
    if (!fbAdmin || !/^[a-zA-Z0-9_\-]{1,128}$/.test(threadId)) {
      throw err;
    }
    const cleanText = text.trim().slice(0, 2000);
    const nowIso = new Date().toISOString();
    const threadRef = doc(db, 'supportThreads', threadId);
    const existingSnap = await getDoc(threadRef);
    const existingData = existingSnap.exists() ? (existingSnap.data() as SupportChatThread) : null;
    const msg: SupportChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      senderId: fbAdmin.uid,
      senderName: fbAdmin.displayName ? `${fbAdmin.displayName} (Admin)` : 'Equipa de Suporte',
      senderRole: 'admin',
      text: cleanText,
      createdAt: nowIso
    };
    const updatedThread: SupportChatThread = {
      id: threadId,
      userId: existingData?.userId || threadHint?.userId || threadId,
      userName: existingData?.userName || threadHint?.userName || 'Utilizador',
      userEmail: existingData?.userEmail || threadHint?.userEmail || '',
      ...(existingData?.userAvatarUrl || threadHint?.userAvatarUrl
        ? { userAvatarUrl: existingData?.userAvatarUrl || threadHint?.userAvatarUrl }
        : {}),
      userPlan: existingData?.userPlan || threadHint?.userPlan || 'free',
      status: 'open',
      lastMessageText: cleanText.slice(0, 500),
      lastMessageSenderRole: 'admin',
      lastMessageAt: nowIso,
      unreadByUser: (Number(existingData?.unreadByUser) || 0) + 1,
      unreadByAdmin: 0,
      createdAt: existingData?.createdAt || nowIso,
      updatedAt: nowIso
    };
    await syncSupportToFirestore(updatedThread, msg, true);
    const msgsSnap = await getDocs(
      query(collection(db, 'supportThreads', threadId, 'messages'), orderBy('createdAt', 'asc'), limit(150))
    );
    return {
      thread: {
        ...updatedThread,
        messages: msgsSnap.docs.map((m) => m.data() as SupportChatMessage)
      },
      message: msg
    };
  }
}

export async function markAdminSupportThreadRead(threadId: string): Promise<void> {
  try {
    await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/read`, {
      method: 'POST'
    });
  } catch {
    // non-critical read marker failure
  }
  if (auth.currentUser && /^[a-zA-Z0-9_\-]{1,128}$/.test(threadId)) {
    try {
      const threadRef = doc(db, 'supportThreads', threadId);
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        await setDoc(
          threadRef,
          { unreadByAdmin: 0, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch {
      // ignore
    }
  }
}

export async function updateAdminSupportThreadStatus(
  threadId: string,
  status: SupportThreadStatus
): Promise<SupportChatThread> {
  const res = await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  const data = await parseJsonResponse<{ thread?: SupportChatThread }>(res);
  if (!data?.thread || !data.thread.id) {
    throw new Error('Resposta inválida ao atualizar estado da conversa.');
  }
  const normalizedThread: SupportChatThread = {
    ...data.thread,
    messages: Array.isArray(data.thread.messages) ? data.thread.messages : []
  };
  void syncSupportToFirestore(normalizedThread, undefined, true);
  return normalizedThread;
}

/**
 * Connects to the authoritative WebSocket server on `/ws/support-chat`
 * with exponential backoff reconnection on unexpected drops.
 */
export function subscribeSupportChatWebSocket(
  onEvent: (event: SupportChatRealtimeEvent) => void,
  onStatusChange?: (status: SupportWsStatus) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let ws: WebSocket | null = null;
  let closedByCaller = false;
  let hadSuccessfulOpen = false;
  let preOpenFailures = 0;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const clearTimers = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const connect = () => {
    if (closedByCaller) return;
    onStatusChange?.(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = getClientAuthToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `${protocol}//${window.location.host}/ws/support-chat${qs}`;

    try {
      ws = new WebSocket(url);
    } catch {
      onStatusChange?.('disconnected');
      return;
    }

    let openedThisAttempt = false;

    ws.onopen = () => {
      openedThisAttempt = true;
      hadSuccessfulOpen = true;
      preOpenFailures = 0;
      reconnectAttempts = 0;
      onStatusChange?.('connected');
      clearTimers();
      heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping' }));
          } catch {
            // ignore
          }
        }
      }, 25000);
    };

    ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.data || '')) as SupportChatRealtimeEvent;
        if (parsed && parsed.type) {
          onEvent(parsed);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (closedByCaller) {
        onStatusChange?.('disconnected');
        return;
      }
      if (!openedThisAttempt && !hadSuccessfulOpen) {
        preOpenFailures += 1;
        if (preOpenFailures >= 2) {
          // Serverless hostings (e.g. Vercel) do not support WS upgrade; fall back cleanly to HTTP/Firestore sync
          onStatusChange?.('disconnected');
          return;
        }
      }
      reconnectAttempts += 1;
      onStatusChange?.('reconnecting');
      const delayMs = Math.min(15000, 1000 * Math.pow(1.6, Math.min(reconnectAttempts, 6)));
      reconnectTimer = setTimeout(connect, delayMs);
    };

    ws.onerror = () => {
      // onclose handles cleanup & backoff reconnection
    };
  };

  connect();

  return () => {
    closedByCaller = true;
    clearTimers();
    if (ws) {
      try {
        ws.close();
      } catch {
        // ignore
      }
      ws = null;
    }
    onStatusChange?.('disconnected');
  };
}

/**
 * Optional Firestore real-time mirror listener when user is authenticated with Firebase Auth.
 */
export function subscribeMyFirestoreSupportMessages(
  onMessages: (messages: SupportChatMessage[]) => void
): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid) return () => {};
  const q = query(
    collection(db, 'supportThreads', fbUser.uid, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(150)
  );
  const unsub: Unsubscribe = onSnapshot(
    q,
    (snap) => {
      if (snap.empty) return;
      const list = snap.docs.map((d) => d.data() as SupportChatMessage);
      onMessages(list);
    },
    (err) => {
      if (String(err?.code || '').includes('permission-denied')) {
        try {
          handleFirestoreError(err, OperationType.LIST, `supportThreads/${fbUser.uid}/messages`);
        } catch {
          // handled
        }
      }
    }
  );
  return () => unsub();
}

/**
 * Watches the user's supportThreads document in Firestore for instant unread badge / status updates
 * when authenticated with Firebase Auth.
 */
export function subscribeMyFirestoreSupportThread(
  onThread: (thread: SupportChatThread) => void
): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid || !/^[a-zA-Z0-9_\-]{1,128}$/.test(fbUser.uid)) return () => {};
  const ref = doc(db, 'supportThreads', fbUser.uid);
  const unsub: Unsubscribe = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as SupportChatThread;
      if (data && data.id) {
        onThread(data);
      }
    },
    (err) => {
      if (String(err?.code || '').includes('permission-denied')) {
        try {
          handleFirestoreError(err, OperationType.GET, `supportThreads/${fbUser.uid}`);
        } catch {
          // handled
        }
      }
    }
  );
  return () => unsub();
}

/**
 * Watches all supportThreads in Firestore for Admin Dashboard real-time inbox sync on serverless hosts.
 */
export function subscribeAdminFirestoreSupportThreads(
  onThreads: (threads: SupportChatThread[]) => void
): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid) return () => {};
  const q = query(collection(db, 'supportThreads'), orderBy('lastMessageAt', 'desc'), limit(80));
  const unsub: Unsubscribe = onSnapshot(
    q,
    async (snap) => {
      try {
        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const th = d.data() as SupportChatThread;
            let msgs: SupportChatMessage[] = [];
            try {
              const msgSnap = await getDocs(
                query(
                  collection(db, 'supportThreads', d.id, 'messages'),
                  orderBy('createdAt', 'asc'),
                  limit(150)
                )
              );
              msgs = msgSnap.docs.map((m) => m.data() as SupportChatMessage);
            } catch {
              // ignore
            }
            return {
              ...th,
              id: th.id || d.id,
              messages: msgs
            };
          })
        );
        const nonEmpty = items.filter((t) => (t.messages && t.messages.length > 0) || Boolean(t.lastMessageText));
        if (nonEmpty.length > 0) {
          onThreads(nonEmpty);
        }
      } catch {
        // ignore transient errors
      }
    },
    () => {
      // ignore non-admin listener permissions if token refreshed
    }
  );
  return () => unsub();
}
