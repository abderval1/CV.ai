import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { Printer, Copy, Check, ZoomIn, ZoomOut, Edit3, Eye } from 'lucide-react';

interface CVDocumentViewProps {
  cv: CVData;
  onChange: (updatedCV: CVData) => void;
  onExportWord: () => void;
  isExportingWord: boolean;
}

export const CVDocumentView: React.FC<CVDocumentViewProps> = ({
  cv,
  onChange,
  onExportWord,
  isExportingWord
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPlainText = () => {
    const text = [
      cv.personalDetails.name,
      cv.personalDetails.title,
      `${cv.personalDetails.location} | ${cv.personalDetails.phone} | ${cv.personalDetails.email} | ${cv.personalDetails.linkedin}`,
      '\nSUMMARY',
      cv.summary,
      '\nCORE COMPETENCIES',
      ...cv.competencies.map((c) => `• ${c.category}: ${c.description}`),
      '\nPROFESSIONAL EXPERIENCE',
      ...cv.experiences.map((exp) =>
        [
          exp.company,
          `${exp.role} | ${exp.period}`,
          exp.donor ? `(${exp.donor})` : '',
          ...exp.highlights.map((h) => `• ${h}`)
        ]
          .filter(Boolean)
          .join('\n')
      ),
      '\nEDUCATION',
      ...cv.educations.map((e) => `• ${e.degree} — ${e.institution} (${e.period})`),
      '\nSPECIALIZED TRAINING',
      ...cv.trainings.map((t) => `• ${t}`),
      '\nLANGUAGES',
      cv.languages.map((l) => `• ${l.language}: ${l.level}`).join('  |  '),
      '\nREFERENCES',
      ...cv.references.map((r) => `${r.name} - ${r.institutionAndPosition} (${r.contact})`)
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="text-slate-900 underline font-semibold hover:text-blue-700"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const setStyle = (style: 'un_classic' | 'european_modern' | 'ats_compact') => {
    onChange({ ...cv, templateStyle: style });
  };

  // Font styling according to template
  const isClassic = cv.templateStyle === 'un_classic';
  const isModern = cv.templateStyle === 'european_modern';

  return (
    <div className="flex flex-col h-full">
      {/* Top Controls Toolbar for the Document Preview */}
      <div className="no-print bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Style Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setStyle('un_classic')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isClassic
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ONU / UE Clássico
          </button>
          <button
            type="button"
            onClick={() => setStyle('european_modern')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              isModern
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moderno Institucional
          </button>
          <button
            type="button"
            onClick={() => setStyle('ats_compact')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              cv.templateStyle === 'ats_compact'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ATS Puro
          </button>
        </div>

        {/* View and Export Options */}
        <div className="flex items-center gap-2">
          {/* Inline Edit Toggle */}
          <button
            type="button"
            onClick={() => setIsInlineEditing(!isInlineEditing)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isInlineEditing
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Ativar/desativar edição rápida clicando diretamente no texto"
          >
            {isInlineEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isInlineEditing ? 'Pré-visualizar' : 'Editar no Documento'}
            </span>
          </button>

          {/* Zoom In/Out */}
          <div className="hidden lg:flex items-center gap-1 border border-slate-200 rounded-md bg-white p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono tabular-nums text-slate-600 px-1">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
            title="Copiar texto puro para formulários de candidatura"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          {/* Print / Save PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Document Workspace Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 lg:p-8 flex justify-center">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="w-full max-w-[850px]"
        >
          {/* Printable A4 Paper Container */}
          <article
            className={`cv-a4-sheet bg-white text-slate-900 shadow-md border border-slate-200/80 p-8 sm:p-12 transition-all min-h-[1120px] ${
              isClassic
                ? 'font-serif-cv'
                : cv.templateStyle === 'ats_compact'
                ? 'font-mono-code text-[13px] leading-relaxed'
                : 'font-sans'
            }`}
          >
            {/* Header Section */}
            <header className="text-center pb-3">
              <h1
                contentEditable={isInlineEditing}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onChange({
                    ...cv,
                    personalDetails: { ...cv.personalDetails, name: e.currentTarget.textContent || '' }
                  })
                }
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase"
              >
                {cv.personalDetails.name}
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
                className="text-sm sm:text-base font-semibold text-slate-700 mt-1"
              >
                {cv.personalDetails.title}
              </div>

              <div className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span>{cv.personalDetails.location}</span>
                <span aria-hidden="true">|</span>
                <span>{cv.personalDetails.phone}</span>
                <span aria-hidden="true">|</span>
                <a
                  href={`mailto:${cv.personalDetails.email}`}
                  className="hover:underline text-slate-800"
                >
                  {cv.personalDetails.email}
                </a>
                <span aria-hidden="true">|</span>
                <span>{cv.personalDetails.linkedin}</span>
              </div>
            </header>

            {/* Section: Summary */}
            <section className="mt-5">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Summary
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

            {/* Section: Core Competencies */}
            <section className="mt-5">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Core Competencies & Key Skills
              </h2>
              <ul className="space-y-1.5 text-[13.5px] sm:text-[14px] text-slate-800">
                {cv.competencies.map((comp, idx) => (
                  <li key={comp.id || idx} className="flex items-start">
                    <span className="mr-2 text-slate-500">•</span>
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

            {/* Section: Professional Experience */}
            <section className="mt-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                Professional Experience
              </h2>

              <div className="space-y-5">
                {cv.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    {/* Organization */}
                    <div className="text-[14.5px] font-bold text-slate-900">
                      {exp.company}
                    </div>

                    {/* Role & Date */}
                    <div className="text-[13.5px] font-semibold text-slate-800 flex flex-wrap justify-between items-center gap-1">
                      <span>{exp.role}</span>
                      <span className="font-normal text-slate-600 text-xs sm:text-[13px]">
                        {exp.period}
                      </span>
                    </div>

                    {/* Donor information */}
                    {exp.donor && (
                      <div className="text-xs italic text-slate-600">
                        {renderTextWithLinks(exp.donor)}
                      </div>
                    )}

                    {/* Bullet Highlights */}
                    <ul className="mt-1.5 space-y-1.5 text-[13px] sm:text-[13.5px] text-slate-800">
                      {exp.highlights.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start">
                          <span className="mr-2 text-slate-500">•</span>
                          <span className="leading-relaxed">{renderTextWithLinks(pt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Education */}
            <section className="mt-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Education
              </h2>
              <div className="space-y-1.5 text-[13.5px] text-slate-800">
                {cv.educations.map((edu) => (
                  <div key={edu.id}>
                    <strong className="font-semibold text-slate-900">{edu.degree}</strong>
                    <span> — {edu.institution} ({edu.period})</span>
                    {edu.gpaOrHonors && (
                      <span className="text-slate-600 text-xs ml-1">
                        [{edu.gpaOrHonors}]
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Specialized Training */}
            <section className="mt-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Specialized Training & Professional Development
              </h2>
              <ul className="space-y-1 text-[13px] text-slate-800">
                {cv.trainings.map((t, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-slate-500">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section: Languages */}
            <section className="mt-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Languages
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-800">
                {cv.languages.map((l, idx) => (
                  <div key={idx}>
                    <strong className="font-semibold text-slate-900">
                      • {l.language}:
                    </strong>{' '}
                    <span>{l.level}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: References (Classical UN Table format) */}
            <section className="mt-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                References
              </h2>

              <div className="border border-slate-300 overflow-hidden text-left text-[12.5px] sm:text-[13px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-slate-900">
                      <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[30%]">
                        Name
                      </th>
                      <th className="p-2 sm:p-2.5 font-bold border-r border-slate-300 w-[45%]">
                        Institution & Position
                      </th>
                      <th className="p-2 sm:p-2.5 font-bold w-[25%]">Contact</th>
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
          </article>
        </div>
      </div>
    </div>
  );
};
