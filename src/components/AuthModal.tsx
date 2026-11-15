import React, { useState, useEffect } from 'react';
import { useAuth, getAuthErrorMessage } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getStoredPlatformSettingsSync } from '../services/adminModulesService';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onRegistrationSuccess?: () => void;
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onRegistrationSuccess,
  promptMessage
}) => {
  const {
    login,
    register,
    loginWithProvider,
    resetPassword,
    completePasswordReset,
    isAuthenticated,
    authRedirectError,
    clearAuthRedirectError
  } = useAuth();
  const { showSuccess } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // 2-step password reset state for backend recovery code flow
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState<string>('');
  const [issuedResetHint, setIssuedResetHint] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState<string>('');
  const [googleDomainWarning, setGoogleDomainWarning] = useState<string | null>(null);
  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = React.useRef<HTMLDivElement | null>(null);
  const googleInFlightRef = React.useRef<boolean>(false);

  const isInAppBrowser = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /FBAN|FBAV|Instagram|WhatsApp|Line\/|MicroMessenger|BytedanceWebview|TikTok|LinkedInApp|; wv\)/i.test(
      navigator.userAgent || ''
    );
  }, []);

  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  // Always synchronize active tab & reset transient errors whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(authRedirectError || null);
      setSuccessInfo(null);
      setGoogleDomainWarning(null);
      setPassword('');
      setConfirmPassword('');
      setResetStep('request');
      setResetCode('');
      setIssuedResetHint(null);
      setNewResetPassword('');
      setLoading(false);
      setGoogleLoading(false);
      googleInFlightRef.current = false;
    }
  }, [isOpen, defaultMode, authRedirectError]);

  // Auto-close modal seamlessly if Firebase auth completes via listener or redirect
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      googleInFlightRef.current = false;
      setGoogleLoading(false);
      setLoading(false);
      clearAuthRedirectError();
      onClose();
    }
  }, [isOpen, isAuthenticated, onClose, clearAuthRedirectError]);

  // Recover gracefully on mobile if the OAuth popup closes or loses window.opener silently on return
  useEffect(() => {
    if (!isOpen || !googleLoading || typeof document === 'undefined' || typeof window === 'undefined') return;
    const isMobileEnv =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
    if (!isMobileEnv) return;

    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    let leftForeground = false;

    const markLeftForeground = () => {
      leftForeground = true;
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };

    const scheduleReturnRecovery = () => {
      if (!leftForeground || !googleInFlightRef.current) return;
      if (recoveryTimer) clearTimeout(recoveryTimer);
      recoveryTimer = setTimeout(() => {
        if (googleInFlightRef.current && !isAuthenticated) {
          googleInFlightRef.current = false;
          setGoogleLoading(false);
          setLoading(false);
          setError(
            'O navegador do telemóvel regressou antes de concluir a confirmação com a Google. Permita janelas pop-up para este site, abra diretamente no Chrome ou Safari, ou entre abaixo com E-mail e Palavra-passe.'
          );
        }
      }, 4500);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        markLeftForeground();
      } else if (document.visibilityState === 'visible') {
        scheduleReturnRecovery();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', markLeftForeground);
    window.addEventListener('focus', scheduleReturnRecovery);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', markLeftForeground);
      window.removeEventListener('focus', scheduleReturnRecovery);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, [isOpen, googleLoading, isAuthenticated]);

  // Prevent background page scroll on mobile while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Scroll inline feedback into view on mobile viewports when errors/success messages appear
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  if (!isOpen) return null;

  const allowNewRegistrations = platformSettings.allowNewRegistrations !== false;

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, text: 'Fraca', color: 'bg-rose-500 text-rose-600' };
    if (score <= 3) return { score: 2, text: 'Média', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, text: 'Forte & Segura', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Por favor insira um endereço de e-mail válido.');
      return;
    }

    if (mode === 'forgot') {
      if (resetStep === 'request') {
        setLoading(true);
        try {
          const result = await resetPassword(cleanEmail);
          if (result.mode === 'backend_code') {
            setResetStep('verify');
            setIssuedResetHint(result.verificationCode || null);
            setSuccessInfo(
              result.verificationCode
                ? `Código de verificação gerado: ${result.verificationCode}. Insira-o abaixo com a sua nova palavra-passe.`
                : result.message
            );
          } else {
            setSuccessInfo(result.message);
          }
        } catch (err: any) {
          setError(getAuthErrorMessage(err));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!resetCode.trim() || newResetPassword.length < 6) {
        setError('Insira o código de 6 dígitos e uma nova palavra-passe com pelo menos 6 caracteres.');
        return;
      }

      setLoading(true);
      try {
        await completePasswordReset(cleanEmail, resetCode, newResetPassword);
        showSuccess('Palavra-passe Redefinida', 'A sua sessão foi iniciada automaticamente.');
        onClose();
      } catch (err: any) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!allowNewRegistrations) {
        setError('Novos registos encontram-se temporariamente pausados pela administração da plataforma. Contas existentes podem entrar normalmente.');
        return;
      }
      if (!name.trim()) {
        setError('Por favor insira o seu nome completo.');
        return;
      }
      if (confirmPassword !== password) {
        setError('As palavras-passe não coincidem. Verifique os dois campos.');
        return;
      }
      if (!agreeTerms) {
        setError('Por favor aceite os Termos de Uso e Política de Privacidade para prosseguir.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanEmail, password, rememberMe);
        showSuccess('Sessão Iniciada', 'Bem-vindo de volta ao Currículo Estratégico.');
      } else {
        await register(name.trim(), cleanEmail, password, targetRole.trim(), rememberMe);
        showSuccess('Conta Criada com Sucesso', 'Bem-vindo! Ative o seu plano para criar, editar e descarregar.');
        onRegistrationSuccess?.();
      }
      onClose();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: 'google' | 'linkedin') => {
    clearAuthRedirectError();
    setError(null);
    setSuccessInfo(null);
    setGoogleDomainWarning(null);
    setLoading(true);
    setGoogleLoading(true);
    googleInFlightRef.current = true;
    try {
      const ok = await loginWithProvider(provider);
      googleInFlightRef.current = false;
      if (ok) {
        showSuccess('Autenticação Google Concluída', 'Sessão sincronizada com sucesso.');
        onClose();
      } else {
        // Redirecting away via signInWithRedirect
        setSuccessInfo('A abrir seleção de conta Google...');
      }
    } catch (err: any) {
      googleInFlightRef.current = false;
      if (err?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setGoogleDomainWarning(host || 'domínio atual');
        setError(
          'O acesso Google ainda não está autorizado neste domínio. Utilize o acesso imediato por E-mail e Palavra-passe logo abaixo.'
        );
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      googleInFlightRef.current = false;
      setGoogleLoading(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 w-full sm:max-w-md flex flex-col max-h-[94dvh] sm:max-h-[90dvh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="bg-[#0B0F17] text-white px-5 py-4 sm:px-6 sm:py-5 relative shrink-0 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              clearAuthRedirectError();
              onClose();
            }}
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors touch-manipulation"
            aria-label="Fechar janela de autenticação"
          >
            <X className="w-5 h-5" />
          </button>

          <p className="text-[11px] font-medium tracking-wide uppercase text-amber-400 mb-1 pr-10">
            Acesso à Conta
          </p>

          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold tracking-tight pr-10">
            {mode === 'login' && 'Entrar na Plataforma'}
            {mode === 'register' && 'Criar Conta de Assinante'}
            {mode === 'forgot' && 'Recuperar Palavra-passe'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Aceda aos seus currículos, simulação de entrevistas e relatórios ATS.'}
            {mode === 'register' && 'Registe-se para guardar currículos na nuvem e desbloquear recursos executivos.'}
            {mode === 'forgot' && 'Recupere o acesso à sua conta de forma rápida e segura.'}
          </p>

          {promptMessage && (
            <div className="mt-3 bg-amber-500/15 border border-amber-400/35 rounded-lg p-2.5 flex items-start gap-2 text-amber-100 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{promptMessage}</span>
            </div>
          )}

          {/* Mode Switcher */}
          {mode !== 'forgot' && (
            <div className="mt-4 grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessInfo(null);
                  setGoogleDomainWarning(null);
                  bodyScrollRef.current?.scrollTo({ top: 0 });
                }}
                className={`min-h-[42px] py-2 px-3 text-xs font-semibold rounded-md transition-colors touch-manipulation ${
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessInfo(null);
                  setGoogleDomainWarning(null);
                  bodyScrollRef.current?.scrollTo({ top: 0 });
                }}
                className={`min-h-[42px] py-2 px-3 text-xs font-semibold rounded-md transition-colors touch-manipulation ${
                  mode === 'register'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          )}
        </div>

        {/* Single Scrollable Form Body (No nested scroll traps on mobile keyboards) */}
        <div
          ref={bodyScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 pb-8 space-y-4"
        >
          {mode === 'register' && !allowNewRegistrations && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Novos cadastros temporariamente pausados</p>
                <p className="text-[11px] mt-0.5">
                  A criação de novas contas foi desativada temporariamente pelo administrador. Se já possui conta, alterne para "Iniciar Sessão".
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              ref={errorBannerRef}
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-medium leading-relaxed block">{error}</span>
                {googleDomainWarning && (
                  <p className="text-[11px] text-rose-700 bg-white/80 border border-rose-200 rounded-md px-2.5 py-1.5 leading-relaxed">
                    Para ativar o botão Google neste URL, adicione{' '}
                    <code className="font-mono font-semibold text-slate-900 select-all">{googleDomainWarning}</code>{' '}
                    nas definições de domínios autorizados ou entre já abaixo com o seu e-mail.
                  </p>
                )}
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{successInfo}</span>
                {issuedResetHint && (
                  <div className="font-mono text-xs font-semibold bg-white/90 px-2.5 py-1 rounded border border-emerald-300 inline-block">
                    Código: {issuedResetHint}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Logins */}
          {mode !== 'forgot' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleProviderLogin('google')}
                disabled={loading}
                className="w-full min-h-[46px] flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 rounded-lg text-sm sm:text-xs font-semibold text-slate-800 transition-colors touch-manipulation"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600 shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? 'A ligar à Conta Google...' : 'Continuar com a Conta Google'}</span>
              </button>

              {isInAppBrowser && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  <strong>Navegador interno detetado:</strong> aplicações como WhatsApp ou Instagram costumam bloquear o acesso Google. Toque em <strong>Abrir no Chrome / Safari</strong> ou utilize o acesso por e-mail abaixo.
                </div>
              )}

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 relative z-10 whitespace-nowrap">
                  ou com e-mail e palavra-passe
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </div>
          )}

          {/* Form (noValidate prevents silent native HTML5 bubble failures in scrolled mobile views) */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-800 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-role" className="block text-xs font-semibold text-slate-800 mb-1">
                    Cargo Desejado / Área de Atuação
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-role"
                      type="text"
                      enterKeyHint="next"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Ex: Diretor de Operações, Tech Lead"
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-800 mb-1">
                Endereço de E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === 'forgot' && resetStep === 'verify'}
                  placeholder="nome@empresa.com"
                  className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 disabled:bg-slate-50 transition-colors bg-white text-slate-900"
                />
              </div>
            </div>

            {mode === 'forgot' && resetStep === 'verify' && (
              <>
                <div>
                  <label htmlFor="auth-reset-code" className="block text-xs font-semibold text-slate-800 mb-1">
                    Código de Verificação (6 dígitos)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-reset-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Ex: 482910"
                      className="w-full min-h-[44px] text-base sm:text-sm font-mono pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-reset-pass" className="block text-xs font-semibold text-slate-800 mb-1">
                    Nova Palavra-passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-reset-pass"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 touch-manipulation"
                      aria-label="Mostrar ou ocultar palavra-passe"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-800 mb-1">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    enterKeyHint={mode === 'login' ? 'done' : 'next'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 touch-manipulation"
                    aria-label="Mostrar ou ocultar palavra-passe"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength visualizer for registration */}
                {mode === 'register' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 1 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 2 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 3 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      Segurança da senha: <strong className={strength.color.split(' ')[1]}>{strength.text}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-slate-800 mb-1">
                  Confirmar Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    enterKeyHint="done"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a palavra-passe"
                    className={`w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white text-slate-900 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/15'
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    As palavras-passe não coincidem.
                  </p>
                )}
              </div>
            )}

            {/* Checkboxes & Helpers */}
            {mode === 'login' && (
              <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <label className="flex items-center gap-2 min-h-[44px] cursor-pointer text-slate-600 font-medium touch-manipulation">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Manter sessão iniciada</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setResetStep('request');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="min-h-[44px] px-1 text-slate-600 hover:text-slate-950 font-semibold underline touch-manipulation"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 py-1.5 cursor-pointer text-xs text-slate-600 touch-manipulation">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-slate-900 focus:ring-slate-900 shrink-0"
                  />
                  <span className="text-[11px] leading-relaxed">
                    Concordo com os <strong>Termos de Serviço</strong> e <strong>Política de Privacidade</strong> em conformidade com a LGPD e GDPR.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && !allowNewRegistrations)}
              className={`w-full min-h-[48px] py-3 px-4 ${
                mode === 'register'
                  ? 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
              } disabled:opacity-50 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm mt-2 touch-manipulation`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? 'A processar...'
                  : mode === 'login'
                  ? 'Entrar na Plataforma'
                  : mode === 'register'
                  ? 'Criar Conta & Entrar'
                  : resetStep === 'verify'
                  ? 'Confirmar Nova Palavra-passe'
                  : 'Enviar Código / Link de Redefinição'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Return link when on forgot view */}
          {mode === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetStep('request');
                  setError(null);
                  setSuccessInfo(null);
                }}
                className="min-h-[44px] px-3 text-xs font-semibold text-slate-600 hover:text-slate-950 underline touch-manipulation"
              >
                Voltar ao Início de Sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
