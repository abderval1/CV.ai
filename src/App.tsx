import { useState, useEffect, useRef, useCallback } from 'react';
import { CVData, BillingCycle, SubscriptionPlan } from './types/cv';
import { GENERIC_DEFAULT_CV, SAMPLE_JOB_OFFERS } from './data/initialCV';
import { Header, AppTab } from './components/Header';
import { LandingHeroView } from './components/LandingHeroView';
import { ShowcaseGalleryView, ShowcaseMode, ShowcaseSelectionPayload } from './components/ShowcaseGalleryView';
import { CVDocumentView } from './components/CVDocumentView';
import { ContentEditor } from './components/ContentEditor';
import { AtsRadarPanel } from './components/AtsRadarPanel';
import { AiTailorPanel } from './components/AiTailorPanel';
import { CoverLetterPanel } from './components/CoverLetterPanel';
import { CoverLetterDocumentView } from './components/CoverLetterDocumentView';
import { RawInputGenerator } from './components/RawInputGenerator';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { MyResumesModal } from './components/MyResumesModal';
import { SaaSAdminDashboard } from './components/SaaSAdminDashboard';
import { TemplateAdvisorModal } from './components/TemplateAdvisorModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfileView } from './components/UserProfileView';
import { PlanGateGuard } from './components/PlanGateGuard';
import { InterviewSimulator } from './components/InterviewSimulator';
import { JobMatchesPanel } from './components/JobMatchesPanel';
import { SystemNotificationBanner } from './components/SystemNotificationBanner';
import { SupportChatModal } from './components/SupportChatModal';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from './context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from './i18n/toolsUiTranslations';
import { detectCVLanguage, detectTextLanguage } from './utils/languageDetect';
import { generateWordDocument, generateCoverLetterDocx, triggerDownload } from './utils/docxExport';
import { getTemplateById } from './data/templateCatalog';
import { isUserAdmin } from './services/saasDbService';
import { recordAuditLog } from './services/auditLogService';
import { dispatchUserNotification } from './services/notificationService';
import { authorizedFetch } from './utils/authHeaders';
import {
  fetchPlatformSettings,
  fetchEditablePlans,
  fetchSystemLocales,
  fetchAdminTemplates,
  fetchPromptsConfig,
  fetchPlanQuotas,
  fetchProfessionSnippets,
  fetchSystemBanners,
  getStoredPlatformSettingsSync,
  getStoredPromptSync,
  getStoredQuotasSync,
  getStoredTemplatesSync,
  trackFrontendTelemetry,
  logGenerationError,
  emitAdminConfigUpdated
} from './services/adminModulesService';
import { applyPageSeo, getPathnameForTab, getTabFromPathname } from './utils/seoManager';
import { STUDIO_NAV_TRANSLATIONS } from './i18n/studioNavTranslations';
import { FileText, SlidersHorizontal, Check, Edit3, Target, Download, Wand2, Lock, Mail, ShieldAlert, LogOut, Wrench, Briefcase, Upload, MessageSquare } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isPro, isExecutive, hasActivePlan, isImpersonating, stopImpersonating, authRedirectError } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { siteText, studioText, siteLanguage } = useLanguage();
  const appUi = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).app;
  const studioNav = STUDIO_NAV_TRANSLATIONS[siteLanguage] || STUDIO_NAV_TRANSLATIONS.en;
  const [contentLanguage, setContentLanguage] = useState<LanguageCode>('en');

  const getDraftKey = useCallback(
    (base: string, uid?: string | null) => `${base}_${uid || 'visitor'}`,
    []
  );

  const getDefaultLetterText = useCallback(
    () => `To: Executive Selection Committee
Corporate Leadership Board
Subject: Application for Chief Operating Officer (COO) / Global Operations Leadership

Dear Members of the Selection Committee,

It is with strong enthusiasm that I submit my candidacy for this executive leadership role. With over 12 years of progressive experience driving operational excellence, digital transformation, and P&L governance across multinational environments, I bring a proven track record of delivering measurable growth in competitive global markets.

In my recent leadership mandates, I architected enterprise operating workflows across regional hubs, scaled cross-functional teams of 140+ specialists, and delivered $8.4M in audited OPEX savings. My background pairs rigorous financial discipline with hands-on execution in Business Intelligence, post-merger ERP integration, and executive stakeholder alignment.

Aligned with international corporate governance standards, I partner closely with Boards and functional VPs to accelerate time-to-market while strengthening service SLAs and EBITDA margins.

Thank you for your time and consideration. I welcome the opportunity to discuss how I can create immediate operational impact within your organization.

Sincerely,

${GENERIC_DEFAULT_CV.personalDetails.name}
${GENERIC_DEFAULT_CV.personalDetails.title}
${GENERIC_DEFAULT_CV.personalDetails.phone} | ${GENERIC_DEFAULT_CV.personalDetails.email}`,
    []
  );

  const [cv, setCv] = useState<CVData>(() => {
    try {
      localStorage.removeItem('curriculo_draft_v1');
      const saved = localStorage.getItem(getDraftKey('curriculo_draft_v1', user?.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.personalDetails?.name) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default
    }
    return GENERIC_DEFAULT_CV;
  });

  const [jobDescription, setJobDescription] = useState<string>(() => {
    try {
      localStorage.removeItem('curriculo_job_draft_v1');
      const savedJob = localStorage.getItem(getDraftKey('curriculo_job_draft_v1', user?.id));
      if (savedJob && savedJob.trim().length > 10) {
        return savedJob;
      }
    } catch {
      // Fallback
    }
    return SAMPLE_JOB_OFFERS[0].description;
  });

  const activeDraftOwnerRef = useRef<string | null>(user?.id || null);

  // Debounced auto-save of active draft scoped strictly by active user ID
  useEffect(() => {
    const ownerUid = user?.id || null;
    if (activeDraftOwnerRef.current !== ownerUid) return;
    const timer = setTimeout(() => {
      try {
        localStorage.removeItem('curriculo_draft_v1');
        localStorage.removeItem('curriculo_job_draft_v1');
        localStorage.setItem(getDraftKey('curriculo_draft_v1', ownerUid), JSON.stringify(cv));
        localStorage.setItem(getDraftKey('curriculo_job_draft_v1', ownerUid), jobDescription);
      } catch (e) {
        console.warn('Falha ao gravar rascunho local:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cv, jobDescription, user?.id, getDraftKey]);

  // Online / Offline network awareness
  useEffect(() => {
    const handleOnline = () => showSuccess(appUi.onlineTitle, appUi.onlineDesc);
    const handleOffline = () => showError(appUi.offlineTitle, appUi.offlineDesc);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appUi, showError, showSuccess]);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      return getTabFromPathname(window.location.pathname);
    } catch {
      return 'home';
    }
  });

  // Sync browser back/forward navigation with active SPA tab
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync clean SEO URL pathname and full meta/OpenGraph/JSON-LD tags whenever route or language changes
  useEffect(() => {
    try {
      const targetPath = getPathnameForTab(activeTab);
      const currentPath = window.location.pathname === '/' ? '/' : window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (currentPath !== targetPath) {
        window.history.pushState({ tab: activeTab }, '', `${targetPath}${window.location.search}`);
      }
    } catch {
      // ignore history errors in sandboxed frames
    }
    applyPageSeo({
      tab: activeTab,
      language: siteLanguage,
      faqs: siteText.landing.faqs,
      brandName: siteText.brandName
    });
  }, [activeTab, siteLanguage, siteText]);

  const [mobileViewMode, setMobileViewMode] = useState<'controls' | 'preview'>('controls');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [wordSuccessNotification, setWordSuccessNotification] = useState<boolean>(false);
  const [wordNotificationMessage, setWordNotificationMessage] = useState<string>('');

  // Modal states for SaaS
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [pricingPromptMessage, setPricingPromptMessage] = useState<string | undefined>(undefined);
  const [pricingInitialPlan, setPricingInitialPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [pricingInitialCycle, setPricingInitialCycle] = useState<BillingCycle | undefined>(undefined);
  const [pendingModelTarget, setPendingModelTarget] = useState<{
    targetTab: 'editor' | 'cover' | 'raw';
    label: string;
  } | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<{
    plan: SubscriptionPlan;
    cycle: BillingCycle;
  } | null>(null);
  const prevAuthRef = useRef<boolean>(isAuthenticated);
  const [isMyResumesModalOpen, setIsMyResumesModalOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isTemplateAdvisorOpen, setIsTemplateAdvisorOpen] = useState<boolean>(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState<boolean>(false);
  const [supportChatUnreadCount, setSupportChatUnreadCount] = useState<number>(0);
  const [profileInitialSubTab, setProfileInitialSubTab] = useState<'overview' | 'resumes' | 'settings'>('overview');
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());
  const [planQuotas, setPlanQuotas] = useState(() => getStoredQuotasSync());
  const resumeStartedTrackedRef = useRef<boolean>(false);

  // Hydrate Admin Governance, Editable Plans, Prompts, Templates, Locales & Banners from Firestore on app boot
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchPlatformSettings(),
      fetchEditablePlans(),
      fetchSystemLocales(),
      fetchAdminTemplates(),
      fetchPromptsConfig(),
      fetchPlanQuotas(),
      fetchProfessionSnippets(),
      fetchSystemBanners()
    ])
      .then(([settings, , , , , quotas]) => {
        if (!mounted) return;
        setPlatformSettings(settings);
        if (Array.isArray(quotas) && quotas.length > 0) {
          setPlanQuotas(quotas);
        }
        emitAdminConfigUpdated('hydrate');
      })
      .catch((err) => console.warn('Erro ao hidratar configurações do Admin:', err));

    const syncHandler = () => {
      setPlatformSettings(getStoredPlatformSettingsSync());
      setPlanQuotas(getStoredQuotasSync());
    };
    window.addEventListener('admin-config-updated', syncHandler);

    const qp = new URLSearchParams(window.location.search);
    if (qp.get('stripe_status') === 'success' && qp.get('session_id')) {
      setIsPricingModalOpen(true);
    }

    return () => {
      mounted = false;
      window.removeEventListener('admin-config-updated', syncHandler);
    };
  }, []);

  const handleOpenAuth = (prompt?: string, mode: 'login' | 'register' = prompt ? 'register' : 'login') => {
    setAuthModalPrompt(prompt);
    setAuthDefaultMode(mode);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    if (authRedirectError && !isAuthenticated) {
      setAuthDefaultMode('login');
      setIsAuthModalOpen(true);
    }
  }, [authRedirectError, isAuthenticated]);

  const handleOpenPricingModal = useCallback((
    prompt?: string,
    initialPlan?: SubscriptionPlan,
    initialCycle?: BillingCycle
  ) => {
    setPricingPromptMessage(
      prompt || appUi.pricingDefaultPrompt
    );
    setPricingInitialPlan(initialPlan);
    setPricingInitialCycle(initialCycle);
    setIsPricingModalOpen(true);
  }, [appUi.pricingDefaultPrompt]);

  const handleOpenNotificationPreferences = useCallback(() => {
    setIsUserProfileModalOpen(false);
    setProfileInitialSubTab('settings');
    setActiveTab('profile');
  }, []);

  const [letterBody, setLetterBodyState] = useState<string>(() => {
    try {
      localStorage.removeItem('curriculo_letter_draft_v1');
      const savedLetter = localStorage.getItem(getDraftKey('curriculo_letter_draft_v1', user?.id));
      if (savedLetter && savedLetter.trim().length > 10) {
        return savedLetter;
      }
    } catch {
      // Fallback
    }
    return getDefaultLetterText();
  });

  // Track which language the active CV & Cover Letter content are currently written in,
  // plus a per-language translation cache verified against real text language detection.
  const detectedInitialCvLang = detectCVLanguage(cv);
  const initialContentLang = ((): LanguageCode => {
    if (detectedInitialCvLang) {
      return detectedInitialCvLang;
    }
    try {
      const saved = localStorage.getItem('curriculo_content_lang_v1') as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  })();

  const activeContentLangRef = useRef<LanguageCode>(initialContentLang);
  useEffect(() => {
    setContentLanguage(initialContentLang);
  }, []);
  const lastEditedLangRef = useRef<LanguageCode>(initialContentLang);
  const latestStateRef = useRef<{ cv: CVData; letterBody: string }>({ cv, letterBody });
  latestStateRef.current = { cv, letterBody };

  const translationCacheRef = useRef<
    Partial<Record<LanguageCode, { cv: CVData; letterBody: string; verified?: boolean }>>
  >({
    [initialContentLang]: { cv, letterBody, verified: Boolean(detectedInitialCvLang) }
  });
  const translationReqIdRef = useRef<number>(0);
  const [isTranslatingContent, setIsTranslatingContent] = useState<boolean>(false);
  const [translatingTargetLang, setTranslatingTargetLang] = useState<LanguageCode | null>(null);

  // Persist letterBody draft alongside cv draft (strictly scoped by active user ID)
  useEffect(() => {
    const ownerUid = user?.id || null;
    if (activeDraftOwnerRef.current !== ownerUid) return;
    const timer = setTimeout(() => {
      try {
        localStorage.removeItem('curriculo_letter_draft_v1');
        localStorage.setItem(getDraftKey('curriculo_letter_draft_v1', ownerUid), letterBody);
      } catch (e) {
        console.warn('Falha ao gravar rascunho da carta:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [letterBody, user?.id, getDraftKey]);

  // Enforce strict per-user draft isolation on logout or account switch
  useEffect(() => {
    const prevUid = activeDraftOwnerRef.current;
    const nextUid = user?.id || null;
    if (prevUid === nextUid) return;

    activeDraftOwnerRef.current = nextUid;

    if (!nextUid) {
      // Logged out: wipe active editor state back to generic default so next user cannot see previous user's CV
      setCv(GENERIC_DEFAULT_CV);
      setJobDescription(SAMPLE_JOB_OFFERS[0].description);
      setLetterBodyState(getDefaultLetterText());
      translationCacheRef.current = {
        en: { cv: GENERIC_DEFAULT_CV, letterBody: getDefaultLetterText(), verified: true }
      };
      return;
    }

    // Logged in or switched accounts: load that specific user's scoped draft (if any),
    // and only preserve visitor in-progress CV when transitioning visitor -> new user without a saved user draft.
    try {
      const scopedCvRaw = localStorage.getItem(getDraftKey('curriculo_draft_v1', nextUid));
      const scopedJobRaw = localStorage.getItem(getDraftKey('curriculo_job_draft_v1', nextUid));
      const scopedLetterRaw = localStorage.getItem(getDraftKey('curriculo_letter_draft_v1', nextUid));

      if (scopedCvRaw) {
        const parsedCv = JSON.parse(scopedCvRaw);
        if (parsedCv?.personalDetails?.name) {
          setCv(parsedCv);
          setJobDescription(scopedJobRaw && scopedJobRaw.trim().length > 10 ? scopedJobRaw : SAMPLE_JOB_OFFERS[0].description);
          setLetterBodyState(scopedLetterRaw && scopedLetterRaw.trim().length > 10 ? scopedLetterRaw : getDefaultLetterText());
          return;
        }
      }

      if (prevUid && prevUid !== nextUid) {
        // Switched directly from User A to User B (or impersonation) where User B has no local draft yet
        setCv(GENERIC_DEFAULT_CV);
        setJobDescription(SAMPLE_JOB_OFFERS[0].description);
        setLetterBodyState(getDefaultLetterText());
        translationCacheRef.current = {
          en: { cv: GENERIC_DEFAULT_CV, letterBody: getDefaultLetterText(), verified: true }
        };
      }
    } catch {
      if (prevUid && prevUid !== nextUid) {
        setCv(GENERIC_DEFAULT_CV);
        setJobDescription(SAMPLE_JOB_OFFERS[0].description);
        setLetterBodyState(getDefaultLetterText());
      }
    }
  }, [user?.id, getDraftKey, getDefaultLetterText]);

  // Wrap CV and Cover Letter setters so manual edits or imports tag the real detected language
  // and invalidate stale translations from earlier content.
  const updateCvWithCache = useCallback((updater: CVData | ((prev: CVData) => CVData)) => {
    setCv((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const detectedLang = detectCVLanguage(next);
      const lang = (detectedLang as LanguageCode | null) || activeContentLangRef.current;
      activeContentLangRef.current = lang;
      lastEditedLangRef.current = lang;
      queueMicrotask(() => setContentLanguage(lang));
      try {
        localStorage.setItem('curriculo_content_lang_v1', lang);
      } catch {
        // ignore
      }
      const prevLetter = latestStateRef.current.letterBody;
      latestStateRef.current = {
        cv: next,
        letterBody: prevLetter
      };
      translationCacheRef.current = {
        [lang]: {
          cv: next,
          letterBody: prevLetter,
          verified: Boolean(detectedLang)
        }
      };
      return next;
    });
  }, []);

  const updateLetterWithCache = useCallback((nextBody: string) => {
    setLetterBodyState(nextBody);
    const detectedLetterLang = detectTextLanguage(nextBody);
    const detectedCvLang = detectCVLanguage(latestStateRef.current.cv);
    const lang =
      (detectedLetterLang as LanguageCode | null) ||
      (detectedCvLang as LanguageCode | null) ||
      activeContentLangRef.current;
    activeContentLangRef.current = lang;
    lastEditedLangRef.current = lang;
    setContentLanguage(lang);
    latestStateRef.current = {
      cv: latestStateRef.current.cv,
      letterBody: nextBody
    };
    translationCacheRef.current = {
      [lang]: {
        cv: latestStateRef.current.cv,
        letterBody: nextBody,
        verified: Boolean(detectedLetterLang || detectedCvLang)
      }
    };
  }, []);

  // Track resume_started once user enters studio editing flow
  useEffect(() => {
    if (!resumeStartedTrackedRef.current && (activeTab === 'editor' || activeTab === 'raw')) {
      resumeStartedTrackedRef.current = true;
      trackFrontendTelemetry({ type: 'resume_started' });
    }
  }, [activeTab]);

  // Seamless funnel: Use Model -> Create Account / Login -> Subscribe ($8 or $12) -> Direct to Editor/Cover
  useEffect(() => {
    const justAuthenticated = !prevAuthRef.current && isAuthenticated;
    prevAuthRef.current = isAuthenticated;

    if (justAuthenticated && isAuthenticated && pendingCheckout) {
      setIsAuthModalOpen(false);
      handleOpenPricingModal(
        appUi.checkoutConfirmedPrompt,
        pendingCheckout.plan,
        pendingCheckout.cycle
      );
      setPendingCheckout(null);
      return;
    }

    if (!pendingModelTarget) return;

    if (isAuthenticated && hasActivePlan) {
      setActiveTab(pendingModelTarget.targetTab);
      setMobileViewMode('controls');
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(false);
      showSuccess(appUi.unlockedTitle, `${pendingModelTarget.label} ${appUi.unlockedSubSuffix}`);
      setPendingModelTarget(null);
      return;
    }

    if (justAuthenticated && isAuthenticated && !hasActivePlan) {
      setIsAuthModalOpen(false);
      handleOpenPricingModal(
        `${appUi.planModelPromptPrefix} ${pendingModelTarget.label}${appUi.planModelPromptSuffix}`
      );
    }
  }, [isAuthenticated, hasActivePlan, pendingModelTarget, pendingCheckout, showSuccess, appUi, handleOpenPricingModal]);

  const handleUseShowcaseItem = useCallback(
    (payload: ShowcaseSelectionPayload | { targetTab: 'raw'; label: string }) => {
      const tmplCfg =
        'templateStyle' in payload && payload.templateStyle
          ? getStoredTemplatesSync().find((t) => t.id === payload.templateStyle)
          : undefined;

      if ('cvData' in payload && payload.cvData) {
        updateCvWithCache(payload.cvData);
      } else if ('templateStyle' in payload && payload.templateStyle) {
        trackFrontendTelemetry({ type: 'template_selected', templateStyle: payload.templateStyle });
        updateCvWithCache((prev) => ({
          ...prev,
          templateStyle: payload.templateStyle!,
          accentColor: payload.accentColor || prev.accentColor
        }));
      }

      if ('letterBody' in payload && payload.letterBody) {
        updateLetterWithCache(payload.letterBody);
      }

      if (!isAuthenticated) {
        setPendingModelTarget({ targetTab: payload.targetTab, label: payload.label });
        handleOpenAuth(
          `${appUi.authModelPromptPrefix} ${payload.label} ${appUi.authModelPromptSuffix}`,
          'register'
        );
        return;
      }

      const isAdminUser = isUserAdmin(user?.email, user?.role);
      if (!isAdminUser && !hasActivePlan && tmplCfg?.tierRequired !== 'free') {
        setPendingModelTarget({ targetTab: payload.targetTab, label: payload.label });
        handleOpenPricingModal(
          `${appUi.planModelPromptPrefix} ${payload.label}${appUi.planModelPromptSuffix}`
        );
        return;
      }

      if (!isAdminUser && tmplCfg?.tierRequired === 'executive' && !isExecutive) {
        handleOpenPricingModal(
          `${appUi.planModelPromptPrefix} ${payload.label} (Plano Executivo VIP)`,
          'executive'
        );
        return;
      }

      setActiveTab(payload.targetTab);
      setMobileViewMode('controls');
      showSuccess(appUi.modelLoadedTitle, `${payload.label} ${appUi.modelLoadedSubSuffix}`);
    },
    [hasActivePlan, isAuthenticated, isExecutive, user?.email, user?.role, showSuccess, updateCvWithCache, updateLetterWithCache, appUi, handleOpenPricingModal]
  );

  // Translate BOTH CV content and Cover Letter content whenever any language selector is clicked
  const handleSwitchLanguage = useCallback(async (targetLang: LanguageCode) => {
    if (!isAuthenticated) {
      handleOpenAuth(
        appUi.authTranslatePrompt,
        'register'
      );
      return;
    }
    if (!hasActivePlan) {
      handleOpenPricingModal(
        appUi.planTranslatePrompt
      );
      return;
    }
    setContentLanguage(targetLang);
    trackFrontendTelemetry({ type: 'language_switched', language: targetLang });

    const currentLang = activeContentLangRef.current;
    const { cv: latestCv, letterBody: latestLetter } = latestStateRef.current;
    const hasLetter = Boolean(latestLetter && latestLetter.trim().length > 0);

    const actualCvLang = detectCVLanguage(latestCv);
    const actualLetterLang = hasLetter ? detectTextLanguage(latestLetter) : null;

    // Only record current snapshot under its genuine language (never pollute targetLang with wrong-language text)
    const genuineCurrentLang = (actualCvLang as LanguageCode | null) || currentLang;
    if (!translationCacheRef.current[genuineCurrentLang]) {
      translationCacheRef.current[genuineCurrentLang] = {
        cv: latestCv,
        letterBody: latestLetter,
        verified: Boolean(actualCvLang)
      };
    }

    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
    const langLabel = langInfo?.nativeName || targetLang.toUpperCase();

    // Validate cached entry against actual detected content language before skipping translation
    const cached = translationCacheRef.current[targetLang];
    const cachedCvLang = cached ? detectCVLanguage(cached.cv) : null;
    const cachedLetterLang = cached && cached.letterBody?.trim() ? detectTextLanguage(cached.letterBody) : null;

    const isCacheGenuineForTarget = Boolean(
      cached &&
        (!cachedCvLang || cachedCvLang === targetLang) &&
        (!cached.letterBody?.trim() || !cachedLetterLang || cachedLetterLang === targetLang)
    );

    const isVisibleContentAlreadyInTarget =
      actualCvLang === targetLang && (!hasLetter || !actualLetterLang || actualLetterLang === targetLang);

    // Instant switch ONLY if we have a genuinely verified target-language version
    // AND if the user clicked the already-active language, the visible content is actually in that language.
    if (isCacheGenuineForTarget && cached && (targetLang !== currentLang || isVisibleContentAlreadyInTarget)) {
      activeContentLangRef.current = targetLang;
      setContentLanguage(targetLang);
      try {
        localStorage.setItem('curriculo_content_lang_v1', targetLang);
      } catch {
        // ignore
      }
      if (targetLang !== currentLang || !isVisibleContentAlreadyInTarget) {
        const mergedCachedCv: CVData = {
          ...cached.cv,
          templateStyle: latestCv.templateStyle,
          accentColor: latestCv.accentColor,
          fontFamily: latestCv.fontFamily,
          sectionOrder: latestCv.sectionOrder,
          sectionVisibility: latestCv.sectionVisibility
        };
        latestStateRef.current = { cv: mergedCachedCv, letterBody: cached.letterBody };
        setCv(mergedCachedCv);
        setLetterBodyState(cached.letterBody);
        showInfo(appUi.langChangedTitle, `${appUi.langChangedSubPrefix} ${langLabel}.`);
      }
      return;
    }

    // Clear invalid/stale entry for targetLang if it held content in another language
    if (cached && !isCacheGenuineForTarget) {
      delete translationCacheRef.current[targetLang];
    }

    // Pick cleanest source entry (avoid picking an entry that matches latestCv only in another lang if edited)
    const editedEntry = translationCacheRef.current[lastEditedLangRef.current];
    const sourceEntry =
      editedEntry && lastEditedLangRef.current !== targetLang
        ? editedEntry
        : { cv: latestCv, letterBody: latestLetter };

    if (platformSettings.enableAiFeaturesGlobally === false && !isUserAdmin(user?.email, user?.role)) {
      showError(
        appUi.translationErrorTitle,
        'Os recursos de tradução com IA estão temporariamente pausados pela administração.'
      );
      return;
    }

    const reqId = ++translationReqIdRef.current;
    setIsTranslatingContent(true);
    setTranslatingTargetLang(targetLang);

    const adminTranslateConfig = getStoredPromptSync('translateDoc');

    try {
      const sourceHasLetter = Boolean(sourceEntry.letterBody && sourceEntry.letterBody.trim().length > 0);
      const sourceCvLang = detectCVLanguage(sourceEntry.cv);
      const sourceLetterLang = sourceHasLetter ? detectTextLanguage(sourceEntry.letterBody) : null;

      // Translate CV whenever it isn't already genuinely in targetLang
      const cvPromise =
        sourceCvLang === targetLang && actualCvLang === targetLang
          ? Promise.resolve(sourceEntry.cv)
          : authorizedFetch('/api/translate-cv', {
              method: 'POST',
              body: JSON.stringify({
                cvData: sourceEntry.cv,
                targetLanguage: targetLang,
                adminPromptConfig: adminTranslateConfig
              })
            }).then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data.error || `Erro ${res.status} ao traduzir o currículo.`);
              }
              if (!data.translatedCV) {
                throw new Error('Resposta inválida ao traduzir o currículo.');
              }
              return data.translatedCV as CVData;
            });

      // Translate Cover Letter whenever present and not already genuinely in targetLang
      const letterPromise =
        !sourceHasLetter || (sourceLetterLang === targetLang && actualLetterLang === targetLang)
          ? Promise.resolve(sourceEntry.letterBody)
          : authorizedFetch('/api/translate-letter', {
              method: 'POST',
              body: JSON.stringify({
                text: sourceEntry.letterBody,
                targetLanguage: targetLang,
                adminPromptConfig: adminTranslateConfig
              })
            }).then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data.error || `Erro ${res.status} ao traduzir a carta.`);
              }
              return (data.translatedText as string) || sourceEntry.letterBody;
            });

      const [translatedCVRaw, translatedLetter] = await Promise.all([cvPromise, letterPromise]);

      // Ignore stale response if user switched to another language in the meantime
      if (reqId !== translationReqIdRef.current) return;

      const mergedCV: CVData = {
        ...sourceEntry.cv,
        ...translatedCVRaw,
        templateStyle: latestCv.templateStyle,
        accentColor: latestCv.accentColor,
        fontFamily: latestCv.fontFamily,
        sectionOrder: latestCv.sectionOrder,
        sectionVisibility: latestCv.sectionVisibility
      };

      translationCacheRef.current[targetLang] = {
        cv: mergedCV,
        letterBody: translatedLetter,
        verified: true
      };
      activeContentLangRef.current = targetLang;
      setContentLanguage(targetLang);
      latestStateRef.current = { cv: mergedCV, letterBody: translatedLetter };
      try {
        localStorage.setItem('curriculo_content_lang_v1', targetLang);
      } catch {
        // ignore
      }

      setCv(mergedCV);
      setLetterBodyState(translatedLetter);
      showSuccess(
        appUi.translatedTitle,
        `${appUi.translatedSubPrefix} ${langLabel}.`
      );
      if (user) {
        void dispatchUserNotification({
          user,
          eventType: 'translation',
          title: appUi.notifTranslateTitle,
          message: `${appUi.notifTranslateMsgPrefix} ${langLabel}.`,
          targetResource: `translation/${targetLang}`
        });
      }
    } catch (err: any) {
      if (reqId !== translationReqIdRef.current) return;
      console.error('Erro ao traduzir conteúdo:', err);
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: user?.email || cv.personalDetails.email || 'anonymous',
        operationType: 'translation_api',
        errorMessage: `[Translation:${targetLang}] ${err?.message || 'Erro de tradução'}`,
        modelUsed: adminTranslateConfig?.preferredModel || 'gemini-3.1-flash-lite',
        resolved: false
      });
      showError(
        appUi.translationErrorTitle,
        err?.message || appUi.translationErrorFallback
      );
    } finally {
      if (reqId === translationReqIdRef.current) {
        setIsTranslatingContent(false);
        setTranslatingTargetLang(null);
      }
    }
  }, [cv, hasActivePlan, isAuthenticated, letterBody, showError, showInfo, showSuccess, user, appUi, handleOpenPricingModal]);

  const handleExportWord = async () => {
    const requirePaidPlanForExport = platformSettings.requirePaidPlanForExport !== false;
    if (requirePaidPlanForExport && !isAuthenticated) {
      void recordAuditLog({
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: activeTab === 'cover' ? 'cover-letter/docx' : 'resumes/docx',
        details: 'Tentativa de exportação Word (.docx) bloqueada: utilizador não autenticado.',
        metadata: { format: 'docx', reason: 'unauthenticated' }
      });
      handleOpenAuth(appUi.authExportPrompt);
      return;
    }
    if (requirePaidPlanForExport && !hasActivePlan) {
      void recordAuditLog({
        actorUserId: user?.id,
        actorEmail: user?.email,
        actorRole: user?.role === 'admin' ? 'admin' : 'user',
        action: 'cv_export_blocked_unauthorized',
        category: 'cv_export',
        severity: 'warning',
        status: 'blocked',
        targetResource: activeTab === 'cover' ? 'cover-letter/docx' : 'resumes/docx',
        details: `Tentativa de exportação Word (.docx) bloqueada: plano '${user?.plan || 'free'}' sem permissão de exportação oficial.`,
        metadata: { format: 'docx', plan: user?.plan || 'free', reason: 'plan_required' }
      });
      handleOpenPricingModal(appUi.planExportPrompt);
      return;
    }
    try {
      setIsExportingWord(true);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo_Estrategico';

      if (activeTab === 'cover') {
        const blob = await generateCoverLetterDocx(cv, letterBody, true, contentLanguage);
        triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
        trackFrontendTelemetry({ type: 'word_exported' });
        void recordAuditLog({
          actorUserId: user?.id,
          actorEmail: user?.email,
          actorRole: user?.role === 'admin' ? 'admin' : 'user',
          action: 'cv_exported_docx',
          category: 'cv_export',
          severity: 'info',
          status: 'success',
          targetResource: 'cover-letter/docx',
          details: `Carta de apresentação exportada em Word (.docx) no idioma ${contentLanguage.toUpperCase()}.`,
          metadata: { format: 'docx', documentType: 'cover_letter', language: contentLanguage }
        });
        setWordNotificationMessage(appUi.wordToastLetter);
        showSuccess(
          appUi.exportLetterTitle,
          `${appUi.exportLetterSubPrefix} Carta_Apresentacao_${sanitizedName}.docx ${appUi.exportLetterSubSuffix}`
        );
        if (user) {
          void dispatchUserNotification({
            user,
            eventType: 'export',
            title: appUi.notifExportTitle,
            message: `${appUi.notifExportLetterMsgPrefix} Carta_Apresentacao_${sanitizedName}.docx (${contentLanguage.toUpperCase()}).`,
            targetResource: 'cover-letter/docx'
          });
        }
      } else {
        const templateInfo = getTemplateById(cv.templateStyle);
        const templateTag = templateInfo.shortName.replace(/[^a-zA-Z0-9]/g, '_');
        const blob = await generateWordDocument(cv, true, density, contentLanguage);
        triggerDownload(blob, `Curriculo_${sanitizedName}_${templateTag}.docx`);
        trackFrontendTelemetry({ type: 'word_exported', templateStyle: cv.templateStyle });
        void recordAuditLog({
          actorUserId: user?.id,
          actorEmail: user?.email,
          actorRole: user?.role === 'admin' ? 'admin' : 'user',
          action: 'cv_exported_docx',
          category: 'cv_export',
          severity: 'info',
          status: 'success',
          targetResource: `resumes/${cv.templateStyle}/docx`,
          details: `Currículo exportado em Word (.docx) — modelo ${templateInfo.shortName} (${contentLanguage.toUpperCase()}).`,
          metadata: { format: 'docx', templateStyle: cv.templateStyle, language: contentLanguage }
        });
        setWordNotificationMessage(`${appUi.wordToastCvPrefix} (${templateInfo.shortName}) ${appUi.wordToastCvSuffix}`);
        showSuccess(
          appUi.exportCvTitle,
          `${appUi.exportCvSubPrefix} ${templateInfo.shortName} ${appUi.exportCvSubSuffix}`
        );
        if (user) {
          void dispatchUserNotification({
            user,
            eventType: 'export',
            title: appUi.notifExportTitle,
            message: `${appUi.notifExportCvMsgPrefix} ${templateInfo.shortName} (${contentLanguage.toUpperCase()}) (.docx).`,
            targetResource: `resumes/${cv.templateStyle}/docx`
          });
        }
      }

      setWordSuccessNotification(true);
      setTimeout(() => setWordSuccessNotification(false), 4000);
    } catch (err: any) {
      console.error('Falha ao exportar documento Word:', err);
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: user?.email || cv.personalDetails.email || 'anonymous',
        operationType: 'docx_export',
        errorMessage: `[WordExport] ${err?.message || 'Erro desconhecido ao compilar .docx'}`,
        resolved: false
      });
      showError(appUi.exportErrorTitle, appUi.exportErrorDesc);
    } finally {
      setIsExportingWord(false);
    }
  };

  const isShowcaseMode =
    activeTab === 'models-cv' ||
    activeTab === 'examples-cv' ||
    activeTab === 'models-cover' ||
    activeTab === 'examples-cover';
  const isStudioMode = activeTab !== 'home' && activeTab !== 'profile' && !isShowcaseMode;
  const isAdminViewer = isUserAdmin(user?.email, user?.role);
  const activePlanQuota = planQuotas.find((q) => q.planId === (user?.plan || 'free'));
  const canUseAiTailor = isAdminViewer || (activePlanQuota ? activePlanQuota.allowAiTailor : isPro);
  const canUseAtsRadar = isAdminViewer || (activePlanQuota ? activePlanQuota.allowAtsRadar : isPro);
  const canUseCoverLetter = isAdminViewer || (activePlanQuota ? activePlanQuota.allowCoverLetter : isPro);
  const canUseInterviewSim = isAdminViewer || (activePlanQuota ? activePlanQuota.allowInterviewSim : isExecutive);

  if (platformSettings.maintenanceMode && !isAdminViewer) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              {appUi.maintenanceBadge}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {appUi.maintenanceTitle}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {platformSettings.maintenanceMessage || appUi.maintenanceDefaultMsg}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAuth(appUi.maintenanceAdminPrompt, 'login')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              {appUi.maintenanceAdminBtn}
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthModalPrompt(undefined);
          }}
          promptMessage={authModalPrompt}
          defaultMode="login"
        />
      </div>
    );
  }

  return (
    <div
      className={`${
        isStudioMode ? 'h-dvh overflow-hidden' : 'min-h-dvh'
      } bg-slate-100 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white w-full max-w-full overflow-x-hidden`}
    >
      {/* Admin Maintenance Mode Active Alert */}
      {platformSettings.maintenanceMode && isAdminViewer && (
        <div className="no-print bg-amber-950 text-amber-100 px-4 py-1.5 text-xs flex items-center justify-between border-b border-amber-800 z-50">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>{appUi.adminMaintTitle}</strong> {appUi.adminMaintDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminDashboardOpen(true)}
            className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
          >
            {appUi.adminMaintBtn}
          </button>
        </div>
      )}

      {/* Impersonation Active Banner */}
      {isImpersonating && (
        <div className="no-print bg-slate-900 text-amber-100 px-4 py-2 text-xs flex items-center justify-between border-b border-amber-500/40 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{appUi.impersonateTitle}</strong> {appUi.impersonateAs}{' '}
              <span className="font-semibold text-white underline">{user?.name}</span> ({user?.email}).
            </span>
          </div>
          <button
            type="button"
            onClick={stopImpersonating}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 rounded text-xs font-bold text-slate-950 transition-colors shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            {appUi.impersonateExitBtn}
          </button>
        </div>
      )}

      {/* Broadcast System Banner (Admin Configurable) */}
      <SystemNotificationBanner
        onOpenPricing={() => handleOpenPricingModal()}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Top Bar Navigation Contract with SaaS actions */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportWord={handleExportWord}
        isExportingWord={isExportingWord}
        onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
        onOpenPricingModal={() => handleOpenPricingModal()}
        onOpenMyResumesModal={() => setIsMyResumesModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenTemplateAdvisor={() => setIsTemplateAdvisorOpen(true)}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        onOpenNotificationPreferences={handleOpenNotificationPreferences}
        onOpenSupportChat={() => setIsSupportChatOpen(true)}
        supportChatUnreadCount={supportChatUnreadCount}
      />

      {/* Word Export Floating Toast Notification */}
      {wordSuccessNotification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold">{wordNotificationMessage || appUi.wordToastDefault}</p>
            <p className="text-slate-300">{appUi.wordToastSub}</p>
          </div>
        </div>
      )}

      {/* View Mode Switching: Home Landing vs Public Showcase Gallery vs User Profile vs Studio Dual-Pane */}
      {activeTab === 'home' ? (
        <main className="flex-1 overflow-y-auto">
          <LandingHeroView
            onStartCreating={() =>
              handleUseShowcaseItem({
                targetTab: 'raw',
                label: appUi.resumeBuilderLabel
              })
            }
            onOpenPricing={() => handleOpenPricingModal()}
            onSelectPlanForCheckout={(plan, cycle) => handleOpenPricingModal(undefined, plan, cycle)}
            onSelectTemplate={(templateId) => {
              const info = getTemplateById(templateId as any);
              handleUseShowcaseItem({
                targetTab: 'editor',
                label: `${appUi.modelLabelPrefix} ${info.shortName}`,
                templateStyle: templateId as any,
                accentColor: info.accentColor
              });
            }}
            onOpenTemplateAdvisor={() => setIsTemplateAdvisorOpen(true)}
            onOpenShowcase={(mode) => setActiveTab(mode)}
            currentCV={cv}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        </main>
      ) : isShowcaseMode ? (
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <ShowcaseGalleryView
            mode={activeTab as ShowcaseMode}
            onChangeMode={(mode) => setActiveTab(mode)}
            onUseSelection={handleUseShowcaseItem}
            onOpenPricing={() => handleOpenPricingModal()}
          />
        </main>
      ) : activeTab === 'profile' ? (
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <UserProfileView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onLoadResume={(loadedCV) => {
              updateCvWithCache(loadedCV);
              setActiveTab('editor');
            }}
            currentCV={cv}
            onOpenAuth={() => handleOpenAuth()}
            initialSubTab={profileInitialSubTab}
          />
        </main>
      ) : (
        <>
          {/* Mobile Toggle Bar for Studio */}
          <div className="no-print shrink-0 lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setMobileViewMode('controls')}
                title={studioNav.tabs.editor.tooltip}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  mobileViewMode === 'controls'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>{siteText.app.mobileEditorTab}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('preview')}
                title={activeTab === 'cover' ? studioNav.tabs.cover.tooltip : studioNav.tabs.editor.tooltip}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  mobileViewMode === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{activeTab === 'cover' ? siteText.app.mobileViewA4Cover : siteText.app.mobileViewA4Cv}</span>
              </button>
            </div>
          </div>

          {/* Main Studio Dual-Pane Layout (Bounded cleanly via flex-1 min-h-0 so footers never clip) */}
          <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side: Control Deck / Tool Tabs */}
            <section
              className={`w-full lg:w-[46%] xl:w-[42%] 2xl:w-[38%] flex-1 lg:flex-none min-h-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden no-print ${
                mobileViewMode === 'preview' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Studio Compact 2-Row Mode Switcher (Importar First, Zero Hidden Tabs) */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 min-w-0 px-3 sm:px-4 py-1.5 space-y-1">
                {/* Tier 1: Core 1-2-3 Creation Flow */}
                <div
                  role="tablist"
                  aria-label={studioNav.primaryGroupLabel}
                  className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'raw'}
                    onClick={() => setActiveTab('raw')}
                    title={studioNav.tabs.raw.tooltip}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'raw'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.raw.label}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'editor'}
                    onClick={() => setActiveTab('editor')}
                    title={studioNav.tabs.editor.tooltip}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'editor'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="truncate">{studioNav.tabs.editor.label}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'cover'}
                    onClick={() => setActiveTab('cover')}
                    title={studioNav.tabs.cover.tooltip}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'cover'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.cover.label}</span>
                  </button>
                </div>

                {/* Tier 2: Optimization & Job Application Tools (All Visible, Zero Scroll Clipping) */}
                <div
                  role="tablist"
                  aria-label={studioNav.toolsGroupLabel}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ai'}
                    onClick={() => setActiveTab('ai')}
                    title={studioNav.tabs.ai.tooltip}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'ai'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wand2 className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.ai.label}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ats'}
                    onClick={() => setActiveTab('ats')}
                    title={studioNav.tabs.ats.tooltip}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'ats'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.ats.label}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'jobs'}
                    onClick={() => setActiveTab('jobs')}
                    title={studioNav.tabs.jobs.tooltip}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'jobs'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.jobs.label}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'interview'}
                    onClick={() => setActiveTab('interview')}
                    title={studioNav.tabs.interview.tooltip}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                      activeTab === 'interview'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span className="truncate">{studioNav.tabs.interview.label}</span>
                  </button>
                </div>
              </div>

              {/* Active Tab Panel View */}
              <div
                className={
                  activeTab === 'editor'
                    ? 'flex-1 flex flex-col min-h-0 overflow-hidden'
                    : 'p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto'
                }
              >
                {activeTab === 'raw' && (
                  !hasActivePlan ? (
                    <PlanGateGuard
                      requiredTier={isAuthenticated ? 'pro' : 'authenticated'}
                      featureTitle={studioText.gates.raw.title}
                      featureSubtitle={
                        isAuthenticated
                          ? studioText.gates.raw.subtitleAuth
                          : studioText.gates.raw.subtitleVisitor
                      }
                      featureBenefits={studioText.gates.raw.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : (
                    <RawInputGenerator
                      onCVGenerated={(newCV) => {
                        updateCvWithCache(newCV);
                        setActiveTab('editor');
                      }}
                      currentJobDescription={jobDescription}
                      onUpdateJobDescription={setJobDescription}
                      onOpenPreview={() => {
                        setMobileViewMode('preview');
                      }}
                    />
                  )
                )}

                {activeTab === 'editor' && (
                  !hasActivePlan ? (
                    <PlanGateGuard
                      requiredTier={isAuthenticated ? 'pro' : 'authenticated'}
                      featureTitle={studioText.gates.editor.title}
                      featureSubtitle={
                        isAuthenticated
                          ? studioText.gates.editor.subtitleAuth
                          : studioText.gates.editor.subtitleVisitor
                      }
                      featureBenefits={studioText.gates.editor.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : (
                    <ContentEditor
                      cv={cv}
                      onChange={updateCvWithCache}
                      onOpenAiTailor={() => setActiveTab('ai')}
                      onOpenCoverLetter={() => setActiveTab('cover')}
                      onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
                      onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
                      density={density}
                      onDensityChange={setDensity}
                    />
                  )
                )}

                {activeTab === 'ats' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle={studioText.gates.atsVisitor.title}
                      featureSubtitle={studioText.gates.atsVisitor.subtitle}
                      featureBenefits={studioText.gates.atsVisitor.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : !canUseAtsRadar ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle={studioText.gates.atsPro.title}
                      featureSubtitle={studioText.gates.atsPro.subtitle}
                      featureBenefits={studioText.gates.atsPro.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : (
                    <AtsRadarPanel
                      cv={cv}
                      onChange={updateCvWithCache}
                      jobDescription={jobDescription}
                      setJobDescription={setJobDescription}
                      onOpenAiTailor={() => setActiveTab('ai')}
                    />
                  )
                )}

                {activeTab === 'jobs' && (
                  <JobMatchesPanel
                    cv={cv}
                    onApplyJobToTailor={(desc, tab) => {
                      setJobDescription(desc);
                      setActiveTab(tab);
                    }}
                  />
                )}

                {activeTab === 'ai' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle={studioText.gates.aiVisitor.title}
                      featureSubtitle={studioText.gates.aiVisitor.subtitle}
                      featureBenefits={studioText.gates.aiVisitor.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : !canUseAiTailor ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle={studioText.gates.aiPro.title}
                      featureSubtitle={studioText.gates.aiPro.subtitle}
                      featureBenefits={studioText.gates.aiPro.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : (
                    <AiTailorPanel
                      cv={cv}
                      onChange={updateCvWithCache}
                      jobDescription={jobDescription}
                    />
                  )
                )}

                {activeTab === 'interview' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle={studioText.gates.interviewVisitor.title}
                      featureSubtitle={studioText.gates.interviewVisitor.subtitle}
                      featureBenefits={studioText.gates.interviewVisitor.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => handleOpenPricingModal(undefined, 'executive')}
                    />
                  ) : !canUseInterviewSim ? (
                    <PlanGateGuard
                      requiredTier="executive"
                      featureTitle={studioText.gates.interviewExec.title}
                      featureSubtitle={studioText.gates.interviewExec.subtitle}
                      featureBenefits={studioText.gates.interviewExec.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => handleOpenPricingModal(undefined, 'executive')}
                    />
                  ) : (
                    <InterviewSimulator
                      currentCV={cv}
                      jobDescription={jobDescription}
                      onUpdateJobDescription={setJobDescription}
                      onOpenPricing={() => handleOpenPricingModal(undefined, 'executive')}
                    />
                  )
                )}

                {activeTab === 'cover' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle={studioText.gates.coverVisitor.title}
                      featureSubtitle={studioText.gates.coverVisitor.subtitle}
                      featureBenefits={studioText.gates.coverVisitor.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : !canUseCoverLetter ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle={studioText.gates.coverPro.title}
                      featureSubtitle={studioText.gates.coverPro.subtitle}
                      featureBenefits={studioText.gates.coverPro.benefits}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={(targetPlan) => handleOpenPricingModal(undefined, targetPlan || 'pro')}
                    />
                  ) : (
                    <CoverLetterPanel
                      cv={cv}
                      jobDescription={jobDescription}
                      letterBody={letterBody}
                      setLetterBody={updateLetterWithCache}
                      onExportWord={handleExportWord}
                      isExportingWord={isExportingWord}
                      onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
                      onSelectLanguage={handleSwitchLanguage}
                      isTranslatingContent={isTranslatingContent}
                      contentLanguage={contentLanguage}
                    />
                  )
                )}
              </div>
            </section>

            {/* Right Side: High-Fidelity A4 Document Canvas */}
            <section
              className={`flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-slate-200/70 ${
                mobileViewMode === 'controls' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {!hasActivePlan && (
                <div className="bg-amber-50 border-b border-amber-200/80 text-amber-950 px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-medium text-amber-900">
                      {!isAuthenticated
                        ? siteText.app.previewGuestNotice
                        : siteText.app.previewFreeNotice}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => (!isAuthenticated ? handleOpenAuth(appUi.authCreateSavePrompt) : setIsPricingModalOpen(true))}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors ml-auto shadow-2xs whitespace-nowrap shrink-0"
                  >
                    {!isAuthenticated ? siteText.app.createAccountBtn : siteText.app.activateProBtn}
                  </button>
                </div>
              )}
              {activeTab === 'cover' ? (
                <CoverLetterDocumentView
                  cv={cv}
                  letterBody={letterBody}
                  onExportWord={handleExportWord}
                  isExportingWord={isExportingWord}
                  onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
                  onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
                  onSelectLanguage={handleSwitchLanguage}
                  isTranslatingContent={isTranslatingContent}
                  translatingTargetLang={translatingTargetLang}
                  contentLanguage={contentLanguage}
                />
              ) : (
                <CVDocumentView
                  cv={cv}
                  onChange={updateCvWithCache}
                  onExportWord={handleExportWord}
                  isExportingWord={isExportingWord}
                  onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
                  onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
                  density={density}
                  onDensityChange={setDensity}
                  onSelectLanguage={handleSwitchLanguage}
                  isTranslatingContent={isTranslatingContent}
                  translatingTargetLang={translatingTargetLang}
                  contentLanguage={contentLanguage}
                />
              )}
            </section>
          </main>

          {/* Mobile Bottom Thumb Navigation (Shrink-0 flex child so it never covers sticky editor footers) */}
          <nav className="no-print lg:hidden shrink-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-1.5 py-1.5 flex items-center justify-around shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('raw');
                setMobileViewMode('controls');
              }}
              title={studioNav.tabs.raw.tooltip}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                activeTab === 'raw' && mobileViewMode === 'controls'
                  ? 'text-slate-950 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-600" />
              <span className="truncate max-w-[64px]">{studioNav.tabs.raw.shortLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('editor');
                setMobileViewMode('controls');
              }}
              title={studioNav.tabs.editor.tooltip}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors relative ${
                activeTab === 'editor' && mobileViewMode === 'controls'
                  ? 'text-slate-950 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Edit3 className="w-4 h-4" />
                {!hasActivePlan && (
                  <Lock className="w-2.5 h-2.5 text-amber-700 absolute -top-1 -right-2" />
                )}
              </div>
              <span className="truncate max-w-[64px]">{studioNav.tabs.editor.shortLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('cover');
                setMobileViewMode('controls');
              }}
              title={studioNav.tabs.cover.tooltip}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                activeTab === 'cover' && mobileViewMode === 'controls'
                  ? 'text-slate-950 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-600" />
              <span className="truncate max-w-[64px]">{studioNav.tabs.cover.shortLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileViewMode('preview');
              }}
              title={siteText.app.mobileViewA4Cv}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                mobileViewMode === 'preview'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{siteText.app.bottomViewA4}</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              title={siteText.header.downloadWord}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                !hasActivePlan
                  ? 'text-amber-800 dark:text-amber-400 hover:text-amber-900'
                  : 'text-slate-900 dark:text-slate-100 hover:text-slate-950'
              }`}
            >
              {!hasActivePlan ? (
                <Lock className="w-4 h-4 text-amber-700" />
              ) : (
                <Download className="w-4 h-4 text-slate-900 dark:text-slate-100" />
              )}
              <span>{isExportingWord ? studioText.docToolbar.generating : !hasActivePlan ? appUi.wordBadgeLocked : appUi.wordBadgeOpen}</span>
            </button>
          </nav>
        </>
      )}

      {/* SaaS Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalPrompt(undefined);
          if (!isAuthenticated) {
            setPendingModelTarget(null);
            setPendingCheckout(null);
          }
        }}
        promptMessage={authModalPrompt}
        defaultMode={authDefaultMode}
      />

      {/* SaaS Pricing & Subscription Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => {
          setIsPricingModalOpen(false);
          setPricingPromptMessage(undefined);
          setPricingInitialPlan(undefined);
          setPricingInitialCycle(undefined);
          if (!hasActivePlan) {
            setPendingModelTarget(null);
          }
        }}
        promptMessage={pricingPromptMessage}
        initialPlan={pricingInitialPlan}
        initialCycle={pricingInitialCycle}
        onRequireAuth={(msg, mode, checkoutSelection) => {
          setPendingCheckout(checkoutSelection);
          setIsPricingModalOpen(false);
          handleOpenAuth(msg, mode);
        }}
      />

      {/* Dedicated User Profile & Subscription Account Area Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        onOpenPricing={() => handleOpenPricingModal()}
        onOpenMyResumes={() => setIsMyResumesModalOpen(true)}
        onOpenNotificationPreferences={handleOpenNotificationPreferences}
      />

      {/* My Saved Resumes Library Modal */}
      <MyResumesModal
        isOpen={isMyResumesModalOpen}
        onClose={() => setIsMyResumesModalOpen(false)}
        currentCV={cv}
        onLoadResume={(loadedCV) => updateCvWithCache(loadedCV)}
        onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
      />

      {/* SaaS Admin Backend Portal & Database Management */}
      <SaaSAdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />

      {/* Global Template Advisor & Strategic Guide Modal */}
      <TemplateAdvisorModal
        isOpen={isTemplateAdvisorOpen}
        onClose={() => setIsTemplateAdvisorOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={(newStyle) => updateCvWithCache((prev) => ({ ...prev, templateStyle: newStyle }))}
        cv={cv}
        onUpdateCV={updateCvWithCache}
        onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
        onOpenPricingModal={(msg) => handleOpenPricingModal(msg)}
      />

      {/* Registered User Direct Support Chat Modal */}
      <SupportChatModal
        isOpen={isSupportChatOpen}
        onClose={() => setIsSupportChatOpen(false)}
        onUnreadCountChange={setSupportChatUnreadCount}
      />
    </div>
  );
}
