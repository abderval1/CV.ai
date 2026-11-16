import React, { useState, useEffect, useMemo, useRef } from 'react';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import QRCode from 'qrcode';
import { SAAS_PLANS } from '../data/initialCV';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { SubscriptionPlan, PaymentMethod, BillingCycle } from '../types/cv';
import { createSaaSOrder, fetchAllCoupons, incrementCouponUsage } from '../services/saasDbService';
import {
  getStoredPlansSync,
  getStoredPlatformSettingsSync,
  trackFrontendTelemetry
} from '../services/adminModulesService';
import {
  BILLING_CYCLES,
  BILLING_CYCLE_META,
  normalizeBillingCycle,
  getCycleDurationDays,
  formatCycleLabel,
  getCyclePriceUSD,
  getMonthlyEquivalentUSD,
  getPixKeyTypeLabel,
  generatePixBRCode,
  PixKeyType
} from '../utils/billingCycles';
import {
  X,
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Tag,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Calendar,
  Copy,
  Info,
  Clock
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptMessage?: string;
  initialPlan?: SubscriptionPlan;
  initialCycle?: BillingCycle;
}

// Chave Pix padrão de fallback (pode ser substituída no Painel Administrativo)
export const OFFICIAL_PIX_KEY = 'f4693532-31da-4e95-a589-19bccab0d915';

interface GatewayConfigResponse {
  cardEnabled: boolean;
  publishableKey?: string;
  pixConfig?: {
    pixKey: string;
    pixKeyType: PixKeyType;
    pixBeneficiaryName: string;
    pixCity: string;
  };
}

function translateCardGatewayError(message?: string): string {
  if (!message) return 'Não foi possível autorizar o pagamento no cartão. Verifique os dados ou tente outro cartão.';
  const lower = message.toLowerCase();
  if (lower.includes('insufficient_funds') || lower.includes('saldo')) {
    return 'Saldo ou limite insuficiente no cartão informado.';
  }
  if (lower.includes('incorrect_cvc') || lower.includes('security code')) {
    return 'Código de segurança (CVC) incorreto. Verifique o verso do cartão.';
  }
  if (lower.includes('expired_card') || lower.includes('expired')) {
    return 'Este cartão encontra-se expirado.';
  }
  if (lower.includes('incorrect_number') || lower.includes('invalid number')) {
    return 'O número do cartão parece inválido. Confira os dígitos.';
  }
  if (lower.includes('declined') || lower.includes('recusado')) {
    return 'Pagamento não autorizado pelo banco emissor. Tente outro cartão ou utilize o Pix.';
  }
  if (lower.includes('authentication')) {
    return 'A verificação 3D Secure não foi concluída pelo banco.';
  }
  return message.replace(/stripe/gi, 'processador de pagamentos');
}

function getPaymentAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token =
      localStorage.getItem('curriculopro_auth_token') ||
      sessionStorage.getItem('curriculopro_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // ignore storage access errors
  }
  return headers;
}

function getSafeExternalUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  promptMessage,
  initialPlan,
  initialCycle
}) => {
  const { user, upgradePlan, refreshUser } = useAuth();
  const { currency, setCurrency, config: currencyConfig, formatPrice } = useCurrency();
  const { showSuccess, showError, showInfo } = useToast();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle || 'monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    initialPlan === 'executive' ? 'executive' : 'pro'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [cardFlowMode, setCardFlowMode] = useState<'embedded' | 'checkout'>('embedded');

  // Card Gateway State (PCI-DSS tokenized element)
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfigResponse | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [isCardElementReady, setIsCardElementReady] = useState<boolean>(false);
  const [isCardComplete, setIsCardComplete] = useState<boolean>(false);
  const [cardholderName, setCardholderName] = useState<string>(user?.name || '');
  const [cardError, setCardError] = useState<string | null>(null);
  const cardMountRef = useRef<HTMLDivElement | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);

  // Pix Specific States
  const [copiedPixKey, setCopiedPixKey] = useState<boolean>(false);
  const [copiedPixPayload, setCopiedPixPayload] = useState<boolean>(false);
  const [pixSenderName, setPixSenderName] = useState<string>(user?.name || '');
  const [pixTxId, setPixTxId] = useState<string>('');
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [isCheckingPixApproval, setIsCheckingPixApproval] = useState<boolean>(false);

  // Coupons
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false);

  // Processing & Completion States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    orderNumber: string;
    subscriptionId?: string;
    nextBillingDate?: string;
    amount: number;
    currencyLabel: string;
    billingCycle: BillingCycle;
    receiptUrl?: string;
    paymentMethodUsed?: string;
  } | null>(null);

  const [pixPendingDetails, setPixPendingDetails] = useState<{
    orderNumber: string;
    amountBRL: number;
    billingCycle: BillingCycle;
    plan: SubscriptionPlan;
    pixKeyUsed: string;
    pixKeyTypeLabel: string;
    txId: string;
  } | null>(null);
  const [billingPortalUrl, setBillingPortalUrl] = useState<string | null>(null);

  const [adminPlans, setAdminPlans] = useState(() => getStoredPlansSync());
  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    if (user?.name) {
      setCardholderName((prev) => prev || user.name);
      setPixSenderName((prev) => prev || user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const syncConfigs = () => {
      setAdminPlans(getStoredPlansSync());
      setPlatformSettings(getStoredPlatformSettingsSync());
    };
    window.addEventListener('admin-config-updated', syncConfigs);
    window.addEventListener('storage', syncConfigs);
    return () => {
      window.removeEventListener('admin-config-updated', syncConfigs);
      window.removeEventListener('storage', syncConfigs);
    };
  }, []);

  // Load Gateway & Pix Config from Server
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    fetch('/api/payments/config')
      .then((res) => (res.ok ? res.json() : null))
      .then(async (cfg: GatewayConfigResponse | null) => {
        if (!active || !cfg) return;
        setGatewayConfig(cfg);
        if (cfg.cardEnabled && cfg.publishableKey && !stripeInstance) {
          const loaded = await loadStripe(cfg.publishableKey);
          if (active && loaded) {
            setStripeInstance(loaded);
          }
        }
      })
      .catch(() => {
        // Fallback smoothly to platformSettings / Pix
      });

    return () => {
      active = false;
    };
  }, [isOpen, stripeInstance]);

  // Mount / Unmount Tokenized Card Element cleanly
  useEffect(() => {
    const shouldMountCard =
      isOpen &&
      !upgradeSuccess &&
      !pixPendingDetails &&
      selectedPlan !== 'free' &&
      paymentMethod === 'stripe' &&
      cardFlowMode === 'embedded' &&
      appliedDiscount < 100 &&
      stripeInstance &&
      cardMountRef.current;

    if (!shouldMountCard) {
      if (cardElementRef.current) {
        try {
          cardElementRef.current.destroy();
        } catch {
          // ignore
        }
        cardElementRef.current = null;
      }
      setIsCardElementReady(false);
      setIsCardComplete(false);
      return;
    }

    const elements = stripeInstance.elements({ locale: 'pt' });
    const cardEl = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '14px',
          color: '#0f172a',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          '::placeholder': {
            color: '#94a3b8'
          }
        },
        invalid: {
          color: '#e11d48',
          iconColor: '#e11d48'
        }
      }
    });

    cardEl.mount(cardMountRef.current!);
    cardEl.on('ready', () => setIsCardElementReady(true));
    cardEl.on('change', (ev) => {
      setIsCardComplete(ev.complete);
      setCardError(ev.error ? translateCardGatewayError(ev.error.message) : null);
    });
    cardElementRef.current = cardEl;

    return () => {
      try {
        cardEl.destroy();
      } catch {
        // ignore
      }
      if (cardElementRef.current === cardEl) {
        cardElementRef.current = null;
      }
      setIsCardElementReady(false);
    };
  }, [
    isOpen,
    upgradeSuccess,
    pixPendingDetails,
    selectedPlan,
    paymentMethod,
    cardFlowMode,
    appliedDiscount,
    stripeInstance
  ]);

  const mergedPlans = useMemo(() => {
    const adminMap = new Map(adminPlans.map((p) => [p.id, p]));
    return SAAS_PLANS.map((basePlan) => {
      const cfg = adminMap.get(basePlan.id as 'pro' | 'executive');
      if (!cfg) return basePlan;
      return {
        ...basePlan,
        name: cfg.name || basePlan.name,
        tagline: cfg.tagline || basePlan.tagline,
        priceMonthlyValue: cfg.priceMonthlyValue,
        priceQuarterlyValue: cfg.priceQuarterlyValue,
        priceSemiannualValue: cfg.priceSemiannualValue,
        priceYearlyValue: cfg.priceYearlyValue,
        isPopular: cfg.isPopular,
        features: cfg.features && cfg.features.length > 0 ? cfg.features : basePlan.features
      };
    });
  }, [adminPlans]);

  // Sync pre-selected plan & cycle from Landing/Showcase triggers (skip when returning from Stripe Checkout)
  useEffect(() => {
    if (!isOpen) return;
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('stripe_status') === 'success') return;

    if (initialPlan === 'pro' || initialPlan === 'executive') {
      setSelectedPlan(initialPlan);
    }
    if (initialCycle) {
      setBillingCycle(normalizeBillingCycle(initialCycle));
    }
  }, [isOpen, initialPlan, initialCycle]);

  // Hosted Checkout Return Verification & Analytics
  useEffect(() => {
    if (!isOpen) return;
    trackFrontendTelemetry({ type: 'checkout_opened' });

    const queryParams = new URLSearchParams(window.location.search);
    const checkoutStatus = queryParams.get('stripe_status');
    const sessionId = queryParams.get('session_id');
    const returnPlan = (queryParams.get('plan') as SubscriptionPlan) || 'pro';
    const returnCycle = normalizeBillingCycle(queryParams.get('cycle'));

    if (checkoutStatus === 'success' && sessionId) {
      handleHostedReturnVerification(sessionId, returnPlan, returnCycle);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutStatus === 'canceled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isOpen]);

  const handleHostedReturnVerification = async (
    sessionId: string,
    plan: SubscriptionPlan,
    cycle: BillingCycle
  ) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        credentials: 'include',
        headers: getPaymentAuthHeaders(),
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok || !data?.verified) {
        throw new Error(data?.error || 'Não foi possível confirmar o pagamento desta sessão.');
      }

      const subId = data.subscriptionId || `sub_${sessionId.slice(0, 12)}`;
      const verifiedCycle = normalizeBillingCycle(data.billingCycle || cycle);
      const durationDays = getCycleDurationDays(verifiedCycle);
      const nextBilling = new Date(Date.now() + durationDays * 86400000).toISOString();
      const verifiedPlan = (data.plan === 'executive' ? 'executive' : plan) as SubscriptionPlan;
      const verifiedCurrency = String(data.currency || 'USD').toUpperCase();
      const verifiedAmount =
        typeof data.amount === 'number'
          ? data.amount
          : getCyclePriceUSD({ id: verifiedPlan }, verifiedCycle);

      await upgradePlan(verifiedPlan, {
        billingCycle: verifiedCycle,
        stripeSubscriptionId: subId,
        stripeCustomerId: data.customerId
      });

      const order = await createSaaSOrder({
        userId: user?.id || data.customerId || 'client-user',
        userName: user?.name || 'Assinante',
        userEmail: user?.email || data.customerEmail || '',
        plan: verifiedPlan,
        billingCycle: verifiedCycle,
        amount: verifiedAmount,
        currency: verifiedCurrency,
        paymentMethod: 'card',
        status: 'paid',
        stripeSubscriptionId: subId,
        receiptUrl: data.receiptUrl,
        notes: `Assinatura ${formatCycleLabel(verifiedCycle).toLowerCase()} confirmada via Cartão.`
      });

      setSelectedPlan(verifiedPlan);
      setBillingCycle(verifiedCycle);
      setSuccessDetails({
        orderNumber: order.orderNumber,
        subscriptionId: subId,
        nextBillingDate: nextBilling,
        amount: order.amount,
        currencyLabel: verifiedCurrency,
        billingCycle: verifiedCycle,
        receiptUrl: order.receiptUrl,
        paymentMethodUsed: 'Cartão (Renovação Automática)'
      });
      setUpgradeSuccess(true);
      showSuccess(
        'Assinatura Ativada!',
        `O seu plano ${verifiedPlan === 'executive' ? 'Executivo VIP' : 'Profissional'} foi ativado com sucesso.`
      );
    } catch (e: any) {
      showError('Validação Pendente', e?.message || 'Não foi possível confirmar o pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pricing Math
  const activePlanObj = mergedPlans.find((p) => p.id === selectedPlan) || mergedPlans[0];
  const basePriceUSD = getCyclePriceUSD(activePlanObj, billingCycle);
  const discountAmountUSD = (basePriceUSD * appliedDiscount) / 100;
  const finalPriceUSD = Math.max(0, Math.round((basePriceUSD - discountAmountUSD) * 100) / 100);
  const convertedFinalPrice = Math.round(finalPriceUSD * currencyConfig.exchangeRateToUSD * 100) / 100;

  const priceBRL = useMemo(() => {
    if (currency === 'BRL') return convertedFinalPrice;
    return Math.round(finalPriceUSD * 5.4 * 100) / 100;
  }, [currency, convertedFinalPrice, finalPriceUSD]);

  // Live Personal Pix Configuration (Admin Governance > Server Config > Default Fallback)
  const effectivePixKey = (
    platformSettings?.pixKey ||
    gatewayConfig?.pixConfig?.pixKey ||
    OFFICIAL_PIX_KEY
  ).trim();
  const effectivePixKeyType = (platformSettings?.pixKeyType ||
    gatewayConfig?.pixConfig?.pixKeyType ||
    'evp') as PixKeyType;
  const effectivePixBeneficiary =
    platformSettings?.pixBeneficiaryName ||
    gatewayConfig?.pixConfig?.pixBeneficiaryName ||
    'CURRICULO ESTRATEGICO';
  const effectivePixCity =
    platformSettings?.pixCity || gatewayConfig?.pixConfig?.pixCity || 'SAO PAULO';
  const pixKeyTypeLabel = getPixKeyTypeLabel(effectivePixKeyType);

  const pixBRCode = useMemo(() => {
    return generatePixBRCode(
      effectivePixKey,
      priceBRL,
      effectivePixBeneficiary,
      effectivePixCity,
      effectivePixKeyType
    );
  }, [effectivePixKey, priceBRL, effectivePixBeneficiary, effectivePixCity, effectivePixKeyType]);

  // Render QR Code locally using qrcode library (no external HTTP dependency)
  useEffect(() => {
    if (!pixBRCode) {
      setPixQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(pixBRCode, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((url) => {
        if (!cancelled) setPixQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPixQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [pixBRCode]);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(effectivePixKey);
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = effectivePixKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    }
  };

  const handleCopyPixPayload = async () => {
    try {
      await navigator.clipboard.writeText(pixBRCode);
      setCopiedPixPayload(true);
      setTimeout(() => setCopiedPixPayload(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = pixBRCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedPixPayload(true);
      setTimeout(() => setCopiedPixPayload(false), 2500);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const coupons = await fetchAllCoupons();
      const codeClean = couponCode.trim().toUpperCase();
      const matched = coupons.find((c) => c.code.toUpperCase() === codeClean && c.active);

      if (matched) {
        const isExpired = matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now();
        const isLimitReached = matched.maxUses > 0 && matched.usedCount >= matched.maxUses;
        if (isExpired) {
          setCouponError('Este código promocional já expirou.');
          setAppliedDiscount(0);
        } else if (isLimitReached) {
          setCouponError('Este cupom atingiu o limite máximo de utilizações.');
          setAppliedDiscount(0);
        } else {
          setAppliedDiscount(matched.discountPercent);
          setCouponSuccess(`Cupom "${matched.code}" aplicado! Desconto de ${matched.discountPercent}%.`);
          incrementCouponUsage(matched.id, matched.usedCount);
        }
      } else {
        setCouponError('Código promocional inválido, inativo ou expirado.');
        setAppliedDiscount(0);
      }
    } catch {
      setCouponError('Não foi possível validar o cupom neste momento.');
      setAppliedDiscount(0);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleCheckPixActivationNow = async () => {
    setIsCheckingPixApproval(true);
    try {
      const updated = await refreshUser();
      if (updated && (updated.plan === 'pro' || updated.plan === 'executive')) {
        setPixPendingDetails(null);
        setSuccessDetails({
          orderNumber: pixPendingDetails?.orderNumber || 'APROVADO',
          amount: pixPendingDetails?.amountBRL || priceBRL,
          currencyLabel: 'BRL',
          billingCycle: pixPendingDetails?.billingCycle || billingCycle,
          paymentMethodUsed: 'Pix Confirmado'
        });
        setUpgradeSuccess(true);
        showSuccess('Pagamento Confirmado!', 'O seu plano foi aprovado e já está ativo na sua conta.');
      } else {
        showInfo(
          'Ainda em Validação',
          'O pagamento Pix ainda aguarda confirmação na conta recebedora. Assim que for aprovado, todo o acesso será liberado.'
        );
      }
    } finally {
      setIsCheckingPixApproval(false);
    }
  };

  // Primary Checkout / Upgrade Handler
  const handleProcessSubscription = async () => {
    if (selectedPlan === 'free') {
      await upgradePlan('free');
      onClose();
      return;
    }

    if (!user?.id || !user?.email) {
      const msg = 'Inicie sessão ou crie uma conta antes de concluir a sua assinatura.';
      setCardError(msg);
      setPixError(msg);
      showError('Autenticação Necessária', 'Por favor inicie sessão ou registe a sua conta para ativar um plano.');
      return;
    }

    setCardError(null);
    setPixError(null);

    // 100% Promo Coupon Immediate Activation (regardless of tab)
    if (appliedDiscount >= 100) {
      setIsProcessing(true);
      try {
        const res = await fetch('/api/payments/create-subscription-intent', {
          method: 'POST',
          credentials: 'include',
          headers: getPaymentAuthHeaders(),
          body: JSON.stringify({
            plan: selectedPlan,
            billingCycle,
            userId: user.id,
            userName: user.name || cardholderName || user.email,
            userEmail: user.email,
            couponCode,
            currency: currency === 'BRL' ? 'BRL' : 'USD'
          })
        });
        const data = await res.json();
        if (!res.ok || !data?.verified) {
          throw new Error(data?.error || 'Não foi possível validar o cupom promocional.');
        }

        await upgradePlan(selectedPlan, {
          billingCycle,
          stripeSubscriptionId: data.subscriptionId
        });

        const order = await createSaaSOrder({
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          plan: selectedPlan,
          billingCycle,
          amount: 0,
          currency: currency === 'BRL' ? 'BRL' : 'USD',
          paymentMethod: paymentMethod === 'pix' ? 'pix' : 'card',
          status: 'paid',
          stripeSubscriptionId: data.subscriptionId,
          notes: `Assinatura ${formatCycleLabel(billingCycle).toLowerCase()} ativada com cupom 100% (${couponCode.toUpperCase()}).`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          subscriptionId: data.subscriptionId,
          nextBillingDate: data.nextBillingDate,
          amount: 0,
          currencyLabel: currency === 'BRL' ? 'BRL' : 'USD',
          billingCycle,
          paymentMethodUsed: 'Cupom Promocional 100%'
        });
        setUpgradeSuccess(true);
        showSuccess('Assinatura Ativada!', 'Cupom aplicado com sucesso. O acesso completo já está disponível.');
      } catch (err: any) {
        showError('Erro no Cupom', err?.message || 'Falha ao ativar subscrição promocional.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 1. CARD PAYMENT (Tokenized PCI-DSS Element OR Secure Hosted Checkout)
    if (paymentMethod === 'stripe' || paymentMethod === 'card') {
      if (cardFlowMode === 'checkout') {
        setIsProcessing(true);
        try {
          const res = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            credentials: 'include',
            headers: getPaymentAuthHeaders(),
            body: JSON.stringify({
              plan: selectedPlan,
              billingCycle,
              userId: user.id,
              userName: user.name || cardholderName || user.email,
              userEmail: user.email,
              couponCode: couponCode || undefined,
              currency: currency === 'BRL' ? 'BRL' : 'USD',
              originUrl: window.location.origin + window.location.pathname
            })
          });
          const data = await res.json();
          const safeCheckoutUrl = getSafeExternalUrl(data.url);
          if (safeCheckoutUrl) {
            window.location.href = safeCheckoutUrl;
            return;
          }
          throw new Error(data.error || 'Não foi possível abrir a página segura de pagamento.');
        } catch (err: any) {
          setCardError(err?.message || 'Erro ao iniciar pagamento por cartão.');
          showError('Falha no Pagamento', err?.message || 'Não foi possível iniciar o pagamento.');
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // Embedded Tokenized Card Element
      if (!gatewayConfig?.cardEnabled || !stripeInstance || !cardElementRef.current) {
        setCardError('O formulário de cartão ainda está a carregar ou não está disponível. Tente via Pix ou Página Segura.');
        return;
      }
      if (cardholderName.trim().length < 2) {
        setCardError('Indique o nome completo conforme impresso no cartão.');
        return;
      }
      if (!isCardComplete) {
        setCardError('Preencha todos os dados do cartão (número, validade e CVC) para continuar.');
        return;
      }

      setIsProcessing(true);
      try {
        const intentRes = await fetch('/api/payments/create-subscription-intent', {
          method: 'POST',
          credentials: 'include',
          headers: getPaymentAuthHeaders(),
          body: JSON.stringify({
            plan: selectedPlan,
            billingCycle,
            userId: user.id,
            userName: cardholderName.trim(),
            userEmail: user.email,
            couponCode: couponCode || undefined,
            currency: currency === 'BRL' ? 'BRL' : 'USD'
          })
        });
        const intentData = await intentRes.json();
        if (!intentRes.ok || !intentData?.clientSecret) {
          throw new Error(intentData?.error || 'Não foi possível iniciar a cobrança segura no cartão.');
        }

        const confirmation = await stripeInstance.confirmCardPayment(intentData.clientSecret, {
          payment_method: {
            card: cardElementRef.current,
            billing_details: {
              name: cardholderName.trim(),
              email: user.email
            }
          }
        });

        if (confirmation.error) {
          throw new Error(translateCardGatewayError(confirmation.error.message));
        }

        if (confirmation.paymentIntent?.status !== 'succeeded') {
          throw new Error('O pagamento não foi concluído. Confirme a autorização junto ao seu banco.');
        }

        const confirmRes = await fetch('/api/payments/confirm-subscription', {
          method: 'POST',
          credentials: 'include',
          headers: getPaymentAuthHeaders(),
          body: JSON.stringify({
            subscriptionId: intentData.subscriptionId,
            paymentIntentId: confirmation.paymentIntent.id,
            plan: selectedPlan,
            billingCycle
          })
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok || !confirmData?.verified) {
          throw new Error(confirmData?.error || 'Pagamento aprovado, mas não foi possível validar a subscrição.');
        }

        await upgradePlan(selectedPlan, {
          billingCycle,
          stripeSubscriptionId: confirmData.subscriptionId,
          stripeCustomerId: confirmData.customerId
        });

        const order = await createSaaSOrder({
          userId: user.id,
          userName: cardholderName.trim(),
          userEmail: user.email,
          plan: selectedPlan,
          billingCycle,
          amount: confirmData.amount ?? intentData.amount,
          currency: confirmData.currency || intentData.currency || 'USD',
          paymentMethod: 'card',
          status: 'paid',
          stripeSubscriptionId: confirmData.subscriptionId,
          stripePaymentIntentId: confirmation.paymentIntent.id,
          receiptUrl: confirmData.receiptUrl,
          notes: `Assinatura ${formatCycleLabel(billingCycle).toLowerCase()} paga via Cartão.`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          subscriptionId: confirmData.subscriptionId,
          nextBillingDate: confirmData.nextBillingDate,
          amount: order.amount,
          currencyLabel: order.currency,
          billingCycle,
          receiptUrl: confirmData.receiptUrl || order.receiptUrl,
          paymentMethodUsed: 'Cartão (Renovação Automática)'
        });
        setUpgradeSuccess(true);
        showSuccess(
          'Pagamento Confirmado!',
          `Plano ${selectedPlan === 'executive' ? 'Executivo VIP' : 'Profissional'} ativado com sucesso!`
        );
      } catch (err: any) {
        const cleanMsg = translateCardGatewayError(err?.message);
        setCardError(cleanMsg);
        showError('Falha no Pagamento', cleanMsg);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. PERSONAL PIX PAYMENT (Requires Payer Name + TxID, Saved as Pending until Confirmation)
    if (pixSenderName.trim().length < 3) {
      setPixError('Informe o nome completo do titular da conta que realizou a transferência Pix.');
      return;
    }
    if (pixTxId.trim().length < 6) {
      setPixError('Insira o ID da Transação / Código E2E do comprovante Pix (mínimo 6 caracteres).');
      return;
    }

    setIsProcessing(true);
    try {
      const order = await createSaaSOrder({
        userId: user.id,
        userName: pixSenderName.trim(),
        userEmail: user.email,
        plan: selectedPlan,
        billingCycle,
        amount: priceBRL,
        currency: 'BRL',
        paymentMethod: 'pix',
        status: 'pending',
        notes: `Pix pessoal aguardando conferência (${formatCycleLabel(billingCycle)}). Chave (${pixKeyTypeLabel}): ${effectivePixKey} | Titular Pagador: ${pixSenderName.trim()} | TxID: ${pixTxId.trim()}`
      });

      setPixPendingDetails({
        orderNumber: order.orderNumber,
        amountBRL: priceBRL,
        billingCycle,
        plan: selectedPlan,
        pixKeyUsed: effectivePixKey,
        pixKeyTypeLabel,
        txId: pixTxId.trim()
      });
      showInfo(
        'Comprovante Pix Registado!',
        'O pedido foi enviado para conferência bancária. Assim que confirmado, o seu acesso será liberado.'
      );
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível registar o comprovante Pix.';
      setPixError(msg);
      showError('Erro ao Registar Pix', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!user?.stripeCustomerId) {
      showError('Portal Indisponível', 'Esta conta ainda não possui um método de cartão recorrente associado.');
      return;
    }
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        credentials: 'include',
        headers: getPaymentAuthHeaders(),
        body: JSON.stringify({
          customerId: user.stripeCustomerId,
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      const safePortalUrl = getSafeExternalUrl(data.url);
      if (safePortalUrl) {
        setBillingPortalUrl(safePortalUrl);
        const anchor = document.createElement('a');
        anchor.href = safePortalUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } else {
        showError('Portal Indisponível', data?.error || 'Não foi possível abrir o portal de faturação.');
      }
    } catch {
      showError('Portal Indisponível', 'Não foi possível abrir o portal de faturação neste momento.');
    }
  };

  const cycleMeta = BILLING_CYCLE_META[billingCycle];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-x-hidden overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94dvh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Planos &amp; Ativação de Assinatura
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exportação Word (.docx), Radar ATS e tradução em 5 idiomas via Cartão ou Pix sem fidelidade.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 1: Immediate Success (Card or 100% Coupon) */}
        {upgradeSuccess && successDetails ? (
          <div className="p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Assinatura Ativada com Sucesso!
              </h3>
              <p className="text-xs font-mono font-bold text-slate-500">
                Fatura Nº: <span className="text-slate-900 font-bold">{successDetails.orderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Plano Selecionado:</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedPlan === 'executive' ? 'Executivo VIP (C-Level & Global)' : 'Profissional Pro'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Forma de Pagamento:</span>
                <span className="text-xs font-bold text-teal-700">
                  {successDetails.paymentMethodUsed || 'Confirmado'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Ciclo de Faturação:</span>
                <span className="text-xs font-bold text-slate-900 uppercase">
                  {formatCycleLabel(successDetails.billingCycle)} ({getCycleDurationDays(successDetails.billingCycle)} dias)
                </span>
              </div>

              {successDetails.subscriptionId && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">ID da Assinatura:</span>
                  <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {successDetails.subscriptionId}
                  </span>
                </div>
              )}

              {successDetails.nextBillingDate && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Próxima Renovação:</span>
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(successDetails.nextBillingDate).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-900">Valor Cobrado:</span>
                <span className="text-sm font-black font-mono text-emerald-700">
                  {successDetails.currencyLabel === 'BRL'
                    ? `R$ ${Number(successDetails.amount).toFixed(2)} BRL`
                    : `$${successDetails.amount} ${successDetails.currencyLabel}`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Acesso total liberado! O seu plano foi ativado com sucesso e está sincronizado com a sua conta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Começar a Usar Agora</span>
              </button>

              {user?.stripeCustomerId && (
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Gerir Cartão &amp; Faturas</span>
                </button>
              )}
            </div>
            {billingPortalUrl && getSafeExternalUrl(billingPortalUrl) && (
              <p className="text-xs text-slate-600">
                Se o separador não abriu automaticamente,{' '}
                <a
                  href={getSafeExternalUrl(billingPortalUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline"
                >
                  clique aqui para abrir o portal de faturação
                </a>
                .
              </p>
            )}
          </div>
        ) : pixPendingDetails ? (
          /* View 2: Pix Pending Verification (Direct Personal Pix Transfer) */
          <div className="p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-md ring-8 ring-amber-50">
              <Clock className="w-11 h-11" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Pagamento Pix Registado · Aguardando Confirmação
              </h3>
              <p className="text-xs font-mono font-bold text-slate-500">
                Pedido Nº: <span className="text-slate-900">{pixPendingDetails.orderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Plano &amp; Ciclo:</span>
                <span className="font-bold text-slate-900">
                  {pixPendingDetails.plan === 'executive' ? 'Executivo VIP' : 'Profissional Pro'} ·{' '}
                  {formatCycleLabel(pixPendingDetails.billingCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Valor Informado:</span>
                <span className="font-black font-mono text-teal-700">
                  R$ {pixPendingDetails.amountBRL.toFixed(2)} BRL
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Chave ({pixPendingDetails.pixKeyTypeLabel}):</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[230px]">
                  {pixPendingDetails.pixKeyUsed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Comprovante / TxID:</span>
                <span className="font-mono font-bold text-slate-900">{pixPendingDetails.txId}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              O seu comprovante foi enviado para validação. Assim que a transferência for confirmada na conta
              recebedora, o seu acesso completo será ativado automaticamente.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckPixActivationNow}
                disabled={isCheckingPixApproval}
                className="w-full sm:w-auto px-7 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingPixApproval ? 'animate-spin' : ''}`} />
                <span>{isCheckingPixApproval ? 'A verificar...' : 'Verificar Ativação Agora'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPixPendingDetails(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Fechar e Continuar Depois
              </button>
            </div>
          </div>
        ) : (
          /* View 3: Plan Selection & Payment Checkout */
          <div className="p-5 sm:p-6 space-y-6">
            {promptMessage && !upgradeSuccess && (
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5 text-amber-950 shadow-xs animate-in fade-in duration-200">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-black">
                  <Lock className="w-5 h-5 text-slate-950" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Recurso Exclusivo para Assinantes
                    </h4>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-md border border-amber-500/40 uppercase tracking-wide">
                      Requer Plano Ativo
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">{promptMessage}</p>
                </div>
              </div>
            )}

            {/* Currency and 4-Cycle Billing Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-5">
              {/* Currency Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">Moeda:</span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                        currency === c.code
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Recurring Billing Cycles: Mensal | Trimestral | Semestral | Anual */}
              <div className="p-1 bg-slate-100 rounded-xl flex flex-wrap items-center justify-center gap-1 text-xs font-semibold">
                {BILLING_CYCLES.map((cycleKey) => {
                  const meta = BILLING_CYCLE_META[cycleKey];
                  const active = billingCycle === cycleKey;
                  return (
                    <button
                      key={cycleKey}
                      type="button"
                      onClick={() => setBillingCycle(cycleKey)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{meta.label}</span>
                      {meta.badgeText && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold tabular-nums">
                          {meta.badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mergedPlans.map((plan) => {
                const isCurrent = user?.plan === plan.id;
                const isSelected = selectedPlan === plan.id;

                const cycleUsd = getCyclePriceUSD(plan, billingCycle);
                const displayPrice = formatPrice(cycleUsd);
                const periodSuffix = ` / ${cycleMeta.shortUnit}`;
                const monthlyEquivalent = getMonthlyEquivalentUSD(plan, billingCycle);

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`rounded-2xl p-5 sm:p-6 border cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900/15 shadow-lg bg-white'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-4 bg-slate-900 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-slate-800">
                        Mais Escolhido
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{plan.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
                          {displayPrice}
                          <span className="text-xs font-normal text-slate-500">{periodSuffix}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
                          {currency === 'BRL'
                            ? `Equivalente a $${cycleUsd} USD`
                            : `Equivalente a R$ ${(cycleUsd * 5.4).toFixed(2)} BRL`}
                        </span>
                        {monthlyEquivalent && (
                          <span className="text-[11px] text-emerald-700 font-medium block">
                            Equivalente a {formatPrice(monthlyEquivalent)}/mês ({cycleMeta.badgeText})
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Acesso garantido durante {cycleMeta.durationDays} dias (cancele quando quiser)
                        </span>
                      </div>

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
                        }}
                        className={`w-full min-h-[42px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : isSelected && plan.id !== 'free'
                            ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCurrent ? 'Plano Atual' : isSelected ? 'Plano Selecionado' : plan.ctaText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout & Payment Options */}
            {selectedPlan !== 'free' && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                {/* Summary & Price Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-800" />
                      <span>Resumo &amp; Pagamento</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ativação imediata no Cartão (Stripe PCI-DSS) ou via Pix em Reais com QR Code. Cancele quando quiser.
                    </p>
                  </div>

                  <div className="text-right">
                    {appliedDiscount > 0 && (
                      <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                        {formatPrice(basePriceUSD)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                      {paymentMethod === 'pix' ? `R$ ${priceBRL.toFixed(2)}` : formatPrice(finalPriceUSD)}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-medium">
                      {paymentMethod === 'pix'
                        ? `Equivalente a $${finalPriceUSD} USD (Plano ${cycleMeta.label})`
                        : `Equivalente a R$ ${priceBRL.toFixed(2)} BRL · Ciclo ${cycleMeta.label} (${cycleMeta.durationDays} dias)`}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tem um Cupom de Desconto?</span>
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Insira o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 min-h-[40px] px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCheckingCoupon || !couponCode.trim()}
                      className="min-h-[40px] px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                    >
                      {isCheckingCoupon ? 'A validar...' : 'Aplicar Cupom'}
                    </button>
                  </div>
                  {couponSuccess && <p className="text-[11px] font-semibold text-emerald-600">{couponSuccess}</p>}
                  {couponError && <p className="text-[11px] font-semibold text-rose-600">{couponError}</p>}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Selecione o Método de Pagamento:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        paymentMethod === 'stripe' || paymentMethod === 'card'
                          ? 'border-slate-900 bg-white ring-2 ring-slate-900/15 shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CreditCard className="w-4 h-4 text-slate-800" />
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          Seguro
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">Cartão de Crédito / Débito</div>
                      <div className="text-[10px] text-slate-500">Visa, Mastercard, Apple Pay &amp; Google Pay</div>
                    </button>

                    {/* Pix */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        paymentMethod === 'pix'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-600/30 shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <QrCode className="w-4 h-4 text-teal-600" />
                        <span className="text-[9px] font-bold uppercase bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded font-mono">
                          QR Code
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">Pix (BRL)</div>
                      <div className="text-[10px] text-teal-600 font-semibold">
                        Chave ({pixKeyTypeLabel}) &amp; Copia e Cola
                      </div>
                    </button>
                  </div>

                  {/* 1. CARD PAYMENT CONTAINER */}
                  {(paymentMethod === 'stripe' || paymentMethod === 'card') && (
                    <div className="mt-3 p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Pagamento Encriptado com Cartão (PCI-DSS Nível 1)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCardFlowMode('embedded')}
                            className={`px-2 py-1 rounded-md transition-colors ${
                              cardFlowMode === 'embedded'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Direto Aqui
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardFlowMode('checkout')}
                            className={`px-2 py-1 rounded-md transition-colors ${
                              cardFlowMode === 'checkout'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Página Segura Externa
                          </button>
                        </div>
                      </div>

                      {appliedDiscount >= 100 ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>
                            Cupom de 100% aplicado! Nenhuma cobrança será efetuada no cartão — clique abaixo para
                            ativar imediatamente.
                          </span>
                        </div>
                      ) : cardFlowMode === 'embedded' ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Nome do Titular do Cartão</label>
                            <input
                              type="text"
                              value={cardholderName}
                              onChange={(e) => {
                                setCardholderName(e.target.value);
                                setCardError(null);
                              }}
                              placeholder="Nome completo conforme impresso no cartão"
                              className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span>Dados do Cartão (Número, Validade e CVC)</span>
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Tokenização Segura
                              </span>
                            </label>
                            <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-colors min-h-[42px]">
                              <div ref={cardMountRef} />
                              {!isCardElementReady && (
                                <p className="text-[11px] text-slate-400">
                                  {gatewayConfig && !gatewayConfig.cardEnabled
                                    ? 'Processamento por cartão indisponível no momento — utilize o Pix.'
                                    : 'A carregar campo seguro de cartão...'}
                                </p>
                              )}
                            </div>
                          </div>

                          {cardError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{cardError}</span>
                            </div>
                          )}

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                              <span>Renovação Automática ({cycleMeta.label})</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              O valor de{' '}
                              <strong className="text-slate-900">
                                {currency === 'BRL' ? `R$ ${priceBRL.toFixed(2)} BRL` : `$${finalPriceUSD} USD`}
                              </strong>{' '}
                              será cobrado a cada {cycleMeta.durationDays} dias. Pode gerir o cartão ou cancelar a
                              qualquer momento no seu perfil.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2.5">
                          <CreditCard className="w-8 h-8 text-slate-700 mx-auto" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              Redirecionamento para Ambiente Seguro de Pagamento
                            </h4>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                              Será levado a uma página protegida com suporte a Cartão Internacional, Apple Pay e
                              Google Pay, retornando automaticamente após a aprovação.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. PIX PAYMENT CONTAINER */}
                  {paymentMethod === 'pix' && (
                    <div className="mt-3 p-4 sm:p-5 bg-white border border-teal-200 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
                            <QrCode className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">Pagamento via Pix (Brasil)</span>
                              <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono uppercase">
                                {pixKeyTypeLabel}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              Escaneie o QR Code ou copie a chave Pix oficial para transferir pelo aplicativo do seu banco.
                            </span>
                          </div>
                        </div>

                        <div className="bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200 text-left sm:text-right self-start sm:self-auto">
                          <span className="text-[10px] text-teal-700 font-bold block uppercase tracking-wider">
                            Valor Total no Pix
                          </span>
                          <span className="text-sm font-black text-teal-950 font-mono">
                            R$ {priceBRL.toFixed(2)} BRL{' '}
                            <span className="text-[10px] text-slate-500 font-normal">(${finalPriceUSD} USD)</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Column 1: Local QR Code */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                            {pixQrDataUrl ? (
                              <img
                                src={pixQrDataUrl}
                                alt="QR Code Pix"
                                className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                              />
                            ) : (
                              <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-400">
                                A gerar QR Code...
                              </div>
                            )}
                          </div>

                          <div className="mt-2.5 text-center">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                              Aponte a câmera do aplicativo do banco
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Beneficiário: {effectivePixBeneficiary}
                            </span>
                          </div>
                        </div>

                        {/* Column 2: Instructions, Key, Copia e Cola & Required Proof */}
                        <div className="md:col-span-7 space-y-3.5">
                          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-[11.5px] text-slate-700 space-y-1">
                            <p className="font-bold text-teal-950 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-700" />
                              Como pagar com Pix em 3 passos:
                            </p>
                            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                              <li>Abra o aplicativo do seu banco no celular.</li>
                              <li>
                                Escolha <strong>Pix &gt; Pagar com QR Code</strong> ou copie a chave abaixo.
                              </li>
                              <li>
                                Transfira <strong>R$ {priceBRL.toFixed(2)}</strong> e preencha o comprovante abaixo
                                para validação e liberação do acesso.
                              </li>
                            </ol>
                          </div>

                          {/* Chave Pix */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                              <span>Chave Pix ({pixKeyTypeLabel}):</span>
                              <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                                Conta Oficial
                              </span>
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 truncate select-all">
                                {effectivePixKey}
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyPixKey}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                  copiedPixKey
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                                }`}
                              >
                                {copiedPixKey ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copiada!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Chave</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Pix Copia e Cola */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                              <span>Pix Copia e Cola (Código Completo):</span>
                              <button
                                type="button"
                                onClick={handleCopyPixPayload}
                                className="text-[10.5px] font-bold text-teal-700 hover:text-teal-900 underline"
                              >
                                {copiedPixPayload ? 'Código Copiado!' : 'Copiar Código'}
                              </button>
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={pixBRCode}
                              onClick={handleCopyPixPayload}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10.5px] font-mono text-slate-600 truncate cursor-pointer hover:bg-slate-100"
                            />
                          </div>

                          {/* Mandatory Proof Fields for Personal Pix */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-bold text-slate-700">
                                Titular Pagador Pix *
                              </label>
                              <input
                                type="text"
                                value={pixSenderName}
                                onChange={(e) => {
                                  setPixSenderName(e.target.value);
                                  setPixError(null);
                                }}
                                placeholder="Nome de quem enviou o Pix"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-bold text-slate-700">
                                ID / Código Comprovante *
                              </label>
                              <input
                                type="text"
                                value={pixTxId}
                                onChange={(e) => {
                                  setPixTxId(e.target.value);
                                  setPixError(null);
                                }}
                                placeholder="Ex: E12345678..."
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                              />
                            </div>
                          </div>

                          {pixError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{pixError}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {paymentMethod === 'pix'
                        ? 'Fatura emitida e liberação após conferência do comprovante Pix.'
                        : 'Cobrança protegida com ativação automática imediata após aprovação.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessSubscription}
                    disabled={isProcessing}
                    className={`w-full sm:w-auto min-h-[44px] px-7 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 ${
                      paymentMethod === 'pix'
                        ? 'bg-teal-600 hover:bg-teal-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>A processar pagamento...</span>
                      </>
                    ) : paymentMethod === 'pix' ? (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>
                          {appliedDiscount >= 100
                            ? 'Ativar Plano Gratuitamente (Cupom 100%)'
                            : `Enviar Comprovante Pix (R$ ${priceBRL.toFixed(2)})`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                      </>
                    ) : cardFlowMode === 'checkout' ? (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Continuar para Pagamento ({formatPrice(finalPriceUSD)})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>
                          Pagar com Cartão ({formatPrice(finalPriceUSD)} / {cycleMeta.shortUnit})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
