import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  QrCode,
  FolderOpen,
  Calendar,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Copy,
  LogOut,
  Save,
  Download,
  Trash2,
  FileText,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Crown,
  Activity,
  RefreshCw,
  Bell,
  Mail,
  Monitor,
  CheckCheck,
  Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { CVData, NotificationPreferences, SavedResume, UserNotificationItem } from '../types/cv';
import { SecurityAuditLog } from '../types/adminModules';
import { recordAuditLog, fetchMyAuditLogs } from '../services/auditLogService';
import {
  clearUserNotifications,
  dispatchUserNotification,
  getCachedNotificationPreferences,
  getDefaultNotificationPreferences,
  loadNotificationPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  saveNotificationPreferences,
  subscribeToUserNotifications
} from '../services/notificationService';
import { generateWordDocument, triggerDownload } from '../utils/docxExport';
import { OFFICIAL_PIX_KEY } from './PricingModal';
import { getStoredPlatformSettingsSync } from '../services/adminModulesService';
import { formatCycleLabel, formatCycleWithDiscount, getPixKeyTypeLabel } from '../utils/billingCycles';
import { BILLING_UI_TRANSLATIONS } from '../i18n/billingUiTranslations';
import { getIntlLocale } from '../i18n/toolsUiTranslations';

interface UserProfileViewProps {
  onNavigateTab: (tab: 'home' | 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'interview') => void;
  onOpenPricing: () => void;
  onLoadResume: (cv: CVData) => void;
  currentCV: CVData;
  onOpenAuth?: () => void;
  initialSubTab?: 'overview' | 'resumes' | 'settings';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onNavigateTab,
  onOpenPricing,
  onLoadResume,
  currentCV,
  onOpenAuth,
  initialSubTab = 'overview'
}) => {
  const {
    user,
    isAuthenticated,
    isPro,
    isExecutive,
    hasActivePlan,
    logout,
    updateUserProfile,
    changePassword,
    savedResumes,
    saveCurrentResume,
    deleteResume
  } = useAuth();
  const { formatPrice } = useCurrency();
  const { language: appLang, siteLanguage } = useLanguage();

  const billingDict = BILLING_UI_TRANSLATIONS[siteLanguage] || BILLING_UI_TRANSLATIONS.pt;
  const ui = billingDict.profileView;
  const shortPlanNames = billingDict.plans.shortNames;
  const intlLocale = getIntlLocale(siteLanguage);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'resumes' | 'settings'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profileTargetRole, setProfileTargetRole] = useState<string>(user?.targetRole || '');
  const [profilePhone, setProfilePhone] = useState<string>(user?.phone || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [currentPwd, setCurrentPwd] = useState<string>('');
  const [newPwd, setNewPwd] = useState<string>('');
  const [confirmPwd, setConfirmPwd] = useState<string>('');
  const [isChangingPwd, setIsChangingPwd] = useState<boolean>(false);

  // Notification preferences & feed state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    getCachedNotificationPreferences(user?.id)
  );
  const [isLoadingNotifPrefs, setIsLoadingNotifPrefs] = useState<boolean>(false);
  const [isSavingNotifPrefs, setIsSavingNotifPrefs] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<UserNotificationItem[]>([]);

  // New Resume Save Form State
  const [newResumeTitle, setNewResumeTitle] = useState<string>('');
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);
  const [exportingResumeId, setExportingResumeId] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());
  const [myAuditLogs, setMyAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);

  React.useEffect(() => {
    setProfileName(user?.name || '');
    setProfileTargetRole(user?.targetRole || '');
    setProfilePhone(user?.phone || '');
  }, [user?.id, user?.name, user?.targetRole, user?.phone]);

  React.useEffect(() => {
    const sync = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('admin-config-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoadingNotifPrefs(true);
    loadNotificationPreferences(user.id)
      .then((prefs) => setNotifPrefs(prefs))
      .catch(() => {})
      .finally(() => setIsLoadingNotifPrefs(false));

    const unsub = subscribeToUserNotifications(user.id, setRecentNotifications);
    return () => unsub();
  }, [isAuthenticated, user?.id]);

  const loadPersonalAuditLogs = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingAuditLogs(true);
    try {
      const logs = await fetchMyAuditLogs(user.id);
      setMyAuditLogs(logs);
    } catch {
      // handled gracefully inside service
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (activeSubTab === 'settings' && isAuthenticated && user?.id) {
      loadPersonalAuditLogs();
    }
  }, [activeSubTab, isAuthenticated, user?.id, loadPersonalAuditLogs]);

  const livePixKey = platformSettings.pixKey || OFFICIAL_PIX_KEY;
  const livePixKeyLabel = getPixKeyTypeLabel(platformSettings.pixKeyType, siteLanguage);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{ui.lockedTitle}</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {ui.lockedDesc}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('home')}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              {ui.backHomeBtn}
            </button>
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {ui.signInBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: profileName,
      targetRole: profileTargetRole,
      phone: profilePhone
    });
    setIsEditingProfile(false);
    setSaveSuccessMsg(ui.msgProfileUpdated);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(livePixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSaveCurrentCV = async () => {
    if (!newResumeTitle.trim()) return;
    setIsSavingCurrent(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      await saveCurrentResume(currentCV, newResumeTitle.trim(), user.targetRole || ui.execRoleFallback);
      setNewResumeTitle('');
      setSaveSuccessMsg(ui.msgResumeSaved);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Erro ao guardar versão do CV:', err);
      setSaveErrorMsg(ui.msgResumeSaveErr);
      setTimeout(() => setSaveErrorMsg(null), 4000);
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleExportWordResume = async (resume: SavedResume) => {
    if (exportingResumeId === resume.id) return;
    setExportingResumeId(resume.id);
    try {
      const blob = await generateWordDocument(resume.data, true, 'normal', appLang);
      triggerDownload(blob, `Curriculo_${resume.title.replace(/\s+/g, '_')}.docx`);
      void recordAuditLog({
        action: 'cv_exported_docx',
        category: 'cv_export',
        severity: 'info',
        status: 'success',
        targetResource: `resumes/${resume.id}/docx`,
        details: `Currículo "${resume.title}" exportado para Word (.docx) a partir da biblioteca.`,
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role === 'admin' ? 'admin' : 'user',
        metadata: { resumeId: resume.id, format: 'docx' }
      });
      void dispatchUserNotification({
        user,
        eventType: 'export',
        title: ui.notifWordTitle,
        message: `${ui.notifWordMsgPrefix}${resume.title}${ui.notifWordMsgSuffix}`,
        targetResource: `resumes/${resume.id}/docx`
      });
      setSaveSuccessMsg(`"${resume.title}"${ui.msgWordExportedSuffix}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch {
      setSaveErrorMsg(ui.msgWordExportErr);
    } finally {
      setExportingResumeId(null);
    }
  };

  const handleSaveNotifPreferences = async () => {
    if (!user?.id) return;
    setIsSavingNotifPrefs(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      const saved = await saveNotificationPreferences(user.id, notifPrefs);
      setNotifPrefs(saved);
      void recordAuditLog({
        action: 'profile_updated',
        category: 'profile',
        severity: 'info',
        status: 'success',
        targetResource: `users/${user.id}/preferences/notifications`,
        details: `Preferências de notificações atualizadas (sistema=${saved.systemEnabled}, e-mail=${saved.emailEnabled}).`,
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role === 'admin' ? 'admin' : 'user',
        metadata: { systemEnabled: saved.systemEnabled, emailEnabled: saved.emailEnabled }
      });
      setSaveSuccessMsg(ui.msgPrefsSaved);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || ui.msgPrefsSaveErr);
    } finally {
      setIsSavingNotifPrefs(false);
    }
  };

  const handleResetNotifPreferences = () => {
    if (!user?.id) return;
    setNotifPrefs(getDefaultNotificationPreferences(user.id));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    if (newPwd.length < 6) {
      setSaveErrorMsg(ui.msgPwdLength);
      return;
    }
    if (newPwd !== confirmPwd) {
      setSaveErrorMsg(ui.msgPwdMismatch);
      return;
    }
    setIsChangingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setSaveSuccessMsg(ui.msgPwdUpdated);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || ui.msgPwdErr);
    } finally {
      setIsChangingPwd(false);
    }
  };

  const planBadgeStyle =
    user.plan === 'executive'
      ? 'bg-amber-400 text-slate-950 border-amber-300'
      : user.plan === 'pro'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  const planDisplayName =
    user.plan === 'executive'
      ? shortPlanNames.executive
      : user.plan === 'pro'
      ? shortPlanNames.pro
      : shortPlanNames.free;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Feedback Toasts */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}
      {saveErrorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{saveErrorMsg}</span>
        </div>
      )}

      {/* Main Profile Header Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user.name}</h1>
                  {user.email?.toLowerCase() === 'gugurai923@gmail.com' || user.role === 'admin' ? (
                    <span className="text-xs px-3 py-0.5 rounded-md font-bold uppercase tracking-wider bg-rose-600 text-white border border-rose-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{ui.adminBadge}</span>
                    </span>
                  ) : null}
                  <span
                    className={`text-xs px-3 py-0.5 rounded-md font-extrabold uppercase border flex items-center gap-1.5 ${planBadgeStyle}`}
                  >
                    {user.plan === 'executive' && <Crown className="w-3.5 h-3.5 text-slate-950" />}
                    {user.plan === 'pro' && <Award className="w-3.5 h-3.5 text-amber-700" />}
                    <span>{planDisplayName}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                  {user.targetRole || ui.execRoleFallback}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="py-2 px-3.5 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditingProfile ? ui.cancelBtn : ui.editBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="py-2 px-3.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{ui.logoutBtn}</span>
              </button>
            </div>
          </div>

          {/* Real Subscription Summary Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{ui.contractedPlanPrefix}<strong className="text-white capitalize">{user.plan === 'executive' ? shortPlanNames.executive : user.plan === 'pro' ? shortPlanNames.pro : ui.freeWord}</strong></span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">{ui.cyclePrefix}{formatCycleLabel(user.billingCycle, siteLanguage)}</span>
            </div>

            <button
              type="button"
              onClick={onOpenPricing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{user.plan === 'pro' ? ui.upgradeVipBtn : ui.managePlanBtn}</span>
            </button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              {ui.editAccountTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ui.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ui.targetRoleLabel}</label>
                <input
                  type="text"
                  value={profileTargetRole}
                  onChange={(e) => setProfileTargetRole(e.target.value)}
                  placeholder={ui.targetRolePlaceholder}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ui.phoneLabel}</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {ui.cancelBtn}
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{ui.saveChangesBtn}</span>
              </button>
            </div>
          </form>
        )}

        {/* Profile Tabs Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-800" />
            <span>{ui.tabOverview}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('resumes')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'resumes'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>{ui.tabResumes} ({savedResumes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-slate-600" />
            <span>{ui.tabSettings}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Subscription & Overview */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Plan Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {ui.planDetailsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ui.planDetailsSub}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{user.plan === 'pro' ? ui.upgradeVipBtn : ui.manageSubBtn}</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {ui.subLevelLabel}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    {planDisplayName}
                  </span>
                  <span className="text-[11px] font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className={`w-3 h-3 ${hasActivePlan ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={hasActivePlan ? 'text-emerald-600' : 'text-slate-500'}>
                      {hasActivePlan ? ui.statusActive : ui.statusPreview}
                    </span>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {ui.aiCreditsLabel}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block tabular-nums">
                    {hasActivePlan ? ui.aiCreditsUnlimited : `${user.creditsRemaining ?? 5}${ui.creditsSuffix}`}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {hasActivePlan ? ui.fullAccessLabel : ui.starterPlanLabel}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {billingDict.profileModal.billingCycleLabel.replace(':', '')}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    {formatCycleWithDiscount(user.billingCycle, siteLanguage)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
                    {user.subscriptionExpiresAt
                      ? `${ui.untilPrefix}${new Date(user.subscriptionExpiresAt).toLocaleDateString(intlLocale)}`
                      : ui.continuousRenew}
                  </span>
                </div>
              </div>

              {/* Unlocked Matrix */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {ui.featuresTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      hasActivePlan
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{ui.featAts}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {hasActivePlan ? ui.includedLabel : ui.requiresProLabel}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      hasActivePlan
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{ui.featAi}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {hasActivePlan ? ui.includedLabel : `${user.creditsRemaining ?? 5}${ui.creditsTestSuffix}`}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      hasActivePlan
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{ui.featCover}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {hasActivePlan ? ui.includedLabel : ui.requiresProLabel}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">{ui.featInterview}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? ui.unlockedLabel : ui.requiresVipLabel}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">{ui.featOffline}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? ui.unlockedLabel : ui.requiresVipLabel}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      user.plan === 'executive'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">{ui.featHarvard}</span>
                    <span className="text-[10px] font-bold uppercase">
                      {user.plan === 'executive' ? ui.unlockedLabel : ui.requiresVipLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Side Card Actions */}
          <div className="space-y-6">
            {/* Quick Navigation to Tools */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {ui.shortcutsTitle}
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('editor')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">{ui.shortcutEditor}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('ats')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">{ui.shortcutAts}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('interview')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-800">{ui.shortcutInterview}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Pix Reference for Instant Upgrade */}
            <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  {ui.pixTitle}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="text-[11px] font-bold text-amber-900 underline"
                >
                  {copiedPix ? ui.copiedBtn : ui.copyBtn}
                </button>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                {ui.pixDescPrefix}{livePixKeyLabel}{ui.pixDescSuffix}
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-mono text-[11px] text-slate-800 break-all select-all">
                {livePixKey}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Resumes Management */}
      {activeSubTab === 'resumes' && (
        <div className="space-y-6">
          {/* Action Box to save current in-progress CV */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              {ui.saveCvTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {ui.saveCvDesc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder={ui.saveCvPlaceholder}
                value={newResumeTitle}
                onChange={(e) => setNewResumeTitle(e.target.value)}
                className="flex-1 w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleSaveCurrentCV}
                disabled={!newResumeTitle.trim() || isSavingCurrent}
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{ui.saveNowBtn}</span>
              </button>
            </div>
          </div>

          {/* List of Resumes */}
          {savedResumes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{ui.emptyLibTitle}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {ui.emptyLibDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('editor')}
                className="inline-flex items-center gap-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{ui.goToEditorBtn}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{resume.title}</h4>
                          <span className="text-[11px] text-slate-500">{resume.targetJob}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-mono tabular-nums">
                        {resume.updatedAt}
                      </span>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                      <p>
                        <strong>{ui.candidateLabel}</strong> {resume.data.personalDetails.name || ui.unnamedCandidate}
                      </p>
                      <p>
                        <strong>{ui.templateLabel}</strong> {resume.data.templateStyle}
                      </p>
                      <p className="tabular-nums">
                        <strong>{ui.rolesCountLabel}</strong> {resume.data.experiences.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadResume(resume.data);
                          onNavigateTab('editor');
                        }}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{ui.openEditorBtn}</span>
                      </button>

                      <button
                        type="button"
                        disabled={exportingResumeId === resume.id}
                        onClick={() => handleExportWordResume(resume)}
                        aria-label={`${ui.exportWordAriaPrefix}"${resume.title}"`}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title={ui.exportWordTitle}
                      >
                        <Download className="w-3 h-3" />
                        <span>{exportingResumeId === resume.id ? ui.generatingWord : ui.wordBtn}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteResume(resume.id)}
                      aria-label={`${ui.deleteAriaPrefix}"${resume.title}"`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={ui.deleteTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Notification Preferences + System Notification Center + Security & Audit */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* Top Row: Notification Preferences & Recent System Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Preferências de Notificações Panel */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>{ui.notifTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {ui.notifDesc}
                  </p>
                </div>
                {isLoadingNotifPrefs && (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {ui.syncing}
                  </span>
                )}
              </div>

              {/* Master Channel Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{ui.sysAlertsTitle}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {ui.sysAlertsDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPrefs.systemEnabled}
                    aria-label={ui.sysAlertsAria}
                    onClick={() =>
                      setNotifPrefs((prev) => ({ ...prev, systemEnabled: !prev.systemEnabled }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      notifPrefs.systemEnabled ? 'bg-slate-900' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                        notifPrefs.systemEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{ui.emailAlertsTitle}</p>
                      <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                        {ui.emailAlertsToPrefix}{user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPrefs.emailEnabled}
                    aria-label={ui.emailAlertsAria}
                    onClick={() =>
                      setNotifPrefs((prev) => ({ ...prev, emailEnabled: !prev.emailEnabled }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      notifPrefs.emailEnabled ? 'bg-slate-900' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                        notifPrefs.emailEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Per-Event Channel Matrix */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="col-span-6 sm:col-span-7">{ui.matrixEventCol}</div>
                  <div className="col-span-3 sm:col-span-2 text-center">{ui.matrixSystemCol}</div>
                  <div className="col-span-3 text-center">{ui.matrixEmailCol}</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Event 1: Conclusão de traduções */}
                  <div className="grid grid-cols-12 items-center px-4 py-3.5 gap-2">
                    <div className="col-span-6 sm:col-span-7 flex items-start gap-2.5 min-w-0">
                      <Languages className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{ui.evTransTitle}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {ui.evTransDesc}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.systemEnabled && notifPrefs.events.translation.system}
                        disabled={!notifPrefs.systemEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              translation: {
                                ...prev.events.translation,
                                system: !prev.events.translation.system
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.systemEnabled && notifPrefs.events.translation.system
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.systemEnabled && notifPrefs.events.translation.system
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.emailEnabled && notifPrefs.events.translation.email}
                        disabled={!notifPrefs.emailEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              translation: {
                                ...prev.events.translation,
                                email: !prev.events.translation.email
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.emailEnabled && notifPrefs.events.translation.email
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.emailEnabled && notifPrefs.events.translation.email
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Event 2: Exportações bem-sucedidas */}
                  <div className="grid grid-cols-12 items-center px-4 py-3.5 gap-2">
                    <div className="col-span-6 sm:col-span-7 flex items-start gap-2.5 min-w-0">
                      <Download className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{ui.evExportTitle}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {ui.evExportDesc}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.systemEnabled && notifPrefs.events.export.system}
                        disabled={!notifPrefs.systemEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              export: {
                                ...prev.events.export,
                                system: !prev.events.export.system
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.systemEnabled && notifPrefs.events.export.system
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.systemEnabled && notifPrefs.events.export.system
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.emailEnabled && notifPrefs.events.export.email}
                        disabled={!notifPrefs.emailEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              export: {
                                ...prev.events.export,
                                email: !prev.events.export.email
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.emailEnabled && notifPrefs.events.export.email
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.emailEnabled && notifPrefs.events.export.email
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Event 3: Atualizações nos currículos */}
                  <div className="grid grid-cols-12 items-center px-4 py-3.5 gap-2">
                    <div className="col-span-6 sm:col-span-7 flex items-start gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{ui.evResumeTitle}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {ui.evResumeDesc}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.systemEnabled && notifPrefs.events.resumeUpdate.system}
                        disabled={!notifPrefs.systemEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resumeUpdate: {
                                ...prev.events.resumeUpdate,
                                system: !prev.events.resumeUpdate.system
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.systemEnabled && notifPrefs.events.resumeUpdate.system
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.systemEnabled && notifPrefs.events.resumeUpdate.system
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPrefs.emailEnabled && notifPrefs.events.resumeUpdate.email}
                        disabled={!notifPrefs.emailEnabled}
                        onClick={() =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resumeUpdate: {
                                ...prev.events.resumeUpdate,
                                email: !prev.events.resumeUpdate.email
                              }
                            }
                          }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-40 cursor-pointer ${
                          notifPrefs.emailEnabled && notifPrefs.events.resumeUpdate.email
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                            notifPrefs.emailEnabled && notifPrefs.events.resumeUpdate.email
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResetNotifPreferences}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
                >
                  {ui.resetDefaultBtn}
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotifPreferences}
                  disabled={isSavingNotifPrefs}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotifPrefs ? ui.savingBtn : ui.savePrefsBtn}</span>
                </button>
              </div>
            </div>

            {/* Centro de Notificações Recentes */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {ui.recentNotifTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ui.recentNotifDesc}
                  </p>
                </div>
                {recentNotifications.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsAsRead(user.id, recentNotifications)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      title={ui.markReadTitle}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{ui.readBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void clearUserNotifications(user.id, recentNotifications)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title={ui.clearNotifTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {recentNotifications.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">{ui.noNotifTitle}</p>
                  <p className="text-[11px]">
                    {ui.noNotifDesc}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {recentNotifications.slice(0, 20).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.read) {
                          void markNotificationAsRead(user.id, item.id);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-colors ${
                        !item.read && item.channelSystem
                          ? 'bg-amber-50/50 border-amber-200 border-l-2 border-l-amber-500 hover:bg-amber-50'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          {!item.read && item.channelSystem && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 shrink-0">
                              {ui.newBadge}
                            </span>
                          )}
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                          {new Date(item.createdAt).toLocaleString(intlLocale)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{item.message}</p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {item.channelSystem && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                            {ui.systemBadge}
                          </span>
                        )}
                        {item.channelEmail && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                            {item.emailDeliveryStatus === 'sent'
                              ? ui.emailSentBadge
                              : ui.emailLoggedBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Security & Password Management + Personal Activity Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900">
                {ui.securityTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                {ui.securityDesc}
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {ui.currentPwdLabel}
                  </label>
                  <input
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder={ui.currentPwdPlaceholder}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {ui.newPwdLabel}
                    </label>
                    <input
                      type="password"
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder={ui.newPwdPlaceholder}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {ui.confirmPwdLabel}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder={ui.confirmPwdPlaceholder}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPwd}
                    className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isChangingPwd ? ui.updatingPwd : ui.updatePwdBtn}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-800" />
                    <span>{ui.auditTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ui.auditDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadPersonalAuditLogs}
                  disabled={isLoadingAuditLogs}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  title={ui.auditRefreshTitle}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingAuditLogs && myAuditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {ui.auditLoading}
                </div>
              ) : myAuditLogs.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  {ui.auditEmpty}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {myAuditLogs.slice(0, 25).map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        log.status === 'blocked'
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {ui.auditActions[log.action] || log.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status === 'blocked'
                              ? 'bg-rose-100 text-rose-800'
                              : log.status === 'failure'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.status === 'blocked'
                            ? ui.statusBlocked
                            : log.status === 'failure'
                            ? ui.statusFailure
                            : ui.statusLogged}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{log.details}</p>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
                        <span className="truncate">{log.targetResource}</span>
                        <span className="shrink-0">
                          {new Date(log.timestamp).toLocaleString(intlLocale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
