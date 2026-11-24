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
  ADMIN_EMAILS,
  fetchAdminUserResumes,
  AdminUserResumeSummary
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
  fetchServerTelemetry,
  fetchAiHealthStatus,
  AiLiveHealthSnapshot,
  emitAdminConfigUpdated
} from '../services/adminModulesService';
import {
  fetchAdminSupportThreads,
  sendAdminSupportReply,
  markAdminSupportThreadRead,
  updateAdminSupportThreadStatus,
  subscribeSupportChatWebSocket,
  subscribeAdminFirestoreSupportThreads,
  SupportWsStatus
} from '../services/supportChatService';
import {
  User,
  SaaSOrder,
  SaaSCoupon,
  SubscriptionPlan,
  BillingCycle,
  OrderStatus,
  PaymentMethod,
  UserRole,
  UserStatus,
  SupportChatThread
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
  FinancialMetrics,
  SecurityAuditLog,
  AuditLogCategory,
  AuditLogSeverity,
  AuditLogStatus
} from '../types/adminModules';
import {
  fetchAuditLogs,
  recordAuditLog,
  subscribeToAuditLogs,
  isCriticalAuditLog,
  mergeAuditLogLists,
  AuditStreamStatus
} from '../services/auditLogService';
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
  UserCog,
  Globe,
  QrCode,
  Edit3,
  CreditCard,
  Copy,
  MessageCircle,
  Send,
  FileText,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import {
  AdminFinancialCharts,
  MonthlyMrrPoint,
  ChurnCohortPoint,
  TierAiEconomicsPoint,
  SubscriberAiCostRow
} from './AdminFinancialCharts';

interface SaaSAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AdminActiveModule =
  | 'financial'
  | 'ai_prompts'
  | 'templates_content'
  | 'users_support'
  | 'support_chat'
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
  support_chat: {
    label: '5. Chat de Suporte & Atendimento',
    shortLabel: 'Chat de Suporte',
    subtitle: 'Conversas em tempo real com utilizadores registados e respostas de Admin/Moderador'
  },
  pricing_marketing: {
    label: '6. Monetização, Planos & Campanhas',
    shortLabel: 'Planos & Marketing',
    subtitle: 'Edição ao vivo de preços, cupons promocionais e avisos transversais'
  },
  security_monitoring: {
    label: '7. Segurança, RGPD & Governança',
    shortLabel: 'Segurança & Governança',
    subtitle: 'Modo manutenção, controlo global, logs de auditoria Firestore, RGPD e RBAC'
  }
};

const ADMIN_AUDIT_ACTION_LABELS: Record<string, string> = {
  subscription_upgraded: 'Upgrade / Ativação de Subscrição',
  subscription_canceled: 'Cancelamento de Subscrição',
  subscription_plan_sync_blocked: 'Tentativa Bloqueada de Alteração de Plano',
  payment_order_created: 'Pedido / Fatura Criada',
  payment_order_status_changed: 'Estado de Pagamento Alterado',
  cv_exported_pdf: 'Exportação de CV (PDF)',
  cv_exported_docx: 'Exportação de CV (Word .docx)',
  cv_exported_json: 'Exportação de CV (JSON)',
  cv_export_blocked_unauthorized: 'Exportação de CV Bloqueada',
  profile_updated: 'Edição de Perfil',
  password_changed: 'Alteração de Palavra-passe',
  account_login: 'Início de Sessão',
  account_registered: 'Registo de Nova Conta',
  gdpr_request_submitted: 'Pedido RGPD / LGPD',
  unauthorized_access_attempt: 'Acesso Não Autorizado Bloqueado',
  admin_user_modified: 'Alteração Administrativa de Utilizador',
  impersonation_event: 'Sessão de Personificação'
};

const ADMIN_AUDIT_CATEGORY_LABELS: Record<AuditLogCategory, string> = {
  subscription: 'Subscrições',
  cv_export: 'Exportações CV',
  profile: 'Perfil & Acesso',
  security: 'Segurança / Bloqueios',
  admin: 'Administração'
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
  const [securitySubTab, setSecuritySubTab] = useState<'governance' | 'audit_logs' | 'error_logs' | 'gdpr' | 'rbac'>(
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
  const [auditLogsList, setAuditLogsList] = useState<SecurityAuditLog[]>([]);
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
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [templateVisibilityFilter, setTemplateVisibilityFilter] = useState<'all' | 'ats' | 'photo' | 'hidden'>('all');
  const [editingTemplate, setEditingTemplate] = useState<TemplateAdminItem | null>(null);
  const [snippetSearch, setSnippetSearch] = useState<string>('');
  const [errorFilterMode, setErrorFilterMode] = useState<'all' | 'unresolved'>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'all' | AuditLogCategory>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | AuditLogStatus>('all');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<'all' | AuditLogSeverity>('all');
  const [auditCriticalOnly, setAuditCriticalOnly] = useState<boolean>(true);
  const [auditLiveStatus, setAuditLiveStatus] = useState<AuditStreamStatus>('connecting');
  const [auditLiveLastAt, setAuditLiveLastAt] = useState<string | null>(null);
  const [auditLiveError, setAuditLiveError] = useState<string | null>(null);
  const unauthorizedAuditRecordedRef = React.useRef<boolean>(false);

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
  const [drawerResumes, setDrawerResumes] = useState<AdminUserResumeSummary[]>([]);
  const [isLoadingDrawerResumes, setIsLoadingDrawerResumes] = useState<boolean>(false);

  // Live AI Health & Support Chat States
  const [aiLiveHealth, setAiLiveHealth] = useState<AiLiveHealthSnapshot | null>(null);
  const [isProbingAiHealth, setIsProbingAiHealth] = useState<boolean>(false);
  const [supportThreads, setSupportThreads] = useState<SupportChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState<string>('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'open' | 'resolved'>('all');
  const [adminChatReply, setAdminChatReply] = useState<string>('');
  const [isSendingChatReply, setIsSendingChatReply] = useState<boolean>(false);
  const [supportWsStatus, setSupportWsStatus] = useState<SupportWsStatus>('connecting');
  const adminChatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Inner Modals
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [newUserError, setNewUserError] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [showNewCouponModal, setShowNewCouponModal] = useState<boolean>(false);
  const [showNewBannerModal, setShowNewBannerModal] = useState<boolean>(false);
  const [showNewSnippetModal, setShowNewSnippetModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSOrder | null>(null);
  const [cardGatewayHealth, setCardGatewayHealth] = useState<{
    ready: boolean;
    secretMode?: string;
    publishableMode?: string;
    keysMatchMode?: boolean;
    apiReachable?: boolean;
    error?: string;
  } | null>(null);
  const [invoiceReceiptPreviewUrl, setInvoiceReceiptPreviewUrl] = useState<string | null>(null);
  const [invoiceReceiptMime, setInvoiceReceiptMime] = useState<string>('');
  const [invoiceReceiptLoading, setInvoiceReceiptLoading] = useState<boolean>(false);
  const [invoiceReceiptError, setInvoiceReceiptError] = useState<string | null>(null);
  const [impersonatingTargetUser, setImpersonatingTargetUser] = useState<User | null>(null);
  const [impersonateReason, setImpersonateReason] = useState<string>('Diagnóstico de layout reportado pelo cliente');
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isRunningConfirm, setIsRunningConfirm] = useState<boolean>(false);

  // Form States
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
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
        impLogs,
        auditLogs,
        serverTelemetry,
        liveHealth,
        chatResp
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
        fetchImpersonationLogsAsync(),
        fetchAuditLogs(),
        fetchServerTelemetry(),
        fetchAiHealthStatus(false),
        fetchAdminSupportThreads().catch(() => ({ threads: [] as SupportChatThread[], unreadTotal: 0 }))
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
      setAuditLogsList((prev) => mergeAuditLogLists(auditLogs, prev));
      setGdprList(gdpr);
      setEditablePlans(plans);
      setPlatformSettings(settings);
      setImpersonationLogs(impLogs);
      setTelemetry(serverTelemetry);
      if (liveHealth) setAiLiveHealth(liveHealth);
      if (Array.isArray(chatResp?.threads)) {
        const validThreads = chatResp.threads.filter((t): t is SupportChatThread => Boolean(t && t.id));
        setSupportThreads(validThreads);
        if (!selectedThreadId && validThreads.length > 0) {
          setSelectedThreadId(validThreads[0].id);
        }
      }
      try {
        const cardHealthRes = await fetch('/api/payments/card-health', { credentials: 'include' });
        if (cardHealthRes.ok) {
          const healthData = await cardHealthRes.json();
          setCardGatewayHealth(healthData);
        }
      } catch {
        // ignore transient payment health fetch error
      }
    } catch (err) {
      console.error('Falha ao sincronizar módulos administrativos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const isAdminAccess = isUserAdmin(user?.email || firebaseUser?.email, user?.role);

  useEffect(() => {
    if (!isOpen) {
      unauthorizedAuditRecordedRef.current = false;
      return;
    }
    if (isAdminAccess || isImpersonating) {
      loadAllModules();
    } else {
      setIsLoading(false);
      if (!unauthorizedAuditRecordedRef.current) {
        unauthorizedAuditRecordedRef.current = true;
        void recordAuditLog({
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: 'ui/SaaSAdminDashboard',
          details: 'Tentativa não autorizada de abrir o Painel Administrativo SaaS bloqueada pela interface.',
          actorUserId: user?.id || firebaseUser?.uid || 'anonymous',
          actorEmail: user?.email || firebaseUser?.email || 'anonymous',
          actorRole: 'user'
        });
      }
    }
  }, [isOpen, isAdminAccess, isImpersonating]);

  // Authenticated loader for uploaded Pix receipts (supports Bearer token + cookie)
  useEffect(() => {
    let activeObjectUrl: string | null = null;
    let cancelled = false;

    const receiptUrl = selectedInvoice?.receiptUrl;
    if (!receiptUrl) {
      setInvoiceReceiptPreviewUrl(null);
      setInvoiceReceiptMime('');
      setInvoiceReceiptLoading(false);
      setInvoiceReceiptError(null);
      return;
    }

    if (receiptUrl.startsWith('https://')) {
      setInvoiceReceiptPreviewUrl(receiptUrl);
      setInvoiceReceiptMime('external');
      setInvoiceReceiptLoading(false);
      setInvoiceReceiptError(null);
      return;
    }

    if (receiptUrl.startsWith('/api/orders/')) {
      setInvoiceReceiptLoading(true);
      setInvoiceReceiptError(null);
      setInvoiceReceiptPreviewUrl(null);
      (async () => {
        try {
          let token: string | null = null;
          try {
            token =
              localStorage.getItem('curriculopro_auth_token') ||
              sessionStorage.getItem('curriculopro_auth_token');
          } catch {
            token = null;
          }
          const resp = await fetch(receiptUrl, {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (!resp.ok) {
            throw new Error('Comprovante indisponível ou expirado.');
          }
          const contentType = resp.headers.get('content-type') || 'application/octet-stream';
          const blob = await resp.blob();
          activeObjectUrl = URL.createObjectURL(blob);
          if (!cancelled) {
            setInvoiceReceiptMime(contentType);
            setInvoiceReceiptPreviewUrl(activeObjectUrl);
          } else if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
          }
        } catch (err: any) {
          if (!cancelled) {
            setInvoiceReceiptError(err?.message || 'Não foi possível carregar o comprovante anexado.');
          }
        } finally {
          if (!cancelled) setInvoiceReceiptLoading(false);
        }
      })();
    }

    return () => {
      cancelled = true;
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [selectedInvoice?.id, selectedInvoice?.receiptUrl]);

  // Real-time Firestore listener for /auditLogs
  useEffect(() => {
    if (!isOpen || (!isAdminAccess && !isImpersonating)) {
      return;
    }
    setAuditLiveError(null);
    const unsubscribe = subscribeToAuditLogs({
      limitCount: 250,
      onLogs: (liveLogs, meta) => {
        setAuditLogsList((prev) => mergeAuditLogLists(liveLogs, prev));
        setAuditLiveLastAt(meta.lastUpdatedAt);
      },
      onStatusChange: (status, message) => {
        setAuditLiveStatus(status);
        setAuditLiveError(status === 'error' ? message || 'Erro no listener Firestore.' : null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen, isAdminAccess, isImpersonating]);

  // Real-time WebSocket Support Chat subscription for Admin / Moderator
  const activeChatStateRef = React.useRef<{ activeModule: AdminActiveModule; selectedThreadId: string | null }>({
    activeModule,
    selectedThreadId
  });
  activeChatStateRef.current = { activeModule, selectedThreadId };

  useEffect(() => {
    if (!isOpen || (!isAdminAccess && !isImpersonating)) return;
    const unsub = subscribeSupportChatWebSocket(
      (evt) => {
        if (evt.type === 'support_chat_update' && evt.thread) {
          const incoming = evt.thread;
          setSupportThreads((prev) => {
            const safePrev = (prev || []).filter((t): t is SupportChatThread => Boolean(t && t.id));
            const exists = safePrev.some((t) => t.id === incoming.id);
            const next = exists
              ? safePrev.map((t) => (t.id === incoming.id ? incoming : t))
              : [incoming, ...safePrev];
            return [...next].sort(
              (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
            );
          });
          if (
            activeChatStateRef.current.activeModule === 'support_chat' &&
            activeChatStateRef.current.selectedThreadId === incoming.id &&
            (incoming.unreadByAdmin || 0) > 0
          ) {
            void markAdminSupportThreadRead(incoming.id);
          }
        }
      },
      setSupportWsStatus
    );

    const unsubFsAdmin = subscribeAdminFirestoreSupportThreads((fsThreads) => {
      setSupportThreads((prev) => {
        const byId = new Map<string, SupportChatThread>();
        for (const t of prev || []) {
          if (t?.id) byId.set(t.id, t);
        }
        for (const t of fsThreads || []) {
          if (!t?.id) continue;
          const prevTh = byId.get(t.id);
          if (!prevTh) {
            byId.set(t.id, { ...t, messages: Array.isArray(t.messages) ? t.messages : [] });
          } else {
            const msgMap = new Map<string, any>();
            for (const m of [
              ...(Array.isArray(prevTh?.messages) ? prevTh.messages : []),
              ...(Array.isArray(t?.messages) ? t.messages : [])
            ]) {
              if (m?.id) msgMap.set(m.id, m);
            }
            const mergedMsgs = Array.from(msgMap.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            const prevTs = new Date(prevTh.updatedAt || prevTh.lastMessageAt || 0).getTime();
            const curTs = new Date(t.updatedAt || t.lastMessageAt || 0).getTime();
            const newer = curTs >= prevTs ? t : prevTh;
            byId.set(t.id, { ...prevTh, ...newer, messages: mergedMsgs });
          }
        }
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      });
    });

    return () => {
      unsub();
      unsubFsAdmin();
    };
  }, [isOpen, isAdminAccess, isImpersonating]);

  // Fallback HTTP polling for Admin Support Chat when WebSocket is unavailable (e.g. Vercel serverless)
  useEffect(() => {
    if (!isOpen || (!isAdminAccess && !isImpersonating) || supportWsStatus === 'connected') return;
    const pollMs = activeModule === 'support_chat' ? 6000 : 20000;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchAdminSupportThreads()
        .then((resp) => {
          if (!Array.isArray(resp?.threads)) return;
          setSupportThreads((prev) => {
            const byId = new Map<string, SupportChatThread>();
            for (const t of prev || []) {
              if (t?.id) byId.set(t.id, t);
            }
            for (const t of resp.threads) {
              if (!t?.id) continue;
              const prevTh = byId.get(t.id);
              if (!prevTh) {
                byId.set(t.id, { ...t, messages: Array.isArray(t.messages) ? t.messages : [] });
              } else {
                const msgMap = new Map<string, any>();
                for (const m of [
                  ...(Array.isArray(prevTh?.messages) ? prevTh.messages : []),
                  ...(Array.isArray(t?.messages) ? t.messages : [])
                ]) {
                  if (m?.id) msgMap.set(m.id, m);
                }
                const mergedMsgs = Array.from(msgMap.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                const prevTs = new Date(prevTh.updatedAt || prevTh.lastMessageAt || 0).getTime();
                const curTs = new Date(t.updatedAt || t.lastMessageAt || 0).getTime();
                const newer = curTs >= prevTs ? t : prevTh;
                byId.set(t.id, { ...prevTh, ...newer, messages: mergedMsgs });
              }
            }
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
            );
          });
        })
        .catch(() => {
          // ignore transient poll error
        });
    }, pollMs);
    return () => clearInterval(timer);
  }, [isOpen, isAdminAccess, isImpersonating, supportWsStatus, activeModule]);

  // Open User 360° Drawer
  const openUserDrawer = (target: User) => {
    setInspectedUser(target);
    setDrawerNotes(target.notes || '');
    setDrawerPlan(target.plan || 'free');
    setDrawerRole(target.role || 'user');
    setDrawerStatus(target.status || 'active');
    setDrawerResumes([]);
    setIsLoadingDrawerResumes(true);
    fetchAdminUserResumes(target.id)
      .then((resumes) => setDrawerResumes(resumes))
      .catch(() => setDrawerResumes([]))
      .finally(() => setIsLoadingDrawerResumes(false));
  };

  const handleOpenSupportChatForUser = (target: User) => {
    setSupportThreads((prev) => {
      if (prev.some((t) => t.id === target.id || t.userEmail.toLowerCase() === target.email.toLowerCase())) {
        return prev;
      }
      const nowIso = new Date().toISOString();
      const starter: SupportChatThread = {
        id: target.id,
        userId: target.id,
        userName: target.name || target.email,
        userEmail: target.email,
        userAvatarUrl: target.avatarUrl,
        userPlan: target.plan,
        status: 'open',
        lastMessageText: '',
        lastMessageAt: nowIso,
        unreadByUser: 0,
        unreadByAdmin: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: []
      };
      return [starter, ...prev];
    });
    const matched = supportThreads.find(
      (t) => t.id === target.id || t.userEmail.toLowerCase() === target.email.toLowerCase()
    );
    const tid = matched?.id || target.id;
    setSelectedThreadId(tid);
    setInspectedUser(null);
    setActiveModule('support_chat');
    if (matched && matched.unreadByAdmin > 0) {
      void markAdminSupportThreadRead(tid);
    }
  };

  const handleSaveUserDrawer = async () => {
    if (!inspectedUser) return;
    setIsSavingDrawer(true);
    try {
      const planChanged = drawerPlan !== inspectedUser.plan;
      let nextCredits = inspectedUser.creditsRemaining ?? 5;
      if (planChanged) {
        if (drawerPlan === 'executive') nextCredits = 9999;
        else if (drawerPlan === 'pro') nextCredits = Math.max(nextCredits, 100);
        else nextCredits = Math.min(nextCredits, 5);
      }
      const nextExpiresAt =
        planChanged && (drawerPlan === 'pro' || drawerPlan === 'executive')
          ? inspectedUser.subscriptionExpiresAt && new Date(inspectedUser.subscriptionExpiresAt).getTime() > Date.now()
            ? inspectedUser.subscriptionExpiresAt
            : new Date(Date.now() + 30 * 86400000).toISOString()
          : inspectedUser.subscriptionExpiresAt;

      const updates: Partial<User> & { email?: string; name?: string } = {
        email: inspectedUser.email,
        name: inspectedUser.name,
        notes: drawerNotes,
        plan: drawerPlan,
        role: drawerRole,
        status: drawerStatus,
        creditsRemaining: nextCredits,
        ...(nextExpiresAt ? { subscriptionExpiresAt: nextExpiresAt } : {})
      };
      await updateUserManagement(inspectedUser.id, updates);
      setUsersList((prev) => prev.map((u) => (u.id === inspectedUser.id ? { ...u, ...updates } : u)));
      setInspectedUser((prev) => (prev ? { ...prev, ...updates } : null));
      void recordAuditLog({
        action: 'admin_user_modified',
        category: 'admin',
        severity: drawerRole === 'admin' || drawerStatus === 'suspended' ? 'warning' : 'info',
        status: 'success',
        targetResource: `users/${inspectedUser.id}`,
        details: `Ficha CRM atualizada pelo admin: plano=${drawerPlan}, role=${drawerRole}, status=${drawerStatus}.`,
        actorUserId: user?.id,
        actorEmail: user?.email,
        actorRole: 'admin',
        metadata: { targetEmail: inspectedUser.email, plan: drawerPlan, role: drawerRole, status: drawerStatus }
      });
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
    proPrice: number;
    execPrice: number;
    proMrr: number;
    execMrr: number;
    churnedUsersCount: number;
    paidArpu: number;
    totalRevenue: number;
    periodOrdersCount: number;
    avgAiCostPerPaidSubscriberUsd: number;
    avgAiCostPerRegisteredUserUsd: number;
    monthlyMrrSeries: MonthlyMrrPoint[];
    churnCohortSeries: ChurnCohortPoint[];
    tierAiEconomics: TierAiEconomicsPoint[];
    subscriberAiCostList: SubscriberAiCostRow[];
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

    const GEMINI_COST_PER_CALL_USD = 0.00032;
    const totalUserAiCalls = usersList.reduce((acc, u) => acc + (u.creditsUsed || 0), 0);
    const totalAiCalls = totalUserAiCalls + telemetry.aiCallsCount;
    const todayCostUsd =
      totalAiCalls > 0 ? Number(((totalAiCalls * 0.00028) / 14).toFixed(2)) : 0;
    const monthCostUsd =
      totalAiCalls > 0 ? Number((totalAiCalls * GEMINI_COST_PER_CALL_USD).toFixed(2)) : 0;
    const revBase = Math.max(totalRevenue, mrr);
    const costToRevenuePercent =
      revBase > 0 ? Number(((monthCostUsd / revBase) * 100).toFixed(1)) : 0;
    const grossMarginPercent =
      revBase > 0 ? Number(Math.max(0, 100 - costToRevenuePercent - 3.9).toFixed(1)) : 0;

    const proMrr = Number((proUsers * proPrice).toFixed(2));
    const execMrr = Number((executiveUsers * execPrice).toFixed(2));

    // Per-subscriber Gemini AI utilization & unit economics
    const subscriberAiCostList: SubscriberAiCostRow[] = usersList
      .map((u) => {
        const callsCount = u.creditsUsed || 0;
        const aiCostUsd = Number((callsCount * GEMINI_COST_PER_CALL_USD).toFixed(4));
        const isPaid =
          (u.plan === 'pro' || u.plan === 'executive') &&
          u.status !== 'suspended' &&
          u.stripeStatus !== 'canceled';
        const monthlyArpuUsd = isPaid
          ? u.plan === 'executive'
            ? execPrice
            : proPrice
          : 0;
        const netContributionUsd = Number((monthlyArpuUsd - aiCostUsd).toFixed(2));
        const costShareOfArpuPct =
          monthlyArpuUsd > 0 ? Number(((aiCostUsd / monthlyArpuUsd) * 100).toFixed(2)) : 0;
        const planLabel =
          u.plan === 'executive'
            ? 'Executivo VIP'
            : u.plan === 'pro'
            ? 'Profissional Pro'
            : 'Gratuito';
        const cleanName = (u.name || u.email || 'Utilizador').trim();
        const shortName =
          cleanName.length > 16 ? `${cleanName.slice(0, 15)}…` : cleanName;

        return {
          userId: u.id,
          name: cleanName,
          shortName,
          email: u.email,
          plan: u.plan,
          planLabel,
          status: u.status || 'active',
          isPaid,
          callsCount,
          aiCostUsd,
          monthlyArpuUsd,
          netContributionUsd,
          costShareOfArpuPct
        };
      })
      .sort((a, b) => b.aiCostUsd - a.aiCostUsd || b.monthlyArpuUsd - a.monthlyArpuUsd);

    const paidSubscribersCalls = subscriberAiCostList
      .filter((s) => s.isPaid)
      .reduce((acc, s) => acc + s.callsCount, 0);
    const paidSubscribersAiCostUsd = paidSubscribersCalls * GEMINI_COST_PER_CALL_USD;
    const avgAiCostPerPaidSubscriberUsd =
      paidUsers > 0 ? Number((paidSubscribersAiCostUsd / paidUsers).toFixed(4)) : 0;
    const avgAiCostPerRegisteredUserUsd =
      totalUsers > 0
        ? Number(((totalUserAiCalls * GEMINI_COST_PER_CALL_USD) / totalUsers).toFixed(4))
        : 0;

    const buildTierEconomics = (
      tierKey: SubscriptionPlan,
      tierLabel: string,
      arpuUsd: number
    ): TierAiEconomicsPoint => {
      const matching = subscriberAiCostList.filter((s) =>
        tierKey === 'free' ? s.plan === 'free' : s.plan === tierKey && s.isPaid
      );
      const subscribers = matching.length;
      const totalCalls = matching.reduce((acc, s) => acc + s.callsCount, 0);
      const totalAiCostUsd = Number((totalCalls * GEMINI_COST_PER_CALL_USD).toFixed(4));
      const avgCostPerSubscriberUsd =
        subscribers > 0 ? Number((totalAiCostUsd / subscribers).toFixed(4)) : 0;
      const netMarginPct =
        arpuUsd > 0
          ? Number(Math.max(0, ((arpuUsd - avgCostPerSubscriberUsd) / arpuUsd) * 100).toFixed(1))
          : 0;
      return {
        tierKey,
        tierLabel,
        subscribers,
        totalCalls,
        totalAiCostUsd,
        avgCostPerSubscriberUsd,
        arpuUsd,
        netMarginPct
      };
    };

    const tierAiEconomics: TierAiEconomicsPoint[] = [
      buildTierEconomics('executive', 'Executivo VIP', execPrice),
      buildTierEconomics('pro', 'Profissional Pro', proPrice),
      buildTierEconomics('free', 'Gratuito', 0)
    ];

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

    // Real Cohort Retention & Churn derived strictly from registered users' createdAt months
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
    const sortedCohorts = Array.from(cohortBuckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(periodFilter === 'all' ? -12 : -6);

    const cohortRetention = sortedCohorts.map((bucket) => {
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

    const churnCohortSeries: ChurnCohortPoint[] = sortedCohorts.map((bucket) => {
      const totalInCohort = bucket.users.length;
      const churnedCount = bucket.users.filter(
        (u) => u.status === 'suspended' || u.stripeStatus === 'canceled'
      ).length;
      const retainedCount = Math.max(0, totalInCohort - churnedCount);
      const retentionRate =
        totalInCohort > 0 ? Number(((retainedCount / totalInCohort) * 100).toFixed(1)) : 0;
      const bucketChurnRate =
        totalInCohort > 0 ? Number(((churnedCount / totalInCohort) * 100).toFixed(1)) : 0;
      return {
        month: bucket.label,
        newUsers: totalInCohort,
        retainedCount,
        churnedCount,
        retentionRate,
        churnRate: bucketChurnRate
      };
    });

    // Real MRR, Paid Revenue & AI Cost Series tailored to periodFilter
    const monthlyMrrSeries: MonthlyMrrPoint[] = [];
    if (periodFilter === '7d') {
      for (let offset = 6; offset >= 0; offset -= 1) {
        const dayStart = new Date(
          nowDate.getFullYear(),
          nowDate.getMonth(),
          nowDate.getDate() - offset,
          0,
          0,
          0,
          0
        );
        const dayEnd = new Date(
          nowDate.getFullYear(),
          nowDate.getMonth(),
          nowDate.getDate() - offset,
          23,
          59,
          59,
          999
        );
        const dayLabel =
          offset === 0
            ? 'Hoje'
            : `${String(dayStart.getDate()).padStart(2, '0')}/${String(
                dayStart.getMonth() + 1
              ).padStart(2, '0')}`;

        const dayRevenue = ordersList
          .filter((o) => {
            if (o.status !== 'paid') return false;
            const dt = new Date(o.createdAt || '');
            return !Number.isNaN(dt.getTime()) && dt >= dayStart && dt <= dayEnd;
          })
          .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

        const activeUpToDay = usersList.filter((u) => {
          if (u.status === 'suspended' || u.stripeStatus === 'canceled') return false;
          if (u.plan !== 'pro' && u.plan !== 'executive') return false;
          const dt = new Date(u.createdAt || '');
          return Number.isNaN(dt.getTime()) || dt <= dayEnd;
        });

        const dayProMrr =
          activeUpToDay.filter((u) => u.plan === 'pro').length * proPrice;
        const dayExecMrr =
          activeUpToDay.filter((u) => u.plan === 'executive').length * execPrice;

        monthlyMrrSeries.push({
          label: dayLabel,
          mrr: Number((dayProMrr + dayExecMrr).toFixed(2)),
          proMrr: Number(dayProMrr.toFixed(2)),
          execMrr: Number(dayExecMrr.toFixed(2)),
          revenue: Number(dayRevenue.toFixed(2)),
          aiCost: offset === 0 ? todayCostUsd : 0,
          activePaid: activeUpToDay.length
        });
      }
    } else {
      const monthCount = periodFilter === 'all' ? 12 : 6;
      for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
        const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - offset, 1);
        const monthEnd = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const label =
          offset === 0
            ? 'Atual'
            : `${monthShortNames[monthStart.getMonth()]}/${String(
                monthStart.getFullYear()
              ).slice(-2)}`;

        const monthRevenue = ordersList
          .filter((o) => {
            if (o.status !== 'paid') return false;
            const dt = new Date(o.createdAt || '');
            return !Number.isNaN(dt.getTime()) && dt >= monthStart && dt <= monthEnd;
          })
          .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

        const activePaidInMonth = usersList.filter((u) => {
          if (u.status === 'suspended' || u.stripeStatus === 'canceled') return false;
          if (u.plan !== 'pro' && u.plan !== 'executive') return false;
          const dt = new Date(u.createdAt || '');
          return Number.isNaN(dt.getTime()) || dt <= monthEnd;
        });

        const bucketProMrr =
          activePaidInMonth.filter((u) => u.plan === 'pro').length * proPrice;
        const bucketExecMrr =
          activePaidInMonth.filter((u) => u.plan === 'executive').length * execPrice;

        monthlyMrrSeries.push({
          label,
          mrr: Number((bucketProMrr + bucketExecMrr).toFixed(2)),
          proMrr: Number(bucketProMrr.toFixed(2)),
          execMrr: Number(bucketExecMrr.toFixed(2)),
          revenue: Number(monthRevenue.toFixed(2)),
          aiCost: offset === 0 ? monthCostUsd : 0,
          activePaid: activePaidInMonth.length
        });
      }
    }

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
        description: `O consumo estimado da API Gemini representa ${costToRevenuePercent}% da receita registada (${totalAiCalls} chamadas totais, média $${avgAiCostPerPaidSubscriberUsd.toFixed(4)}/subscritor pago).`,
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
      proPrice,
      execPrice,
      proMrr,
      execMrr,
      churnedUsersCount: churnedUsers,
      paidArpu: Number(avgPaidArpu.toFixed(2)),
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
      },
      avgAiCostPerPaidSubscriberUsd,
      avgAiCostPerRegisteredUserUsd,
      monthlyMrrSeries,
      churnCohortSeries,
      tierAiEconomics,
      subscriberAiCostList
    };
  }, [usersList, ordersList, periodFilter, editablePlans, telemetry, errorLogsList, gdprList]);

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
    const q = orderSearch.trim().toLowerCase();
    return ordersList.filter((o) => {
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        (o.stripePaymentIntentId && o.stripePaymentIntentId.toLowerCase().includes(q)) ||
        (o.notes && o.notes.toLowerCase().includes(q));
      const matchStatus =
        orderStatusFilter === 'all'
          ? true
          : orderStatusFilter === 'pending_pix'
          ? o.status === 'pending' && o.paymentMethod === 'pix'
          : o.status === orderStatusFilter;
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

  const auditActorOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; count: number }>();
    for (const u of usersList) {
      const emailKey = (u.email || '').trim().toLowerCase();
      if (!emailKey) continue;
      if (!map.has(emailKey)) {
        map.set(emailKey, {
          value: emailKey,
          label: `${u.name ? `${u.name} · ` : ''}${emailKey}`,
          count: 0
        });
      }
    }
    for (const log of auditLogsList) {
      const emailKey = (log.actorEmail || log.actorUserId || 'anonymous').trim().toLowerCase();
      const existing = map.get(emailKey);
      if (existing) {
        existing.count += 1;
      } else {
        const displayLabel =
          emailKey === 'anonymous'
            ? 'anonymous (Visitante / Não Autenticado)'
            : emailKey;
        map.set(emailKey, { value: emailKey, label: displayLabel, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [auditLogsList, usersList]);

  const criticalAuditLogs = useMemo(
    () => auditLogsList.filter(isCriticalAuditLog),
    [auditLogsList]
  );

  const filteredCriticalLiveLogs = useMemo(() => {
    const term = auditSearch.trim().toLowerCase();
    return criticalAuditLogs.filter((log) => {
      const actorKey = (log.actorEmail || log.actorUserId || 'anonymous').trim().toLowerCase();
      const matchUser =
        auditUserFilter === 'all' ||
        actorKey === auditUserFilter ||
        log.actorUserId.toLowerCase() === auditUserFilter;
      const matchCategory = auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
      const matchSearch =
        !term ||
        log.actorEmail.toLowerCase().includes(term) ||
        log.targetResource.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(term));
      return matchUser && matchCategory && matchSearch;
    });
  }, [criticalAuditLogs, auditUserFilter, auditCategoryFilter, auditSearch]);

  const filteredAuditLogs = useMemo(() => {
    const term = auditSearch.trim().toLowerCase();
    return auditLogsList.filter((log) => {
      if (auditCriticalOnly && !isCriticalAuditLog(log)) return false;
      const actorKey = (log.actorEmail || log.actorUserId || 'anonymous').trim().toLowerCase();
      const matchUser =
        auditUserFilter === 'all' ||
        actorKey === auditUserFilter ||
        log.actorUserId.toLowerCase() === auditUserFilter;
      const matchSearch =
        !term ||
        log.actorEmail.toLowerCase().includes(term) ||
        log.targetResource.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(term));
      const matchCategory = auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
      const matchStatus = auditStatusFilter === 'all' || log.status === auditStatusFilter;
      const matchSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;
      return matchUser && matchSearch && matchCategory && matchStatus && matchSeverity;
    });
  }, [
    auditLogsList,
    auditCriticalOnly,
    auditUserFilter,
    auditSearch,
    auditCategoryFilter,
    auditStatusFilter,
    auditSeverityFilter
  ]);

  const auditStats = useMemo(() => {
    const blockedCount = auditLogsList.filter(
      (l) => l.status === 'blocked' || l.action === 'unauthorized_access_attempt' || l.action === 'cv_export_blocked_unauthorized'
    ).length;
    const criticalCount = criticalAuditLogs.length;
    const subscriptionCount = auditLogsList.filter((l) => l.category === 'subscription').length;
    const cvExportCount = auditLogsList.filter((l) => l.category === 'cv_export').length;
    const profileCount = auditLogsList.filter((l) => l.category === 'profile').length;
    return {
      total: auditLogsList.length,
      criticalCount,
      blockedCount,
      subscriptionCount,
      cvExportCount,
      profileCount
    };
  }, [auditLogsList, criticalAuditLogs]);

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
      await updateUserManagement(userId, {
        email: target.email,
        name: target.name,
        creditsRemaining: newQuota,
        creditsUsed: 0
      });
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
    const nextCredits =
      nextPlan === 'executive' ? 9999 : Math.max(target.creditsRemaining || 0, 100);

    try {
      await updateUserManagement(userId, {
        email: target.email,
        name: target.name,
        plan: nextPlan,
        creditsRemaining: nextCredits,
        subscriptionExpiresAt: newExpiresAt,
        status: 'active'
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                plan: nextPlan,
                creditsRemaining: nextCredits,
                subscriptionExpiresAt: newExpiresAt,
                status: 'active'
              }
            : u
        )
      );
      if (inspectedUser?.id === userId) {
        setInspectedUser((prev) =>
          prev
            ? {
                ...prev,
                plan: nextPlan,
                creditsRemaining: nextCredits,
                subscriptionExpiresAt: newExpiresAt,
                status: 'active'
              }
            : null
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

  const handleDeleteUserAccount = (target: User) => {
    setPendingConfirm({
      title: 'Eliminar Conta Permanentemente',
      message: `Tem a certeza que pretende eliminar a conta de ${target.name} (${target.email})? Esta ação remove o registo da base de utilizadores.`,
      confirmLabel: 'Eliminar Conta',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteUserAccountRecord(target.id, target.email);
          const targetEmailLower = (target.email || '').trim().toLowerCase();
          setUsersList((prev) =>
            prev.filter(
              (u) =>
                u.id !== target.id &&
                (!targetEmailLower || (u.email || '').trim().toLowerCase() !== targetEmailLower)
            )
          );
          if (
            inspectedUser &&
            (inspectedUser.id === target.id ||
              (targetEmailLower && (inspectedUser.email || '').trim().toLowerCase() === targetEmailLower))
          ) {
            setInspectedUser(null);
          }
          showNotification(`Conta ${target.email} eliminada.`);
          try {
            const refreshedUsers = await fetchAllUsers();
            setUsersList(refreshedUsers);
          } catch {
            // keep optimistic update if follow-up sync is transient
          }
        } catch (e) {
          console.error(e);
          showNotification('Erro ao eliminar conta.');
        }
      }
    });
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
      if (selectedInvoice?.id === order.id) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'paid' } : prev));
      }
      showNotification(`Fatura ${order.orderNumber} aprovada e acesso de ${order.userName} ativado!`);
      loadAllModules();
    } catch (e) {
      console.error(e);
      showNotification('Erro ao aprovar pagamento.');
    }
  };

  const handleRejectOrder = async (order: SaaSOrder) => {
    try {
      const rejectNote = 'Comprovante Pix recusado pelo administrador.';
      await updateOrderStatus(order.id, 'failed', rejectNote, order);
      setOrdersList((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'failed', notes: rejectNote } : o))
      );
      if (selectedInvoice?.id === order.id) {
        setSelectedInvoice((prev) =>
          prev ? { ...prev, status: 'failed', notes: rejectNote } : prev
        );
      }
      showNotification(`Pedido ${order.orderNumber} marcado como recusado.`);
      loadAllModules();
    } catch (e) {
      console.error(e);
      showNotification('Erro ao recusar pagamento.');
    }
  };

  const handleRefundOrder = (order: SaaSOrder) => {
    setPendingConfirm({
      title: 'Confirmar Reembolso de Fatura',
      message: `Autorizar reembolso da fatura ${order.orderNumber} no valor de $${order.amount}?`,
      confirmLabel: 'Confirmar Reembolso',
      variant: 'warning',
      onConfirm: async () => {
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
      }
    });
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
    try {
      const restored = { ...def, updatedAt: new Date().toISOString() };
      await handleSavePrompt(restored);
      showNotification(`Prompt "${restored.name}" restaurado para o padrão original.`);
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao restaurar prompt padrão.');
    }
  };

  const handleProbeAiHealth = async () => {
    setIsProbingAiHealth(true);
    try {
      const snap = await fetchAiHealthStatus(true);
      if (snap) {
        setAiLiveHealth(snap);
        showNotification('Diagnóstico de latência Gemini concluído em tempo real!');
      } else {
        showNotification('Não foi possível consultar o estado ao vivo dos modelos IA.');
      }
    } catch {
      showNotification('Erro ao testar latência dos modelos Gemini.');
    } finally {
      setIsProbingAiHealth(false);
    }
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

    const previousList = templatesList;
    setTemplatesList(nextList);
    try {
      await Promise.all([saveAdminTemplate(updatedCurrent), saveAdminTemplate(updatedSwap)]);
      showNotification(`Ordem de exibição de "${current.shortName}" atualizada!`);
    } catch (err: any) {
      setTemplatesList(previousList);
      showNotification(err?.message || 'Erro ao reordenar templates.');
    }
  };

  const handleToggleTemplate = async (templateId: string, currentActive: boolean) => {
    const target = templatesList.find((t) => t.id === templateId);
    if (!target) return;
    const updated = { ...target, isActive: !currentActive };
    try {
      await saveAdminTemplate(updated);
      setTemplatesList((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      showNotification(`Template "${target.shortName}" ${!currentActive ? 'ATIVADO' : 'DESATIVADO'}.`);
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao alterar estado do template.');
    }
  };

  const handleTemplateTierChange = async (templateId: string, newTier: 'free' | 'pro' | 'executive') => {
    const target = templatesList.find((t) => t.id === templateId);
    if (!target) return;
    const updated = { ...target, tierRequired: newTier };
    try {
      await saveAdminTemplate(updated);
      setTemplatesList((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      showNotification(`Nível do modelo "${target.shortName}" alterado para ${newTier.toUpperCase()}.`);
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao alterar nível do template.');
    }
  };

  const handleSaveTemplateMeta = async (updatedItem: TemplateAdminItem) => {
    const cleaned: TemplateAdminItem = {
      ...updatedItem,
      shortName: updatedItem.shortName.trim() || updatedItem.name,
      badge: updatedItem.badge.trim() || 'ATS',
      atsScore: Math.max(50, Math.min(100, Number(updatedItem.atsScore) || 95))
    };
    try {
      await saveAdminTemplate(cleaned);
      setTemplatesList((prev) => prev.map((t) => (t.id === cleaned.id ? cleaned : t)));
      setEditingTemplate(null);
      showNotification(`Metadados de "${cleaned.shortName}" guardados ao vivo!`);
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao guardar metadados do template.');
    }
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
    try {
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
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao anonimizar dados RGPD.');
    }
  };

  const handleSelectSupportThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    const th = supportThreads.find((t) => t.id === threadId);
    if (th && th.unreadByAdmin > 0) {
      setSupportThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unreadByAdmin: 0 } : t))
      );
      void markAdminSupportThreadRead(threadId);
    }
  };

  const handleSendAdminChatReply = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedThreadId || !adminChatReply.trim() || isSendingChatReply) return;
    setIsSendingChatReply(true);
    try {
      const currentThread = supportThreads.find((t) => t.id === selectedThreadId);
      const res = await sendAdminSupportReply(
        selectedThreadId,
        adminChatReply.trim(),
        currentThread
          ? {
              userId: currentThread.userId,
              userName: currentThread.userName,
              userEmail: currentThread.userEmail,
              userPlan: currentThread.userPlan,
              userAvatarUrl: currentThread.userAvatarUrl
            }
          : undefined
      );
      setAdminChatReply('');
      if (res?.thread?.id) {
        setSupportThreads((prev) => {
          const safePrev = (prev || []).filter((t): t is SupportChatThread => Boolean(t && t.id));
          const exists = safePrev.some((t) => t.id === res.thread.id);
          const next = exists
            ? safePrev.map((t) => (t.id === res.thread.id ? res.thread : t))
            : [res.thread, ...safePrev];
          return [...next].sort(
            (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
          );
        });
      }
      setTimeout(() => {
        adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao enviar resposta no chat.');
    } finally {
      setIsSendingChatReply(false);
    }
  };

  const handleToggleSupportThreadStatus = async (thread: SupportChatThread) => {
    const nextStatus = thread.status === 'resolved' ? 'open' : 'resolved';
    try {
      const updated = await updateAdminSupportThreadStatus(thread.id, nextStatus);
      if (updated?.id) {
        setSupportThreads((prev) =>
          (prev || [])
            .filter((t): t is SupportChatThread => Boolean(t && t.id))
            .map((t) => (t.id === updated.id ? updated : t))
        );
      }
      showNotification(
        nextStatus === 'resolved'
          ? `Conversa com ${thread.userName} marcada como Resolvida.`
          : `Conversa com ${thread.userName} reaberta.`
      );
    } catch (err: any) {
      showNotification(err?.message || 'Erro ao atualizar estado da conversa.');
    }
  };

  const handleDeleteGdpr = (req: GdprDataRequest) => {
    setPendingConfirm({
      title: 'Confirmar Eliminação RGPD (Art. 17)',
      message: `Eliminar definitivamente a conta e dados pessoais associados a ${req.userEmail}?`,
      confirmLabel: 'Eliminar em Conformidade RGPD',
      variant: 'danger',
      onConfirm: async () => {
        const matchingUser = usersList.find(
          (u) => u.id === req.userId || u.email.toLowerCase() === req.userEmail.toLowerCase()
        );
        if (matchingUser) {
          await deleteUserAccountRecord(matchingUser.id, matchingUser.email);
          const targetEmailLower = (matchingUser.email || '').trim().toLowerCase();
          setUsersList((prev) =>
            prev.filter(
              (u) =>
                u.id !== matchingUser.id &&
                (!targetEmailLower || (u.email || '').trim().toLowerCase() !== targetEmailLower)
            )
          );
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
      }
    });
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

  const handleExportCSV = (type: 'users' | 'orders' | 'errors' | 'audit_logs') => {
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
    } else if (type === 'audit_logs') {
      filename = `Auditoria_Seguranca_Firestore_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,DataHora,Utilizador,Email,Perfil,Acao,Categoria,Severidade,Status,RecursoAlvo,IP,Detalhes\n';
      filteredAuditLogs.forEach((log) => {
        csvContent += `"${log.id}","${log.timestamp}","${log.actorUserId}","${log.actorEmail}","${log.actorRole}","${log.action}","${log.category}","${log.severity}","${log.status}","${log.targetResource}","${log.ipAddress || ''}","${log.details.replace(/"/g, '""')}"\n`;
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
  const blockedSecurityCount = auditStats.blockedCount;
  const unreadSupportChatCount = supportThreads.reduce((acc, t) => acc + (Number(t.unreadByAdmin) || 0), 0);

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
      id: 'support_chat',
      label: 'Chat de Suporte',
      icon: <MessageCircle className="w-4 h-4" />,
      badge: unreadSupportChatCount > 0 ? unreadSupportChatCount : supportThreads.length || undefined,
      badgeAlert: unreadSupportChatCount > 0
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
      badge: unresolvedErrorsCount + pendingGdprCount + blockedSecurityCount || undefined,
      badgeAlert: unresolvedErrorsCount + pendingGdprCount + blockedSecurityCount > 0
    }
  ];

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
                    Operações &amp; Receita
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-700">Estado em Produção</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                    platformSettings?.maintenanceMode
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {platformSettings?.maintenanceMode ? 'Manutenção' : 'Operacional'}
                </span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Manutenção</span>
                  <span className="font-mono font-bold tabular-nums">
                    {platformSettings?.maintenanceMode ? 'ATIVA' : 'OFF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IA Global</span>
                  <span className="font-mono font-bold tabular-nums">
                    {platformSettings?.enableAiFeaturesGlobally !== false ? 'ON' : 'PAUSA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Novos Cadastros</span>
                  <span className="font-mono font-bold tabular-nums">
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

                    {/* Action Triage Strip & Pending Pix Quick Approval */}
                    {(() => {
                      const pendingOrders = ordersList.filter((o) => o.status === 'pending');
                      const hasPendingWork =
                        pendingOrders.length > 0 ||
                        unresolvedErrorsCount > 0 ||
                        pendingGdprCount > 0 ||
                        blockedSecurityCount > 0;

                      if (!hasPendingWork) return null;

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">
                                Fila de Ação Operacional
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Itens prioritários que exigem revisão ou aprovação direta.
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              {pendingOrders.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModule('users_support');
                                    setCrmSubTab('orders');
                                    setOrderStatusFilter('pending');
                                  }}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-md font-mono tabular-nums"
                                >
                                  {pendingOrders.length} Pix/Fatura(s) Pendente(s)
                                </button>
                              )}
                              {unresolvedErrorsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModule('security_monitoring');
                                    setSecuritySubTab('error_logs');
                                    setErrorFilterMode('unresolved');
                                  }}
                                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-md font-mono tabular-nums"
                                >
                                  {unresolvedErrorsCount} Erro(s) Técnico(s)
                                </button>
                              )}
                              {pendingGdprCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModule('security_monitoring');
                                    setSecuritySubTab('gdpr');
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-md font-mono tabular-nums"
                                >
                                  {pendingGdprCount} Pedido(s) RGPD
                                </button>
                              )}
                              {blockedSecurityCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModule('security_monitoring');
                                    setSecuritySubTab('audit_logs');
                                    setAuditCategoryFilter('security');
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md font-mono tabular-nums"
                                >
                                  {blockedSecurityCount} Bloqueio(s) Segurança
                                </button>
                              )}
                            </div>
                          </div>

                          {pendingOrders.length > 0 && (
                            <div className="pt-2.5 border-t border-slate-100 space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pedidos Pix Aguardando Conferência &amp; Ativação
                              </p>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                {pendingOrders.slice(0, 4).map((o) => (
                                  <div
                                    key={o.id}
                                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                        <span className="truncate">{o.userName}</span>
                                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                          ({o.orderNumber})
                                        </span>
                                        {o.receiptUrl && (
                                          <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[9px] font-bold uppercase shrink-0">
                                            Anexo
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] font-mono text-slate-600 truncate">
                                        {o.plan.toUpperCase()} · {formatCycleLabel(o.billingCycle)} ·{' '}
                                        {o.currency === 'BRL'
                                          ? `R$ ${Number(o.amount).toFixed(2)}`
                                          : `$${o.amount} ${o.currency}`}
                                        {o.paymentMethod === 'pix' && o.stripePaymentIntentId ? ` · Cód: ${o.stripePaymentIntentId}` : ''}
                                      </p>
                                      {o.notes && (
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5" title={o.notes}>
                                          {o.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedInvoice(o)}
                                        className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50 rounded text-[11px] font-semibold whitespace-nowrap"
                                      >
                                        {o.receiptUrl ? 'Ver Anexo' : 'Detalhes'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectOrder(o)}
                                        className="px-2 py-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold whitespace-nowrap"
                                      >
                                        Recusar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveOrder(o)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold whitespace-nowrap"
                                      >
                                        Aprovar &amp; Ativar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 8 KPI Cards (2 rows of 4) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            MRR (Receita Recorrente)
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 tabular-nums">
                            {financialMetrics.monthlyGrowthRate >= 0 ? '+' : ''}
                            {financialMetrics.monthlyGrowthRate}% MoM
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
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
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
                          ARPU Pagantes &amp; Canal
                        </span>
                        <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.paidArpu}
                          <span className="text-xs font-normal text-slate-400 ml-1">/assinante</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Aquisição: <strong className="text-emerald-700">100% Orgânica (CAC $0)</strong>
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
                          Custo IA por Subscritor
                        </span>
                        <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1.5">
                          ${financialMetrics.avgAiCostPerPaidSubscriberUsd.toFixed(4)}
                          <span className="text-xs font-normal text-slate-400 ml-1">/pago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                          Total Mês: <strong>${financialMetrics.apiCostTracking.monthCostUsd}</strong> ({financialMetrics.apiCostTracking.costToRevenuePercent}% rev.)
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

                    {/* Row 2: Recharts Financial Visualizations (MRR, Churn Rate, AI API Cost per Subscriber) */}
                    <AdminFinancialCharts
                      periodLabel={
                        periodFilter === '7d'
                          ? '7 Dias'
                          : periodFilter === '30d'
                          ? '30 Dias'
                          : periodFilter === '90d'
                          ? '90 Dias'
                          : 'Todo Período'
                      }
                      mrr={financialMetrics.mrr}
                      arr={financialMetrics.arr}
                      proMrr={financialMetrics.proMrr}
                      execMrr={financialMetrics.execMrr}
                      proUsers={financialMetrics.proUsers}
                      executiveUsers={financialMetrics.executiveUsers}
                      monthlyGrowthRate={financialMetrics.monthlyGrowthRate}
                      churnRate={financialMetrics.churnRate}
                      churnedUsersCount={financialMetrics.churnedUsersCount}
                      paidUsersCount={financialMetrics.paidUsers}
                      totalUsersCount={financialMetrics.totalUsers}
                      monthAiCostUsd={financialMetrics.apiCostTracking.monthCostUsd}
                      todayAiCostUsd={financialMetrics.apiCostTracking.todayCostUsd}
                      avgAiCostPerPaidSubscriberUsd={financialMetrics.avgAiCostPerPaidSubscriberUsd}
                      avgAiCostPerRegisteredUserUsd={financialMetrics.avgAiCostPerRegisteredUserUsd}
                      costToRevenuePercent={financialMetrics.apiCostTracking.costToRevenuePercent}
                      grossMarginPercent={financialMetrics.grossMarginPercent}
                      monthlyMrrSeries={financialMetrics.monthlyMrrSeries}
                      churnCohortSeries={financialMetrics.churnCohortSeries}
                      tierAiEconomics={financialMetrics.tierAiEconomics}
                      subscriberAiCostList={financialMetrics.subscriberAiCostList}
                      onInspectUser={(uid) => {
                        const found = usersList.find((u) => u.id === uid);
                        if (found) openUserDrawer(found);
                      }}
                    />

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

                    {/* Row 6: Real-Time Firestore Critical Audit Stream Panel */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-rose-400 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                Ações Críticas em Tempo Real (Firestore Listener)
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  auditLiveStatus === 'live'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : auditLiveStatus === 'error'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    auditLiveStatus === 'live'
                                      ? 'bg-emerald-600 animate-pulse'
                                      : auditLiveStatus === 'error'
                                      ? 'bg-rose-600'
                                      : 'bg-amber-600'
                                  }`}
                                />
                                {auditLiveStatus === 'live'
                                  ? 'Ao Vivo · Firestore'
                                  : auditLiveStatus === 'connecting'
                                  ? 'A conectar...'
                                  : auditLiveStatus === 'error'
                                  ? 'Erro Listener'
                                  : 'Modo Servidor'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {auditStats.criticalCount} evento(s) críticos/sensíveis monitorizados
                              {auditLiveLastAt
                                ? ` · Última atualização ${new Date(auditLiveLastAt).toLocaleTimeString('pt-PT')}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModule('security_monitoring');
                            setSecuritySubTab('audit_logs');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5"
                        >
                          <span>Abrir Auditoria Completa</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Filters by User & Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <select
                          aria-label="Filtrar ações críticas por utilizador"
                          value={auditUserFilter}
                          onChange={(e) => setAuditUserFilter(e.target.value)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                        >
                          <option value="all">Todos os Utilizadores ({auditActorOptions.length})</option>
                          {auditActorOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} ({opt.count})
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Filtrar ações críticas por categoria"
                          value={auditCategoryFilter}
                          onChange={(e) => setAuditCategoryFilter(e.target.value as 'all' | AuditLogCategory)}
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                        >
                          <option value="all">Todas Categorias</option>
                          <option value="security">Segurança / Bloqueios</option>
                          <option value="subscription">Subscrições</option>
                          <option value="cv_export">Exportações CV</option>
                          <option value="profile">Perfil &amp; Senha</option>
                          <option value="admin">Administração</option>
                        </select>

                        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[11px] text-slate-600 font-semibold">
                            {filteredCriticalLiveLogs.length} críticos visíveis
                          </span>
                          {(auditUserFilter !== 'all' || auditCategoryFilter !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuditUserFilter('all');
                                setAuditCategoryFilter('all');
                              }}
                              className="text-[11px] font-bold text-slate-900 underline"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredCriticalLiveLogs.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                          Nenhuma ação crítica encontrada para o utilizador e categoria selecionados.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                          {filteredCriticalLiveLogs.slice(0, 10).map((log) => (
                            <div
                              key={log.id}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                log.status === 'blocked' || log.severity === 'critical'
                                  ? 'bg-rose-50/70 border-rose-200'
                                  : 'bg-amber-50/60 border-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 ${
                                      log.status === 'blocked' || log.severity === 'critical'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-200 text-amber-950'
                                    }`}
                                  >
                                    {log.status === 'blocked' ? 'BLOQ' : log.severity.toUpperCase()}
                                  </span>
                                  <span className="font-bold text-slate-900 truncate">
                                    {ADMIN_AUDIT_ACTION_LABELS[log.action] || log.action}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                  {new Date(log.timestamp).toLocaleTimeString('pt-PT')}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 line-clamp-2">{log.details}</p>
                              <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                                <span className="truncate font-semibold text-slate-800">
                                  {log.actorEmail}
                                </span>
                                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shrink-0">
                                  {ADMIN_AUDIT_CATEGORY_LABELS[log.category] || log.category}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                                    <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
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
                                    <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
                                  </select>
                                </div>
                              </div>

                              {/* Live Prompt Test Sandbox */}
                              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-500" />
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
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
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
                              <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
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
                              <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
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

                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 text-xs">
                                Telemetria de Latência Gemini em Tempo Real
                              </span>
                              <p className="text-[11px] text-slate-500">
                                {aiLiveHealth?.configured
                                  ? aiLiveHealth.aiPaused
                                    ? 'Motores pausados globalmente pela Governança.'
                                    : 'Chave Gemini ativa no servidor. Latências medidas em chamadas reais.'
                                  : 'Chave GEMINI_API_KEY não configurada no servidor.'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleProbeAiHealth}
                              disabled={isProbingAiHealth}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${isProbingAiHealth ? 'animate-spin' : ''}`} />
                              <span>{isProbingAiHealth ? 'A testar API...' : 'Testar Latência Ao Vivo'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Object.entries(aiLiveHealth?.models || aiRouting.healthStatus).map(([modelName, rawInfo]: [string, any]) => {
                              const liveEntry = aiLiveHealth?.models?.[modelName];
                              const statusVal = liveEntry?.status || rawInfo?.status || 'idle';
                              const latencyVal = liveEntry?.latencyMs ?? (rawInfo?.latencyMs > 0 ? rawInfo.latencyMs : null);
                              const callsCount = liveEntry?.callsCount ?? 0;
                              const badgeClass =
                                statusVal === 'healthy'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : statusVal === 'degraded' || statusVal === 'cooldown'
                                  ? 'bg-amber-100 text-amber-800'
                                  : statusVal === 'unavailable'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700';
                              return (
                                <div key={modelName} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-mono font-bold text-slate-900 truncate">{modelName}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                      {latencyVal !== null ? `Latência média: ${latencyVal}ms` : 'Sem chamadas recentes'}
                                      {callsCount > 0 ? ` · ${callsCount} req` : ''}
                                    </div>
                                    {liveEntry?.lastError && (
                                      <div className="text-[10px] text-rose-600 truncate mt-0.5" title={liveEntry.lastError}>
                                        {liveEntry.lastError}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${badgeClass}`}>
                                    {statusVal}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
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

                    {contentSubTab === 'templates' && (() => {
                      const visibleTemplates = templatesList.filter((tmpl) => {
                        const q = templateSearch.trim().toLowerCase();
                        const matchQuery =
                          !q ||
                          tmpl.shortName.toLowerCase().includes(q) ||
                          tmpl.name.toLowerCase().includes(q) ||
                          tmpl.badge.toLowerCase().includes(q);
                        const matchFilter =
                          templateVisibilityFilter === 'all' ||
                          (templateVisibilityFilter === 'ats' && !tmpl.hasPhoto) ||
                          (templateVisibilityFilter === 'photo' && tmpl.hasPhoto) ||
                          (templateVisibilityFilter === 'hidden' && !tmpl.isActive);
                        return matchQuery && matchFilter;
                      });

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                Gestor de Modelos (Ordem, Visibilidade, Nome e Tier)
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Alterações de nome, selo, pontuação ATS, ordem e tier refletem ao vivo na Home e no Editor.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="relative w-48 sm:w-56">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={templateSearch}
                                  onChange={(e) => setTemplateSearch(e.target.value)}
                                  placeholder="Filtrar modelo..."
                                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </div>

                              <select
                                value={templateVisibilityFilter}
                                onChange={(e) => setTemplateVisibilityFilter(e.target.value as any)}
                                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                              >
                                <option value="all">Todos ({templatesList.length})</option>
                                <option value="ats">Sem Foto · ATS</option>
                                <option value="photo">Com Foto · Europa</option>
                                <option value="hidden">Ocultos ({templatesList.filter((t) => !t.isActive).length})</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {visibleTemplates.map((tmpl, idx) => {
                              const usageCount = telemetry.templateSelections[tmpl.id] || 0;
                              const isEditingThis = editingTemplate?.id === tmpl.id;
                              return (
                                <div
                                  key={tmpl.id}
                                  className={`p-4 rounded-xl border text-xs space-y-3 ${
                                    tmpl.isActive ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-75'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-[10px] font-bold text-slate-400">
                                          #{tmpl.displayOrder}
                                        </span>
                                        <h4 className="font-bold text-slate-900 text-sm truncate">{tmpl.shortName}</h4>
                                        {tmpl.badge && (
                                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-700 uppercase">
                                            {tmpl.badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                                        ATS {tmpl.atsScore}% · {usageCount} seleções
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditingTemplate(isEditingThis ? null : { ...tmpl })}
                                        className={`p-1 rounded border transition-colors ${
                                          isEditingThis
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                        title="Editar metadados do modelo"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
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
                                        disabled={idx === visibleTemplates.length - 1}
                                        onClick={() => handleMoveTemplateOrder(tmpl.id, 'down')}
                                        className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                                        title="Mover para baixo"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {isEditingThis && editingTemplate && (
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                      <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                          Nome curto
                                        </label>
                                        <input
                                          type="text"
                                          value={editingTemplate.shortName}
                                          onChange={(e) =>
                                            setEditingTemplate({ ...editingTemplate, shortName: e.target.value })
                                          }
                                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-semibold"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                            Selo (Badge)
                                          </label>
                                          <input
                                            type="text"
                                            value={editingTemplate.badge}
                                            onChange={(e) =>
                                              setEditingTemplate({ ...editingTemplate, badge: e.target.value })
                                            }
                                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                            Score ATS %
                                          </label>
                                          <input
                                            type="number"
                                            min={50}
                                            max={100}
                                            value={editingTemplate.atsScore}
                                            onChange={(e) =>
                                              setEditingTemplate({
                                                ...editingTemplate,
                                                atsScore: Number(e.target.value)
                                              })
                                            }
                                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => setEditingTemplate(null)}
                                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveTemplateMeta(editingTemplate)}
                                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-bold"
                                        >
                                          Salvar
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                    <select
                                      value={tmpl.tierRequired}
                                      onChange={(e) => handleTemplateTierChange(tmpl.id, e.target.value as any)}
                                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-xs"
                                    >
                                      <option value="free">Gratuito</option>
                                      <option value="pro">Pro (${financialMetrics.proPrice})</option>
                                      <option value="executive">Executivo VIP (${financialMetrics.execPrice})</option>
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleTemplate(tmpl.id, tmpl.isActive)}
                                      className={`px-3 py-1 rounded-md font-bold text-[11px] whitespace-nowrap ${
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
                      );
                    })()}

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
                        CRM de Utilizadores (
                        {filteredUsers.length !== usersList.length
                          ? `${filteredUsers.length} de ${usersList.length}`
                          : usersList.length}
                        )
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
                              <option value="pro">Pro (${financialMetrics.proPrice})</option>
                              <option value="executive">Executivo VIP (${financialMetrics.execPrice})</option>
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
                                                ? 'bg-slate-900 text-amber-400'
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
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[10px]"
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
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUserAccount(u)}
                                            disabled={
                                              Boolean(
                                                (user?.email || firebaseUser?.email) &&
                                                  u.email.toLowerCase() ===
                                                    (user?.email || firebaseUser?.email || '').toLowerCase()
                                              )
                                            }
                                            className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Eliminar conta permanentemente"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                                placeholder="Pesquisar fatura, cliente, email ou Cód. Extrato (CV...)..."
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
                              <option value="pending_pix">Pendentes Pix</option>
                              <option value="paid">Pagas</option>
                              <option value="pending">Pendentes</option>
                              <option value="refunded">Reembolsadas</option>
                            </select>
                            {(() => {
                              const pendingPixCount = ordersList.filter(
                                (o) => o.status === 'pending' && o.paymentMethod === 'pix'
                              ).length;
                              if (pendingPixCount === 0 && orderStatusFilter !== 'pending_pix') return null;
                              const isActive = orderStatusFilter === 'pending_pix';
                              return (
                                <button
                                  type="button"
                                  onClick={() => setOrderStatusFilter(isActive ? 'all' : 'pending_pix')}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                    isActive
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                                  }`}
                                >
                                  Pendentes Pix ({pendingPixCount})
                                </button>
                              );
                            })()}
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
                                      <td className="p-3 font-mono font-bold text-slate-900">
                                        <div className="flex items-center gap-1.5">
                                          <span>{o.orderNumber}</span>
                                          {o.paymentMethod === 'pix' && o.stripePaymentIntentId && (
                                            <span
                                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-bold border border-slate-200"
                                              title="Código único no extrato bancário Pix (TxID)"
                                            >
                                              {o.stripePaymentIntentId}
                                            </span>
                                          )}
                                        </div>
                                        {o.notes && (
                                          <div className="text-[10px] font-sans font-normal text-slate-500 truncate max-w-[240px]" title={o.notes}>
                                            {o.notes}
                                          </div>
                                        )}
                                      </td>
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
                                        <div className="flex items-center gap-1">
                                          <span>{o.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO'}</span>
                                          {o.receiptUrl && (
                                            <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[9px] font-bold">
                                              Anexo
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            o.status === 'paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : o.status === 'refunded' || o.status === 'failed'
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
                                          <span>{o.receiptUrl ? 'Ver Anexo' : 'Recibo'}</span>
                                        </button>
                                        {o.status === 'pending' && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleRejectOrder(o)}
                                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                                            >
                                              <Ban className="w-3 h-3" />
                                              <span>Recusar</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleApproveOrder(o)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1"
                                            >
                                              <Check className="w-3 h-3" />
                                              <span>Aprovar &amp; Ativar</span>
                                            </button>
                                          </>
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
                                  className="text-[11px] font-semibold text-slate-800 hover:text-slate-950 underline underline-offset-2"
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
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Gerador de Códigos Promocionais &amp; Campanhas</h3>
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

                        {/* 1-Click Marketing Coupon Presets */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-700">Modelos de Campanha (1 Clique):</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { label: 'Boas-Vindas (-20%)', code: 'CARREIRA20', discountPercent: 20, maxUses: 150, expiresDays: 30 },
                              { label: 'Recuperação Checkout (-30%)', code: 'VOLTA30', discountPercent: 30, maxUses: 80, expiresDays: 14 },
                              { label: 'Parceria Corporativa (-50%)', code: 'CORP50', discountPercent: 50, maxUses: 40, expiresDays: 60 },
                              { label: 'Cortesia VIP (100%)', code: 'VIPGRATIS100', discountPercent: 100, maxUses: 10, expiresDays: 15 }
                            ].map((preset) => (
                              <button
                                key={preset.code}
                                type="button"
                                onClick={() => {
                                  setNewCouponForm({
                                    code: preset.code,
                                    discountPercent: preset.discountPercent,
                                    maxUses: preset.maxUses,
                                    expiresDays: preset.expiresDays
                                  });
                                  setShowNewCouponModal(true);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-800 transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {couponsList.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                            Nenhum cupom promocional criado. Clique em &quot;Criar Cupom&quot; ou escolha um modelo acima.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {couponsList.map((cp) => {
                              const pct = Math.min(100, Math.round((cp.usedCount / Math.max(cp.maxUses, 1)) * 100));
                              return (
                                <div key={cp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-slate-900 text-sm">{cp.code}</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded tabular-nums">
                                      {cp.discountPercent}% OFF
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-slate-600 font-mono tabular-nums">
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
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
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

                        {/* 1-Click Marketing Banner Presets */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-700">Campanhas Prontas:</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              {
                                label: 'Conversão Free → Pro (20% OFF)',
                                title: 'Oferta Limitada · -20% no Plano Anual',
                                message: 'Use o código CARREIRA20 no checkout para liberar exportação Word (.docx), Radar ATS e tradução em 5 idiomas.',
                                type: 'promo' as const,
                                targetAudience: 'free_only' as const,
                                actionUrl: '#pricing',
                                actionLabel: 'Ver Planos',
                                daysActive: 14
                              },
                              {
                                label: 'Destaque Tradução Global',
                                title: 'Candidaturas Internacionais em 5 Idiomas',
                                message: 'Converta o seu currículo e carta de apresentação entre Português, Inglês, Espanhol, Francês e Alemão preservando a formatação A4.',
                                type: 'info' as const,
                                targetAudience: 'all' as const,
                                actionUrl: '#editor',
                                actionLabel: 'Abrir Estúdio',
                                daysActive: 30
                              },
                              {
                                label: 'Aviso de Pagamento Pix',
                                title: 'Pagamento Pix Disponível em Reais (BRL)',
                                message: 'Subscreva diretamente via QR Code Pix com confirmação administrativa rápida ou Cartão Internacional imediato.',
                                type: 'promo' as const,
                                targetAudience: 'free_only' as const,
                                actionUrl: '#pricing',
                                actionLabel: 'Ativar Acesso',
                                daysActive: 21
                              }
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setNewBannerForm({
                                    title: preset.title,
                                    message: preset.message,
                                    type: preset.type,
                                    targetAudience: preset.targetAudience,
                                    actionUrl: preset.actionUrl,
                                    actionLabel: preset.actionLabel,
                                    daysActive: preset.daysActive
                                  });
                                  setShowNewBannerModal(true);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-800 transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {bannersList.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                              Nenhum banner ou aviso transversal ativo. Clique em &quot;Novo Banner&quot; ou use uma campanha pronta acima.
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
                        onClick={() => setSecuritySubTab('audit_logs')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                          securitySubTab === 'audit_logs'
                            ? 'bg-white text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Auditoria de Segurança ({auditStats.total})</span>
                        {auditStats.blockedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono">
                            {auditStats.blockedCount} bloq.
                          </span>
                        )}
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

                    {securitySubTab === 'audit_logs' && (
                      <div className="space-y-4">
                        {/* Live Firestore Stream Banner */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                auditLiveStatus === 'live'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : auditLiveStatus === 'error'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                                  Monitor em Tempo Real — Auditoria Firestore
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    auditLiveStatus === 'live'
                                      ? 'bg-emerald-500 text-slate-950'
                                      : auditLiveStatus === 'error'
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-amber-400 text-slate-950'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      auditLiveStatus === 'live' ? 'bg-slate-950 animate-ping' : 'bg-white'
                                    }`}
                                  />
                                  {auditLiveStatus === 'live'
                                    ? 'Stream Firestore Ativo'
                                    : auditLiveStatus === 'connecting'
                                    ? 'A conectar listener...'
                                    : auditLiveStatus === 'error'
                                    ? 'Erro no Listener'
                                    : 'Sem Sessão Firebase'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                {auditLiveError
                                  ? auditLiveError
                                  : auditLiveStatus === 'live'
                                  ? `A receber eventos críticos e sensíveis em tempo real via onSnapshot.${
                                      auditLiveLastAt
                                        ? ` Último pacote: ${new Date(auditLiveLastAt).toLocaleTimeString('pt-PT')}`
                                        : ''
                                    }`
                                  : 'Eventos do servidor carregados; inicie sessão Google/Firebase para escuta em tempo real do Firestore.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg text-xs">
                            <button
                              type="button"
                              onClick={() => setAuditCriticalOnly(true)}
                              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                                auditCriticalOnly
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              Ações Críticas ({auditStats.criticalCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setAuditCriticalOnly(false)}
                              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                                !auditCriticalOnly
                                  ? 'bg-white text-slate-950'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              Todos os Eventos ({auditStats.total})
                            </button>
                          </div>
                        </div>

                        {/* KPI Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Ações Críticas
                            </span>
                            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                              {auditStats.criticalCount}
                            </span>
                          </div>
                          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                              Acessos Bloqueados
                            </span>
                            <span className="text-lg font-black font-mono text-rose-900 mt-0.5 block">
                              {auditStats.blockedCount}
                            </span>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Subscrições
                            </span>
                            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                              {auditStats.subscriptionCount}
                            </span>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Exportações CV
                            </span>
                            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                              {auditStats.cvExportCount}
                            </span>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Perfil &amp; Senha
                            </span>
                            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                              {auditStats.profileCount}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>
                                  {auditCriticalOnly
                                    ? 'Feed em Tempo Real de Ações Críticas & Bloqueios'
                                    : 'Registo Imutável Completo de Auditoria (Firestore + Servidor)'}
                                </span>
                              </h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Filtragem instantânea por utilizador, categoria, severidade e palavra-chave sem recarregar a página.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={loadAllModules}
                                disabled={isRefreshing}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span>Espelhar Servidor → Firestore</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExportCSV('audit_logs')}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Exportar CSV</span>
                              </button>
                            </div>
                          </div>

                          {/* Category Quick Filter Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">
                              Categoria:
                            </span>
                            {(
                              [
                                { id: 'all', label: 'Todas' },
                                { id: 'security', label: 'Segurança / Bloqueios' },
                                { id: 'subscription', label: 'Subscrições' },
                                { id: 'cv_export', label: 'Exportações CV' },
                                { id: 'profile', label: 'Perfil & Acesso' },
                                { id: 'admin', label: 'Administração' }
                              ] as const
                            ).map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setAuditCategoryFilter(cat.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                                  auditCategoryFilter === cat.id
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>

                          {/* Filters Bar: User, Search, Category, Status, Severity */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                            <select
                              aria-label="Filtrar auditoria por utilizador"
                              value={auditUserFilter}
                              onChange={(e) => setAuditUserFilter(e.target.value)}
                              className="lg:col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                            >
                              <option value="all">Utilizador: Todos ({auditActorOptions.length})</option>
                              {auditActorOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} ({opt.count})
                                </option>
                              ))}
                            </select>

                            <div className="lg:col-span-2 relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={auditSearch}
                                onChange={(e) => setAuditSearch(e.target.value)}
                                placeholder="Pesquisar recurso, ação, detalhe ou IP..."
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <select
                              aria-label="Filtrar auditoria por estado"
                              value={auditStatusFilter}
                              onChange={(e) => setAuditStatusFilter(e.target.value as 'all' | AuditLogStatus)}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                            >
                              <option value="all">Estado: Todos</option>
                              <option value="blocked">Bloqueado</option>
                              <option value="failure">Falha</option>
                              <option value="success">Sucesso</option>
                            </select>

                            <select
                              aria-label="Filtrar auditoria por severidade"
                              value={auditSeverityFilter}
                              onChange={(e) => setAuditSeverityFilter(e.target.value as 'all' | AuditLogSeverity)}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                            >
                              <option value="all">Severidade: Todas</option>
                              <option value="critical">Crítico</option>
                              <option value="warning">Aviso</option>
                              <option value="info">Info</option>
                            </select>
                          </div>

                          {/* Active Filter Clear Bar */}
                          {(auditUserFilter !== 'all' ||
                            auditCategoryFilter !== 'all' ||
                            auditStatusFilter !== 'all' ||
                            auditSeverityFilter !== 'all' ||
                            auditSearch.trim() !== '') && (
                            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                              <span className="text-slate-600">
                                A exibir <strong>{filteredAuditLogs.length}</strong> registo(s) com os filtros ativos.
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAuditUserFilter('all');
                                  setAuditCategoryFilter('all');
                                  setAuditStatusFilter('all');
                                  setAuditSeverityFilter('all');
                                  setAuditSearch('');
                                }}
                                className="font-bold text-slate-900 underline"
                              >
                                Repor todos os filtros
                              </button>
                            </div>
                          )}

                          {/* Audit Entries */}
                          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                            {filteredAuditLogs.length === 0 ? (
                              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                                Nenhum registo de auditoria encontrado com os filtros selecionados.
                              </div>
                            ) : (
                              filteredAuditLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                    log.status === 'blocked' || log.severity === 'critical'
                                      ? 'bg-rose-50/70 border-rose-200'
                                      : log.severity === 'warning'
                                      ? 'bg-amber-50/50 border-amber-200'
                                      : 'bg-slate-50/80 border-slate-200'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                          log.severity === 'critical'
                                            ? 'bg-rose-600 text-white'
                                            : log.severity === 'warning'
                                            ? 'bg-amber-200 text-amber-950'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {log.severity}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                          log.status === 'blocked'
                                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                            : log.status === 'failure'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {log.status === 'blocked'
                                          ? 'BLOQUEADO'
                                          : log.status === 'failure'
                                          ? 'FALHA'
                                          : 'SUCESSO'}
                                      </span>
                                      <span className="font-bold text-slate-900">
                                        {ADMIN_AUDIT_ACTION_LABELS[log.action] || log.action}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                                        {ADMIN_AUDIT_CATEGORY_LABELS[log.category] || log.category}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                                    </span>
                                  </div>

                                  <p className="text-slate-700 leading-relaxed">{log.details}</p>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/70">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAuditUserFilter(
                                          (log.actorEmail || log.actorUserId || 'anonymous').trim().toLowerCase()
                                        )
                                      }
                                      className="text-left hover:underline"
                                      title="Filtrar apenas eventos deste utilizador"
                                    >
                                      Ator: <strong className="text-slate-800">{log.actorEmail}</strong> ({log.actorRole})
                                    </button>
                                    <span>
                                      Alvo: <strong className="text-slate-800">{log.targetResource}</strong>
                                    </span>
                                    {log.ipAddress && (
                                      <span>
                                        IP: <strong className="text-slate-800">{log.ipAddress}</strong>
                                      </span>
                                    )}
                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                      <span className="text-[10px] text-slate-500">
                                        {Object.entries(log.metadata)
                                          .slice(0, 4)
                                          .map(([k, v]) => `${k}=${String(v)}`)
                                          .join(' · ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                                  Se desativado, bloqueia criação de novas contas no AuthModal e no servidor.
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

                            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    Proteção Anti-Robôs no Registo (CAPTCHA de Soma + Honeypot + E-mails Temp)
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold whitespace-nowrap">
                                    Ativo · Sem chaves externas
                                  </span>
                                  {(() => {
                                    const botBlockedCount = auditLogsList.filter(
                                      (l) =>
                                        l.targetResource === '/api/auth/register' &&
                                        l.status === 'blocked'
                                    ).length;
                                    return (
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold whitespace-nowrap">
                                        {botBlockedCount} robô(s) bloqueado(s)
                                      </span>
                                    );
                                  })()}
                                </div>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Exige soma visual gerada em SVG no servidor, tempo mínimo humano, campos armadilha invisíveis, bloqueio de e-mails descartáveis e limite por IP.
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={platformSettings.enableBotProtection !== false}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    enableBotProtection: e.target.checked
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

                        {/* Personal Pix Key + Stripe Card Status */}
                        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5">
                            <div>
                              <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                                <QrCode className="w-4 h-4 text-teal-700" />
                                <span>Pix Direto (Conta Pessoal) &amp; Cartão de Crédito (Stripe)</span>
                              </h4>
                              <p className="text-[11px] text-teal-900/80 mt-0.5">
                                Os pagamentos Pix vão direto para a sua chave pessoal com código único de identificação no extrato (<code className="px-1 py-0.5 bg-white rounded font-mono text-[10px]">CV...</code>) e conferência rápida no painel.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap bg-teal-100 text-teal-900 border border-teal-200">
                                Pix Direto Ativo (Conta Pessoal)
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap inline-flex items-center gap-1 ${
                                  cardGatewayHealth?.ready
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                                title={cardGatewayHealth?.error || 'Status da integração com Cartão de Crédito'}
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>
                                  {cardGatewayHealth?.ready
                                    ? `Cartão Stripe (${cardGatewayHealth.secretMode === 'live' ? 'Produção' : 'Teste'}) OK`
                                    : cardGatewayHealth
                                    ? 'Cartão Stripe: Verificar Chaves'
                                    : 'Verificando Cartão...'}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-white border border-teal-200 text-[11px] text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900">Conciliação bancária facilitada:</strong>{' '}
                              Cada QR Code / Copia e Cola gera um código único (<code className="px-1 py-0.5 bg-slate-100 rounded font-mono text-[10px]">CV...</code>) gravado no extrato do Pix + print do comprovante (com Ctrl+V). Ao aprovar em 1 clique no painel, a conta do cliente ativa automaticamente na hora.
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
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              Administradores Ativos no Sistema
                            </h3>
                            <span className="text-[11px] font-mono text-slate-500">
                              Allowlist + Papel Admin
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                            {Array.from(
                              new Map<string, { id: string; name: string; email: string }>([
                                ...ADMIN_EMAILS.map(
                                  (email): [string, { id: string; name: string; email: string }] => [
                                    email.toLowerCase(),
                                    {
                                      id: `allow-${email}`,
                                      name: email.split('@')[0],
                                      email
                                    }
                                  ]
                                ),
                                ...usersList
                                  .filter((u) => u.role === 'admin' || isUserAdmin(u.email, u.role))
                                  .map(
                                    (u): [string, { id: string; name: string; email: string }] => [
                                      u.email.toLowerCase(),
                                      { id: u.id, name: u.name, email: u.email }
                                    ]
                                  )
                              ]).values()
                            ).map((adm) => (
                              <div
                                key={adm.email}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{adm.name}</p>
                                  <p className="text-[11px] font-mono text-slate-500 truncate">{adm.email}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[10px] font-bold uppercase shrink-0">
                                  ADMIN
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

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
                                    <span className="font-mono text-slate-900 font-bold">{log.targetUserEmail}</span>
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

                {/* ========================================================= */}
                {/* MÓDULO 7: CHAT DE SUPORTE & MODERAÇÃO EM TEMPO REAL */}
                {/* ========================================================= */}
                {activeModule === 'support_chat' && (() => {
                  const safeThreads = (supportThreads || []).filter((t): t is SupportChatThread => Boolean(t && t.id));
                  const filteredThreads = safeThreads.filter((th) => {
                    if (chatFilter === 'unread' && !(th.unreadByAdmin > 0)) return false;
                    if (chatFilter === 'open' && th.status !== 'open') return false;
                    if (chatFilter === 'resolved' && th.status !== 'resolved') return false;
                    const q = chatSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (th.userName || '').toLowerCase().includes(q) ||
                      (th.userEmail || '').toLowerCase().includes(q) ||
                      (th.lastMessageText || '').toLowerCase().includes(q)
                    );
                  });
                  const activeThread =
                    safeThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || null;
                  const crmUserForThread = activeThread
                    ? usersList.find(
                        (u) =>
                          u.id === activeThread.userId ||
                          (u.email || '').toLowerCase() === (activeThread.userEmail || '').toLowerCase()
                      )
                    : undefined;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)] min-h-[520px]">
                      {/* Left Column: Conversations Inbox */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/70">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4 text-amber-600" />
                              Conversas ({supportThreads.length})
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                supportWsStatus === 'connected' || supportWsStatus === 'disconnected'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {supportWsStatus === 'connected' || supportWsStatus === 'disconnected' ? (
                                <Wifi className="w-3 h-3" />
                              ) : (
                                <WifiOff className="w-3 h-3" />
                              )}
                              {supportWsStatus === 'connected'
                                ? 'Tempo Real'
                                : supportWsStatus === 'disconnected'
                                ? 'HTTPS / Cloud'
                                : 'A sincronizar'}
                            </span>
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={chatSearch}
                              onChange={(e) => setChatSearch(e.target.value)}
                              placeholder="Pesquisar utilizador ou mensagem..."
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                            {(
                              [
                                { id: 'all', label: 'Todos' },
                                { id: 'unread', label: `Não Lidos (${unreadSupportChatCount})` },
                                { id: 'open', label: 'Abertos' },
                                { id: 'resolved', label: 'Resolvidos' }
                              ] as const
                            ).map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setChatFilter(tab.id)}
                                className={`py-1 px-1.5 rounded-md truncate transition-colors ${
                                  chatFilter === tab.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                          {filteredThreads.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                              <MessageCircle className="w-7 h-7 text-slate-300 mx-auto" />
                              <p className="font-semibold text-slate-700">Nenhuma conversa encontrada</p>
                              <p className="text-[11px] text-slate-400">
                                Quando utilizadores registados enviarem mensagens pelo ícone de chat, aparecem aqui em tempo real.
                              </p>
                            </div>
                          ) : (
                            filteredThreads.map((th) => {
                              const isSelected = activeThread?.id === th.id;
                              const hasUnread = th.unreadByAdmin > 0;
                              return (
                                <button
                                  key={th.id}
                                  type="button"
                                  onClick={() => handleSelectSupportThread(th.id)}
                                  className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                                    isSelected
                                      ? 'bg-slate-900 text-white'
                                      : hasUnread
                                      ? 'bg-amber-50/70 hover:bg-amber-50 text-slate-900'
                                      : 'bg-white hover:bg-slate-50 text-slate-900'
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${
                                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'
                                    }`}
                                  >
                                    {th.userAvatarUrl ? (
                                      <img src={th.userAvatarUrl} alt={th.userName} className="w-full h-full object-cover" />
                                    ) : (
                                      (th.userName || th.userEmail || 'U').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-xs font-bold truncate">{th.userName}</span>
                                      <span
                                        className={`text-[10px] font-mono tabular-nums shrink-0 ${
                                          isSelected ? 'text-slate-300' : 'text-slate-400'
                                        }`}
                                      >
                                        {new Date(th.lastMessageAt).toLocaleTimeString('pt-PT', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-[11px] truncate ${
                                        isSelected ? 'text-slate-300' : 'text-slate-500'
                                      }`}
                                    >
                                      {th.lastMessageText || th.userEmail}
                                    </p>
                                    <div className="flex items-center justify-between gap-1.5 mt-1">
                                      <span
                                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                          th.status === 'resolved'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : isSelected
                                            ? 'bg-slate-800 text-amber-300'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {th.status === 'resolved' ? 'Resolvido' : 'Aberto'}
                                      </span>
                                      {hasUnread && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold leading-none">
                                          {th.unreadByAdmin}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right Column: Conversation Thread & Reply Composer */}
                      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                        {!activeThread ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500 space-y-2">
                            <MessageCircle className="w-10 h-10 text-slate-300" />
                            <p className="text-sm font-bold text-slate-800">Selecione uma conversa para responder</p>
                            <p className="max-w-sm text-slate-500">
                              Também pode iniciar uma conversa diretamente a partir da ficha CRM 360° de qualquer utilizador registado.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-slate-900 truncate">
                                    {activeThread.userName}
                                  </h3>
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                    {(activeThread.userPlan || 'free').toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-500 truncate">
                                  {activeThread.userEmail}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {crmUserForThread && (
                                  <button
                                    type="button"
                                    onClick={() => openUserDrawer(crmUserForThread)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                                  >
                                    Ver Ficha CRM
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSupportThreadStatus(activeThread)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                                    activeThread.status === 'resolved'
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {activeThread.status === 'resolved' ? (
                                    <>
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Reabrir Ticket</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Marcar Resolvido</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
                              {(activeThread.messages || []).length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                  Sem mensagens ainda. Envie a primeira mensagem abaixo para iniciar atendimento.
                                </div>
                              ) : (
                                (activeThread.messages || []).map((m) => {
                                  const isAdminMsg = m.senderRole === 'admin';
                                  return (
                                    <div
                                      key={m.id}
                                      className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                                        <span className="font-bold">
                                          {isAdminMsg ? m.senderName || 'Admin / Moderador' : activeThread.userName}
                                        </span>
                                        <span className="font-mono tabular-nums text-slate-400">
                                          {new Date(m.createdAt).toLocaleString('pt-PT', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      <div
                                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap wrap-break-word ${
                                          isAdminMsg
                                            ? 'bg-slate-900 text-white rounded-tr-xs'
                                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-2xs'
                                        }`}
                                      >
                                        {m.text}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              <div ref={adminChatEndRef} />
                            </div>

                            <form
                              onSubmit={handleSendAdminChatReply}
                              className="p-3 bg-white border-t border-slate-200 flex items-end gap-2"
                            >
                              <textarea
                                rows={2}
                                maxLength={2000}
                                value={adminChatReply}
                                onChange={(e) => setAdminChatReply(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void handleSendAdminChatReply();
                                  }
                                }}
                                placeholder={`Responder para ${activeThread.userName}...`}
                                className="flex-1 resize-none px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              <button
                                type="submit"
                                disabled={!adminChatReply.trim() || isSendingChatReply}
                                className="h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isSendingChatReply ? 'A enviar...' : 'Responder'}</span>
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200"
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
                    onClick={() => handleOpenSupportChatForUser(inspectedUser)}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Abrir Chat de Suporte</span>
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

              {/* Saved Resumes for this User */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Currículos Guardados ({drawerResumes.length})
                </h4>
                {isLoadingDrawerResumes ? (
                  <p className="text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    A carregar currículos da conta...
                  </p>
                ) : drawerResumes.length === 0 ? (
                  <p className="text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    Nenhum currículo guardado encontrado para este utilizador.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {drawerResumes.map((resItem) => (
                      <div
                        key={resItem.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{resItem.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {resItem.targetJob || 'Sem cargo alvo definido'}
                          </p>
                        </div>
                        {resItem.updatedAt && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(resItem.updatedAt).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Iniciar Sessão de Personificação</h3>
                <p className="text-slate-500 text-[11px]">Acesso com registo estrito de auditoria</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-slate-800 border border-slate-200 leading-relaxed">
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
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
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
              <button
                type="button"
                onClick={() => {
                  setShowNewUserModal(false);
                  setNewUserError(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setNewUserError(null);
                setIsCreatingUser(true);
                try {
                  await createManualCustomer({
                    name: newUserForm.name,
                    email: newUserForm.email,
                    password: newUserForm.password || undefined,
                    plan: newUserForm.plan,
                    phone: newUserForm.phone,
                    role: newUserForm.role,
                    creditsRemaining: newUserForm.plan === 'free' ? 5 : newUserForm.credits,
                    notes: newUserForm.notes
                  });
                  setShowNewUserModal(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    password: '',
                    plan: 'pro',
                    phone: '',
                    role: 'user',
                    credits: 9999,
                    notes: ''
                  });
                  loadAllModules();
                  showNotification(`Utilizador ${newUserForm.name} cadastrado!`);
                } catch (err: any) {
                  setNewUserError(err?.message || 'Erro ao criar utilizador.');
                } finally {
                  setIsCreatingUser(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              {newUserError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium">
                  {newUserError}
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Telefone (opcional)</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="+351..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Palavra-passe inicial (opcional, mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Deixe vazio se o cliente usar login Google"
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
                    <option value="pro">Pro (${financialMetrics.proPrice})</option>
                    <option value="executive">Executivo VIP (${financialMetrics.execPrice})</option>
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
                  onClick={() => {
                    setShowNewUserModal(false);
                    setNewUserError(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {isCreatingUser ? 'A criar...' : 'Criar Utilizador'}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90dvh] overflow-y-auto p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Comprovativo &amp; Validação de Fatura</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-black font-mono text-slate-900">{selectedInvoice.orderNumber}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedInvoice.status === 'refunded' || selectedInvoice.status === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
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
                  {selectedInvoice.paymentMethod === 'pix' ? 'PIX (Conta Pessoal)' : 'CARTÃO (Stripe)'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                <span className="font-bold text-slate-700">Total:</span>
                <strong className="font-mono text-slate-950">
                  {selectedInvoice.currency === 'BRL'
                    ? `R$ ${Number(selectedInvoice.amount).toFixed(2)} BRL`
                    : `$${selectedInvoice.amount} ${selectedInvoice.currency}`}
                </strong>
              </div>
            </div>

            {selectedInvoice.paymentMethod === 'pix' && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    Conferência Bancária Pix (Compare com seu extrato)
                  </span>
                  {selectedInvoice.stripePaymentIntentId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedInvoice.stripePaymentIntentId || '');
                        showNotification('Código do extrato copiado.');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-amber-300 text-[10px] font-mono font-bold text-amber-950 hover:bg-amber-100"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar {selectedInvoice.stripePaymentIntentId}</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-amber-100">
                    <span className="text-[10px] text-slate-400 block">1. Valor esperado</span>
                    <strong className="font-mono text-slate-900">
                      {selectedInvoice.currency === 'BRL'
                        ? `R$ ${Number(selectedInvoice.amount).toFixed(2)}`
                        : `$${selectedInvoice.amount} ${selectedInvoice.currency}`}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-100">
                    <span className="text-[10px] text-slate-400 block">2. Cód. no Extrato (TxID)</span>
                    <strong className="font-mono text-teal-800">
                      {selectedInvoice.stripePaymentIntentId || '—'}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-100">
                    <span className="text-[10px] text-slate-400 block">3. Pagador informado</span>
                    <strong className="text-slate-900 truncate block">{selectedInvoice.userName}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-100">
                    <span className="text-[10px] text-slate-400 block">4. Conta / E-mail</span>
                    <strong className="font-mono text-slate-700 truncate block">{selectedInvoice.userEmail}</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedInvoice.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Dados Informados / Histórico
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed break-words">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}

            {selectedInvoice.receiptUrl && (
              <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Comprovante Anexado
                  </span>
                  {invoiceReceiptPreviewUrl && (
                    <a
                      href={invoiceReceiptPreviewUrl}
                      download={`comprovante-${selectedInvoice.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar / Abrir</span>
                    </a>
                  )}
                </div>
                {invoiceReceiptLoading && (
                  <p className="text-[11px] text-slate-500">A carregar comprovante...</p>
                )}
                {invoiceReceiptError && (
                  <p className="text-[11px] text-rose-600">{invoiceReceiptError}</p>
                )}
                {invoiceReceiptPreviewUrl && invoiceReceiptMime.startsWith('image/') && (
                  <img
                    src={invoiceReceiptPreviewUrl}
                    alt={`Comprovante ${selectedInvoice.orderNumber}`}
                    className="w-full max-h-64 object-contain rounded-lg border border-slate-200 bg-white"
                  />
                )}
                {invoiceReceiptPreviewUrl && invoiceReceiptMime === 'application/pdf' && (
                  <iframe
                    src={invoiceReceiptPreviewUrl}
                    title={`Comprovante PDF ${selectedInvoice.orderNumber}`}
                    className="w-full h-56 rounded-lg border border-slate-200 bg-white"
                  />
                )}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              {selectedInvoice.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRejectOrder(selectedInvoice)}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveOrder(selectedInvoice)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprovar &amp; Ativar</span>
                  </button>
                </>
              )}
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

      {/* IN-APP CONFIRMATION DIALOG */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingConfirm.variant === 'danger'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{pendingConfirm.title}</h3>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{pendingConfirm.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isRunningConfirm}
                onClick={() => setPendingConfirm(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRunningConfirm}
                onClick={async () => {
                  try {
                    setIsRunningConfirm(true);
                    await pendingConfirm.onConfirm();
                    setPendingConfirm(null);
                  } finally {
                    setIsRunningConfirm(false);
                  }
                }}
                className={`px-4 py-2 font-bold rounded-lg text-white disabled:opacity-50 ${
                  pendingConfirm.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isRunningConfirm ? 'A processar...' : pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
