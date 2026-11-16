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
    rememberMe?: boolean
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

  const [savedResumes, setSavedResumes] = useState<SavedResume[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'resume-default',
        title: 'Currículo Padrão (Executivo)',
        targetJob: 'Coordenador de Projetos & Sistemas',
        updatedAt: new Date().toLocaleDateString('pt-PT'),
        data: GENERIC_DEFAULT_CV
      }
    ];
  });

  const resumesUnsubRef = useRef<Unsubscribe | null>(null);
  const authSyncLockRef = useRef<boolean>(false);
  const sessionEpochRef = useRef<number>(0);

  const hydrateResumesFromBackend = async () => {
    try {
      const { response, data } = await apiAuthFetch('/api/resumes', { method: 'GET' });
      if (response.ok && Array.isArray(data?.resumes) && data.resumes.length > 0) {
        setSavedResumes((prev) => {
          const byId = new Map<string, SavedResume>();
          for (const item of data.resumes as SavedResume[]) {
            if (item && item.id) byId.set(item.id, item);
          }
          for (const existingItem of prev) {
            if (existingItem && existingItem.id && !byId.has(existingItem.id) && existingItem.id !== 'resume-default') {
              byId.set(existingItem.id, existingItem);
            }
          }
          const merged = Array.from(byId.values());
          return merged.length > 0 ? merged : prev;
        });
      }
    } catch (err) {
      console.warn('Aviso ao carregar currículos do servidor:', err);
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

  // Sync resumes state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(savedResumes));
    } catch (e) {
      console.warn('Erro ao guardar currículos locais:', e);
    }
  }, [savedResumes]);

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
          const cleanEmail = (result.user.email || '').trim().toLowerCase();
          const isVerifiedAdmin = isUserAdmin(cleanEmail) && Boolean(result.user.emailVerified);
          const profile: User = {
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
          const synced = await syncFirebaseUserToBackend(result.user, profile, 'google', true);
          if (!cancelled) {
            setUser(synced);
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

      // Clean up previous Firestore resume listeners
      if (resumesUnsubRef.current) {
        resumesUnsubRef.current();
        resumesUnsubRef.current = null;
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

          try {
            const docSnap = await withTimeout(
              getDoc(userDocRef),
              4500,
              `users/${uid}`
            );
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.status === 'suspended') {
                await signOut(auth).catch(() => {});
                setStoredAuthToken(null);
                setUser(null);
                return;
              }
              const isAdmin = isUserAdmin(data.email || cleanEmail, data.role) && Boolean(currentFbUser.emailVerified);
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
                subscriptionExpiresAt: data.subscriptionExpiresAt,
                stripeCustomerId: data.stripeCustomerId,
                stripeSubscriptionId: data.stripeSubscriptionId,
                stripeStatus: data.stripeStatus,
                createdAt: data.createdAt || new Date().toISOString(),
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
            const { response, data } = await apiAuthFetch('/api/auth/sync-firebase', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${fbIdToken}`
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
                hydratedUser = {
                  ...hydratedUser,
                  ...data.user,
                  id: hydratedUser.id
                };
              }
            }
          } catch (backendErr) {
            console.warn('Aviso ao sincronizar sessão com backend:', backendErr);
          }

          setUser(hydratedUser);
          setAuthRedirectError(null);
          void loadNotificationPreferences(hydratedUser.id).catch(() => {});

          // Attach listener for user's resumes subcollection
          try {
            const resumesColRef = collection(db, 'users', uid, 'resumes');
            resumesUnsubRef.current = onSnapshot(
              resumesColRef,
              (snapshot) => {
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
                  setSavedResumes(cloudResumes);
                } else {
                  void hydrateResumesFromBackend();
                }
              },
              (error) => {
                const info = buildFirestoreErrorInfo(error, OperationType.GET, `users/${uid}/resumes`);
                console.error('Firestore Resumes Listener Error: ', JSON.stringify(info));
                void hydrateResumesFromBackend();
              }
            );
          } catch (err) {
            console.error('Erro ao subscrever currículos do Firestore:', err);
            void hydrateResumesFromBackend();
          }
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
              setUser(data.user);
              void hydrateResumesFromBackend();
            } else if (!localStorage.getItem('curriculopro_impersonating_admin') && !getStoredAuthToken()) {
              setUser(null);
              setStoredAuthToken(null);
            }
          } catch {
            if (
              epochAtStart === sessionEpochRef.current &&
              !getStoredAuthToken() &&
              !localStorage.getItem('curriculopro_impersonating_admin')
            ) {
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
    rememberMe = true
  ) => {
    try {
      const fbIdToken = await fbUser.getIdToken();
      const { response, data } = await apiAuthFetch('/api/auth/sync-firebase', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fbIdToken}`
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
          return { ...profile, ...data.user, id: profile.id };
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
          const cleanEmail = (result.user.email || '').trim().toLowerCase();
          const isAdmin = isUserAdmin(cleanEmail) && Boolean(result.user.emailVerified);
          const profile: User = {
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
          const synced = await syncFirebaseUserToBackend(result.user, profile, 'google', true);
          setUser(synced);
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
      setStoredAuthToken(data.token, rememberMe);
      setUser(data.user);
      void hydrateResumesFromBackend();
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
          setUser((prev) => prev || synced);
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
    rememberMe = true
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
          rememberMe
        })
      });

      if (response.ok && data?.user && data?.token) {
        sessionEpochRef.current += 1;
        setStoredAuthToken(data.token, rememberMe);
        setUser(data.user);
        void hydrateResumesFromBackend();
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
      setStoredAuthToken(data.token, true);
      setUser(data.user);
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

    let verifiedBackendUser: User | null = null;
    if (getStoredAuthToken()) {
      const { response, data } = await apiAuthFetch('/api/auth/sync-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          billingCycle: cycle,
          subscriptionExpiresAt: expiresAt,
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

    setUser(
      verifiedBackendUser
        ? { ...user, ...verifiedBackendUser }
        : {
            ...user,
            plan,
            creditsRemaining: plan === 'free' ? 5 : 9999,
            billingCycle: cycle,
            stripeSubscriptionId: meta?.stripeSubscriptionId || user.stripeSubscriptionId,
            stripeCustomerId: meta?.stripeCustomerId || user.stripeCustomerId,
            stripeStatus: plan === 'free' ? 'canceled' : 'active',
            subscriptionExpiresAt: expiresAt
          }
    );
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const { response, data } = await apiAuthFetch('/api/auth/me', { method: 'GET' });
      if (response.ok && data?.authenticated && data.user) {
        const merged = user ? { ...user, ...data.user } : (data.user as User);
        setUser(merged);
        return merged;
      }
    } catch {
      // ignore network error
    }
    if (auth.currentUser) {
      try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          const d = docSnap.data();
          const refreshed = user
            ? {
                ...user,
                plan: (d.plan as SubscriptionPlan) || user.plan,
                billingCycle: normalizeBillingCycle(d.billingCycle || user.billingCycle),
                creditsRemaining: d.creditsRemaining ?? user.creditsRemaining,
                subscriptionExpiresAt: d.subscriptionExpiresAt || user.subscriptionExpiresAt,
                stripeStatus: d.stripeStatus || user.stripeStatus
              }
            : null;
          if (refreshed) {
            setUser(refreshed);
            return refreshed;
          }
        }
      } catch {
        // ignore firestore error
      }
    }
    return user;
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

    // 1. If authenticated with Firebase, persist to Firestore subcollection
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const resumeDocRef = doc(db, 'users', uid, 'resumes', id);
      try {
        await setDoc(
          resumeDocRef,
          sanitizeForFirestore({
            id,
            userId: uid,
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
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/resumes/${id}`);
        }
        const info = buildFirestoreErrorInfo(err, OperationType.CREATE, `users/${uid}/resumes/${id}`);
        console.warn('Firestore save fallback active:', JSON.stringify(info));
      }
    }

    // 2. Sync to Backend persistence API (/api/resumes) when session token exists
    if (getStoredAuthToken() || user) {
      try {
        await apiAuthFetch('/api/resumes', {
          method: 'POST',
          body: JSON.stringify({
            id,
            title: safeTitle,
            targetJob: safeTargetJob,
            updatedAt: formattedDate,
            data: cleanCv
          })
        });
      } catch (backendErr) {
        console.warn('Aviso ao guardar currículo no servidor:', backendErr);
      }
    }

    setSavedResumes((prev) => [newResume, ...prev.filter((r) => r.id !== newResume.id && r.title !== newResume.title)]);
    if (user) {
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
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const resumeDocRef = doc(db, 'users', uid, 'resumes', id);
      try {
        await deleteDoc(resumeDocRef);
      } catch (err: any) {
        const errMsg = String(err?.message || err?.code || '');
        if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/resumes/${id}`);
        }
        const info = buildFirestoreErrorInfo(err, OperationType.DELETE, `users/${uid}/resumes/${id}`);
        console.warn('Firestore delete fallback active:', JSON.stringify(info));
      }
    }

    if (getStoredAuthToken() || user) {
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

    setUser({
      ...targetUser,
      notes: `[Sessão de Suporte Ativa] ${targetUser.notes || ''}`
    });
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

    setUser(originalAdminUser);
    setOriginalAdminUser(null);
    localStorage.removeItem('curriculopro_impersonating_admin');
  };

  const isPro = Boolean(user && (user.plan === 'pro' || user.plan === 'executive'));
  const isExecutive = Boolean(user && user.plan === 'executive');
  const hasActivePlan = Boolean(
    user &&
    (user.plan === 'pro' || user.plan === 'executive') &&
    user.status !== 'suspended'
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
