import React, { useState, useRef, useMemo } from 'react';
import {
  CVData,
  Experience,
  Competency,
  Education,
  Reference,
  TemplateStyle,
  CVSectionKey
} from '../types/cv';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Camera,
  HelpCircle,
  Upload,
  Check,
  Globe,
  ArrowUp,
  ArrowDown,
  Copy,
  Wand2,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  Sliders,
  Zap,
  Target,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  User,
  ExternalLink,
  BookOpen,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GENERIC_DEFAULT_CV, AGOSTINHO_CV, BLANK_CV } from '../data/initialCV';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { getTemplateById } from '../data/templateCatalog';
import {
  calculateCVMetrics,
  DEFAULT_SECTION_ORDER,
  SECTION_METADATA,
  EXECUTIVE_ACTION_VERBS,
  POPULAR_COMPETENCY_CLUSTERS
} from '../utils/executivePhrasing';

interface ContentEditorProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  onOpenAiTailor: () => void;
}

type EditorSubTab = 'personal' | 'career' | 'education' | 'skills' | 'structure';

const COMMON_DEGREES = [
  'Licenciatura',
  'Mestrado (MSc)',
  'MBA Executivo',
  'Pós-Graduação',
  'Doutoramento (PhD)',
  'Bacharelado',
  'Ensino Secundário'
];

const COMMON_CERTIFICATIONS = [
  'PMP® - Project Management Professional (PMI)',
  'Scrum Master Certified (PSM I / CSM)',
  'AWS Certified Solutions Architect',
  'CFA® Chartered Financial Analyst',
  'ITIL® 4 Foundation / Specialist',
  'ISO 9001 / ISO 27001 Lead Auditor',
  'Microsoft Certified: Power BI Data Analyst',
  'Lean Six Sigma Green / Black Belt',
  'CPA / Ordem dos Contabilistas e Peritos'
];

const CEFR_LEVELS = [
  'Nativo / Materno',
  'C2 - Fluência Plena',
  'C1 - Avançado Profissional',
  'B2 - Intermédio Independente',
  'B1 - Intermédio Básico'
];

export const ContentEditor: React.FC<ContentEditorProps> = ({
  cv,
  onChange,
  onOpenAiTailor
}) => {
  const [activeTab, setActiveTab] = useState<EditorSubTab>('personal');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [showChecklistDrawer, setShowChecklistDrawer] = useState<boolean>(false);
  const [verbMenuTarget, setVerbMenuTarget] = useState<{ expIdx: number; hIdx: number } | null>(null);
  const [showSkillClusters, setShowSkillClusters] = useState<boolean>(false);
  const [showJobMatcher, setShowJobMatcher] = useState<boolean>(false);
  const [jobMatcherText, setJobMatcherText] = useState<string>('');
  const [structureSubView, setStructureSubView] = useState<'order' | 'presets'>('order');
  const [collapsedExps, setCollapsedExps] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { saveCurrentResume } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSaveProgress = async () => {
    try {
      setIsSaving(true);
      const name = cv.personalDetails.name?.trim();
      const role = cv.personalDetails.title?.trim() || 'Currículo';
      const title = name ? `${name} - ${role}` : 'Meu Currículo Executivo';
      await saveCurrentResume(cv, title, cv.personalDetails.title);
      showSuccess(
        'Progresso Salvo com Sucesso!',
        `O seu currículo foi guardado em segurança na nuvem (${cv.experiences.length} cargos, ${cv.competencies.length} competências sincronizadas).`
      );
    } catch (err: any) {
      console.error('Erro ao guardar progresso:', err);
      showError('Erro ao Salvar', 'Não foi possível guardar o seu progresso no momento.');
    } finally {
      setIsSaving(false);
    }
  };

  const metrics = useMemo(() => calculateCVMetrics(cv), [cv]);

  // Real-Time Job Matcher Analysis
  const jobMatcherAnalysis = useMemo(() => {
    if (!jobMatcherText.trim()) return null;

    const rawTokens = jobMatcherText
      .toLowerCase()
      .replace(/[^a-z0-9áàâãéèêíïóôõöúçñ\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const stopwords = new Set([
      'para', 'com', 'pelo', 'pela', 'como', 'mais', 'sobre', 'entre', 'onde',
      'quando', 'muito', 'cada', 'está', 'será', 'foram', 'seus', 'suas',
      'esse', 'esta', 'este', 'isso', 'vaga', 'cargo', 'empresa', 'procuramos',
      'requisitos', 'experiência', 'candidato', 'responsabilidades', 'deve', 'ter',
      'trabalho', 'área', 'perfil', 'função'
    ]);

    const frequency: Record<string, number> = {};
    for (const t of rawTokens) {
      if (!stopwords.has(t)) {
        frequency[t] = (frequency[t] || 0) + 1;
      }
    }

    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    const cvFullText = [
      cv.summary,
      ...cv.competencies.map((c) => `${c.category} ${c.description}`),
      ...cv.experiences.map((e) => `${e.role} ${e.company} ${e.highlights.join(' ')}`),
      ...cv.educations.map((ed) => `${ed.degree} ${ed.institution}`),
      ...cv.trainings,
      ...cv.languages.map((l) => `${l.language} ${l.level}`)
    ].join(' ').toLowerCase();

    const matched = keywords.filter((k) => cvFullText.includes(k));
    const missing = keywords.filter((k) => !cvFullText.includes(k));
    const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;

    return { keywords, matched, missing, score };
  }, [jobMatcherText, cv]);

  const handleAddMissingKeyword = (kw: string) => {
    const capitalized = kw.charAt(0).toUpperCase() + kw.slice(1);
    const newComp: Competency = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: capitalized,
      description: `Aplicação prática e estratégica de ${capitalized} em projetos de alto impacto.`
    };
    onChange({
      ...cv,
      competencies: [...cv.competencies, newComp]
    });
  };

  const handleInsertSummaryStarter = () => {
    const title = cv.personalDetails.title.trim() || 'Profissional Executivo';
    const starter = `${title} com sólida trajetória e liderança comprovada na gestão de projetos, operações e desenvolvimento estratégico. Especialista em otimização de fluxos operacionais, mitigação de riscos e entrega de resultados de alto impacto alinhados a metas organizacionais e conformidade com padrões internacionais de governança.`;
    onChange({
      ...cv,
      summary: starter
    });
  };

  // Section Ordering and Visibility Handlers
  const sectionOrder = useMemo(() => {
    return cv.sectionOrder && cv.sectionOrder.length > 0
      ? cv.sectionOrder
      : DEFAULT_SECTION_ORDER;
  }, [cv.sectionOrder]);

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
    const current = cv.sectionVisibility?.[sectionKey] !== false; // default true
    onChange({
      ...cv,
      sectionVisibility: {
        ...(cv.sectionVisibility || {}),
        [sectionKey]: !current
      }
    });
  };

  const isSectionVisible = (sectionKey: CVSectionKey) => {
    return cv.sectionVisibility?.[sectionKey] !== false;
  };

  const resetSectionOrder = () => {
    onChange({
      ...cv,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: {}
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
      company: '',
      role: '',
      period: '2024 – Presente',
      location: '',
      highlights: [
        'Liderou a implementação de processos estratégicos e gestão de equipas multidisciplinares.',
        'Desenvolveu iniciativas que otimizaram custos operacionais e aumentaram a conformidade com padrões internacionais.'
      ]
    };
    onChange({ ...cv, experiences: [newExp, ...cv.experiences] });
    // Expand the newly added experience
    setCollapsedExps((prev) => ({ ...prev, 0: false }));
  };

  const handleDeleteExperience = (index: number) => {
    const list = cv.experiences.filter((_, i) => i !== index);
    onChange({ ...cv, experiences: list });
  };

  const handleAddHighlight = (expIndex: number) => {
    const exp = cv.experiences[expIndex];
    const updated: Experience = {
      ...exp,
      highlights: [...exp.highlights, '']
    };
    handleUpdateExperience(expIndex, updated);
  };

  const handleUpdateHighlight = (expIndex: number, hIndex: number, text: string) => {
    const exp = cv.experiences[expIndex];
    const highlights = [...exp.highlights];
    highlights[hIndex] = text;
    handleUpdateExperience(expIndex, { ...exp, highlights });
  };

  const handleDeleteHighlight = (expIndex: number, hIndex: number) => {
    const exp = cv.experiences[expIndex];
    const highlights = exp.highlights.filter((_, i) => i !== hIndex);
    handleUpdateExperience(expIndex, { ...exp, highlights });
  };

  const handleMoveExperienceUp = (index: number) => {
    if (index === 0) return;
    const list = [...cv.experiences];
    const item = list[index];
    list[index] = list[index - 1];
    list[index - 1] = item;
    onChange({ ...cv, experiences: list });
  };

  const handleMoveExperienceDown = (index: number) => {
    if (index === cv.experiences.length - 1) return;
    const list = [...cv.experiences];
    const item = list[index];
    list[index] = list[index + 1];
    list[index + 1] = item;
    onChange({ ...cv, experiences: list });
  };

  const handleDuplicateExperience = (index: number) => {
    const item = cv.experiences[index];
    const cloned: Experience = {
      ...item,
      id: `exp-${Date.now()}`,
      role: item.role ? `${item.role} (Cópia)` : 'Novo Cargo',
      highlights: [...item.highlights]
    };
    const list = [...cv.experiences];
    list.splice(index + 1, 0, cloned);
    onChange({ ...cv, experiences: list });
  };

  const toggleExpCollapse = (idx: number) => {
    setCollapsedExps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const collapseAllExps = () => {
    const next: Record<number, boolean> = {};
    cv.experiences.forEach((_, i) => {
      next[i] = true;
    });
    setCollapsedExps(next);
  };

  const expandAllExps = () => {
    setCollapsedExps({});
  };

  const handleSuggestXyzBullet = (expIndex: number) => {
    const exp = cv.experiences[expIndex];
    const sampleBullets = [
      `Liderou iniciativa estratégica para ${exp.company || 'a organização'}, elevando a eficiência operacional em 28% através da padronização de fluxos e automação de processos.`,
      `Gerenciou equipa multidisciplinar de alto desempenho, reduzindo prazos de entrega em 35% com adoção de metodologias ágeis e OKRs.`,
      `Implementou governança e controle de qualidade para ${exp.role || 'a área de atuação'}, resultando em conformidade de 99.4% nas auditorias internacionais.`,
      `Otimizou alocação de orçamento e recursos de OPEX, gerando economia anual estimada de 22% sem impacto nas entregas centrais.`
    ];
    const randomBullet = sampleBullets[Math.floor(Math.random() * sampleBullets.length)];
    const updated: Experience = {
      ...exp,
      highlights: [...exp.highlights, randomBullet]
    };
    handleUpdateExperience(expIndex, updated);
  };

  const handleApplyVerbToHighlight = (verb: string) => {
    if (!verbMenuTarget) return;
    const { expIdx, hIdx } = verbMenuTarget;
    const current = cv.experiences[expIdx]?.highlights[hIdx] || '';
    const words = current.trim().split(/\s+/);
    let updatedText = '';
    if (words.length <= 1) {
      updatedText = `${verb} `;
    } else {
      updatedText = `${verb} ${words.slice(1).join(' ')}`;
    }
    handleUpdateHighlight(expIdx, hIdx, updatedText);
    setVerbMenuTarget(null);
  };

  // Handlers for Competencies
  const handleAddCompetency = () => {
    const newComp: Competency = {
      id: `comp-${Date.now()}`,
      category: '',
      description: ''
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

  const handleAddSuggestedSkill = (category: string, description: string) => {
    const exists = cv.competencies.some((c) => c.category.toLowerCase() === category.toLowerCase());
    if (exists) return;
    const newComp: Competency = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      description
    };
    onChange({ ...cv, competencies: [...cv.competencies, newComp] });
  };

  // Handlers for Education
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      period: '2020 – 2024',
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

  const handleMoveEducationUp = (index: number) => {
    if (index === 0) return;
    const list = [...cv.educations];
    const item = list[index];
    list[index] = list[index - 1];
    list[index - 1] = item;
    onChange({ ...cv, educations: list });
  };

  const handleMoveEducationDown = (index: number) => {
    if (index === cv.educations.length - 1) return;
    const list = [...cv.educations];
    const item = list[index];
    list[index] = list[index + 1];
    list[index + 1] = item;
    onChange({ ...cv, educations: list });
  };

  // Handlers for Training / Certifications
  const handleAddTraining = () => {
    onChange({ ...cv, trainings: [...cv.trainings, ''] });
  };

  const handleAddPresetTraining = (certName: string) => {
    if (cv.trainings.includes(certName)) return;
    onChange({ ...cv, trainings: [...cv.trainings, certName] });
  };

  const handleUpdateTraining = (index: number, val: string) => {
    const list = [...cv.trainings];
    list[index] = val;
    onChange({ ...cv, trainings: list });
  };

  const handleDeleteTraining = (index: number) => {
    const list = cv.trainings.filter((_, i) => i !== index);
    onChange({ ...cv, trainings: list });
  };

  // Handlers for Languages
  const handleAddLanguage = () => {
    onChange({ ...cv, languages: [...cv.languages, { language: '', level: 'C1 - Avançado Profissional' }] });
  };

  const handleUpdateLanguage = (index: number, lang: string, level: string) => {
    const list = [...cv.languages];
    list[index] = { language: lang, level };
    onChange({ ...cv, languages: list });
  };

  const handleDeleteLanguage = (index: number) => {
    const list = cv.languages.filter((_, i) => i !== index);
    onChange({ ...cv, languages: list });
  };

  // Handlers for References
  const handleAddReference = () => {
    const newRef: Reference = {
      id: `ref-${Date.now()}`,
      name: '',
      institutionAndPosition: '',
      contact: ''
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

  // Import / Export JSON
  const handleExportJSON = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Curriculo';
    a.download = `CV_${sanitizedName}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(
      'Backup JSON Exportado!',
      `Cópia de segurança guardada com sucesso (${sanitizedName}).`
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.personalDetails) {
          onChange(parsed);
          showSuccess(
            'Currículo Importado com Sucesso!',
            'Os dados do ficheiro JSON foram carregados e validados no editor.'
          );
        } else {
          showError('Ficheiro Inválido', 'O arquivo JSON não possui a estrutura padrão de currículo.');
        }
      } catch {
        showError('Erro de Leitura', 'Não foi possível ler o arquivo JSON selecionado.');
      }
    };
    reader.readAsText(file);
  };

  const tabStatus = useMemo(() => ({
    personal: Boolean(cv.personalDetails?.name?.trim() && cv.personalDetails?.email?.trim() && cv.summary?.trim()),
    career: Boolean(cv.experiences && cv.experiences.length >= 1 && cv.experiences.some((e) => e.highlights && e.highlights.length > 0)),
    education: Boolean((cv.educations && cv.educations.length >= 1) || (cv.trainings && cv.trainings.length >= 1)),
    skills: Boolean((cv.competencies && cv.competencies.length >= 2) || (cv.languages && cv.languages.length >= 1)),
    structure: true
  }), [cv]);

  const completedTabsCount = Object.values(tabStatus).filter(Boolean).length;
  const progressPercent = Math.round((completedTabsCount / 5) * 100);

  const tabsConfig = [
    { id: 'personal' as EditorSubTab, label: 'Perfil', count: null, icon: Users },
    { id: 'career' as EditorSubTab, label: 'Experiência', count: cv.experiences.length, icon: Briefcase },
    { id: 'education' as EditorSubTab, label: 'Formação', count: cv.educations.length + cv.trainings.length, icon: GraduationCap },
    { id: 'skills' as EditorSubTab, label: 'Skills & Idiomas', count: cv.competencies.length + cv.languages.length, icon: Sparkles },
    { id: 'structure' as EditorSubTab, label: 'Estrutura & Modelos', count: null, icon: Sliders }
  ];

  const currentTabIndex = tabsConfig.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? tabsConfig[currentTabIndex - 1].id : null;
  const nextTab = currentTabIndex < tabsConfig.length - 1 ? tabsConfig[currentTabIndex + 1].id : null;

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto">
      {/* ========================================================================= */}
      {/* 1. UNIFIED STICKY CONTROL DECK: TOOLBAR + STATS + SUB-TABS (0-Jitter Header) */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
        {/* Main Toolbar */}
        <div className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Editor de Currículo Executivo</h2>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Sincronização em Tempo Real
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Estruturação modular segundo normas internacionais de recrutamento (ATS & C-Level)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Progress Button */}
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-xs shrink-0"
              title="Guardar o currículo atual na sua conta na nuvem"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'A guardar...' : 'Salvar Progresso'}</span>
            </button>

            <TemplateSelectorDropdown
              currentStyle={cv.templateStyle}
              onSelectStyle={(newStyle) => onChange({ ...cv, templateStyle: newStyle })}
              onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsAdvisorOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Guia estratégico de modelos de currículo"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Live Metrics & Quick Action Bar */}
        <div className="px-4 sm:px-6 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span><strong className="text-slate-900 font-semibold">{metrics.totalWords}</strong> palavras</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Leitura ~<strong className="text-slate-900 font-semibold">{metrics.readingTimeFormatted}</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span><strong className="text-slate-900 font-semibold">{metrics.estimatedPages}</strong> {metrics.estimatedPages === 1 ? 'página estimada' : 'páginas estimadas'}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Job Matcher Trigger */}
            <button
              type="button"
              onClick={() => setShowJobMatcher(!showJobMatcher)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                showJobMatcher
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Auditar compatibilidade com a vaga e palavras-chave"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Auditar Vaga {jobMatcherAnalysis ? `(${jobMatcherAnalysis.score}%)` : ''}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showJobMatcher ? 'rotate-180' : ''}`} />
            </button>

            {/* Strength Score with drawer toggle */}
            <button
              type="button"
              onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 transition-colors"
              title="Ver checklist de força executiva"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Força: {metrics.strengthScore}%</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showChecklistDrawer ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Job Matcher Drawer */}
        {showJobMatcher && (
          <div className="px-4 sm:px-6 py-3 bg-slate-100/90 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">
                  Auditoria de Palavras-Chave da Vaga
                </span>
              </div>
              {jobMatcherAnalysis && (
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {jobMatcherAnalysis.score}% Match
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={jobMatcherText}
              onChange={(e) => setJobMatcherText(e.target.value)}
              placeholder="Cole aqui o anúncio da vaga (requisitos, competências ou termos-chave como P&L, Lean, SAP, Governança)..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 resize-none shadow-2xs placeholder:text-slate-400"
            />

            {jobMatcherAnalysis && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">No Currículo:</span>
                  {jobMatcherAnalysis.matched.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Nenhum termo encontrado ainda</span>
                  ) : (
                    jobMatcherAnalysis.matched.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {m}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-amber-800 mr-1">Faltam no Currículo (Clique para Inserir):</span>
                  {jobMatcherAnalysis.missing.length === 0 ? (
                    <span className="text-[11px] text-emerald-700 font-semibold">✓ Excelente! Todos os termos principais estão presentes.</span>
                  ) : (
                    jobMatcherAnalysis.missing.map((mis) => (
                      <button
                        key={mis}
                        type="button"
                        onClick={() => handleAddMissingKeyword(mis)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-2xs"
                        title={`Clique para adicionar ${mis} como competência`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{mis}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expandable Checklist Recommendations */}
        {showChecklistDrawer && (
          <div className="px-4 sm:px-6 py-3.5 bg-slate-100/90 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Checklist de Excelência Executiva</span>
              <span className="text-emerald-700 font-mono font-semibold">{metrics.strengthScore}% Concluído</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metrics.completenessChecklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {item.completed ? <Check className="w-2.5 h-2.5" /> : <span className="text-[10px]">•</span>}
                  </div>
                  <div>
                    <span className={`font-semibold ${item.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    {!item.completed && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Progress Bar & Step Tracker */}
        <div className="px-4 sm:px-6 py-2 bg-white flex items-center justify-between gap-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Preenchimento Geral:</span>
            <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {progressPercent}%
            </span>
          </div>

          <div className="flex-1 max-w-[180px] sm:max-w-[240px] h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : progressPercent >= 60
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1">
            <span>{completedTabsCount} de 5 etapas completas</span>
            {progressPercent === 100 && (
              <span className="text-emerald-600 font-bold ml-1">✓ Pronto para Exportar</span>
            )}
          </div>
        </div>

        {/* Unified Sub-Tabs Segmented Bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100/90 border-t border-slate-200">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isTabDone = tabStatus[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 text-center ${
                    isActive
                      ? 'bg-white text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span className="text-xs">{tab.label}</span>
                  {isTabDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Etapa preenchida com sucesso" />
                  )}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-300/60 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB CONTENT PANES */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 space-y-4 flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: IDENTIDADE (Dados Pessoais, Fotografia, Resumo Estratégico) */}
        {/* ========================================================================= */}
        {activeTab === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Personal Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Dados Pessoais & Contactos
                    </h3>
                    <p className="text-[11px] text-slate-500">Identificação clara e canais diretos de comunicação</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                      title={cv.personalDetails.showPhoto !== false ? 'Ocultar foto do documento' : 'Exibir foto no documento'}
                    >
                      {cv.personalDetails.showPhoto !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Foto Ativa</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">Foto Ocultada</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>{cv.personalDetails.photoUrl ? 'Gerir Foto' : 'Adicionar Foto'}</span>
                  </button>
                </div>
              </div>

              {/* Photo Preview Strip if photo exists */}
              {cv.personalDetails.photoUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fotografia Executiva Configurada</p>
                      <p className="text-[11px] text-slate-500">
                        {cv.personalDetails.showPhoto !== false
                          ? 'Visível nos modelos com foto (Europeu, Executivo, Harvard com foto)'
                          : 'Ocultada no documento final'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Ajustar / Trocar
                  </button>
                </div>
              )}

              {/* Personal Details Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nome Completo</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 font-medium"
                    placeholder="Ex: Dra. Maria Silva"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cargo / Título Executivo</span>
                  </label>
                  <input
                    type="text"
                    value={cv.personalDetails.title}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 font-medium"
                    placeholder="Ex: Diretora de Operações (COO) | Head de Projetos"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Localização (Cidade, País)</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                    placeholder="Ex: Luanda, Angola / Lisboa, Portugal"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Telefone / WhatsApp</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all font-mono text-slate-900"
                    placeholder="Ex: +244 923 000 000"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>E-mail Profissional</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                    placeholder="Ex: maria.silva@exemplo.com"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                    <span>LinkedIn URL</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                    placeholder="Ex: linkedin.com/in/mariasilva"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Website / Portfólio / GitHub (Opcional)</span>
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
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                    placeholder="Ex: https://mariasilva.dev ou github.com/mariasilva"
                  />
                </div>
              </div>
            </div>

            {/* Strategic Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Resumo Profissional Estratégico
                    </h3>
                    <p className="text-[11px] text-slate-500">Síntese de impacto para os primeiros 6 segundos do recrutador</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertSummaryStarter}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1"
                    title="Inserir modelo de abertura executiva pré-calibrado"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Modelo Inicial</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAiTailor}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Otimizar com IA</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={cv.summary}
                onChange={(e) => onChange({ ...cv, summary: e.target.value })}
                className="w-full text-xs sm:text-[13px] leading-relaxed p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/5 transition-all resize-y text-slate-800 placeholder:text-slate-400"
                placeholder="Ex: Executivo sénior com mais de 12 anos de experiência liderando operações e transformação digital em empresas multinacionais. Histórico comprovado de aumento de 35% na produtividade e gestão de orçamentos superiores a $5M..."
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  {cv.summary ? cv.summary.trim().split(/\s+/).length : 0} palavras · Intervalo ideal: 50 a 85 palavras
                </span>
                <span className={cv.summary.length >= 100 ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                  {cv.summary.length >= 100 ? '✓ Extensão recomendada para ATS' : '⚠️ Adicione métricas e realizações'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EXPERIÊNCIA (Trajetória Profissional com Fórmula XYZ) */}
        {/* ========================================================================= */}
        {activeTab === 'career' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Experiência Profissional ({cv.experiences.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Organize em ordem cronológica inversa com realizações mensuráveis</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cv.experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={Object.keys(collapsedExps).length > 0 ? expandAllExps : collapseAllExps}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {Object.keys(collapsedExps).length > 0 ? 'Expandir Todos' : 'Recolher Todos'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Cargo</span>
                  </button>
                </div>
              </div>

              {cv.experiences.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">Nenhum cargo registado</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Adicione a sua trajetória profissional destacando realizações quantitativas e impacto.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                  >
                    + Adicionar Primeira Experiência
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {cv.experiences.map((exp, expIdx) => {
                    const isCollapsed = !!collapsedExps[expIdx];

                    return (
                      <div
                        key={exp.id || expIdx}
                        className="bg-slate-50/80 border border-slate-200 rounded-2xl transition-all overflow-hidden"
                      >
                        {/* Header Toolbar of Each Experience Card */}
                        <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-100/50">
                          <button
                            type="button"
                            onClick={() => toggleExpCollapse(expIdx)}
                            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
                          >
                            <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                              {expIdx + 1}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {exp.role || 'Cargo a definir'}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {exp.company || 'Empresa'} · {exp.period || 'Período'} · {exp.highlights.length} realizações
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveExperienceUp(expIdx)}
                              disabled={expIdx === 0}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-20 transition-colors"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExperienceDown(expIdx)}
                              disabled={expIdx === cv.experiences.length - 1}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-20 transition-colors"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateExperience(expIdx)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
                              title="Duplicar experiência"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(expIdx)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                              title="Eliminar experiência"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpCollapse(expIdx)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors ml-1"
                              title={isCollapsed ? 'Expandir' : 'Recolher'}
                            >
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Body */}
                        {!isCollapsed && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Empresa / Instituição</label>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => handleUpdateExperience(expIdx, { ...exp, company: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                                  placeholder="Ex: Sonangol / Banco BAI / Google"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cargo / Função</label>
                                <input
                                  type="text"
                                  value={exp.role}
                                  onChange={(e) => handleUpdateExperience(expIdx, { ...exp, role: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                                  placeholder="Ex: Diretor de Operações (COO)"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Período / Ano</label>
                                <input
                                  type="text"
                                  value={exp.period}
                                  onChange={(e) => handleUpdateExperience(expIdx, { ...exp, period: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 font-mono text-slate-900"
                                  placeholder="Ex: 2021 – Presente"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Localização (Opcional)</label>
                                <input
                                  type="text"
                                  value={exp.location || ''}
                                  onChange={(e) => handleUpdateExperience(expIdx, { ...exp, location: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 text-slate-900"
                                  placeholder="Ex: Luanda, Angola / Híbrido"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Projeto / Cliente / Financiador (Opcional)</label>
                                <input
                                  type="text"
                                  value={exp.donor || ''}
                                  onChange={(e) => handleUpdateExperience(expIdx, { ...exp, donor: e.target.value })}
                                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 text-slate-900"
                                  placeholder="Ex: Financiamento Banco Mundial / USAID / Contrato Estratégico"
                                />
                              </div>
                            </div>

                            {/* Highlights / Bullet Points */}
                            <div className="pt-2 border-t border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                                  Realizações de Alto Impacto ({exp.highlights.length})
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSuggestXyzBullet(expIdx)}
                                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                                    title="Gerar sugestão executiva no padrão Google XYZ"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Fórmula XYZ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddHighlight(expIdx)}
                                    className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Adicionar Ponto</span>
                                  </button>
                                </div>
                              </div>

                              {exp.highlights.map((h, hIdx) => (
                                <div key={hIdx} className="space-y-1.5">
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-2.5 font-bold text-xs shrink-0">•</span>
                                    <textarea
                                      rows={2}
                                      value={h}
                                      onChange={(e) => handleUpdateHighlight(expIdx, hIdx, e.target.value)}
                                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800 transition-all text-slate-800 placeholder:text-slate-400 leading-relaxed"
                                      placeholder="Comece com verbo de ação forte + tarefa estratégica + resultado mensurável (ex: Liderou..., Reduziu em 30%...)"
                                    />
                                    <div className="flex flex-col gap-1 shrink-0 mt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setVerbMenuTarget(
                                            verbMenuTarget?.expIdx === expIdx && verbMenuTarget?.hIdx === hIdx
                                              ? null
                                              : { expIdx, hIdx }
                                          )
                                        }
                                        className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                                        title="Sugerir verbo de ação executivo"
                                      >
                                        <Zap className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title="Remover ponto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Executive Action Verbs Quick Selector Drawer */}
                                  {verbMenuTarget?.expIdx === expIdx && verbMenuTarget?.hIdx === hIdx && (
                                    <div className="ml-5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                                      <div className="text-[11px] font-bold text-amber-950 flex items-center justify-between">
                                        <span>⚡ Injetar Verbo de Ação Executivo:</span>
                                        <button
                                          type="button"
                                          onClick={() => setVerbMenuTarget(null)}
                                          className="text-amber-800 text-[10px] hover:underline"
                                        >
                                          Fechar
                                        </button>
                                      </div>
                                      <div className="space-y-1.5">
                                        {EXECUTIVE_ACTION_VERBS.slice(0, 3).map((categoryGroup) => (
                                          <div key={categoryGroup.category}>
                                            <span className="text-[10px] font-semibold text-amber-900 block mb-1">
                                              {categoryGroup.category}:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                              {categoryGroup.verbs.map((verb) => (
                                                <button
                                                  key={verb}
                                                  type="button"
                                                  onClick={() => handleApplyVerbToHighlight(verb)}
                                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
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
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORMAÇÃO & CERTIFICAÇÕES (Graus Académicos, Cursos & Licenças) */}
        {/* ========================================================================= */}
        {activeTab === 'education' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Academic Degrees Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Formação Académica ({cv.educations.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Graus universitários, pós-graduações e especializações</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Formação</span>
                </button>
              </div>

              {/* Quick Degrees Chips */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Sugestões de Graus Académicos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DEGREES.map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        const newEdu: Education = {
                          id: `edu-${Date.now()}`,
                          degree: deg,
                          institution: '',
                          period: '2020 – 2024',
                          gpaOrHonors: ''
                        };
                        onChange({ ...cv, educations: [...cv.educations, newEdu] });
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-slate-400 hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>{deg}</span>
                    </button>
                  ))}
                </div>
              </div>

              {cv.educations.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">Nenhuma formação registada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cv.educations.map((edu, eduIdx) => (
                    <div key={edu.id || eduIdx} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {edu.degree || 'Grau a definir'} {edu.institution ? `· ${edu.institution}` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveEducationUp(eduIdx)}
                            disabled={eduIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveEducationDown(eduIdx)}
                            disabled={eduIdx === cv.educations.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(eduIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Eliminar formação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, degree: e.target.value })}
                          placeholder="Grau (ex: Licenciatura em Engenharia Informática)"
                          className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                        />
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, institution: e.target.value })}
                          placeholder="Instituição (ex: Universidade Agostinho Neto / IST)"
                          className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                        />
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, period: e.target.value })}
                          placeholder="Período (ex: 2018 – 2022)"
                          className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 font-mono text-slate-900"
                        />
                        <input
                          type="text"
                          value={edu.gpaOrHonors || ''}
                          onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, gpaOrHonors: e.target.value })}
                          placeholder="Honras / Distinção (ex: Média 17/20, Magna Cum Laude)"
                          className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications & Specialized Courses Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Certificações & Cursos Especializados ({cv.trainings.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Credenciais profissionais, licenças e programas de atualização</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddTraining}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Manual</span>
                </button>
              </div>

              {/* Quick Certification Cloud */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-purple-900 block">
                  🏆 Certificações de Alto Reconhecimento Internacional (Clique para adicionar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CERTIFICATIONS.map((cert) => {
                    const isAdded = cv.trainings.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => handleAddPresetTraining(cert)}
                        disabled={isAdded}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                          isAdded
                            ? 'bg-purple-100 text-purple-400 border-purple-200 cursor-default'
                            : 'bg-white text-purple-950 border-purple-200 hover:bg-purple-100 shadow-2xs'
                        }`}
                      >
                        {isAdded ? <Check className="w-3 h-3 text-purple-600" /> : <Plus className="w-3 h-3 text-purple-700" />}
                        <span>{cert}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Existing Certifications List */}
              <div className="space-y-2">
                {cv.trainings.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma certificação adicionada ainda.</p>
                ) : (
                  cv.trainings.map((t, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => handleUpdateTraining(tIdx, e.target.value)}
                        placeholder="Certificação (ex: PMP® Project Management Professional - PMI, 2023)"
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteTraining(tIdx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remover certificação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SKILLS & IDIOMAS (Competências, Idiomas & Referências) */}
        {/* ========================================================================= */}
        {activeTab === 'skills' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Competencies with Interactive Suggestions Cloud */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Competências Chave & Ferramentas ({cv.competencies.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Agrupadas por domínios técnicos, gerenciais e ferramentas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSkillClusters(!showSkillClusters)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>{showSkillClusters ? 'Ocultar Sugestões' : 'Sugestões Rápidas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCompetency}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Expandable Suggestions Cloud */}
              {showSkillClusters && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                    💡 Competências Executivas Estratégicas (Clique para adicionar com 1 clique):
                  </div>
                  <div className="space-y-3">
                    {POPULAR_COMPETENCY_CLUSTERS.map((cluster) => (
                      <div key={cluster.title}>
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                          {cluster.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cluster.skills.map((s) => {
                            const isAdded = cv.competencies.some(
                              (c) => c.category.toLowerCase() === s.category.toLowerCase()
                            );
                            return (
                              <button
                                key={s.category}
                                type="button"
                                onClick={() => handleAddSuggestedSkill(s.category, s.description)}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                                  isAdded
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                    : 'bg-white hover:bg-amber-100 text-slate-800 border-amber-200 hover:border-amber-300 shadow-2xs'
                                }`}
                              >
                                {isAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-amber-700" />}
                                <span>{s.category}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competencies List */}
              <div className="space-y-3">
                {cv.competencies.map((comp, cIdx) => (
                  <div key={comp.id || cIdx} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{comp.category || 'Competência a definir'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompetency(cIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar competência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={comp.category}
                        onChange={(e) => handleUpdateCompetency(cIdx, { ...comp, category: e.target.value })}
                        placeholder="Categoria (ex: Gestão de Projetos & P&L)"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 font-semibold text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={comp.description}
                        onChange={(e) => handleUpdateCompetency(cIdx, { ...comp, description: e.target.value })}
                        placeholder="Detalhes, ferramentas e metodologias dominadas..."
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages Section with Fast CEFR Level Chips */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Idiomas & Nível CEFR ({cv.languages.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Classificação segundo o Quadro Europeu Comum de Referência</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Idioma</span>
                </button>
              </div>

              <div className="space-y-3">
                {cv.languages.map((l, lIdx) => (
                  <div key={lIdx} className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={l.language}
                        onChange={(e) => handleUpdateLanguage(lIdx, e.target.value, l.level)}
                        placeholder="Idioma (ex: Inglês, Francês, Espanhol)"
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        value={l.level}
                        onChange={(e) => handleUpdateLanguage(lIdx, l.language, e.target.value)}
                        placeholder="Nível (ex: Fluente / C2)"
                        className="w-1/3 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(lIdx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Eliminar idioma"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick CEFR Level Chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 mr-1">Rápido:</span>
                      {CEFR_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleUpdateLanguage(lIdx, l.language, lvl)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            l.level === lvl
                              ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lvl.split(' - ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* References Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Referências Profissionais ({cv.references.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">Contactos de líderes, diretores ou clientes anteriores</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddReference}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Referência</span>
                </button>
              </div>

              <div className="space-y-3">
                {cv.references.map((ref, rIdx) => (
                  <div key={ref.id || rIdx} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{ref.name || 'Referência a indicar'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteReference(rIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar referência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, name: e.target.value })}
                        placeholder="Nome Completo"
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900 font-medium"
                      />
                      <input
                        type="text"
                        value={ref.institutionAndPosition}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, institutionAndPosition: e.target.value })}
                        placeholder="Instituição & Cargo"
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 text-slate-900"
                      />
                      <input
                        type="text"
                        value={ref.contact}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, contact: e.target.value })}
                        placeholder="Contacto (E-mail / Telefone)"
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 font-mono text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ESTRUTURA & MODELOS (Section Ordering, Presets & Backups) */}
        {/* ========================================================================= */}
        {activeTab === 'structure' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Sub-Switch: Structure Reorder vs Presets & Backups */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setStructureSubView('order')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  structureSubView === 'order'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Ordem & Visibilidade das Secções
              </button>
              <button
                type="button"
                onClick={() => setStructureSubView('presets')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  structureSubView === 'presets'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Predefinições de Currículo & Backup
              </button>
            </div>

            {/* Active Model Indicator Card */}
            {(() => {
              const tmpl = getTemplateById(cv.templateStyle);
              return (
                <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                        {tmpl.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ATS Score: {tmpl.atsScore}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold mt-1 text-white">{tmpl.name}</h4>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{tmpl.tagline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdvisorOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Mudar Modelo</span>
                  </button>
                </div>
              );
            })()}

            {structureSubView === 'order' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>Estrutura & Disposição Vertical</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Reordene as secções para enfatizar os pontos fortes do seu perfil na primeira página
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetSectionOrder}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    title="Restaurar ordem predefinida oficial"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Ordem</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {sectionOrder.map((sectionKey, idx) => {
                    const meta = SECTION_METADATA[sectionKey] || {
                      name: sectionKey,
                      description: '',
                      iconName: 'FileText'
                    };
                    const isVisible = isSectionVisible(sectionKey);

                    return (
                      <div
                        key={sectionKey}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isVisible
                            ? 'bg-white border-slate-200 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{meta.name}</h4>
                              <span
                                className={`text-[10px] px-2 py-0.2 rounded font-semibold uppercase ${
                                  isVisible
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {isVisible ? 'Visível' : 'Oculto'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{meta.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === sectionOrder.length - 1}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(sectionKey)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                            title={isVisible ? 'Ocultar secção' : 'Tornar secção visível'}
                          >
                            {isVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Predefinições de Currículo & Gestão de Backups
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Carregue currículos estruturados de referência ou exporte o seu histórico completo para JSON
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja carregar o perfil de referência de Agostinho Silva? Os dados atuais serão substituídos.')) {
                        onChange({ ...AGOSTINHO_CV, templateStyle: cv.templateStyle });
                      }
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-left transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Perfil Executivo Agostinho</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Completo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Diretor de Operações e Engenharia com projetos internacionais, certificações e referências.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja carregar o modelo executivo genérico?')) {
                        onChange({ ...GENERIC_DEFAULT_CV, templateStyle: cv.templateStyle });
                      }
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-left transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Modelo Genérico Padrão</span>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                        Padrão
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Estrutura equilibrada com orientações para posições técnicas e de gestão corporativa.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Tem a certeza de que deseja limpar todos os campos do currículo?')) {
                        onChange({ ...BLANK_CV, templateStyle: cv.templateStyle });
                      }
                    }}
                    className="p-3.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/30 hover:bg-rose-50/60 text-left transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">Iniciar do Zero (Em Branco)</span>
                      <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-1.5 py-0.5 rounded">
                        Limpar
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-600">
                      Remove todo o conteúdo e permite preenchimento manual completo a partir de uma base vazia.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-left transition-all space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Exportar Backup JSON</span>
                      <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        .json
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Guarda todos os dados e formatações num ficheiro local seguro para restauração futura.
                    </p>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Restaurar currículo de ficheiro JSON:</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar Ficheiro JSON</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJSON}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. FLUID STEP-BY-STEP NAVIGATION FOOTER */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
          <div>
            {prevTab && (
              <button
                type="button"
                onClick={() => setActiveTab(prevTab)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior: {tabsConfig.find((t) => t.id === prevTab)?.label}</span>
              </button>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Guardar o currículo atual na sua conta na nuvem"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'A guardar...' : 'Salvar Progresso'}</span>
            </button>
          </div>

          <div>
            {nextTab && (
              <button
                type="button"
                onClick={() => setActiveTab(nextTab)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>Seguinte: {tabsConfig.find((t) => t.id === nextTab)?.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advisor & Photo Modals */}
      <TemplateAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={(style) => onChange({ ...cv, templateStyle: style })}
        cv={cv}
        onUpdateCV={onChange}
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
