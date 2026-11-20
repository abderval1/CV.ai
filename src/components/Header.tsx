import React, { useState } from 'react';
import {
  Download,
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
  Mail,
  ShieldCheck,
  UploadCloud,
  MessageSquare,
  Lock,
  Receipt,
  Loader2,
  Check,
  LayoutGrid,
  Briefcase,
  SlidersHorizontal,
  CreditCard,
  FileCheck2,
  Bell,
  CheckCheck,
  Settings,
  Sun,
  Moon,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, THEME_UI_COPY } from '../context/ThemeContext';
import { STUDIO_NAV_TRANSLATIONS } from '../i18n/studioNavTranslations';
import { isUserAdmin } from '../services/saasDbService';
import { UserNotificationItem } from '../types/cv';
import {
  loadNotificationPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToUserNotifications
} from '../services/notificationService';

export type AppTab =
  | 'home'
  | 'raw'
  | 'editor'
  | 'ats'
  | 'jobs'
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
  onOpenNotificationPreferences?: () => void;
  onOpenSupportChat?: () => void;
  supportChatUnreadCount?: number;
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
  onOpenNotificationPreferences,
  onOpenSupportChat,
  supportChatUnreadCount = 0
}) => {
  const { user, firebaseUser, isAuthenticated, hasActivePlan, logout } = useAuth();
  const { currency, setCurrency, config: currencyConfig } = useCurrency();
  const {
    siteLanguage,
    setSiteLanguage,
    currentSiteLanguage,
    siteLanguages,
    siteText
  } = useLanguage();
  const { isDark, setTheme, toggleTheme } = useTheme();
  const themeCopy = THEME_UI_COPY[siteLanguage] || THEME_UI_COPY.pt;
  const studioNav = STUDIO_NAV_TRANSLATIONS[siteLanguage] || STUDIO_NAV_TRANSLATIONS.pt;
  const h = siteText.header;

  const [showcaseDropdownOpen, setShowcaseDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [prefsDropdownOpen, setPrefsDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const userAvatarSrc = user?.avatarUrl || firebaseUser?.photoURL || '';
  const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  React.useEffect(() => {
    setAvatarLoadError(false);
  }, [userAvatarSrc]);

  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }
    void loadNotificationPreferences(user.id).catch(() => {});
    const unsub = subscribeToUserNotifications(user.id, setNotifications);
    return () => unsub();
  }, [isAuthenticated, user?.id]);

  const unreadCount = notifications.filter((n) => n.channelSystem && !n.read).length;

  const isAdmin = isUserAdmin(user?.email, user?.role);
  const isToolActive = ['raw', 'ats', 'jobs', 'ai', 'interview', 'cover'].includes(activeTab);
  const isShowcaseActive = ['models-cv', 'examples-cv', 'models-cover', 'examples-cover'].includes(activeTab);

  const showcaseLabels: Record<string, string> = {
    'models-cv': h.showcaseModelsCv,
    'examples-cv': h.showcaseExamplesCv,
    'models-cover': h.showcaseModelsCover,
    'examples-cover': h.showcaseExamplesCover
  };

  const toolLabels: Record<string, string> = {
    cover: h.toolCover,
    jobs: h.toolJobs,
    raw: h.toolRaw,
    ats: h.toolAts,
    ai: h.toolAi,
    interview: h.toolInterview
  };

  const handleSelectTool = (tab: 'raw' | 'ats' | 'jobs' | 'ai' | 'cover' | 'interview') => {
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

  const handleOpenEditorStart = () => {
    // Start at the 1st Studio tab (Importar) whenever entering the Editor from outside
    const nextTab: AppTab = activeTab === 'editor' ? 'editor' : 'raw';
    handleSelectNav(nextTab);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        {/* Zone 1: Clean Brand Lockup */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelectNav('home');
          }}
          className="text-sm sm:text-base font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors flex items-center gap-2 min-w-0 shrink touch-manipulation"
        >
          <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] tracking-tight shrink-0">
            CE
          </span>
          <span className="truncate">{siteText.brandName}</span>
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
            <span>{h.navHome}</span>
          </button>

          {/* Public Gallery Dropdown */}
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
              <span>{isShowcaseActive ? showcaseLabels[activeTab] : h.navModelsExamples}</span>
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
                    {h.showcaseCvHeader}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('models-cv')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'models-cv' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.showcaseModelsCv}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.showcaseModelsCvDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('examples-cv')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'examples-cv' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.showcaseExamplesCv}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.showcaseExamplesCvDesc}</p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {h.showcaseCoverHeader}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('models-cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'models-cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.showcaseModelsCover}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.showcaseModelsCoverDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectNav('examples-cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'examples-cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.showcaseExamplesCover}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.showcaseExamplesCoverDesc}</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenEditorStart}
            title={studioNav.tabs.raw.tooltip}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'editor' || activeTab === 'raw'
                ? 'bg-slate-100 text-slate-950 font-semibold'
                : 'hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{h.navEditor}</span>
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
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{isToolActive ? toolLabels[activeTab] || h.navTools : h.navTools}</span>
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
                    {h.toolsDocsHeader}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('cover')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'cover' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolCover}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolCoverDesc}</p>
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
                      <Globe className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{h.toolAdvisor}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{h.toolAdvisorDesc}</p>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {h.toolsAnalysisHeader}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('raw')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'raw' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolRaw}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolRawDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('ats')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'ats' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Target className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolAts}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolAtsDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('jobs')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'jobs' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolJobs}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolJobsDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('ai')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'ai' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolAi}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolAiDesc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTool('interview')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                      activeTab === 'interview' ? 'bg-slate-50 text-slate-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{h.toolInterview}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.toolInterviewDesc}</p>
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
            <span>{h.navPricing}</span>
          </button>
        </nav>

        {/* Zone 3: Website UI Language + Currency + Theme Toggle + Account + Primary Export CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Quick Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? themeCopy.switchToLight : themeCopy.switchToDark}
            title={isDark ? themeCopy.switchToLight : themeCopy.switchToDark}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-700 dark:text-amber-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 touch-manipulation"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Independent Website UI Language & Currency Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPrefsDropdownOpen(!prefsDropdownOpen);
                setToolsDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title={`${h.siteLangLabel} · ${h.currencyLabel}`}
            >
              <span className="text-sm leading-none">{currentSiteLanguage.flag}</span>
              <span className="font-mono text-[11px] font-semibold text-slate-800">
                {currentSiteLanguage.code.toUpperCase()}
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
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-1 space-y-2.5">
                  {/* Independent Website UI Language Section (6 languages, free for everyone) */}
                  <div>
                    <div className="px-2 pt-0.5 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        {h.siteLangLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                        {h.siteLangHint}
                      </span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {siteLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSiteLanguage(lang.code);
                            setPrefsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            siteLanguage === lang.code
                              ? 'font-semibold text-slate-950 bg-slate-100/90'
                              : 'text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </span>
                          {siteLanguage === lang.code ? (
                            <Check className="w-3.5 h-3.5 text-slate-900" />
                          ) : (
                            <span className="font-mono text-[10px] text-slate-400">
                              {lang.code.toUpperCase()}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency Section */}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {h.currencyLabel}
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

          {/* System Notifications Bell (Authenticated Users) */}
          {isAuthenticated && user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setUserDropdownOpen(false);
                  setPrefsDropdownOpen(false);
                  setToolsDropdownOpen(false);
                  setShowcaseDropdownOpen(false);
                }}
                className="relative min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title={h.notificationsTitle}
                aria-label={h.notificationsTitle}
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tabular-nums flex items-center justify-center leading-none border border-white dark:border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80">
                      <span className="text-xs font-bold text-slate-900">
                        {h.notificationsTitle}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => void markAllNotificationsAsRead(user.id, notifications)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{h.markAllRead}</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          {h.noNotifications}
                        </div>
                      ) : (
                        notifications.slice(0, 12).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => void markNotificationAsRead(user.id, item.id)}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors space-y-1 ${
                              !item.read && item.channelSystem
                                ? 'bg-amber-50/45 border-l-2 border-l-amber-500'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                                {!item.read && item.channelSystem && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 shrink-0">
                                    {h.newBadge}
                                  </span>
                                )}
                                <span className="truncate">{item.title}</span>
                              </span>
                              <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                                {new Date(item.createdAt).toLocaleTimeString(siteLanguage, {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                              {item.message}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {item.channelSystem && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                  {h.notifSystem}
                                </span>
                              )}
                              {item.channelEmail && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                  {item.emailDeliveryStatus === 'sent' ? h.notifEmailSent : h.notifEmailQueued}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          if (onOpenNotificationPreferences) {
                            onOpenNotificationPreferences();
                          } else {
                            setActiveTab('profile');
                          }
                        }}
                        className="w-full py-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center justify-center gap-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-600" />
                        <span>{h.configureNotifs}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Direct Support Chat Icon (Registered Users) */}
          {isAuthenticated && user && onOpenSupportChat && (
            <button
              type="button"
              onClick={() => {
                setNotifDropdownOpen(false);
                setUserDropdownOpen(false);
                setPrefsDropdownOpen(false);
                setToolsDropdownOpen(false);
                setShowcaseDropdownOpen(false);
                onOpenSupportChat();
              }}
              className="relative min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              title="Chat de Suporte (Admin / Moderador)"
              aria-label="Chat de Suporte"
            >
              <MessageCircle className="w-4 h-4 text-slate-700" />
              {supportChatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold tabular-nums flex items-center justify-center leading-none border border-white dark:border-slate-900">
                  {supportChatUnreadCount > 9 ? '9+' : supportChatUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* Account Menu (Unified for Authenticated & Unauthenticated) */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setPrefsDropdownOpen(false);
                  setNotifDropdownOpen(false);
                  setToolsDropdownOpen(false);
                }}
                className="flex items-center justify-center p-0.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-colors shrink-0"
                title={user.name || h.myProfile}
                aria-label={user.name || h.myProfile}
              >
                {userAvatarSrc && !avatarLoadError ? (
                  <img
                    src={userAvatarSrc}
                    alt={user.name || h.myProfile}
                    onError={() => setAvatarLoadError(true)}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {userInitial}
                  </span>
                )}
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
                      <span>{h.myResumes}</span>
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
                      <span>{h.myProfile}</span>
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
                      <span>{h.subscriptionInvoices}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenNotificationPreferences) {
                          onOpenNotificationPreferences();
                        } else {
                          setActiveTab('profile');
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span>{h.notifPreferences}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPricingModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>{h.managePlan}</span>
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
                        <span>{h.adminPanel}</span>
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
                      <span>{h.signOut}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap touch-manipulation"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{h.signIn}</span>
            </button>
          )}

          {/* Primary Export CTA */}
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-lg whitespace-nowrap shrink-0 touch-manipulation ${
              !isAuthenticated || !hasActivePlan
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold'
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
                ? h.exporting
                : activeTab === 'cover'
                ? h.downloadCover
                : h.downloadWord}
            </span>
            <span className="sm:hidden">
              {activeTab === 'cover' ? h.downloadCoverShort : h.downloadWordShort}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 touch-manipulation"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Clean Grouped Mobile Drawer (No duplicate items) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
          {/* Theme Mode Switcher (Light / Dark) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {themeCopy.themeLabel}
            </span>
            <div className="inline-flex items-center p-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  !isDark
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{themeCopy.light}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{themeCopy.dark}</span>
              </button>
            </div>
          </div>

          {/* Website UI Language Switcher row (independent of CV translation) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {h.siteLangLabel}
              </span>
              <span className="text-[10px] text-slate-400 truncate">{h.siteLangHint}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {siteLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSiteLanguage(lang.code)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    siteLanguage === lang.code
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {h.mobileWorkspace}
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
                <span>{h.navHome}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEditorStart}
                title={studioNav.tabs.raw.tooltip}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'editor' || activeTab === 'raw' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{h.navEditor}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav('cover')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{h.downloadCoverShort}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPricingModal();
                }}
                className="min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 touch-manipulation"
              >
                <CreditCard className="w-4 h-4 shrink-0 text-amber-700" />
                <span>{h.navPricing}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {h.mobileShowcaseTitle}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectNav('models-cv')}
                className={`min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
                  activeTab === 'models-cv' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="truncate">{h.showcaseModelsCv}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('examples-cv')}
                className={`min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
                  activeTab === 'examples-cv' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="truncate">{h.showcaseExamplesCv}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('models-cover')}
                className={`min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
                  activeTab === 'models-cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{h.showcaseModelsCover}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('examples-cover')}
                className={`min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
                  activeTab === 'examples-cover' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{h.showcaseExamplesCover}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {h.mobileToolsTitle}
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelectTool('raw')}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
              >
                <span className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>{h.toolRaw}</span>
                </span>
                <span className="text-[10px] text-slate-400">PDF / Word</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ats')}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
              >
                <span className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-slate-600" />
                  <span>{h.toolAts}</span>
                </span>
                <span className="text-[10px] text-slate-400">ATS</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('jobs')}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                  <span>{h.toolJobs}</span>
                </span>
                <span className="text-[10px] text-slate-400">Live</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('ai')}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
              >
                <span className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                  <span>{h.toolAi}</span>
                </span>
                <span className="text-[10px] text-slate-400">XYZ</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTool('interview')}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  <span>{h.toolInterview}</span>
                </span>
                <span className="text-[10px] text-slate-400">STAR</span>
              </button>

              {onOpenTemplateAdvisor && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTemplateAdvisor();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 touch-manipulation"
                >
                  <span className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-slate-600" />
                    <span>{h.toolAdvisor}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">9</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border-t border-amber-200 touch-manipulation"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>{h.adminPanel}</span>
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
              className="flex-1 min-h-[44px] py-2 px-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{h.mobileMyResumes}</span>
            </button>

            {isAuthenticated && user ? (
              <>
                {onOpenSupportChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSupportChat();
                    }}
                    className="relative min-h-[44px] py-2 px-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Suporte</span>
                    {supportChatUnreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        {supportChatUnreadCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenUserProfile ? onOpenUserProfile() : setActiveTab('profile');
                  }}
                  className="flex-1 min-h-[44px] py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>{h.mobileMyAccount}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="flex-1 min-h-[44px] py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{h.mobileSignInRegister}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
