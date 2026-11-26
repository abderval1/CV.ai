import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { CV_TEMPLATES } from '../data/templateCatalog';
import { GENERIC_DEFAULT_CV, GENERIC_DEFAULT_CV_PT } from '../data/initialCV';
import { TEMPLATE_CATALOG_I18N } from '../i18n/editorUiTranslations';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { BillingCycle, CVData, SubscriptionPlan, TemplateStyle } from '../types/cv';
import { DocumentMiniPreview } from './DocumentMiniPreview';
import { ShowcaseMode } from './ShowcaseGalleryView';
import {
  BILLING_CYCLES,
  BILLING_CYCLE_META,
  getCyclePriceUSD,
  getMonthlyEquivalentUSD
} from '../utils/billingCycles';
import {
  getStoredTemplatesSync,
  getStoredPlansSync,
  trackFrontendTelemetry
} from '../services/adminModulesService';

interface LandingHeroViewProps {
  onStartCreating: () => void;
  onStartGuided?: () => void;
  onStartSolo?: () => void;
  onOpenPricing: () => void;
  onSelectPlanForCheckout?: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onSelectTemplate: (templateId: string) => void;
  onOpenTemplateAdvisor: () => void;
  onOpenShowcase: (mode: ShowcaseMode) => void;
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'interview' | 'jobs') => void;
}

const HERO_PREVIEW_MODELS: Array<{
  id: TemplateStyle;
  label: string;
  atsLabel: string;
  ruleLabel: string;
  accentColor: string;
  hasPhoto: boolean;
}> = [
  {
    id: 'executive_harvard',
    label: 'Harvard ATS',
    atsLabel: '96% ATS',
    ruleLabel: 'No Photo · C-Level / USA',
    accentColor: '#1e293b',
    hasPhoto: false
  },
  {
    id: 'finance_wallstreet',
    label: 'Wall Street',
    atsLabel: '99% ATS',
    ruleLabel: 'No Photo · Finance / M&A',
    accentColor: '#0f172a',
    hasPhoto: false
  },
  {
    id: 'modern_editorial',
    label: 'Editorial',
    atsLabel: '91% ATS',
    ruleLabel: 'Photo Optional · Global',
    accentColor: '#334155',
    hasPhoto: true
  },
  {
    id: 'european_europass',
    label: 'Europass EU',
    atsLabel: '88% ATS',
    ruleLabel: 'With Photo · European Union',
    accentColor: '#1d4ed8',
    hasPhoto: true
  }
];

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onStartCreating,
  onStartGuided,
  onOpenPricing,
  onSelectPlanForCheckout,
  onSelectTemplate,
  onOpenTemplateAdvisor,
  onOpenShowcase
}) => {
  const { currency, formatPrice, convertFromUSD } = useCurrency();
  const { siteText, siteLanguage } = useLanguage();
  const l = siteText.landing;
  const cycles = siteText.billingCycles;
  const [heroModelIdx, setHeroModelIdx] = useState<number>(0);
  const [heroPreviewLang, setHeroPreviewLang] = useState<'en' | 'pt'>('en');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [showAllTemplates, setShowAllTemplates] = useState<boolean>(false);
  const [pricingCycle, setPricingCycle] = useState<BillingCycle>('yearly');
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
  const activeHeroModel = HERO_PREVIEW_MODELS[heroModelIdx] || HERO_PREVIEW_MODELS[0];

  const heroRuleLabelMap: Record<'pt' | 'en' | 'es' | 'fr' | 'de' | 'it', Record<string, string>> = {
    pt: {
      executive_harvard: 'Sem Foto · C-Level / EUA',
      finance_wallstreet: 'Sem Foto · Finanças & M&A',
      modern_editorial: 'Foto Opcional · Editorial',
      european_europass: 'Com Foto · União Europeia'
    },
    en: {
      executive_harvard: 'No Photo · C-Level / USA',
      finance_wallstreet: 'No Photo · Finance & M&A',
      modern_editorial: 'Photo Optional · Editorial',
      european_europass: 'With Photo · European Union'
    },
    es: {
      executive_harvard: 'Sin Foto · C-Level / EE. UU.',
      finance_wallstreet: 'Sin Foto · Finanzas & M&A',
      modern_editorial: 'Foto Opcional · Editorial',
      european_europass: 'Con Foto · Unión Europea'
    },
    fr: {
      executive_harvard: 'Sans Photo · C-Level / USA',
      finance_wallstreet: 'Sans Photo · Finance & M&A',
      modern_editorial: 'Photo Optionnelle · Éditorial',
      european_europass: 'Avec Photo · Union Européenne'
    },
    de: {
      executive_harvard: 'Ohne Foto · C-Level / USA',
      finance_wallstreet: 'Ohne Foto · Finance & M&A',
      modern_editorial: 'Foto Optional · Editorial',
      european_europass: 'Mit Foto · Europäische Union'
    },
    it: {
      executive_harvard: 'Senza Foto · C-Level / USA',
      finance_wallstreet: 'Senza Foto · Finanza & M&A',
      modern_editorial: 'Foto Opzionale · Editoriale',
      european_europass: 'Con Foto · Unione Europea'
    }
  };
  const activeHeroRuleLabel =
    heroRuleLabelMap[siteLanguage]?.[activeHeroModel.id] || activeHeroModel.ruleLabel;

  const heroPreviewCVData = useMemo<CVData>(() => {
    const base = heroPreviewLang === 'pt' ? GENERIC_DEFAULT_CV_PT : GENERIC_DEFAULT_CV;
    return {
      ...base,
      templateStyle: activeHeroModel.id,
      accentColor: activeHeroModel.accentColor,
      personalDetails: {
        ...base.personalDetails,
        showPhoto: activeHeroModel.hasPhoto
      }
    };
  }, [activeHeroModel, heroPreviewLang]);

  const activeMergedTemplates = useMemo(() => {
    const adminMap = new Map(adminTemplates.map((t) => [t.id, t]));
    const i18nMap = siteLanguage === 'pt' ? undefined : TEMPLATE_CATALOG_I18N[siteLanguage];
    return CV_TEMPLATES.filter((tmpl) => {
      const cfg = adminMap.get(tmpl.id);
      return !cfg || cfg.isActive !== false;
    })
      .map((tmpl) => {
        const cfg = adminMap.get(tmpl.id);
        const loc = i18nMap?.[tmpl.id];
        return {
          ...tmpl,
          shortName: loc?.shortName || (siteLanguage === 'pt' ? cfg?.shortName : undefined) || tmpl.shortName,
          tagline: loc?.tagline || tmpl.tagline,
          badge: loc?.badge || cfg?.badge || tmpl.badge,
          atsScore: cfg?.atsScore ?? tmpl.atsScore,
          displayOrder: cfg?.displayOrder ?? 99
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [adminTemplates, siteLanguage]);

  const filteredTemplates = activeMergedTemplates.filter((tmpl) => {
    if (templateFilter === 'without_photo') return !tmpl.hasPhoto;
    if (templateFilter === 'with_photo') return tmpl.hasPhoto;
    return true;
  });

  const displayedTemplates =
    templateFilter === 'all' && !showAllTemplates
      ? filteredTemplates.slice(0, 6)
      : filteredTemplates;

  const faqs = l.faqs;

  const handleCheckoutTrigger = (plan: SubscriptionPlan) => {
    if (onSelectPlanForCheckout) {
      onSelectPlanForCheckout(plan, pricingCycle);
    } else {
      onOpenPricing();
    }
  };

  const proCycleUsd = getCyclePriceUSD(proPlan, pricingCycle);
  const execCycleUsd = getCyclePriceUSD(execPlan, pricingCycle);
  const proMonthlyEq = getMonthlyEquivalentUSD(proPlan, pricingCycle);
  const execMonthlyEq = getMonthlyEquivalentUSD(execPlan, pricingCycle);
  const cycleMeta = BILLING_CYCLE_META[pricingCycle];
  const cycleText = cycles[pricingCycle];
  const proDisplayName = siteLanguage === 'pt' ? proPlan?.name || l.proDefaultName : l.proDefaultName;
  const proDisplayBadge =
    siteLanguage === 'pt' ? proPlan?.badgeText || l.proPopularBadge : l.proPopularBadge;
  const proDisplayFeatures =
    siteLanguage === 'pt' && proPlan?.features && proPlan.features.length > 0
      ? proPlan.features
      : l.proFeatures;
  const execDisplayName =
    siteLanguage === 'pt' ? execPlan?.name || l.execDefaultName : l.execDefaultName;
  const execDisplayBadge =
    siteLanguage === 'pt' ? execPlan?.badgeText || l.execBadge : l.execBadge;
  const execDisplayFeatures =
    siteLanguage === 'pt' && execPlan?.features && execPlan.features.length > 0
      ? execPlan.features
      : l.execFeatures;

  return (
    <div className="theme-dual-native w-full max-w-full bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white min-h-full overflow-x-hidden selection:bg-amber-400 selection:text-slate-950 transition-colors">
      {/* 1. CLEAN FOCUSED HERO + LIVE A4 PREVIEW */}
      <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Clear Positioning & Primary Action */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-amber-700 dark:text-amber-400">
                {l.heroKicker}
              </p>

              <h1
                className="font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-50 leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.8vw, 3.2rem)', textWrap: 'balance' }}
              >
                {l.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {l.heroSubtitle}
              </p>

              {/* Focused Action Pair */}
              <div className="pt-2 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={onStartGuided || onStartCreating}
                  className="w-full sm:w-auto min-h-[46px] px-7 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 group whitespace-nowrap touch-manipulation shadow-sm"
                >
                  <span>{l.ctaBuild}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenShowcase('models-cv')}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{l.ctaExploreModels}</span>
                </button>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>{l.trustEditableDocx}</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenShowcase('examples-cv')}
                  className="hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4"
                >
                  {l.linkRealExamples}
                </button>
              </div>
            </div>

            {/* Right Column: Live A4 Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 dark:bg-[#111724] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px]">
                    {HERO_PREVIEW_MODELS.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setHeroModelIdx(idx)}
                        className={`px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          heroModelIdx === idx
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono">
                    {(['en', 'pt'] as const).map((lng) => (
                      <button
                        key={lng}
                        type="button"
                        onClick={() => setHeroPreviewLang(lng)}
                        className={`px-2 py-1 rounded-md font-bold uppercase transition-colors ${
                          heroPreviewLang === lng
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {lng}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  onClick={() => onSelectTemplate(activeHeroModel.id)}
                  className="bg-slate-200/75 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex items-center justify-center cursor-pointer group"
                >
                  <div className="a4-paper-preserve w-full max-w-[265px] aspect-[210/297] bg-white shadow-xl rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.015]">
                    <DocumentMiniPreview
                      kind="cv"
                      templateStyle={activeHeroModel.id}
                      accentColor={activeHeroModel.accentColor}
                      hasPhoto={activeHeroModel.hasPhoto}
                      cvData={heroPreviewCVData}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-slate-200 font-semibold truncate">
                      {activeHeroRuleLabel}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {activeHeroModel.atsLabel} · Word (.docx) · PDF
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: activeHeroModel.id });
                      onSelectTemplate(activeHeroModel.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs"
                  >
                    {l.editThisModel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIMPLE 4-STEP CREATION FLOW */}
      <section className="py-12 lg:py-14 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
                {l.archKicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                {l.archTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">{l.archDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0E131D] overflow-hidden shadow-xs dark:shadow-none">
            {l.archSteps.map((step) => (
              <div key={step.num} className="p-5 space-y-2.5">
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {step.num}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLEAN TEMPLATES SHOWCASE (NO E-COMMERCE PRICE TAGS ON CARDS) */}
      <section className="py-12 lg:py-16 bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
                {l.templatesKicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                {l.templatesTitle}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {l.templatesSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setTemplateFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  templateFilter === 'all'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {l.filterAll} ({activeMergedTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter('without_photo')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  templateFilter === 'without_photo'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {l.filterNoPhoto}
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter('with_photo')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  templateFilter === 'with_photo'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {l.filterWithPhoto}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-colors group"
              >
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: tmpl.id });
                      onSelectTemplate(tmpl.id);
                    }}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    <div className="a4-paper-preserve w-full max-w-[165px] aspect-[210/297] bg-white shadow-lg rounded-xs overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                      <DocumentMiniPreview
                        kind="cv"
                        templateStyle={tmpl.id}
                        accentColor={tmpl.accentColor}
                        hasPhoto={tmpl.hasPhoto}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {tmpl.hasPhoto ? l.badgeWithPhoto : l.badgeNoPhotoAts}
                      </span>
                      <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400 font-semibold">
                        {tmpl.atsScore}% ATS
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {tmpl.shortName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.tagline}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {tmpl.regions.slice(0, 2).join(' · ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: tmpl.id });
                      onSelectTemplate(tmpl.id);
                    }}
                    className="font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>{l.useModel}</span>
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
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold underline underline-offset-4"
              >
                {showAllTemplates
                  ? l.showLessModels
                  : `${l.viewAllModelsPrefix} ${filteredTemplates.length} ${l.viewAllModelsSuffix}`}
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={onOpenTemplateAdvisor}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold inline-flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{l.openTemplateAdvisor}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. SIMPLE PLANS & FAQ */}
      <section className="py-12 lg:py-16 bg-slate-50 dark:bg-[#0E131D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
                {l.pricingKicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {l.pricingTitle}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {l.pricingSubtitle}
              </p>

              <div className="pt-2 inline-flex flex-wrap items-center justify-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-xs dark:shadow-none">
                {BILLING_CYCLES.map((cycle) => {
                  const meta = BILLING_CYCLE_META[cycle];
                  const isActive = pricingCycle === cycle;
                  return (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setPricingCycle(cycle)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <span>{cycles[cycle].label}</span>
                      {meta.badgeText && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isActive
                              ? 'bg-slate-950/15 text-slate-950'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {meta.badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Free Visual Tier */}
              <div className="bg-white dark:bg-[#0B0F17] p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs dark:shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {l.freeTierName}
                    </span>
                    <span className="text-[11px] text-slate-500">{l.freeTierTag}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      $0 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {l.freeTierPriceUnit}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {l.freeTierDesc}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {l.freeTierFeatures.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenShowcase('models-cv')}
                  className="mt-6 w-full min-h-[44px] py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <span>{l.freeTierCta}</span>
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white dark:bg-[#0B0F17] p-6 sm:p-7 rounded-xl border-2 border-amber-500 dark:border-amber-400/60 flex flex-col justify-between shadow-md dark:shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {proDisplayName}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      {proDisplayBadge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {formatPrice(proCycleUsd)}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {cycleText.shortUnit}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {currency === 'USD'
                        ? `$${proCycleUsd} USD · ${l.cardAndPix}`
                        : `${l.equivalentPrefix} $${proCycleUsd} USD · R$ ${convertFromUSD(proCycleUsd, 'BRL').toFixed(2).replace('.', ',')} BRL`}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {proMonthlyEq
                        ? `${l.equivalentMonthlyPrefix} ${formatPrice(proMonthlyEq)}${l.perMonth} (${cycleMeta.badgeText})`
                        : `${l.fullAccessForDaysPrefix} ${cycleMeta.durationDays} ${l.daysSuffix}`}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {proDisplayFeatures.slice(0, 5).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckoutTrigger('pro')}
                  className="mt-6 w-full min-h-[44px] py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <span>{l.proCtaPrefix} {proDisplayName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Executive VIP Plan */}
              <div className="bg-white dark:bg-[#0B0F17] p-6 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs dark:shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      {execDisplayName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{execDisplayBadge}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {formatPrice(execCycleUsd)}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {cycleText.shortUnit}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {currency === 'USD'
                        ? `$${execCycleUsd} USD · ${l.cardAndPix}`
                        : `${l.equivalentPrefix} $${execCycleUsd} USD · R$ ${convertFromUSD(execCycleUsd, 'BRL').toFixed(2).replace('.', ',')} BRL`}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      {execMonthlyEq
                        ? `${l.equivalentMonthlyPrefix} ${formatPrice(execMonthlyEq)}${l.perMonth} (${cycleMeta.badgeText})`
                        : l.includesStarAndCLevel}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {execDisplayFeatures.slice(0, 5).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckoutTrigger('executive')}
                  className="mt-6 w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs touch-manipulation"
                >
                  <span>{l.execCtaPrefix} {execDisplayName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Compact FAQ */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{l.faqTitle}</h3>
              <span className="text-xs text-slate-500">{l.faqRightNote}</span>
            </div>

            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-xs dark:shadow-none">
              {faqs.map((faq, idx) => (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Closing CTA */}
          <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-xs dark:shadow-none">
            <div className="space-y-1.5 max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {l.closingKicker}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {l.closingTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {l.closingSubtitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={onStartGuided || onStartCreating}
                className="min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <span>{l.closingCtaBuild}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenShowcase('examples-cv')}
                className="min-h-[44px] px-5 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>{l.closingCtaExamples}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-7 text-center text-xs text-slate-500 bg-white dark:bg-[#0B0F17]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {siteText.brandName}. {l.footerRights}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onOpenShowcase('models-cv')}
              className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {l.linkCvModels}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenShowcase('examples-cv')}
              className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {l.linkRealExamples}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenTemplateAdvisor}
              className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {siteText.header.toolAdvisor}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenPricing}
              className="hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              {siteText.header.navPricing}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
