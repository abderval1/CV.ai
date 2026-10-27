export interface PersonalDetails {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  website?: string;
  photoUrl?: string;
  showPhoto?: boolean;
}

export type TemplateStyle =
  | 'un_classic'
  | 'executive_harvard'
  | 'ats_compact'
  | 'european_modern'
  | 'european_europass'
  | 'creative_split'
  | 'tech_modern'
  | 'academic_lattes'
  | 'hybrid_minimalist';

export interface Competency {
  id: string;
  category: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  donor?: string;
  highlights: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  period: string;
  gpaOrHonors?: string;
}

export interface Reference {
  id: string;
  name: string;
  institutionAndPosition: string;
  contact: string;
}

export interface CVData {
  personalDetails: PersonalDetails;
  summary: string;
  competencies: Competency[];
  experiences: Experience[];
  educations: Education[];
  trainings: string[];
  languages: {
    language: string;
    level: string;
  }[];
  references: Reference[];
  templateStyle: TemplateStyle;
  accentColor?: string;
  fontFamily?: 'garamond' | 'jakarta' | 'mono' | 'cinzel';
}

export interface AtsAuditResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  quantifiableMetricsCount: number;
  strongActionVerbs: string[];
  weakPhrasesFound: string[];
  recommendations: string[];
}

export interface CoverLetterData {
  recipientName: string;
  organizationName: string;
  jobTitle: string;
  locationDate: string;
  letterBody: string;
  keySellingPoints: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  context: string;
  keyCriteria: string[];
  suggestedStructure: string;
}

export interface InterviewAnswerEvaluation {
  questionId: string;
  score: number;
  verdict: 'Excelente' | 'Bom' | 'Precisa Melhorar' | 'Incompleto';
  strengths: string[];
  improvements: string[];
  recommendedAnswer: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'executive';
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentMethod = 'multicaixa' | 'card' | 'transfer' | 'pix' | 'stripe' | 'manual';
export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  status?: UserStatus;
  plan: SubscriptionPlan;
  avatarUrl?: string;
  phone?: string;
  targetRole?: string;
  company?: string;
  creditsRemaining: number;
  creditsUsed?: number;
  totalCvGenerated?: number;
  billingCycle?: BillingCycle;
  subscriptionExpiresAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripeCurrentPeriodEnd?: string;
  createdAt: string;
  notes?: string;
}

export interface SavedResume {
  id: string;
  userId?: string;
  title: string;
  targetJob: string;
  updatedAt: string;
  createdAt?: string;
  data: CVData;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  priceMonthly: string;
  priceYearly: string;
  priceMonthlyValue: number;
  priceYearlyValue: number;
  currency: string;
  creditsMonthly: number;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

export interface SaaSOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  createdAt: string;
  notes?: string;
}

export interface SaaSCoupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface SaaSStats {
  mrr: number;
  arr: number;
  totalRevenue: number;
  totalUsers: number;
  proUsers: number;
  executiveUsers: number;
  freeUsers: number;
  totalOrders: number;
  totalResumesGenerated: number;
  conversionRate: number;
}

