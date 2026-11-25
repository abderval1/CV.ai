import React, { useState, useEffect } from 'react';
import { CVData } from '../types/cv';
import { SlidersHorizontal, Check, ArrowRight, Loader2, AlertCircle, Copy, Plus, Wand2, Briefcase } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';
import { auditCVAgainstJob } from '../utils/atsAnalyzer';
import { authorizedFetch } from '../utils/authHeaders';
import {
  getStoredPromptSync,
  getStoredPlatformSettingsSync,
  trackFrontendTelemetry,
  logGenerationError
} from '../services/adminModulesService';

interface AiTailorPanelProps {
  cv: CVData;
  onChange: (cv: CVData) => void;
  jobDescription: string;
}

export const AiTailorPanel: React.FC<AiTailorPanelProps> = ({
  cv,
  onChange,
  jobDescription
}) => {
  const { showWarning, showSuccess } = useToast();
  const { incrementCvGenerated } = useAuth();
  const { siteLanguage } = useLanguage();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).aiTailor;
  const [panelMode, setPanelMode] = useState<'full' | 'xyz'>('full');
  const [targetStandard, setTargetStandard] = useState<string>(
    'C-Level Executive Leadership & Operations Director (Google XYZ Formula)'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tailoredResult, setTailoredResult] = useState<any | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  // Google XYZ Builder State
  const [xyzAccomplished, setXyzAccomplished] = useState<string>(
    'Reduced cloud infrastructure and operational OPEX costs'
  );
  const [xyzMeasured, setXyzMeasured] = useState<string>(
    'by 32% ($240K annual savings)'
  );
  const [xyzDoing, setXyzDoing] = useState<string>(
    'by renegotiating vendor contracts and consolidating cloud workloads'
  );
  const [xyzCopied, setXyzCopied] = useState<boolean>(false);
  const [xyzInserted, setXyzInserted] = useState<boolean>(false);

  const generatedXyzBullet = `${xyzAccomplished.trim()} ${xyzMeasured.trim()}, ${xyzDoing.trim()}.`;

  const handleInsertXyzToLatestExperience = () => {
    if (!cv.experiences || cv.experiences.length === 0) {
      showWarning(ui.noExpWarnTitle, ui.noExpWarnMsg);
      return;
    }
    const firstExp = cv.experiences[0];
    const updatedExp = {
      ...firstExp,
      highlights: [...firstExp.highlights, generatedXyzBullet]
    };
    const updatedList = [updatedExp, ...cv.experiences.slice(1)];
    onChange({ ...cv, experiences: updatedList });
    setXyzInserted(true);
    showSuccess(ui.insertedToastTitle, `${ui.insertedToastMsgPrefix} "${firstExp.role || ui.latestRoleFallback}".`);
    setTimeout(() => setXyzInserted(false), 3000);
  };

  const handleCopyXyz = () => {
    navigator.clipboard.writeText(generatedXyzBullet);
    setXyzCopied(true);
    setTimeout(() => setXyzCopied(false), 2500);
  };

  const handleLoadXyzPreset = (type: 'ops' | 'tech' | 'fin' | 'lead') => {
    if (type === 'ops') {
      setXyzAccomplished('Otimizou o tempo de ciclo logístico e distribuição');
      setXyzMeasured('em 28%, diminuindo o lead-time médio de 14 para 10 dias');
      setXyzDoing('reestruturando a cadeia de suprimentos e integrando automações no ERP');
    } else if (type === 'tech') {
      setXyzAccomplished('Arquitetou infraestrutura resiliente de microsserviços em cloud');
      setXyzMeasured('sustentando 99.99% de SLA com redução de latência p99 para 45ms');
      setXyzDoing('migrando workloads legados para clusters Kubernetes gerenciados em AWS');
    } else if (type === 'fin') {
      setXyzAccomplished('Conduziu consolidação contábil e auditoria financeira corporativa');
      setXyzMeasured('reduzindo o fechamento mensal de 12 para 3 dias úteis');
      setXyzDoing('adotando automação robótica de conciliação bancária segundo normas IFRS');
    } else {
      setXyzAccomplished('Reestruturou equipa multidisciplinar de 45 profissionais');
      setXyzMeasured('elevando a retenção de talentos em 40% e o eNPS interno para +68');
      setXyzDoing('implementando plano de carreira transparente, metas OKR e cultura de mentoria');
    }
  };

  const handleRunAiOptimization = async () => {
    if (platformSettings.enableAiFeaturesGlobally === false) {
      setErrorMsg(ui.aiPausedErr);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAppliedSuccess(false);

    const adminPromptConfig = getStoredPromptSync('experienceOptimizer');

    try {
      const response = await authorizedFetch('/api/tailor-cv', {
        method: 'POST',
        body: JSON.stringify({
          cvData: cv,
          jobDescription,
          targetStandard,
          adminPromptConfig
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 402 && errData?.quotaExceeded) {
          setErrorMsg(errData.error || ui.quotaErr);
          setIsLoading(false);
          return;
        }
        throw new Error(errData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setTailoredResult(data);
      trackFrontendTelemetry({ type: 'ai_called', feature: 'aiTailor', tokens: 1650 });
      void incrementCvGenerated(1, { skipServerIncrement: true, eventType: 'resume_started', templateStyle: cv.templateStyle });
    } catch (err: any) {
      console.warn('API error, applying intelligent heuristic optimizer:', err);
      logGenerationError({
        timestamp: new Date().toISOString(),
        userEmail: cv.personalDetails.email || 'anonymous',
        operationType: 'gemini_ai_call',
        errorMessage: `[AiTailor] ${err?.message || 'Falha na chamada Gemini'}`,
        modelUsed: adminPromptConfig?.preferredModel || 'gemini-4-hydrogen',
        resolved: false
      });

      // Heuristic Fallback Tailoring (guarantees dynamic robustness for any candidate and role)
      const isTech = targetStandard.toLowerCase().includes('tech') || (cv.personalDetails.title && cv.personalDetails.title.toLowerCase().includes('tech'));
      const isFinance = targetStandard.toLowerCase().includes('corporativo') || (cv.personalDetails.title && (cv.personalDetails.title.toLowerCase().includes('financ') || cv.personalDetails.title.toLowerCase().includes('cfo')));

      let tailoredSummary = cv.summary;
      if (isTech) {
        tailoredSummary = `${cv.personalDetails.title || 'Senior Technology Leader'} com histórico comprovado de liderança técnica, desenho de arquiteturas escaláveis em cloud, governança de microsserviços e entrega contínua. Especialista em acelerar ciclos de desenvolvimento, otimizar custos operacionais de infraestrutura e liderar equipas multidisciplinares de engenharia com foco em alta disponibilidade e métricas quantificáveis de sucesso.`;
      } else if (isFinance) {
        tailoredSummary = `${cv.personalDetails.title || 'Diretor Financeiro & Controller Executivo'} com mais de uma década de experiência comprovada em governação financeira, planeamento tributário, auditoria, consolidação de demonstrações financeiras (IFRS/NIRF) e liderança de equipas de controladoria. Histórico de otimização de tesouraria, reestruturação estratégica de orçamentos e interlocução qualificada com conselhos de administração e auditores externos.`;
      } else if (!cv.summary || cv.summary.length < 50) {
        tailoredSummary = `Profissional sénior com sólida e progressiva trajetória em ${cv.personalDetails.title || 'Gestão Estratégica'}, com comprovada experiência no desenho e execução de processos operacionais, liderança de equipas e entrega de resultados de alto impacto alinhados a rigorosos padrões internacionais de qualidade.`;
      } else {
        tailoredSummary = `${cv.summary.trim()} Diferencia-se pelo rigor metodológico, forte compromisso com padrões internacionais de excelência e capacidade comprovada de entrega de resultados estratégicos em ambientes complexos.`;
      }

      const fallbackAudit = auditCVAgainstJob({ ...cv, summary: tailoredSummary }, jobDescription, siteLanguage);

      setTailoredResult({
        summary: tailoredSummary,
        competencies: cv.competencies,
        experiences: cv.experiences,
        atsInsights: {
          scoreEstimate: fallbackAudit.score,
          matchingKeywords: fallbackAudit.matchedKeywords.slice(0, 6),
          recommendations: [
            ui.localFallbackRec,
            ...(fallbackAudit.recommendations || []).slice(0, 2)
          ]
        }
      });
      void incrementCvGenerated(1, { skipServerIncrement: false, eventType: 'resume_started', templateStyle: cv.templateStyle });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTailoredChanges = () => {
    if (!tailoredResult) return;

    const updated: CVData = {
      ...cv,
      summary: tailoredResult.summary || cv.summary,
      competencies:
        tailoredResult.competencies && tailoredResult.competencies.length > 0
          ? tailoredResult.competencies.map((c: any, i: number) => ({
              id: c.id || `comp-${i}`,
              category: c.category,
              description: c.description
            }))
          : cv.competencies
    };

    if (tailoredResult.experiences && tailoredResult.experiences.length > 0) {
      updated.experiences = cv.experiences.map((exp, idx) => {
        const tailoredExp = tailoredResult.experiences[idx];
        if (tailoredExp && tailoredExp.highlights) {
          return {
            ...exp,
            highlights: tailoredExp.highlights
          };
        }
        return exp;
      });
    }

    onChange(updated);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setPanelMode('full')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            panelMode === 'full'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>{ui.tabFull}</span>
        </button>

        <button
          type="button"
          onClick={() => setPanelMode('xyz')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            panelMode === 'xyz'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-slate-700" />
          <span>{ui.tabXyz}</span>
        </button>
      </div>

      {panelMode === 'xyz' ? (
        /* GOOGLE XYZ ACCOMPLISHMENT BUILDER */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  {ui.xyzBadge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [X] + [Y] + [Z]
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                {ui.xyzTitle}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {ui.xyzSubtitlePrefix} <strong>{ui.xyzSubtitleStrong}</strong> {ui.xyzSubtitleSuffix}
              </p>
            </div>

            {/* Quick Industry Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {ui.presetsLabel}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleLoadXyzPreset('ops')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  <p className="font-bold text-[11px]">{ui.presetOps}</p>
                  <p className="text-[10px] text-slate-500 truncate">{ui.presetOpsSub}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadXyzPreset('tech')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  <p className="font-bold text-[11px]">{ui.presetTech}</p>
                  <p className="text-[10px] text-slate-500 truncate">{ui.presetTechSub}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadXyzPreset('fin')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  <p className="font-bold text-[11px]">{ui.presetFin}</p>
                  <p className="text-[10px] text-slate-500 truncate">{ui.presetFinSub}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadXyzPreset('lead')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  <p className="font-bold text-[11px]">{ui.presetLead}</p>
                  <p className="text-[10px] text-slate-500 truncate">{ui.presetLeadSub}</p>
                </button>
              </div>
            </div>

            {/* Inputs: X, Y, Z */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {ui.xLabel}
                </label>
                <input
                  type="text"
                  value={xyzAccomplished}
                  onChange={(e) => setXyzAccomplished(e.target.value)}
                  placeholder={ui.xPlaceholder}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {ui.yLabel}
                </label>
                <input
                  type="text"
                  value={xyzMeasured}
                  onChange={(e) => setXyzMeasured(e.target.value)}
                  placeholder={ui.yPlaceholder}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {ui.zLabel}
                </label>
                <input
                  type="text"
                  value={xyzDoing}
                  onChange={(e) => setXyzDoing(e.target.value)}
                  placeholder={ui.zPlaceholder}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-sans"
                />
              </div>
            </div>

            {/* Live Result Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                {ui.resultLabel}
              </span>
              <p className="text-xs text-slate-900 leading-relaxed font-medium">
                • {generatedXyzBullet}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyXyz}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                {xyzCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{xyzCopied ? ui.copiedBtn : ui.copyBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleInsertXyzToLatestExperience}
                className={`w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                  xyzInserted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {xyzInserted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-amber-400" />}
                <span>{xyzInserted ? ui.insertedBtn : ui.insertBtn}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FULL JOB TAILORING MODE */
        <>
          {/* Configuration Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {ui.fullTitle}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {ui.fullDesc}
              </p>
            </div>

            {/* Standard Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {ui.targetStdLabel}
              </label>
              <select
                value={targetStandard}
                onChange={(e) => setTargetStandard(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
              >
                <option value="Liderança Executiva C-Level & Direção de Operações (Fórmula Google XYZ)">
                  {ui.standards.exec}
                </option>
                <option value="Big Tech & Engenharia de Software (Métricas de Sistema, Cloud & IA)">
                  {ui.standards.tech}
                </option>
                <option value="Harvard Business School & Finanças Corporativas (EBITDA, M&A & Valuation)">
                  {ui.standards.harvard}
                </option>
                <option value="Padrão Corporativo & Projetos Globais (Governança e Resultados Estratégicos)">
                  {ui.standards.corp}
                </option>
              </select>
            </div>

            {/* Active Target Job Context Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ui.activeJobLabel}</span>
                </span>
                <span className="text-[10px] font-mono tabular-nums text-slate-500">
                  {jobDescription.trim().length} {ui.charsSuffix}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {jobDescription.trim()
                  ? jobDescription.trim()
                  : ui.noJobDescFallback}
              </p>
            </div>

            {/* Action Trigger */}
            <button
              type="button"
              onClick={handleRunAiOptimization}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{ui.runningBtn}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>{ui.runBtn}</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Tailoring Results & Diff Preview */}
          {tailoredResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {ui.proposalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ui.proposalDesc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApplyTailoredChanges}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                    appliedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {appliedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{ui.appliedBtn}</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{ui.applyBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Proposed Summary */}
              {tailoredResult.summary && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {ui.newSummaryLabel}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {tailoredResult.summary}
                  </p>
                </div>
              )}

              {/* Proposed Competencies */}
              {tailoredResult.competencies && tailoredResult.competencies.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {ui.alignedCompLabel}
                  </span>
                  <div className="space-y-2">
                    {tailoredResult.competencies.map((comp: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <strong className="text-slate-900 font-semibold">{comp.category}:</strong>{' '}
                        <span className="text-slate-700">{comp.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Experiences (Google XYZ Rewrite Preview) */}
              {tailoredResult.experiences && tailoredResult.experiences.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {ui.optExpLabel} ({tailoredResult.experiences.length})
                  </span>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {tailoredResult.experiences.map((exp: any, i: number) => (
                      <div
                        key={exp.id || i}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-slate-900">
                            {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                          </span>
                          {exp.period && (
                            <span className="text-[10px] font-mono text-slate-500">{exp.period}</span>
                          )}
                        </div>
                        {Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
                          <ul className="space-y-1 text-[11px] text-slate-700 leading-relaxed pl-2">
                            {exp.highlights.map((bullet: string, bIdx: number) => (
                              <li key={bIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATS Insights */}
              {tailoredResult.atsInsights && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1.5">
                  <div className="font-semibold text-emerald-900 tabular-nums">
                    {ui.matchEstimateLabel} {tailoredResult.atsInsights.scoreEstimate ?? 90}%
                  </div>
                  {tailoredResult.atsInsights.recommendations && (
                    <ul className="text-emerald-800 space-y-0.5 pl-2">
                      {tailoredResult.atsInsights.recommendations.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
