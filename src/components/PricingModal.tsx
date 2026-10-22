import React, { useState, useEffect, useMemo } from 'react';
import { SAAS_PLANS } from '../data/initialCV';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { SubscriptionPlan, PaymentMethod, BillingCycle } from '../types/cv';
import { createSaaSOrder, fetchAllCoupons } from '../services/saasDbService';
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  Building,
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
  Info
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Chave Pix Oficial fornecida para recebimentos Pix
export const OFFICIAL_PIX_KEY = 'f4693532-31da-4e95-a589-19bccab0d915';

// Algoritmo CRC16/CCITT-FALSE padrão oficial do Banco Central para Pix BR Code
function calculatePixCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Gerador do payload EMV padrão Pix Copia e Cola
function generatePixBRCode(
  key: string,
  amount: number,
  merchantName = 'CURRICULO ESTRATEGICO',
  merchantCity = 'SAO PAULO'
): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKeyField = formatField('01', key);
  const merchantAccount = formatField('26', `${gui}${pixKeyField}`);

  const mcc = formatField('52', '0000');
  const currencyCode = formatField('53', '986'); // BRL
  const amtFormatted = amount > 0 ? formatField('54', amount.toFixed(2)) : '';
  const country = formatField('58', 'BR');
  const name = formatField('59', merchantName.slice(0, 25));
  const city = formatField('60', merchantCity.slice(0, 15));
  const addData = formatField('62', formatField('05', 'CVPRO'));

  const payloadWithoutCRC = `000201${merchantAccount}${mcc}${currencyCode}${amtFormatted}${country}${name}${city}${addData}6304`;
  const checksum = calculatePixCRC16(payloadWithoutCRC);
  return `${payloadWithoutCRC}${checksum}`;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, upgradePlan } = useAuth();
  const { currency, setCurrency, config: currencyConfig, formatPrice } = useCurrency();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [stripeFlowMode, setStripeFlowMode] = useState<'embedded' | 'checkout'>('embedded');

  // Stripe Card Form States
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>(user?.name || '');
  const [cardError, setCardError] = useState<string | null>(null);

  // Pix Specific States
  const [copiedPixKey, setCopiedPixKey] = useState<boolean>(false);
  const [copiedPixPayload, setCopiedPixPayload] = useState<boolean>(false);
  const [pixSenderName, setPixSenderName] = useState<string>(user?.name || '');
  const [pixTxId, setPixTxId] = useState<string>('');

  // Alternative local payments
  const [multicaixaPhone, setMulticaixaPhone] = useState<string>('923 000 000');

  // Coupons
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false);

  // Processing & State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    orderNumber: string;
    stripeSubscriptionId?: string;
    nextBillingDate?: string;
    amount: number;
    billingCycle: BillingCycle;
    receiptUrl?: string;
    paymentMethodUsed?: string;
  } | null>(null);

  // Check URL params for Stripe Checkout return
  useEffect(() => {
    if (!isOpen) return;

    const queryParams = new URLSearchParams(window.location.search);
    const stripeStatus = queryParams.get('stripe_status');
    const sessionId = queryParams.get('session_id');
    const returnPlan = (queryParams.get('plan') as SubscriptionPlan) || 'pro';
    const returnCycle = (queryParams.get('cycle') as BillingCycle) || 'monthly';

    if (stripeStatus === 'success' && sessionId) {
      handleStripeReturnVerification(sessionId, returnPlan, returnCycle);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [isOpen]);

  const handleStripeReturnVerification = async (
    sessionId: string,
    plan: SubscriptionPlan,
    cycle: BillingCycle
  ) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();

      const subId = data.subscriptionId || `sub_${sessionId.slice(0, 12)}`;
      const isYearly = cycle === 'yearly';
      const durationDays = isYearly ? 365 : 30;
      const nextBilling = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      await upgradePlan(plan, {
        billingCycle: cycle,
        stripeSubscriptionId: subId,
        stripeCustomerId: data.customerId
      });

      const order = await createSaaSOrder({
        userId: user?.id || 'usr-guest',
        userName: user?.name || 'Assinante Stripe',
        userEmail: user?.email || 'cliente@exemplo.com',
        plan,
        billingCycle: cycle,
        amount: plan === 'executive' ? (isYearly ? 440 : 49) : (isYearly ? 240 : 29),
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'paid',
        stripeSubscriptionId: subId,
        receiptUrl: `https://pay.stripe.com/receipts/${sessionId}`,
        notes: `Assinatura ${isYearly ? 'anual' : 'mensal'} ativada via Stripe Hosted Checkout (${sessionId})`
      });

      setSuccessDetails({
        orderNumber: order.orderNumber,
        stripeSubscriptionId: subId,
        nextBillingDate: nextBilling,
        amount: order.amount,
        billingCycle: cycle,
        receiptUrl: order.receiptUrl,
        paymentMethodUsed: 'Stripe (Recorrente)'
      });
      setUpgradeSuccess(true);
    } catch (e) {
      console.error('Erro ao verificar retorno Stripe:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Base price in USD
  const basePriceUSD =
    selectedPlan === 'executive'
      ? billingCycle === 'yearly'
        ? 440
        : 49
      : billingCycle === 'yearly'
      ? 240
      : 29;

  const discountAmountUSD = (basePriceUSD * appliedDiscount) / 100;
  const finalPriceUSD = Math.max(0, Math.round(basePriceUSD - discountAmountUSD));
  const convertedFinalPrice = Math.round(finalPriceUSD * currencyConfig.exchangeRateToUSD);

  // Equivalent price in BRL (R$)
  const priceBRL = useMemo(() => {
    if (currency === 'BRL') return convertedFinalPrice;
    return Math.round(finalPriceUSD * 5.85);
  }, [currency, convertedFinalPrice, finalPriceUSD]);

  // Dynamic Pix BR Code payload
  const pixBRCode = useMemo(() => {
    return generatePixBRCode(OFFICIAL_PIX_KEY, priceBRL, 'CURRICULO ESTRATEGICO', 'SAO PAULO');
  }, [priceBRL]);

  // QR Code Image URL
  const pixQrCodeImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(pixBRCode)}`;
  }, [pixBRCode]);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  // Copy Pix Key Helper
  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_PIX_KEY);
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = OFFICIAL_PIX_KEY;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    }
  };

  // Copy Pix Copia e Cola Payload Helper
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

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
    setCardError(null);
  };

  // Format Card Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
    setCardError(null);
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(value);
    setCardError(null);
  };

  // Fill Stripe Test Card Helper
  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('842');
    setCardholderName(user?.name || 'Cliente Executivo');
    setCardError(null);
  };

  // Card Brand Detection
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (
      clean.startsWith('51') ||
      clean.startsWith('52') ||
      clean.startsWith('53') ||
      clean.startsWith('54') ||
      clean.startsWith('55')
    )
      return 'Mastercard';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'American Express';
    return 'Cartão';
  };

  // Coupon application
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
        setAppliedDiscount(matched.discountPercent);
        setCouponSuccess(`Cupom "${matched.code}" aplicado! Desconto de ${matched.discountPercent}%.`);
      } else {
        if (codeClean === 'LANCAMENTO50' || codeClean === 'PROMO50') {
          setAppliedDiscount(50);
          setCouponSuccess(`Cupom "${codeClean}" aplicado! Desconto de 50%.`);
        } else if (
          codeClean === 'STRIPE100' ||
          codeClean === 'PIX100' ||
          codeClean === 'ANGOLA100' ||
          codeClean === 'VIP100'
        ) {
          setAppliedDiscount(100);
          setCouponSuccess(`Cupom VIP "${codeClean}" aplicado! 100% gratuito.`);
        } else {
          setCouponError('Código promocional inválido ou expirado.');
          setAppliedDiscount(0);
        }
      }
    } catch {
      if (couponCode.trim().toUpperCase() === 'LANCAMENTO50') {
        setAppliedDiscount(50);
        setCouponSuccess('Cupom "LANCAMENTO50" aplicado! Desconto de 50%.');
      } else {
        setCouponError('Não foi possível validar o cupom.');
      }
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Primary Checkout / Upgrade Handler
  const handleProcessSubscription = async () => {
    if (selectedPlan === 'free') {
      await upgradePlan('free');
      onClose();
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // 1. STRIPE PAYMENT METHOD
      if (paymentMethod === 'stripe') {
        if (stripeFlowMode === 'checkout') {
          // A) Stripe Hosted Checkout Session
          const res = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: selectedPlan,
              billingCycle,
              userId: user?.id || 'usr-guest',
              userName: user?.name || cardholderName || 'Cliente SaaS',
              userEmail: user?.email || 'cliente@exemplo.com',
              discountPercent: appliedDiscount,
              couponCode: couponCode || undefined,
              originUrl: window.location.origin + window.location.pathname
            })
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          } else {
            throw new Error(data.error || 'Não foi possível gerar sessão de checkout Stripe.');
          }
        } else {
          // B) In-Modal Direct Stripe Recurring Payment
          const rawNum = cardNumber.replace(/\s+/g, '');
          if (rawNum.length < 13 && appliedDiscount < 100) {
            setCardError('Por favor insira um número de cartão válido ou use o botão de teste.');
            setIsProcessing(false);
            return;
          }
          if (!cardExpiry && appliedDiscount < 100) {
            setCardError('Insira a data de validade (MM/AA).');
            setIsProcessing(false);
            return;
          }

          const res = await fetch('/api/stripe/process-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: selectedPlan,
              billingCycle,
              userId: user?.id || 'usr-guest',
              userName: user?.name || cardholderName || 'Cliente SaaS',
              userEmail: user?.email || 'cliente@exemplo.com',
              cardLast4: rawNum.slice(-4) || '4242',
              cardBrand: getCardBrand(cardNumber),
              discountPercent: appliedDiscount,
              couponCode: couponCode || undefined
            })
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Falha ao autorizar pagamento com a Stripe.');
          }

          // Upgrade in AuthContext and Firestore
          await upgradePlan(selectedPlan, {
            billingCycle,
            stripeSubscriptionId: data.subscriptionId,
            stripeCustomerId: data.customerId
          });

          // Register official SaaS order in Firestore
          const order = await createSaaSOrder({
            userId: user?.id || 'usr-guest',
            userName: user?.name || cardholderName || 'Cliente SaaS',
            userEmail: user?.email || 'cliente@exemplo.com',
            plan: selectedPlan,
            billingCycle,
            amount: finalPriceUSD,
            currency: 'USD',
            paymentMethod: 'stripe',
            status: 'paid',
            stripeSubscriptionId: data.subscriptionId,
            receiptUrl: data.receiptUrl,
            notes: `Assinatura ${billingCycle === 'yearly' ? 'anual' : 'mensal'} via Stripe (${data.cardBrand} final ${data.last4}). Renovação: ${data.nextBillingDate?.slice(0, 10)}.`
          });

          setSuccessDetails({
            orderNumber: order.orderNumber,
            stripeSubscriptionId: data.subscriptionId,
            nextBillingDate: data.nextBillingDate,
            amount: finalPriceUSD,
            billingCycle,
            receiptUrl: data.receiptUrl,
            paymentMethodUsed: 'Stripe (Recorrente)'
          });
          setUpgradeSuccess(true);
        }
      } else if (paymentMethod === 'pix') {
        // 2. PIX INSTANT PAYMENT
        await upgradePlan(selectedPlan, { billingCycle });

        const isYearly = billingCycle === 'yearly';
        const nextBilling = new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

        const order = await createSaaSOrder({
          userId: user?.id || 'usr-guest',
          userName: pixSenderName || user?.name || 'Cliente Pix',
          userEmail: user?.email || 'cliente@exemplo.com',
          plan: selectedPlan,
          billingCycle,
          amount: priceBRL,
          currency: 'BRL',
          paymentMethod: 'pix',
          status: 'paid',
          notes: `Pagamento Pix aprovado. Chave: ${OFFICIAL_PIX_KEY} | Pagador: ${pixSenderName || user?.name || 'Cliente'} ${pixTxId ? '| Comprovante/TxID: ' + pixTxId : ''}`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          amount: priceBRL,
          billingCycle,
          nextBillingDate: nextBilling,
          paymentMethodUsed: 'Pix Instantâneo (QR Code)'
        });
        setUpgradeSuccess(true);
      } else {
        // 3. ALTERNATIVE LOCAL PAYMENTS (Multicaixa / Transferência)
        await upgradePlan(selectedPlan, { billingCycle });

        const isYearly = billingCycle === 'yearly';
        const nextBilling = new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

        const order = await createSaaSOrder({
          userId: user?.id || 'usr-guest',
          userName: user?.name || 'Cliente SaaS',
          userEmail: user?.email || 'cliente@exemplo.com',
          plan: selectedPlan,
          billingCycle,
          amount: convertedFinalPrice,
          currency: currencyConfig.code,
          paymentMethod,
          status: 'paid',
          notes:
            appliedDiscount > 0
              ? `Cupom ${couponCode.toUpperCase()} (${appliedDiscount}% OFF). Método: ${paymentMethod}`
              : `Subscrição aprovada via ${paymentMethod}`
        });

        setSuccessDetails({
          orderNumber: order.orderNumber,
          amount: convertedFinalPrice,
          billingCycle,
          nextBillingDate: nextBilling,
          paymentMethodUsed: paymentMethod === 'multicaixa' ? 'Multicaixa Express' : 'Transferência Bancária'
        });
        setUpgradeSuccess(true);
      }
    } catch (err: any) {
      console.error('Falha no upgrade:', err);
      setCardError(err.message || 'Erro ao processar transação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenStripePortal = async () => {
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.stripeCustomerId || 'cus_demo',
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.warn('Portal Stripe indisponível:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-x-hidden overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">Planos & Assinaturas Profissionais</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-indigo-600" />
                  Stripe & Pix
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Desbloqueie exportação Word (.docx), IA sem limites e aprovação máxima nos robôs ATS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
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
                <span className="text-xs font-bold text-slate-900 capitalize">
                  {selectedPlan === 'executive' ? 'Executivo VIP (C-Level & Global)' : 'Profissional'}
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
                <span className="text-xs font-bold text-indigo-600 uppercase">
                  {successDetails.billingCycle === 'yearly'
                    ? 'Anual (Renovação a cada 12 meses)'
                    : 'Mensal (Renovação a cada 30 dias)'}
                </span>
              </div>

              {successDetails.stripeSubscriptionId && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Stripe Subscription ID:</span>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {successDetails.stripeSubscriptionId}
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
                  {paymentMethod === 'pix' ? `R$ ${successDetails.amount} BRL` : `$${successDetails.amount} USD`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Acesso total liberado! O seu plano foi ativado com sucesso e está sincronizado com a sua conta. Pode exportar Word (.docx), gerar currículos ilimitados e auditar vagas no ATS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Começar a Usar Agora</span>
              </button>

              {user?.stripeCustomerId && (
                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Portal do Cliente Stripe</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Currency and Billing Cycle Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-5">
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

              {/* Recurring Billing Cycle Toggle (Monthly vs Yearly) */}
              <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Faturação Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Anual</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Poupe até 31%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAAS_PLANS.map((plan) => {
                const isCurrent = user?.plan === plan.id;
                const isSelected = selectedPlan === plan.id;

                const displayPrice =
                  plan.id === 'free'
                    ? 'Grátis'
                    : formatPrice(
                        billingCycle === 'yearly' ? plan.priceYearlyValue : plan.priceMonthlyValue
                      );

                const periodSuffix =
                  plan.id === 'free' ? '' : billingCycle === 'yearly' ? ' / ano' : ' / mês';

                const monthlyEquivalent =
                  plan.id === 'free'
                    ? null
                    : billingCycle === 'yearly'
                    ? Math.round(plan.priceYearlyValue / 12)
                    : null;

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-lg bg-white'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Mais Escolhido
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{plan.tagline}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-2xl font-black font-mono text-slate-900">
                          {displayPrice}
                          <span className="text-xs font-normal text-slate-500">{periodSuffix}</span>
                        </div>
                        {monthlyEquivalent && (
                          <span className="text-[11px] text-emerald-700 font-medium block">
                            Equivalente a {formatPrice(monthlyEquivalent)}/mês
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {plan.id === 'free'
                            ? 'Acesso básico inicial'
                            : 'Renovação recorrente automática'}
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
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : isSelected && plan.id !== 'free'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
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
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Processamento da Assinatura SaaS</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Disponível com Stripe Recorrente Internacional, Pix Instantâneo (QR Code) e Multicaixa.
                    </p>
                  </div>

                  <div className="text-right">
                    {appliedDiscount > 0 && (
                      <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                        {formatPrice(basePriceUSD)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {paymentMethod === 'pix' ? `R$ ${priceBRL.toFixed(2)}` : formatPrice(finalPriceUSD)}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-medium">
                      {paymentMethod === 'pix'
                        ? `Equivalente a $${finalPriceUSD} USD (${billingCycle === 'yearly' ? 'Plano Anual' : 'Plano Mensal'})`
                        : billingCycle === 'yearly'
                        ? 'Cobrado anualmente (Poupe até 31%)'
                        : 'Cobrado a cada 30 dias'}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Tem um Cupom de Desconto?</span>
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Ex: LANCAMENTO50, PIX100 ou STRIPE100"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl uppercase focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCheckingCoupon || !couponCode.trim()}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                    >
                      {isCheckingCoupon ? 'A validar...' : 'Aplicar Cupom'}
                    </button>
                  </div>
                  {couponSuccess && (
                    <p className="text-[11px] font-semibold text-emerald-600">{couponSuccess}</p>
                  )}
                  {couponError && (
                    <p className="text-[11px] font-semibold text-rose-600">{couponError}</p>
                  )}
                </div>

                {/* Payment Methods Tabs */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Selecione o Canal de Pagamento:
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Stripe (Primary Card) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        paymentMethod === 'stripe'
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/30 shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span className="text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono">
                          Stripe
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">Cartão / Stripe</div>
                      <div className="text-[10px] text-slate-400">Recorrente Oficial</div>
                    </button>

                    {/* Pix Instantâneo (Brasil / QR Code) */}
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
                      <div className="font-bold text-xs text-slate-900">Pix Instantâneo</div>
                      <div className="text-[10px] text-teal-600 font-semibold">Chave & QR Code</div>
                    </button>

                    {/* Multicaixa Express (Angola) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('multicaixa')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'multicaixa'
                          ? 'border-slate-900 bg-white ring-2 ring-slate-900/30 shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <Building className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Multicaixa</div>
                      <div className="text-[10px] text-slate-400">Express / EMIS</div>
                    </button>

                    {/* Transferência IBAN */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-slate-900 bg-white ring-2 ring-slate-900/30 shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <Building className="w-4 h-4 text-slate-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">IBAN / SEPA</div>
                      <div className="text-[10px] text-slate-400">BAI / BFA / Europa</div>
                    </button>
                  </div>

                  {/* 1. STRIPE PAYMENT CONTAINER */}
                  {paymentMethod === 'stripe' && (
                    <div className="mt-3 p-4 sm:p-5 bg-white border border-indigo-100 rounded-2xl shadow-xs space-y-4">
                      {/* Flow Mode Switcher: Modal Form vs Hosted Checkout */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Processador Oficial Stripe (PCI-DSS Nível 1)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setStripeFlowMode('embedded')}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              stripeFlowMode === 'embedded'
                                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Formulário no Modal
                          </button>
                          <button
                            type="button"
                            onClick={() => setStripeFlowMode('checkout')}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              stripeFlowMode === 'checkout'
                                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Stripe Checkout Hosted
                          </button>
                        </div>
                      </div>

                      {stripeFlowMode === 'embedded' ? (
                        <div className="space-y-3.5">
                          {/* Test card button helper */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Dados do Cartão (Débito ou Crédito Recorrente)
                            </span>
                            <button
                              type="button"
                              onClick={fillTestCard}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300"
                            >
                              Preencher Cartão de Teste Stripe (4242...)
                            </button>
                          </div>

                          {/* Card Number */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span>Número do Cartão</span>
                              <span className="font-mono text-indigo-600 text-[10px]">
                                {getCardBrand(cardNumber)}
                              </span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="4242 4242 4242 4242"
                                maxLength={19}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                              />
                              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          {/* Expiry, CVC & Name Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">Validade</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/AA"
                                maxLength={5}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">CVC / CVV</label>
                              <input
                                type="password"
                                value={cardCvc}
                                onChange={handleCvcChange}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1 space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">
                                Nome no Cartão
                              </label>
                              <input
                                type="text"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                                placeholder="Nome Completo"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                              />
                            </div>
                          </div>

                          {cardError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{cardError}</span>
                            </div>
                          )}

                          {/* Recurrence and Security Disclaimer */}
                          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-950 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                              <RefreshCw className="w-3.5 h-3.5 text-indigo-700 animate-spin-slow" />
                              <span>
                                Renovação Recorrente Automática (
                                {billingCycle === 'yearly' ? 'Anual' : 'Mensal'})
                              </span>
                            </div>
                            <p className="text-indigo-800 leading-relaxed">
                              Sua assinatura será renovada automaticamente por{' '}
                              <strong>${finalPriceUSD} USD</strong> a cada{' '}
                              {billingCycle === 'yearly' ? '12 meses' : '30 dias'}. Você pode gerenciar os
                              dados de pagamento ou cancelar a qualquer momento no seu painel ou via Stripe.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                          <CreditCard className="w-8 h-8 text-indigo-600 mx-auto" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              Redirecionamento para Stripe Checkout
                            </h4>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                              Será redirecionado com segurança para a página oficial da Stripe para concluir a
                              sua assinatura recorrente com Apple Pay, Google Pay ou Cartão Internacional.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. PIX PAYMENT CONTAINER (WITH QR CODE & CHAVE PIX) */}
                  {paymentMethod === 'pix' && (
                    <div className="mt-3 p-4 sm:p-5 bg-white border border-teal-200 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
                            <QrCode className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                Pagamento Instantâneo Pix (Brasil)
                              </span>
                              <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono uppercase">
                                Ativação Imediata
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              Escaneie o QR Code ou utilize a chave Pix abaixo pelo seu banco ou carteira digital.
                            </span>
                          </div>
                        </div>

                        <div className="bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200 text-left sm:text-right self-start sm:self-auto">
                          <span className="text-[10px] text-teal-700 font-bold block uppercase tracking-wider">
                            Valor Total no Pix
                          </span>
                          <span className="text-sm font-black text-teal-950 font-mono">
                            R$ {priceBRL.toFixed(2)} BRL{' '}
                            <span className="text-[10px] text-slate-500 font-normal">
                              (${finalPriceUSD} USD)
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Main Pix Layout: QR Code + Chave Copia e Cola */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Column 1: Scannable QR Code */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                            <img
                              src={pixQrCodeImageUrl}
                              alt="QR Code Pix"
                              className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                              loading="eager"
                            />
                            {/* Pix Central Icon Stamp */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-9 h-9 bg-white/95 rounded-xl shadow-md border border-teal-300 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-teal-600 fill-teal-500" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 text-center">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                              Aponte a câmera do aplicativo do seu banco
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Nubank, Inter, Itaú, Bradesco, Santander, Mercado Pago, etc.
                            </span>
                          </div>
                        </div>

                        {/* Column 2: Instructions, Chave Pix & Copia e Cola */}
                        <div className="md:col-span-7 space-y-3.5">
                          {/* Instructions */}
                          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-[11.5px] text-slate-700 space-y-1">
                            <p className="font-bold text-teal-950 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-700" />
                              Como pagar com Pix em 3 passos:
                            </p>
                            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                              <li>Abra o aplicativo do seu banco ou carteira digital no celular.</li>
                              <li>
                                Escolha <strong>Pix &gt; Pagar com QR Code</strong> ou cole a chave abaixo.
                              </li>
                              <li>
                                Confirme o valor de <strong>R$ {priceBRL.toFixed(2)}</strong> e clique no botão
                                abaixo para liberar o acesso.
                              </li>
                            </ol>
                          </div>

                          {/* Chave Pix (EVP / Aleatória Oficial) */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                              <span>Chave Pix Aleatória:</span>
                              <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                                Chave Oficial
                              </span>
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 truncate select-all">
                                {OFFICIAL_PIX_KEY}
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

                          {/* Pix Copia e Cola (BR Code) */}
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
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                value={pixBRCode}
                                onClick={handleCopyPixPayload}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10.5px] font-mono text-slate-600 truncate cursor-pointer hover:bg-slate-100"
                              />
                            </div>
                          </div>

                          {/* Optional Sender Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-semibold text-slate-600">
                                Nome do Pagador Pix (Opcional):
                              </label>
                              <input
                                type="text"
                                value={pixSenderName}
                                onChange={(e) => setPixSenderName(e.target.value)}
                                placeholder="Ex: Carlos Silva"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[10.5px] font-semibold text-slate-600">
                                ID Transação / Comprovante (Opcional):
                              </label>
                              <input
                                type="text"
                                value={pixTxId}
                                onChange={(e) => setPixTxId(e.target.value)}
                                placeholder="Ex: E123456..."
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. MULTICAIXA EXPRESS HELPER */}
                  {paymentMethod === 'multicaixa' && (
                    <div className="mt-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span>Multicaixa Express (Angola)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Insira o seu número associado ao Multicaixa Express para receber o pedido de confirmação no seu telemóvel:
                      </p>
                      <input
                        type="tel"
                        value={multicaixaPhone}
                        onChange={(e) => setMulticaixaPhone(e.target.value)}
                        placeholder="Ex: 923 744 338"
                        className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold w-full max-w-xs text-slate-900"
                      />
                      <p className="text-[10px] text-emerald-700 font-mono">
                        Ou pague por Referência EMIS: Entidade 00054 | Ref: 984 213 092
                      </p>
                    </div>
                  )}

                  {/* 4. TRANSFER HELPER */}
                  {paymentMethod === 'transfer' && (
                    <div className="mt-2 p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-800 font-mono text-[11px]">
                      <p className="font-bold text-slate-950 font-sans text-xs">Coordenadas Bancárias Oficiais:</p>
                      <p>
                        Banco BAI Angola: <span className="font-bold">AO06 0040 0000 8923 1001 1012 3</span>
                      </p>
                      <p>
                        Banco BFA Angola: <span className="font-bold">AO06 0006 0000 4521 2002 1014 9</span>
                      </p>
                      <p>
                        IBAN Internacional (SEPA):{' '}
                        <span className="font-bold">PT50 0033 0000 4521 8976 1018 2</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Final Action Button & Guarantee */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Emissão imediata de fatura e ativação instantânea da conta.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessSubscription}
                    disabled={isProcessing}
                    className={`w-full sm:w-auto px-7 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 ${
                      paymentMethod === 'pix'
                        ? 'bg-teal-600 hover:bg-teal-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>A processar ativação...</span>
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'pix' ? (
                          <>
                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>Confirmar Pagamento Pix & Ativar Plano (R$ {priceBRL.toFixed(2)})</span>
                            <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                          </>
                        ) : paymentMethod === 'stripe' && stripeFlowMode === 'checkout' ? (
                          <>
                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>Ir para Stripe Checkout ({formatPrice(finalPriceUSD)})</span>
                            <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>
                              Subscrever via {paymentMethod === 'stripe' ? 'Stripe' : 'Pagamento Seguro'} (
                              {formatPrice(finalPriceUSD)} / {billingCycle === 'yearly' ? 'ano' : 'mês'})
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                          </>
                        )}
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
