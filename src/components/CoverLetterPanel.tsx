import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { Sparkles, Copy, Check, Printer, Loader2, Download } from 'lucide-react';
import { generateCoverLetterDocx, triggerDownload } from '../utils/docxExport';

interface CoverLetterPanelProps {
  cv: CVData;
  jobDescription: string;
  letterBody: string;
  setLetterBody: (body: string) => void;
  onExportWord?: () => void;
  isExportingWord?: boolean;
}

export const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  cv,
  jobDescription,
  letterBody,
  setLetterBody,
  onExportWord,
  isExportingWord: externalExporting
}) => {
  const [recipient, setRecipient] = useState<string>('Estimados Membros do Comité de Seleção');
  const [organization, setOrganization] = useState<string>(
    'Expertise France / Delegação da União Europeia em Angola'
  );
  const [positionTitle, setPositionTitle] = useState<string>(
    'MEAL & Information Systems Coordinator'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingInternal, setIsExportingInternal] = useState<boolean>(false);

  const isExportingDocx = externalExporting ?? isExportingInternal;

  const handleExportDocx = async () => {
    if (onExportWord) {
      onExportWord();
      return;
    }
    setIsExportingInternal(true);
    try {
      const blob = await generateCoverLetterDocx(cv, letterBody);
      const sanitizedName = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Candidato';
      triggerDownload(blob, `Carta_Apresentacao_${sanitizedName}.docx`);
    } catch (e) {
      console.error('Erro ao gerar carta em Word:', e);
      alert('Erro ao gerar documento Word da carta.');
    } finally {
      setIsExportingInternal(false);
    }
  };

  const handleGenerateAiLetter = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: cv,
          jobDescription,
          recipientName: recipient,
          organizationName: organization
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.letterBody) {
          setLetterBody(data.letterBody);
        }
      }
    } catch (e) {
      console.warn('Cover letter AI fetch failed, using tailored template:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Configuration Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Carta de Apresentação / Motivação Estratégica
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Personalizada para a instituição alvo com referência direta às suas principais conquistas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Download Word (.docx) */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              title="Descarregar Carta de Apresentação em formato Word (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingDocx ? 'A Gerar .docx...' : 'Descarregar Word (.docx)'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAiLetter}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Regerar c/ IA</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Instituição / Agência Alvo
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cargo da Vaga
            </label>
            <input
              type="text"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Destinatário Formal
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Letter Canvas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          Corpo da Carta (Editável em tempo real)
        </label>
        <textarea
          rows={18}
          value={letterBody}
          onChange={(e) => setLetterBody(e.target.value)}
          className="w-full text-[13.5px] leading-relaxed p-4 border border-slate-200 rounded-lg font-serif-cv text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
        />
      </div>
    </div>
  );
};
