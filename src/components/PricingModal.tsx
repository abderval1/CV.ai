import React, { useState, useEffect, useMemo, useRef } from 'react';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import QRCode from 'qrcode';
import { SAAS_PLANS } from '../data/initialCV';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
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
import { BILLING_UI_TRANSLATIONS, BillingUiDictionary } from '../i18n/billingUiTranslations';
import { getIntlLocale } from '../i18n/toolsUiTranslations';
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
  Clock,
  Upload,
  KeyRound,
  FileCheck2
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptMessage?: string;
  initialPlan?: SubscriptionPlan;
  initialCycle?: BillingCycle;
  onRequireAuth?: (
    promptMessage: string,
    mode: 'login' | 'register',
    pendingCheckout: { plan: SubscriptionPlan; cycle: BillingCycle }
  ) => void;
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

function generatePixRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'CV';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function compressImageForPixReceipt(file: File): Promise<{ mimeType: string; base64Data: string }> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Falha ao ler arquivo')));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'application/pdf' || file.size <= 700_000) {
    return { mimeType: file.type.toLowerCase(), base64Data: rawUrl };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1500;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ mimeType: file.type.toLowerCase(), base64Data: rawUrl });
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.84);
        resolve({ mimeType: 'image/jpeg', base64Data: compressed });
      } catch {
        resolve({ mimeType: file.type.toLowerCase(), base64Data: rawUrl });
      }
    };
    img.onerror = () => resolve({ mimeType: file.type.toLowerCase(), base64Data: rawUrl });
    img.src = rawUrl;
  });
}

function translateCardGatewayError(
  message: string | undefined,
  ui: BillingUiDictionary['pricingModal']
): string {
  if (!message) return ui.cardErrDefault;
  const lower = message.toLowerCase();
  if (lower.includes('insufficient_funds') || lower.includes('saldo')) {
    return ui.cardErrInsufficient;
  }
  if (lower.includes('incorrect_cvc') || lower.includes('security code')) {
    return ui.cardErrCvc;
  }
  if (lower.includes('expired_card') || lower.includes('expired')) {
    return ui.cardErrExpired;
  }
  if (lower.includes('incorrect_number') || lower.includes('invalid number')) {
    return ui.cardErrNumber;
  }
  if (lower.includes('declined') || lower.includes('recusado')) {
    return ui.cardErrDeclined;
  }
  if (lower.includes('authentication')) {
    return ui.cardErrAuth;
  }
  return message.replace(/stripe/gi, ui.cardErrProcessorWord);
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
  initialCycle,
  onRequireAuth
}) => {
  const { user, upgradePlan, refreshUser } = useAuth();
  const { currency, setCurrency, config: currencyConfig, formatPrice } = useCurrency();
  const { siteLanguage } = useLanguage();
  const { showSuccess, showError, showInfo } = useToast();

  const billingDict = BILLING_UI_TRANSLATIONS[siteLanguage] || BILLING_UI_TRANSLATIONS.en;
  const ui = billingDict.pricingModal;
  const shortPlanNames = billingDict.plans.shortNames;
  const intlLocale = getIntlLocale(siteLanguage);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle || 'monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    initialPlan === 'executive' ? 'executive' : 'pro'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [cardFlowMode, setCardFlowMode] = useState<'embedded' | 'checkout'>('embedded');

  // Card Gateway State (PCI-DSS tokenized element)
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfigResponse | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [cardLoadFailed, setCardLoadFailed] = useState<boolean>(false);
  const [isCardElementReady, setIsCardElementReady] = useState<boolean>(false);
  const [isCardComplete, setIsCardComplete] = useState<boolean>(false);
  const [cardholderName, setCardholderName] = useState<string>(user?.name || '');
  const [cardError, setCardError] = useState<string | null>(null);
  const cardMountRef = useRef<HTMLDivElement | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);

  // Personal Pix Specific States
  const [copiedPixKey, setCopiedPixKey] = useState<boolean>(false);
  const [copiedPixPayload, setCopiedPixPayload] = useState<boolean>(false);
  const [copiedPixRef, setCopiedPixRef] = useState<boolean>(false);
  const [pixPayTab, setPixPayTab] = useState<'copiacola' | 'qrcode' | 'chave'>('copiacola');
  const [showRawPixCode, setShowRawPixCode] = useState<boolean>(false);
  const [pixRefCode, setPixRefCode] = useState<string>(() => generatePixRefCode());
  const [pixSenderName, setPixSenderName] = useState<string>(user?.name || '');
  const [pixTxId, setPixTxId] = useState<string>('');
  const [pixReceiptFile, setPixReceiptFile] = useState<{
    name: string;
    mimeType: string;
    base64Data: string;
  } | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [isCheckingPixApproval, setIsCheckingPixApproval] = useState<boolean>(false);

  // Coupons
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false);
  const [publicCoupons, setPublicCoupons] = useState<Array<{ id: string; code: string; discountPercent: number }>>([]);

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
    orderId?: string;
    orderNumber: string;
    amountBRL: number;
    billingCycle: BillingCycle;
    plan: SubscriptionPlan;
    pixKeyUsed: string;
    pixKeyTypeLabel: string;
    txId: string;
    receiptUploaded?: boolean;
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
          try {
            const loaded = await loadStripe(cfg.publishableKey);
            if (!active) return;
            if (loaded) {
              setStripeInstance(loaded);
              setCardLoadFailed(false);
            } else {
              setCardLoadFailed(true);
            }
          } catch {
            if (active) setCardLoadFailed(true);
          }
        }
      })
      .catch(() => {
        // Fallback smoothly to platformSettings / Pix
      });

    fetchAllCoupons()
      .then((list) => {
        if (!active) return;
        const now = Date.now();
        const available = list
          .filter((c) => {
            if (!c?.active) return false;
            if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return false;
            if (c.maxUses > 0 && c.usedCount >= c.maxUses) return false;
            return c.discountPercent > 0;
          })
          .slice(0, 4)
          .map((c) => ({ id: c.id, code: c.code, discountPercent: c.discountPercent }));
        setPublicCoupons(available);
      })
      .catch(() => {
        // ignore non-critical promo fetch error
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

    const elements = stripeInstance.elements({ locale: siteLanguage });
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
      setCardError(ev.error ? translateCardGatewayError(ev.error.message, ui) : null);
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
    stripeInstance,
    siteLanguage,
    ui
  ]);

  const mergedPlans = useMemo(() => {
    const adminMap = new Map(adminPlans.map((p) => [p.id, p]));
    return SAAS_PLANS.map((basePlan) => {
      const cfg = adminMap.get(basePlan.id as 'pro' | 'executive');
      const localizedPlan =
        basePlan.id === 'executive'
          ? billingDict.plans.executive
          : basePlan.id === 'pro'
          ? billingDict.plans.pro
          : billingDict.plans.free;

      return {
        ...basePlan,
        name: siteLanguage === 'pt' && cfg?.name ? cfg.name : localizedPlan.name,
        tagline: siteLanguage === 'pt' && cfg?.tagline ? cfg.tagline : localizedPlan.tagline,
        ctaText: localizedPlan.ctaText || basePlan.ctaText,
        priceMonthlyValue: cfg?.priceMonthlyValue ?? basePlan.priceMonthlyValue,
        priceQuarterlyValue: cfg?.priceQuarterlyValue ?? basePlan.priceQuarterlyValue,
        priceSemiannualValue: cfg?.priceSemiannualValue ?? basePlan.priceSemiannualValue,
        priceYearlyValue: cfg?.priceYearlyValue ?? basePlan.priceYearlyValue,
        isPopular: cfg?.isPopular ?? basePlan.isPopular,
        features:
          siteLanguage === 'pt' && cfg?.features && cfg.features.length > 0
            ? cfg.features
            : localizedPlan.features
      };
    });
  }, [adminPlans, billingDict.plans, siteLanguage]);

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
        throw new Error(data?.error || ui.errHostedVerify);
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
        userName: user?.name || ui.subscriberFallback,
        userEmail: user?.email || data.customerEmail || '',
        plan: verifiedPlan,
        billingCycle: verifiedCycle,
        amount: verifiedAmount,
        currency: verifiedCurrency,
        paymentMethod: 'card',
        status: 'paid',
        stripeSubscriptionId: subId,
        receiptUrl: data.receiptUrl,
        notes: `${ui.orderNoteHostedPrefix}${formatCycleLabel(verifiedCycle, siteLanguage).toLowerCase()}.`
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
        paymentMethodUsed: ui.methodCardAuto
      });
      setUpgradeSuccess(true);
      showSuccess(
        ui.toastSubActiveTitle,
        `${ui.toastSubActiveSubPrefix}${verifiedPlan === 'executive' ? shortPlanNames.executive : shortPlanNames.pro}${ui.toastSubActiveSubSuffix}`
      );
    } catch (e: any) {
      showError(ui.errPendingValTitle, e?.message || ui.errHostedVerify);
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
  const pixKeyTypeLabel = getPixKeyTypeLabel(effectivePixKeyType, siteLanguage);

  const pixBRCode = useMemo(() => {
    return generatePixBRCode(
      effectivePixKey,
      priceBRL,
      effectivePixBeneficiary,
      effectivePixCity,
      effectivePixKeyType,
      pixRefCode
    );
  }, [effectivePixKey, priceBRL, effectivePixBeneficiary, effectivePixCity, effectivePixKeyType, pixRefCode]);

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

  // Silent Auto-Polling for Pending Admin Approval of Personal Pix
  useEffect(() => {
    if (!isOpen || upgradeSuccess) return;
    const pollOrderId = pixPendingDetails?.orderId;
    if (!pollOrderId) return;

    let stopped = false;
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/api/payments/pix/status/${encodeURIComponent(pollOrderId)}`, {
          credentials: 'include',
          headers: getPaymentAuthHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.status === 'paid') {
          stopped = true;
          clearInterval(interval);
          await refreshUser();
          const paidOrder = data.order;
          const usedPlan = (paidOrder?.plan || pixPendingDetails?.plan || selectedPlan) as SubscriptionPlan;
          const usedCycle = (paidOrder?.billingCycle || pixPendingDetails?.billingCycle || billingCycle) as BillingCycle;
          setSelectedPlan(usedPlan);
          setPixPendingDetails(null);
          setPixRefCode(generatePixRefCode());
          setSuccessDetails({
            orderNumber: paidOrder?.orderNumber || pixPendingDetails?.orderNumber || 'PIX-OK',
            amount: Number(paidOrder?.amount ?? pixPendingDetails?.amountBRL ?? priceBRL),
            currencyLabel: 'BRL',
            billingCycle: usedCycle,
            receiptUrl: paidOrder?.receiptUrl,
            paymentMethodUsed: ui.methodPixConfirmed
          });
          setUpgradeSuccess(true);
          showSuccess(ui.toastPixApprovedTitle, ui.toastPixApprovedDesc);
        } else if (data?.status === 'failed') {
          stopped = true;
          clearInterval(interval);
          setPixPendingDetails(null);
          const rejectMsg = 'Pagamento Pix recusado ou não confirmado. Verifique o comprovante e tente novamente.';
          setPixError(rejectMsg);
          showError('Pix Não Aprovado', rejectMsg);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [isOpen, upgradeSuccess, pixPendingDetails]);

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
    if (!pixBRCode) return;
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

  const handleCopyPixRef = async () => {
    try {
      await navigator.clipboard.writeText(pixRefCode);
      setCopiedPixRef(true);
      setTimeout(() => setCopiedPixRef(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleProcessPixReceiptFile = async (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    const mime = (file.type || '').toLowerCase();
    if (!allowed.includes(mime)) {
      setPixError('Envie uma imagem (PNG, JPG, WebP) ou PDF do comprovante.');
      return;
    }
    if (mime === 'application/pdf' && file.size > 1_500_000) {
      setPixError('O comprovante PDF deve ter no máximo 1,5 MB.');
      return;
    }
    try {
      const prepared = await compressImageForPixReceipt(file);
      if (prepared.base64Data.length > 2_100_000) {
        setPixError('O arquivo ficou acima de 1,5 MB mesmo comprimido. Envie um print mais leve.');
        return;
      }
      setPixReceiptFile({
        name: file.name || `comprovante-pix-${pixRefCode}.${mime === 'application/pdf' ? 'pdf' : 'jpg'}`,
        mimeType: prepared.mimeType,
        base64Data: prepared.base64Data
      });
      setPixError(null);
    } catch {
      setPixError('Não foi possível ler o arquivo do comprovante.');
    }
  };

  const handleSelectPixReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleProcessPixReceiptFile(file);
  };

  const handlePastePixReceipt = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          void handleProcessPixReceiptFile(
            new File([blob], `print-pix-${pixRefCode}.png`, { type: blob.type || 'image/png' })
          );
          break;
        }
      }
    }
  };

  const applyCouponByCode = async (rawCode: string) => {
    const codeClean = rawCode.trim().toUpperCase();
    if (!codeClean) return;
    setCouponCode(codeClean);
    setIsCheckingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const coupons = await fetchAllCoupons();
      const matched = coupons.find((c) => c.code.toUpperCase() === codeClean && c.active);

      if (matched) {
        const isExpired = matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now();
        const isLimitReached = matched.maxUses > 0 && matched.usedCount >= matched.maxUses;
        if (isExpired) {
          setCouponError(ui.couponExpired);
          setAppliedDiscount(0);
        } else if (isLimitReached) {
          setCouponError(ui.couponLimit);
          setAppliedDiscount(0);
        } else {
          setAppliedDiscount(matched.discountPercent);
          setCouponSuccess(`${ui.couponAppliedPrefix}${matched.code}${ui.couponAppliedMiddle}${matched.discountPercent}%.`);
          incrementCouponUsage(matched.id, matched.usedCount);
        }
      } else {
        setCouponError(ui.couponInvalid);
        setAppliedDiscount(0);
      }
    } catch {
      setCouponError(ui.couponError);
      setAppliedDiscount(0);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    await applyCouponByCode(couponCode);
  };

  const handleClearCoupon = () => {
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleCheckPixActivationNow = async () => {
    setIsCheckingPixApproval(true);
    try {
      const checkOrderId = pixPendingDetails?.orderId;
      if (checkOrderId) {
        const res = await fetch(`/api/payments/pix/status/${encodeURIComponent(checkOrderId)}`, {
          credentials: 'include',
          headers: getPaymentAuthHeaders()
        }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.status === 'paid') {
            await refreshUser();
            setPixPendingDetails(null);
            setSuccessDetails({
              orderNumber: data.order?.orderNumber || pixPendingDetails?.orderNumber || 'APROVADO',
              amount: Number(data.order?.amount ?? pixPendingDetails?.amountBRL ?? priceBRL),
              currencyLabel: 'BRL',
              billingCycle: data.order?.billingCycle || pixPendingDetails?.billingCycle || billingCycle,
              receiptUrl: data.order?.receiptUrl,
              paymentMethodUsed: ui.methodPixConfirmed
            });
            setUpgradeSuccess(true);
            showSuccess(ui.toastPixApprovedTitle, ui.toastPixApprovedDesc);
            return;
          }
        }
      }

      const updated = await refreshUser();
      if (updated && (updated.plan === 'pro' || updated.plan === 'executive')) {
        setPixPendingDetails(null);
        setSuccessDetails({
          orderNumber: pixPendingDetails?.orderNumber || 'APROVADO',
          amount: pixPendingDetails?.amountBRL || priceBRL,
          currencyLabel: 'BRL',
          billingCycle: pixPendingDetails?.billingCycle || billingCycle,
          paymentMethodUsed: ui.methodPixConfirmed
        });
        setUpgradeSuccess(true);
        showSuccess(ui.toastPixApprovedTitle, ui.toastPixApprovedDesc);
      } else {
        showInfo(ui.toastPixPendingTitle, ui.toastPixPendingDesc);
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
      if (onRequireAuth) {
        const planLabel = selectedPlan === 'executive' ? shortPlanNames.executive : shortPlanNames.pro;
        onRequireAuth(
          `${ui.reqAuthPlanPrefix}${planLabel} (${formatCycleLabel(billingCycle, siteLanguage)}).`,
          'register',
          { plan: selectedPlan, cycle: billingCycle }
        );
        return;
      }
      const msg = ui.errAuthInline;
      setCardError(msg);
      setPixError(msg);
      showError(ui.errAuthTitle, ui.errAuthDesc);
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
          throw new Error(data?.error || ui.couponInvalid);
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
          notes: `${ui.orderNoteCouponPrefix}${formatCycleLabel(billingCycle, siteLanguage).toLowerCase()} (${couponCode.toUpperCase()}).`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          subscriptionId: data.subscriptionId,
          nextBillingDate: data.nextBillingDate,
          amount: 0,
          currencyLabel: currency === 'BRL' ? 'BRL' : 'USD',
          billingCycle,
          paymentMethodUsed: ui.methodCoupon100
        });
        setUpgradeSuccess(true);
        showSuccess(ui.toastCouponTitle, ui.toastCouponDesc);
      } catch (err: any) {
        showError(ui.errCouponTitle, err?.message || ui.errCouponActivate);
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
          throw new Error(data.error || ui.errCheckoutUrl);
        } catch (err: any) {
          setCardError(err?.message || ui.errCheckoutInit);
          showError(ui.errCheckoutTitle, err?.message || ui.errCheckoutInit);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // Embedded Tokenized Card Element
      if (!gatewayConfig?.cardEnabled || !stripeInstance || !cardElementRef.current) {
        setCardError(ui.errCardUnavailable);
        return;
      }
      if (cardholderName.trim().length < 2) {
        setCardError(ui.errCardName);
        return;
      }
      if (!isCardComplete) {
        setCardError(ui.errCardIncomplete);
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
          throw new Error(intentData?.error || ui.errCreateIntent);
        }

        const clientSecretStr = String(intentData.clientSecret || '');
        let confirmedPaymentIntentId: string | undefined;

        if (clientSecretStr.startsWith('seti_')) {
          const setupConfirmation = await stripeInstance.confirmCardSetup(clientSecretStr, {
            payment_method: {
              card: cardElementRef.current,
              billing_details: {
                name: cardholderName.trim(),
                email: user.email
              }
            }
          });
          if (setupConfirmation.error) {
            throw new Error(translateCardGatewayError(setupConfirmation.error.message, ui));
          }
          if (setupConfirmation.setupIntent?.status !== 'succeeded') {
            throw new Error(ui.errNotCompleted);
          }
        } else {
          const confirmation = await stripeInstance.confirmCardPayment(clientSecretStr, {
            payment_method: {
              card: cardElementRef.current,
              billing_details: {
                name: cardholderName.trim(),
                email: user.email
              }
            }
          });
          if (confirmation.error) {
            throw new Error(translateCardGatewayError(confirmation.error.message, ui));
          }
          if (confirmation.paymentIntent?.status !== 'succeeded') {
            throw new Error(ui.errNotCompleted);
          }
          confirmedPaymentIntentId = confirmation.paymentIntent.id;
        }

        const confirmRes = await fetch('/api/payments/confirm-subscription', {
          method: 'POST',
          credentials: 'include',
          headers: getPaymentAuthHeaders(),
          body: JSON.stringify({
            subscriptionId: intentData.subscriptionId,
            paymentIntentId: confirmedPaymentIntentId,
            plan: selectedPlan,
            billingCycle
          })
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok || !confirmData?.verified) {
          throw new Error(confirmData?.error || ui.errVerifySub);
        }

        await upgradePlan(selectedPlan, {
          billingCycle,
          stripeSubscriptionId: confirmData.subscriptionId,
          stripeCustomerId: confirmData.customerId
        });

        const order = await createSaaSOrder({
          id: confirmData.order?.id,
          orderNumber: confirmData.order?.orderNumber,
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
          stripePaymentIntentId: confirmedPaymentIntentId,
          receiptUrl: confirmData.receiptUrl,
          createdAt: confirmData.order?.createdAt,
          notes: `${ui.orderNoteCardPrefix}${formatCycleLabel(billingCycle, siteLanguage).toLowerCase()}.`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          subscriptionId: confirmData.subscriptionId,
          nextBillingDate: confirmData.nextBillingDate,
          amount: order.amount,
          currencyLabel: order.currency,
          billingCycle,
          receiptUrl: confirmData.receiptUrl || order.receiptUrl,
          paymentMethodUsed: ui.methodCardAuto
        });
        setUpgradeSuccess(true);
        showSuccess(
          ui.toastCardConfirmTitle,
          `${ui.toastSubActiveSubPrefix}${selectedPlan === 'executive' ? shortPlanNames.executive : shortPlanNames.pro}${ui.toastSubActiveSubSuffix}`
        );
      } catch (err: any) {
        const cleanMsg = translateCardGatewayError(err?.message, ui);
        setCardError(cleanMsg);
        showError(ui.errCheckoutTitle, cleanMsg);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. PERSONAL PIX PAYMENT (Direct Transfer -> Unique Ref Code + Proof -> Admin Approval)
    const payerClean = pixSenderName.trim() || user?.name?.trim() || user?.email?.split('@')[0] || '';
    if (payerClean.length < 2) {
      setPixError(ui.errPixName);
      return;
    }
    const cleanTxRef = pixTxId.trim();

    setIsProcessing(true);
    try {
      const generatedOrderId = `ord-${Date.now()}`;
      const order = await createSaaSOrder({
        id: generatedOrderId,
        userId: user.id,
        userName: payerClean,
        userEmail: user.email,
        plan: selectedPlan,
        billingCycle,
        amount: priceBRL,
        currency: 'BRL',
        paymentMethod: 'pix',
        status: 'pending',
        stripePaymentIntentId: pixRefCode,
        notes: `Cód.Extrato: ${pixRefCode} | Pagador: ${payerClean} | ${formatCycleLabel(billingCycle, siteLanguage)}${
          cleanTxRef ? ` | Ref/Hora: ${cleanTxRef}` : ''
        }${pixReceiptFile ? ' | Comprovante anexado' : ''}`
      });

      let uploadedReceipt = false;
      if (pixReceiptFile) {
        try {
          const uploadRes = await fetch(`/api/orders/${encodeURIComponent(order.id)}/receipt`, {
            method: 'POST',
            credentials: 'include',
            headers: getPaymentAuthHeaders(),
            body: JSON.stringify({
              mimeType: pixReceiptFile.mimeType,
              base64Data: pixReceiptFile.base64Data
            })
          });
          uploadedReceipt = uploadRes.ok;
        } catch {
          // non-fatal; order still created with payer name & pixRefCode
        }
      }

      setPixPendingDetails({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountBRL: priceBRL,
        billingCycle,
        plan: selectedPlan,
        pixKeyUsed: effectivePixKey,
        pixKeyTypeLabel,
        txId: cleanTxRef ? `${pixRefCode} · ${cleanTxRef}` : pixRefCode,
        receiptUploaded: uploadedReceipt
      });
      showInfo(ui.toastPixRegTitle, ui.toastPixRegDesc);
    } catch (err: any) {
      const msg = err?.message || ui.errPixSave;
      setPixError(msg);
      showError(ui.errPixSaveTitle, msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!user?.stripeCustomerId) {
      showError(ui.errPortalTitle, ui.errPortalNoCustomer);
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
        showError(ui.errPortalTitle, data?.error || ui.errPortalOpen);
      }
    } catch {
      showError(ui.errPortalTitle, ui.errPortalOpen);
    }
  };

  const cycleMeta = BILLING_CYCLE_META[billingCycle];
  const localizedCycle = billingDict.cycles[billingCycle] || cycleMeta;

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
                {ui.headerTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {ui.headerSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label={ui.closeAria}
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
                {ui.successTitle}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-500">
                {ui.successInvoicePrefix}<span className="text-slate-900 font-bold">{successDetails.orderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">{ui.successPlanLabel}</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedPlan === 'executive' ? shortPlanNames.executiveFull : shortPlanNames.pro}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">{ui.successMethodLabel}</span>
                <span className="text-xs font-bold text-teal-700">
                  {successDetails.paymentMethodUsed || ui.methodCardAuto}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">{ui.successCycleLabel}</span>
                <span className="text-xs font-bold text-slate-900 uppercase">
                  {formatCycleLabel(successDetails.billingCycle, siteLanguage)} ({getCycleDurationDays(successDetails.billingCycle)} {ui.daysWord})
                </span>
              </div>

              {successDetails.subscriptionId && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">{ui.successSubIdLabel}</span>
                  <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {successDetails.subscriptionId}
                  </span>
                </div>
              )}

              {successDetails.nextBillingDate && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">{ui.successNextBillingLabel}</span>
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(successDetails.nextBillingDate).toLocaleDateString(intlLocale)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-900">{ui.successAmountLabel}</span>
                <span className="text-sm font-black font-mono text-emerald-700">
                  {successDetails.currencyLabel === 'BRL'
                    ? `R$ ${Number(successDetails.amount).toFixed(2)} BRL`
                    : `$${successDetails.amount} ${successDetails.currencyLabel}`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {ui.successBody}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{ui.successStartBtn}</span>
              </button>

              {user?.stripeCustomerId && (
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ui.successManageBtn}</span>
                </button>
              )}
            </div>
            {billingPortalUrl && getSafeExternalUrl(billingPortalUrl) && (
              <p className="text-xs text-slate-600">
                {ui.successPortalFallbackPrefix}
                <a
                  href={getSafeExternalUrl(billingPortalUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-900 underline"
                >
                  {ui.successPortalFallbackLink}
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
                {ui.pixPendingTitle}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-500">
                {ui.pixPendingOrderPrefix}<span className="text-slate-900">{pixPendingDetails.orderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">{ui.pixPendingPlanLabel}</span>
                <span className="font-bold text-slate-900">
                  {pixPendingDetails.plan === 'executive' ? shortPlanNames.executive : shortPlanNames.pro} ·{' '}
                  {formatCycleLabel(pixPendingDetails.billingCycle, siteLanguage)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">{ui.pixPendingAmountLabel}</span>
                <span className="font-black font-mono text-teal-700">
                  R$ {pixPendingDetails.amountBRL.toFixed(2)} BRL
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">{ui.pixPendingKeyPrefix}{pixPendingDetails.pixKeyTypeLabel}):</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[230px]">
                  {pixPendingDetails.pixKeyUsed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">{ui.pixPendingTxLabel}</span>
                <span className="font-mono font-bold text-slate-900">{pixPendingDetails.txId}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {ui.pixPendingBody}{' '}
              <span className="font-semibold text-teal-700">
                Esta tela atualiza automaticamente em segundos assim que for aprovado.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckPixActivationNow}
                disabled={isCheckingPixApproval}
                className="w-full sm:w-auto px-7 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingPixApproval ? 'animate-spin' : ''}`} />
                <span>{isCheckingPixApproval ? ui.pixCheckingBtn : ui.pixCheckNowBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPixPendingDetails(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                {ui.pixCloseLaterBtn}
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
                      {ui.promptBadgeTitle}
                    </h4>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-md border border-amber-500/40 uppercase tracking-wide">
                      {ui.promptBadgeTag}
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
                <span className="text-xs font-semibold text-slate-500 mr-1">{ui.currencyLabel}</span>
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

              {/* 4 Recurring Billing Cycles */}
              <div className="p-1 bg-slate-100 rounded-xl flex flex-wrap items-center justify-center gap-1 text-xs font-semibold">
                {BILLING_CYCLES.map((cycleKey) => {
                  const meta = BILLING_CYCLE_META[cycleKey];
                  const locCycle = billingDict.cycles[cycleKey] || meta;
                  const badgeText = locCycle.badgeText ?? meta.badgeText;
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
                      <span>{locCycle.label}</span>
                      {badgeText && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold tabular-nums">
                          {badgeText}
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
                const periodSuffix = `${ui.periodSlash}${localizedCycle.shortUnit}`;
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
                        {ui.popularBadge}
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
                            ? `${ui.equivUsdPrefix}${cycleUsd} USD`
                            : `${ui.equivBrlPrefix}${(cycleUsd * 5.4).toFixed(2)} BRL`}
                        </span>
                        {monthlyEquivalent && (
                          <span className="text-[11px] text-emerald-700 font-medium block">
                            {ui.monthlyEquivPrefix}{formatPrice(monthlyEquivalent)}{ui.monthlyEquivUnit} ({localizedCycle.badgeText ?? cycleMeta.badgeText})
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ui.accessDaysPrefix}{cycleMeta.durationDays}{ui.accessDaysSuffix}
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
                        {isCurrent ? ui.currentPlanBtn : isSelected ? ui.selectedPlanBtn : plan.ctaText}
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
                      <span>{ui.summaryTitle}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {ui.summarySub}
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
                        ? `${ui.pixEquivPrefix}${finalPriceUSD}${ui.pixEquivPlanPrefix}${localizedCycle.label})`
                        : `${ui.cardEquivPrefix}${priceBRL.toFixed(2)}${ui.cardEquivCyclePrefix}${localizedCycle.label} (${cycleMeta.durationDays} ${ui.daysWord})`}
                    </span>
                  </div>
                </div>

                {!user?.id && onRequireAuth && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-amber-400">{ui.guestTitle}</p>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ui.guestDesc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onRequireAuth(
                            `${ui.reqAuthGuestCreatePrefix}${selectedPlan === 'executive' ? shortPlanNames.executive : shortPlanNames.pro}.`,
                            'register',
                            { plan: selectedPlan, cycle: billingCycle }
                          )
                        }
                        className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                      >
                        {ui.guestCreateBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequireAuth(
                            ui.reqAuthGuestLogin,
                            'login',
                            { plan: selectedPlan, cycle: billingCycle }
                          )
                        }
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap"
                      >
                        {ui.guestLoginBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* Coupon Code Input + Active Public Promo Vouchers */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{ui.couponLabel}</span>
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder={ui.couponPlaceholder}
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
                      {isCheckingCoupon ? ui.couponChecking : ui.couponApplyBtn}
                    </button>
                    {appliedDiscount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCoupon}
                        className="min-h-[40px] px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                      >
                        {ui.couponRemoveBtn}
                      </button>
                    )}
                  </div>
                  {publicCoupons.length > 0 && appliedDiscount === 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                      <span className="text-slate-500 font-medium">{ui.couponActivePromos}</span>
                      {publicCoupons.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isCheckingCoupon}
                          onClick={() => void applyCouponByCode(c.code)}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-mono font-bold transition-colors"
                        >
                          {c.code} (-{c.discountPercent}%)
                        </button>
                      ))}
                    </div>
                  )}
                  {couponSuccess && <p className="text-[11px] font-semibold text-emerald-600">{couponSuccess}</p>}
                  {couponError && <p className="text-[11px] font-semibold text-rose-600">{couponError}</p>}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {ui.paymentMethodLabel}
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
                          {ui.cardOptionBadge}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">{ui.cardOptionTitle}</div>
                      <div className="text-[10px] text-slate-500">{ui.cardOptionSub}</div>
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
                          {ui.pixOptionBadge}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">{ui.pixOptionTitle}</div>
                      <div className="text-[10px] text-teal-600 font-semibold">
                        {ui.pixOptionSubPrefix}{pixKeyTypeLabel}{ui.pixOptionSubSuffix}
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
                            {ui.cardSecurityTitle}
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
                            {ui.cardModeEmbedded}
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
                            {ui.cardModeCheckout}
                          </button>
                        </div>
                      </div>

                      {appliedDiscount >= 100 ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>
                            {ui.coupon100Notice}
                          </span>
                        </div>
                      ) : cardFlowMode === 'embedded' ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">{ui.cardholderLabel}</label>
                            <input
                              type="text"
                              value={cardholderName}
                              onChange={(e) => {
                                setCardholderName(e.target.value);
                                setCardError(null);
                              }}
                              placeholder={ui.cardholderPlaceholder}
                              className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span>{ui.cardDetailsLabel}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> {ui.cardTokenBadge}
                              </span>
                            </label>
                            <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-colors min-h-[42px]">
                              <div ref={cardMountRef} />
                              {!isCardElementReady && (
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                                  <span>
                                    {gatewayConfig && !gatewayConfig.cardEnabled
                                      ? ui.cardUnavailable
                                      : cardLoadFailed
                                      ? 'Não foi possível carregar o formulário embutido aqui.'
                                      : ui.cardLoading}
                                  </span>
                                  {(cardLoadFailed || (gatewayConfig && !gatewayConfig.cardEnabled)) && (
                                    <button
                                      type="button"
                                      onClick={() => setCardFlowMode('checkout')}
                                      className="font-bold text-slate-900 underline hover:text-slate-700"
                                    >
                                      Abrir Página Segura Stripe
                                    </button>
                                  )}
                                </div>
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
                              <span>{ui.autoRenewPrefix}{localizedCycle.label})</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              {ui.autoRenewBodyPrefix}
                              <strong className="text-slate-900">
                                {currency === 'BRL' ? `R$ ${priceBRL.toFixed(2)} BRL` : `$${finalPriceUSD} USD`}
                              </strong>
                              {ui.autoRenewBodyMiddle}{cycleMeta.durationDays}{ui.autoRenewBodySuffix}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2.5">
                          <CreditCard className="w-8 h-8 text-slate-700 mx-auto" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {ui.hostedRedirectTitle}
                            </h4>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                              {ui.hostedRedirectDesc}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. PIX PAYMENT CONTAINER (Personal Account Pix with Automatic Statement ID) */}
                  {paymentMethod === 'pix' && (
                    <div
                      onPaste={handlePastePixReceipt}
                      className="mt-3 p-4 sm:p-5 bg-white border border-teal-200 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs shrink-0">
                            <QrCode className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{ui.pixHeaderTitle}</span>
                              <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono uppercase">
                                {pixKeyTypeLabel}
                              </span>
                              <span
                                className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                title="Código incluído automaticamente para identificar o seu pagamento no extrato"
                              >
                                ID: {pixRefCode}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              Escolha Copia e Cola, QR Code ou Chave Pix. Simples e rápido em qualquer banco.
                            </span>
                          </div>
                        </div>

                        <div className="bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200 text-left sm:text-right self-start sm:self-auto shrink-0">
                          <span className="text-[10px] text-teal-700 font-bold block uppercase tracking-wider">
                            {ui.pixTotalLabel}
                          </span>
                          <span className="text-sm font-black text-teal-950 font-mono tabular-nums">
                            R$ {priceBRL.toFixed(2)} BRL{' '}
                            <span className="text-[10px] text-slate-500 font-normal">(${finalPriceUSD} USD)</span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Payment Format Switcher */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setPixPayTab('copiacola')}
                            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              pixPayTab === 'copiacola'
                                ? 'bg-white text-teal-900 shadow-2xs ring-1 ring-teal-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5 text-teal-600" />
                            <span>Copia e Cola</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPixPayTab('qrcode')}
                            className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              pixPayTab === 'qrcode'
                                ? 'bg-white text-teal-900 shadow-2xs ring-1 ring-teal-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-teal-600" />
                            <span>QR Code</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPixPayTab('chave')}
                            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              pixPayTab === 'chave'
                                ? 'bg-white text-teal-900 shadow-2xs ring-1 ring-teal-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                            <span>Chave Pix</span>
                          </button>
                        </div>

                        {/* TAB 1: PIX COPIA E COLA (Clean 1-click button — giant code hidden by default!) */}
                        {pixPayTab === 'copiacola' && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-900">
                                Ideal para celular ou apps sem leitor de QR Code
                              </p>
                              <p className="text-[11px] text-slate-600">
                                No app do banco, vá em <strong>Pix &gt; Pix Copia e Cola</strong> e cole. O valor (<strong>R$ {priceBRL.toFixed(2)}</strong>) e o código identificador (<strong>{pixRefCode}</strong>) já vão preenchidos.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleCopyPixPayload}
                              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                                copiedPixPayload
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-teal-600 hover:bg-teal-700 text-white'
                              }`}
                            >
                              {copiedPixPayload ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Código Copiado! Agora cole no app do seu banco</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copiar Pix Copia e Cola (R$ {priceBRL.toFixed(2)})</span>
                                </>
                              )}
                            </button>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                              <span>
                                Beneficiário: <strong className="text-slate-700">{effectivePixBeneficiary}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowRawPixCode((prev) => !prev)}
                                className="text-teal-700 hover:text-teal-900 font-semibold underline"
                              >
                                {showRawPixCode ? 'Ocultar código' : 'Ver código completo'}
                              </button>
                            </div>

                            {showRawPixCode && (
                              <input
                                type="text"
                                readOnly
                                value={pixBRCode}
                                onClick={handleCopyPixPayload}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10.5px] font-mono text-slate-600 truncate cursor-pointer"
                              />
                            )}
                          </div>
                        )}

                        {/* TAB 2: QR CODE */}
                        {pixPayTab === 'qrcode' && (
                          <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                              {pixQrDataUrl ? (
                                <img
                                  src={pixQrDataUrl}
                                  alt="QR Code Pix"
                                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                                />
                              ) : (
                                <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-400">
                                  {ui.pixQrLoading}
                                </div>
                              )}
                            </div>
                            <div className="mt-2.5 text-center">
                              <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                                {ui.pixScanHint}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                {ui.pixBeneficiaryPrefix}{effectivePixBeneficiary} · R$ {priceBRL.toFixed(2)} · ID {pixRefCode}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: DIRECT SHORT PIX KEY (for older apps / manual transfer) */}
                        {pixPayTab === 'chave' && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">
                                {ui.pixKeyFieldPrefix}{pixKeyTypeLabel}):
                              </span>
                              <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                                {ui.pixOfficialAccount}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 truncate select-all">
                                {effectivePixKey}
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyPixKey}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                  copiedPixKey
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                              >
                                {copiedPixKey ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{ui.pixKeyCopied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{ui.pixCopyKey}</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
                              <span>
                                Transfira <strong>R$ {priceBRL.toFixed(2)}</strong> e, se quiser agilizar, coloque{' '}
                                <strong className="font-mono text-slate-900">{pixRefCode}</strong> na descrição:
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyPixRef}
                                className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10.5px] font-mono font-bold text-teal-800"
                              >
                                {copiedPixRef ? 'ID Copiado!' : `Copiar ID: ${pixRefCode}`}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Easy Proof Box: Pre-filled Payer + Optional Ref + Click or Ctrl+V Screenshot Upload */}
                        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-600" />
                              Após pagar no banco, confirme abaixo para liberarmos na hora:
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-bold text-slate-700">
                                {ui.pixSenderLabel}
                              </label>
                              <input
                                type="text"
                                value={pixSenderName}
                                onChange={(e) => {
                                  setPixSenderName(e.target.value);
                                  setPixError(null);
                                }}
                                placeholder={ui.pixSenderPlaceholder}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-bold text-slate-700">
                                Hora ou Cód. do comprovante <span className="font-normal text-slate-400">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                value={pixTxId}
                                onChange={(e) => {
                                  setPixTxId(e.target.value);
                                  setPixError(null);
                                }}
                                placeholder="Ex: 14:32 ou E12345..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-teal-300 bg-white hover:bg-teal-50/40 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors">
                              {pixReceiptFile ? (
                                <>
                                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[210px] text-emerald-800">
                                    {pixReceiptFile.name}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>Anexar print/PDF (ou cole com Ctrl+V)</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                onChange={handleSelectPixReceiptFile}
                                className="hidden"
                              />
                            </label>

                            {pixReceiptFile && (
                              <button
                                type="button"
                                onClick={() => setPixReceiptFile(null)}
                                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                              >
                                Remover anexo
                              </button>
                            )}
                          </div>

                          {pixReceiptFile && pixReceiptFile.mimeType.startsWith('image/') && (
                            <div className="flex items-center gap-2.5 pt-1">
                              <img
                                src={pixReceiptFile.base64Data}
                                alt="Pré-visualização do comprovante"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                              />
                              <span className="text-[10.5px] text-emerald-700 font-semibold">
                                Comprovante pronto! Clique no botão abaixo para enviar para conferência.
                              </span>
                            </div>
                          )}
                        </div>

                        {pixError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{pixError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {paymentMethod === 'pix' ? ui.footerPixNote : ui.footerCardNote}
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
                        <span>{ui.processingBtn}</span>
                      </>
                    ) : paymentMethod === 'pix' ? (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>
                          {appliedDiscount >= 100
                            ? ui.freeActivateCouponBtn
                            : `Já Paguei via Pix (R$ ${priceBRL.toFixed(2)})`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                      </>
                    ) : cardFlowMode === 'checkout' ? (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>{ui.continueCheckoutPrefix}{formatPrice(finalPriceUSD)})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>
                          {ui.payCardPrefix}{formatPrice(finalPriceUSD)} / {localizedCycle.shortUnit})
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
