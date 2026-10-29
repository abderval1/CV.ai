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
  ShieldCheck,
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
  Layers,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  Clock,
  BookOpen,
  Sliders,
  Zap,
  Info,
  Target,
  Search
} from 'lucide-react';
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

type EditorSubTab = 'personal' | 'career' | 'skills' | 'structure' | 'presets';

export const ContentEditor: React.FC<ContentEditorProps> = ({
  cv,
  onChange,
  onOpenAiTailor
}) => {
  const [activeTab, setActiveTab] = useState<EditorSubTab>('personal');
  const [activeAccordion, setActiveAccordion] = useState<string>('personal-details');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [showChecklistDrawer, setShowChecklistDrawer] = useState<boolean>(false);
  const [verbMenuTarget, setVerbMenuTarget] = useState<{ expIdx: number; hIdx: number } | null>(null);
  const [showSkillClusters, setShowSkillClusters] = useState<boolean>(false);
  const [showJobMatcher, setShowJobMatcher] = useState<boolean>(false);
  const [jobMatcherText, setJobMatcherText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTemplate = getTemplateById(cv.templateStyle);
  const metrics = useMemo(() => calculateCVMetrics(cv), [cv]);

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
      'requisitos', 'experiência', 'candidato', 'responsabilidades', 'deve', 'ter'
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

  const sectionOrder: CVSectionKey[] = cv.sectionOrder && cv.sectionOrder.length > 0
    ? cv.sectionOrder
    : DEFAULT_SECTION_ORDER;

  const isSectionVisible = (key: CVSectionKey): boolean => {
    return cv.sectionVisibility?.[key] !== false;
  };

  const toggleSectionVisibility = (key: CVSectionKey) => {
    const current = isSectionVisible(key);
    onChange({
      ...cv,
      sectionVisibility: {
        ...(cv.sectionVisibility || {}),
        [key]: !current
      }
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    onChange({ ...cv, sectionOrder: newOrder });
  };

  const resetSectionOrder = () => {
    onChange({
      ...cv,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: {}
    });
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? '' : name);
  };

  // Handlers for Experiences
  const handleUpdateExperience = (index: number, updated: Experience) => {
    const list = [...cv.experiences];
    list[index] = updated;
    onChange({ ...cv, experiences: list });
  };

  const handleAddExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      company: 'Nova Organização / Agência',
      role: 'Cargo / Função',
      period: '2024 – Presente',
      highlights: [
        'Liderou a implementação de sistemas de dados e monitoria de indicadores de impacto.',
        'Desenvolveu relatórios analíticos e dashboards para suporte à tomada de decisão.'
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
    const updated: Experience = {
      ...exp,
      highlights: [...exp.highlights, 'Nova realização ou responsabilidade de alto impacto...']
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
      role: `${item.role} (Cópia)`,
      highlights: [...item.highlights]
    };
    const list = [...cv.experiences];
    list.splice(index + 1, 0, cloned);
    onChange({ ...cv, experiences: list });
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
    // Prepend or replace first word
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
      category: 'Nova Competência Chave',
      description: 'Descrição das ferramentas, metodologias e padrões de excelência.'
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
      degree: 'Grau Académico / Mestrado / Licenciatura',
      institution: 'Nome da Universidade / Instituto',
      period: '2020 – 2024'
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

  // Handlers for References
  const handleAddReference = () => {
    const newRef: Reference = {
      id: `ref-${Date.now()}`,
      name: 'Nome da Referência',
      institutionAndPosition: 'Organização\nCargo ou Função',
      contact: 'email@organizacao.org'
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

  // Handlers for Trainings
  const handleAddTraining = () => {
    onChange({ ...cv, trainings: [...cv.trainings, 'Nova Certificação ou Formação Especializada'] });
  };

  const handleUpdateTraining = (index: number, text: string) => {
    const list = [...cv.trainings];
    list[index] = text;
    onChange({ ...cv, trainings: list });
  };

  const handleDeleteTraining = (index: number) => {
    const list = cv.trainings.filter((_, i) => i !== index);
    onChange({ ...cv, trainings: list });
  };

  // Handlers for Languages
  const handleAddLanguage = () => {
    onChange({
      ...cv,
      languages: [...cv.languages, { language: 'Novo Idioma', level: 'Fluente / Profissional (C1)' }]
    });
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
          alert('Currículo importado do backup JSON com sucesso!');
        } else {
          alert('Arquivo JSON com estrutura inválida.');
        }
      } catch {
        alert('Erro ao processar ficheiro JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 border-r border-slate-200 overflow-y-auto">
      {/* 1. Header Toolbar with Real-Time CV Health Metrics */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900">Editor de Conteúdo Executivo</h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Edição modular estruturada com sincronização instantânea
            </p>
          </div>

          <div className="flex items-center gap-2">
            <TemplateSelectorDropdown
              currentStyle={cv.templateStyle}
              onSelectStyle={(newStyle) => onChange({ ...cv, templateStyle: newStyle })}
              onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsAdvisorOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
              title="Guia de quando e onde usar cada modelo de currículo"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Live CV Health & Reading Metrics Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-900">{metrics.totalWords}</strong> palavras
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Leitura ~<strong className="text-slate-900">{metrics.readingTimeFormatted}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-900">{metrics.estimatedPages}</strong> {metrics.estimatedPages === 1 ? 'Página A4' : 'Páginas A4'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Job Matcher Trigger */}
            <button
              type="button"
              onClick={() => setShowJobMatcher(!showJobMatcher)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                showJobMatcher
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
              title="Auditoria rápida de compatibilidade com vaga e palavras-chave"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Auditar Vaga {jobMatcherAnalysis ? `(${jobMatcherAnalysis.score}%)` : ''}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showJobMatcher ? 'rotate-180' : ''}`} />
            </button>

            {/* Strength Pill with click to open recommendations */}
            <button
              type="button"
              onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              title="Clique para ver o checklist de força executiva"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Força: {metrics.strengthScore}%</span>
              <ChevronDown className={`w-3 h-3 text-emerald-700 transition-transform ${showChecklistDrawer ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Job Matcher Panel */}
        {showJobMatcher && (
          <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-150 text-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Auditoria Direta de Vaga & Palavras-Chave</span>
              </span>
              {jobMatcherAnalysis && (
                <span className="text-xs font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  {jobMatcherAnalysis.score}% Match
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={jobMatcherText}
              onChange={(e) => setJobMatcherText(e.target.value)}
              placeholder="Cole aqui o anúncio da vaga ou termos-chave desejados (ex: P&L, Gestão Lean, ERP SAP, Governança, ESG)..."
              className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs leading-relaxed text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 resize-none shadow-inner"
            />

            {jobMatcherAnalysis && (
              <div className="space-y-2 pt-1 border-t border-blue-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Presentes no CV:</span>
                  {jobMatcherAnalysis.matched.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Nenhum termo encontrado ainda</span>
                  ) : (
                    jobMatcherAnalysis.matched.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        {m}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-amber-700 mr-1">Faltam no CV (Clique para Adicionar):</span>
                  {jobMatcherAnalysis.missing.length === 0 ? (
                    <span className="text-[11px] text-emerald-700 font-semibold">✓ Todos os termos principais estão cobertos no CV!</span>
                  ) : (
                    jobMatcherAnalysis.missing.map((mis) => (
                      <button
                        key={mis}
                        type="button"
                        onClick={() => handleAddMissingKeyword(mis)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1"
                        title={`Clique para adicionar ${mis} como competência`}
                      >
                        <Plus className="w-2.5 h-2.5" />
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
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Checklist de Excelência Executiva</span>
              <span className="text-emerald-700 font-mono">{metrics.strengthScore}% Concluído</span>
            </div>
            <div className="space-y-1.5">
              {metrics.completenessChecklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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
      </div>

      {/* 2. Organized Sub-Tabs Navigation */}
      <div className="px-4 pt-3 pb-2 bg-slate-100/90 border-b border-slate-200 shrink-0 sticky top-[97px] z-10 backdrop-blur-xs">
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'personal'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'career'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Carreira</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'skills'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Skills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'structure'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Secções</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'presets'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Modelos</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Tab Content Panes */}
      <div className="p-4 space-y-4 flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: PERFIL (Dados Pessoais, Foto, Resumo Profissional) */}
        {/* ========================================================================= */}
        {activeTab === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Personal Details Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dados Pessoais & Contactos
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cv.personalDetails.photoUrl ? 'Gerir Foto' : 'Adicionar Foto'}</span>
                </button>
              </div>

              {/* Photo Preview Strip */}
              {cv.personalDetails.photoUrl && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Foto Profissional Configurada</p>
                      <p className="text-[10px] text-slate-500">
                        {cv.personalDetails.showPhoto !== false ? 'Ativa no documento' : 'Ocultada'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Alterar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={cv.personalDetails.name}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: Dra. Maria Silva"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Título Profissional Executivo</label>
                  <input
                    type="text"
                    value={cv.personalDetails.title}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: Diretora de Operações (COO) | Head de Projetos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Localização (Cidade, País)</label>
                  <input
                    type="text"
                    value={cv.personalDetails.location}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, location: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: Luanda, Angola / Lisboa, Portugal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={cv.personalDetails.phone}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, phone: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                    placeholder="Ex: +244 923 000 000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">E-mail Profissional</label>
                  <input
                    type="email"
                    value={cv.personalDetails.email}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, email: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: maria.silva@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={cv.personalDetails.linkedin}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, linkedin: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: linkedin.com/in/mariasilva"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Website / Portfólio / GitHub</label>
                  <input
                    type="text"
                    value={cv.personalDetails.website || ''}
                    onChange={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, website: e.target.value }
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    placeholder="Ex: https://mariasilva.dev ou github.com/mariasilva"
                  />
                </div>
              </div>
            </div>

            {/* Summary Card with AI Impact Helper */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Resumo Profissional Estratégico
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onOpenAiTailor}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Otimizar com IA</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={cv.summary}
                onChange={(e) => onChange({ ...cv, summary: e.target.value })}
                className="w-full text-xs sm:text-[13px] leading-relaxed p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 resize-y"
                placeholder="Ex: Executivo sénior com mais de 12 anos de experiência liderando operações e transformação digital em empresas multinacionais. Histórico comprovado de aumento de 35% na produtividade e gestão de orçamentos superiores a $5M..."
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {cv.summary ? cv.summary.trim().split(/\s+/).length : 0} palavras · Recomendado: 50 a 85 palavras
                </span>
                <span className={cv.summary.length >= 100 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                  {cv.summary.length >= 100 ? '✓ Extensão Executiva Ideal' : '⚠️ Adicione mais detalhes de impacto'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CARREIRA (Experiências, Formação Académica, Certificações) */}
        {/* ========================================================================= */}
        {activeTab === 'career' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Experience Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Experiência Profissional
                    </h3>
                    <p className="text-[10px] text-slate-500">Ordem cronológica inversa com realizações mensuráveis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Cargo</span>
                </button>
              </div>

              {cv.experiences.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Nenhum cargo registado</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Adicione a sua experiência profissional para valorizar o currículo.</p>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    + Adicionar Primeira Experiência
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cv.experiences.map((exp, expIdx) => (
                    <div key={exp.id || expIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      {/* Item Header Toolbar */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                            {expIdx + 1}
                          </span>
                          <span>{exp.role || 'Cargo'} — {exp.company || 'Empresa'}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveExperienceUp(expIdx)}
                            disabled={expIdx === 0}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExperienceDown(expIdx)}
                            disabled={expIdx === cv.experiences.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateExperience(expIdx)}
                            className="p-1 text-slate-500 hover:text-blue-600"
                            title="Duplicar cargo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(expIdx)}
                            className="p-1 text-slate-500 hover:text-rose-600"
                            title="Eliminar cargo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Empresa / Instituição</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(expIdx, { ...exp, company: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                            placeholder="Ex: Banco BAI / Sonangol / Google"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Cargo / Função</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(expIdx, { ...exp, role: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                            placeholder="Ex: Diretor de Operações"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Período / Ano</label>
                          <input
                            type="text"
                            value={exp.period}
                            onChange={(e) => handleUpdateExperience(expIdx, { ...exp, period: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                            placeholder="Ex: 2021 – Presente"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Localização (Opcional)</label>
                          <input
                            type="text"
                            value={exp.location || ''}
                            onChange={(e) => handleUpdateExperience(expIdx, { ...exp, location: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                            placeholder="Ex: Luanda, Angola / Híbrido"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Projeto / Financiador / Cliente (Opcional)</label>
                          <input
                            type="text"
                            value={exp.donor || ''}
                            onChange={(e) => handleUpdateExperience(expIdx, { ...exp, donor: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                            placeholder="Ex: Financiamento Banco Mundial / USAID / Contrato Estratégico"
                          />
                        </div>
                      </div>

                      {/* Highlights / Bullet Points */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Realizações de Alto Impacto
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSuggestXyzBullet(expIdx)}
                              className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1"
                              title="Gerar sugestão executiva no padrão Google XYZ"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Fórmula XYZ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddHighlight(expIdx)}
                              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Ponto</span>
                            </button>
                          </div>
                        </div>

                        {exp.highlights.map((h, hIdx) => (
                          <div key={hIdx} className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <span className="text-slate-400 mt-2 font-bold">•</span>
                              <textarea
                                rows={2}
                                value={h}
                                onChange={(e) => handleUpdateHighlight(expIdx, hIdx, e.target.value)}
                                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                                placeholder="Descreva a realização começando por verbo de ação forte e métrica quantitativa..."
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
                                  className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                  title="Sugerir verbo de ação executivo"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Remover ponto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Action Verb Helper Dropdown for Highlight */}
                            {verbMenuTarget?.expIdx === expIdx && verbMenuTarget?.hIdx === hIdx && (
                              <div className="ml-4 p-2 bg-white border border-amber-300 rounded-lg shadow-sm text-xs space-y-1.5 animate-in fade-in duration-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                                  Verbos de Ação Executivos (Clique para aplicar):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {EXECUTIVE_ACTION_VERBS[0].verbs.concat(EXECUTIVE_ACTION_VERBS[1].verbs).slice(0, 10).map((verb) => (
                                    <button
                                      key={verb}
                                      type="button"
                                      onClick={() => handleApplyVerbToHighlight(verb)}
                                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                                    >
                                      {verb}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Formação Académica
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Curso</span>
                </button>
              </div>

              {cv.educations.map((edu, eduIdx) => (
                <div key={edu.id || eduIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {edu.degree || 'Grau Académico'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveEducationUp(eduIdx)}
                        disabled={eduIdx === 0}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveEducationDown(eduIdx)}
                        disabled={eduIdx === cv.educations.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(eduIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, degree: e.target.value })}
                      placeholder="Grau (ex: Licenciatura em Engenharia Informática)"
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, institution: e.target.value })}
                      placeholder="Instituição (ex: Universidade Agostinho Neto / IST)"
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                    />
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, period: e.target.value })}
                      placeholder="Período (ex: 2018 – 2022)"
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none font-mono"
                    />
                    <input
                      type="text"
                      value={edu.gpaOrHonors || ''}
                      onChange={(e) => handleUpdateEducation(eduIdx, { ...edu, gpaOrHonors: e.target.value })}
                      placeholder="Honras / Distinção (ex: Média 17/20, Magna Cum Laude)"
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Certificações & Cursos Especializados
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddTraining}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-2">
                {cv.trainings.map((t, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={t}
                      onChange={(e) => handleUpdateTraining(tIdx, e.target.value)}
                      placeholder="Certificação (ex: PMP® Project Management Professional - PMI, 2023)"
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTraining(tIdx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COMPETÊNCIAS & IDIOMAS (Skills, Languages, References) */}
        {/* ========================================================================= */}
        {activeTab === 'skills' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Competencies with Interactive Suggestions Cloud */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Competências Chave & Ferramentas
                    </h3>
                    <p className="text-[10px] text-slate-500">Agrupadas por categorias técnicas e gerenciais</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSkillClusters(!showSkillClusters)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{showSkillClusters ? 'Ocultar Sugestões' : 'Sugestões Rápidas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCompetency}
                    className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Expandable Suggestions Cloud */}
              {showSkillClusters && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    💡 Clique em qualquer competência executiva para adicionar imediatamente ao CV:
                  </div>
                  <div className="space-y-2.5">
                    {POPULAR_COMPETENCY_CLUSTERS.map((cluster) => (
                      <div key={cluster.title}>
                        <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
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
                                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                                  isAdded
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                    : 'bg-white hover:bg-amber-100 text-slate-800 border-amber-200 hover:border-amber-300'
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
                  <div key={comp.id || cIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{comp.category || 'Competência'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompetency(cIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={comp.category}
                        onChange={(e) => handleUpdateCompetency(cIdx, { ...comp, category: e.target.value })}
                        placeholder="Categoria (ex: Gestão de Projetos & P&L)"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none font-semibold text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={comp.description}
                        onChange={(e) => handleUpdateCompetency(cIdx, { ...comp, description: e.target.value })}
                        placeholder="Detalhes, ferramentas e metodologias dominadas..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Idiomas & Nível CEFR
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Idioma</span>
                </button>
              </div>

              <div className="space-y-2">
                {cv.languages.map((l, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={l.language}
                      onChange={(e) => handleUpdateLanguage(lIdx, e.target.value, l.level)}
                      placeholder="Idioma (ex: Inglês)"
                      className="w-1/2 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none font-semibold"
                    />
                    <input
                      type="text"
                      value={l.level}
                      onChange={(e) => handleUpdateLanguage(lIdx, l.language, e.target.value)}
                      placeholder="Nível (ex: Fluente / C2 / Nativo)"
                      className="w-1/2 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteLanguage(lIdx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* References Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Referências Profissionais
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddReference}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Referência</span>
                </button>
              </div>

              <div className="space-y-3">
                {cv.references.map((ref, rIdx) => (
                  <div key={ref.id || rIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{ref.name || 'Referência'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteReference(rIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, name: e.target.value })}
                        placeholder="Nome Completo"
                        className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                      />
                      <input
                        type="text"
                        value={ref.institutionAndPosition}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, institutionAndPosition: e.target.value })}
                        placeholder="Instituição & Cargo"
                        className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                      />
                      <input
                        type="text"
                        value={ref.contact}
                        onChange={(e) => handleUpdateReference(rIdx, { ...ref, contact: e.target.value })}
                        placeholder="Contacto (E-mail / Telefone)"
                        className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SECÇÕES & ORDEM (Reorder & Toggle Visibility) */}
        {/* ========================================================================= */}
        {activeTab === 'structure' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Personalizar Estrutura & Ordem</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reordene ou oculte secções para adaptar o currículo à sua candidatura
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSectionOrder}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1"
                  title="Restaurar ordem predefinida oficial"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
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
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isVisible
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{meta.name}</h4>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                isVisible
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {isVisible ? 'Visível' : 'Oculto'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{meta.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                          title="Mover secção para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                          title="Mover secção para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sectionKey)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isVisible
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300'
                          }`}
                          title={isVisible ? 'Ocultar secção no currículo' : 'Tornar secção visível'}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-700" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MODELOS & PRESETS (Template Catalog & Preset CVs) */}
        {/* ========================================================================= */}
        {activeTab === 'presets' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Predefinições de Currículo & Backup</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Carregue perfis de exemplo, exporte uma cópia de segurança JSON ou inicie do zero
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja carregar o perfil de exemplo executivo?')) {
                      onChange(GENERIC_DEFAULT_CV);
                    }
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-900">Exemplo Executivo Padrão</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Perfil completo com métricas, competências e referências
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja carregar o perfil de exemplo internacional?')) {
                      onChange(AGOSTINHO_CV);
                    }
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-900">Exemplo C-Level / COO</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Histórico executivo sénior para posições de alta liderança
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Tem a certeza que deseja limpar todo o conteúdo para começar do zero?')) {
                      onChange(BLANK_CV);
                    }
                  }}
                  className="p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-rose-900">Limpar Conteúdo (Em Branco)</p>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">
                    Remove todos os dados para preencher um novo currículo
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-900">Descarregar Backup JSON</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Guarde o arquivo para restaurar noutro computador
                  </p>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Restaurar a partir de arquivo JSON:</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
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
          </div>
        )}
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
