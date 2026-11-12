import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, SubscriptionPlan, SavedResume, CVData, BillingCycle } from '../types/cv';
import { GENERIC_DEFAULT_CV } from '../data/initialCV';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  handleFirestoreError,
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

export function getAuthErrorMessage(err: any): string {
  if (!err) return 'Ocorreu um erro inesperado.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
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
      return 'Esta conta de utilizador foi desativada. Contacte o suporte técnico.';
    case 'auth/too-many-requests':
      return 'Demasiadas tentativas consecutivas. Por favor, aguarde alguns minutos antes de tentar novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação foi fechada antes de concluir o processo.';
    case 'auth/popup-blocked':
      return 'A janela de autenticação foi bloqueada pelo navegador. Ative os pop-ups para este site.';
    case 'auth/network-request-failed':
      return 'Falha de comunicação de rede. Verifique a sua ligação à internet.';
    case 'auth/operation-not-allowed':
      return 'Método de autenticação temporariamente indisponível.';
    default:
      return err.message || 'Falha na autenticação. Verifique os dados inseridos e tente novamente.';
  }
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
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string, targetRole?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  demoLogin: (tier: 'pro' | 'executive') => Promise<void>;
  loginWithProvider: (provider: 'google' | 'linkedin') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (partial: Partial<User>) => Promise<void>;
  switchDemoPlan: (plan: SubscriptionPlan) => void;
  upgradePlan: (
    plan: SubscriptionPlan,
    meta?: {
      billingCycle?: BillingCycle;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
    }
  ) => Promise<void>;
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

const LOCAL_STORAGE_USER_KEY = 'curriculopro_user_session';
const LOCAL_STORAGE_RESUMES_KEY = 'curriculopro_saved_resumes';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);

      // Clean up previous Firestore resume listeners
      if (resumesUnsubRef.current) {
        resumesUnsubRef.current();
        resumesUnsubRef.current = null;
      }

      if (currentFbUser) {
        const uid = currentFbUser.uid;
        const userDocRef = doc(db, 'users', uid);

        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isAdmin = isUserAdmin(data.email || currentFbUser.email, data.role);
            setUser({
              id: uid,
              name: data.name || currentFbUser.displayName || 'Utilizador',
              email: data.email || currentFbUser.email || '',
              role: data.role || (isAdmin ? 'admin' : 'user'),
              avatarUrl: currentFbUser.photoURL || data.avatarUrl || undefined,
              plan: (data.plan as SubscriptionPlan) || 'free',
              creditsRemaining: data.creditsRemaining ?? 5,
              subscriptionExpiresAt: data.subscriptionExpiresAt,
              createdAt: data.createdAt || new Date().toISOString()
            });
          } else {
            // New user registration in Firestore
            const cleanEmail = currentFbUser.email || '';
            const cleanName = currentFbUser.displayName || currentFbUser.email?.split('@')[0] || 'Novo Utilizador';
            const isAdmin = isUserAdmin(cleanEmail);
            const newUserProfile: User = {
              id: uid,
              name: cleanName,
              email: cleanEmail,
              role: isAdmin ? 'admin' : 'user',
              avatarUrl: currentFbUser.photoURL || undefined,
              plan: 'free',
              creditsRemaining: 5,
              createdAt: new Date().toISOString()
            };

            await setDoc(userDocRef, {
              id: newUserProfile.id,
              name: newUserProfile.name,
              email: newUserProfile.email,
              role: newUserProfile.role,
              plan: newUserProfile.plan,
              creditsRemaining: newUserProfile.creditsRemaining,
              createdAt: newUserProfile.createdAt
            });

            setUser(newUserProfile);
          }

          setIsFirebaseConnected(true);
        } catch (err) {
          console.error('Erro ao ler/escrever perfil no Firestore:', err);
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }

        // Attach listener for user's resumes subcollection
        try {
          const resumesColRef = collection(db, 'users', uid, 'resumes');
          resumesUnsubRef.current = onSnapshot(
            resumesColRef,
            (snapshot) => {
              if (!snapshot.empty) {
                const cloudResumes: SavedResume[] = snapshot.docs.map((docItem) => {
                  const d = docItem.data();
                  return {
                    id: docItem.id,
                    title: d.title || 'Currículo',
                    targetJob: d.targetJob || 'Vaga Executiva',
                    updatedAt: d.updatedAt || new Date().toLocaleDateString('pt-PT'),
                    data: (d.data as CVData) || GENERIC_DEFAULT_CV
                  };
                });
                setSavedResumes(cloudResumes);
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${uid}/resumes`);
            }
          );
        } catch (err) {
          console.error('Erro ao subscrever currículos do Firestore:', err);
        }
      } else {
        // User logged out of Firebase Auth
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (resumesUnsubRef.current) {
        resumesUnsubRef.current();
      }
    };
  }, []);

  const loginWithProvider = async (provider: 'google' | 'linkedin'): Promise<boolean> => {
    if (provider === 'google') {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          return true;
        }
        return false;
      } catch (err) {
        console.error('Firebase Google Auth error:', err);
        throw err;
      }
    }

    return false;
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error('Por favor, insira a sua palavra-passe.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return Boolean(cred.user);
  };

  const register = async (
    name: string,
    email: string,
    password?: string,
    targetRole?: string
  ): Promise<boolean> => {
    if (!password || password.length < 6) {
      throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Novo Assinante';
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = cred.user;

    try {
      await updateProfile(fbUser, { displayName: cleanName });
    } catch (err) {
      console.warn('Erro ao atualizar displayName no Firebase Auth:', err);
    }

    const isAdmin = isUserAdmin(cleanEmail);
    const newProfile: User = {
      id: fbUser.uid,
      name: cleanName,
      email: cleanEmail,
      role: isAdmin ? 'admin' : 'user',
      targetRole: targetRole?.trim() || 'Profissional Executivo',
      plan: 'free',
      creditsRemaining: 5,
      createdAt: new Date().toISOString()
    };

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
        targetRole: newProfile.targetRole,
        plan: newProfile.plan,
        creditsRemaining: newProfile.creditsRemaining,
        createdAt: newProfile.createdAt
      });
    } catch (err) {
      console.error('Erro ao guardar perfil no Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
    }

    setUser(newProfile);
    return true;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Por favor insira um endereço de e-mail válido.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const demoLogin = async (_tier: 'pro' | 'executive'): Promise<void> => {
    // Production mode: Authenticate via Google or Email/Password
    console.info('Acesso de produção ativo. Autenticação requer credenciais reais.');
  };

  const updateUserProfile = async (partial: Partial<User>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...partial, updatedAt: new Date().toISOString() };
    setUser(updated);

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(userRef, partial);
      } catch (err) {
        console.warn('Erro ao atualizar perfil no Firestore:', err);
      }
    }
  };

  const switchDemoPlan = (_plan: SubscriptionPlan) => {
    // Production mode: Upgrades handled through official checkout
  };

  const logout = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Erro ao deslogar Firebase:', e);
    }
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
    const isYearly = meta?.billingCycle === 'yearly';
    const durationDays = isYearly ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(userRef, {
          plan,
          creditsRemaining: 9999,
          billingCycle: meta?.billingCycle || 'monthly',
          subscriptionExpiresAt: expiresAt,
          stripeSubscriptionId: meta?.stripeSubscriptionId || null,
          stripeCustomerId: meta?.stripeCustomerId || null,
          stripeStatus: 'active',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    }

    if (!user) {
      setUser({
        id: `usr-guest-${Date.now()}`,
        name: 'Assinante Pro',
        email: 'assinante.pro@exemplo.com',
        plan,
        creditsRemaining: 9999,
        billingCycle: meta?.billingCycle || 'monthly',
        stripeSubscriptionId: meta?.stripeSubscriptionId,
        stripeCustomerId: meta?.stripeCustomerId,
        stripeStatus: 'active',
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: expiresAt
      });
      return;
    }

    setUser({
      ...user,
      plan,
      creditsRemaining: 9999,
      billingCycle: meta?.billingCycle || user.billingCycle || 'monthly',
      stripeSubscriptionId: meta?.stripeSubscriptionId || user.stripeSubscriptionId,
      stripeCustomerId: meta?.stripeCustomerId || user.stripeCustomerId,
      stripeStatus: 'active',
      subscriptionExpiresAt: expiresAt
    });
  };

  const saveCurrentResume = async (
    cv: CVData,
    title: string,
    targetJob?: string
  ): Promise<string> => {
    const id = `cv-${Date.now()}`;
    const formattedDate = new Date().toLocaleDateString('pt-PT');
    const newResume: SavedResume = {
      id,
      title: title.trim() || cv.personalDetails.title || 'Meu Currículo Profissional',
      targetJob: targetJob || 'Vaga Executiva',
      updatedAt: formattedDate,
      data: cv
    };

    // If authenticated with Firebase, persist to Firestore subcollection
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const resumeDocRef = doc(db, 'users', uid, 'resumes', id);
      try {
        await setDoc(resumeDocRef, {
          id,
          userId: uid,
          title: newResume.title,
          targetJob: newResume.targetJob,
          updatedAt: formattedDate,
          createdAt: new Date().toISOString(),
          data: cv
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/resumes/${id}`);
      }
    }

    setSavedResumes((prev) => [newResume, ...prev.filter((r) => r.id !== newResume.id && r.title !== newResume.title)]);
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
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/resumes/${id}`);
      }
    }

    setSavedResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const impersonateUser = async (targetUser: User, reason: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      console.warn('Apenas administradores podem iniciar modo de personificação.');
      return;
    }

    // Save admin original session
    setOriginalAdminUser(user);
    localStorage.setItem('curriculopro_impersonating_admin', JSON.stringify(user));

    // Audit log
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

    // Switch active user session to target
    setUser({
      ...targetUser,
      notes: `[Sessão de Suporte Ativa] ${targetUser.notes || ''}`
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
        login,
        register,
        resetPassword,
        demoLogin,
        loginWithProvider,
        logout,
        updateUserProfile,
        switchDemoPlan,
        upgradePlan,
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
