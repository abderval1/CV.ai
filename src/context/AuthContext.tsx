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

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isPro: boolean;
  isExecutive: boolean;
  hasActivePlan: boolean;
  isFirebaseConnected: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string, targetRole?: string) => Promise<boolean>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'curriculopro_user_session';
const LOCAL_STORAGE_RESUMES_KEY = 'curriculopro_saved_resumes';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
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
            setUser({
              id: uid,
              name: data.name || currentFbUser.displayName || 'Utilizador Google',
              email: data.email || currentFbUser.email || '',
              avatarUrl: currentFbUser.photoURL || undefined,
              plan: data.plan || 'free',
              creditsRemaining: data.creditsRemaining ?? 5,
              subscriptionExpiresAt: data.subscriptionExpiresAt,
              createdAt: data.createdAt || new Date().toISOString()
            });
          } else {
            // New user registration in Firestore
            const newUserProfile: User = {
              id: uid,
              name: currentFbUser.displayName || currentFbUser.email?.split('@')[0] || 'Novo Utilizador',
              email: currentFbUser.email || '',
              avatarUrl: currentFbUser.photoURL || undefined,
              plan: 'free',
              creditsRemaining: 5,
              createdAt: new Date().toISOString()
            };

            await setDoc(userDocRef, {
              id: newUserProfile.id,
              name: newUserProfile.name,
              email: newUserProfile.email,
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
        // Logged out
      }
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

    // LinkedIn or alternative provider simulation
    const mockUser: User = {
      id: `usr-linkedin-${Date.now()}`,
      name: 'Profissional LinkedIn',
      email: 'membro.linkedin@exemplo.com',
      plan: 'pro',
      creditsRemaining: 50,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    return true;
  };

  const login = async (email: string, _password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const isExecEmail = cleanEmail.includes('vip') || cleanEmail.includes('exec');
    const plan: SubscriptionPlan = isExecEmail ? 'executive' : 'pro';
    const mockUser: User = {
      id: `usr-${Date.now()}`,
      name:
        cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Assinante Profissional',
      email: cleanEmail,
      plan,
      targetRole: 'Executivo de Operações & Tecnologia',
      creditsRemaining: 9999,
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    return true;
  };

  const register = async (
    name: string,
    email: string,
    _password?: string,
    targetRole?: string
  ): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim() || 'Novo Assinante Pro',
      email: email.trim().toLowerCase(),
      targetRole: targetRole?.trim() || 'Profissional Executivo',
      plan: 'pro',
      creditsRemaining: 9999,
      billingCycle: 'monthly',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    return true;
  };

  const demoLogin = async (tier: 'pro' | 'executive'): Promise<void> => {
    const tierProfiles = {
      pro: {
        id: 'usr-demo-pro',
        name: 'Mariana Duarte (Assinante Pro)',
        email: 'mariana.pro@exemplo.com',
        targetRole: 'Gerente de Produto & Estratégia',
        plan: 'pro' as SubscriptionPlan,
        creditsRemaining: 9999,
        billingCycle: 'yearly' as BillingCycle,
        createdAt: new Date().toISOString()
      },
      executive: {
        id: 'usr-demo-vip',
        name: 'Dr. Roberto Mendes (Executivo VIP)',
        email: 'roberto.vip@exemplo.com',
        targetRole: 'Chief Operating Officer (COO) / C-Level',
        plan: 'executive' as SubscriptionPlan,
        creditsRemaining: 9999,
        billingCycle: 'yearly' as BillingCycle,
        createdAt: new Date().toISOString()
      }
    };
    setUser(tierProfiles[tier]);
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

  const switchDemoPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      setUser({
        id: `usr-${Date.now()}`,
        name: 'Utilizador Demo',
        email: 'demo@exemplo.com',
        plan,
        creditsRemaining: plan === 'free' ? 5 : 9999,
        createdAt: new Date().toISOString()
      });
      return;
    }
    setUser({
      ...user,
      plan,
      creditsRemaining: plan === 'free' ? 5 : 9999
    });
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
        isPro,
        isExecutive,
        hasActivePlan,
        isFirebaseConnected,
        login,
        register,
        demoLogin,
        loginWithProvider,
        logout,
        updateUserProfile,
        switchDemoPlan,
        upgradePlan,
        savedResumes,
        saveCurrentResume,
        loadResume,
        deleteResume
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
