import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, SubscriptionPlan, SavedResume, CVData, BillingCycle } from '../types/cv';
import { GENERIC_DEFAULT_CV } from '../data/initialCV';
import { getCycleDurationDays, normalizeBillingCycle } from '../utils/billingCycles';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  buildFirestoreErrorInfo,
  handleFirestoreError,
  sanitizeForFirestore,
  OperationType,
  FirebaseUser
} from '../lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { isUserAdmin } from '../services/saasDbService';
import { recordAuditLog } from '../services/auditLogService';
import {
  dispatchUserNotification,
  loadNotificationPreferences
} from '../services/notificationService';

const LOCAL_STORAGE_USER_KEY = 'curriculopro_user_session';
const LOCAL_STORAGE_RESUMES_KEY = 'curriculopro_saved_resumes';
const AUTH_TOKEN_KEY = 'curriculopro_auth_token';
const REDIRECT_PENDING_KEY = 'ce_google_redirect_pending';
const REDIRECT_PENDING_TTL_MS = 5 * 60 * 1000;

let inMemoryAuthToken: string | null = null;

function setRedirectPendingMarker() {
  const stamp = String(Date.now());
  try {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, stamp);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(REDIRECT_PENDING_KEY, stamp);
  } catch {
    // ignore
  }
}

function peekRedirectPendingMarker(): boolean {
  try {
    const raw =
      sessionStorage.getItem(REDIRECT_PENDING_KEY) || localStorage.getItem(REDIRECT_PENDING_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < REDIRECT_PENDING_TTL_MS;
  } catch {
    return false;
  }
}

function consumeRedirectPendingMarker(): boolean {
  const active = peekRedirectPendingMarker();
  try {
    sessionStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // ignore
  }
  return active;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || inMemoryAuthToken;
  } catch {
    return inMemoryAuthToken;
  }
}

function setStoredAuthToken(token: string | null, rememberMe = true) {
  inMemoryAuthToken = token;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    if (token) {
      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    }
  } catch {
    // Fallback safely to inMemoryAuthToken in restricted mobile private mode/WebViews
  }
}

async function apiAuthFetch(url: string, options: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      ...options,
      cache: options.cache || 'no-store',
      credentials: 'include',
      headers,
      signal: options.signal || controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};
    return { response, data, isJson: contentType.includes('application/json') };
  } catch (err: any) {
    const netErr: any = new Error(
      err?.name === 'AbortError'
        ? 'O servidor demorou a responder. Verifique a sua ligação e tente novamente.'
        : 'Falha de ligação ao servidor. Verifique a sua internet e tente novamente.'
    );
    netErr.code = 'auth/network-request-failed';
    throw netErr;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getAuthErrorMessage(err: any): string {
  if (!err) return 'Ocorreu um erro inesperado.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
      return 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.';
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este endereço de e-mail.';
    case 'auth/email-already-in-use':
      return 'Este endereço de e-mail já está associado a uma conta existente. Tente iniciar sessão.';
    case 'auth/weak-password':
      return 'A palavra-passe deve conter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'O formato do endereço de e-mail não é válido.';
    case 'auth/user-disabled':
      return 'Esta conta de utilizador foi desativada ou suspensa. Contacte o suporte técnico.';
    case 'auth/too-many-requests':
      return 'Demasiadas tentativas consecutivas. Por favor, aguarde alguns minutos antes de tentar novamente.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'A janela de autenticação Google foi fechada antes de concluir o processo. Tente novamente ou entre com E-mail e Palavra-passe abaixo.';
    case 'auth/popup-blocked':
      return 'A janela de autenticação foi bloqueada pelo navegador do telemóvel. Permita pop-ups ou utilize o acesso por e-mail e palavra-passe abaixo.';
    case 'auth/web-storage-unsupported':
    case 'auth/cookie-blocked':
      return 'O navegador está com cookies ou armazenamento bloqueados (ex.: navegação privada restrita). Ative os cookies ou entre com E-mail e Palavra-passe abaixo.';
    case 'auth/redirect-cancelled-by-user':
    case 'auth/redirect-operation-pending':
    case 'auth/missing-or-invalid-nonce':
      return 'O processo de redirecionamento Google foi interrompido pelo navegador do telemóvel. Tente novamente ou entre com E-mail e Palavra-passe abaixo.';
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado para autenticação Google. Utilize e-mail e palavra-passe abaixo.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta registada com este e-mail através de outro método de entrada.';
    case 'auth/requires-recent-login':
      return 'Por segurança, termine a sessão e volte a entrar antes de alterar a palavra-passe.';
    case 'auth/network-request-failed':
      return 'Falha de comunicação de rede. Verifique a sua ligação à internet e tente novamente.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Método de autenticação não configurado no provedor externo.';
    case 'auth/bot-detected':
      return 'Submissão bloqueada pela proteção anti-robôs. Recarregue a verificação e preencha manualmente.';
    case 'auth/captcha-invalid':
      return 'Resposta da verificação humana incorreta. Confira o cálculo e tente novamente.';
    case 'auth/captcha-expired':
      return 'A verificação humana expirou ou precisa de ser atualizada. Resolva o novo desafio abaixo.';
    case 'auth/disposable-email':
      return 'E-mails temporários/descartáveis não são aceites. Utilize um e-mail pessoal ou corporativo permanente.';
    case 'auth/invalid-name':
      return 'Insira um nome válido sem links ou caracteres especiais.';
    case 'auth/registrations-paused':
      return 'Novos registos estão temporariamente pausados pelo administrador.';
    default: {
      const msg = String(err.message || '');
      const lower = msg.toLowerCase();
      if (
        lower.includes('load failed') ||
        lower.includes('failed to fetch') ||
        lower.includes('networkerror') ||
        lower.includes('aborted')
      ) {
        return 'Falha de ligação ao servidor. Verifique a sua ligação à internet e tente novamente.';
      }
      if (msg.startsWith('{') && msg.includes('"operationType"')) {
        return 'Não foi possível sincronizar o perfil com a nuvem neste momento. Tente novamente em instantes.';
      }
      return msg || 'Falha na autenticação. Verifique os dados inseridos e tente novamente.';
    }
  }
}

export interface ResetPasswordResult {
  mode: 'firebase_email' | 'backend_code' | 'email_recovery';
  message: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isPro: boolean;
  isExecutive: boolean;
  hasActivePlan: boolean;
  isFirebaseConnected: boolean;
  authRedirectError: string | null;
  clearAuthRedirectError: () => void;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password?: string,
    targetRole?: string,
    rememberMe?: boolean,
    antiBot?: {
      challengeId?: string;
      challengeToken?: string;
      challengeAnswer?: string;
      website?: string;
      companyPhone?: string;
    }
  ) => Promise<boolean>;
  resetPassword: (email: string) => Promise<ResetPasswordResult>;
  completePasswordReset: (email: string, code: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'linkedin') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (partial: Partial<User>) => Promise<void>;
  upgradePlan: (
    plan: SubscriptionPlan,
    meta?: {
      billingCycle?: BillingCycle;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
    }
  ) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  savedResumes: SavedResume[];
  saveCurrentResume: (cv: CVData, title: string, targetJob?: string) => Promise<string>;
  incrementCvGenerated: (
    count?: number,
    meta?: { eventType?: 'resume_started' | 'word_exported'; templateStyle?: string; skipServerIncrement?: boolean }
  ) => Promise<number>;
  loadResume: (id: string) => CVData | null;
  deleteResume: (id: string) => Promise<void>;
  isImpersonating: boolean;
  originalAdminUser: User | null;
  impersonateUser: (targetUser: User, reason: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIREBASE_EMAIL_UNAVAILABLE_CODES = new Set([
  'auth/operation-not-allowed',
  'auth/configuration-not-found',
  'auth/admin-restricted-operation',
  'auth/network-request-failed',
  'auth/internal-error'
]);

function isAdminAuthorized(email?: string | null, emailVerified?: boolean, role?: string | null): boolean {
  if (role === 'admin') return true;
  return Boolean(emailVerified) && isUserAdmin(email);
}

const getScopedResumesStorageKey = (uid?: string | null) =>
  uid ? `${LOCAL_STORAGE_RESUMES_KEY}_${uid}` : `${LOCAL_STORAGE_RESUMES_KEY}_visitor`;

const sanitizeResumeList = (items: unknown): SavedResume[] => {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item): item is SavedResume =>
      Boolean(item && typeof item === 'object' && (item as SavedResume).id && (item as SavedResume).id !== 'resume-default')
  );
};

const readScopedResumesFromStorage = (uid?: string | null): SavedResume[] => {
  if (!uid) return [];
  try {
    const saved = localStorage.getItem(getScopedResumesStorageKey(uid));
    return saved ? sanitizeResumeList(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
};

const clearLegacyUnscopedResumeCaches = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_RESUMES_KEY);
    localStorage.removeItem(`${LOCAL_STORAGE_RESUMES_KEY}_visitor`);
  } catch {
    // ignore
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);
  const clearAuthRedirectError = () => setAuthRedirectError(null);
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('curriculopro_impersonating_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const activeResumesOwnerRef = useRef<string | null>(user?.id || null);

  const [savedResumes, setSavedResumes] = useState<SavedResume[]>(() => {
    clearLegacyUnscopedResumeCaches();
    return user?.id ? readScopedResumesFromStorage(user.id) : [];
  });

  const resumesUnsubRef = useRef<Unsubscribe | null>(null);
  const userDocUnsubRef = useRef<Unsubscribe | null>(null);
  const authSyncLockRef = useRef<boolean>(false);
  const sessionEpochRef = useRef<number>(0);
  const lastSyncedClaimsRef = useRef<string>('');
  const localPlanSyncRef = useRef<{
    userId: string;
    plan: SubscriptionPlan;
    at: number;
    creditsRemaining: number;
    billingCycle?: BillingCycle;
    subscriptionExpiresAt?: string;
    stripeStatus?: User['stripeStatus'];
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  } | null>(null);

  const reconcileFirestoreWithBackend = (
    fsUser: User,
    fsUpdatedMs: number,
    backendUser?: User | null
  ): User => {
    const localSync =
      localPlanSyncRef.current && localPlanSyncRef.current.userId === fsUser.id
        ? localPlanSyncRef.current
        : null;
    const backendAt = backendUser?.planUpdatedAt || 0;
    const localAt = localSync?.at || 0;

    const candidate =
      localAt >= backendAt && localSync
        ? {
            plan: localSync.plan,
            at: localSync.at,
            creditsRemaining: localSync.creditsRemaining,
            billingCycle: localSync.billingCycle,
            subscriptionExpiresAt: localSync.subscriptionExpiresAt,
            stripeStatus: localSync.stripeStatus,
            stripeSubscriptionId: localSync.stripeSubscriptionId,
            stripeCustomerId: localSync.stripeCustomerId
          }
        : backendUser
        ? {
            plan: backendUser.plan,
            at: backendAt,
            creditsRemaining: backendUser.creditsRemaining,
            billingCycle: backendUser.billingCycle,
            subscriptionExpiresAt: backendUser.subscriptionExpiresAt,
            stripeStatus: backendUser.stripeStatus,
            stripeSubscriptionId: backendUser.stripeSubscriptionId,
            stripeCustomerId: backendUser.stripeCustomerId
          }
        : null;

    const candidateIsVerifiedPlanMutation = Boolean(
      candidate &&
        candidate.at > fsUpdatedMs &&
        ((candidate.plan !== 'free' && candidate.stripeStatus === 'active') ||
          (candidate.plan === 'free' && candidate.stripeStatus === 'canceled'))
    );

    if (!candidateIsVerifiedPlanMutation || !candidate) {
      return fsUser;
    }

    return {
      ...fsUser,
      plan: candidate.plan,
      creditsRemaining: candidate.creditsRemaining,
      billingCycle: candidate.billingCycle || fsUser.billingCycle,
      subscriptionExpiresAt: candidate.subscriptionExpiresAt,
      stripeStatus: candidate.stripeStatus,
      stripeSubscriptionId: candidate.stripeSubscriptionId || fsUser.stripeSubscriptionId,
      stripeCustomerId: candidate.stripeCustomerId || fsUser.stripeCustomerId,
      planUpdatedAt: candidate.at
    };
  };

  const resetResumesForUserSwitch = (nextUid: string | null) => {
    if (resumesUnsubRef.current) {
      resumesUnsubRef.current();
      resumesUnsubRef.current = null;
    }
    if (userDocUnsubRef.current) {
      userDocUnsubRef.current();
      userDocUnsubRef.current = null;
    }
    clearLegacyUnscopedResumeCaches();
    activeResumesOwnerRef.current = nextUid;
    setSavedResumes(nextUid ? readScopedResumesFromStorage(nextUid) : []);
  };

  const hydrateResumesFromBackend = async (expectedEpoch?: number, expectedUid?: string) => {
    const epochCheck = expectedEpoch ?? sessionEpochRef.current;
    const targetUid = expectedUid ?? activeResumesOwnerRef.current;
    if (!targetUid) {
      setSavedResumes([]);
      return;
    }
    try {
      const { response, data } = await apiAuthFetch('/api/resumes', { method: 'GET' });
      if (epochCheck !== sessionEpochRef.current || activeResumesOwnerRef.current !== targetUid) {
        return;
      }
      if (response.ok && Array.isArray(data?.resumes)) {
        const cleanServerResumes = sanitizeResumeList(data.resumes);
        setSavedResumes(cleanServerResumes);
        if (cleanServerResumes.length > 0) {
          setUser((prev) =>
            prev && (prev.totalCvGenerated || 0) < cleanServerResumes.length
              ? { ...prev, totalCvGenerated: cleanServerResumes.length }
              : prev
          );
        }
      } else if (response.status === 401) {
        setSavedResumes([]);
      }
    } catch (err) {
      console.warn('Aviso ao carregar currículos do servidor:', err);
    }
  };

  const attachFirestoreResumesListener = (firestoreUid: string, ownerUid: string, epoch: number) => {
    if (resumesUnsubRef.current) {
      resumesUnsubRef.current();
      resumesUnsubRef.current = null;
    }
    try {
      const resumesColRef = collection(db, 'users', firestoreUid, 'resumes');
      resumesUnsubRef.current = onSnapshot(
        resumesColRef,
        (snapshot) => {
          if (epoch !== sessionEpochRef.current || activeResumesOwnerRef.current !== ownerUid) {
            return;
          }
          if (!snapshot.empty) {
            const cloudResumes: SavedResume[] = snapshot.docs
              .map((docItem) => {
                const d = docItem.data();
                return {
                  id: docItem.id,
                  title: d.title || 'Currículo',
                  targetJob: d.targetJob || 'Vaga Executiva',
                  updatedAt: d.updatedAt || new Date().toLocaleDateString('pt-PT'),
                  data: (d.data as CVData) || GENERIC_DEFAULT_CV,
                  _createdAt: String(d.createdAt || '')
                };
              })
              .sort((a, b) => (b._createdAt || b.id).localeCompare(a._createdAt || a.id))
              .map(({ _createdAt: _, ...rest }) => rest);
            const cleanCloud = sanitizeResumeList(cloudResumes);
            setSavedResumes(cleanCloud);
            if (cleanCloud.length > 0) {
              setUser((prev) => {
                if (!prev || (prev.totalCvGenerated || 0) >= cleanCloud.length) return prev;
                const nextCount = cleanCloud.length;
                if (auth.currentUser && auth.currentUser.uid === firestoreUid && !originalAdminUser) {
                  void updateDoc(
                    doc(db, 'users', firestoreUid),
                    sanitizeForFirestore({
                      totalCvGenerated: nextCount,
                      updatedAt: new Date().toISOString()
                    })
                  ).catch(() => {});
                }
                return { ...prev, totalCvGenerated: nextCount };
              });
            }
          } else {
            void hydrateResumesFromBackend(epoch, ownerUid);
          }
        },
        (error) => {
          if (epoch !== sessionEpochRef.current || activeResumesOwnerRef.current !== ownerUid) {
            return;
          }
          const info = buildFirestoreErrorInfo(error, OperationType.GET, `users/${firestoreUid}/resumes`);
          console.error('Firestore Resumes Listener Error: ', JSON.stringify(info));
          void hydrateResumesFromBackend(epoch, ownerUid);
        }
      );
    } catch (err) {
      console.error('Erro ao subscrever currículos do Firestore:', err);
      void hydrateResumesFromBackend(epoch, ownerUid);
    }
  };

  // Sync user state with localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    } catch (e) {
      console.warn('Erro ao guardar sessão local:', e);
    }
  }, [user]);

  // Sync resumes state strictly under the active authenticated user's key
  useEffect(() => {
    try {
      clearLegacyUnscopedResumeCaches();
      if (user?.id && activeResumesOwnerRef.current === user.id) {
        localStorage.setItem(getScopedResumesStorageKey(user.id), JSON.stringify(sanitizeResumeList(savedResumes)));
      }
    } catch (e) {
      console.warn('Erro ao guardar currículos locais:', e);
    }
  }, [savedResumes, user?.id]);

  // Handle redirect auth result if Google popup fell back to redirect on mobile
  useEffect(() => {
    let cancelled = false;
    const hadPendingRedirect = peekRedirectPendingMarker();

    getRedirectResult(auth)
      .then(async (result) => {
        if (cancelled) return;
        if (result?.user) {
          consumeRedirectPendingMarker();
          sessionEpochRef.current += 1;
          const epoch = sessionEpochRef.current;
          const cleanEmail = (result.user.email || '').trim().toLowerCase();
          const isVerifiedAdmin = isAdminAuthorized(cleanEmail, result.user.emailVerified);
          let profile: User = {
            id: result.user.uid,
            name: result.user.displayName || cleanEmail.split('@')[0] || 'Utilizador',
            email: cleanEmail,
            role: isVerifiedAdmin ? 'admin' : 'user',
            status: 'active',
            avatarUrl: result.user.photoURL || undefined,
            plan: isVerifiedAdmin ? 'executive' : 'free',
            creditsRemaining: isVerifiedAdmin ? 9999 : 5,
            createdAt: new Date().toISOString()
          };
          let hasFirestoreDoc = false;
          try {
            const snap = await withTimeout(getDoc(doc(db, 'users', result.user.uid)), 4500, `users/${result.user.uid}`);
            if (snap.exists()) {
              hasFirestoreDoc = true;
              const d = snap.data();
              const fsAdmin = isAdminAuthorized(d.email || cleanEmail, result.user.emailVerified, d.role);
              profile = {
                ...profile,
                name: d.name || profile.name,
                role: fsAdmin ? 'admin' : 'user',
                status: d.status || 'active',
                plan: (d.plan as SubscriptionPlan) || profile.plan,
                creditsRemaining: d.creditsRemaining ?? profile.creditsRemaining,
                creditsUsed: d.creditsUsed ?? 0,
                totalCvGenerated: d.totalCvGenerated ?? 0,
                billingCycle: d.billingCycle || 'monthly',
                subscriptionExpiresAt: d.subscriptionExpiresAt,
                stripeStatus: d.stripeStatus,
                notes: d.notes || undefined
              };
            }
          } catch {
            // fallback to backend sync
          }
          const synced = await syncFirebaseUserToBackend(result.user, profile, 'google', true, hasFirestoreDoc);
          if (!cancelled) {
            if (activeResumesOwnerRef.current !== synced.id) {
              resetResumesForUserSwitch(synced.id);
            }
            lastSyncedClaimsRef.current = hasFirestoreDoc
              ? `${synced.id}|${synced.plan}|${synced.role}|${synced.status}|${synced.creditsRemaining}|${synced.subscriptionExpiresAt || ''}`
              : '';
            setUser(synced);
            attachFirestoreResumesListener(result.user.uid, synced.id, epoch);
            setAuthRedirectError(null);
            setAuthLoading(false);
          }
          return;
        }

        if (hadPendingRedirect) {
          consumeRedirectPendingMarker();
          // Allow brief grace in case onAuthStateChanged hydrates auth.currentUser cleanly
          setTimeout(() => {
            if (cancelled) return;
            if (!auth.currentUser) {
              setAuthRedirectError(
                'O navegador do telemóvel bloqueou os cookies de retorno do Google após selecionar a conta (prevenção de rastreio do Safari/Chrome). Permita pop-ups para este site, abra fora de aplicações (WhatsApp/Instagram) diretamente no Chrome/Safari, ou entre abaixo com E-mail e Palavra-passe.'
              );
            }
          }, 900);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        consumeRedirectPendingMarker();
        if (err?.code) {
          console.warn('Aviso getRedirectResult:', err.code);
          setAuthRedirectError(getAuthErrorMessage(err));
        } else if (hadPendingRedirect) {
          setAuthRedirectError(
            'Não foi possível concluir o login Google após o redirecionamento no telemóvel. Permita pop-ups ou utilize E-mail e Palavra-passe abaixo.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen to Firebase Auth state & sync seamlessly with Firestore + Backend session
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      // Clean up previous Firestore resume & profile listeners
      if (resumesUnsubRef.current) {
        resumesUnsubRef.current();
        resumesUnsubRef.current = null;
      }
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      try {
        if (currentFbUser) {
          // Wait briefly if register() is actively creating the initial Firestore profile
          if (authSyncLockRef.current) {
            return;
          }
          sessionEpochRef.current += 1;

          const uid = currentFbUser.uid;
          const userDocRef = doc(db, 'users', uid);
          const cleanEmail = (currentFbUser.email || '').trim().toLowerCase();
          const defaultAdmin = isUserAdmin(cleanEmail) && Boolean(currentFbUser.emailVerified);

          let hydratedUser: User = {
            id: uid,
            name: currentFbUser.displayName || cleanEmail.split('@')[0] || 'Utilizador',
            email: cleanEmail,
            role: defaultAdmin ? 'admin' : 'user',
            status: 'active',
            avatarUrl: currentFbUser.photoURL || undefined,
            plan: defaultAdmin ? 'executive' : 'free',
            creditsRemaining: defaultAdmin ? 9999 : 5,
            createdAt: new Date().toISOString()
          };

          let hasAuthoritativeFirestoreProfile = false;
          try {
            const docSnap = await withTimeout(
              getDoc(userDocRef),
              6000,
              `users/${uid}`
            );
            if (docSnap.exists()) {
              hasAuthoritativeFirestoreProfile = true;
              const data = docSnap.data();
              if (data.status === 'suspended') {
                await signOut(auth).catch(() => {});
                setStoredAuthToken(null);
                setUser(null);
                return;
              }
              const isAdmin = isAdminAuthorized(data.email || cleanEmail, currentFbUser.emailVerified, data.role);
              hydratedUser = {
                id: uid,
                name: data.name || currentFbUser.displayName || 'Utilizador',
                email: data.email || cleanEmail,
                role: isAdmin ? 'admin' : 'user',
                status: data.status || 'active',
                targetRole: data.targetRole || undefined,
                phone: data.phone || undefined,
                company: data.company || undefined,
                avatarUrl: currentFbUser.photoURL || data.avatarUrl || undefined,
                plan: (data.plan as SubscriptionPlan) || (isAdmin ? 'executive' : 'free'),
                creditsRemaining: data.creditsRemaining ?? (isAdmin ? 9999 : 5),
                creditsUsed: data.creditsUsed ?? 0,
                totalCvGenerated: data.totalCvGenerated ?? 0,
                billingCycle: data.billingCycle || 'monthly',
                subscriptionExpiresAt: data.subscriptionExpiresAt || undefined,
                stripeCustomerId: data.stripeCustomerId,
                stripeSubscriptionId: data.stripeSubscriptionId,
                stripeStatus: data.stripeStatus || undefined,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || data.createdAt || undefined,
                notes: data.notes || undefined
              };
            } else {
              await withTimeout(
                setDoc(
                  userDocRef,
                  sanitizeForFirestore({
                    id: hydratedUser.id,
                    name: hydratedUser.name,
                    email: hydratedUser.email,
                    role: hydratedUser.role,
                    status: 'active',
                    plan: hydratedUser.plan,
                    creditsRemaining: hydratedUser.creditsRemaining,
                    createdAt: hydratedUser.createdAt
                  })
                ),
                4500,
                `setDoc users/${uid}`
              );
              hasAuthoritativeFirestoreProfile = true;
            }
            setIsFirebaseConnected(true);
          } catch (err) {
            setIsFirebaseConnected(false);
            const info = buildFirestoreErrorInfo(err, OperationType.GET, `users/${uid}`);
            console.error('Firestore Error (Auth sync fallback active): ', JSON.stringify(info));
          }

          // Sync verified Firebase ID token with backend so API cookies/tokens are always in sync
          try {
            const fbIdToken = await currentFbUser.getIdToken();
            const existingJwt = getStoredAuthToken();
            const { response, data } = await apiAuthFetch('/api/auth/sync-firebase', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${fbIdToken}`,
                ...(existingJwt && existingJwt !== fbIdToken
                  ? { 'x-session-token': existingJwt }
                  : {})
              },
              body: JSON.stringify({
                idToken: fbIdToken,
                name: hydratedUser.name,
                avatarUrl: hydratedUser.avatarUrl,
                provider: currentFbUser.providerData?.[0]?.providerId === 'password' ? 'password' : 'google',
                targetRole: hydratedUser.targetRole
              })
            });

            if (response.status === 403 && data?.code === 'auth/user-disabled') {
              await signOut(auth).catch(() => {});
              setStoredAuthToken(null);
              setUser(null);
              return;
            }
            if (response.ok && data?.token) {
              setStoredAuthToken(data.token, true);
              if (data.user) {
                const backendUser = data.user as User;
                const fsUpdatedMs = Date.parse(hydratedUser.updatedAt || hydratedUser.createdAt || '') || 0;
                hydratedUser = hasAuthoritativeFirestoreProfile
                  ? reconcileFirestoreWithBackend(
                      {
                        ...backendUser,
                        ...hydratedUser,
                        id: hydratedUser.id
                      },
                      fsUpdatedMs,
                      backendUser
                    )
                  : {
                      ...hydratedUser,
                      ...backendUser,
                      id: hydratedUser.id
                    };
              }
            }
          } catch (backendErr) {
            console.warn('Aviso ao sincronizar sessão com backend:', backendErr);
          }

          const activeSessionEpoch = sessionEpochRef.current;

          if (activeResumesOwnerRef.current !== hydratedUser.id) {
            resetResumesForUserSwitch(hydratedUser.id);
          }
          lastSyncedClaimsRef.current = hasAuthoritativeFirestoreProfile
            ? `${hydratedUser.id}|${hydratedUser.plan}|${hydratedUser.role}|${hydratedUser.status}|${hydratedUser.creditsRemaining}|${hydratedUser.subscriptionExpiresAt || ''}`
            : '';
          setUser(hydratedUser);
          setAuthRedirectError(null);
          void loadNotificationPreferences(hydratedUser.id).catch(() => {});

          // Real-time Firestore listener on user profile so Admin plan/role/credits updates apply immediately
          try {
            userDocUnsubRef.current = onSnapshot(
              userDocRef,
              (snap) => {
                if (activeSessionEpoch !== sessionEpochRef.current || !snap.exists()) return;
                const d = snap.data();
                if (d.status === 'suspended') {
                  void signOut(auth).catch(() => {});
                  setStoredAuthToken(null);
                  setUser(null);
                  return;
                }
                const liveIsAdmin = isAdminAuthorized(d.email || cleanEmail, currentFbUser.emailVerified, d.role);
                const nextPlan = (d.plan as SubscriptionPlan) || 'free';
                const nextRole: 'admin' | 'user' = liveIsAdmin ? 'admin' : 'user';
                const nextStatus = d.status || 'active';
                const nextCredits = d.creditsRemaining ?? (liveIsAdmin ? 9999 : 5);
                const nextExpires = d.subscriptionExpiresAt || undefined;
                const fsUpdatedMs = Date.parse(d.updatedAt || d.createdAt || '') || 0;

                let reconciledForSync: User | null = null;
                setUser((prev) => {
                  const base: User =
                    prev && prev.id === uid
                      ? prev
                      : {
                          ...hydratedUser,
                          id: uid
                        };
                  const fsNextUser: User = {
                    ...base,
                    name: d.name || base.name,
                    role: nextRole,
                    status: nextStatus,
                    plan: nextPlan,
                    creditsRemaining: nextCredits,
                    creditsUsed: d.creditsUsed ?? base.creditsUsed,
                    totalCvGenerated: d.totalCvGenerated ?? base.totalCvGenerated,
                    billingCycle: d.billingCycle || base.billingCycle,
                    subscriptionExpiresAt: nextExpires,
                    stripeStatus: d.stripeStatus || undefined,
                    notes: d.notes ?? base.notes,
                    updatedAt: d.updatedAt || d.createdAt || base.updatedAt
                  };
                  const nextUser = reconcileFirestoreWithBackend(fsNextUser, fsUpdatedMs, base);
                  reconciledForSync = nextUser;
                  return nextUser;
                });

                const targetProfile = reconciledForSync || {
                  ...hydratedUser,
                  name: d.name || hydratedUser.name,
                  role: nextRole,
                  status: nextStatus,
                  plan: nextPlan,
                  creditsRemaining: nextCredits,
                  subscriptionExpiresAt: nextExpires,
                  stripeStatus: d.stripeStatus || undefined,
                  updatedAt: d.updatedAt || d.createdAt || hydratedUser.updatedAt
                };
                const claimSig = `${uid}|${targetProfile.plan}|${targetProfile.role}|${targetProfile.status}|${targetProfile.creditsRemaining}|${targetProfile.subscriptionExpiresAt || ''}`;

                if (lastSyncedClaimsRef.current !== claimSig) {
                  lastSyncedClaimsRef.current = claimSig;
                  void syncFirebaseUserToBackend(
                    currentFbUser,
                    targetProfile,
                    currentFbUser.providerData?.[0]?.providerId === 'password' ? 'password' : 'google',
                    true,
                    true
                  ).then((syncedUser) => {
                    if (
                      activeSessionEpoch === sessionEpochRef.current &&
                      syncedUser &&
                      syncedUser.id === uid
                    ) {
                      setUser((curr) =>
                        curr && curr.id === uid ? { ...curr, ...syncedUser } : curr
                      );
                    }
                  });
                }
              },
              () => {
                // ignore transient listener errors
              }
            );
          } catch {
            // ignore listener attachment errors
          }

          // Attach listener strictly for this authenticated user's resumes subcollection
          attachFirestoreResumesListener(uid, hydratedUser.id, activeSessionEpoch);
        } else {
          // No active Firebase user: verify whether a valid Backend Auth session exists before clearing user
          const epochAtStart = sessionEpochRef.current;
          try {
            const { response, data } = await apiAuthFetch('/api/auth/me', { method: 'GET' });
            // If user explicitly logged in or registered while /api/auth/me was in flight, never overwrite new session
            if (epochAtStart !== sessionEpochRef.current) {
              return;
            }
            if (response.ok && data?.authenticated && data.user) {
              if (data.token) {
                setStoredAuthToken(data.token, true);
              }
              if (activeResumesOwnerRef.current !== data.user.id) {
                resetResumesForUserSwitch(data.user.id);
              }
              setUser(data.user);
              void hydrateResumesFromBackend(epochAtStart, data.user.id);
            } else if (!localStorage.getItem('curriculopro_impersonating_admin') && !getStoredAuthToken()) {
              resetResumesForUserSwitch(null);
              setUser(null);
              setStoredAuthToken(null);
            }
          } catch {
            if (
              epochAtStart === sessionEpochRef.current &&
              !getStoredAuthToken() &&
              !localStorage.getItem('curriculopro_impersonating_admin')
            ) {
              resetResumesForUserSwitch(null);
              setUser(null);
            }
          }
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (resumesUnsubRef.current) {
        resumesUnsubRef.current();
      }
    };
  }, []);

  const syncFirebaseUserToBackend = async (
    fbUser: FirebaseUser,
    profile: User,
    provider: 'google' | 'password',
    rememberMe = true,
    profileIsAuthoritative = false
  ) => {
    try {
      const fbIdToken = await fbUser.getIdToken();
      const existingJwt = getStoredAuthToken();
      const { response, data } = await apiAuthFetch('/api/auth/sync-firebase', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fbIdToken}`,
          ...(existingJwt && existingJwt !== fbIdToken
            ? { 'x-session-token': existingJwt }
            : {})
        },
        body: JSON.stringify({
          idToken: fbIdToken,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          provider,
          targetRole: profile.targetRole,
          rememberMe
        })
      });
      if (response.status === 403) {
        const err: any = new Error(data.error || 'Conta suspensa.');
        err.code = data.code || 'auth/user-disabled';
        throw err;
      }
      if (response.ok && data?.token) {
        setStoredAuthToken(data.token, rememberMe);
        if (data.user) {
          const bUser = data.user as User;
          if (profileIsAuthoritative) {
            const fsUpdatedMs = Date.parse(profile.updatedAt || profile.createdAt || '') || 0;
            return reconcileFirestoreWithBackend(
              { ...bUser, ...profile, id: profile.id },
              fsUpdatedMs,
              bUser
            );
          }
          return { ...profile, ...bUser, id: profile.id };
        }
      }
    } catch (e: any) {
      if (e?.code === 'auth/user-disabled') throw e;
      console.warn('Sync Firebase -> Backend ignorado:', e);
    }
    return profile;
  };

  const loginWithProvider = async (provider: 'google' | 'linkedin'): Promise<boolean> => {
    if (provider === 'google') {
      try {
        // Call signInWithPopup SYNCHRONOUSLY inside user click/tap gesture without preceding awaits
        // so mobile Safari & Android Chrome preserve transient activation for the popup window.
        const result = await signInWithPopup(auth, googleProvider);
        if (result?.user) {
          consumeRedirectPendingMarker();
          sessionEpochRef.current += 1;
          const epoch = sessionEpochRef.current;
          const cleanEmail = (result.user.email || '').trim().toLowerCase();
          const isAdmin = isAdminAuthorized(cleanEmail, result.user.emailVerified);
          let profile: User = {
            id: result.user.uid,
            name: result.user.displayName || cleanEmail.split('@')[0] || 'Utilizador',
            email: cleanEmail,
            role: isAdmin ? 'admin' : 'user',
            status: 'active',
            avatarUrl: result.user.photoURL || undefined,
            plan: isAdmin ? 'executive' : 'free',
            creditsRemaining: isAdmin ? 9999 : 5,
            createdAt: new Date().toISOString()
          };
          let hasFirestoreDoc = false;
          try {
            const snap = await withTimeout(getDoc(doc(db, 'users', result.user.uid)), 4500, `users/${result.user.uid}`);
            if (snap.exists()) {
              hasFirestoreDoc = true;
              const d = snap.data();
              const fsAdmin = isAdminAuthorized(d.email || cleanEmail, result.user.emailVerified, d.role);
              profile = {
                ...profile,
                name: d.name || profile.name,
                role: fsAdmin ? 'admin' : 'user',
                status: d.status || 'active',
                plan: (d.plan as SubscriptionPlan) || profile.plan,
                creditsRemaining: d.creditsRemaining ?? profile.creditsRemaining,
                creditsUsed: d.creditsUsed ?? 0,
                totalCvGenerated: d.totalCvGenerated ?? 0,
                billingCycle: d.billingCycle || 'monthly',
                subscriptionExpiresAt: d.subscriptionExpiresAt || undefined,
                stripeStatus: d.stripeStatus || undefined,
                updatedAt: d.updatedAt || d.createdAt || profile.createdAt,
                notes: d.notes || undefined
              };
            }
          } catch {
            // fallback to backend sync
          }
          const synced = await syncFirebaseUserToBackend(result.user, profile, 'google', true, hasFirestoreDoc);
          if (activeResumesOwnerRef.current !== synced.id) {
            resetResumesForUserSwitch(synced.id);
          }
          lastSyncedClaimsRef.current = hasFirestoreDoc
            ? `${synced.id}|${synced.plan}|${synced.role}|${synced.status}|${synced.creditsRemaining}|${synced.subscriptionExpiresAt || ''}`
            : '';
          setUser(synced);
          attachFirestoreResumesListener(result.user.uid, synced.id, epoch);
          setAuthRedirectError(null);
          return true;
        }
        return false;
      } catch (err: any) {
        // Fallback to redirect ONLY if popup is strictly blocked in non-iframe standalone tab
        if (err?.code === 'auth/popup-blocked' && window.self === window.top) {
          setRedirectPendingMarker();
          await signInWithRedirect(auth, googleProvider);
          return false;
        }
        console.error('Firebase Google Auth error:', err);
        throw err;
      }
    }

    return false;
  };

  const login = async (email: string, password?: string, rememberMe = true): Promise<boolean> => {
    if (!password) {
      throw new Error('Por favor, insira a sua palavra-passe.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const err: any = new Error('O formato do endereço de e-mail não é válido.');
      err.code = 'auth/invalid-email';
      throw err;
    }

    // 1. Primary Email/Password authentication via Express Backend (/api/auth/login)
    const { response, data, isJson } = await apiAuthFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password, rememberMe })
    });

    if (response.ok && data?.user && data?.token) {
      sessionEpochRef.current += 1;
      const epoch = sessionEpochRef.current;
      setStoredAuthToken(data.token, rememberMe);
      resetResumesForUserSwitch(data.user.id);
      setUser(data.user);
      void hydrateResumesFromBackend(epoch, data.user.id);
      return true;
    }

    if (!isJson && response.status >= 500) {
      const srvErr: any = new Error('Serviço de autenticação temporariamente indisponível. Tente novamente.');
      srvErr.code = 'auth/network-request-failed';
      throw srvErr;
    }

    if (response.status === 403 && data?.code === 'auth/user-disabled') {
      const disabledErr: any = new Error(data.error || 'Esta conta foi suspensa pela administração.');
      disabledErr.code = 'auth/user-disabled';
      throw disabledErr;
    }

    if (response.status === 429) {
      const rateErr: any = new Error(data?.error || 'Demasiadas tentativas consecutivas.');
      rateErr.code = 'auth/too-many-requests';
      throw rateErr;
    }

    // 2. Legacy optional fallback: if account existed directly in Firebase Email/Password
    if (response.status === 401) {
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        ).catch(() => {});
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (cred.user) {
          sessionEpochRef.current += 1;
          const epoch = sessionEpochRef.current;
          const isAdmin = isUserAdmin(cleanEmail) && Boolean(cred.user.emailVerified);
          const profile: User = {
            id: cred.user.uid,
            name: cred.user.displayName || cleanEmail.split('@')[0] || 'Utilizador',
            email: cleanEmail,
            role: isAdmin ? 'admin' : 'user',
            status: 'active',
            plan: isAdmin ? 'executive' : 'free',
            creditsRemaining: isAdmin ? 9999 : 5,
            createdAt: new Date().toISOString()
          };
          const synced = await syncFirebaseUserToBackend(cred.user, profile, 'password', rememberMe);
          resetResumesForUserSwitch(synced.id);
          setUser(synced);
          attachFirestoreResumesListener(cred.user.uid, synced.id, epoch);
          return true;
        }
      } catch (fbErr: any) {
        const fbCode = fbErr?.code || '';
        if (fbCode === 'auth/user-disabled' || fbCode === 'auth/too-many-requests') {
          throw fbErr;
        }
        // Never leak auth/operation-not-allowed or auth/configuration-not-found to Email/Password users
        const invalidErr: any = new Error('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
        invalidErr.code = 'auth/invalid-credential';
        throw invalidErr;
      }
    }

    const backendErr: any = new Error(data?.error || 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
    backendErr.code =
      data?.code && !FIREBASE_EMAIL_UNAVAILABLE_CODES.has(data.code)
        ? data.code
        : 'auth/invalid-credential';
    throw backendErr;
  };

  const register = async (
    name: string,
    email: string,
    password?: string,
    targetRole?: string,
    rememberMe = true,
    antiBot?: {
      challengeId?: string;
      challengeToken?: string;
      challengeAnswer?: string;
      website?: string;
      companyPhone?: string;
    }
  ): Promise<boolean> => {
    if (!password || password.length < 6) {
      const err: any = new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
      err.code = 'auth/weak-password';
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Novo Assinante';
    const cleanRole = targetRole?.trim() || 'Profissional Executivo';

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const err: any = new Error('O formato do endereço de e-mail não é válido.');
      err.code = 'auth/invalid-email';
      throw err;
    }

    authSyncLockRef.current = true;
    try {
      // Primary registration path via Express Backend (/api/auth/register)
      const { response, data, isJson } = await apiAuthFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          targetRole: cleanRole,
          rememberMe,
          ...(antiBot || {})
        })
      });

      if (response.ok && data?.user && data?.token) {
        sessionEpochRef.current += 1;
        const epoch = sessionEpochRef.current;
        setStoredAuthToken(data.token, rememberMe);
        resetResumesForUserSwitch(data.user.id);
        setUser(data.user);
        void hydrateResumesFromBackend(epoch, data.user.id);
        return true;
      }

      if (!isJson && response.status >= 500) {
        const srvErr: any = new Error('Serviço de registo temporariamente indisponível. Tente novamente.');
        srvErr.code = 'auth/network-request-failed';
        throw srvErr;
      }

      const safeCode =
        data?.code && !FIREBASE_EMAIL_UNAVAILABLE_CODES.has(data.code)
          ? data.code
          : response.status === 409
          ? 'auth/email-already-in-use'
          : response.status === 400
          ? 'auth/invalid-email'
          : 'auth/internal-error';

      const backendErr: any = new Error(data?.error || 'Não foi possível criar a conta no servidor.');
      backendErr.code = safeCode;
      throw backendErr;
    } finally {
      authSyncLockRef.current = false;
    }
  };

  const resetPassword = async (email: string): Promise<ResetPasswordResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Por favor insira um endereço de e-mail válido.');
    }

    // Try Firebase official email reset when Email/Password provider is enabled
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        mode: 'firebase_email',
        message: 'Enviámos um link oficial de redefinição para o seu e-mail. Verifique a sua caixa de entrada e spam.'
      };
    } catch (fbErr: any) {
      if (!FIREBASE_EMAIL_UNAVAILABLE_CODES.has(fbErr?.code) && fbErr?.code !== 'auth/user-not-found') {
        throw fbErr;
      }
    }

    const { response, data } = await apiAuthFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail })
    });

    if (response.status === 429) {
      const rateErr: any = new Error(data?.error || 'Demasiados pedidos de recuperação.');
      rateErr.code = 'auth/too-many-requests';
      throw rateErr;
    }

    if (response.ok && data?.success) {
      return {
        mode: 'email_recovery',
        message:
          data.message ||
          'Se esta conta utilizar login Google, aceda diretamente pelo botão Google acima; caso contrário contacte o suporte administrativo.'
      };
    }

    throw new Error(data?.error || 'Não foi possível processar o pedido de recuperação neste momento.');
  };

  const completePasswordReset = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    const { response, data } = await apiAuthFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword
      })
    });

    if (!response.ok) {
      throw new Error(data?.error || 'Não foi possível redefinir a palavra-passe.');
    }

    if (data?.token && data?.user) {
      sessionEpochRef.current += 1;
      const epoch = sessionEpochRef.current;
      setStoredAuthToken(data.token, true);
      resetResumesForUserSwitch(data.user.id);
      setUser(data.user);
      void hydrateResumesFromBackend(epoch, data.user.id);
    }
    return true;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova palavra-passe deve conter pelo menos 6 caracteres.');
    }

    if (auth.currentUser && auth.currentUser.email) {
      const hasPasswordProvider = auth.currentUser.providerData.some(
        (p) => p.providerId === 'password'
      );
      if (hasPasswordProvider) {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, newPassword);
      }
    }

    if (getStoredAuthToken()) {
      const { response, data } = await apiAuthFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao atualizar a palavra-passe.');
      }
    }

    if (user) {
      void recordAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role === 'admin' ? 'admin' : 'user',
        action: 'password_changed',
        category: 'profile',
        severity: 'warning',
        status: 'success',
        targetResource: `users/${user.id}`,
        details: 'Palavra-passe atualizada pelo titular da conta.'
      });
    }
  };

  const updateUserProfile = async (partial: Partial<User>): Promise<void> => {
    if (!user) return;
    const changedKeys = Object.entries(partial)
      .filter(([k, v]) => v !== undefined && (user as any)[k] !== v)
      .map(([k]) => k);
    const updated = { ...user, ...partial, updatedAt: new Date().toISOString() };
    setUser(updated);

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(
          userRef,
          sanitizeForFirestore({
            ...partial,
            updatedAt: new Date().toISOString()
          })
        );
      } catch (err) {
        console.warn('Erro ao atualizar perfil no Firestore:', err);
      }
    }

    if (getStoredAuthToken()) {
      try {
        const { response, data } = await apiAuthFetch('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            name: partial.name,
            targetRole: partial.targetRole,
            phone: partial.phone,
            company: partial.company
          })
        });
        if (response.ok && data?.user) {
          setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
        }
      } catch (err) {
        console.warn('Erro ao atualizar perfil no backend:', err);
      }
    }

    if (changedKeys.length > 0) {
      void recordAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role === 'admin' ? 'admin' : 'user',
        action: 'profile_updated',
        category: 'profile',
        severity: 'info',
        status: 'success',
        targetResource: `users/${user.id}`,
        details: `Dados de perfil editados pelo utilizador (${changedKeys.join(', ')}).`,
        metadata: { changedFields: changedKeys.join(', ') }
      });
    }
  };

  const logout = async (): Promise<void> => {
    sessionEpochRef.current += 1;
    resetResumesForUserSwitch(null);
    try {
      localStorage.removeItem('curriculo_draft_v1');
      localStorage.removeItem('curriculo_job_draft_v1');
      localStorage.removeItem('curriculo_letter_draft_v1');
      localStorage.removeItem('curriculo_draft_v1_visitor');
      localStorage.removeItem('curriculo_job_draft_v1_visitor');
      localStorage.removeItem('curriculo_letter_draft_v1_visitor');
    } catch {
      // ignore
    }
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Erro ao deslogar Firebase:', e);
    }

    try {
      await apiAuthFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network failure during logout
    }

    setStoredAuthToken(null);
    localStorage.removeItem('curriculopro_impersonating_admin');
    setOriginalAdminUser(null);
    setUser(null);
    setFirebaseUser(null);
  };

  const upgradePlan = async (
    plan: SubscriptionPlan,
    meta?: {
      billingCycle?: BillingCycle;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
    }
  ): Promise<void> => {
    const cycle = normalizeBillingCycle(meta?.billingCycle);
    const durationDays = getCycleDurationDays(cycle);
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    if (!getStoredAuthToken() && auth.currentUser && user) {
      await syncFirebaseUserToBackend(
        auth.currentUser,
        user,
        auth.currentUser.providerData?.[0]?.providerId === 'password' ? 'password' : 'google',
        true,
        false
      ).catch(() => user);
    }

    let verifiedBackendUser: User | null = null;
    if (getStoredAuthToken()) {
      const extraHeaders: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const fbIdToken = await auth.currentUser.getIdToken();
          if (fbIdToken) extraHeaders['x-firebase-id-token'] = fbIdToken;
        } catch {
          // ignore
        }
      }
      const { response, data } = await apiAuthFetch('/api/auth/sync-plan', {
        method: 'POST',
        headers: extraHeaders,
        body: JSON.stringify({
          plan,
          billingCycle: cycle,
          subscriptionExpiresAt: plan === 'free' ? null : expiresAt,
          stripeSubscriptionId: meta?.stripeSubscriptionId,
          stripeCustomerId: meta?.stripeCustomerId,
          stripeStatus: plan === 'free' ? 'canceled' : 'active'
        })
      });
      if (!response.ok) {
        if (user) {
          void recordAuditLog({
            actorUserId: user.id,
            actorEmail: user.email,
            actorRole: user.role === 'admin' ? 'admin' : 'user',
            action: 'subscription_plan_sync_blocked',
            category: 'subscription',
            severity: 'critical',
            status: 'blocked',
            targetResource: `users/${user.id}`,
            details: `Tentativa bloqueada de alteração para plano '${plan}' (${cycle}) sem pagamento verificado.`,
            metadata: { requestedPlan: plan, billingCycle: cycle }
          });
        }
        throw new Error(data?.error || 'Atualização de plano bloqueada pelo servidor de pagamentos.');
      }
      if (data?.token) {
        setStoredAuthToken(data.token, true);
      }
      if (data?.user) {
        verifiedBackendUser = data.user as User;
      }
    } else if (plan !== 'free') {
      throw new Error('Sessão de autenticação necessária para ativar assinatura.');
    }

    if (auth.currentUser && plan === 'free') {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(
          userRef,
          sanitizeForFirestore({
            stripeStatus: 'canceled',
            updatedAt: new Date().toISOString()
          })
        );
      } catch (err) {
        console.warn('Aviso Firestore cancelamento:', err);
      }
    }

    if (!user) {
      console.warn('upgradePlan requer utilizador autenticado.');
      return;
    }

    const planTimestamp = verifiedBackendUser?.planUpdatedAt || Date.now();
    const resolvedCredits =
      verifiedBackendUser?.creditsRemaining ?? (plan === 'free' ? 5 : 9999);
    const resolvedExpires =
      plan === 'free'
        ? undefined
        : verifiedBackendUser?.subscriptionExpiresAt || expiresAt;
    const resolvedStripeStatus: User['stripeStatus'] =
      verifiedBackendUser?.stripeStatus || (plan === 'free' ? 'canceled' : 'active');

    localPlanSyncRef.current = {
      userId: user.id,
      plan,
      at: planTimestamp,
      creditsRemaining: resolvedCredits,
      billingCycle: cycle,
      subscriptionExpiresAt: resolvedExpires,
      stripeStatus: resolvedStripeStatus,
      stripeSubscriptionId: meta?.stripeSubscriptionId || verifiedBackendUser?.stripeSubscriptionId,
      stripeCustomerId: meta?.stripeCustomerId || verifiedBackendUser?.stripeCustomerId
    };

    void recordAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role === 'admin' ? 'admin' : 'user',
      action: plan === 'free' ? 'subscription_canceled' : 'subscription_upgraded',
      category: 'subscription',
      severity: plan === 'free' ? 'warning' : 'info',
      status: 'success',
      targetResource: `users/${user.id}`,
      details:
        plan === 'free'
          ? 'Subscrição alterada para plano gratuito / cancelada.'
          : `Subscrição alterada com sucesso para '${plan}' (${cycle}).`,
      metadata: {
        previousPlan: user.plan,
        newPlan: plan,
        billingCycle: cycle
      }
    });

    const nextUser: User = verifiedBackendUser
      ? { ...user, ...verifiedBackendUser }
      : {
          ...user,
          plan,
          creditsRemaining: resolvedCredits,
          billingCycle: cycle,
          stripeSubscriptionId: meta?.stripeSubscriptionId || user.stripeSubscriptionId,
          stripeCustomerId: meta?.stripeCustomerId || user.stripeCustomerId,
          stripeStatus: resolvedStripeStatus,
          subscriptionExpiresAt: resolvedExpires,
          planUpdatedAt: planTimestamp
        };
    lastSyncedClaimsRef.current = `${nextUser.id}|${nextUser.plan}|${nextUser.role}|${nextUser.status}|${nextUser.creditsRemaining}|${nextUser.subscriptionExpiresAt || ''}`;
    setUser(nextUser);
  };

  const refreshUser = async (): Promise<User | null> => {
    let nextUser: User | null = user;
    if (auth.currentUser) {
      const fbUser = auth.currentUser;
      try {
        const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (docSnap.exists()) {
          const d = docSnap.data();
          const fsAdmin = isAdminAuthorized(d.email || fbUser.email, fbUser.emailVerified, d.role);
          const fsUpdatedMs = Date.parse(d.updatedAt || d.createdAt || '') || 0;
          const fsProfile: User = {
            ...(user || ({ id: fbUser.uid, email: fbUser.email || '', name: 'Utilizador', createdAt: new Date().toISOString() } as User)),
            name: d.name || user?.name || 'Utilizador',
            role: fsAdmin ? 'admin' : 'user',
            status: d.status || user?.status || 'active',
            plan: (d.plan as SubscriptionPlan) || user?.plan || 'free',
            billingCycle: normalizeBillingCycle(d.billingCycle || user?.billingCycle),
            creditsRemaining: d.creditsRemaining ?? user?.creditsRemaining ?? 5,
            subscriptionExpiresAt: d.subscriptionExpiresAt || undefined,
            stripeStatus: d.stripeStatus || undefined,
            updatedAt: d.updatedAt || d.createdAt || user?.updatedAt,
            notes: d.notes ?? user?.notes
          };
          nextUser = reconcileFirestoreWithBackend(fsProfile, fsUpdatedMs, user);
          const claimSig = `${fbUser.uid}|${nextUser.plan}|${nextUser.role}|${nextUser.status}|${nextUser.creditsRemaining}|${nextUser.subscriptionExpiresAt || ''}`;
          if (lastSyncedClaimsRef.current !== claimSig) {
            lastSyncedClaimsRef.current = claimSig;
            nextUser = await syncFirebaseUserToBackend(
              fbUser,
              nextUser,
              fbUser.providerData?.[0]?.providerId === 'password' ? 'password' : 'google',
              true,
              true
            );
          } else {
            // Still query /api/auth/me in case backend received an approved Pix payment or admin server update
            try {
              const fbIdToken = await fbUser.getIdToken();
              const { response, data } = await apiAuthFetch('/api/auth/me', {
                method: 'GET',
                headers: fbIdToken ? { 'x-firebase-id-token': fbIdToken } : undefined
              });
              if (response.ok && data?.authenticated && data.user) {
                if (data.token) setStoredAuthToken(data.token, true);
                nextUser = reconcileFirestoreWithBackend(fsProfile, fsUpdatedMs, data.user as User);
              }
            } catch {
              // ignore transient /api/auth/me error
            }
          }
          setUser(nextUser);
          return nextUser;
        }
      } catch {
        // ignore firestore error and fallback to backend
      }
    }
    try {
      const extraHeaders: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const fbIdToken = await auth.currentUser.getIdToken();
          if (fbIdToken) extraHeaders['x-firebase-id-token'] = fbIdToken;
        } catch {
          // ignore
        }
      }
      const { response, data } = await apiAuthFetch('/api/auth/me', {
        method: 'GET',
        headers: extraHeaders
      });
      if (response.ok && data?.authenticated && data.user) {
        if (data.token) {
          setStoredAuthToken(data.token, true);
        }
        const bUser = data.user as User;
        const merged = user
          ? reconcileFirestoreWithBackend(
              {
                ...user,
                ...bUser,
                id: user.id
              },
              Date.parse(user.updatedAt || user.createdAt || '') || 0,
              bUser
            )
          : bUser;
        setUser(merged);
        return merged;
      }
    } catch {
      // ignore network error
    }
    return nextUser;
  };

  const incrementCvGenerated = async (
    count = 1,
    meta?: { eventType?: 'resume_started' | 'word_exported'; templateStyle?: string; skipServerIncrement?: boolean }
  ): Promise<number> => {
    const delta = Math.max(0, Math.min(5, Math.round(Number(count) || 0)));
    if (!user) return 0;

    let nextTotal = Math.max(user.totalCvGenerated || 0, savedResumes.length) + delta;

    if (!originalAdminUser && (getStoredAuthToken() || user) && !meta?.skipServerIncrement) {
      try {
        const { response, data } = await apiAuthFetch('/api/auth/track-cv-activity', {
          method: 'POST',
          body: JSON.stringify({
            increment: delta,
            eventType: meta?.eventType,
            templateStyle: meta?.templateStyle
          })
        });
        if (response.ok && typeof data?.totalCvGenerated === 'number') {
          nextTotal = Math.max(nextTotal, data.totalCvGenerated);
        }
      } catch {
        // continue with local + Firestore persistence
      }
    }

    const targetFirestoreUid = originalAdminUser && user?.id ? user.id : auth.currentUser?.uid;
    if (auth.currentUser && targetFirestoreUid && delta > 0) {
      try {
        await updateDoc(
          doc(db, 'users', targetFirestoreUid),
          sanitizeForFirestore({
            totalCvGenerated: nextTotal,
            updatedAt: new Date().toISOString()
          })
        );
      } catch {
        // non-blocking Firestore counter sync
      }
    }

    setUser((prev) => (prev ? { ...prev, totalCvGenerated: Math.max(prev.totalCvGenerated || 0, nextTotal) } : prev));
    return nextTotal;
  };

  const saveCurrentResume = async (
    cv: CVData,
    title: string,
    targetJob?: string
  ): Promise<string> => {
    const id = `cv-${Date.now()}`;
    const formattedDate = new Date().toLocaleDateString('pt-PT');
    const safeTitle = (title.trim() || cv.personalDetails?.title?.trim() || 'Meu Currículo Profissional').slice(0, 150);
    const safeTargetJob = (targetJob?.trim() || cv.personalDetails?.title?.trim() || 'Vaga Executiva').slice(0, 180);
    const cleanCv = sanitizeForFirestore(cv);

    const newResume: SavedResume = {
      id,
      title: safeTitle,
      targetJob: safeTargetJob,
      updatedAt: formattedDate,
      data: cleanCv
    };

    // Guard against Firestore's 1MB document limit when an oversized inline base64 photo is embedded
    let cloudCv: CVData = cleanCv;
    try {
      const estimatedSize = JSON.stringify(cleanCv).length;
      if (estimatedSize > 800_000 && cleanCv.personalDetails?.photoUrl?.startsWith('data:')) {
        const { photoUrl: _omitted, ...restPersonal } = cleanCv.personalDetails;
        cloudCv = {
          ...cleanCv,
          personalDetails: {
            ...restPersonal,
            showPhoto: false
          }
        };
      }
    } catch {
      cloudCv = cleanCv;
    }

    // 1. If authenticated with Firebase, persist strictly under the target owner's Firestore subcollection
    const targetFirestoreUid = originalAdminUser && user?.id ? user.id : auth.currentUser?.uid;
    if (auth.currentUser && targetFirestoreUid) {
      const resumeDocRef = doc(db, 'users', targetFirestoreUid, 'resumes', id);
      try {
        await setDoc(
          resumeDocRef,
          sanitizeForFirestore({
            id,
            userId: targetFirestoreUid,
            title: safeTitle,
            targetJob: safeTargetJob,
            updatedAt: formattedDate,
            createdAt: new Date().toISOString(),
            data: cloudCv
          })
        );
      } catch (err: any) {
        const errMsg = String(err?.message || err?.code || '');
        if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.CREATE, `users/${targetFirestoreUid}/resumes/${id}`);
        }
        const info = buildFirestoreErrorInfo(err, OperationType.CREATE, `users/${targetFirestoreUid}/resumes/${id}`);
        console.warn('Firestore save fallback active:', JSON.stringify(info));
      }
    }

    // 2. Sync to Backend persistence API (/api/resumes) when session token exists and not impersonating another user
    let serverTotalCv: number | undefined;
    if (!originalAdminUser && (getStoredAuthToken() || user)) {
      try {
        const { response, data } = await apiAuthFetch('/api/resumes', {
          method: 'POST',
          body: JSON.stringify({
            id,
            title: safeTitle,
            targetJob: safeTargetJob,
            updatedAt: formattedDate,
            data: cleanCv
          })
        });
        if (response.ok && typeof data?.totalCvGenerated === 'number') {
          serverTotalCv = data.totalCvGenerated;
        }
      } catch (backendErr) {
        console.warn('Aviso ao guardar currículo no servidor:', backendErr);
      }
    }

    const nextResumesCount = savedResumes.filter((r) => r.id !== newResume.id && r.title !== newResume.title).length + 1;
    const isNewEntry = !savedResumes.some((r) => r.id === newResume.id || r.title === newResume.title);
    const nextCvTotal = Math.max(
      serverTotalCv ?? 0,
      (user?.totalCvGenerated || 0) + (isNewEntry ? 1 : 0),
      nextResumesCount
    );

    if (auth.currentUser && targetFirestoreUid && user && nextCvTotal > (user.totalCvGenerated || 0)) {
      void updateDoc(
        doc(db, 'users', targetFirestoreUid),
        sanitizeForFirestore({
          totalCvGenerated: nextCvTotal,
          updatedAt: new Date().toISOString()
        })
      ).catch(() => {});
    }

    setSavedResumes((prev) => [newResume, ...prev.filter((r) => r.id !== newResume.id && r.title !== newResume.title)]);
    setUser((prev) => (prev ? { ...prev, totalCvGenerated: Math.max(prev.totalCvGenerated || 0, nextCvTotal) } : prev));
    if (user && !originalAdminUser) {
      void dispatchUserNotification({
        user,
        eventType: 'resume_update',
        title: 'Currículo Atualizado na Biblioteca',
        message: `A versão "${safeTitle}" foi guardada e sincronizada com sucesso na sua conta.`,
        targetResource: `users/${user.id}/resumes/${id}`
      });
    }
    return id;
  };

  const loadResume = (id: string): CVData | null => {
    const found = savedResumes.find((r) => r.id === id);
    return found ? found.data : null;
  };

  const deleteResume = async (id: string): Promise<void> => {
    const targetFirestoreUid = originalAdminUser && user?.id ? user.id : auth.currentUser?.uid;
    if (auth.currentUser && targetFirestoreUid) {
      const resumeDocRef = doc(db, 'users', targetFirestoreUid, 'resumes', id);
      try {
        await deleteDoc(resumeDocRef);
      } catch (err: any) {
        const errMsg = String(err?.message || err?.code || '');
        if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.DELETE, `users/${targetFirestoreUid}/resumes/${id}`);
        }
        const info = buildFirestoreErrorInfo(err, OperationType.DELETE, `users/${targetFirestoreUid}/resumes/${id}`);
        console.warn('Firestore delete fallback active:', JSON.stringify(info));
      }
    }

    if (!originalAdminUser && (getStoredAuthToken() || user)) {
      try {
        await apiAuthFetch(`/api/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Aviso ao remover currículo do servidor:', err);
      }
    }

    setSavedResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const impersonateUser = async (targetUser: User, reason: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      console.warn('Apenas administradores podem iniciar modo de personificação.');
      return;
    }

    sessionEpochRef.current += 1;
    const epoch = sessionEpochRef.current;
    setOriginalAdminUser(user);
    localStorage.setItem('curriculopro_impersonating_admin', JSON.stringify(user));

    try {
      const { logImpersonationAction } = await import('../services/adminModulesService');
      await logImpersonationAction({
        adminId: user.id,
        adminEmail: user.email,
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        action: 'started',
        details: reason || 'Verificação de formatação e suporte técnico',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erro ao registar log de impersonate:', e);
    }

    resetResumesForUserSwitch(targetUser.id);
    setUser({
      ...targetUser,
      notes: `[Sessão de Suporte Ativa] ${targetUser.notes || ''}`
    });

    // Load the impersonated target user's own resumes (admin session has read permission)
    if (auth.currentUser) {
      attachFirestoreResumesListener(targetUser.id, targetUser.id, epoch);
    }
    try {
      const { response, data } = await apiAuthFetch(
        `/api/admin/users/${encodeURIComponent(targetUser.id)}/resumes`,
        { method: 'GET' }
      );
      if (epoch === sessionEpochRef.current && activeResumesOwnerRef.current === targetUser.id && response.ok && Array.isArray(data?.resumes) && data.resumes.length > 0) {
        setSavedResumes(sanitizeResumeList(data.resumes));
      }
    } catch {
      // ignore if backend resumes not present
    }

    void recordAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: 'admin',
      action: 'impersonation_event',
      category: 'admin',
      severity: 'warning',
      status: 'success',
      targetResource: `users/${targetUser.id}`,
      details: `Administrador iniciou modo de personificação sobre ${targetUser.email}. Motivo: ${reason || 'suporte'}`
    });
  };

  const stopImpersonating = async (): Promise<void> => {
    if (!originalAdminUser) return;

    sessionEpochRef.current += 1;
    const epoch = sessionEpochRef.current;

    try {
      const { logImpersonationAction } = await import('../services/adminModulesService');
      if (user) {
        await logImpersonationAction({
          adminId: originalAdminUser.id,
          adminEmail: originalAdminUser.email,
          targetUserId: user.id,
          targetUserEmail: user.email,
          action: 'ended',
          details: 'Sessão de suporte concluída pelo administrador',
          timestamp: new Date().toISOString()
        });
        void recordAuditLog({
          actorUserId: originalAdminUser.id,
          actorEmail: originalAdminUser.email,
          actorRole: 'admin',
          action: 'impersonation_event',
          category: 'admin',
          severity: 'info',
          status: 'success',
          targetResource: `users/${user.id}`,
          details: `Administrador encerrou modo de personificação sobre ${user.email}.`
        });
      }
    } catch (e) {
      console.warn('Erro ao registar finalização de impersonate:', e);
    }

    resetResumesForUserSwitch(originalAdminUser.id);
    setUser(originalAdminUser);
    setOriginalAdminUser(null);
    localStorage.removeItem('curriculopro_impersonating_admin');

    if (auth.currentUser) {
      attachFirestoreResumesListener(auth.currentUser.uid, originalAdminUser.id, epoch);
    } else {
      void hydrateResumesFromBackend(epoch, originalAdminUser.id);
    }
  };

  const isActiveAdmin = Boolean(user && user.status !== 'suspended' && isUserAdmin(user.email, user.role));
  const isPro = Boolean(user && user.status !== 'suspended' && (isActiveAdmin || user.plan === 'pro' || user.plan === 'executive'));
  const isExecutive = Boolean(user && user.status !== 'suspended' && (isActiveAdmin || user.plan === 'executive'));
  const hasActivePlan = Boolean(
    user &&
    user.status !== 'suspended' &&
    (isActiveAdmin || user.plan === 'pro' || user.plan === 'executive')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: Boolean(user),
        authLoading,
        isPro,
        isExecutive,
        hasActivePlan,
        isFirebaseConnected,
        authRedirectError,
        clearAuthRedirectError,
        login,
        register,
        resetPassword,
        completePasswordReset,
        changePassword,
        loginWithProvider,
        logout,
        updateUserProfile,
        upgradePlan,
        refreshUser,
        savedResumes,
        saveCurrentResume,
        incrementCvGenerated,
        loadResume,
        deleteResume,
        isImpersonating: Boolean(originalAdminUser),
        originalAdminUser,
        impersonateUser,
        stopImpersonating
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
