import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Award,
  GraduationCap,
  Globe,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { CVData } from '../types/cv';
import { EXECUTIVE_DEMO_CV } from '../data/initialCV';

interface CVHealthScoreOverviewProps {
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'interview') => void;
  onOpenPricing?: () => void;
  embedded?: boolean;
}

export interface SectionAudit {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  weight: number;
  earned: number;
  status: 'passed' | 'warning' | 'missing';
  summary: string;
  recommendation: string;
  actionLabel: string;
  targetTab: 'editor' | 'ai' | 'ats' | 'raw';
}

export const CVHealthScoreOverview: React.FC<CVHealthScoreOverviewProps> = ({
  currentCV,
  onNavigateTab,
  embedded = false
}) => {
  const [profileMode, setProfileMode] = useState<'current' | 'benchmark'>('current');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = canvas.parentElement?.clientHeight || 420;

    const colors = ['#10b981', '#f59e0b', '#38bdf8', '#fbbf24', '#ffffff'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }> = [];

    const startX = canvas.width > 600 ? 120 : canvas.width / 2;
    const startY = 140;

    for (let i = 0; i < 48; i++) {
      const angle = (Math.PI * 2 * i) / 48 + (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1
      });
    }

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 2200);

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          ctx.restore();
        }
      });

      if (alive && elapsed < 2400) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const activeCV = useMemo(() => {
    if (profileMode === 'benchmark') {
      return EXECUTIVE_DEMO_CV;
    }
    return currentCV || EXECUTIVE_DEMO_CV;
  }, [profileMode, currentCV]);

  const audits: SectionAudit[] = useMemo(() => {
    const list: SectionAudit[] = [];

    const { name, title, email, phone, linkedin } = activeCV.personalDetails || {};
    let contactPts = 0;
    if (name?.trim()) contactPts += 4;
    if (title?.trim()) contactPts += 4;
    if (email?.trim() && email.includes('@')) contactPts += 3;
    if (phone?.trim()) contactPts += 2;
    if (linkedin?.trim()) contactPts += 2;

    const contactStatus =
      contactPts >= 13 ? 'passed' : contactPts >= 7 ? 'warning' : 'missing';

    list.push({
      id: 'contact',
      title: 'Identificação & Contactos',
      category: 'Cabeçalho',
      icon: UserCheck,
      weight: 15,
      earned: contactPts,
      status: contactStatus,
      summary:
        contactStatus === 'passed'
          ? 'Cabeçalho completo com nome, cargo e contacto profissional.'
          : contactStatus === 'warning'
          ? 'Falta LinkedIn ou indicativo internacional de telefone.'
          : 'Campos de identificação essenciais ausentes.',
      recommendation:
        'Sistemas ATS exigem nome completo, cargo pretendido, e-mail, telefone com código do país e LinkedIn.',
      actionLabel: 'Completar Contactos',
      targetTab: 'editor'
    });

    const summaryText = activeCV.summary?.trim() || '';
    let summaryPts = 0;
    if (summaryText.length >= 140) summaryPts = 15;
    else if (summaryText.length >= 50) summaryPts = 8;
    else if (summaryText.length > 0) summaryPts = 4;

    const summaryStatus =
      summaryPts >= 14 ? 'passed' : summaryPts >= 7 ? 'warning' : 'missing';

    list.push({
      id: 'summary',
      title: 'Resumo Executivo',
      category: 'Posicionamento',
      icon: FileText,
      weight: 15,
      earned: summaryPts,
      status: summaryStatus,
      summary:
        summaryStatus === 'passed'
          ? 'Resumo conciso com foco em senioridade e valor entregue.'
          : summaryStatus === 'warning'
          ? 'Resumo curto (< 140 caracteres); amplie para melhor indexação ATS.'
          : 'Resumo ausente. Recrutadores analisam o topo em 6 segundos.',
      recommendation:
        'Use 3 a 5 linhas com anos de experiência, especialidade e resultados mensuráveis.',
      actionLabel: 'Otimizar Resumo',
      targetTab: 'ai'
    });

    const experiences = activeCV.experiences || [];
    let expPts = 0;
    let metricsCount = 0;
    if (experiences.length >= 2) expPts += 10;
    else if (experiences.length === 1) expPts += 5;

    experiences.forEach((exp) => {
      (exp.highlights || []).forEach((h) => {
        if (/\d+%|\$\d+|\b\d+\b/i.test(h)) metricsCount++;
      });
    });

    if (metricsCount >= 3) expPts += 15;
    else if (metricsCount >= 1) expPts += 8;

    const expStatus = expPts >= 22 ? 'passed' : expPts >= 12 ? 'warning' : 'missing';

    list.push({
      id: 'experience',
      title: 'Experiência & Métricas (Google XYZ)',
      category: 'Impacto',
      icon: TrendingUp,
      weight: 25,
      earned: expPts,
      status: expStatus,
      summary:
        expStatus === 'passed'
          ? `${metricsCount} conquistas quantificadas com métricas ou percentuais.`
          : expStatus === 'warning'
          ? 'Experiências descritas sem métricas numéricas suficientes.'
          : 'Nenhum cargo registado na secção de experiência.',
      recommendation:
        'Aplique a fórmula Google XYZ: "Atingiu [X resultado], medido por [Y], através de [Z ação]".',
      actionLabel: 'Otimizar Realizações',
      targetTab: 'ai'
    });

    const competencies = activeCV.competencies || [];
    let compPts = 0;
    if (competencies.length >= 4) compPts = 20;
    else if (competencies.length >= 2) compPts = 12;
    else if (competencies.length === 1) compPts = 5;

    const compStatus = compPts >= 18 ? 'passed' : compPts >= 10 ? 'warning' : 'missing';

    list.push({
      id: 'competencies',
      title: 'Competências & Palavras-Chave ATS',
      category: 'Indexação',
      icon: Target,
      weight: 20,
      earned: compPts,
      status: compStatus,
      summary:
        compStatus === 'passed'
          ? `${competencies.length} grupos de competências estruturados para leitura ATS.`
          : compStatus === 'warning'
          ? 'Poucas competências listadas para corresponder aos filtros da vaga.'
          : 'Nenhuma competência adicionada.',
      recommendation:
        'Mapeie ferramentas, metodologias e competências técnicas exatamente como pedidas na vaga.',
      actionLabel: 'Auditar no Radar ATS',
      targetTab: 'ats'
    });

    const educations = activeCV.educations || [];
    let eduPts = 0;
    if (educations.length >= 1 && educations[0].degree?.trim() && educations[0].institution?.trim()) {
      eduPts = 15;
    } else if (educations.length >= 1) {
      eduPts = 8;
    }

    const eduStatus = eduPts >= 14 ? 'passed' : eduPts >= 7 ? 'warning' : 'missing';

    list.push({
      id: 'education',
      title: 'Formação Académica',
      category: 'Credenciais',
      icon: GraduationCap,
      weight: 15,
      earned: eduPts,
      status: eduStatus,
      summary:
        eduStatus === 'passed'
          ? 'Graus e instituições académicas devidamente estruturados.'
          : eduStatus === 'warning'
          ? 'Formação com nome da instituição ou período incompleto.'
          : 'Nenhuma formação académica registada.',
      recommendation:
        'Informe grau completo, instituição reconhecida e período de conclusão.',
      actionLabel: 'Preencher Formação',
      targetTab: 'editor'
    });

    const languages = activeCV.languages || [];
    const trainings = activeCV.trainings || [];
    let globalPts = 0;
    if (languages.length >= 1 && (trainings.length >= 1 || languages.length >= 2)) {
      globalPts = 10;
    } else if (languages.length >= 1 || trainings.length >= 1) {
      globalPts = 6;
    }

    const globalStatus = globalPts >= 9 ? 'passed' : globalPts >= 5 ? 'warning' : 'missing';

    list.push({
      id: 'global',
      title: 'Idiomas & Certificações',
      category: 'Diferencial',
      icon: Globe,
      weight: 10,
      earned: globalPts,
      status: globalStatus,
      summary:
        globalStatus === 'passed'
          ? 'Idiomas na escala CEFR e certificações profissionais incluídas.'
          : globalStatus === 'warning'
          ? 'Adicione certificações ou segundo idioma com nível CEFR.'
          : 'Nenhum idioma ou certificação declarada.',
      recommendation:
        'Use níveis CEFR padronizados (C2, C1, B2) e siglas oficiais de certificações.',
      actionLabel: 'Adicionar Idiomas',
      targetTab: 'editor'
    });

    return list;
  }, [activeCV]);

  const totalScore = useMemo(() => {
    const raw = audits.reduce((sum, item) => sum + item.earned, 0);
    return Math.min(100, Math.max(0, Math.round(raw)));
  }, [audits]);

  const tierInfo = useMemo(() => {
    if (totalScore >= 90) {
      return {
        label: 'Aprovado para ATS & Entrevistas',
        ringColor: '#10b981',
        statusText: 'Estrutura compatível com Workday, Greenhouse, Taleo e triagem executiva.',
        grade: 'A+'
      };
    }
    if (totalScore >= 70) {
      return {
        label: 'Competitivo · Ajustes pontuais',
        ringColor: '#f59e0b',
        statusText: 'Boa base; reforce palavras-chave e resultados numéricos para chegar a 90%+.',
        grade: 'B'
      };
    }
    if (totalScore >= 50) {
      return {
        label: 'Atenção · Lacunas estruturais',
        ringColor: '#f97316',
        statusText: 'Risco moderado de filtragem automática antes da leitura humana.',
        grade: 'C'
      };
    }
    return {
      label: 'Crítico · Campos essenciais vazios',
      ringColor: '#f43f5e',
      statusText: 'Complete o perfil, experiências e competências para passar pelos filtros ATS.',
      grade: 'D'
    };
  }, [totalScore]);

  const passedCount = audits.filter((a) => a.status === 'passed').length;
  const warningCount = audits.filter((a) => a.status === 'warning').length;
  const missingCount = audits.filter((a) => a.status === 'missing').length;

  useEffect(() => {
    if (profileMode === 'benchmark') {
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [profileMode, triggerConfetti]);

  const radius = 52;
  const stroke = 7;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  const content = (
    <div className="space-y-5">
      {/* Sub-header with Profile Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Auditoria instantânea dos 6 critérios exigidos por Workday, Taleo, Greenhouse e Lever.
        </p>

        <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg self-start sm:self-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setProfileMode('current')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              profileMode === 'current'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Meu Currículo</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('benchmark')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              profileMode === 'benchmark'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Referência 98%</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Elevation Split Cockpit */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Summary Column */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-20 w-full h-full"
          />

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-slate-400">
                Índice ATS Global
              </span>
              <span className="font-mono font-semibold text-slate-200">
                Grau {tierInfo.grade}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center shrink-0">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                  <circle
                    stroke="#1e293b"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <circle
                    stroke={tierInfo.ringColor}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{
                      strokeDashoffset,
                      transition: 'stroke-dashoffset 0.7s ease-out'
                    }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                    {totalScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <h3 className="text-sm font-bold text-white leading-snug">
                  {tierInfo.label}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tierInfo.statusText}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-300">
              <span>{passedCount} otimizadas</span>
              <span className="text-slate-600">·</span>
              <span>{warningCount} ajustar</span>
              <span className="text-slate-600">·</span>
              <span>{missingCount} ausentes</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab?.('editor')}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                totalScore >= 90
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {totalScore >= 90 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Abrir no Editor de Currículo</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Corrigir Secções no Editor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Hairline Audit Rows */}
        <div className="lg:col-span-7 divide-y divide-slate-800/80">
          {audits.map((audit) => {
            const IconComponent = audit.icon;
            const isSelected = selectedAuditId === audit.id;

            const statusIcon =
              audit.status === 'passed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : audit.status === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              );

            return (
              <div
                key={audit.id}
                onClick={() => setSelectedAuditId(isSelected ? null : audit.id)}
                className={`px-5 py-3.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-900/90' : 'hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {audit.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 hidden sm:inline shrink-0">
                          · {audit.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {audit.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-300">
                      {audit.earned}/{audit.weight}
                    </span>
                    {statusIcon}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audit.recommendation}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateTab?.(audit.targetTab);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
                    >
                      <span>{audit.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="py-16 bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
};
