import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Sparkles,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ExternalLink,
  FolderOpen,
  LogOut,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
  onOpenMyResumes: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing,
  onOpenMyResumes
}) => {
  const { user, logout } = useAuth();
  const { formatPrice } = useCurrency();
  const [copiedPix, setCopiedPix] = useState(false);
  const PIX_KEY = 'f4693532-31da-4e95-a589-19bccab0d915';

  if (!isOpen || !user) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const planLabel =
    user.plan === 'executive'
      ? 'Executivo VIP'
      : 'Profissional Pro';

  const planBadgeColor =
    user.plan === 'executive'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-base">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold">{user.name}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Subscription Status Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assinatura Atual
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${planBadgeColor}`}
              >
                {planLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <p className="text-slate-400">Ciclo de Cobrança:</p>
                <p className="font-semibold text-slate-800 capitalize">
                  {user.billingCycle === 'yearly'
                    ? 'Anual (Poupe até 31%)'
                    : 'Mensal'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Créditos de IA Mensais:</p>
                <p className="font-semibold text-slate-800">
                  Ilimitados (Sem Limite)
                </p>
              </div>
            </div>

            {user.stripeCustomerId && (
              <div className="pt-2 border-t border-slate-200 text-xs flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  ID Stripe: <span className="font-mono text-[11px] text-slate-500">{user.stripeCustomerId.substring(0, 14)}...</span>
                </span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Ativo na Stripe
                </span>
              </div>
            )}

            {/* Upgrade / Change Plan CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {user.plan === 'pro'
                    ? 'Fazer Upgrade para Executivo VIP'
                    : 'Gerir Assinatura ou Alterar Plano'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acesso Rápido
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMyResumes();
                }}
                className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Meus Currículos</p>
                  <p className="text-[11px] text-slate-500">Abrir ou duplicar versões salvas</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Tabela de Preços</p>
                  <p className="text-[11px] text-slate-500">Stripe Live e Chave Pix oficial</p>
                </div>
              </button>
            </div>
          </div>

          {/* Pix Key Instant Reference for Brazil and International Transfers */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                Pagamento Rápido via Pix
              </span>
              <button
                type="button"
                onClick={handleCopyPix}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
              >
                {copiedPix ? 'Copiado!' : 'Copiar Chave'}
              </button>
            </div>
            <p className="text-amber-900/80 text-[11px] leading-relaxed">
              Para ativação imediata via Pix sem cartão, utilize a chave Pix oficial cadastrada:
            </p>
            <div className="p-2 bg-white rounded-lg border border-amber-200 font-mono text-[11px] text-slate-800 select-all break-all">
              {PIX_KEY}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">ID: {user.id.substring(0, 12)}...</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
