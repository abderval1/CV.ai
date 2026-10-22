import React, { useState, useRef } from 'react';
import { CVData, TemplateStyle } from '../types/cv';
import {
  Download,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Edit3,
  Eye,
  Camera,
  Info,
  ShieldCheck,
  Globe,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { TemplateSelectorDropdown } from './TemplateSelectorDropdown';
import { TemplateAdvisorModal } from './TemplateAdvisorModal';
import { PhotoManagerModal } from './PhotoManagerModal';
import { getTemplateById } from '../data/templateCatalog';

interface CVDocumentViewProps {
  cv: CVData;
  onChange: (updatedCV: CVData) => void;
  onExportWord: () => void;
  isExportingWord: boolean;
}

const ACCENT_COLORS = [
  { id: 'slate', name: 'Grafite Executivo', hex: '#0f172a' },
  { id: 'navy', name: 'Azul Corporativo Global', hex: '#1e3a8a' },
  { id: 'blue', name: 'Azul Europeu Europass', hex: '#1d4ed8' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#065f46' },
  { id: 'purple', name: 'Púrpura Criativo', hex: '#7c3aed' },
  { id: 'burgundy', name: 'Harvard Burgundy', hex: '#831843' },
  { id: 'teal', name: 'Teal Corporativo', hex: '#0f766e' }
];

export const CVDocumentView: React.FC<CVDocumentViewProps> = ({
  cv,
  onChange,
  onExportWord,
  isExportingWord
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [jsonImportSuccess, setJsonImportSuccess] = useState<string | null>(null);
  const [docLang, setDocLang] = useState<'pt' | 'en'>('pt');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAccent = cv.accentColor || '#0f172a';
  const currentTemplate = getTemplateById(cv.templateStyle);

  const sectionTitles = {
    summary: docLang === 'pt' ? 'Resumo Profissional' : 'Executive Summary',
    competencies: docLang === 'pt' ? 'Competências & Habilidades Chave' : 'Core Competencies & Key Skills',
    experiences: docLang === 'pt' ? 'Experiência Profissional' : 'Professional Experience',
    educations: docLang === 'pt' ? 'Formação Académica' : 'Education',
    trainings: docLang === 'pt' ? 'Certificações & Formação Especializada' : 'Specialized Training & Certifications',
    languages: docLang === 'pt' ? 'Idiomas & Proficiência' : 'Languages & Proficiency',
    references: docLang === 'pt' ? 'Referências Profissionais' : 'Professional References',
    tableRefName: docLang === 'pt' ? 'Nome' : 'Name',
    tableRefInstitution: docLang === 'pt' ? 'Instituição & Cargo' : 'Institution & Position',
    tableRefContact: docLang === 'pt' ? 'Contacto' : 'Contact',
    techStack: docLang === 'pt' ? 'Stack Tecnológico & Ferramentas' : 'Technical Stack & Tools',
    cefrLevel: docLang === 'pt' ? 'Quadro Europeu CEFR' : 'CEFR Framework'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPlainText = () => {
    const text = [
      cv.personalDetails.name,
      cv.personalDetails.title,
      `${cv.personalDetails.location} | ${cv.personalDetails.phone} | ${cv.personalDetails.email}`,
      cv.personalDetails.linkedin ? `LinkedIn: ${cv.personalDetails.linkedin}` : '',
      cv.personalDetails.website ? `Website: ${cv.personalDetails.website}` : '',
      `\n${sectionTitles.summary.toUpperCase()}`,
      cv.summary,
      `\n${sectionTitles.competencies.toUpperCase()}`,
      ...cv.competencies.map((c) => `• ${c.category}: ${c.description}`),
      `\n${sectionTitles.experiences.toUpperCase()}`,
      ...cv.experiences.map((exp) =>
        [
          exp.company + (exp.location ? ` - ${exp.location}` : ''),
          `${exp.role} (${exp.period})`,
          exp.donor ? `Projeto/Financiador: ${exp.donor}` : '',
          ...exp.highlights.map((h) => `• ${h}`)
        ]
          .filter(Boolean)
          .join('\n')
      ),
      `\n${sectionTitles.educations.toUpperCase()}`,
      ...cv.educations.map((edu) => `${edu.degree} - ${edu.institution} (${edu.period})`),
      `\n${sectionTitles.languages.toUpperCase()}`,
      ...cv.languages.map((l) => `• ${l.language}: ${l.level}`)
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cv, null, 2));
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
          setJsonImportSuccess('Currículo importado do backup JSON com sucesso!');
          setTimeout(() => setJsonImportSuccess(null), 3000);
        } else {
          alert('Arquivo JSON com estrutura inválida.');
        }
      } catch {
        alert('Erro ao processar ficheiro JSON.');
      }
    };
    reader.readAsText(file);
  };

  const renderTextWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:opacity-80"
            style={{ color: currentAccent }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const setStyle = (style: TemplateStyle) => {
    onChange({ ...cv, templateStyle: style });
  };

  const setAccentColor = (hex: string) => {
    onChange({ ...cv, accentColor: hex });
    setShowColorPicker(false);
  };

  // Template Style Flags
  const isClassic = cv.templateStyle === 'un_classic';
  const isHarvard = cv.templateStyle === 'executive_harvard';
  const isAts = cv.templateStyle === 'ats_compact';
  const isEuropass = cv.templateStyle === 'european_europass';
  const isCreative = cv.templateStyle === 'creative_split';
  const isTech = cv.templateStyle === 'tech_modern';
  const isMinimalist = cv.templateStyle === 'hybrid_minimalist';
  const isAcademic = cv.templateStyle === 'academic_lattes';
  const isModern = cv.templateStyle === 'european_modern';

  // Photo Logic:
  // Show photo only if template permits it AND user has configured a photo AND showPhoto is not false
  const templateSupportsPhoto = isEuropass || isCreative || isMinimalist;
  const hasUserPhoto = Boolean(cv.personalDetails.photoUrl);
  const shouldRenderPhoto = templateSupportsPhoto && hasUserPhoto && cv.personalDetails.showPhoto !== false;

  // Has photo configured but current template strictly bans it (educational ATS alert)
  const isPhotoSuppressedForAts = hasUserPhoto && !templateSupportsPhoto;

  return (
    <div className="flex flex-col h-full">
      {/* Top Controls Toolbar for the Document Preview */}
      <div className="no-print bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left Side: Modern Template Selector Dropdown & Advisor Trigger */}
        <div className="flex items-center gap-2">
          <TemplateSelectorDropdown
            currentStyle={cv.templateStyle}
            onSelectStyle={setStyle}
            onOpenAdvisorModal={() => setIsAdvisorModalOpen(true)}
          />

          {/* Photo Manager Button */}
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              shouldRenderPhoto
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : hasUserPhoto
                ? 'bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Adicionar ou alterar fotografia do currículo"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">
              {hasUserPhoto ? (shouldRenderPhoto ? 'Foto Ativa' : 'Foto Ocultada') : 'Adicionar Foto'}
            </span>
            {hasUserPhoto && (
              <span className={`w-1.5 h-1.5 rounded-full ${shouldRenderPhoto ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            )}
          </button>
        </div>

        {/* Right Side: View and Export Options */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Accent Color Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Cor de Destaque do Documento"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: currentAccent }}
              />
              <span className="hidden xl:inline text-[11px]">Cor</span>
            </button>

            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    Tom Executivo
                  </div>
                  <div className="space-y-1">
                    {ACCENT_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setAccentColor(col.hex)}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs rounded hover:bg-slate-50 text-slate-800"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </span>
                        {currentAccent === col.hex && <Check className="w-3 h-3 text-slate-900" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Document Language Toggle (PT / EN) */}
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setDocLang('pt')}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                docLang === 'pt'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Cabeçalhos e termos do documento em Português"
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setDocLang('en')}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                docLang === 'en'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Document headers and terms in English (International standard)"
            >
              EN
            </button>
          </div>

          {/* Inline Edit Toggle */}
          <button
            type="button"
            onClick={() => setIsInlineEditing(!isInlineEditing)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isInlineEditing
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Ativar/desativar edição direta clicando no texto do documento"
          >
            {isInlineEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isInlineEditing ? 'Pré-visualizar' : 'Editar no Documento'}
            </span>
          </button>

          {/* Zoom In/Out - Accessible on all screen sizes */}
          <div className="flex items-center gap-0.5 border border-slate-200 rounded-md bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="text-[11px] font-mono tabular-nums text-slate-700 hover:text-slate-950 px-1 font-semibold"
              title="Clique para restaurar 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopyPlainText}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
            title="Copiar texto puro para formulários de candidatura online"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          {/* JSON Backup / Restore */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
            title="Descarregar cópia de segurança em formato JSON"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
            title="Imprimir ou Guardar em PDF A4 sem marcas de água"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>PDF / Imprimir</span>
          </button>

          {/* Word Export Button */}
          <button
            type="button"
            onClick={onExportWord}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors shadow-xs"
            title="Exportar documento no formato nativo Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Strategic Educational Banner when photo is suppressed in strict ATS models */}
      {isPhotoSuppressedForAts && (
        <div className="no-print bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Proteção ATS Ativa:</strong> O modelo{' '}
              <strong className="text-white">{currentTemplate.name}</strong> oculta a foto para garantir 100% de aprovação nas triagens dos EUA/UK e Workday.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStyle('european_europass')}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 shrink-0 ml-2"
          >
            Mudar para Modelo Europeu (Com Foto) →
          </button>
        </div>
      )}

      {/* JSON Import Notification Toast */}
      {jsonImportSuccess && (
        <div className="no-print bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{jsonImportSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setJsonImportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Document Workspace Canvas */}
      <div className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-6 lg:p-8 flex justify-center">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="w-full max-w-[850px]"
        >
          {/* CASE 1: Creative Split Two-Column Layout */}
          {isCreative ? (
            <article className="cv-a4-sheet bg-white text-slate-900 shadow-xl border border-slate-300/80 min-h-[1120px] flex flex-col md:flex-row relative font-jakarta overflow-hidden">
              {/* Left Sidebar (35% width) */}
              <aside
                className="w-full md:w-[35%] p-6 sm:p-8 text-white flex flex-col justify-between"
                style={{ backgroundColor: currentAccent }}
              >
                <div>
                  {/* Photo in Sidebar */}
                  {shouldRenderPhoto ? (
                    <div className="mb-5 flex justify-center md:justify-start">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white/20 shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold tracking-wider uppercase">
                      Criativo & Inovação
                    </div>
                  )}

                  <h1
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight"
                  >
                    {cv.personalDetails.name || 'SEU NOME'}
                  </h1>

                  <div
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onChange({
                        ...cv,
                        personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                      })
                    }
                    className="text-xs sm:text-sm font-medium text-white/90 mt-1 opacity-95"
                  >
                    {cv.personalDetails.title}
                  </div>

                  {/* Sidebar Contact Block */}
                  <div className="mt-6 pt-5 border-t border-white/20 space-y-2.5 text-xs text-white/90">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      Contactos & Redes
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">Localização</span>
                      <span className="font-medium">{cv.personalDetails.location}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">Telefone / WhatsApp</span>
                      <span className="font-medium font-mono">{cv.personalDetails.phone}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/60">E-mail</span>
                      <span className="font-medium break-all">{cv.personalDetails.email}</span>
                    </div>
                    {cv.personalDetails.linkedin && (
                      <div>
                        <span className="block text-[10px] text-white/60">LinkedIn</span>
                        <span className="font-medium break-all">{cv.personalDetails.linkedin}</span>
                      </div>
                    )}
                    {cv.personalDetails.website && (
                      <div>
                        <span className="block text-[10px] text-white/60">Website / Portfólio</span>
                        <span className="font-medium break-all">{cv.personalDetails.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Skills / Competencies */}
                  {cv.competencies && cv.competencies.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2.5">
                        Competências & Tools
                      </div>
                      <div className="space-y-2">
                        {cv.competencies.map((c, i) => (
                          <div key={c.id || i} className="bg-white/10 rounded-lg p-2 text-xs">
                            <span className="font-bold block text-white">{c.category}</span>
                            <span className="text-[11px] text-white/80 line-clamp-2">{c.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Languages */}
                  {cv.languages && cv.languages.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">
                        Idiomas
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {cv.languages.map((l, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="font-bold text-white">{l.language}</span>
                            <span className="text-[11px] text-white/80">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 text-[10px] text-white/60 text-center">
                  Modelo Criativo Split · 2026
                </div>
              </aside>

              {/* Right Main Column (65% width) */}
              <main className="w-full md:w-[65%] p-6 sm:p-10 space-y-6">
                {/* Summary */}
                {cv.summary && (
                  <section>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                      style={{ color: currentAccent, borderColor: currentAccent }}
                    >
                      {sectionTitles.summary}
                    </h2>
                    <p
                      contentEditable={isInlineEditing}
                      suppressContentEditableWarning
                      onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                      className="text-xs sm:text-[13.5px] leading-relaxed text-slate-800 text-justify"
                    >
                      {cv.summary}
                    </p>
                  </section>
                )}

                {/* Experiences */}
                {cv.experiences && cv.experiences.length > 0 && (
                  <section>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                      style={{ color: currentAccent, borderColor: currentAccent }}
                    >
                      {sectionTitles.experiences}
                    </h2>

                    <div className="space-y-4">
                      {cv.experiences.map((exp) => (
                        <div key={exp.id} className="relative pl-3 border-l-2 border-slate-200 space-y-1">
                          <div className="flex flex-wrap justify-between items-baseline gap-1">
                            <span className="text-[14px] font-bold text-slate-900">{exp.company}</span>
                            <span className="text-xs font-mono text-slate-500">{exp.period}</span>
                          </div>
                          <div className="text-xs font-semibold" style={{ color: currentAccent }}>
                            {exp.role} {exp.location ? `· ${exp.location}` : ''}
                          </div>
                          {exp.donor && <div className="text-[11px] italic text-slate-500">{exp.donor}</div>}
                          <ul className="mt-1 space-y-1 text-xs text-slate-700">
                            {exp.highlights.map((pt, pIdx) => (
                              <li key={pIdx} className="flex items-start">
                                <span className="mr-1.5 text-slate-400">•</span>
                                <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education */}
                {cv.educations && cv.educations.length > 0 && (
                  <section>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                      style={{ color: currentAccent, borderColor: currentAccent }}
                    >
                      {sectionTitles.educations}
                    </h2>
                    <div className="space-y-2 text-xs">
                      {cv.educations.map((edu) => (
                        <div key={edu.id} className="flex justify-between items-baseline">
                          <div>
                            <strong className="text-slate-900">{edu.degree}</strong>
                            <span className="text-slate-600"> — {edu.institution}</span>
                          </div>
                          <span className="font-mono text-slate-500 text-[11px]">{edu.period}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Trainings */}
                {cv.trainings && cv.trainings.length > 0 && (
                  <section>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                      style={{ color: currentAccent, borderColor: currentAccent }}
                    >
                      {sectionTitles.trainings}
                    </h2>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {cv.trainings.map((t, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1.5 text-slate-400">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </main>
            </article>
          ) : (
            /* CASE 2: Single Column / Official Executive Layouts (Europass, Harvard, ATS, Corporativo, Tech, etc.) */
            <article
              className={`cv-a4-sheet bg-white text-slate-900 shadow-xl border border-slate-300/80 p-8 sm:p-12 transition-all min-h-[1120px] relative ${
                isClassic || isHarvard || isAcademic
                  ? 'font-serif-cv'
                  : isAts
                  ? 'font-mono-code text-[13px] leading-relaxed'
                  : 'font-jakarta'
              }`}
            >
              {/* Header Section */}
              <header
                className={`pb-4 ${
                  isHarvard
                    ? 'border-b-2 pb-4 text-left'
                    : isClassic
                    ? 'text-center border-b border-slate-200'
                    : isEuropass
                    ? 'border-b-2 pb-5'
                    : isModern || isTech
                    ? 'text-left border-b-2 pb-4'
                    : 'text-left pb-2'
                }`}
                style={{
                  borderColor: isModern || isHarvard || isEuropass || isTech ? currentAccent : '#e2e8f0'
                }}
              >
                <div
                  className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isClassic ? 'sm:justify-center' : ''
                  }`}
                >
                  {/* Left / Main text details */}
                  <div className={`flex-1 ${isClassic ? 'text-center' : 'text-left'}`}>
                    {/* European flag/official indicator in Europass */}
                    {isEuropass && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-700 text-white tracking-wider uppercase">
                          Curriculum Vitae Europass
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Padrão Oficial da União Europeia
                        </span>
                      </div>
                    )}

                    <h1
                      contentEditable={isInlineEditing}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        onChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                        })
                      }
                      className={`font-bold tracking-tight uppercase ${
                        isHarvard
                          ? 'text-2xl sm:text-3xl tracking-wide'
                          : isClassic
                          ? 'text-2xl sm:text-3xl'
                          : isEuropass
                          ? 'text-2xl sm:text-3xl font-extrabold'
                          : 'text-2xl sm:text-3xl tracking-tight'
                      }`}
                      style={{ color: currentAccent }}
                    >
                      {cv.personalDetails.name || 'SEU NOME COMPLETO'}
                    </h1>

                    <div
                      contentEditable={isInlineEditing}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        onChange({
                          ...cv,
                          personalDetails: { ...cv.personalDetails, title: e.currentTarget.textContent || '' }
                        })
                      }
                      className={`text-sm sm:text-base font-semibold mt-1 ${
                        isHarvard ? 'text-slate-700 italic' : 'text-slate-800'
                      }`}
                    >
                      {cv.personalDetails.title}
                    </div>

                    <div
                      className={`text-xs sm:text-[13px] text-slate-600 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 ${
                        isClassic ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{cv.personalDetails.location}</span>
                      <span aria-hidden="true" className="text-slate-400">|</span>
                      <span>{cv.personalDetails.phone}</span>
                      <span aria-hidden="true" className="text-slate-400">|</span>
                      <a
                        href={`mailto:${cv.personalDetails.email}`}
                        className="hover:underline text-slate-800"
                      >
                        {cv.personalDetails.email}
                      </a>
                      {cv.personalDetails.linkedin && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">|</span>
                          <span>{cv.personalDetails.linkedin}</span>
                        </>
                      )}
                      {cv.personalDetails.website && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">|</span>
                          <a
                            href={cv.personalDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-semibold"
                            style={{ color: currentAccent }}
                          >
                            {cv.personalDetails.website}
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Photo for European Europass or Minimalist */}
                  {shouldRenderPhoto && (
                    <div className="shrink-0 flex flex-col items-center">
                      <img
                        src={cv.personalDetails.photoUrl}
                        alt={cv.personalDetails.name}
                        className={`w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 shadow-sm ${
                          isEuropass
                            ? 'rounded-xl border-blue-600/60 p-0.5'
                            : 'rounded-full border-slate-300'
                        }`}
                      />
                      {isEuropass && (
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                          Foto Formal
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </header>

              {/* Section: Summary */}
              {cv.summary && (
                <section className="mt-5">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.summary}
                  </h2>
                  <p
                    contentEditable={isInlineEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => onChange({ ...cv, summary: e.currentTarget.textContent || '' })}
                    className="text-[13.5px] sm:text-[14px] leading-relaxed text-slate-800 text-justify"
                  >
                    {cv.summary}
                  </p>
                </section>
              )}

              {/* Section: Core Competencies */}
              {cv.competencies && cv.competencies.length > 0 && (
                <section className="mt-5">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.competencies}
                  </h2>
                  <ul className="space-y-1.5 text-[13.5px] sm:text-[14px] text-slate-800">
                    {cv.competencies.map((comp, idx) => (
                      <li key={comp.id || idx} className="flex items-start">
                        <span className="mr-2 text-slate-400 font-bold">•</span>
                        <div>
                          <strong className="font-semibold text-slate-900">
                            {comp.category}:
                          </strong>{' '}
                          <span>{comp.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Visual Page Break Guide for Standard 1st Page A4 Fold */}
              <div className="no-print page-break-line" title="A4 Page 1 / Page 2 Divider Guide">
                <span>Limite Recomendado de Página 1 (Padrão A4)</span>
              </div>

              {/* Section: Professional Experience */}
              {cv.experiences && cv.experiences.length > 0 && (
                <section className="mt-5">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-3 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.experiences}
                  </h2>

                  <div className="space-y-5">
                    {cv.experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        {/* Organization & Location */}
                        <div className="flex flex-wrap justify-between items-baseline gap-1">
                          <span className="text-[14.5px] font-bold text-slate-950">
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span className="text-xs text-slate-500 font-medium">
                              {exp.location}
                            </span>
                          )}
                        </div>

                        {/* Role & Date (Harvard standard places date right-aligned) */}
                        <div className="text-[13.5px] font-semibold text-slate-800 flex flex-wrap justify-between items-center gap-1">
                          <span className="italic">{exp.role}</span>
                          <span className="font-normal text-slate-600 text-xs sm:text-[13px] font-mono">
                            {exp.period}
                          </span>
                        </div>

                        {/* Donor / Project information if applicable */}
                        {exp.donor && (
                          <div className="text-xs italic text-slate-600">
                            {renderTextWithLinks(exp.donor)}
                          </div>
                        )}

                        {/* Bullet Highlights */}
                        <ul className="mt-1.5 space-y-1.5 text-[13px] sm:text-[13.5px] text-slate-800">
                          {exp.highlights.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start">
                              <span className="mr-2 text-slate-400 font-bold">•</span>
                              <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Education */}
              {cv.educations && cv.educations.length > 0 && (
                <section className="mt-6">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.educations}
                  </h2>
                  <div className="space-y-2 text-[13.5px] text-slate-800">
                    {cv.educations.map((edu) => (
                      <div key={edu.id} className="flex flex-wrap justify-between items-baseline gap-1">
                        <div>
                          <strong className="font-semibold text-slate-950">{edu.degree}</strong>
                          <span> — {edu.institution}</span>
                          {edu.gpaOrHonors && (
                            <span className="text-slate-600 text-xs ml-1 italic font-serif">
                              ({edu.gpaOrHonors})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-600 font-mono">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Specialized Training */}
              {cv.trainings && cv.trainings.length > 0 && (
                <section className="mt-6">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.trainings}
                  </h2>
                  <ul className="space-y-1 text-[13px] text-slate-800">
                    {cv.trainings.map((t, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 text-slate-400 font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Section: Languages (With CEFR Badges for Europass) */}
              {cv.languages && cv.languages.length > 0 && (
                <section className="mt-6">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-2 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.languages}
                  </h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-800">
                    {cv.languages.map((l, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <strong className="font-semibold text-slate-950">• {l.language}:</strong>
                        <span className="text-slate-700">{l.level}</span>
                        {isEuropass && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                            {idx === 0 ? 'C2/Nativo' : idx === 1 ? 'C1/Avançado' : 'B2'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: References */}
              {cv.references && cv.references.length > 0 && (
                <section className="mt-6">
                  <h2
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 mb-3 ${
                      isHarvard
                        ? 'border-b border-slate-900 font-serif-cv'
                        : 'border-b border-slate-300'
                    }`}
                    style={{ color: currentAccent }}
                  >
                    {sectionTitles.references}
                  </h2>

                  <div className="border border-slate-300 overflow-hidden text-left text-[12.5px] sm:text-[13px] rounded-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-900">
                          <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[30%]">
                            {sectionTitles.tableRefName}
                          </th>
                          <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[45%]">
                            {sectionTitles.tableRefInstitution}
                          </th>
                          <th className="p-2 sm:p-2.5 font-bold w-[25%]">{sectionTitles.tableRefContact}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cv.references.map((ref, idx) => (
                          <tr
                            key={ref.id || idx}
                            className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                          >
                            <td className="p-2 sm:p-2.5 font-bold border-r border-slate-200 border-t border-slate-200 align-top">
                              {ref.name}
                            </td>
                            <td className="p-2 sm:p-2.5 border-r border-slate-200 border-t border-slate-200 align-top whitespace-pre-line text-slate-700">
                              {ref.institutionAndPosition}
                            </td>
                            <td className="p-2 sm:p-2.5 border-t border-slate-200 align-top font-mono text-[11px] sm:text-xs text-slate-800 whitespace-pre-line">
                              {ref.contact}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Template Advisor Modal */}
      <TemplateAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        currentTemplateId={cv.templateStyle}
        onSelectTemplate={setStyle}
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
