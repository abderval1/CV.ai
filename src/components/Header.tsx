import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  FolderOpen,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Globe,
  Home,
  FileText,
  Menu,
  X,
  Target,
  Bot,
  Mail,
  Terminal,
  ShieldCheck,
  UploadCloud,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { isUserAdmin } from '../services/saasDbService';

interface HeaderProps {
  activeTab: 'home' | 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview' | 'profile';
  setActiveTab: (tab: 'home' | 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview' | 'profile') => void;
  onExportWord: () => void;
  isExportingWord: boolean;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenMyResumesModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenTemplateAdvisor?: () => void;
  onOpenUserProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportWord,
  isExportingWord,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenMyResumesModal,
  onOpenAdminDashboard,
  onOpenTemplateAdvisor,
  onOpenUserProfile
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency, config: currencyConfig } = useCurrency();

  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = isUserAdmin(user?.email, user?.role);

  // Tools tabs subset
  const isToolActive = ['raw', 'ats', 'ai', 'cover', 'python', 'interview'].includes(activeTab);

  const toolLabels: Record<string, string> = {
    raw: 'Importar Dados',
    ats: 'Radar ATS',
    ai: 'Otimizador IA',
    interview: 'Simulador Entrevista',
    cover: 'Carta Apresentação',
    python: 'Compilação Offline'
  };

  const handleSelectTool = (tab: 'raw' | 'ats' | 'ai' | 'cover' | 'python' | 'interview') => {
    setActiveTab(tab);
    setToolsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSelectNav = (tab: 'home' | 'editor') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Zone 1: Brand Wordmark (Clean, professional, without technical SaaS badge) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNav('home');
            }}
            className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap hover:text-slate-700 transition-colors flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tighter">
              CE
            </div>
            <span className="font-extrabold tracking-tight">Currículo Estratégico</span>
          </a>
        </div>

        {/* Zone 2: Desktop Navigation with Elegant Dropdowns */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
          {/* 1. Início */}
          <button
            type="button"
            onClick={() => handleSelectNav('home')}
            className={`transition-colors flex items-center gap-1.5 py-1 ${
              activeTab === 'home'
                ? 'text-slate-950 font-bold border-b-2 border-slate-900'
                : 'hover:text-slate-950'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Início</span>
          </button>

          {/* 2. Editor & Perfil */}
          <button
            type="button"
            onClick={() => handleSelectNav('editor')}
            className={`transition-colors flex items-center gap-1.5 py-1 ${
              activeTab === 'editor'
                ? 'text-slate-950 font-bold border-b-2 border-slate-900'
                : 'hover:text-slate-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editor de Currículo</span>
          </button>

          {/* 3. Meu Perfil (Área do Usuário Cadastrado) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setMobileMenuOpen(false);
              }}
              className={`transition-colors flex items-center gap-1.5 py-1 ${
                activeTab === 'profile'
                  ? 'text-slate-950 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-950'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Meu Perfil</span>
            </button>
          )}

          {/* 4. Catálogo de Modelos */}
          {onOpenTemplateAdvisor && (
            <button
              type="button"
              onClick={onOpenTemplateAdvisor}
              className="hover:text-slate-950 transition-colors flex items-center gap-1.5 py-1"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Modelos</span>
            </button>
          )}

          {/* 4. Preços */}
          <button
            type="button"
            onClick={onOpenPricingModal}
            className="hover:text-amber-800 text-amber-700 transition-colors flex items-center gap-1.5 py-1 font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Planos & Preços</span>
          </button>

          {/* 5. Ferramentas Estratégicas Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className={`flex items-center gap-1.5 py-1 transition-colors rounded-md px-2 ${
                isToolActive
                  ? 'bg-slate-100 text-slate-950 font-bold'
                  : 'hover:text-slate-950 text-slate-600'
              }`}
            >
              <span>
                {isToolActive ? `Ferramentas: ${toolLabels[activeTab] || 'Ativa'}` : 'Ferramentas'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  toolsDropdownOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'
                }`}
              />
            </button>

            {toolsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setToolsDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Ferramentas de Otimização & Candidatura
                  </div>

                  {/* Tool 1: Importar & Gerar */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('raw')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'raw' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <UploadCloud className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Importar Dados & LinkedIn</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Importe PDF, Word ou link do LinkedIn
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      PRO
                    </span>
                  </button>

                  {/* Tool 2: Radar ATS */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('ats')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'ats' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Target className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Vaga & Radar ATS</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Compatibilidade e palavras-chave para robôs ATS
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      PRO
                    </span>
                  </button>

                  {/* Tool 3: Otimizador IA */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('ai')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'ai' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Bot className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Otimizador IA de Conquistas</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Formulação executiva com métricas de impacto
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      PRO
                    </span>
                  </button>

                  {/* Tool 4: Simulador de Entrevista (IA) */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('interview')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'interview' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Simulador de Entrevista (IA)</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          5 perguntas técnicas & comportamentais com análise STAR
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-purple-100 text-purple-900 border border-purple-200 shrink-0">
                      VIP
                    </span>
                  </button>

                  {/* Tool 5: Carta de Apresentação */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('cover')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'cover' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Carta de Apresentação</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Gere cartas alinhadas aos requisitos da vaga
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      PRO
                    </span>
                  </button>

                  <div className="border-t border-slate-100 my-1.5" />

                  {/* Tool 6: Compilação Técnica Python */}
                  <button
                    type="button"
                    onClick={() => handleSelectTool('python')}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5 ${
                      activeTab === 'python' ? 'bg-slate-50 font-bold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Terminal className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Compilação Offline (Python)</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Exportação de script Python para compilação local
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-purple-100 text-purple-900 border border-purple-200 shrink-0">
                      VIP
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Zone 3: Actions & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Multi-Currency Selector Dropdown (Desktop) */}
          <div className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Mudar moeda de exibição (Angola, Portugal/UE, Brasil, Global)"
            >
              <span>{currencyConfig.flag}</span>
              <span className="font-mono text-[11px]">{currencyConfig.code} ({currencyConfig.symbol})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selecionar Moeda
                  </div>
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currency === c.code ? 'font-bold text-slate-950 bg-slate-50' : 'text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Saved Resumes Button (Desktop) */}
          <button
            type="button"
            onClick={onOpenMyResumesModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            title="Gerir os Meus Currículos Salvos"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Meus CVs</span>
          </button>

          {/* User Session Dropdown or Login Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                title="Minha Conta"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate hidden md:inline">{user.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                    user.plan === 'executive'
                      ? 'bg-purple-100 text-purple-700'
                      : user.plan === 'pro'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {user.plan}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-500">Plano Ativo:</span>
                        <span className="text-[10px] font-bold text-amber-700 capitalize">{user.plan}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setActiveTab('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Meu Perfil & Assinatura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPricingModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Planos & Assinaturas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenMyResumesModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Os Meus Currículos</span>
                    </button>

                    {/* Admin Access: Only shown to verified administrators, not visible to regular buyers */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdminDashboard();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Painel Administrativo</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criar Conta</span>
              </button>
            </div>
          )}

          {/* Primary Action Button: Export Word (.docx) */}
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {isExportingWord
                ? 'A Gerar...'
                : activeTab === 'cover'
                ? 'Baixar Carta (.docx)'
                : 'Baixar Word (.docx)'}
            </span>
            <span className="sm:hidden text-xs">Word</span>
          </button>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu (Replaces horizontal scrolling bar and prevents any lateral scroll) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* Main Navigation Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Navegação Principal
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectNav('home')}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'home'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Início</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav('editor')}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Editor de CV</span>
              </button>

              {onOpenTemplateAdvisor && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTemplateAdvisor();
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Globe className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Modelos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPricingModal();
                }}
                className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Planos & Preços</span>
              </button>
            </div>
          </div>

          {/* Strategic Tools Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Ferramentas Estratégicas
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleSelectTool('raw')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'raw'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-indigo-500" />
                  <span>Importar Dados & LinkedIn</span>
                </div>
                <span className="text-[10px] opacity-70">Texto / Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ats')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'ats'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <span>Vaga & Radar ATS</span>
                </div>
                <span className="text-[10px] opacity-70">Palavras-chave</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ai')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span>Otimizador IA de Conquistas</span>
                </div>
                <span className="text-[10px] opacity-70">Google XYZ</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('interview')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'interview'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Simulador de Entrevista (IA)</span>
                </div>
                <span className="text-[10px] opacity-70">5 Perguntas</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('cover')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'cover'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>Carta de Apresentação</span>
                </div>
                <span className="text-[10px] opacity-70">Word / Texto</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('python')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'python'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  <span>Compilação Offline (Python)</span>
                </div>
                <span className="text-[10px] opacity-70">Automação</span>
              </button>
            </div>
          </div>

          {/* Account & Currency Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Moeda:</span>
              <div className="flex items-center gap-1">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`px-2 py-1 text-xs rounded-md font-semibold transition-colors ${
                      currency === c.code
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span className="ml-1 font-mono text-[10px]">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyResumesModal();
                }}
                className="flex-1 py-2 px-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Meus CVs</span>
              </button>

              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveTab('profile');
                  }}
                  className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Meu Perfil</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
