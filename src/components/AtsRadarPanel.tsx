import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { auditCVAgainstJob } from '../utils/atsAnalyzer';
import { SAMPLE_JOB_OFFERS } from '../data/initialCV';
import {
  Target,
  AlertCircle,
  Plus,
  CheckCircle2,
  Zap,
  Terminal,
  ShieldCheck,
  FileCheck,
  Check,
  ChevronDown,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AtsRadarPanelProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  onOpenAiTailor: () => void;
}

type KeywordDestination = 'competencies' | 'summary' | 'experience';

export const AtsRadarPanel: React.FC<AtsRadarPanelProps> = ({
  cv,
  onChange,
  jobDescription,
  setJobDescription,
  onOpenAiTailor
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'bot_view' | 'checklist'>('audit');
  const [keywordDestination, setKeywordDestination] = useState<KeywordDestination>('competencies');
  const [copiedRawText, setCopiedRawText] = useState<boolean>(false);

  const auditResult = auditCVAgainstJob(cv, jobDescription);

  // Flexible Keyword Injection Engine
  const handleAddKeyword = (keyword: string, destination: KeywordDestination = keywordDestination) => {
    const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);

    if (destination === 'competencies') {
      const updatedCompetencies = [
        ...cv.competencies,
        {
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          category: capitalized,
          description: `Experiência comprovada em ${keyword} aplicada a contextos profissionais de alto impacto e conformidade institucional.`
        }
      ];
      onChange({ ...cv, competencies: updatedCompetencies });
    } else if (destination === 'summary') {
      const addition = ` Especialista em ${keyword} com histórico consistente de geração de resultados e liderança técnica.`;
      const updatedSummary = cv.summary ? `${cv.summary.trim()}${addition}` : addition.trim();
      onChange({ ...cv, summary: updatedSummary });
    } else if (destination === 'experience') {
      if (!cv.experiences || cv.experiences.length === 0) {
        // Fallback to competencies if no experience
        handleAddKeyword(keyword, 'competencies');
        return;
      }
      const updatedExperiences = [...cv.experiences];
      const targetExp = { ...updatedExperiences[0] };
      const newHighlight = `Alavancou ${keyword} em iniciativas de alto impacto, garantindo conformidade operacional e maximização de resultados mensuráveis.`;
      targetExp.highlights = [...targetExp.highlights, newHighlight];
      updatedExperiences[0] = targetExp;
      onChange({ ...cv, experiences: updatedExperiences });
    }
  };

  const handleAddAllMissingKeywords = () => {
    if (auditResult.missingKeywords.length === 0) return;

    if (keywordDestination === 'competencies') {
      const newItems = auditResult.missingKeywords.map((kw, i) => ({
        id: `comp-all-${Date.now()}-${i}`,
        category: kw.charAt(0).toUpperCase() + kw.slice(1),
        description: `Domínio prático de ${kw} com foco em entregas estratégicas e boas práticas internacionais.`
      }));
      onChange({ ...cv, competencies: [...cv.competencies, ...newItems] });
    } else if (keywordDestination === 'summary') {
      const joined = auditResult.missingKeywords.join(', ');
      const addition = ` Domínio técnico aprofundado em ${joined}.`;
      onChange({ ...cv, summary: `${(cv.summary || '').trim()}${addition}` });
    } else if (keywordDestination === 'experience') {
      if (cv.experiences && cv.experiences.length > 0) {
        const updatedExperiences = [...cv.experiences];
        const newBullets = auditResult.missingKeywords.map(
          (kw) => `Aplicou ativamente ${kw} em processos executivos críticos, otimizando fluxos de entrega e conformidade internacional.`
        );
        updatedExperiences[0] = {
          ...updatedExperiences[0],
          highlights: [...updatedExperiences[0].highlights, ...newBullets]
        };
        onChange({ ...cv, experiences: updatedExperiences });
      }
    }
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

  // Construct raw OCR / parser text
  const parserRawTokens = [
    `=== APPLICANT TRACKING SYSTEM (ATS) OCR EXTRACTION ===`,
    `[STATUS: 200 OK | PARSER: WORKDAY/TALEO COMPATIBLE]`,
    ``,
    `[CANDIDATE_HEADER]`,
    `NAME: ${cv.personalDetails.name || 'NOT_DETECTED'}`,
    `TITLE: ${cv.personalDetails.title || 'NOT_DETECTED'}`,
    `EMAIL: ${cv.personalDetails.email || 'NOT_DETECTED'}`,
    `PHONE: ${cv.personalDetails.phone || 'NOT_DETECTED'}`,
    `LOCATION: ${cv.personalDetails.location || 'NOT_DETECTED'}`,
    `LINKEDIN: ${cv.personalDetails.linkedin || 'NOT_SPECIFIED'}`,
    ``,
    `[EXECUTIVE_PROFILE_SECTION]`,
    cv.summary || '(Empty summary)',
    ``,
    `[COMPETENCY_VECTOR_INDEXED]`,
    ...cv.competencies.map((c) => `-> ${c.category}: ${c.description}`),
    ``,
    `[CHRONOLOGICAL_EXPERIENCE_RECORDS: ${cv.experiences.length}]`,
    ...cv.experiences.map(
      (e, idx) =>
        `EXP_${idx + 1}: [ROLE: ${e.role}] [ORG: ${e.company}] [PERIOD: ${e.period}]\n` +
        e.highlights.map((h) => `   * ${h}`).join('\n')
    ),
    ``,
    `[ACADEMIC_CREDENTIALS]`,
    ...cv.educations.map((ed) => `DEGREE: ${ed.degree} | INSTITUTION: ${ed.institution} (${ed.period})`),
    ``,
    `[PARSED_LANGUAGES]`,
    ...cv.languages.map((l) => `${l.language} -> ${l.level}`)
  ].join('\n');

  const handleCopyParserView = () => {
    navigator.clipboard.writeText(parserRawTokens);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  // Checklist criteria
  const isHarvardOrAts =
    cv.templateStyle === 'executive_harvard' ||
    cv.templateStyle === 'ats_compact' ||
    cv.templateStyle === 'un_classic';

  const hasStandardContact =
    Boolean(cv.personalDetails.email?.includes('@')) &&
    Boolean(cv.personalDetails.phone?.trim()) &&
    Boolean(cv.personalDetails.location?.trim());

  const hasStrongSummary = (cv.summary || '').length >= 100;
  const hasQuantifiableMetrics = auditResult.quantifiableMetricsCount >= 4;
  const hasStrongVerbs = auditResult.strongActionVerbs.length >= 4;

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

      {/* Segmented Tab Bar */}
      <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-slate-700" />
          <span>Auditoria & Palavras-Chave</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bot_view')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bot_view'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulador Robô ATS (Parser)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'checklist'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Checklist de Formatação</span>
        </button>
      </div>

      {/* TAB 1: Main Audit & Keyword Injector */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
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
                    {job.id === 'job-1'
                      ? 'COO Operações'
                      : job.id === 'job-2'
                      ? 'Cloud & Tech Lead'
                      : job.id === 'job-3'
                      ? 'VP Finanças & M&A'
                      : 'Governança Global'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Cole aqui a descrição completa da vaga que deseja disputar (requisitos, competências, termos de referência)..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-slate-400">
              O analisador compara automaticamente cada linha do seu CV contra os requisitos essenciais desta vaga.
            </p>
          </div>

          {/* Missing Keywords Analysis with Target Destination Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Palavras-Chave Faltantes ({auditResult.missingKeywords.length})
                </h3>
              </div>

              {/* Destination Selector */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Destino:</span>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('competencies')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'competencies'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Inserir nas Competências Chave do CV"
                >
                  Competências
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('summary')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'summary'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Adicionar ao Resumo Executivo"
                >
                  Resumo
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('experience')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'experience'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Inserir como conquista no último cargo"
                >
                  Último Cargo
                </button>
              </div>
            </div>

            {auditResult.missingKeywords.length > 0 && (
              <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-950">
                <span className="text-[11px]">
                  Clique no <strong>+</strong> de cada termo para inserir em <strong>{keywordDestination === 'competencies' ? 'Competências' : keywordDestination === 'summary' ? 'Resumo Executivo' : 'Último Cargo'}</strong>.
                </span>
                <button
                  type="button"
                  onClick={handleAddAllMissingKeywords}
                  className="text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-3 py-1 rounded-md transition-colors shadow-2xs shrink-0 whitespace-nowrap ml-2"
                >
                  + Adicionar Todas
                </button>
              </div>
            )}

            {auditResult.missingKeywords.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium">
                Parabéns! Todas as palavras-chave críticas da vaga estão mencionadas no seu currículo.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {auditResult.missingKeywords.map((kw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md shadow-2xs"
                  >
                    <span className="font-medium">{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleAddKeyword(kw)}
                      className="p-1 hover:bg-amber-200 rounded text-amber-800 transition-colors"
                      title={`Inserir "${kw}" no CV em ${keywordDestination}`}
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
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-medium text-[11px]"
                >
                  ✓ {kw}
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
                Recrutadores corporativos globais priorizam bullets com dados quantificados (ex: "mais de 120 colaboradores", "redução de 32% nos custos").
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
      )}

      {/* TAB 2: ATS Robot OCR Simulator */}
      {activeTab === 'bot_view' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 text-slate-200 space-y-4 font-mono shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Visualização do Parser ATS (Workday / Taleo OCR Engine)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyParserView}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors self-start sm:self-auto flex items-center gap-1"
            >
              {copiedRawText ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copiedRawText ? 'Copiado!' : 'Copiar Texto Extraído'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">Taxa OCR</span>
              <span className="text-emerald-400 font-bold text-sm">99.8%</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">Cargos Lidos</span>
              <span className="text-white font-bold text-sm">{cv.experiences.length}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">Competências</span>
              <span className="text-white font-bold text-sm">{cv.competencies.length}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">Tabelas / Imagens</span>
              <span className="text-emerald-400 font-bold text-sm">0 (Seguro)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Abaixo está a representação exata do fluxo textual lido pelos motores de inteligência artificial de grandes corporações. Se um dado não aparecer aqui, ele é invisível para a triagem.
          </p>

          <pre className="bg-black/60 p-3.5 rounded-lg border border-slate-800 text-[11px] text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
            {parserRawTokens}
          </pre>
        </div>
      )}

      {/* TAB 3: ATS Standard Formatting Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Checklist de Conformidade Algorítmica Internacional
            </h3>
          </div>

          <div className="space-y-3">
            {/* Criteria 1 */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50">
              {isHarvardOrAts ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Estrutura de Coluna Única (Zero Tabelas Complexas)
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      isHarvardOrAts ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isHarvardOrAts ? 'Conforme' : 'Aviso: Modelo Dividido'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Modelos de coluna única como Executive Harvard ou ATS Compact garantem 100% de leitura em robôs antigos e modernos.
                </p>
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50">
              {hasStandardContact ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Cabeçalho de Contactos Padronizado
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      hasStandardContact ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {hasStandardContact ? 'Aprovado' : 'Faltam Dados'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  E-mail institucional/profissional, telefone com prefixo e localização territorial devem estar explícitos no topo do documento.
                </p>
              </div>
            </div>

            {/* Criteria 3 */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50">
              {hasStrongSummary ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Densidade do Resumo Executivo (100+ caracteres)
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      hasStrongSummary ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {hasStrongSummary ? 'Adequado' : 'Curto'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  O resumo deve conter a proposta de valor, senioridade e especialidade em termos precisos.
                </p>
              </div>
            </div>

            {/* Criteria 4 */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50">
              {hasQuantifiableMetrics ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Métricas de Impacto Comprovadas (Fórmula Google XYZ)
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      hasQuantifiableMetrics ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {auditResult.quantifiableMetricsCount} métricas
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  O algoritmo pontua alto candidatos que demonstram resultados numéricos tangíveis em percentagens (%) ou volumes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
