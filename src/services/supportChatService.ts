import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { authorizedFetch, getClientAuthToken } from '../utils/authHeaders';
import {
  SubscriptionPlan,
  SupportChatMessage,
  SupportChatThread,
  SupportThreadStatus
} from '../types/cv';

export type SupportWsStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SupportChatRealtimeEvent {
  type: 'support_chat_update' | 'connected' | 'pong';
  action?: string;
  thread?: SupportChatThread;
  message?: SupportChatMessage;
}

const VALID_ID_RE = /^[a-zA-Z0-9_\-]{1,128}$/;

function isValidFirestoreId(val?: string | null): val is string {
  return typeof val === 'string' && VALID_ID_RE.test(val.trim());
}

function clampIso(val?: string | null): string {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length >= 10 && trimmed.length <= 50) return trimmed;
  }
  return new Date().toISOString();
}

function sanitizePlan(plan?: string | null): SubscriptionPlan {
  return plan === 'pro' || plan === 'executive' ? plan : 'free';
}

function sanitizeUserName(name?: string | null, email?: string | null): string {
  const raw = String(name || '').trim();
  if (raw.length >= 1) return raw.slice(0, 120);
  const fromEmail = String(email || '').split('@')[0]?.trim();
  if (fromEmail && fromEmail.length >= 1) return fromEmail.slice(0, 120);
  return 'Utilizador';
}

function sanitizeUserEmail(email?: string | null, fallbackEmail?: string | null): string {
  const raw = String(email || fallbackEmail || '').trim();
  if (raw.length >= 3) return raw.slice(0, 180);
  return 'user@resume2job.vercel.app';
}

function sanitizeAvatarUrl(url?: string | null): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.length >= 8 && trimmed.length <= 500) return trimmed;
  return undefined;
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

function reportSupportError(
  context: string,
  err: unknown,
  op: OperationType,
  path: string,
  onError?: (msg: string) => void
): string {
  const rawMsg = err instanceof Error ? err.message : String(err || 'Erro desconhecido');
  const code = typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : '';
  if (code.includes('permission-denied')) {
    try {
      handleFirestoreError(err, op, path);
    } catch (wrappedErr: unknown) {
      const wrappedMsg = wrappedErr instanceof Error ? wrappedErr.message : rawMsg;
      console.error(`[SupportChat:${context}] Firestore permission denied on "${path}":`, wrappedMsg);
      const friendly = `Permissão Firestore recusada em ${path}. Verifique as regras ou sessão.`;
      onError?.(friendly);
      return friendly;
    }
  }
  console.error(`[SupportChat:${context}] Failed on "${path}":`, {
    code: code || undefined,
    message: rawMsg,
    error: err
  });
  const friendly = code ? `[${code}] ${rawMsg}` : rawMsg;
  onError?.(friendly);
  return friendly;
}

export function mergeSupportMessagesList(
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

/**
 * Syncs support message / thread snapshot to Firestore when the caller has a Firebase Auth session.
 * Writes the message subcollection doc FIRST so any `onSnapshot` listener on `supportThreads`
 * immediately sees the complete message list without race conditions.
 */
async function syncSupportToFirestore(
  thread: SupportChatThread,
  message?: SupportChatMessage,
  isAdminAction = false,
  throwOnError = false
): Promise<boolean> {
  const fbUser = auth.currentUser;
  if (!fbUser) return false;

  const candidateId = isAdminAction ? thread.id : fbUser.uid;
  if (!isValidFirestoreId(candidateId)) return false;
  const targetThreadId = candidateId.trim();

  try {
    // 1) Write message FIRST so parent collection snapshots never miss the newly created message
    if (message && isValidFirestoreId(message.id)) {
      const cleanText = String(message.text || '').trim().slice(0, 2000);
      if (cleanText.length >= 1) {
        const msgDocData = sanitizeForFirestore({
          id: message.id.trim(),
          threadId: targetThreadId,
          senderId: String(isAdminAction ? message.senderId || fbUser.uid : fbUser.uid).slice(0, 128),
          senderName: sanitizeUserName(
            message.senderName,
            isAdminAction ? fbUser.email : thread.userEmail || fbUser.email
          ),
          senderRole: message.senderRole === 'admin' ? 'admin' : 'user',
          text: cleanText,
          createdAt: clampIso(message.createdAt)
        });
        await setDoc(
          doc(db, 'supportThreads', targetThreadId, 'messages', message.id.trim()),
          msgDocData,
          { merge: true }
        );
      }
    }

    // 2) Read existing parent thread doc cleanly so immutable fields (`id`, `userId`, `createdAt`) match rules
    const threadRef = doc(db, 'supportThreads', targetThreadId);
    const existingSnap = await getDoc(threadRef);
    const existingData = existingSnap.exists()
      ? (existingSnap.data() as Partial<SupportChatThread>)
      : null;

    const resolvedCreatedAt = clampIso(existingData?.createdAt || thread.createdAt);
    const resolvedUserId = String(
      existingData?.userId || (isAdminAction ? thread.userId || targetThreadId : fbUser.uid)
    ).slice(0, 128);
    const resolvedEmail = sanitizeUserEmail(
      thread.userEmail || existingData?.userEmail,
      isAdminAction ? undefined : fbUser.email
    );
    const resolvedName = sanitizeUserName(
      thread.userName || existingData?.userName,
      resolvedEmail
    );
    const resolvedAvatar = sanitizeAvatarUrl(
      thread.userAvatarUrl || existingData?.userAvatarUrl
    );
    const resolvedUnreadByAdmin = isAdminAction
      ? Math.max(0, Number(thread.unreadByAdmin) || 0)
      : Math.max(
          Number(thread.unreadByAdmin) || 0,
          (Number(existingData?.unreadByAdmin) || 0) + (message ? 1 : 0)
        );
    const resolvedUnreadByUser = !existingData && !isAdminAction
      ? 0
      : Math.max(0, Number(thread.unreadByUser ?? existingData?.unreadByUser ?? 0) || 0);

    const threadDocData = sanitizeForFirestore({
      id: targetThreadId,
      userId: resolvedUserId,
      userName: resolvedName,
      userEmail: resolvedEmail,
      ...(resolvedAvatar ? { userAvatarUrl: resolvedAvatar } : {}),
      userPlan: sanitizePlan(thread.userPlan || existingData?.userPlan),
      status: !existingData && !isAdminAction ? 'open' : thread.status === 'resolved' ? 'resolved' : 'open',
      lastMessageText: String(
        thread.lastMessageText || existingData?.lastMessageText || message?.text || ''
      ).slice(0, 500),
      ...(thread.lastMessageSenderRole
        ? { lastMessageSenderRole: thread.lastMessageSenderRole }
        : existingData?.lastMessageSenderRole
        ? { lastMessageSenderRole: existingData.lastMessageSenderRole }
        : {}),
      lastMessageAt: clampIso(thread.lastMessageAt || message?.createdAt),
      unreadByUser: resolvedUnreadByUser,
      unreadByAdmin: resolvedUnreadByAdmin,
      createdAt: resolvedCreatedAt,
      updatedAt: clampIso(thread.updatedAt || message?.createdAt)
    });

    await setDoc(threadRef, threadDocData, { merge: true });
    return true;
  } catch (error: any) {
    if (String(error?.code || '').includes('permission-denied')) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `supportThreads/${targetThreadId}`);
      } catch (wrappedErr) {
        if (throwOnError) throw wrappedErr;
      }
    } else if (throwOnError) {
      throw error;
    }
    return false;
  }
}

async function fetchMyFirestoreThread(
  onError?: (msg: string) => void
): Promise<{ thread: SupportChatThread | null; error?: string }> {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid || !isValidFirestoreId(fbUser.uid)) {
    return { thread: null };
  }
  let lastError: string | undefined;
  try {
    const threadRef = doc(db, 'supportThreads', fbUser.uid);
    const msgsQuery = query(
      collection(db, 'supportThreads', fbUser.uid, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(150)
    );

    const [threadSnap, msgsSnap] = await Promise.all([
      getDoc(threadRef).catch((err) => {
        lastError = reportSupportError(
          'fetchMyFirestoreThread:doc',
          err,
          OperationType.GET,
          `supportThreads/${fbUser.uid}`,
          onError
        );
        return null;
      }),
      getDocs(msgsQuery).catch((err) => {
        lastError = reportSupportError(
          'fetchMyFirestoreThread:messages',
          err,
          OperationType.LIST,
          `supportThreads/${fbUser.uid}/messages`,
          onError
        );
        return null;
      })
    ]);

    const fsMsgs: SupportChatMessage[] = msgsSnap
      ? msgsSnap.docs.map((d) => d.data() as SupportChatMessage)
      : [];
    const fsData = threadSnap && threadSnap.exists() ? (threadSnap.data() as SupportChatThread) : null;
    if (!fsData && fsMsgs.length === 0) {
      return { thread: null, error: lastError };
    }

    const nowIso = new Date().toISOString();
    const lastMsg = fsMsgs[fsMsgs.length - 1];
    return {
      thread: {
        id: fbUser.uid,
        userId: fbUser.uid,
        userName: sanitizeUserName(fsData?.userName || fbUser.displayName, fsData?.userEmail || fbUser.email),
        userEmail: sanitizeUserEmail(fsData?.userEmail, fbUser.email),
        ...(fsData?.userAvatarUrl || fbUser.photoURL
          ? { userAvatarUrl: sanitizeAvatarUrl(fsData?.userAvatarUrl || fbUser.photoURL) }
          : {}),
        userPlan: sanitizePlan(fsData?.userPlan),
        status: fsData?.status === 'resolved' ? 'resolved' : 'open',
        lastMessageText: fsData?.lastMessageText || lastMsg?.text || '',
        lastMessageSenderRole: fsData?.lastMessageSenderRole || lastMsg?.senderRole,
        lastMessageAt: fsData?.lastMessageAt || lastMsg?.createdAt || nowIso,
        unreadByUser: Number(fsData?.unreadByUser) || 0,
        unreadByAdmin: Number(fsData?.unreadByAdmin) || 0,
        createdAt: fsData?.createdAt || lastMsg?.createdAt || nowIso,
        updatedAt: fsData?.updatedAt || lastMsg?.createdAt || nowIso,
        messages: fsMsgs
      },
      error: lastError
    };
  } catch (err) {
    lastError = reportSupportError(
      'fetchMyFirestoreThread',
      err,
      OperationType.GET,
      `supportThreads/${fbUser.uid}`,
      onError
    );
    return { thread: null, error: lastError };
  }
}

export async function fetchMySupportThread(options?: {
  onError?: (msg: string) => void;
}): Promise<SupportChatThread> {
  let backendError: string | undefined;
  let fsError: string | undefined;

  const [backendResult, fsRes] = await Promise.all([
    authorizedFetch('/api/support-chat/thread', { method: 'GET', cache: 'no-store' })
      .then((res) => parseJsonResponse<{ thread?: SupportChatThread }>(res))
      .then((data) =>
        data?.thread?.id
          ? {
              ...data.thread,
              messages: Array.isArray(data.thread.messages) ? data.thread.messages : []
            }
          : null
      )
      .catch((err: unknown) => {
        backendError = err instanceof Error ? err.message : String(err || 'Erro HTTP');
        console.warn('[SupportChat:fetchMySupportThread] HTTP /api/support-chat/thread fallback triggered:', backendError);
        return null;
      }),
    fetchMyFirestoreThread((msg) => {
      fsError = msg;
    })
  ]);

  const fsThread = fsRes.thread;
  if (fsRes.error) fsError = fsRes.error;

  if (backendResult && fsThread) {
    const backendTs = new Date(backendResult.updatedAt || backendResult.lastMessageAt || 0).getTime();
    const fsTs = new Date(fsThread.updatedAt || fsThread.lastMessageAt || 0).getTime();
    const newer = fsTs >= backendTs ? fsThread : backendResult;
    const older = fsTs >= backendTs ? backendResult : fsThread;
    return {
      ...older,
      ...newer,
      id: fsThread.id || newer.id,
      userId: fsThread.userId || newer.userId,
      messages: mergeSupportMessagesList(older.messages, newer.messages)
    };
  }

  if (fsThread) {
    if (fsError) options?.onError?.(fsError);
    return fsThread;
  }
  if (backendResult) {
    if (fsError && String(fsError).includes('Permissão Firestore')) {
      options?.onError?.(fsError);
    }
    return backendResult;
  }

  const fbUser = auth.currentUser;
  if (fbUser?.uid) {
    if (fsError || backendError) {
      const combinedErr = fsError || backendError || 'Falha ao sincronizar histórico do chat.';
      console.error('[SupportChat:fetchMySupportThread] Could not load history from HTTP or Firestore:', {
        backendError,
        fsError
      });
      options?.onError?.(combinedErr);
    }
    const nowIso = new Date().toISOString();
    return {
      id: fbUser.uid,
      userId: fbUser.uid,
      userName: sanitizeUserName(fbUser.displayName, fbUser.email),
      userEmail: sanitizeUserEmail(fbUser.email),
      ...(fbUser.photoURL ? { userAvatarUrl: sanitizeAvatarUrl(fbUser.photoURL) } : {}),
      userPlan: 'free',
      status: 'open',
      lastMessageText: '',
      lastMessageAt: nowIso,
      unreadByUser: 0,
      unreadByAdmin: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: []
    };
  }

  const finalErr = fsError || backendError || 'Não foi possível carregar a conversa de suporte.';
  console.error('[SupportChat:fetchMySupportThread] All channels failed:', finalErr);
  options?.onError?.(finalErr);
  throw new Error(finalErr);
}

export async function sendUserSupportMessage(
  text: string,
  userHint?: {
    id?: string;
    name?: string;
    email?: string;
    plan?: SubscriptionPlan;
    avatarUrl?: string;
  }
): Promise<{
  thread: SupportChatThread;
  message: SupportChatMessage;
}> {
  const cleanText = text.trim().slice(0, 2000);
  if (!cleanText) {
    throw new Error('Escreva uma mensagem antes de enviar.');
  }

  try {
    const res = await authorizedFetch('/api/support-chat/messages', {
      method: 'POST',
      body: JSON.stringify({ text: cleanText })
    });
    const data = await parseJsonResponse<{ thread?: SupportChatThread; message?: SupportChatMessage }>(res);
    if (!data?.thread || !data?.message) {
      throw new Error('Não foi possível confirmar o envio da mensagem no servidor.');
    }
    const normalizedThread: SupportChatThread = {
      ...data.thread,
      messages: Array.isArray(data.thread.messages) ? data.thread.messages : [data.message]
    };
    if (auth.currentUser) {
      await syncSupportToFirestore(normalizedThread, data.message, false, false);
    }
    return { thread: normalizedThread, message: data.message };
  } catch (err) {
    // Direct Firestore persistence fallback when serverless backend is cold/unreachable and Firebase Auth is active
    const fbUser = auth.currentUser;
    if (!fbUser?.uid || !isValidFirestoreId(fbUser.uid)) {
      throw err;
    }

    const nowIso = new Date().toISOString();
    const msg: SupportChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      threadId: fbUser.uid,
      senderId: fbUser.uid,
      senderName: sanitizeUserName(userHint?.name || fbUser.displayName, userHint?.email || fbUser.email),
      senderRole: 'user',
      text: cleanText,
      createdAt: nowIso
    };

    const { thread: existing } = await fetchMyFirestoreThread();
    const threadSnapshot: SupportChatThread = {
      id: fbUser.uid,
      userId: fbUser.uid,
      userName: sanitizeUserName(userHint?.name || existing?.userName || fbUser.displayName, userHint?.email || fbUser.email),
      userEmail: sanitizeUserEmail(userHint?.email || existing?.userEmail, fbUser.email),
      ...(sanitizeAvatarUrl(userHint?.avatarUrl || existing?.userAvatarUrl || fbUser.photoURL)
        ? { userAvatarUrl: sanitizeAvatarUrl(userHint?.avatarUrl || existing?.userAvatarUrl || fbUser.photoURL) }
        : {}),
      userPlan: sanitizePlan(userHint?.plan || existing?.userPlan),
      status: 'open',
      lastMessageText: cleanText.slice(0, 500),
      lastMessageSenderRole: 'user',
      lastMessageAt: nowIso,
      unreadByUser: 0,
      unreadByAdmin: (Number(existing?.unreadByAdmin) || 0) + 1,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso
    };

    await syncSupportToFirestore(threadSnapshot, msg, false, true);
    const msgs = mergeSupportMessagesList(existing?.messages || [], [msg]);
    return {
      thread: { ...threadSnapshot, messages: msgs },
      message: msg
    };
  }
}

export async function markMySupportThreadRead(): Promise<void> {
  try {
    await authorizedFetch('/api/support-chat/read', { method: 'POST' });
  } catch {
    // non-critical read marker failure
  }
  const fbUser = auth.currentUser;
  if (fbUser?.uid && isValidFirestoreId(fbUser.uid)) {
    try {
      const threadRef = doc(db, 'supportThreads', fbUser.uid);
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        await updateDoc(threadRef, {
          unreadByUser: 0,
          updatedAt: new Date().toISOString()
        });
      }
    } catch {
      // ignore if rules reject or offline
    }
  }
}

export function mergeSupportThreads(
  primary: SupportChatThread[],
  secondary: SupportChatThread[]
): SupportChatThread[] {
  const map = new Map<string, SupportChatThread>();
  const emailToKey = new Map<string, string>();

  for (const th of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    if (!th?.id) continue;
    const normEmail = String(th.userEmail || '').trim().toLowerCase();
    const matchedEmailKey = normEmail && normEmail.includes('@') ? emailToKey.get(normEmail) : undefined;
    const key = (matchedEmailKey && map.has(matchedEmailKey) ? matchedEmailKey : th.id);
    const prev = map.get(key);

    if (!prev) {
      const normalized = { ...th, messages: Array.isArray(th.messages) ? th.messages : [] };
      map.set(key, normalized);
      if (normEmail && normEmail.includes('@')) {
        emailToKey.set(normEmail, key);
      }
    } else {
      const prevTs = new Date(prev.updatedAt || prev.lastMessageAt || 0).getTime();
      const curTs = new Date(th.updatedAt || th.lastMessageAt || 0).getTime();
      const newer = curTs >= prevTs ? th : prev;
      const older = curTs >= prevTs ? prev : th;
      // Prefer canonical non-usr_ (Firebase UID) ID when merging duplicate email threads
      const preferredId =
        !th.id.startsWith('usr') && prev.id.startsWith('usr')
          ? th.id
          : prev.id;
      const preferredUserId =
        !th.userId.startsWith('usr') && prev.userId.startsWith('usr')
          ? th.userId
          : prev.userId;

      const mergedThread: SupportChatThread = {
        ...older,
        ...newer,
        id: preferredId,
        userId: preferredUserId,
        messages: mergeSupportMessagesList(older?.messages, newer?.messages)
      };

      if (preferredId !== key) {
        map.delete(key);
        map.set(preferredId, mergedThread);
        if (normEmail && normEmail.includes('@')) {
          emailToKey.set(normEmail, preferredId);
        }
      } else {
        map.set(key, mergedThread);
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
  );
}

async function fetchFirestoreAdminThreads(
  onError?: (msg: string) => void
): Promise<{ threads: SupportChatThread[]; error?: string }> {
  if (!auth.currentUser) return { threads: [] };
  let lastError: string | undefined;
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
        } catch (subErr) {
          lastError = reportSupportError(
            'fetchFirestoreAdminThreads:messages',
            subErr,
            OperationType.LIST,
            `supportThreads/${d.id}/messages`,
            onError
          );
        }
        return {
          ...th,
          id: th.id || d.id,
          messages: msgs
        };
      })
    );
    return {
      threads: items.filter((t) => (t.messages && t.messages.length > 0) || Boolean(t.lastMessageText)),
      error: lastError
    };
  } catch (err) {
    lastError = reportSupportError(
      'fetchFirestoreAdminThreads',
      err,
      OperationType.LIST,
      'supportThreads',
      onError
    );
    return { threads: [], error: lastError };
  }
}

export async function fetchAdminSupportThreads(options?: {
  onError?: (msg: string) => void;
}): Promise<{
  threads: SupportChatThread[];
  unreadTotal: number;
  error?: string;
}> {
  let backendError: string | undefined;
  let fsError: string | undefined;

  const [backendResult, fsRes] = await Promise.all([
    authorizedFetch('/api/admin/support-chat/threads', {
      method: 'GET',
      cache: 'no-store'
    })
      .then((res) => parseJsonResponse<{ threads: SupportChatThread[]; unreadTotal: number }>(res))
      .catch((err: unknown) => {
        backendError = err instanceof Error ? err.message : String(err || 'Erro HTTP');
        console.warn('[SupportChat:fetchAdminSupportThreads] HTTP /api/admin/support-chat/threads fallback triggered:', backendError);
        return { threads: [] as SupportChatThread[], unreadTotal: 0 };
      }),
    fetchFirestoreAdminThreads((msg) => {
      fsError = msg;
    })
  ]);

  if (fsRes.error) fsError = fsRes.error;
  const merged = mergeSupportThreads(backendResult.threads || [], fsRes.threads || []);
  const unreadTotal = merged.reduce((sum, t) => sum + (Number(t.unreadByAdmin) || 0), 0);

  const surfacedError =
    fsError && String(fsError).includes('Permissão Firestore')
      ? fsError
      : merged.length === 0 && (fsError || backendError)
      ? fsError || backendError
      : undefined;

  if (surfacedError) {
    options?.onError?.(surfacedError);
  }

  return { threads: merged, unreadTotal, error: surfacedError };
}

export async function sendAdminSupportReply(
  threadId: string,
  text: string,
  threadHint?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPlan?: SubscriptionPlan;
    userAvatarUrl?: string;
  }
): Promise<{ thread: SupportChatThread; message: SupportChatMessage }> {
  const cleanText = text.trim().slice(0, 2000);
  if (!cleanText) {
    throw new Error('Escreva uma resposta antes de enviar.');
  }

  let backendSuccess: { thread: SupportChatThread; message: SupportChatMessage } | null = null;
  let backendErr: unknown = null;

  try {
    const res = await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: cleanText, userMeta: threadHint })
    });
    const data = await parseJsonResponse<{ thread?: SupportChatThread; message?: SupportChatMessage }>(res);
    if (!data?.thread || !data?.message) {
      throw new Error('Resposta inválida do servidor ao responder chat.');
    }
    backendSuccess = {
      thread: {
        ...data.thread,
        messages: Array.isArray(data.thread.messages) ? data.thread.messages : [data.message]
      },
      message: data.message
    };
  } catch (err) {
    backendErr = err;
  }

  const fbAdmin = auth.currentUser;

  if (backendSuccess) {
    if (fbAdmin) {
      await syncSupportToFirestore(backendSuccess.thread, backendSuccess.message, true, false);
    }
    return backendSuccess;
  }

  // Fallback direct Firestore reply when backend instance is cold/unreachable and Admin has Firebase Auth
  if (!fbAdmin || !isValidFirestoreId(threadId)) {
    throw backendErr instanceof Error ? backendErr : new Error('Não foi possível enviar a resposta.');
  }

  const nowIso = new Date().toISOString();
  const threadRef = doc(db, 'supportThreads', threadId);
  const existingSnap = await getDoc(threadRef).catch(() => null);
  const existingData = existingSnap && existingSnap.exists() ? (existingSnap.data() as SupportChatThread) : null;

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
    userName: sanitizeUserName(
      existingData?.userName || threadHint?.userName,
      existingData?.userEmail || threadHint?.userEmail
    ),
    userEmail: sanitizeUserEmail(existingData?.userEmail || threadHint?.userEmail),
    ...(sanitizeAvatarUrl(existingData?.userAvatarUrl || threadHint?.userAvatarUrl)
      ? { userAvatarUrl: sanitizeAvatarUrl(existingData?.userAvatarUrl || threadHint?.userAvatarUrl) }
      : {}),
    userPlan: sanitizePlan(existingData?.userPlan || threadHint?.userPlan),
    status: 'open',
    lastMessageText: cleanText.slice(0, 500),
    lastMessageSenderRole: 'admin',
    lastMessageAt: nowIso,
    unreadByUser: (Number(existingData?.unreadByUser) || 0) + 1,
    unreadByAdmin: 0,
    createdAt: existingData?.createdAt || nowIso,
    updatedAt: nowIso
  };

  await syncSupportToFirestore(updatedThread, msg, true, true);
  const msgsSnap = await getDocs(
    query(collection(db, 'supportThreads', threadId, 'messages'), orderBy('createdAt', 'asc'), limit(150))
  ).catch(() => null);
  const fsMsgs = msgsSnap ? msgsSnap.docs.map((m) => m.data() as SupportChatMessage) : [];

  return {
    thread: {
      ...updatedThread,
      messages: mergeSupportMessagesList(fsMsgs, [msg])
    },
    message: msg
  };
}

export async function markAdminSupportThreadRead(threadId: string): Promise<void> {
  try {
    await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}/read`, {
      method: 'POST'
    });
  } catch {
    // non-critical read marker failure
  }
  if (auth.currentUser && isValidFirestoreId(threadId)) {
    try {
      const threadRef = doc(db, 'supportThreads', threadId);
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        await updateDoc(threadRef, {
          unreadByAdmin: 0,
          updatedAt: new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  }
}

export async function updateAdminSupportThreadStatus(
  threadId: string,
  status: SupportThreadStatus,
  threadHint?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPlan?: SubscriptionPlan;
    userAvatarUrl?: string;
  }
): Promise<SupportChatThread> {
  try {
    const res = await authorizedFetch(`/api/admin/support-chat/${encodeURIComponent(threadId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, userMeta: threadHint })
    });
    const data = await parseJsonResponse<{ thread?: SupportChatThread }>(res);
    if (!data?.thread || !data.thread.id) {
      throw new Error('Resposta inválida ao atualizar estado da conversa.');
    }
    const normalizedThread: SupportChatThread = {
      ...data.thread,
      messages: Array.isArray(data.thread.messages) ? data.thread.messages : []
    };
    if (auth.currentUser) {
      await syncSupportToFirestore(normalizedThread, undefined, true, false);
    }
    return normalizedThread;
  } catch (err) {
    if (!auth.currentUser || !isValidFirestoreId(threadId)) {
      throw err;
    }
    const threadRef = doc(db, 'supportThreads', threadId);
    const snap = await getDoc(threadRef);
    const nowIso = new Date().toISOString();
    if (snap.exists()) {
      await updateDoc(threadRef, {
        status,
        unreadByAdmin: 0,
        updatedAt: nowIso
      });
      const existingData = snap.data() as SupportChatThread;
      return {
        ...existingData,
        id: existingData.id || threadId,
        status,
        unreadByAdmin: 0,
        updatedAt: nowIso
      };
    }
    throw err;
  }
}

/**
 * Connects to the authoritative WebSocket server on `/ws/support-chat`
 * with handshake timeout protection and exponential backoff reconnection.
 */
export function subscribeSupportChatWebSocket(
  onEvent: (event: SupportChatRealtimeEvent) => void,
  onStatusChange?: (status: SupportWsStatus) => void,
  onError?: (msg: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let ws: WebSocket | null = null;
  let closedByCaller = false;
  let hadSuccessfulOpen = false;
  let preOpenFailures = 0;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const clearTimers = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (connectTimeoutTimer) {
      clearTimeout(connectTimeoutTimer);
      connectTimeoutTimer = null;
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
    } catch (err) {
      console.warn('[SupportChat:WS] WebSocket constructor failed, falling back to HTTP/Firestore polling:', err);
      onError?.('WebSocket indisponível; a usar sincronização HTTP/Firestore.');
      onStatusChange?.('disconnected');
      return;
    }

    let openedThisAttempt = false;

    if (connectTimeoutTimer) clearTimeout(connectTimeoutTimer);
    connectTimeoutTimer = setTimeout(() => {
      if (!openedThisAttempt && ws && ws.readyState === WebSocket.CONNECTING) {
        console.warn('[SupportChat:WS] Handshake timed out after 6000ms — switching to HTTP/Firestore fallback.');
        try {
          ws.close();
        } catch {
          // ignore close error
        }
      }
    }, 6000);

    ws.onopen = () => {
      openedThisAttempt = true;
      hadSuccessfulOpen = true;
      preOpenFailures = 0;
      reconnectAttempts = 0;
      clearTimers();
      onStatusChange?.('connected');
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
      } catch (err) {
        console.warn('[SupportChat:WS] Ignored malformed WebSocket frame:', err);
      }
    };

    ws.onclose = (evt) => {
      if (connectTimeoutTimer) {
        clearTimeout(connectTimeoutTimer);
        connectTimeoutTimer = null;
      }
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
        console.warn(
          `[SupportChat:WS] Connection closed before opening (attempt ${preOpenFailures}, code=${evt.code || 'unknown'}).`
        );
        if (preOpenFailures >= 2) {
          // Serverless hostings (e.g. Vercel) do not support WS upgrade; fall back cleanly to HTTP/Firestore polling
          console.info('[SupportChat:WS] WebSocket unsupported on host; using HTTP/Firestore polling.');
          onStatusChange?.('disconnected');
          return;
        }
      } else {
        console.warn(`[SupportChat:WS] Socket dropped (code=${evt.code || 'unknown'}), scheduling reconnect.`);
      }
      reconnectAttempts += 1;
      onStatusChange?.('reconnecting');
      const delayMs = Math.min(15000, 1000 * Math.pow(1.6, Math.min(reconnectAttempts, 6)));
      reconnectTimer = setTimeout(connect, delayMs);
    };

    ws.onerror = (evt) => {
      console.warn('[SupportChat:WS] Socket transport error detected; fallback polling active.', evt);
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
 * Real-time Firestore mirror listener for authenticated user's own messages.
 */
export function subscribeMyFirestoreSupportMessages(
  onMessages: (messages: SupportChatMessage[]) => void,
  onError?: (msg: string) => void
): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid || !isValidFirestoreId(fbUser.uid)) return () => {};
  const path = `supportThreads/${fbUser.uid}/messages`;
  const q = query(collection(db, 'supportThreads', fbUser.uid, 'messages'), orderBy('createdAt', 'asc'), limit(150));
  const unsub: Unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as SupportChatMessage);
      if (list.length > 0) {
        onMessages(list);
      }
    },
    (err) => {
      reportSupportError('subscribeMyFirestoreSupportMessages', err, OperationType.LIST, path, onError);
    }
  );
  return () => unsub();
}

/**
 * Watches the user's supportThreads document in Firestore for instant unread badge / status updates.
 */
export function subscribeMyFirestoreSupportThread(
  onThread: (thread: SupportChatThread) => void,
  onError?: (msg: string) => void
): () => void {
  const fbUser = auth.currentUser;
  if (!fbUser?.uid || !isValidFirestoreId(fbUser.uid)) return () => {};
  const path = `supportThreads/${fbUser.uid}`;
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
      reportSupportError('subscribeMyFirestoreSupportThread', err, OperationType.GET, path, onError);
    }
  );
  return () => unsub();
}

/**
 * Watches all supportThreads in Firestore for Admin Dashboard real-time inbox sync on serverless hosts.
 */
export function subscribeAdminFirestoreSupportThreads(
  onThreads: (threads: SupportChatThread[]) => void,
  onError?: (msg: string) => void
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
            } catch (subErr) {
              reportSupportError(
                'subscribeAdminFirestoreSupportThreads:messages',
                subErr,
                OperationType.LIST,
                `supportThreads/${d.id}/messages`,
                onError
              );
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
      } catch (err) {
        reportSupportError('subscribeAdminFirestoreSupportThreads:snap', err, OperationType.LIST, 'supportThreads', onError);
      }
    },
    (err) => {
      reportSupportError('subscribeAdminFirestoreSupportThreads', err, OperationType.LIST, 'supportThreads', onError);
    }
  );
  return () => unsub();
}

/**
 * Watches messages of the currently selected support thread in real time for Admin Dashboard.
 */
export function subscribeAdminFirestoreThreadMessages(
  threadId: string,
  onMessages: (messages: SupportChatMessage[]) => void,
  onError?: (msg: string) => void
): () => void {
  if (!auth.currentUser || !isValidFirestoreId(threadId)) return () => {};
  const path = `supportThreads/${threadId}/messages`;
  const q = query(collection(db, 'supportThreads', threadId, 'messages'), orderBy('createdAt', 'asc'), limit(150));
  const unsub: Unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as SupportChatMessage);
      if (list.length > 0) {
        onMessages(list);
      }
    },
    (err) => {
      reportSupportError('subscribeAdminFirestoreThreadMessages', err, OperationType.LIST, path, onError);
    }
  );
  return () => unsub();
}
