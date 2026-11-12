import { SubscriptionPlan, UserRole } from './cv';

// -------------------------------------------------------------
// 1. Dashboard Financeiro e Métricas SaaS
// -------------------------------------------------------------
export interface FinancialMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Run Rate
  oneOffDownloadsRevenue: number; // Vendas avulsas / downloads avulsos
  averageTicket: number; // Ticket Médio
  churnRate: number; // Taxa de Cancelamento em %
  arpu: number; // Average Revenue Per User
  estimatedLtv: number; // Lifetime Value estimado
  cacRatio: number; // LTV / CAC ratio
  activeTrialConversion: number; // Taxa de conversão de teste/free para pago (%)
  grossMarginPercent: number; // Margem de contribuição bruta
  monthlyGrowthRate: number; // Taxa de crescimento MoM (%)
  cohortRetention: Array<{
    month: string;
    newUsers: number;
    retainedMonth1: number;
    retainedMonth2: number;
    retainedMonth3: number;
  }>;
  actionableInsights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'growth' | 'efficiency';
    title: string;
    description: string;
    impact: string;
    recommendedAction: string;
  }>;
  conversionFunnel: {
    accountsCreated: number;
    resumesStarted: number;
    checkoutReached: number;
    purchasesCompleted: number;
  };
  apiCostTracking: {
    todayCostUsd: number;
    monthCostUsd: number;
    totalRevenueUsd: number;
    costToRevenuePercent: number;
    highUsageAlerts: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      callsCount: number;
      costUsd: number;
      flaggedReason: string;
    }>;
  };
}

// -------------------------------------------------------------
// 2. Gestão de Inteligência Artificial e Prompts
// -------------------------------------------------------------
export type AiTaskKey =
  | 'coverLetter'
  | 'resumeSummary'
  | 'experienceOptimizer'
  | 'atsScanner'
  | 'interviewSim'
  | 'translateDoc';

export interface PromptTemplateConfig {
  id: AiTaskKey;
  name: string;
  category: 'Candidatura' | 'Otimização' | 'Tradução' | 'Simulador';
  description: string;
  systemInstruction: string;
  userPromptTemplate: string;
  variables: string[];
  temperature: number;
  preferredModel: string;
  fallbackModel: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AiModelRoutingConfig {
  primaryModel: string;
  fallbackModel: string;
  costSavingModel: string; // ex: for spell check and simple tasks
  advancedReasoningModel: string; // ex: for ATS match and career advice
  maxRetries: number;
  timeoutMs: number;
  healthStatus: Record<string, { status: 'healthy' | 'degraded' | 'down'; latencyMs: number }>;
}

export interface PlanCreditQuota {
  planId: SubscriptionPlan;
  planName: string;
  monthlyCredits: number;
  unlimited: boolean;
  maxResumes: number;
  allowAiTailor: boolean;
  allowInterviewSim: boolean;
  allowCoverLetter: boolean;
  allowAtsRadar: boolean;
}

// -------------------------------------------------------------
// 3. Gestão de Templates e Conteúdo
// -------------------------------------------------------------
export interface TemplateAdminItem {
  id: string;
  name: string;
  shortName: string;
  category: 'with_photo' | 'without_photo' | 'hybrid';
  hasPhoto: boolean;
  tierRequired: 'free' | 'pro' | 'executive';
  isActive: boolean;
  displayOrder: number;
  atsScore: number;
  badge: string;
}

export interface ProfessionSnippetExample {
  id: string;
  profession: string;
  area: 'Tecnologia' | 'Gestão & Executivo' | 'Finanças' | 'Operações' | 'Comercial' | 'Saúde' | 'Engenharia';
  sampleTitle: string;
  sampleSummary: string;
  sampleBullets: string[];
  sampleSkills: string[];
}

export interface SystemLocaleTranslation {
  languageCode: 'pt' | 'en' | 'es' | 'fr' | 'de';
  languageName: string;
  flag: string;
  sectionSummary: string;
  sectionExperiences: string;
  sectionEducations: string;
  sectionCompetencies: string;
  sectionLanguages: string;
  sectionTrainings: string;
  sectionReferences: string;
  lastUpdated: string;
}

// -------------------------------------------------------------
// 4. Gestão de Utilizadores e Suporte
// -------------------------------------------------------------
export interface ImpersonationAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  action: 'started' | 'ended' | 'viewed_resume' | 'modified_resume';
  details: string;
  timestamp: string;
}

// -------------------------------------------------------------
// 5. Monetização, Planos e Marketing
// -------------------------------------------------------------
export interface SystemAnnouncementBanner {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'promo' | 'maintenance';
  active: boolean;
  targetAudience: 'all' | 'free_only' | 'paid_only';
  actionUrl?: string;
  actionLabel?: string;
  startsAt: string;
  expiresAt: string;
  dismissible: boolean;
}

// -------------------------------------------------------------
// 6. Monitorização Técnica e Segurança
// -------------------------------------------------------------
export interface TechnicalGenerationErrorLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  operationType: 'pdf_export' | 'docx_export' | 'gemini_ai_call' | 'translation_api' | 'stripe_webhook';
  errorMessage: string;
  errorStack?: string;
  modelUsed?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface GdprDataRequest {
  id: string;
  userId: string;
  userEmail: string;
  requestType: 'export_data' | 'delete_account' | 'anonymize';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AdminRolePermission {
  role: 'super_admin' | 'support_agent' | 'content_manager';
  title: string;
  description: string;
  canViewFinances: boolean;
  canEditPrompts: boolean;
  canManageTemplates: boolean;
  canImpersonateUsers: boolean;
  canRefundOrders: boolean;
  canManagePrices: boolean;
  canViewErrorLogs: boolean;
  canProcessGdpr: boolean;
}

export const DEFAULT_RBAC_PERMISSIONS: AdminRolePermission[] = [
  {
    role: 'super_admin',
    title: 'Super Administrador (CEO / CTO)',
    description: 'Acesso total irrestrito a todos os módulos financeiros, IA, prompts, utilizadores, códigos e infraestrutura.',
    canViewFinances: true,
    canEditPrompts: true,
    canManageTemplates: true,
    canImpersonateUsers: true,
    canRefundOrders: true,
    canManagePrices: true,
    canViewErrorLogs: true,
    canProcessGdpr: true
  },
  {
    role: 'support_agent',
    title: 'Agente de Suporte e CX',
    description: 'Gestão de tickets, créditos cortesia, reembolsos autorizados, auditoria e personificação de conta para suporte técnico.',
    canViewFinances: false,
    canEditPrompts: false,
    canManageTemplates: false,
    canImpersonateUsers: true,
    canRefundOrders: true,
    canManagePrices: false,
    canViewErrorLogs: true,
    canProcessGdpr: true
  },
  {
    role: 'content_manager',
    title: 'Gestor de Conteúdo & Modelos',
    description: 'Edição de prompts sem código, catálogo de modelos de CV, biblioteca de frases e textos dos 5 idiomas.',
    canViewFinances: false,
    canEditPrompts: true,
    canManageTemplates: true,
    canImpersonateUsers: false,
    canRefundOrders: false,
    canManagePrices: false,
    canViewErrorLogs: false,
    canProcessGdpr: false
  }
];
