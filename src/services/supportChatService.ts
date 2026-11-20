import {
  doc,
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
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
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
    const threadDocData = sanitizeForFirestore({
      id: targetThreadId,
      userId: isAdminAction ? thread.userId : fbUser.uid,
      userName: thread.userName || 'Utilizador',
      userEmail: thread.userEmail || fbUser.email || '',
      ...(thread.userAvatarUrl ? { userAvatarUrl: thread.userAvatarUrl } : {}),
      userPlan: thread.userPlan || 'free',
      status: thread.status,
      lastMessageText: (thread.lastMessageText || '').slice(0, 500),
      ...(thread.lastMessageSenderRole ? { lastMessageSenderRole: thread.lastMessageSenderRole } : {}),
      lastMessageAt: thread.lastMessageAt,
      unreadByUser: Number(thread.unreadByUser) || 0,
      unreadByAdmin: Number(thread.unreadByAdmin) || 0,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    });

    await setDoc(doc(db, 'supportThreads', targetThreadId), threadDocData, { merge: true });

    if (message && /^[a-zA-Z0-9_\-]{1,128}$/.test(message.id)) {
      const msgDocData = sanitizeForFirestore({
        id: message.id,
        threadId: targetThreadId,
        senderId: isAdminAction ? message.senderId : fbUser.uid,
        senderName: message.senderName,
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
  const data = await parseJsonResponse<{ thread: SupportChatThread }>(res);
  return data.thread;
}

export async function sendUserSupportMessage(text: string): Promise<{
  thread: SupportChatThread;
  message: SupportChatMessage;
}> {
  const res = await authorizedFetch('/api/support-chat/messages', {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  const data = await parseJsonResponse<{ thread: SupportChatThread; message: SupportChatMessage }>(res);
  void syncSupportToFirestore(data.thread, data.message, false);
  return data;
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
      await setDoc(
        doc(db, 'supportThreads', fbUser.uid),
        { unreadByUser: 0, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch {
      // ignore if thread doc does not exist yet or rules reject partial merge
    }
  }
}

export async function fetchAdminSupportThreads(): Promise<{
  threads: SupportChatThread[];
  unreadTotal: number;
}> {
  const res = await authorizedFetch('/api/admin/support-chat/threads', {
    method: 'GET',
    cache: 'no-store'
  });
  return parseJsonResponse<{ threads: SupportChatThread[]; unreadTotal: number }>(res);
}

export async function sendAdminSupportReply(
  threadId: string,
  text: string
): Promise<{ thread: SupportChatThread; message: SupportChatMessage }> {
  const res = await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  const data = await parseJsonResponse<{ thread: SupportChatThread; message: SupportChatMessage }>(res);
  void syncSupportToFirestore(data.thread, data.message, true);
  return data;
}

export async function markAdminSupportThreadRead(threadId: string): Promise<void> {
  try {
    await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/read`, {
      method: 'POST'
    });
  } catch {
    // non-critical read marker failure
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
  const data = await parseJsonResponse<{ thread: SupportChatThread }>(res);
  void syncSupportToFirestore(data.thread, undefined, true);
  return data.thread;
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
