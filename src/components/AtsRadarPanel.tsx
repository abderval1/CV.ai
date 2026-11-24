import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { auditCVAgainstJob } from '../utils/atsAnalyzer';
import { SAMPLE_JOB_OFFERS } from '../data/initialCV';
import { useLanguage } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';
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
  const { siteLanguage } = useLanguage();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).atsRadar;
  const [activeTab, setActiveTab] = useState<'audit' | 'bot_view' | 'checklist'>('audit');
  const [keywordDestination, setKeywordDestination] = useState<KeywordDestination>('competencies');
  const [copiedRawText, setCopiedRawText] = useState<boolean>(false);

  const auditResult = auditCVAgainstJob(cv, jobDescription, siteLanguage);
  const hasJobContext = jobDescription.trim().length >= 20;

  // Flexible Keyword Injection Engine (with duplicate guard)
  const handleAddKeyword = (keyword: string, destination: KeywordDestination = keywordDestination) => {
    const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    const normalizedKw = keyword.trim().toLowerCase();

    if (destination === 'competencies') {
      const alreadyExists = cv.competencies.some(
        (c) =>
          c.category.trim().toLowerCase() === normalizedKw ||
          c.description.toLowerCase().includes(normalizedKw)
      );
      if (alreadyExists) return;

      const updatedCompetencies = [
        ...cv.competencies,
        {
          id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: capitalized,
          description: `Experiência comprovada em ${keyword} aplicada a contextos profissionais de alto impacto e conformidade institucional.`
        }
      ];
      onChange({ ...cv, competencies: updatedCompetencies });
    } else if (destination === 'summary') {
      if ((cv.summary || '').toLowerCase().includes(normalizedKw)) return;
      const addition = ` Especialista em ${keyword} com histórico consistente de geração de resultados e liderança técnica.`;
      const updatedSummary = cv.summary ? `${cv.summary.trim()}${addition}` : addition.trim();
      onChange({ ...cv, summary: updatedSummary });
    } else if (destination === 'experience') {
      if (!cv.experiences || cv.experiences.length === 0) {
        handleAddKeyword(keyword, 'competencies');
        return;
      }
      const firstExp = cv.experiences[0];
      if (firstExp.highlights.some((h) => h.toLowerCase().includes(normalizedKw))) return;
      const updatedExperiences = [...cv.experiences];
      const newHighlight = `Alavancou ${keyword} em iniciativas de alto impacto, garantindo conformidade operacional e maximização de resultados mensuráveis.`;
      updatedExperiences[0] = {
        ...firstExp,
        highlights: [...firstExp.highlights, newHighlight]
      };
      onChange({ ...cv, experiences: updatedExperiences });
    }
  };

  const handleAddAllMissingKeywords = () => {
    if (auditResult.missingKeywords.length === 0) return;

    if (keywordDestination === 'competencies') {
      const toAdd = auditResult.missingKeywords.filter((kw) => {
        const norm = kw.trim().toLowerCase();
        return !cv.competencies.some(
          (c) => c.category.trim().toLowerCase() === norm || c.description.toLowerCase().includes(norm)
        );
      });
      if (toAdd.length === 0) return;
      const newItems = toAdd.map((kw, i) => ({
        id: `comp-all-${Date.now()}-${i}`,
        category: kw.charAt(0).toUpperCase() + kw.slice(1),
        description: `Domínio prático de ${kw} com foco em entregas estratégicas e boas práticas internacionais.`
      }));
      onChange({ ...cv, competencies: [...cv.competencies, ...newItems] });
    } else if (keywordDestination === 'summary') {
      const toAdd = auditResult.missingKeywords.filter(
        (kw) => !(cv.summary || '').toLowerCase().includes(kw.trim().toLowerCase())
      );
      if (toAdd.length === 0) return;
      const joined = toAdd.join(', ');
      const addition = ` Domínio técnico aprofundado em ${joined}.`;
      onChange({ ...cv, summary: `${(cv.summary || '').trim()}${addition}`.trim() });
    } else if (keywordDestination === 'experience') {
      if (cv.experiences && cv.experiences.length > 0) {
        const updatedExperiences = [...cv.experiences];
        const firstExp = updatedExperiences[0];
        const toAdd = auditResult.missingKeywords.filter(
          (kw) => !firstExp.highlights.some((h) => h.toLowerCase().includes(kw.trim().toLowerCase()))
        );
        if (toAdd.length === 0) return;
        const newBullets = toAdd.map(
          (kw) => `Aplicou ativamente ${kw} em processos executivos críticos, otimizando fluxos de entrega e conformidade internacional.`
        );
        updatedExperiences[0] = {
          ...firstExp,
          highlights: [...firstExp.highlights, ...newBullets]
        };
        onChange({ ...cv, experiences: updatedExperiences });
      } else {
        const newItems = auditResult.missingKeywords.map((kw, i) => ({
          id: `comp-all-${Date.now()}-${i}`,
          category: kw.charAt(0).toUpperCase() + kw.slice(1),
          description: `Domínio prático de ${kw} com foco em entregas estratégicas e boas práticas internacionais.`
        }));
        onChange({ ...cv, competencies: [...cv.competencies, ...newItems] });
      }
    }
  };

  const handleLoadJobPreset = (jobId: string) => {
    const job = SAMPLE_JOB_OFFERS.find((j) => j.id === jobId);
    if (job) {
      setJobDescription(job.description);
    }
  };

  // Genuine structural OCR & layout parseability assessment from real CV data
  const isTwoColumnTemplate =
    cv.templateStyle === 'creative_split' ||
    cv.templateStyle === 'european_modern' ||
    cv.templateStyle === 'european_europass';
  const hasPhotoEnabled = Boolean(cv.personalDetails.showPhoto && cv.personalDetails.photoUrl);
  const contactFieldsFilled = [
    cv.personalDetails.name,
    cv.personalDetails.title,
    cv.personalDetails.email,
    cv.personalDetails.phone,
    cv.personalDetails.location
  ].filter((v) => Boolean(v && v.trim())).length;
  const totalHighlightsCount = cv.experiences.reduce((acc, exp) => acc + (exp.highlights?.length || 0), 0);

  let computedOcrScore = isTwoColumnTemplate ? 86 : 99;
  if (hasPhotoEnabled) computedOcrScore -= 5;
  if (contactFieldsFilled < 4) computedOcrScore -= (4 - contactFieldsFilled) * 3;
  if (cv.experiences.length === 0) computedOcrScore -= 8;
  computedOcrScore = Math.max(55, Math.min(99, computedOcrScore));

  // Determine score color
  const scoreColor =
    !hasJobContext
      ? 'text-slate-800 bg-slate-50 border-slate-200'
      : auditResult.score >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : auditResult.score >= 70
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  // Construct raw OCR / parser text
  const parserStatusLine = isTwoColumnTemplate
    ? `[STATUS: PARSED WITH LAYOUT WARNING | LAYOUT: 2-COLUMN | LINEARITY: ${computedOcrScore}%]`
    : `[STATUS: PARSED CLEANLY | LAYOUT: SINGLE-COLUMN ATS | LINEARITY: ${computedOcrScore}%]`;

  const parserRawTokens = [
    `=== APPLICANT TRACKING SYSTEM (ATS) TEXT EXTRACTION ===`,
    parserStatusLine,
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
  const isHarvardOrAts = !isTwoColumnTemplate;

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
            {hasJobContext ? `${auditResult.score}%` : '—'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {ui.bannerTitle}
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              {!hasJobContext
                ? ui.statusNoJob
                : auditResult.score >= 85
                ? ui.statusHigh
                : auditResult.score >= 70
                ? ui.statusMid
                : ui.statusLow}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAiTailor}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{ui.optimizeAiBtn}</span>
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
          <span>{ui.tabAudit}</span>
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
          <span>{ui.tabBotView}</span>
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
          <span>{ui.tabChecklist}</span>
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
                  {ui.jobHeader}
                </h3>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">{ui.loadSampleLabel}</span>
                {SAMPLE_JOB_OFFERS.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleLoadJobPreset(job.id)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    title={job.title}
                  >
                    {ui.jobChips[job.id as keyof typeof ui.jobChips] || job.title}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={ui.jobPlaceholder}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans"
            />
            {!hasJobContext ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {ui.noJobWarning}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                {ui.activeJobInfo}
              </p>
            )}
          </div>

          {/* Missing Keywords Analysis with Target Destination Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {ui.missingTitle} (<span className="tabular-nums">{auditResult.missingKeywords.length}</span>)
                </h3>
              </div>

              {/* Destination Selector */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">{ui.destLabel}</span>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('competencies')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'competencies'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={ui.destCompTitle}
                >
                  {ui.destComp}
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('summary')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'summary'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={ui.destSummaryTitle}
                >
                  {ui.destSummary}
                </button>
                <button
                  type="button"
                  onClick={() => setKeywordDestination('experience')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    keywordDestination === 'experience'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={ui.destExpTitle}
                >
                  {ui.destExp}
                </button>
              </div>
            </div>

            {auditResult.missingKeywords.length > 0 && (
              <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-950">
                <span className="text-[11px]">
                  {ui.clickPlusPrefix} <strong>+</strong> {ui.clickPlusMiddle} <strong>{keywordDestination === 'competencies' ? ui.destCompFull : keywordDestination === 'summary' ? ui.destSummaryFull : ui.destExpFull}</strong>.
                </span>
                <button
                  type="button"
                  onClick={handleAddAllMissingKeywords}
                  className="text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-3 py-1 rounded-md transition-colors shadow-2xs shrink-0 whitespace-nowrap ml-2"
                >
                  {ui.addAllBtn}
                </button>
              </div>
            )}

            {!hasJobContext ? (
              <p className="text-xs text-slate-500">
                {ui.waitingJobMsg}
              </p>
            ) : auditResult.missingKeywords.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium">
                {ui.congratsNoMissing}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {auditResult.missingKeywords.map((kw, i) => (
                  <div
                    key={`${kw}-${i}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md shadow-2xs"
                  >
                    <span className="font-medium">{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleAddKeyword(kw)}
                      className="p-1 hover:bg-amber-200 rounded text-amber-800 transition-colors"
                      aria-label={`${ui.insertAriaPrefix} "${kw}" (${keywordDestination})`}
                      title={`${ui.insertAriaPrefix} "${kw}" (${keywordDestination})`}
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
                {ui.matchedTitle} (<span className="tabular-nums">{auditResult.matchedKeywords.length}</span>)
              </h3>
            </div>

            {auditResult.matchedKeywords.length === 0 ? (
              <p className="text-xs text-slate-500">
                {ui.noMatchedMsg}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
                {auditResult.matchedKeywords.map((kw, i) => (
                  <span
                    key={`${kw}-${i}`}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-medium text-[11px]"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quantifiable Metrics & Action Verbs Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metrics Density */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {ui.metricsTitle}
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {auditResult.quantifiableMetricsCount}
                </span>
                <span className="text-xs text-slate-500">
                  {auditResult.quantifiableMetricsCount >= 8
                    ? ui.metricsHigh
                    : ui.metricsLow}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {ui.metricsTip}
              </p>
            </div>

            {/* Action Verbs */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {ui.verbsTitle}
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {auditResult.strongActionVerbs.length}
                </span>
                <span className="text-xs text-slate-500">{ui.verbsSub}</span>
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
              {ui.recsTitle}
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
                {ui.botTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyParserView}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors self-start sm:self-auto flex items-center gap-1"
            >
              {copiedRawText ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copiedRawText ? ui.copiedBtn : ui.copyExtractedBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">{ui.ocrReadability}</span>
              <span
                className={`font-bold text-sm tabular-nums ${
                  computedOcrScore >= 92 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {computedOcrScore}%
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">{ui.ocrRolesBullets}</span>
              <span className="text-white font-bold text-sm tabular-nums">
                {cv.experiences.length} / {totalHighlightsCount}
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">{ui.ocrSkills}</span>
              <span className="text-white font-bold text-sm tabular-nums">{cv.competencies.length}</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="block text-slate-500 text-[10px]">{ui.ocrStructurePhoto}</span>
              <span
                className={`font-bold text-sm ${
                  !isTwoColumnTemplate && !hasPhotoEnabled ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isTwoColumnTemplate ? ui.twoCols : ui.oneCol}
                {hasPhotoEnabled ? ` ${ui.withPhoto}` : ''}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            {ui.botDesc}
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
              {ui.checklistTitle}
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
                    {ui.c1Title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      isHarvardOrAts ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isHarvardOrAts ? ui.c1Ok : ui.c1Warn}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ui.c1Desc}
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
                    {ui.c2Title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      hasStandardContact ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {hasStandardContact ? ui.c2Ok : ui.c2Fail}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ui.c2Desc}
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
                    {ui.c3Title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      hasStrongSummary ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {hasStrongSummary ? ui.c3Ok : ui.c3Warn}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ui.c3Desc}
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
                    {ui.c4Title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded font-bold tabular-nums ${
                      hasQuantifiableMetrics ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {auditResult.quantifiableMetricsCount} {ui.c4Unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {ui.c4Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
