import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Activity,
  Target,
  SlidersHorizontal,
  Minus
} from 'lucide-react';
import { CV_TEMPLATES } from '../data/templateCatalog';
import { GENERIC_DEFAULT_CV } from '../data/initialCV';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { BillingCycle, CVData, SubscriptionPlan, TemplateStyle } from '../types/cv';
import { CVHealthScoreOverview } from './CVHealthScoreOverview';
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
  onOpenPricing: () => void;
  onSelectPlanForCheckout?: (plan: SubscriptionPlan, cycle: BillingCycle) => void;
  onSelectTemplate: (templateId: string) => void;
  onOpenTemplateAdvisor: () => void;
  onOpenShowcase: (mode: ShowcaseMode) => void;
  currentCV?: CVData;
  onNavigateTab?: (tab: 'raw' | 'editor' | 'ats' | 'ai' | 'cover' | 'interview') => void;
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
    ruleLabel: 'Sem Foto · C-Level / EUA',
    accentColor: '#1e293b',
    hasPhoto: false
  },
  {
    id: 'ats_compact',
    label: 'ATS Estrito',
    atsLabel: '100% ATS',
    ruleLabel: 'Sem Foto · Workday / Taleo',
    accentColor: '#0f172a',
    hasPhoto: false
  },
  {
    id: 'european_europass',
    label: 'Europass UE',
    atsLabel: '88% ATS',
    ruleLabel: 'Com Foto · União Europeia',
    accentColor: '#1d4ed8',
    hasPhoto: true
  }
];

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onStartCreating,
  onOpenPricing,
  onSelectPlanForCheckout,
  onSelectTemplate,
  onOpenTemplateAdvisor,
  onOpenShowcase,
  currentCV,
  onNavigateTab
}) => {
  const { formatPrice, convertFromUSD } = useCurrency();
  const { siteText, siteLanguage } = useLanguage();
  const l = siteText.landing;
  const cycles = siteText.billingCycles;
  const [heroModelIdx, setHeroModelIdx] = useState<number>(0);
  const [heroPreviewLang, setHeroPreviewLang] = useState<'pt' | 'en'>('pt');
  const [atsHubTab, setAtsHubTab] = useState<'health' | 'simulator'>('health');
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
      ats_compact: 'Sem Foto · Workday / Taleo',
      european_europass: 'Com Foto · União Europeia'
    },
    en: {
      executive_harvard: 'No Photo · C-Level / USA',
      ats_compact: 'No Photo · Workday / Taleo',
      european_europass: 'With Photo · European Union'
    },
    es: {
      executive_harvard: 'Sin Foto · C-Level / EE. UU.',
      ats_compact: 'Sin Foto · Workday / Taleo',
      european_europass: 'Con Foto · Unión Europea'
    },
    fr: {
      executive_harvard: 'Sans Photo · C-Level / USA',
      ats_compact: 'Sans Photo · Workday / Taleo',
      european_europass: 'Avec Photo · Union Européenne'
    },
    de: {
      executive_harvard: 'Ohne Foto · C-Level / USA',
      ats_compact: 'Ohne Foto · Workday / Taleo',
      european_europass: 'Mit Foto · Europäische Union'
    },
    it: {
      executive_harvard: 'Senza Foto · C-Level / USA',
      ats_compact: 'Senza Foto · Workday / Taleo',
      european_europass: 'Con Foto · Unione Europea'
    }
  };
  const activeHeroRuleLabel =
    heroRuleLabelMap[siteLanguage]?.[activeHeroModel.id] || activeHeroModel.ruleLabel;

  const heroPreviewCVData = useMemo<CVData>(() => {
    const base = GENERIC_DEFAULT_CV;
    if (heroPreviewLang === 'pt') {
      return {
        ...base,
        templateStyle: activeHeroModel.id,
        accentColor: activeHeroModel.accentColor,
        personalDetails: {
          ...base.personalDetails,
          showPhoto: activeHeroModel.hasPhoto
        }
      };
    }

    return {
      ...base,
      templateStyle: activeHeroModel.id,
      accentColor: activeHeroModel.accentColor,
      personalDetails: {
        ...base.personalDetails,
        title: 'Director of Operations & Corporate Strategy',
        location: 'Lisbon, Portugal (Global Mobility)',
        showPhoto: activeHeroModel.hasPhoto
      },
      summary:
        'Operations executive with 12+ years leading multi-site P&L turnarounds across Europe and LATAM. Reduced logistics OPEX by 32% and scaled recurring operational EBITDA by $4.8M/year.',
      experiences: base.experiences.slice(0, 2).map((exp, idx) =>
        idx === 0
          ? {
              ...exp,
              role: 'Chief Operating Officer (COO)',
              period: '2021 – Present',
              highlights: [
                'Restructured 4 European fulfillment hubs (140 staff), cutting operating cost by 32% YoY.',
                'Delivered 99.4% on-time SLA across $62M annual volume while improving EBITDA margin by 8.4 pts.'
              ]
            }
          : {
              ...exp,
              role: 'Senior Supply Chain Manager',
              period: '2017 – 2021',
              highlights: [
                'Automated SAP ERP procurement pipelines, reducing vendor lead times from 18 to 6 days.'
              ]
            }
      )
    };
  }, [activeHeroModel, heroPreviewLang]);

  const atsPresetsByLang = useMemo(() => {
    const localized = {
      pt: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'Governança P&L', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Responsável pela gestão da equipa, acompanhamento de metas operacionais e suporte à diretoria em relatórios semanais.',
          optimizedText:
            'Liderou reestruturação operacional abrangendo 4 subsidiárias e 140 colaboradores (Governança P&L & OKRs), reduzindo OPEX em 32%, implementando ISO 9001 e elevando a margem EBITDA em 8.4 p.p.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'Microserviços gRPC', 'DevSecOps', 'SLA 99.99%', 'Latência p99'],
          defaultGenericText:
            'Responsável pela infraestrutura cloud da empresa, suporte a equipas de desenvolvimento e revisão de arquitetura.',
          optimizedText:
            'Arquitetou plataforma em Kubernetes com Microserviços gRPC e pipeline DevSecOps processando $25M/mês, reduzindo Latência p99 de 420ms para 58ms com SLA 99.99%.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'Modelagem DCF', 'Hedging Cambial', 'SOX', 'Captação'],
          defaultGenericText:
            'Responsável pelo fecho contabilístico mensal, controlo orçamental e apresentações financeiras para o conselho.',
          optimizedText:
            'Conduziu Captação de dívida estruturada de €60M, auditoria IFRS / US GAAP com conformidade SOX, Hedging Cambial e Modelagem DCF em 3 transações de M&A (-24% custo financeiro).'
        }
      },
      en: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'P&L Governance', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Responsible for managing the team, tracking operational targets, and supporting leadership with weekly reports.',
          optimizedText:
            'Led operational turnaround across 4 hubs and 140 staff (P&L Governance & OKRs), cutting OPEX by 32%, certifying ISO 9001, and expanding EBITDA margin by 8.4 pts.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'gRPC Microservices', 'DevSecOps', '99.99% SLA', 'p99 Latency'],
          defaultGenericText:
            'Responsible for company cloud infrastructure, developer support, and architecture reviews.',
          optimizedText:
            'Architected a Kubernetes platform with gRPC Microservices and DevSecOps pipelines processing $25M/mo, cutting p99 Latency from 420ms to 58ms at 99.99% SLA.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'DCF Modeling', 'FX Hedging', 'SOX', 'Capital Raise'],
          defaultGenericText:
            'Responsible for monthly accounting close, budget control, and financial presentations for the board.',
          optimizedText:
            'Directed €60M Capital Raise, IFRS / US GAAP & SOX audit compliance, FX Hedging, and DCF Modeling across 3 M&A deals (-24% financing cost).'
        }
      },
      es: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'Gobernanza P&L', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Responsable de gestionar al equipo, dar seguimiento a metas operativas y apoyar a la dirección con informes semanales.',
          optimizedText:
            'Dirigió la reestructuración operativa en 4 sedes y 140 empleados (Gobernanza P&L y OKRs), reduciendo OPEX en 32%, certificando ISO 9001 y elevando EBITDA +8.4 pts.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'Microservicios gRPC', 'DevSecOps', 'SLA 99.99%', 'Latencia p99'],
          defaultGenericText:
            'Responsable de la infraestructura cloud, soporte a equipos de desarrollo y revisión de arquitectura.',
          optimizedText:
            'Arquitectó plataforma en Kubernetes con Microservicios gRPC y DevSecOps procesando $25M/mes, reduciendo Latencia p99 de 420ms a 58ms con SLA 99.99%.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'Modelado DCF', 'Cobertura Cambiaria', 'SOX', 'Financiación'],
          defaultGenericText:
            'Responsable del cierre contable mensual, control presupuestario y reportes financieros al comité.',
          optimizedText:
            'Lideró Financiación de €60M, auditoría IFRS / US GAAP con cumplimiento SOX, Cobertura Cambiaria y Modelado DCF en 3 operaciones de M&A (-24% coste financiero).'
        }
      },
      fr: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'Gouvernance P&L', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Responsable du management d’équipe, du suivi des objectifs opérationnels et du reporting hebdomadaire.',
          optimizedText:
            'Piloté la restructuration de 4 filiales et 140 collaborateurs (Gouvernance P&L & OKRs), réduit l’OPEX de 32%, déployé ISO 9001 et haussé la marge EBITDA de 8,4 pts.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'Microservices gRPC', 'DevSecOps', 'SLA 99.99%', 'Latence p99'],
          defaultGenericText:
            'Responsable de l’infrastructure cloud, du support aux équipes de développement et de la revue d’architecture.',
          optimizedText:
            'Conçu une plateforme Kubernetes avec Microservices gRPC et pipeline DevSecOps traitant 25M$/mois, réduisant la Latence p99 de 420ms à 58ms avec un SLA 99.99%.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'Modélisation DCF', 'Couverture Change', 'SOX', 'Levée Dette'],
          defaultGenericText:
            'Responsable de la clôture comptable mensuelle, du contrôle budgétaire et des présentations au conseil.',
          optimizedText:
            'Dirigé une Levée Dette de 60M€, audit IFRS / US GAAP et conformité SOX, Couverture Change et Modélisation DCF sur 3 opérations M&A (-24% de coût financier).'
        }
      },
      de: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'P&L-Governance', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Verantwortlich für Teamleitung, Überwachung operativer Ziele und wöchentliches Management-Reporting.',
          optimizedText:
            'Leitete die operative Neuausrichtung über 4 Standorte und 140 Mitarbeitende (P&L-Governance & OKRs), senkte OPEX um 32%, führte ISO 9001 ein und steigerte EBITDA um 8,4 Pkt.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'gRPC Microservices', 'DevSecOps', '99,99% SLA', 'p99-Latenz'],
          defaultGenericText:
            'Verantwortlich für die Cloud-Infrastruktur, Entwickler-Support und Architektur-Reviews.',
          optimizedText:
            'Entwarf Kubernetes-Plattform mit gRPC Microservices und DevSecOps für 25 Mio. $/Monat, reduzierte p99-Latenz von 420ms auf 58ms bei 99,99% SLA.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'DCF-Modellierung', 'Währungs-Hedging', 'SOX', 'Finanzierung'],
          defaultGenericText:
            'Verantwortlich für den Monatsabschluss, Budgetkontrolle und Finanzberichte an den Vorstand.',
          optimizedText:
            'Steuerte 60 Mio. € Finanzierung, IFRS / US GAAP & SOX-Compliance, Währungs-Hedging und DCF-Modellierung in 3 M&A-Transaktionen (-24% Zinskosten).'
        }
      },
      it: {
        coo: {
          role: l.simRoles.coo,
          missingKeywords: ['EBITDA', 'Governance P&L', 'OPEX', 'ISO 9001', 'OKRs'],
          defaultGenericText:
            'Responsabile della gestione del team, del monitoraggio obiettivi operativi e della reportistica settimanale.',
          optimizedText:
            'Guidato la ristrutturazione operativa di 4 sedi e 140 collaboratori (Governance P&L e OKRs), riducendo OPEX del 32%, certificando ISO 9001 e migliorando EBITDA di 8,4 pt.'
        },
        tech: {
          role: l.simRoles.tech,
          missingKeywords: ['Kubernetes', 'Microservizi gRPC', 'DevSecOps', 'SLA 99.99%', 'Latenza p99'],
          defaultGenericText:
            'Responsabile dell’infrastruttura cloud aziendale, supporto ai team dev e revisione dell’architettura.',
          optimizedText:
            'Progettato piattaforma Kubernetes con Microservizi gRPC e DevSecOps da 25M$/mese, riducendo la Latenza p99 da 420ms a 58ms con SLA 99.99%.'
        },
        cfo: {
          role: l.simRoles.cfo,
          missingKeywords: ['IFRS / US GAAP', 'Modelli DCF', 'Copertura FX', 'SOX', 'Raccolta Capitali'],
          defaultGenericText:
            'Responsabile della chiusura contabile mensile, controllo budget e presentazioni al consiglio.',
          optimizedText:
            'Diretto Raccolta Capitali da 60M€, audit IFRS / US GAAP conforme SOX, Copertura FX e Modelli DCF in 3 operazioni M&A (-24% oneri finanziari).'
        }
      }
    };
    return localized[siteLanguage] || localized.pt;
  }, [siteLanguage, l.simRoles]);

  // Interactive Live ATS Quick-Checker State
  const [atsPreset, setAtsPreset] = useState<'coo' | 'tech' | 'cfo'>('coo');
  const [hasAppliedKeywords, setHasAppliedKeywords] = useState<boolean>(false);
  const [isSimCustomEdited, setIsSimCustomEdited] = useState<boolean>(false);
  const [customBulletInput, setCustomBulletInput] = useState<string>(
    atsPresetsByLang.coo.defaultGenericText
  );

  useEffect(() => {
    if (hasAppliedKeywords) {
      setCustomBulletInput(atsPresetsByLang[atsPreset].optimizedText);
    } else if (!isSimCustomEdited) {
      setCustomBulletInput(atsPresetsByLang[atsPreset].defaultGenericText);
    }
  }, [siteLanguage, atsPreset, atsPresetsByLang, hasAppliedKeywords, isSimCustomEdited]);

  const liveSimAnalysis = useMemo(() => {
    const preset = atsPresetsByLang[atsPreset];
    const sourceText = hasAppliedKeywords ? preset.optimizedText : customBulletInput;
    const normalized = sourceText.toLowerCase();

    const matchedKeywords = preset.missingKeywords.filter((kw) => {
      const tokens = kw
        .toLowerCase()
        .split(/[\s/]+/)
        .filter((tok) => tok.length >= 3);
      return tokens.some((tok) => normalized.includes(tok));
    });

    const hasMetric = /\d+[%€$MkmK]?|\+\d+|-\d+|99[.,]/.test(sourceText);
    const hasActionVerb = /^(liderou|arquitetou|conduziu|reduziu|escalou|geriu|implementou|estruturou|otimizou|entregou|expandiu|led|built|architected|scaled|reduced|managed|directed|delivered|dirigió|arquitectó|lideró|redujo|piloté|conçu|dirigé|réduit|leitete|entwarf|steuerte|reduzierte|guidato|progettato|diretto|ottimizzato)/i.test(
      sourceText.trim()
    );

    const kwRatio = matchedKeywords.length / preset.missingKeywords.length;
    const computedScore = hasAppliedKeywords
      ? 98
      : Math.min(98, Math.round(32 + kwRatio * 42 + (hasMetric ? 14 : 0) + (hasActionVerb ? 10 : 0)));

    return {
      matchedKeywords,
      hasMetric,
      hasActionVerb,
      score: computedScore
    };
  }, [atsPreset, customBulletInput, hasAppliedKeywords, atsPresetsByLang]);

  const handleApplyAtsKeywords = () => {
    setHasAppliedKeywords(true);
    setIsSimCustomEdited(false);
    setCustomBulletInput(atsPresetsByLang[atsPreset].optimizedText);
  };

  const handleResetAtsSim = (preset: 'coo' | 'tech' | 'cfo') => {
    setAtsPreset(preset);
    setHasAppliedKeywords(false);
    setIsSimCustomEdited(false);
    setCustomBulletInput(atsPresetsByLang[preset].defaultGenericText);
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

  const comparisonRows = l.matrixRows;

  return (
    <div className="theme-dual-native w-full max-w-full bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white min-h-full overflow-x-hidden selection:bg-amber-400 selection:text-slate-950 transition-colors">
      {/* 1. EDITORIAL ASYMMETRIC HERO + INTERACTIVE LIVE A4 STUDIO PREVIEW */}
      <section className="relative pt-10 pb-10 lg:pt-16 lg:pb-14 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Positioning, Action Pair & Proof */}
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

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {l.heroSubtitle}
              </p>

              {/* Focused Primary & Secondary Action Pair */}
              <div className="pt-1 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={onStartCreating}
                  className="w-full sm:w-auto min-h-[46px] px-7 py-3 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 group whitespace-nowrap touch-manipulation shadow-xs"
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

              <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => onOpenShowcase('models-cv')}
                  className="hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4"
                >
                  {l.linkCvModels}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenShowcase('examples-cv')}
                  className="hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4"
                >
                  {l.linkRealExamples}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenShowcase('models-cover')}
                  className="hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4"
                >
                  {l.linkCoverModels}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4"
                >
                  {l.linkPlansStarting} {formatPrice(proPlan?.priceMonthlyValue ?? 8)}{l.perMonth} · {l.cardAndPix}
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Live A4 Studio Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 dark:bg-[#111724] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none">
                {/* Interactive Studio Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px]">
                    {HERO_PREVIEW_MODELS.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setHeroModelIdx(idx)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                          heroModelIdx === idx
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono">
                    {(['pt', 'en'] as const).map((lng) => (
                      <button
                        key={lng}
                        type="button"
                        onClick={() => setHeroPreviewLang(lng)}
                        className={`px-2 py-1 rounded-md font-bold uppercase transition-colors ${
                          heroPreviewLang === lng
                            ? 'bg-slate-900 dark:bg-slate-800 text-amber-300'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {lng}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live A4 Paper Sheet */}
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

                {/* Studio Caption & Quick Trigger */}
                <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-slate-200 font-semibold truncate">{activeHeroRuleLabel}</p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {l.atsCompatPrefix} {activeHeroModel.atsLabel} · .docx / PDF
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: activeHeroModel.id });
                      onSelectTemplate(activeHeroModel.id);
                    }}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 font-semibold rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    {l.editThisModel}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated 4-Metric Hairline Strip */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {l.metrics.map((m) => (
              <div key={m.label}>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {m.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Integrated 5-Deliverable Suite Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-left text-xs">
            {l.deliverables.map((item) => (
              <div key={item.code} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/90 rounded-lg px-3.5 py-2.5 space-y-0.5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-400">{item.code}</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. MECHANISM: ENGENHARIA DE CANDIDATURA (01–04 Editorial Grid) */}
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
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
              {l.archDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0E131D] overflow-hidden shadow-xs dark:shadow-none">
            {l.archSteps.map((step) => (
              <div key={step.num} className="p-5 space-y-2.5">
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">{step.num}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{step.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CENTRAL INTERATIVA ATS + PROVA REAL (Antes vs. Depois & Casos) */}
      <section className="py-14 lg:py-16 bg-slate-100/70 dark:bg-[#0E131D] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
                {l.atsHubKicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {l.atsHubTitle}
              </h2>
            </div>

            <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start md:self-auto text-xs shadow-xs dark:shadow-none">
              <button
                type="button"
                onClick={() => setAtsHubTab('health')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  atsHubTab === 'health'
                    ? 'bg-slate-900 dark:bg-slate-800 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>{l.tabHealth}</span>
              </button>
              <button
                type="button"
                onClick={() => setAtsHubTab('simulator')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  atsHubTab === 'simulator'
                    ? 'bg-slate-900 dark:bg-slate-800 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>{l.tabSimulator}</span>
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
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-xs dark:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{l.simSelectRole}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('coo')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      atsPreset === 'coo'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {l.simRoles.coo}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('tech')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      atsPreset === 'tech'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {l.simRoles.tech}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAtsSim('cfo')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      atsPreset === 'cfo'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {l.simRoles.cfo}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-5 md:pb-0 md:pr-6 text-center space-y-2.5">
                  <p className="text-[11px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                    {l.simCompatLabel}
                  </p>
                  <p
                    className={`text-5xl font-bold font-mono tabular-nums tracking-tight transition-colors ${
                      liveSimAnalysis.score >= 85
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {liveSimAnalysis.score}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {liveSimAnalysis.score >= 85 ? l.simApproved : l.simRisk}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-left">
                    <div className="px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{l.simActionVerb}</span>
                      <span
                        className={
                          liveSimAnalysis.hasActionVerb
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {liveSimAnalysis.hasActionVerb ? l.simPresent : l.simMissing}
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{l.simMetricLabel}</span>
                      <span
                        className={
                          liveSimAnalysis.hasMetric
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {liveSimAnalysis.hasMetric ? l.simQuantified : l.simNoNumbers}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {l.simRequiredKeywords} {atsPresetsByLang[atsPreset].role}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {atsPresetsByLang[atsPreset].missingKeywords.map((kw, i) => {
                        const isMatched = liveSimAnalysis.matchedKeywords.includes(kw);
                        return (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                              isMatched
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1'
                                : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isMatched && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="landing-ats-tester" className="font-semibold text-slate-700 dark:text-slate-300">
                        {hasAppliedKeywords ? l.simOptimizedLabel : l.simTestLabel}
                      </label>
                      {customBulletInput !== atsPresetsByLang[atsPreset].defaultGenericText && (
                        <button
                          type="button"
                          onClick={() => handleResetAtsSim(atsPreset)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline"
                        >
                          {l.simResetExample}
                        </button>
                      )}
                    </div>
                    <textarea
                      id="landing-ats-tester"
                      rows={3}
                      value={customBulletInput}
                      onChange={(e) => {
                        setHasAppliedKeywords(false);
                        setIsSimCustomEdited(true);
                        setCustomBulletInput(e.target.value);
                      }}
                      placeholder={l.simPlaceholder}
                      className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {!hasAppliedKeywords && (
                      <button
                        type="button"
                        onClick={handleApplyAtsKeywords}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{l.simApplyXyz}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onStartCreating}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{hasAppliedKeywords ? l.simApplyToCv : l.simFixInStudio}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proof: Before / After Contrast + Documented Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Before vs After Quantitative Rewrite */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs dark:shadow-none">
              <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {l.proofContrastKicker}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {l.proofContrastTitle}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-600 dark:text-rose-400">
                    {l.proofBeforeBadge}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {l.proofBeforeQuote}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/35 dark:border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400">
                    {l.proofAfterBadge}
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {l.proofAfterQuote}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Attributable Candidate Results */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs dark:shadow-none">
              <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {l.proofCasesKicker}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {l.proofCasesTitle}
                </h3>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {l.proofCases.map((item) => (
                  <div key={item.role} className="py-3 first:pt-1 last:pb-0 space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.role}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MODELOS INTERNACIONAIS (Hairline Bento Grid) */}
      <section className="py-14 lg:py-16 bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800/80">
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'all'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {l.filterAll} ({activeMergedTemplates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('without_photo')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'without_photo'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {l.filterNoPhoto}
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('with_photo')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    templateFilter === 'with_photo'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {l.filterWithPhoto}
                </button>
              </div>
            </div>
          </div>

          {/* Visual A4 Bento Grid Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-none">
            {displayedTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-[#0B0F17] p-5 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-900/90 transition-colors group"
              >
                <div className="space-y-3">
                  <div
                    onClick={() => onOpenShowcase('models-cv')}
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
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
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

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {l.previewFreePrefix} ·{' '}
                    <span className="text-slate-800 dark:text-slate-300 font-medium">
                      {tmpl.tierRequired === 'executive'
                        ? `VIP (${formatPrice(execPlan?.priceMonthlyValue ?? 12)})`
                        : `Pro (${formatPrice(proPlan?.priceMonthlyValue ?? 8)})`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      trackFrontendTelemetry({ type: 'template_selected', templateStyle: tmpl.id });
                      onSelectTemplate(tmpl.id);
                    }}
                    className="font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 inline-flex items-center gap-1"
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

      {/* 5. PLANOS INTERATIVOS, MATRIZ COMPARATIVA & FAQ */}
      <section className="py-14 lg:py-20 bg-slate-50 dark:bg-[#0E131D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Pricing Block */}
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

              {/* Interactive 4-Cycle Billing Toggle */}
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
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
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

            {/* 3 Plan Cards: Gratuito | Pro | Executivo VIP */}
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
                      {l.equivalentPrefix} ${proCycleUsd} USD · R$ {convertFromUSD(proCycleUsd, 'BRL').toFixed(2).replace('.', ',')} BRL
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
                      {l.equivalentPrefix} ${execCycleUsd} USD · R$ {convertFromUSD(execCycleUsd, 'BRL').toFixed(2).replace('.', ',')} BRL
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
                  className="mt-6 w-full min-h-[44px] py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-900 dark:border-slate-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <span>{l.execCtaPrefix} {execDisplayName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ROI Economics Comparison: Agency vs Platform */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs dark:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {l.roiKicker}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {l.roiTitle}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {l.roiSavings}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">{l.roiAgencyTitle}</span>
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums">{l.roiAgencyPrice}</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    {l.roiAgencyPoints.map((pt) => (
                      <li key={pt}>• {pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{l.roiPlatformTitle}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {l.roiPlatformPricePrefix} {formatPrice(proPlan?.priceMonthlyValue ?? 8)}{l.perMonth}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-800 dark:text-slate-200">
                    {l.roiPlatformPoints.map((pt) => (
                      <li key={pt}>• {pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Trust & Risk-Reversal Guarantee Strip */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 shadow-xs dark:shadow-none">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{l.trustNoLockIn}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{l.trustEditableDocx}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{l.trustCardPix}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCheckoutTrigger('pro')}
                className="text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 font-semibold whitespace-nowrap inline-flex items-center gap-1 shrink-0"
              >
                <span>{l.trustStartNow}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clean Feature Comparison Table */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-none">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {l.matrixTitle}
                </h3>
                <span className="text-[11px] text-slate-500">{l.matrixSubtitle}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-5">{l.matrixCapabilityCol}</th>
                      <th className="py-3 px-4 text-center">{l.matrixFreeCol}</th>
                      <th className="py-3 px-4 text-center text-amber-700 dark:text-amber-400">{l.matrixProCol}</th>
                      <th className="py-3 px-4 text-center text-slate-900 dark:text-slate-100">{l.matrixExecCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-200">{row.feature}</td>
                        {(['free', 'pro', 'exec'] as const).map((tierKey) => {
                          const val = row[tierKey];
                          return (
                            <td key={tierKey} className="py-3 px-4 text-center">
                              {val ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Hairline Grouped FAQ */}
          <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
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

          {/* Closing Conversion Call-to-Action */}
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
                onClick={onStartCreating}
                className="min-h-[44px] px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
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

      {/* Quiet Interactive Footer */}
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
              {siteText.header.navPricing} · {l.cardAndPix}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
