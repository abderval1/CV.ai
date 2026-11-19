import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileText,
  Target,
  Award,
  GraduationCap,
  Globe,
  UserCheck,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { CVData } from '../types/cv';
import { EXECUTIVE_DEMO_CV } from '../data/initialCV';
import { useLanguage } from '../context/LanguageContext';

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
  const { siteText, studioText } = useLanguage();
  const h = siteText.health;
  const c = studioText.healthCriteria;

  const [profileMode, setProfileMode] = useState<'current' | 'benchmark'>('current');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

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
      title: c.contact.title,
      category: c.contact.category,
      icon: UserCheck,
      weight: 15,
      earned: contactPts,
      status: contactStatus,
      summary:
        contactStatus === 'passed'
          ? c.contact.passed
          : contactStatus === 'warning'
          ? c.contact.warning
          : c.contact.missing,
      recommendation: c.contact.rec,
      actionLabel: c.contact.action,
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
      title: c.summary.title,
      category: c.summary.category,
      icon: FileText,
      weight: 15,
      earned: summaryPts,
      status: summaryStatus,
      summary:
        summaryStatus === 'passed'
          ? c.summary.passed
          : summaryStatus === 'warning'
          ? c.summary.warning
          : c.summary.missing,
      recommendation: c.summary.rec,
      actionLabel: c.summary.action,
      targetTab: 'ai'
    });

    const experiences = activeCV.experiences || [];
    let expPts = 0;
    let metricsCount = 0;
    if (experiences.length >= 2) expPts += 10;
    else if (experiences.length === 1) expPts += 5;

    experiences.forEach((exp) => {
      (exp.highlights || []).forEach((hl) => {
        if (/\d+%|\$\d+|\b\d+\b/i.test(hl)) metricsCount++;
      });
    });

    if (metricsCount >= 3) expPts += 15;
    else if (metricsCount >= 1) expPts += 8;

    const expStatus = expPts >= 22 ? 'passed' : expPts >= 12 ? 'warning' : 'missing';

    list.push({
      id: 'experience',
      title: c.experience.title,
      category: c.experience.category,
      icon: TrendingUp,
      weight: 25,
      earned: expPts,
      status: expStatus,
      summary:
        expStatus === 'passed'
          ? `${metricsCount} ${c.experience.passedSuffix}`
          : expStatus === 'warning'
          ? c.experience.warning
          : c.experience.missing,
      recommendation: c.experience.rec,
      actionLabel: c.experience.action,
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
      title: c.competencies.title,
      category: c.competencies.category,
      icon: Target,
      weight: 20,
      earned: compPts,
      status: compStatus,
      summary:
        compStatus === 'passed'
          ? `${competencies.length} ${c.competencies.passedSuffix}`
          : compStatus === 'warning'
          ? c.competencies.warning
          : c.competencies.missing,
      recommendation: c.competencies.rec,
      actionLabel: c.competencies.action,
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
      title: c.education.title,
      category: c.education.category,
      icon: GraduationCap,
      weight: 15,
      earned: eduPts,
      status: eduStatus,
      summary:
        eduStatus === 'passed'
          ? c.education.passed
          : eduStatus === 'warning'
          ? c.education.warning
          : c.education.missing,
      recommendation: c.education.rec,
      actionLabel: c.education.action,
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
      title: c.global.title,
      category: c.global.category,
      icon: Globe,
      weight: 10,
      earned: globalPts,
      status: globalStatus,
      summary:
        globalStatus === 'passed'
          ? c.global.passed
          : globalStatus === 'warning'
          ? c.global.warning
          : c.global.missing,
      recommendation: c.global.rec,
      actionLabel: c.global.action,
      targetTab: 'editor'
    });

    return list;
  }, [activeCV, c]);

  const totalScore = useMemo(() => {
    const raw = audits.reduce((sum, item) => sum + item.earned, 0);
    return Math.min(100, Math.max(0, Math.round(raw)));
  }, [audits]);

  const tierInfo = useMemo(() => {
    if (totalScore >= 90) {
      return {
        label: h.tierApprovedLabel,
        ringColor: '#10b981',
        statusText: h.tierApprovedDesc,
        grade: 'A+'
      };
    }
    if (totalScore >= 70) {
      return {
        label: h.tierCompetitiveLabel,
        ringColor: '#f59e0b',
        statusText: h.tierCompetitiveDesc,
        grade: 'B'
      };
    }
    if (totalScore >= 50) {
      return {
        label: h.tierWarningLabel,
        ringColor: '#f97316',
        statusText: h.tierWarningDesc,
        grade: 'C'
      };
    }
    return {
      label: h.tierCriticalLabel,
      ringColor: '#f43f5e',
      statusText: h.tierCriticalDesc,
      grade: 'D'
    };
  }, [totalScore, h]);

  const passedCount = audits.filter((a) => a.status === 'passed').length;
  const warningCount = audits.filter((a) => a.status === 'warning').length;
  const missingCount = audits.filter((a) => a.status === 'missing').length;

  const radius = 52;
  const stroke = 7;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  const content = (
    <div className="theme-dual-native space-y-5">
      {/* Sub-header with Profile Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {h.subtitle}
        </p>

        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg self-start sm:self-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setProfileMode('current')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              profileMode === 'current'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{h.myResumeBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('benchmark')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              profileMode === 'benchmark'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{h.benchmarkBtn}</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Elevation Split Cockpit */}
      <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 shadow-xs dark:shadow-none">
        {/* Left Summary Column */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {h.globalAtsIndex}
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {h.gradePrefix} {tierInfo.grade}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center shrink-0">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                  <circle
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
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
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
                    {totalScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {tierInfo.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tierInfo.statusText}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
              <span>{passedCount} {h.optimizedSuffix}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{warningCount} {h.adjustSuffix}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{missingCount} {h.missingSuffix}</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab?.('editor')}
              className={`w-full min-h-[42px] py-2.5 px-4 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                totalScore >= 90
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {totalScore >= 90 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{h.openInEditor}</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{h.fixInEditor}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Hairline Audit Rows */}
        <div className="lg:col-span-7 divide-y divide-slate-200 dark:divide-slate-800/80">
          {audits.map((audit) => {
            const IconComponent = audit.icon;
            const isSelected = selectedAuditId === audit.id;

            const statusIcon =
              audit.status === 'passed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : audit.status === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              );

            return (
              <div
                key={audit.id}
                onClick={() => setSelectedAuditId(isSelected ? null : audit.id)}
                className={`px-5 py-3.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-50 dark:bg-slate-900/90'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComponent className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {audit.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 hidden sm:inline shrink-0">
                          · {audit.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {audit.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {audit.earned}/{audit.weight}
                    </span>
                    {statusIcon}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {audit.recommendation}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateTab?.(audit.targetTab);
                      }}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
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
    <section className="theme-dual-native py-16 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{content}</div>
    </section>
  );
};
