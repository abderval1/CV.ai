import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SubscriptionPlan, SavedResume, CVData } from '../types/cv';
import { GENERIC_DEFAULT_CV } from '../data/initialCV';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isPro: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  loginWithProvider: (provider: 'google' | 'linkedin') => Promise<boolean>;
  logout: () => void;
  upgradePlan: (plan: SubscriptionPlan) => void;
  savedResumes: SavedResume[];
  saveCurrentResume: (cv: CVData, title: string, targetJob?: string) => string;
  loadResume: (id: string) => CVData | null;
  deleteResume: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'curriculopro_user_session';
const LOCAL_STORAGE_RESUMES_KEY = 'curriculopro_saved_resumes';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(savedResumes));
    } catch (e) {
      console.warn('Erro ao guardar currículos locais:', e);
    }
  }, [savedResumes]);

  const login = async (email: string, _password?: string): Promise<boolean> => {
    // Standard mock/SaaS authentication
    const cleanEmail = email.trim().toLowerCase();
    const mockUser: User = {
      id: `usr-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Utilizador',
      email: cleanEmail,
      plan: cleanEmail.includes('pro') ? 'pro' : 'free',
      creditsRemaining: cleanEmail.includes('pro') ? 9999 : 5,
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

  const loginWithProvider = async (provider: 'google' | 'linkedin'): Promise<boolean> => {
    const isLinkedIn = provider === 'linkedin';
    const mockUser: User = {
      id: `usr-${provider}-${Date.now()}`,
      name: isLinkedIn ? 'Profissional LinkedIn' : 'Utilizador Google',
      email: isLinkedIn ? 'membro.linkedin@exemplo.com' : 'conta.google@gmail.com',
      plan: 'pro', // Premium bonus for testing
      creditsRemaining: 50,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const upgradePlan = (plan: SubscriptionPlan) => {
    if (!user) {
      // Create guest user upgraded
      setUser({
        id: `usr-guest-${Date.now()}`,
        name: 'Assinante Pro',
        email: 'assinante.pro@exemplo.com',
        plan,
        creditsRemaining: 9999,
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      return;
    }

    setUser({
      ...user,
      plan,
      creditsRemaining: 9999,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const saveCurrentResume = (cv: CVData, title: string, targetJob?: string): string => {
    const id = `cv-${Date.now()}`;
    const newResume: SavedResume = {
      id,
      title: title.trim() || cv.personalDetails.title || 'Meu Currículo Profissional',
      targetJob: targetJob || 'Vaga Executiva',
      updatedAt: new Date().toLocaleDateString('pt-PT'),
      data: cv
    };

    setSavedResumes((prev) => [newResume, ...prev.filter((r) => r.title !== newResume.title)]);
    return id;
  };

  const loadResume = (id: string): CVData | null => {
    const found = savedResumes.find((r) => r.id === id);
    return found ? found.data : null;
  };

  const deleteResume = (id: string) => {
    setSavedResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const isPro = Boolean(user && (user.plan === 'pro' || user.plan === 'executive'));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isPro,
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
