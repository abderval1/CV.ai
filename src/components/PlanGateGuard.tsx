import React, { useEffect, useState } from 'react';
import {
  Lock,
  Crown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { getStoredPlansSync } from '../services/adminModulesService';

interface PlanGateGuardProps {
  requiredTier: 'authenticated' | 'pro' | 'executive';
  featureTitle: string;
  featureSubtitle: string;
  featureBenefits: string[];
  onOpenAuthModal: () => void;
  onOpenPricingModal: (targetPlan?: 'pro' | 'executive') => void;
}

export const PlanGateGuard: React.FC<PlanGateGuardProps> = ({
  requiredTier,
  featureTitle,
  featureSubtitle,
  featureBenefits,
  onOpenAuthModal,
  onOpenPricingModal
}) => {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const { siteText, siteLanguage } = useLanguage();
  const g = siteText.gate;
  const l = siteText.landing;
  const [livePlans, setLivePlans] = useState(() => getStoredPlansSync());

  useEffect(() => {
    const syncHandler = () => setLivePlans(getStoredPlansSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const proPlanConfig = livePlans.find((p) => p.id === 'pro');
  const execPlanConfig = livePlans.find((p) => p.id === 'executive');

  const proPriceMonthly = proPlanConfig?.priceMonthlyValue ?? 8;
  const execPriceMonthly = execPlanConfig?.priceMonthlyValue ?? 12;

  const proDisplayName =
    siteLanguage === 'pt' ? proPlanConfig?.name || l.proDefaultName : l.proDefaultName;
  const execDisplayName =
    siteLanguage === 'pt' ? execPlanConfig?.name || l.execDefaultName : l.execDefaultName;

  const isExecutiveRequired = requiredTier === 'executive';
  const isProRequired = requiredTier === 'pro';
  const isAuthRequired = requiredTier === 'authenticated' && !isAuthenticated;

  const currentPlan = user?.plan || 'public';

  const exclusivePrefix: Record<'pt' | 'en' | 'es' | 'fr' | 'de' | 'it', string> = {
    pt: 'Exclusivo',
    en: 'Exclusive:',
    es: 'Exclusivo',
    fr: 'Exclusif',
    de: 'Exklusiv',
    it: 'Esclusivo'
  };

  const subscriberBadgeLabel: Record<'pt' | 'en' | 'es' | 'fr' | 'de' | 'it', string> = {
    pt: 'Acesso Exclusivo para Assinantes',
    en: 'Exclusive Subscriber Access',
    es: 'Acceso Exclusivo para Suscriptores',
    fr: 'Accès Réservé aux Abonnés',
    de: 'Exklusiver Abonnenten-Zugang',
    it: 'Accesso Riservato agli Abbonati'
  };

  const badgeConfig: {
    label: string;
    border: string;
    iconBg: string;
    btnBg: string;
    targetPlan: 'pro' | 'executive';
  } = isExecutiveRequired
    ? {
        label: `${exclusivePrefix[siteLanguage]} ${execDisplayName}`,
        border: 'border-slate-700',
        iconBg: 'bg-slate-800 border border-slate-700 text-amber-400',
        btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        targetPlan: 'executive'
      }
    : isProRequired
    ? {
        label: `${exclusivePrefix[siteLanguage]} ${proDisplayName}`,
        border: 'border-slate-800',
        iconBg: 'bg-amber-400 text-slate-950',
        btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        targetPlan: 'pro'
      }
    : {
        label: subscriberBadgeLabel[siteLanguage],
        border: 'border-slate-800',
        iconBg: 'bg-slate-800 border border-slate-700 text-amber-400',
        btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        targetPlan: 'pro'
      };

  return (
    <div className="min-h-[460px] flex items-center justify-center p-4 sm:p-6 my-auto">
      <div
        className={`w-full max-w-xl bg-[#0B0F17] ${badgeConfig.border} rounded-xl border shadow-xl p-6 sm:p-8 text-white relative overflow-hidden`}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-lg ${badgeConfig.iconBg} flex items-center justify-center shrink-0`}
            >
              {isExecutiveRequired ? (
                <Crown className="w-5 h-5" />
              ) : isProRequired ? (
                <SlidersHorizontal className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
                {badgeConfig.label}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white">
                {featureTitle}
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">{g.yourPlan}</span>
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {currentPlan === 'public'
                ? g.visitor
                : currentPlan === 'free'
                ? g.free
                : currentPlan === 'pro'
                ? proDisplayName
                : execDisplayName}
            </span>
          </div>
        </div>

        {/* Description & Value Proposition */}
        <div className="py-5 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{featureSubtitle}</p>

          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {g.whatsIncluded}
            </span>
            <ul className="space-y-2">
              {featureBenefits.map((benefit, i) => (
                <li key={i} className="text-xs text-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="space-y-3 pt-1">
          {isAuthRequired ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full min-h-[44px] py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
              >
                <UserCheck className="w-4 h-4" />
                <span>{g.signInOrCreate}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenPricingModal(badgeConfig.targetPlan)}
                className="w-full min-h-[44px] py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-2 touch-manipulation"
              >
                <span>{g.seePlans} ({formatPrice(proPriceMonthly)}+)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenPricingModal(badgeConfig.targetPlan)}
              className={`w-full min-h-[46px] py-3 px-5 ${badgeConfig.btnBg} font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 group touch-manipulation`}
            >
              <span>
                {isExecutiveRequired
                  ? `${g.activatePrefix} ${execDisplayName} — ${formatPrice(execPriceMonthly)}/${siteText.billingCycles.monthly.shortUnit}`
                  : `${g.activatePrefix} ${proDisplayName} — ${formatPrice(proPriceMonthly)}/${siteText.billingCycles.monthly.shortUnit}`}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <p className="text-[11px] text-center text-slate-400">
            {g.trustFooter}
          </p>
        </div>
      </div>
    </div>
  );
};
