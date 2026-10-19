import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { Sparkles, Copy, Check, Printer, Loader2 } from 'lucide-react';

interface CoverLetterPanelProps {
  cv: CVData;
  jobDescription: string;
}

export const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  cv,
  jobDescription
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

  // Default letter matching Agostinho do Rosário's high-stakes application
  const [letterBody, setLetterBody] = useState<string>(
    `A/C: Comité de Seleção e Recrutamento
${organization}
Luanda, Angola

Assunto: Candidatura ao posto de ${positionTitle}

Exmos. Senhores Membros do Comité de Seleção,

É com elevado interesse e sentido de compromisso que apresento a minha candidatura à posição de ${positionTitle}. Com sólida trajetória no desenho, operacionalização e automação de sistemas digitais de Monitoria, Avaliação, Prestação de Contas e Aprendizagem (MEAL), trago a experiência comprovada de atuação direta em programas de grande escala financiados pela União Europeia (como o Programa FRESAN, co-gerido pelo Camões, I.P., FAO e PNUD) e pelo Programa Alimentar Mundial das Nações Unidas (WFP) em Angola.

No âmbito da assistência técnica ao Camões, I.P., fui o responsável direto pela concepção, programação e entrada em produção da Plataforma Digital Colaborativa do Sistema de Gestão de Informação MEAL (disponível em https://sgi-fresancamoes.com/). Liderando a entrega de todos os produtos do Termo de Referência (TdR), estruturei as interfaces pública e privada, automatizei os fluxos de dados de campo das províncias da Huíla, Namibe e Cunene com regras de alerta pré-análise para a equipa M&A da UIC, e garanti a integração de indicadores orientados a resultados segundo os referenciais da OCDE/CAD e as Políticas de Segurança da Informação do Camões, I.P.

Destaco igualmente a minha experiência na estruturação de fluxos de recolha móvel (KoboToolbox, ODK, Survey Solutions e WFP MoDA), auditorias de qualidade de dados (DQA), e concepção de painéis analíticos interativos em Power BI para suporte a decisões estratégicas e reporte a doadores internacionais. Adicionalmente, a minha intervenção em consórcios multiatores consolidou a minha capacidade de diálogo e harmonização metodológica com ministérios setoriais (INE, MINAGRIF) e parceiros de implementação no terreno.

Motivado pela relevância dos vossos objetivos e com plena capacidade de entrega imediata, coloco-me à disposição para aprofundar a demonstração das minhas competências numa entrevista técnica.

Com os meus melhores cumprimentos,

${cv.personalDetails.name}
${cv.personalDetails.title}
${cv.personalDetails.phone} | ${cv.personalDetails.email}`
  );

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateAiLetter}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Regerar com IA</span>
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
