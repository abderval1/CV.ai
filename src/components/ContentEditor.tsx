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
  LayoutTemplate
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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

const CEFR_LEVELS = [
  'Nativo / Materno',
  'C2 - Fluência Plena',
  'C1 - Avançado Profissional',
  'B2 - Intermédio Independente',
  'B1 - Intermédio Básico'
];

const ACCENT_PALETTE = [
  { name: 'Grafite Executivo', hex: '#0f172a' },
  { name: 'Azul Corporativo', hex: '#1e3a8a' },
  { name: 'Azul Europeu', hex: '#1d4ed8' },
  { name: 'Verde Esmeralda', hex: '#065f46' },
  { name: 'Púrpura Criativo', hex: '#7c3aed' },
  { name: 'Harvard Burgundy', hex: '#831843' },
  { name: 'Teal Corporativo', hex: '#0f766e' }
];

const FONT_OPTIONS: Array<{
  id: CVData['fontFamily'] | 'default';
  label: string;
  hint: string;
}> = [
  { id: 'default', label: 'Padrão do Modelo', hint: 'Automático' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', hint: 'Moderna' },
  { id: 'garamond', label: 'EB Garamond', hint: 'Editorial' },
  { id: 'cinzel', label: 'Cinzel Clássico', hint: 'Executiva' },
  { id: 'mono', label: 'IBM Plex Mono', hint: 'Técnica / ATS' }
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
  onDensityChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [credentialsTab, setCredentialsTab] = useState<'academic' | 'skills'>('academic');
  const [showWebsiteField, setShowWebsiteField] = useState<boolean>(
    Boolean(cv.personalDetails.website?.trim())
  );
  const [donorFieldsOpen, setDonorFieldsOpen] = useState<Record<number, boolean>>({});
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [collapsedExps, setCollapsedExps] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snippets, setSnippets] = useState<ProfessionSnippetExample[]>(() => getStoredSnippetsSync());
  const [showSnippetPicker, setShowSnippetPicker] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [verbPickerExpIdx, setVerbPickerExpIdx] = useState<number | null>(null);
  const [showClusterPicker, setShowClusterPicker] = useState<boolean>(false);
  const [newTrainingDraft, setNewTrainingDraft] = useState<string>('');

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

  // Live readiness metrics
  const cvMetrics = useMemo(() => calculateCVMetrics(cv), [cv]);
  const completedCriteria = cvMetrics.completenessChecklist.filter((c) => c.completed).length;

  const experienceMetricsSummary = useMemo(() => {
    let totalBullets = 0;
    let quantifiedBullets = 0;
    cv.experiences.forEach((exp) => {
      (exp.highlights || []).forEach((h) => {
        if (h.trim()) {
          totalBullets += 1;
          if (METRIC_REGEX.test(h)) quantifiedBullets += 1;
        }
      });
    });
    return { totalBullets, quantifiedBullets };
  }, [cv.experiences]);

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
    showSuccess('Exemplo Aplicado', `Título e resumo preenchidos com o modelo "${snip.profession}".`);
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
              company: 'Empresa de Referência',
              role: snip.sampleTitle || snip.profession,
              period: '2022 – Presente',
              location: 'Lisboa / Remoto',
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
    showSuccess('Conquistas Inseridas', `Realizações de "${snip.profession}" adicionadas ao cargo.`);
  };

  const handleSaveProgress = async () => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal(
          'Crie uma conta gratuita ou inicie sessão para guardar o seu currículo e progresso na nuvem.'
        );
      }
      return;
    }

    if (!hasActivePlan) {
      if (onOpenPricingModal) {
        onOpenPricingModal(
          'A gravação de currículos na nuvem e edição avançada requer um plano Pro ou Executivo VIP ativo.'
        );
      } else {
        showError('Plano Requerido', 'A gravação e personalização do currículo requer um plano pago ativo.');
      }
      return;
    }

    try {
      setIsSaving(true);
      const name = cv.personalDetails.name?.trim();
      const role = cv.personalDetails.title?.trim() || 'Currículo';
      const title = name ? `${name} - ${role}` : 'Meu Currículo Executivo';
      await saveCurrentResume(cv, title, cv.personalDetails.title);
      showSuccess(
        'Progresso Salvo!',
        `Currículo guardado na nuvem (${cv.experiences.length} cargos, ${cv.competencies.length} competências).`
      );
    } catch (err: any) {
      console.error('Erro ao guardar progresso:', err);
      const rawMsg = String(err?.message || '');
      const friendlyDetail = rawMsg.includes('permission')
        ? 'Sem permissão na nuvem para guardar esta versão. Verifique a sua sessão.'
        : 'Não foi possível guardar a nova versão do currículo no momento.';
      showError('Erro ao Salvar', friendlyDetail);
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
    showSuccess('Ordem Restaurada', 'Secções repostas na ordem executiva recomendada.');
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
      period: '2022 – Presente',
      location: '',
      donor: '',
      highlights: ['']
    };
    commitChange({ ...cv, experiences: [newExp, ...cv.experiences] }, true);
    setCollapsedExps((prev) => ({ ...prev, 0: false }));
  };

  const handleDuplicateExperience = (index: number) => {
    const src = cv.experiences[index];
    if (!src) return;
    const copy: Experience = {
      ...src,
      id: `exp-${Date.now()}`,
      role: `${src.role || 'Cargo'} (Cópia)`,
      highlights: [...src.highlights]
    };
    const next = [...cv.experiences];
    next.splice(index + 1, 0, copy);
    commitChange({ ...cv, experiences: next }, true);
    showSuccess('Cargo Duplicado', 'Pode editar o novo item logo abaixo.');
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

  const areAllExpsCollapsed =
    cv.experiences.length > 0 && cv.experiences.every((_, i) => Boolean(collapsedExps[i]));

  const toggleAllExps = () => {
    const nextState: Record<number, boolean> = {};
    cv.experiences.forEach((_, i) => {
      nextState[i] = !areAllExpsCollapsed;
    });
    setCollapsedExps(nextState);
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
        trainings: [...cv.trainings, text || 'Certificação Profissional (Ex: PMP, Scrum, AWS)']
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
      showSuccess('Competências Já Presentes', `O pacote "${clusterTitle}" já está incluído.`);
      return;
    }

    commitChange({ ...cv, competencies: [...cv.competencies, ...toAdd] }, true);
    setShowClusterPicker(false);
    showSuccess('Pacote Adicionado', `${toAdd.length} grupo(s) de "${clusterTitle}" adicionados.`);
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
      language: 'Inglês',
      level: 'C1 - Avançado Profissional'
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
      mobileLabel: 'Perfil',
      shortLabel: 'Perfil & Resumo',
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
      mobileLabel: 'Cargos',
      shortLabel: 'Experiência',
      isCompleted: cv.experiences.length > 0
    },
    {
      id: 'credentials',
      mobileLabel: 'Skills',
      shortLabel: 'Formação & Skills',
      isCompleted: cv.educations.length > 0 && cv.competencies.length > 0
    },
    {
      id: 'structure',
      mobileLabel: 'Estrutura',
      shortLabel: 'Estrutura',
      isCompleted: true
    }
  ];

  const currentStep = STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);
  const summaryWordCount = cv.summary ? cv.summary.trim().split(/\s+/).filter(Boolean).length : 0;

  const jumpToDiagnosticTarget = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('pessoais') || lower.includes('resumo')) {
      setCurrentStepIndex(0);
    } else if (lower.includes('experiência') || lower.includes('métricas')) {
      setCurrentStepIndex(1);
    } else if (lower.includes('competências') || lower.includes('idiomas')) {
      setCurrentStepIndex(2);
      setCredentialsTab('skills');
    } else if (lower.includes('formação')) {
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
                  className={`flex items-center justify-center gap-1.5 px-1.5 sm:px-2.5 py-2.5 text-[11px] sm:text-xs transition-colors border-b-2 whitespace-nowrap min-w-0 ${
                    isActive
                      ? 'bg-white border-slate-900 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-medium'
                  }`}
                >
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
                  <span className="truncate sm:hidden">{step.mobileLabel}</span>
                  <span className="truncate hidden sm:inline">{step.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Undo / Redo & Save Action Cluster */}
          <div className="flex items-center gap-1 px-2 sm:px-3 border-l border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none transition-colors"
              title="Desfazer última alteração (Ctrl+Z)"
              aria-label="Desfazer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 disabled:pointer-events-none transition-colors"
              title="Refazer alteração (Ctrl+Y)"
              aria-label="Refazer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="ml-0.5 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
              title="Guardar currículo na nuvem"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'A guardar...' : 'Salvar'}</span>
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

        {/* Live Document Readiness Telemetry Strip */}
        <div className="px-3.5 sm:px-5 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-slate-600 font-mono tabular-nums truncate">
            <span
              className={`font-bold ${
                cvMetrics.strengthScore >= 85
                  ? 'text-emerald-700'
                  : cvMetrics.strengthScore >= 60
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              ATS {cvMetrics.strengthScore}%
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{cvMetrics.totalWords} palavras</span>
            <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
            <span className="hidden sm:inline">~{cvMetrics.estimatedPages} pág A4</span>
            <span aria-hidden="true" className="text-slate-300 hidden md:inline">·</span>
            <span className="hidden md:inline">Leitura {cvMetrics.readingTimeFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>
              Checklist ({completedCriteria}/{cvMetrics.completenessChecklist.length})
            </span>
            {showDiagnostics ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible Live ATS Checklist Drawer */}
        {showDiagnostics && (
          <div className="px-3.5 sm:px-5 py-3 bg-white border-t border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {cvMetrics.completenessChecklist.map((item) => (
              <div
                key={item.label}
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
                      {item.label}
                    </p>
                    {!item.completed && (
                      <p className="text-[11px] text-slate-500 leading-snug">{item.recommendation}</p>
                    )}
                  </div>
                </div>
                {!item.completed && (
                  <button
                    type="button"
                    onClick={() => jumpToDiagnosticTarget(item.label)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0"
                  >
                    Completar
                  </button>
                )}
              </div>
            ))}
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
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Identificação &amp; Contactos
                  </h3>
                  <ExpertTip
                    title="Cabeçalho & Contactos ATS"
                    tip="Mantenha os contactos limpos, sem ícones gráficos no texto, e garanta consistência com o LinkedIn."
                  />
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
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      {cv.personalDetails.showPhoto !== false ? 'Ocultar foto' : 'Mostrar foto'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
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
                    <span>{cv.personalDetails.photoUrl ? 'Foto' : 'Adicionar Foto'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
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
                    placeholder="Ex: João da Silva Santos"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Título Profissional <span className="text-rose-500">*</span>
                    </label>
                    <ExpertTip
                      compact
                      align="right"
                      title="Título Profissional (Headline)"
                      tip="Espelhe exatamente o título da vaga pretendida para maximizar a relevância nos robôs ATS."
                      example="Chief Operating Officer (COO) | Operações & P&L"
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
                    placeholder="Ex: Diretor de Operações / Head de Produto"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      E-mail Profissional <span className="text-rose-500">*</span>
                    </label>
                    {!isEmailValid && (
                      <span className="text-[10px] font-medium text-rose-600">Formato inválido</span>
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
                    placeholder="Ex: joao.silva@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Telefone / WhatsApp <span className="text-rose-500">*</span>
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
                    placeholder="Ex: +351 912 345 678"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Localização (Cidade, País)
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
                    placeholder="Ex: Lisboa, Portugal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    LinkedIn
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
                    placeholder="Ex: linkedin.com/in/joaosilva"
                  />
                </div>

                {showWebsiteField || cv.personalDetails.website ? (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Portfólio ou Website
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
                      placeholder="Ex: joaosantos.com ou github.com/joaosantos"
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
                      <span>Adicionar Portfólio ou Website (Opcional)</span>
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
                    Resumo Executivo
                  </h3>
                  <ExpertTip
                    title="Sumário de Alto Impacto"
                    tip="Escreva 3 a 5 linhas (50–120 palavras) com anos de experiência, especialidade e 1 a 2 resultados mensuráveis."
                    example="Diretor de Operações com 12+ anos em logística. Reduziu custos operacionais em 28% via Lean Six Sigma."
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {snippets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSnippetPicker((prev) => !prev)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Exemplos ({snippets.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenAiTailor}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Otimizar com IA</span>
                  </button>
                </div>
              </div>

              {showSnippetPicker && snippets.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Biblioteca de Exemplos por Profissão
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSnippetPicker(false)}
                      className="text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Fechar
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
                          Usar Título &amp; Resumo
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
                placeholder="Ex: Profissional com 10+ anos em gestão de operações e transformação digital..."
              />

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-mono tabular-nums">
                  {summaryWordCount} {summaryWordCount === 1 ? 'palavra' : 'palavras'} ·{' '}
                  {cv.summary?.length || 0} caracteres
                </span>
                <span
                  className={
                    summaryWordCount >= 40 && summaryWordCount <= 130
                      ? 'text-emerald-700 font-medium'
                      : summaryWordCount > 130
                      ? 'text-amber-700 font-medium'
                      : ''
                  }
                >
                  {summaryWordCount >= 40 && summaryWordCount <= 130
                    ? 'Extensão ideal para leitura e ATS'
                    : summaryWordCount > 130
                    ? 'Tente sintetizar abaixo de 130 palavras'
                    : 'Recomendado: 50 a 120 palavras com métricas'}
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
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="w-4 h-4 text-slate-700 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                    Experiência Profissional ({cv.experiences.length})
                  </h3>
                  <ExpertTip
                    title="Ordem Cronológica Reversa"
                    tip="Liste os cargos do mais recente para o mais antigo e priorize realizações com métricas (Google XYZ)."
                  />
                </div>
                {cv.experiences.length > 0 && (
                  <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                    {experienceMetricsSummary.totalBullets} realizações ·{' '}
                    <span
                      className={
                        experienceMetricsSummary.quantifiedBullets >= 2
                          ? 'text-emerald-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      {experienceMetricsSummary.quantifiedBullets} com métricas numéricas
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {snippets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSnippetPicker((prev) => !prev)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Modelos de Conquistas</span>
                    <span className="sm:hidden">Modelos</span>
                  </button>
                )}
                {cv.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={toggleAllExps}
                    className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors hidden sm:inline-flex"
                  >
                    {areAllExpsCollapsed ? 'Expandir todos' : 'Recolher todos'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Cargo</span>
                </button>
              </div>
            </div>

            {showSnippetPicker && snippets.length > 0 && (
              <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Inserir Realizações Prontas por Profissão
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSnippetPicker(false)}
                    className="text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Fechar
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
                      + {snip.profession} ({snip.sampleBullets.length} métricas)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cv.experiences.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Nenhum cargo registado</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione as suas posições mais relevantes dos últimos 10–15 anos.
                </p>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  + Adicionar Primeiro Cargo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {cv.experiences.map((exp, expIdx) => {
                  const isCollapsed = !!collapsedExps[expIdx];
                  const showDonor = Boolean(exp.donor?.trim()) || Boolean(donorFieldsOpen[expIdx]);
                  const expMetricCount = (exp.highlights || []).filter((h) => METRIC_REGEX.test(h)).length;

                  return (
                    <div key={exp.id || expIdx}>
                      {/* Accordion Header */}
                      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleExpCollapse(expIdx)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono tabular-nums font-bold shrink-0">
                            {expIdx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs">
                              <span className="font-bold text-slate-900">
                                {exp.role || 'Novo Cargo'}
                              </span>
                              <span className="text-slate-400 mx-1.5">·</span>
                              <span className="text-slate-600 font-medium">
                                {exp.company || 'Empresa'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-2 mt-0.5">
                              {exp.period && <span>{exp.period}</span>}
                              {exp.period && <span aria-hidden="true">·</span>}
                              <span>{exp.highlights.length} pontos</span>
                              {expMetricCount > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 font-medium">
                                    {expMetricCount} métrica(s)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExperience(expIdx, 'up')}
                            disabled={expIdx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded-md hover:bg-slate-100 transition-colors"
                            title="Mover cargo para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExperience(expIdx, 'down')}
                            disabled={expIdx === cv.experiences.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded-md hover:bg-slate-100 transition-colors"
                            title="Mover cargo para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateExperience(expIdx)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
                            title="Duplicar cargo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpCollapse(expIdx)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
                            title={isCollapsed ? 'Expandir' : 'Recolher'}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(expIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Remover cargo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Body */}
                      {!isCollapsed && (
                        <div className="px-4 sm:px-5 pb-4 pt-3 bg-slate-50/40 space-y-3.5 border-t border-slate-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Cargo
                              </label>
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, role: e.target.value })
                                }
                                placeholder="Ex: Diretor de Operações"
                                className={`${INPUT_CLASS} font-semibold`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Empresa / Instituição
                              </label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, company: e.target.value })
                                }
                                placeholder="Ex: Global Tech Corp"
                                className={`${INPUT_CLASS} font-medium`}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Período
                              </label>
                              <input
                                type="text"
                                value={exp.period}
                                onChange={(e) =>
                                  handleUpdateExperience(expIdx, { ...exp, period: e.target.value })
                                }
                                placeholder="Ex: 2021 – Presente"
                                className={INPUT_CLASS}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Localização
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
                                placeholder="Ex: Lisboa, Portugal / Remoto"
                                className={INPUT_CLASS}
                              />
                            </div>

                            {showDonor ? (
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Projeto ou Financiador (Opcional)
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
                                  placeholder="Ex: Financiado por Banco Mundial / Programa UE"
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
                                  <span>Adicionar Projeto / Financiador</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Highlights / Google XYZ Bullets */}
                          <div className="space-y-2 pt-2 border-t border-slate-200/60">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                  Realizações &amp; Métricas
                                </label>
                                <ExpertTip
                                  compact
                                  title="Fórmula Google XYZ"
                                  tip="Estruture como: 'Alcancei [X], medido por [Y], através de [Z]'. Use verbos de ação e números."
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVerbPickerExpIdx((prev) => (prev === expIdx ? null : expIdx))
                                  }
                                  className="text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Verbos de Ação</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddHighlight(expIdx)}
                                  className="text-xs text-slate-800 hover:text-slate-950 font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar Ponto</span>
                                </button>
                              </div>
                            </div>

                            {/* Action Verbs Drawer */}
                            {verbPickerExpIdx === expIdx && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-800 uppercase tracking-wider">
                                    Inserir Verbo Executivo de Impacto
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setVerbPickerExpIdx(null)}
                                    className="text-slate-500 hover:text-slate-900 font-medium"
                                  >
                                    Fechar
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
                                  <div key={hIdx} className="flex items-start gap-1.5">
                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveHighlight(expIdx, hIdx, 'up')}
                                        disabled={hIdx === 0}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                        title="Mover ponto para cima"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveHighlight(expIdx, hIdx, 'down')}
                                        disabled={hIdx === exp.highlights.length - 1}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                        title="Mover ponto para baixo"
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
                                        placeholder="Ex: Reduziu custos operacionais em 24% ao automatizar fluxos de triagem..."
                                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 resize-none"
                                      />
                                      {h.trim().length > 12 && (
                                        <div className="text-[10px] font-medium flex items-center justify-between px-0.5">
                                          <span
                                            className={
                                              hasMetric ? 'text-emerald-700' : 'text-amber-700'
                                            }
                                          >
                                            {hasMetric
                                              ? 'Contém métrica quantificável'
                                              : 'Dica: adicione %, $, horas ou nº de equipa'}
                                          </span>
                                          <span className="font-mono tabular-nums text-slate-400">
                                            {h.trim().length} car.
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-1 shrink-0"
                                      title="Remover realização"
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
                <span>Formação &amp; Cursos ({cv.educations.length + cv.trainings.length})</span>
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
                <span>Skills &amp; Idiomas ({cv.competencies.length + cv.languages.length})</span>
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
                        Formação Académica ({cv.educations.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {cv.educations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      Nenhuma formação académica adicionada.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.educations.map((edu, eduIdx) => (
                        <div key={edu.id || eduIdx} className="py-3 first:pt-1 last:pb-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Grau / Curso
                                </label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) =>
                                    handleUpdateEducation(eduIdx, { ...edu, degree: e.target.value })
                                  }
                                  placeholder="Ex: MBA / Mestrado em Gestão"
                                  className={`${INPUT_CLASS} font-semibold`}
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Instituição
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
                                  placeholder="Ex: Universidade Católica"
                                  className={INPUT_CLASS}
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Período
                                </label>
                                <input
                                  type="text"
                                  value={edu.period}
                                  onChange={(e) =>
                                    handleUpdateEducation(eduIdx, { ...edu, period: e.target.value })
                                  }
                                  placeholder="Ex: 2016 – 2020"
                                  className={INPUT_CLASS}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 mt-5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveEducation(eduIdx, 'up')}
                                disabled={eduIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveEducation(eduIdx, 'down')}
                                disabled={eduIdx === cv.educations.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEducation(eduIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                title="Remover formação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={edu.gpaOrHonors || ''}
                            onChange={(e) =>
                              handleUpdateEducation(eduIdx, {
                                ...edu,
                                gpaOrHonors: e.target.value
                              })
                            }
                            placeholder="Distinção, Média ou Tese (Opcional — ex: Cum Laude · Média 18/20)"
                            className="w-full text-[11px] px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-600"
                          />
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
                        Certificações &amp; Cursos ({cv.trainings.length})
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
                      placeholder="Escreva uma certificação e prima Enter (Ex: PMP®, AWS Solutions Architect)..."
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTraining()}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {cv.trainings.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Nenhuma certificação adicionada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cv.trainings.map((tItem, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tItem}
                            onChange={(e) => handleUpdateTraining(tIdx, e.target.value)}
                            placeholder="Ex: PMP® - Project Management Professional"
                            className={`${INPUT_CLASS} font-medium`}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteTraining(tIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0"
                            title="Remover curso"
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
                        Competências-Chave ({cv.competencies.length})
                      </h3>
                      <ExpertTip
                        title="Palavras-Chave ATS"
                        tip="Espelhe as competências técnicas e ferramentas exactas pedidas na vaga."
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowClusterPicker((prev) => !prev)}
                        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pacotes por Área</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCompetency}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Competency Clusters Picker */}
                  {showClusterPicker && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 uppercase tracking-wider">
                          Inserir Grupos de Competências por Área
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowClusterPicker(false)}
                          className="text-slate-500 hover:text-slate-900 font-medium"
                        >
                          Fechar
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
                      Nenhuma competência adicionada.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.competencies.map((comp, compIdx) => (
                        <div key={comp.id || compIdx} className="py-3 first:pt-1 last:pb-0 space-y-2">
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
                              placeholder="Categoria (Ex: Liderança & Governança)"
                              className={`${INPUT_CLASS} font-bold`}
                            />
                            <button
                              type="button"
                              onClick={() => handleMoveCompetency(compIdx, 'up')}
                              disabled={compIdx === 0}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded shrink-0"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCompetency(compIdx, 'down')}
                              disabled={compIdx === cv.competencies.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-25 rounded shrink-0"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCompetency(compIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0"
                              title="Remover competência"
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
                            placeholder="Palavras-chave separadas por vírgula (Ex: OKRs, P&L, SAP, Power BI...)"
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
                        Idiomas &amp; Proficiência ({cv.languages.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Idioma</span>
                    </button>
                  </div>

                  {cv.languages.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum idioma adicionado.</p>
                  ) : (
                    <div className="space-y-2">
                      {cv.languages.map((lang, langIdx) => (
                        <div key={langIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lang.language}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, language: e.target.value })
                            }
                            placeholder="Ex: Inglês"
                            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-32 sm:w-40 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10"
                          />

                          <select
                            value={lang.level}
                            onChange={(e) =>
                              handleUpdateLanguage(langIdx, { ...lang, level: e.target.value })
                            }
                            className={`flex-1 ${INPUT_CLASS}`}
                          >
                            {CEFR_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteLanguage(langIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0"
                            title="Remover idioma"
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
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Modelo, Tipografia &amp; Cor
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
                  <span className="text-xs font-medium text-slate-600">Cor de destaque:</span>
                  <div className="flex items-center gap-2">
                    {ACCENT_PALETTE.map((c) => {
                      const isSelected = (cv.accentColor || '#0f172a') === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => commitChange({ ...cv, accentColor: c.hex }, true)}
                          aria-label={`Selecionar cor de destaque ${c.name}`}
                          aria-pressed={isSelected}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
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
                      <span>Tipografia do Documento (A4 &amp; Word):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {FONT_OPTIONS.map((font) => {
                      const activeFont = cv.fontFamily || 'default';
                      const isSelected = activeFont === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() =>
                            commitChange(
                              {
                                ...cv,
                                fontFamily: font.id === 'default' ? undefined : font.id
                              },
                              true
                            )
                          }
                          className={`px-2 py-2 rounded-lg border text-left transition-colors ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{font.label}</div>
                          <div
                            className={`text-[10px] ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {font.hint}
                          </div>
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
                      <span>Densidade de Espaçamento:</span>
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px]">
                      {(
                        [
                          { id: 'compact', label: '1 Pág Compacto' },
                          { id: 'normal', label: 'Padrão' },
                          { id: 'relaxed', label: 'Confortável' }
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onDensityChange(opt.id)}
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
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Ordem &amp; Visibilidade das Secções
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {sectionOrder.length} secções
                    </span>
                    <button
                      type="button"
                      onClick={resetSectionOrder}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      title="Repor ordem executiva recomendada"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Repor</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {sectionOrder.map((sectionKey, index) => {
                    const meta = SECTION_METADATA[sectionKey];
                    const isVisible = cv.sectionVisibility?.[sectionKey] !== false;

                    return (
                      <div
                        key={sectionKey}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/70 transition-colors text-xs"
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
                            {meta?.name || sectionKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            aria-label={`Mover secção ${meta?.name || sectionKey} para cima`}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sectionOrder.length - 1}
                            aria-label={`Mover secção ${meta?.name || sectionKey} para baixo`}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(sectionKey)}
                            aria-label={`${isVisible ? 'Ocultar' : 'Exibir'} secção ${meta?.name || sectionKey}`}
                            aria-pressed={isVisible}
                            className={`p-1 rounded hover:bg-slate-100 ${
                              isVisible
                                ? 'text-slate-700 hover:text-slate-950'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={isVisible ? 'Ocultar do documento' : 'Exibir no documento'}
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

              {/* References */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Referências ({cv.references.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddReference}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {cv.references.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Opcional — adicione apenas se a vaga solicitar referências diretas.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cv.references.map((ref, refIdx) => (
                      <div key={ref.id || refIdx} className="py-2.5 first:pt-1 last:pb-0 flex items-start gap-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <input
                            type="text"
                            value={ref.name}
                            onChange={(e) =>
                              handleUpdateReference(refIdx, { ...ref, name: e.target.value })
                            }
                            placeholder="Nome"
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
                            placeholder="Empresa / Cargo"
                            className={INPUT_CLASS}
                          />
                          <input
                            type="text"
                            value={ref.contact}
                            onChange={(e) =>
                              handleUpdateReference(refIdx, { ...ref, contact: e.target.value })
                            }
                            placeholder="E-mail ou Telefone"
                            className={`${INPUT_CLASS} font-mono`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReference(refIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-0.5 shrink-0"
                          title="Remover referência"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clean Next Step Action: Cover Letter */}
              {onOpenCoverLetter && (
                <div className="p-4 sm:p-5 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-b-xl">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Carta de Apresentação Alinhada ao CV
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Gere e baixe a carta no mesmo padrão visual do seu currículo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCoverLetter}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Abrir Carta</span>
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
          <span>Anterior</span>
        </button>

        <span className="text-[11px] font-mono tabular-nums text-slate-500 hidden sm:inline">
          Etapa {currentStepIndex + 1} de {STEPS.length}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span>Próximo: {STEPS[currentStepIndex + 1].shortLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveProgress}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>Concluir &amp; Salvar</span>
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
