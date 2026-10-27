import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Cpu,
  Download,
  Target,
  BarChart3,
  Award,
  Zap,
  Globe2,
  CreditCard,
  QrCode,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { CV_TEMPLATES } from '../data/templateCatalog';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { CVData } from '../types/cv';
import { CVHealthScoreOverview } from './CVHealthScoreOverview';

interface LandingHeroViewProps {
  onStartCreating: () => void;
  onOpenPricing: () => void;
  onSelectTemplate: (templateId: string) => void;
  onOpenTemplateAdvisor: () => void;
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview') => void;
}

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onStartCreating,
  onOpenPricing,
  onSelectTemplate,
  onOpenTemplateAdvisor,
  currentCV,
  onNavigateTab
}) => {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [templateFilter, setTemplateFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Live ATS Quick-Checker State
  const [atsPreset, setAtsPreset] = useState<'coo' | 'tech' | 'cfo'>('coo');
  const [atsScoreSimulated, setAtsScoreSimulated] = useState<number>(48);
  const [hasAppliedKeywords, setHasAppliedKeywords] = useState<boolean>(false);

  const atsPresetsData = {
    coo: {
      role: 'Chief Operating Officer (COO)',
      missingKeywords: ['EBITDA', 'Governança P&L', 'Due Diligence M&A', 'Gestão de Crises ISO', 'OKRs Estratégicos'],
      optimizedText: 'Liderou reestruturação operacional abrangendo 4 subsidiárias e 140 colaboradores, reduzindo despesas de OPEX em 32% e elevando a margem EBITDA em 8.4 pontos percentuais.'
    },
    tech: {
      role: 'Staff Cloud Architect & Tech Lead',
      missingKeywords: ['Kubernetes CKA', 'Microserviços gRPC', 'DevSecOps OWASP', 'SLA 99.99%', 'Latência Sub-100ms'],
      optimizedText: 'Arquitetou plataforma distribuída em Kubernetes e AWS processando mais de $25M/mês, reduzindo a latência p99 de 420ms para 58ms com disponibilidade contínua de 99.99%.'
    },
    cfo: {
      role: 'VP Finanças Corporativas & CFO',
      missingKeywords: ['IFRS / US GAAP', 'Modelagem DCF', 'Hedging Cambial', 'Sarbanes-Oxley SOX', 'Captação de Dívida'],
      optimizedText: 'Conduziu captação de dívida estruturada de €60M e due diligence de 3 transações de M&A internacionais, otimizando despesas financeiras em 24% através de estratégias ativas de tesouraria.'
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

  const filteredTemplates = CV_TEMPLATES.filter((tmpl) => {
    if (templateFilter === 'without_photo') return !tmpl.hasPhoto;
    if (templateFilter === 'with_photo') return tmpl.hasPhoto;
    return true;
  });

  const faqs = [
    {
      q: 'Como funciona o pagamento via Stripe e Pix?',
      a: 'Processamos pagamentos por cartão de crédito internacional (Visa, Mastercard, American Express) através da infraestrutura certificada da Stripe com renovação automática, e também via Pix Instantâneo (Banco Central do Brasil) com leitura de QR Code e ativação imediata na sua conta.'
    },
    {
      q: 'O currículo passa mesmo pelos robôs ATS como Workday e Taleo?',
      a: 'Sim. Os nossos modelos estritos (como o Harvard Executivo e ATS Estrito) são 100% lineares, sem tabelas complexas, caixas de texto flutuantes ou imagens que desconfiguram o OCR. O nosso Radar ATS analisa e indica a densidade exata das palavras-chave da vaga antes do envio.'
    },
    {
      q: 'O ficheiro Word (.docx) exportado mantém a formatação idêntica?',
      a: 'Sim. Não convertemos HTML para Word de forma tosca. Usamos um compilador nativo OpenXML (.docx) que estrutura estilos tipográficos, margens padronizadas e tabelas nativas de alta compatibilidade com Microsoft Word e Google Docs.'
    },
    {
      q: 'Posso cancelar a assinatura recorrente ou mudar de plano quando quiser?',
      a: 'A qualquer momento, com apenas 1 clique. Pode gerir a sua assinatura diretamente na sua Área do Usuário ou no Portal de Clientes da Stripe sem multas ou burocracias.'
    },
    {
      q: 'Qual é a diferença entre o Plano Profissional e o Executivo VIP?',
      a: 'O Plano Profissional oferece currículos e otimizações IA ilimitadas, exportação Word e Radar ATS. O Executivo VIP adiciona os modelos executivos C-Level e de governança internacional, scripts Python para automação local e suporte prioritário direto.'
    }
  ];

  return (
    <div className="w-full max-w-full bg-slate-900 text-white min-h-full overflow-x-hidden overflow-y-auto selection:bg-amber-400 selection:text-slate-950">
      {/* Area Status Notification: Clear separation of Public vs Member vs Paid space */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              {!isAuthenticated ? (
                <>
                  <strong className="text-white font-bold">Área Pública de Demonstração:</strong> Teste o diagnóstico ATS e explore a vitrine de modelos. Para criar, salvar e editar os seus currículos, aceda com uma conta de assinante.
                </>
              ) : (
                <>
                  <strong className="text-white font-bold">Área do Membro:</strong> Sessão ativa para <strong className="text-amber-400">{user?.name}</strong> (Nível: {user?.plan.toUpperCase()}).
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onStartCreating}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold text-[11px] transition-colors"
              >
                Criar Conta de Assinante
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab?.('editor')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
              >
                Abrir Meu Editor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Hero Section: Value Proposition */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 pointer-events-none opacity-60" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Clean Metadata Kicker */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
              <span>Tecnologia de Recrutamento Executivo</span>
              <span aria-hidden="true">·</span>
              <span>Inteligência Artificial & Radar ATS</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Passe pelos filtros das maiores empresas do mundo e receba{' '}
              <span className="text-amber-400">3x mais entrevistas</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Crie currículos de alto impacto calibrados para robôs ATS (Workday, Taleo, Greenhouse) e recrutadores C-Level. Exporte diretamente em Microsoft Word (.docx) e PDF com formatação impecável.
            </p>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartCreating}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg hover:shadow-amber-400/20 flex items-center justify-center gap-2 group whitespace-nowrap"
              >
                <span>Criar Meu Currículo Profissional</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onOpenPricing}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ver Planos & Assinaturas (Stripe & Pix)</span>
              </button>
            </div>

            {/* Quick Proof Trust Line */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Planos Pro e Executivo VIP
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Pagamento seguro via Stripe
              </span>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                Pix com ativação instantânea
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Concrete Quantitative Metrics Proof Strip */}
      <section className="bg-slate-950/70 border-b border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">98.7%</p>
              <p className="text-xs text-slate-400 font-medium">Aprovação em Triagem ATS</p>
              <p className="text-[11px] text-slate-500">Workday, Taleo, Greenhouse & Lever</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tabular-nums">+48.000</p>
              <p className="text-xs text-slate-400 font-medium">Profissionais Contratados</p>
              <p className="text-[11px] text-slate-500">Em Big Techs, Finanças e Consultorias</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">14 Dias</p>
              <p className="text-xs text-slate-400 font-medium">Tempo Médio até Entrevista</p>
              <p className="text-[11px] text-slate-500">3x mais rápido que candidaturas comuns</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">100%</p>
              <p className="text-xs text-slate-400 font-medium">Fidelidade Microsoft Word</p>
              <p className="text-[11px] text-slate-500">Sem tabelas quebradas ou OCR corrompido</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CV HEALTH SCORE: Interactive ATS Progress Ring & Section Diagnostics */}
      <CVHealthScoreOverview
        currentCV={currentCV}
        onNavigateTab={onNavigateTab}
        onOpenPricing={onOpenPricing}
      />

      {/* 4. Interactive Live ATS Quick-Checker Simulator */}
      <section className="py-16 bg-slate-950/40 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Simulador Interativo
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Experimente o Radar ATS em Ação Agora
            </h2>
            <p className="text-sm text-slate-400">
              Veja como o algoritmo analisa um perfil e o que acontece quando aplicamos a fórmula Google XYZ e as palavras-chave certas.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Role Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Selecione uma vaga de referência:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetAtsSim('coo')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    atsPreset === 'coo'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
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
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
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
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  VP Finanças & M&A
                </button>
              </div>
            </div>

            {/* Score & Live Matcher Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Score Gauge */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-center space-y-2">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Score de Compatibilidade</p>
                <p
                  className={`text-5xl font-black font-mono tabular-nums transition-colors ${
                    atsScoreSimulated >= 90 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {atsScoreSimulated}%
                </p>
                <p className="text-xs font-medium text-slate-400">
                  {atsScoreSimulated >= 90 ? '🟢 Altíssima chance de entrevista' : '🟡 Risco de descarte em triagem'}
                </p>
              </div>

              {/* Keyword & Formulation Preview */}
              <div className="md:col-span-2 space-y-3">
                <div className="text-xs space-y-1.5">
                  <span className="font-semibold text-slate-400">Palavras-Chave Críticas da Vaga:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {atsPresetsData[atsPreset].missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          hasAppliedKeywords
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1'
                            : 'bg-slate-900 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {hasAppliedKeywords && <Check className="w-3 h-3 text-emerald-400" />}
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-300">
                    {hasAppliedKeywords ? 'Trecho Otimizado (Fórmula Google XYZ):' : 'Trecho Original do Candidato:'}
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {hasAppliedKeywords
                      ? atsPresetsData[atsPreset].optimizedText
                      : 'Responsável pela gestão da equipa, acompanhamento de metas operacionais e suporte à diretoria em relatórios semanais.'}
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  {!hasAppliedKeywords ? (
                    <button
                      type="button"
                      onClick={handleApplyAtsKeywords}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Otimizar Trecho e Inserir Palavras-Chave (Elevar para 98%)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartCreating}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Aplicar no Meu Próprio Currículo Agora</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Executive Model Showcase with Filter Tabs */}
      <section className="py-16 bg-slate-950/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Padrões Internacionais</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Modelos Desenhados para Mercados Exigentes
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Formatos estritamente alinhados às regras culturais e técnicas de recrutamento dos EUA, Europa, Reino Unido e mercados corporativos globais.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setTemplateFilter('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  templateFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter('without_photo')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  templateFilter === 'without_photo'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sem Foto (ATS Estrito)
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter('with_photo')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  templateFilter === 'with_photo'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Com Foto (Europa)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.slice(0, 8).map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">{tmpl.badge}</span>
                    <span className="font-mono text-[11px] text-amber-400">{tmpl.atsScore}% ATS</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {tmpl.shortName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {tmpl.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {tmpl.hasPhoto ? 'Com Foto' : 'Sem Foto'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(tmpl.id);
                      onStartCreating();
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>Usar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Plans & Pricing Direct Showcase */}
      <section className="py-16 lg:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Preços Transparentes</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Invista na sua carreira com retorno garantido
          </h2>
          <p className="text-sm text-slate-400">
            Acesso ilimitado à inteligência artificial, exportação Word e diagnóstico ATS com ativação imediata.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Pro Plan (Most Popular) */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-amber-400 flex flex-col justify-between relative shadow-2xl shadow-amber-400/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full">
              Mais Escolhido
            </span>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Profissional Pro</span>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white font-mono">{formatPrice(29)} <span className="text-xs font-normal text-slate-400">/ Mês</span></p>
                <p className="text-xs text-emerald-400">Ou {formatPrice(240)} / Ano (Poupe 31%)</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Currículos e versões ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação Nativa Microsoft Word (.docx)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Otimizador IA Gemini Ilimitado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Radar ATS 95%+ c/ Inserção em 1 Clique</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cartas de Apresentação Multilíngues</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="mt-6 w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Subscrever Profissional</span>
            </button>
          </div>

          {/* Executive VIP Plan */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/50 transition-colors">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Executivo VIP</span>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-white font-mono">{formatPrice(49)} <span className="text-xs font-normal text-slate-400">/ Mês</span></p>
                <p className="text-xs text-purple-400">Ou {formatPrice(440)} / Ano (Poupe 25%)</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tudo incluído no Profissional</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Modelos Executivos C-Level & Harvard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Simulador de Entrevista c/ Avaliação IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Scripts Python para Compilação Local</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Auditoria Estratégica de Perfil LinkedIn</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suporte Executivo Prioritário</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Subscrever Executivo VIP</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Interactive FAQ Section */}
      <section className="py-16 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Dúvidas Frequentes</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-200 hover:text-white"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Quiet Professional Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Currículo Estratégico. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacidade & Dados</span>
            <span aria-hidden="true">·</span>
            <span>Segurança da Informação</span>
            <span aria-hidden="true">·</span>
            <span>Termos de Serviço</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
