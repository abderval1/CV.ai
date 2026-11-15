import React, { useState, useEffect, useCallback } from 'react';
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
  Lock,
  Receipt,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Ban,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { SaaSOrder } from '../types/cv';
import { fetchUserOrders, cancelUserSubscription } from '../services/saasDbService';
import { getStoredPlatformSettingsSync, submitGdprRequest } from '../services/adminModulesService';
import { formatCycleLabel, formatCycleWithDiscount, getPixKeyTypeLabel } from '../utils/billingCycles';

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
  const { user, logout, hasActivePlan } = useAuth();
  const { formatPrice } = useCurrency();
  const { showSuccess, showError, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');
  const [orders, setOrders] = useState<SaaSOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [isSubmittingGdpr, setIsSubmittingGdpr] = useState<boolean>(false);
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const sync = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('admin-config-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const pixKey = platformSettings.pixKey || 'f4693532-31da-4e95-a589-19bccab0d915';
  const pixKeyLabel = getPixKeyTypeLabel(platformSettings.pixKeyType);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const list = await fetchUserOrders(user.id, user.email);
      setOrders(list);
    } catch (err) {
      console.warn('Erro ao carregar faturas:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user]);

  // Load orders when modal opens or when switching to billing tab
  useEffect(() => {
    if (isOpen && activeTab === 'billing' && user) {
      loadOrders();
    }
  }, [isOpen, activeTab, user, loadOrders]);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    showSuccess('Copiado!', `${label} copiado para a área de transferência.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    showSuccess('Chave Pix Copiada!', `Chave Pix (${pixKeyLabel}) pronta para transferência.`);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Tem a certeza de que deseja cancelar a renovação da sua assinatura? O seu acesso ao editor continuará disponível até ao fim do período já faturado, mas não haverá novas cobranças.'
      )
    ) {
      return;
    }

    setIsCanceling(true);
    try {
      const res = await cancelUserSubscription(user.id, user.stripeSubscriptionId);
      if (res.success) {
        showSuccess('Assinatura Cancelada', res.message);
        // Refresh local orders list to show updated status
        await loadOrders();
      } else {
        showError('Erro ao Cancelar', res.message);
      }
    } catch (err: any) {
      showError('Erro ao Cancelar', err.message || 'Falha ao processar cancelamento.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOpenStripePortal = async () => {
    if (!user.stripeCustomerId) {
      showInfo('Gestão de Faturação', 'A sua subscrição foi ativada diretamente através do checkout seguro.');
      return;
    }
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.stripeCustomerId,
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
        showInfo('Portal de Faturação', 'A redirecionar para a gestão de cartões e faturas.');
      } else {
        showInfo('Gestão de Faturação', 'Subscrição gerida via faturação direta na plataforma.');
      }
    } catch {
      showInfo('Gestão de Faturação', 'Subscrição gerida via faturação direta na plataforma.');
    }
  };

  const handleSubmitGdpr = async (type: 'export_data' | 'delete_account') => {
    setIsSubmittingGdpr(true);
    try {
      await submitGdprRequest(
        type,
        type === 'export_data'
          ? 'Solicitação de portabilidade de dados enviada pelo titular via Área do Utilizador.'
          : 'Solicitação de eliminação definitiva de conta e histórico conforme Art. 17 RGPD.'
      );
      showSuccess(
        type === 'export_data' ? 'Pedido de Exportação Registado' : 'Pedido de Eliminação Registado',
        'A nossa equipa de privacidade recebeu a sua solicitação e processará em conformidade com o RGPD.'
      );
    } catch (err: any) {
      showError('Erro RGPD', err?.message || 'Não foi possível submeter o pedido neste momento.');
    } finally {
      setIsSubmittingGdpr(false);
    }
  };

  const isSubscriptionCanceled = user.stripeStatus === 'canceled';
  const isSubscriptionActive =
    (user.stripeStatus === 'active' || hasActivePlan) && !isSubscriptionCanceled;

  const planLabel =
    user.plan === 'executive'
      ? 'Executivo VIP'
      : user.plan === 'pro'
      ? 'Profissional Pro'
      : 'Plano Gratuito';

  const planBadgeColor =
    user.plan === 'executive'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : user.plan === 'pro'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-rose-100 text-rose-800 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{user.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {user.role === 'admin' ? 'Administrador' : 'Membro'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Perfil & Acesso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('billing');
              loadOrders();
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all relative ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            <span>Assinatura &amp; Faturas</span>
            {isSubscriptionActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {isSubscriptionCanceled && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {activeTab === 'profile' ? (
            /* TAB 1: PROFILE & ACCESS OVERVIEW */
            <div className="space-y-6">
              {/* Subscription Status Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assinatura & Acesso
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${planBadgeColor}`}
                  >
                    {planLabel}
                  </span>
                </div>

                {/* Download License Permission Status */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    hasActivePlan
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      hasActivePlan
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-950 font-black'
                    }`}
                  >
                    {hasActivePlan ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold">
                      {hasActivePlan
                        ? 'Acesso Completo & Downloads Desbloqueados'
                        : 'Edição e Downloads Requerem Assinatura'}
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {hasActivePlan
                        ? 'Edição passo a passo, otimização com IA e exportações oficiais 100% limpas em Microsoft Word (.docx) e PDF de Alta Resolução.'
                        : 'No plano gratuito, o currículo está em modo de pré-visualização. Para editar campos, salvar na nuvem e exportar Word/PDF, ative o plano Pro ou Executivo VIP.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <p className="text-slate-400">Ciclo de Cobrança:</p>
                    <p className="font-semibold text-slate-800">
                      {formatCycleWithDiscount(user.billingCycle)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Créditos de IA Mensais:</p>
                    <p className="font-semibold text-slate-800">
                      {hasActivePlan ? 'Ilimitados (Sem Limite)' : 'Plano Básico'}
                    </p>
                  </div>
                </div>

                {user.stripeCustomerId && (
                  <div className="pt-2 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Método de Renovação: Cartão Recorrente
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Pagamento Configurado
                    </span>
                  </div>
                )}

                {/* Upgrade / Change Plan CTA */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPricing();
                    }}
                    className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs ${
                      !hasActivePlan
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {!hasActivePlan
                        ? 'Ativar Plano & Desbloquear Downloads'
                        : user.plan === 'pro'
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
                    className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-3 shadow-2xs"
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
                      setActiveTab('billing');
                      loadOrders();
                    }}
                    className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-3 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Histórico de Transações</p>
                      <p className="text-[11px] text-slate-500">Faturas e recibos de pagamento</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pix Key Instant Reference */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-700" />
                    Chave Pix Oficial ({pixKeyLabel})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline flex items-center gap-1"
                  >
                    {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar Chave'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-xl border border-teal-200 font-mono text-[11px] text-slate-800 select-all break-all shadow-2xs">
                  {pixKey}
                </div>
              </div>

              {/* RGPD Privacy & Data Rights */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>Privacidade &amp; Direitos RGPD / LGPD</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pode solicitar a portabilidade dos seus dados ou a eliminação definitiva da sua conta a qualquer momento.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingGdpr}
                    onClick={() => handleSubmitGdpr('export_data')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-lg text-[11px] transition-colors disabled:opacity-50"
                  >
                    Solicitar Exportação RGPD
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingGdpr}
                    onClick={() => handleSubmitGdpr('delete_account')}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg text-[11px] transition-colors disabled:opacity-50"
                  >
                    Solicitar Eliminação RGPD
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: SUBSCRIPTION DETAILS & TRANSACTION HISTORY (STRIPE + FIRESTORE) */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 1. Subscription Status & Stripe Management Card */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Status da Assinatura</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Consulte os detalhes da sua subscrição, próxima renovação e histórico de faturas.
                    </p>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {isSubscriptionActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Assinatura Ativa</span>
                      </span>
                    ) : isSubscriptionCanceled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Ban className="w-3.5 h-3.5 text-amber-700" />
                        <span>Cancelada (Expira em breve)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inativa / Plano Gratuito</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Plano Atual</span>
                    <span className="font-bold text-slate-900 text-sm capitalize">
                      {user.plan === 'executive'
                        ? 'Executivo VIP (C-Level & Global)'
                        : user.plan === 'pro'
                        ? 'Profissional Pro'
                        : 'Plano Gratuito'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Ciclo: <strong className="text-slate-700">{formatCycleLabel(user.billingCycle)}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {isSubscriptionCanceled ? 'Término do Período' : 'Próxima Renovação'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {user.subscriptionExpiresAt
                        ? new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-PT')
                        : 'Recorrente contínua'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isSubscriptionCanceled
                        ? 'Sem renovação automática programada'
                        : 'Faturamento automático ativo'}
                    </span>
                  </div>
                </div>

                {user.stripeCustomerId && (
                  <div className="p-3 bg-white/80 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                    <span>Método de Renovação: <strong className="text-slate-800">Cartão Recorrente Ativo</strong></span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verificado
                    </span>
                  </div>
                )}

                {/* Action Buttons: Billing Portal & Cancel Subscription */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {user.stripeCustomerId && (
                    <button
                      type="button"
                      onClick={handleOpenStripePortal}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gerir Cartão &amp; Faturas</span>
                    </button>
                  )}

                  {isSubscriptionActive && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCanceling ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>{isCanceling ? 'A cancelar...' : 'Cancelar Renovação'}</span>
                    </button>
                  )}

                  {!hasActivePlan && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPricing();
                      }}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ativar Plano de Assinatura</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Transaction & Invoices History from Firestore */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-slate-700" />
                      <span>Histórico de Transações &amp; Faturas</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Registos de pagamentos efetuados via Cartão e Pix.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadOrders}
                    disabled={isLoadingOrders}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    title="Recarregar transações"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Orders Content */}
                {isLoadingOrders ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">A carregar faturas...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Nenhuma transação registada</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                        Assim que concluir um pagamento via Cartão ou Pix, a fatura oficial com o número do pedido
                        ficará disponível para consulta aqui.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPricing();
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Planos & Efetuar Pagamento</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.map((order) => {
                      const isStripe = order.paymentMethod === 'stripe' || order.paymentMethod === 'card';
                      const isPix = order.paymentMethod === 'pix';

                      return (
                        <div
                          key={order.id}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isStripe
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    : isPix
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isStripe ? (
                                  <CreditCard className="w-4 h-4" />
                                ) : isPix ? (
                                  <QrCode className="w-4 h-4" />
                                ) : (
                                  <Receipt className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {order.orderNumber}
                                </span>
                                <span className="text-[11px] text-slate-400 block flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(order.createdAt).toLocaleDateString('pt-PT')} às{' '}
                                  {new Date(order.createdAt).toLocaleTimeString('pt-PT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-xs text-slate-900 block">
                                {order.currency === 'BRL'
                                  ? `R$ ${order.amount.toFixed(2)}`
                                  : `$${order.amount} ${order.currency}`}
                              </span>
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${
                                  order.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : order.status === 'refunded'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : order.status === 'failed'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {order.status === 'paid'
                                  ? 'Pago'
                                  : order.status === 'refunded'
                                  ? 'Reembolsado'
                                  : order.status === 'failed'
                                  ? 'Falhou'
                                  : 'Pendente'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <span>
                              Plano:{' '}
                              <strong className="text-slate-800 capitalize">
                                {order.plan === 'executive' ? 'Executivo VIP' : 'Profissional'}
                              </strong>{' '}
                              · {formatCycleLabel(order.billingCycle)} ·{' '}
                              <span>{isPix ? 'Pix' : 'Cartão'}</span>
                            </span>

                            {order.receiptUrl && (
                              <a
                                href={order.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                              >
                                <span>Ver Recibo</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">Sessão protegida</span>
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
