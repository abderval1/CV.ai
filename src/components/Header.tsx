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
  ShieldCheck,
  UploadCloud,
  MessageSquare,
  Lock,
  Receipt,
  Loader2,
  Check,
  LayoutGrid,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { isUserAdmin } from '../services/saasDbService';

export type AppTab =
  | 'home'
  | 'raw'
  | 'editor'
  | 'ats'
  | 'ai'
  | 'cover'
  | 'interview'
  | 'profile'
  | 'models-cv'
  | 'examples-cv'
  | 'models-cover'
  | 'examples-cover';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onExportWord: () => void;
  isExportingWord: boolean;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenMyResumesModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenTemplateAdvisor?: () => void;
  onOpenUserProfile?: () => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  isTranslatingContent?: boolean;
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
  onOpenUserProfile,
  onSelectLanguage,
  isTranslatingContent = false
}) => {
  const { user, isAuthenticated, hasActivePlan, logout } = useAuth();
  const { currency, setCurrency, config: currencyConfig } = useCurrency();
  const { t, language, setLanguage, currentLanguage } = useLanguage();

  const handleLanguagePick = (code: LanguageCode) => {
    if (onSelectLanguage) {
      onSelectLanguage(code);
    } else {
      setLanguage(code);
    }
  };

  const [showcaseDropdownOpen, setShowcaseDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [prefsDropdownOpen, setPrefsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = isUserAdmin(user?.email, user?.role);
  const isToolActive = ['raw', 'ats', 'ai', 'interview', 'cover'].includes(activeTab);
  const isShowcaseActive = ['models-cv', 'examples-cv', 'models-cover', 'examples-cover'].includes(activeTab);

  const showcaseLabels: Record<string, string> = {
    'models-cv': 'Modelos de CV',
    'examples-cv': 'Exemplos de CV',
    'models-cover': 'Modelos de Carta',
    'examples-cover': 'Exemplos de Carta'
  };

  const toolLabels: Record<string, string> = {
    cover: 'Carta de Apresentação',
    raw: t('tool.importData', 'Importar Dados'),
    ats: t('tool.atsRadar', 'Radar ATS'),
    ai: t('tool.aiOptimizer', 'Otimizador IA'),
    interview: t('tool.interviewSim', 'Simulador Entrevista')
  };

  const handleSelectTool = (tab: 'raw' | 'ats' | 'ai' | 'cover' | 'interview') => {
    setActiveTab(tab);
    setShowcaseDropdownOpen(false);
    setToolsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSelectNav = (tab: AppTab) => {
    setActiveTab(tab);
    setShowcaseDropdownOpen(false);
    setToolsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-3 w-full min-w-0">
        {/* Zone 1: Clean Brand Lockup */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelectNav('home');
          }}
          className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 hover:text-slate-700 transition-colors flex items-center gap-2 min-w-0 shrink"
        >
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[11px] tracking-tighter shrink-0">
            CE
          </span>
          <span className="truncate">Currículo Estratégico</span>
        </a>

        {/* Zone 2: Minimal 4-Link Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectNav('home')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'home'
                ? 'bg-slate-100 text-slate-950 font-semibold'
                : 'hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>{t('nav.home', 'Início')}</span>
          </button>

          {/* Public Gallery Dropdown: Modelos & Exemplos */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowcaseDropdownOpen(!showcaseDropdownOpen);
                setToolsDropdownOpen(false);
                setPrefsDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isShowcaseActive
                  ? 'bg-slate-100 text-slate-950 font-semibold'
                  : 'hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{isShowcaseActive ? showcaseLabels[activeTab] : 'Modelos & Exemplos'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  showcaseDropdownOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'
                }`}
              />
            </button>

            {showcaseDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowcaseDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-76 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Currículos (Visualização Livre)
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('models-cv')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'models-cv' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Modelos de CV</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        9 layouts A4 ATS, Harvard, Tech e Europass
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('examples-cv')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'examples-cv' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Exemplos de CV</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Currículos preenchidos por profissão e setor
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cartas de Apresentação
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('models-cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'models-cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Modelos de Carta de Apresentação</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Designs formais e modernos em folha A4
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('examples-cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'examples-cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Exemplos de Carta de Apresentação</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cartas prontas por cargo, estágio ou transição
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSelectNav('editor')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'editor'
                ? 'bg-slate-100 text-slate-950 font-semibold'
                : 'hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{t('nav.editor', 'Editor de CV')}</span>
          </button>

          {/* Grouped Tools & Document Suite Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setShowcaseDropdownOpen(false);
                setPrefsDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isToolActive
                  ? 'bg-slate-100 text-slate-950 font-semibold'
                  : 'hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isToolActive ? toolLabels[activeTab] || 'Ferramentas' : 'Ferramentas & IA'}</span>
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
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Documentos & Formatos
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Carta de Apresentação</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Editor A4 + geração e tradução em 5 idiomas
                      </p>
                    </div>
                  </button>

                  {onOpenTemplateAdvisor && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenTemplateAdvisor();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-slate-700"
                    >
                      <Globe className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">Modelos Internacionais</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Harvard, ATS Estrito, Europass, Tech & Executivo
                        </p>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Inteligência ATS & IA
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('raw')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'raw' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Importar Dados & LinkedIn</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Extraia estrutura de PDF, Word ou texto livre
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('ats')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'ats' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Radar ATS & Palavras-Chave</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Compare o seu perfil com os requisitos da vaga
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('ai')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'ai' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Otimizador IA (Google XYZ)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reescreva realizações com foco em métricas
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('interview')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'interview' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">Simulador de Entrevista</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Perguntas técnicas e avaliação método STAR
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenPricingModal}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>{t('nav.pricing', 'Planos')}</span>
          </button>
        </nav>

        {/* Zone 3: Grouped Preferences + Account + 1 Primary Export CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unified Region & Language Selector (Language + Currency inside 1 clean control) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPrefsDropdownOpen(!prefsDropdownOpen);
                setToolsDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Idioma de tradução e moeda"
            >
              {isTranslatingContent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
              ) : (
                <span className="text-sm leading-none">{currentLanguage.flag}</span>
              )}
              <span className="font-mono text-[11px] font-semibold text-slate-800">
                {currentLanguage.code.toUpperCase()}
              </span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
                {currencyConfig.symbol}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {prefsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPrefsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 space-y-2">
                  {/* Language Section */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('common.language', 'Idioma & Tradução')}
                    </div>
                    <div className="space-y-0.5">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          disabled={isTranslatingContent}
                          onClick={() => {
                            handleLanguagePick(lang.code);
                            setPrefsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 disabled:opacity-50 transition-colors ${
                            language === lang.code ? 'font-semibold text-slate-950 bg-slate-100/80' : 'text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">{lang.flag}</span>
                            <span>{lang.name}</span>
                          </span>
                          {language === lang.code ? (
                            <Check className="w-3.5 h-3.5 text-slate-900" />
                          ) : (
                            <span className="font-mono text-[10px] text-slate-400">{lang.code.toUpperCase()}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency Section */}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('common.currency', 'Moeda de Preços')}
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {Object.values(CURRENCIES).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCurrency(c.code);
                            setPrefsDropdownOpen(false);
                          }}
                          className={`text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            currency === c.code
                              ? 'font-semibold text-slate-950 bg-slate-100'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{c.flag}</span>
                            <span className="font-mono text-[11px]">{c.code}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{c.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Account Menu (Unified for Authenticated & Unauthenticated) */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setPrefsDropdownOpen(false);
                  setToolsDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                title="Minha Conta e Currículos"
              >
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[84px] truncate hidden md:inline font-semibold">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 shrink-0">
                          {user.plan === 'executive' ? 'VIP' : user.plan === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenMyResumesModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Os Meus Currículos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenUserProfile ? onOpenUserProfile() : setActiveTab('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Meu Perfil & Acesso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenUserProfile?.();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>Assinatura & Faturas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPricingModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gerir Plano</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdminDashboard();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 flex items-center gap-2"
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
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Entrar</span>
            </button>
          )}

          {/* Primary Export CTA */}
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-lg whitespace-nowrap shrink-0 ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {!isAuthenticated || !hasActivePlan ? (
              <Lock className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {isExportingWord
                ? 'A Gerar...'
                : activeTab === 'cover'
                ? 'Baixar Carta (.docx)'
                : 'Baixar Word (.docx)'}
            </span>
            <span className="sm:hidden">
              {activeTab === 'cover' ? 'Carta' : 'Word'}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Clean Grouped Mobile Drawer (No duplicate items) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Área de Trabalho
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectNav('home')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'home' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Início</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav('editor')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'editor' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Editor de CV</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav('cover')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Carta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPricingModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Planos</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Modelos &amp; Exemplos (Visualização Livre)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectNav('models-cv')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'models-cv' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Modelos de CV</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('examples-cv')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'examples-cv' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Exemplos de CV</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('models-cover')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'models-cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Modelos Carta</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('examples-cover')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'examples-cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Exemplos Carta</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Ferramentas Inteligentes
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelectTool('raw')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span>Importar Dados & LinkedIn</span>
                </span>
                <span className="text-[10px] text-slate-400">PDF / Word</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ats')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Radar ATS</span>
                </span>
                <span className="text-[10px] text-slate-400">Match da vaga</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ai')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>Otimizador IA</span>
                </span>
                <span className="text-[10px] text-slate-400">Google XYZ</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('interview')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Simulador de Entrevista</span>
                </span>
                <span className="text-[10px] text-slate-400">Método STAR</span>
              </button>

              {onOpenTemplateAdvisor && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTemplateAdvisor();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Modelos Internacionais</span>
                  </span>
                  <span className="text-[10px] text-slate-400">9 formatos</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border-t border-amber-200"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Painel Administrativo (SaaS)</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (!isAuthenticated) {
                  onOpenAuthModal();
                } else {
                  onOpenMyResumesModal();
                }
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
                  onOpenUserProfile ? onOpenUserProfile() : setActiveTab('profile');
                }}
                className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Minha Conta</span>
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
                <span>Entrar / Registar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
