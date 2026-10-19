import React, { useState } from 'react';
import { SAAS_PLANS } from '../data/initialCV';
import { useAuth } from '../context/AuthContext';
import { SubscriptionPlan } from '../types/cv';
import { X, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, upgradePlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  const handleConfirmUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      upgradePlan(selectedPlan);
      setIsUpgrading(false);
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Planos & Assinaturas Profissionais
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Desbloqueie exportação ilimitada em Word (.docx), IA sem limites e aprovação garantida no ATS.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {upgradeSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Assinatura Ativada com Sucesso!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Parabéns! O seu plano {selectedPlan === 'executive' ? 'Executivo VIP' : 'Profissional'} está agora ativo. Todos os recursos avançados de IA e exportação em Word foram desbloqueados.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center items-center gap-3">
              <div className="p-1 bg-slate-100 rounded-lg flex items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Faturação Mensal (USD / Kz)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Anual (Poupe 25%)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Desconto
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAAS_PLANS.map((plan) => {
                const isCurrent = user?.plan === plan.id;
                const isSelected = selectedPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`rounded-xl p-5 border cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900 shadow-md bg-white'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        Mais Popular
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{plan.tagline}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xl font-bold font-mono text-slate-900">
                          {billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {plan.id === 'free' ? 'Sem custos' : 'Acesso imediato'}
                        </span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 pt-2 text-xs text-slate-700">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11.5px] leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(plan.id);
                          if (plan.id !== 'free') handleConfirmUpgrade();
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : isSelected && plan.id !== 'free'
                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCurrent ? 'Plano Atual' : plan.ctaText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">Garantia de Satisfação & Segurança</p>
                  <p className="text-[11px] text-slate-500">
                    Cancele a qualquer momento com 1 clique. Pagamento via Cartão, Multicaixa Express ou Transferência bancária.
                  </p>
                </div>
              </div>

              {selectedPlan !== 'free' && user?.plan !== selectedPlan && (
                <button
                  type="button"
                  onClick={handleConfirmUpgrade}
                  disabled={isUpgrading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUpgrading ? 'A Ativar Plano...' : 'Ativar Plano Agora'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
