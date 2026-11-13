import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Check,
  Mail,
  Activity,
  Target
} from 'lucide-react';
import { CV_TEMPLATES } from '../data/templateCatalog';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { CVData } from '../types/cv';
import { CVHealthScoreOverview } from './CVHealthScoreOverview';
import {
  getStoredTemplatesSync,
  getStoredPlansSync,
  trackFrontendTelemetry
} from '../services/adminModulesService';

interface LandingHeroViewProps {
  onStartCreating: () => void;
  onOpenPricing: () => void;
  onSelectTemplate: (templateId: string) => void;
  onOpenTemplateAdvisor: () => void;
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'interview') => void;
}

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onStartCreating,
  onOpenPricing,
  onSelectTemplate,
  onOpenTemplateAdvisor,
  currentCV,
  onNavigateTab
}) => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [atsHubTab, setAtsHubTab] = useState<'health' | 'simulator'>('health');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [showAllTemplates, setShowAllTemplates] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [adminTemplates, setAdminTemplates] = useState(() => getStoredTemplatesSync());
  const [adminPlans, setAdminPlans] = useState(() => getStoredPlansSync());

  useEffect(() => {
    const refreshConfig = () => {
      setAdminTemplates(getStoredTemplatesSync());
      setAdminPlans(getStoredPlansSync());
    };
    window.addEventListener('admin-config-updated', refreshConfig);
    window.addEventListener('storage', refreshConfig);
    return () => {
      window.removeEventListener('admin-config-updated', refreshConfig);
      window.removeEventListener('storage', refreshConfig);
    };
  }, []);

  const proPlan = adminPlans.find((p) => p.id === 'pro') || adminPlans[0];
  const execPlan = adminPlans.find((p) => p.id === 'executive') || adminPlans[1];

  // Interactive Live ATS Quick-Checker State
  const [atsPreset, setAtsPreset] = useState<'coo' | 'tech' | 'cfo'>('coo');
  const [atsScoreSimulated, setAtsScoreSimulated] = useState<number>(48);
  const [hasAppliedKeywords, setHasAppliedKeywords] = useState<boolean>(false);

  const atsPresetsData = {
    coo: {
      role: 'Diretor de Operações (COO)',
      missingKeywords: ['EBITDA', 'Governança P&L', 'Due Diligence M&A', 'ISO 9001', 'OKRs'],
      optimizedText:
        'Liderou reestruturação operacional abrangendo 4 subsidiárias e 140 colaboradores, reduzindo OPEX em 32% e elevando a margem EBITDA em 8.4 p.p.'
    },
    tech: {
      role: 'Staff Cloud Architect',
      missingKeywords: ['Kubernetes', 'Microserviços gRPC', 'DevSecOps', 'SLA 99.99%', 'Latência p99'],
      optimizedText:
        'Arquitetou plataforma distribuída em Kubernetes e AWS processando $25M/mês, reduzindo latência p99 de 420ms para 58ms com disponibilidade de 99.99%.'
    },
    cfo: {
      role: 'VP Finanças & M&A',
      missingKeywords: ['IFRS / US GAAP', 'Modelagem DCF', 'Hedging Cambial', 'SOX', 'Captação'],
      optimizedText:
        'Conduziu captação de dívida estruturada de €60M e due diligence de 3 transações de M&A internacionais, otimizando custos financeiros em 24%.'
    }
  };

  const handleApplyAtsKeywords = () => {
    setHasAppliedKeywords(true);
    setAtsScoreSimulated(98);
  };

  const handleResetAtsSim = (preset: 'coo' | 'tech' | 'cfo') => {
    setAtsPreset(preset);
    setHasAppliedKeywords(false);
    setAtsScoreSimulated(48);
  };

  const activeMergedTemplates = useMemo(() => {
    const adminMap = new Map(adminTemplates.map((t) => [t.id, t]));
    return CV_TEMPLATES.filter((tmpl) => {
      const cfg = adminMap.get(tmpl.id);
      return !cfg || cfg.isActive !== false;
    })
      .map((tmpl) => {
        const cfg = adminMap.get(tmpl.id);
        return {
          ...tmpl,
          shortName: cfg?.shortName || tmpl.shortName,
          badge: cfg?.badge || tmpl.badge,
          atsScore: cfg?.atsScore ?? tmpl.atsScore,
          tierRequired: cfg?.tierRequired || 'pro',
          displayOrder: cfg?.displayOrder ?? 99
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [adminTemplates]);

  const filteredTemplates = activeMergedTemplates.filter((tmpl) => {
    if (templateFilter === 'without_photo') return !tmpl.hasPhoto;
    if (templateFilter === 'with_photo') return tmpl.hasPhoto;
    return true;
  });

  const displayedTemplates =
    templateFilter === 'all' && !showAllTemplates
      ? filteredTemplates.slice(0, 6)
      : filteredTemplates;

  const faqs = [
    {
      q: 'Como funciona o pagamento via Stripe e Pix?',
      a: 'Processamos cartões internacionais via Stripe com renovação transparente, além de Pix Instantâneo com QR Code e ativação imediata.'
    },
    {
      q: 'O currículo passa mesmo pelos robôs ATS (Workday, Taleo, Greenhouse)?',
      a: 'Sim. Os nossos modelos estritos (como Harvard Executivo e ATS Estrito) seguem leitura linear sem caixas de texto que corrompem o OCR, e o Radar ATS valida as palavras-chave da vaga.'
    },
    {
      q: 'O ficheiro Word (.docx) baixado mantém a formatação exata do site?',
      a: 'Sim. Utilizamos compilação nativa OpenXML (.docx) que preserva as mesmas margens A4, fontes, espaçamentos, secções visíveis e paleta de cores do preview — tanto para o CV como para a Carta de Apresentação.'
    },
    {
      q: 'A tradução traduz também o conteúdo que eu escrevi?',
      a: 'Sim. Ao trocar entre Português, Inglês, Espanhol, Francês e Alemão, a plataforma traduz os títulos das secções e o conteúdo completo do seu CV e carta de apresentação.'
    },
    {
      q: 'Posso cancelar ou mudar de plano quando quiser?',
      a: 'Sim, com 1 clique na sua Área do Usuário ou Portal Stripe, sem multas ou fidelização.'
    }
  ];

  return (
    <div className="w-full max-w-full bg-slate-900 text-white min-h-full overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* 1. UNIFIED EDITORIAL HERO & METRICS STRIP */}
      <section className="relative pt-12 pb-10 lg:pt-18 lg:pb-12 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-amber-400">
              {t('hero.kicker', 'Currículos ATS · Cartas de Apresentação · 5 Idiomas')}
            </p>

            <h1
              className="font-extrabold tracking-tight text-white leading-[1.12]"
              style={{ fontSize: 'clamp(2rem, 4.2vw, 3.5rem)', textWrap: 'balance' }}
            >
              {t('hero.title', 'Passe pelos filtros das maiores empresas do mundo e receba 3x mais entrevistas.')}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {t(
                'hero.subtitle',
                'Construa currículos e cartas de apresentação calibrados para sistemas ATS (Workday, Taleo, Greenhouse) com tradução integral e exportação fiel em Word (.docx) e PDF A4.'
              )}
            </p>

            {/* Focused Primary & Secondary Action Pair */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartCreating}
                className="w-full sm:w-auto px-7 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 group whitespace-nowrap"
              >
                <span>{t('hero.ctaStart', 'Criar Meu Currículo Profissional')}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab('cover') : onStartCreating())}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Carta de Apresentação</span>
              </button>
            </div>

            <p className="pt-1 text-xs text-slate-400">
              Planos desde {formatPrice(proPlan?.priceMonthlyValue ?? 2)}/mês · Stripe &amp; Pix Instantâneo · Word (.docx) &amp; PDF A4
            </p>
          </div>

          {/* Integrated 4-Metric Hairline Strip */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">98.7%</p>
              <p className="text-xs text-slate-400 mt-1">Aprovação em triagem ATS</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">+48.000</p>
              <p className="text-xs text-slate-400 mt-1">Profissionais contratados</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">14 Dias</p>
              <p className="text-xs text-slate-400 mt-1">Tempo médio até entrevista</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">5 Idiomas</p>
              <p className="text-xs text-slate-400 mt-1">Tradução total com 1 clique</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CENTRAL INTERATIVA ATS (Grouped Health Diagnostics + Job Match Simulator) */}
      <section className="py-14 lg:py-16 bg-slate-950/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Central de Inteligência ATS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Auditoria &amp; Simulador em Tempo Real
              </h2>
            </div>

            {/* Clean Segmented Switch between Diagnostics and Simulator */}
            <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto text-xs">
              <button
                type="button"
                onClick={() => setAtsHubTab('health')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  atsHubTab === 'health'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diagnóstico do Currículo</span>
              </button>
              <button
                type="button"
                onClick={() => setAtsHubTab('simulator')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  atsHubTab === 'simulator'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Vaga ATS</span>
              </button>
            </div>
          </div>

          {atsHubTab === 'health' ? (
            <CVHealthScoreOverview
              embedded
              currentCV={currentCV}
              onNavigateTab={onNavigateTab}
              onOpenPricing={onOpenPricing}
            />
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6">
              {/* Role Preset Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Selecione uma vaga de referência:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('coo')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      atsPreset === 'coo'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    Diretor de Operações (COO)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('tech')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      atsPreset === 'tech'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    Staff Cloud Architect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('cfo')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      atsPreset === 'cfo'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    VP Finanças &amp; M&amp;A
                  </button>
                </div>
              </div>

              {/* Clean Split Simulation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-6 text-center space-y-2">
                  <p className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                    Compatibilidade ATS
                  </p>
                  <p
                    className={`text-5xl font-black font-mono tabular-nums transition-colors ${
                      atsScoreSimulated >= 90 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {atsScoreSimulated}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {atsScoreSimulated >= 90
                      ? 'Perfil aprovado na triagem automática'
                      : 'Risco de descarte por ausência de termos'}
                  </p>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <span className="font-medium text-slate-400">
                      Palavras-chave exigidas para {atsPresetsData[atsPreset].role}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {atsPresetsData[atsPreset].missingKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            hasAppliedKeywords
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1'
                              : 'bg-slate-900 border border-slate-700 text-slate-300'
                          }`}
                        >
                          {hasAppliedKeywords && <Check className="w-3 h-3 text-emerald-400" />}
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-slate-300">
                      {hasAppliedKeywords ? 'Trecho Otimizado (Fórmula Google XYZ):' : 'Descrição Original Genérica:'}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {hasAppliedKeywords
                        ? atsPresetsData[atsPreset].optimizedText
                        : 'Responsável pela gestão da equipa, acompanhamento de metas operacionais e suporte à diretoria em relatórios semanais.'}
                    </p>
                  </div>

                  <div>
                    {!hasAppliedKeywords ? (
                      <button
                        type="button"
                        onClick={handleApplyAtsKeywords}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Aplicar Fórmula Google XYZ (Elevar para 98%)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onStartCreating}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Aplicar no Meu Currículo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. MODELOS INTERNACIONAIS (Hairline Bento Grid — Clean & Scannable) */}
      <section className="py-14 lg:py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Padrões Internacionais
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Modelos Estruturados para Cada Mercado
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Cada layout no site e no documento Word (.docx) segue os critérios exatos dos mercados dos EUA, Europa e posições executivas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({activeMergedTemplates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('without_photo')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'without_photo'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sem Foto · ATS
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('with_photo')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'with_photo'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Com Foto · Europa
                </button>
              </div>
            </div>
          </div>

          {/* Hairline Grid Container (Zero nested shadows, crisp 1px dividers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800 border border-slate-800 rounded-2xl overflow-hidden">
            {displayedTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-slate-950 p-5 flex flex-col justify-between hover:bg-slate-900/90 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-medium text-slate-300">{tmpl.badge}</span>
                    <span className="font-mono tabular-nums text-amber-400 font-semibold">
                      {tmpl.atsScore}% ATS
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {tmpl.shortName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {tmpl.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {tmpl.hasPhoto ? 'Suporta foto' : '100% textual'} ·{' '}
                    <span className="text-slate-300 font-medium">
                      {tmpl.tierRequired === 'free' ? 'Grátis' : tmpl.tierRequired === 'executive' ? 'VIP' : 'Pro'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: tmpl.id });
                      onSelectTemplate(tmpl.id);
                      onStartCreating();
                    }}
                    className="font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                  >
                    <span>Usar modelo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {templateFilter === 'all' && filteredTemplates.length > 6 ? (
              <button
                type="button"
                onClick={() => setShowAllTemplates(!showAllTemplates)}
                className="text-slate-300 hover:text-white font-semibold underline underline-offset-4"
              >
                {showAllTemplates
                  ? 'Mostrar menos modelos'
                  : `Ver todos os ${filteredTemplates.length} modelos disponíveis`}
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={onOpenTemplateAdvisor}
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Abrir Consultor IA de Modelos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. PLANOS & DÚVIDAS FREQUENTES (Unified Conversion & Trust Section) */}
      <section className="py-14 lg:py-20 bg-slate-950/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Pricing Block */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Preços Transparentes
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Escolha o plano ideal para a sua candidatura
              </h2>
              <p className="text-sm text-slate-400">
                Acesso completo à edição, IA, tradução em 5 idiomas e exportação Word/PDF sem marcas de água.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Pro Plan */}
              <div className="bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-amber-400/60 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {proPlan?.name || 'Profissional Pro'}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-300">
                      {proPlan?.badgeText || 'Recomendado'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-3xl font-extrabold text-white font-mono tabular-nums">
                      {formatPrice(proPlan?.priceMonthlyValue ?? 2)}{' '}
                      <span className="text-xs font-normal text-slate-400">/ Mês</span>
                    </p>
                    <p className="text-xs text-emerald-400">
                      Ou {formatPrice(proPlan?.priceYearlyValue ?? 18)} / Ano (Poupe 25%)
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-slate-800">
                    {(proPlan?.features || [
                      'Currículos, versões e salvamento ilimitado na nuvem',
                      "Exportação 1:1 em Word (.docx) e PDF A4 sem marca d'água",
                      'Tradução integral do CV e Carta para 5 idiomas',
                      'Radar ATS & Otimizador IA (Google XYZ)'
                    ])
                      .slice(0, 5)
                      .map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="mt-6 w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Subscrever {proPlan?.name || 'Profissional'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Executive VIP Plan */}
              <div className="bg-slate-900/60 p-6 sm:p-7 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {execPlan?.name || 'Executivo VIP'}
                    </span>
                    <span className="text-[11px] text-slate-400">{execPlan?.badgeText || 'C-Level & Global'}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-3xl font-extrabold text-white font-mono tabular-nums">
                      {formatPrice(execPlan?.priceMonthlyValue ?? 4)}{' '}
                      <span className="text-xs font-normal text-slate-400">/ Mês</span>
                    </p>
                    <p className="text-xs text-purple-400">
                      Ou {formatPrice(execPlan?.priceYearlyValue ?? 36)} / Ano (Poupe 25%)
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                    {(execPlan?.features || [
                      'Tudo incluído no Profissional Pro',
                      'Modelos Executivos C-Level, Harvard & Diplomático ONU',
                      'Simulador de Entrevista por voz/texto com notas STAR',
                      'Auditoria LinkedIn & suporte prioritário'
                    ])
                      .slice(0, 5)
                      .map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Subscrever {execPlan?.name || 'Executivo VIP'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Hairline Grouped FAQ */}
          <div className="space-y-5 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Perguntas Frequentes</h3>
              <span className="text-xs text-slate-500">Pagamentos seguros via Stripe &amp; Pix</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
              {faqs.map((faq, idx) => (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-200 hover:text-white hover:bg-slate-900/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-7 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Currículo Estratégico. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Privacidade &amp; Dados</span>
            <span aria-hidden="true">·</span>
            <span>Segurança Stripe &amp; Pix</span>
            <span aria-hidden="true">·</span>
            <span>Termos de Serviço</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
