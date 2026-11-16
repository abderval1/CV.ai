import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  auth,
  db,
  onAuthStateChanged,
  sanitizeForFirestore,
  buildFirestoreErrorInfo,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import {
  AuditLogAction,
  AuditLogCategory,
  AuditLogSeverity,
  AuditLogStatus,
  SecurityAuditLog
} from '../types/adminModules';

const LOCAL_AUDIT_LOGS_KEY = 'curriculopro_security_audit_logs';
const AUTH_TOKEN_KEY = 'curriculopro_auth_token';

const VALID_ACTIONS = new Set<AuditLogAction>([
  'subscription_upgraded',
  'subscription_canceled',
  'subscription_plan_sync_blocked',
  'payment_order_created',
  'payment_order_status_changed',
  'cv_exported_pdf',
  'cv_exported_docx',
  'cv_exported_json',
  'cv_export_blocked_unauthorized',
  'profile_updated',
  'password_changed',
  'account_login',
  'account_registered',
  'gdpr_request_submitted',
  'unauthorized_access_attempt',
  'admin_user_modified',
  'impersonation_event'
]);

const VALID_CATEGORIES = new Set<AuditLogCategory>([
  'subscription',
  'cv_export',
  'profile',
  'security',
  'admin'
]);

const ADMIN_ONLY_ACTIONS = new Set<AuditLogAction>([
  'admin_user_modified',
  'impersonation_event',
  'payment_order_status_changed'
]);

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function scrubSensitiveText(raw: unknown, maxLen: number): string {
  return String(raw ?? '')
    .replace(/AIza[0-9A-Za-z\-_]{20,}/g, '[REDACTED_KEY]')
    .replace(/sk_(live|test)_[0-9A-Za-z]{12,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .trim()
    .slice(0, maxLen);
}

function sanitizeAuditId(raw?: string): string {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  if (cleaned.length >= 4) return cleaned;
  const rand = Math.random().toString(36).slice(2, 8);
  return `aud_${Date.now()}_${rand}`;
}

function sanitizeMetadata(
  raw?: Record<string, string | number | boolean | null | undefined>
): Record<string, string | number | boolean> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string | number | boolean> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (count >= 12) break;
    if (v === undefined || v === null) continue;
    const safeKey = String(k).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (!safeKey) continue;
    if (typeof v === 'string') {
      out[safeKey] = scrubSensitiveText(v, 140);
      count += 1;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      out[safeKey] = v;
      count += 1;
    } else if (typeof v === 'boolean') {
      out[safeKey] = v;
      count += 1;
    }
  }
  return count > 0 ? out : undefined;
}

function readLocalAuditLogs(): SecurityAuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAuditLogs(logs: SecurityAuditLog[]): void {
  try {
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 150)));
  } catch {
    // ignore storage quota failures
  }
}

export interface RecordAuditLogInput {
  action: AuditLogAction;
  category: AuditLogCategory;
  severity?: AuditLogSeverity;
  status?: AuditLogStatus;
  targetResource: string;
  details: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: 'user' | 'admin' | 'anonymous' | 'system';
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

function normalizeAuditLogForBlueprint(raw: Partial<SecurityAuditLog>): SecurityAuditLog {
  const fbUser = auth.currentUser;
  const action: AuditLogAction = VALID_ACTIONS.has(raw.action as AuditLogAction)
    ? (raw.action as AuditLogAction)
    : 'unauthorized_access_attempt';
  const category: AuditLogCategory = VALID_CATEGORIES.has(raw.category as AuditLogCategory)
    ? (raw.category as AuditLogCategory)
    : 'security';
  const severity: AuditLogSeverity =
    raw.severity && ['info', 'warning', 'critical'].includes(raw.severity)
      ? raw.severity
      : raw.status === 'blocked'
      ? 'warning'
      : 'info';
  const status: AuditLogStatus =
    raw.status && ['success', 'blocked', 'failure'].includes(raw.status) ? raw.status : 'success';

  const actorUserId = scrubSensitiveText(raw.actorUserId || fbUser?.uid || 'anonymous', 128) || 'anonymous';
  const actorEmail = scrubSensitiveText(raw.actorEmail || fbUser?.email || 'anonymous', 180) || 'anonymous';
  const actorRole: SecurityAuditLog['actorRole'] =
    raw.actorRole && ['user', 'admin', 'anonymous', 'system'].includes(raw.actorRole)
      ? raw.actorRole
      : fbUser
      ? 'user'
      : 'anonymous';

  const metadata = sanitizeMetadata(raw.metadata);
  const ua =
    raw.userAgent ||
    (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : undefined);

  const normalized: SecurityAuditLog = {
    id: sanitizeAuditId(raw.id),
    timestamp: scrubSensitiveText(raw.timestamp || new Date().toISOString(), 50),
    actorUserId,
    actorEmail,
    actorRole,
    action,
    category,
    severity,
    status,
    targetResource: scrubSensitiveText(raw.targetResource || 'app/unknown', 180) || 'app/unknown',
    details: scrubSensitiveText(raw.details || 'Ação auditada', 600) || 'Ação auditada',
    ...(metadata ? { metadata } : {}),
    ...(ua ? { userAgent: scrubSensitiveText(ua, 250) } : {}),
    ...(raw.ipAddress ? { ipAddress: scrubSensitiveText(raw.ipAddress, 80) } : {})
  };

  return normalized;
}

/**
 * Records a sensitive user action or security violation in Firestore (/auditLogs),
 * Express backend (/api/audit-logs), and local audit cache.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<SecurityAuditLog> {
  const fbUser = auth.currentUser;
  const baseEntry = normalizeAuditLogForBlueprint({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    actorUserId: fbUser?.uid || input.actorUserId || 'anonymous',
    actorEmail: fbUser?.email || input.actorEmail || 'anonymous',
    actorRole: input.actorRole || (fbUser ? 'user' : 'anonymous'),
    action: input.action,
    category: input.category,
    severity: input.severity,
    status: input.status,
    targetResource: input.targetResource,
    details: input.details,
    metadata: sanitizeMetadata(input.metadata)
  });

  // Update local cache immediately
  const existingLocal = readLocalAuditLogs();
  writeLocalAuditLogs([baseEntry, ...existingLocal.filter((l) => l.id !== baseEntry.id)]);

  // 1. Write directly to Firestore when signed in via Firebase Auth
  if (fbUser) {
    try {
      const firestorePayload: SecurityAuditLog = {
        ...baseEntry,
        actorUserId: fbUser.uid,
        actorEmail: scrubSensitiveText(fbUser.email || baseEntry.actorEmail, 180) || 'anonymous',
        // Non-admins must write actorRole='user' and non-admin actions per Firestore rules
        actorRole: baseEntry.actorRole === 'admin' ? 'admin' : 'user'
      };
      if (ADMIN_ONLY_ACTIONS.has(firestorePayload.action) && firestorePayload.actorRole !== 'admin') {
        firestorePayload.action = 'unauthorized_access_attempt';
      }
      await setDoc(doc(db, 'auditLogs', firestorePayload.id), sanitizeForFirestore(firestorePayload));
    } catch (err: any) {
      const info = buildFirestoreErrorInfo(err, OperationType.CREATE, `auditLogs/${baseEntry.id}`);
      console.warn('Aviso ao gravar log de auditoria no Firestore:', JSON.stringify(info));
    }
  }

  // 2. Also send to Express backend for IP enrichment & centralized store
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch('/api/audit-logs', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(baseEntry)
    });
  } catch {
    // non-fatal network failure
  }

  return baseEntry;
}

/**
 * Fetches all audit logs for Administrators (merges Express backend + Firestore /auditLogs)
 * and mirrors any server-captured logs (like anonymous 401/403/SSRF probes) into Firestore.
 */
export async function fetchAuditLogs(): Promise<SecurityAuditLog[]> {
  const byId = new Map<string, SecurityAuditLog>();
  const firestoreIds = new Set<string>();
  const backendOnlyLogs: SecurityAuditLog[] = [];

  readLocalAuditLogs().forEach((item) => {
    if (item?.id) byId.set(item.id, item);
  });

  // 1. Fetch from Express Admin API
  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.auditLogs)) {
          for (const raw of json.auditLogs as SecurityAuditLog[]) {
            if (!raw?.id) continue;
            const normalized = normalizeAuditLogForBlueprint(raw);
            byId.set(normalized.id, normalized);
            backendOnlyLogs.push(normalized);
          }
        }
      }
    } catch {
      // fall through to Firestore
    }
  }

  // 2. Fetch from Firestore /auditLogs
  if (auth.currentUser) {
    try {
      const colRef = collection(db, 'auditLogs');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(200));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const normalized = normalizeAuditLogForBlueprint({ ...(d.data() as SecurityAuditLog), id: d.id });
        firestoreIds.add(d.id);
        byId.set(d.id, normalized);
      });

      // Mirror server-captured logs (e.g. unauthenticated 401/403/SSRF attempts) into Firestore
      const missingInFirestore = backendOnlyLogs
        .filter((item) => !firestoreIds.has(item.id))
        .slice(0, 25);

      for (const item of missingInFirestore) {
        try {
          await setDoc(doc(db, 'auditLogs', item.id), sanitizeForFirestore(item));
        } catch {
          // ignore individual mirror error (e.g., if caller is not verified admin in Firestore)
          break;
        }
      }
    } catch (err: any) {
      if (String(err?.code || '').includes('permission-denied')) {
        handleFirestoreError(err, OperationType.LIST, 'auditLogs');
      } else {
        console.warn('Aviso ao consultar auditLogs no Firestore:', err);
      }
    }
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  writeLocalAuditLogs(merged);
  return merged;
}

/**
 * Fetches personal security & activity audit logs for the signed-in user.
 */
export async function fetchMyAuditLogs(userId: string): Promise<SecurityAuditLog[]> {
  const byId = new Map<string, SecurityAuditLog>();

  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch('/api/audit-logs/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.auditLogs)) {
          for (const raw of json.auditLogs as SecurityAuditLog[]) {
            if (raw?.id) {
              const norm = normalizeAuditLogForBlueprint(raw);
              byId.set(norm.id, norm);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (auth.currentUser && userId) {
    try {
      const colRef = collection(db, 'auditLogs');
      const q = query(colRef, where('actorUserId', '==', auth.currentUser.uid), limit(50));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const norm = normalizeAuditLogForBlueprint({ ...(d.data() as SecurityAuditLog), id: d.id });
        byId.set(d.id, norm);
      });
    } catch (err: any) {
      if (String(err?.code || '').includes('permission-denied')) {
        handleFirestoreError(err, OperationType.LIST, 'auditLogs');
      } else {
        console.warn('Aviso ao carregar atividade pessoal:', err);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

const CRITICAL_ACTION_SET = new Set<AuditLogAction>([
  'unauthorized_access_attempt',
  'cv_export_blocked_unauthorized',
  'subscription_plan_sync_blocked',
  'subscription_upgraded',
  'subscription_canceled',
  'payment_order_status_changed',
  'password_changed',
  'admin_user_modified',
  'impersonation_event',
  'gdpr_request_submitted'
]);

/**
 * Identifies critical or high-sensitivity security/subscription/admin audit logs.
 */
export function isCriticalAuditLog(log: SecurityAuditLog): boolean {
  return (
    log.severity === 'critical' ||
    log.severity === 'warning' ||
    log.status === 'blocked' ||
    log.status === 'failure' ||
    CRITICAL_ACTION_SET.has(log.action)
  );
}

/**
 * Merges multiple audit log arrays cleanly by ID, sorted newest-first.
 */
export function mergeAuditLogLists(
  primary: SecurityAuditLog[],
  secondary: SecurityAuditLog[] = []
): SecurityAuditLog[] {
  const byId = new Map<string, SecurityAuditLog>();
  for (const item of secondary) {
    if (item?.id) byId.set(item.id, normalizeAuditLogForBlueprint(item));
  }
  for (const item of primary) {
    if (item?.id) byId.set(item.id, normalizeAuditLogForBlueprint(item));
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export type AuditStreamStatus = 'connecting' | 'live' | 'unavailable' | 'error';

export interface SubscribeAuditLogsOptions {
  limitCount?: number;
  onLogs: (
    logs: SecurityAuditLog[],
    meta: { fromCache: boolean; lastUpdatedAt: string }
  ) => void;
  onStatusChange?: (status: AuditStreamStatus, message?: string) => void;
}

/**
 * Attaches a real-time Firestore onSnapshot listener on /auditLogs
 * once Firebase Authentication is ready and signed in.
 */
export function subscribeToAuditLogs(options: SubscribeAuditLogsOptions): () => void {
  let isDisposed = false;
  let unsubscribeSnapshot: Unsubscribe | null = null;

  const detachSnapshot = () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };

  options.onStatusChange?.('connecting');

  const attachForCurrentUser = () => {
    detachSnapshot();
    if (isDisposed) return;

    if (!auth.currentUser) {
      options.onStatusChange?.(
        'unavailable',
        'Autenticação Firebase inativa para escuta em tempo real.'
      );
      return;
    }

    options.onStatusChange?.('connecting');
    const colRef = collection(db, 'auditLogs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(options.limitCount ?? 250));

    unsubscribeSnapshot = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (isDisposed) return;
        const firestoreLogs: SecurityAuditLog[] = snapshot.docs.map((d) =>
          normalizeAuditLogForBlueprint({ ...(d.data() as SecurityAuditLog), id: d.id })
        );
        const existingLocal = readLocalAuditLogs();
        const merged = mergeAuditLogLists(firestoreLogs, existingLocal);
        writeLocalAuditLogs(merged);
        options.onStatusChange?.('live');
        options.onLogs(merged, {
          fromCache: snapshot.metadata.fromCache,
          lastUpdatedAt: new Date().toISOString()
        });
      },
      (error) => {
        if (isDisposed) return;
        const message =
          error instanceof Error ? error.message : 'Falha no listener em tempo real do Firestore.';
        options.onStatusChange?.('error', message);
        handleFirestoreError(error, OperationType.LIST, 'auditLogs');
      }
    );
  };

  const unsubscribeAuth = onAuthStateChanged(auth, () => {
    if (isDisposed) return;
    attachForCurrentUser();
  });

  if (auth.currentUser) {
    attachForCurrentUser();
  }

  return () => {
    isDisposed = true;
    detachSnapshot();
    unsubscribeAuth();
  };
}

