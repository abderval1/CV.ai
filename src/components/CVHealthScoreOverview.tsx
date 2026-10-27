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
  TrendingUp,
  Info,
  PartyPopper
} from 'lucide-react';
import { CVData } from '../types/cv';
import { EXECUTIVE_DEMO_CV } from '../data/initialCV';

interface CVHealthScoreOverviewProps {
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'python' | 'interview') => void;
  onOpenPricing?: () => void;
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
  onOpenPricing
}) => {
  const [profileMode, setProfileMode] = useState<'current' | 'benchmark'>('current');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance canvas confetti animation engine
  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = canvas.parentElement?.clientHeight || 450;

    const colors = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#38bdf8', '#fbbf24', '#ffffff'];
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
      shape: 'rect' | 'circle';
    }> = [];

    // Emit 70 particles from center-left ring area
    const startX = canvas.width > 600 ? 120 : canvas.width / 2;
    const startY = 160;

    for (let i = 0; i < 75; i++) {
      const angle = (Math.PI * 2 * i) / 75 + (Math.random() - 0.5) * 0.8;
      const speed = Math.random() * 6 + 2.5;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5, // Initial upward burst
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    let animationId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.vx *= 0.98; // Air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 2800);

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive && elapsed < 3000) {
        animationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animationId = requestAnimationFrame(animate);
  }, []);

  // Evaluate whichever CV is active (User's live CV or benchmark)
  const activeCV = useMemo(() => {
    if (profileMode === 'benchmark') {
      return EXECUTIVE_DEMO_CV;
    }
    return currentCV || EXECUTIVE_DEMO_CV;
  }, [profileMode, currentCV]);

  // Comprehensive ATS Section Audits
  const audits: SectionAudit[] = useMemo(() => {
    const list: SectionAudit[] = [];

    // 1. Identificação & Contactos Profissionais (15 pts)
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
      category: 'Estrutura Básica',
      icon: UserCheck,
      weight: 15,
      earned: contactPts,
      status: contactStatus,
      summary:
        contactStatus === 'passed'
          ? 'Cabeçalho completo com nome, cargo estratégico e contacto profissional.'
          : contactStatus === 'warning'
          ? 'Dados essenciais presentes, mas falta LinkedIn ou indicativo internacional.'
          : 'Campos vitais vazios (nome, cargo executivo ou email de contacto ausentes).',
      recommendation:
        'Recrutadores ATS descartam currículos sem telefone formatado ou perfil de LinkedIn verificado.',
      actionLabel: 'Completar Contactos',
      targetTab: 'editor'
    });

    // 2. Resumo Executivo & Posicionamento (15 pts)
    const summaryText = activeCV.summary?.trim() || '';
    let summaryPts = 0;
    if (summaryText.length >= 140) {
      summaryPts = 15;
    } else if (summaryText.length >= 50) {
      summaryPts = 8;
    } else if (summaryText.length > 0) {
      summaryPts = 4;
    }

    const summaryStatus =
      summaryPts >= 14 ? 'passed' : summaryPts >= 7 ? 'warning' : 'missing';

    list.push({
      id: 'summary',
      title: 'Resumo Executivo Estratégico',
      category: 'Posicionamento C-Level',
      icon: FileText,
      weight: 15,
      earned: summaryPts,
      status: summaryStatus,
      summary:
        summaryStatus === 'passed'
          ? 'Resumo conciso e articulado com foco em liderança e entrega de valor.'
          : summaryStatus === 'warning'
          ? 'Resumo curto (< 140 caracteres); os robôs ATS buscam densidade semântica no perfil.'
          : 'Nenhum resumo cadastrado. Recrutadores gastam 6 segundos e precisam ver a síntese imediata.',
      recommendation:
        'Utilize o Otimizador IA para formular um sumário de alto impacto com posicionamento de mercado.',
      actionLabel: 'Otimizar Resumo com IA',
      targetTab: 'ai'
    });

    // 3. Experiências com Métricas Quantificadas - Google XYZ (25 pts)
    const experiences = activeCV.experiences || [];
    let expPts = 0;
    let metricsCount = 0;

    if (experiences.length >= 2) {
      expPts += 10;
    } else if (experiences.length === 1) {
      expPts += 5;
    }

    experiences.forEach((exp) => {
      (exp.highlights || []).forEach((h) => {
        if (/\d+%|\$\d+|\b\d+\b/i.test(h)) {
          metricsCount++;
        }
      });
    });

    if (metricsCount >= 3) {
      expPts += 15;
    } else if (metricsCount >= 1) {
      expPts += 8;
    }

    const expStatus = expPts >= 22 ? 'passed' : expPts >= 12 ? 'warning' : 'missing';

    list.push({
      id: 'experience',
      title: 'Experiência & Métricas (Google XYZ)',
      category: 'Impacto Comprovado',
      icon: TrendingUp,
      weight: 25,
      earned: expPts,
      status: expStatus,
      summary:
        expStatus === 'passed'
          ? `Excelente: ${metricsCount} conquistas quantificadas com percentuais (%) ou números de impacto.`
          : expStatus === 'warning'
          ? 'Experiências listadas, porém a maioria são descrições de tarefas sem resultados numéricos.'
          : 'Seção de experiências ausente ou sem cargos descritos.',
      recommendation:
        'Substitua verbos passivos por realizações mensuráveis: "Atingiu [X], medido por [Y], fazendo [Z]".',
      actionLabel: 'Adicionar Métricas na IA',
      targetTab: 'ai'
    });

    // 4. Competências Chave & Palavras-Chave ATS (20 pts)
    const competencies = activeCV.competencies || [];
    let compPts = 0;
    if (competencies.length >= 4) {
      compPts = 20;
    } else if (competencies.length >= 2) {
      compPts = 12;
    } else if (competencies.length === 1) {
      compPts = 5;
    }

    const compStatus = compPts >= 18 ? 'passed' : compPts >= 10 ? 'warning' : 'missing';

    list.push({
      id: 'competencies',
      title: 'Competências Chave & Indexação',
      category: 'Filtro Semântico ATS',
      icon: Target,
      weight: 20,
      earned: compPts,
      status: compStatus,
      summary:
        compStatus === 'passed'
          ? `${competencies.length} competências estruturadas para fácil varredura por robôs ATS.`
          : compStatus === 'warning'
          ? 'Poucas competências catalogadas. Adicione competências técnicas e estratégicas da sua área.'
          : 'Sem competências registradas. Robôs ATS filtram currículos pela correspondência de palavras-chave.',
      recommendation:
        'Consulte a vaga no Radar ATS para extrair exatamente as palavras-chave exigidas pelos recrutadores.',
      actionLabel: 'Auditar no Radar ATS',
      targetTab: 'ats'
    });

    // 5. Formação Acadêmica & Credenciais (15 pts)
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
      title: 'Formação Acadêmica & Graus',
      category: 'Qualificação Formal',
      icon: GraduationCap,
      weight: 15,
      earned: eduPts,
      status: eduStatus,
      summary:
        eduStatus === 'passed'
          ? 'Graus e instituições educacionais devidamente estruturados.'
          : eduStatus === 'warning'
          ? 'Formação com dados incompletos (ano ou nome da instituição ausentes).'
          : 'Nenhuma formação acadêmica informada.',
      recommendation:
        'Indique a licenciatura, mestrado ou pós-graduação com nome oficial da instituição.',
      actionLabel: 'Preencher Formação',
      targetTab: 'editor'
    });

    // 6. Idiomas & Certificações Globais (10 pts)
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
      title: 'Idiomas & Certificações Globais',
      category: 'Diferencial Competitivo',
      icon: Globe,
      weight: 10,
      earned: globalPts,
      status: globalStatus,
      summary:
        globalStatus === 'passed'
          ? 'Idiomas com proficiência e certificações internacionais cadastradas.'
          : globalStatus === 'warning'
          ? 'Idiomas informados, mas sem certificações profissionais para reforçar o perfil.'
          : 'Nenhum idioma ou certificação declarada.',
      recommendation:
        'Empresas multinacionais priorizam candidatos com certificações do setor e fluência em inglês.',
      actionLabel: 'Adicionar Idiomas',
      targetTab: 'editor'
    });

    return list;
  }, [activeCV]);

  // Calculate Total Score
  const totalScore = useMemo(() => {
    const raw = audits.reduce((sum, item) => sum + item.earned, 0);
    return Math.min(100, Math.max(0, Math.round(raw)));
  }, [audits]);

  // Tier metadata
  const tierInfo = useMemo(() => {
    if (totalScore >= 90) {
      return {
        label: 'Excelente · Pronto para ATS & Entrevistas',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        ringColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        statusText: 'Passa diretamente pelos filtros ATS das maiores empresas do mundo.',
        grade: 'A+'
      };
    }
    if (totalScore >= 70) {
      return {
        label: 'Bom · Pequenos Ajustes Recomendados',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.25)',
        statusText: 'Perfil competitivo, mas faltam palavras-chave e métricas específicas.',
        grade: 'B'
      };
    }
    if (totalScore >= 50) {
      return {
        label: 'Atenção · Seções Críticas Ausentes',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        ringColor: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.25)',
        statusText: 'Risco moderado de rejeição pelos robôs de recrutamento.',
        grade: 'C'
      };
    }
    return {
      label: 'Crítico · Risco Alto de Eliminação no OCR',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      ringColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.25)',
      statusText: 'Currículo com campos em branco que falharão na triagem automática.',
      grade: 'D'
    };
  }, [totalScore]);

  // Counts of sections
  const passedCount = audits.filter((a) => a.status === 'passed').length;
  const warningCount = audits.filter((a) => a.status === 'warning').length;
  const missingCount = audits.filter((a) => a.status === 'missing').length;

  // Auto-celebrate with confetti when user reaches high score
  useEffect(() => {
    if (totalScore >= 90 && !hasCelebrated) {
      const timer = setTimeout(() => {
        triggerConfetti();
        setHasCelebrated(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [totalScore, hasCelebrated, triggerConfetti]);

  // When user switches profile mode to benchmark, celebrate the benchmark score
  useEffect(() => {
    if (profileMode === 'benchmark') {
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [profileMode, triggerConfetti]);

  // SVG Progress Ring calculations
  const radius = 56;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <section className="py-16 bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Diagnóstico em Tempo Real
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Score de Saúde do Currículo (ATS Health Score)
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Auditoria algorítmica baseada nos critérios de triagem dos principais sistemas corporativos
              (Workday, Taleo, Greenhouse, Lever).
            </p>
          </div>

          {/* Profile Evaluated Switcher */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setProfileMode('current')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                profileMode === 'current'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Meu Currículo Atual</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileMode('benchmark')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                profileMode === 'benchmark'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Padrão Executivo (98%)</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Column 1: Circular Progress Ring & High-level Verdict (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            {/* Confetti Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 z-30 w-full h-full"
            />

            {/* Ambient background glow */}
            <div
              className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none filter blur-3xl opacity-30"
              style={{ backgroundColor: tierInfo.ringColor }}
            />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Índice de Otimização ATS
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${tierInfo.badgeColor}`}
                >
                  Grau {tierInfo.grade}
                </span>
              </div>

              {/* High Score Celebration Banner */}
              {totalScore >= 90 && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-[11px] leading-tight">
                      Aprovado no Filtro A+ dos Robôs ATS!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={triggerConfetti}
                    className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-md font-bold text-[10px] transition-colors flex items-center gap-1 shrink-0"
                    title="Soltar confetti novamente"
                  >
                    <span>🎉 Celebrar</span>
                  </button>
                </div>
              )}

              {/* Progress Ring Visual */}
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                    {/* Background track circle */}
                    <circle
                      stroke="#1e293b"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      stroke={tierInfo.ringColor}
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeDasharray={`${circumference} ${circumference}`}
                      style={{
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 0.8s ease-in-out'
                      }}
                      strokeLinecap="round"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                    />
                  </svg>

                  {/* Centered Score */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono text-white tracking-tight">
                      {totalScore}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Pontos
                    </span>
                  </div>
                </div>

                {/* Score Summary Metrics */}
                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {tierInfo.label}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tierInfo.statusText}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-center">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                <p className="text-lg font-bold text-emerald-400 font-mono">{passedCount}</p>
                <p className="text-[11px] font-medium text-slate-400">Otimizadas</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                <p className="text-lg font-bold text-amber-400 font-mono">{warningCount}</p>
                <p className="text-[11px] font-medium text-slate-400">Ajustar</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                <p className="text-lg font-bold text-rose-400 font-mono">{missingCount}</p>
                <p className="text-[11px] font-medium text-slate-400">Ausentes</p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              {totalScore >= 90 ? (
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('editor')}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Currículo Validado · Abrir no Editor</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('editor')}
                  className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Corrigir Seções no Editor de Currículo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Detailed Section Audits List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Auditoria Seção a Seção ({audits.length} Parâmetros)
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Clique para ver a recomendação
              </span>
            </div>

            <div className="space-y-2.5">
              {audits.map((audit) => {
                const IconComponent = audit.icon;
                const isSelected = selectedAuditId === audit.id;

                const statusColor =
                  audit.status === 'passed'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : audit.status === 'warning'
                    ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

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
                    className={`border rounded-xl p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/80 border-slate-700 ring-1 ring-slate-600'
                        : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                    }`}
                    onClick={() => setSelectedAuditId(isSelected ? null : audit.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border shrink-0 ${statusColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">
                              {audit.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {audit.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {audit.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-white">
                            {audit.earned}/{audit.weight}
                          </span>
                          <span className="text-[10px] text-slate-500 block">pts</span>
                        </div>
                        {statusIcon}
                      </div>
                    </div>

                    {/* Expanded Diagnostic Insight & Direct Action */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-150">
                        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5 text-slate-300">
                          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-semibold text-white">Recomendação ATS:</span>
                            <p className="text-slate-400 leading-relaxed text-[11px]">
                              {audit.recommendation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab?.(audit.targetTab);
                            }}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
                          >
                            <span>{audit.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footnote Advice Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Dica dos Especialistas:</strong> O segredo dos 95%+ no ATS é nunca deixar seções em
              branco e aplicar a fórmula Google XYZ em pelo menos 3 conquistas.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('ats')}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <span>Verificar com descrição da vaga</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
