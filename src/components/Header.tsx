import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  FolderOpen,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Home,
  FileText,
  Menu,
  X,
  Mail,
  ShieldCheck,
  Lock,
  Receipt,
  Check,
  LayoutGrid,
  CreditCard,
  Bell,
  CheckCheck,
  Settings,
  Sun,
  Moon,
  MessageCircle,
  ArrowRight,
  Printer,
  Upload,
  Briefcase,
  Wand2,
  Target,
  MessageSquare,
  Globe
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
  onExportPdf?: () => void;
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

type OpenHeaderMenu = 'more' | 'lang' | 'export' | 'notif' | 'user' | null;

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportWord,
  onExportPdf,
  isExportingWord,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenMyResumesModal,
  onOpenAdminDashboard,
  onOpenUserProfile,
  onOpenNotificationPreferences,
  onOpenSupportChat,
  supportChatUnreadCount = 0
}) => {
  const { user, firebaseUser, isAuthenticated, hasActivePlan, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const {
    siteLanguage,
    setSiteLanguage,
    siteLanguages,
    siteText
  } = useLanguage();
  const { isDark, setTheme, toggleTheme } = useTheme();
  const themeCopy = THEME_UI_COPY[siteLanguage] || THEME_UI_COPY.en;
  const studioNav = STUDIO_NAV_TRANSLATIONS[siteLanguage] || STUDIO_NAV_TRANSLATIONS.en;
  const h = siteText.header;

  const [openMenu, setOpenMenu] = useState<OpenHeaderMenu>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 56,
    left: 12,
    width: 280
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const userAvatarSrc = user?.avatarUrl || firebaseUser?.photoURL || '';
  const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();
  const hasUnreadSupportMsg = supportChatUnreadCount > 0;

  const localizedCopy = (() => {
    switch (siteLanguage) {
      case 'en':
        return {
          createCv: 'Create CV',
          models: 'Templates',
          more: 'More',
          exportCv: activeTab === 'cover' ? 'Export Letter' : 'Export CV',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Apply to Jobs',
          settings: 'Settings',
          language: 'Language',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Support',
          tools: 'Tools'
        };
      case 'es':
        return {
          createCv: 'Crear CV',
          models: 'Plantillas',
          more: 'Más',
          exportCv: activeTab === 'cover' ? 'Exportar Carta' : 'Exportar CV',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Aplicar a Vacantes',
          settings: 'Ajustes',
          language: 'Idioma',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Soporte',
          tools: 'Herramientas'
        };
      case 'fr':
        return {
          createCv: 'Créer CV',
          models: 'Modèles',
          more: 'Plus',
          exportCv: activeTab === 'cover' ? 'Exporter Lettre' : 'Exporter CV',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Postuler aux Offres',
          settings: 'Réglages',
          language: 'Langue',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Support',
          tools: 'Outils'
        };
      case 'de':
        return {
          createCv: 'CV erstellen',
          models: 'Vorlagen',
          more: 'Mehr',
          exportCv: activeTab === 'cover' ? 'Schreiben exportieren' : 'CV exportieren',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Auf Jobs bewerben',
          settings: 'Einstellungen',
          language: 'Sprache',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Support',
          tools: 'Werkzeuge'
        };
      case 'it':
        return {
          createCv: 'Crea CV',
          models: 'Modelli',
          more: 'Altro',
          exportCv: activeTab === 'cover' ? 'Esporta Lettera' : 'Esporta CV',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Candidati alle Offerte',
          settings: 'Impostazioni',
          language: 'Lingua',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Supporto',
          tools: 'Strumenti'
        };
      default:
        return {
          createCv: 'Criar CV',
          models: 'Modelos',
          more: 'Mais',
          exportCv: activeTab === 'cover' ? 'Exportar Carta' : 'Exportar CV',
          downloadPdf: 'PDF (.pdf)',
          downloadWord: 'Word (.docx)',
          applyJobs: 'Aplicar a vagas',
          settings: 'Ajustes',
          language: 'Idioma',
          themeLabel: isDark ? themeCopy.light : themeCopy.dark,
          support: 'Suporte',
          tools: 'Ferramentas'
        };
    }
  })();

  useEffect(() => {
    setAvatarLoadError(false);
  }, [userAvatarSrc]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }
    void loadNotificationPreferences(user.id).catch(() => {});
    const unsub = subscribeToUserNotifications(user.id, setNotifications);
    return () => unsub();
  }, [isAuthenticated, user?.id]);

  const computePopoverPos = useCallback((menu: OpenHeaderMenu) => {
    if (!menu) return;
    const triggerEl =
      menu === 'more'
        ? moreBtnRef.current
        : menu === 'lang'
        ? langBtnRef.current
        : menu === 'notif'
        ? notifBtnRef.current
        : menu === 'export'
        ? exportBtnRef.current
        : userBtnRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;
    const targetWidth =
      menu === 'more' ? 316 : menu === 'notif' ? 320 : menu === 'lang' ? 232 : menu === 'export' ? 240 : 250;
    const width = Math.min(targetWidth, vw - margin * 2);
    const preferredLeft = menu === 'more' ? rect.left : rect.right - width;
    const left = Math.max(margin, Math.min(preferredLeft, vw - width - margin));
    const top = Math.max(margin, Math.min(rect.bottom + 8, vh - 180));
    setMenuPos({ top, left, width });
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    computePopoverPos(openMenu);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        moreBtnRef.current?.contains(target) ||
        langBtnRef.current?.contains(target) ||
        notifBtnRef.current?.contains(target) ||
        exportBtnRef.current?.contains(target) ||
        userBtnRef.current?.contains(target)
      ) {
        return;
      }
      setOpenMenu(null);
    };
    const handleReposition = () => computePopoverPos(openMenu);

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [openMenu, computePopoverPos]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  const unreadCount = notifications.filter((n) => n.channelSystem && !n.read).length;
  const isAdmin = isUserAdmin(user?.email, user?.role);
  const isStudioTab = ['raw', 'editor', 'ats', 'jobs', 'ai', 'cover', 'interview'].includes(activeTab);
  const isShowcaseActive = ['models-cv', 'examples-cv', 'models-cover', 'examples-cover'].includes(activeTab);
  const isMoreTabActive = ['raw', 'ats', 'jobs', 'ai', 'cover', 'interview'].includes(activeTab);

  const toggleMenu = (menu: Exclude<OpenHeaderMenu, null>) => {
    setMobileMenuOpen(false);
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSelectNav = (tab: AppTab) => {
    setActiveTab(tab);
    setOpenMenu(null);
    setMobileMenuOpen(false);
  };

  const handleOpenStudioStart = () => {
    const nextTab: AppTab = activeTab === 'raw' ? 'raw' : 'editor';
    handleSelectNav(nextTab);
  };

  const handlePdfAction = () => {
    setOpenMenu(null);
    if (onExportPdf) {
      onExportPdf();
    } else {
      onExportWord();
    }
  };

  const handleOpenChat = () => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      onOpenAuthModal();
    } else if (onOpenSupportChat) {
      onOpenSupportChat();
    }
  };

  const handleOpenNotifs = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      onOpenAuthModal();
    } else {
      toggleMenu('notif');
    }
  };

  return (
    <header className="no-print bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
        {/* Zone 1: Brand */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelectNav('home');
          }}
          className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white hover:text-slate-700 transition-colors flex items-center gap-1.5 sm:gap-2 min-w-0 shrink touch-manipulation"
        >
          <span className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] tracking-tight shrink-0 shadow-xs">
            CE
          </span>
          <span className="truncate max-w-[68px] min-[420px]:max-w-[125px] sm:max-w-[165px] xl:max-w-none">{siteText.brandName}</span>
        </a>

        {/* Zone 2: Streamlined Desktop Navigation (Início · Criar CV · Modelos · Planos · ☰ Mais) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectNav('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'home'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>{h.navHome}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenStudioStart}
            title={studioNav.tabs.editor.tooltip}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'editor'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{localizedCopy.createCv}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('models-cv')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isShowcaseActive
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{localizedCopy.models}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              onOpenPricingModal();
            }}
            className="px-3 py-1.5 rounded-lg hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>{h.navPricing}</span>
          </button>

          {/* ☰ Mais Dropdown (Ajustes · Idioma · Importar CV · Ferramentas) */}
          <button
            ref={moreBtnRef}
            type="button"
            onClick={() => toggleMenu('more')}
            aria-expanded={openMenu === 'more'}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              openMenu === 'more' || isMoreTabActive
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Menu className="w-3.5 h-3.5 shrink-0" />
            <span>{localizedCopy.more}</span>
            {(unreadCount > 0 || hasUnreadSupportMsg) && (
              <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                {unreadCount + supportChatUnreadCount}
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform ${
                openMenu === 'more' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </nav>

        {/* Zone 3: Language + Theme + Chat + Account + Primary CTA + Mobile Drawer */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Visible Language Selector */}
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => toggleMenu('lang')}
            aria-expanded={openMenu === 'lang'}
            title={localizedCopy.language}
            aria-label={localizedCopy.language}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              openMenu === 'lang'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono uppercase">{siteLanguage}</span>
          </button>

          {/* Visible Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={localizedCopy.themeLabel}
            aria-label={localizedCopy.themeLabel}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 shrink-0" />
            )}
          </button>

          {/* Visible Notifications Bell Trigger */}
          <button
            ref={notifBtnRef}
            type="button"
            onClick={handleOpenNotifs}
            aria-expanded={openMenu === 'notif'}
            title={h.notificationsTitle}
            aria-label={h.notificationsTitle}
            className={`relative min-w-[34px] sm:min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-lg border transition-colors shrink-0 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              openMenu === 'notif'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            {isAuthenticated && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold tabular-nums flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Visible Support Chat Trigger */}
          {onOpenSupportChat && (
            <button
              type="button"
              onClick={handleOpenChat}
              title={localizedCopy.support}
              aria-label={localizedCopy.support}
              className="relative min-w-[34px] sm:min-w-[36px] min-h-[36px] px-1.5 sm:px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">Chat</span>
              {isAuthenticated && hasUnreadSupportMsg && (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                  {supportChatUnreadCount > 9 ? '9+' : supportChatUnreadCount}
                </span>
              )}
            </button>
          )}

          {isAuthenticated && user ? (
            <button
              ref={userBtnRef}
              type="button"
              onClick={() => toggleMenu('user')}
              aria-expanded={openMenu === 'user'}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-0.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 touch-manipulation"
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
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              aria-label={h.signIn}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 touch-manipulation"
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden min-[400px]:inline">{h.signIn}</span>
            </button>
          )}

          {/* Single Authoritative Primary CTA */}
          {isStudioTab ? (
            <button
              ref={exportBtnRef}
              type="button"
              onClick={() => toggleMenu('export')}
              disabled={isExportingWord}
              aria-expanded={openMenu === 'export'}
              className={`hidden lg:flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-colors rounded-lg whitespace-nowrap shrink-0 shadow-xs touch-manipulation ${
                !isAuthenticated || !hasActivePlan
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {!isAuthenticated || !hasActivePlan ? (
                <Lock className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isExportingWord ? h.exporting : localizedCopy.exportCv}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  openMenu === 'export' ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenStudioStart}
              className="min-h-[38px] hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs touch-manipulation"
            >
              <span>{localizedCopy.createCv}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              setMobileMenuOpen((prev) => !prev);
            }}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 touch-manipulation"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Viewport-Clamped Fixed Floating Popover (Mais / Exportar / Notifications / User) */}
      {openMenu && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/10 sm:bg-transparent"
            onClick={() => setOpenMenu(null)}
          />
          <div
            ref={popoverRef}
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            className="fixed z-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {openMenu === 'lang' && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>{localizedCopy.language}</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {siteLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSiteLanguage(lang.code);
                        setOpenMenu(null);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                        siteLanguage === lang.code
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.nativeName || lang.name}</span>
                      </span>
                      <span className="font-mono text-[10px] uppercase opacity-80 shrink-0">
                        {lang.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {openMenu === 'export' && (
              <div className="p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={handlePdfAction}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-2.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{localizedCopy.downloadPdf}</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingWord}
                  onClick={() => {
                    setOpenMenu(null);
                    onExportWord();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                  <span>{isExportingWord ? h.exporting : localizedCopy.downloadWord}</span>
                </button>
              </div>
            )}

            {openMenu === 'more' && (
              <div className="p-2.5 space-y-2.5 max-h-[78dvh] overflow-y-auto">
                {/* 1. Importar CV & 2. Ferramentas (Collapsible Submenu) */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectNav('raw')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                      activeTab === 'raw'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200'
                        : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{studioNav.tabs.raw.label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMoreToolsOpen((prev) => !prev)}
                    aria-expanded={moreToolsOpen}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{localizedCopy.tools}</span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        moreToolsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {moreToolsOpen && (
                    <div className="pl-3 space-y-0.5 border-l border-slate-200 dark:border-slate-700 ml-3">
                      <button
                        type="button"
                        onClick={() => handleSelectNav('jobs')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          activeTab === 'jobs'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{localizedCopy.applyJobs}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNav('ai')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          activeTab === 'ai'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{studioNav.tabs.ai.label}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNav('ats')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          activeTab === 'ats'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{studioNav.tabs.ats.label}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNav('cover')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          activeTab === 'cover'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{h.toolCover}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectNav('interview')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          activeTab === 'interview'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>{studioNav.tabs.interview.label}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Idioma */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span>{localizedCopy.language}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {siteLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSiteLanguage(lang.code);
                          setOpenMenu(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                          siteLanguage === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="font-mono">{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Ajustes: Tema + Moeda + Notificações/Suporte */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
                  <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {localizedCopy.settings}
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{localizedCopy.themeLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>

                  <div className="grid grid-cols-3 gap-1 px-1">
                    {Object.values(CURRENCIES).slice(0, 6).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c.code);
                          setOpenMenu(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors ${
                          currency === c.code
                            ? 'font-semibold text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-mono">{c.code}</span>
                      </button>
                    ))}
                  </div>

                  {isAuthenticated && user && (
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <button
                        type="button"
                        onClick={() => setOpenMenu('notif')}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-slate-500" />
                          <span>{h.notificationsTitle}</span>
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold tabular-nums">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {onOpenSupportChat && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            onOpenSupportChat();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{localizedCopy.support}</span>
                          </span>
                          {hasUnreadSupportMsg && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tabular-nums">
                              {supportChatUnreadCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {openMenu === 'notif' && isAuthenticated && user && (
              <div>
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/60">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {h.notificationsTitle}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsAsRead(user.id, notifications)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{h.markAllRead}</span>
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      {h.noNotifications}
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void markNotificationAsRead(user.id, item.id)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors space-y-1 ${
                          !item.read && item.channelSystem
                            ? 'bg-amber-50/50 dark:bg-amber-500/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString(siteLanguage, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                          {item.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      if (onOpenNotificationPreferences) {
                        onOpenNotificationPreferences();
                      } else {
                        setActiveTab('profile');
                      }
                    }}
                    className="w-full py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{h.configureNotifs}</span>
                  </button>
                </div>
              </div>
            )}

            {openMenu === 'user' && isAuthenticated && user && (
              <div className="py-1.5 max-h-[75dvh] overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 shrink-0">
                      {user.plan === 'executive' ? 'VIP' : user.plan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenMyResumesModal();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>{h.myResumes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenUserProfile ? onOpenUserProfile() : setActiveTab('profile');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{h.myProfile}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenUserProfile?.();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  <span>{h.subscriptionInvoices}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenPricingModal();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>{h.managePlan}</span>
                </button>

                {onOpenSupportChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenSupportChat();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{localizedCopy.support}</span>
                    </span>
                    {hasUnreadSupportMsg && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {supportChatUnreadCount}
                      </span>
                    )}
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenAdminDashboard();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{h.adminPanel}</span>
                  </button>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{h.signOut}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Clean, Responsive Mobile Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] px-4 py-4 space-y-3 shadow-xl max-h-[82dvh] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
          {/* Core 4 Links */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectNav('home')}
              className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{h.navHome}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenStudioStart}
              className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{localizedCopy.createCv}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('models-cv')}
              className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                isShowcaseActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>{localizedCopy.models}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPricingModal();
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 touch-manipulation"
            >
              <CreditCard className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{h.navPricing}</span>
            </button>
          </div>

          {/* Tools inside Mobile Menu */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectNav('jobs')}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 touch-manipulation"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{localizedCopy.applyJobs}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('raw')}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 touch-manipulation"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{studioNav.tabs.raw.shortLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('cover')}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 touch-manipulation"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{h.toolCover}</span>
            </button>

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
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 touch-manipulation"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{h.mobileMyResumes}</span>
            </button>
          </div>

          {/* Language & Theme compact bar */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {siteLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSiteLanguage(lang.code)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    siteLanguage === lang.code
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label={themeCopy.light}
                className={`p-1.5 rounded-md transition-colors ${
                  !isDark ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label={themeCopy.dark}
                className={`p-1.5 rounded-md transition-colors ${
                  isDark ? 'bg-amber-400 text-slate-950' : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Account / Admin / Support / Notifications */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenNotifs}
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 touch-manipulation"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{h.notificationsTitle}</span>
              {isAuthenticated && unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold tabular-nums flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {onOpenSupportChat && (
              <button
                type="button"
                onClick={handleOpenChat}
                className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 touch-manipulation"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>Chat · {localizedCopy.support}</span>
                {isAuthenticated && hasUnreadSupportMsg && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                    {supportChatUnreadCount > 9 ? '9+' : supportChatUnreadCount}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenUserProfile ? onOpenUserProfile() : setActiveTab('profile');
                  }}
                  className="flex-1 min-h-[44px] py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>{h.mobileMyAccount}</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminDashboard();
                    }}
                    className="w-full min-h-[44px] py-2 px-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{h.adminPanel}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="flex-1 min-h-[44px] py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
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
