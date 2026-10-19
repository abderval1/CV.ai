import React from 'react';
import { CVData } from '../types/cv';
import { auditCVAgainstJob } from '../utils/atsAnalyzer';
import { SAMPLE_JOB_OFFERS } from '../data/initialCV';
import { Target, AlertCircle, Plus, CheckCircle2, Zap } from 'lucide-react';

interface AtsRadarPanelProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  onOpenAiTailor: () => void;
}

export const AtsRadarPanel: React.FC<AtsRadarPanelProps> = ({
  cv,
  onChange,
  jobDescription,
  setJobDescription,
  onOpenAiTailor
}) => {
  const auditResult = auditCVAgainstJob(cv, jobDescription);

  const handleAddKeywordToCV = (keyword: string) => {
    // Add missing keyword to the first competency or as a new competency
    const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    const updatedCompetencies = [
      ...cv.competencies,
      {
        id: `comp-${Date.now()}`,
        category: capitalized,
        description: `Experiência comprovada em ${keyword} aplicada a programas internacionais e padrões institucionais.`
      }
    ];
    onChange({
      ...cv,
      competencies: updatedCompetencies
    });
  };

  const handleLoadJobPreset = (jobId: string) => {
    const job = SAMPLE_JOB_OFFERS.find((j) => j.id === jobId);
    if (job) {
      setJobDescription(job.description);
    }
  };

  // Determine score color
  const scoreColor =
    auditResult.score >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : auditResult.score >= 70
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <div className="space-y-4">
      {/* Top Score Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${scoreColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white/80 border flex items-center justify-center font-mono font-bold text-xl tabular-nums text-slate-900 shadow-xs">
            {auditResult.score}%
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Taxa de Compatibilidade ATS (Applicant Tracking System)
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              {auditResult.score >= 85
                ? 'Excelente! Forte densidade de palavras-chave e alinhamento com a vaga.'
                : auditResult.score >= 70
                ? 'Bom alinhamento, mas faltam termos técnicos decisivos.'
                : 'Atenção: Risco de filtro automático pelos robôs de triagem.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAiTailor}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Otimizar c/ IA para 95%+</span>
        </button>
      </div>

      {/* Target Job Selector & Text Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Termos de Referência / Descrição da Vaga
            </h3>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Carregar Exemplo:</span>
            {SAMPLE_JOB_OFFERS.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => handleLoadJobPreset(job.id)}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                title={job.title}
              >
                {job.id === 'job-fresan'
                  ? 'FRESAN / Camões TdR'
                  : job.id === 'job-1'
                  ? 'Expertise France'
                  : job.id === 'job-2'
                  ? 'UN WFP'
                  : 'Tech/Data'}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Cole aqui a descrição completa da vaga que deseja disputar (requisitos, competências, termos de referência)..."
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans"
        />
        <p className="text-[11px] text-slate-400">
          O analisador compara automaticamente cada linha do seu CV contra os requisitos essenciais desta vaga.
        </p>
      </div>

      {/* Missing Keywords Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Palavras-Chave Faltantes na Candidatura ({auditResult.missingKeywords.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Clique em "+" para incluir instantaneamente
          </span>
        </div>

        {auditResult.missingKeywords.length === 0 ? (
          <p className="text-xs text-emerald-700 font-medium">
            Parabéns! Todas as palavras-chave críticas da vaga estão mencionadas no seu currículo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {auditResult.missingKeywords.map((kw, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/70 border border-amber-200 text-amber-900 text-xs rounded-md"
              >
                <span className="font-medium">{kw}</span>
                <button
                  type="button"
                  onClick={() => handleAddKeywordToCV(kw)}
                  className="p-0.5 hover:bg-amber-200 rounded text-amber-800 transition-colors"
                  title={`Inserir "${kw}" nas competências do CV`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Matched Keywords */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Palavras-Chave Validadas no seu CV ({auditResult.matchedKeywords.length})
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
          {auditResult.matchedKeywords.map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Quantifiable Metrics & Action Verbs Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metrics Density */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Métricas Quantificáveis Detectadas
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {auditResult.quantifiableMetricsCount}
            </span>
            <span className="text-xs text-slate-500">
              {auditResult.quantifiableMetricsCount >= 8
                ? 'Excelente densidade numérica'
                : 'Poucas métricas encontradas'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Recrutadores internacionais da ONU e UE priorizam bullets com dados concretos (ex: "mais de 100 agentes", "redução de 40% nos erros").
          </p>
        </div>

        {/* Action Verbs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verbos de Ação Executiva
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {auditResult.strongActionVerbs.length}
            </span>
            <span className="text-xs text-slate-500">verbos de alto impacto</span>
          </div>
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
            {auditResult.strongActionVerbs.slice(0, 6).map((verb, idx) => (
              <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                {verb}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Recomendações Estratégicas para esta Vaga
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-700">
          {auditResult.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
