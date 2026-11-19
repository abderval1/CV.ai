import { BillingCycle, SubscriptionPlan } from '../types/cv';
import { SiteLanguageCode } from '../i18n/siteTranslations';
import { BILLING_UI_TRANSLATIONS } from '../i18n/billingUiTranslations';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp';

export interface BillingCycleMeta {
  id: BillingCycle;
  label: string;
  shortUnit: string;
  months: number;
  durationDays: number;
  defaultDiscountPercent: number;
  badgeText?: string;
}

export const BILLING_CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'semiannual', 'yearly'];

export const BILLING_CYCLE_META: Record<BillingCycle, BillingCycleMeta> = {
  monthly: {
    id: 'monthly',
    label: 'Mensal',
    shortUnit: 'mês',
    months: 1,
    durationDays: 30,
    defaultDiscountPercent: 0
  },
  quarterly: {
    id: 'quarterly',
    label: 'Trimestral',
    shortUnit: 'trimestre',
    months: 3,
    durationDays: 90,
    defaultDiscountPercent: 10,
    badgeText: '-10%'
  },
  semiannual: {
    id: 'semiannual',
    label: 'Semestral',
    shortUnit: 'semestre',
    months: 6,
    durationDays: 180,
    defaultDiscountPercent: 18,
    badgeText: '-18%'
  },
  yearly: {
    id: 'yearly',
    label: 'Anual',
    shortUnit: 'ano',
    months: 12,
    durationDays: 365,
    defaultDiscountPercent: 25,
    badgeText: '-25%'
  }
};

export function normalizeBillingCycle(value?: string | null): BillingCycle {
  if (value === 'quarterly' || value === 'semiannual' || value === 'yearly' || value === 'monthly') {
    return value;
  }
  return 'monthly';
}

export function getCycleDurationDays(cycle?: BillingCycle | string | null): number {
  return BILLING_CYCLE_META[normalizeBillingCycle(cycle)].durationDays;
}

export function formatCycleLabel(
  cycle?: BillingCycle | string | null,
  lang: SiteLanguageCode = 'pt'
): string {
  const normalized = normalizeBillingCycle(cycle);
  const dict = BILLING_UI_TRANSLATIONS[lang] || BILLING_UI_TRANSLATIONS.pt;
  return dict.cycles[normalized]?.label || BILLING_CYCLE_META[normalized].label;
}

export function formatCycleWithDiscount(
  cycle?: BillingCycle | string | null,
  lang: SiteLanguageCode = 'pt'
): string {
  const normalized = normalizeBillingCycle(cycle);
  const dict = BILLING_UI_TRANSLATIONS[lang] || BILLING_UI_TRANSLATIONS.pt;
  const localized = dict.cycles[normalized];
  const meta = BILLING_CYCLE_META[normalized];
  const label = localized?.label || meta.label;
  const badgeText = localized?.badgeText ?? meta.badgeText;
  return badgeText ? `${label} (${badgeText})` : label;
}

export function getDefaultCyclePriceUSD(monthlyUSD: number, cycle: BillingCycle): number {
  const safeMonthly = Number.isFinite(monthlyUSD) && monthlyUSD > 0 ? monthlyUSD : 8;
  const meta = BILLING_CYCLE_META[cycle];
  if (cycle === 'monthly') return Math.round(safeMonthly * 100) / 100;
  return Math.round(safeMonthly * meta.months * (1 - meta.defaultDiscountPercent / 100) * 100) / 100;
}

export interface PlanPricingSource {
  id?: SubscriptionPlan | string;
  priceMonthlyValue?: number;
  priceQuarterlyValue?: number;
  priceSemiannualValue?: number;
  priceYearlyValue?: number;
}

export function getCyclePriceUSD(plan: PlanPricingSource | undefined, cycle: BillingCycle): number {
  const defaultMonthly = plan?.id === 'executive' ? 12 : 8;
  const monthly = Number(plan?.priceMonthlyValue) > 0 ? Number(plan?.priceMonthlyValue) : defaultMonthly;

  if (cycle === 'monthly') return monthly;
  if (cycle === 'quarterly') {
    return Number(plan?.priceQuarterlyValue) > 0
      ? Number(plan?.priceQuarterlyValue)
      : getDefaultCyclePriceUSD(monthly, 'quarterly');
  }
  if (cycle === 'semiannual') {
    return Number(plan?.priceSemiannualValue) > 0
      ? Number(plan?.priceSemiannualValue)
      : getDefaultCyclePriceUSD(monthly, 'semiannual');
  }
  return Number(plan?.priceYearlyValue) > 0
    ? Number(plan?.priceYearlyValue)
    : getDefaultCyclePriceUSD(monthly, 'yearly');
}

export function getMonthlyEquivalentUSD(plan: PlanPricingSource | undefined, cycle: BillingCycle): number | null {
  if (cycle === 'monthly') return null;
  const total = getCyclePriceUSD(plan, cycle);
  const months = BILLING_CYCLE_META[cycle].months;
  return Math.round((total / months) * 100) / 100;
}

export function detectPixKeyType(key: string): PixKeyType {
  const trimmed = String(key || '').trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return 'evp';
  if (trimmed.includes('@')) return 'email';
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+') || (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55'))) {
    return 'phone';
  }
  if (digits.length === 14) return 'cnpj';
  if (digits.length === 11) return 'cpf';
  return 'evp';
}

export function getPixKeyTypeLabel(
  type?: PixKeyType | string,
  lang: SiteLanguageCode = 'pt'
): string {
  const dict = BILLING_UI_TRANSLATIONS[lang] || BILLING_UI_TRANSLATIONS.pt;
  const labels = dict.pixKeyTypes;
  switch (type) {
    case 'cpf':
      return labels.cpf;
    case 'cnpj':
      return labels.cnpj;
    case 'email':
      return labels.email;
    case 'phone':
      return labels.phone;
    case 'evp':
      return labels.evp;
    default:
      return labels.default;
  }
}

export function normalizePixKeyForEmv(rawKey: string, explicitType?: PixKeyType): string {
  const trimmed = String(rawKey || '').trim();
  if (!trimmed) return '';
  const type = explicitType || detectPixKeyType(trimmed);

  if (type === 'cpf' || type === 'cnpj') {
    return trimmed.replace(/\D/g, '');
  }
  if (type === 'phone') {
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return trimmed;
    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }
  if (type === 'email' || type === 'evp') {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

function sanitizeEmvText(value: string, maxLen: number, fallback: string): string {
  const clean = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
  return clean || fallback;
}

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

export function generatePixBRCode(
  key: string,
  amountBRL: number,
  merchantName = 'CURRICULO ESTRATEGICO',
  merchantCity = 'SAO PAULO',
  keyType?: PixKeyType,
  txId = 'CVPRO'
): string {
  const normalizedKey = normalizePixKeyForEmv(key, keyType);
  if (!normalizedKey) return '';

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKeyField = formatField('01', normalizedKey);
  const merchantAccount = formatField('26', `${gui}${pixKeyField}`);

  const mcc = formatField('52', '0000');
  const currencyCode = formatField('53', '986');
  const amtFormatted = amountBRL > 0 ? formatField('54', amountBRL.toFixed(2)) : '';
  const country = formatField('58', 'BR');
  const name = formatField('59', sanitizeEmvText(merchantName, 25, 'CURRICULO ESTRATEGICO'));
  const city = formatField('60', sanitizeEmvText(merchantCity, 15, 'SAO PAULO'));
  const cleanTxId = sanitizeEmvText(txId, 25, 'CVPRO').replace(/[^A-Z0-9]/g, '') || 'CVPRO';
  const addData = formatField('62', formatField('05', cleanTxId.slice(0, 25)));

  const payloadWithoutCRC = `000201${merchantAccount}${mcc}${currencyCode}${amtFormatted}${country}${name}${city}${addData}6304`;
  const checksum = calculatePixCRC16(payloadWithoutCRC);
  return `${payloadWithoutCRC}${checksum}`;
}
