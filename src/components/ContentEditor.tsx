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
  Save,
  RefreshCw,
  Award,
  Palette,
  BookOpen,
  Undo2,
  Redo2,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Type,
  RotateCcw,
  LayoutTemplate,
  Lightbulb
} from 'lucide-react';
import { LightbulbStepBadge, StudioCreationMode } from './StudioGuideSystem';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
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
import { getStoredSnippetsSync, trackFrontendTelemetry } from '../services/adminModulesService';
import { ProfessionSnippetExample } from '../types/adminModules';

interface ContentEditorProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  onOpenAiTailor: () => void;
  onOpenCoverLetter?: () => void;
  onOpenAuthModal?: (prompt?: string) => void;
  onOpenPricingModal?: (prompt?: string) => void;
  density?: 'compact' | 'normal' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'normal' | 'relaxed') => void;
  guideMode?: StudioCreationMode;
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
  onOpenAuthModal,
  onOpenPricingModal,
  density = 'normal',
  onDensityChange,
  guideMode = 'guided'
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snippets, setSnippets] = useState<ProfessionSnippetExample[]>(() => getStoredSnippetsSync());
  const [showSnippetPicker, setShowSnippetPicker] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [verbPickerExpIdx, setVerbPickerExpIdx] = useState<number | null>(null);
  const [showClusterPicker, setShowClusterPicker] = useState<boolean>(false);
  const [newTrainingDraft, setNewTrainingDraft] = useState<string>('');
  const [showReferencesBlock, setShowReferencesBlock] = useState<boolean>(false);

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
  const { siteLanguage } = useLanguage();
  const ui = (EDITOR_UI_TRANSLATIONS[siteLanguage] || EDITOR_UI_TRANSLATIONS.en).editor;
  const guides = (STUDIO_NAV_TRANSLATIONS[siteLanguage] || STUDIO_NAV_TRANSLATIONS.en).editorGuides;

  // Live readiness metrics
  const cvMetrics = useMemo(() => calculateCVMetrics(cv), [cv]);
  const completedCriteria = cvMetrics.completenessChecklist.filter((c) => c.completed).length;

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

  const handleSaveProgress = async () => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal(ui.toasts.authPromptSave);
      }
      return;
    }

    if (!hasActivePlan) {
      if (onOpenPricingModal) {
        onOpenPricingModal(ui.toasts.pricingPromptSave);
      } else {
        showError(ui.toasts.planRequiredTitle, ui.toasts.planRequiredMsg);
      }
      return;
    }

    try {
      setIsSaving(true);
      const name = cv.personalDetails.name?.trim();
      const role = cv.personalDetails.title?.trim() || ui.toasts.defaultCvTitle;
      const title = name ? `${name} - ${role}` : ui.toasts.defaultCvTitle;
      await saveCurrentResume(cv, title, cv.personalDetails.title);
      showSuccess(
        ui.toasts.savedTitle,
        ui.toasts.savedMsg
          .replace('{exps}', String(cv.experiences.length))
          .replace('{comps}', String(cv.competencies.length))
      );
    } catch (err: any) {
      console.error('Erro ao guardar progresso:', err);
      const rawMsg = String(err?.message || '');
      const friendlyDetail = rawMsg.includes('permission')
        ? ui.toasts.savePermError
        : ui.toasts.saveGenericError;
      showError(ui.toasts.saveErrorTitle, friendlyDetail);
    } finally {
      setIsSaving(false);
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

  const handleMoveHighlight = (expIndex: number, hIndex: number, direction: 'up' | 'down') => {
    const exp = cv.experiences[expIndex];
    const targetIdx = direction === 'up' ? hIndex - 1 : hIndex + 1;
    if (!exp || targetIdx < 0 || targetIdx >= exp.highlights.length) return;
    const updatedHighlights = [...exp.highlights];
    const [moved] = updatedHighlights.splice(hIndex, 1);
    updatedHighlights.splice(targetIdx, 0, moved);
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

  const handleMoveEducation = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cv.educations.length) return;
    const list = [...cv.educations];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    commitChange({ ...cv, educations: list }, true);
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

  const handleMoveCompetency = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cv.competencies.length) return;
    const list = [...cv.competencies];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    commitChange({ ...cv, competencies: list }, true);
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

  // 4 Streamlined Grouped Stages
  const STEPS: StepDefinition[] = [
    {
      id: 'profile',
      mobileLabel: ui.steps.profile.mobile,
      shortLabel: ui.steps.profile.short,
      isCompleted: Boolean(
        cv.personalDetails.name?.trim() &&
          cv.personalDetails.email?.trim() &&
          cv.personalDetails.phone?.trim() &&
          cv.summary &&
          cv.summary.trim().length >= 40
      )
    },
    {
      id: 'career',
      mobileLabel: ui.steps.career.mobile,
      shortLabel: ui.steps.career.short,
      isCompleted: cv.experiences.length > 0
    },
    {
      id: 'credentials',
      mobileLabel: ui.steps.credentials.mobile,
      shortLabel: ui.steps.credentials.short,
      isCompleted: cv.educations.length > 0 && cv.competencies.length > 0
    },
    {
      id: 'structure',
      mobileLabel: ui.steps.structure.mobile,
      shortLabel: ui.steps.structure.short,
      isCompleted: true
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

  return (
    <div
      onKeyDown={handleEditorKeyDown}
      className="flex flex-col flex-1 min-h-0 h-full bg-slate-50/60"
    >
      {/* 1. SINGLE STREAMLINED STEPPER + UNDO/REDO + SAVE BAR */}
      <div className="shrink-0 z-20 bg-white border-b border-slate-200">
        <div className="flex items-stretch justify-between">
          <div className="grid grid-cols-4 flex-1 min-w-0">
            {STEPS.map((step, idx) => {
              const isActive = currentStepIndex === idx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  title={guides.stepTabsTitle[step.id]}
                  className={`flex items-center justify-center gap-1.5 px-1.5 sm:px-2.5 py-2.5 text-[11px] sm:text-xs transition-colors border-b-2 whitespace-nowrap min-w-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-900 ${
                    isActive
                      ? 'bg-white border-slate-900 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-medium'
                  }`}
                >
                  {guideMode === 'guided' ? (
                    <LightbulbStepBadge
                      step={idx + 1}
                      active={isActive}
                      completed={step.isCompleted && !isActive}
                    />
                  ) : (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : step.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step.isCompleted && !isActive ? (
                        <Check className="w-2.5 h-2.5 stroke-[2.75]" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                  )}
                  <span className="truncate sm:hidden">{step.mobileLabel}</span>
                  <span className="truncate hidden sm:inline">{step.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* ATS Checklist + Undo / Redo & Save Action Cluster */}
          <div className="flex items-center gap-1 px-2 sm:px-3 border-l border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              title={`${guides.readinessTooltip} — ${guides.checklistTooltip} (${completedCriteria}/${cvMetrics.completenessChecklist.length})`}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono tabular-nums font-bold flex items-center gap-1 whitespace-nowrap transition-colors ${
                showDiagnostics
                  ? 'bg-slate-900 text-white'
                  : cvMetrics.strengthScore >= 85
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : cvMetrics.strengthScore >= 60
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <span>ATS {cvMetrics.strengthScore}%</span>
              {showDiagnostics ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none transition-colors"
              title={ui.undoTitle}
              aria-label={ui.undoAria}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none transition-colors"
              title={ui.redoTitle}
              aria-label={ui.redoAria}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="ml-0.5 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
              title={ui.saveTitle}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isSaving ? ui.saving : ui.save}</span>
            </button>
          </div>
        </div>

        {/* Progress hairline */}
        <div className="w-full h-0.5 bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Collapsible Live ATS Checklist Drawer */}
        {showDiagnostics && (
          <div className="px-3.5 sm:px-5 py-3 bg-white border-t border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto">
            <div className="pb-2 mb-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
              <span>{cvMetrics.totalWords} {ui.words}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>~{cvMetrics.estimatedPages} {ui.pagesA4}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{ui.reading} {cvMetrics.readingTimeFormatted}</span>
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
        {guideMode === 'guided' && (
          <div className="px-3 py-2 bg-amber-50/90 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-[11px] text-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate font-medium">
                {guides.stepTabsTitle[currentStep.id]}
              </span>
            </div>
            {currentStepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={goToNextStep}
                className="font-bold text-amber-800 hover:underline whitespace-nowrap shrink-0"
              >
                {ui.footer.nextPrefix} {STEPS[currentStepIndex + 1].mobileLabel} →
              </button>
            )}
          </div>
        )}
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {cv.personalDetails.photoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        commitChange(
                          {
                            ...cv,
                            personalDetails: {
                              ...cv.personalDetails,
                              showPhoto: cv.personalDetails.showPhoto === false ? true : false
                            }
                          },
                          true
                        )
                      }
                      title={guides.photoToggleTooltip}
                      aria-label={guides.photoToggleTooltip}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      {cv.personalDetails.showPhoto !== false ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    title={guides.photoManageTooltip}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="text-[11px] font-semibold text-slate-600">
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
                  <div className="sm:col-span-2">
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
                  <div className="sm:col-span-2">
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {snippets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSnippetPicker((prev) => !prev)}
                      title={guides.examplesTooltip}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>{ui.stage1.examplesBtn} ({snippets.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenAiTailor}
                    title={guides.aiOptimizeTooltip}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ui.stage1.aiOptimizeBtn}</span>
                  </button>
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
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">{ui.stage2.achievementTemplatesDesktop}</span>
                    <span className="sm:hidden">{ui.stage2.achievementTemplatesMobile}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddExperience}
                  title={guides.addRoleTooltip}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
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
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
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

                        <div className="flex items-center gap-0.5 shrink-0">
                          <div className="flex items-center gap-0.5 sm:opacity-25 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleMoveExperience(expIdx, 'up')}
                              disabled={expIdx === 0}
                              className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded-md hover:bg-slate-100 transition-colors"
                              title={ui.stage2.moveUpTitle}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExperience(expIdx, 'down')}
                              disabled={expIdx === cv.experiences.length - 1}
                              className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded-md hover:bg-slate-100 transition-colors"
                              title={ui.stage2.moveDownTitle}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateExperience(expIdx)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
                              title={ui.stage2.duplicateTitle}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(expIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              title={ui.stage2.deleteRoleTitle}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                              <div className="sm:col-span-2">
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
                              <div className="sm:col-span-2">
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

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVerbPickerExpIdx((prev) => (prev === expIdx ? null : expIdx))
                                  }
                                  title={guides.actionVerbsTooltip}
                                  className="text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600" />
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
                                    <div className="flex flex-col items-center pt-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/bullet:opacity-100 sm:group-focus-within/bullet:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveHighlight(expIdx, hIdx, 'up')}
                                        disabled={hIdx === 0}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                        title={ui.stage2.movePointUpTitle}
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveHighlight(expIdx, hIdx, 'down')}
                                        disabled={hIdx === exp.highlights.length - 1}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                        title={ui.stage2.movePointDownTitle}
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                      <textarea
                                        rows={2}
                                        value={h}
                                        onChange={(e) =>
                                          handleUpdateHighlight(expIdx, hIdx, e.target.value)
                                        }
                                        placeholder={ui.stage2.highlightPh}
                                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 resize-none"
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
            <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setCredentialsTab('academic')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  credentialsTab === 'academic'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{ui.stage3.tabAcademic} ({cv.educations.length + cv.trainings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCredentialsTab('skills')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  credentialsTab === 'skills'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{ui.stage3.tabSkills} ({cv.competencies.length + cv.languages.length})</span>
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
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
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

                            <div className="flex items-center gap-0.5 mt-5 shrink-0 sm:opacity-30 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleMoveEducation(eduIdx, 'up')}
                                disabled={eduIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title={ui.stage3.moveUp}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveEducation(eduIdx, 'down')}
                                disabled={eduIdx === cv.educations.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title={ui.stage3.moveDown}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEducation(eduIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                title={ui.stage3.deleteEdu}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowClusterPicker((prev) => !prev)}
                        title={guides.clustersTooltip}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{ui.stage3.clustersBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCompetency}
                        title={ui.stage3.compTitle}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
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
                            <div className="flex items-center gap-0.5 shrink-0 sm:opacity-30 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleMoveCompetency(compIdx, 'up')}
                                disabled={compIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title={ui.stage3.moveUp}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCompetency(compIdx, 'down')}
                                disabled={compIdx === cv.competencies.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title={ui.stage3.moveDown}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCompetency(compIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                title={ui.stage3.deleteComp}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                        <div key={langIdx} className="group flex items-center gap-2">
                          <input
                            type="text"
                            value={lang.language}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, language: e.target.value })
                            }
                            placeholder={ui.stage3.langPh}
                            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-32 sm:w-40 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10"
                          />

                          <select
                            value={lang.level}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, level: e.target.value })
                            }
                            className={`flex-1 ${INPUT_CLASS}`}
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0 sm:opacity-35 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
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

                {/* Font Family Selector */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ui.stage4.typographyLabel}</span>
                    </span>
                  </div>
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
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {fontMeta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Page Density / Fit Controls */}
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

              {/* Section Ordering & Visibility */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2" title={guides.sectionOrderInstruction}>
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {ui.stage4.sectionsTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={resetSectionOrder}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors shrink-0"
                    title={ui.stage4.resetOrderTitle}
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
                          <div className="flex items-center gap-1 sm:opacity-35 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 0}
                              aria-label={`${ui.stage3.moveUp}: ${sectionLabel}`}
                              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                              title={`${ui.stage3.moveUp}: ${sectionLabel}`}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === sectionOrder.length - 1}
                              aria-label={`${ui.stage3.moveDown}: ${sectionLabel}`}
                              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                              title={`${ui.stage3.moveDown}: ${sectionLabel}`}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(sectionKey)}
                            aria-label={`${isVisible ? ui.stage4.hideSectionTitle : ui.stage4.showSectionTitle}: ${sectionLabel}`}
                            aria-pressed={isVisible}
                            className={`p-1 rounded hover:bg-slate-100 transition-opacity ${
                              isVisible
                                ? 'text-slate-700 hover:text-slate-950 sm:opacity-45 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
                                : 'text-amber-600 hover:text-amber-800 opacity-100'
                            }`}
                            title={isVisible ? ui.stage4.hideSectionTitle : ui.stage4.showSectionTitle}
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
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
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

              {/* Clean Next Step Action: Cover Letter */}
              {onOpenCoverLetter && (
                <div
                  title={ui.stage4.coverCtaSubtitle}
                  className="px-4 sm:px-5 py-3 bg-slate-50/70 flex items-center justify-between gap-3 rounded-b-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {ui.stage4.coverCtaTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCoverLetter}
                    title={ui.stage4.coverCtaSubtitle}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>{ui.stage4.coverCtaBtn}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. FIXED STEP FOOTER */}
      <div className="shrink-0 z-20 bg-white border-t border-slate-200 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{ui.footer.prev}</span>
        </button>

        <span className="text-[11px] font-mono tabular-nums text-slate-500 hidden sm:inline">
          {ui.footer.stepOf
            .replace('{current}', String(currentStepIndex + 1))
            .replace('{total}', String(STEPS.length))}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span>{ui.footer.nextPrefix} {STEPS[currentStepIndex + 1].shortLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveProgress}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>{ui.footer.finishSave}</span>
            </button>
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
