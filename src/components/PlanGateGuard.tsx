import React, { useEffect, useState } from 'react';
import {
  Lock,
  Sparkles,
  Crown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getStoredPlansSync } from '../services/adminModulesService';

interface PlanGateGuardProps {
  requiredTier: 'authenticated' | 'pro' | 'executive';
  featureTitle: string;
  featureSubtitle: string;
  featureBenefits: string[];
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
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
  const [livePlans, setLivePlans] = useState(() => getStoredPlansSync());

  useEffect(() => {
    const syncHandler = () => setLivePlans(getStoredPlansSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  const proPlanConfig = livePlans.find((p) => p.id === 'pro');
  const execPlanConfig = livePlans.find((p) => p.id === 'executive');

  const proPriceMonthly = proPlanConfig?.priceMonthlyValue ?? 2;
  const execPriceMonthly = execPlanConfig?.priceMonthlyValue ?? 4;

  const isExecutiveRequired = requiredTier === 'executive';
  const isProRequired = requiredTier === 'pro';
  const isAuthRequired = requiredTier === 'authenticated' && !isAuthenticated;

  const currentPlan = user?.plan || 'public';

  const badgeConfig: {
    label: string;
    bg: string;
    iconBg: string;
    btnBg: string;
    targetPlan: 'pro' | 'executive';
  } = isExecutiveRequired
    ? {
        label: `Exclusivo ${execPlanConfig?.name || 'Executivo VIP'}`,
        bg: 'from-purple-900/40 via-slate-900 to-slate-900 border-purple-500/30',
        iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/30',
        btnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white',
        targetPlan: 'executive'
      }
    : isProRequired
    ? {
        label: `Exclusivo ${proPlanConfig?.name || 'Plano Profissional Pro'}`,
        bg: 'from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/30',
        btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        targetPlan: 'pro'
      }
    : {
        label: 'Acesso Exclusivo para Assinantes',
        bg: 'from-slate-950 via-slate-900 to-slate-950 border-slate-700/80',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-indigo-500/30',
        btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
        targetPlan: 'pro'
      };

  return (
    <div className="min-h-[460px] flex items-center justify-center p-4 sm:p-6 my-auto">
      <div
        className={`w-full max-w-xl bg-gradient-to-b ${badgeConfig.bg} rounded-3xl border shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden backdrop-blur-md`}
      >
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-3 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${badgeConfig.iconBg} flex items-center justify-center shadow-lg shrink-0`}
            >
              {isExecutiveRequired ? (
                <Crown className="w-6 h-6" />
              ) : isProRequired ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                {badgeConfig.label}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                {featureTitle}
              </h3>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Seu Plano:</span>
            <span className="text-xs font-bold text-slate-200 capitalize bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              {currentPlan === 'public'
                ? 'Visitante (Sem Acesso)'
                : currentPlan === 'free'
                ? 'Gratuito (Sem Acesso)'
                : currentPlan === 'pro'
                ? proPlanConfig?.name || 'Plano Pro'
                : execPlanConfig?.name || 'Executivo VIP'}
            </span>
          </div>
        </div>

        {/* Description & Value Proposition */}
        <div className="py-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{featureSubtitle}</p>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              O que este recurso inclui:
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
        <div className="space-y-3 pt-2">
          {isAuthRequired ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar / Criar Conta</span>
              </button>
              <button
                type="button"
                onClick={onOpenPricingModal}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <span>Ver Planos ({formatPrice(proPriceMonthly)}+)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenPricingModal}
              className={`w-full py-3.5 px-6 ${badgeConfig.btnBg} font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isExecutiveRequired
                  ? `Fazer Upgrade para ${execPlanConfig?.name || 'Executivo VIP'} — ${formatPrice(execPriceMonthly)}/mês`
                  : `Fazer Upgrade para ${proPlanConfig?.name || 'Plano Pro'} — ${formatPrice(proPriceMonthly)}/mês`}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
