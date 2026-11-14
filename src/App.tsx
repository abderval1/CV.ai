import { useState, useEffect, useRef, useCallback } from 'react';
import { CVData } from './types/cv';
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
import { SystemNotificationBanner } from './components/SystemNotificationBanner';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from './context/LanguageContext';
import { detectCVLanguage, detectTextLanguage } from './utils/languageDetect';
import { generateWordDocument, generateCoverLetterDocx, triggerDownload } from './utils/docxExport';
import { getTemplateById } from './data/templateCatalog';
import { isUserAdmin } from './services/saasDbService';
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
  trackFrontendTelemetry,
  logGenerationError,
  emitAdminConfigUpdated
} from './services/adminModulesService';
import { FileText, SlidersHorizontal, Check, Home, Edit3, Target, Download, Sparkles, Lock, Mail, ShieldAlert, LogOut, Wrench } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isPro, isExecutive, hasActivePlan, isImpersonating, stopImpersonating } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { language: appLanguage, setLanguage } = useLanguage();

  const [cv, setCv] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem('curriculo_draft_v1');
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
      const savedJob = localStorage.getItem('curriculo_job_draft_v1');
      if (savedJob && savedJob.trim().length > 10) {
        return savedJob;
      }
    } catch {
      // Fallback
    }
    return SAMPLE_JOB_OFFERS[0].description;
  });

  // Debounced auto-save of active draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('curriculo_draft_v1', JSON.stringify(cv));
        localStorage.setItem('curriculo_job_draft_v1', jobDescription);
      } catch (e) {
        console.warn('Falha ao gravar rascunho local:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cv, jobDescription]);

  // Online / Offline network awareness
  useEffect(() => {
    const handleOnline = () => showSuccess('Ligação Restabelecida', 'A ligação à internet foi recuperada.');
    const handleOffline = () => showError('Modo Offline', 'Sem internet. O seu trabalho continua guardado no navegador.');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [mobileViewMode, setMobileViewMode] = useState<'controls' | 'preview'>('controls');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [wordSuccessNotification, setWordSuccessNotification] = useState<boolean>(false);
  const [wordNotificationMessage, setWordNotificationMessage] = useState<string>(
    'Ficheiro Word (.docx) Descarregado!'
  );

  // Modal states for SaaS
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [pricingPromptMessage, setPricingPromptMessage] = useState<string | undefined>(undefined);
  const [pendingModelTarget, setPendingModelTarget] = useState<{
    targetTab: 'editor' | 'cover' | 'raw';
    label: string;
  } | null>(null);
  const prevAuthRef = useRef<boolean>(isAuthenticated);
  const [isMyResumesModalOpen, setIsMyResumesModalOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isTemplateAdvisorOpen, setIsTemplateAdvisorOpen] = useState<boolean>(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());
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
      .then(([settings]) => {
        if (!mounted) return;
        setPlatformSettings(settings);
        emitAdminConfigUpdated('hydrate');
      })
      .catch((err) => console.warn('Erro ao hidratar configurações do Admin:', err));

    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
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

  const handleOpenPricingModal = (prompt?: string) => {
    setPricingPromptMessage(
      prompt ||
        'Para descarregar o seu currículo em Microsoft Word (.docx) ou PDF limpo sem marcas de água, subscreva um plano Pro ou Executive.'
    );
    setIsPricingModalOpen(true);
  };

  const [letterBody, setLetterBodyState] = useState<string>(() => {
    try {
      const savedLetter = localStorage.getItem('curriculo_letter_draft_v1');
      if (savedLetter && savedLetter.trim().length > 10) {
        return savedLetter;
      }
    } catch {
      // Fallback
    }
    return `Para: Comité de Seleção Executiva
Diretoria de Liderança Corporativa
Assunto: Candidatura para Posição de Liderança Executiva / Direção de Operações

Exmos. Senhores Membros do Comité de Seleção,

É com elevado entusiasmo e sólido compromisso profissional que apresento a minha candidatura para esta posição executiva. Com trajetória progressiva na condução de excelência operacional, transformação digital e gestão estratégica de P&L, trago um histórico comprovado de resultados quantificáveis em mercados globais competitivos.

Nas minhas atribuições recentes de liderança, fui responsável por arquitetar fluxos de trabalho de nível corporativo, escalar equipas multifuncionais e entregar otimizações operacionais milionárias. O meu percurso combina rigor analítico aprofundado com domínio prático em Business Intelligence, governança automatizada e alinhamento estratégico com stakeholders.

Adicionalmente, a minha abordagem está alinhada com os padrões internacionais de governança corporativa e metodologias modernas de gestão, capacitando conselhos de administração e lideranças executivas a tomarem decisões ágeis e orientadas por dados.

Motivado pela visão estratégica e pelo crescimento contínuo da vossa organização, coloco-me à disposição para detalhar as minhas qualificações e demonstrar como posso gerar valor imediato numa entrevista estratégica.

Atenciosamente,

${GENERIC_DEFAULT_CV.personalDetails.name}
${GENERIC_DEFAULT_CV.personalDetails.title}
${GENERIC_DEFAULT_CV.personalDetails.phone} | ${GENERIC_DEFAULT_CV.personalDetails.email}`;
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
    return 'pt';
  })();

  const activeContentLangRef = useRef<LanguageCode>(initialContentLang);
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

  // Persist letterBody draft alongside cv draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('curriculo_letter_draft_v1', letterBody);
      } catch (e) {
        console.warn('Falha ao gravar rascunho da carta:', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [letterBody]);

  // Wrap CV and Cover Letter setters so manual edits or imports tag the real detected language
  // and invalidate stale translations from earlier content.
  const updateCvWithCache = useCallback((updater: CVData | ((prev: CVData) => CVData)) => {
    setCv((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const detectedLang = detectCVLanguage(next);
      const lang = (detectedLang as LanguageCode | null) || activeContentLangRef.current;
      activeContentLangRef.current = lang;
      lastEditedLangRef.current = lang;
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

    if (!pendingModelTarget) return;

    if (isAuthenticated && hasActivePlan) {
      setActiveTab(pendingModelTarget.targetTab);
      setMobileViewMode('controls');
      setIsPricingModalOpen(false);
      setIsAuthModalOpen(false);
      showSuccess('Acesso Desbloqueado!', `${pendingModelTarget.label} pronto para edição.`);
      setPendingModelTarget(null);
      return;
    }

    if (justAuthenticated && isAuthenticated && !hasActivePlan) {
      setIsAuthModalOpen(false);
      handleOpenPricingModal(
        `Conta autenticada! Ative o plano Pro ($8/mês) ou Executivo VIP ($12/mês) via Cartão ou Pix para começar a criar no ${pendingModelTarget.label}.`
      );
    }
  }, [isAuthenticated, hasActivePlan, pendingModelTarget, showSuccess]);

  const handleUseShowcaseItem = useCallback(
    (payload: ShowcaseSelectionPayload | { targetTab: 'raw'; label: string }) => {
      if ('cvData' in payload && payload.cvData) {
        updateCvWithCache(payload.cvData);
      } else if ('templateStyle' in payload && payload.templateStyle) {
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
          `Crie a sua conta ou inicie sessão para usar o ${payload.label} e começar a criar.`,
          'register'
        );
        return;
      }

      if (!hasActivePlan) {
        setPendingModelTarget({ targetTab: payload.targetTab, label: payload.label });
        handleOpenPricingModal(
          `A edição e download de modelos e exemplos requer subscrição ativa. Escolha o plano Pro ($8/mês) ou Executivo VIP ($12/mês) via Cartão (Stripe) ou Pix para abrir o ${payload.label}.`
        );
        return;
      }

      setActiveTab(payload.targetTab);
      setMobileViewMode('controls');
      showSuccess('Modelo Carregado!', `${payload.label} aberto para edição.`);
    },
    [hasActivePlan, isAuthenticated, showSuccess, updateCvWithCache, updateLetterWithCache]
  );

  // Translate BOTH CV content and Cover Letter content whenever any language selector is clicked
  const handleSwitchLanguage = useCallback(async (targetLang: LanguageCode) => {
    if (!isAuthenticated) {
      handleOpenAuth(
        'Crie uma conta ou inicie sessão para traduzir o conteúdo do currículo e carta de apresentação.',
        'register'
      );
      return;
    }
    if (!hasActivePlan) {
      handleOpenPricingModal(
        'A tradução integral do currículo e carta para Inglês, Espanhol, Francês ou Alemão é exclusiva para assinantes Pro ($8/mês) ou Executivo VIP ($12/mês).'
      );
      return;
    }
    setLanguage(targetLang);
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
        showInfo('Idioma Alterado', `Currículo e carta exibidos em ${langLabel}.`);
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
          : fetch('/api/translate-cv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
          : fetch('/api/translate-letter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
      latestStateRef.current = { cv: mergedCV, letterBody: translatedLetter };
      try {
        localStorage.setItem('curriculo_content_lang_v1', targetLang);
      } catch {
        // ignore
      }

      setCv(mergedCV);
      setLetterBodyState(translatedLetter);
      showSuccess(
        'Conteúdo Traduzido!',
        `Currículo e Carta de Apresentação traduzidos para ${langLabel}.`
      );
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
        'Erro na Tradução do Conteúdo',
        err?.message || 'Não foi possível traduzir o conteúdo neste momento. Tente novamente.'
      );
    } finally {
      if (reqId === translationReqIdRef.current) {
        setIsTranslatingContent(false);
        setTranslatingTargetLang(null);
      }
    }
  }, [cv, hasActivePlan, isAuthenticated, letterBody, setLanguage, showError, showInfo, showSuccess, user?.email]);

  const handleExportWord = async () => {
    const requirePaidPlanForExport = platformSettings.requirePaidPlanForExport !== false;
    if (requirePaidPlanForExport && !isAuthenticated) {
      handleOpenAuth('O registo é obrigatório para descarregar o currículo em formato Word (.docx). Registe-se ou inicie sessão para continuar.');
      return;
    }
    if (requirePaidPlanForExport && !hasActivePlan) {
      handleOpenPricingModal(
        'Os downloads oficiais em formato Microsoft Word (.docx) e PDF de Alta Resolução são exclusivos para subscritores. Ative o seu plano para descarregar o documento oficial sem marca de água.'
      );
      return;
    }
    try {
      setIsExportingWord(true);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo_Estrategico';

      if (activeTab === 'cover') {
        const blob = await generateCoverLetterDocx(cv, letterBody, true, appLanguage);
        triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
        trackFrontendTelemetry({ type: 'word_exported' });
        setWordNotificationMessage('Carta de Apresentação em Word (.docx) Oficial Descarregada!');
        showSuccess(
          'Carta de Apresentação Descarregada!',
          `O ficheiro Carta_Apresentacao_${sanitizedName}.docx foi gerado com sucesso sem marcas de água.`
        );
      } else {
        const templateInfo = getTemplateById(cv.templateStyle);
        const templateTag = templateInfo.shortName.replace(/[^a-zA-Z0-9]/g, '_');
        const blob = await generateWordDocument(cv, true, density, appLanguage);
        triggerDownload(blob, `Curriculo_${sanitizedName}_${templateTag}.docx`);
        trackFrontendTelemetry({ type: 'word_exported', templateStyle: cv.templateStyle });
        setWordNotificationMessage(`Currículo Word (${templateInfo.shortName}) Oficial Descarregado com Sucesso!`);
        showSuccess(
          'Currículo Word Descarregado!',
          `Modelo ${templateInfo.shortName} gerado com formatação nativa OpenXML e compatibilidade ATS 100%.`
        );
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
      showError('Erro na Exportação', 'Não foi possível compilar o documento Word. Verifique os dados inseridos.');
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

  if (platformSettings.maintenanceMode && !isAdminViewer) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Manutenção Programada
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Plataforma Temporariamente em Atualização
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {platformSettings.maintenanceMessage ||
                'Estamos a realizar melhorias programadas nos servidores. Voltamos em instantes.'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAuth('Acesso reservado a administradores durante manutenção.', 'login')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              Acesso Administrador
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
              <strong>Modo de Manutenção ATIVO:</strong> Utilizadores comuns estão bloqueados. Apenas administradores conseguem aceder.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminDashboardOpen(true)}
            className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
          >
            Gerir no Admin
          </button>
        </div>
      )}

      {/* Impersonation Active Banner */}
      {isImpersonating && (
        <div className="no-print bg-purple-950 text-purple-100 px-4 py-2 text-xs flex items-center justify-between border-b border-purple-800 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Modo de Personificação Ativo:</strong> A navegar como{' '}
              <span className="font-semibold text-white underline">{user?.name}</span> ({user?.email}).
            </span>
          </div>
          <button
            type="button"
            onClick={stopImpersonating}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold text-white transition-colors shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair e Voltar ao Admin
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
        onSelectLanguage={handleSwitchLanguage}
        isTranslatingContent={isTranslatingContent}
      />

      {/* Word Export Floating Toast Notification */}
      {wordSuccessNotification && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold">{wordNotificationMessage}</p>
            <p className="text-slate-300">Formatado segundo o padrão internacional de tipografia e margens.</p>
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
                label: 'Construtor de Currículo'
              })
            }
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onSelectTemplate={(templateId) => {
              const info = getTemplateById(templateId as any);
              handleUseShowcaseItem({
                targetTab: 'editor',
                label: `Modelo ${info.shortName}`,
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
          />
        </main>
      ) : (
        <>
          {/* Mobile Toggle Bar for Studio */}
          <div className="no-print shrink-0 lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setMobileViewMode('controls')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  mobileViewMode === 'controls'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>Editor & Painel</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('preview')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  mobileViewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{activeTab === 'cover' ? 'Ver Carta A4' : 'Ver Currículo A4'}</span>
              </button>
            </div>
          </div>

          {/* Main Studio Dual-Pane Layout (Bounded cleanly via flex-1 min-h-0 so footers never clip) */}
          <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side: Control Deck / Tool Tabs */}
            <section
              className={`w-full lg:w-[46%] xl:w-[42%] 2xl:w-[38%] flex-1 lg:flex-none min-h-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden no-print ${
                mobileViewMode === 'preview' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Studio Primary Mode Switcher */}
              <div className="px-3 sm:px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 min-w-0">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'editor'
                        ? 'bg-white text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Currículo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cover')}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'cover'
                        ? 'bg-white text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Carta</span>
                    <span className="hidden xl:inline">de Apresentação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ats')}
                    className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'ats'
                        ? 'bg-white text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Radar ATS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'ai'
                        ? 'bg-white text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Otimizar IA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'raw'
                        ? 'bg-white text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Importar</span>
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
                      featureTitle="Criação & Importação Estruturada de CV"
                      featureSubtitle={
                        isAuthenticated
                          ? "A criação de novos currículos e importação estruturada (LinkedIn, PDF e Word) é exclusiva para assinantes dos planos Pro ou Executivo VIP. Ative o seu plano para desbloquear."
                          : "A criação de currículos e extração de dados do LinkedIn ou documentos é restrita a assinantes da plataforma. Crie a sua conta e ative o seu plano para continuar."
                      }
                      featureBenefits={[
                        'Importação inteligente de LinkedIn, PDF e Word (.docx)',
                        'Estruturação nos padrões internacionais de recrutamento',
                        'Acesso total aos modelos Harvard, Tech e Executivo',
                        'Exportações ilimitadas na nuvem'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
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
                      featureTitle="Editor Estratégico de Currículo & Construtor ATS"
                      featureSubtitle={
                        isAuthenticated
                          ? "A edição de campos, preenchimento guiado e estruturação do currículo passo a passo é exclusiva para assinantes Pro e Executivo VIP. Ative o seu plano para começar a editar o seu currículo e salvá-lo na nuvem."
                          : "Crie a sua conta e ative o plano Pro ou Executivo VIP para aceder ao editor oficial, personalizar experiências com a fórmula Google XYZ e salvar na nuvem."
                      }
                      featureBenefits={[
                        'Preenchimento guiado passo a passo de todas as seções',
                        'Dicas de especialistas e verbos de ação para aprovação em robôs ATS',
                        'Formulação de impactos com a metodologia Google XYZ',
                        'Armazenamento seguro em tempo real na nuvem',
                        'Exportação oficial sem marcas de água em Word (.docx) e PDF'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <ContentEditor
                      cv={cv}
                      onChange={updateCvWithCache}
                      onOpenAiTailor={() => setActiveTab('ai')}
                      onOpenCoverLetter={() => setActiveTab('cover')}
                      onOpenAuthModal={(prompt) => handleOpenAuth(prompt)}
                    />
                  )
                )}

                {activeTab === 'ats' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Vaga & Radar ATS Semântico"
                      featureSubtitle="Análise profunda de compatibilidade com sistemas de recrutamento ATS (Workday, Taleo, Greenhouse e SAP SuccessFactors)."
                      featureBenefits={[
                        'Diagnóstico de pontuação ATS com cálculo de densidade',
                        'Mapeamento de palavras-chave críticas da vaga',
                        'Sugestão de termos executivos ausentes no currículo',
                        'Sincronização com os seus currículos salvos'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Radar ATS Avançado & Análise Semântica"
                      featureSubtitle="O Radar ATS avançado compara o seu perfil diretamente contra a descrição da vaga com inteligência artificial para garantir que o seu currículo passe pelos filtros robóticos."
                      featureBenefits={[
                        'Cálculo de compatibilidade percentual e densidade de palavras-chave',
                        'Extração inteligente de competências solicitadas pelo recrutador',
                        'Destaque de métricas quantificáveis ausentes',
                        'Otimizações ilimitadas no Plano Profissional Pro'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
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

                {activeTab === 'ai' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Otimizador IA de Conquistas"
                      featureSubtitle="Reescreva as suas experiências utilizando a metodologia Google XYZ e verbos de ação executivos."
                      featureBenefits={[
                        'Geração de realizações e balas orientadas a métricas',
                        'Ajuste de tom formal para padrões corporativos globais',
                        'Remoção automática de chavões e termos fracos',
                        'Incluído nos planos Pro ($8/mês) e Executivo VIP ($12/mês)'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Otimizador IA de Conquistas & Balas Executivas"
                      featureSubtitle="Desbloqueie reescritas de alta precisão calibradas para vagas sênior, com verbos de ação executivos e fórmulas de impacto mensurável."
                      featureBenefits={[
                        'Otimizações ilimitadas de experiências profissionais',
                        'Sugestões automáticas baseadas na descrição da vaga',
                        'Calibração de impacto financeiro (P&L, EBITDA, OPEX)',
                        'Exportação em Word (.docx) sem restrições'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
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
                      featureTitle="Simulador de Entrevista (IA)"
                      featureSubtitle="Simule entrevistas reais com perguntas personalizadas para a vaga e receba notas no padrão STAR."
                      featureBenefits={[
                        '5 perguntas técnicas e comportamentais personalizadas',
                        'Gravação e transcrição de áudio por voz em tempo real',
                        'Avaliação de pontos fortes e respostas recomendadas',
                        'Treino sem estresse antes da entrevista real'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isExecutive ? (
                    <PlanGateGuard
                      requiredTier="executive"
                      featureTitle="Simulador de Entrevista STAR com IA & Áudio"
                      featureSubtitle="A sala de simulação de entrevistas com perguntas personalizadas e avaliação STAR é exclusiva dos assinantes Executivo VIP."
                      featureBenefits={[
                        'Geração de 5 perguntas comportamentais e técnicas pela IA',
                        'Ditado por voz com reconhecimento de fala Web Speech',
                        'Scoring STAR com nota de 0 a 100 e resposta modelo',
                        'Treino ilimitado para qualquer descrição de vaga'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : (
                    <InterviewSimulator
                      currentCV={cv}
                      jobDescription={jobDescription}
                      onUpdateJobDescription={setJobDescription}
                      onOpenPricing={() => setIsPricingModalOpen(true)}
                    />
                  )
                )}

                {activeTab === 'cover' && (
                  !isAuthenticated ? (
                    <PlanGateGuard
                      requiredTier="authenticated"
                      featureTitle="Carta de Apresentação Estratégica"
                      featureSubtitle="Crie cartas de motivação executivas sob medida para a empresa e vaga desejada."
                      featureBenefits={[
                        'Estrutura formal para comitês de seleção',
                        'Conexão com os pontos fortes do seu currículo',
                        'Exportação direta em Microsoft Word (.docx)'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
                    />
                  ) : !isPro ? (
                    <PlanGateGuard
                      requiredTier="pro"
                      featureTitle="Carta de Apresentação com Inteligência Artificial"
                      featureSubtitle="Elabore cartas de apresentação persuasivas e personalizadas para cada candidatura, alinhadas à cultura corporativa."
                      featureBenefits={[
                        'Geração ilimitada de cartas estratégicas',
                        'Customização para cargos de liderança e especialistas',
                        'Exportação instantânea em Word (.docx) e PDF'
                      ]}
                      onOpenAuthModal={() => handleOpenAuth(undefined, 'login')}
                      onOpenPricingModal={() => setIsPricingModalOpen(true)}
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
                        ? "Modo Pré-visualização: Visualização do modelo A4. A edição de dados, importação e downloads oficiais em Word (.docx) e PDF são exclusivos para assinantes Pro e Executivo VIP."
                        : "Plano Gratuito: Visualização do modelo A4. A edição de campos, personalização e downloads oficiais em Word (.docx) e PDF requerem a ativação de um plano Pro ou Executivo VIP."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => (!isAuthenticated ? handleOpenAuth('Crie a sua conta gratuita para guardar e exportar os seus currículos.') : setIsPricingModalOpen(true))}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors ml-auto shadow-2xs whitespace-nowrap shrink-0"
                  >
                    {!isAuthenticated ? 'Criar Conta' : 'Ativar Plano Pro'}
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
                />
              )}
            </section>
          </main>

          {/* Mobile Bottom Thumb Navigation (Shrink-0 flex child so it never covers sticky editor footers) */}
          <nav className="no-print lg:hidden shrink-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('editor');
                setMobileViewMode('controls');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors relative ${
                activeTab === 'editor' && mobileViewMode === 'controls'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Edit3 className="w-4 h-4" />
                {!hasActivePlan && (
                  <Lock className="w-2.5 h-2.5 text-amber-700 absolute -top-1 -right-2" />
                )}
              </div>
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('cover');
                setMobileViewMode('controls');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeTab === 'cover' && mobileViewMode === 'controls'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Carta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileViewMode('preview');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                mobileViewMode === 'preview'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ver A4</span>
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors ${
                !hasActivePlan
                  ? 'text-amber-800 hover:text-amber-900'
                  : 'text-slate-900 hover:text-slate-950'
              }`}
            >
              {!hasActivePlan ? (
                <Lock className="w-4 h-4 text-amber-700" />
              ) : (
                <Download className="w-4 h-4 text-slate-900" />
              )}
              <span>{isExportingWord ? 'A Gerar...' : !hasActivePlan ? 'Word 🔒' : 'Word'}</span>
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
          if (!hasActivePlan) {
            setPendingModelTarget(null);
          }
        }}
        promptMessage={pricingPromptMessage}
      />

      {/* Dedicated User Profile & Subscription Account Area Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        onOpenPricing={() => handleOpenPricingModal()}
        onOpenMyResumes={() => setIsMyResumesModalOpen(true)}
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
    </div>
  );
}
