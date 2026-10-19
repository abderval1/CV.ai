import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, SubscriptionPlan, SavedResume, CVData } from '../types/cv';
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
  isFirebaseConnected: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  loginWithProvider: (provider: 'google' | 'linkedin') => Promise<boolean>;
  logout: () => Promise<void>;
  upgradePlan: (plan: SubscriptionPlan) => Promise<void>;
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
    const isProEmail = cleanEmail.includes('pro');
    const mockUser: User = {
      id: `usr-${Date.now()}`,
      name:
        cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Utilizador',
      email: cleanEmail,
      plan: isProEmail ? 'pro' : 'free',
      creditsRemaining: isProEmail ? 9999 : 5,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    return true;
  };

  const register = async (name: string, email: string, _password?: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim() || 'Novo Utilizador',
      email: email.trim().toLowerCase(),
      plan: 'free',
      creditsRemaining: 5,
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    return true;
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

  const upgradePlan = async (plan: SubscriptionPlan): Promise<void> => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(userRef, {
          plan,
          creditsRemaining: 9999,
          subscriptionExpiresAt: expiresAt
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
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: expiresAt
      });
      return;
    }

    setUser({
      ...user,
      plan,
      creditsRemaining: 9999,
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

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: Boolean(user),
        isPro,
        isFirebaseConnected,
        login,
        register,
        loginWithProvider,
        logout,
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
