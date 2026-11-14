import React, { useState, useEffect } from 'react';
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
  Sparkles,
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
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { ExpertTip } from './ExpertTip';
import { DEFAULT_SECTION_ORDER, SECTION_METADATA } from '../utils/executivePhrasing';
import { getStoredSnippetsSync, trackFrontendTelemetry } from '../services/adminModulesService';
import { ProfessionSnippetExample } from '../types/adminModules';

interface ContentEditorProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  onOpenAiTailor: () => void;
  onOpenCoverLetter?: () => void;
  onOpenAuthModal?: (prompt?: string) => void;
  onOpenPricingModal?: (prompt?: string) => void;
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

const INPUT_CLASS =
  'w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 transition-colors';

export const ContentEditor: React.FC<ContentEditorProps> = ({
  cv,
  onChange,
  onOpenAiTailor,
  onOpenCoverLetter,
  onOpenAuthModal,
  onOpenPricingModal
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

  const handleApplySnippetSummary = (snip: ProfessionSnippetExample) => {
    onChange({
      ...cv,
      personalDetails: {
        ...cv.personalDetails,
        title: snip.sampleTitle || cv.personalDetails.title
      },
      summary: snip.sampleSummary || cv.summary
    });
    setShowSnippetPicker(false);
    showSuccess('Exemplo Aplicado', `Título e resumo preenchidos com o modelo "${snip.profession}".`);
  };

  const handleApplySnippetBullets = (snip: ProfessionSnippetExample) => {
    if (!snip.sampleBullets || snip.sampleBullets.length === 0) return;
    if (cv.experiences.length === 0) {
      onChange({
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
      });
    } else {
      const updatedExps = [...cv.experiences];
      updatedExps[0] = {
        ...updatedExps[0],
        highlights: [...snip.sampleBullets, ...updatedExps[0].highlights]
      };
      onChange({ ...cv, experiences: updatedExps });
    }
    showSuccess('Conquistas Inseridas', `Realizações de "${snip.profession}" adicionadas ao cargo.`);
  };

  const handleSaveProgress = async () => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal('Crie uma conta gratuita ou inicie sessão para guardar o seu currículo e progresso na nuvem.');
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

    onChange({
      ...cv,
      sectionOrder: newOrder
    });
  };

  const toggleSectionVisibility = (sectionKey: CVSectionKey) => {
    const current = cv.sectionVisibility?.[sectionKey] !== false;
    onChange({
      ...cv,
      sectionVisibility: {
        ...(cv.sectionVisibility || {}),
        [sectionKey]: !current
      }
    });
  };

  // Experience Handlers
  const handleUpdateExperience = (index: number, updated: Experience) => {
    const list = [...cv.experiences];
    list[index] = updated;
    onChange({ ...cv, experiences: list });
  };

  const handleAddExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      company: 'Nome da Empresa / Organização',
      role: 'Cargo Executivo ou Especialista',
      period: '2022 – Presente',
      location: 'Luanda, Angola / São Paulo, Brasil',
      donor: '',
      highlights: [
        'Liderou a reestruturação dos processos operacionais, reduzindo tempo de ciclo em 25%.',
        'Gerenciou orçamento anual de projetos e supervisionou equipas multidisciplinares.'
      ]
    };
    onChange({ ...cv, experiences: [newExp, ...cv.experiences] });
  };

  const handleDeleteExperience = (index: number) => {
    const list = cv.experiences.filter((_, i) => i !== index);
    onChange({ ...cv, experiences: list });
  };

  const handleAddHighlight = (expIndex: number) => {
    const exp = cv.experiences[expIndex];
    handleUpdateExperience(expIndex, {
      ...exp,
      highlights: [...exp.highlights, '']
    });
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
    handleUpdateExperience(expIndex, { ...exp, highlights: updatedHighlights });
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
      degree: 'Licenciatura / Bacharelado ou Mestrado',
      institution: 'Universidade de Referência',
      period: '2016 – 2020',
      gpaOrHonors: ''
    };
    onChange({ ...cv, educations: [...cv.educations, newEdu] });
  };

  const handleUpdateEducation = (index: number, updated: Education) => {
    const list = [...cv.educations];
    list[index] = updated;
    onChange({ ...cv, educations: list });
  };

  const handleDeleteEducation = (index: number) => {
    const list = cv.educations.filter((_, i) => i !== index);
    onChange({ ...cv, educations: list });
  };

  // Certification / Training Handlers
  const handleAddTraining = () => {
    onChange({
      ...cv,
      trainings: [...cv.trainings, 'Nova Certificação Profissional (Ex: PMP, Scrum, AWS, ISO)']
    });
  };

  const handleUpdateTraining = (index: number, value: string) => {
    const list = [...cv.trainings];
    list[index] = value;
    onChange({ ...cv, trainings: list });
  };

  const handleDeleteTraining = (index: number) => {
    const list = cv.trainings.filter((_, i) => i !== index);
    onChange({ ...cv, trainings: list });
  };

  // Competency Handlers
  const handleAddCompetency = () => {
    const newComp: Competency = {
      id: `comp-${Date.now()}`,
      category: 'Liderança Estratégica & Gestão',
      description: 'Definição de OKRs, gestão orçamental e liderança de equipas.'
    };
    onChange({ ...cv, competencies: [...cv.competencies, newComp] });
  };

  const handleUpdateCompetency = (index: number, updated: Competency) => {
    const list = [...cv.competencies];
    list[index] = updated;
    onChange({ ...cv, competencies: list });
  };

  const handleDeleteCompetency = (index: number) => {
    const list = cv.competencies.filter((_, i) => i !== index);
    onChange({ ...cv, competencies: list });
  };

  // Language Handlers
  const handleAddLanguage = () => {
    const newLang: LanguageItem = {
      language: 'Inglês',
      level: 'C1 - Avançado Profissional'
    };
    onChange({ ...cv, languages: [...cv.languages, newLang] });
  };

  const handleUpdateLanguage = (index: number, updated: LanguageItem) => {
    const list = [...cv.languages];
    list[index] = updated;
    onChange({ ...cv, languages: list });
  };

  const handleDeleteLanguage = (index: number) => {
    const list = cv.languages.filter((_, i) => i !== index);
    onChange({ ...cv, languages: list });
  };

  // Reference Handlers
  const handleAddReference = () => {
    const newRef: Reference = {
      id: `ref-${Date.now()}`,
      name: 'Nome da Referência Profissional',
      institutionAndPosition: 'Empresa / Cargo Executivo',
      contact: 'contacto@empresa.com | +244 923 000 000'
    };
    onChange({ ...cv, references: [...cv.references, newRef] });
  };

  const handleUpdateReference = (index: number, updated: Reference) => {
    const list = [...cv.references];
    list[index] = updated;
    onChange({ ...cv, references: list });
  };

  const handleDeleteReference = (index: number) => {
    const list = cv.references.filter((_, i) => i !== index);
    onChange({ ...cv, references: list });
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

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-slate-50/70">
      {/* 1. SINGLE STREAMLINED STEPPER + SAVE BAR */}
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

          <div className="flex items-center px-2 sm:px-3 border-l border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
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

        <div className="w-full h-0.5 bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. SCROLLABLE STEP CONTENT AREA */}
      <div className="p-3.5 sm:p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {/* ========================================================================= */}
        {/* STAGE 1: PERFIL, CONTACTOS & RESUMO EXECUTIVO */}
        {/* ========================================================================= */}
        {currentStep.id === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 animate-in fade-in duration-150">
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
                        onChange({
                          ...cv,
                          personalDetails: {
                            ...cv.personalDetails,
                            showPhoto: cv.personalDetails.showPhoto === false ? true : false
                          }
                        })
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
                      onChange({
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
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.target.value }
                      })
                    }
                    className={`${INPUT_CLASS} font-medium`}
                    placeholder="Ex: Diretor de Operações / Head de Produto"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    E-mail Profissional <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={cv.personalDetails.email}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, email: e.target.value }
                      })
                    }
                    className={INPUT_CLASS}
                    placeholder="Ex: joao.santos@exemplo.com"
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
                      onChange({
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
                      onChange({
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
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, linkedin: e.target.value }
                      })
                    }
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
                        onChange({
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
                  <Wand2 className="w-4 h-4 text-indigo-600" />
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
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
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
                onChange={(e) => onChange({ ...cv, summary: e.target.value })}
                className="w-full text-xs leading-relaxed p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 transition-colors text-slate-800"
                placeholder="Ex: Profissional com 10+ anos em gestão de operações e transformação digital..."
              />

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-mono tabular-nums">
                  {summaryWordCount} {summaryWordCount === 1 ? 'palavra' : 'palavras'}
                </span>
                <span className={cv.summary.length >= 80 ? 'text-emerald-700 font-medium' : ''}>
                  {cv.summary.length >= 80
                    ? 'Extensão ideal para leitura e ATS'
                    : 'Recomendado: 3 a 5 linhas com foco em resultados'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: EXPERIÊNCIA PROFISSIONAL */}
        {/* ========================================================================= */}
        {currentStep.id === 'career' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
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

              <div className="flex items-center gap-1.5 shrink-0">
                {snippets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSnippetPicker((prev) => !prev)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Modelos de Conquistas</span>
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

                  return (
                    <div key={exp.id || expIdx}>
                      {/* Accordion Header */}
                      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleExpCollapse(expIdx)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
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
                          </div>
                          {exp.period && (
                            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline shrink-0">
                              {exp.period}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-0.5 shrink-0">
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
                            <div className="flex items-center justify-between gap-2">
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
                              <button
                                type="button"
                                onClick={() => handleAddHighlight(expIdx)}
                                className="text-xs text-slate-700 hover:text-slate-950 font-semibold flex items-center gap-1 whitespace-nowrap"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Ponto</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {exp.highlights.map((h, hIdx) => (
                                <div key={hIdx} className="flex items-start gap-2">
                                  <span className="text-slate-400 font-bold mt-2 text-xs select-none">
                                    •
                                  </span>
                                  <textarea
                                    rows={2}
                                    value={h}
                                    onChange={(e) =>
                                      handleUpdateHighlight(expIdx, hIdx, e.target.value)
                                    }
                                    placeholder="Ex: Reduziu custos em 24% ao automatizar fluxos..."
                                    className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 resize-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-1"
                                    title="Remover realização"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
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
            {/* Sub-Group Switcher (Splits 4 long sections into 2 focused panels) */}
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
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skills &amp; Idiomas ({cv.competencies.length + cv.languages.length})</span>
              </button>
            </div>

            {credentialsTab === 'academic' ? (
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
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
                        <div key={edu.id || eduIdx} className="py-3 first:pt-1 last:pb-0 flex items-start gap-2">
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
                                placeholder="Ex: MBA / Mestrado"
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

                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(eduIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-5 shrink-0"
                            title="Remover formação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

                    <button
                      type="button"
                      onClick={handleAddTraining}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Curso</span>
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
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {/* Competencies */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Competências-Chave ({cv.competencies.length})
                      </h3>
                      <ExpertTip
                        title="Palavras-Chave ATS"
                        tip="Espelhe as competências técnicas e ferramentas exactas pedidas na vaga."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCompetency}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {cv.competencies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      Nenhuma competência adicionada.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cv.competencies.map((comp, compIdx) => (
                        <div key={comp.id || compIdx} className="py-3 first:pt-1 last:pb-0 space-y-2">
                          <div className="flex items-center gap-2">
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
        {/* STAGE 4: ESTRUTURA, ESTILO & FINALIZAÇÃO */}
        {/* ========================================================================= */}
        {currentStep.id === 'structure' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {/* Visual Style & Template Picker */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Modelo &amp; Cor de Destaque
                    </h3>
                  </div>
                  <TemplateSelectorDropdown
                    currentStyle={cv.templateStyle}
                    onSelectStyle={(newStyle) => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: newStyle });
                      onChange({ ...cv, templateStyle: newStyle });
                    }}
                    onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-slate-500">Cor de destaque do documento:</span>
                  <div className="flex items-center gap-2">
                    {ACCENT_PALETTE.map((c) => {
                      const isSelected = (cv.accentColor || '#0f172a') === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => onChange({ ...cv, accentColor: c.hex })}
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
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {sectionOrder.length} secções
                  </span>
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
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sectionOrder.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded hover:bg-slate-100"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(sectionKey)}
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
                <div className="p-4 sm:p-5 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-b-2xl">
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
        onSelectTemplate={(s) => onChange({ ...cv, templateStyle: s })}
        cv={cv}
        onUpdateCV={onChange}
        onOpenPricingModal={onOpenPricingModal}
      />

      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        cv={cv}
        onChange={onChange}
      />
    </div>
  );
};
