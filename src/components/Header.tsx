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
  ArrowRight
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

type OpenHeaderMenu = 'prefs' | 'notif' | 'user' | null;

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportWord,
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
    currentSiteLanguage,
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
    width: 260
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const prefsBtnRef = useRef<HTMLButtonElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const userAvatarSrc = user?.avatarUrl || firebaseUser?.photoURL || '';
  const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();
  const hasUnreadSupportMsg = supportChatUnreadCount > 0;
  const newSupportMsgLabel =
    siteLanguage === 'en'
      ? 'New message'
      : siteLanguage === 'es'
      ? 'Nuevo mensaje'
      : siteLanguage === 'fr'
      ? 'Nouveau message'
      : siteLanguage === 'de'
      ? 'Neue Nachricht'
      : siteLanguage === 'it'
      ? 'Nuovo messaggio'
      : 'Nova mensagem';

  const createCvLabel =
    siteLanguage === 'en'
      ? 'Create CV'
      : siteLanguage === 'es'
      ? 'Crear CV'
      : siteLanguage === 'fr'
      ? 'Créer CV'
      : siteLanguage === 'de'
      ? 'CV erstellen'
      : siteLanguage === 'it'
      ? 'Crea CV'
      : 'Criar CV';

  const modelsLabel =
    siteLanguage === 'en'
      ? 'Templates'
      : siteLanguage === 'es'
      ? 'Plantillas'
      : siteLanguage === 'fr'
      ? 'Modèles'
      : siteLanguage === 'de'
      ? 'Vorlagen'
      : siteLanguage === 'it'
      ? 'Modelli'
      : 'Modelos';

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
      menu === 'prefs'
        ? prefsBtnRef.current
        : menu === 'notif'
        ? notifBtnRef.current
        : userBtnRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;
    const targetWidth = menu === 'notif' ? 320 : menu === 'prefs' ? 256 : 240;
    const width = Math.min(targetWidth, vw - margin * 2);
    const left = Math.max(margin, Math.min(rect.right - width, vw - width - margin));
    const top = Math.max(margin, Math.min(rect.bottom + 8, vh - 160));
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
        prefsBtnRef.current?.contains(target) ||
        notifBtnRef.current?.contains(target) ||
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
    const nextTab: AppTab = activeTab === 'editor' ? 'editor' : 'raw';
    handleSelectNav(nextTab);
  };

  return (
    <header className="no-print bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Zone 1: Brand */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelectNav('home');
          }}
          className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white hover:text-slate-700 transition-colors flex items-center gap-2 min-w-0 shrink touch-manipulation"
        >
          <span className="w-7 h-7 rounded-md bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center font-bold text-[11px] tracking-tight shrink-0">
            CE
          </span>
          <span className="truncate">{siteText.brandName}</span>
        </a>

        {/* Zone 2: Calm 4-Link Desktop Navigation */}
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
            title={studioNav.tabs.raw.tooltip}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isStudioTab
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{createCvLabel}</span>
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
            <span>{modelsLabel}</span>
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
        </nav>

        {/* Zone 3: Theme + Language + Account + Single Primary Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Light / Dark Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? themeCopy.switchToLight : themeCopy.switchToDark}
            title={isDark ? themeCopy.switchToLight : themeCopy.switchToDark}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-700 dark:text-amber-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 touch-manipulation"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language & Currency Selector */}
          <button
            ref={prefsBtnRef}
            type="button"
            onClick={() => toggleMenu('prefs')}
            aria-expanded={openMenu === 'prefs'}
            className="min-h-[36px] flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 touch-manipulation"
            title={`${h.siteLangLabel} · ${h.currencyLabel}`}
            aria-label={`${h.siteLangLabel}: ${currentSiteLanguage.code.toUpperCase()}`}
          >
            <span className="font-mono text-[11px] font-bold">
              {currentSiteLanguage.code.toUpperCase()}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform ${
                openMenu === 'prefs' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Notifications (Authenticated only) */}
          {isAuthenticated && user && (
            <button
              ref={notifBtnRef}
              type="button"
              onClick={() => toggleMenu('notif')}
              aria-expanded={openMenu === 'notif'}
              className="relative min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 touch-manipulation"
              title={h.notificationsTitle}
              aria-label={h.notificationsTitle}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tabular-nums flex items-center justify-center leading-none border border-white dark:border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Support Chat quick button (Authenticated only, compact icon on mobile) */}
          {isAuthenticated && user && onOpenSupportChat && (
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onOpenSupportChat();
              }}
              className={`hidden sm:flex relative min-w-[36px] min-h-[36px] items-center justify-center gap-1.5 rounded-lg border transition-colors shrink-0 touch-manipulation ${
                hasUnreadSupportMsg
                  ? 'px-2.5 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                  : 'p-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              title={
                hasUnreadSupportMsg
                  ? `${newSupportMsgLabel} (${supportChatUnreadCount})`
                  : 'Suporte'
              }
              aria-label="Suporte"
            >
              <MessageCircle className="w-4 h-4" />
              {hasUnreadSupportMsg && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tabular-nums flex items-center justify-center leading-none">
                  {supportChatUnreadCount > 9 ? '9+' : supportChatUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* Account Menu / Sign In */}
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
              className="min-h-[36px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 touch-manipulation"
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{h.signIn}</span>
            </button>
          )}

          {/* Single Context-Aware Primary CTA */}
          {isStudioTab ? (
            <button
              type="button"
              onClick={onExportWord}
              disabled={isExportingWord}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors rounded-lg whitespace-nowrap shrink-0 touch-manipulation ${
                !isAuthenticated || !hasActivePlan
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 text-white dark:text-slate-950'
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
          ) : (
            <button
              type="button"
              onClick={handleOpenStudioStart}
              className="min-h-[36px] hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 touch-manipulation"
            >
              <span>{createCvLabel}</span>
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

      {/* Viewport-Clamped Fixed Floating Popover (Prefs / Notifications / User) */}
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
            {openMenu === 'prefs' && (
              <div className="p-2.5 space-y-2.5 max-h-[75dvh] overflow-y-auto">
                <div>
                  <div className="px-2 pt-0.5 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {h.siteLangLabel}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {siteLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSiteLanguage(lang.code);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          siteLanguage === lang.code
                            ? 'font-semibold text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        {siteLanguage === lang.code ? (
                          <Check className="w-3.5 h-3.5 text-slate-900 dark:text-amber-400" />
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400">
                            {lang.code.toUpperCase()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
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
                          setOpenMenu(null);
                        }}
                        className={`text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currency === c.code
                            ? 'font-semibold text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                            ? 'bg-amber-50/50 dark:bg-amber-500/10 border-l-2 border-l-amber-500'
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
                      <span>Suporte</span>
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

      {/* Clean, Minimal Mobile Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] px-4 py-4 space-y-3 shadow-xl max-h-[82dvh] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
          {/* Primary Navigation Links */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectNav('home')}
              className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                activeTab === 'home'
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
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
                isStudioTab
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{createCvLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('models-cv')}
              className={`min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors touch-manipulation ${
                isShowcaseActive
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>{modelsLabel}</span>
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

          {/* Quick Secondary Links */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectNav('cover')}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>{h.toolCover}</span>
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
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>{h.mobileMyResumes}</span>
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
                      ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
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
                  !isDark ? 'bg-slate-900 text-white' : 'text-slate-500'
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

          {/* Account / Admin / Support */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isAuthenticated && user ? (
              <>
                {onOpenSupportChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSupportChat();
                    }}
                    className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-900 touch-manipulation"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{hasUnreadSupportMsg ? newSupportMsgLabel : 'Suporte'}</span>
                    {hasUnreadSupportMsg && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {supportChatUnreadCount > 9 ? '9+' : supportChatUnreadCount}
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
                className="w-full min-h-[44px] py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
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
