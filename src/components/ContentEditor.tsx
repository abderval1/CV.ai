import React, { useState, useRef } from 'react';
import { CVData, Experience, Competency, Education, Reference, TemplateStyle } from '../types/cv';
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
  Globe
} from 'lucide-react';
import { GENERIC_DEFAULT_CV, AGOSTINHO_CV, BLANK_CV } from '../data/initialCV';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { getTemplateById } from '../data/templateCatalog';

interface ContentEditorProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  onOpenAiTailor: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  cv,
  onChange,
  onOpenAiTailor
}) => {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTemplate = getTemplateById(cv.templateStyle);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
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

  return (
    <div className="space-y-4">
      {/* Quick Action Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Editor Profissional de Conteúdo</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Altere qualquer secção. O documento A4 e a exportação em Word (.docx) atualizam em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange(GENERIC_DEFAULT_CV)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Carregar modelo executivo padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modelo Padrão</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiTailor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Otimizar c/ IA</span>
          </button>
        </div>
      </div>

      {/* Model & Strategy Advisory Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-10 rounded-full shrink-0"
            style={{ backgroundColor: currentTemplate.accentColor || '#0f172a' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {currentTemplate.name}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  currentTemplate.hasPhoto
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentTemplate.hasPhoto ? '📸 Com Foto' : '🛡️ Sem Foto (ATS)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {currentTemplate.whereToUse}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <TemplateSelectorDropdown
            currentStyle={cv.templateStyle}
            onSelectStyle={(newStyle) => onChange({ ...cv, templateStyle: newStyle })}
            onOpenAdvisorModal={() => setIsAdvisorOpen(true)}
          />
          <button
            type="button"
            onClick={() => setIsAdvisorOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
            title="Ver explicação de onde e quando usar cada modelo"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Accordion: 1. Informações Pessoais */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">1. Dados Pessoais & Contactos</span>
            {cv.personalDetails.photoUrl && (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="Foto configurada" />
            )}
          </div>
          {activeSection === 'personal' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'personal' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-4">
            {/* Photo Manager Card */}
            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {cv.personalDetails.photoUrl ? (
                    <img
                      src={cv.personalDetails.photoUrl}
                      alt={cv.personalDetails.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  {cv.personalDetails.photoUrl && cv.personalDetails.showPhoto !== false && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Fotografia de Perfil
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Europeu Europass & Criativo)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cv.personalDetails.photoUrl
                      ? cv.personalDetails.showPhoto !== false
                        ? 'Foto ativa no documento'
                        : 'Foto carregada mas oculta'
                      : 'Nenhuma foto carregada (recomendado para ATS/EUA/UK)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cv.personalDetails.photoUrl ? 'Gerir Foto' : 'Adicionar Foto'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome Completo
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Título Profissional Executivo
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Telefone / WhatsApp
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  E-mail Profissional
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  LinkedIn (ex: linkedin.com/in/abderval)
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
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Website / Portfólio / GitHub (Opcional)
                </label>
                <input
                  type="text"
                  value={cv.personalDetails.website || ''}
                  placeholder="https://seusite-ou-portfolio.com"
                  onChange={(e) =>
                    onChange({
                      ...cv,
                      personalDetails: { ...cv.personalDetails, website: e.target.value }
                    })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion: 2. Resumo Executivo (Summary) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('summary')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">2. Resumo Executivo (Summary)</span>
          {activeSection === 'summary' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'summary' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 mt-2">
              Dica: O resumo deve ter 4 a 6 linhas destacando senioridade, setores-chave (MEAL, UE, ONU), metodologias e impacto comprovado.
            </p>
            <textarea
              rows={5}
              value={cv.summary}
              onChange={(e) => onChange({ ...cv, summary: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Accordion: 3. Competências Chave (Core Competencies) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('competencies')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">3. Competências Principais</span>
            <span className="text-xs text-slate-400 font-normal">
              ({cv.competencies.length} categorias)
            </span>
          </div>
          {activeSection === 'competencies' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'competencies' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-3">
            <div className="space-y-3 mt-3">
              {cv.competencies.map((comp, idx) => (
                <div
                  key={comp.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 relative space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={comp.category}
                      placeholder="Nome da Competência (ex: Data Quality Assurance)"
                      onChange={(e) =>
                        handleUpdateCompetency(idx, { ...comp, category: e.target.value })
                      }
                      className="font-semibold text-xs text-slate-900 bg-white px-2.5 py-1.5 border border-slate-200 rounded w-full focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteCompetency(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remover competência"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={comp.description}
                    placeholder="Descrição das ferramentas e metodologias..."
                    onChange={(e) =>
                      handleUpdateCompetency(idx, { ...comp, description: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddCompetency}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Competência</span>
            </button>
          </div>
        )}
      </div>

      {/* Accordion: 4. Experiência Profissional */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('experiences')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">4. Experiência Profissional</span>
            <span className="text-xs text-slate-400 font-normal">
              ({cv.experiences.length} cargos)
            </span>
          </div>
          {activeSection === 'experiences' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'experiences' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-4">
            <div className="space-y-4 mt-3">
              {cv.experiences.map((exp, expIdx) => (
                <div
                  key={exp.id || expIdx}
                  className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={exp.company}
                        placeholder="Organização / Empresa (ex: Camões, I.P. – FRESAN)"
                        onChange={(e) =>
                          handleUpdateExperience(expIdx, { ...exp, company: e.target.value })
                        }
                        className="w-full font-bold text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.role}
                          placeholder="Cargo (ex: MEAL Information Systems Specialist)"
                          onChange={(e) =>
                            handleUpdateExperience(expIdx, { ...exp, role: e.target.value })
                          }
                          className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                        <input
                          type="text"
                          value={exp.period}
                          placeholder="Período (ex: 09/2023 – 11/2023 ou 2021 – Presente)"
                          onChange={(e) =>
                            handleUpdateExperience(expIdx, { ...exp, period: e.target.value })
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                      </div>

                      <input
                        type="text"
                        value={exp.donor || ''}
                        placeholder="Financiador / Projeto (ex: Financed by the European Union | Co-managed by Camões...)"
                        onChange={(e) =>
                          handleUpdateExperience(expIdx, { ...exp, donor: e.target.value })
                        }
                        className="w-full text-xs italic px-2.5 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(expIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remover cargo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Highlights Bullet points */}
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Realizações & Pontos de Impacto (Bullet Points)
                    </label>

                    {exp.highlights.map((pt, ptIdx) => (
                      <div key={ptIdx} className="flex items-start gap-2">
                        <span className="text-slate-400 text-xs mt-1.5">•</span>
                        <textarea
                          rows={2}
                          value={pt}
                          onChange={(e) =>
                            handleUpdateHighlight(expIdx, ptIdx, e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteHighlight(expIdx, ptIdx)}
                          className="p-1 text-slate-400 hover:text-rose-500 mt-1"
                          title="Remover ponto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddHighlight(expIdx)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Realização</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddExperience}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cargo / Experiência</span>
            </button>
          </div>
        )}
      </div>

      {/* Accordion: 5. Formação Académica (Education) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">5. Formação Académica</span>
          {activeSection === 'education' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'education' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-3">
            <div className="space-y-3 mt-3">
              {cv.educations.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center gap-2"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={edu.degree}
                      placeholder="Grau / Curso"
                      onChange={(e) =>
                        handleUpdateEducation(idx, { ...edu, degree: e.target.value })
                      }
                      className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      placeholder="Instituição"
                      onChange={(e) =>
                        handleUpdateEducation(idx, { ...edu, institution: e.target.value })
                      }
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={edu.period}
                      placeholder="Ano (ex: 2023 – 2025)"
                      onChange={(e) =>
                        handleUpdateEducation(idx, { ...edu, period: e.target.value })
                      }
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddEducation}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Formação Académica</span>
            </button>
          </div>
        )}
      </div>

      {/* Accordion: 6. Formações Especializadas & Idiomas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('training')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">6. Formações Especializadas & Idiomas</span>
          {activeSection === 'training' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'training' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-4">
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Formações Especializadas (um por linha)
              </label>
              <textarea
                rows={5}
                value={cv.trainings.join('\n')}
                onChange={(e) =>
                  onChange({
                    ...cv,
                    trainings: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-mono"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-600">
                Domínio de Idiomas
              </label>
              <div className="space-y-2">
                {cv.languages.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={l.language}
                      onChange={(e) => {
                        const langs = [...cv.languages];
                        langs[idx].language = e.target.value;
                        onChange({ ...cv, languages: langs });
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded"
                      placeholder="Idioma"
                    />
                    <input
                      type="text"
                      value={l.level}
                      onChange={(e) => {
                        const langs = [...cv.languages];
                        langs[idx].level = e.target.value;
                        onChange({ ...cv, languages: langs });
                      }}
                      className="text-xs px-2.5 py-1.5 border border-slate-200 rounded"
                      placeholder="Nível / Fluência"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion: 7. Referências Profissionais */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('references')}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">7. Referências Profissionais (Estilo ONU)</span>
          {activeSection === 'references' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeSection === 'references' && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-3">
            <div className="space-y-3 mt-3">
              {cv.references.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={ref.name}
                      placeholder="Nome do Avaliador / Supervisor"
                      onChange={(e) =>
                        handleUpdateReference(idx, { ...ref, name: e.target.value })
                      }
                      className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteReference(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={ref.institutionAndPosition}
                    placeholder="Instituição e Cargo"
                    onChange={(e) =>
                      handleUpdateReference(idx, {
                        ...ref,
                        institutionAndPosition: e.target.value
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    value={ref.contact}
                    placeholder="E-mail ou Telefone de Contacto"
                    onChange={(e) =>
                      handleUpdateReference(idx, { ...ref, contact: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddReference}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Referência</span>
            </button>
          </div>
        )}
      </div>

      {/* Template Advisor Modal */}
      <TemplateAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={(style) => onChange({ ...cv, templateStyle: style })}
        cv={cv}
        onUpdateCV={onChange}
      />

      {/* Photo Manager Modal */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        cv={cv}
        onChange={onChange}
      />
    </div>
  );
};
