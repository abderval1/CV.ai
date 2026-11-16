import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  PromptTemplateConfig,
  AiModelRoutingConfig,
  PlanCreditQuota,
  TemplateAdminItem,
  ProfessionSnippetExample,
  SystemLocaleTranslation,
  ImpersonationAuditLog,
  SystemAnnouncementBanner,
  TechnicalGenerationErrorLog,
  GdprDataRequest,
  AdminRolePermission,
  FinancialMetrics,
  EditablePlanConfig,
  PlatformSettingsConfig,
  FrontendTelemetryData
} from '../types/adminModules';
import { CV_TEMPLATES } from '../data/templateCatalog';
import { SECTION_TITLES_BY_LANG } from '../utils/cvDocumentLabels';

// -------------------------------------------------------------
// 1. DEFAULT DATASETS FOR THE 6 MODULES
// -------------------------------------------------------------

export const DEFAULT_PROMPT_CONFIGS: PromptTemplateConfig[] = [
  {
    id: 'coverLetter',
    name: 'Carta de Apresentação Executiva',
    category: 'Candidatura',
    description: 'Redige carta de motivação personalizada para a vaga de acordo com a senioridade e métricas do candidato.',
    systemInstruction: 'Atue como Diretor Executivo de Recrutamento Internacional. Gere cartas em tom formal, direto, sem chavões vazios e estruturadas em introdução, impacto quantificável e conclusão de alto nível.',
    userPromptTemplate: 'Gere uma carta de apresentação para o cargo de {{jobTitle}} na empresa {{companyName}}, destacando as competências: {{skills}} e conquistas: {{highlights}}.',
    variables: ['jobTitle', 'companyName', 'skills', 'highlights'],
    temperature: 0.35,
    preferredModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-3.1-flash-lite',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  },
  {
    id: 'experienceOptimizer',
    name: 'Otimizador de Conquistas (Fórmula Google XYZ)',
    category: 'Otimização',
    description: 'Transforma descrições passivas de cargos em balas executivas mensuráveis (Atingiu X medido por Y fazendo Z).',
    systemInstruction: 'Transforme qualquer tarefa ou responsabilidade em realizações com métricas, verbos de ação executivos e impacto em receita, custo ou eficiência.',
    userPromptTemplate: 'Otimize a seguinte realização profissional aplicando a fórmula Google XYZ: {{rawText}} para o cargo de {{role}}.',
    variables: ['rawText', 'role'],
    temperature: 0.25,
    preferredModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-3.1-flash-lite',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  },
  {
    id: 'resumeSummary',
    name: 'Resumo Profissional de Alto Impacto',
    category: 'Otimização',
    description: 'Síntese executiva de 3 a 5 linhas com densidade semântica para indexação em robôs ATS.',
    systemInstruction: 'Gere um resumo profissional conciso, com anos de experiência, especialidade central e 2 conquistas quantificáveis.',
    userPromptTemplate: 'Escreva um resumo executivo para o perfil com as experiências {{experiences}} e foco na área de {{targetRole}}.',
    variables: ['experiences', 'targetRole'],
    temperature: 0.3,
    preferredModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-3.1-flash-lite',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  },
  {
    id: 'atsScanner',
    name: 'Radar ATS & Extração de Palavras-Chave',
    category: 'Otimização',
    description: 'Audita descrição da vaga contra o currículo e identifica termos faltantes essenciais.',
    systemInstruction: 'Atue como motor semântico OCR para Workday e Taleo. Extraia competências requeridas, ferramentas técnicas e grau de correspondência.',
    userPromptTemplate: 'Analise o currículo {{cvContent}} contra a descrição da vaga {{jobDescription}} e retorne as palavras-chave críticas faltantes.',
    variables: ['cvContent', 'jobDescription'],
    temperature: 0.15,
    preferredModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-3.1-flash-lite',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  },
  {
    id: 'interviewSim',
    name: 'Simulador de Entrevista STAR',
    category: 'Simulador',
    description: 'Gera 5 perguntas situacionais e técnicas com avaliação STAR e sugestão de melhoria.',
    systemInstruction: 'Simule entrevista de alto nível. Avalie Situação, Tarefa, Ação e Resultado de cada resposta.',
    userPromptTemplate: 'Gere perguntas de entrevista para o cargo de {{targetRole}} no setor de {{industry}}.',
    variables: ['targetRole', 'industry'],
    temperature: 0.4,
    preferredModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-flash-latest',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  },
  {
    id: 'translateDoc',
    name: 'Tradução Integral de CV & Carta',
    category: 'Tradução',
    description: 'Traduz integralmente termos técnicos e cargos mantendo jargão corporativo nativo.',
    systemInstruction: 'Traduza o documento mantendo fidelidade absoluta à terminologia executiva do país de destino.',
    userPromptTemplate: 'Traduza o conteúdo {{content}} para o idioma {{targetLanguage}} preservando siglas técnicas e estrutura.',
    variables: ['content', 'targetLanguage'],
    temperature: 0.1,
    preferredModel: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-4-hydrogen',
    updatedAt: new Date().toISOString(),
    updatedBy: 'gugurai923@gmail.com'
  }
];

export const DEFAULT_AI_ROUTING: AiModelRoutingConfig = {
  primaryModel: 'gemini-4-hydrogen',
  fallbackModel: 'gemini-3.1-flash-lite',
  costSavingModel: 'gemini-3.1-flash-lite',
  advancedReasoningModel: 'gemini-4-hydrogen',
  maxRetries: 3,
  timeoutMs: 8000,
  healthStatus: {
    'gemini-4-hydrogen': { status: 'healthy', latencyMs: 420 },
    'gemini-3.1-flash-lite': { status: 'healthy', latencyMs: 260 },
    'gemini-flash-latest': { status: 'healthy', latencyMs: 310 }
  }
};

export const DEFAULT_PLAN_QUOTAS: PlanCreditQuota[] = [
  {
    planId: 'free',
    planName: 'Gratuito (Degustação)',
    monthlyCredits: 5,
    unlimited: false,
    maxResumes: 1,
    allowAiTailor: false,
    allowInterviewSim: false,
    allowCoverLetter: false,
    allowAtsRadar: false
  },
  {
    planId: 'pro',
    planName: 'Profissional Pro',
    monthlyCredits: 9999,
    unlimited: true,
    maxResumes: 9999,
    allowAiTailor: true,
    allowInterviewSim: false,
    allowCoverLetter: true,
    allowAtsRadar: true
  },
  {
    planId: 'executive',
    planName: 'Executivo VIP',
    monthlyCredits: 9999,
    unlimited: true,
    maxResumes: 9999,
    allowAiTailor: true,
    allowInterviewSim: true,
    allowCoverLetter: true,
    allowAtsRadar: true
  }
];

export const DEFAULT_ADMIN_TEMPLATES: TemplateAdminItem[] = CV_TEMPLATES.map((tmpl, idx) => ({
  id: tmpl.id,
  name: tmpl.name,
  shortName: tmpl.shortName,
  category: tmpl.category,
  hasPhoto: tmpl.hasPhoto,
  tierRequired: tmpl.id === 'executive_harvard' || tmpl.id === 'un_classic' ? 'executive' : 'pro',
  isActive: true,
  displayOrder: idx + 1,
  atsScore: tmpl.atsScore,
  badge: tmpl.badge
}));

export const DEFAULT_PROFESSION_SNIPPETS: ProfessionSnippetExample[] = [
  {
    id: 'snip-eng',
    profession: 'Engenheiro de Software & Tech Lead',
    area: 'Tecnologia',
    sampleTitle: 'Staff Cloud Architect | Kubernetes, AWS & Microsserviços',
    sampleSummary: 'Arquiteto de sistemas distribuídos com 10+ anos de experiência liderando migrações cloud em larga escala, reduzindo custos de infraestrutura e elevando SLAs para 99.99%.',
    sampleBullets: [
      'Reduziu a latência p99 de 420ms para 58ms em microsserviços com tráfego superior a 40k req/s.',
      'Liderou migração de monólito para Kubernetes (EKS) diminuindo custos de cloud em $180k/ano.',
      'Supervisionou equipa de 14 engenheiros sênior implementando práticas de CI/CD automatizadas.'
    ],
    sampleSkills: ['Kubernetes', 'AWS Solutions Architect', 'gRPC', 'Golang', 'Terraform', 'PostgreSQL', 'Docker']
  },
  {
    id: 'snip-coo',
    profession: 'Diretor de Operações (COO)',
    area: 'Gestão & Executivo',
    sampleTitle: 'Chief Operating Officer (COO) | Gestão de Operações & P&L',
    sampleSummary: 'Executivo de operações com mais de 12 anos liderando reestruturações corporativas, gestão de orçamento multinacional de $35M e liderança de equipas com mais de 140 colaboradores.',
    sampleBullets: [
      'Reestruturou cadeia de suprimentos e processos operacionais, gerando economia auditada de US$ 4.2M.',
      'Aumentou a margem operacional bruta em 8.4 pontos percentuais através de automação de fluxos Lean.',
      'Liderou comités de governança e auditoria operacional em conformidade com normas ISO 9001 e SOX.'
    ],
    sampleSkills: ['Gestão P&L', 'Lean Six Sigma', 'Governança Corporativa', 'OKRs Estratégicos', 'Due Diligence M&A']
  },
  {
    id: 'snip-cfo',
    profession: 'Diretor Financeiro (CFO)',
    area: 'Finanças',
    sampleTitle: 'VP de Finanças Corporativas & Tesouraria Global',
    sampleSummary: 'Líder financeiro experiente em captação de dívida estruturada, modelagem DCF, auditorias Big 4 e relações internacionais com investidores institucionais.',
    sampleBullets: [
      'Conduziu captação de dívida sindicalizada de €60M com taxa de juro 1.8% abaixo da média de mercado.',
      'Coordenou due diligence financeira em 3 processos de fusões e aquisições avaliados em $95M.',
      'Implantou políticas ativas de proteção cambial (hedging), protegendo 98% da exposição líquida.'
    ],
    sampleSkills: ['IFRS / US GAAP', 'Modelagem DCF', 'Hedging Cambial', 'Sarbanes-Oxley (SOX)', 'Planeamento Tributário']
  },
  {
    id: 'snip-sales',
    profession: 'Diretor Comercial & Vendas B2B',
    area: 'Comercial',
    sampleTitle: 'Head of Sales & Parcerias Estratégicas B2B',
    sampleSummary: 'Líder comercial especialista em vendas consultivas enterprise, expansão de canais internacionais e construção de pipelines previsíveis acima de $20M.',
    sampleBullets: [
      'Superou metas de faturamento anual em 134%, adicionando €14.8M de ARR em contas Fortune 500.',
      'Estruturou equipa comercial de 22 executivos (SDRs e Account Executives) com redução de 40% no ciclo de vendas.',
      'Fechou contrato corporativo de 5 anos no valor de $8.5M com conglomerado líder do setor.'
    ],
    sampleSkills: ['Vendas B2B Enterprise', 'Gestão de Pipeline', 'CRM Salesforce', 'Negociação C-Level', 'Previsão de Receita']
  }
];

export const DEFAULT_LOCALES: SystemLocaleTranslation[] = [
  {
    languageCode: 'pt',
    languageName: 'Português',
    flag: '🇵🇹',
    sectionSummary: SECTION_TITLES_BY_LANG.pt.summary,
    sectionExperiences: SECTION_TITLES_BY_LANG.pt.experiences,
    sectionEducations: SECTION_TITLES_BY_LANG.pt.educations,
    sectionCompetencies: SECTION_TITLES_BY_LANG.pt.competencies,
    sectionLanguages: SECTION_TITLES_BY_LANG.pt.languages,
    sectionTrainings: SECTION_TITLES_BY_LANG.pt.trainings,
    sectionReferences: SECTION_TITLES_BY_LANG.pt.references,
    lastUpdated: new Date().toISOString()
  },
  {
    languageCode: 'en',
    languageName: 'English (US/UK)',
    flag: '🇺🇸',
    sectionSummary: SECTION_TITLES_BY_LANG.en.summary,
    sectionExperiences: SECTION_TITLES_BY_LANG.en.experiences,
    sectionEducations: SECTION_TITLES_BY_LANG.en.educations,
    sectionCompetencies: SECTION_TITLES_BY_LANG.en.competencies,
    sectionLanguages: SECTION_TITLES_BY_LANG.en.languages,
    sectionTrainings: SECTION_TITLES_BY_LANG.en.trainings,
    sectionReferences: SECTION_TITLES_BY_LANG.en.references,
    lastUpdated: new Date().toISOString()
  },
  {
    languageCode: 'es',
    languageName: 'Español',
    flag: '🇪🇸',
    sectionSummary: SECTION_TITLES_BY_LANG.es.summary,
    sectionExperiences: SECTION_TITLES_BY_LANG.es.experiences,
    sectionEducations: SECTION_TITLES_BY_LANG.es.educations,
    sectionCompetencies: SECTION_TITLES_BY_LANG.es.competencies,
    sectionLanguages: SECTION_TITLES_BY_LANG.es.languages,
    sectionTrainings: SECTION_TITLES_BY_LANG.es.trainings,
    sectionReferences: SECTION_TITLES_BY_LANG.es.references,
    lastUpdated: new Date().toISOString()
  },
  {
    languageCode: 'fr',
    languageName: 'Français',
    flag: '🇫🇷',
    sectionSummary: SECTION_TITLES_BY_LANG.fr.summary,
    sectionExperiences: SECTION_TITLES_BY_LANG.fr.experiences,
    sectionEducations: SECTION_TITLES_BY_LANG.fr.educations,
    sectionCompetencies: SECTION_TITLES_BY_LANG.fr.competencies,
    sectionLanguages: SECTION_TITLES_BY_LANG.fr.languages,
    sectionTrainings: SECTION_TITLES_BY_LANG.fr.trainings,
    sectionReferences: SECTION_TITLES_BY_LANG.fr.references,
    lastUpdated: new Date().toISOString()
  },
  {
    languageCode: 'de',
    languageName: 'Deutsch',
    flag: '🇩🇪',
    sectionSummary: SECTION_TITLES_BY_LANG.de.summary,
    sectionExperiences: SECTION_TITLES_BY_LANG.de.experiences,
    sectionEducations: SECTION_TITLES_BY_LANG.de.educations,
    sectionCompetencies: SECTION_TITLES_BY_LANG.de.competencies,
    sectionLanguages: SECTION_TITLES_BY_LANG.de.languages,
    sectionTrainings: SECTION_TITLES_BY_LANG.de.trainings,
    sectionReferences: SECTION_TITLES_BY_LANG.de.references,
    lastUpdated: new Date().toISOString()
  }
];

export const DEFAULT_BANNERS: SystemAnnouncementBanner[] = [];

export const DEFAULT_ERROR_LOGS: TechnicalGenerationErrorLog[] = [];

export const DEFAULT_GDPR_REQUESTS: GdprDataRequest[] = [];

export const DEFAULT_RBAC_PERMISSIONS: AdminRolePermission[] = [
  {
    role: 'super_admin',
    title: 'Super Administrador (Owner)',
    description: 'Acesso irrestrito a todos os módulos, faturamento, prompts, templates e eliminação definitiva de dados.',
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
    title: 'Agente de Suporte ao Cliente',
    description: 'Pode consultar utilizadores, conceder créditos cortesia, ver erros e aceder via Impersonate, sem alterar preços ou prompts.',
    canViewFinances: false,
    canEditPrompts: false,
    canManageTemplates: false,
    canImpersonateUsers: true,
    canRefundOrders: true,
    canManagePrices: false,
    canViewErrorLogs: true,
    canProcessGdpr: false
  },
  {
    role: 'content_manager',
    title: 'Gestor de Conteúdo & Marketing',
    description: 'Gere templates, snippets de profissões, textos de idiomas, cupons e banners de comunicação.',
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

// -------------------------------------------------------------
// ONE-TIME LEGACY SEED CLEANUP FOR PRODUCTION
// -------------------------------------------------------------

function purgeLegacySeedStorageOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem('curriculopro_prod_reset_v1') === '1') return;

    const legacyBannerIds = new Set(['ban-launch', 'ban-upgrade']);
    const rawBanners = localStorage.getItem('curriculopro_banners');
    if (rawBanners) {
      try {
        const parsed = JSON.parse(rawBanners);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((b: any) => !legacyBannerIds.has(b?.id));
          localStorage.setItem('curriculopro_banners', JSON.stringify(filtered));
        }
      } catch {
        localStorage.removeItem('curriculopro_banners');
      }
    }

    const legacyErrorIds = new Set(['err-101', 'err-102', 'err-103']);
    const rawErrors = localStorage.getItem('curriculopro_error_logs');
    if (rawErrors) {
      try {
        const parsed = JSON.parse(rawErrors);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((e: any) => !legacyErrorIds.has(e?.id));
          localStorage.setItem('curriculopro_error_logs', JSON.stringify(filtered));
        }
      } catch {
        localStorage.removeItem('curriculopro_error_logs');
      }
    }

    const legacyGdprIds = new Set(['gdpr-201', 'gdpr-202']);
    const rawGdpr = localStorage.getItem('curriculopro_gdpr_requests');
    if (rawGdpr) {
      try {
        const parsed = JSON.parse(rawGdpr);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((g: any) => !legacyGdprIds.has(g?.id));
          localStorage.setItem('curriculopro_gdpr_requests', JSON.stringify(filtered));
        }
      } catch {
        localStorage.removeItem('curriculopro_gdpr_requests');
      }
    }

    const legacyImpIds = new Set(['imp-001']);
    const rawImp = localStorage.getItem('curriculopro_impersonation_logs');
    if (rawImp) {
      try {
        const parsed = JSON.parse(rawImp);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((i: any) => !legacyImpIds.has(i?.id));
          localStorage.setItem('curriculopro_impersonation_logs', JSON.stringify(filtered));
        }
      } catch {
        localStorage.removeItem('curriculopro_impersonation_logs');
      }
    }

    const rawTelemetry = localStorage.getItem('curriculopro_frontend_telemetry');
    if (rawTelemetry) {
      try {
        const parsed = JSON.parse(rawTelemetry);
        if (
          parsed &&
          parsed.resumesStartedCount === 18 &&
          parsed.checkoutOpenedCount === 9 &&
          parsed.aiCallsCount === 42
        ) {
          localStorage.removeItem('curriculopro_frontend_telemetry');
        }
      } catch {
        localStorage.removeItem('curriculopro_frontend_telemetry');
      }
    }

    localStorage.setItem('curriculopro_prod_reset_v1', '1');
  } catch {
    // ignore storage access issues
  }
}

purgeLegacySeedStorageOnce();

// -------------------------------------------------------------
// LOCAL CACHING, EXPRESS API & FIRESTORE SYNC HELPERS
// -------------------------------------------------------------

const AUTH_TOKEN_KEY = 'curriculopro_auth_token';

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function adminApiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include'
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function emitAdminConfigUpdated(scope: string = 'all'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-config-updated', { detail: { scope, timestamp: Date.now() } }));
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Erro ao guardar ${key} em cache local:`, e);
  }
}

async function fetchPublicAdminConfig(): Promise<Record<string, any> | null> {
  try {
    return await adminApiFetch('/api/public/config', { method: 'GET' });
  } catch {
    return null;
  }
}

async function saveAdminConfigScope(scope: string, payload: any): Promise<void> {
  if (!getAuthToken()) return;
  try {
    await adminApiFetch(`/api/admin/config/${encodeURIComponent(scope)}`, {
      method: 'POST',
      body: JSON.stringify({ data: payload })
    });
  } catch (e) {
    console.warn(`Erro ao sincronizar ${scope} no servidor:`, e);
  }
}

// -------------------------------------------------------------
// SERVICE METHODS
// -------------------------------------------------------------

export async function fetchPromptsConfig(): Promise<PromptTemplateConfig[]> {
  if (getAuthToken()) {
    try {
      const overview = await adminApiFetch('/api/admin/overview', { method: 'GET' });
      const list = overview?.adminConfig?.promptsConfig;
      if (Array.isArray(list) && list.length > 0) {
        setStored('curriculopro_prompts_config', list);
        return list;
      }
    } catch {
      // fall through
    }
  }

  if (auth.currentUser) {
    try {
      const colRef = collection(db, 'promptsConfig');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as PromptTemplateConfig);
        setStored('curriculopro_prompts_config', list);
        return list;
      }
    } catch (e) {
      console.warn('Usando configuração local de prompts:', e);
    }
  }
  return getStored('curriculopro_prompts_config', DEFAULT_PROMPT_CONFIGS);
}

export async function savePromptConfig(item: PromptTemplateConfig): Promise<void> {
  const current = await fetchPromptsConfig();
  const idx = current.findIndex((p) => p.id === item.id);
  const updatedItem = { ...item, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    current[idx] = updatedItem;
  } else {
    current.push(updatedItem);
  }
  setStored('curriculopro_prompts_config', current);
  emitAdminConfigUpdated('prompts');

  await saveAdminConfigScope('promptsConfig', current);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'promptsConfig', item.id), updatedItem, { merge: true });
    } catch (e) {
      console.warn('Erro ao sincronizar prompt no Firestore:', e);
    }
  }
}

export async function fetchAiRoutingConfig(): Promise<AiModelRoutingConfig> {
  if (getAuthToken()) {
    try {
      const overview = await adminApiFetch('/api/admin/overview', { method: 'GET' });
      const cfg = overview?.adminConfig?.aiRouting;
      if (cfg && typeof cfg === 'object' && cfg.primaryModel) {
        setStored('curriculopro_ai_routing', cfg);
        return cfg;
      }
    } catch {
      // fall through
    }
  }

  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'systemSettings', 'aiRouting');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AiModelRoutingConfig;
        setStored('curriculopro_ai_routing', data);
        return data;
      }
    } catch (e) {
      console.warn('Usando configuração local de routing de IA:', e);
    }
  }
  return getStored('curriculopro_ai_routing', DEFAULT_AI_ROUTING);
}

export async function saveAiRoutingConfig(config: AiModelRoutingConfig): Promise<void> {
  setStored('curriculopro_ai_routing', config);
  emitAdminConfigUpdated('aiRouting');

  await saveAdminConfigScope('aiRouting', config);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'systemSettings', 'aiRouting'), config, { merge: true });
    } catch (e) {
      console.warn('Erro ao guardar aiRouting no Firestore:', e);
    }
  }
}

export async function fetchPlanQuotas(): Promise<PlanCreditQuota[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.planQuotas) && pub.planQuotas.length > 0) {
    setStored('curriculopro_plan_quotas', pub.planQuotas);
    return pub.planQuotas;
  }

  try {
    const colRef = collection(db, 'planQuotas');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as PlanCreditQuota);
      setStored('curriculopro_plan_quotas', list);
      return list;
    }
  } catch (e) {
    console.warn('Usando quotas locais de planos:', e);
  }
  return getStored('curriculopro_plan_quotas', DEFAULT_PLAN_QUOTAS);
}

export async function savePlanQuota(quota: PlanCreditQuota): Promise<void> {
  const list = await fetchPlanQuotas();
  const idx = list.findIndex((q) => q.planId === quota.planId);
  if (idx >= 0) list[idx] = quota;
  else list.push(quota);
  setStored('curriculopro_plan_quotas', list);
  emitAdminConfigUpdated('quotas');

  await saveAdminConfigScope('planQuotas', list);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'planQuotas', quota.planId), quota, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar quota no Firestore:', e);
    }
  }
}

export async function fetchAdminTemplates(): Promise<TemplateAdminItem[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.adminTemplates) && pub.adminTemplates.length > 0) {
    const sorted = [...pub.adminTemplates].sort((a, b) => a.displayOrder - b.displayOrder);
    setStored('curriculopro_admin_templates', sorted);
    return sorted;
  }

  try {
    const colRef = collection(db, 'templateCatalogConfig');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = (snap.docs.map((d) => d.data() as TemplateAdminItem)).sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      setStored('curriculopro_admin_templates', list);
      return list;
    }
  } catch (e) {
    console.warn('Usando catálogo local de templates:', e);
  }
  return getStored('curriculopro_admin_templates', DEFAULT_ADMIN_TEMPLATES);
}

export async function saveAdminTemplate(tmpl: TemplateAdminItem): Promise<void> {
  const list = await fetchAdminTemplates();
  const idx = list.findIndex((t) => t.id === tmpl.id);
  if (idx >= 0) list[idx] = tmpl;
  else list.push(tmpl);
  setStored('curriculopro_admin_templates', list);
  emitAdminConfigUpdated('templates');

  await saveAdminConfigScope('adminTemplates', list);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'templateCatalogConfig', tmpl.id), tmpl, { merge: true });
    } catch (e) {
      console.warn('Erro ao sincronizar template no Firestore:', e);
    }
  }
}

export async function fetchProfessionSnippets(): Promise<ProfessionSnippetExample[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.professionSnippets) && pub.professionSnippets.length > 0) {
    setStored('curriculopro_snippets', pub.professionSnippets);
    return pub.professionSnippets;
  }

  try {
    const colRef = collection(db, 'professionSnippets');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as ProfessionSnippetExample);
      setStored('curriculopro_snippets', list);
      return list;
    }
  } catch (e) {
    console.warn('Usando biblioteca local de profissões:', e);
  }
  return getStored('curriculopro_snippets', DEFAULT_PROFESSION_SNIPPETS);
}

export async function saveProfessionSnippet(snip: ProfessionSnippetExample): Promise<void> {
  const list = await fetchProfessionSnippets();
  const idx = list.findIndex((s) => s.id === snip.id);
  if (idx >= 0) list[idx] = snip;
  else list.push(snip);
  setStored('curriculopro_snippets', list);
  emitAdminConfigUpdated('snippets');

  await saveAdminConfigScope('professionSnippets', list);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'professionSnippets', snip.id), snip, { merge: true });
    } catch (e) {
      console.warn('Erro ao sincronizar snippet:', e);
    }
  }
}

export async function deleteProfessionSnippet(id: string): Promise<void> {
  const list = (await fetchProfessionSnippets()).filter((s) => s.id !== id);
  setStored('curriculopro_snippets', list);
  emitAdminConfigUpdated('snippets');

  await saveAdminConfigScope('professionSnippets', list);

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'professionSnippets', id));
    } catch (e) {
      console.warn('Erro ao apagar snippet no Firestore:', e);
    }
  }
}

export function getStoredAiRoutingSync(): AiModelRoutingConfig {
  return getStored('curriculopro_ai_routing', DEFAULT_AI_ROUTING);
}

export function getStoredPromptsSync(): PromptTemplateConfig[] {
  return getStored('curriculopro_prompts_config', DEFAULT_PROMPT_CONFIGS);
}

export function getStoredTemplatesSync(): TemplateAdminItem[] {
  return getStored('curriculopro_admin_templates', DEFAULT_ADMIN_TEMPLATES).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function getStoredLocalesSync(): SystemLocaleTranslation[] {
  return getStored('curriculopro_locales', DEFAULT_LOCALES);
}

export function getStoredQuotasSync(): PlanCreditQuota[] {
  return getStored('curriculopro_plan_quotas', DEFAULT_PLAN_QUOTAS);
}

export function getStoredSnippetsSync(): ProfessionSnippetExample[] {
  return getStored('curriculopro_snippets', DEFAULT_PROFESSION_SNIPPETS);
}

export function getStoredPromptSync(id: string): PromptTemplateConfig | undefined {
  const prompts = getStored('curriculopro_prompts_config', DEFAULT_PROMPT_CONFIGS);
  return prompts.find((p) => p.id === id);
}

export async function fetchSystemLocales(): Promise<SystemLocaleTranslation[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.systemLocales) && pub.systemLocales.length > 0) {
    setStored('curriculopro_locales', pub.systemLocales);
    return pub.systemLocales;
  }

  try {
    const colRef = collection(db, 'systemLocales');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as SystemLocaleTranslation);
      setStored('curriculopro_locales', list);
      return list;
    }
  } catch (e) {
    console.warn('Usando idiomas padrão:', e);
  }
  return getStored('curriculopro_locales', DEFAULT_LOCALES);
}

export async function saveSystemLocale(locale: SystemLocaleTranslation): Promise<void> {
  const list = await fetchSystemLocales();
  const idx = list.findIndex((l) => l.languageCode === locale.languageCode);
  const updated = { ...locale, lastUpdated: new Date().toISOString() };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  setStored('curriculopro_locales', list);
  emitAdminConfigUpdated('locales');

  await saveAdminConfigScope('systemLocales', list);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'systemLocales', locale.languageCode), updated, { merge: true });
    } catch (e) {
      console.warn('Erro ao guardar idioma no Firestore:', e);
    }
  }
}

export async function fetchSystemBanners(): Promise<SystemAnnouncementBanner[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.systemBanners)) {
    setStored('curriculopro_banners', pub.systemBanners);
    return pub.systemBanners;
  }

  try {
    const colRef = collection(db, 'systemBanners');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as SystemAnnouncementBanner);
      setStored('curriculopro_banners', list);
      return list;
    }
  } catch (e) {
    console.warn('Usando banners locais:', e);
  }
  return getStored('curriculopro_banners', DEFAULT_BANNERS);
}

export async function saveSystemBanner(banner: SystemAnnouncementBanner): Promise<void> {
  const list = await fetchSystemBanners();
  const idx = list.findIndex((b) => b.id === banner.id);
  if (idx >= 0) list[idx] = banner;
  else list.push(banner);
  setStored('curriculopro_banners', list);
  emitAdminConfigUpdated('banners');

  await saveAdminConfigScope('systemBanners', list);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'systemBanners', banner.id), banner, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar banner no Firestore:', e);
    }
  }
}

export async function deleteSystemBanner(id: string): Promise<void> {
  const list = (await fetchSystemBanners()).filter((b) => b.id !== id);
  setStored('curriculopro_banners', list);
  emitAdminConfigUpdated('banners');

  await saveAdminConfigScope('systemBanners', list);

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'systemBanners', id));
    } catch (e) {
      console.warn('Erro ao apagar banner:', e);
    }
  }
}

export async function fetchErrorLogs(): Promise<TechnicalGenerationErrorLog[]> {
  if (getAuthToken()) {
    try {
      const overview = await adminApiFetch('/api/admin/overview', { method: 'GET' });
      if (Array.isArray(overview?.errorLogs)) {
        setStored('curriculopro_error_logs', overview.errorLogs);
        return overview.errorLogs;
      }
    } catch {
      // fall through
    }
  }

  if (auth.currentUser) {
    try {
      const colRef = collection(db, 'generationErrorLogs');
      const q = query(colRef, limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as TechnicalGenerationErrorLog);
        setStored('curriculopro_error_logs', list);
        return list;
      }
    } catch (e) {
      console.warn('Usando logs de erro locais:', e);
    }
  }
  return getStored('curriculopro_error_logs', DEFAULT_ERROR_LOGS);
}

export async function logGenerationError(log: Omit<TechnicalGenerationErrorLog, 'id'>): Promise<void> {
  const newLog: TechnicalGenerationErrorLog = {
    ...log,
    id: `err-${Date.now()}`
  };
  const current = getStored<TechnicalGenerationErrorLog[]>('curriculopro_error_logs', []);
  const list = [newLog, ...current].slice(0, 100);
  setStored('curriculopro_error_logs', list);

  try {
    await adminApiFetch('/api/error-logs', {
      method: 'POST',
      body: JSON.stringify(newLog)
    });
  } catch {
    // ignore transient logging failure
  }

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'generationErrorLogs', newLog.id), newLog, { merge: true });
    } catch (e) {
      console.warn('Erro ao gravar log no Firestore:', e);
    }
  }
}

export async function resolveErrorLog(logId: string, adminEmail: string): Promise<void> {
  const resolvedAt = new Date().toISOString();
  const list = await fetchErrorLogs();
  const idx = list.findIndex((l) => l.id === logId);
  if (idx >= 0) {
    list[idx].resolved = true;
    list[idx].resolvedAt = resolvedAt;
    list[idx].resolvedBy = adminEmail;
    setStored('curriculopro_error_logs', list);
  }

  if (getAuthToken()) {
    try {
      await adminApiFetch(`/api/admin/error-logs/${encodeURIComponent(logId)}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolvedAt, resolvedBy: adminEmail })
      });
    } catch (e) {
      console.warn('Erro ao resolver log no backend:', e);
    }
  }

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, 'generationErrorLogs', logId), {
        resolved: true,
        resolvedAt,
        resolvedBy: adminEmail
      });
    } catch (e) {
      console.warn('Erro ao atualizar log:', e);
    }
  }
}

export async function fetchGdprRequests(): Promise<GdprDataRequest[]> {
  if (getAuthToken()) {
    try {
      const overview = await adminApiFetch('/api/admin/overview', { method: 'GET' });
      if (Array.isArray(overview?.gdprRequests)) {
        setStored('curriculopro_gdpr_requests', overview.gdprRequests);
        return overview.gdprRequests;
      }
    } catch {
      // fall through
    }
  }

  if (auth.currentUser) {
    try {
      const colRef = collection(db, 'gdprRequests');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as GdprDataRequest);
        setStored('curriculopro_gdpr_requests', list);
        return list;
      }
    } catch (e) {
      console.warn('Usando solicitações RGPD locais:', e);
    }
  }
  return getStored('curriculopro_gdpr_requests', DEFAULT_GDPR_REQUESTS);
}

export async function submitGdprRequest(
  requestType: GdprDataRequest['requestType'],
  notes?: string
): Promise<GdprDataRequest> {
  const data = await adminApiFetch('/api/gdpr/request', {
    method: 'POST',
    body: JSON.stringify({ requestType, notes })
  });
  const created: GdprDataRequest = data?.request || {
    id: `gdpr-${Date.now()}`,
    userId: auth.currentUser?.uid || 'user',
    userEmail: auth.currentUser?.email || '',
    requestType,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    notes
  };

  const current = getStored<GdprDataRequest[]>('curriculopro_gdpr_requests', []);
  setStored('curriculopro_gdpr_requests', [created, ...current].slice(0, 100));

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'gdprRequests', created.id), created, { merge: true });
    } catch (e) {
      console.warn('Erro ao sincronizar pedido RGPD no Firestore:', e);
    }
  }
  return created;
}

export async function updateGdprRequestStatus(
  requestId: string,
  status: GdprDataRequest['status'],
  notes?: string
): Promise<void> {
  const list = await fetchGdprRequests();
  const idx = list.findIndex((r) => r.id === requestId);
  const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
  if (idx >= 0) {
    list[idx].status = status;
    if (completedAt) list[idx].completedAt = completedAt;
    if (notes) list[idx].notes = notes;
    setStored('curriculopro_gdpr_requests', list);
  }

  if (getAuthToken()) {
    try {
      await adminApiFetch(`/api/admin/gdpr/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    } catch (e) {
      console.warn('Erro ao atualizar pedido RGPD no backend:', e);
    }
  }

  if (auth.currentUser) {
    try {
      await updateDoc(doc(db, 'gdprRequests', requestId), {
        status,
        ...(completedAt ? { completedAt } : {}),
        ...(notes ? { notes } : {})
      });
    } catch (e) {
      console.warn('Erro ao atualizar pedido RGPD:', e);
    }
  }
}

export async function logImpersonationAction(log: Omit<ImpersonationAuditLog, 'id'>): Promise<void> {
  const item: ImpersonationAuditLog = {
    ...log,
    id: `imp-${Date.now()}`
  };
  const list = [item, ...getStored<ImpersonationAuditLog[]>('curriculopro_impersonation_logs', [])].slice(0, 100);
  setStored('curriculopro_impersonation_logs', list);

  if (getAuthToken()) {
    try {
      await adminApiFetch('/api/admin/impersonation-logs', {
        method: 'POST',
        body: JSON.stringify(item)
      });
    } catch (e) {
      console.warn('Erro ao guardar registo de personificação no backend:', e);
    }
  }

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'impersonationAuditLogs', item.id), item, { merge: true });
    } catch (e) {
      console.warn('Erro ao guardar registo de personificação:', e);
    }
  }
}

export function fetchImpersonationLogs(): ImpersonationAuditLog[] {
  return getStored<ImpersonationAuditLog[]>('curriculopro_impersonation_logs', []);
}

export async function fetchImpersonationLogsAsync(): Promise<ImpersonationAuditLog[]> {
  if (getAuthToken()) {
    try {
      const overview = await adminApiFetch('/api/admin/overview', { method: 'GET' });
      if (Array.isArray(overview?.impersonationLogs)) {
        setStored('curriculopro_impersonation_logs', overview.impersonationLogs);
        return overview.impersonationLogs;
      }
    } catch {
      // fall through
    }
  }

  if (auth.currentUser) {
    try {
      const colRef = collection(db, 'impersonationAuditLogs');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as ImpersonationAuditLog);
        setStored('curriculopro_impersonation_logs', list);
        return list;
      }
    } catch {
      // fall through
    }
  }

  return getStored<ImpersonationAuditLog[]>('curriculopro_impersonation_logs', []);
}

// -------------------------------------------------------------
// 7. LIVE EDITABLE PLANS ($8 PRO / $12 VIP)
// -------------------------------------------------------------
export const DEFAULT_EDITABLE_PLANS: EditablePlanConfig[] = [
  {
    id: 'pro',
    name: 'Profissional Pro',
    tagline: 'O plano ideal para profissionais que querem acelerar convites de entrevista com ATS.',
    priceMonthlyValue: 8,
    priceQuarterlyValue: 21.6,
    priceSemiannualValue: 39.36,
    priceYearlyValue: 72,
    badgeText: 'Mais Escolhido',
    isPopular: true,
    active: true,
    features: [
      'Desbloqueio Imediato de Download Oficial (PDF & Word .docx)',
      'Documentos 100% Limpos e sem Marca de Água',
      'Criação & Edição de Currículos e Cartas Ilimitadas',
      'Otimização com Inteligência Artificial Ilimitada',
      'Radar ATS 95%+ com Análise Semântica de Vagas',
      'Cartas de Apresentação Estratégicas com IA',
      'Tradução Integral para 5 Idiomas (PT, EN, ES, FR, DE)',
      'Sincronização na Nuvem em Tempo Real'
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'executive',
    name: 'Executivo VIP',
    tagline: 'Para líderes, diretores e consultores que disputam posições de topo no mercado global.',
    priceMonthlyValue: 12,
    priceQuarterlyValue: 32.4,
    priceSemiannualValue: 59.04,
    priceYearlyValue: 108,
    badgeText: 'C-Level & Global',
    isPopular: false,
    active: true,
    features: [
      'Tudo incluído no Plano Profissional Pro',
      'Downloads Ilimitados Oficiais em PDF e Word (.docx)',
      'Simulador de Entrevista STAR com Ditado por Voz & Scoring',
      'Todos os Modelos Executivos C-Level, Harvard, Europass e Big Tech',
      'Auditoria Avançada de Perfil LinkedIn',
      'Consultoria & Suporte Executivo Prioritário'
    ],
    updatedAt: new Date().toISOString()
  }
];

function migrateLegacyPlanPricing(plans: EditablePlanConfig[]): { list: EditablePlanConfig[]; changed: boolean } {
  if (!Array.isArray(plans) || plans.length === 0) return { list: DEFAULT_EDITABLE_PLANS, changed: true };
  try {
    if (localStorage.getItem('curriculopro_plans_v8_12_migrated') === '1') {
      return { list: plans, changed: false };
    }
  } catch {
    // ignore storage read
  }
  const hasLegacyDefaults = plans.some(
    (p) => (p.id === 'pro' && p.priceMonthlyValue === 2) || (p.id === 'executive' && p.priceMonthlyValue === 4)
  );
  if (!hasLegacyDefaults) {
    try {
      localStorage.setItem('curriculopro_plans_v8_12_migrated', '1');
    } catch {}
    return { list: plans, changed: false };
  }
  const upgraded = plans.map((p) => {
    if (p.id === 'pro' && p.priceMonthlyValue === 2) {
      return { ...p, priceMonthlyValue: 8, priceYearlyValue: 72, updatedAt: new Date().toISOString() };
    }
    if (p.id === 'executive' && p.priceMonthlyValue === 4) {
      return { ...p, priceMonthlyValue: 12, priceYearlyValue: 108, updatedAt: new Date().toISOString() };
    }
    return p;
  });
  try {
    localStorage.setItem('curriculopro_plans_v8_12_migrated', '1');
  } catch {}
  return { list: upgraded, changed: true };
}

export function getStoredPlansSync(): EditablePlanConfig[] {
  const raw = getStored('curriculopro_editable_plans', DEFAULT_EDITABLE_PLANS);
  const { list, changed } = migrateLegacyPlanPricing(raw);
  if (changed) {
    setStored('curriculopro_editable_plans', list);
  }
  return list;
}

export async function fetchEditablePlans(): Promise<EditablePlanConfig[]> {
  const pub = await fetchPublicAdminConfig();
  if (Array.isArray(pub?.editablePlans) && pub.editablePlans.length > 0) {
    const { list } = migrateLegacyPlanPricing(pub.editablePlans as EditablePlanConfig[]);
    setStored('curriculopro_editable_plans', list);
    return list;
  }

  try {
    const docRef = doc(db, 'systemSettings', 'editablePlans');
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.plans)) {
      const { list, changed } = migrateLegacyPlanPricing(snap.data().plans as EditablePlanConfig[]);
      setStored('curriculopro_editable_plans', list);
      if (changed && auth.currentUser) {
        await setDoc(docRef, { plans: list, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      return list;
    }
  } catch (e) {
    console.warn('Usando planos locais:', e);
  }
  return getStoredPlansSync();
}

export async function saveEditablePlan(plan: EditablePlanConfig): Promise<void> {
  const list = getStoredPlansSync();
  const idx = list.findIndex((p) => p.id === plan.id);
  const updated = { ...plan, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);

  setStored('curriculopro_editable_plans', list);
  emitAdminConfigUpdated('plans');

  await saveAdminConfigScope('editablePlans', list);

  if (auth.currentUser) {
    try {
      await setDoc(
        doc(db, 'systemSettings', 'editablePlans'),
        { plans: list, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.warn('Erro ao sincronizar planos no Firestore:', e);
    }
  }
}

// -------------------------------------------------------------
// 8. PLATFORM GLOBAL SETTINGS & MAINTENANCE MODE
// -------------------------------------------------------------
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'Estamos a realizar melhorias programadas nos servidores de IA. Voltamos em instantes.',
  allowNewRegistrations: true,
  requirePaidPlanForExport: true,
  enableAiFeaturesGlobally: true,
  maxDailyFreeAiCalls: 5,
  pixKey: 'f4693532-31da-4e95-a589-19bccab0d915',
  pixKeyType: 'evp',
  pixBeneficiaryName: 'CURRICULO ESTRATEGICO',
  pixCity: 'SAO PAULO',
  updatedAt: new Date().toISOString(),
  updatedBy: 'gugurai923@gmail.com'
};

function mergePlatformSettings(raw: Partial<PlatformSettingsConfig> | null | undefined): PlatformSettingsConfig {
  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...(raw || {}),
    pixKey: raw?.pixKey !== undefined ? raw.pixKey : DEFAULT_PLATFORM_SETTINGS.pixKey,
    pixKeyType: raw?.pixKeyType || DEFAULT_PLATFORM_SETTINGS.pixKeyType,
    pixBeneficiaryName: raw?.pixBeneficiaryName || DEFAULT_PLATFORM_SETTINGS.pixBeneficiaryName,
    pixCity: raw?.pixCity || DEFAULT_PLATFORM_SETTINGS.pixCity
  };
}

export function getStoredPlatformSettingsSync(): PlatformSettingsConfig {
  return mergePlatformSettings(getStored('curriculopro_platform_settings', DEFAULT_PLATFORM_SETTINGS));
}

export async function fetchPlatformSettings(): Promise<PlatformSettingsConfig> {
  const pub = await fetchPublicAdminConfig();
  if (pub?.platformGovernance && typeof pub.platformGovernance === 'object') {
    const merged = mergePlatformSettings(pub.platformGovernance);
    setStored('curriculopro_platform_settings', merged);
    return merged;
  }

  try {
    const docRef = doc(db, 'systemSettings', 'platformGovernance');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const merged = mergePlatformSettings(snap.data() as PlatformSettingsConfig);
      setStored('curriculopro_platform_settings', merged);
      return merged;
    }
  } catch (e) {
    console.warn('Usando configurações globais locais:', e);
  }
  return getStoredPlatformSettingsSync();
}

export async function savePlatformSettings(settings: PlatformSettingsConfig): Promise<void> {
  const updated = mergePlatformSettings({ ...settings, updatedAt: new Date().toISOString() });
  setStored('curriculopro_platform_settings', updated);
  emitAdminConfigUpdated('platform');

  await saveAdminConfigScope('platformGovernance', updated);

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'systemSettings', 'platformGovernance'), updated, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar configurações da plataforma no Firestore:', e);
    }
  }
}

// -------------------------------------------------------------
// 9. REAL FRONTEND TELEMETRY TRACKING (PRODUCTION CLEAN STATE)
// -------------------------------------------------------------
const DEFAULT_TELEMETRY: FrontendTelemetryData = {
  resumesStartedCount: 0,
  checkoutOpenedCount: 0,
  wordExportsCount: 0,
  aiCallsCount: 0,
  estimatedTokensUsed: 0,
  templateSelections: {},
  languageSelections: {},
  featureUsage: {
    aiTailor: 0,
    atsRadar: 0,
    coverLetter: 0,
    interviewSim: 0,
    rawImport: 0
  },
  lastUpdated: new Date().toISOString()
};

export function getFrontendTelemetry(): FrontendTelemetryData {
  return getStored('curriculopro_frontend_telemetry', DEFAULT_TELEMETRY);
}

export function trackFrontendTelemetry(
  event:
    | { type: 'resume_started' }
    | { type: 'checkout_opened' }
    | { type: 'word_exported'; templateStyle?: string }
    | { type: 'template_selected'; templateStyle: string }
    | { type: 'language_switched'; language: string }
    | { type: 'ai_called'; feature: keyof FrontendTelemetryData['featureUsage']; tokens?: number }
): void {
  const cur = getFrontendTelemetry();
  if (event.type === 'resume_started') {
    cur.resumesStartedCount += 1;
  } else if (event.type === 'checkout_opened') {
    cur.checkoutOpenedCount += 1;
  } else if (event.type === 'word_exported') {
    cur.wordExportsCount += 1;
    if (event.templateStyle) {
      cur.templateSelections[event.templateStyle] = (cur.templateSelections[event.templateStyle] || 0) + 1;
    }
  } else if (event.type === 'template_selected') {
    cur.templateSelections[event.templateStyle] = (cur.templateSelections[event.templateStyle] || 0) + 1;
  } else if (event.type === 'language_switched') {
    cur.languageSelections[event.language] = (cur.languageSelections[event.language] || 0) + 1;
  } else if (event.type === 'ai_called') {
    cur.aiCallsCount += 1;
    cur.estimatedTokensUsed += event.tokens || 1400;
    cur.featureUsage[event.feature] = (cur.featureUsage[event.feature] || 0) + 1;
  }
  cur.lastUpdated = new Date().toISOString();
  setStored('curriculopro_frontend_telemetry', cur);
}

