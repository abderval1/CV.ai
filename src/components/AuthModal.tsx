import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Linkedin,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  KeyRound,
  AlertCircle
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
  const { login, register, loginWithProvider, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  // Simple password strength calculation
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

    if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setError('Por favor insira um endereço de e-mail válido.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessInfo('Instruções de recuperação foram enviadas para o seu e-mail.');
      }, 700);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor insira um endereço de e-mail corporativo ou pessoal válido.');
      return;
    }

    if (!password || password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor insira o seu nome completo.');
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
        await login(email, password);
      } else {
        await register(name, email, password, targetRole);
        onRegistrationSuccess?.();
      }
      onClose();
    } catch {
      setError('Falha na autenticação. Verifique os dados inseridos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: 'google' | 'linkedin') => {
    setLoading(true);
    setError(null);
    try {
      await loginWithProvider(provider);
      onClose();
    } catch {
      setError('Falha ao autenticar com o provedor externo.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (tier: 'pro' | 'executive') => {
    setLoading(true);
    try {
      await demoLogin(tier);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        {/* Header Tabs */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Autenticação Segura & Acesso à Plataforma
            </span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            {mode === 'login' && 'Entrar na Plataforma'}
            {mode === 'register' && 'Criar Conta de Assinante'}
            {mode === 'forgot' && 'Recuperar Palavra-passe'}
          </h2>

          <p className="text-xs text-slate-300 mt-1">
            {mode === 'login' && 'Aceda aos seus currículos, simulação de entrevistas e relatórios ATS.'}
            {mode === 'register' && 'Registe-se para desbloquear a criação e otimização executiva de currículos.'}
            {mode === 'forgot' && 'Insira o seu e-mail cadastrado para redefinir as suas credenciais.'}
          </p>

          {promptMessage && (
            <div className="mt-3 bg-amber-400/20 border border-amber-400/40 rounded-xl p-2.5 flex items-start gap-2 text-amber-200 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{promptMessage}</span>
            </div>
          )}

          {/* Mode Switcher */}
          {mode !== 'forgot' && (
            <div className="mt-5 grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
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
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
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

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Social Logins */}
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleProviderLogin('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderLogin('linkedin')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 absolute uppercase tracking-wider">
                  ou com e-mail corporativo
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cargo Desejado / Área de Atuação
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Ex: Diretor de Operações, Tech Lead, Gerente Financeiro"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Endereço de E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
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
                    <span className="text-[10px] font-semibold text-slate-500">
                      Segurança da senha: <strong className={strength.color.split(' ')[1]}>{strength.text}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Checkboxes & Helpers */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Lembrar-me neste dispositivo</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-slate-600 hover:text-slate-950 font-semibold underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-[11px] leading-relaxed">
                    Concordo com os <strong>Termos de Serviço</strong> e <strong>Política de Privacidade</strong> em conformidade com a LGPD e GDPR.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 ${
                mode === 'register' ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 text-white'
              } disabled:opacity-50 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-3`}
            >
              <span>
                {mode === 'login' && 'Entrar na Plataforma'}
                {mode === 'register' && 'Cadastrar & Aceder à Plataforma'}
                {mode === 'forgot' && 'Enviar Link de Redefinição'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar (Allows test driving every tier immediately) */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Acesso Rápido para Avaliação & Demonstração:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('pro')}
                className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 transition-colors text-center"
              >
                1. Assinante Pro
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('executive')}
                className="py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 transition-colors text-center"
              >
                2. Executivo VIP
              </button>
            </div>
          </div>

          {/* Return link when on forgot view */}
          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline"
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
