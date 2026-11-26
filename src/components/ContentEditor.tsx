import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CVData,
  Experience,
  Competency,
  Education,
  Reference,
  LanguageItem,
  CVSectionKey
} from '../types/cv';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  Globe,
  ArrowUp,
  ArrowDown,
  Wand2,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  Users,
  Sliders,
  Mail,
  User,
  Award,
  Palette,
  BookOpen,
  Undo2,
  Redo2,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Type,
  RotateCcw,
  LayoutTemplate,
  MoreHorizontal,
  Target,
  Download,
  Search,
  Loader2,
  Star,
  Square
} from 'lucide-react';
import { StudioCreationMode } from './StudioGuideSystem';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage, SiteLanguageCode } from '../context/LanguageContext';
import { EDITOR_UI_TRANSLATIONS } from '../i18n/editorUiTranslations';
import { STUDIO_NAV_TRANSLATIONS } from '../i18n/studioNavTranslations';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { ExpertTip } from './ExpertTip';
import {
  DEFAULT_SECTION_ORDER,
  SECTION_METADATA,
  EXECUTIVE_ACTION_VERBS,
  POPULAR_COMPETENCY_CLUSTERS,
  calculateCVMetrics
} from '../utils/executivePhrasing';
import { auditCVAgainstJob } from '../utils/atsAnalyzer';
import { authorizedFetch } from '../utils/authHeaders';
import { OnboardingGoalId, getGoalPreset, getSavedOnboardingGoal } from '../utils/onboardingGoals';
import { getTemplateById } from '../data/templateCatalog';
import { getStoredSnippetsSync, trackFrontendTelemetry } from '../services/adminModulesService';
import { ProfessionSnippetExample } from '../types/adminModules';

const COMPLETION_EVAL_COPY: Record<
  SiteLanguageCode,
  {
    sectionTitle: string;
    scoreLabel: string;
    strongTitle: string;
    strongDesc: string;
    mediumTitle: string;
    mediumDesc: string;
    weakTitle: string;
    weakDesc: string;
    allClearText: string;
    improveHint: string;
    nextStepTitle: string;
    jobsHint: string;
    jobsBtn: string;
  }
> = {
  pt: {
    sectionTitle: 'Avaliação do seu Currículo',
    scoreLabel: 'Pontuação',
    strongTitle: 'Currículo forte — pronto para enviar',
    strongDesc: 'Tem contacto completo, experiências claras e boa estrutura para recrutadores e sistemas ATS.',
    mediumTitle: 'Bom ponto de partida — pode ficar ainda melhor',
    mediumDesc: 'Complete os pontos abaixo para aumentar a sua pontuação antes de se candidatar.',
    weakTitle: 'Ainda incompleto — faltam informações essenciais',
    weakDesc: 'Preencha os itens em falta abaixo para evitar ser descartado automaticamente.',
    allClearText: 'Todos os critérios essenciais estão preenchidos.',
    improveHint: 'O que melhorar agora:',
    nextStepTitle: 'Próximo passo recomendado',
    jobsHint: 'Com o currículo pronto, procure vagas compatíveis com o seu perfil e cargo.',
    jobsBtn: 'Procurar Vagas Compatíveis'
  },
  en: {
    sectionTitle: 'Resume Quality Check',
    scoreLabel: 'Score',
    strongTitle: 'Strong resume — ready to apply',
    strongDesc: 'Your contact details, work history, and structure are well balanced for recruiters and ATS.',
    mediumTitle: 'Good foundation — easy wins available',
    mediumDesc: 'Finish the missing items below to boost your score before applying.',
    weakTitle: 'Incomplete — key details are missing',
    weakDesc: 'Fill in the missing items below so recruiters have everything they need.',
    allClearText: 'All essential resume criteria are complete.',
    improveHint: 'Quick improvements:',
    nextStepTitle: 'Recommended next step',
    jobsHint: 'Now that your resume is taking shape, explore job openings tailored to your profile.',
    jobsBtn: 'Browse Matching Jobs'
  },
  es: {
    sectionTitle: 'Evaluación de tu Currículum',
    scoreLabel: 'Puntuación',
    strongTitle: 'Currículum sólido — listo para enviar',
    strongDesc: 'Tus datos, experiencia y estructura están bien equilibrados para reclutadores y ATS.',
    mediumTitle: 'Buena base — aún puedes mejorarlo',
    mediumDesc: 'Completa los puntos pendientes abajo para subir tu puntuación.',
    weakTitle: 'Incompleto — faltan datos clave',
    weakDesc: 'Añade los apartados pendientes abajo para destacar mejor tu perfil.',
    allClearText: 'Todos los criterios esenciales están completos.',
    improveHint: 'Qué mejorar ahora:',
    nextStepTitle: 'Siguiente paso recomendado',
    jobsHint: 'Con tu currículum listo, busca vacantes compatibles con tu perfil profesional.',
    jobsBtn: 'Buscar Vacantes Compatibles'
  },
  fr: {
    sectionTitle: 'Évaluation de votre CV',
    scoreLabel: 'Score',
    strongTitle: 'CV solide — prêt à postuler',
    strongDesc: 'Vos coordonnées, expériences et structure sont bien équilibrées pour les recruteurs et ATS.',
    mediumTitle: 'Bonne base — améliorations faciles',
    mediumDesc: 'Complétez les éléments ci-dessous pour renforcer votre score.',
    weakTitle: 'Incomplet — informations clés manquantes',
    weakDesc: 'Ajoutez les éléments manquants ci-dessous avant d’envoyer votre CV.',
    allClearText: 'Tous les critères essentiels sont remplis.',
    improveHint: 'À améliorer maintenant :',
    nextStepTitle: 'Prochaine étape recommandée',
    jobsHint: 'Votre CV est prêt ? Découvrez les offres d’emploi adaptées à votre profil.',
    jobsBtn: 'Chercher des Offres'
  },
  de: {
    sectionTitle: 'Lebenslauf-Bewertung',
    scoreLabel: 'Punkte',
    strongTitle: 'Starker Lebenslauf — bereit für Bewerbungen',
    strongDesc: 'Kontaktdaten, Berufserfahrung und Struktur sind ideal für Recruiter und ATS.',
    mediumTitle: 'Gute Basis — noch ausbaufähig',
    mediumDesc: 'Ergänzen Sie die offenen Punkte unten für ein noch besseres Ergebnis.',
    weakTitle: 'Noch unvollständig — wichtige Angaben fehlen',
    weakDesc: 'Füllen Sie die fehlenden Punkte unten aus, um Ihre Chancen zu erhöhen.',
    allClearText: 'Alle wichtigen Kriterien sind erfüllt.',
    improveHint: 'Jetzt verbessern:',
    nextStepTitle: 'Empfohlener nächster Schritt',
    jobsHint: 'Mit Ihrem fertigen Lebenslauf können Sie direkt passende Stellenangebote suchen.',
    jobsBtn: 'Passende Stellen Suchen'
  },
  it: {
    sectionTitle: 'Valutazione del tuo CV',
    scoreLabel: 'Punteggio',
    strongTitle: 'CV efficace — pronto per candidarti',
    strongDesc: 'Recapiti, esperienze e struttura sono ben bilanciati per recruiter e sistemi ATS.',
    mediumTitle: 'Buona base — migliorabile con poco',
    mediumDesc: 'Completa i punti qui sotto per alzare il tuo punteggio prima di inviare il CV.',
    weakTitle: 'Incompleto — mancano dati essenziali',
    weakDesc: 'Aggiungi gli elementi mancanti qui sotto per rendere il CV più competitivo.',
    allClearText: 'Tutti i criteri essenziali sono completi.',
    improveHint: 'Cosa migliorare subito:',
    nextStepTitle: 'Prossimo passo consigliato',
    jobsHint: 'Ora che il CV è pronto, cerca offerte di lavoro in linea con il tuo profilo.',
    jobsBtn: 'Cerca Offerte Compatibili'
  }
};

const EDITOR_V2_COPY: Record<
  SiteLanguageCode,
  {
    steps: { profile: string; career: string; credentials: string; structure: string };
    autoSaved: string;
    syncing: string;
    lastSyncNow: string;
    lastSyncMinPrefix: string;
    lastSyncMinSuffix: string;
    improveAiBtn: string;
    improvingAiBtn: string;
    aiUpdatedTitle: string;
    aiUpdatedMsg: string;
    aiErrorTitle: string;
    atsWidgetTitle: string;
    expDetailed: string;
    expMissing: string;
    skillsRelevant: string;
    skillsMissing: string;
    keywordsGood: string;
    keywordsMissing: string;
    applyJobsBtn: string;
    recommendedForYou: string;
    reasonLabel: string;
    useRecommendedBtn: string;
    activeOnCv: string;
    changeGoalBtn: string;
    finishApplyBtn: string;
  }
> = {
  pt: {
    steps: {
      profile: 'Dados pessoais',
      career: 'Experiência',
      credentials: 'Educação',
      structure: 'Finalizar'
    },
    autoSaved: 'Salvado automaticamente',
    syncing: 'A sincronizar…',
    lastSyncNow: 'Última sincronização: agora mesmo',
    lastSyncMinPrefix: 'Última sincronização: há ',
    lastSyncMinSuffix: ' min',
    improveAiBtn: 'Melhorar com IA',
    improvingAiBtn: 'A melhorar…',
    aiUpdatedTitle: 'Melhorado com IA',
    aiUpdatedMsg: 'Texto reescrito com mais impacto e foco ATS.',
    aiErrorTitle: 'Não foi possível melhorar agora',
    atsWidgetTitle: 'Pontuação ATS',
    expDetailed: 'Experiência detalhada',
    expMissing: 'Adicionar conquistas e métricas na experiência',
    skillsRelevant: 'Competências relevantes',
    skillsMissing: 'Adicionar competências-chave',
    keywordsGood: 'Boas palavras-chave e resumo',
    keywordsMissing: 'Adicionar mais palavras-chave',
    applyJobsBtn: 'Aplicar a vagas',
    recommendedForYou: 'Recomendado para você',
    reasonLabel: 'Motivo:',
    useRecommendedBtn: 'Usar este modelo',
    activeOnCv: 'Ativo no seu CV',
    changeGoalBtn: 'Mudar objetivo',
    finishApplyBtn: 'Aplicar a vagas'
  },
  en: {
    steps: {
      profile: 'Personal info',
      career: 'Experience',
      credentials: 'Education',
      structure: 'Finish'
    },
    autoSaved: 'Auto-saved',
    syncing: 'Syncing…',
    lastSyncNow: 'Last sync: just now',
    lastSyncMinPrefix: 'Last sync: ',
    lastSyncMinSuffix: 'm ago',
    improveAiBtn: 'Improve with AI',
    improvingAiBtn: 'Improving…',
    aiUpdatedTitle: 'Improved with AI',
    aiUpdatedMsg: 'Rewritten with stronger ATS impact.',
    aiErrorTitle: 'Could not improve right now',
    atsWidgetTitle: 'ATS Score',
    expDetailed: 'Detailed experience',
    expMissing: 'Add measurable experience achievements',
    skillsRelevant: 'Relevant skills',
    skillsMissing: 'Add core competencies',
    keywordsGood: 'Strong keywords & summary',
    keywordsMissing: 'Add more keywords',
    applyJobsBtn: 'Apply to jobs',
    recommendedForYou: 'Recommended for you',
    reasonLabel: 'Reason:',
    useRecommendedBtn: 'Use this template',
    activeOnCv: 'Active on your CV',
    changeGoalBtn: 'Change goal',
    finishApplyBtn: 'Apply to jobs'
  },
  es: {
    steps: {
      profile: 'Datos personales',
      career: 'Experiencia',
      credentials: 'Educación',
      structure: 'Finalizar'
    },
    autoSaved: 'Guardado automáticamente',
    syncing: 'Sincronizando…',
    lastSyncNow: 'Última sincronización: ahora mismo',
    lastSyncMinPrefix: 'Última sincronización: hace ',
    lastSyncMinSuffix: ' min',
    improveAiBtn: 'Mejorar con IA',
    improvingAiBtn: 'Mejorando…',
    aiUpdatedTitle: 'Mejorado con IA',
    aiUpdatedMsg: 'Texto optimizado para impacto ATS.',
    aiErrorTitle: 'No se pudo mejorar ahora',
    atsWidgetTitle: 'Puntuación ATS',
    expDetailed: 'Experiencia detallada',
    expMissing: 'Añadir logros medibles en experiencia',
    skillsRelevant: 'Competencias relevantes',
    skillsMissing: 'Añadir competencias clave',
    keywordsGood: 'Buenas palabras clave y resumen',
    keywordsMissing: 'Añadir más palabras clave',
    applyJobsBtn: 'Aplicar a vacantes',
    recommendedForYou: 'Recomendado para ti',
    reasonLabel: 'Motivo:',
    useRecommendedBtn: 'Usar esta plantilla',
    activeOnCv: 'Activa en tu CV',
    changeGoalBtn: 'Cambiar objetivo',
    finishApplyBtn: 'Aplicar a vacantes'
  },
  fr: {
    steps: {
      profile: 'Données personnelles',
      career: 'Expérience',
      credentials: 'Formation',
      structure: 'Finaliser'
    },
    autoSaved: 'Enregistré automatiquement',
    syncing: 'Synchronisation…',
    lastSyncNow: 'Dernière synchro : à l’instant',
    lastSyncMinPrefix: 'Dernière synchro : il y a ',
    lastSyncMinSuffix: ' min',
    improveAiBtn: 'Améliorer avec l’IA',
    improvingAiBtn: 'Amélioration…',
    aiUpdatedTitle: 'Amélioré par l’IA',
    aiUpdatedMsg: 'Contenu optimisé pour les filtres ATS.',
    aiErrorTitle: 'Impossible d’améliorer pour le moment',
    atsWidgetTitle: 'Score ATS',
    expDetailed: 'Expérience détaillée',
    expMissing: 'Détailler vos réalisations chiffrées',
    skillsRelevant: 'Compétences pertinentes',
    skillsMissing: 'Ajouter des compétences clés',
    keywordsGood: 'Bons mots-clés et profil',
    keywordsMissing: 'Ajouter plus de mots-clés',
    applyJobsBtn: 'Postuler aux offres',
    recommendedForYou: 'Recommandé pour vous',
    reasonLabel: 'Raison :',
    useRecommendedBtn: 'Utiliser ce modèle',
    activeOnCv: 'Actif sur votre CV',
    changeGoalBtn: 'Changer d’objectif',
    finishApplyBtn: 'Postuler aux offres'
  },
  de: {
    steps: {
      profile: 'Persönliche Daten',
      career: 'Erfahrung',
      credentials: 'Ausbildung',
      structure: 'Abschließen'
    },
    autoSaved: 'Automatisch gespeichert',
    syncing: 'Synchronisiere…',
    lastSyncNow: 'Letzte Synchro: gerade eben',
    lastSyncMinPrefix: 'Letzte Synchro: vor ',
    lastSyncMinSuffix: ' Min.',
    improveAiBtn: 'Mit KI verbessern',
    improvingAiBtn: 'Verbessere…',
    aiUpdatedTitle: 'Mit KI optimiert',
    aiUpdatedMsg: 'Text für ATS-Filter geschärft.',
    aiErrorTitle: 'Verbesserung aktuell nicht möglich',
    atsWidgetTitle: 'ATS-Score',
    expDetailed: 'Detaillierte Erfahrung',
    expMissing: 'Messbare Erfolge in Erfahrung ergänzen',
    skillsRelevant: 'Relevante Kompetenzen',
    skillsMissing: 'Kernkompetenzen hinzufügen',
    keywordsGood: 'Starke Keywords & Profil',
    keywordsMissing: 'Mehr Keywords hinzufügen',
    applyJobsBtn: 'Auf Stellen bewerben',
    recommendedForYou: 'Empfohlen für Sie',
    reasonLabel: 'Grund:',
    useRecommendedBtn: 'Vorlage nutzen',
    activeOnCv: 'Aktiv im Lebenslauf',
    changeGoalBtn: 'Ziel ändern',
    finishApplyBtn: 'Auf Stellen bewerben'
  },
  it: {
    steps: {
      profile: 'Dati personali',
      career: 'Esperienza',
      credentials: 'Istruzione',
      structure: 'Completa'
    },
    autoSaved: 'Salvato automaticamente',
    syncing: 'Sincronizzazione…',
    lastSyncNow: 'Ultima sincronizzazione: adesso',
    lastSyncMinPrefix: 'Ultima sincronizzazione: ',
    lastSyncMinSuffix: ' min fa',
    improveAiBtn: 'Migliora con IA',
    improvingAiBtn: 'Miglioramento…',
    aiUpdatedTitle: 'Migliorato con IA',
    aiUpdatedMsg: 'Testo riscritto con maggiore impatto ATS.',
    aiErrorTitle: 'Impossibile migliorare ora',
    atsWidgetTitle: 'Punteggio ATS',
    expDetailed: 'Esperienza dettagliata',
    expMissing: 'Aggiungi risultati misurabili',
    skillsRelevant: 'Competenze rilevanti',
    skillsMissing: 'Aggiungi competenze chiave',
    keywordsGood: 'Buone parole chiave e profilo',
    keywordsMissing: 'Aggiungi più parole chiave',
    applyJobsBtn: 'Candidati alle offerte',
    recommendedForYou: 'Consigliato per te',
    reasonLabel: 'Motivo:',
    useRecommendedBtn: 'Usa questo modello',
    activeOnCv: 'Attivo nel tuo CV',
    changeGoalBtn: 'Cambia obiettivo',
    finishApplyBtn: 'Candidati alle offerte'
  }
};

interface ContentEditorProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  onOpenAiTailor: () => void;
  onOpenCoverLetter?: () => void;
  onOpenJobs?: () => void;
  onExportCv?: () => void;
  onOpenAuthModal?: (prompt?: string) => void;
  onOpenPricingModal?: (prompt?: string) => void;
  density?: 'compact' | 'normal' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'normal' | 'relaxed') => void;
  guideMode?: StudioCreationMode;
  jobDescription?: string;
  selectedGoalId?: OnboardingGoalId | null;
  onOpenGoalModal?: () => void;
}

export type EditorStepId =
  | 'profile'
  | 'career'
  | 'credentials'
  | 'structure';

interface StepDefinition {
  id: EditorStepId;
  mobileLabel: string;
  shortLabel: string;
  isCompleted: boolean;
}

const ACCENT_HEX_LIST = [
  '#0f172a',
  '#1e3a8a',
  '#1d4ed8',
  '#065f46',
  '#7c3aed',
  '#831843',
  '#0f766e'
] as const;

const FONT_IDS: Array<CVData['fontFamily'] | 'default'> = [
  'default',
  'jakarta',
  'garamond',
  'cinzel',
  'mono'
];

const INPUT_CLASS =
  'w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 transition-colors';

const METRIC_REGEX =
  /(\d+(\.\d+)?%|\$\d+|\b\d+\s*(milhões|mil|milhoes|k|m|h|dias|semanas|meses|anos)\b|\b\d{2,}\b)/i;

export const ContentEditor: React.FC<ContentEditorProps> = ({
  cv,
  onChange,
  onOpenAiTailor,
  onOpenCoverLetter,
  onOpenJobs,
  onExportCv,
  onOpenAuthModal,
  onOpenPricingModal,
  density = 'normal',
  onDensityChange,
  guideMode = 'guided',
  jobDescription = '',
  selectedGoalId,
  onOpenGoalModal
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [credentialsTab, setCredentialsTab] = useState<'academic' | 'skills'>('academic');
  const [showWebsiteField, setShowWebsiteField] = useState<boolean>(
    Boolean(cv.personalDetails.website?.trim())
  );
  const [donorFieldsOpen, setDonorFieldsOpen] = useState<Record<number, boolean>>({});
  const [honorsOpen, setHonorsOpen] = useState<Record<number, boolean>>({});
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [collapsedExps, setCollapsedExps] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    cv.experiences.forEach((_, idx) => {
      if (idx > 0) initial[idx] = true;
    });
    return initial;
  });
  const [syncState, setSyncState] = useState<'saved' | 'saving'>('saved');
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => Date.now());
  const [syncClockTick, setSyncClockTick] = useState<number>(0);
  const [improvingFieldKey, setImprovingFieldKey] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<ProfessionSnippetExample[]>(() => getStoredSnippetsSync());
  const [showSnippetPicker, setShowSnippetPicker] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [verbPickerExpIdx, setVerbPickerExpIdx] = useState<number | null>(null);
  const [showClusterPicker, setShowClusterPicker] = useState<boolean>(false);
  const [newTrainingDraft, setNewTrainingDraft] = useState<string>('');
  const [showReferencesBlock, setShowReferencesBlock] = useState<boolean>(false);
  const [advancedDesignOpen, setAdvancedDesignOpen] = useState<boolean>(false);
  const [sectionsOrderOpen, setSectionsOrderOpen] = useState<boolean>(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const hasMountedAutoSaveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!openMenuId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-editor-menu="true"]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [openMenuId]);

  // Undo / Redo history stack
  const [undoStack, setUndoStack] = useState<CVData[]>([]);
  const [redoStack, setRedoStack] = useState<CVData[]>([]);
  const lastCommittedRef = useRef<CVData>(cv);
  const lastHistoryPushAtRef = useRef<number>(0);
  const isTimeTravelingRef = useRef<boolean>(false);

  const commitChange = useCallback(
    (nextCV: CVData, immediateSnapshot = false) => {
      const now = Date.now();
      if (!isTimeTravelingRef.current) {
        const shouldPush =
          immediateSnapshot || now - lastHistoryPushAtRef.current > 1200;
        if (shouldPush) {
          const snapshot = lastCommittedRef.current;
          setUndoStack((prev) => [...prev.slice(-29), snapshot]);
          setRedoStack([]);
          lastHistoryPushAtRef.current = now;
        }
      }
      lastCommittedRef.current = nextCV;
      onChange(nextCV);
    },
    [onChange]
  );

  // Sync baseline when CV updates externally (e.g., AI tailor, import, saved resume load)
  useEffect(() => {
    if (cv !== lastCommittedRef.current && !isTimeTravelingRef.current) {
      lastCommittedRef.current = cv;
    }
  }, [cv]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const nextUndo = prev.slice(0, -1);
      setRedoStack((r) => [...r.slice(-29), lastCommittedRef.current]);
      isTimeTravelingRef.current = true;
      lastCommittedRef.current = previous;
      onChange(previous);
      setTimeout(() => {
        isTimeTravelingRef.current = false;
      }, 0);
      return nextUndo;
    });
  }, [onChange]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextState = prev[prev.length - 1];
      const nextRedo = prev.slice(0, -1);
      setUndoStack((u) => [...u.slice(-29), lastCommittedRef.current]);
      isTimeTravelingRef.current = true;
      lastCommittedRef.current = nextState;
      onChange(nextState);
      setTimeout(() => {
        isTimeTravelingRef.current = false;
      }, 0);
      return nextRedo;
    });
  }, [onChange]);

  useEffect(() => {
    const syncSnippets = () => setSnippets(getStoredSnippetsSync());
    window.addEventListener('admin-config-updated', syncSnippets);
    window.addEventListener('storage', syncSnippets);
    return () => {
      window.removeEventListener('admin-config-updated', syncSnippets);
      window.removeEventListener('storage', syncSnippets);
    };
  }, []);

  const { saveCurrentResume, isAuthenticated, hasActivePlan } = useAuth();
  const { showSuccess, showError } = useToast();
  const { siteLanguage, studioText } = useLanguage();
  const ui = (EDITOR_UI_TRANSLATIONS[siteLanguage] || EDITOR_UI_TRANSLATIONS.en).editor;
  const v2 = EDITOR_V2_COPY[siteLanguage] || EDITOR_V2_COPY.en;
  const guides = (STUDIO_NAV_TRANSLATIONS[siteLanguage] || STUDIO_NAV_TRANSLATIONS.en).editorGuides;
  const evalUi = COMPLETION_EVAL_COPY[siteLanguage] || COMPLETION_EVAL_COPY.en;

  // Live readiness & ATS employability metrics (computed dynamically from real CV + active job description)
  const cvMetrics = useMemo(() => calculateCVMetrics(cv), [cv]);
  const atsAudit = useMemo(
    () => auditCVAgainstJob(cv, jobDescription || '', siteLanguage),
    [cv, jobDescription, siteLanguage]
  );
  const effectiveAtsScore = useMemo(() => {
    if (jobDescription && jobDescription.trim().length > 20) {
      return Math.round(cvMetrics.strengthScore * 0.45 + atsAudit.score * 0.55);
    }
    return cvMetrics.strengthScore;
  }, [cvMetrics.strengthScore, atsAudit.score, jobDescription]);

  const effectiveGoalId = selectedGoalId ?? getSavedOnboardingGoal();
  const recommendedPreset = useMemo(
    () => getGoalPreset(effectiveGoalId || 'quick_job'),
    [effectiveGoalId]
  );
  const recommendedTemplateMeta = useMemo(
    () => getTemplateById(recommendedPreset.templateStyle),
    [recommendedPreset.templateStyle]
  );
  const completedCriteria = cvMetrics.completenessChecklist.filter((c) => c.completed).length;

  useEffect(() => {
    const interval = setInterval(() => setSyncClockTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  void syncClockTick;
  const syncMinutesAgo = Math.floor((Date.now() - lastSyncedAt) / 60000);
  const syncTimeText =
    syncMinutesAgo < 1
      ? v2.lastSyncNow
      : `${v2.lastSyncMinPrefix}${syncMinutesAgo}${v2.lastSyncMinSuffix}`;

  const handleApplySnippetSummary = (snip: ProfessionSnippetExample) => {
    commitChange(
      {
        ...cv,
        personalDetails: {
          ...cv.personalDetails,
          title: snip.sampleTitle || cv.personalDetails.title
        },
        summary: snip.sampleSummary || cv.summary
      },
      true
    );
    setShowSnippetPicker(false);
    showSuccess(
      ui.toasts.snippetAppliedTitle,
      ui.toasts.snippetAppliedMsg.replace('{name}', snip.profession)
    );
  };

  const handleApplySnippetBullets = (snip: ProfessionSnippetExample) => {
    if (!snip.sampleBullets || snip.sampleBullets.length === 0) return;
    if (cv.experiences.length === 0) {
      commitChange(
        {
          ...cv,
          experiences: [
            {
              id: `exp-${Date.now()}`,
              company: ui.stage2.companyFallback,
              role: snip.sampleTitle || snip.profession,
              period: ui.stage2.periodPh.replace(/^(Ex:|e\.g\.|Ej:|p\.?\s*ex\.?:?|z\.\s*B\.:?)\s*/i, ''),
              location: '',
              highlights: [...snip.sampleBullets]
            }
          ]
        },
        true
      );
    } else {
      const updatedExps = [...cv.experiences];
      updatedExps[0] = {
        ...updatedExps[0],
        highlights: [...snip.sampleBullets, ...updatedExps[0].highlights]
      };
      commitChange({ ...cv, experiences: updatedExps }, true);
    }
    showSuccess(
      ui.toasts.bulletsAddedTitle,
      ui.toasts.bulletsAddedMsg.replace('{name}', snip.profession)
    );
  };

  // Silent debounced Auto-Save (updates local timestamp immediately & syncs cloud when signed in)
  useEffect(() => {
    if (!hasMountedAutoSaveRef.current) {
      hasMountedAutoSaveRef.current = true;
      return;
    }
    setSyncState('saving');
    const localTimer = setTimeout(() => {
      setLastSyncedAt(Date.now());
      if (!isAuthenticated || !hasActivePlan || !cv.personalDetails.name?.trim()) {
        setSyncState('saved');
      }
    }, 450);

    let cloudTimer: ReturnType<typeof setTimeout> | undefined;
    if (isAuthenticated && hasActivePlan && cv.personalDetails.name?.trim()) {
      cloudTimer = setTimeout(async () => {
        try {
          const name = cv.personalDetails.name.trim();
          const role = cv.personalDetails.title?.trim() || ui.toasts.defaultCvTitle;
          const title = name ? `${name} - ${role}` : ui.toasts.defaultCvTitle;
          await saveCurrentResume(cv, title, cv.personalDetails.title);
          setLastSyncedAt(Date.now());
        } catch (err) {
          console.warn('Auto-sync cloud warning:', err);
        } finally {
          setSyncState('saved');
        }
      }, 3200);
    }

    return () => {
      clearTimeout(localTimer);
      if (cloudTimer) clearTimeout(cloudTimer);
    };
  }, [cv, isAuthenticated, hasActivePlan, saveCurrentResume, ui.toasts.defaultCvTitle]);

  // Discreet inline 1-click AI field enhancement
  const handleImproveFieldWithAi = async (
    field: 'summary' | 'experience' | 'competencies',
    experienceIndex?: number
  ) => {
    const key = field === 'experience' ? `exp-${experienceIndex ?? 0}` : field;
    setImprovingFieldKey(key);
    try {
      const res = await authorizedFetch('/api/ai/improve-field', {
        method: 'POST',
        body: JSON.stringify({
          field,
          cvData: cv,
          experienceIndex,
          language: siteLanguage,
          jobContext: jobDescription
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        if (onOpenAuthModal) onOpenAuthModal(ui.toasts.authPromptSave);
        return;
      }
      if (res.status === 402 || res.status === 403) {
        if (onOpenPricingModal) {
          onOpenPricingModal(data?.error || ui.toasts.pricingPromptSave);
        } else {
          showError(v2.aiErrorTitle, data?.error || ui.toasts.planRequiredMsg);
        }
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || v2.aiErrorTitle);
      }

      if (field === 'summary' && typeof data.summary === 'string' && data.summary.trim()) {
        commitChange({ ...cv, summary: data.summary.trim() }, true);
      } else if (
        field === 'experience' &&
        typeof experienceIndex === 'number' &&
        Array.isArray(data.highlights) &&
        data.highlights.length > 0
      ) {
        const nextExps = cv.experiences.map((exp, idx) =>
          idx === experienceIndex
            ? { ...exp, highlights: data.highlights.map(String).filter(Boolean) }
            : exp
        );
        commitChange({ ...cv, experiences: nextExps }, true);
      } else if (
        field === 'competencies' &&
        Array.isArray(data.competencies) &&
        data.competencies.length > 0
      ) {
        const nextComps: Competency[] = data.competencies
          .filter((c: any) => c && (c.category || c.description))
          .map((c: any, idx: number) => ({
            id: cv.competencies[idx]?.id || `comp-ai-${Date.now()}-${idx}`,
            category: String(c.category || ''),
            description: String(c.description || '')
          }));
        if (nextComps.length > 0) {
          commitChange({ ...cv, competencies: nextComps }, true);
        }
      }

      showSuccess(v2.aiUpdatedTitle, v2.aiUpdatedMsg);
    } catch (err: any) {
      showError(v2.aiErrorTitle, err?.message || ui.toasts.saveGenericError);
    } finally {
      setImprovingFieldKey(null);
    }
  };

  // Section Ordering and Visibility Handlers
  const sectionOrder =
    cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : DEFAULT_SECTION_ORDER;

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, moved);

    commitChange(
      {
        ...cv,
        sectionOrder: newOrder
      },
      true
    );
  };

  const resetSectionOrder = () => {
    commitChange(
      {
        ...cv,
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        sectionVisibility: {}
      },
      true
    );
    showSuccess(ui.toasts.orderResetTitle, ui.toasts.orderResetMsg);
  };

  const toggleSectionVisibility = (sectionKey: CVSectionKey) => {
    const current = cv.sectionVisibility?.[sectionKey] !== false;
    commitChange(
      {
        ...cv,
        sectionVisibility: {
          ...(cv.sectionVisibility || {}),
          [sectionKey]: !current
        }
      },
      true
    );
  };

  // Experience Handlers
  const handleUpdateExperience = (index: number, updated: Experience) => {
    const list = [...cv.experiences];
    list[index] = updated;
    commitChange({ ...cv, experiences: list });
  };

  const handleAddExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      period: ui.stage2.periodPh.replace(/^(Ex:|e\.g\.|Ej:|p\.?\s*ex\.?:?|z\.\s*B\.:?)\s*/i, ''),
      location: '',
      donor: '',
      highlights: ['']
    };
    commitChange({ ...cv, experiences: [newExp, ...cv.experiences] }, true);
    setCollapsedExps((prev) => {
      const shifted: Record<number, boolean> = { 0: false };
      Object.entries(prev).forEach(([key, val]) => {
        shifted[Number(key) + 1] = val;
      });
      return shifted;
    });
  };

  const handleDuplicateExperience = (index: number) => {
    const src = cv.experiences[index];
    if (!src) return;
    const copy: Experience = {
      ...src,
      id: `exp-${Date.now()}`,
      role: `${src.role || ui.stage2.newRoleFallback} ${ui.toasts.copyRoleSuffix}`,
      highlights: [...src.highlights]
    };
    const next = [...cv.experiences];
    next.splice(index + 1, 0, copy);
    commitChange({ ...cv, experiences: next }, true);
    showSuccess(ui.toasts.duplicatedTitle, ui.toasts.duplicatedMsg);
  };

  const handleMoveExperience = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cv.experiences.length) return;
    const list = [...cv.experiences];
    const [item] = list.splice(index, 1);
    list.splice(targetIdx, 0, item);
    commitChange({ ...cv, experiences: list }, true);
  };

  const handleDeleteExperience = (index: number) => {
    const list = cv.experiences.filter((_, i) => i !== index);
    commitChange({ ...cv, experiences: list }, true);
  };

  const handleAddHighlight = (expIndex: number, initialText = '') => {
    const exp = cv.experiences[expIndex];
    handleUpdateExperience(expIndex, {
      ...exp,
      highlights: [...exp.highlights, initialText]
    });
  };

  const handleInsertActionVerb = (expIndex: number, verb: string) => {
    const exp = cv.experiences[expIndex];
    if (!exp) return;
    const emptyIdx = exp.highlights.findIndex((h) => !h.trim());
    const nextHighlights = [...exp.highlights];
    if (emptyIdx !== -1) {
      nextHighlights[emptyIdx] = `${verb} `;
    } else {
      nextHighlights.push(`${verb} `);
    }
    commitChange(
      {
        ...cv,
        experiences: cv.experiences.map((item, idx) =>
          idx === expIndex ? { ...item, highlights: nextHighlights } : item
        )
      },
      true
    );
    setVerbPickerExpIdx(null);
  };

  const handleUpdateHighlight = (expIndex: number, hIndex: number, text: string) => {
    const exp = cv.experiences[expIndex];
    const updatedHighlights = [...exp.highlights];
    updatedHighlights[hIndex] = text;
    handleUpdateExperience(expIndex, { ...exp, highlights: updatedHighlights });
  };

  const handleDeleteHighlight = (expIndex: number, hIndex: number) => {
    const exp = cv.experiences[expIndex];
    const updatedHighlights = exp.highlights.filter((_, i) => i !== hIndex);
    commitChange(
      {
        ...cv,
        experiences: cv.experiences.map((item, idx) =>
          idx === expIndex ? { ...item, highlights: updatedHighlights } : item
        )
      },
      true
    );
  };

  const toggleExpCollapse = (idx: number) => {
    setCollapsedExps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      period: '2018 – 2022',
      gpaOrHonors: ''
    };
    commitChange({ ...cv, educations: [...cv.educations, newEdu] }, true);
  };

  const handleUpdateEducation = (index: number, updated: Education) => {
    const list = [...cv.educations];
    list[index] = updated;
    commitChange({ ...cv, educations: list });
  };

  const handleDeleteEducation = (index: number) => {
    const list = cv.educations.filter((_, i) => i !== index);
    commitChange({ ...cv, educations: list }, true);
  };

  // Certification / Training Handlers
  const handleAddTraining = (customTitle?: string) => {
    const text = (customTitle ?? newTrainingDraft).trim();
    commitChange(
      {
        ...cv,
        trainings: [...cv.trainings, text || ui.toasts.defaultTraining]
      },
      true
    );
    if (!customTitle) setNewTrainingDraft('');
  };

  const handleUpdateTraining = (index: number, value: string) => {
    const list = [...cv.trainings];
    list[index] = value;
    commitChange({ ...cv, trainings: list });
  };

  const handleDeleteTraining = (index: number) => {
    const list = cv.trainings.filter((_, i) => i !== index);
    commitChange({ ...cv, trainings: list }, true);
  };

  // Competency Handlers
  const handleAddCompetency = () => {
    const newComp: Competency = {
      id: `comp-${Date.now()}`,
      category: '',
      description: ''
    };
    commitChange({ ...cv, competencies: [...cv.competencies, newComp] }, true);
  };

  const handleApplyCompetencyCluster = (clusterTitle: string, skills: { category: string; description: string }[]) => {
    const existingCats = new Set(cv.competencies.map((c) => c.category.trim().toLowerCase()));
    const toAdd: Competency[] = skills
      .filter((s) => !existingCats.has(s.category.trim().toLowerCase()))
      .map((s, idx) => ({
        id: `comp-${Date.now()}-${idx}`,
        category: s.category,
        description: s.description
      }));

    if (toAdd.length === 0) {
      showSuccess(
        ui.toasts.clusterPresentTitle,
        ui.toasts.clusterPresentMsg.replace('{name}', clusterTitle)
      );
      return;
    }

    commitChange({ ...cv, competencies: [...cv.competencies, ...toAdd] }, true);
    setShowClusterPicker(false);
    showSuccess(
      ui.toasts.clusterAddedTitle,
      ui.toasts.clusterAddedMsg
        .replace('{count}', String(toAdd.length))
        .replace('{name}', clusterTitle)
    );
  };

  const handleUpdateCompetency = (index: number, updated: Competency) => {
    const list = [...cv.competencies];
    list[index] = updated;
    commitChange({ ...cv, competencies: list });
  };

  const handleDeleteCompetency = (index: number) => {
    const list = cv.competencies.filter((_, i) => i !== index);
    commitChange({ ...cv, competencies: list }, true);
  };

  // Language Handlers
  const handleAddLanguage = () => {
    const newLang: LanguageItem = {
      language: ui.toasts.defaultNewLang,
      level: ui.toasts.defaultNewLangLevel
    };
    commitChange({ ...cv, languages: [...cv.languages, newLang] }, true);
  };

  const handleUpdateLanguage = (index: number, updated: LanguageItem) => {
    const list = [...cv.languages];
    list[index] = updated;
    commitChange({ ...cv, languages: list });
  };

  const handleDeleteLanguage = (index: number) => {
    const list = cv.languages.filter((_, i) => i !== index);
    commitChange({ ...cv, languages: list }, true);
  };

  // Reference Handlers
  const handleAddReference = () => {
    const newRef: Reference = {
      id: `ref-${Date.now()}`,
      name: '',
      institutionAndPosition: '',
      contact: ''
    };
    commitChange({ ...cv, references: [...cv.references, newRef] }, true);
  };

  const handleUpdateReference = (index: number, updated: Reference) => {
    const list = [...cv.references];
    list[index] = updated;
    commitChange({ ...cv, references: list });
  };

  const handleDeleteReference = (index: number) => {
    const list = cv.references.filter((_, i) => i !== index);
    commitChange({ ...cv, references: list }, true);
  };

  // 4 Visual Checklist Stages
  const STEPS: StepDefinition[] = [
    {
      id: 'profile',
      mobileLabel: v2.steps.profile,
      shortLabel: v2.steps.profile,
      isCompleted: Boolean(
        cv.personalDetails.name?.trim() &&
          cv.personalDetails.email?.trim() &&
          cv.personalDetails.phone?.trim()
      )
    },
    {
      id: 'career',
      mobileLabel: v2.steps.career,
      shortLabel: v2.steps.career,
      isCompleted:
        cv.experiences.length > 0 &&
        cv.experiences.some((e) => Boolean(e.company?.trim() || e.role?.trim()))
    },
    {
      id: 'credentials',
      mobileLabel: v2.steps.credentials,
      shortLabel: v2.steps.credentials,
      isCompleted: cv.educations.length > 0 && cv.competencies.length > 0
    },
    {
      id: 'structure',
      mobileLabel: v2.steps.structure,
      shortLabel: v2.steps.structure,
      isCompleted: effectiveAtsScore >= 75
    }
  ];

  const currentStep = STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);
  const summaryWordCount = cv.summary ? cv.summary.trim().split(/\s+/).filter(Boolean).length : 0;

  const jumpToDiagnosticTarget = (idx: number) => {
    if (idx === 0 || idx === 1) {
      setCurrentStepIndex(0);
    } else if (idx === 2 || idx === 3) {
      setCurrentStepIndex(1);
    } else if (idx === 4 || idx === 6) {
      setCurrentStepIndex(2);
      setCredentialsTab('skills');
    } else if (idx === 5) {
      setCurrentStepIndex(2);
      setCredentialsTab('academic');
    }
    setShowDiagnostics(false);
  };

  const goToNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const emailTrimmed = cv.personalDetails.email?.trim() || '';
  const isEmailValid = !emailTrimmed || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

  const optionsMenuLabel =
    siteLanguage === 'en'
      ? 'Options'
      : siteLanguage === 'es'
      ? 'Opciones'
      : siteLanguage === 'fr'
      ? 'Options'
      : siteLanguage === 'de'
      ? 'Optionen'
      : siteLanguage === 'it'
      ? 'Opzioni'
      : 'Opções';

  const assistantMenuLabel =
    siteLanguage === 'en'
      ? 'Assistant'
      : siteLanguage === 'es'
      ? 'Asistente'
      : siteLanguage === 'fr'
      ? 'Assistant'
      : siteLanguage === 'de'
      ? 'Assistent'
      : siteLanguage === 'it'
      ? 'Assistente'
      : 'Assistente';

  const typographyDensityLabel =
    siteLanguage === 'en'
      ? 'Font & Page Spacing'
      : siteLanguage === 'es'
      ? 'Tipografía y Espaciado'
      : siteLanguage === 'fr'
      ? 'Police et Espacement'
      : siteLanguage === 'de'
      ? 'Schrift & Abstand'
      : siteLanguage === 'it'
      ? 'Carattere e Spaziatura'
      : 'Fonte e Espaçamento';

  void guideMode;

  return (
    <div
      ref={editorRootRef}
      onKeyDown={handleEditorKeyDown}
      className="flex flex-col flex-1 min-h-0 h-full bg-slate-50/60"
    >
      {/* 1. VISUAL CHECKLIST PROGRESS + AUTO-SAVE STATUS + OPTIONS MENU */}
      <div className="shrink-0 z-20 bg-white border-b border-slate-200">
        {/* Visual Checklist Tabs (4 Clear Steps) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100">
          {STEPS.map((step, idx) => {
            const isActive = currentStepIndex === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setOpenMenuId(null);
                }}
                title={guides.stepTabsTitle[step.id]}
                className={`min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs transition-colors border-b-2 min-w-0 touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium'
                }`}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-300'
                    }`}
                  />
                )}
                <span className="truncate">{step.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Calm Auto-Save Strip + Live ATS Score Pill + Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-slate-50/70">
          <div className="flex items-center gap-2 min-w-0 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 shrink-0">
              {syncState === 'saving' ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
              ) : (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
              <span>{syncState === 'saving' ? v2.syncing : v2.autoSaved}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-500 truncate hidden sm:inline">{syncTimeText}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors whitespace-nowrap tabular-nums ${
                showDiagnostics
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Target className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{v2.atsWidgetTitle}: {effectiveAtsScore}/100</span>
            </button>

            <div className="relative" data-editor-menu="true">
              <button
                type="button"
                onClick={() => setOpenMenuId((prev) => (prev === 'top-options' ? null : 'top-options'))}
                aria-expanded={openMenuId === 'top-options'}
                title={optionsMenuLabel}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors whitespace-nowrap touch-manipulation ${
                  openMenuId === 'top-options'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{optionsMenuLabel}</span>
              </button>

              {openMenuId === 'top-options' && (
                <div className="absolute right-0 mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] max-h-[70dvh] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    type="button"
                    disabled={undoStack.length === 0}
                    onClick={() => {
                      handleUndo();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ui.undoTitle}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+Z</span>
                  </button>

                  <button
                    type="button"
                    disabled={redoStack.length === 0}
                    onClick={() => {
                      handleRedo();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Redo2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ui.redoTitle}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Ctrl+Y</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {onOpenGoalModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onOpenGoalModal();
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                      <span>{v2.changeGoalBtn}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      onOpenAiTailor();
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{ui.stage1.aiOptimizeBtn}</span>
                  </button>

                  {onOpenCoverLetter && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onOpenCoverLetter();
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ui.stage4.coverCtaTitle}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress hairline */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Collapsible Live ATS Checklist Drawer (Opened from Options Menu) */}
        {showDiagnostics && (
          <div className="px-3.5 sm:px-5 py-3 bg-white border-t border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto">
            <div className="pb-2 mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">ATS {cvMetrics.strengthScore}%</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{cvMetrics.totalWords} {ui.words}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>~{cvMetrics.estimatedPages} {ui.pagesA4}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{completedCriteria}/{cvMetrics.completenessChecklist.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="text-slate-500 hover:text-slate-900 font-sans font-semibold"
              >
                {ui.stage1.close}
              </button>
            </div>
            {cvMetrics.completenessChecklist.map((item, idx) => {
              const localizedCheck = ui.checklistItems[idx] || item;
              return (
                <div
                  key={idx}
                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {item.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          item.completed ? 'text-slate-800' : 'text-slate-950'
                        }`}
                      >
                        {localizedCheck.label}
                      </p>
                      {!item.completed && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {localizedCheck.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                  {!item.completed && (
                    <button
                      type="button"
                      onClick={() => jumpToDiagnosticTarget(idx)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0"
                    >
                      {ui.completeAction}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE STEP CONTENT AREA */}
      <div className="p-3.5 sm:p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {/* ========================================================================= */}
        {/* STAGE 1: PERFIL, CONTACTOS & RESUMO EXECUTIVO */}
        {/* ========================================================================= */}
        {currentStep.id === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 animate-in fade-in duration-150">
            {/* Group 1A: Identificação & Contactos */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2" title={`${ui.stage1.idTipTitle}: ${ui.stage1.idTipText}`}>
                  <User className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {ui.stage1.idTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  title={guides.photoManageTooltip}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {cv.personalDetails.photoUrl ? (
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{cv.personalDetails.photoUrl ? ui.stage1.photoLabel : ui.stage1.addPhoto}</span>
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {ui.stage1.fullName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cv.personalDetails.name}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.target.value }
                      })
                    }
                    className={`${INPUT_CLASS} font-medium`}
                    placeholder={ui.stage1.fullNamePh}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      {ui.stage1.jobTitle} <span className="text-rose-500">*</span>
                    </label>
                    <ExpertTip
                      compact
                      align="right"
                      title={ui.stage1.jobTitleTipTitle}
                      tip={ui.stage1.jobTitleTipText}
                      example="Chief Operating Officer (COO) | Operations & P&L"
                    />
                  </div>
                  <input
                    type="text"
                    value={cv.personalDetails.title}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.target.value }
                      })
                    }
                    className={`${INPUT_CLASS} font-medium`}
                    placeholder={ui.stage1.jobTitlePh}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      {ui.stage1.email} <span className="text-rose-500">*</span>
                    </label>
                    {!isEmailValid && (
                      <span className="text-[10px] font-medium text-rose-600">{ui.stage1.invalidEmail}</span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={cv.personalDetails.email}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, email: e.target.value }
                      })
                    }
                    className={`${INPUT_CLASS} ${!isEmailValid ? 'border-rose-400 focus:border-rose-500' : ''}`}
                    placeholder={ui.stage1.emailPh}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {ui.stage1.phone} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cv.personalDetails.phone}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, phone: e.target.value }
                      })
                    }
                    className={`${INPUT_CLASS} font-mono`}
                    placeholder={ui.stage1.phonePh}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {ui.stage1.location}
                  </label>
                  <input
                    type="text"
                    value={cv.personalDetails.location}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, location: e.target.value }
                      })
                    }
                    className={INPUT_CLASS}
                    placeholder={ui.stage1.locationPh}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {ui.stage1.linkedin}
                  </label>
                  <input
                    type="text"
                    value={cv.personalDetails.linkedin}
                    onChange={(e) =>
                      commitChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, linkedin: e.target.value }
                      })
                    }
                    onBlur={(e) => {
                      const cleaned = e.target.value.replace(/^https?:\/\/(www\.)?/i, '').trim();
                      if (cleaned !== e.target.value) {
                        commitChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, linkedin: cleaned }
                        });
                      }
                    }}
                    className={INPUT_CLASS}
                    placeholder={ui.stage1.linkedinPh}
                  />
                </div>

                {showWebsiteField || cv.personalDetails.website ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {ui.stage1.website}
                    </label>
                    <input
                      type="text"
                      value={cv.personalDetails.website || ''}
                      onChange={(e) =>
                        commitChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, website: e.target.value }
                        })
                      }
                      className={INPUT_CLASS}
                      placeholder={ui.stage1.websitePh}
                    />
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowWebsiteField(true)}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{ui.stage1.addWebsite}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Group 1B: Resumo Profissional Executivo */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {ui.stage1.summaryTitle}
                  </h3>
                  <ExpertTip
                    title={ui.stage1.summaryTipTitle}
                    tip={ui.stage1.summaryTipText}
                    example={ui.stage1.summaryTipExample}
                  />
                </div>

                {/* Discreet 1-click AI Improve + Assistant Menu */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={improvingFieldKey === 'summary'}
                    onClick={() => void handleImproveFieldWithAi('summary')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                  >
                    {improvingFieldKey === 'summary' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{improvingFieldKey === 'summary' ? v2.improvingAiBtn : v2.improveAiBtn}</span>
                  </button>

                  <div className="relative shrink-0" data-editor-menu="true">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === 'summary-assist' ? null : 'summary-assist'))}
                      aria-expanded={openMenuId === 'summary-assist'}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>{assistantMenuLabel}</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openMenuId === 'summary-assist' ? 'rotate-180' : ''}`} />
                    </button>

                    {openMenuId === 'summary-assist' && (
                      <div className="absolute right-0 mt-1.5 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onOpenAiTailor();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{ui.stage1.aiOptimizeBtn}</span>
                        </button>
                        {snippets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setShowSnippetPicker((prev) => !prev);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{ui.stage1.examplesBtn} ({snippets.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showSnippetPicker && snippets.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      {ui.stage1.snippetLibraryTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSnippetPicker(false)}
                      className="text-slate-500 hover:text-slate-800 font-medium"
                    >
                      {ui.stage1.close}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {snippets.map((snip) => (
                      <div
                        key={snip.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col justify-between gap-1.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 truncate">{snip.profession}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{snip.area}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{snip.sampleSummary}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplySnippetSummary(snip)}
                          className="w-full py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md transition-colors"
                        >
                          {ui.stage1.useTitleSummary}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                rows={4}
                value={cv.summary}
                onChange={(e) => commitChange({ ...cv, summary: e.target.value })}
                className="w-full text-xs leading-relaxed p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 transition-colors text-slate-800"
                placeholder={ui.stage1.summaryPh}
              />

              <div className="flex items-center justify-end text-[11px] text-slate-400">
                <span
                  title={
                    summaryWordCount >= 40 && summaryWordCount <= 130
                      ? ui.stage1.lenIdeal
                      : summaryWordCount > 130
                      ? ui.stage1.lenLong
                      : ui.stage1.lenShort
                  }
                  className={`font-mono tabular-nums cursor-help ${
                    summaryWordCount >= 40 && summaryWordCount <= 130
                      ? 'text-emerald-700'
                      : summaryWordCount > 130
                      ? 'text-amber-700'
                      : 'text-slate-500'
                  }`}
                >
                  {summaryWordCount} {summaryWordCount === 1 ? ui.stage1.wordSingular : ui.stage1.wordPlural}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: EXPERIÊNCIA PROFISSIONAL */}
        {/* ========================================================================= */}
        {currentStep.id === 'career' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase className="w-4 h-4 text-slate-700 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                  {ui.stage2.title} ({cv.experiences.length})
                </h3>
                <ExpertTip
                  title={ui.stage2.tipTitle}
                  tip={ui.stage2.tipText}
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {snippets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSnippetPicker((prev) => !prev)}
                    title={guides.achievementTemplatesTooltip}
                    className={`min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      showSnippetPicker
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{ui.stage2.achievementTemplatesDesktop}</span>
                    <span className="sm:hidden">{ui.stage2.achievementTemplatesMobile}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddExperience}
                  title={guides.addRoleTooltip}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{ui.stage2.addRole}</span>
                </button>
              </div>
            </div>

            {showSnippetPicker && snippets.length > 0 && (
              <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    {ui.stage2.insertByProfessionTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSnippetPicker(false)}
                    className="text-slate-500 hover:text-slate-900 font-medium"
                  >
                    {ui.stage1.close}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {snippets.map((snip) => (
                    <button
                      key={snip.id}
                      type="button"
                      onClick={() => handleApplySnippetBullets(snip)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 transition-colors"
                    >
                      + {snip.profession} ({snip.sampleBullets.length} {ui.stage2.metricsUnit})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cv.experiences.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">{ui.stage2.emptyTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ui.stage2.emptySubtitle}
                </p>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="mt-4 min-h-[40px] px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs touch-manipulation"
                >
                  {ui.stage2.addFirstRole}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {cv.experiences.map((exp, expIdx) => {
                  const isCollapsed = !!collapsedExps[expIdx];
                  const showDonor = Boolean(exp.donor?.trim()) || Boolean(donorFieldsOpen[expIdx]);
                  const expMetricCount = (exp.highlights || []).filter((h) => METRIC_REGEX.test(h)).length;

                  return (
                    <div key={exp.id || expIdx} className="group">
                      {/* Accordion Header */}
                      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleExpCollapse(expIdx)}
                          title={isCollapsed ? ui.stage2.expandTitle : ui.stage2.collapseTitle}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono tabular-nums font-bold shrink-0">
                            {expIdx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs">
                              <span className="font-bold text-slate-900">
                                {exp.role || ui.stage2.newRoleFallback}
                              </span>
                              <span className="text-slate-400 mx-1.5">·</span>
                              <span className="text-slate-600 font-medium">
                                {exp.company || ui.stage2.companyFallback}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-2 mt-0.5">
                              {exp.period && <span>{exp.period}</span>}
                              {exp.period && <span aria-hidden="true">·</span>}
                              <span>{exp.highlights.length} {ui.stage2.pointsUnit}</span>
                              {expMetricCount > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 font-medium">
                                    {expMetricCount} {ui.stage2.metricUnit}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <div className="relative" data-editor-menu="true">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === `exp-${expIdx}` ? null : `exp-${expIdx}`
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
                              title={optionsMenuLabel}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === `exp-${expIdx}` && (
                              <div className="absolute right-0 mt-1 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                                <button
                                  type="button"
                                  disabled={expIdx === 0}
                                  onClick={() => {
                                    handleMoveExperience(expIdx, 'up');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none flex items-center gap-2"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{ui.stage2.moveUpTitle}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={expIdx === cv.experiences.length - 1}
                                  onClick={() => {
                                    handleMoveExperience(expIdx, 'down');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none flex items-center gap-2"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{ui.stage2.moveDownTitle}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicateExperience(expIdx);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{ui.stage2.duplicateTitle}</span>
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteExperience(expIdx);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{ui.stage2.deleteRoleTitle}</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpCollapse(expIdx)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                            title={isCollapsed ? ui.stage2.expandTitle : ui.stage2.collapseTitle}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Body */}
                      {!isCollapsed && (
                        <div className="px-4 sm:px-5 pb-4 pt-3 bg-slate-50/40 space-y-3.5 border-t border-slate-100">
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {ui.stage2.roleLabel}
                              </label>
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, role: e.target.value })
                                }
                                placeholder={ui.stage2.rolePh}
                                className={`${INPUT_CLASS} font-semibold`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {ui.stage2.companyLabel}
                              </label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, company: e.target.value })
                                }
                                placeholder={ui.stage2.companyPh}
                                className={`${INPUT_CLASS} font-medium`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {ui.stage2.periodLabel}
                              </label>
                              <input
                                type="text"
                                value={exp.period}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, period: e.target.value })
                                }
                                placeholder={ui.stage2.periodPh}
                                className={INPUT_CLASS}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                {ui.stage2.locationLabel}
                              </label>
                              <input
                                type="text"
                                value={exp.location || ''}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, {
                                    ...exp,
                                    location: e.target.value
                                  })
                                }
                                placeholder={ui.stage2.locationPh}
                                className={INPUT_CLASS}
                              />
                            </div>

                            {showDonor ? (
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  {ui.stage2.donorLabel}
                                </label>
                                <input
                                  type="text"
                                  value={exp.donor || ''}
                                  onChange={(e) =>
                                    handleUpdateExperience(expIdx, {
                                      ...exp,
                                      donor: e.target.value
                                    })
                                  }
                                  placeholder={ui.stage2.donorPh}
                                  className={INPUT_CLASS}
                                />
                              </div>
                            ) : (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDonorFieldsOpen((prev) => ({ ...prev, [expIdx]: true }))
                                  }
                                  className="text-[11px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{ui.stage2.addDonorBtn}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Highlights / Google XYZ Bullets */}
                          <div className="space-y-2 pt-2 border-t border-slate-200/60">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                  {ui.stage2.highlightsLabel}
                                </label>
                                <ExpertTip
                                  compact
                                  title={ui.stage2.xyzTipTitle}
                                  tip={ui.stage2.xyzTipText}
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={improvingFieldKey === `exp-${expIdx}`}
                                  onClick={() => void handleImproveFieldWithAi('experience', expIdx)}
                                  className="text-[11px] px-2 py-1 rounded-md border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 font-semibold flex items-center gap-1 whitespace-nowrap disabled:opacity-60"
                                >
                                  {improvingFieldKey === `exp-${expIdx}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                  ) : (
                                    <Sparkles className="w-3 h-3 text-blue-600" />
                                  )}
                                  <span>
                                    {improvingFieldKey === `exp-${expIdx}` ? v2.improvingAiBtn : v2.improveAiBtn}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVerbPickerExpIdx((prev) => (prev === expIdx ? null : expIdx))
                                  }
                                  title={guides.actionVerbsTooltip}
                                  className="text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Wand2 className="w-3 h-3 text-amber-600" />
                                  <span>{ui.stage2.actionVerbsBtn}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddHighlight(expIdx)}
                                  title={guides.addBulletTooltip}
                                  className="text-xs text-slate-800 hover:text-slate-950 font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{ui.stage2.addPointBtn}</span>
                                </button>
                              </div>
                            </div>

                            {/* Action Verbs Drawer */}
                            {verbPickerExpIdx === expIdx && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-800 uppercase tracking-wider">
                                    {ui.stage2.verbsDrawerTitle}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setVerbPickerExpIdx(null)}
                                    className="text-slate-500 hover:text-slate-900 font-medium"
                                  >
                                    {ui.stage1.close}
                                  </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {EXECUTIVE_ACTION_VERBS.map((group) => (
                                    <div key={group.category} className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-500 block">
                                        {group.category}
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {group.verbs.map((verb) => (
                                          <button
                                            key={verb}
                                            type="button"
                                            onClick={() => handleInsertActionVerb(expIdx, verb)}
                                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-md text-slate-800 transition-colors"
                                          >
                                            {verb}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              {exp.highlights.map((h, hIdx) => {
                                const hasMetric = METRIC_REGEX.test(h);
                                return (
                                  <div key={hIdx} className="group/bullet flex items-start gap-1.5">
                                    <div className="flex-1 space-y-1">
                                      <textarea
                                        rows={2}
                                        value={h}
                                        onChange={(e) =>
                                          handleUpdateHighlight(expIdx, hIdx, e.target.value)
                                        }
                                        placeholder={ui.stage2.highlightPh}
                                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 resize-none"
                                      />
                                      {h.trim().length > 12 && (
                                        <div className="hidden group-hover/bullet:flex group-focus-within/bullet:flex text-[10px] font-medium items-center justify-between px-0.5">
                                          <span
                                            className={
                                              hasMetric ? 'text-emerald-700' : 'text-amber-700'
                                            }
                                          >
                                            {hasMetric
                                              ? ui.stage2.hasMetricHint
                                              : ui.stage2.needsMetricHint}
                                          </span>
                                          <span className="font-mono tabular-nums text-slate-400">
                                            {h.trim().length} {ui.stage2.charsShort}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/bullet:opacity-100 sm:group-focus-within/bullet:opacity-100 transition-opacity"
                                      title={ui.stage2.deletePointTitle}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: FORMAÇÃO & SKILLS (GROUPED CLEANLY INTO 2 SUB-TABS) */}
        {/* ========================================================================= */}
        {currentStep.id === 'credentials' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Sub-Group Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs gap-1">
              <button
                type="button"
                onClick={() => setCredentialsTab('academic')}
                className={`min-w-0 py-2 px-2 sm:px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  credentialsTab === 'academic'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ui.stage3.tabAcademic} ({cv.educations.length + cv.trainings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCredentialsTab('skills')}
                className={`min-w-0 py-2 px-2 sm:px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  credentialsTab === 'skills'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ui.stage3.tabSkills} ({cv.competencies.length + cv.languages.length})</span>
              </button>
            </div>

            {credentialsTab === 'academic' ? (
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {/* Academic Education */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ui.stage3.eduTitle} ({cv.educations.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{ui.stage3.addBtn}</span>
                    </button>
                  </div>

                  {cv.educations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      {ui.stage3.noEdu}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.educations.map((edu, eduIdx) => (
                        <div key={edu.id || eduIdx} className="group py-3 first:pt-1 last:pb-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  {ui.stage3.degreeLabel}
                                </label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) =>
                                    handleUpdateEducation(eduIdx, { ...edu, degree: e.target.value })
                                  }
                                  placeholder={ui.stage3.degreePh}
                                  className={`${INPUT_CLASS} font-semibold`}
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  {ui.stage3.institutionLabel}
                                </label>
                                <input
                                  type="text"
                                  value={edu.institution}
                                  onChange={(e) =>
                                    handleUpdateEducation(eduIdx, {
                                      ...edu,
                                      institution: e.target.value
                                    })
                                  }
                                  placeholder={ui.stage3.institutionPh}
                                  className={INPUT_CLASS}
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  {ui.stage3.periodLabel}
                                </label>
                                <input
                                  type="text"
                                  value={edu.period}
                                  onChange={(e) =>
                                    handleUpdateEducation(eduIdx, { ...edu, period: e.target.value })
                                  }
                                  placeholder={ui.stage3.periodPh}
                                  className={INPUT_CLASS}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(eduIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-5 shrink-0 sm:opacity-30 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                              title={ui.stage3.deleteEdu}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {Boolean(edu.gpaOrHonors?.trim()) || Boolean(honorsOpen[eduIdx]) ? (
                            <input
                              type="text"
                              value={edu.gpaOrHonors || ''}
                              onChange={(e) =>
                                handleUpdateEducation(eduIdx, {
                                  ...edu,
                                  gpaOrHonors: e.target.value
                                })
                              }
                              placeholder={ui.stage3.honorsPh}
                              className="w-full text-[11px] px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-600"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setHonorsOpen((prev) => ({ ...prev, [eduIdx]: true }))
                              }
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{ui.stage3.honorsPh}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications & Trainings */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ui.stage3.certsTitle} ({cv.trainings.length})
                      </h3>
                    </div>
                  </div>

                  {/* Quick-Add bar with Enter key */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTrainingDraft}
                      onChange={(e) => setNewTrainingDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTrainingDraft.trim()) {
                          e.preventDefault();
                          handleAddTraining();
                        }
                      }}
                      placeholder={ui.stage3.certInputPh}
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTraining()}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{ui.stage3.addBtn}</span>
                    </button>
                  </div>

                  {cv.trainings.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      {ui.stage3.noCerts}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cv.trainings.map((tItem, tIdx) => (
                        <div key={tIdx} className="group flex items-center gap-2">
                          <input
                            type="text"
                            value={tItem}
                            onChange={(e) => handleUpdateTraining(tIdx, e.target.value)}
                            placeholder={ui.stage3.certItemPh}
                            className={`${INPUT_CLASS} font-medium`}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteTraining(tIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0 sm:opacity-35 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                            title={ui.stage3.deleteCert}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {/* Competencies */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ui.stage3.compTitle} ({cv.competencies.length})
                      </h3>
                      <ExpertTip
                        title={ui.stage3.compTipTitle}
                        tip={ui.stage3.compTipText}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={improvingFieldKey === 'competencies'}
                        onClick={() => void handleImproveFieldWithAi('competencies')}
                        className="min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                      >
                        {improvingFieldKey === 'competencies' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <span>
                          {improvingFieldKey === 'competencies' ? v2.improvingAiBtn : v2.improveAiBtn}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClusterPicker((prev) => !prev)}
                        title={guides.clustersTooltip}
                        className={`min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                          showClusterPicker
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="hidden sm:inline">{ui.stage3.clustersBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCompetency}
                        title={ui.stage3.compTitle}
                        className="min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs touch-manipulation"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{ui.stage3.addBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Competency Clusters Picker */}
                  {showClusterPicker && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 uppercase tracking-wider">
                          {ui.stage3.clustersDrawerTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowClusterPicker(false)}
                          className="text-slate-500 hover:text-slate-900 font-medium"
                        >
                          {ui.stage1.close}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_COMPETENCY_CLUSTERS.map((cluster) => (
                          <button
                            key={cluster.title}
                            type="button"
                            onClick={() =>
                              handleApplyCompetencyCluster(cluster.title, cluster.skills)
                            }
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 transition-colors"
                          >
                            + {cluster.title} ({cluster.skills.length})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cv.competencies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      {ui.stage3.noComp}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.competencies.map((comp, compIdx) => (
                        <div key={comp.id || compIdx} className="group py-3 first:pt-1 last:pb-0 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={comp.category}
                              onChange={(e) =>
                                handleUpdateCompetency(compIdx, {
                                  ...comp,
                                  category: e.target.value
                                })
                              }
                              placeholder={ui.stage3.compCatPh}
                              className={`${INPUT_CLASS} font-bold`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteCompetency(compIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0 sm:opacity-30 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                              title={ui.stage3.deleteComp}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={comp.description}
                            onChange={(e) =>
                              handleUpdateCompetency(compIdx, {
                                ...comp,
                                description: e.target.value
                              })
                            }
                            placeholder={ui.stage3.compDescPh}
                            className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Languages */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ui.stage3.langTitle} ({cv.languages.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{ui.stage3.addLangBtn}</span>
                    </button>
                  </div>

                  {cv.languages.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{ui.stage3.noLang}</p>
                  ) : (
                    <div className="space-y-2">
                      {cv.languages.map((lang, langIdx) => (
                        <div key={langIdx} className="group flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <input
                            type="text"
                            value={lang.language}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, language: e.target.value })
                            }
                            placeholder={ui.stage3.langPh}
                            className="text-xs font-semibold px-2.5 sm:px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-24 sm:w-40 min-w-0 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10"
                          />

                          <select
                            value={lang.level}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, level: e.target.value })
                            }
                            className={`flex-1 min-w-0 ${INPUT_CLASS}`}
                          >
                            {!ui.stage3.cefrLevels.includes(lang.level) && lang.level && (
                              <option value={lang.level}>{lang.level}</option>
                            )}
                            {ui.stage3.cefrLevels.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteLanguage(langIdx)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded shrink-0 sm:opacity-35 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                            title={ui.stage3.deleteLang}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: ESTRUTURA, TIPOGRAFIA, ESTILO & FINALIZAÇÃO */}
        {/* ========================================================================= */}
        {currentStep.id === 'structure' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Compact ATS Employability Score Widget + Contextual Template Recommendation */}
            <div className="grid grid-cols-1 gap-3">
              {/* 1. Compact ATS Score Widget */}
              {(() => {
                const hasDetailedExp =
                  cv.experiences.length > 0 &&
                  cv.experiences.some((e) => e.highlights.filter((h) => h.trim().length > 20).length >= 2);
                const hasRelevantSkills = cv.competencies.length >= 2;
                const hasKeywords =
                  summaryWordCount >= 35 &&
                  (jobDescription.trim().length > 20 ? atsAudit.missingKeywords.length <= 3 : cvMetrics.totalWords >= 160);

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">{v2.atsWidgetTitle}</span>
                      </div>
                      <span className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                        {effectiveAtsScore}/100
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        {hasDetailedExp ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className={hasDetailedExp ? 'text-slate-700' : 'text-amber-800 font-medium'}>
                          {hasDetailedExp ? v2.expDetailed : v2.expMissing}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasRelevantSkills ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className={hasRelevantSkills ? 'text-slate-700' : 'text-amber-800 font-medium'}>
                          {hasRelevantSkills ? v2.skillsRelevant : v2.skillsMissing}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasKeywords ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className={hasKeywords ? 'text-slate-700' : 'text-amber-800 font-medium'}>
                          {hasKeywords ? v2.keywordsGood : v2.keywordsMissing}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Contextual Smart Template Recommendation */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{v2.recommendedForYou}</span>
                    </span>
                    <p className="text-sm font-extrabold text-slate-950 truncate">
                      {recommendedTemplateMeta.shortName || recommendedPreset.templateName}
                    </p>
                  </div>
                  {onOpenGoalModal && (
                    <button
                      type="button"
                      onClick={onOpenGoalModal}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline shrink-0"
                    >
                      {v2.changeGoalBtn}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="font-semibold text-slate-900">{v2.reasonLabel}</strong>{' '}
                  {recommendedPreset.labels[siteLanguage]?.reason || recommendedPreset.labels.en.reason}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  {cv.templateStyle === recommendedPreset.templateStyle ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{v2.activeOnCv}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        trackFrontendTelemetry({
                          type: 'template_selected',
                          templateStyle: recommendedPreset.templateStyle
                        });
                        commitChange(
                          {
                            ...cv,
                            templateStyle: recommendedPreset.templateStyle,
                            accentColor: recommendedPreset.accentColor,
                            sectionOrder: recommendedPreset.sectionOrder
                          },
                          true
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                    >
                      {v2.useRecommendedBtn}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {/* Visual Style & Template Picker */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2" title={guides.step4Instruction}>
                    <Palette className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {ui.stage4.styleTitle}
                    </h3>
                  </div>
                  <TemplateSelectorDropdown
                    currentStyle={cv.templateStyle}
                    onSelectStyle={(newStyle) => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: newStyle });
                      commitChange({ ...cv, templateStyle: newStyle }, true);
                    }}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                </div>

                {/* Accent Color */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-600">{ui.stage4.accentColorLabel}</span>
                  <div className="flex items-center gap-2">
                    {ACCENT_HEX_LIST.map((hex) => {
                      const colorName = ui.stage4.accentColors[hex] || hex;
                      const isSelected = (cv.accentColor || '#0f172a') === hex;
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => commitChange({ ...cv, accentColor: hex }, true)}
                          aria-label={`${ui.stage4.selectColorAria} ${colorName}`}
                          aria-pressed={isSelected}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={colorName}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Typography & Density Collapsed Drawer */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdvancedDesignOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-700 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      <span>{typographyDensityLabel}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${advancedDesignOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {advancedDesignOpen && (
                    <div className="pt-3 space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 block">
                          {ui.stage4.typographyLabel}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {FONT_IDS.map((fontId) => {
                            const fontMeta = ui.stage4.fonts[fontId || 'default'] || {
                              label: fontId,
                              hint: ''
                            };
                            const activeFont = cv.fontFamily || 'default';
                            const isSelected = activeFont === fontId;
                            return (
                              <button
                                key={fontId}
                                type="button"
                                onClick={() =>
                                  commitChange(
                                    {
                                      ...cv,
                                      fontFamily: fontId === 'default' ? undefined : fontId
                                    },
                                    true
                                  )
                                }
                                title={`${fontMeta.label} — ${fontMeta.hint}`}
                                className={`px-2 py-1.5 rounded-lg border text-center transition-colors text-[11px] font-bold truncate ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                {fontMeta.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {onDensityChange && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                            <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ui.stage4.densityLabel}</span>
                          </span>
                          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px]">
                            {(
                              [
                                { id: 'compact', label: ui.stage4.densityCompact },
                                { id: 'normal', label: ui.stage4.densityNormal },
                                { id: 'relaxed', label: ui.stage4.densityRelaxed }
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => onDensityChange(opt.id)}
                                title={guides.densityTooltips[opt.id]}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                                  density === opt.id
                                    ? 'bg-white text-slate-950 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible Section Ordering & Visibility */}
              <div className="p-4 sm:p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setSectionsOrderOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {ui.stage4.sectionsTitle}
                    </h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${sectionsOrderOpen ? 'rotate-180' : ''}`} />
                </button>

                {sectionsOrderOpen && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={resetSectionOrder}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{ui.stage4.resetOrderBtn}</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                      {sectionOrder.map((sectionKey, index) => {
                        const meta = SECTION_METADATA[sectionKey];
                        const sectionLabel = ui.stage4.sectionNames[sectionKey] || meta?.name || sectionKey;
                        const isVisible = cv.sectionVisibility?.[sectionKey] !== false;

                        return (
                          <div
                            key={sectionKey}
                            className="group flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/70 transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] text-slate-400 font-mono tabular-nums w-4">
                                {index + 1}.
                              </span>
                              <span
                                className={
                                  isVisible
                                    ? 'font-semibold text-slate-900'
                                    : 'font-medium text-slate-400 line-through'
                                }
                              >
                                {sectionLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveSection(index, 'up')}
                                disabled={index === 0}
                                aria-label={`${ui.stage3.moveUp}: ${sectionLabel}`}
                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSection(index, 'down')}
                                disabled={index === sectionOrder.length - 1}
                                aria-label={`${ui.stage3.moveDown}: ${sectionLabel}`}
                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSectionVisibility(sectionKey)}
                                aria-label={`${isVisible ? ui.stage4.hideSectionTitle : ui.stage4.showSectionTitle}: ${sectionLabel}`}
                                aria-pressed={isVisible}
                                className={`p-1 rounded hover:bg-slate-100 ${
                                  isVisible
                                    ? 'text-slate-700 hover:text-slate-950'
                                    : 'text-amber-600 hover:text-amber-800'
                                }`}
                              >
                                {isVisible ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* References (Collapsed cleanly when empty unless user wants to add) */}
              {cv.references.length === 0 && !showReferencesBlock ? (
                <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReferencesBlock(true);
                      handleAddReference();
                    }}
                    title={guides.optionalRefTooltip}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 py-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{guides.addOptionalRefBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ui.stage4.refsTitle} ({cv.references.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddReference}
                      title={guides.optionalRefTooltip}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{ui.stage3.addBtn}</span>
                    </button>
                  </div>

                  {cv.references.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      {ui.stage4.noRefs}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.references.map((ref, refIdx) => (
                        <div key={ref.id || refIdx} className="group py-2.5 first:pt-1 last:pb-0 flex items-start gap-2">
                          <div className="space-y-2 flex-1">
                            <input
                              type="text"
                              value={ref.name}
                              onChange={(e) =>
                                handleUpdateReference(refIdx, { ...ref, name: e.target.value })
                              }
                              placeholder={ui.stage4.refNamePh}
                              className={`${INPUT_CLASS} font-semibold`}
                            />
                            <input
                              type="text"
                              value={ref.institutionAndPosition}
                              onChange={(e) =>
                                handleUpdateReference(refIdx, {
                                  ...ref,
                                  institutionAndPosition: e.target.value
                                })
                              }
                              placeholder={ui.stage4.refInstPh}
                              className={INPUT_CLASS}
                            />
                            <input
                              type="text"
                              value={ref.contact}
                              onChange={(e) =>
                                handleUpdateReference(refIdx, { ...ref, contact: e.target.value })
                              }
                              placeholder={ui.stage4.refContactPh}
                              className={`${INPUT_CLASS} font-mono`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReference(refIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-0.5 shrink-0 sm:opacity-35 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                            title={ui.stage4.deleteRef}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CV Quality Evaluation & Recommended Next Steps (Jobs + Download) */}
            {(() => {
              const score = cvMetrics.strengthScore;
              const isStrong = score >= 80;
              const isMedium = score >= 55 && score < 80;
              const missingItems = cvMetrics.completenessChecklist
                .map((item, idx) => ({ item, idx }))
                .filter((entry) => !entry.item.completed);

              return (
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {/* Quality Score Summary */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-slate-700 shrink-0" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {evalUi.sectionTitle}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold tabular-nums border ${
                          isStrong
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {evalUi.scoreLabel}: {score}/100
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        isStrong
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : isMedium
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}
                    >
                      <p className="font-bold flex items-center gap-1.5">
                        {isStrong ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>
                          {isStrong
                            ? evalUi.strongTitle
                            : isMedium
                            ? evalUi.mediumTitle
                            : evalUi.weakTitle}
                        </span>
                      </p>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {isStrong
                          ? evalUi.strongDesc
                          : isMedium
                          ? evalUi.mediumDesc
                          : evalUi.weakDesc}
                      </p>
                    </div>

                    {missingItems.length === 0 ? (
                      <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{evalUi.allClearText}</span>
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-600">
                          {evalUi.improveHint}
                        </p>
                        <div className="space-y-1.5">
                          {missingItems.slice(0, 3).map(({ item, idx }) => {
                            const localizedCheck = ui.checklistItems[idx] || item;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                              >
                                <span className="text-[11px] font-medium text-slate-700 truncate">
                                  {localizedCheck.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => jumpToDiagnosticTarget(idx)}
                                  className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800 shrink-0"
                                >
                                  {ui.completeAction}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next Steps: Download + Job Search Suggestion */}
                  {(onOpenJobs || onExportCv) && (
                    <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {evalUi.nextStepTitle}
                        </h4>
                        {onOpenJobs && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {evalUi.jobsHint}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {onExportCv && (
                          <button
                            type="button"
                            onClick={onExportCv}
                            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 shadow-xs touch-manipulation"
                          >
                            <Download className="w-4 h-4 shrink-0" />
                            <span>{studioText.docToolbar.wordBtn}</span>
                          </button>
                        )}
                        {onOpenJobs && (
                          <button
                            type="button"
                            onClick={onOpenJobs}
                            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                          >
                            <Search className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{evalUi.jobsBtn}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 3. FIXED STEP FOOTER */}
      <div className="shrink-0 z-20 bg-white border-t border-slate-200 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className="min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{ui.footer.prev}</span>
        </button>

        <span className="text-[11px] font-mono tabular-nums text-slate-500 hidden sm:inline">
          {ui.footer.stepOf
            .replace('{current}', String(currentStepIndex + 1))
            .replace('{total}', String(STEPS.length))}
        </span>

        <div className="flex items-center gap-2 min-w-0">
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="min-h-[42px] max-w-full px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap min-w-0 touch-manipulation"
            >
              <span className="truncate">{ui.footer.nextPrefix} {STEPS[currentStepIndex + 1].shortLabel}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : onOpenJobs ? (
            <button
              type="button"
              onClick={onOpenJobs}
              className="min-h-[42px] px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap touch-manipulation"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>{v2.finishApplyBtn}</span>
            </button>
          ) : (
            onExportCv && (
              <button
                type="button"
                onClick={onExportCv}
                className="min-h-[42px] px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap touch-manipulation"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{studioText.docToolbar.wordBtn}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplateAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={(s) => commitChange({ ...cv, templateStyle: s }, true)}
        cv={cv}
        onUpdateCV={(next) => commitChange(next, true)}
        onOpenPricingModal={onOpenPricingModal}
      />

      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        cv={cv}
        onChange={(next) => commitChange(next, true)}
      />
    </div>
  );
};
