import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAllUsers,
  fetchAllOrders,
  fetchAllCoupons,
  updateUserManagement,
  createManualCustomer,
  createSaaSOrder,
  updateOrderStatus,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
  anonymizeUserRecord,
  deleteUserAccountRecord,
  isUserAdmin,
  ADMIN_EMAILS
} from '../services/saasDbService';
import {
  DEFAULT_PROMPT_CONFIGS,
  fetchPromptsConfig,
  savePromptConfig,
  fetchAiRoutingConfig,
  saveAiRoutingConfig,
  fetchPlanQuotas,
  savePlanQuota,
  fetchAdminTemplates,
  saveAdminTemplate,
  fetchProfessionSnippets,
  saveProfessionSnippet,
  deleteProfessionSnippet,
  fetchSystemLocales,
  saveSystemLocale,
  fetchSystemBanners,
  saveSystemBanner,
  deleteSystemBanner,
  fetchErrorLogs,
  resolveErrorLog,
  fetchGdprRequests,
  updateGdprRequestStatus,
  fetchImpersonationLogsAsync,
  fetchEditablePlans,
  saveEditablePlan,
  fetchPlatformSettings,
  savePlatformSettings,
  getFrontendTelemetry,
  emitAdminConfigUpdated
} from '../services/adminModulesService';
import {
  User,
  SaaSOrder,
  SaaSCoupon,
  SubscriptionPlan,
  BillingCycle,
  OrderStatus,
  PaymentMethod,
  UserRole,
  UserStatus
} from '../types/cv';
import {
  BILLING_CYCLES,
  BILLING_CYCLE_META,
  formatCycleLabel,
  getDefaultCyclePriceUSD,
  getCyclePriceUSD,
  PixKeyType
} from '../utils/billingCycles';
import {
  PromptTemplateConfig,
  AiModelRoutingConfig,
  PlanCreditQuota,
  TemplateAdminItem,
  ProfessionSnippetExample,
  SystemLocaleTranslation,
  SystemAnnouncementBanner,
  TechnicalGenerationErrorLog,
  GdprDataRequest,
  DEFAULT_RBAC_PERMISSIONS,
  EditablePlanConfig,
  PlatformSettingsConfig,
  FrontendTelemetryData,
  FinancialMetrics
} from '../types/adminModules';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Users,
  Tag,
  ShieldCheck,
  Plus,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Shield,
  Check,
  Bot,
  Cpu,
  BookOpen,
  Lock,
  Eye,
  AlertTriangle,
  RotateCcw,
  Zap,
  Save,
  Menu,
  ArrowUp,
  ArrowDown,
  Receipt,
  Wrench,
  Activity,
  Lightbulb,
  ArrowRight,
  Ban,
  FileJson,
  Sparkles,
  UserCog,
  Globe,
  QrCode
} from 'lucide-react';

interface SaaSAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AdminActiveModule =
  | 'financial'
  | 'ai_prompts'
  | 'templates_content'
  | 'users_support'
  | 'pricing_marketing'
  | 'security_monitoring';

type PeriodFilter = '7d' | '30d' | '90d' | 'all';

const MODULE_META: Record<
  AdminActiveModule,
  { label: string; shortLabel: string; subtitle: string }
> = {
  financial: {
    label: '1. Financeiro, Métricas & Insights',
    shortLabel: 'Financeiro & Insights',
    subtitle: 'Receita SaaS, unit economics, telemetria em tempo real, coortes e recomendações estratégicas'
  },
  ai_prompts: {
    label: '2. IA, Prompts & Quotas',
    shortLabel: 'IA, Prompts & Quotas',
    subtitle: 'Editor de prompts conectado à API Gemini, roteamento de modelos e limites por plano'
  },
  templates_content: {
    label: '3. Templates, Exemplos & Idiomas',
    shortLabel: 'Templates & Conteúdo',
    subtitle: 'Ordem e níveis do catálogo, biblioteca de profissões e títulos em 5 idiomas'
  },
  users_support: {
    label: '4. Utilizadores, CRM 360° & Faturas',
    shortLabel: 'CRM & Faturas',
    subtitle: 'Perfis de clientes, notas CRM, ações manuais, reembolsos e modo Personificar'
  },
  pricing_marketing: {
    label: '5. Monetização, Planos & Campanhas',
    shortLabel: 'Planos & Marketing',
    subtitle: 'Edição ao vivo de preços ($8/$12), cupons promocionais e avisos transversais'
  },
  security_monitoring: {
    label: '6. Segurança, RGPD & Governança',
    shortLabel: 'Segurança & Governança',
    subtitle: 'Modo manutenção, controlo global da plataforma, logs técnicos, RGPD e auditoria RBAC'
  }
};

export const SaaSAdminDashboard: React.FC<SaaSAdminDashboardProps> = ({ isOpen, onClose }) => {
  const { user, firebaseUser, impersonateUser, isImpersonating } = useAuth();
  const [activeModule, setActiveModule] = useState<AdminActiveModule>('financial');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');

  // Sub-tabs
  const [aiSubTab, setAiSubTab] = useState<'prompts' | 'models' | 'quotas'>('prompts');
  const [contentSubTab, setContentSubTab] = useState<'templates' | 'snippets' | 'locales'>('templates');
  const [crmSubTab, setCrmSubTab] = useState<'users' | 'orders'>('users');
  const [monetizationSubTab, setMonetizationSubTab] = useState<'plans' | 'coupons' | 'banners'>('plans');
  const [securitySubTab, setSecuritySubTab] = useState<'governance' | 'error_logs' | 'gdpr' | 'rbac'>(
    'governance'
  );

  // Core Data
  const [usersList, setUsersList] = useState<User[]>([]);
  const [ordersList, setOrdersList] = useState<SaaSOrder[]>([]);
  const [couponsList, setCouponsList] = useState<SaaSCoupon[]>([]);
  const [promptsList, setPromptsList] = useState<PromptTemplateConfig[]>([]);
  const [aiRouting, setAiRouting] = useState<AiModelRoutingConfig | null>(null);
  const [planQuotas, setPlanQuotas] = useState<PlanCreditQuota[]>([]);
  const [templatesList, setTemplatesList] = useState<TemplateAdminItem[]>([]);
  const [snippetsList, setSnippetsList] = useState<ProfessionSnippetExample[]>([]);
  const [localesList, setLocalesList] = useState<SystemLocaleTranslation[]>([]);
  const [bannersList, setBannersList] = useState<SystemAnnouncementBanner[]>([]);
  const [errorLogsList, setErrorLogsList] = useState<TechnicalGenerationErrorLog[]>([]);
  const [gdprList, setGdprList] = useState<GdprDataRequest[]>([]);
  const [impersonationLogs, setImpersonationLogs] = useState<any[]>([]);
  const [editablePlans, setEditablePlans] = useState<EditablePlanConfig[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsConfig | null>(null);
  const [telemetry, setTelemetry] = useState<FrontendTelemetryData>(() => getFrontendTelemetry());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filters & Selection
  const [userSearch, setUserSearch] = useState<string>('');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [snippetSearch, setSnippetSearch] = useState<string>('');
  const [errorFilterMode, setErrorFilterMode] = useState<'all' | 'unresolved'>('all');

  // Prompt Studio State
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplateConfig | null>(null);
  const [testPromptInput, setTestPromptInput] = useState<string>('');
  const [testPromptResult, setTestPromptResult] = useState<{
    output: string;
    modelUsed?: string;
    latencyMs?: number;
    estimatedTokens?: number;
  } | null>(null);
  const [isTestingPrompt, setIsTestingPrompt] = useState<boolean>(false);

  // CRM 360° Slide-Over Drawer State
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<string>('');
  const [drawerPlan, setDrawerPlan] = useState<SubscriptionPlan>('free');
  const [drawerRole, setDrawerRole] = useState<UserRole>('user');
  const [drawerStatus, setDrawerStatus] = useState<UserStatus>('active');
  const [isSavingDrawer, setIsSavingDrawer] = useState<boolean>(false);

  // Inner Modals
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [showNewCouponModal, setShowNewCouponModal] = useState<boolean>(false);
  const [showNewBannerModal, setShowNewBannerModal] = useState<boolean>(false);
  const [showNewSnippetModal, setShowNewSnippetModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSOrder | null>(null);
  const [impersonatingTargetUser, setImpersonatingTargetUser] = useState<User | null>(null);
  const [impersonateReason, setImpersonateReason] = useState<string>('Diagnóstico de layout reportado pelo cliente');

  // Form States
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    plan: 'pro' as SubscriptionPlan,
    phone: '',
    role: 'user' as UserRole,
    credits: 9999,
    notes: ''
  });

  const [newOrderForm, setNewOrderForm] = useState({
    userName: '',
    userEmail: '',
    plan: 'pro' as SubscriptionPlan,
    billingCycle: 'monthly' as BillingCycle,
    amount: 8,
    currency: 'USD',
    paymentMethod: 'card' as PaymentMethod,
    status: 'paid' as OrderStatus,
    notes: 'Subscrição ativada manualmente'
  });

  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 20,
    maxUses: 100,
    expiresDays: 60
  });

  const [newBannerForm, setNewBannerForm] = useState({
    title: '',
    message: '',
    type: 'info' as SystemAnnouncementBanner['type'],
    targetAudience: 'all' as SystemAnnouncementBanner['targetAudience'],
    actionUrl: '#pricing',
    actionLabel: 'Ver Oferta',
    daysActive: 14
  });

  const [newSnippetForm, setNewSnippetForm] = useState({
    profession: '',
    area: 'Tecnologia' as ProfessionSnippetExample['area'],
    sampleTitle: '',
    sampleSummary: '',
    sampleBullets: '',
    sampleSkills: ''
  });

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Load All System Modules
  const loadAllModules = async () => {
    setIsRefreshing(true);
    try {
      const [
        users,
        orders,
        coupons,
        prompts,
        routing,
        quotas,
        templates,
        snippets,
        locales,
        banners,
        errors,
        gdpr,
        plans,
        settings,
        impLogs
      ] = await Promise.all([
        fetchAllUsers(),
        fetchAllOrders(),
        fetchAllCoupons(),
        fetchPromptsConfig(),
        fetchAiRoutingConfig(),
        fetchPlanQuotas(),
        fetchAdminTemplates(),
        fetchProfessionSnippets(),
        fetchSystemLocales(),
        fetchSystemBanners(),
        fetchErrorLogs(),
        fetchGdprRequests(),
        fetchEditablePlans(),
        fetchPlatformSettings(),
        fetchImpersonationLogsAsync()
      ]);

      setUsersList(users);
      setOrdersList(orders);
      setCouponsList(coupons);

      setPromptsList(prompts);
      if (prompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(prompts[0]);
      }
      setAiRouting(routing);
      setPlanQuotas(quotas);
      setTemplatesList(templates);
      setSnippetsList(snippets);
      setLocalesList(locales);
      setBannersList(banners);
      setErrorLogsList(errors);
      setGdprList(gdpr);
      setEditablePlans(plans);
      setPlatformSettings(settings);
      setImpersonationLogs(impLogs);
      setTelemetry(getFrontendTelemetry());
    } catch (err) {
      console.error('Falha ao sincronizar módulos administrativos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllModules();
    }
  }, [isOpen]);

  // Open User 360° Drawer
  const openUserDrawer = (target: User) => {
    setInspectedUser(target);
    setDrawerNotes(target.notes || '');
    setDrawerPlan(target.plan || 'free');
    setDrawerRole(target.role || 'user');
    setDrawerStatus(target.status || 'active');
  };

  const handleSaveUserDrawer = async () => {
    if (!inspectedUser) return;
    setIsSavingDrawer(true);
    try {
      const updates: Partial<User> = {
        notes: drawerNotes,
        plan: drawerPlan,
        role: drawerRole,
        status: drawerStatus
      };
      await updateUserManagement(inspectedUser.id, updates);
      setUsersList((prev) => prev.map((u) => (u.id === inspectedUser.id ? { ...u, ...updates } : u)));
      setInspectedUser((prev) => (prev ? { ...prev, ...updates } : null));
      showNotification(`Perfil de ${inspectedUser.name} atualizado na base de dados!`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao salvar alterações do utilizador.');
    } finally {
      setIsSavingDrawer(false);
    }
  };

  // -------------------------------------------------------------
  // 1. FINANCIAL & STRATEGIC METRICS COMPUTATIONS
  // -------------------------------------------------------------
  const financialMetrics: FinancialMetrics & {
    totalUsers: number;
    proUsers: number;
    executiveUsers: number;
    freeUsers: number;
    paidUsers: number;
    totalRevenue: number;
    periodOrdersCount: number;
  } = useMemo(() => {
    const nowMs = Date.now();
    const cutoffMs =
      periodFilter === '7d'
        ? nowMs - 7 * 86400000
        : periodFilter === '30d'
        ? nowMs - 30 * 86400000
        : periodFilter === '90d'
        ? nowMs - 90 * 86400000
        : 0;

    const proPrice = editablePlans.find((p) => p.id === 'pro')?.priceMonthlyValue ?? 8;
    const execPrice = editablePlans.find((p) => p.id === 'executive')?.priceMonthlyValue ?? 12;

    const totalUsers = usersList.length;
    const proUsers = usersList.filter((u) => u.plan === 'pro' && u.status !== 'suspended').length;
    const executiveUsers = usersList.filter((u) => u.plan === 'executive' && u.status !== 'suspended').length;
    const freeUsers = usersList.filter((u) => u.plan === 'free').length;
    const paidUsers = proUsers + executiveUsers;

    const periodPaidOrders = ordersList.filter(
      (o) => o.status === 'paid' && (!cutoffMs || new Date(o.createdAt).getTime() >= cutoffMs)
    );
    const totalRevenue = periodPaidOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    const mrr = proUsers * proPrice + executiveUsers * execPrice;
    const arr = mrr * 12;

    const oneOffDownloadsRevenue = periodPaidOrders
      .filter((o) => o.amount > 0 && o.billingCycle === 'monthly')
      .reduce((acc, o) => acc + o.amount, 0);

    const averageTicket =
      periodPaidOrders.length > 0 ? totalRevenue / periodPaidOrders.length : 0;

    const churnedUsers = usersList.filter(
      (u) => u.status === 'suspended' || u.stripeStatus === 'canceled'
    ).length;
    const churnRate =
      paidUsers + churnedUsers > 0
        ? Number(((churnedUsers / (paidUsers + churnedUsers)) * 100).toFixed(1))
        : 0;

    const arpu = totalUsers > 0 ? Number((mrr / totalUsers).toFixed(2)) : 0;
    const effectiveChurnDec = Math.max(0.05, churnRate / 100);
    const avgPaidArpu = paidUsers > 0 ? mrr / paidUsers : 0;
    const estimatedLtv =
      paidUsers > 0 ? Number((avgPaidArpu / effectiveChurnDec).toFixed(2)) : 0;
    const cacRatio = 0;
    const activeTrialConversion =
      totalUsers > 0 ? Number(((paidUsers / totalUsers) * 100).toFixed(1)) : 0;

    const accountsCreated = totalUsers;
    const totalGeneratedFromUsers = usersList.reduce(
      (acc, u) => acc + (u.totalCvGenerated || 0),
      0
    );
    const resumesStarted = Math.max(telemetry.resumesStartedCount, totalGeneratedFromUsers);
    const checkoutReached = telemetry.checkoutOpenedCount;
    const purchasesCompleted = Math.max(paidUsers, periodPaidOrders.length);

    const totalAiCalls =
      usersList.reduce((acc, u) => acc + (u.creditsUsed || 0), 0) + telemetry.aiCallsCount;
    const todayCostUsd =
      totalAiCalls > 0 ? Number(((totalAiCalls * 0.00028) / 14).toFixed(2)) : 0;
    const monthCostUsd =
      totalAiCalls > 0 ? Number((totalAiCalls * 0.00032).toFixed(2)) : 0;
    const revBase = Math.max(totalRevenue, mrr);
    const costToRevenuePercent =
      revBase > 0 ? Number(((monthCostUsd / revBase) * 100).toFixed(1)) : 0;
    const grossMarginPercent =
      revBase > 0 ? Number(Math.max(0, 100 - costToRevenuePercent - 3.9).toFixed(1)) : 0;

    const highUsageAlerts = usersList
      .filter((u) => (u.creditsUsed || 0) > 25)
      .map((u) => {
        const calls = u.creditsUsed || 0;
        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          callsCount: calls,
          costUsd: Number((calls * 0.00035).toFixed(3)),
          flaggedReason:
            calls > 60 ? 'Consumo intenso de tokens IA' : 'Uso avançado contínuo'
        };
      });

    // Real Cohort Retention derived strictly from registered users' createdAt months
    const monthShortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const cohortBuckets = new Map<string, { label: string; sortKey: number; users: User[] }>();
    usersList.forEach((u) => {
      const dt = new Date(u.createdAt || '');
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthShortNames[dt.getMonth()]} ${dt.getFullYear()}`;
      const existing = cohortBuckets.get(key);
      if (existing) {
        existing.users.push(u);
      } else {
        cohortBuckets.set(key, { label, sortKey: dt.getFullYear() * 12 + dt.getMonth(), users: [u] });
      }
    });

    const nowDate = new Date();
    const currentMonthIdx = nowDate.getFullYear() * 12 + nowDate.getMonth();
    const cohortRetention = Array.from(cohortBuckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6)
      .map((bucket) => {
        const monthsElapsed = Math.max(0, currentMonthIdx - bucket.sortKey);
        const totalInCohort = bucket.users.length;
        const activeCount = bucket.users.filter(
          (u) => u.status !== 'suspended' && u.stripeStatus !== 'canceled'
        ).length;
        const retainedPct = totalInCohort > 0 ? Math.round((activeCount / totalInCohort) * 100) : 0;
        return {
          month: bucket.label,
          newUsers: totalInCohort,
          retainedMonth1: retainedPct,
          retainedMonth2: monthsElapsed >= 1 ? retainedPct : 0,
          retainedMonth3: monthsElapsed >= 2 ? retainedPct : 0
        };
      });

    // Real MoM Growth Rate from paid orders in current vs previous calendar month
    const curYr = nowDate.getFullYear();
    const curMo = nowDate.getMonth();
    const prevMoYr = curMo === 0 ? curYr - 1 : curYr;
    const prevMoIdx = curMo === 0 ? 11 : curMo - 1;
    let curMonthRev = 0;
    let prevMonthRev = 0;
    ordersList.forEach((o) => {
      if (o.status !== 'paid') return;
      const dt = new Date(o.createdAt || '');
      if (Number.isNaN(dt.getTime())) return;
      if (dt.getFullYear() === curYr && dt.getMonth() === curMo) {
        curMonthRev += Number(o.amount) || 0;
      } else if (dt.getFullYear() === prevMoYr && dt.getMonth() === prevMoIdx) {
        prevMonthRev += Number(o.amount) || 0;
      }
    });
    const monthlyGrowthRate =
      prevMonthRev > 0
        ? Number((((curMonthRev - prevMonthRev) / prevMonthRev) * 100).toFixed(1))
        : 0;

    // Dynamic Actionable Strategic Insights Engine
    const actionableInsights: FinancialMetrics['actionableInsights'] = [];

    const unresolvedErrors = errorLogsList.filter((e) => !e.resolved).length;
    if (unresolvedErrors > 0) {
      actionableInsights.push({
        id: 'ins-errors',
        type: 'risk',
        title: `${unresolvedErrors} Erro(s) Técnico(s) por Resolver`,
        description:
          'Existem falhas recentes registadas em exportações ou chamadas de IA que podem impactar a conversão de utilizadores.',
        impact: 'Risco direto de churn e frustração no checkout',
        recommendedAction: 'Resolver nos Logs Técnicos'
      });
    }

    const pendingGdpr = gdprList.filter((g) => g.status === 'pending').length;
    if (pendingGdpr > 0) {
      actionableInsights.push({
        id: 'ins-gdpr',
        type: 'risk',
        title: `${pendingGdpr} Pedido(s) RGPD Pendente(s)`,
        description:
          'Solicitações de exportação ou eliminação definitiva aguardam conclusão administrativa para conformidade legal.',
        impact: 'Conformidade RGPD / LGPD 100%',
        recommendedAction: 'Processar RGPD'
      });
    }

    if (freeUsers > paidUsers) {
      actionableInsights.push({
        id: 'ins-free-upsell',
        type: 'opportunity',
        title: `${freeUsers} Utilizadores Sem Plano Prontos para Conversão`,
        description: `O segmento gratuito supera os subscritores pagos (${paidUsers}). Um cupom ou banner direcionado pode converter em planos $${proPrice}.`,
        impact: `Potencial de +$${Math.round(freeUsers * 0.18 * proPrice * 10) / 10}/mês em MRR`,
        recommendedAction: 'Lançar Banner / Cupom'
      });
    }

    if (checkoutReached > purchasesCompleted) {
      const dropoff = Math.round(((checkoutReached - purchasesCompleted) / Math.max(checkoutReached, 1)) * 100);
      actionableInsights.push({
        id: 'ins-checkout',
        type: 'growth',
        title: `Abandono de Checkout em ${dropoff}% (${checkoutReached - purchasesCompleted} sessões)`,
        description:
          'Utilizadores abriram o modal de planos mas não finalizaram. Rever a proposta de valor do Plano Pro ou criar oferta aumenta a taxa de fecho.',
        impact: '+12% a +20% na conversão final do funil',
        recommendedAction: 'Editar Oferta dos Planos'
      });
    }

    if (revBase > 0 || totalAiCalls > 0) {
      actionableInsights.push({
        id: 'ins-ai-eff',
        type: 'efficiency',
        title: `Margem Operacional Estimada em ${grossMarginPercent}%`,
        description: `O consumo estimado da API Gemini representa ${costToRevenuePercent}% da receita registada (${totalAiCalls} chamadas totais).`,
        impact: `Custo estimado mensal: $${monthCostUsd}`,
        recommendedAction: 'Ajustar Modelos & Quotas'
      });
    }

    return {
      totalUsers,
      proUsers,
      executiveUsers,
      freeUsers,
      paidUsers,
      totalRevenue,
      periodOrdersCount: periodPaidOrders.length,
      mrr,
      arr,
      oneOffDownloadsRevenue,
      averageTicket: Number(averageTicket.toFixed(2)),
      churnRate,
      arpu,
      estimatedLtv,
      cacRatio,
      activeTrialConversion,
      grossMarginPercent,
      monthlyGrowthRate,
      cohortRetention,
      actionableInsights,
      conversionFunnel: {
        accountsCreated,
        resumesStarted,
        checkoutReached,
        purchasesCompleted
      },
      apiCostTracking: {
        todayCostUsd,
        monthCostUsd,
        totalRevenueUsd: totalRevenue,
        costToRevenuePercent,
        highUsageAlerts
      }
    };
  }, [usersList, ordersList, periodFilter, editablePlans, telemetry, errorLogsList, gdprList]);

  // Real 6-Month Revenue vs AI Cost Series derived from actual paid orders & AI usage
  const revenueSeries = useMemo(() => {
    const monthShortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const series: { label: string; year: number; month: number; revenue: number; aiCost: number }[] = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      series.push({
        label: offset === 0 ? 'Atual' : monthShortNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        aiCost: 0
      });
    }

    ordersList.forEach((o) => {
      if (o.status !== 'paid') return;
      const dt = new Date(o.createdAt || '');
      if (Number.isNaN(dt.getTime())) return;
      const bucket = series.find((b) => b.year === dt.getFullYear() && b.month === dt.getMonth());
      if (bucket) {
        bucket.revenue += Number(o.amount) || 0;
      }
    });

    const currentBucket = series[series.length - 1];
    if (currentBucket) {
      currentBucket.aiCost = financialMetrics.apiCostTracking.monthCostUsd;
    }

    return series.map(({ label, revenue, aiCost }) => ({
      label,
      revenue: Math.round(revenue * 100) / 100,
      aiCost: Math.round(aiCost * 100) / 100
    }));
  }, [ordersList, financialMetrics.apiCostTracking.monthCostUsd]);

  // Filtered Lists
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));
      const matchPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
      const matchStatus = userStatusFilter === 'all' || (u.status || 'active') === userStatusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [usersList, userSearch, userPlanFilter, userStatusFilter]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.userName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.userEmail.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [ordersList, orderSearch, orderStatusFilter]);

  const filteredSnippets = useMemo(() => {
    if (!snippetSearch.trim()) return snippetsList;
    const term = snippetSearch.toLowerCase();
    return snippetsList.filter(
      (s) =>
        s.profession.toLowerCase().includes(term) ||
        s.area.toLowerCase().includes(term) ||
        s.sampleTitle.toLowerCase().includes(term)
    );
  }, [snippetsList, snippetSearch]);

  const filteredErrorLogs = useMemo(() => {
    if (errorFilterMode === 'unresolved') return errorLogsList.filter((e) => !e.resolved);
    return errorLogsList;
  }, [errorLogsList, errorFilterMode]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------
  const handleQuickAddCredits = async (userId: string, addedCredits: number) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    const nextCredits = (target.creditsRemaining || 0) + addedCredits;
    try {
      await updateUserManagement(userId, { creditsRemaining: nextCredits });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, creditsRemaining: nextCredits } : u))
      );
      if (inspectedUser?.id === userId) {
        setInspectedUser((prev) => (prev ? { ...prev, creditsRemaining: nextCredits } : null));
      }
      showNotification(`Adicionados +${addedCredits} créditos a ${target.name}.`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao adicionar créditos.');
    }
  };

  const handleResetCredits = async (userId: string, newQuota: number = 5) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    try {
      await updateUserManagement(userId, { creditsRemaining: newQuota, creditsUsed: 0 });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, creditsRemaining: newQuota, creditsUsed: 0 } : u
        )
      );
      if (inspectedUser?.id === userId) {
        setInspectedUser((prev) =>
          prev ? { ...prev, creditsRemaining: newQuota, creditsUsed: 0 } : null
        );
      }
      showNotification(`Créditos de ${target.name} redefinidos para ${newQuota}.`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao redefinir créditos.');
    }
  };

  const handleExtendSubscription = async (userId: string, extraDays: number) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    const baseDate = target.subscriptionExpiresAt ? new Date(target.subscriptionExpiresAt) : new Date();
    const newExpiresAt = new Date(baseDate.getTime() + extraDays * 86400000).toISOString();
    const nextPlan: SubscriptionPlan = target.plan === 'free' ? 'pro' : target.plan;

    try {
      await updateUserManagement(userId, {
        plan: nextPlan,
        subscriptionExpiresAt: newExpiresAt,
        status: 'active'
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan: nextPlan, subscriptionExpiresAt: newExpiresAt, status: 'active' }
            : u
        )
      );
      if (inspectedUser?.id === userId) {
        setInspectedUser((prev) =>
          prev ? { ...prev, plan: nextPlan, subscriptionExpiresAt: newExpiresAt, status: 'active' } : null
        );
        setDrawerPlan(nextPlan);
        setDrawerStatus('active');
      }
      showNotification(`Assinatura de ${target.name} estendida por +${extraDays} dias!`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao estender assinatura.');
    }
  };

  const handleToggleSuspendUser = async (target: User) => {
    const nextStatus: UserStatus = target.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateUserManagement(target.id, { status: nextStatus });
      setUsersList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, status: nextStatus } : u))
      );
      if (inspectedUser?.id === target.id) {
        setInspectedUser((prev) => (prev ? { ...prev, status: nextStatus } : null));
        setDrawerStatus(nextStatus);
      }
      showNotification(
        `Conta de ${target.name} ${nextStatus === 'suspended' ? 'SUSPENSA' : 'REATIVADA'}.`
      );
    } catch (e) {
      console.error(e);
      showNotification('Erro ao alterar status da conta.');
    }
  };

  const handleDeleteUserAccount = async (target: User) => {
    if (
      !window.confirm(
        `Eliminar permanentemente a conta de ${target.name} (${target.email}) da coleção de utilizadores?`
      )
    ) {
      return;
    }
    try {
      await deleteUserAccountRecord(target.id);
      setUsersList((prev) => prev.filter((u) => u.id !== target.id));
      if (inspectedUser?.id === target.id) setInspectedUser(null);
      showNotification(`Conta ${target.email} eliminada.`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao eliminar conta.');
    }
  };

  const handleApproveOrder = async (order: SaaSOrder) => {
    try {
      await updateOrderStatus(
        order.id,
        'paid',
        'Pagamento confirmado pelo administrador e subscrição ativada.',
        order
      );
      setOrdersList((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'paid' } : o))
      );
      showNotification(`Fatura ${order.orderNumber} aprovada e acesso de ${order.userName} ativado!`);
      loadAllModules();
    } catch (e) {
      console.error(e);
      showNotification('Erro ao aprovar pagamento.');
    }
  };

  const handleRefundOrder = async (order: SaaSOrder) => {
    if (!window.confirm(`Confirmar reembolso da fatura ${order.orderNumber} ($${order.amount})?`)) {
      return;
    }
    try {
      await updateOrderStatus(order.id, 'refunded', 'Reembolso autorizado via painel administrativo');
      setOrdersList((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'refunded' } : o))
      );
      showNotification(`Fatura ${order.orderNumber} marcada como REEMBOLSADA.`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao processar reembolso.');
    }
  };

  const handleStartImpersonate = async (targetUser: User) => {
    try {
      await impersonateUser(targetUser, impersonateReason);
      setImpersonatingTargetUser(null);
      showNotification(`Modo de Personificação ATIVADO: navegando como ${targetUser.name}`);
      onClose();
    } catch (e) {
      console.error(e);
      showNotification('Erro ao iniciar personificação.');
    }
  };

  const handleSavePrompt = async (promptItem: PromptTemplateConfig) => {
    try {
      const updated = {
        ...promptItem,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin'
      };
      await savePromptConfig(updated);
      setPromptsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPrompt(updated);
      showNotification(`Prompt "${updated.name}" publicado em produção!`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao guardar prompt.');
    }
  };

  const handleRestoreDefaultPrompt = async () => {
    if (!selectedPrompt) return;
    const def = DEFAULT_PROMPT_CONFIGS.find((p) => p.id === selectedPrompt.id);
    if (!def) return;
    const restored = { ...def, updatedAt: new Date().toISOString() };
    await handleSavePrompt(restored);
    showNotification(`Prompt "${restored.name}" restaurado para o padrão original.`);
  };

  const handleTestPromptWithAI = async () => {
    if (!selectedPrompt) return;
    setIsTestingPrompt(true);
    setTestPromptResult(null);

    try {
      const token = localStorage.getItem('curriculopro_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/admin/test-prompt', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          systemInstruction: selectedPrompt.systemInstruction,
          userPromptTemplate: selectedPrompt.userPromptTemplate,
          sampleInput:
            testPromptInput ||
            'Gerente de Operações com 10 anos de experiência em logística, redução de OPEX de 28% e ERP SAP.',
          temperature: selectedPrompt.temperature,
          preferredModel: selectedPrompt.preferredModel,
          fallbackModel: selectedPrompt.fallbackModel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
      setTestPromptResult({
        output: data.output || JSON.stringify(data, null, 2),
        modelUsed: data.modelUsed,
        latencyMs: data.latencyMs,
        estimatedTokens: data.estimatedTokens
      });
      showNotification('Teste ao vivo concluído via Gemini API!');
    } catch (e: any) {
      setTestPromptResult({
        output: `Erro na execução do teste: ${e.message || String(e)}`
      });
    } finally {
      setIsTestingPrompt(false);
    }
  };

  const handleMoveTemplateOrder = async (templateId: string, direction: 'up' | 'down') => {
    const sorted = [...templatesList].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((t) => t.id === templateId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const current = sorted[idx];
    const swapWith = sorted[targetIdx];

    const updatedCurrent = { ...current, displayOrder: swapWith.displayOrder };
    const updatedSwap = { ...swapWith, displayOrder: current.displayOrder };

    const nextList = sorted
      .map((t) => (t.id === updatedCurrent.id ? updatedCurrent : t.id === updatedSwap.id ? updatedSwap : t))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    setTemplatesList(nextList);
    await Promise.all([saveAdminTemplate(updatedCurrent), saveAdminTemplate(updatedSwap)]);
    showNotification(`Ordem de exibição de "${current.shortName}" atualizada!`);
  };

  const handleToggleTemplate = async (templateId: string, currentActive: boolean) => {
    const target = templatesList.find((t) => t.id === templateId);
    if (!target) return;
    const updated = { ...target, isActive: !currentActive };
    await saveAdminTemplate(updated);
    setTemplatesList((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
    showNotification(`Template "${target.shortName}" ${!currentActive ? 'ATIVADO' : 'DESATIVADO'}.`);
  };

  const handleTemplateTierChange = async (templateId: string, newTier: 'free' | 'pro' | 'executive') => {
    const target = templatesList.find((t) => t.id === templateId);
    if (!target) return;
    const updated = { ...target, tierRequired: newTier };
    await saveAdminTemplate(updated);
    setTemplatesList((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
    showNotification(`Nível do modelo "${target.shortName}" alterado para ${newTier.toUpperCase()}.`);
  };

  const handleExportGdprJson = (req: GdprDataRequest) => {
    const matchingUser = usersList.find(
      (u) => u.id === req.userId || u.email.toLowerCase() === req.userEmail.toLowerCase()
    );
    const matchingOrders = ordersList.filter(
      (o) => o.userId === req.userId || o.userEmail.toLowerCase() === req.userEmail.toLowerCase()
    );
    const payload = {
      exportedAt: new Date().toISOString(),
      gdprRequestId: req.id,
      subjectEmail: req.userEmail,
      accountProfile: matchingUser || { email: req.userEmail, note: 'Perfil já anonimizado/removido' },
      billingHistory: matchingOrders
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RGPD_Portabilidade_${req.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Pacote RGPD JSON descarregado para ${req.userEmail}!`);
  };

  const handleAnonymizeGdpr = async (req: GdprDataRequest) => {
    const matchingUser = usersList.find(
      (u) => u.id === req.userId || u.email.toLowerCase() === req.userEmail.toLowerCase()
    );
    if (matchingUser) {
      await anonymizeUserRecord(matchingUser.id);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === matchingUser.id
            ? {
                ...u,
                name: 'Utilizador Anonimizado (RGPD)',
                email: `anon-${matchingUser.id.slice(0, 8)}@eliminado.rgpd`,
                phone: '',
                status: 'suspended',
                plan: 'free',
                creditsRemaining: 0
              }
            : u
        )
      );
    }
    await updateGdprRequestStatus(req.id, 'completed', 'Dados pessoais anonimizados conforme Art. 17 RGPD.');
    setGdprList((prev) =>
      prev.map((item) =>
        item.id === req.id
          ? { ...item, status: 'completed', notes: 'Dados pessoais anonimizados conforme Art. 17 RGPD.' }
          : item
      )
    );
    showNotification(`Dados de ${req.userEmail} anonimizados e pedido concluído.`);
  };

  const handleDeleteGdpr = async (req: GdprDataRequest) => {
    if (!window.confirm(`Confirmar eliminação definitiva da conta ${req.userEmail}?`)) return;
    const matchingUser = usersList.find(
      (u) => u.id === req.userId || u.email.toLowerCase() === req.userEmail.toLowerCase()
    );
    if (matchingUser) {
      await deleteUserAccountRecord(matchingUser.id);
      setUsersList((prev) => prev.filter((u) => u.id !== matchingUser.id));
    }
    await updateGdprRequestStatus(req.id, 'completed', 'Conta eliminada definitivamente conforme Art. 17 RGPD.');
    setGdprList((prev) =>
      prev.map((item) =>
        item.id === req.id
          ? { ...item, status: 'completed', notes: 'Conta eliminada definitivamente conforme Art. 17 RGPD.' }
          : item
      )
    );
    showNotification(`Conta ${req.userEmail} eliminada em conformidade RGPD.`);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.userName.trim() || !newOrderForm.userEmail.trim()) return;
    try {
      const matchedUser = usersList.find(
        (u) => u.email.toLowerCase() === newOrderForm.userEmail.trim().toLowerCase()
      );
      const created = await createSaaSOrder({
        userId: matchedUser?.id || 'manual',
        userName: newOrderForm.userName.trim(),
        userEmail: newOrderForm.userEmail.trim(),
        plan: newOrderForm.plan,
        billingCycle: newOrderForm.billingCycle,
        amount: Number(newOrderForm.amount),
        currency: newOrderForm.currency,
        paymentMethod: newOrderForm.paymentMethod,
        status: newOrderForm.status,
        notes: newOrderForm.notes,
        adminManual: true
      });
      setOrdersList((prev) => [created, ...prev]);
      setShowNewOrderModal(false);
      showNotification(`Fatura ${created.orderNumber} registada!`);
      loadAllModules();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao criar pedido manual.');
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponForm.code.trim()) return;

    try {
      const created = await createCoupon({
        code: newCouponForm.code,
        discountPercent: newCouponForm.discountPercent,
        maxUses: newCouponForm.maxUses,
        expiresAt: new Date(Date.now() + newCouponForm.expiresDays * 86400000).toISOString(),
        active: true
      });
      setCouponsList((prev) => [created, ...prev]);
      setShowNewCouponModal(false);
      setNewCouponForm({ code: '', discountPercent: 20, maxUses: 100, expiresDays: 60 });
      showNotification(`Cupom ${created.code} ativado!`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao criar cupom.');
    }
  };

  const handleCreateBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerForm.title.trim() || !newBannerForm.message.trim()) return;

    const newBanner: SystemAnnouncementBanner = {
      id: `ban-${Date.now()}`,
      title: newBannerForm.title,
      message: newBannerForm.message,
      type: newBannerForm.type,
      active: true,
      targetAudience: newBannerForm.targetAudience,
      actionUrl: newBannerForm.actionUrl,
      actionLabel: newBannerForm.actionLabel,
      startsAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + newBannerForm.daysActive * 86400000).toISOString(),
      dismissible: true
    };

    try {
      await saveSystemBanner(newBanner);
      setBannersList((prev) => [newBanner, ...prev]);
      setShowNewBannerModal(false);
      setNewBannerForm({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        actionUrl: '#pricing',
        actionLabel: 'Ver Oferta',
        daysActive: 14
      });
      showNotification('Banner publicado ao vivo no aplicativo!');
    } catch (e) {
      console.error(e);
      showNotification('Erro ao publicar banner.');
    }
  };

  const handleCreateSnippetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnippetForm.profession.trim()) return;

    const newSnippet: ProfessionSnippetExample = {
      id: `snip-${Date.now()}`,
      profession: newSnippetForm.profession,
      area: newSnippetForm.area,
      sampleTitle: newSnippetForm.sampleTitle || newSnippetForm.profession,
      sampleSummary: newSnippetForm.sampleSummary,
      sampleBullets: newSnippetForm.sampleBullets
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      sampleSkills: newSnippetForm.sampleSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    };

    try {
      await saveProfessionSnippet(newSnippet);
      setSnippetsList((prev) => [newSnippet, ...prev]);
      setShowNewSnippetModal(false);
      setNewSnippetForm({
        profession: '',
        area: 'Tecnologia',
        sampleTitle: '',
        sampleSummary: '',
        sampleBullets: '',
        sampleSkills: ''
      });
      showNotification('Exemplo adicionado à biblioteca do Editor!');
    } catch (e) {
      console.error(e);
      showNotification('Erro ao salvar exemplo.');
    }
  };

  const handleExportCSV = (type: 'users' | 'orders' | 'errors') => {
    let csvContent = '';
    let filename = '';

    if (type === 'users') {
      filename = `Utilizadores_SaaS_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Nome,Email,Telefone,Plano,Status,Creditos,TotalCVs,CriadoEm\n';
      usersList.forEach((u) => {
        csvContent += `"${u.id}","${u.name}","${u.email}","${u.phone || ''}","${u.plan}","${u.status || 'active'}","${u.creditsRemaining}","${u.totalCvGenerated || 0}","${u.createdAt}"\n`;
      });
    } else if (type === 'orders') {
      filename = `Faturas_Vendas_SaaS_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Fatura,Cliente,Email,Plano,Ciclo,Valor,Moeda,Metodo,Status,Data\n';
      ordersList.forEach((o) => {
        csvContent += `"${o.orderNumber}","${o.userName}","${o.userEmail}","${o.plan}","${o.billingCycle}","${o.amount}","${o.currency}","${o.paymentMethod}","${o.status}","${o.createdAt}"\n`;
      });
    } else {
      filename = `Logs_Erros_Tecnicos_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Data,Operacao,Email,Resolvido,Mensagem\n';
      errorLogsList.forEach((err) => {
        csvContent += `"${err.id}","${err.timestamp}","${err.operationType}","${err.userEmail || ''}","${err.resolved}","${err.errorMessage.replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Relatório ${filename} exportado!`);
  };

  const handleExportExecutiveReportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      period: periodFilter,
      financialMetrics,
      telemetry,
      activePlans: editablePlans,
      platformSettings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Executivo_SaaS_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Relatório Executivo JSON exportado!');
  };

  const handleInsightActionNavigate = (insightId: string) => {
    if (insightId === 'ins-errors') {
      setActiveModule('security_monitoring');
      setSecuritySubTab('error_logs');
    } else if (insightId === 'ins-gdpr') {
      setActiveModule('security_monitoring');
      setSecuritySubTab('gdpr');
    } else if (insightId === 'ins-free-upsell') {
      setActiveModule('pricing_marketing');
      setMonetizationSubTab('coupons');
    } else if (insightId === 'ins-checkout') {
      setActiveModule('pricing_marketing');
      setMonetizationSubTab('plans');
    } else {
      setActiveModule('ai_prompts');
      setAiSubTab('prompts');
    }
  };

  if (!isOpen) return null;

  const isAdmin = isUserAdmin(user?.email || firebaseUser?.email, user?.role);
  if (!isAdmin && !isImpersonating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Acesso Restrito a Administradores</h2>
          <p className="text-xs text-slate-600 mb-4">
            Esta área é reservada para administradores do sistema ({ADMIN_EMAILS[0]}).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const unresolvedErrorsCount = errorLogsList.filter((e) => !e.resolved).length;
  const pendingGdprCount = gdprList.filter((g) => g.status === 'pending').length;

  const navItems: Array<{
    id: AdminActiveModule;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeAlert?: boolean;
  }> = [
    {
      id: 'financial',
      label: 'Financeiro & Insights',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'ai_prompts',
      label: 'IA, Prompts & Quotas',
      icon: <Bot className="w-4 h-4" />,
      badge: promptsList.length
    },
    {
      id: 'templates_content',
      label: 'Templates & Idiomas',
      icon: <BookOpen className="w-4 h-4" />,
      badge: templatesList.filter((t) => t.isActive).length
    },
    {
      id: 'users_support',
      label: 'CRM & Faturas',
      icon: <Users className="w-4 h-4" />,
      badge: usersList.length
    },
    {
      id: 'pricing_marketing',
      label: 'Planos, Cupons & Avisos',
      icon: <Tag className="w-4 h-4" />,
      badge: couponsList.filter((c) => c.active).length
    },
    {
      id: 'security_monitoring',
      label: 'Segurança & Governança',
      icon: <Shield className="w-4 h-4" />,
      badge: unresolvedErrorsCount + pendingGdprCount || undefined,
      badgeAlert: unresolvedErrorsCount + pendingGdprCount > 0
    }
  ];

  const maxRevBar = Math.max(...revenueSeries.map((s) => s.revenue), 1);
  const templateRanking = Object.entries(telemetry.templateSelections)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const maxTemplateSel = Math.max(...templateRanking.map(([, c]) => c), 1);
  const totalLangSwitches = Math.max(
    Object.values(telemetry.languageSelections).reduce((a, b) => a + b, 0),
    1
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-slate-50 sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[1440px] h-dvh sm:h-[94vh] flex overflow-hidden text-slate-900">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR (240px Enterprise SaaS Navigation) */}
        {/* ========================================================= */}
        <aside
          className={`${
            mobileNavOpen ? 'fixed inset-y-0 left-0 z-60 flex' : 'hidden'
          } lg:static lg:flex w-60 shrink-0 bg-white border-r border-slate-200 flex-col justify-between`}
        >
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Brand / Identity */}
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold tracking-tight text-slate-900 truncate">
                    Executive Admin
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    SaaS Backoffice v2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Section */}
            <div className="p-3 space-y-1">
              <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos de Gestão
              </p>
              {navItems.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.badgeAlert
                            ? 'bg-rose-500 text-white'
                            : isActive
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Frontend Governance Snapshot */}
            <div className="mx-3 mt-2 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Estado em Produção</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Manutenção</span>
                  <span className="font-mono font-bold">
                    {platformSettings?.maintenanceMode ? 'ATIVA' : 'OFF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IA Global</span>
                  <span className="font-mono font-bold">
                    {platformSettings?.enableAiFeaturesGlobally !== false ? 'ON' : 'PAUSA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Novos Cadastros</span>
                  <span className="font-mono font-bold">
                    {platformSettings?.allowNewRegistrations !== false ? 'ABERTO' : 'PAUSA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Identity Footer */}
          <div className="p-3 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {(user?.email || 'G')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate text-[11px]">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  {user?.email || firebaseUser?.email || 'gugurai923@gmail.com'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE (Breadcrumb Header + Scrollable Canvas) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Breadcrumb Bar */}
          <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 hidden sm:inline">Admin</span>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <h1 className="text-sm font-extrabold text-slate-900 truncate">
                    {MODULE_META[activeModule].label}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden md:block">
                  {MODULE_META[activeModule].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadAllModules}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sincronizar</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar ao App</span>
              </button>
            </div>
          </header>

          {/* Toast Feedback */}
          {feedbackMessage && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
              <button type="button" onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Scrollable Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>A carregar dados da plataforma...</span>
              </div>
            ) : (
              <>
                {/* ========================================================= */}
                {/* MÓDULO 1: DASHBOARD FINANCEIRO, MÉTRICAS & INSIGHTS */}
                {/* ========================================================= */}
                {activeModule === 'financial' && (
                  <div className="space-y-6">
                    {/* Period & Export Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                        {([
                          { id: '7d', label: '7 Dias' },
                          { id: '30d', label: '30 Dias' },
                          { id: '90d', label: '90 Dias' },
                          { id: 'all', label: 'Todo Período' }
                        ] as const).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPeriodFilter(p.id)}
                            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                              periodFilter === p.id
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportCSV('orders')}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Exportar CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportExecutiveReportJson}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <FileJson className="w-3.5 h-3.5 text-amber-400" />
                          <span>Relatório Executivo JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* 8 KPI Cards (2 rows of 4) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            MRR (Receita Recorrente)
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-600">
                            +{financialMetrics.monthlyGrowthRate}% MoM
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.mrr.toLocaleString()}
                          <span className="text-xs font-normal text-slate-400 ml-1">/mês</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          ARR Run Rate: <strong className="text-slate-800">${financialMetrics.arr.toLocaleString()}/ano</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Faturas Pagas ({periodFilter})
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {financialMetrics.periodOrdersCount} ordens
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.totalRevenue.toLocaleString()}
                          <span className="text-xs font-normal text-slate-400 ml-1">USD</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          Ticket Médio: <strong className="text-slate-800">${financialMetrics.averageTicket}</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          ARPU &amp; LTV Estimado
                        </span>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.estimatedLtv}
                          <span className="text-xs font-normal text-slate-400 ml-1">LTV</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          ARPU Global: <strong className="text-slate-800">${financialMetrics.arpu}/utilizador</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Rácio LTV : CAC
                        </span>
                        <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1.5">
                          {financialMetrics.cacRatio}x
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Saúde unitária SaaS: <strong className="text-emerald-700">Excelente (&gt;3x)</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Churn &amp; Retenção Mensal
                        </span>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          {financialMetrics.churnRate}%
                          <span className="text-xs font-normal text-slate-400 ml-1">churn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          Retenção Ativa: <strong className="text-emerald-700">{(100 - financialMetrics.churnRate).toFixed(1)}%</strong>
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Conversão Free → Pago
                        </span>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          {financialMetrics.activeTrialConversion}%
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          {financialMetrics.paidUsers} pagos de {financialMetrics.totalUsers} contas
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Custo API Gemini (Mês)
                        </span>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.apiCostTracking.monthCostUsd}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          Hoje: <strong>${financialMetrics.apiCostTracking.todayCostUsd}</strong> ({financialMetrics.apiCostTracking.costToRevenuePercent}% rev.)
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Margem Bruta SaaS
                        </span>
                        <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1.5">
                          {financialMetrics.grossMarginPercent}%
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Líquida após Taxas &amp; Tokens IA
                        </p>
                      </div>
                    </div>

                    {/* Row 2: Revenue vs API Cost Chart + Plan Mix */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Evolução de Receita vs Custo de IA (6 Meses)
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Comparativo de faturamento mensal contra consumo de tokens Gemini.
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <span className="w-2.5 h-2.5 rounded-xs bg-slate-900" /> Receita
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" /> Custo IA
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-3 pt-2 items-end h-44">
                          {revenueSeries.map((pt) => {
                            const revPct = pt.revenue > 0 ? Math.max(8, Math.round((pt.revenue / maxRevBar) * 100)) : 0;
                            const costPct = pt.aiCost > 0 ? Math.max(4, Math.min(40, Math.round((pt.aiCost / maxRevBar) * 600))) : 0;
                            return (
                              <div key={pt.label} className="flex flex-col items-center gap-2 h-full justify-end">
                                <span className="text-[10px] font-mono font-bold text-slate-700 tabular-nums">
                                  ${pt.revenue}
                                </span>
                                <div className="w-full max-w-[44px] flex items-end justify-center gap-1 h-28 bg-slate-50 rounded-md p-1 border border-slate-100">
                                  <div
                                    className="w-4 bg-slate-900 rounded-t-xs transition-all"
                                    style={{ height: `${revPct}%` }}
                                    title={`Receita: $${pt.revenue}`}
                                  />
                                  <div
                                    className="w-2.5 bg-amber-400 rounded-t-xs transition-all"
                                    style={{ height: `${costPct}%` }}
                                    title={`Custo IA: $${pt.aiCost}`}
                                  />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500">{pt.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        {ordersList.length === 0 && (
                          <p className="text-[11px] text-slate-400 text-center pt-1">
                            Nenhuma fatura paga registada ainda — os valores atualizarão automaticamente com as primeiras transações.
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Distribuição por Plano &amp; Participação MRR
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Composição da base de {financialMetrics.totalUsers} utilizadores registados.
                          </p>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          {[
                            {
                              label: 'Executivo VIP ($12/mês)',
                              count: financialMetrics.executiveUsers,
                              color: 'bg-purple-600',
                              mrrPart: financialMetrics.executiveUsers * (editablePlans.find((p) => p.id === 'executive')?.priceMonthlyValue ?? 12)
                            },
                            {
                              label: 'Profissional Pro ($8/mês)',
                              count: financialMetrics.proUsers,
                              color: 'bg-amber-500',
                              mrrPart: financialMetrics.proUsers * (editablePlans.find((p) => p.id === 'pro')?.priceMonthlyValue ?? 8)
                            },
                            {
                              label: 'Visitante / Sem Plano',
                              count: financialMetrics.freeUsers,
                              color: 'bg-slate-400',
                              mrrPart: 0
                            }
                          ].map((tier) => {
                            const pct =
                              financialMetrics.totalUsers > 0
                                ? Math.round((tier.count / financialMetrics.totalUsers) * 100)
                                : 0;
                            return (
                              <div key={tier.label} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800">{tier.label}</span>
                                  <span className="font-mono tabular-nums text-slate-700 font-bold">
                                    {tier.count} ({pct}%) · ${tier.mrrPart}/mês
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${tier.color} rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Exports Word (.docx)
                            </span>
                            <span className="text-base font-black font-mono tabular-nums text-slate-900">
                              {telemetry.wordExportsCount}
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Tokens IA Estimados
                            </span>
                            <span className="text-base font-black font-mono tabular-nums text-slate-900">
                              {(telemetry.estimatedTokensUsed / 1000).toFixed(1)}k
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Actionable Strategic Insights Engine */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Motor de Insights Estratégicos &amp; Ações Recomendadas
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Diagnósticos automáticos gerados a partir dos dados de receita, telemetria e logs.
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {financialMetrics.actionableInsights.length} insights ativos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {financialMetrics.actionableInsights.map((insight) => (
                          <div
                            key={insight.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    insight.type === 'risk'
                                      ? 'bg-rose-100 text-rose-800'
                                      : insight.type === 'opportunity'
                                      ? 'bg-amber-100 text-amber-900'
                                      : insight.type === 'growth'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {insight.type === 'risk'
                                    ? 'Risco / Atenção'
                                    : insight.type === 'opportunity'
                                    ? 'Oportunidade MRR'
                                    : insight.type === 'growth'
                                    ? 'Conversão'
                                    : 'Eficiência'}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-slate-600">
                                  {insight.impact}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm">{insight.title}</h4>
                              <p className="text-slate-600 leading-relaxed">{insight.description}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleInsightActionNavigate(insight.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5"
                              >
                                <span>{insight.recommendedAction}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 4: Conversion Funnel + Live Telemetry (Templates, Languages, AI Tools) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Funnel */}
                      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Funil de Conversão em Tempo Real
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Alimentado por eventos reais do editor e checkout.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs">
                          {[
                            {
                              label: '1. Contas Criadas',
                              value: financialMetrics.conversionFunnel.accountsCreated,
                              pct: 100,
                              color: 'bg-slate-900'
                            },
                            {
                              label: '2. Currículo Iniciado no Estúdio',
                              value: financialMetrics.conversionFunnel.resumesStarted,
                              pct: Math.min(
                                100,
                                Math.round(
                                  (financialMetrics.conversionFunnel.resumesStarted /
                                    Math.max(financialMetrics.conversionFunnel.accountsCreated, 1)) *
                                    100
                                )
                              ),
                              color: 'bg-blue-600'
                            },
                            {
                              label: '3. Modal de Planos / Checkout Aberto',
                              value: financialMetrics.conversionFunnel.checkoutReached,
                              pct: Math.min(
                                100,
                                Math.round(
                                  (financialMetrics.conversionFunnel.checkoutReached /
                                    Math.max(financialMetrics.conversionFunnel.accountsCreated, 1)) *
                                    100
                                )
                              ),
                              color: 'bg-amber-500'
                            },
                            {
                              label: '4. Assinaturas Pagas Ativas',
                              value: financialMetrics.conversionFunnel.purchasesCompleted,
                              pct: Math.min(
                                100,
                                Math.round(
                                  (financialMetrics.conversionFunnel.purchasesCompleted /
                                    Math.max(financialMetrics.conversionFunnel.accountsCreated, 1)) *
                                    100
                                )
                              ),
                              color: 'bg-emerald-600'
                            }
                          ].map((step) => (
                            <div key={step.label} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-semibold text-slate-700">{step.label}</span>
                                <span className="font-mono font-bold tabular-nums text-slate-900">
                                  {step.value} ({step.pct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${step.color} rounded-full`} style={{ width: `${step.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live Telemetry Rankings */}
                      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Telemetria Frontend: Templates, Idiomas &amp; Ferramentas IA
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Última atividade registada: {new Date(telemetry.lastUpdated).toLocaleTimeString('pt-PT')}
                            </p>
                          </div>
                          <Activity className="w-4 h-4 text-emerald-600" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase text-slate-400 block">
                              Templates Mais Usados
                            </span>
                            {templateRanking.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-2">
                                Ainda sem seleções de modelos registadas.
                              </p>
                            ) : (
                              templateRanking.map(([tmplId, count]) => (
                                <div key={tmplId} className="space-y-0.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-slate-700 truncate">{tmplId}</span>
                                    <span className="font-mono font-bold text-slate-900">{count}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-slate-900 rounded-full"
                                      style={{ width: `${Math.round((count / maxTemplateSel) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                                Idiomas Ativos no Estúdio
                              </span>
                              {Object.keys(telemetry.languageSelections).length === 0 ? (
                                <p className="text-[11px] text-slate-400 py-1">
                                  Ainda sem alternâncias de idioma registadas.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(telemetry.languageSelections).map(([lang, cnt]) => (
                                    <span
                                      key={lang}
                                      className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] font-bold text-slate-800"
                                    >
                                      {lang.toUpperCase()}: {Math.round((cnt / totalLangSwitches) * 100)}%
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                                Uso por Módulo IA ({telemetry.aiCallsCount} chamadas)
                              </span>
                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                                  <span>Otimizar IA</span>
                                  <strong className="font-mono">{telemetry.featureUsage.aiTailor}</strong>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                                  <span>Radar ATS</span>
                                  <strong className="font-mono">{telemetry.featureUsage.atsRadar}</strong>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                                  <span>Carta IA</span>
                                  <strong className="font-mono">{telemetry.featureUsage.coverLetter}</strong>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                                  <span>Entrevista</span>
                                  <strong className="font-mono">{telemetry.featureUsage.interviewSim}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Cohort Retention Matrix + High AI Usage Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Matriz de Retenção de Coortes (Cohort Retention)
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Percentagem de assinantes ativos ao longo dos primeiros 3 meses após cadastro.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="py-2 pr-3">Coorte</th>
                                <th className="py-2 px-3">Novas Contas</th>
                                <th className="py-2 px-3 text-center">Mês 1</th>
                                <th className="py-2 px-3 text-center">Mês 2</th>
                                <th className="py-2 pl-3 text-center">Mês 3</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                              {financialMetrics.cohortRetention.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center font-sans text-xs text-slate-400">
                                    Sem dados de coorte — aparecerão automaticamente conforme novos utilizadores se registarem.
                                  </td>
                                </tr>
                              ) : (
                                financialMetrics.cohortRetention.map((row) => (
                                  <tr key={row.month}>
                                    <td className="py-2.5 pr-3 font-sans font-semibold text-slate-800">{row.month}</td>
                                    <td className="py-2.5 px-3 text-slate-700">{row.newUsers}</td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                                        {row.retainedMonth1}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                                        {row.retainedMonth2}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 pl-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                                        {row.retainedMonth3}%
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Alertas de Consumo Intensivo de IA
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Contas com maior volume de chamadas para monitorização de abuso.
                          </p>
                        </div>

                        {financialMetrics.apiCostTracking.highUsageAlerts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                            Nenhum consumo anómalo detetado nas últimas 24 horas.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {financialMetrics.apiCostTracking.highUsageAlerts.map((alert) => (
                              <div
                                key={alert.userId}
                                className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{alert.userName}</p>
                                  <p className="text-[11px] text-slate-500 truncate">{alert.userEmail}</p>
                                  <span className="text-[10px] text-amber-800 font-medium">{alert.flaggedReason}</span>
                                </div>
                                <div className="text-right shrink-0 font-mono tabular-nums">
                                  <span className="font-bold text-slate-900 block">{alert.callsCount} calls</span>
                                  <span className="text-[11px] text-slate-500">${alert.costUsd}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* MÓDULO 2: GESTÃO DE INTELIGÊNCIA ARTIFICIAL E PROMPTS */}
                {/* ========================================================= */}
                {activeModule === 'ai_prompts' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs w-fit">
                      <button
                        type="button"
                        onClick={() => setAiSubTab('prompts')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          aiSubTab === 'prompts' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Prompt Studio Sem Código ({promptsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSubTab('models')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          aiSubTab === 'models' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Roteamento &amp; Fallback de Modelos
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSubTab('quotas')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          aiSubTab === 'quotas' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Limites, Créditos &amp; Recursos por Plano
                      </button>
                    </div>

                    {aiSubTab === 'prompts' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Prompt List */}
                        <div className="lg:col-span-4 space-y-2">
                          {promptsList.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPrompt(p);
                                setTestPromptResult(null);
                              }}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs space-y-1 ${
                                selectedPrompt?.id === p.id
                                  ? 'bg-slate-900 border-slate-900 text-white'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold truncate">{p.name}</span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                    selectedPrompt?.id === p.id
                                      ? 'bg-amber-400 text-slate-950 font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {p.category}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] line-clamp-2 ${
                                  selectedPrompt?.id === p.id ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {p.description}
                              </p>
                              <div className="text-[10px] font-mono opacity-75 pt-0.5">
                                {p.preferredModel} · temp {p.temperature}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Prompt Editor & Live API Test Bench */}
                        {selectedPrompt && (
                          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">{selectedPrompt.name}</h3>
                                <p className="text-[11px] text-slate-500">
                                  Qualquer alteração é propagada imediatamente para as rotas de IA do app.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleRestoreDefaultPrompt}
                                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restaurar Padrão</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSavePrompt(selectedPrompt)}
                                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Guardar &amp; Publicar</span>
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                  System Instruction (Diretriz de Sistema injetada na API)
                                </label>
                                <textarea
                                  rows={3}
                                  value={selectedPrompt.systemInstruction}
                                  onChange={(e) =>
                                    setSelectedPrompt({ ...selectedPrompt, systemInstruction: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                  Template do Prompt ({selectedPrompt.variables.map((v) => `{{${v}}}`).join(', ')})
                                </label>
                                <textarea
                                  rows={3}
                                  value={selectedPrompt.userPromptTemplate}
                                  onChange={(e) =>
                                    setSelectedPrompt({ ...selectedPrompt, userPromptTemplate: e.target.value })
                                  }
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px]"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">
                                    Temperatura: <span className="font-mono">{selectedPrompt.temperature}</span>
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={selectedPrompt.temperature}
                                    onChange={(e) =>
                                      setSelectedPrompt({ ...selectedPrompt, temperature: Number(e.target.value) })
                                    }
                                    className="w-full mt-2"
                                  />
                                </div>

                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Modelo Preferencial</label>
                                  <select
                                    value={selectedPrompt.preferredModel}
                                    onChange={(e) =>
                                      setSelectedPrompt({ ...selectedPrompt, preferredModel: e.target.value })
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                                  >
                                    <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Modelo de Reserva</label>
                                  <select
                                    value={selectedPrompt.fallbackModel}
                                    onChange={(e) =>
                                      setSelectedPrompt({ ...selectedPrompt, fallbackModel: e.target.value })
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                                  >
                                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                                    <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                                  </select>
                                </div>
                              </div>

                              {/* Live Prompt Test Sandbox */}
                              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Laboratório de Teste ao Vivo (/api/admin/test-prompt)</span>
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Texto de teste (ex: Diretor Comercial com metas superadas em 130%...)"
                                    value={testPromptInput}
                                    onChange={(e) => setTestPromptInput(e.target.value)}
                                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleTestPromptWithAI}
                                    disabled={isTestingPrompt}
                                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                                  >
                                    {isTestingPrompt ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Zap className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isTestingPrompt ? 'A Executar...' : 'Testar Prompt Agora'}</span>
                                  </button>
                                </div>

                                {testPromptResult && (
                                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800 text-amber-300">
                                      <span>Modelo: {testPromptResult.modelUsed || selectedPrompt.preferredModel}</span>
                                      <span>
                                        Latência: {testPromptResult.latencyMs ?? 0}ms · ~
                                        {testPromptResult.estimatedTokens ?? 0} tokens
                                      </span>
                                    </div>
                                    <pre className="whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto text-emerald-300">
                                      {testPromptResult.output}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {aiSubTab === 'models' && aiRouting && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Roteamento &amp; Failover de Modelos IA</h3>
                            <p className="text-[11px] text-slate-500">
                              Defina modelos principais, de economia e reservas automáticas contra falhas.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await saveAiRoutingConfig(aiRouting);
                              showNotification('Política de roteamento de IA guardada!');
                            }}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>Salvar Roteamento</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Modelo Principal</label>
                            <select
                              value={aiRouting.primaryModel}
                              onChange={(e) => setAiRouting({ ...aiRouting, primaryModel: e.target.value })}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                            >
                              <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                              <option value="gemini-flash-latest">gemini-flash-latest</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Modelo Fallback (Reserva)</label>
                            <select
                              value={aiRouting.fallbackModel}
                              onChange={(e) => setAiRouting({ ...aiRouting, fallbackModel: e.target.value })}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                            >
                              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                              <option value="gemini-flash-latest">gemini-flash-latest</option>
                              <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Modelo Baixo Custo (Tradução)</label>
                            <select
                              value={aiRouting.costSavingModel}
                              onChange={(e) => setAiRouting({ ...aiRouting, costSavingModel: e.target.value })}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                            >
                              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                              <option value="gemini-flash-latest">gemini-flash-latest</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Máx. Retentativas / Timeout</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={aiRouting.maxRetries}
                                onChange={(e) => setAiRouting({ ...aiRouting, maxRetries: Number(e.target.value) })}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                              />
                              <input
                                type="number"
                                step={500}
                                value={aiRouting.timeoutMs}
                                onChange={(e) => setAiRouting({ ...aiRouting, timeoutMs: Number(e.target.value) })}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          {Object.entries(aiRouting.healthStatus).map(([modelName, info]) => (
                            <div key={modelName} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                              <div>
                                <div className="font-mono font-bold text-slate-900">{modelName}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                  Latência média: {info.latencyMs}ms
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                {info.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiSubTab === 'quotas' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {planQuotas.map((q) => (
                          <div key={q.planId} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <span className="font-bold text-sm text-slate-900">{q.planName}</span>
                              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                {q.planId}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                  Créditos/mês
                                </label>
                                <input
                                  type="number"
                                  value={q.monthlyCredits}
                                  disabled={q.unlimited}
                                  onChange={(e) => {
                                    const next = planQuotas.map((item) =>
                                      item.planId === q.planId
                                        ? { ...item, monthlyCredits: Number(e.target.value) }
                                        : item
                                    );
                                    setPlanQuotas(next);
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-50"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                  Máx. Currículos
                                </label>
                                <input
                                  type="number"
                                  value={q.maxResumes}
                                  onChange={(e) => {
                                    const next = planQuotas.map((item) =>
                                      item.planId === q.planId ? { ...item, maxResumes: Number(e.target.value) } : item
                                    );
                                    setPlanQuotas(next);
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              {[
                                { key: 'unlimited', label: 'Créditos Ilimitados' },
                                { key: 'allowAiTailor', label: 'Otimizador IA Google XYZ' },
                                { key: 'allowAtsRadar', label: 'Radar ATS Semântico' },
                                { key: 'allowCoverLetter', label: 'Carta de Apresentação IA' },
                                { key: 'allowInterviewSim', label: 'Simulador Entrevista STAR' }
                              ].map((feat) => (
                                <label key={feat.key} className="flex items-center justify-between py-1 cursor-pointer">
                                  <span className="text-slate-700 font-medium">{feat.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={Boolean((q as any)[feat.key])}
                                    onChange={(e) => {
                                      const next = planQuotas.map((item) =>
                                        item.planId === q.planId ? { ...item, [feat.key]: e.target.checked } : item
                                      );
                                      setPlanQuotas(next);
                                    }}
                                    className="rounded text-slate-900"
                                  />
                                </label>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await savePlanQuota(q);
                                showNotification(`Quotas do plano ${q.planName} guardadas!`);
                              }}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                            >
                              Salvar Regras do Plano
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* MÓDULO 3: GESTÃO DE TEMPLATES E CONTEÚDO */}
                {/* ========================================================= */}
                {activeModule === 'templates_content' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs w-fit">
                      <button
                        type="button"
                        onClick={() => setContentSubTab('templates')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          contentSubTab === 'templates'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Catálogo de Modelos ({templatesList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentSubTab('snippets')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          contentSubTab === 'snippets'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Biblioteca por Profissão ({snippetsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentSubTab('locales')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          contentSubTab === 'locales'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Textos Fixos em 5 Idiomas
                      </button>
                    </div>

                    {contentSubTab === 'templates' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            Gestor de Modelos (Ordem, Visibilidade e Tier)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            A ordem e os níveis configurados refletem instantaneamente na Home e no seletor do Editor.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {templatesList.map((tmpl, idx) => {
                            const usageCount = telemetry.templateSelections[tmpl.id] || 0;
                            return (
                              <div
                                key={tmpl.id}
                                className={`p-4 rounded-xl border text-xs space-y-3 ${
                                  tmpl.isActive ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-65'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold text-slate-400">
                                        #{tmpl.displayOrder}
                                      </span>
                                      <h4 className="font-bold text-slate-900 text-sm">{tmpl.shortName}</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                      ATS {tmpl.atsScore}% · {usageCount} seleções
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveTemplateOrder(tmpl.id, 'up')}
                                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                                      title="Mover para cima"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === templatesList.length - 1}
                                      onClick={() => handleMoveTemplateOrder(tmpl.id, 'down')}
                                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                                      title="Mover para baixo"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                  <select
                                    value={tmpl.tierRequired}
                                    onChange={(e) => handleTemplateTierChange(tmpl.id, e.target.value as any)}
                                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-xs"
                                  >
                                    <option value="free">Gratuito</option>
                                    <option value="pro">Pro ($8)</option>
                                    <option value="executive">Executivo VIP ($12)</option>
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleTemplate(tmpl.id, tmpl.isActive)}
                                    className={`px-3 py-1 rounded-md font-bold text-[11px] ${
                                      tmpl.isActive
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                  >
                                    {tmpl.isActive ? 'Ativo no Site' : 'Oculto'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {contentSubTab === 'snippets' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="relative flex-1 max-w-sm">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Pesquisar profissão ou área..."
                              value={snippetSearch}
                              onChange={(e) => setSnippetSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewSnippetModal(true)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nova Profissão</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredSnippets.map((snip) => (
                            <div key={snip.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-sm text-slate-900 truncate">{snip.profession}</span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                                    {snip.area}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteProfessionSnippet(snip.id);
                                    setSnippetsList((prev) => prev.filter((s) => s.id !== snip.id));
                                    showNotification('Exemplo de profissão removido.');
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="font-semibold text-slate-700">{snip.sampleTitle}</p>
                              <p className="text-slate-600 italic">"{snip.sampleSummary}"</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {snip.sampleSkills.map((sk, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {contentSubTab === 'locales' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            Gestão Completa de Títulos Fixos em 5 Idiomas
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Todas as 7 secções traduzíveis do currículo são atualizadas em tempo real na pré-visualização A4.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {localesList.map((loc) => (
                            <div key={loc.languageCode} className="p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <span>{loc.flag}</span>
                                  <span>{loc.languageName}</span>
                                  <span className="text-[10px] font-mono uppercase text-slate-400">
                                    ({loc.languageCode})
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await saveSystemLocale(loc);
                                    showNotification(`Títulos em ${loc.languageName} aplicados em produção!`);
                                  }}
                                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md flex items-center gap-1.5"
                                >
                                  <Save className="w-3 h-3 text-amber-400" />
                                  <span>Salvar Idioma</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {([
                                  { field: 'sectionSummary', label: 'Resumo' },
                                  { field: 'sectionExperiences', label: 'Experiência' },
                                  { field: 'sectionEducations', label: 'Formação' },
                                  { field: 'sectionCompetencies', label: 'Competências' },
                                  { field: 'sectionTrainings', label: 'Certificações' },
                                  { field: 'sectionLanguages', label: 'Idiomas' },
                                  { field: 'sectionReferences', label: 'Referências' }
                                ] as const).map((item) => (
                                  <div key={item.field}>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                      {item.label}:
                                    </label>
                                    <input
                                      type="text"
                                      value={loc[item.field] || ''}
                                      onChange={(e) => {
                                        const next = localesList.map((l) =>
                                          l.languageCode === loc.languageCode
                                            ? { ...l, [item.field]: e.target.value }
                                            : l
                                        );
                                        setLocalesList(next);
                                      }}
                                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* MÓDULO 4: UTILIZADORES, CRM 360° & FATURAS */}
                {/* ========================================================= */}
                {activeModule === 'users_support' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs w-fit">
                      <button
                        type="button"
                        onClick={() => setCrmSubTab('users')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          crmSubTab === 'users'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        CRM de Utilizadores ({usersList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCrmSubTab('orders')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          crmSubTab === 'orders'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Faturas, Pedidos &amp; Reembolsos ({ordersList.length})
                      </button>
                    </div>

                    {crmSubTab === 'users' && (
                      <>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Pesquisar por nome, email ou telefone..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <select
                              value={userPlanFilter}
                              onChange={(e) => setUserPlanFilter(e.target.value)}
                              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                            >
                              <option value="all">Todos os Planos</option>
                              <option value="free">Gratuito</option>
                              <option value="pro">Pro ($8)</option>
                              <option value="executive">Executivo VIP ($12)</option>
                            </select>

                            <select
                              value={userStatusFilter}
                              onChange={(e) => setUserStatusFilter(e.target.value)}
                              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                            >
                              <option value="all">Todos Status</option>
                              <option value="active">Ativos</option>
                              <option value="suspended">Suspensos</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportCSV('users')}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>CSV</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowNewUserModal(true)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Novo Cliente</span>
                            </button>
                          </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="p-3">Utilizador &amp; Contacto</th>
                                  <th className="p-3">Plano &amp; Status</th>
                                  <th className="p-3">Créditos IA</th>
                                  <th className="p-3">Docs</th>
                                  <th className="p-3">Ações Rápidas</th>
                                  <th className="p-3 text-right">CRM 360° &amp; Suporte</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                                      Nenhum utilizador encontrado com os filtros selecionados.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900">{u.name}</span>
                                          {u.role === 'admin' && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 text-[9px] font-bold uppercase">
                                              Admin
                                            </span>
                                          )}
                                        </div>
                                        <div className="font-mono text-[11px] text-slate-500">{u.email}</div>
                                        {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                                      </td>

                                      <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              u.plan === 'executive'
                                                ? 'bg-purple-100 text-purple-800'
                                                : u.plan === 'pro'
                                                ? 'bg-amber-100 text-amber-900'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                          >
                                            {u.plan}
                                          </span>
                                          {u.status === 'suspended' && (
                                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                              Suspenso
                                            </span>
                                          )}
                                        </div>
                                        {u.subscriptionExpiresAt && (
                                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                            Exp: {new Date(u.subscriptionExpiresAt).toLocaleDateString('pt-PT')}
                                          </div>
                                        )}
                                      </td>

                                      <td className="p-3 font-mono font-bold tabular-nums text-slate-800">
                                        {u.creditsRemaining ?? 5}
                                      </td>

                                      <td className="p-3 font-mono font-bold tabular-nums text-slate-800">
                                        {u.totalCvGenerated ?? 0}
                                      </td>

                                      <td className="p-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAddCredits(u.id, 50)}
                                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded text-[10px]"
                                          >
                                            +50 Créd
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleExtendSubscription(u.id, 30)}
                                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded text-[10px]"
                                          >
                                            +30d Pro
                                          </button>
                                        </div>
                                      </td>

                                      <td className="p-3 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => openUserDrawer(u)}
                                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded text-[11px] inline-flex items-center gap-1"
                                          >
                                            <UserCog className="w-3.5 h-3.5" />
                                            <span>Inspecionar 360°</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setImpersonatingTargetUser(u)}
                                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[11px] inline-flex items-center gap-1"
                                            title="Entrar na conta com registo de auditoria"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Personificar</span>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}

                    {crmSubTab === 'orders' && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Pesquisar fatura, cliente ou email..."
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <select
                              value={orderStatusFilter}
                              onChange={(e) => setOrderStatusFilter(e.target.value)}
                              className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                            >
                              <option value="all">Todos Status</option>
                              <option value="paid">Pagas</option>
                              <option value="pending">Pendentes</option>
                              <option value="refunded">Reembolsadas</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportCSV('orders')}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>CSV Faturas</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowNewOrderModal(true)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registar Venda</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="p-3">Fatura</th>
                                  <th className="p-3">Cliente</th>
                                  <th className="p-3">Plano / Ciclo</th>
                                  <th className="p-3">Valor</th>
                                  <th className="p-3">Método</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredOrders.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                                      Nenhuma fatura ou transação registada até o momento.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50/70">
                                      <td className="p-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                                      <td className="p-3">
                                        <div className="font-semibold text-slate-900">{o.userName}</div>
                                        <div className="text-[11px] font-mono text-slate-500">{o.userEmail}</div>
                                      </td>
                                      <td className="p-3 uppercase font-mono text-[11px]">
                                        {o.plan} · {formatCycleLabel(o.billingCycle)}
                                      </td>
                                      <td className="p-3 font-mono font-bold tabular-nums text-slate-900">
                                        {o.currency === 'BRL' ? `R$ ${Number(o.amount).toFixed(2)}` : `$${o.amount} ${o.currency}`}
                                      </td>
                                      <td className="p-3 uppercase text-[10px] font-mono text-slate-600">
                                        {o.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO'}
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            o.status === 'paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : o.status === 'refunded'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {o.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedInvoice(o)}
                                          className="px-2 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                                        >
                                          <Receipt className="w-3 h-3" />
                                          <span>Recibo</span>
                                        </button>
                                        {o.status === 'pending' && (
                                          <button
                                            type="button"
                                            onClick={() => handleApproveOrder(o)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Aprovar &amp; Ativar</span>
                                          </button>
                                        )}
                                        {o.status === 'paid' && (
                                          <button
                                            type="button"
                                            onClick={() => handleRefundOrder(o)}
                                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-bold"
                                          >
                                            Reembolsar
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* MÓDULO 5: MONETIZAÇÃO, PLANOS AO VIVO, CUPONS & AVISOS */}
                {/* ========================================================= */}
                {activeModule === 'pricing_marketing' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs w-fit">
                      <button
                        type="button"
                        onClick={() => setMonetizationSubTab('plans')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          monetizationSubTab === 'plans'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Editor de Planos &amp; Preços ($8 / $12)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonetizationSubTab('coupons')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          monetizationSubTab === 'coupons'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Cupons &amp; Campanhas ({couponsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonetizationSubTab('banners')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          monetizationSubTab === 'banners'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Banners &amp; Avisos In-App ({bannersList.length})
                      </button>
                    </div>

                    {monetizationSubTab === 'plans' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {editablePlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div>
                                <span className="font-mono text-[10px] font-bold uppercase text-amber-600">
                                  ID: {plan.id}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[11px] font-semibold text-slate-600">Destaque Popular</span>
                                <input
                                  type="checkbox"
                                  checked={plan.isPopular}
                                  onChange={(e) =>
                                    setEditablePlans((prev) =>
                                      prev.map((p) => (p.id === plan.id ? { ...p, isPopular: e.target.checked } : p))
                                    )
                                  }
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Nome Público do Plano</label>
                                <input
                                  type="text"
                                  value={plan.name}
                                  onChange={(e) =>
                                    setEditablePlans((prev) =>
                                      prev.map((p) => (p.id === plan.id ? { ...p, name: e.target.value } : p))
                                    )
                                  }
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Badge Promocional</label>
                                <input
                                  type="text"
                                  value={plan.badgeText}
                                  onChange={(e) =>
                                    setEditablePlans((prev) =>
                                      prev.map((p) => (p.id === plan.id ? { ...p, badgeText: e.target.value } : p))
                                    )
                                  }
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  Preços nos 4 Ciclos (USD)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditablePlans((prev) =>
                                      prev.map((p) =>
                                        p.id === plan.id
                                          ? {
                                              ...p,
                                              priceQuarterlyValue: getDefaultCyclePriceUSD(
                                                p.priceMonthlyValue,
                                                'quarterly'
                                              ),
                                              priceSemiannualValue: getDefaultCyclePriceUSD(
                                                p.priceMonthlyValue,
                                                'semiannual'
                                              ),
                                              priceYearlyValue: getDefaultCyclePriceUSD(
                                                p.priceMonthlyValue,
                                                'yearly'
                                              )
                                            }
                                          : p
                                      )
                                    )
                                  }
                                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                                >
                                  Recalcular descontos (-10% / -18% / -25%)
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Mensal</label>
                                  <input
                                    type="number"
                                    min={1}
                                    step={0.5}
                                    value={plan.priceMonthlyValue}
                                    onChange={(e) =>
                                      setEditablePlans((prev) =>
                                        prev.map((p) =>
                                          p.id === plan.id ? { ...p, priceMonthlyValue: Number(e.target.value) } : p
                                        )
                                      )
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Trimestral</label>
                                  <input
                                    type="number"
                                    min={1}
                                    step={0.01}
                                    value={
                                      plan.priceQuarterlyValue ??
                                      getDefaultCyclePriceUSD(plan.priceMonthlyValue, 'quarterly')
                                    }
                                    onChange={(e) =>
                                      setEditablePlans((prev) =>
                                        prev.map((p) =>
                                          p.id === plan.id ? { ...p, priceQuarterlyValue: Number(e.target.value) } : p
                                        )
                                      )
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Semestral</label>
                                  <input
                                    type="number"
                                    min={1}
                                    step={0.01}
                                    value={
                                      plan.priceSemiannualValue ??
                                      getDefaultCyclePriceUSD(plan.priceMonthlyValue, 'semiannual')
                                    }
                                    onChange={(e) =>
                                      setEditablePlans((prev) =>
                                        prev.map((p) =>
                                          p.id === plan.id ? { ...p, priceSemiannualValue: Number(e.target.value) } : p
                                        )
                                      )
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Anual</label>
                                  <input
                                    type="number"
                                    min={1}
                                    step={0.5}
                                    value={plan.priceYearlyValue}
                                    onChange={(e) =>
                                      setEditablePlans((prev) =>
                                        prev.map((p) =>
                                          p.id === plan.id ? { ...p, priceYearlyValue: Number(e.target.value) } : p
                                        )
                                      )
                                    }
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Descrição / Subtítulo</label>
                              <input
                                type="text"
                                value={plan.tagline}
                                onChange={(e) =>
                                  setEditablePlans((prev) =>
                                    prev.map((p) => (p.id === plan.id ? { ...p, tagline: e.target.value } : p))
                                  )
                                }
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Lista de Benefícios (1 por linha)
                              </label>
                              <textarea
                                rows={5}
                                value={plan.features.join('\n')}
                                onChange={(e) =>
                                  setEditablePlans((prev) =>
                                    prev.map((p) =>
                                      p.id === plan.id
                                        ? {
                                            ...p,
                                            features: e.target.value
                                              .split('\n')
                                              .map((s) => s.trim())
                                              .filter(Boolean)
                                          }
                                        : p
                                    )
                                  )
                                }
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg leading-relaxed"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await saveEditablePlan(plan);
                                showNotification(`Plano ${plan.name} ($${plan.priceMonthlyValue}) publicado ao vivo no frontend!`);
                              }}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                            >
                              <Save className="w-3.5 h-3.5 text-amber-400" />
                              <span>Guardar &amp; Publicar no Site</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {monetizationSubTab === 'coupons' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Gerador de Códigos Promocionais</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Validado automaticamente no checkout com controlo de validade e limite de usos.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewCouponModal(true)}
                            className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Criar Cupom</span>
                          </button>
                        </div>

                        {couponsList.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                            Nenhum cupom promocional criado. Clique em &quot;Criar Cupom&quot; para lançar uma campanha real.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {couponsList.map((cp) => {
                              const pct = Math.min(100, Math.round((cp.usedCount / Math.max(cp.maxUses, 1)) * 100));
                              return (
                                <div key={cp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-slate-900 text-sm">{cp.code}</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                                      {cp.discountPercent}% OFF
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                                      <span>Usos: {cp.usedCount} / {cp.maxUses}</span>
                                      <span>Exp: {cp.expiresAt ? new Date(cp.expiresAt).toLocaleDateString('pt-PT') : 'Sem limite'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await toggleCouponActive(cp.id, cp.active);
                                        setCouponsList((prev) =>
                                          prev.map((item) => (item.id === cp.id ? { ...item, active: !cp.active } : item))
                                        );
                                        showNotification(`Cupom ${cp.code} ${!cp.active ? 'ATIVADO' : 'PAUSADO'}.`);
                                      }}
                                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                                        cp.active ? 'bg-slate-200 text-slate-700' : 'bg-emerald-600 text-white'
                                      }`}
                                    >
                                      {cp.active ? 'Pausar' : 'Ativar'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await deleteCoupon(cp.id);
                                        setCouponsList((prev) => prev.filter((item) => item.id !== cp.id));
                                        showNotification(`Cupom ${cp.code} eliminado.`);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {monetizationSubTab === 'banners' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Banners e Avisos Transversais no App</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Exibidos em tempo real no topo da plataforma para o público-alvo configurado.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewBannerModal(true)}
                            className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo Banner</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {bannersList.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                              Nenhum banner ou aviso transversal ativo. Clique em &quot;Novo Banner&quot; para publicar um comunicado real no aplicativo.
                            </div>
                          ) : (
                            bannersList.map((banner) => (
                              <div key={banner.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{banner.title}</span>
                                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-blue-100 text-blue-800">
                                      {banner.type}
                                    </span>
                                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-slate-200 text-slate-700">
                                      Público: {banner.targetAudience}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const next = { ...banner, active: !banner.active };
                                        await saveSystemBanner(next);
                                        setBannersList((prev) => prev.map((b) => (b.id === banner.id ? next : b)));
                                        showNotification(`Banner ${next.active ? 'ATIVADO' : 'PAUSADO'}.`);
                                      }}
                                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                                        banner.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {banner.active ? 'Ativo' : 'Pausado'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await deleteSystemBanner(banner.id);
                                        setBannersList((prev) => prev.filter((b) => b.id !== banner.id));
                                        showNotification('Banner removido.');
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-slate-600">{banner.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* MÓDULO 6: SEGURANÇA, RGPD, RBAC & GOVERNANÇA GLOBAL */}
                {/* ========================================================= */}
                {activeModule === 'security_monitoring' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs w-fit">
                      <button
                        type="button"
                        onClick={() => setSecuritySubTab('governance')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          securitySubTab === 'governance'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Governança Global da Plataforma
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecuritySubTab('error_logs')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          securitySubTab === 'error_logs'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Logs Técnicos ({unresolvedErrorsCount} pendentes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecuritySubTab('gdpr')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          securitySubTab === 'gdpr'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        RGPD / LGPD ({pendingGdprCount} pendentes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecuritySubTab('rbac')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          securitySubTab === 'rbac'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        RBAC &amp; Auditoria Impersonate
                      </button>
                    </div>

                    {securitySubTab === 'governance' && platformSettings && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Interruptores Globais de Governança (Propagação Instantânea)
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Controle acesso, manutenção, registos, exportações e chamadas de IA em toda a plataforma.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await savePlatformSettings({
                                ...platformSettings,
                                updatedBy: user?.email || 'admin'
                              });
                              emitAdminConfigUpdated('platform');
                              showNotification('Configurações globais aplicadas em toda a plataforma!');
                            }}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>Guardar Governança</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="font-bold text-slate-900 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-amber-600" />
                                <span>Modo de Manutenção (Bloqueia Não-Admins)</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={platformSettings.maintenanceMode}
                                onChange={(e) =>
                                  setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                                }
                              />
                            </label>
                            <textarea
                              rows={2}
                              value={platformSettings.maintenanceMessage}
                              onChange={(e) =>
                                setPlatformSettings({ ...platformSettings, maintenanceMessage: e.target.value })
                              }
                              placeholder="Mensagem exibida aos visitantes durante manutenção..."
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                              <div>
                                <span className="font-bold text-slate-900 block">Permitir Novos Registos</span>
                                <span className="text-[11px] text-slate-500">
                                  Se desativado, bloqueia criação de novas contas no AuthModal.
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={platformSettings.allowNewRegistrations}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    allowNewRegistrations: e.target.checked
                                  })
                                }
                              />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  Exigir Plano Pago para Exportar Word/PDF
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Desative para liberar exportações gratuitas em campanhas abertas.
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={platformSettings.requirePaidPlanForExport}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    requirePaidPlanForExport: e.target.checked
                                  })
                                }
                              />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  Ativar Recursos de IA (Gemini) Globalmente
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Kill-switch de emergência caso haja instabilidade na API Gemini.
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={platformSettings.enableAiFeaturesGlobally}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    enableAiFeaturesGlobally: e.target.checked
                                  })
                                }
                              />
                            </label>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              Limite Diário de Chamadas IA (Plano Gratuito)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Controla o máximo de execuções gratuitas por dia para evitar sobrecarga de custos.
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={platformSettings.maxDailyFreeAiCalls}
                            onChange={(e) =>
                              setPlatformSettings({
                                ...platformSettings,
                                maxDailyFreeAiCalls: Number(e.target.value)
                              })
                            }
                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-center"
                          />
                        </div>

                        {/* Personal Pix Key Configuration Card */}
                        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5">
                            <div>
                              <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                                <QrCode className="w-4 h-4 text-teal-700" />
                                <span>Sua Chave Pix Pessoal (Recebimentos Diretos)</span>
                              </h4>
                              <p className="text-[11px] text-teal-900/80 mt-0.5">
                                Configure a sua chave Pix fixa (CPF, E-mail, Telefone, CNPJ ou Chave EVP) e o QR Code
                                oficial exibido no checkout será atualizado imediatamente.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Tipo da Chave</label>
                              <select
                                value={platformSettings.pixKeyType || 'evp'}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    pixKeyType: e.target.value as PixKeyType
                                  })
                                }
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                              >
                                <option value="cpf">CPF</option>
                                <option value="email">E-mail</option>
                                <option value="phone">Telefone (+55)</option>
                                <option value="cnpj">CNPJ</option>
                                <option value="evp">Chave EVP</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-slate-700 block mb-1">Sua Chave Pix</label>
                              <input
                                type="text"
                                value={platformSettings.pixKey || ''}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    pixKey: e.target.value
                                  })
                                }
                                placeholder="Ex: seuemail@dominio.com ou 123.456.789-00"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Cidade</label>
                              <input
                                type="text"
                                maxLength={15}
                                value={platformSettings.pixCity || 'SAO PAULO'}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    pixCity: e.target.value
                                  })
                                }
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">
                                Nome do Beneficiário (máx. 25 caracteres)
                              </label>
                              <input
                                type="text"
                                maxLength={25}
                                value={platformSettings.pixBeneficiaryName || ''}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    pixBeneficiaryName: e.target.value
                                  })
                                }
                                placeholder="Ex: SEU NOME OU EMPRESA"
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  await savePlatformSettings({
                                    ...platformSettings,
                                    updatedBy: user?.email || 'admin'
                                  });
                                  emitAdminConfigUpdated('platform');
                                  showNotification('Chave Pix pessoal e configurações salvas ao vivo!');
                                }}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Guardar Chave Pix</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {securitySubTab === 'error_logs' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setErrorFilterMode('all')}
                              className={`px-3 py-1 rounded-md text-xs font-bold ${
                                errorFilterMode === 'all'
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Todos ({errorLogsList.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setErrorFilterMode('unresolved')}
                              className={`px-3 py-1 rounded-md text-xs font-bold ${
                                errorFilterMode === 'unresolved'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Pendentes ({unresolvedErrorsCount})
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExportCSV('errors')}
                            className="px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exportar Logs CSV</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {filteredErrorLogs.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                              Nenhum erro técnico registado — a operação encontra-se estável.
                            </div>
                          ) : (
                            filteredErrorLogs.map((err) => (
                              <div
                                key={err.id}
                                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                  err.resolved ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-rose-50/50 border-rose-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 uppercase">
                                      {err.operationType}
                                    </span>
                                    {err.userEmail && (
                                      <span className="font-mono text-[11px] text-slate-500">{err.userEmail}</span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(err.timestamp).toLocaleString('pt-PT')}
                                    </span>
                                  </div>
                                  {!err.resolved ? (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await resolveErrorLog(err.id, user?.email || 'admin');
                                        setErrorLogsList((prev) =>
                                          prev.map((e) => (e.id === err.id ? { ...e, resolved: true } : e))
                                        );
                                        showNotification('Log técnico marcado como resolvido.');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px]"
                                    >
                                      Marcar Resolvido
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-emerald-700 font-bold">✓ Resolvido</span>
                                  )}
                                </div>
                                <p className="font-mono text-slate-700 text-[11px]">{err.errorMessage}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {securitySubTab === 'gdpr' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            Processamento Real RGPD / LGPD (Art. 17 &amp; Portabilidade)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Exporte pacotes JSON completos de titulares ou execute anonimização/eliminação no Firestore.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {gdprList.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                              Nenhum pedido RGPD submetido pelos titulares até o momento.
                            </div>
                          ) : (
                            gdprList.map((g) => (
                              <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-slate-900">{g.userEmail}</span>
                                    <span className="ml-2 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200">
                                      {g.requestType}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      g.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {g.status}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                  {g.notes || 'Pedido submetido pelo titular da conta.'}
                                </p>

                                <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleExportGdprJson(g)}
                                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1.5"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Exportar JSON</span>
                                  </button>
                                  {g.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleAnonymizeGdpr(g)}
                                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[11px]"
                                      >
                                        Anonimizar Dados
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGdpr(g)}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px]"
                                      >
                                        Eliminar Conta
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {securitySubTab === 'rbac' && (
                      <div className="space-y-5">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold text-slate-900">Matriz de Acessos da Equipa (RBAC)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {DEFAULT_RBAC_PERMISSIONS.map((p) => (
                              <div key={p.role} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                <span className="font-bold text-slate-900 text-sm block">{p.title}</span>
                                <p className="text-slate-500 text-[11px]">{p.description}</p>
                                <ul className="text-[11px] space-y-1 pt-2 border-t border-slate-200 text-slate-700 font-mono">
                                  <li>Financeiro: {p.canViewFinances ? '✓ Sim' : '✗ Não'}</li>
                                  <li>Prompts IA: {p.canEditPrompts ? '✓ Sim' : '✗ Não'}</li>
                                  <li>Templates: {p.canManageTemplates ? '✓ Sim' : '✗ Não'}</li>
                                  <li>Personificação: {p.canImpersonateUsers ? '✓ Sim' : '✗ Não'}</li>
                                  <li>Reembolsos: {p.canRefundOrders ? '✓ Sim' : '✗ Não'}</li>
                                  <li>RGPD: {p.canProcessGdpr ? '✓ Sim' : '✗ Não'}</li>
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            Registo de Auditoria de Personificação (Impersonate)
                          </h3>
                          <div className="space-y-2">
                            {impersonationLogs.length === 0 ? (
                              <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                                Nenhuma sessão de personificação registada.
                              </div>
                            ) : (
                              impersonationLogs.map((log: any) => (
                                <div
                                  key={log.id}
                                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-bold text-slate-900">{log.adminEmail}</span>
                                    <span className="text-slate-400 mx-1.5">→</span>
                                    <span className="font-mono text-purple-700 font-bold">{log.targetUserEmail}</span>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(log.timestamp).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER: USER 360° CRM INSPECTOR */}
      {/* ========================================================= */}
      {inspectedUser && (
        <div className="fixed inset-0 z-70 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ficha CRM 360° do Cliente
                </span>
                <h3 className="text-base font-extrabold text-slate-900">{inspectedUser.name}</h3>
                <p className="text-xs font-mono text-slate-500">{inspectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Quick KPI Strip */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Créditos IA</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {inspectedUser.creditsRemaining ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">CVs Gerados</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {inspectedUser.totalCvGenerated ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Ciclo</span>
                  <span className="text-xs font-bold uppercase text-slate-900 mt-1 block">
                    {formatCycleLabel(inspectedUser.billingCycle)}
                  </span>
                </div>
              </div>

              {/* Manual Plan, Role & Status Editor */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Configuração de Acesso &amp; Notas CRM
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Plano</label>
                    <select
                      value={drawerPlan}
                      onChange={(e) => setDrawerPlan(e.target.value as SubscriptionPlan)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="free">Gratuito</option>
                      <option value="pro">Pro</option>
                      <option value="executive">Executivo VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Permissão</label>
                    <select
                      value={drawerRole}
                      onChange={(e) => setDrawerRole(e.target.value as UserRole)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="user">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Status</label>
                    <select
                      value={drawerStatus}
                      onChange={(e) => setDrawerStatus(e.target.value as UserStatus)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="active">Ativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Notas Internas de Suporte / CRM
                  </label>
                  <textarea
                    rows={3}
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                    placeholder="Registe observações de suporte, acordos comerciais ou histórico..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveUserDrawer}
                  disabled={isSavingDrawer}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSavingDrawer ? 'A Guardar...' : 'Guardar Alterações CRM'}</span>
                </button>
              </div>

              {/* Support Action Buttons */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Ações Rápidas de Suporte
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddCredits(inspectedUser.id, 50)}
                    className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg border border-purple-200"
                  >
                    +50 Créditos Cortesia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendSubscription(inspectedUser.id, 30)}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200"
                  >
                    Estender +30 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetCredits(inspectedUser.id, 5)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200"
                  >
                    Redefinir Créditos (5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpersonatingTargetUser(inspectedUser)}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Personificar Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSuspendUser(inspectedUser)}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-200 flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{inspectedUser.status === 'suspended' ? 'Reativar Conta' : 'Suspender Conta'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUserAccount(inspectedUser)}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Conta</span>
                  </button>
                </div>
              </div>

              {/* Billing History for this User */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Histórico de Faturas &amp; Pagamentos
                </h4>
                {(() => {
                  const userOrders = ordersList.filter(
                    (o) =>
                      o.userId === inspectedUser.id ||
                      o.userEmail.toLowerCase() === inspectedUser.email.toLowerCase()
                  );
                  if (userOrders.length === 0) {
                    return (
                      <p className="text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        Nenhuma transação registada para este utilizador.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {userOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                            <span className="ml-2 text-slate-500">
                              {ord.plan.toUpperCase()} · {new Date(ord.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono font-bold">
                            <span>${ord.amount}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                                ord.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPERSONATE CONFIRMATION */}
      {impersonatingTargetUser && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Iniciar Sessão de Personificação</h3>
                <p className="text-slate-500 text-[11px]">Acesso com registo estrito de auditoria</p>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl text-purple-900 border border-purple-200 leading-relaxed">
              Entrará como <strong>{impersonatingTargetUser.name}</strong> ({impersonatingTargetUser.email}) para
              reproduzir o ecrã exato do cliente.
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Motivo do Suporte / Auditoria:</label>
              <input
                type="text"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImpersonatingTargetUser(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleStartImpersonate(impersonatingTargetUser)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg"
              >
                Confirmar &amp; Entrar na Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL USER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Criar Novo Utilizador</h3>
              <button type="button" onClick={() => setShowNewUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createManualCustomer({
                  name: newUserForm.name,
                  email: newUserForm.email,
                  plan: newUserForm.plan,
                  phone: newUserForm.phone,
                  role: newUserForm.role,
                  creditsRemaining: newUserForm.credits,
                  notes: newUserForm.notes
                });
                setShowNewUserModal(false);
                loadAllModules();
                showNotification(`Utilizador ${newUserForm.name} cadastrado!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plano Inicial</label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value as SubscriptionPlan })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="free">Gratuito</option>
                    <option value="pro">Pro ($8)</option>
                    <option value="executive">Executivo VIP ($12)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Perfil (Role)</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="user">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">
                  Criar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL ORDER */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Registar Venda / Fatura Manual</h3>
              <button type="button" onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.userName}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, userName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">E-mail do Cliente</label>
                <input
                  type="email"
                  required
                  value={newOrderForm.userEmail}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, userEmail: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plano</label>
                  <select
                    value={newOrderForm.plan}
                    onChange={(e) => {
                      const pl = e.target.value as SubscriptionPlan;
                      const srcPlan = editablePlans.find((p) => p.id === pl);
                      setNewOrderForm({
                        ...newOrderForm,
                        plan: pl,
                        amount: getCyclePriceUSD(srcPlan || { id: pl }, newOrderForm.billingCycle)
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="pro">Profissional Pro</option>
                    <option value="executive">Executivo VIP</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ciclo</label>
                  <select
                    value={newOrderForm.billingCycle}
                    onChange={(e) => {
                      const cyc = e.target.value as BillingCycle;
                      const srcPlan = editablePlans.find((p) => p.id === newOrderForm.plan);
                      setNewOrderForm({
                        ...newOrderForm,
                        billingCycle: cyc,
                        amount: getCyclePriceUSD(srcPlan || { id: newOrderForm.plan }, cyc)
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {BILLING_CYCLES.map((c) => (
                      <option key={c} value={c}>
                        {BILLING_CYCLE_META[c].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor USD</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrderForm.amount}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Método</label>
                  <select
                    value={newOrderForm.paymentMethod}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="card">Cartão de Crédito/Débito</option>
                    <option value="pix">PIX Instantâneo</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg">
                  Registar &amp; Ativar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVOICE PREVIEW */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Comprovativo Oficial</span>
                <h3 className="text-base font-black font-mono text-slate-900">{selectedInvoice.orderNumber}</h3>
              </div>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <strong className="text-slate-900">{selectedInvoice.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">E-mail:</span>
                <span className="font-mono text-slate-700">{selectedInvoice.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Subscrito:</span>
                <strong className="uppercase">
                  {selectedInvoice.plan} ({formatCycleLabel(selectedInvoice.billingCycle)})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método / Canal:</span>
                <span className="uppercase font-mono">
                  {selectedInvoice.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                <span className="font-bold text-slate-700">Total Liquidado:</span>
                <strong className="font-mono text-slate-950">
                  {selectedInvoice.currency === 'BRL'
                    ? `R$ ${Number(selectedInvoice.amount).toFixed(2)} BRL`
                    : `$${selectedInvoice.amount} ${selectedInvoice.currency}`}
                </strong>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COUPON */}
      {showNewCouponModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Criar Novo Cupom</h3>
              <button type="button" onClick={() => setShowNewCouponModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Código do Cupom</label>
                <input
                  type="text"
                  required
                  placeholder="EX: PROMO50"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Desc. (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={newCouponForm.discountPercent}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountPercent: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Usos</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newCouponForm.maxUses}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxUses: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validade (d)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newCouponForm.expiresDays}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, expiresDays: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCouponModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">
                  Ativar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BANNER */}
      {showNewBannerModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Publicar Banner / Aviso</h3>
              <button type="button" onClick={() => setShowNewBannerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBannerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newBannerForm.title}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mensagem</label>
                <textarea
                  rows={3}
                  required
                  value={newBannerForm.message}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, message: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo</label>
                  <select
                    value={newBannerForm.type}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="info">Informativo</option>
                    <option value="promo">Promoção</option>
                    <option value="warning">Aviso Importante</option>
                    <option value="maintenance">Manutenção</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Público-Alvo</label>
                  <select
                    value={newBannerForm.targetAudience}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, targetAudience: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="all">Todos</option>
                    <option value="free_only">Apenas Gratuito</option>
                    <option value="paid_only">Apenas Pagos</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBannerModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROFESSION SNIPPET */}
      {showNewSnippetModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Adicionar Exemplo de Profissão</h3>
              <button type="button" onClick={() => setShowNewSnippetModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnippetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Profissão / Cargo</label>
                <input
                  type="text"
                  required
                  value={newSnippetForm.profession}
                  onChange={(e) => setNewSnippetForm({ ...newSnippetForm, profession: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Área</label>
                <select
                  value={newSnippetForm.area}
                  onChange={(e) => setNewSnippetForm({ ...newSnippetForm, area: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Gestão & Executivo">Gestão &amp; Executivo</option>
                  <option value="Finanças">Finanças</option>
                  <option value="Operações">Operações</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Engenharia">Engenharia</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resumo Executivo</label>
                <textarea
                  rows={2}
                  required
                  value={newSnippetForm.sampleSummary}
                  onChange={(e) => setNewSnippetForm({ ...newSnippetForm, sampleSummary: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tópicos de Conquista (1 por linha)
                </label>
                <textarea
                  rows={2}
                  value={newSnippetForm.sampleBullets}
                  onChange={(e) => setNewSnippetForm({ ...newSnippetForm, sampleBullets: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Competências (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={newSnippetForm.sampleSkills}
                  onChange={(e) => setNewSnippetForm({ ...newSnippetForm, sampleSkills: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSnippetModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">
                  Salvar Exemplo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
