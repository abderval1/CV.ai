import express from 'express';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import dns from 'dns/promises';
import net from 'net';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Stripe from 'stripe';
import mammoth from 'mammoth';
import type { WebSocket } from 'ws';

dotenv.config();

const SERVER_ROOT_DIR = (() => {
  try {
    if (typeof __dirname === 'string' && __dirname) {
      return __dirname;
    }
  } catch {
    // ignore in strict ESM where __dirname is not defined
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // ignore if compiled without import.meta.url
  }
  return process.cwd();
})();

const isProduction = process.env.NODE_ENV === 'production';

// -------------------------------------------------------------
// INTERNAL REAL-TIME ERROR MONITORING (ZERO EXTERNAL KEYS NEEDED)
// -------------------------------------------------------------
interface ServerMonitoringContext {
  route?: string;
  method?: string;
  statusCode?: number;
  source?: string;
  userEmail?: string;
  extra?: Record<string, unknown>;
}

let serverErrorStoreSink: ((entry: Record<string, any>) => void) | null = null;
let processHooksRegistered = false;

function scrubMonitorText(input: unknown, maxLen = 900): string {
  return String(input ?? '')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/AIza[0-9A-Za-z\-_]{20,}/g, '[REDACTED]')
    .replace(/sk_(?:live|test)_[0-9A-Za-z]{12,}/g, '[REDACTED]')
    .replace(/rk_(?:live|test)_[0-9A-Za-z]{12,}/g, '[REDACTED]')
    .replace(/(password|secret|token|cookie|authorization)=[^&\s]+/gi, '$1=[REDACTED]')
    .slice(0, maxLen);
}

export async function captureServerException(
  error: unknown,
  context: ServerMonitoringContext = {}
): Promise<void> {
  const errObj = error instanceof Error ? error : new Error(String(error || 'Unknown server error'));
  const errType = scrubMonitorText(errObj.name || 'Error', 60);
  const errMsg = scrubMonitorText(errObj.message || 'Erro interno no servidor', 600);
  const stackStr = scrubMonitorText(errObj.stack || '', 1500);
  const route = scrubMonitorText(context.route || 'unknown', 180);
  const method = scrubMonitorText(context.method || 'SERVER', 16);
  const statusCode = Number(context.statusCode) || 500;
  const source = scrubMonitorText(context.source || 'express_backend', 80);
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';

  console.error(
    JSON.stringify({
      level: 'error',
      tag: 'ERROR_MONITOR',
      timestamp: new Date().toISOString(),
      source,
      environment,
      runtime: process.env.VERCEL || process.env.VERCEL_ENV ? 'vercel-serverless' : 'node-server',
      region: process.env.VERCEL_REGION || 'local',
      method,
      route,
      statusCode,
      errorType: errType,
      message: errMsg,
      stack: stackStr.split('\n').slice(0, 6).join(' | ')
    })
  );

  if (serverErrorStoreSink) {
    try {
      serverErrorStoreSink({
        id: `err_srv_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        userEmail: scrubMonitorText(context.userEmail || 'system', 180),
        operationType: `${source}:${method} ${route}`.slice(0, 80),
        errorMessage: scrubMonitorText(
          `${errType}: ${errMsg}${stackStr ? ' | ' + stackStr.split('\n').slice(0, 3).join(' ') : ''}`,
          950
        ),
        modelUsed: 'internal-server-monitor',
        resolved: false
      });
    } catch {
      // never fail inside monitor sink
    }
  }
}

if (!processHooksRegistered && typeof process !== 'undefined') {
  processHooksRegistered = true;
  process.on('unhandledRejection', (reason) => {
    void captureServerException(reason, { source: 'process_unhandled_rejection', statusCode: 500 });
  });
  process.on('uncaughtException', (err) => {
    void captureServerException(err, { source: 'process_uncaught_exception', statusCode: 500 });
  });
}

function parseCliFlag(names: string[]): string | undefined {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    for (const name of names) {
      if (arg === name && i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        return argv[i + 1];
      }
      if (arg.startsWith(`${name}=`)) {
        return arg.slice(name.length + 1);
      }
    }
  }
  return undefined;
}

const cliPortRaw = parseCliFlag(['--port', '-p']);
const cliHostRaw = parseCliFlag(['--host', '-h']);
const envPort = Number(process.env.PORT);
const nginxPort = Number(process.env.NGINX_PORT);
const defaultAppPort = Number(process.env.DEFAULT_APP_PORT) || 3000;

const PORT = (() => {
  const fromCli = Number(cliPortRaw);
  if (Number.isInteger(fromCli) && fromCli > 0 && fromCli <= 65535) {
    return fromCli;
  }
  // Avoid colliding with the reverse proxy (nginx on NGINX_PORT) when running `npm run dev` in container shells
  if (!isProduction && Number.isInteger(nginxPort) && envPort === nginxPort) {
    return defaultAppPort;
  }
  if (Number.isInteger(envPort) && envPort > 0 && envPort <= 65535) {
    return envPort;
  }
  return defaultAppPort;
})();

const HOST = (cliHostRaw || process.env.HOST || '0.0.0.0').trim() || '0.0.0.0';

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Automatic real-time HTTP 5xx diagnostic capture for every API response
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 500 && !(res as any).__errorCaptured && !req.originalUrl?.includes('/api/error-logs')) {
        void captureServerException(new Error(`HTTP ${res.statusCode} emitted by route ${req.method} ${req.originalUrl}`), {
          route: req.originalUrl || req.path,
          method: req.method,
          statusCode: res.statusCode,
          source: 'express_http_5xx'
        });
      }
    });
    next();
  });

  // Security HTTP headers (iframe-compatible for AI Studio preview, no X-Frame-Options: DENY)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    if (isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Strict per-endpoint JSON body limits: 2mb default, 14mb allowed only on /api/extract-document
  const defaultJsonParser = express.json({ limit: '2mb' });
  const uploadJsonParser = express.json({ limit: '14mb' });
  app.use((req, res, next) => {
    if (req.path === '/api/extract-document') {
      return uploadJsonParser(req, res, next);
    }
    return defaultJsonParser(req, res, next);
  });

  // -------------------------------------------------------------
  // SECURITY HELPERS: RATE LIMITING, SSRF GUARD & REDIRECT CHECKS
  // -------------------------------------------------------------
  function getClientIp(req: express.Request): string {
    return String(req.ip || req.socket.remoteAddress || 'local').slice(0, 128);
  }

  function createRateLimiter(maxRequests: number, windowMs: number) {
    const store = new Map<string, { count: number; resetAt: number }>();
    return (req: express.Request): boolean => {
      const now = Date.now();
      if (store.size > 5000) {
        for (const [k, v] of store.entries()) {
          if (now > v.resetAt) store.delete(k);
        }
        if (store.size > 5000) store.clear();
      }
      const ip = getClientIp(req);
      const cur = store.get(ip);
      if (!cur || now > cur.resetAt) {
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
      }
      cur.count += 1;
      return cur.count <= maxRequests;
    };
  }

  const checkAiRateLimit = createRateLimiter(35, 60_000);
  const checkUploadRateLimit = createRateLimiter(15, 60_000);
  const checkProxyRateLimit = createRateLimiter(45, 60_000);
  const checkPaymentRateLimit = createRateLimiter(25, 60_000);
  const checkTelemetryRateLimit = createRateLimiter(25, 60_000);
  const checkJobsRateLimit = createRateLimiter(30, 60_000);

  function aiRateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!checkAiRateLimit(req)) {
      return res.status(429).json({
        error: 'Demasiados pedidos de IA em pouco tempo. Aguarde um minuto antes de tentar novamente.',
        fallback: true
      });
    }
    next();
  }

  function isPrivateOrReservedIpv4(ipv4: string): boolean {
    const parts = ipv4.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b, c] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 169 && b === 254) return true; // Link-local / Cloud Metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true; // Multicast & Reserved
    return false;
  }

  function isPrivateOrReservedIp(ip: string): boolean {
    const clean = ip.trim().toLowerCase().split('%')[0];
    if (!clean) return true;
    if (net.isIPv4(clean)) return isPrivateOrReservedIpv4(clean);
    if (!net.isIPv6(clean)) return true;
    if (clean === '::' || clean === '::1') return true;
    if (clean.startsWith('::ffff:')) {
      const mapped = clean.slice(7);
      if (net.isIPv4(mapped)) return isPrivateOrReservedIpv4(mapped);
      return true;
    }
    // Block link-local (fe80::/10), ULA (fc00::/7), multicast (ff00::/8)
    const firstWordHex = clean.split(':')[0] || '0';
    const firstWord = parseInt(firstWordHex, 16);
    if (Number.isNaN(firstWord)) return true;
    if ((firstWord & 0xfe00) === 0xfc00) return true; // fc00::/7
    if ((firstWord & 0xffc0) === 0xfe80) return true; // fe80::/10
    if ((firstWord & 0xff00) === 0xff00) return true; // ff00::/8
    return false;
  }

  async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('URL inválida');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Protocolo não permitido');
    }
    if (parsed.username || parsed.password) {
      throw new Error('Credenciais na URL não permitidas');
    }
    const host = parsed.hostname.toLowerCase();
    if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
      throw new Error('Destino interno bloqueado');
    }
    if (net.isIP(host)) {
      if (isPrivateOrReservedIp(host)) {
        throw new Error('Endereço IP privado ou reservado bloqueado');
      }
      return parsed;
    }
    const resolved = await dns.lookup(host, { all: true });
    if (!resolved || resolved.length === 0) {
      throw new Error('Falha ao resolver domínio externo');
    }
    for (const entry of resolved) {
      if (isPrivateOrReservedIp(entry.address)) {
        throw new Error('Endereço IP interno resolvido bloqueado');
      }
    }
    return parsed;
  }

  function resolveSafeAppRedirectUrl(req: express.Request, candidate?: string): string {
    const hostHeader = req.get('host');
    const proto = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'https' : req.protocol || 'http';
    const fallbackOrigin = process.env.APP_URL || (hostHeader ? `${proto}://${hostHeader}` : `http://localhost:${PORT}`);
    if (!candidate || typeof candidate !== 'string') return fallbackOrigin;
    try {
      const target = new URL(candidate);
      if (target.protocol !== 'http:' && target.protocol !== 'https:') return fallbackOrigin;
      const allowedOrigins = new Set<string>();
      if (process.env.APP_URL) {
        try {
          allowedOrigins.add(new URL(process.env.APP_URL).origin);
        } catch { /* ignore */ }
      }
      if (hostHeader) {
        allowedOrigins.add(`https://${hostHeader}`);
        allowedOrigins.add(`http://${hostHeader}`);
      }
      if (req.headers.origin) {
        try {
          const reqOrig = new URL(String(req.headers.origin));
          if (reqOrig.host === hostHeader || reqOrig.hostname.endsWith('.run.app') || reqOrig.hostname === 'localhost') {
            allowedOrigins.add(reqOrig.origin);
          }
        } catch { /* ignore */ }
      }
      if (
        allowedOrigins.has(target.origin) ||
        (target.protocol === 'https:' && target.hostname.endsWith('.run.app'))
      ) {
        return `${target.origin}${target.pathname}`;
      }
      return fallbackOrigin;
    } catch {
      return fallbackOrigin;
    }
  }

  function sanitizeTelemetryText(input: unknown, maxLen = 1000): string {
    return String(input || '')
      .replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, 'Bearer [REDACTED]')
      .replace(/sk_(live|test)_[A-Za-z0-9]+/gi, '[STRIPE_KEY_REDACTED]')
      .replace(/rk_(live|test)_[A-Za-z0-9]+/gi, '[STRIPE_KEY_REDACTED]')
      .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[API_KEY_REDACTED]')
      .slice(0, maxLen);
  }

  function sanitizeAiErrorMessage(err: any, fallbackMsg: string): string {
    const raw = sanitizeTelemetryText(err?.message || '', 300);
    if (!raw) return fallbackMsg;
    if (/api[_-]?key|credential|token|secret|permission|quota|429|resource_exhausted/i.test(raw)) {
      return fallbackMsg;
    }
    return raw;
  }

  interface ServerTelemetryData {
    resumesStartedCount: number;
    checkoutOpenedCount: number;
    wordExportsCount: number;
    aiCallsCount: number;
    estimatedTokensUsed: number;
    templateSelections: Record<string, number>;
    languageSelections: Record<string, number>;
    featureUsage: {
      aiTailor: number;
      atsRadar: number;
      coverLetter: number;
      interviewSim: number;
      rawImport: number;
    };
    lastUpdated: string;
  }

  function createEmptyTelemetry(): ServerTelemetryData {
    return {
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
  }

  function ensureServerTelemetry(): ServerTelemetryData {
    if (!authStore.telemetry || typeof authStore.telemetry !== 'object') {
      authStore.telemetry = createEmptyTelemetry();
    }
    if (!authStore.telemetry.templateSelections) authStore.telemetry.templateSelections = {};
    if (!authStore.telemetry.languageSelections) authStore.telemetry.languageSelections = {};
    if (!authStore.telemetry.featureUsage) {
      authStore.telemetry.featureUsage = createEmptyTelemetry().featureUsage;
    }
    return authStore.telemetry as ServerTelemetryData;
  }

  function recordServerTelemetry(
    event:
      | { type: 'resume_started' }
      | { type: 'checkout_opened' }
      | { type: 'word_exported'; templateStyle?: string }
      | { type: 'template_selected'; templateStyle: string }
      | { type: 'language_switched'; language: string }
      | { type: 'ai_called'; feature: 'aiTailor' | 'atsRadar' | 'coverLetter' | 'interviewSim' | 'rawImport'; tokens?: number }
  ) {
    try {
      const tel = ensureServerTelemetry();
      if (event.type === 'resume_started') {
        tel.resumesStartedCount += 1;
      } else if (event.type === 'checkout_opened') {
        tel.checkoutOpenedCount += 1;
      } else if (event.type === 'word_exported') {
        tel.wordExportsCount += 1;
        if (event.templateStyle) {
          const k = String(event.templateStyle).slice(0, 60);
          tel.templateSelections[k] = (tel.templateSelections[k] || 0) + 1;
        }
      } else if (event.type === 'template_selected') {
        const k = String(event.templateStyle || '').slice(0, 60);
        if (k) tel.templateSelections[k] = (tel.templateSelections[k] || 0) + 1;
      } else if (event.type === 'language_switched') {
        const l = String(event.language || '').slice(0, 16).toLowerCase();
        if (l) tel.languageSelections[l] = (tel.languageSelections[l] || 0) + 1;
      } else if (event.type === 'ai_called') {
        tel.aiCallsCount += 1;
        tel.estimatedTokensUsed += Math.max(0, Math.min(20000, Number(event.tokens) || 1400));
        tel.featureUsage[event.feature] = (tel.featureUsage[event.feature] || 0) + 1;
      }
      tel.lastUpdated = new Date().toISOString();
      persistAuthStore();
    } catch {
      // non-blocking telemetry error
    }
  }

  const DEFAULT_SERVER_PLAN_QUOTAS = [
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

  function getServerPlanQuotasList() {
    const raw = authStore.adminConfig?.planQuotas;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return DEFAULT_SERVER_PLAN_QUOTAS;
  }

  function getServerPlanQuota(planId?: string) {
    const target = planId || 'free';
    const list = getServerPlanQuotasList();
    return list.find((q: any) => q?.planId === target) || DEFAULT_SERVER_PLAN_QUOTAS.find((q) => q.planId === target) || DEFAULT_SERVER_PLAN_QUOTAS[0];
  }

  function getFreePlanDefaultCredits(): number {
    const freeQuota = getServerPlanQuota('free');
    if (freeQuota?.unlimited) return 9999;
    const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
    if (typeof freeQuota?.monthlyCredits === 'number' && freeQuota.monthlyCredits >= 0) {
      return freeQuota.monthlyCredits;
    }
    if (typeof gov.maxDailyFreeAiCalls === 'number' && gov.maxDailyFreeAiCalls >= 0) {
      return gov.maxDailyFreeAiCalls;
    }
    return 5;
  }

  function isAiGloballyPaused(): boolean {
    const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
    return gov.enableAiFeaturesGlobally === false;
  }

  function resolveServerPromptConfig(
    promptId: 'coverLetter' | 'experienceOptimizer' | 'resumeSummary' | 'atsScanner' | 'interviewSim' | 'translateDoc',
    clientPromptConfig?: any
  ): { systemInstruction?: string; temperature?: number; preferredModel?: string; fallbackModel?: string } | undefined {
    const list = authStore.adminConfig?.promptsConfig;
    const serverItem = Array.isArray(list) ? list.find((p: any) => p?.id === promptId) : undefined;
    const src = serverItem || clientPromptConfig;
    if (!src || typeof src !== 'object') return undefined;
    return {
      systemInstruction: typeof src.systemInstruction === 'string' ? src.systemInstruction.slice(0, 3000) : undefined,
      temperature: typeof src.temperature === 'number' ? src.temperature : undefined,
      preferredModel: typeof src.preferredModel === 'string' ? src.preferredModel : undefined,
      fallbackModel: typeof src.fallbackModel === 'string' ? src.fallbackModel : undefined
    };
  }

  type QuotaFeatureKey = 'aiTailor' | 'atsRadar' | 'coverLetter' | 'interviewSim';

  function trackAuthenticatedAiUsage(
    req: express.Request,
    featureKey?: QuotaFeatureKey
  ): {
    quotaExceeded?: boolean;
    dailyLimitReached?: boolean;
    featureBlocked?: boolean;
    creditsRemaining?: number;
    message?: string;
  } {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) return {};
      const record = resolveAuthenticatedUserRecord(payload);
      if (!record || record.status === 'suspended') {
        return {
          quotaExceeded: true,
          message: 'Conta inválida ou suspensa.'
        };
      }

      const isAdmin = record.role === 'admin' || ADMIN_EMAILS_BACKEND.has(record.email.toLowerCase());
      const planQuota = getServerPlanQuota(record.plan || 'free');
      const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;

      if (!isAdmin && featureKey) {
        const featureMap: Record<QuotaFeatureKey, boolean> = {
          aiTailor: Boolean(planQuota?.allowAiTailor),
          atsRadar: Boolean(planQuota?.allowAtsRadar),
          coverLetter: Boolean(planQuota?.allowCoverLetter),
          interviewSim: Boolean(planQuota?.allowInterviewSim)
        };
        if (featureMap[featureKey] === false) {
          return {
            featureBlocked: true,
            creditsRemaining: record.creditsRemaining,
            message: `Este recurso de IA não está incluído no plano atual (${planQuota?.planName || record.plan}). Faça upgrade para desbloquear.`
          };
        }
      }

      const isPaid = record.plan === 'pro' || record.plan === 'executive';
      const isUnlimited = isAdmin || Boolean(planQuota?.unlimited) || (isPaid && Number(planQuota?.monthlyCredits) >= 9999);

      const todayYmd = new Date().toISOString().slice(0, 10);
      if (record.dailyAiCallsDate !== todayYmd) {
        record.dailyAiCallsDate = todayYmd;
        record.dailyAiCallsCount = 0;
      }

      if (!isUnlimited) {
        if (record.plan === 'free' && typeof gov.maxDailyFreeAiCalls === 'number' && gov.maxDailyFreeAiCalls >= 0) {
          if ((record.dailyAiCallsCount || 0) >= gov.maxDailyFreeAiCalls) {
            return {
              quotaExceeded: true,
              dailyLimitReached: true,
              creditsRemaining: record.creditsRemaining ?? 0,
              message: `O limite diário gratuito de ${gov.maxDailyFreeAiCalls} chamadas de IA foi atingido. Volte amanhã ou faça upgrade.`
            };
          }
        }

        const defaultCredits = getFreePlanDefaultCredits();
        const remaining = typeof record.creditsRemaining === 'number' ? record.creditsRemaining : defaultCredits;
        if (remaining <= 0) {
          return {
            quotaExceeded: true,
            creditsRemaining: 0,
            message: 'Os seus créditos de IA esgotaram. Faça upgrade para Pro ou Executivo VIP para uso ilimitado.'
          };
        }
        record.creditsRemaining = remaining - 1;
      }

      record.dailyAiCallsCount = (record.dailyAiCallsCount || 0) + 1;
      record.creditsUsed = (record.creditsUsed || 0) + 1;
      record.updatedAt = new Date().toISOString();
      persistAuthStore();
      return { creditsRemaining: record.creditsRemaining };
    } catch {
      return {};
    }
  }

  // Initialize Gemini API client if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // Cooldown & Live Latency/Health Runtime Tracker per Gemini model
  const modelCooldownUntil = new Map<string, number>();
  interface ModelRuntimeStat {
    callsCount: number;
    successCount: number;
    errorCount: number;
    totalLatencyMs: number;
    avgLatencyMs: number | null;
    lastLatencyMs: number | null;
    lastUsedAt: string | null;
    lastError: string | null;
  }
  const aiModelRuntimeStats = new Map<string, ModelRuntimeStat>();

  function recordModelStat(model: string, latencyMs: number, ok: boolean, errMsg?: string) {
    const cur = aiModelRuntimeStats.get(model) || {
      callsCount: 0,
      successCount: 0,
      errorCount: 0,
      totalLatencyMs: 0,
      avgLatencyMs: null,
      lastLatencyMs: null,
      lastUsedAt: null,
      lastError: null
    };
    cur.callsCount += 1;
    cur.lastUsedAt = new Date().toISOString();
    cur.lastLatencyMs = latencyMs;
    if (ok) {
      cur.successCount += 1;
      cur.totalLatencyMs += latencyMs;
      cur.avgLatencyMs = Math.round(cur.totalLatencyMs / cur.successCount);
      cur.lastError = null;
    } else {
      cur.errorCount += 1;
      cur.lastError = errMsg ? sanitizeTelemetryText(errMsg, 180) : 'Erro de execução';
    }
    aiModelRuntimeStats.set(model, cur);
  }

  function getAiHealthSnapshot() {
    const routing = (authStore.adminConfig?.aiRouting || {}) as Record<string, any>;
    const trackedModels = Array.from(
      new Set(
        [
          'gemini-4-hydrogen',
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          routing.primaryModel,
          routing.fallbackModel,
          routing.costSavingModel,
          ...Array.from(aiModelRuntimeStats.keys())
        ].filter((m): m is string => Boolean(m))
      )
    );
    const now = Date.now();
    const models: Record<
      string,
      {
        status: 'healthy' | 'degraded' | 'cooldown' | 'unavailable' | 'idle';
        latencyMs: number | null;
        lastLatencyMs: number | null;
        callsCount: number;
        successCount: number;
        errorCount: number;
        lastUsedAt: string | null;
        lastError: string | null;
        cooldownRemainingSec: number;
      }
    > = {};

    for (const modelName of trackedModels) {
      const stat = aiModelRuntimeStats.get(modelName);
      const cooldownUntil = modelCooldownUntil.get(modelName) || 0;
      const cooldownRemainingSec = cooldownUntil > now ? Math.ceil((cooldownUntil - now) / 1000) : 0;
      let status: 'healthy' | 'degraded' | 'cooldown' | 'unavailable' | 'idle' = 'idle';
      if (!ai) {
        status = 'unavailable';
      } else if (cooldownRemainingSec > 0) {
        status = 'cooldown';
      } else if (stat && stat.errorCount > 0 && stat.successCount === 0) {
        status = 'degraded';
      } else if (stat && stat.successCount > 0) {
        status = stat.errorCount > stat.successCount ? 'degraded' : 'healthy';
      }
      models[modelName] = {
        status,
        latencyMs: stat?.avgLatencyMs ?? null,
        lastLatencyMs: stat?.lastLatencyMs ?? null,
        callsCount: stat?.callsCount ?? 0,
        successCount: stat?.successCount ?? 0,
        errorCount: stat?.errorCount ?? 0,
        lastUsedAt: stat?.lastUsedAt ?? null,
        lastError: stat?.lastError ?? null,
        cooldownRemainingSec
      };
    }

    return {
      configured: Boolean(ai),
      aiPaused: isAiGloballyPaused(),
      models,
      checkedAt: new Date().toISOString()
    };
  }

  function parseAiJson<T = any>(raw: string | undefined): T {
    const cleaned = (raw ?? '{}')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned || '{}') as T;
  }

  // Resilient Gemini call honoring Admin AI Routing Policy + AbortController timeout + live telemetry
  async function generateContentWithRetry(
    contents: any,
    config?: Record<string, any>,
    routingOverride?: { preferredModel?: string; fallbackModel?: string; useCostSaving?: boolean }
  ) {
    if (!ai) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.');
    }
    const serverRouting = (authStore.adminConfig?.aiRouting || {}) as Record<string, any>;
    const normalizeModel = (m?: string) => {
      if (!m) return undefined;
      if (m === 'gemini-3.8-flash' || m === 'gemini-flash-latest') return 'gemini-4-hydrogen';
      return m;
    };
    const defaultOrder = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    const customOrder = [
      ...(routingOverride?.useCostSaving ? [normalizeModel(serverRouting.costSavingModel)] : []),
      normalizeModel(routingOverride?.preferredModel),
      normalizeModel(serverRouting.primaryModel),
      normalizeModel(routingOverride?.fallbackModel),
      normalizeModel(serverRouting.fallbackModel),
      ...defaultOrder
    ].filter((m): m is string => Boolean(m));
    const maxRetries = Math.max(1, Math.min(5, Number(serverRouting.maxRetries) || 3));
    const baseModels = Array.from(new Set(customOrder)).slice(0, Math.max(2, maxRetries));
    const now = Date.now();
    const healthyModels = baseModels.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
    const cooledModels = baseModels.filter((m) => (modelCooldownUntil.get(m) || 0) > now);
    const candidateModels = [...healthyModels, ...cooledModels];

    const configuredTimeout = Number(serverRouting.timeoutMs);
    const timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout >= 5000
        ? Math.min(60000, configuredTimeout)
        : 25000;

    let lastError: any = null;

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const callStartedAt = Date.now();
      try {
        const effectiveConfig: Record<string, any> = {
          ...(config || {}),
          abortSignal: controller.signal
        };
        if (model.startsWith('gemini-4-')) {
          delete effectiveConfig.temperature;
          delete effectiveConfig.topP;
          delete effectiveConfig.topK;
          delete effectiveConfig.candidateCount;
        }
        if (model === 'gemini-4-hydrogen' && !effectiveConfig.thinkingConfig) {
          effectiveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const raceTimeout = new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () => reject(new Error(`Timeout (${timeoutMs}ms) calling ${model}`)),
            { once: true }
          );
        });

        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents,
            config: effectiveConfig
          }),
          raceTimeout
        ]);

        const latency = Date.now() - callStartedAt;
        modelCooldownUntil.delete(model);
        recordModelStat(model, latency, true);
        return result;
      } catch (err: any) {
        lastError = err;
        const latency = Date.now() - callStartedAt;
        recordModelStat(model, latency, false, err?.message || String(err));
        const msg = String(err?.message || '');
        const isTransient =
          err?.name === 'AbortError' ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('404') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('Timeout') ||
          msg.includes('abort') ||
          err?.status === 503 ||
          err?.status === 429 ||
          err?.status === 404;
        if (isTransient) {
          modelCooldownUntil.set(model, Date.now() + 60_000);
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new Error('Serviço de IA temporariamente indisponível.');
  }

  // Initialize Stripe client if secret key is available (Apenas 2 chaves: Secret Key e Publishable Key)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
  const stripePublishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_live_51SZIxqBnqz01NuqKqCW35zbD4WIxv1ws4HhsX8s2p78SHrldEIfpcTuvlLYhATRFBcDq9hy1zAUjuGZnvF6Wi4Wg00CjKUEhsr';

  let stripeClient: Stripe | null = null;
  if (stripeSecretKey) {
    try {
      stripeClient = new Stripe(stripeSecretKey);
      console.log('💳 Stripe inicializado com sucesso no backend.');
    } catch (e) {
      console.warn('⚠️ Falha ao inicializar Stripe:', e);
    }
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString()
    });
  });

  // Extract clean text from binary documents (PDF, DOCX, DOC, RTF)
  app.post('/api/extract-document', async (req, res) => {
    try {
      if (!checkUploadRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados uploads em sequência. Aguarde um minuto.' });
      }
      const { fileName, base64Data } = req.body as {
        fileName?: string;
        base64Data?: string;
      };

      if (!fileName || typeof fileName !== 'string' || !base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({ error: 'Ficheiro inválido ou vazio.' });
      }

      const ext = path.extname(fileName).toLowerCase();
      const allowedExtensions = new Set(['.pdf', '.docx', '.doc', '.rtf', '.txt', '.md', '.csv']);
      if (!allowedExtensions.has(ext)) {
        return res.status(400).json({ error: 'Formato de ficheiro não suportado. Utilize PDF, DOCX, DOC, RTF ou TXT.' });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
        return res.status(413).json({ error: 'O documento excede o limite máximo de 10 MB.' });
      }

      let extractedText = '';

      if (ext === '.pdf') {
        try {
          const pdfPkg = 'pdf-parse';
          const { PDFParse } = await import(/* @vite-ignore */ pdfPkg);
          const parser = new PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          await parser.destroy();
          extractedText = (pdfResult.text || '').trim();
        } catch (pdfErr) {
          console.warn('Aviso pdf-parse:', pdfErr);
        }

        // Fallback to Gemini multimodal OCR if PDF is scanned/image-only
        if (extractedText.length < 30 && ai) {
          try {
            const geminiResp = await generateContentWithRetry([
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: 'application/pdf'
                }
              },
              'Extraia todo o texto deste documento PDF de forma fiel, preservando parágrafos, listas e secções, sem adicionar comentários.'
            ]);
            if (geminiResp.text) {
              extractedText = geminiResp.text.trim();
            }
          } catch (ocrErr) {
            console.warn('Fallback OCR Gemini falhou:', ocrErr);
          }
        }
      } else if (ext === '.docx') {
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = (docxResult.value || '').trim();
      } else if (ext === '.rtf') {
        const rawRtf = buffer.toString('utf8');
        extractedText = rawRtf
          .replace(/\\par[d]?/g, '\n')
          .replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else if (ext === '.doc') {
        // Legacy binary .doc: extract readable UTF-16LE or Latin1 text runs
        const utf16Text = buffer.toString('utf16le');
        const matches = utf16Text.match(/[\p{L}\p{N}\p{P}\p{Zs}\r\n]{12,}/gu) || [];
        extractedText = matches
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else {
        extractedText = buffer.toString('utf8').trim();
      }

      if (!extractedText) {
        return res.status(422).json({
          error:
            'Não foi possível extrair texto legível deste ficheiro. Verifique se o documento não está protegido por palavra-passe ou tente converter para .docx / .txt.'
        });
      }

      return res.json({ text: extractedText, fileName: path.basename(fileName).slice(0, 120) });
    } catch (err: any) {
      console.error('Erro em /api/extract-document:', err);
      return res.status(500).json({
        error: 'Erro ao processar o documento.'
      });
    }
  });

  // Image proxy endpoint with strict anti-SSRF, raster-only MIME & size protections
  app.get('/api/proxy-image', async (req, res) => {
    try {
      if (!checkProxyRateLimit(req)) {
        return res.status(429).send('Limite de requisições excedido');
      }
      const imageUrl = String(req.query.url || '').trim();
      if (!imageUrl || imageUrl.length > 1500) {
        return res.status(400).send('URL de imagem inválida');
      }

      let currentUrl = await assertSafeExternalUrl(imageUrl);
      let upstreamResponse: Response | null = null;

      for (let hop = 0; hop < 3; hop += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        try {
          const resp = await fetch(currentUrl.toString(), {
            redirect: 'manual',
            signal: controller.signal,
            headers: { 'User-Agent': 'CurriculoEstrategico-ImageProxy/1.0' }
          });
          if (resp.status >= 300 && resp.status < 400) {
            const loc = resp.headers.get('location');
            if (!loc) break;
            currentUrl = await assertSafeExternalUrl(new URL(loc, currentUrl).toString());
            continue;
          }
          upstreamResponse = resp;
          break;
        } finally {
          clearTimeout(timer);
        }
      }

      if (!upstreamResponse) {
        return res.status(400).send('Redirecionamento externo não permitido');
      }
      if (!upstreamResponse.ok) {
        return res.status(upstreamResponse.status).send('Erro ao buscar imagem externa');
      }

      const rawCt = (upstreamResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const allowedImageMimes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
      if (!allowedImageMimes.has(rawCt)) {
        return res.status(415).send('Tipo de imagem não suportado');
      }

      const declaredLen = Number(upstreamResponse.headers.get('content-length') || '0');
      if (declaredLen > 5 * 1024 * 1024) {
        return res.status(413).send('Imagem excede o tamanho máximo permitido');
      }

      const arrayBuffer = await upstreamResponse.arrayBuffer();
      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        return res.status(413).send('Imagem excede o tamanho máximo permitido');
      }

      res.setHeader('Content-Type', rawCt);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (
        msg.includes('inválida') ||
        msg.includes('bloqueado') ||
        msg.includes('permitido') ||
        msg.includes('resolver')
      ) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: '/api/proxy-image',
          details: `Tentativa de SSRF / URL externa bloqueada no proxy de imagem: ${msg.slice(0, 160)}`,
          metadata: { httpStatus: 403 }
        });
        return res.status(403).send(msg);
      }
      return res.status(500).send('Falha no proxy de imagem');
    }
  });

  // AI Tailor CV endpoint
  app.post('/api/tailor-cv', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { cvData, jobDescription, targetStandard, adminPromptConfig } = req.body;

      if (!cvData) {
        return res.status(400).json({ error: 'Dados do currículo não fornecidos.' });
      }

      if (isAiGloballyPaused()) {
        return res.status(503).json({
          error: 'Os recursos de Inteligência Artificial estão temporariamente pausados pelo administrador.',
          aiPaused: true,
          fallback: true
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. O modo inteligente local continuará funcionando.',
          fallback: true
        });
      }

      const usageCheck = trackAuthenticatedAiUsage(req, 'aiTailor');
      if (usageCheck.featureBlocked || usageCheck.quotaExceeded) {
        return res.status(usageCheck.featureBlocked ? 403 : 402).json({
          error: usageCheck.message || 'Os seus créditos gratuitos de avaliação esgotaram. Faça upgrade para Pro ou Executivo VIP para uso ilimitado.',
          quotaExceeded: Boolean(usageCheck.quotaExceeded),
          featureBlocked: Boolean(usageCheck.featureBlocked),
          fallback: true
        });
      }

      const resolvedPromptConfig = resolveServerPromptConfig('experienceOptimizer', adminPromptConfig);
      const safeJobDescription = typeof jobDescription === 'string' ? jobDescription.slice(0, 12000) : '';
      const customInstructionBlock = resolvedPromptConfig?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${resolvedPromptConfig.systemInstruction.slice(0, 2000)}\n`
        : '';

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos e Headhunter Internacional especializado em contratações de liderança para grandes corporações multinacionais, empresas de consultoria estratégica e empresas de tecnologia globais.
${customInstructionBlock}
Sua missão é reescrever e otimizar estrategicamente os componentes deste currículo para maximizar a taxa de aprovação nos sistemas de triagem ATS (Applicant Tracking Systems como Workday, Greenhouse, Taleo e Lever) e impressionar recrutadores e diretores executivos.

PADRÃO SOLICITADO: ${targetStandard || 'Padrão Corporativo Internacional & Executivo'}

DADOS ATUAIS DO CANDIDATO:
${JSON.stringify(cvData, null, 2)}

DESCRIÇÃO DA VAGA (Termos de Referência / Requisitos):
${safeJobDescription || 'Posição de Liderança Executiva, Gestão de Operações ou Direção Estratégica.'}

INSTRUÇÕES ESTRITAS:
1. Resumo Executivo (Summary): Reescreva em tom executivo de alto impacto (4-6 linhas), destacando anos de experiência, liderança estratégica, orçamentos ou equipas geridas e impacto comprovado na geração de resultados.
2. Competências-chave (Core Competencies): Retorne de 5 a 6 categorias de competências essenciais com títulos fortes e descrição com palavras-chave exatas da vaga.
3. Experiências Profissionais: Para cada cargo, aprimore cada ponto aplicando a fórmula executiva do Google XYZ (Conseguiu [X], medido por [Y], fazendo [Z]). Mantenha instituições, cargos e datas fiéis aos fatos, mas eleve a formulação técnica e inclua métricas quantificáveis (percentagens de crescimento, economias, prazos e liderança).
4. Análise de Palavras-chave ATS: Identifique as 8 palavras-chave mais críticas da vaga presentes e ausentes.

Responda ESTRITAMENTE em formato JSON válido com esta estrutura:
{
  "summary": "texto do novo resumo otimizado",
  "competencies": [
    { "category": "Nome da Competência", "description": "detalhes técnicos e ferramentas" }
  ],
  "experiences": [
    {
      "id": "mesmo id se houver ou índice",
      "company": "Nome da instituição",
      "role": "Cargo",
      "period": "Período",
      "donor": "Projeto / Área de Atuação",
      "highlights": ["bullet 1 otimizado com métricas", "bullet 2 otimizado com métricas"]
    }
  ],
  "atsInsights": {
    "scoreEstimate": 94,
    "matchingKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3", "palavra4"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedPromptConfig?.temperature === 'number'
            ? { temperature: resolvedPromptConfig.temperature }
            : {})
        },
        resolvedPromptConfig
      );

      const parsedData = parseAiJson(response.text);
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'aiTailor',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsedData);
    } catch (err: any) {
      console.error('Erro na rota /api/tailor-cv:', err);
      return res.status(500).json({
        error: sanitizeAiErrorMessage(err, 'Erro temporário ao processar otimização com IA. O modo local será ativado.'),
        fallback: true
      });
    }
  });

  // Generate full structured CV from raw inputs & target job description
  app.post('/api/generate-from-raw', aiRateLimitMiddleware, async (req, res) => {
    try {
      const {
        rawCandidateInfo,
        jobDescription,
        candidateLinkedIn,
        targetStandard,
        adminPromptConfig,
        generationMode
      } = req.body;

      if (!rawCandidateInfo && !candidateLinkedIn) {
        return res.status(400).json({ error: 'Nenhuma informação do candidato foi fornecida.' });
      }

      if (isAiGloballyPaused()) {
        return res.status(503).json({
          error: 'Os recursos de Inteligência Artificial estão temporariamente pausados pelo administrador.',
          aiPaused: true,
          fallback: true
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const usageCheck = trackAuthenticatedAiUsage(req);
      if (usageCheck.quotaExceeded) {
        return res.status(402).json({
          error: usageCheck.message || 'Os seus créditos gratuitos esgotaram. Faça upgrade para gerar novos currículos com IA ilimitada.',
          quotaExceeded: true,
          fallback: true
        });
      }

      const cleanJobDesc = typeof jobDescription === 'string' ? jobDescription.trim() : '';
      const isStandardMode = generationMode === 'standard' || !cleanJobDesc;
      const trimmedRawInfo = typeof rawCandidateInfo === 'string' ? rawCandidateInfo.trim() : '';

      let enrichedLinkedInContext = '';
      if (candidateLinkedIn && /linkedin\.com\/in\//i.test(String(candidateLinkedIn)) && trimmedRawInfo.length < 300) {
        try {
          const { normalizedUrl: lkNormUrl, slug: lkSlug } = normalizeLinkedInUrl(String(candidateLinkedIn));
          const lkCleanName = lkSlug
            .replace(/-\d{4,}$/, '')
            .replace(/[-_.]/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
            .trim();
          const lkPub = await fetchLinkedInPublicProfileData(lkNormUrl);
          const parts: string[] = [];
          if (lkPub.ogTitle || lkPub.ogDescription) {
            parts.push(`Meta LinkedIn: ${lkPub.ogTitle} — ${lkPub.ogDescription}`);
          }
          if (lkPub.jsonLdObjects.length > 0) {
            parts.push(`JSON-LD LinkedIn: ${JSON.stringify(lkPub.jsonLdObjects).slice(0, 8000)}`);
          }
          if (lkPub.visibleText.length > 120) {
            parts.push(`Conteúdo Público LinkedIn:\n${lkPub.visibleText.slice(0, 14000)}`);
          }
          try {
            const lkRes = await ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: `Pesquise publicamente no Google e no LinkedIn todos os cargos, empresas, datas, formação académica, competências, certificações, projetos e idiomas de "${lkCleanName}" (${lkNormUrl}). Extraia apenas factos reais.`,
              config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
              }
            });
            if (lkRes.text && lkRes.text.trim().length > 80) {
              parts.push(`Pesquisa Web LinkedIn:\n${lkRes.text.trim().slice(0, 14000)}`);
            }
          } catch {
            // proceed with whatever public data was gathered
          }
          enrichedLinkedInContext = parts.join('\n\n');
        } catch {
          // non-blocking enrichment
        }
      }

      const resolvedRawPrompt = resolveServerPromptConfig('resumeSummary', adminPromptConfig);
      const customInstructionBlock = resolvedRawPrompt?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${resolvedRawPrompt.systemInstruction}\n`
        : '';

      const prompt = isStandardMode
        ? `
Você é um especialista sénior em Recursos Humanos, redação de currículos e formatação compatível com sistemas ATS (Workday, Taleo, Greenhouse, Europass).
${customInstructionBlock}
O candidato enviou um currículo existente, texto bruto, notas de carreira ou perfil do LinkedIn para ser ESTRUTURADO E APRIMORADO como um CV geral (SEM uma vaga específica de destino).

SUA MISSÃO:
1. Analisar os dados fornecidos e GERAR UM CURRÍCULO ESTRUTURADO COMPLETO no padrão solicitado (${targetStandard || 'Padrão Corporativo Internacional & Executivo'}).
2. PRESERVAR FIELMENTE 100% dos cargos reais, empresas, datas, formações académicas, competências, certificações, projetos, prémios, publicações, voluntariado e idiomas do candidato — NÃO resuma nem elimine experiências ou certificações. NÃO invente cargos executivos, empresas ou indústrias que não existam nos dados originais.
3. Melhorar a clareza, ortografia, organização em bullet points orientados a resultados e legibilidade para recrutadores e filtros ATS, mantendo total fidelidade à trajetória real do candidato.

DADOS BRUTOS / CURRÍCULO DO CANDIDATO:
${trimmedRawInfo}
${candidateLinkedIn ? `Perfil / Link do LinkedIn: ${candidateLinkedIn}` : ''}
${enrichedLinkedInContext ? `\nDADOS EXTRAÍDOS DO LINKEDIN:\n${enrichedLinkedInContext}` : ''}

DIRETRIZES DE EXTRAÇÃO E MELHORIA COMPLETA:
1. Extraia o Nome Completo, Título Profissional real do candidato, Localização, Telefone, E-mail, LinkedIn e Website/Portfólio.
2. Resumo Profissional (Summary): Escreva um resumo claro e executivo de 4 a 6 linhas baseado exclusivamente na experiência e área real do candidato.
3. Competências Principais (Core Competencies): Agrupe TODAS as competências, tecnologias, metodologias e ferramentas reais do candidato em 5 a 8 categorias objetivas.
4. Experiência Profissional: Liste TODAS as experiências encontradas (sem omitir nenhuma) em ordem cronológica reversa, mantendo empresas, cargos e períodos reais, estruturando 3 a 5 bullet points fortes por cargo.
5. Formação Académica, Certificações/Licenças/Cursos/Projetos/Publicações/Voluntariado (em trainings[]), Idiomas e Referências: Extraia absolutamente tudo o que constar nos dados (se não houver referências no texto, retorne lista vazia [] e não invente contactos falsos).

Responda ESTRITAMENTE em formato JSON com esta estrutura exata:
{
  "personalDetails": {
    "name": "Nome Completo",
    "title": "Título Profissional Real",
    "location": "Cidade, País",
    "phone": "+...",
    "email": "email@...",
    "linkedin": "linkedin.com/in/...",
    "website": "https://..."
  },
  "summary": "Texto do resumo profissional...",
  "competencies": [
    { "id": "comp-1", "category": "Categoria", "description": "Competências e ferramentas" }
  ],
  "experiences": [
    {
      "id": "exp-1",
      "company": "Empresa / Organização",
      "role": "Cargo",
      "period": "Período",
      "location": "Local",
      "donor": "",
      "highlights": ["Realização ou responsabilidade aprimorada 1", "Realização ou responsabilidade aprimorada 2"]
    }
  ],
  "educations": [
    { "id": "edu-1", "degree": "Grau / Curso", "institution": "Instituição", "period": "Anos", "gpaOrHonors": "" }
  ],
  "trainings": ["Certificação ou curso"],
  "languages": [
    { "language": "Idioma", "level": "Nível de proficiência" }
  ],
  "references": [
    { "id": "ref-1", "name": "Nome", "institutionAndPosition": "Entidade e Cargo", "contact": "email ou telefone" }
  ],
  "atsInsights": {
    "scoreEstimate": 90,
    "matchedKeywords": ["palavra1", "palavra2"],
    "missingKeywords": [],
    "recommendations": ["recomendação de melhoria do CV 1", "recomendação de melhoria do CV 2"]
  }
}
      `.trim()
        : `
Você é o mais conceituado consultor executivo de Recursos Humanos e Headhunter Internacional, especializado em recrutamento de liderança para grandes multinacionais, Big Techs e empresas de consultoria global.
${customInstructionBlock}
O candidato enviou textos brutos, notas de carreira, projetos, documentos ou histórico do LinkedIn.
Em outro campo, foi fornecida a descrição da vaga pretendida (Requisitos e Responsabilidades).

SUA MISSÃO:
Analisar minuciosamente os dados do candidato e GERAR UM CURRÍCULO ESTRUTURADO COMPLETO, de altíssimo impacto executivo, otimizado para sistemas ATS e adaptado estrategicamente à vaga fornecida.
Padrão Institucional Alvo: ${targetStandard || 'Padrão Corporativo Internacional & Executivo'}.

DADOS BRUTOS DO CANDIDATO:
${trimmedRawInfo}
${candidateLinkedIn ? `Perfil / Link do LinkedIn: ${candidateLinkedIn}` : ''}
${enrichedLinkedInContext ? `\nDADOS EXTRAÍDOS DO LINKEDIN:\n${enrichedLinkedInContext}` : ''}

DESCRIÇÃO DA VAGA / REQUISITOS:
${cleanJobDesc}

DIRETRIZES DE FORMULAÇÃO DE ALTO IMPACTO:
1. Extraia o Nome Completo, Título Profissional Executivo (adaptado à vaga), Localização, Telefone, E-mail e LinkedIn. Se faltar algum dado, estruture de forma realista.
2. Resumo Executivo (Summary): Escreva um resumo de alto impacto de 4 a 6 linhas destacando anos de experiência, especialidade central, liderança técnica/operacional e conquistas comprovadas alinhadas aos objetivos da vaga.
3. Competências Principais (Core Competencies): Extraia de 5 a 6 categorias de competências essenciais, cada uma com título forte e descrição contendo as palavras-chave exatas da vaga.
4. Experiência Profissional: Organize em ordem cronológica reversa. Para cada cargo, estruture Organização, Cargo, Período, Local e crie bullet points de alto impacto aplicando a fórmula Google XYZ: Ação Forte + Contexto/Ferramentas + Métrica/Resultado quantificável (crescimento de receita, redução de custos, otimização de tempo, liderança de equipas ou entrega de projetos críticos).
5. Formação Académica (Education): Liste graus, instituições e anos.
6. Formação Especializada, Certificações & Idiomas: Inclua metodologias, softwares e proficiência em idiomas.
7. Referências: Estruture referências profissionais formais com Nome, Entidade/Cargo e Contacto.

Responda ESTRITAMENTE em formato JSON com esta estrutura exata:
{
  "personalDetails": {
    "name": "Nome Completo",
    "title": "Título Profissional Executivo",
    "location": "Cidade, País",
    "phone": "+...",
    "email": "email@...",
    "linkedin": "linkedin.com/in/...",
    "website": "https://..."
  },
  "summary": "Texto do resumo de alto impacto...",
  "competencies": [
    { "id": "comp-1", "category": "Nome da Competência", "description": "Detalhes técnicos e ferramentas" }
  ],
  "experiences": [
    {
      "id": "exp-1",
      "company": "Organização / Empresa",
      "role": "Cargo",
      "period": "Período",
      "location": "Local",
      "donor": "Área / Unidade de Negócio",
      "highlights": ["Ponto de impacto com métricas", "Ponto de impacto com métricas"]
    }
  ],
  "educations": [
    { "id": "edu-1", "degree": "Grau", "institution": "Universidade", "period": "Anos", "gpaOrHonors": "Honras se houver" }
  ],
  "trainings": ["Certificação 1", "Especialização 2"],
  "languages": [
    { "language": "Idioma", "level": "Nível de proficiência" }
  ],
  "references": [
    { "id": "ref-1", "name": "Nome", "institutionAndPosition": "Entidade e Cargo", "contact": "email ou telefone" }
  ],
  "atsInsights": {
    "scoreEstimate": 95,
    "matchedKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3"],
    "recommendations": ["recomendação estratégica 1", "recomendação estratégica 2"]
  }
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedRawPrompt?.temperature === 'number'
            ? { temperature: resolvedRawPrompt.temperature }
            : {})
        },
        resolvedRawPrompt
      );

      const parsed = parseAiJson(response.text);
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'rawImport',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/generate-from-raw:', err);
      return res.status(500).json({
        error: sanitizeAiErrorMessage(err, 'Erro ao estruturar currículo via IA. A usar analisador inteligente.'),
        fallback: true
      });
    }
  });

  // AI Cover Letter endpoint with language support
  app.post('/api/cover-letter', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { cvData, jobDescription, recipientName, organizationName, language, adminPromptConfig } = req.body;

      if (isAiGloballyPaused()) {
        return res.status(503).json({
          error: 'Os recursos de Inteligência Artificial estão temporariamente pausados pelo administrador.',
          aiPaused: true,
          fallback: true
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }
      const usageCheck = trackAuthenticatedAiUsage(req, 'coverLetter');
      if (usageCheck.featureBlocked || usageCheck.quotaExceeded) {
        return res.status(usageCheck.featureBlocked ? 403 : 402).json({
          error: usageCheck.message || 'Os seus créditos gratuitos esgotaram. Faça upgrade para continuar.',
          quotaExceeded: Boolean(usageCheck.quotaExceeded),
          featureBlocked: Boolean(usageCheck.featureBlocked),
          fallback: true
        });
      }

      const resolvedCoverPrompt = resolveServerPromptConfig('coverLetter', adminPromptConfig);
      const candidateName = cvData?.personalDetails?.name || cvData?.name || 'Candidato Executivo';
      const candidateTitle = cvData?.personalDetails?.title || cvData?.title || 'Especialista Sênior';
      const candidateContacts = [
        cvData?.personalDetails?.email || cvData?.email,
        cvData?.personalDetails?.phone || cvData?.phone,
        cvData?.personalDetails?.location || cvData?.location,
        cvData?.personalDetails?.linkedin || cvData?.linkedin
      ].filter(Boolean).join(' | ');

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos especializado em cartas de motivação e apresentação de alto nível para grandes corporações, empresas de consultoria e posições executivas globais.
${resolvedCoverPrompt?.systemInstruction ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${resolvedCoverPrompt.systemInstruction}\n` : ''}Escreva uma Carta de Apresentação / Motivação Estratégica formal no idioma: ${language || 'English (Inglês)'}.

DADOS DO CANDIDATO:
Nome: ${candidateName}
Título: ${candidateTitle}
Contactos: ${candidateContacts}
Organização Alvo: ${organizationName || 'Selection Committee / Hiring Team'}
Destinatário: ${recipientName || 'Dear Hiring Committee'}

DESCRIÇÃO DA VAGA / REQUISITOS:
${jobDescription || 'Posição de Liderança Executiva, Gestão ou Especialista Sênior'}

Resumo Profissional do Candidato:
${cvData?.summary || ''}

Experiências Principais do Candidato:
${JSON.stringify(cvData?.experiences || [], null, 2)}

DIRETRIZES DA CARTA:
1. Cabeçalho formal executivo internacional com data e identificação.
2. Abertura afirmativa declarando com entusiasmo a candidatura e o alinhamento com a visão da organização.
3. Demonstração de autoridade profissional direta baseada nas realizações reais presentes no histórico do candidato (liderança de equipas, alcance de metas, eficiência operacional, projetos estratégicos).
4. Conexão explícita entre as competências do candidato e os desafios prioritários da vaga.
5. Conclusão cortês com convite para entrevista técnica e agradecimento.

Responda ESTRITAMENTE em JSON:
{
  "subject": "Application for the position of...",
  "letterBody": "Full letter text formatted in clear paragraphs with proper spacing",
  "keySellingPoints": ["point 1", "point 2", "point 3"]
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedCoverPrompt?.temperature === 'number'
            ? { temperature: resolvedCoverPrompt.temperature }
            : {})
        },
        resolvedCoverPrompt
      );

      const parsed = parseAiJson(response.text);
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'coverLetter',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/cover-letter:', err);
      return res.status(500).json({
        error: sanitizeAiErrorMessage(err, 'Erro temporário ao gerar carta de apresentação com IA.'),
        fallback: true
      });
    }
  });

  // Dedicated AI Translation endpoint for Cover Letters & CV text
  app.post('/api/translate-letter', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { text, targetLanguage, adminPromptConfig } = req.body;

      if (!text || !String(text).trim()) {
        return res.status(400).json({ error: 'Texto da carta não fornecido.' });
      }
      if (String(text).length > 25000) {
        return res.status(400).json({ error: 'O texto excede o limite permitido para tradução.' });
      }

      if (isAiGloballyPaused()) {
        return res.status(503).json({
          error: 'Os recursos de Inteligência Artificial estão temporariamente pausados pelo administrador.',
          aiPaused: true,
          fallback: true
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Serviço de tradução IA indisponível: configure GEMINI_API_KEY no servidor.',
          fallback: true
        });
      }
      const usageCheck = trackAuthenticatedAiUsage(req, 'coverLetter');
      if (usageCheck.featureBlocked || usageCheck.quotaExceeded) {
        return res.status(usageCheck.featureBlocked ? 403 : 402).json({
          error: usageCheck.message || 'Os seus créditos gratuitos esgotaram. Faça upgrade para continuar.',
          quotaExceeded: Boolean(usageCheck.quotaExceeded),
          featureBlocked: Boolean(usageCheck.featureBlocked),
          fallback: true
        });
      }

      const resolvedTranslatePrompt = resolveServerPromptConfig('translateDoc', adminPromptConfig);
      const langMap: Record<string, string> = {
        pt: 'Portuguese (Português Corporativo e Executivo Formal)',
        en: 'English (International Executive & Corporate Standard)',
        es: 'Spanish (Español Ejecutivo Internacional)',
        fr: 'French (Français Exécutif et Formel)',
        de: 'German (Deutsch - Formelles Geschäfts- und Führungsdeutsch)'
      };
      const targetLangName = langMap[String(targetLanguage || '').toLowerCase()] || targetLanguage || 'English';

      const prompt = `
You are a senior executive translator specialized in international corporate correspondence, cover letters, and motivation statements.
${resolvedTranslatePrompt?.systemInstruction ? `ADMIN INSTRUCTION: ${resolvedTranslatePrompt.systemInstruction}\n` : ''}Translate the entire Cover Letter below accurately and naturally into: ${targetLangName}.

CRITICAL GUIDELINES:
1. Translate EVERY single sentence and heading written by the user (subject line, header labels like "To:"/"Subject:", opening salutation, all body paragraphs, closing salutation, and job title in the signature).
2. Preserve personal names, company/organization names, phone numbers, email addresses, URLs, acronyms (ATS, KPI, OKR, P&L, M&A, NPS, ERP, ROI), and specific numbers/metrics exactly as written.
3. Adapt formal salutations and closings naturally to the executive conventions of ${targetLangName}.
4. Preserve paragraph breaks and formatting structure cleanly.

Cover letter text to translate:
${text}

Respond STRICTLY in valid JSON:
{
  "translatedText": "Full translated letter text with preserved paragraph breaks"
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedTranslatePrompt?.temperature === 'number'
            ? { temperature: resolvedTranslatePrompt.temperature }
            : {})
        },
        { ...(resolvedTranslatePrompt || {}), useCostSaving: true }
      );

      const parsedRaw = parseAiJson(response.text);
      const parsed = parsedRaw?.data || parsedRaw;
      if (!parsed.translatedText) {
        return res.status(502).json({ error: 'A IA não retornou o texto traduzido da carta.' });
      }
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'coverLetter',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/translate-letter:', err);
      return res.status(500).json({ error: sanitizeAiErrorMessage(err, 'Falha ao traduzir a carta.') });
    }
  });

  // -------------------------------------------------------------
  // DEDICATED FULL CV TRANSLATION ENDPOINT
  // Translates entire CVData into target language (PT, EN, ES, FR, DE)
  // -------------------------------------------------------------
  app.post('/api/translate-cv', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { cvData, targetLanguage, adminPromptConfig } = req.body;

      if (!cvData) {
        return res.status(400).json({ error: 'Dados do currículo não fornecidos.' });
      }

      const langMap: Record<string, string> = {
        en: 'English (US/UK Executive Standard)',
        es: 'Español (Estándar Ejecutivo Internacional)',
        fr: 'Français (Norme Internationale des Cadres Dirigeants)',
        de: 'Deutsch (Internationaler Führungs- und Akademikerstandard)',
        pt: 'Português (Padrão Corporativo de Alta Liderança)'
      };

      const langKey = String(targetLanguage || 'en').toLowerCase();
      const targetLangName = langMap[langKey] || targetLanguage || 'English';

      if (isAiGloballyPaused()) {
        return res.status(503).json({
          error: 'Os recursos de Inteligência Artificial estão temporariamente pausados pelo administrador.',
          aiPaused: true,
          fallback: true
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Serviço de tradução IA indisponível: configure GEMINI_API_KEY no servidor.',
          fallback: true
        });
      }
      const usageCheck = trackAuthenticatedAiUsage(req);
      if (usageCheck.quotaExceeded) {
        return res.status(402).json({
          error: usageCheck.message || 'Os seus créditos gratuitos esgotaram. Faça upgrade para continuar.',
          quotaExceeded: true,
          fallback: true
        });
      }

      const resolvedTranslatePrompt = resolveServerPromptConfig('translateDoc', adminPromptConfig);
      const cvForTranslation = {
        personalDetails: {
          name: cvData.personalDetails?.name || '',
          title: cvData.personalDetails?.title || '',
          location: cvData.personalDetails?.location || ''
        },
        summary: cvData.summary || '',
        competencies: cvData.competencies || [],
        experiences: cvData.experiences || [],
        educations: cvData.educations || [],
        trainings: cvData.trainings || [],
        languages: cvData.languages || [],
        references: cvData.references || []
      };

      const prompt = `
You are a world-class executive career consultant and international translator.
${resolvedTranslatePrompt?.systemInstruction ? `ADMIN INSTRUCTION: ${resolvedTranslatePrompt.systemInstruction}\n` : ''}Your task is to translate ALL user-written content in the provided CVData JSON into: ${targetLangName} (language code: ${langKey}).

CRITICAL GUIDELINES:
1. MANDATORY TARGET LANGUAGE: Every user-written field MUST be output in ${targetLangName}. Even if the input text is in Portuguese, English, Spanish, French, or German, do NOT leave source-language sentences untranslated.
2. Preserve Identity & Contacts: Keep personalDetails.name and company/university proper brand names intact.
3. Translate ALL Text Content Written by the User:
   - personalDetails.title (professional title)
   - personalDetails.location (city/country/availability phrasing, e.g., "Disponibilidade para Mobilidade Global" -> "Open to Global Relocation")
   - summary (full executive summary)
   - Every item in competencies: both 'category' and 'description'
   - Every item in experiences: 'role', 'period' (e.g., "Presente" -> "Present"/"Actualidad"/"Actuel"/"Heute"), 'location', 'donor' (if present), and EVERY string inside 'highlights'
   - Every item in educations: 'degree', 'period', 'gpaOrHonors' (if present)
   - Every string in trainings[]
   - Every item in languages: both 'language' name and 'level' description
   - Every item in references: 'institutionAndPosition'
4. Accuracy & Metrics: Keep ALL numbers, percentages, currencies, company names, and technical acronyms (P&L, KPI, OKR, ROI, NPS, M&A, ERP, AWS, Python, etc.) completely accurate.
5. Keep array lengths, ordering, and every 'id' field identical to the input.

ORIGINAL CV DATA:
${JSON.stringify(cvForTranslation, null, 2)}

Respond STRICTLY in valid JSON matching the exact CVData schema at top-level (with "personalDetails", "summary", "competencies", "experiences", "educations", "trainings", "languages", "references").
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedTranslatePrompt?.temperature === 'number'
            ? { temperature: resolvedTranslatePrompt.temperature }
            : {})
        },
        { ...(resolvedTranslatePrompt || {}), useCostSaving: true }
      );

      recordServerTelemetry({
        type: 'ai_called',
        feature: 'aiTailor',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });

      const rawParsed = parseAiJson(response.text);
      const parsed = rawParsed?.translatedCV || rawParsed?.cvData || rawParsed;

      // Sanitize and deterministically preserve immutable identifiers and visual config
      const mergedCV = {
        ...cvData,
        ...parsed,
        personalDetails: {
          ...cvData.personalDetails,
          ...(parsed.personalDetails || {}),
          name: cvData.personalDetails?.name || parsed.personalDetails?.name || '',
          phone: cvData.personalDetails?.phone || parsed.personalDetails?.phone || '',
          email: cvData.personalDetails?.email || parsed.personalDetails?.email || '',
          linkedin: cvData.personalDetails?.linkedin || parsed.personalDetails?.linkedin || '',
          website: cvData.personalDetails?.website || parsed.personalDetails?.website || '',
          photoUrl: cvData.personalDetails?.photoUrl,
          showPhoto: cvData.personalDetails?.showPhoto
        },
        competencies: Array.isArray(parsed.competencies)
          ? parsed.competencies.map((c: any, idx: number) => ({
              ...cvData.competencies?.[idx],
              ...c,
              id: cvData.competencies?.[idx]?.id || c.id || `comp-${idx + 1}`
            }))
          : cvData.competencies,
        experiences: Array.isArray(parsed.experiences)
          ? parsed.experiences.map((exp: any, idx: number) => ({
              ...cvData.experiences?.[idx],
              ...exp,
              id: cvData.experiences?.[idx]?.id || exp.id || `exp-${idx + 1}`,
              company: cvData.experiences?.[idx]?.company || exp.company || ''
            }))
          : cvData.experiences,
        educations: Array.isArray(parsed.educations)
          ? parsed.educations.map((edu: any, idx: number) => ({
              ...cvData.educations?.[idx],
              ...edu,
              id: cvData.educations?.[idx]?.id || edu.id || `edu-${idx + 1}`,
              institution: cvData.educations?.[idx]?.institution || edu.institution || ''
            }))
          : cvData.educations,
        trainings: Array.isArray(parsed.trainings) ? parsed.trainings : cvData.trainings,
        languages: Array.isArray(parsed.languages) ? parsed.languages : cvData.languages,
        references: Array.isArray(parsed.references)
          ? parsed.references.map((ref: any, idx: number) => ({
              ...cvData.references?.[idx],
              ...ref,
              id: cvData.references?.[idx]?.id || ref.id || `ref-${idx + 1}`,
              name: cvData.references?.[idx]?.name || ref.name || ''
            }))
          : cvData.references,
        templateStyle: cvData.templateStyle,
        accentColor: cvData.accentColor,
        fontFamily: cvData.fontFamily,
        sectionOrder: cvData.sectionOrder,
        sectionVisibility: cvData.sectionVisibility
      };

      return res.json({ translatedCV: mergedCV });
    } catch (err: any) {
      console.error('Erro na rota /api/translate-cv:', err);
      return res.status(500).json({ error: sanitizeAiErrorMessage(err, 'Falha ao traduzir o currículo.') });
    }
  });


  // -------------------------------------------------------------
  // LINKEDIN FULL PROFILE EXTRACTION ENGINE (URL + HTML/JSON-LD + Google Search/URL Grounding + PDF/Text)
  // -------------------------------------------------------------
  function normalizeLinkedInUrl(rawInput: string): { normalizedUrl: string; slug: string } {
    let trimmed = String(rawInput || '').trim().slice(0, 500);
    if (!trimmed) return { normalizedUrl: '', slug: '' };
    if (!/^https?:\/\//i.test(trimmed)) {
      if (/linkedin\.com/i.test(trimmed)) {
        trimmed = `https://${trimmed.replace(/^\/+/, '')}`;
      } else if (/^in\/[a-zA-Z0-9_-]+/i.test(trimmed)) {
        trimmed = `https://www.linkedin.com/${trimmed}`;
      } else if (/^[a-zA-Z0-9-]{3,80}$/.test(trimmed)) {
        trimmed = `https://www.linkedin.com/in/${trimmed}`;
      }
    }
    const match = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i);
    const rawSlug = match ? decodeURIComponent(match[1]) : '';
    const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9À-ÿ._-]/g, '');
    const normalizedUrl = cleanSlug
      ? `https://www.linkedin.com/in/${encodeURIComponent(cleanSlug)}/`
      : trimmed;
    return { normalizedUrl, slug: cleanSlug };
  }

  function decodeLinkedInHtmlEntities(input: string): string {
    return input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
      .replace(/&nbsp;/g, ' ');
  }

  async function fetchLinkedInPublicProfileData(targetUrl: string): Promise<{
    status: 'public_html' | 'authwall_blocked' | 'not_found' | 'skipped';
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    jsonLdObjects: any[];
    visibleText: string;
  }> {
    if (!targetUrl) {
      return { status: 'skipped', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
    }

    try {
      let currentUrl = await assertSafeExternalUrl(targetUrl);
      if (!currentUrl.hostname.toLowerCase().endsWith('linkedin.com')) {
        return { status: 'not_found', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
      }

      let html = '';
      let finalStatus = 0;

      for (let hop = 0; hop < 3; hop += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        try {
          const resp = await fetch(currentUrl.toString(), {
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
          });
          finalStatus = resp.status;
          if (resp.status >= 300 && resp.status < 400) {
            const loc = resp.headers.get('location');
            if (!loc) break;
            if (/authwall|uas\/login|checkpoint/i.test(loc)) {
              return { status: 'authwall_blocked', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
            }
            const nextUrl = await assertSafeExternalUrl(new URL(loc, currentUrl).toString());
            if (!nextUrl.hostname.toLowerCase().endsWith('linkedin.com')) {
              return { status: 'authwall_blocked', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
            }
            currentUrl = nextUrl;
            continue;
          }
          html = await resp.text();
          break;
        } finally {
          clearTimeout(timer);
        }
      }

      if (finalStatus === 999 || finalStatus === 403 || finalStatus === 401) {
        return { status: 'authwall_blocked', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
      }
      if (!html) {
        return { status: 'not_found', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
      }

      const extractMeta = (attr: string, name: string): string => {
        const re1 = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
        const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i');
        const m = html.match(re1) || html.match(re2);
        return m ? decodeLinkedInHtmlEntities(m[1]).trim() : '';
      };

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? decodeLinkedInHtmlEntities(titleMatch[1]).trim() : '';
      const ogTitle = extractMeta('property', 'og:title') || pageTitle;
      const ogDescription =
        extractMeta('property', 'og:description') || extractMeta('name', 'description');
      const rawOgImage = extractMeta('property', 'og:image');
      const isGhostAvatar =
        !rawOgImage ||
        /ghost|static\.licdn\.com\/aero-v1\/sc\/h\/|default|placeholder|icon/i.test(rawOgImage);
      const ogImage = isGhostAvatar ? '' : rawOgImage;

      const jsonLdObjects: any[] = [];
      const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1].trim());
          jsonLdObjects.push(parsed);
        } catch {
          // ignore malformed ld+json block
        }
      }

      const isAuthwallPage =
        /authwall|uas\/login|join linkedin|sign in \| linkedin|entrar \| linkedin|cadastre-se no linkedin/i.test(
          `${pageTitle} ${ogTitle}`
        ) && jsonLdObjects.length === 0;

      if (isAuthwallPage) {
        return { status: 'authwall_blocked', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
      }

      const visibleText = decodeLinkedInHtmlEntities(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
          .replace(/<\/(p|div|li|h[1-6]|section|article|tr|br)>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
      )
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 26000);

      return {
        status: visibleText.length > 180 || jsonLdObjects.length > 0 || ogDescription.length > 40 ? 'public_html' : 'authwall_blocked',
        ogTitle,
        ogDescription,
        ogImage,
        jsonLdObjects,
        visibleText
      };
    } catch (err) {
      console.warn('Aviso ao tentar fetch público do LinkedIn:', (err as any)?.message || err);
      return { status: 'authwall_blocked', ogTitle: '', ogDescription: '', ogImage: '', jsonLdObjects: [], visibleText: '' };
    }
  }

  function parseLinkedInRawTextFallback(rawText: string, cleanName: string, cleanUrl: string, usernameSlug: string, templateStyle: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !/^---/.test(l) && !/^(linkedin|page \d+ of \d+|página \d+ de \d+)$/i.test(l));

    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(\+?\d[\d\s().-]{7,18}\d)/);
    const siteMatch = rawText.match(/https?:\/\/(?![^\s]*linkedin\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s)]*/i);

    const detectedName =
      lines[0] && lines[0].length >= 3 && lines[0].length <= 65 && !lines[0].includes('@')
        ? lines[0].replace(/\|.*$/, '').trim()
        : cleanName;
    const detectedTitle =
      lines[1] && lines[1].length >= 4 && lines[1].length <= 120 && !lines[1].includes('@')
        ? lines[1]
        : 'Especialista / Líder Profissional';

    const bullets = lines
      .filter((l) => /^[-•*▪●]\s+/.test(l))
      .map((l) => l.replace(/^[-•*▪●]\s+/, '').trim())
      .filter((l) => l.length > 10);

    return {
      personalDetails: {
        name: detectedName.toUpperCase(),
        title: detectedTitle,
        location: 'Disponível para Projetos / Remoto',
        phone: phoneMatch ? phoneMatch[0].trim() : '',
        email: emailMatch ? emailMatch[0] : '',
        linkedin: cleanUrl || `https://www.linkedin.com/in/${usernameSlug}`,
        website: siteMatch ? siteMatch[0] : ''
      },
      summary:
        lines.slice(2, 8).filter((l) => l.length > 45).join(' ').slice(0, 650) ||
        `Profissional com experiência em ${detectedTitle}, focado em entrega de resultados, excelência técnica e colaboração estratégica.`,
      competencies: [
        {
          id: 'comp-lk-1',
          category: 'Competências & Especialidades',
          description:
            lines.filter((l) => l.length > 5 && l.length < 70 && !l.includes('@')).slice(2, 10).join(', ') ||
            'Gestão Estratégica, Liderança Técnica e Execução de Projetos'
        }
      ],
      experiences: [
        {
          id: 'exp-lk-1',
          company: 'Experiência Extraída do Perfil LinkedIn',
          role: detectedTitle,
          period: 'Histórico Profissional',
          location: '',
          highlights:
            bullets.length > 0
              ? bullets.slice(0, 8)
              : lines.filter((l) => l.length > 35).slice(0, 5)
        }
      ],
      educations: [],
      trainings: [],
      languages: [{ language: 'Português', level: 'Fluente / Nativo' }],
      references: [],
      templateStyle
    };
  }

  app.post('/api/extract-linkedin', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { url, rawText, targetStandard, preferredTemplate, accentColor, fontFamily, language } = req.body || {};
      const jobId = `job_lk_${crypto.randomUUID().slice(0, 8)}`;

      if (!url && !rawText) {
        return res.status(400).json({ error: 'URL do perfil do LinkedIn ou texto/PDF do perfil não fornecido.' });
      }

      const { normalizedUrl, slug } = normalizeLinkedInUrl(String(url || ''));
      const usernameSlug = slug || 'perfil-profissional';
      const cleanUrl = normalizedUrl || String(url || '').trim().slice(0, 500);
      const boundedRawText = String(rawText || '').trim().slice(0, 45000);
      const cleanName = usernameSlug
        .replace(/-\d{4,}$/, '')
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
        .trim();

      const resolvedTemplateStyle =
        preferredTemplate ||
        (targetStandard === 'tech'
          ? 'tech_modern'
          : targetStandard === 'harvard'
          ? 'executive_harvard'
          : targetStandard === 'europass'
          ? 'european_europass'
          : targetStandard === 'ats'
          ? 'ats_compact'
          : 'executive_harvard');

      const logs: string[] = [];

      // STAGE 1: Direct SSRF-safe public LinkedIn HTML + JSON-LD + OpenGraph inspection
      const publicData = await fetchLinkedInPublicProfileData(cleanUrl);
      if (publicData.status === 'public_html') {
        logs.push('Perfil público LinkedIn acedido com sucesso (HTML/JSON-LD/OpenGraph).');
      } else if (publicData.status === 'authwall_blocked') {
        logs.push('LinkedIn aplicou barreira de sessão direta — ativando busca web indexada e análise profunda.');
      }

      // STAGE 2: Google Search Grounding via Gemini to recover full public career details
      let groundingDossier = '';
      let groundingSources: Array<{ title: string; uri: string }> = [];

      if (ai && !isAiGloballyPaused() && cleanUrl && /linkedin\.com\/in\//i.test(cleanUrl) && boundedRawText.length < 1200) {
        const researchPrompt = `
Pesquise publicamente na web e em páginas indexadas do LinkedIn, GitHub, portfólios e imprensa sobre este profissional:
URL do LinkedIn: ${cleanUrl}
Nome / identificador: ${cleanName}

OBJETIVO: Recolher ABSOLUTAMENTE TUDO o que estiver indexado publicamente sobre este profissional:
1. Nome completo exato e Título profissional (Headline)
2. Localização (cidade/país)
3. Resumo / Biografia profissional ("Sobre")
4. TODAS as Experiências Profissionais encontradas (empresa, cargo exato, datas de início/fim, localização, conquistas e projetos)
5. TODA a Formação Académica (universidades, cursos, graus, datas, honras)
6. TODAS as Competências (Skills), Tecnologias, Ferramentas e Metodologias
7. TODAS as Licenças, Certificações, Cursos, Projetos, Publicações, Prémios e Voluntariado
8. TODOS os Idiomas e links externos (website, portfólio, GitHub)

REGRAS ESTRITAS:
- Baseie-se estritamente nos resultados de pesquisa encontrados. NÃO invente empregos, empresas ou números fictícios.
- Liste o máximo de factos reais e detalhados possível.
        `.trim();

        const searchErrors: string[] = [];
        for (const searchModel of ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 16000);
          try {
            const researchRes = await Promise.race([
              ai.models.generateContent({
                model: searchModel,
                contents: researchPrompt,
                config: {
                  tools: [{ googleSearch: {} }],
                  ...(searchModel === 'gemini-4-hydrogen'
                    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                    : {}),
                  abortSignal: controller.signal
                }
              }),
              new Promise<never>((_, reject) => {
                controller.signal.addEventListener('abort', () => reject(new Error('Timeout na pesquisa LinkedIn')), {
                  once: true
                });
              })
            ]);

            groundingDossier = (researchRes.text || '').trim().slice(0, 28000);
            const rawChunks = researchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const seenUris = new Set<string>();
            for (const ch of rawChunks as any[]) {
              const uri = ch?.web?.uri;
              const title = ch?.web?.title;
              if (uri && !seenUris.has(uri)) {
                seenUris.add(uri);
                groundingSources.push({ title: String(title || uri).slice(0, 120), uri: String(uri) });
              }
              if (groundingSources.length >= 6) break;
            }
            if (groundingDossier.length > 80) {
              logs.push(
                `Pesquisa web indexada concluída via ${searchModel} (${groundingSources.length} fonte(s) pública(s) verificada(s)).`
              );
              break;
            }
          } catch (groundErr: any) {
            const safeMsg = sanitizeTelemetryText(groundErr?.message || String(groundErr), 180);
            searchErrors.push(`${searchModel}: ${safeMsg}`);
            console.warn(`Grounding LinkedIn falhou em ${searchModel}:`, safeMsg);
          } finally {
            clearTimeout(timer);
          }
        }
        if (!groundingDossier && searchErrors.length > 0) {
          logs.push('Pesquisa web indexada temporariamente limitada — usando metadados públicos e PDF/texto se anexado.');
        }
      }

      const evidenceSegments: string[] = [];
      if (publicData.ogTitle || publicData.ogDescription) {
        evidenceSegments.push(
          `[METADATA OPENGRAPH LINKEDIN]\nog:title: ${publicData.ogTitle}\nog:description: ${publicData.ogDescription}\nog:image: ${publicData.ogImage || 'Nenhuma'}`
        );
      }
      if (publicData.jsonLdObjects.length > 0) {
        evidenceSegments.push(
          `[DADOS ESTRUTURADOS JSON-LD DO PERFIL]\n${JSON.stringify(publicData.jsonLdObjects, null, 2).slice(0, 12000)}`
        );
      }
      if (publicData.visibleText.length > 120) {
        evidenceSegments.push(`[TEXTO EXTRAÍDO DA PÁGINA PÚBLICA LINKEDIN]\n${publicData.visibleText.slice(0, 18000)}`);
      }
      if (groundingDossier.length > 80) {
        evidenceSegments.push(`[PESQUISA WEB PROFUNDA & URL GROUNDING]\n${groundingDossier}`);
      }
      if (boundedRawText.length > 20) {
        evidenceSegments.push(`[PDF / TEXTO COMPLETO DO LINKEDIN ENVIADO PELO UTILIZADOR]\n${boundedRawText}`);
      }

      const combinedEvidence = evidenceSegments.join('\n\n====================================\n\n');
      const hasStrongEvidence =
        boundedRawText.length > 80 ||
        publicData.visibleText.length > 250 ||
        publicData.jsonLdObjects.length > 0 ||
        groundingDossier.length > 260;

      // STAGE 3: Full-Profile Executive CVData Synthesis via Gemini
      if (ai && !isAiGloballyPaused()) {
        try {
          const lkUsage = trackAuthenticatedAiUsage(req);
          if (lkUsage.quotaExceeded) {
            return res.status(402).json({
              error: lkUsage.message || 'Os seus créditos gratuitos esgotaram. Faça upgrade para importar perfis com IA.',
              quotaExceeded: true,
              fallback: true
            });
          }
          const outLangHint =
            language === 'en'
              ? 'English (preserve original proper nouns, translate/format section descriptions cleanly in English)'
              : language === 'es'
              ? 'Español'
              : language === 'fr'
              ? 'Français'
              : language === 'de'
              ? 'Deutsch'
              : language === 'it'
              ? 'Italiano'
              : 'Português (ou idioma predominante dos dados reais do perfil)';

          const synthesisPrompt = `
Você é o principal arquiteto de currículos executivos e parser de dados de carreira ATS.
O utilizador pediu para IMPORTAR TUDO DO LINKEDIN (sem omitir nada) e transformar num currículo visualmente bonito, completo e rigoroso.

URL do LinkedIn: ${cleanUrl || 'Não informada'}
Nome de referência: ${cleanName}
Idioma preferido: ${outLangHint}
Modelo visual alvo: ${resolvedTemplateStyle}

EVIDÊNCIAS REAIS RECOLHIDAS DO PERFIL:
${combinedEvidence || 'Apenas URL pública fornecida sem texto adicional acessível (perfil possivelmente privado).'}

INSTRUÇÕES CRÍTICAS PARA PUXAR TUDO:
1. EXTRAÇÃO EXAUSTIVA: Extraia 100% das informações presentes nas evidências!
   - Extraia TODAS as experiências profissionais encontradas (não pare em 2 — se houver 5, 8 ou 12 cargos, inclua TODOS em ordem cronológica reversa!).
   - Para cada cargo, mantenha empresa, cargo, datas e localização reais e crie de 3 a 6 bullet points ricos baseados nos factos e responsabilidades descritos.
   - Extraia TODAS as competências, tecnologias, stacks e metodologias, agrupando-as em 5 a 8 categorias claras em "competencies".
   - Extraia TODAS as formações académicas em "educations" (inclua grau, instituição, período e gpaOrHonors quando existir).
   - Em "trainings", inclua ABSOLUTAMENTE TODAS as certificações, licenças, cursos relevantes, projetos de destaque, publicações, prémios/honras e trabalho voluntário encontrados no perfil (ex: "Certificação: ...", "Projeto: ...", "Prémio: ...", "Voluntariado: ...").
   - Extraia TODOS os idiomas em "languages" com nível claro.
   - Em "references", inclua recomendações recebidas no LinkedIn caso existam nas evidências; caso contrário retorne lista vazia [].
2. FIDELIDADE ABSOLUTA:
   - Use apenas informações reais das evidências fornecidas. NÃO invente telefones fictícios, emails falsos ou empresas inexistentes. Se faltar email ou telefone, deixe string vazia "" (não coloque dados falsos).
   - Se o perfil tiver poucos dados públicos porque o LinkedIn bloqueou o acesso privado, preencha apenas o que foi verificado e indique em "extractionNotes" o que faltou.
3. ESTÉTICA & TEMPLATE ("Currículo Bonito"):
   - Escolha o melhor "recommendedAccentColor" em hex executivo (ex: "#0f172a", "#1e3a8a", "#0f766e", "#1d4ed8") e "recommendedFontFamily" ("jakarta" | "garamond" | "mono" | "cinzel") conforme a área real do candidato.
   - Mantenha "templateStyle": "${resolvedTemplateStyle}" (ou sugira "tech_modern" se for engenharia/TI e targetStandard não tiver forçado outro).

Retorne ESTRITAMENTE JSON válido com esta estrutura exata:
{
  "personalDetails": {
    "name": "NOME COMPLETO EM MAIÚSCULAS",
    "title": "Headline / Título Profissional Real",
    "location": "Cidade, País",
    "phone": "",
    "email": "",
    "linkedin": "${cleanUrl || 'linkedin.com/in/' + usernameSlug}",
    "website": ""
  },
  "summary": "Resumo executivo completo e persuasivo (4 a 6 linhas) fiel ao perfil.",
  "competencies": [
    { "id": "comp-lk-1", "category": "Categoria Temática", "description": "Lista completa de competências e ferramentas desta categoria" }
  ],
  "experiences": [
    {
      "id": "exp-lk-1",
      "company": "Nome Real da Empresa",
      "role": "Cargo Real",
      "period": "MM/AAAA – MM/AAAA ou Presente",
      "location": "Cidade / Remoto",
      "donor": "Área / Unidade (opcional)",
      "highlights": ["Realização detalhada 1", "Realização detalhada 2", "Realização detalhada 3"]
    }
  ],
  "educations": [
    {
      "id": "edu-lk-1",
      "degree": "Curso / Grau Académico",
      "institution": "Instituição de Ensino",
      "period": "AAAA – AAAA",
      "gpaOrHonors": ""
    }
  ],
  "trainings": ["Certificação / Projeto / Curso / Prémio / Voluntariado"],
  "languages": [
    { "language": "Idioma", "level": "Nível" }
  ],
  "references": [],
  "recommendedAccentColor": "#0f172a",
  "recommendedFontFamily": "jakarta",
  "templateStyle": "${resolvedTemplateStyle}",
  "extractionNotes": "Breve nota factual sobre as secções encontradas."
}
          `.trim();

          const synthesisRes = await generateContentWithRetry(synthesisPrompt, {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          });

          const rawParsed = parseAiJson(synthesisRes.text);
          const experiences = Array.isArray(rawParsed?.experiences) ? rawParsed.experiences : [];
          const competencies = Array.isArray(rawParsed?.competencies) ? rawParsed.competencies : [];
          const educations = Array.isArray(rawParsed?.educations) ? rawParsed.educations : [];
          const trainings = Array.isArray(rawParsed?.trainings) ? rawParsed.trainings : [];
          const languages = Array.isArray(rawParsed?.languages) ? rawParsed.languages : [];
          const references = Array.isArray(rawParsed?.references) ? rawParsed.references : [];

          const extractedCV = {
            personalDetails: {
              name: String(rawParsed?.personalDetails?.name || cleanName).toUpperCase(),
              title: String(rawParsed?.personalDetails?.title || publicData.ogTitle || 'Especialista Profissional'),
              location: String(rawParsed?.personalDetails?.location || ''),
              phone: String(rawParsed?.personalDetails?.phone || ''),
              email: String(rawParsed?.personalDetails?.email || ''),
              linkedin: String(rawParsed?.personalDetails?.linkedin || cleanUrl || `https://www.linkedin.com/in/${usernameSlug}`),
              website: String(rawParsed?.personalDetails?.website || ''),
              ...(publicData.ogImage
                ? {
                    photoUrl: `/api/proxy-image?url=${encodeURIComponent(publicData.ogImage)}`,
                    showPhoto: resolvedTemplateStyle === 'european_europass' || resolvedTemplateStyle === 'creative_split'
                  }
                : {})
            },
            summary: String(rawParsed?.summary || publicData.ogDescription || ''),
            competencies: competencies.map((c: any, idx: number) => ({
              id: c.id || `comp-lk-${idx + 1}`,
              category: String(c.category || 'Competências'),
              description: String(c.description || '')
            })),
            experiences: experiences.map((e: any, idx: number) => ({
              id: e.id || `exp-lk-${idx + 1}`,
              company: String(e.company || ''),
              role: String(e.role || ''),
              period: String(e.period || ''),
              location: e.location ? String(e.location) : undefined,
              donor: e.donor ? String(e.donor) : undefined,
              highlights: Array.isArray(e.highlights) ? e.highlights.map((h: any) => String(h)) : []
            })),
            educations: educations.map((ed: any, idx: number) => ({
              id: ed.id || `edu-lk-${idx + 1}`,
              degree: String(ed.degree || ''),
              institution: String(ed.institution || ''),
              period: String(ed.period || ''),
              gpaOrHonors: ed.gpaOrHonors ? String(ed.gpaOrHonors) : undefined
            })),
            trainings: trainings.map((t: any) => String(t)).filter(Boolean),
            languages: languages.map((lng: any) => ({
              language: String(lng.language || ''),
              level: String(lng.level || '')
            })),
            references: references.map((r: any, idx: number) => ({
              id: r.id || `ref-lk-${idx + 1}`,
              name: String(r.name || ''),
              institutionAndPosition: String(r.institutionAndPosition || ''),
              contact: String(r.contact || '')
            })),
            templateStyle: rawParsed?.templateStyle || resolvedTemplateStyle,
            accentColor: accentColor || rawParsed?.recommendedAccentColor || '#0f172a',
            fontFamily: fontFamily || rawParsed?.recommendedFontFamily || 'jakarta'
          };

          const highlightsTotal = extractedCV.experiences.reduce(
            (sum: number, exp: any) => sum + (exp.highlights?.length || 0),
            0
          );

          const needsSupplementalPdfOrPaste =
            !boundedRawText &&
            publicData.status === 'authwall_blocked' &&
            (extractedCV.experiences.length <= 1 || !hasStrongEvidence);

          const completenessScore = Math.min(
            100,
            Math.round(
              (extractedCV.personalDetails.name ? 15 : 0) +
                (extractedCV.summary.length > 40 ? 15 : 0) +
                Math.min(35, extractedCV.experiences.length * 10) +
                Math.min(15, extractedCV.competencies.length * 3) +
                Math.min(10, extractedCV.educations.length * 5) +
                Math.min(5, extractedCV.trainings.length * 2) +
                Math.min(5, extractedCV.languages.length * 2.5)
            )
          );

          logs.push(
            `Extração estruturada: ${extractedCV.experiences.length} cargo(s), ${highlightsTotal} conquista(s), ${extractedCV.competencies.length} bloco(s) de competências, ${extractedCV.trainings.length} certificação(ões)/projeto(s).`
          );

          return res.json({
            jobId,
            status: 'completed',
            source: boundedRawText ? 'linkedin_pdf_and_ai' : groundingDossier ? 'linkedin_grounding_ai' : 'gemini_extraction',
            url: cleanUrl,
            extractedCV,
            extractionReport: {
              directFetchStatus: publicData.status,
              groundingUsed: groundingDossier.length > 100,
              rawTextUsed: boundedRawText.length > 20,
              profilePhotoFound: Boolean(publicData.ogImage),
              groundingSources,
              completenessScore,
              needsSupplementalPdfOrPaste,
              extractionNotes: String(rawParsed?.extractionNotes || ''),
              counts: {
                experiences: extractedCV.experiences.length,
                competencies: extractedCV.competencies.length,
                educations: extractedCV.educations.length,
                trainings: extractedCV.trainings.length,
                languages: extractedCV.languages.length,
                highlightsTotal
              }
            },
            logs
          });
        } catch (aiErr: any) {
          console.warn('Falha no Gemini para extração LinkedIn, aplicando parser local:', aiErr?.message || aiErr);
        }
      }

      // Fallback when Gemini API key is unavailable or all AI models fail
      const fallbackCV = boundedRawText
        ? parseLinkedInRawTextFallback(boundedRawText, cleanName, cleanUrl, usernameSlug, resolvedTemplateStyle)
        : {
            personalDetails: {
              name: cleanName.toUpperCase(),
              title: publicData.ogTitle || 'Especialista Profissional',
              location: '',
              phone: '',
              email: '',
              linkedin: cleanUrl || `https://www.linkedin.com/in/${usernameSlug}`,
              website: '',
              ...(publicData.ogImage
                ? {
                    photoUrl: `/api/proxy-image?url=${encodeURIComponent(publicData.ogImage)}`,
                    showPhoto: false
                  }
                : {})
            },
            summary:
              publicData.ogDescription ||
              'Perfil conectado via URL do LinkedIn. Para importar todos os cargos, competências, formações e certificações automaticamente, anexe o PDF do seu LinkedIn ("Mais -> Guardar como PDF") ou cole o texto completo do perfil.',
            competencies: [],
            experiences: [],
            educations: [],
            trainings: [],
            languages: [],
            references: [],
            templateStyle: resolvedTemplateStyle,
            accentColor: accentColor || '#0f172a',
            fontFamily: fontFamily || 'jakarta'
          };

      return res.json({
        jobId,
        status: 'completed',
        source: boundedRawText ? 'local_text_parser' : 'public_meta_only',
        url: cleanUrl,
        extractedCV: fallbackCV,
        extractionReport: {
          directFetchStatus: publicData.status,
          groundingUsed: false,
          rawTextUsed: boundedRawText.length > 20,
          profilePhotoFound: Boolean(publicData.ogImage),
          groundingSources,
          completenessScore: boundedRawText ? 55 : 20,
          needsSupplementalPdfOrPaste: !boundedRawText,
          extractionNotes: !boundedRawText
            ? 'LinkedIn restringiu secções privadas sem login. Anexe o PDF do LinkedIn para extração 100% completa.'
            : 'Extraído a partir do texto/PDF fornecido.',
          counts: {
            experiences: fallbackCV.experiences.length,
            competencies: fallbackCV.competencies.length,
            educations: fallbackCV.educations.length,
            trainings: fallbackCV.trainings.length,
            languages: fallbackCV.languages.length,
            highlightsTotal: fallbackCV.experiences.reduce((s: number, e: any) => s + (e.highlights?.length || 0), 0)
          }
        },
        logs: [
          ...logs,
          boundedRawText
            ? 'Dados do perfil extraídos localmente a partir do texto/PDF enviado.'
            : 'Cabeçalho público importado; anexe o PDF do LinkedIn para carregar todas as experiências.'
        ]
      });
    } catch (err: any) {
      console.error('Erro na rota /api/extract-linkedin:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // INTERVIEW SIMULATION API ROUTES
  // -------------------------------------------------------------
  app.post('/api/interview/generate-questions', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { jobDescription, cvData, adminPromptConfig } = req.body;

      const interviewUsage = trackAuthenticatedAiUsage(req, 'interviewSim');
      if (interviewUsage.featureBlocked || interviewUsage.quotaExceeded) {
        return res.status(interviewUsage.featureBlocked ? 403 : 402).json({
          error: interviewUsage.message || 'O Simulador de Entrevista STAR requer um plano habilitado ou créditos disponíveis.',
          quotaExceeded: Boolean(interviewUsage.quotaExceeded),
          featureBlocked: Boolean(interviewUsage.featureBlocked),
          fallback: true
        });
      }

      if (!ai || isAiGloballyPaused()) {
        // High quality fallback questions based on job or executive standards
        return res.json({
          questions: [
            {
              id: 'q-1',
              type: 'behavioral',
              question: 'Descreva uma situação em que liderou uma equipa através de uma crise operacional imprevista ou reestruturação de metas. Como alinhou os stakeholders e qual foi o resultado mensurável?',
              context: 'Avaliadores buscam resiliência, liderança sob pressão e comunicação clara de decisões difíceis.',
              keyCriteria: ['Situação de alta pressão', 'Comunicação proativa', 'Resultado quantificado (tempo, custos ou continuidade)'],
              suggestedStructure: 'Estrutura STAR: Situação, Tarefa, Ação concreta e Resultado final.'
            },
            {
              id: 'q-2',
              type: 'technical',
              question: 'Considerando os requisitos desta vaga, como você estrutura a alocação de recursos e priorização de projetos quando os orçamentos e prazos são severamente restringidos?',
              context: 'Testa competência técnica em governança, gestão de P&L / CAPEX e visão estratégica de trade-offs.',
              keyCriteria: ['Critérios de corte/priorização', 'Uso de dados/KPIs para tomada de decisão', 'Mitigação de riscos'],
              suggestedStructure: 'Apresente sua metodologia analítica e um exemplo real com números de eficiência.'
            },
            {
              id: 'q-3',
              type: 'situational',
              question: 'Imagine que um diretor executivo ou cliente estratégico exige uma mudança substancial no escopo a 2 semanas do lançamento. Como gere essa negociação sem comprometer a qualidade?',
              context: 'Mede capacidade de diplomacia corporativa, gestão de expectativas e firmeza técnica.',
              keyCriteria: ['Escuta ativa', 'Apresentação de dados de impacto', 'Solução de compromisso (compromise solution)'],
              suggestedStructure: 'Foco em como negociou opções alternativas mantendo o relacionamento e a entrega.'
            },
            {
              id: 'q-4',
              type: 'behavioral',
              question: 'Conte sobre um projeto ou iniciativa em que as coisas não correram como o planejado. O que assumiu como sua responsabilidade, o que aprendeu e o que implementou diferente a partir dali?',
              context: 'Identifica maturidade executiva, ausência de vitimismo e cultura de melhoria contínua (blameless post-mortem).',
              keyCriteria: ['Autorresponsabilidade sincera', 'Análise de causa raiz', 'Processo preventivo criado'],
              suggestedStructure: 'Seja direto sobre o erro ou desvio, enfatizando o aprendizado e o novo padrão estabelecido.'
            },
            {
              id: 'q-5',
              type: 'technical',
              question: 'Quais métricas e indicadores-chave (KPIs/OKRs) você monitora diariamente para garantir que as operações e a equipa estejam no caminho do sucesso sustentável?',
              context: 'Verifica domínio analítico da função e capacidade de liderar com base em evidências.',
              keyCriteria: ['Métricas líderes (leading) e de resultado (lagging)', 'Frequência de acompanhamento', 'Ações tomadas com base em desvios'],
              suggestedStructure: 'Destaque 3 a 4 indicadores críticos e a rotina executiva de acompanhamento.'
            }
          ]
        });
      }

      const resolvedInterviewPrompt = resolveServerPromptConfig('interviewSim', adminPromptConfig);
      const prompt = `
Você é um Diretor de RH e Headhunter Executivo especialista em simulação de entrevistas de alta contratação para posições corporativas internacionais, Big Tech e liderança executiva.
${resolvedInterviewPrompt?.systemInstruction ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${resolvedInterviewPrompt.systemInstruction}\n` : ''}
Com base na descrição da vaga e no perfil do candidato abaixo, gere EXATAMENTE 5 perguntas de entrevista personalizadas, combinando perguntas comportamentais (baseadas no método STAR) e técnicas/situacionais desafiadoras.

DESCRIÇÃO DA VAGA:
${jobDescription || 'Liderança Executiva, Direção de Operações, Estratégia ou Tecnologia.'}

PERFIL DO CANDIDATO:
Nome: ${cvData?.personalDetails?.name || 'Candidato'}
Cargo: ${cvData?.personalDetails?.title || 'Profissional Executivo'}
Resumo: ${cvData?.summary || ''}

Gere 5 perguntas com a seguinte estrutura em formato JSON:
{
  "questions": [
    {
      "id": "q-1",
      "type": "behavioral",
      "question": "Texto detalhado e profissional da pergunta 1",
      "context": "Por que o entrevistador faz esta pergunta nesta vaga",
      "keyCriteria": ["Critério 1 que a resposta deve conter", "Critério 2", "Critério 3"],
      "suggestedStructure": "Guia de resposta recomendado (ex: STAR)"
    }
  ]
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedInterviewPrompt?.temperature === 'number'
            ? { temperature: resolvedInterviewPrompt.temperature }
            : {})
        },
        resolvedInterviewPrompt
      );

      const parsed = parseAiJson(response.text);
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'interviewSim',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/interview/generate-questions:', err);
      return res.status(500).json({
        error: sanitizeAiErrorMessage(err, 'Falha ao gerar perguntas de entrevista.')
      });
    }
  });

  app.post('/api/interview/score-answer', aiRateLimitMiddleware, async (req, res) => {
    try {
      const { question, answer, jobDescription, adminPromptConfig } = req.body;

      if (!answer || answer.trim().length < 15) {
        return res.json({
          score: 25,
          verdict: 'Incompleto',
          strengths: ['Iniciou a elaboração da resposta.'],
          improvements: [
            'A resposta foi muito curta para uma entrevista executiva.',
            'Aplique o método STAR: contextualize a Situação, Tarefa, Ação tomada e Resultado com números.'
          ],
          recommendedAnswer: 'Em uma situação similar, atuei diretamente liderando... alcançando uma redução de 28% no tempo de ciclo e gerando valor comprovado para a organização.'
        });
      }

      const scoreUsage = trackAuthenticatedAiUsage(req, 'interviewSim');
      if (scoreUsage.featureBlocked || scoreUsage.quotaExceeded) {
        return res.status(scoreUsage.featureBlocked ? 403 : 402).json({
          error: scoreUsage.message || 'O Simulador de Entrevista STAR requer um plano habilitado ou créditos disponíveis.',
          quotaExceeded: Boolean(scoreUsage.quotaExceeded),
          featureBlocked: Boolean(scoreUsage.featureBlocked),
          fallback: true
        });
      }

      if (!ai || isAiGloballyPaused()) {
        const hasNumbers = /\d+%|\$\d+|\b\d+\b/.test(answer);
        const lengthScore = Math.min(40, Math.floor(answer.length / 10));
        const metricScore = hasNumbers ? 30 : 10;
        const starScore = answer.toLowerCase().includes('resultado') || answer.toLowerCase().includes('concluí') || answer.toLowerCase().includes('consegui') ? 25 : 15;
        const total = Math.min(95, Math.max(45, lengthScore + metricScore + starScore));

        return res.json({
          score: total,
          verdict: total >= 85 ? 'Excelente' : total >= 70 ? 'Bom' : 'Precisa Melhorar',
          strengths: [
            'Comunicação articulada e postura profissional.',
            hasNumbers ? 'Inclusão positiva de dados e métricas concretas.' : 'Clareza na descrição das responsabilidades assumidas.'
          ],
          improvements: [
            !hasNumbers ? 'Adicione percentuais (%) ou volume financeiro ($) para comprovar o impacto da sua ação.' : 'Torne o resultado final ainda mais conectado aos objetivos estratégicos da vaga.',
            'Enfatize como a sua liderança influenciou positivamente o restante da equipa.'
          ],
          recommendedAnswer: `No meu cargo anterior, enfrentei um desafio similar ao lidar com essa exigência. Defini uma estratégia em 3 etapas com foco em governança e entrega ágil, resultando em 98% de conformidade com os SLAs contratuais e redução de 25% no tempo de resposta.`
        });
      }

      const resolvedInterviewPrompt = resolveServerPromptConfig('interviewSim', adminPromptConfig);
      const customInstructionBlock = resolvedInterviewPrompt?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${resolvedInterviewPrompt.systemInstruction}\n`
        : '';

      const prompt = `
Você é um Avaliador de Entrevistas Executivas de topo (Top Executive Interview Coach).
${customInstructionBlock}
Analise a resposta do candidato para a pergunta formulada, considerando a descrição da vaga e as melhores práticas do método STAR (Situação, Tarefa, Ação, Resultado) e Google XYZ (Realizou X, medido por Y, fazendo Z).

PERGUNTA:
${question?.question || 'Pergunta da entrevista'}
CRITÉRIOS ESPERADOS:
${JSON.stringify(question?.keyCriteria || [])}

RESPOSTA DO CANDIDATO:
${answer}

DESCRIÇÃO DA VAGA:
${jobDescription || 'Posição de Liderança Executiva'}

Forneça uma avaliação rigorosa, construtiva e realista em formato JSON:
{
  "score": 88,
  "verdict": "Excelente",
  "strengths": [
    "Ponto forte 1 observado na fala",
    "Ponto forte 2"
  ],
  "improvements": [
    "Ponto de melhoria 1 específico",
    "Ponto de melhoria 2"
  ],
  "recommendedAnswer": "Exemplo de resposta modelo de alto nível para esta pergunta, usando dados concretos e padrão executivo."
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof resolvedInterviewPrompt?.temperature === 'number'
            ? { temperature: resolvedInterviewPrompt.temperature }
            : {})
        },
        resolvedInterviewPrompt
      );

      const parsed = parseAiJson(response.text);
      recordServerTelemetry({
        type: 'ai_called',
        feature: 'interviewSim',
        tokens: Math.ceil((prompt.length + (response.text?.length || 0)) / 4)
      });
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/interview/score-answer:', err);
      return res.status(500).json({
        error: sanitizeAiErrorMessage(err, 'Falha ao avaliar resposta da entrevista.')
      });
    }
  });

  // -------------------------------------------------------------
  // PAYMENT & RECURRING SUBSCRIPTION API ROUTES (ALL 4 CYCLES)
  // -------------------------------------------------------------

  type ServerBillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

  function normalizeServerCycle(raw?: string | null): ServerBillingCycle {
    if (raw === 'quarterly' || raw === 'semiannual' || raw === 'yearly' || raw === 'monthly') {
      return raw;
    }
    return 'monthly';
  }

  function getServerCycleSpec(cycle: ServerBillingCycle) {
    switch (cycle) {
      case 'quarterly':
        return {
          months: 3,
          days: 90,
          defaultDiscountPct: 10,
          label: 'Trimestral',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 3
        };
      case 'semiannual':
        return {
          months: 6,
          days: 180,
          defaultDiscountPct: 18,
          label: 'Semestral',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 6
        };
      case 'yearly':
        return {
          months: 12,
          days: 365,
          defaultDiscountPct: 25,
          label: 'Anual',
          recurringInterval: 'year' as const,
          recurringIntervalCount: 1
        };
      default:
        return {
          months: 1,
          days: 30,
          defaultDiscountPct: 0,
          label: 'Mensal',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 1
        };
    }
  }

  const cachedGatewayProductIds: Record<'pro' | 'executive', string | null> = {
    pro: null,
    executive: null
  };

  async function ensureGatewayProductId(plan: 'pro' | 'executive'): Promise<string> {
    if (!stripeClient) throw new Error('Processador de cartão indisponível.');
    const existingCached = cachedGatewayProductIds[plan];
    if (existingCached) return existingCached;

    const targetName =
      plan === 'executive'
        ? 'Currículo Estratégico - Plano Executivo VIP'
        : 'Currículo Estratégico - Plano Profissional Pro';

    const list = await stripeClient.products.list({ active: true, limit: 25 });
    const found = list.data.find((p) => p.metadata?.saasPlanId === plan || p.name === targetName);
    if (found) {
      cachedGatewayProductIds[plan] = found.id;
      return found.id;
    }

    const created = await stripeClient.products.create({
      name: targetName,
      description:
        plan === 'executive'
          ? 'Acesso Executivo VIP com Simulador de Entrevistas STAR, Radar ATS e Exportações Ilimitadas.'
          : 'Acesso Profissional Pro com Radar ATS, Otimizador IA e Exportações Word/PDF Ilimitadas.',
      metadata: { saasPlanId: plan }
    });
    cachedGatewayProductIds[plan] = created.id;
    return created.id;
  }

  function resolveServerPlanPricing(
    rawPlan?: string,
    rawCycle?: string,
    couponCode?: string
  ) {
    const plan: 'pro' | 'executive' = rawPlan === 'executive' ? 'executive' : 'pro';
    const billingCycle = normalizeServerCycle(rawCycle);
    const spec = getServerCycleSpec(billingCycle);

    const editablePlans: any[] = Array.isArray(authStore.adminConfig?.editablePlans)
      ? authStore.adminConfig.editablePlans
      : [];
    const matchedPlan = editablePlans.find((p) => p?.id === plan);

    const monthlyUSD = Number(matchedPlan?.priceMonthlyValue) > 0
      ? Number(matchedPlan.priceMonthlyValue)
      : plan === 'executive'
      ? 12
      : 8;

    let baseUSD = monthlyUSD;
    if (billingCycle === 'quarterly') {
      baseUSD =
        Number(matchedPlan?.priceQuarterlyValue) > 0
          ? Number(matchedPlan.priceQuarterlyValue)
          : Math.round(monthlyUSD * 3 * 0.9 * 100) / 100;
    } else if (billingCycle === 'semiannual') {
      baseUSD =
        Number(matchedPlan?.priceSemiannualValue) > 0
          ? Number(matchedPlan.priceSemiannualValue)
          : Math.round(monthlyUSD * 6 * 0.82 * 100) / 100;
    } else if (billingCycle === 'yearly') {
      baseUSD =
        Number(matchedPlan?.priceYearlyValue) > 0
          ? Number(matchedPlan.priceYearlyValue)
          : Math.round(monthlyUSD * 12 * 0.75 * 100) / 100;
    }

    let validDiscountPct = 0;
    let appliedCoupon: any = null;
    if (couponCode && String(couponCode).trim()) {
      const codeClean = String(couponCode).trim().toUpperCase();
      const foundCoupon = (authStore.coupons || []).find(
        (c) => String(c?.code || '').trim().toUpperCase() === codeClean && c?.active
      );
      if (foundCoupon) {
        const notExpired = !foundCoupon.expiresAt || new Date(foundCoupon.expiresAt).getTime() >= Date.now();
        const withinLimit = !(Number(foundCoupon.maxUses) > 0 && Number(foundCoupon.usedCount) >= Number(foundCoupon.maxUses));
        if (notExpired && withinLimit) {
          validDiscountPct = Math.min(100, Math.max(0, Number(foundCoupon.discountPercent) || 0));
          appliedCoupon = foundCoupon;
        }
      }
    }

    const finalPriceUSD = Math.max(0, Math.round(baseUSD * (1 - validDiscountPct / 100) * 100) / 100);
    return {
      plan,
      billingCycle,
      spec,
      monthlyUSD,
      baseUSD,
      discountRate: validDiscountPct,
      appliedCoupon,
      finalPriceUSD,
      planLabel: plan === 'executive' ? 'Executivo VIP' : 'Profissional Pro'
    };
  }

  function buildPaymentConfigPayload() {
    const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
    const proMonthly = resolveServerPlanPricing('pro', 'monthly').baseUSD;
    const execMonthly = resolveServerPlanPricing('executive', 'monthly').baseUSD;

    return {
      cardEnabled: Boolean(stripeClient && stripePublishableKey),
      configured: Boolean(stripeClient),
      publishableKey: stripePublishableKey,
      isTestMode: Boolean(stripeSecretKey && !stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('rk_live_')),
      supportedCurrencies: ['usd', 'brl'],
      pixConfig: {
        pixKey: gov.pixKey || 'f4693532-31da-4e95-a589-19bccab0d915',
        pixKeyType: gov.pixKeyType || 'evp',
        pixBeneficiaryName: gov.pixBeneficiaryName || 'CURRICULO ESTRATEGICO',
        pixCity: gov.pixCity || 'SAO PAULO'
      },
      plans: {
        pro: {
          name: 'Plano Profissional Pro',
          monthlyUSD: proMonthly,
          quarterlyUSD: resolveServerPlanPricing('pro', 'quarterly').baseUSD,
          semiannualUSD: resolveServerPlanPricing('pro', 'semiannual').baseUSD,
          yearlyUSD: resolveServerPlanPricing('pro', 'yearly').baseUSD,
          savingsYearlyPercent: 25
        },
        executive: {
          name: 'Plano Executivo VIP',
          monthlyUSD: execMonthly,
          quarterlyUSD: resolveServerPlanPricing('executive', 'quarterly').baseUSD,
          semiannualUSD: resolveServerPlanPricing('executive', 'semiannual').baseUSD,
          yearlyUSD: resolveServerPlanPricing('executive', 'yearly').baseUSD,
          savingsYearlyPercent: 25
        }
      }
    };
  }

  // 1. Public Payment Configuration (vendor-agnostic alias + backwards-compatible route)
  app.get('/api/payments/config', (_req, res) => {
    res.json(buildPaymentConfigPayload());
  });

  app.get('/api/stripe/config', (_req, res) => {
    res.json(buildPaymentConfigPayload());
  });

  app.get('/api/payments/card-health', async (_req, res) => {
    const secretMode = !stripeSecretKey
      ? 'missing'
      : stripeSecretKey.startsWith('sk_live_') || stripeSecretKey.startsWith('rk_live_')
      ? 'live'
      : 'test';
    const publishableMode = !stripePublishableKey
      ? 'missing'
      : stripePublishableKey.startsWith('pk_live_')
      ? 'live'
      : 'test';
    const keysMatchMode = secretMode !== 'missing' && publishableMode !== 'missing' && secretMode === publishableMode;

    if (!stripeClient) {
      return res.json({
        ready: false,
        secretMode,
        publishableMode,
        keysMatchMode,
        apiReachable: false,
        error: 'Chave secreta Stripe não configurada.'
      });
    }

    try {
      await stripeClient.products.list({ limit: 1 });
      return res.json({
        ready: Boolean(stripeClient && stripePublishableKey && keysMatchMode),
        secretMode,
        publishableMode,
        keysMatchMode,
        apiReachable: true
      });
    } catch (err: any) {
      return res.json({
        ready: false,
        secretMode,
        publishableMode,
        keysMatchMode,
        apiReachable: false,
        error: err?.message || 'Falha ao validar conexão com o processador de cartão.'
      });
    }
  });

  function activateOrderAndUserPlan(order: any) {
    if (!order) return null;
    order.status = 'paid';
    order.updatedAt = new Date().toISOString();
    const targetUser =
      (order.userId && authStore.users[order.userId]) ||
      (order.userEmail ? findBackendUserByEmail(order.userEmail) : undefined);
    if (targetUser && ['pro', 'executive'].includes(order.plan)) {
      const normalizedCycle = normalizeServerCycle(order.billingCycle);
      const days = getServerCycleSpec(normalizedCycle).days;
      targetUser.plan = order.plan;
      targetUser.creditsRemaining = 9999;
      targetUser.billingCycle = normalizedCycle;
      targetUser.subscriptionExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
      targetUser.stripeStatus = 'active';
      targetUser.status = 'active';
      targetUser.updatedAt = new Date().toISOString();
    }
    persistAuthStore();
    return targetUser || null;
  }

  // 1B. Check Personal Pix Payment Status (polls backend approval from Admin Panel)
  app.get('/api/payments/pix/status/:orderId', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const orderId = String(req.params.orderId || '').trim();
      const sessionUser = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      const cleanEmail = String(sessionUser?.email || payload.email || '').trim().toLowerCase();
      const directOrders = authStore.ordersByUser?.[payload.uid] || [];
      let order = directOrders.find((o) => o?.id === orderId || o?.orderNumber === orderId);
      if (!order && cleanEmail) {
        for (const list of Object.values(authStore.ordersByUser || {})) {
          const found = (list || []).find(
            (o) =>
              (o?.id === orderId || o?.orderNumber === orderId) &&
              String(o?.userEmail || '').trim().toLowerCase() === cleanEmail
          );
          if (found) {
            order = found;
            break;
          }
        }
      }
      if (!order) {
        return res.status(404).json({ error: 'Pedido Pix não encontrado.' });
      }

      if (order.status === 'paid') {
        const syncedUser = activateOrderAndUserPlan(order) || sessionUser;
        return res.json({
          status: 'paid',
          order,
          user: syncedUser ? sanitizeUser(syncedUser) : null
        });
      }

      return res.json({
        status: order.status,
        order,
        user: sessionUser ? sanitizeUser(sessionUser) : null
      });
    } catch (err: any) {
      console.error('Erro em GET /api/payments/pix/status:', err);
      return res.status(500).json({ error: 'Erro ao verificar estado do pagamento Pix.' });
    }
  });

  // 2. Create Tokenized Card Recurring Subscription Intent (In-Modal PCI-DSS Flow)
  app.post('/api/payments/create-subscription-intent', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas tentativas de pagamento. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Inicie sessão na sua conta antes de concluir a subscrição.' });
      }
      const sessionUser = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (sessionUser?.status === 'suspended') {
        return res.status(403).json({ error: 'Esta conta encontra-se suspensa.' });
      }

      const {
        plan: rawPlan = 'pro',
        billingCycle: rawCycle = 'monthly',
        userName,
        couponCode,
        currency: rawCurrency = 'USD'
      } = req.body || {};

      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode);
      const cleanEmail = String(sessionUser?.email || payload.email || '').trim().toLowerCase();
      const verifiedUserId = sessionUser?.id || payload.uid;
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Inicie sessão com um e-mail válido antes de concluir a subscrição.' });
      }

      const targetCurrency = String(rawCurrency || 'USD').toUpperCase() === 'BRL' ? 'brl' : 'usd';
      const chargeAmount =
        targetCurrency === 'brl'
          ? Math.round(pricing.finalPriceUSD * 5.4 * 100) / 100
          : pricing.finalPriceUSD;
      const unitAmountCents = Math.round(chargeAmount * 100);
      const nextBillingDate = new Date(Date.now() + pricing.spec.days * 86400000).toISOString();

      // Valid 100% Promo Coupon activation (server-validated)
      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const now = new Date();
        const orderNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;

        const promoOrder = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId: verifiedUserId,
          userName: String(userName || sessionUser?.name || cleanEmail).slice(0, 120),
          userEmail: cleanEmail,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: targetCurrency.toUpperCase(),
          paymentMethod: 'card',
          status: 'paid',
          stripeSubscriptionId: promoSubId,
          createdAt: now.toISOString(),
          notes: `Assinatura ${pricing.spec.label.toLowerCase()} ativada com cupom 100% (${pricing.appliedCoupon.code}).`
        };

        if (sessionUser) {
          sessionUser.plan = pricing.plan;
          sessionUser.billingCycle = pricing.billingCycle;
          sessionUser.creditsRemaining = 9999;
          sessionUser.subscriptionExpiresAt = nextBillingDate;
          sessionUser.stripeSubscriptionId = promoSubId;
          sessionUser.stripeStatus = 'active';
          sessionUser.status = 'active';
          sessionUser.updatedAt = now.toISOString();
        }
        if (!authStore.ordersByUser) authStore.ordersByUser = {};
        authStore.ordersByUser[verifiedUserId] = [promoOrder, ...(authStore.ordersByUser[verifiedUserId] || [])].slice(0, 50);
        persistAuthStore();

        return res.json({
          success: true,
          mode: 'coupon_100',
          verified: true,
          subscriptionId: promoSubId,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: targetCurrency.toUpperCase(),
          nextBillingDate,
          order: promoOrder
        });
      }

      if (!stripeClient) {
        return res.status(503).json({
          error: 'O pagamento por cartão não está disponível neste momento. Utilize o Pix ou tente mais tarde.'
        });
      }

      if (unitAmountCents > 0 && unitAmountCents < 50) {
        return res.status(400).json({
          error:
            targetCurrency === 'brl'
              ? 'O valor mínimo para pagamento por cartão é R$ 0,50 BRL. Para este valor, utilize o Pix.'
              : 'O valor mínimo para cobrança em cartão USD é $0.50. Altere a moeda para BRL ou utilize o Pix.'
        });
      }

      let customerId = sessionUser?.stripeCustomerId;
      if (customerId) {
        const existingCus = await stripeClient.customers.retrieve(customerId).catch(() => null);
        if (!existingCus || (existingCus as any).deleted) {
          customerId = undefined;
        }
      }
      if (!customerId) {
        const existingCustomers = await stripeClient.customers.list({ email: cleanEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const createdCustomer = await stripeClient.customers.create({
            email: cleanEmail,
            name: String(userName || sessionUser?.name || cleanEmail).slice(0, 120),
            metadata: { userId: verifiedUserId }
          });
          customerId = createdCustomer.id;
        }
      }

      const productId = await ensureGatewayProductId(pricing.plan);
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: targetCurrency,
              product: productId,
              unit_amount: unitAmountCents,
              recurring: {
                interval: pricing.spec.recurringInterval,
                interval_count: pricing.spec.recurringIntervalCount
              }
            }
          }
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: {
          userId: verifiedUserId,
          userEmail: cleanEmail,
          userName: String(userName || sessionUser?.name || cleanEmail).slice(0, 120),
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon?.code || ''
        },
        expand: ['latest_invoice.confirmation_secret']
      });

      const latestInvoice = subscription.latest_invoice as any;
      let clientSecret: string | undefined =
        latestInvoice?.confirmation_secret?.client_secret ||
        latestInvoice?.payment_intent?.client_secret;

      if (!clientSecret && latestInvoice?.id) {
        const retrievedInv = await stripeClient.invoices.retrieve(latestInvoice.id, {
          expand: ['confirmation_secret']
        });
        clientSecret = (retrievedInv as any)?.confirmation_secret?.client_secret;
      }

      if (!clientSecret) {
        await stripeClient.subscriptions.cancel(subscription.id).catch(() => {});
        return res.status(502).json({
          error: 'Não foi possível iniciar a cobrança segura com cartão. Tente novamente ou utilize o Pix.'
        });
      }

      return res.json({
        success: true,
        mode: 'intent',
        clientSecret,
        subscriptionId: subscription.id,
        customerId,
        plan: pricing.plan,
        billingCycle: pricing.billingCycle,
        amount: chargeAmount,
        currency: targetCurrency.toUpperCase(),
        durationDays: pricing.spec.days
      });
    } catch (err: any) {
      console.error('Erro ao iniciar assinatura por cartão:', err);
      return res.status(500).json({
        error: err?.message || 'Não foi possível iniciar o pagamento por cartão. Tente novamente.'
      });
    }
  });

  // 3. Verify & Finalize Tokenized Card Subscription After 3DS/Card Confirmation
  app.post('/api/payments/confirm-subscription', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ verified: false, error: 'Demasiadas tentativas. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ verified: false, error: 'Sessão inválida ou expirada.' });
      }
      const callerUser = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);

      const { subscriptionId, paymentIntentId, plan: rawPlan, billingCycle: rawCycle, cardLast4, cardBrand } =
        req.body || {};

      if (!stripeClient) {
        return res.status(503).json({
          verified: false,
          error: 'Serviço de validação de cartão temporariamente indisponível.'
        });
      }
      if (!subscriptionId || typeof subscriptionId !== 'string' || !subscriptionId.startsWith('sub_')) {
        return res.status(400).json({ verified: false, error: 'Identificador da assinatura inválido.' });
      }

      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice']
      });

      const subCustomerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : (subscription.customer as any)?.id;
      const metaUserId = subscription.metadata?.userId;
      const metaUserEmail = String(subscription.metadata?.userEmail || '').trim().toLowerCase();
      const ownsSubscription =
        metaUserId === payload.uid ||
        (metaUserEmail && metaUserEmail === String(payload.email || '').toLowerCase()) ||
        (callerUser?.stripeCustomerId && callerUser.stripeCustomerId === subCustomerId);
      if (!ownsSubscription && !ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase())) {
        return res.status(403).json({ verified: false, error: 'Assinatura não pertence à conta autenticada.' });
      }

      let paymentSucceeded = false;
      let verifiedIntentId = typeof paymentIntentId === 'string' ? paymentIntentId : '';
      if (verifiedIntentId) {
        const pi = await stripeClient.paymentIntents.retrieve(verifiedIntentId);
        if (pi.status === 'succeeded' && (!pi.customer || pi.customer === subCustomerId)) {
          paymentSucceeded = true;
        }
      }

      const latestInv = subscription.latest_invoice as any;
      if (
        subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        latestInv?.status === 'paid'
      ) {
        paymentSucceeded = true;
      }

      if (!paymentSucceeded) {
        return res.status(402).json({
          verified: false,
          status: subscription.status,
          error: 'O pagamento ainda não foi confirmado pelo banco emissor do cartão.'
        });
      }

      const plan: 'pro' | 'executive' =
        subscription.metadata?.plan === 'executive' || rawPlan === 'executive' ? 'executive' : 'pro';
      const billingCycle = normalizeServerCycle(subscription.metadata?.billingCycle || rawCycle);
      const spec = getServerCycleSpec(billingCycle);
      const customerId = subCustomerId;

      const targetUser =
        callerUser ||
        (metaUserId && authStore.users[metaUserId]) ||
        (metaUserEmail ? findBackendUserByEmail(metaUserEmail) : undefined);

      const nextBillingDate = new Date(Date.now() + spec.days * 86400000).toISOString();
      const amountPaid = latestInv?.amount_paid
        ? Math.round((Number(latestInv.amount_paid) / 100) * 100) / 100
        : resolveServerPlanPricing(plan, billingCycle).baseUSD;
      const currencyPaid = String(latestInv?.currency || 'usd').toUpperCase();
      const receiptUrl = latestInv?.hosted_invoice_url || latestInv?.invoice_pdf || undefined;

      if (targetUser) {
        targetUser.plan = plan;
        targetUser.billingCycle = billingCycle;
        targetUser.creditsRemaining = 9999;
        targetUser.subscriptionExpiresAt = nextBillingDate;
        if (customerId) targetUser.stripeCustomerId = customerId;
        targetUser.stripeSubscriptionId = subscription.id;
        targetUser.stripeStatus = 'active';
        targetUser.status = 'active';
        targetUser.updatedAt = new Date().toISOString();
      }

      const now = new Date();
      const uidKey = targetUser?.id || metaUserId || metaUserEmail || 'client';
      if (!authStore.ordersByUser) authStore.ordersByUser = {};
      const existingOrders = authStore.ordersByUser[uidKey] || [];
      let order = existingOrders.find(
        (o) => o?.stripeSubscriptionId === subscription.id || (verifiedIntentId && o?.stripePaymentIntentId === verifiedIntentId)
      );

      if (!order) {
        const orderNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;
        order = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId: uidKey,
          userName: subscription.metadata?.userName || targetUser?.name || metaUserEmail || 'Assinante',
          userEmail: metaUserEmail || targetUser?.email || '',
          plan,
          billingCycle,
          amount: amountPaid,
          currency: currencyPaid,
          paymentMethod: 'card',
          status: 'paid',
          stripeSubscriptionId: subscription.id,
          stripePaymentIntentId: verifiedIntentId || undefined,
          receiptUrl,
          createdAt: now.toISOString(),
          notes: `Assinatura ${spec.label.toLowerCase()} confirmada via Cartão${
            cardBrand || cardLast4 ? ` (${cardBrand || 'Cartão'} ${cardLast4 ? 'final ' + cardLast4 : ''})` : ''
          }. Renovação: ${nextBillingDate.slice(0, 10)}.`
        };
        authStore.ordersByUser[uidKey] = [order, ...existingOrders].slice(0, 50);
      }

      persistAuthStore();

      return res.json({
        verified: true,
        subscriptionId: subscription.id,
        customerId,
        paymentIntentId: verifiedIntentId || undefined,
        plan,
        billingCycle,
        amount: amountPaid,
        currency: currencyPaid,
        nextBillingDate,
        receiptUrl,
        order
      });
    } catch (err: any) {
      console.error('Erro ao confirmar assinatura por cartão:', err);
      return res.status(500).json({
        verified: false,
        error: err?.message || 'Não foi possível validar o pagamento com cartão.'
      });
    }
  });

  // 4. Hosted Checkout Session (Backwards-compatible for top-level redirects & 4 cycles)
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas tentativas de pagamento. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Inicie sessão antes de prosseguir com o pagamento.' });
      }
      const sessionUser = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (sessionUser?.status === 'suspended') {
        return res.status(403).json({ error: 'Esta conta encontra-se suspensa.' });
      }

      const {
        plan: rawPlan = 'pro',
        billingCycle: rawCycle = 'monthly',
        userName,
        couponCode,
        originUrl,
        currency: rawCurrency = 'USD'
      } = req.body || {};

      const verifiedUserId = sessionUser?.id || payload.uid;
      const verifiedUserEmail = String(sessionUser?.email || payload.email || '').trim().toLowerCase();
      const verifiedUserName = String(userName || sessionUser?.name || 'Cliente').slice(0, 120);

      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode);
      const targetCurrency = String(rawCurrency || 'USD').toUpperCase() === 'BRL' ? 'brl' : 'usd';
      const chargeAmount =
        targetCurrency === 'brl'
          ? Math.round(pricing.finalPriceUSD * 5.4 * 100) / 100
          : pricing.finalPriceUSD;
      const unitAmountCents = Math.round(chargeAmount * 100);

      const appBaseUrl = resolveSafeAppRedirectUrl(req, originUrl);

      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSessionId = `cs_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        if (!authStore.promoSessions) authStore.promoSessions = {};
        authStore.promoSessions[promoSessionId] = {
          sessionId: promoSessionId,
          subscriptionId: promoSubId,
          userId: verifiedUserId,
          userEmail: verifiedUserEmail,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon.code,
          createdAt: new Date().toISOString()
        };
        persistAuthStore();

        return res.json({
          success: true,
          mode: 'coupon_100',
          sessionId: promoSessionId,
          subscriptionId: promoSubId,
          url: `${appBaseUrl}?stripe_status=success&session_id=${promoSessionId}&plan=${pricing.plan}&cycle=${pricing.billingCycle}`,
          message: 'Subscrição ativada com cupom promocional 100%.'
        });
      }

      if (!stripeClient) {
        return res.status(503).json({
          error: 'O pagamento por cartão não está disponível neste momento. Utilize o pagamento via Pix.'
        });
      }

      if (unitAmountCents > 0 && unitAmountCents < 50) {
        return res.status(400).json({
          error:
            targetCurrency === 'brl'
              ? 'O valor mínimo para pagamento por cartão é R$ 0,50 BRL. Para este valor, utilize o Pix.'
              : 'O valor mínimo para cobrança em cartão USD é $0.50. Altere a moeda para BRL ou utilize o Pix.'
        });
      }

      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        customer_email: verifiedUserEmail || undefined,
        client_reference_id: verifiedUserId,
        metadata: {
          userId: verifiedUserId,
          userName: verifiedUserName,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon?.code || ''
        },
        subscription_data: {
          metadata: {
            userId: verifiedUserId,
            userEmail: verifiedUserEmail,
            plan: pricing.plan,
            billingCycle: pricing.billingCycle,
            couponCode: pricing.appliedCoupon?.code || ''
          }
        },
        line_items: [
          {
            price_data: {
              currency: targetCurrency,
              product_data: {
                name: `Currículo Estratégico - Plano ${pricing.planLabel} (${pricing.spec.label})`,
                description: `Assinatura recorrente ${pricing.spec.label.toLowerCase()} (a cada ${pricing.spec.months} ${
                  pricing.spec.months === 1 ? 'mês' : 'meses'
                }). Exportações Word (.docx) e PDF ilimitadas, IA completa e análise ATS.`
              },
              unit_amount: unitAmountCents,
              recurring: {
                interval: pricing.spec.recurringInterval,
                interval_count: pricing.spec.recurringIntervalCount
              }
            },
            quantity: 1
          }
        ],
        success_url: `${appBaseUrl}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${pricing.plan}&cycle=${pricing.billingCycle}`,
        cancel_url: `${appBaseUrl}?stripe_status=canceled&plan=${pricing.plan}`
      });

      return res.json({
        success: true,
        mode: 'live',
        sessionId: session.id,
        url: session.url
      });
    } catch (err: any) {
      console.error('Erro ao gerar sessão de checkout:', err);
      return res.status(500).json({
        error: 'Não foi possível iniciar a página de pagamento. Tente novamente ou pague via Pix.'
      });
    }
  });

  // 5. Legacy Direct Process Subscription (Disabled for unconfirmed non-zero card charges)
  app.post('/api/stripe/process-subscription', async (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão inválida.' });
      }
      const { plan: rawPlan = 'pro', billingCycle: rawCycle = 'monthly', couponCode } = req.body || {};
      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode);

      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const nextBillingDate = new Date(Date.now() + pricing.spec.days * 86400000).toISOString();
        return res.json({
          success: true,
          mode: 'coupon_100',
          subscriptionId: promoSubId,
          status: 'active',
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: 'USD',
          nextBillingDate,
          cardBrand: 'Cupom 100%',
          last4: '0000',
          invoiceNumber: `PROMO-INV-${Date.now().toString().slice(-6)}`,
          message: `Assinatura ${pricing.spec.label} ativada com cupom 100%!`
        });
      }

      return res.status(400).json({
        error: 'Para sua segurança, finalize o pagamento diretamente no formulário seguro de cartão.'
      });
    } catch {
      return res.status(500).json({
        error: 'Falha ao processar solicitação de subscrição.'
      });
    }
  });

  // 6. Strict Checkout Session Verification
  app.post('/api/stripe/verify-session', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ verified: false, error: 'Demasiadas tentativas. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ verified: false, error: 'Sessão não autenticada.' });
      }

      const { sessionId } = req.body || {};
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ verified: false, error: 'Identificador da sessão obrigatório.' });
      }

      if (sessionId.startsWith('cs_promo_')) {
        const promo = authStore.promoSessions?.[sessionId];
        if (!promo) {
          return res.status(404).json({ verified: false, error: 'Sessão promocional não encontrada.' });
        }
        if (
          promo.userId !== payload.uid &&
          String(promo.userEmail || '').toLowerCase() !== String(payload.email || '').toLowerCase()
        ) {
          return res.status(403).json({ verified: false, error: 'Sessão promocional não pertence à conta autenticada.' });
        }
        return res.json({
          verified: true,
          mode: 'coupon_100',
          status: 'complete',
          paymentStatus: 'paid',
          subscriptionId: promo.subscriptionId,
          customerId: undefined,
          plan: promo.plan,
          billingCycle: normalizeServerCycle(promo.billingCycle),
          amount: 0,
          currency: 'USD'
        });
      }

      if (!stripeClient) {
        return res.status(503).json({ verified: false, error: 'Serviço de validação de pagamento indisponível.' });
      }

      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      const sessionOwnerMatch =
        session.client_reference_id === payload.uid ||
        session.metadata?.userId === payload.uid ||
        String(session.customer_email || session.customer_details?.email || '').toLowerCase() ===
          String(payload.email || '').toLowerCase();
      if (!sessionOwnerMatch && !ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase())) {
        return res.status(403).json({ verified: false, error: 'Sessão de pagamento não pertence à conta autenticada.' });
      }

      const isPaid =
        session.status === 'complete' &&
        (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

      if (!isPaid) {
        return res.status(402).json({
          verified: false,
          status: session.status,
          paymentStatus: session.payment_status,
          error: 'O pagamento ainda não foi confirmado.'
        });
      }

      const sub = session.subscription as Stripe.Subscription | null;
      const plan: 'pro' | 'executive' = session.metadata?.plan === 'executive' ? 'executive' : 'pro';
      const billingCycle = normalizeServerCycle(session.metadata?.billingCycle);
      const customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : sub?.id;
      const amount = session.amount_total ? Math.round((session.amount_total / 100) * 100) / 100 : resolveServerPlanPricing(plan, billingCycle).baseUSD;
      const currency = String(session.currency || 'usd').toUpperCase();

      return res.json({
        verified: true,
        mode: 'live',
        status: session.status,
        paymentStatus: session.payment_status,
        subscriptionId,
        customerId,
        customerEmail: session.customer_details?.email || session.customer_email || undefined,
        plan,
        billingCycle,
        amount,
        currency
      });
    } catch (err: any) {
      console.error('Erro ao verificar sessão de pagamento:', err);
      return res.status(500).json({ verified: false, error: 'Não foi possível validar o pagamento.' });
    }
  });

  // 7. Customer Billing Portal (Authenticated + ownership verified)
  app.post('/api/stripe/customer-portal', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas tentativas. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/stripe/customer-portal',
          details: 'Tentativa não autenticada de acesso ao portal de faturação.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Autenticação necessária para aceder ao portal de faturação.' });
      }

      const userRec = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      const { customerId, returnUrl } = req.body || {};
      const resolvedCustomerId = typeof customerId === 'string' ? customerId.trim() : userRec?.stripeCustomerId || '';
      const isAdmin =
        userRec?.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());

      if (!resolvedCustomerId || !resolvedCustomerId.startsWith('cus_')) {
        return res.status(400).json({
          error: 'Nenhuma conta de pagamento recorrente encontrada para este perfil.'
        });
      }
      if (!isAdmin && userRec?.stripeCustomerId !== resolvedCustomerId) {
        appendServerAuditLog(req, {
          actorUserId: payload.uid,
          actorEmail: payload.email,
          actorRole: 'user',
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: `/api/stripe/customer-portal/${resolvedCustomerId}`,
          details: 'Tentativa IDOR bloqueada: utilizador tentou abrir portal de faturação de outro cliente.',
          metadata: { httpStatus: 403 }
        });
        return res.status(403).json({
          error: 'Acesso negado ao portal de faturação de outro utilizador.'
        });
      }

      const appBaseUrl = resolveSafeAppRedirectUrl(req, returnUrl);

      if (!stripeClient) {
        return res.status(503).json({
          error: 'Portal de gestão de faturação indisponível neste momento.'
        });
      }

      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: resolvedCustomerId,
        return_url: appBaseUrl
      });
      return res.json({ url: portalSession.url, active: true });
    } catch {
      return res.status(500).json({ error: 'Não foi possível abrir o portal de faturação neste momento.' });
    }
  });

  // 8. Cancel Subscription Endpoint (Authenticated + ownership verified)
  app.post('/api/stripe/cancel-subscription', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas tentativas. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/stripe/cancel-subscription',
          details: 'Tentativa não autenticada de cancelar subscrição.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Autenticação necessária para cancelar subscrição.' });
      }

      const { subscriptionId } = req.body || {};
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        return res.status(400).json({ error: 'Identificador de assinatura obrigatório.' });
      }

      const userRec = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      const isAdmin =
        userRec?.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());
      const userOrders = authStore.ordersByUser?.[payload.uid] || [];
      const ownsSub =
        userRec?.stripeSubscriptionId === subscriptionId ||
        userOrders.some((o) => o?.stripeSubscriptionId === subscriptionId);

      if (!isAdmin && !ownsSub) {
        appendServerAuditLog(req, {
          actorUserId: payload.uid,
          actorEmail: payload.email,
          actorRole: 'user',
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: `/api/stripe/cancel-subscription/${subscriptionId.slice(0, 40)}`,
          details: 'Tentativa IDOR bloqueada: utilizador tentou cancelar subscrição que não lhe pertence.',
          metadata: { httpStatus: 403 }
        });
        return res.status(403).json({ error: 'Não tem permissão para cancelar esta subscrição.' });
      }

      if (stripeClient && subscriptionId.startsWith('sub_') && !subscriptionId.startsWith('sub_promo_')) {
        const canceled = await stripeClient.subscriptions.cancel(subscriptionId);
        appendServerAuditLog(req, {
          actorUserId: payload.uid,
          actorEmail: payload.email,
          actorRole: isAdmin ? 'admin' : 'user',
          action: 'subscription_canceled',
          category: 'subscription',
          severity: 'warning',
          status: 'success',
          targetResource: `subscriptions/${subscriptionId.slice(0, 64)}`,
          details: 'Renovação automática da subscrição cancelada pelo titular.'
        });
        return res.json({
          success: true,
          status: canceled.status,
          message: 'Renovação automática cancelada com sucesso.'
        });
      }

      appendServerAuditLog(req, {
        actorUserId: payload.uid,
        actorEmail: payload.email,
        actorRole: isAdmin ? 'admin' : 'user',
        action: 'subscription_canceled',
        category: 'subscription',
        severity: 'warning',
        status: 'success',
        targetResource: `subscriptions/${subscriptionId.slice(0, 64)}`,
        details: 'Subscrição cancelada pelo titular.'
      });
      return res.json({
        success: true,
        status: 'canceled',
        message: 'Assinatura cancelada com sucesso.'
      });
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      return res.status(500).json({ error: 'Não foi possível cancelar a assinatura neste momento.' });
    }
  });

  // -------------------------------------------------------------
  // 7. ADMIN NO-CODE PROMPT LIVE TESTER ENDPOINT (PRODUCTION)
  // -------------------------------------------------------------
  app.post('/api/admin/test-prompt', async (req, res) => {
    const startedAt = Date.now();
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      const userRec = payload ? (authStore.users[payload.uid] || findBackendUserByEmail(payload.email)) : undefined;
      if (
        !payload ||
        userRec?.status === 'suspended' ||
        (payload.role !== 'admin' && userRec?.role !== 'admin' && !ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase()))
      ) {
        return res.status(403).json({ error: 'Acesso restrito a administradores autenticados.' });
      }

      const { systemInstruction, userPromptTemplate, sampleInput, temperature, preferredModel, fallbackModel } = req.body;
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY não configurada no servidor. Configure a chave de API nas variáveis de ambiente para executar testes ao vivo.'
        });
      }

      const fullPrompt = `${systemInstruction ? `INSTRUÇÃO DE SISTEMA:\n${systemInstruction}\n\n` : ''}TEMPLATE DO PROMPT:\n${userPromptTemplate || ''}\n\nDADOS DE TESTE DO ADMIN:\n${sampleInput || 'Gerente de Operações com 10 anos de experiência em logística e redução de custos.'}`;
      const response = await generateContentWithRetry(
        fullPrompt,
        {
          ...(typeof temperature === 'number' ? { temperature } : {})
        },
        { preferredModel, fallbackModel }
      );

      const textOut = response.text || '';
      const latencyMs = Date.now() - startedAt;
      const estimatedTokens = Math.ceil((fullPrompt.length + textOut.length) / 4);

      return res.json({
        output: textOut,
        modelUsed: preferredModel || 'gemini-4-hydrogen',
        latencyMs,
        estimatedTokens
      });
    } catch (err: any) {
      console.error('Erro em /api/admin/test-prompt:', err);
      return res.status(500).json({
        error: err?.message || 'Falha ao executar teste do prompt.',
        latencyMs: Date.now() - startedAt
      });
    }
  });

  // -------------------------------------------------------------
  // 8. FULL-STACK HYBRID AUTHENTICATION API (/api/auth/*)
  // -------------------------------------------------------------
  const isVercelEnv = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
  const AUTH_DATA_DIR = isVercelEnv
    ? path.resolve('/tmp', '.data')
    : path.resolve(SERVER_ROOT_DIR, '.data');
  const AUTH_STORE_FILE = path.join(AUTH_DATA_DIR, 'auth-users.json');
  const AUTH_SECRET_FILE = path.join(AUTH_DATA_DIR, 'auth-secret.key');

  const ADMIN_EMAILS_BACKEND = new Set([
    'gugurai923@gmail.com',
    'admin@curriculoestrategico.com',
    'mballoaliou2000@yahoo.fr'
  ]);

  interface BackendUserRecord {
    id: string;
    name: string;
    email: string;
    passwordHash?: string;
    passwordSalt?: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended';
    plan: 'free' | 'pro' | 'executive';
    targetRole?: string;
    phone?: string;
    company?: string;
    notes?: string;
    avatarUrl?: string;
    creditsRemaining: number;
    creditsUsed: number;
    dailyAiCallsDate?: string;
    dailyAiCallsCount?: number;
    totalCvGenerated: number;
    billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
    subscriptionExpiresAt?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
    authProviders: Array<'password' | 'google'>;
    firebaseUid?: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
  }

  interface PasswordResetRecord {
    email: string;
    codeHash: string;
    expiresAt: number;
    attempts: number;
  }

  interface SupportChatMessageRecord {
    id: string;
    threadId: string;
    senderId: string;
    senderName: string;
    senderRole: 'user' | 'admin';
    text: string;
    createdAt: string;
  }

  interface SupportChatThreadRecord {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatarUrl?: string;
    userPlan?: 'free' | 'pro' | 'executive';
    status: 'open' | 'resolved';
    lastMessageText?: string;
    lastMessageSenderRole?: 'user' | 'admin';
    lastMessageAt: string;
    unreadByUser: number;
    unreadByAdmin: number;
    createdAt: string;
    updatedAt: string;
    messages: SupportChatMessageRecord[];
  }

  interface AuthStoreData {
    users: Record<string, BackendUserRecord>;
    resetTokens: Record<string, PasswordResetRecord>;
    resumesByUser?: Record<string, any[]>;
    ordersByUser?: Record<string, any[]>;
    coupons?: any[];
    adminConfig?: Record<string, any>;
    errorLogs?: any[];
    gdprRequests?: any[];
    impersonationLogs?: any[];
    auditLogs?: any[];
    notificationPrefsByUser?: Record<string, any>;
    notificationsByUser?: Record<string, any[]>;
    supportChats?: Record<string, SupportChatThreadRecord>;
    promoSessions?: Record<string, any>;
    telemetry?: ServerTelemetryData;
  }

  const { projectId: FIREBASE_PROJECT_ID, firestoreDatabaseId: FIREBASE_DATABASE_ID } = (() => {
    let projectId = process.env.FIREBASE_PROJECT_ID || '';
    let firestoreDatabaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
    try {
      const candidatePaths = [
        path.resolve(SERVER_ROOT_DIR, 'firebase-applet-config.json'),
        path.resolve(SERVER_ROOT_DIR, '..', 'firebase-applet-config.json'),
        path.resolve(process.cwd(), 'firebase-applet-config.json')
      ];
      for (const cfgPath of candidatePaths) {
        if (fs.existsSync(cfgPath)) {
          const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
          if (!projectId && parsed?.projectId) projectId = String(parsed.projectId);
          if (parsed?.firestoreDatabaseId) firestoreDatabaseId = String(parsed.firestoreDatabaseId);
          break;
        }
      }
    } catch { /* ignore */ }
    return {
      projectId: projectId || 'gen-lang-client-0398048262',
      firestoreDatabaseId
    };
  })();

  function decodeFirestoreValue(val: any): any {
    if (!val || typeof val !== 'object') return undefined;
    if ('stringValue' in val) return String(val.stringValue);
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('booleanValue' in val) return Boolean(val.booleanValue);
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return String(val.timestampValue);
    if ('arrayValue' in val) {
      return Array.isArray(val.arrayValue?.values) ? val.arrayValue.values.map(decodeFirestoreValue) : [];
    }
    if ('mapValue' in val) {
      const obj: Record<string, any> = {};
      const fields = val.mapValue?.fields || {};
      for (const [k, v] of Object.entries(fields)) {
        obj[k] = decodeFirestoreValue(v);
      }
      return obj;
    }
    return undefined;
  }

  async function fetchFirestoreUserDoc(uid: string, firebaseIdToken: string): Promise<Record<string, any> | null> {
    if (!uid || !firebaseIdToken || !/^[a-zA-Z0-9_\-]{1,128}$/.test(uid)) return null;
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE_PROJECT_ID)}/databases/${encodeURIComponent(FIREBASE_DATABASE_ID)}/documents/users/${encodeURIComponent(uid)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${firebaseIdToken}` },
        signal: controller.signal
      }).finally(() => clearTimeout(timer));
      if (!resp.ok) return null;
      const json = (await resp.json().catch(() => null)) as { fields?: Record<string, any> } | null;
      if (!json?.fields) return null;
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(json.fields)) {
        out[k] = decodeFirestoreValue(v);
      }
      return out;
    } catch {
      return null;
    }
  }

  let runtimeFallbackSecret: string | null = null;
  function ensureAuthSecret(): string {
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
      return process.env.AUTH_SECRET;
    }
    if (isVercelEnv) {
      const envSeed =
        process.env.SESSION_SECRET ||
        process.env.STRIPE_SECRET_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        FIREBASE_PROJECT_ID;
      return crypto
        .createHmac('sha256', String(envSeed || FIREBASE_PROJECT_ID))
        .update(`cv-studio-vercel-auth-v1:${FIREBASE_PROJECT_ID}`)
        .digest('hex');
    }
    try {
      if (!fs.existsSync(AUTH_DATA_DIR)) {
        fs.mkdirSync(AUTH_DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(AUTH_SECRET_FILE)) {
        const existingSecret = fs.readFileSync(AUTH_SECRET_FILE, 'utf8').trim();
        if (existingSecret.length >= 32) return existingSecret;
      }
      const generated = crypto.randomBytes(48).toString('hex');
      fs.writeFileSync(AUTH_SECRET_FILE, generated, { mode: 0o600 });
      return generated;
    } catch {
      if (!runtimeFallbackSecret) {
        runtimeFallbackSecret = crypto.randomBytes(48).toString('hex');
      }
      return runtimeFallbackSecret;
    }
  }

  const AUTH_TOKEN_SECRET = ensureAuthSecret();

  let cachedFirebaseCerts: { certs: Record<string, string>; expiresAt: number } | null = null;
  async function fetchFirebasePublicCerts(): Promise<Record<string, string>> {
    const now = Date.now();
    if (cachedFirebaseCerts && now < cachedFirebaseCerts.expiresAt) {
      return cachedFirebaseCerts.certs;
    }
    const resp = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!resp.ok) {
      throw new Error('Falha ao obter certificados públicos Firebase.');
    }
    const certs = (await resp.json()) as Record<string, string>;
    const cc = resp.headers.get('cache-control') || '';
    const maxAgeMatch = cc.match(/max-age=(\d+)/i);
    const ttlMs = maxAgeMatch ? Math.max(60_000, Number(maxAgeMatch[1]) * 1000) : 3600_000;
    cachedFirebaseCerts = { certs, expiresAt: now + ttlMs };
    return certs;
  }

  interface VerifiedFirebaseClaims {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
    firebase?: { sign_in_provider?: string };
  }

  async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseClaims | null> {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, sigB64] = parts;
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
      const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      if (header?.alg !== 'RS256' || typeof header?.kid !== 'string') return null;

      let certs = await fetchFirebasePublicCerts();
      let certPem = certs[header.kid];
      if (!certPem) {
        cachedFirebaseCerts = null;
        certs = await fetchFirebasePublicCerts();
        certPem = certs[header.kid];
      }
      if (!certPem) return null;

      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      verifier.end();
      const signatureBuf = Buffer.from(sigB64, 'base64url');
      if (!verifier.verify(certPem, signatureBuf)) return null;

      const nowSec = Math.floor(Date.now() / 1000);
      const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
      if (claims?.aud !== FIREBASE_PROJECT_ID) return null;
      if (claims?.iss !== expectedIssuer) return null;
      if (typeof claims?.sub !== 'string' || !claims.sub || claims.sub.length > 128) return null;
      if (typeof claims?.exp !== 'number' || claims.exp <= nowSec) return null;
      if (typeof claims?.iat !== 'number' || claims.iat > nowSec + 300) return null;
      if (typeof claims?.auth_time === 'number' && claims.auth_time > nowSec + 300) return null;
      if (typeof claims?.email !== 'string' || !claims.email) return null;

      return {
        sub: claims.sub,
        email: String(claims.email).trim().toLowerCase(),
        email_verified: Boolean(claims.email_verified),
        name: typeof claims.name === 'string' ? claims.name : undefined,
        picture: typeof claims.picture === 'string' ? claims.picture : undefined,
        firebase: claims.firebase
      };
    } catch {
      return null;
    }
  }

  function loadAuthStore(): AuthStoreData {
    try {
      if (fs.existsSync(AUTH_STORE_FILE)) {
        const raw = fs.readFileSync(AUTH_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.users) {
          return {
            users: parsed.users || {},
            resetTokens: parsed.resetTokens || {},
            resumesByUser: parsed.resumesByUser || {},
            ordersByUser: parsed.ordersByUser || {},
            coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
            adminConfig: parsed.adminConfig && typeof parsed.adminConfig === 'object' ? parsed.adminConfig : {},
            errorLogs: Array.isArray(parsed.errorLogs) ? parsed.errorLogs : [],
            gdprRequests: Array.isArray(parsed.gdprRequests) ? parsed.gdprRequests : [],
            impersonationLogs: Array.isArray(parsed.impersonationLogs) ? parsed.impersonationLogs : [],
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
            notificationPrefsByUser:
              parsed.notificationPrefsByUser && typeof parsed.notificationPrefsByUser === 'object'
                ? parsed.notificationPrefsByUser
                : {},
            notificationsByUser:
              parsed.notificationsByUser && typeof parsed.notificationsByUser === 'object'
                ? parsed.notificationsByUser
                : {},
            supportChats:
              parsed.supportChats && typeof parsed.supportChats === 'object'
                ? parsed.supportChats
                : {},
            promoSessions: parsed.promoSessions && typeof parsed.promoSessions === 'object' ? parsed.promoSessions : {},
            telemetry:
              parsed.telemetry && typeof parsed.telemetry === 'object'
                ? parsed.telemetry
                : createEmptyTelemetry()
          };
        }
      }
    } catch (e) {
      console.warn('Aviso ao ler auth store, iniciando store limpo:', e);
    }
    return {
      users: {},
      resetTokens: {},
      resumesByUser: {},
      ordersByUser: {},
      coupons: [],
      adminConfig: {},
      errorLogs: [],
      gdprRequests: [],
      impersonationLogs: [],
      auditLogs: [],
      notificationPrefsByUser: {},
      notificationsByUser: {},
      supportChats: {},
      promoSessions: {},
      telemetry: createEmptyTelemetry()
    };
  }

  const authStore: AuthStoreData = loadAuthStore();
  if (!authStore.resumesByUser) authStore.resumesByUser = {};
  if (!authStore.ordersByUser) authStore.ordersByUser = {};
  if (!authStore.coupons) authStore.coupons = [];
  if (!authStore.adminConfig) authStore.adminConfig = {};
  if (!authStore.errorLogs) authStore.errorLogs = [];
  if (!authStore.gdprRequests) authStore.gdprRequests = [];
  if (!authStore.impersonationLogs) authStore.impersonationLogs = [];
  if (!authStore.auditLogs) authStore.auditLogs = [];
  if (!authStore.notificationPrefsByUser) authStore.notificationPrefsByUser = {};
  if (!authStore.notificationsByUser) authStore.notificationsByUser = {};
  if (!authStore.supportChats) authStore.supportChats = {};
  if (!authStore.promoSessions) authStore.promoSessions = {};
  if (!authStore.telemetry) authStore.telemetry = createEmptyTelemetry();

  function persistAuthStore() {
    try {
      if (!fs.existsSync(AUTH_DATA_DIR)) {
        fs.mkdirSync(AUTH_DATA_DIR, { recursive: true });
      }
      const tmpPath = `${AUTH_STORE_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(authStore, null, 2), { mode: 0o600 });
      fs.renameSync(tmpPath, AUTH_STORE_FILE);
    } catch (e) {
      console.warn('Aviso ao gravar auth store em disco:', e);
    }
  }

  const AUDIT_ALLOWED_ACTIONS = new Set([
    'subscription_upgraded',
    'subscription_canceled',
    'subscription_plan_sync_blocked',
    'payment_order_created',
    'payment_order_status_changed',
    'cv_exported_pdf',
    'cv_exported_docx',
    'cv_exported_json',
    'cv_export_blocked_unauthorized',
    'profile_updated',
    'password_changed',
    'account_login',
    'account_registered',
    'gdpr_request_submitted',
    'unauthorized_access_attempt',
    'admin_user_modified',
    'impersonation_event'
  ]);
  const AUDIT_ALLOWED_CATEGORIES = new Set(['subscription', 'cv_export', 'profile', 'security', 'admin']);
  const AUDIT_ALLOWED_SEVERITIES = new Set(['info', 'warning', 'critical']);
  const AUDIT_ALLOWED_STATUSES = new Set(['success', 'blocked', 'failure']);

  function sanitizeAuditMetadata(raw: any): Record<string, string | number | boolean> | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const out: Record<string, string | number | boolean> = {};
    let count = 0;
    for (const [k, v] of Object.entries(raw)) {
      if (count >= 12) break;
      if (v === undefined || v === null) continue;
      const key = String(k).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
      if (!key) continue;
      if (typeof v === 'string') {
        out[key] = sanitizeTelemetryText(v, 140);
        count += 1;
      } else if (typeof v === 'number' && Number.isFinite(v)) {
        out[key] = v;
        count += 1;
      } else if (typeof v === 'boolean') {
        out[key] = v;
        count += 1;
      }
    }
    return count > 0 ? out : undefined;
  }

  function appendServerAuditLog(
    req: express.Request | null,
    input: {
      id?: string;
      timestamp?: string;
      actorUserId?: string;
      actorEmail?: string;
      actorRole?: 'user' | 'admin' | 'anonymous' | 'system';
      action: string;
      category: 'subscription' | 'cv_export' | 'profile' | 'security' | 'admin';
      severity?: 'info' | 'warning' | 'critical';
      status?: 'success' | 'blocked' | 'failure';
      targetResource: string;
      details: string;
      metadata?: Record<string, string | number | boolean>;
    }
  ) {
    try {
      const action = AUDIT_ALLOWED_ACTIONS.has(input.action) ? input.action : 'unauthorized_access_attempt';
      const category = AUDIT_ALLOWED_CATEGORIES.has(input.category) ? input.category : 'security';
      const severity = AUDIT_ALLOWED_SEVERITIES.has(input.severity || '') ? input.severity! : 'info';
      const status = AUDIT_ALLOWED_STATUSES.has(input.status || '') ? input.status! : 'success';

      const safeIdRaw = String(input.id || `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`)
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .slice(0, 128);

      const rawIp = req
        ? String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '')
            .split(',')[0]
            .trim()
        : '';
      const rawUa = req ? String(req.headers['user-agent'] || '').trim() : '';
      const meta = sanitizeAuditMetadata(input.metadata);

      const entry = {
        id: safeIdRaw,
        timestamp: typeof input.timestamp === 'string' ? input.timestamp.slice(0, 50) : new Date().toISOString(),
        actorUserId: sanitizeTelemetryText(input.actorUserId || 'anonymous', 128) || 'anonymous',
        actorEmail: sanitizeTelemetryText(input.actorEmail || 'anonymous', 180) || 'anonymous',
        actorRole:
          input.actorRole && ['user', 'admin', 'anonymous', 'system'].includes(input.actorRole)
            ? input.actorRole
            : 'anonymous',
        action,
        category,
        severity,
        status,
        targetResource: sanitizeTelemetryText(input.targetResource || 'server/api', 180) || 'server/api',
        details: sanitizeTelemetryText(input.details || 'Evento de auditoria registado.', 600),
        ...(meta ? { metadata: meta } : {}),
        ...(rawUa ? { userAgent: sanitizeTelemetryText(rawUa, 250) } : {}),
        ...(rawIp ? { ipAddress: sanitizeTelemetryText(rawIp, 80) } : {})
      };

      authStore.auditLogs = [entry, ...(authStore.auditLogs || []).filter((a) => a.id !== entry.id)].slice(0, 500);
      persistAuthStore();
      return entry;
    } catch {
      return null;
    }
  }

  function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash: derived, salt };
  }

  function verifyPasswordHash(password: string, storedHash: string, storedSalt: string): boolean {
    try {
      const derived = crypto.scryptSync(password, storedSalt, 64);
      const storedBuf = Buffer.from(storedHash, 'hex');
      if (derived.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(derived, storedBuf);
    } catch {
      return false;
    }
  }

  interface SessionTokenPayload {
    uid: string;
    email: string;
    role: string;
    exp: number;
    name?: string;
    plan?: 'free' | 'pro' | 'executive';
  }

  function signSessionToken(payload: SessionTokenPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  function verifySessionToken(token: string): SessionTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [encoded, providedSig] = parts;
      const expectedSig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(encoded).digest('base64url');
      const a = Buffer.from(providedSig, 'utf8');
      const b = Buffer.from(expectedSig, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      if (!payload?.uid || !payload?.exp || Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    const result: Record<string, string> = {};
    if (!cookieHeader) return result;
    cookieHeader.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        result[key] = decodeURIComponent(val);
      }
    });
    return result;
  }

  function extractTokenFromRequest(req: express.Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const cookies = parseCookies(req.headers.cookie);
    return cookies['ce_session'] || null;
  }

  function setSessionCookie(req: express.Request, res: express.Response, token: string, rememberMe = true) {
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production';
    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('ce_session', token, {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      maxAge: maxAgeMs,
      path: '/'
    });
  }

  function sanitizeUser(record: BackendUserRecord) {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
      plan: record.plan,
      targetRole: record.targetRole,
      phone: record.phone,
      company: record.company,
      notes: record.notes,
      avatarUrl: record.avatarUrl,
      creditsRemaining: record.creditsRemaining,
      creditsUsed: record.creditsUsed,
      totalCvGenerated: Math.max(
        record.totalCvGenerated || 0,
        authStore.resumesByUser?.[record.id]?.length || 0
      ),
      billingCycle: record.billingCycle,
      subscriptionExpiresAt: record.subscriptionExpiresAt,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      stripeStatus: record.stripeStatus,
      createdAt: record.createdAt
    };
  }

  function findBackendUserByEmail(email: string): BackendUserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return Object.values(authStore.users).find((u) => u.email.toLowerCase() === clean);
  }

  function resolveAuthenticatedUserRecord(payload: SessionTokenPayload): BackendUserRecord | undefined {
    const existing =
      authStore.users[payload.uid] ||
      (payload.email ? findBackendUserByEmail(payload.email) : undefined);
    if (existing) return existing;
    if (!isVercelEnv) return undefined;

    const cleanEmail = String(payload.email || '').trim().toLowerCase();
    const isAdmin =
      payload.role === 'admin' || (cleanEmail ? ADMIN_EMAILS_BACKEND.has(cleanEmail) : false);
    const validPlan: 'free' | 'pro' | 'executive' =
      payload.plan && ['free', 'pro', 'executive'].includes(payload.plan)
        ? payload.plan
        : isAdmin
        ? 'executive'
        : 'free';
    const nowIso = new Date().toISOString();
    const hydrated: BackendUserRecord = {
      id: payload.uid,
      name: String(payload.name || cleanEmail.split('@')[0] || 'Utilizador').trim().slice(0, 120),
      email: cleanEmail,
      role: isAdmin ? 'admin' : 'user',
      status: 'active',
      plan: validPlan,
      creditsRemaining: isAdmin || validPlan !== 'free' ? 9999 : getFreePlanDefaultCredits(),
      creditsUsed: 0,
      totalCvGenerated: 0,
      billingCycle: 'monthly',
      authProviders: ['password'],
      createdAt: nowIso,
      updatedAt: nowIso
    };
    authStore.users[payload.uid] = hydrated;
    persistAuthStore();
    return hydrated;
  }

  // Bounded per-IP rate limiter for auth endpoints
  const authRateLimit = new Map<string, { count: number; resetAt: number }>();
  function checkAuthRateLimit(req: express.Request, maxRequests = 30, windowMs = 60_000): boolean {
    const ip = getClientIp(req);
    const now = Date.now();
    if (authRateLimit.size > 5000) {
      for (const [k, v] of authRateLimit.entries()) {
        if (now > v.resetAt) authRateLimit.delete(k);
      }
      if (authRateLimit.size > 5000) authRateLimit.clear();
    }
    const cur = authRateLimit.get(ip);
    if (!cur || now > cur.resetAt) {
      authRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= maxRequests;
  }

  // -------------------------------------------------------------
  // ANTI-BOT REGISTRATION SHIELD (CAPTCHA + HONEYPOT + TIMING + DISPOSABLE EMAIL + STRICT RATE LIMIT)
  // -------------------------------------------------------------
  const checkSignupChallengeRateLimit = createRateLimiter(25, 60_000);
  const checkSignupAttemptLimit = createRateLimiter(12, 15 * 60_000);
  const checkSignupSuccessLimit = createRateLimiter(5, 60 * 60_000);

  interface SignupChallengeEntry {
    id: string;
    expectedAnswer: string;
    issuedAt: number;
    expiresAt: number;
    attempts: number;
  }
  const activeSignupChallenges = new Map<string, SignupChallengeEntry>();

  const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    'tempmail.com',
    'temp-mail.org',
    'temp-mail.io',
    '10minutemail.com',
    '10minutemail.net',
    'guerrillamail.com',
    'guerrillamail.info',
    'guerrillamail.org',
    'guerrillamail.net',
    'guerrillamailblock.com',
    'sharklasers.com',
    'grr.la',
    'yopmail.com',
    'yopmail.fr',
    'yopmail.net',
    'trashmail.com',
    'trashmail.net',
    'getnada.com',
    'nada.email',
    'dispostable.com',
    'maildrop.cc',
    'mohmal.com',
    'fakeinbox.com',
    'throwawaymail.com',
    'mailnesia.com',
    'mintemail.com',
    'mytemp.email',
    'emailondeck.com',
    'burnermail.io',
    'tempail.com',
    'tempr.email',
    'mailcatch.com',
    'moakt.com',
    'inboxbear.com',
    'spamgourmet.com',
    'spambog.com',
    'crazymailing.com',
    'dropmail.me',
    'harakirimail.com',
    'mail-temporaire.fr',
    'tmpmail.org',
    'tmpmail.net',
    'tempinbox.com',
    'trash-mail.com',
    'jetable.org',
    'wegwerfmail.de'
  ]);

  function isAutomatedBotUserAgent(req: express.Request): boolean {
    const ua = String(req.headers['user-agent'] || '').trim().toLowerCase();
    if (!ua || ua.length < 8) return true;
    return /(curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|scrapy|go-http-client|java\/|axios\/|node-fetch|undici|postmanruntime|insomnia\/|headlesschrome|phantomjs|selenium|playwright|puppeteer|mechanize|nikto|sqlmap|zgrab)/i.test(
      ua
    );
  }

  const consumedChallengeIds = new Set<string>();

  function hashChallengeAnswer(challengeId: string, answer: string): string {
    return crypto
      .createHmac('sha256', AUTH_TOKEN_SECRET)
      .update(`${challengeId}:${answer.trim()}`)
      .digest('base64url');
  }

  function signChallengeToken(challengeId: string, issuedAt: number, expectedAnswer: string): string {
    const ansHash = hashChallengeAnswer(challengeId, expectedAnswer);
    const payload = `${challengeId}.${issuedAt}.${ansHash}`;
    const sig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  function verifyChallengeToken(
    token: string,
    expectedChallengeId: string
  ): { issuedAt: number; ansHash: string } | null {
    try {
      const parts = String(token || '').split('.');
      if (parts.length !== 4) return null;
      const [cid, issuedRaw, ansHash, providedSig] = parts;
      if (cid !== expectedChallengeId) return null;
      const issuedAt = Number(issuedRaw);
      if (!Number.isFinite(issuedAt) || issuedAt <= 0 || Date.now() - issuedAt > 10 * 60_000) {
        return null;
      }
      const expectedSig = crypto
        .createHmac('sha256', AUTH_TOKEN_SECRET)
        .update(`${cid}.${issuedRaw}.${ansHash}`)
        .digest('base64url');
      const a = Buffer.from(providedSig, 'utf8');
      const b = Buffer.from(expectedSig, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
      return { issuedAt, ansHash };
    } catch {
      return null;
    }
  }

  function buildMathCaptchaSvg(chars: string[]): string {
    const width = 188;
    const height = 52;
    const lineColors = ['#cbd5e1', '#94a3b8', '#e2e8f0'];
    const textColors = ['#0f172a', '#1e293b', '#334155', '#92400e'];

    let noiseLines = '';
    for (let i = 0; i < 5; i += 1) {
      const x1 = crypto.randomInt(0, 40);
      const y1 = crypto.randomInt(5, height - 5);
      const cx = crypto.randomInt(50, 140);
      const cy = crypto.randomInt(2, height - 2);
      const x2 = crypto.randomInt(width - 40, width);
      const y2 = crypto.randomInt(5, height - 5);
      const color = lineColors[i % lineColors.length];
      noiseLines += `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.35" opacity="0.85"/>`;
    }

    let noiseDots = '';
    for (let i = 0; i < 16; i += 1) {
      const cx = crypto.randomInt(6, width - 6);
      const cy = crypto.randomInt(4, height - 4);
      const r = (crypto.randomInt(10, 22) / 10).toFixed(1);
      noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#94a3b8" opacity="0.45"/>`;
    }

    const totalChars = chars.length;
    const step = (width - 28) / Math.max(1, totalChars);
    let glyphSvg = '';
    chars.forEach((ch, idx) => {
      const x = Math.round(16 + idx * step + crypto.randomInt(-2, 3));
      const y = Math.round(33 + crypto.randomInt(-5, 5));
      const rot = crypto.randomInt(-11, 12);
      const color = textColors[crypto.randomInt(0, textColors.length)];
      const safeChar = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      glyphSvg += `<text x="${x}" y="${y}" fill="${color}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" font-weight="800" transform="rotate(${rot} ${x} ${y})">${safeChar}</text>`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="8" fill="#f8fafc"/>
  <path d="M0 17 H${width} M0 35 H${width} M47 0 V${height} M94 0 V${height} M141 0 V${height}" stroke="#e2e8f0" stroke-width="0.7" opacity="0.6"/>
  ${noiseLines}
  ${noiseDots}
  ${glyphSvg}
</svg>`;
  }

  app.get('/api/auth/signup-challenge', (req, res) => {
    if (!checkSignupChallengeRateLimit(req)) {
      return res.status(429).json({
        error: 'Demasiados pedidos de verificação. Aguarde um momento.'
      });
    }

    const now = Date.now();
    if (activeSignupChallenges.size > 4500) {
      for (const [k, v] of activeSignupChallenges.entries()) {
        if (now > v.expiresAt) activeSignupChallenges.delete(k);
      }
      if (activeSignupChallenges.size > 4500) activeSignupChallenges.clear();
    }

    const a = crypto.randomInt(2, 19);
    const b = crypto.randomInt(1, 15);
    const answer = a + b;

    const chars = [...String(a), '+', ...String(b), '=', '?'];
    const svgMarkup = buildMathCaptchaSvg(chars);
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgMarkup, 'utf8').toString('base64')}`;

    const challengeId = crypto.randomBytes(12).toString('hex');
    const issuedAt = now;
    const ttlMs = 10 * 60_000;

    activeSignupChallenges.set(challengeId, {
      id: challengeId,
      expectedAnswer: String(answer),
      issuedAt,
      expiresAt: issuedAt + ttlMs,
      attempts: 0
    });

    const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
    const botProtectionEnabled = gov.enableBotProtection !== false;

    return res.json({
      challengeId,
      challengeToken: signChallengeToken(challengeId, issuedAt, String(answer)),
      imageUrl: svgDataUrl,
      minWaitMs: 2000,
      expiresInSeconds: 600,
      botProtectionEnabled
    });
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
      if (gov.allowNewRegistrations === false) {
        return res.status(403).json({
          code: 'auth/registrations-paused',
          error: 'Novos registos estão temporariamente pausados pelo administrador.'
        });
      }

      if (!checkAuthRateLimit(req, 15, 60_000) || !checkSignupAttemptLimit(req)) {
        appendServerAuditLog(req, {
          actorRole: 'anonymous',
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/auth/register',
          details: 'Registo bloqueado por excesso de tentativas consecutivas (proteção anti-robôs).',
          metadata: { httpStatus: 429, botReason: 'rate_limit' }
        });
        return res.status(429).json({
          code: 'auth/too-many-requests',
          error: 'Demasiadas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.'
        });
      }

      const botProtectionEnabled = gov.enableBotProtection !== false;
      const {
        name,
        email,
        password,
        targetRole,
        rememberMe = true,
        challengeId,
        challengeToken,
        challengeAnswer,
        website,
        companyUrl,
        companyPhone,
        hpTrap
      } = req.body || {};

      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const cleanPassword = String(password || '');

      if (botProtectionEnabled) {
        // 1. Block known headless/script HTTP user-agents
        if (isAutomatedBotUserAgent(req)) {
          appendServerAuditLog(req, {
            actorEmail: cleanEmail || 'bot@unknown',
            actorRole: 'anonymous',
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'warning',
            status: 'blocked',
            targetResource: '/api/auth/register',
            details: 'Tentativa de registo automatizado bloqueada (cliente HTTP/robô detetado).',
            metadata: { httpStatus: 403, botReason: 'automated_user_agent' }
          });
          return res.status(403).json({
            code: 'auth/bot-detected',
            error: 'Registo bloqueado pela proteção anti-robôs. Utilize um navegador padrão.'
          });
        }

        // 2. Honeypot invisible fields trap
        const honeypotTriggered = [website, companyUrl, companyPhone, hpTrap].some(
          (val) => typeof val === 'string' && val.trim().length > 0
        );
        if (honeypotTriggered) {
          appendServerAuditLog(req, {
            actorEmail: cleanEmail || 'bot@honeypot',
            actorRole: 'anonymous',
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'critical',
            status: 'blocked',
            targetResource: '/api/auth/register',
            details: 'Robô de spam detetado e bloqueado via campo armadilha (honeypot) no formulário de registo.',
            metadata: { httpStatus: 403, botReason: 'honeypot_triggered' }
          });
          return res.status(403).json({
            code: 'auth/bot-detected',
            error: 'Submissão rejeitada pela proteção automática contra robôs.'
          });
        }

        // 3. Reject spam links inside name field
        if (!cleanName || cleanName.length > 100 || /(https?:\/\/|www\.|<script)/i.test(cleanName)) {
          return res.status(400).json({
            code: 'auth/invalid-name',
            error: 'Insira um nome válido sem URLs ou caracteres inválidos.'
          });
        }

        // 4. Server-signed single-use Addition CAPTCHA + human minimum timing check (stateless-capable for serverless)
        const cid = String(challengeId || '').trim();
        const ctok = String(challengeToken || '').trim();
        const cans = String(challengeAnswer ?? '').trim();

        const verifiedChallenge = cid && ctok ? verifyChallengeToken(ctok, cid) : null;
        if (!verifiedChallenge || consumedChallengeIds.has(cid)) {
          appendServerAuditLog(req, {
            actorEmail: cleanEmail || 'bot@no-token',
            actorRole: 'anonymous',
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'warning',
            status: 'blocked',
            targetResource: '/api/auth/register',
            details: 'Tentativa de registo bloqueada: desafio de verificação humana ausente, expirado ou inválido.',
            metadata: { httpStatus: 400, botReason: 'missing_or_invalid_captcha_token' }
          });
          return res.status(400).json({
            code: 'auth/captcha-expired',
            error: 'Complete a soma de verificação humana antes de criar a conta.'
          });
        }

        const entry = activeSignupChallenges.get(cid);
        if (entry && Date.now() > entry.expiresAt) {
          activeSignupChallenges.delete(cid);
          return res.status(400).json({
            code: 'auth/captcha-expired',
            error: 'O código de verificação expirou. Resolva a nova soma exibida.'
          });
        }

        const issuedTimestamp = entry ? entry.issuedAt : verifiedChallenge.issuedAt;
        if (Date.now() - issuedTimestamp < 1800) {
          activeSignupChallenges.delete(cid);
          consumedChallengeIds.add(cid);
          appendServerAuditLog(req, {
            actorEmail: cleanEmail || 'bot@fast-submit',
            actorRole: 'anonymous',
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'warning',
            status: 'blocked',
            targetResource: '/api/auth/register',
            details: 'Submissão suspeita bloqueada por preenchimento instantâneo (< 1.8s).',
            metadata: { httpStatus: 403, botReason: 'submitted_too_fast' }
          });
          return res.status(403).json({
            code: 'auth/bot-detected',
            error: 'Submissão demasiado rápida detetada pela proteção anti-robôs. Tente novamente.'
          });
        }

        const submittedHash = cans ? hashChallengeAnswer(cid, cans) : '';
        const answerMatches =
          Boolean(cans) &&
          (entry
            ? cans === entry.expectedAnswer
            : submittedHash.length === verifiedChallenge.ansHash.length &&
              crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(verifiedChallenge.ansHash)));

        if (!answerMatches) {
          if (entry) {
            entry.attempts += 1;
            if (entry.attempts >= 2) {
              activeSignupChallenges.delete(cid);
              consumedChallengeIds.add(cid);
              return res.status(400).json({
                code: 'auth/captcha-expired',
                error: 'Resposta incorreta na verificação. Foi gerada uma nova soma.'
              });
            }
          }
          return res.status(400).json({
            code: 'auth/captcha-invalid',
            error: 'Resposta incorreta. Confira a soma na imagem e tente novamente.'
          });
        }

        // Single-use: consume challenge immediately
        activeSignupChallenges.delete(cid);
        if (consumedChallengeIds.size > 5000) consumedChallengeIds.clear();
        consumedChallengeIds.add(cid);
      }

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          code: 'auth/invalid-email',
          error: 'O formato do endereço de e-mail não é válido.'
        });
      }

      if (botProtectionEnabled) {
        const emailDomain = cleanEmail.split('@')[1] || '';
        if (DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
          appendServerAuditLog(req, {
            actorEmail: cleanEmail,
            actorRole: 'anonymous',
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'warning',
            status: 'blocked',
            targetResource: '/api/auth/register',
            details: `Registo bloqueado: domínio de e-mail temporário/descartável (${emailDomain}).`,
            metadata: { httpStatus: 400, botReason: 'disposable_email' }
          });
          return res.status(400).json({
            code: 'auth/disposable-email',
            error: 'Não é permitido criar conta com e-mail temporário/descartável. Utilize um e-mail permanente (Gmail, Outlook ou corporativo).'
          });
        }
      }

      if (!cleanPassword || cleanPassword.length < 6) {
        return res.status(400).json({
          code: 'auth/weak-password',
          error: 'A palavra-passe deve conter pelo menos 6 caracteres.'
        });
      }

      const existing = findBackendUserByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({
          code: 'auth/email-already-in-use',
          error: 'Este endereço de e-mail já está associado a uma conta existente. Tente iniciar sessão.'
        });
      }

      if (!checkSignupSuccessLimit(req)) {
        appendServerAuditLog(req, {
          actorEmail: cleanEmail,
          actorRole: 'anonymous',
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/auth/register',
          details: 'Limite horário de criação de novas contas por IP excedido.',
          metadata: { httpStatus: 429, botReason: 'hourly_signup_cap' }
        });
        return res.status(429).json({
          code: 'auth/too-many-requests',
          error: 'Limite temporário de novas contas atingido nesta rede. Tente novamente mais tarde.'
        });
      }

      const isAdmin = ADMIN_EMAILS_BACKEND.has(cleanEmail);
      const uid = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
      const { hash, salt } = hashPassword(cleanPassword);
      const nowIso = new Date().toISOString();

      const newUser: BackendUserRecord = {
        id: uid,
        name: cleanName || cleanEmail.split('@')[0] || 'Novo Assinante',
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        plan: isAdmin ? 'executive' : 'free',
        targetRole: targetRole ? String(targetRole).trim() : 'Profissional Executivo',
        creditsRemaining: isAdmin ? 9999 : getFreePlanDefaultCredits(),
        creditsUsed: 0,
        totalCvGenerated: 0,
        billingCycle: isAdmin ? 'yearly' : 'monthly',
        authProviders: ['password'],
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso
      };

      authStore.users[uid] = newUser;
      persistAuthStore();

      appendServerAuditLog(req, {
        actorUserId: newUser.id,
        actorEmail: newUser.email,
        actorRole: newUser.role,
        action: 'account_registered',
        category: 'profile',
        severity: 'info',
        status: 'success',
        targetResource: `users/${newUser.id}`,
        details: 'Nova conta criada via formulário de registo (e-mail e palavra-passe).'
      });

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        plan: newUser.plan,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.status(201).json({
        success: true,
        user: sanitizeUser(newUser),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/register:', err);
      return res.status(500).json({ error: 'Falha ao registar conta no servidor.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 30, 60_000)) {
        return res.status(429).json({
          code: 'auth/too-many-requests',
          error: 'Demasiadas tentativas consecutivas. Aguarde um minuto antes de tentar novamente.'
        });
      }

      const { email, password, rememberMe = true } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '');

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          code: 'auth/invalid-email',
          error: 'O formato do endereço de e-mail não é válido.'
        });
      }

      if (!cleanPassword) {
        return res.status(400).json({
          code: 'auth/missing-password',
          error: 'Por favor, insira a sua palavra-passe.'
        });
      }

      const userRecord = findBackendUserByEmail(cleanEmail);
      if (!userRecord || !userRecord.passwordHash || !userRecord.passwordSalt) {
        appendServerAuditLog(req, {
          actorEmail: cleanEmail,
          actorRole: 'anonymous',
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/auth/login',
          details: 'Tentativa de início de sessão com conta inexistente ou sem credenciais de palavra-passe.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({
          code: 'auth/invalid-credential',
          error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.'
        });
      }

      const isValid = verifyPasswordHash(cleanPassword, userRecord.passwordHash, userRecord.passwordSalt);
      if (!isValid) {
        appendServerAuditLog(req, {
          actorUserId: userRecord.id,
          actorEmail: userRecord.email,
          actorRole: userRecord.role,
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/auth/login',
          details: 'Palavra-passe incorreta durante tentativa de início de sessão.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({
          code: 'auth/invalid-credential',
          error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.'
        });
      }

      if (userRecord.status === 'suspended') {
        appendServerAuditLog(req, {
          actorUserId: userRecord.id,
          actorEmail: userRecord.email,
          actorRole: userRecord.role,
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: '/api/auth/login',
          details: 'Tentativa de acesso bloqueada: conta suspensa pela administração.',
          metadata: { httpStatus: 403 }
        });
        return res.status(403).json({
          code: 'auth/user-disabled',
          error: 'Esta conta foi suspensa pela administração. Contacte o suporte.'
        });
      }

      const isAdmin = ADMIN_EMAILS_BACKEND.has(cleanEmail);
      if (isAdmin && userRecord.role !== 'admin') {
        userRecord.role = 'admin';
      }
      userRecord.lastLoginAt = new Date().toISOString();
      userRecord.updatedAt = userRecord.lastLoginAt;
      persistAuthStore();

      appendServerAuditLog(req, {
        actorUserId: userRecord.id,
        actorEmail: userRecord.email,
        actorRole: userRecord.role,
        action: 'account_login',
        category: 'profile',
        severity: 'info',
        status: 'success',
        targetResource: `users/${userRecord.id}`,
        details: 'Sessão iniciada por e-mail e palavra-passe.'
      });

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        name: userRecord.name,
        plan: userRecord.plan,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.json({
        success: true,
        user: sanitizeUser(userRecord),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/login:', err);
      return res.status(500).json({ error: 'Falha ao iniciar sessão no servidor.' });
    }
  });

  app.post('/api/auth/sync-firebase', async (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 40, 60_000)) {
        return res.status(429).json({ error: 'Demasiados pedidos de autenticação. Aguarde um minuto.' });
      }

      const {
        idToken: bodyIdToken,
        name,
        avatarUrl,
        provider = 'google',
        targetRole,
        rememberMe = true
      } = req.body || {};

      const headerToken = extractTokenFromRequest(req);
      const rawFirebaseToken =
        typeof bodyIdToken === 'string' && bodyIdToken.trim()
          ? bodyIdToken.trim()
          : headerToken && headerToken.split('.').length === 3
          ? headerToken
          : '';

      if (!rawFirebaseToken) {
        return res.status(401).json({ error: 'Token de identidade Firebase obrigatório.' });
      }

      const verified = await verifyFirebaseIdToken(rawFirebaseToken);
      if (!verified) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'critical',
          status: 'blocked',
          targetResource: '/api/auth/sync-firebase',
          details: 'Token de identidade Firebase inválido, expirado ou adulterado rejeitado na verificação RS256.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Token Firebase inválido, adulterado ou expirado.' });
      }

      const cleanUid = verified.sub;
      const cleanEmail = verified.email;
      const isVerifiedAdmin = verified.email_verified && ADMIN_EMAILS_BACKEND.has(cleanEmail);
      const nowIso = new Date().toISOString();

      // Fetch authoritative user record from Firestore (obeying firestore.rules via user's ID token)
      const firestoreUser = await fetchFirestoreUserDoc(cleanUid, rawFirebaseToken);

      // Prevent account takeover via unverified email: only lookup by email if email_verified is true
      let record =
        authStore.users[cleanUid] ||
        (verified.email_verified ? findBackendUserByEmail(cleanEmail) : undefined);

      const fsPlan =
        firestoreUser?.plan && ['free', 'pro', 'executive'].includes(firestoreUser.plan)
          ? (firestoreUser.plan as 'free' | 'pro' | 'executive')
          : undefined;
      const fsRole =
        firestoreUser?.role && ['admin', 'user'].includes(firestoreUser.role)
          ? (firestoreUser.role as 'admin' | 'user')
          : undefined;
      const fsStatus =
        firestoreUser?.status && ['active', 'suspended'].includes(firestoreUser.status)
          ? (firestoreUser.status as 'active' | 'suspended')
          : undefined;
      const fsCredits =
        typeof firestoreUser?.creditsRemaining === 'number' && Number.isFinite(firestoreUser.creditsRemaining)
          ? firestoreUser.creditsRemaining
          : undefined;

      if (!record) {
        const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
        if (gov.allowNewRegistrations === false && !isVerifiedAdmin && !firestoreUser) {
          return res.status(403).json({
            code: 'auth/registrations-paused',
            error: 'Novos registos estão temporariamente pausados pelo administrador.'
          });
        }
        const resolvedRole: 'admin' | 'user' = isVerifiedAdmin ? 'admin' : fsRole || 'user';
        const resolvedPlan: 'free' | 'pro' | 'executive' = isVerifiedAdmin
          ? 'executive'
          : fsPlan || 'free';
        const resolvedCredits =
          fsCredits !== undefined
            ? fsCredits
            : isVerifiedAdmin || resolvedPlan === 'executive'
            ? 9999
            : resolvedPlan === 'pro'
            ? 100
            : getFreePlanDefaultCredits();

        record = {
          id: cleanUid,
          name: String(firestoreUser?.name || name || verified.name || cleanEmail.split('@')[0] || 'Utilizador').trim().slice(0, 120),
          email: cleanEmail,
          role: resolvedRole,
          status: fsStatus || 'active',
          plan: resolvedPlan,
          targetRole:
            typeof firestoreUser?.targetRole === 'string' && firestoreUser.targetRole.trim()
              ? firestoreUser.targetRole.trim().slice(0, 150)
              : typeof targetRole === 'string' && targetRole.trim()
              ? targetRole.trim().slice(0, 150)
              : 'Profissional Executivo',
          phone: typeof firestoreUser?.phone === 'string' ? firestoreUser.phone.slice(0, 50) : undefined,
          company: typeof firestoreUser?.company === 'string' ? firestoreUser.company.slice(0, 120) : undefined,
          avatarUrl: typeof avatarUrl === 'string' && avatarUrl.startsWith('https://')
            ? avatarUrl.slice(0, 500)
            : typeof firestoreUser?.avatarUrl === 'string' && firestoreUser.avatarUrl.startsWith('https://')
            ? firestoreUser.avatarUrl.slice(0, 500)
            : verified.picture || undefined,
          creditsRemaining: resolvedCredits,
          creditsUsed: typeof firestoreUser?.creditsUsed === 'number' ? firestoreUser.creditsUsed : 0,
          totalCvGenerated: typeof firestoreUser?.totalCvGenerated === 'number' ? firestoreUser.totalCvGenerated : 0,
          billingCycle:
            firestoreUser?.billingCycle && ['monthly', 'quarterly', 'semiannual', 'yearly'].includes(firestoreUser.billingCycle)
              ? firestoreUser.billingCycle
              : isVerifiedAdmin
              ? 'yearly'
              : 'monthly',
          subscriptionExpiresAt:
            typeof firestoreUser?.subscriptionExpiresAt === 'string' ? firestoreUser.subscriptionExpiresAt : undefined,
          stripeCustomerId: typeof firestoreUser?.stripeCustomerId === 'string' ? firestoreUser.stripeCustomerId : undefined,
          stripeSubscriptionId: typeof firestoreUser?.stripeSubscriptionId === 'string' ? firestoreUser.stripeSubscriptionId : undefined,
          stripeStatus:
            typeof firestoreUser?.stripeStatus === 'string' &&
            ['active', 'trialing', 'past_due', 'canceled', 'incomplete'].includes(firestoreUser.stripeStatus)
              ? (firestoreUser.stripeStatus as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete')
              : undefined,
          notes: typeof firestoreUser?.notes === 'string' ? firestoreUser.notes : undefined,
          authProviders: [
            verified.firebase?.sign_in_provider === 'password' || provider === 'password' ? 'password' : 'google'
          ],
          firebaseUid: cleanUid,
          createdAt: typeof firestoreUser?.createdAt === 'string' ? firestoreUser.createdAt : nowIso,
          updatedAt: nowIso,
          lastLoginAt: nowIso
        };
        authStore.users[record.id] = record;
        appendServerAuditLog(req, {
          actorUserId: record.id,
          actorEmail: record.email,
          actorRole: record.role,
          action: 'account_registered',
          category: 'profile',
          severity: 'info',
          status: 'success',
          targetResource: `users/${record.id}`,
          details: `Nova conta registada via autenticação federada (${record.authProviders.join(', ')}).`,
          metadata: { provider: record.authProviders[0] || 'google' }
        });
      } else {
        if (fsStatus === 'suspended' || record.status === 'suspended') {
          appendServerAuditLog(req, {
            actorUserId: record.id,
            actorEmail: record.email,
            actorRole: record.role,
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'critical',
            status: 'blocked',
            targetResource: '/api/auth/sync-firebase',
            details: 'Tentativa de início de sessão Google/Firebase bloqueada: conta suspensa pela administração.',
            metadata: { httpStatus: 403 }
          });
          return res.status(403).json({
            code: 'auth/user-disabled',
            error: 'Esta conta foi suspensa pela administração. Contacte o suporte.'
          });
        }
        record.firebaseUid = cleanUid;
        if (firestoreUser) {
          if (fsPlan) record.plan = fsPlan;
          if (fsRole) record.role = fsRole;
          if (fsStatus) record.status = fsStatus;
          if (fsCredits !== undefined) record.creditsRemaining = fsCredits;
          if (typeof firestoreUser.subscriptionExpiresAt === 'string') {
            record.subscriptionExpiresAt = firestoreUser.subscriptionExpiresAt;
          }
          if (
            firestoreUser.billingCycle &&
            ['monthly', 'quarterly', 'semiannual', 'yearly'].includes(firestoreUser.billingCycle)
          ) {
            record.billingCycle = firestoreUser.billingCycle;
          }
          if (typeof firestoreUser.notes === 'string') record.notes = firestoreUser.notes;
          if (typeof firestoreUser.name === 'string' && firestoreUser.name.trim()) {
            record.name = firestoreUser.name.trim().slice(0, 120);
          }
        }
        if (name && (!record.name || record.name === 'Utilizador')) {
          record.name = String(name).trim().slice(0, 120);
        }
        if (typeof avatarUrl === 'string' && avatarUrl.startsWith('https://')) {
          record.avatarUrl = avatarUrl.slice(0, 500);
        } else if (verified.picture && !record.avatarUrl) {
          record.avatarUrl = verified.picture;
        }
        if (typeof targetRole === 'string' && targetRole.trim() && !record.targetRole) {
          record.targetRole = targetRole.trim().slice(0, 150);
        }
        if (isVerifiedAdmin) {
          record.role = 'admin';
          if (record.plan === 'free') record.plan = 'executive';
        }
        const provKey =
          verified.firebase?.sign_in_provider === 'password' || provider === 'password' ? 'password' : 'google';
        if (!record.authProviders.includes(provKey)) {
          record.authProviders.push(provKey);
        }
        record.lastLoginAt = nowIso;
        record.updatedAt = nowIso;
        appendServerAuditLog(req, {
          actorUserId: record.id,
          actorEmail: record.email,
          actorRole: record.role,
          action: 'account_login',
          category: 'profile',
          severity: 'info',
          status: 'success',
          targetResource: `users/${record.id}`,
          details: `Sessão autenticada com token RS256 (${provKey}).`,
          metadata: { provider: provKey }
        });
      }

      persistAuthStore();

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: record.id,
        email: record.email,
        role: record.role,
        name: record.name,
        plan: record.plan,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.json({
        success: true,
        user: sanitizeUser(record),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/sync-firebase:', err);
      return res.status(500).json({ error: 'Falha ao sincronizar sessão Firebase.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      if (!token) {
        return res.json({ authenticated: false, user: null });
      }
      const payload = verifySessionToken(token);
      if (!payload) {
        return res.json({ authenticated: false, user: null });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.json({ authenticated: false, user: null });
      }
      return res.json({
        authenticated: true,
        user: sanitizeUser(userRecord)
      });
    } catch {
      return res.json({ authenticated: false, user: null });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('ce_session', { path: '/' });
    return res.json({ success: true });
  });

  app.patch('/api/auth/profile', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão expirada ou inválida. Inicie sessão novamente.' });
      }

      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      const { name, targetRole, phone, company } = req.body || {};
      const changedFields: string[] = [];
      if (typeof name === 'string' && name.trim() && name.trim() !== userRecord.name) {
        userRecord.name = name.trim().slice(0, 120);
        changedFields.push('name');
      }
      if (typeof targetRole === 'string' && targetRole.trim() !== (userRecord.targetRole || '')) {
        userRecord.targetRole = targetRole.trim().slice(0, 150);
        changedFields.push('targetRole');
      }
      if (typeof phone === 'string' && phone.trim() !== (userRecord.phone || '')) {
        userRecord.phone = phone.trim().slice(0, 50);
        changedFields.push('phone');
      }
      if (typeof company === 'string' && company.trim() !== (userRecord.company || '')) {
        userRecord.company = company.trim().slice(0, 120);
        changedFields.push('company');
      }
      userRecord.updatedAt = new Date().toISOString();

      persistAuthStore();
      if (changedFields.length > 0) {
        appendServerAuditLog(req, {
          actorUserId: userRecord.id,
          actorEmail: userRecord.email,
          actorRole: userRecord.role,
          action: 'profile_updated',
          category: 'profile',
          severity: 'info',
          status: 'success',
          targetResource: `users/${userRecord.id}`,
          details: `Perfil atualizado via servidor (${changedFields.join(', ')}).`,
          metadata: { changedFields: changedFields.join(', ') }
        });
      }
      return res.json({ success: true, user: sanitizeUser(userRecord) });
    } catch (err: any) {
      console.error('Erro em /api/auth/profile:', err);
      return res.status(500).json({ error: 'Erro ao atualizar perfil no servidor.' });
    }
  });

  function buildDefaultNotificationPrefs(userId: string) {
    return {
      id: 'notifications',
      userId,
      systemEnabled: true,
      emailEnabled: true,
      events: {
        translation: { system: true, email: true },
        export: { system: true, email: true },
        resumeUpdate: { system: true, email: false }
      },
      updatedAt: new Date().toISOString()
    };
  }

  function sanitizeServerNotificationPrefs(userId: string, body: any) {
    const def = buildDefaultNotificationPrefs(userId);
    const ev = body?.events || {};
    return {
      id: 'notifications',
      userId,
      systemEnabled: typeof body?.systemEnabled === 'boolean' ? body.systemEnabled : def.systemEnabled,
      emailEnabled: typeof body?.emailEnabled === 'boolean' ? body.emailEnabled : def.emailEnabled,
      events: {
        translation: {
          system: typeof ev?.translation?.system === 'boolean' ? ev.translation.system : def.events.translation.system,
          email: typeof ev?.translation?.email === 'boolean' ? ev.translation.email : def.events.translation.email
        },
        export: {
          system: typeof ev?.export?.system === 'boolean' ? ev.export.system : def.events.export.system,
          email: typeof ev?.export?.email === 'boolean' ? ev.export.email : def.events.export.email
        },
        resumeUpdate: {
          system:
            typeof ev?.resumeUpdate?.system === 'boolean'
              ? ev.resumeUpdate.system
              : def.events.resumeUpdate.system,
          email:
            typeof ev?.resumeUpdate?.email === 'boolean' ? ev.resumeUpdate.email : def.events.resumeUpdate.email
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  app.get('/api/auth/notification-preferences', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const existing = authStore.notificationPrefsByUser?.[payload.uid];
      const preferences = existing
        ? sanitizeServerNotificationPrefs(payload.uid, existing)
        : buildDefaultNotificationPrefs(payload.uid);
      return res.json({ preferences });
    } catch {
      return res.status(500).json({ error: 'Erro ao carregar preferências de notificações.' });
    }
  });

  app.put('/api/auth/notification-preferences', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(403).json({ error: 'Conta indisponível ou suspensa.' });
      }
      const preferences = sanitizeServerNotificationPrefs(payload.uid, req.body || {});
      if (!authStore.notificationPrefsByUser) authStore.notificationPrefsByUser = {};
      authStore.notificationPrefsByUser[payload.uid] = preferences;
      persistAuthStore();

      appendServerAuditLog(req, {
        actorUserId: userRecord.id,
        actorEmail: userRecord.email,
        actorRole: userRecord.role,
        action: 'profile_updated',
        category: 'profile',
        severity: 'info',
        status: 'success',
        targetResource: `users/${userRecord.id}/preferences/notifications`,
        details: `Preferências de notificações atualizadas (sistema=${preferences.systemEnabled}, email=${preferences.emailEnabled}).`,
        metadata: {
          systemEnabled: preferences.systemEnabled,
          emailEnabled: preferences.emailEnabled
        }
      });

      return res.json({ success: true, preferences });
    } catch {
      return res.status(500).json({ error: 'Erro ao guardar preferências de notificações.' });
    }
  });

  app.get('/api/notifications', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      const ownerUid = userRec?.id || payload.uid;
      const items = (authStore.notificationsByUser?.[ownerUid] || []).slice(0, 40);
      return res.json({ notifications: items });
    } catch {
      return res.status(500).json({ error: 'Erro ao carregar notificações.' });
    }
  });

  app.post('/api/notifications/dispatch', async (req, res) => {
    try {
      if (!checkTelemetryRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas notificações em sequência.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(403).json({ error: 'Conta indisponível ou suspensa.' });
      }

      const body = req.body || {};
      const eventType = ['translation', 'export', 'resume_update'].includes(body.eventType)
        ? body.eventType
        : 'resume_update';

      const prefs = authStore.notificationPrefsByUser?.[payload.uid]
        ? sanitizeServerNotificationPrefs(payload.uid, authStore.notificationPrefsByUser[payload.uid])
        : buildDefaultNotificationPrefs(payload.uid);
      const evCfg =
        eventType === 'translation'
          ? prefs.events.translation
          : eventType === 'export'
          ? prefs.events.export
          : prefs.events.resumeUpdate;

      const allowSystem = Boolean(prefs.systemEnabled && evCfg.system && body.channelSystem !== false);
      const allowEmail = Boolean(prefs.emailEnabled && evCfg.email && body.channelEmail !== false);

      if (!allowSystem && !allowEmail) {
        return res.json({ success: true, skipped: true, emailDeliveryStatus: 'not_requested' });
      }

      const safeTitle = sanitizeTelemetryText(body.title || 'Notificação', 140) || 'Notificação';
      const safeMessage =
        sanitizeTelemetryText(body.message || 'Atualização concluída.', 500) || 'Atualização concluída.';
      const safeId = String(body.id || `ntf_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`)
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .slice(0, 128);

      let emailDeliveryStatus: 'not_requested' | 'sent' | 'queued' = allowEmail ? 'queued' : 'not_requested';

      if (allowEmail && userRecord.email && process.env.RESEND_API_KEY) {
        try {
          const emailResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: process.env.NOTIFICATION_FROM_EMAIL || 'Currículo Estratégico <noreply@curriculoestrategico.com>',
              to: [userRecord.email],
              subject: safeTitle,
              text: `${safeTitle}\n\n${safeMessage}\n\nGerido nas suas Preferências de Notificações.`
            })
          });
          if (emailResp.ok) {
            emailDeliveryStatus = 'sent';
          }
        } catch {
          emailDeliveryStatus = 'queued';
        }
      } else if (allowEmail && process.env.NOTIFICATION_WEBHOOK_URL) {
        try {
          const parsedUrl = await assertSafeExternalUrl(process.env.NOTIFICATION_WEBHOOK_URL);
          const webhookResp = await fetch(parsedUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: userRecord.email,
              userName: userRecord.name,
              eventType,
              title: safeTitle,
              message: safeMessage,
              createdAt: new Date().toISOString()
            })
          });
          if (webhookResp.ok) {
            emailDeliveryStatus = 'sent';
          }
        } catch {
          emailDeliveryStatus = 'queued';
        }
      }

      const notification = {
        id: safeId,
        userId: payload.uid,
        eventType,
        title: safeTitle,
        message: safeMessage,
        channelSystem: allowSystem,
        channelEmail: allowEmail,
        emailDeliveryStatus,
        read: !allowSystem,
        createdAt: typeof body.createdAt === 'string' ? body.createdAt.slice(0, 50) : new Date().toISOString(),
        ...(typeof body.targetResource === 'string' && body.targetResource
          ? { targetResource: sanitizeTelemetryText(body.targetResource, 180) }
          : {})
      };

      if (!authStore.notificationsByUser) authStore.notificationsByUser = {};
      const existing = authStore.notificationsByUser[payload.uid] || [];
      authStore.notificationsByUser[payload.uid] = [
        notification,
        ...existing.filter((n) => n.id !== notification.id)
      ].slice(0, 40);
      persistAuthStore();

      return res.status(201).json({
        success: true,
        notification,
        emailDeliveryStatus
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao processar notificação.' });
    }
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      const ownerUid = userRec?.id || payload.uid;
      const targetId = String(req.params.id || '');
      const list = authStore.notificationsByUser?.[ownerUid] || [];
      if (authStore.notificationsByUser) {
        authStore.notificationsByUser[ownerUid] = list.map((item) =>
          targetId === 'all' || item.id === targetId ? { ...item, read: true } : item
        );
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao atualizar notificação.' });
    }
  });

  app.delete('/api/notifications', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      const ownerUid = userRec?.id || payload.uid;
      if (authStore.notificationsByUser) {
        authStore.notificationsByUser[ownerUid] = [];
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao limpar notificações.' });
    }
  });

  app.post('/api/auth/sync-plan', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados pedidos. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão inválida.' });
      }

      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(404).json({ error: 'Utilizador não encontrado ou suspenso.' });
      }

      const {
        plan,
        billingCycle,
        subscriptionExpiresAt,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeStatus
      } = req.body || {};

      const isAdmin =
        userRecord.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());

      // Self-downgrade or cancellation is always permitted for the account owner
      if (stripeStatus === 'canceled' && !plan) {
        userRecord.stripeStatus = 'canceled';
        userRecord.updatedAt = new Date().toISOString();
        persistAuthStore();
        return res.json({ success: true, user: sanitizeUser(userRecord) });
      }

      if (plan === 'free') {
        userRecord.plan = 'free';
        userRecord.creditsRemaining = Math.min(userRecord.creditsRemaining ?? 5, 5);
        userRecord.stripeStatus = 'canceled';
        userRecord.updatedAt = new Date().toISOString();
        persistAuthStore();
        return res.json({ success: true, user: sanitizeUser(userRecord) });
      }

      // Paid upgrades MUST be verified server-side (Admin OR verified Promo/Order/Stripe Subscription)
      if (plan && ['pro', 'executive'].includes(plan)) {
        let verifiedPaid = isAdmin;
        const subId = typeof stripeSubscriptionId === 'string' ? stripeSubscriptionId.trim() : '';

        if (!verifiedPaid && subId) {
          const userOrders = authStore.ordersByUser?.[userRecord.id] || [];
          const hasPaidOrder = userOrders.some(
            (o) => o?.stripeSubscriptionId === subId && o?.status === 'paid' && o?.plan === plan
          );
          const hasPromo = Object.values(authStore.promoSessions || {}).some(
            (p: any) =>
              p?.subscriptionId === subId &&
              p?.plan === plan &&
              (p?.userId === userRecord.id || String(p?.userEmail || '').toLowerCase() === userRecord.email.toLowerCase())
          );
          if (hasPaidOrder || hasPromo) {
            verifiedPaid = true;
          } else if (stripeClient && subId.startsWith('sub_') && !subId.startsWith('sub_promo_')) {
            const sub = await stripeClient.subscriptions.retrieve(subId, { expand: ['latest_invoice'] }).catch(() => null);
            const latestInv = sub?.latest_invoice as any;
            const subCustomerId = typeof sub?.customer === 'string' ? sub.customer : (sub?.customer as any)?.id;
            const subActive =
              sub?.status === 'active' || sub?.status === 'trialing' || latestInv?.status === 'paid';
            const ownsSub =
              sub?.metadata?.userId === userRecord.id ||
              String(sub?.metadata?.userEmail || '').toLowerCase() === userRecord.email.toLowerCase() ||
              (userRecord.stripeCustomerId && userRecord.stripeCustomerId === subCustomerId);
            if (subActive && ownsSub) {
              verifiedPaid = true;
            }
          }
        }

        if (!verifiedPaid) {
          appendServerAuditLog(req, {
            actorUserId: userRecord.id,
            actorEmail: userRecord.email,
            actorRole: 'user',
            action: 'subscription_plan_sync_blocked',
            category: 'subscription',
            severity: 'critical',
            status: 'blocked',
            targetResource: `users/${userRecord.id}`,
            details: `Tentativa bloqueada de alteração para plano pago (${plan}) sem pagamento ou subscrição verificada.`,
            metadata: { requestedPlan: String(plan), httpStatus: 403 }
          });
          return res.status(403).json({
            error: 'Alteração de plano bloqueada: pagamento ou assinatura ainda não verificado no servidor.'
          });
        }

        const normalizedCycle = normalizeServerCycle(billingCycle || userRecord.billingCycle);
        const days = getServerCycleSpec(normalizedCycle).days;
        userRecord.plan = plan;
        userRecord.billingCycle = normalizedCycle;
        userRecord.creditsRemaining = 9999;
        userRecord.subscriptionExpiresAt =
          typeof subscriptionExpiresAt === 'string' && isAdmin
            ? subscriptionExpiresAt
            : new Date(Date.now() + days * 86400000).toISOString();
        if (typeof stripeCustomerId === 'string' && stripeCustomerId.startsWith('cus_')) {
          userRecord.stripeCustomerId = stripeCustomerId;
        }
        if (subId) userRecord.stripeSubscriptionId = subId;
        userRecord.stripeStatus = 'active';
        appendServerAuditLog(req, {
          actorUserId: userRecord.id,
          actorEmail: userRecord.email,
          actorRole: isAdmin ? 'admin' : 'user',
          action: 'subscription_upgraded',
          category: 'subscription',
          severity: 'info',
          status: 'success',
          targetResource: `users/${userRecord.id}`,
          details: `Subscrição ativada/atualizada para ${plan} (${normalizedCycle}).`,
          metadata: { plan, billingCycle: normalizedCycle }
        });
      }

      userRecord.updatedAt = new Date().toISOString();
      persistAuthStore();
      return res.json({ success: true, user: sanitizeUser(userRecord) });
    } catch {
      return res.status(500).json({ error: 'Falha ao sincronizar estado da assinatura.' });
    }
  });

  app.post('/api/auth/change-password', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão expirada. Inicie sessão novamente.' });
      }

      const userRecord = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (!userRecord) {
        return res.status(404).json({ error: 'Conta não encontrada.' });
      }

      const { currentPassword, newPassword } = req.body || {};
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      }

      if (userRecord.passwordHash && userRecord.passwordSalt) {
        if (!currentPassword || !verifyPasswordHash(String(currentPassword), userRecord.passwordHash, userRecord.passwordSalt)) {
          appendServerAuditLog(req, {
            actorUserId: userRecord.id,
            actorEmail: userRecord.email,
            actorRole: userRecord.role,
            action: 'unauthorized_access_attempt',
            category: 'security',
            severity: 'warning',
            status: 'blocked',
            targetResource: '/api/auth/change-password',
            details: 'Tentativa de alteração de palavra-passe rejeitada: palavra-passe atual incorreta.',
            metadata: { httpStatus: 401 }
          });
          return res.status(401).json({ error: 'A palavra-passe atual está incorreta.' });
        }
      }

      const { hash, salt } = hashPassword(String(newPassword));
      userRecord.passwordHash = hash;
      userRecord.passwordSalt = salt;
      if (!userRecord.authProviders.includes('password')) {
        userRecord.authProviders.push('password');
      }
      userRecord.updatedAt = new Date().toISOString();
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: userRecord.id,
        actorEmail: userRecord.email,
        actorRole: userRecord.role,
        action: 'password_changed',
        category: 'profile',
        severity: 'warning',
        status: 'success',
        targetResource: `users/${userRecord.id}`,
        details: 'Palavra-passe da conta alterada com autenticação confirmada.'
      });

      return res.json({ success: true, message: 'Palavra-passe atualizada com sucesso.' });
    } catch (err: any) {
      console.error('Erro em /api/auth/change-password:', err);
      return res.status(500).json({ error: 'Falha ao atualizar palavra-passe.' });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 8, 60_000)) {
        return res.status(429).json({ error: 'Demasiados pedidos de recuperação. Aguarde um minuto.' });
      }

      const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Insira um endereço de e-mail válido.' });
      }

      // Security: Never expose reset OTP codes in HTTP responses or enumerate user existence
      return res.json({
        success: true,
        mode: 'email_recovery',
        message:
          'Por segurança, os códigos de redefinição não são exibidos no navegador. Se esta conta usar login Google, utilize o botão Google acima; caso contrário, solicite o envio oficial ou contacte o suporte administrativo.'
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/forgot-password:', err);
      return res.status(500).json({ error: 'Erro ao iniciar recuperação de palavra-passe.' });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
      const code = String(req.body?.code || '').trim();
      const newPassword = String(req.body?.newPassword || '');

      if (!cleanEmail || !code || newPassword.length < 6) {
        return res.status(400).json({ error: 'Preencha o e-mail, o código de 6 dígitos e uma nova palavra-passe (mín. 6 caracteres).' });
      }

      const resetRec = authStore.resetTokens[cleanEmail];
      if (!resetRec || Date.now() > resetRec.expiresAt) {
        return res.status(400).json({ error: 'Código de recuperação inválido ou expirado. Solicite um novo código.' });
      }

      resetRec.attempts += 1;
      if (resetRec.attempts > 5) {
        delete authStore.resetTokens[cleanEmail];
        persistAuthStore();
        return res.status(429).json({ error: 'Limite de tentativas excedido. Solicite um novo código.' });
      }

      const expectedHash = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(`${cleanEmail}:${code}`).digest('hex');
      const a = Buffer.from(resetRec.codeHash, 'utf8');
      const b = Buffer.from(expectedHash, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        persistAuthStore();
        return res.status(400).json({ error: 'Código de verificação incorreto.' });
      }

      const userRecord = findBackendUserByEmail(cleanEmail);
      if (!userRecord) {
        return res.status(404).json({ error: 'Conta não encontrada.' });
      }

      const { hash, salt } = hashPassword(newPassword);
      userRecord.passwordHash = hash;
      userRecord.passwordSalt = salt;
      if (!userRecord.authProviders.includes('password')) {
        userRecord.authProviders.push('password');
      }
      userRecord.updatedAt = new Date().toISOString();
      delete authStore.resetTokens[cleanEmail];
      persistAuthStore();

      const token = signSessionToken({
        uid: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000
      });
      setSessionCookie(req, res, token, true);

      return res.json({
        success: true,
        user: sanitizeUser(userRecord),
        token,
        message: 'Palavra-passe redefinida e sessão iniciada com sucesso!'
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/reset-password:', err);
      return res.status(500).json({ error: 'Falha ao redefinir palavra-passe.' });
    }
  });

  // Saved Resumes Persistence API (supports both backend-auth and Firebase-synced users)
  app.get('/api/resumes', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/resumes',
          details: 'Tentativa não autenticada de listar currículos guardados.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(401).json({ error: 'Conta inválida, removida ou suspensa.' });
      }
      const ownerUid = userRecord.id;
      const list = Array.isArray(authStore.resumesByUser?.[ownerUid])
        ? authStore.resumesByUser[ownerUid].filter((r) => r && r.id && r.id !== 'resume-default')
        : [];
      return res.json({ resumes: list, ownerUid });
    } catch (err: any) {
      console.error('Erro em GET /api/resumes:', err);
      return res.status(500).json({ error: 'Erro ao carregar currículos guardados.' });
    }
  });

  app.post('/api/resumes', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: '/api/resumes',
          details: 'Tentativa não autenticada de gravar currículo no servidor.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(401).json({ error: 'Conta inválida, removida ou suspensa.' });
      }
      const ownerUid = userRecord.id;
      const { id, title, targetJob, updatedAt, data } = req.body || {};
      if (!id || !title || !data) {
        return res.status(400).json({ error: 'Dados do currículo incompletos.' });
      }
      if (!authStore.resumesByUser) {
        authStore.resumesByUser = {};
      }
      const existing = (authStore.resumesByUser[ownerUid] || []).filter((r) => r && r.id && r.id !== 'resume-default');
      const savedItem = {
        id: String(id).slice(0, 128),
        title: String(title).trim().slice(0, 150),
        targetJob: String(targetJob || 'Vaga Executiva').trim().slice(0, 180),
        updatedAt: String(updatedAt || new Date().toLocaleDateString('pt-PT')),
        data
      };

      const isAdminOwner =
        userRecord.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(userRecord.email || '').toLowerCase());
      const planQuota = getServerPlanQuota(userRecord.plan || 'free');
      const maxResumesLimit = Number(planQuota?.maxResumes);
      const isReplacingExisting = existing.some((r) => r.id === savedItem.id || r.title === savedItem.title);
      if (
        !isAdminOwner &&
        !isReplacingExisting &&
        !planQuota?.unlimited &&
        Number.isFinite(maxResumesLimit) &&
        maxResumesLimit >= 0 &&
        maxResumesLimit < 9999 &&
        existing.length >= maxResumesLimit
      ) {
        return res.status(402).json({
          error: `Limite de ${maxResumesLimit} currículo(s) guardado(s) no plano ${planQuota?.planName || userRecord.plan} atingido. Faça upgrade para guardar mais versões.`,
          quotaExceeded: true,
          maxResumes: maxResumesLimit
        });
      }

      authStore.resumesByUser[ownerUid] = [
        savedItem,
        ...existing.filter((r) => r.id !== savedItem.id && r.title !== savedItem.title)
      ].slice(0, 50);
      if (!isReplacingExisting) {
        userRecord.totalCvGenerated = (userRecord.totalCvGenerated || 0) + 1;
      }
      persistAuthStore();
      return res.status(201).json({ success: true, resume: savedItem });
    } catch (err: any) {
      console.error('Erro em POST /api/resumes:', err);
      return res.status(500).json({ error: 'Falha ao guardar currículo no servidor.' });
    }
  });

  app.delete('/api/resumes/:id', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        appendServerAuditLog(req, {
          action: 'unauthorized_access_attempt',
          category: 'security',
          severity: 'warning',
          status: 'blocked',
          targetResource: `/api/resumes/${String(req.params.id || '').slice(0, 60)}`,
          details: 'Tentativa não autenticada de eliminar currículo.',
          metadata: { httpStatus: 401 }
        });
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRecord = resolveAuthenticatedUserRecord(payload);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.status(401).json({ error: 'Conta inválida, removida ou suspensa.' });
      }
      const ownerUid = userRecord.id;
      const resumeId = String(req.params.id || '');
      if (authStore.resumesByUser && authStore.resumesByUser[ownerUid]) {
        authStore.resumesByUser[ownerUid] = authStore.resumesByUser[ownerUid].filter(
          (r) => r.id !== resumeId
        );
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Erro em DELETE /api/resumes/:id:', err);
      return res.status(500).json({ error: 'Falha ao remover currículo do servidor.' });
    }
  });

  app.get('/api/admin/users/:id/resumes', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const targetId = String(req.params.id || '').trim();
    const targetUser =
      authStore.users[targetId] ||
      Object.values(authStore.users).find((u) => u.id === targetId || u.firebaseUid === targetId);
    const lookupKey = targetUser?.id || targetId;
    const list = Array.isArray(authStore.resumesByUser?.[lookupKey])
      ? authStore.resumesByUser[lookupKey].filter((r) => r && r.id && r.id !== 'resume-default')
      : [];
    return res.json({ resumes: list, ownerUid: lookupKey });
  });

  // Orders Persistence API for Backend-Authenticated users
  app.get('/api/orders', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      const ownerUid = userRec?.id || payload.uid;
      const list = authStore.ordersByUser?.[ownerUid] || [];
      return res.json({ orders: list });
    } catch (err: any) {
      console.error('Erro em GET /api/orders:', err);
      return res.status(500).json({ error: 'Erro ao carregar faturas.' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas requisições de pedido. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      const isAdmin =
        userRec?.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());

      const bodyOrder = req.body || {};
      if (!bodyOrder.id || !bodyOrder.orderNumber) {
        return res.status(400).json({ error: 'Dados do pedido inválidos.' });
      }

      const plan: 'pro' | 'executive' = bodyOrder.plan === 'executive' ? 'executive' : 'pro';
      const billingCycle = normalizeServerCycle(bodyOrder.billingCycle);
      const paymentMethod = bodyOrder.paymentMethod === 'pix' ? 'pix' : 'card';
      const requestedStatus = bodyOrder.status;

      // Non-admins cannot self-approve Pix payments as 'paid' or forge 'paid' orders without server/Stripe verification
      let verifiedStatus: 'pending' | 'paid' | 'refunded' | 'failed' = 'pending';
      if (isAdmin && ['paid', 'pending', 'refunded', 'failed'].includes(requestedStatus)) {
        verifiedStatus = requestedStatus;
      } else if (paymentMethod === 'card' && requestedStatus === 'paid') {
        const subId = typeof bodyOrder.stripeSubscriptionId === 'string' ? bodyOrder.stripeSubscriptionId : '';
        const existingOrders = authStore.ordersByUser?.[payload.uid] || [];
        const alreadyVerifiedOnServer =
          existingOrders.some((o) => o?.stripeSubscriptionId === subId && o?.status === 'paid') ||
          Object.values(authStore.promoSessions || {}).some(
            (p: any) => p?.subscriptionId === subId && p?.userId === payload.uid
          );

        if (alreadyVerifiedOnServer) {
          verifiedStatus = 'paid';
        } else if (stripeClient && subId.startsWith('sub_') && !subId.startsWith('sub_promo_')) {
          const sub = await stripeClient.subscriptions.retrieve(subId, { expand: ['latest_invoice'] }).catch(() => null);
          const latestInv = sub?.latest_invoice as any;
          const ownsSub =
            sub?.metadata?.userId === payload.uid ||
            String(sub?.metadata?.userEmail || '').toLowerCase() === String(payload.email || '').toLowerCase();
          if (ownsSub && (sub?.status === 'active' || sub?.status === 'trialing' || latestInv?.status === 'paid')) {
            verifiedStatus = 'paid';
          }
        }
        if (verifiedStatus !== 'paid') {
          appendServerAuditLog(req, {
            actorUserId: payload.uid,
            actorEmail: payload.email,
            actorRole: isAdmin ? 'admin' : 'user',
            action: 'unauthorized_access_attempt',
            category: 'subscription',
            severity: 'critical',
            status: 'blocked',
            targetResource: '/api/orders',
            details: `Tentativa bloqueada de criar pedido de cartão marcado como pago sem confirmação (${plan}/${billingCycle}).`,
            metadata: { httpStatus: 403, plan, paymentMethod }
          });
          return res.status(403).json({ error: 'Pagamento com cartão ainda não verificado pelo servidor.' });
        }
      }

      const pricing = resolveServerPlanPricing(plan, billingCycle);
      const currency = String(bodyOrder.currency || (paymentMethod === 'pix' ? 'BRL' : 'USD')).toUpperCase().slice(0, 10);
      const computedAmount =
        typeof bodyOrder.amount === 'number' && Number.isFinite(bodyOrder.amount) && bodyOrder.amount >= 0
          ? isAdmin || verifiedStatus === 'paid'
            ? bodyOrder.amount
            : currency === 'BRL'
            ? Math.round(pricing.baseUSD * 5.4 * 100) / 100
            : pricing.baseUSD
          : pricing.baseUSD;

      const sanitizedOrder = {
        id: String(bodyOrder.id).slice(0, 128),
        orderNumber: String(bodyOrder.orderNumber).slice(0, 60),
        userId: payload.uid,
        userName: String(bodyOrder.userName || userRec?.name || 'Cliente').slice(0, 120),
        userEmail: String(userRec?.email || payload.email || '').slice(0, 180),
        plan,
        billingCycle,
        amount: computedAmount,
        currency,
        paymentMethod,
        status: verifiedStatus,
        stripeSubscriptionId:
          typeof bodyOrder.stripeSubscriptionId === 'string' ? bodyOrder.stripeSubscriptionId.slice(0, 128) : undefined,
        stripePaymentIntentId:
          typeof bodyOrder.stripePaymentIntentId === 'string' ? bodyOrder.stripePaymentIntentId.slice(0, 128) : undefined,
        receiptUrl:
          typeof bodyOrder.receiptUrl === 'string' &&
          (bodyOrder.receiptUrl.startsWith('https://') || bodyOrder.receiptUrl.startsWith('/api/orders/'))
            ? bodyOrder.receiptUrl.slice(0, 500)
            : undefined,
        createdAt: typeof bodyOrder.createdAt === 'string' ? bodyOrder.createdAt.slice(0, 50) : new Date().toISOString(),
        notes: typeof bodyOrder.notes === 'string' ? bodyOrder.notes.slice(0, 500) : ''
      };

      if (!authStore.ordersByUser) {
        authStore.ordersByUser = {};
      }
      const existing = authStore.ordersByUser[payload.uid] || [];
      authStore.ordersByUser[payload.uid] = [
        sanitizedOrder,
        ...existing.filter((o) => o.id !== sanitizedOrder.id)
      ].slice(0, 50);
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: payload.uid,
        actorEmail: sanitizedOrder.userEmail,
        actorRole: isAdmin ? 'admin' : 'user',
        action: 'payment_order_created',
        category: 'subscription',
        severity: 'info',
        status: 'success',
        targetResource: `orders/${sanitizedOrder.id}`,
        details: `Pedido ${sanitizedOrder.orderNumber} registado (${plan}/${billingCycle}, ${paymentMethod}, status=${verifiedStatus}).`,
        metadata: { plan, billingCycle, paymentMethod, status: verifiedStatus, amount: computedAmount, currency }
      });
      return res.status(201).json({ success: true, order: sanitizedOrder });
    } catch (err: any) {
      console.error('Erro em POST /api/orders:', err);
      return res.status(500).json({ error: 'Erro ao registar pedido no servidor.' });
    }
  });

  const memoryPixReceipts = new Map<string, { mimeType: string; buffer: Buffer }>();
  const PIX_RECEIPT_MIME_EXT: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf'
  };

  app.post('/api/orders/:orderId/receipt', (req, res) => {
    try {
      if (!checkUploadRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados uploads. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Autenticação necessária.' });
      }
      const orderId = String(req.params.orderId || '').trim();
      if (!/^[a-zA-Z0-9_-]{3,80}$/.test(orderId)) {
        return res.status(400).json({ error: 'Identificador de pedido inválido.' });
      }
      const cleanEmail = String(payload.email || '').trim().toLowerCase();
      const userOrders = authStore.ordersByUser?.[payload.uid] || [];
      let order = userOrders.find((o) => o?.id === orderId);
      if (!order && cleanEmail) {
        for (const list of Object.values(authStore.ordersByUser || {})) {
          const found = (list || []).find(
            (o) => o?.id === orderId && String(o?.userEmail || '').trim().toLowerCase() === cleanEmail
          );
          if (found) {
            order = found;
            break;
          }
        }
      }
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      const { mimeType, base64Data } = req.body || {};
      const cleanMime = String(mimeType || '').toLowerCase().trim();
      const ext = PIX_RECEIPT_MIME_EXT[cleanMime];
      if (!ext || typeof base64Data !== 'string' || !base64Data.trim()) {
        return res.status(400).json({ error: 'Formato inválido. Envie PNG, JPG, WebP ou PDF.' });
      }
      const stripped = base64Data.replace(/^data:[^;]+;base64,/i, '').trim();
      const buffer = Buffer.from(stripped, 'base64');
      if (!buffer.length || buffer.length > 1_500_000) {
        return res.status(400).json({ error: 'Comprovante excede o limite de 1,5 MB.' });
      }

      memoryPixReceipts.set(orderId, { mimeType: cleanMime, buffer });
      try {
        const receiptsDir = path.join(AUTH_DATA_DIR, 'receipts');
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(receiptsDir, `${orderId}.${ext}`), buffer, { mode: 0o600 });
        fs.writeFileSync(
          path.join(receiptsDir, `${orderId}.meta.json`),
          JSON.stringify({ mimeType: cleanMime, ext }),
          { mode: 0o600 }
        );
      } catch {
        // serverless read-only fallback uses memoryPixReceipts
      }

      const receiptUrl = `/api/orders/${orderId}/receipt`;
      order.receiptUrl = receiptUrl;
      order.updatedAt = new Date().toISOString();
      persistAuthStore();

      return res.json({ success: true, receiptUrl });
    } catch (err) {
      console.error('Erro em POST /api/orders/:orderId/receipt:', err);
      return res.status(500).json({ error: 'Falha ao guardar o comprovante.' });
    }
  });

  app.get('/api/orders/:orderId/receipt', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const orderId = String(req.params.orderId || '').trim();
      if (!/^[a-zA-Z0-9_-]{3,80}$/.test(orderId)) {
        return res.status(400).json({ error: 'Identificador inválido.' });
      }
      const callerRec = resolveAuthenticatedUserRecord(payload);
      const isAdmin =
        callerRec?.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());
      const ownsOrder = (authStore.ordersByUser?.[callerRec?.id || payload.uid] || []).some(
        (o) => o?.id === orderId
      );
      if (!isAdmin && !ownsOrder) {
        return res.status(403).json({ error: 'Acesso negado ao comprovante.' });
      }

      const mem = memoryPixReceipts.get(orderId);
      if (mem) {
        res.setHeader('Content-Type', mem.mimeType);
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.send(mem.buffer);
      }

      const receiptsDir = path.join(AUTH_DATA_DIR, 'receipts');
      const metaPath = path.join(receiptsDir, `${orderId}.meta.json`);
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const filePath = path.join(receiptsDir, `${orderId}.${meta.ext}`);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
          res.setHeader('Cache-Control', 'private, max-age=300');
          return res.send(fs.readFileSync(filePath));
        }
      }

      return res.status(404).json({ error: 'Comprovante não encontrado.' });
    } catch (err) {
      console.error('Erro em GET /api/orders/:orderId/receipt:', err);
      return res.status(500).json({ error: 'Erro ao carregar comprovante.' });
    }
  });

  // -------------------------------------------------------------
  // 9. PRODUCTION ADMIN BACKOFFICE & PUBLIC CONFIG API
  // -------------------------------------------------------------
  function requireAdminSession(req: express.Request, res: express.Response) {
    const token = extractTokenFromRequest(req);
    const payload = token ? verifySessionToken(token) : null;
    if (!payload) {
      appendServerAuditLog(req, {
        action: 'unauthorized_access_attempt',
        category: 'security',
        severity: 'warning',
        status: 'blocked',
        targetResource: req.originalUrl || '/api/admin',
        details: 'Tentativa não autenticada de acesso a rota administrativa protegida.',
        metadata: { httpStatus: 401, method: req.method }
      });
      res.status(401).json({ error: 'Sessão administrativa não autenticada.' });
      return null;
    }
    const userRec = resolveAuthenticatedUserRecord(payload);
    if (userRec?.status === 'suspended') {
      appendServerAuditLog(req, {
        actorUserId: payload.uid,
        actorEmail: payload.email,
        actorRole: userRec.role,
        action: 'unauthorized_access_attempt',
        category: 'security',
        severity: 'critical',
        status: 'blocked',
        targetResource: req.originalUrl || '/api/admin',
        details: 'Conta suspensa tentou executar ação administrativa.',
        metadata: { httpStatus: 403, method: req.method }
      });
      res.status(403).json({ error: 'Conta administrativa suspensa.' });
      return null;
    }
    const isAdm =
      payload.role === 'admin' ||
      userRec?.role === 'admin' ||
      ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());
    if (!isAdm) {
      appendServerAuditLog(req, {
        actorUserId: payload.uid,
        actorEmail: payload.email,
        actorRole: 'user',
        action: 'unauthorized_access_attempt',
        category: 'security',
        severity: 'critical',
        status: 'blocked',
        targetResource: req.originalUrl || '/api/admin',
        details: 'Utilizador padrão tentou aceder a recurso restrito de administração (escalação de privilégios bloqueada).',
        metadata: { httpStatus: 403, method: req.method }
      });
      res.status(403).json({ error: 'Acesso restrito a administradores.' });
      return null;
    }
    return payload;
  }

  // Public runtime config (non-sensitive frontend settings, plans, banners, templates, snippets, locales)
  app.get('/api/public/config', (_req, res) => {
    const cfg = authStore.adminConfig || {};
    return res.json({
      editablePlans: cfg.editablePlans || null,
      platformGovernance: cfg.platformGovernance || null,
      systemBanners: cfg.systemBanners || null,
      adminTemplates: cfg.adminTemplates || null,
      professionSnippets: cfg.professionSnippets || null,
      systemLocales: cfg.systemLocales || null,
      planQuotas: cfg.planQuotas || null
    });
  });

  // Public active coupons validation & usage tracking (only exposes active non-expired vouchers)
  app.get('/api/coupons/public', (_req, res) => {
    const now = Date.now();
    const activeCoupons = (authStore.coupons || []).filter((c) => {
      if (!c?.active) return false;
      if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return false;
      if (Number(c.maxUses) > 0 && Number(c.usedCount) >= Number(c.maxUses)) return false;
      return true;
    });
    return res.json({ coupons: activeCoupons });
  });

  app.post('/api/coupons/:id/use', (req, res) => {
    try {
      if (!checkPaymentRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados pedidos. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Autenticação necessária para utilizar cupom.' });
      }
      const couponId = String(req.params.id || '');
      const list = authStore.coupons || [];
      const idx = list.findIndex((c) => c.id === couponId && c.active);
      if (idx >= 0) {
        const curUsed = Number(list[idx].usedCount) || 0;
        const maxUses = Number(list[idx].maxUses) || 0;
        if (maxUses > 0 && curUsed >= maxUses) {
          return res.status(409).json({ error: 'Este cupom já atingiu o limite máximo de utilizações.' });
        }
        list[idx].usedCount = curUsed + 1;
        list[idx].updatedAt = new Date().toISOString();
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao atualizar uso do cupom.' });
    }
  });

  // Error telemetry intake from client (rate-limited & scrubbed of credentials)
  app.post('/api/error-logs', (req, res) => {
    try {
      if (!checkTelemetryRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados registos de erro. Aguarde um minuto.' });
      }
      const log = req.body || {};
      if (!log.errorMessage) {
        return res.status(400).json({ error: 'errorMessage obrigatório.' });
      }
      const entry = {
        id: String(log.id || `err-${Date.now()}`).slice(0, 128),
        timestamp: typeof log.timestamp === 'string' ? log.timestamp.slice(0, 50) : new Date().toISOString(),
        userEmail: sanitizeTelemetryText(log.userEmail || '', 180),
        operationType: sanitizeTelemetryText(log.operationType || 'unknown', 80),
        errorMessage: sanitizeTelemetryText(log.errorMessage, 1000),
        modelUsed: sanitizeTelemetryText(log.modelUsed || 'n/a', 80),
        resolved: false
      };
      authStore.errorLogs = [entry, ...(authStore.errorLogs || [])].slice(0, 100);
      persistAuthStore();
      return res.status(201).json({ success: true, log: entry });
    } catch {
      return res.status(500).json({ error: 'Erro ao registar log.' });
    }
  });

  // Authenticated user GDPR submission endpoint
  app.post('/api/gdpr/request', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Autenticação necessária para submeter pedido RGPD.' });
      }
      const { requestType, notes } = req.body || {};
      if (!['export_data', 'delete_account'].includes(requestType)) {
        return res.status(400).json({ error: 'Tipo de pedido RGPD inválido.' });
      }
      const reqItem = {
        id: `gdpr-${Date.now()}`,
        userId: payload.uid,
        userEmail: payload.email,
        requestType,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        notes: notes ? String(notes).slice(0, 400) : 'Solicitação submetida pelo titular da conta.'
      };
      authStore.gdprRequests = [reqItem, ...(authStore.gdprRequests || [])].slice(0, 100);
      persistAuthStore();
      return res.status(201).json({ success: true, request: reqItem });
    } catch {
      return res.status(500).json({ error: 'Erro ao registar pedido RGPD.' });
    }
  });

  // Security Audit Logs Intake & Retrieval
  app.post('/api/audit-logs', (req, res) => {
    try {
      if (!checkTelemetryRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados registos de auditoria. Aguarde um minuto.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      const body = req.body || {};

      if (!body.action || !body.targetResource || !body.details) {
        return res.status(400).json({ error: 'action, targetResource e details são obrigatórios.' });
      }

      const requestedAction = String(body.action);
      if (!AUDIT_ALLOWED_ACTIONS.has(requestedAction)) {
        return res.status(400).json({ error: 'Ação de auditoria não reconhecida.' });
      }

      const isAdminCaller = Boolean(
        payload &&
          (payload.role === 'admin' || ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase()))
      );

      // Unauthenticated requests may only log blocked/unauthorized security attempts
      if (!payload && requestedAction !== 'unauthorized_access_attempt' && requestedAction !== 'cv_export_blocked_unauthorized') {
        return res.status(401).json({ error: 'Autenticação necessária para registar esta ação de auditoria.' });
      }

      const entry = appendServerAuditLog(req, {
        id: typeof body.id === 'string' ? body.id : undefined,
        timestamp: typeof body.timestamp === 'string' ? body.timestamp : undefined,
        actorUserId: payload?.uid || 'anonymous',
        actorEmail: payload?.email || 'anonymous',
        actorRole: payload ? (isAdminCaller ? 'admin' : 'user') : 'anonymous',
        action:
          !isAdminCaller && ['admin_user_modified', 'impersonation_event', 'payment_order_status_changed'].includes(requestedAction)
            ? 'unauthorized_access_attempt'
            : requestedAction,
        category: AUDIT_ALLOWED_CATEGORIES.has(body.category) ? body.category : 'security',
        severity: AUDIT_ALLOWED_SEVERITIES.has(body.severity) ? body.severity : 'info',
        status: AUDIT_ALLOWED_STATUSES.has(body.status) ? body.status : 'success',
        targetResource: String(body.targetResource),
        details: String(body.details),
        metadata: body.metadata
      });

      return res.status(201).json({ success: true, log: entry });
    } catch {
      return res.status(500).json({ error: 'Erro ao gravar log de auditoria.' });
    }
  });

  app.get('/api/audit-logs/me', (req, res) => {
    const token = extractTokenFromRequest(req);
    const payload = token ? verifySessionToken(token) : null;
    if (!payload?.uid) {
      return res.status(401).json({ error: 'Sessão não autenticada.' });
    }
    const own = (authStore.auditLogs || [])
      .filter((item) => item?.actorUserId === payload.uid)
      .slice(0, 60);
    return res.json({ auditLogs: own });
  });

  app.get('/api/admin/audit-logs', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    return res.json({ auditLogs: authStore.auditLogs || [] });
  });

  // Public Telemetry Intake (Funnel, Template Selections, Exports, Languages)
  app.post('/api/telemetry/event', (req, res) => {
    try {
      if (!checkTelemetryRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiados eventos de telemetria.' });
      }
      const body = req.body || {};
      const type = String(body.type || '');
      if (type === 'resume_started') {
        recordServerTelemetry({ type: 'resume_started' });
      } else if (type === 'checkout_opened') {
        recordServerTelemetry({ type: 'checkout_opened' });
      } else if (type === 'word_exported') {
        recordServerTelemetry({
          type: 'word_exported',
          templateStyle: typeof body.templateStyle === 'string' ? body.templateStyle : undefined
        });
      } else if (type === 'template_selected' && typeof body.templateStyle === 'string') {
        recordServerTelemetry({ type: 'template_selected', templateStyle: body.templateStyle });
      } else if (type === 'language_switched' && typeof body.language === 'string') {
        recordServerTelemetry({ type: 'language_switched', language: body.language });
      } else {
        return res.status(400).json({ error: 'Evento de telemetria inválido.' });
      }
      return res.status(201).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao registar telemetria.' });
    }
  });

  // Live Gemini Model Health & Latency Probe (Admin Only)
  app.get('/api/admin/ai-health', async (req, res) => {
    if (!requireAdminSession(req, res)) return;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const shouldProbe = String(req.query?.probe || '') === '1';
    if (shouldProbe && ai) {
      const routing = (authStore.adminConfig?.aiRouting || {}) as Record<string, any>;
      const probeModels = Array.from(
        new Set([
          routing.primaryModel || 'gemini-4-hydrogen',
          routing.fallbackModel || 'gemini-3.1-flash-lite',
          'gemini-4-hydrogen',
          'gemini-3.1-flash-lite'
        ])
      ).filter((m) => typeof m === 'string' && m !== 'gemini-flash-latest');

      await Promise.all(
        probeModels.map(async (modelName) => {
          const startedAt = Date.now();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          try {
            await Promise.race([
              ai!.models.generateContent({
                model: modelName,
                contents: 'Reply with OK',
                config: {
                  abortSignal: controller.signal,
                  ...(modelName === 'gemini-4-hydrogen' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
                }
              }),
              new Promise<never>((_, reject) => {
                controller.signal.addEventListener('abort', () => reject(new Error('Probe timeout')), { once: true });
              })
            ]);
            modelCooldownUntil.delete(modelName);
            recordModelStat(modelName, Date.now() - startedAt, true);
          } catch (probeErr: any) {
            recordModelStat(modelName, Date.now() - startedAt, false, probeErr?.message || 'Probe failed');
          } finally {
            clearTimeout(timer);
          }
        })
      );
    }
    return res.json(getAiHealthSnapshot());
  });

  // Admin Overview Snapshot
  app.get('/api/admin/overview', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const users = Object.values(authStore.users).map((u) => sanitizeUser(u));
    const ordersMap = new Map<string, any>();
    Object.values(authStore.ordersByUser || {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((o) => {
          if (o?.id) ordersMap.set(o.id, o);
        });
      }
    });
    const orders = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const supportChatsUnreadCount = Object.values(authStore.supportChats || {}).reduce(
      (sum, th) => sum + (Number(th?.unreadByAdmin) || 0),
      0
    );
    return res.json({
      users,
      orders,
      coupons: authStore.coupons || [],
      config: authStore.adminConfig || {},
      errorLogs: authStore.errorLogs || [],
      gdprRequests: authStore.gdprRequests || [],
      impersonationLogs: authStore.impersonationLogs || [],
      auditLogs: authStore.auditLogs || [],
      telemetry: ensureServerTelemetry(),
      aiHealth: getAiHealthSnapshot(),
      supportChatsUnreadCount
    });
  });

  // Admin User Management
  app.post('/api/admin/users', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    try {
      const { id, name, email, role, status, plan, phone, creditsRemaining, billingCycle, notes, password } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'E-mail válido obrigatório.' });
      }
      const cleanPassword = typeof password === 'string' ? password.trim() : '';
      if (cleanPassword && cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Se definir uma palavra-passe inicial, deve ter pelo menos 6 caracteres.' });
      }
      const existing = findBackendUserByEmail(cleanEmail);
      const uid = id || existing?.id || `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
      const nowIso = new Date().toISOString();
      const targetPlan = ['free', 'pro', 'executive'].includes(plan) ? plan : 'pro';
      let passwordHash = existing?.passwordHash;
      let passwordSalt = existing?.passwordSalt;
      if (cleanPassword) {
        const hashed = hashPassword(cleanPassword);
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
      }
      const record: BackendUserRecord = {
        ...(existing || {}),
        id: uid,
        name: String(name || existing?.name || 'Novo Cliente').trim(),
        email: cleanEmail,
        ...(passwordHash ? { passwordHash, passwordSalt } : {}),
        role: role === 'admin' || ADMIN_EMAILS_BACKEND.has(cleanEmail) ? 'admin' : 'user',
        status: status === 'suspended' ? 'suspended' : 'active',
        plan: targetPlan,
        phone: typeof phone === 'string' ? phone : existing?.phone || '',
        notes: typeof notes === 'string' && notes.trim() ? notes : existing?.notes || 'Cadastrado manualmente pelo admin',
        creditsRemaining:
          typeof creditsRemaining === 'number'
            ? creditsRemaining
            : targetPlan === 'free'
            ? getFreePlanDefaultCredits()
            : 9999,
        creditsUsed: existing?.creditsUsed ?? 0,
        totalCvGenerated: existing?.totalCvGenerated ?? 0,
        billingCycle: normalizeServerCycle(billingCycle),
        authProviders: existing?.authProviders || ['password'],
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso
      };
      authStore.users[uid] = record;
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: adminPayload.uid,
        actorEmail: adminPayload.email,
        actorRole: 'admin',
        action: 'admin_user_modified',
        category: 'admin',
        severity: record.role === 'admin' ? 'warning' : 'info',
        status: 'success',
        targetResource: `users/${record.id}`,
        details: `Administrador criou/atualizou cliente manualmente: ${record.email} (plano=${record.plan}, papel=${record.role}).`
      });
      return res.status(201).json({ success: true, user: sanitizeUser(record) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao criar utilizador.' });
    }
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    try {
      const userId = String(req.params.id || '');
      let record: BackendUserRecord | undefined =
        authStore.users[userId] ||
        Object.values(authStore.users).find((u) => u.id === userId || u.firebaseUid === userId);
      const updates = req.body || {};
      if (!record && updates.email) {
        record = findBackendUserByEmail(String(updates.email));
      }
      if (!record) {
        const cleanEmail = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : '';
        if (cleanEmail || isVercelEnv) {
          const nowIso = new Date().toISOString();
          record = {
            id: userId,
            name: String(updates.name || cleanEmail.split('@')[0] || 'Cliente').trim().slice(0, 120),
            email: cleanEmail,
            role: updates.role === 'admin' ? 'admin' : 'user',
            status: updates.status === 'suspended' ? 'suspended' : 'active',
            plan: ['free', 'pro', 'executive'].includes(updates.plan) ? updates.plan : 'free',
            phone: typeof updates.phone === 'string' ? updates.phone.trim() : '',
            creditsRemaining:
              typeof updates.creditsRemaining === 'number'
                ? updates.creditsRemaining
                : updates.plan === 'executive'
                ? 9999
                : updates.plan === 'pro'
                ? 100
                : getFreePlanDefaultCredits(),
            creditsUsed: 0,
            totalCvGenerated: 0,
            billingCycle: 'monthly',
            authProviders: ['google'],
            firebaseUid: userId,
            createdAt: nowIso,
            updatedAt: nowIso,
            notes: typeof updates.notes === 'string' ? updates.notes : ''
          };
          authStore.users[userId] = record;
        } else {
          return res.status(404).json({ error: 'Utilizador não encontrado no servidor.' });
        }
      }
      const prevPlan = record.plan;
      const prevRole = record.role;
      const prevStatus = record.status;
      if (typeof updates.name === 'string') record.name = updates.name.trim();
      if (typeof updates.phone === 'string') record.phone = updates.phone.trim();
      if (typeof updates.notes === 'string') record.notes = updates.notes;
      if (updates.plan && ['free', 'pro', 'executive'].includes(updates.plan)) {
        record.plan = updates.plan;
        if (typeof updates.creditsRemaining !== 'number') {
          if (updates.plan === 'executive') record.creditsRemaining = 9999;
          else if (updates.plan === 'pro') record.creditsRemaining = Math.max(record.creditsRemaining || 0, 100);
          else if (prevPlan !== 'free') record.creditsRemaining = getFreePlanDefaultCredits();
        }
      }
      if (updates.role && ['admin', 'user'].includes(updates.role)) record.role = updates.role;
      if (updates.status && ['active', 'suspended'].includes(updates.status)) record.status = updates.status;
      if (typeof updates.creditsRemaining === 'number') record.creditsRemaining = updates.creditsRemaining;
      if (typeof updates.creditsUsed === 'number') record.creditsUsed = updates.creditsUsed;
      if (typeof updates.subscriptionExpiresAt === 'string') record.subscriptionExpiresAt = updates.subscriptionExpiresAt;
      record.updatedAt = new Date().toISOString();
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: adminPayload.uid,
        actorEmail: adminPayload.email,
        actorRole: 'admin',
        action: 'admin_user_modified',
        category: 'admin',
        severity: prevRole !== record.role || prevStatus !== record.status ? 'warning' : 'info',
        status: 'success',
        targetResource: `users/${record.id}`,
        details: `Administrador atualizou cliente ${record.email} (plano ${prevPlan}→${record.plan}, papel ${prevRole}→${record.role}, estado ${prevStatus}→${record.status}).`,
        metadata: { targetEmail: record.email, plan: record.plan, role: record.role, status: record.status }
      });
      return res.json({ success: true, user: sanitizeUser(record) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar utilizador.' });
    }
  });

  app.post('/api/admin/users/:id/anonymize', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    const userId = String(req.params.id || '');
    const record = authStore.users[userId];
    if (record) {
      const targetEmail = record.email;
      record.name = 'Utilizador Anonimizado (RGPD)';
      record.email = `anon-${userId.slice(0, 8)}@eliminado.rgpd`;
      record.phone = '';
      record.status = 'suspended';
      record.plan = 'free';
      record.creditsRemaining = 0;
      record.notes = `Conta anonimizada conforme Art. 17 RGPD em ${new Date().toISOString()}`;
      record.updatedAt = new Date().toISOString();
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: adminPayload.uid,
        actorEmail: adminPayload.email,
        actorRole: 'admin',
        action: 'admin_user_modified',
        category: 'admin',
        severity: 'warning',
        status: 'success',
        targetResource: `users/${userId}`,
        details: `Conta ${targetEmail} anonimizada pelo administrador conforme Art. 17 RGPD.`
      });
    }
    return res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    const userId = String(req.params.id || '').trim();
    const queryEmail = String(req.query?.email || req.body?.email || '').trim().toLowerCase();
    const deletedKeys: string[] = [];
    let deletedEmail = authStore.users[userId]?.email || queryEmail || userId;

    for (const [key, rec] of Object.entries(authStore.users)) {
      const recEmail = String(rec?.email || '').trim().toLowerCase();
      const matchesId = key === userId || rec?.id === userId || rec?.firebaseUid === userId;
      const matchesEmail = Boolean(queryEmail && recEmail === queryEmail);
      if (matchesId || matchesEmail) {
        if (rec?.email) deletedEmail = rec.email;
        delete authStore.users[key];
        deletedKeys.push(key);
        if (authStore.resumesByUser) delete authStore.resumesByUser[key];
        if (authStore.ordersByUser) delete authStore.ordersByUser[key];
      }
    }
    if (authStore.resumesByUser && userId) delete authStore.resumesByUser[userId];
    if (authStore.ordersByUser && userId) delete authStore.ordersByUser[userId];
    persistAuthStore();
    appendServerAuditLog(req, {
      actorUserId: adminPayload.uid,
      actorEmail: adminPayload.email,
      actorRole: 'admin',
      action: 'admin_user_modified',
      category: 'admin',
      severity: 'warning',
      status: 'success',
      targetResource: `users/${userId}`,
      details: `Registo de utilizador ${deletedEmail} eliminado pelo administrador.`
    });
    return res.json({ success: true, deletedKeys });
  });

  // Admin Orders Management
  app.post('/api/admin/orders', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    const order = req.body || {};
    if (!order.id || !order.orderNumber) {
      return res.status(400).json({ error: 'Dados do pedido inválidos.' });
    }
    const targetUid = String(order.userId || 'manual');
    if (!authStore.ordersByUser) authStore.ordersByUser = {};
    const existing = authStore.ordersByUser[targetUid] || [];
    authStore.ordersByUser[targetUid] = [order, ...existing.filter((o) => o.id !== order.id)].slice(0, 100);

    // Sync target user's plan if present
    const targetUser = authStore.users[targetUid] || (order.userEmail ? findBackendUserByEmail(order.userEmail) : undefined);
    const normalizedCycle = normalizeServerCycle(order.billingCycle);
    if (targetUser && order.status === 'paid' && ['pro', 'executive'].includes(order.plan)) {
      const days = getServerCycleSpec(normalizedCycle).days;
      targetUser.plan = order.plan;
      targetUser.creditsRemaining = 9999;
      targetUser.billingCycle = normalizedCycle;
      targetUser.subscriptionExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
      targetUser.stripeStatus = 'active';
      targetUser.status = 'active';
      targetUser.updatedAt = new Date().toISOString();
    }
    persistAuthStore();
    appendServerAuditLog(req, {
      actorUserId: adminPayload.uid,
      actorEmail: adminPayload.email,
      actorRole: 'admin',
      action: 'payment_order_created',
      category: 'subscription',
      severity: 'info',
      status: 'success',
      targetResource: `orders/${String(order.id).slice(0, 64)}`,
      details: `Fatura manual ${order.orderNumber} criada pelo admin para ${order.userEmail || targetUid} (${order.plan}).`
    });
    return res.status(201).json({ success: true, order });
  });

  app.patch('/api/admin/orders/:id', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    const orderId = String(req.params.id || '');
    const { status, notes } = req.body || {};
    let updated = false;
    let matchedOrder: any = null;
    Object.values(authStore.ordersByUser || {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((o) => {
          if (o.id === orderId) {
            if (status) o.status = status;
            if (notes) o.notes = notes;
            o.updatedAt = new Date().toISOString();
            matchedOrder = o;
            updated = true;
          }
        });
      }
    });

    if (updated && status === 'paid' && matchedOrder && ['pro', 'executive'].includes(matchedOrder.plan)) {
      const targetUser =
        (matchedOrder.userId && authStore.users[matchedOrder.userId]) ||
        (matchedOrder.userEmail ? findBackendUserByEmail(matchedOrder.userEmail) : undefined);
      if (targetUser) {
        const normalizedCycle = normalizeServerCycle(matchedOrder.billingCycle);
        const days = getServerCycleSpec(normalizedCycle).days;
        targetUser.plan = matchedOrder.plan;
        targetUser.creditsRemaining = 9999;
        targetUser.billingCycle = normalizedCycle;
        targetUser.subscriptionExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
        targetUser.stripeStatus = 'active';
        targetUser.status = 'active';
        targetUser.updatedAt = new Date().toISOString();
      }
    }

    if (updated) {
      persistAuthStore();
      appendServerAuditLog(req, {
        actorUserId: adminPayload.uid,
        actorEmail: adminPayload.email,
        actorRole: 'admin',
        action: 'payment_order_status_changed',
        category: 'subscription',
        severity: status === 'refunded' ? 'warning' : 'info',
        status: 'success',
        targetResource: `orders/${orderId.slice(0, 64)}`,
        details: `Estado da fatura ${matchedOrder?.orderNumber || orderId} alterado para '${status}' (${matchedOrder?.userEmail || 'cliente'}).`,
        metadata: { status: String(status || ''), plan: String(matchedOrder?.plan || '') }
      });
    }
    return res.json({ success: true, updated });
  });

  // Admin Coupons Management
  app.post('/api/admin/coupons', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const coupon = req.body || {};
    if (!coupon.id || !coupon.code) {
      return res.status(400).json({ error: 'Cupom inválido.' });
    }
    authStore.coupons = [coupon, ...(authStore.coupons || []).filter((c) => c.id !== coupon.id)];
    persistAuthStore();
    return res.status(201).json({ success: true, coupon });
  });

  app.patch('/api/admin/coupons/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const couponId = String(req.params.id || '');
    const { active } = req.body || {};
    const idx = (authStore.coupons || []).findIndex((c) => c.id === couponId);
    if (idx >= 0 && authStore.coupons) {
      if (typeof active === 'boolean') authStore.coupons[idx].active = active;
      authStore.coupons[idx].updatedAt = new Date().toISOString();
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.delete('/api/admin/coupons/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const couponId = String(req.params.id || '');
    authStore.coupons = (authStore.coupons || []).filter((c) => c.id !== couponId);
    persistAuthStore();
    return res.json({ success: true });
  });

  // Admin Module Config Persistence
  app.post('/api/admin/config/:scope', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const scope = String(req.params.scope || '');
    const allowedScopes = new Set([
      'promptsConfig',
      'aiRouting',
      'planQuotas',
      'adminTemplates',
      'professionSnippets',
      'systemLocales',
      'systemBanners',
      'editablePlans',
      'platformGovernance'
    ]);
    if (!allowedScopes.has(scope)) {
      return res.status(400).json({ error: 'Escopo de configuração inválido.' });
    }
    if (!authStore.adminConfig) authStore.adminConfig = {};
    authStore.adminConfig[scope] = req.body?.data ?? req.body;
    persistAuthStore();
    return res.json({ success: true, scope });
  });

  // Admin Error Logs & GDPR & Impersonation Audit
  app.patch('/api/admin/error-logs/:id/resolve', (req, res) => {
    const payload = requireAdminSession(req, res);
    if (!payload) return;
    const logId = String(req.params.id || '');
    const idx = (authStore.errorLogs || []).findIndex((l) => l.id === logId);
    if (idx >= 0 && authStore.errorLogs) {
      authStore.errorLogs[idx].resolved = true;
      authStore.errorLogs[idx].resolvedAt = new Date().toISOString();
      authStore.errorLogs[idx].resolvedBy = payload.email;
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.patch('/api/admin/gdpr/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const requestId = String(req.params.id || '');
    const { status, notes } = req.body || {};
    const idx = (authStore.gdprRequests || []).findIndex((r) => r.id === requestId);
    if (idx >= 0 && authStore.gdprRequests) {
      if (status) authStore.gdprRequests[idx].status = status;
      if (status === 'completed') authStore.gdprRequests[idx].completedAt = new Date().toISOString();
      if (notes) authStore.gdprRequests[idx].notes = notes;
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.post('/api/admin/impersonation-logs', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    const entry = req.body || {};
    authStore.impersonationLogs = [entry, ...(authStore.impersonationLogs || [])].slice(0, 100);
    appendServerAuditLog(req, {
      actorUserId: adminPayload.uid,
      actorEmail: adminPayload.email,
      actorRole: 'admin',
      action: 'impersonation_event',
      category: 'admin',
      severity: 'warning',
      status: 'success',
      targetResource: `users/${String(entry.targetUserId || entry.targetUserEmail || 'unknown')}`,
      details: String(entry.details || `Sessão de personificação (${entry.action || 'started'}).`),
      metadata: {
        impersonationAction: String(entry.action || 'started'),
        targetUserEmail: String(entry.targetUserEmail || '')
      }
    });
    persistAuthStore();
    return res.status(201).json({ success: true });
  });

  // =========================================================================
  // SUPPORT CHAT REAL-TIME HUB (REGISTERED USERS <-> ADMINS / MODERATORS)
  // =========================================================================
  interface SupportWsClient {
    ws: WebSocket;
    uid: string;
    email: string;
    isAdmin: boolean;
  }

  const WS_OPEN_STATE = 1;
  const supportWsClients = new Set<SupportWsClient>();

  function broadcastSupportChatEvent(targetUserId: string, payloadObj: Record<string, any>) {
    const serialized = JSON.stringify(payloadObj);
    supportWsClients.forEach((client) => {
      try {
        if (client.ws.readyState !== WS_OPEN_STATE) return;
        if (client.isAdmin || client.uid === targetUserId) {
          client.ws.send(serialized);
        }
      } catch {
        // ignore closed/stale socket errors
      }
    });
  }

  (app as any).__attachSupportChatWs = async (httpServer: http.Server) => {
    const wsPkg = 'ws';
    const { WebSocketServer } = await import(/* @vite-ignore */ wsPkg);
    const wss = new WebSocketServer({ noServer: true });
    httpServer.on('upgrade', (request, socket, head) => {
      try {
        const parsedUrl = new URL(request.url || '/', 'http://localhost');
        if (parsedUrl.pathname !== '/ws/support-chat') {
          return;
        }
        const queryToken = parsedUrl.searchParams.get('token');
        const cookieToken = parseCookies(request.headers.cookie)['ce_session'];
        const token = (queryToken || cookieToken || '').trim();
        const payload = token ? verifySessionToken(token) : null;
        if (!payload?.uid) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        const userRec = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
        if (userRec?.status === 'suspended') {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }
        const isAdminClient = Boolean(
          payload.role === 'admin' ||
            userRec?.role === 'admin' ||
            ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase())
        );
        const clientUid = userRec?.id || payload.uid;
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          const clientObj: SupportWsClient = {
            ws,
            uid: clientUid,
            email: payload.email,
            isAdmin: isAdminClient
          };
          supportWsClients.add(clientObj);
          try {
            ws.send(JSON.stringify({ type: 'connected', uid: clientUid, isAdmin: isAdminClient }));
          } catch {
            // ignore
          }
          ws.on('message', (raw: unknown) => {
            try {
              const msg = JSON.parse(String(raw || ''));
              if (msg?.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
              }
            } catch {
              // ignore malformed keepalive
            }
          });
          ws.on('close', () => {
            supportWsClients.delete(clientObj);
          });
          ws.on('error', () => {
            supportWsClients.delete(clientObj);
          });
        });
      } catch {
        try {
          socket.destroy();
        } catch {
          // ignore
        }
      }
    });
  };

  function getOrBuildThreadForUser(userRec: BackendUserRecord): SupportChatThreadRecord {
    if (!authStore.supportChats) authStore.supportChats = {};
    const existing =
      authStore.supportChats[userRec.id] ||
      Object.values(authStore.supportChats).find(
        (t) =>
          t.userId === userRec.id ||
          (userRec.email && t.userEmail.toLowerCase() === userRec.email.toLowerCase())
      );
    if (existing) {
      // Keep user metadata fresh
      existing.userName = userRec.name || existing.userName;
      existing.userEmail = userRec.email || existing.userEmail;
      if (userRec.avatarUrl) existing.userAvatarUrl = userRec.avatarUrl;
      existing.userPlan = userRec.plan;
      return existing;
    }
    const nowIso = new Date().toISOString();
    const starter: SupportChatThreadRecord = {
      id: userRec.id,
      userId: userRec.id,
      userName: userRec.name || userRec.email.split('@')[0] || 'Utilizador',
      userEmail: userRec.email,
      ...(userRec.avatarUrl ? { userAvatarUrl: userRec.avatarUrl } : {}),
      userPlan: userRec.plan,
      status: 'open',
      lastMessageText: '',
      lastMessageAt: nowIso,
      unreadByUser: 0,
      unreadByAdmin: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: []
    };
    return starter;
  }

  function sanitizeSupportThreadSummary(t: SupportChatThreadRecord, includeMessages = false) {
    return {
      id: t.id,
      userId: t.userId,
      userName: t.userName,
      userEmail: t.userEmail,
      userAvatarUrl: t.userAvatarUrl,
      userPlan: t.userPlan || 'free',
      status: t.status,
      lastMessageText: t.lastMessageText || '',
      lastMessageSenderRole: t.lastMessageSenderRole,
      lastMessageAt: t.lastMessageAt,
      unreadByUser: Number(t.unreadByUser) || 0,
      unreadByAdmin: Number(t.unreadByAdmin) || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      ...(includeMessages ? { messages: Array.isArray(t.messages) ? t.messages : [] } : {})
    };
  }

  // Registered User: Fetch own support chat thread & messages
  app.get('/api/support-chat/thread', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Apenas utilizadores registados podem aceder ao chat de suporte.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      if (!userRec || userRec.status === 'suspended') {
        return res.status(403).json({ error: 'Conta indisponível ou suspensa.' });
      }
      const thread = getOrBuildThreadForUser(userRec);
      return res.json({ thread: sanitizeSupportThreadSummary(thread, true) });
    } catch {
      return res.status(500).json({ error: 'Erro ao carregar conversa de suporte.' });
    }
  });

  // Registered User: Send message to Admin / Moderator
  app.post('/api/support-chat/messages', (req, res) => {
    try {
      if (!checkTelemetryRateLimit(req)) {
        return res.status(429).json({ error: 'Muitas mensagens seguidas. Aguarde um momento.' });
      }
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Apenas utilizadores registados podem enviar mensagens ao suporte.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      if (!userRec || userRec.status === 'suspended') {
        return res.status(403).json({ error: 'Conta indisponível ou suspensa.' });
      }
      const rawText = String(req.body?.text || '').trim();
      if (!rawText) {
        return res.status(400).json({ error: 'Escreva uma mensagem antes de enviar.' });
      }
      const cleanText = rawText.slice(0, 2000);
      const nowIso = new Date().toISOString();

      if (!authStore.supportChats) authStore.supportChats = {};
      const thread = getOrBuildThreadForUser(userRec);
      const msg: SupportChatMessageRecord = {
        id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        threadId: thread.id,
        senderId: userRec.id,
        senderName: userRec.name || userRec.email,
        senderRole: 'user',
        text: cleanText,
        createdAt: nowIso
      };

      thread.messages = [...(thread.messages || []), msg].slice(-250);
      thread.status = 'open';
      thread.lastMessageText = cleanText.slice(0, 500);
      thread.lastMessageSenderRole = 'user';
      thread.lastMessageAt = nowIso;
      thread.updatedAt = nowIso;
      thread.unreadByAdmin = (Number(thread.unreadByAdmin) || 0) + 1;
      thread.unreadByUser = 0;

      authStore.supportChats[thread.id] = thread;
      persistAuthStore();

      const fullThread = sanitizeSupportThreadSummary(thread, true);
      broadcastSupportChatEvent(thread.userId, {
        type: 'support_chat_update',
        action: 'message_created',
        thread: fullThread,
        message: msg
      });

      return res.status(201).json({ success: true, thread: fullThread, message: msg });
    } catch {
      return res.status(500).json({ error: 'Erro ao enviar mensagem de suporte.' });
    }
  });

  // Registered User: Mark admin replies as read
  app.post('/api/support-chat/read', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const userRec = resolveAuthenticatedUserRecord(payload);
      if (!userRec) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }
      const thread = getOrBuildThreadForUser(userRec);
      if (authStore.supportChats?.[thread.id]) {
        authStore.supportChats[thread.id].unreadByUser = 0;
        authStore.supportChats[thread.id].updatedAt = new Date().toISOString();
        persistAuthStore();
        broadcastSupportChatEvent(thread.userId, {
          type: 'support_chat_update',
          action: 'read_by_user',
          thread: sanitizeSupportThreadSummary(authStore.supportChats[thread.id], true)
        });
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao marcar mensagens como lidas.' });
    }
  });

  // Admin / Moderator: List all support threads
  app.get('/api/admin/support-chat/threads', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const threads = Object.values(authStore.supportChats || {})
      .filter((t) => t && Array.isArray(t.messages) && t.messages.length > 0)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .map((t) => sanitizeSupportThreadSummary(t, true));
    const unreadTotal = threads.reduce((acc, t) => acc + (t.unreadByAdmin || 0), 0);
    return res.json({ threads, unreadTotal });
  });

  // Admin / Moderator: Send reply to a user's support thread
  app.post('/api/admin/support-chat/:threadId/messages', (req, res) => {
    const adminPayload = requireAdminSession(req, res);
    if (!adminPayload) return;
    try {
      const threadId = String(req.params.threadId || '').trim();
      if (!authStore.supportChats) authStore.supportChats = {};
      let thread = authStore.supportChats[threadId];

      // Allow admin to initiate or reply to a registered user even if threadId is user.id or cold serverless Lambda
      if (!thread) {
        const targetUser =
          authStore.users[threadId] ||
          Object.values(authStore.users).find((u) => u.id === threadId || u.firebaseUid === threadId);
        if (targetUser) {
          thread = getOrBuildThreadForUser(targetUser);
          authStore.supportChats[thread.id] = thread;
        } else if (isVercelEnv && req.body?.userMeta && (req.body.userMeta.userEmail || req.body.userMeta.userName)) {
          const meta = req.body.userMeta;
          const nowInit = new Date().toISOString();
          thread = {
            id: threadId,
            userId: String(meta.userId || threadId).slice(0, 128),
            userName: String(meta.userName || meta.userEmail || 'Utilizador').slice(0, 120),
            userEmail: String(meta.userEmail || '').slice(0, 180),
            userAvatarUrl: typeof meta.userAvatarUrl === 'string' ? meta.userAvatarUrl.slice(0, 500) : undefined,
            userPlan: ['free', 'pro', 'executive'].includes(meta.userPlan) ? meta.userPlan : 'free',
            status: 'open',
            lastMessageText: '',
            lastMessageAt: nowInit,
            unreadByUser: 0,
            unreadByAdmin: 0,
            createdAt: nowInit,
            updatedAt: nowInit,
            messages: []
          };
          authStore.supportChats[thread.id] = thread;
        } else {
          return res.status(404).json({ error: 'Conversa ou utilizador não encontrado.' });
        }
      }

      const rawText = String(req.body?.text || '').trim();
      if (!rawText) {
        return res.status(400).json({ error: 'Escreva uma resposta antes de enviar.' });
      }
      const cleanText = rawText.slice(0, 2000);
      const adminUser = authStore.users[adminPayload.uid] || findBackendUserByEmail(adminPayload.email);
      const nowIso = new Date().toISOString();

      const msg: SupportChatMessageRecord = {
        id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        threadId: thread.id,
        senderId: adminPayload.uid,
        senderName: adminUser?.name ? `${adminUser.name} (Admin)` : 'Equipa de Suporte',
        senderRole: 'admin',
        text: cleanText,
        createdAt: nowIso
      };

      thread.messages = [...(thread.messages || []), msg].slice(-250);
      thread.status = 'open';
      thread.lastMessageText = cleanText.slice(0, 500);
      thread.lastMessageSenderRole = 'admin';
      thread.lastMessageAt = nowIso;
      thread.updatedAt = nowIso;
      thread.unreadByUser = (Number(thread.unreadByUser) || 0) + 1;
      thread.unreadByAdmin = 0;

      // Also push an in-app notification bell entry for the user
      if (!authStore.notificationsByUser) authStore.notificationsByUser = {};
      const existingNotifs = authStore.notificationsByUser[thread.userId] || [];
      authStore.notificationsByUser[thread.userId] = [
        {
          id: `ntf_chat_${Date.now()}`,
          userId: thread.userId,
          eventType: 'resume_update',
          title: 'Nova resposta do Suporte',
          message: cleanText.slice(0, 220),
          channelSystem: true,
          channelEmail: false,
          emailDeliveryStatus: 'not_requested',
          read: false,
          createdAt: nowIso,
          targetResource: 'support_chat'
        },
        ...existingNotifs
      ].slice(0, 40);

      persistAuthStore();

      const fullThread = sanitizeSupportThreadSummary(thread, true);
      broadcastSupportChatEvent(thread.userId, {
        type: 'support_chat_update',
        action: 'admin_replied',
        thread: fullThread,
        message: msg
      });

      return res.status(201).json({ success: true, thread: fullThread, message: msg });
    } catch {
      return res.status(500).json({ error: 'Erro ao enviar resposta administrativa.' });
    }
  });

  // Admin / Moderator: Mark thread as read by admin
  app.post('/api/admin/support-chat/:threadId/read', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const threadId = String(req.params.threadId || '').trim();
    const thread = authStore.supportChats?.[threadId];
    if (thread) {
      thread.unreadByAdmin = 0;
      thread.updatedAt = new Date().toISOString();
      persistAuthStore();
      broadcastSupportChatEvent(thread.userId, {
        type: 'support_chat_update',
        action: 'read_by_admin',
        thread: sanitizeSupportThreadSummary(thread, true)
      });
    }
    return res.json({ success: true });
  });

  // Admin / Moderator: Update thread status ('open' | 'resolved')
  app.patch('/api/admin/support-chat/:threadId', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const threadId = String(req.params.threadId || '').trim();
    const thread = authStore.supportChats?.[threadId];
    if (!thread) {
      return res.status(404).json({ error: 'Conversa não encontrada.' });
    }
    const nextStatus = req.body?.status === 'resolved' ? 'resolved' : 'open';
    thread.status = nextStatus;
    thread.unreadByAdmin = 0;
    thread.updatedAt = new Date().toISOString();
    persistAuthStore();
    const fullThread = sanitizeSupportThreadSummary(thread, true);
    broadcastSupportChatEvent(thread.userId, {
      type: 'support_chat_update',
      action: 'status_changed',
      thread: fullThread
    });
    return res.json({ success: true, thread: fullThread });
  });

  // =========================================================================
  // MULTI-PORTAL LIVE JOB AGGREGATOR & CV PROFILE MATCHING
  // Sources: Radar de Vagas, LinkedIn Jobs, Remotive, Arbeitnow, Jobicy, RemoteOK
  // + Pre-filled tailored links for Indeed, Glassdoor, Gupy, InfoJobs, Wellfound
  // =========================================================================
  const RADAR_BASE_URL = 'https://radar-de-vagas.fly.dev';
  const radarCache = new Map<string, { expiresAt: number; payload: any }>();

  const JOB_STOPWORDS = new Set([
    'para', 'como', 'sobre', 'entre', 'com', 'sem', 'por', 'dos', 'das', 'nos', 'nas', 'uma', 'uns', 'umas',
    'que', 'mais', 'muito', 'alta', 'alto', 'nivel', 'area', 'setor', 'experiencia', 'profissional', 'anos',
    'gestao', 'equipa', 'equipe', 'atendimento', 'trabalho', 'atuacao', 'foco', 'resultados', 'empresa',
    'empresas', 'processos', 'projetos', 'controle', 'desenvolvimento', 'planejamento', 'coordenacao',
    'with', 'from', 'that', 'this', 'have', 'will', 'your', 'about', 'into', 'over', 'year', 'years',
    'work', 'working', 'team', 'experience', 'role', 'skills', 'using', 'based', 'strong', 'proven',
    'senior', 'junior', 'pleno', 'lead', 'specialist', 'especialista', 'analista', 'assistente', 'auxiliar',
    'and', 'the', 'for', 'are', 'los', 'las', 'con', 'del', 'una', 'por', 'sus', 'esta', 'como'
  ]);

  const PT_EN_SYNONYM_MAP: Record<string, string[]> = {
    desenvolvedor: ['developer', 'engineer', 'software'],
    programador: ['developer', 'programmer', 'engineer'],
    engenheiro: ['engineer', 'engineering'],
    engenharia: ['engineering', 'engineer'],
    software: ['software', 'developer', 'engineer'],
    frontend: ['frontend', 'front-end', 'react', 'typescript'],
    backend: ['backend', 'back-end', 'node', 'python', 'java'],
    fullstack: ['fullstack', 'full-stack', 'developer'],
    dados: ['data', 'analytics', 'bi', 'sql'],
    analista: ['analyst', 'analytics'],
    produto: ['product', 'pm'],
    projetos: ['project', 'program', 'scrum', 'agile'],
    projeto: ['project', 'program'],
    gerente: ['manager', 'lead', 'head'],
    gestor: ['manager', 'director', 'lead'],
    diretor: ['director', 'head', 'vp'],
    financeiro: ['finance', 'financial', 'accounting', 'fintech'],
    financas: ['finance', 'financial', 'treasury'],
    contabilidade: ['accounting', 'accountant', 'finance'],
    faturacao: ['billing', 'invoicing', 'finance', 'ap'],
    pagamentos: ['payments', 'billing', 'fintech'],
    seguranca: ['security', 'cybersecurity', 'infosec'],
    nuvem: ['cloud', 'aws', 'azure', 'gcp', 'devops'],
    infraestrutura: ['infrastructure', 'devops', 'sre', 'cloud'],
    inteligencia: ['ai', 'artificial intelligence', 'ml'],
    design: ['design', 'ui', 'ux', 'product design'],
    marketing: ['marketing', 'growth', 'seo', 'content'],
    vendas: ['sales', 'account executive', 'business development'],
    comercial: ['sales', 'commercial', 'business development'],
    suporte: ['support', 'help desk', 'service desk', 'customer'],
    cliente: ['customer', 'success', 'support'],
    clientes: ['customer', 'success', 'account'],
    operacoes: ['operations', 'ops', 'logistics'],
    logistica: ['logistics', 'supply chain', 'operations'],
    humanos: ['hr', 'people', 'talent', 'recruiting'],
    recrutamento: ['recruiting', 'talent', 'hr'],
    juridico: ['legal', 'counsel', 'compliance'],
    conformidade: ['compliance', 'audit', 'risk', 'governance'],
    auditoria: ['audit', 'compliance', 'finance'],
    qualidade: ['qa', 'quality', 'testing'],
    testes: ['qa', 'testing', 'automation'],
    automacao: ['automation', 'rpa', 'devops'],
    erp: ['sap', 'erp', 'oracle', 'netsuite'],
    sap: ['sap', 'erp'],
    banco: ['database', 'sql', 'dba'],
    redes: ['network', 'security', 'infrastructure'],
    saude: ['health', 'healthcare', 'medical'],
    educacao: ['education', 'learning', 'training'],
    remoto: ['remote']
  };

  function normalizeTextToken(raw: string): string {
    return (raw || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9+#.\-\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function decodeHtmlEntities(str: string): string {
    return (str || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripHtmlTags(html: string): string {
    return decodeHtmlTagsAndWhitespace(decodeHtmlEntities(html || ''));
  }

  function decodeHtmlTagsAndWhitespace(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokenizeMeaningful(raw: string): string[] {
    const norm = normalizeTextToken(raw);
    if (!norm) return [];
    return norm
      .split(/[\s,/|;]+/)
      .map((t) => t.replace(/^\.+|\.+$/g, '').trim())
      .filter((t) => t.length >= 2 && !JOB_STOPWORDS.has(t));
  }

  function formatSalaryField(salary: any, fallbackCurrency?: string, fallbackPeriod?: string): string | null {
    if (salary == null) return null;
    if (typeof salary === 'string') return salary.trim() || null;
    if (typeof salary === 'number' && Number.isFinite(salary) && salary > 0) {
      const curPrefix = fallbackCurrency ? `${fallbackCurrency.toUpperCase()} ` : '';
      return `${curPrefix}${salary.toLocaleString('pt-PT')}${fallbackPeriod || ''}`;
    }
    if (typeof salary === 'object') {
      const { min, max, currency: cur, period } = salary as {
        min?: number | null;
        max?: number | null;
        currency?: string | null;
        period?: string | null;
      };
      const periodMap: Record<string, string> = {
        year: '/ano',
        annual: '/ano',
        yearly: '/ano',
        month: '/mês',
        monthly: '/mês',
        hour: '/hora',
        hourly: '/hora',
        day: '/dia',
        week: '/semana'
      };
      const effPeriod = period || fallbackPeriod;
      const pSuffix = effPeriod ? periodMap[String(effPeriod).toLowerCase()] || `/${effPeriod}` : '';
      const effCur = cur || fallbackCurrency;
      const curPrefix = effCur ? `${String(effCur).toUpperCase()} ` : '';
      const minNum = typeof min === 'number' && min > 0 ? min : null;
      const maxNum = typeof max === 'number' && max > 0 ? max : null;
      if (minNum && maxNum && minNum !== maxNum) {
        return `${curPrefix}${minNum.toLocaleString('pt-PT')} – ${maxNum.toLocaleString('pt-PT')}${pSuffix}`;
      }
      if (minNum || maxNum) {
        const val = (minNum || maxNum) as number;
        return `${curPrefix}${val.toLocaleString('pt-PT')}${pSuffix}`;
      }
    }
    return null;
  }

  async function fetchCachedExternal(
    cacheKey: string,
    url: string,
    mode: 'json' | 'text' = 'json',
    ttlMs: number = 3 * 60 * 1000,
    timeoutMs: number = 6000
  ): Promise<any> {
    const cached = radarCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: mode === 'json' ? 'application/json' : 'text/html,application/xhtml+xml',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });
      if (!resp.ok) {
        throw new Error(`${url} respondeu HTTP ${resp.status}`);
      }
      const payload = mode === 'json' ? await resp.json() : await resp.text();
      radarCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        payload
      });
      if (radarCache.size > 120) {
        const oldestKey = radarCache.keys().next().value;
        if (oldestKey) radarCache.delete(oldestKey);
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  function fetchRadarApiJson(pathWithQuery: string): Promise<any> {
    return fetchCachedExternal(`radar:${pathWithQuery}`, `${RADAR_BASE_URL}${pathWithQuery}`, 'json', 2 * 60 * 1000, 6500);
  }

  async function fetchLinkedInGuestJobs(keywords: string, location?: string): Promise<any[]> {
    if (!keywords || !keywords.trim()) return [];
    const params = new URLSearchParams({ keywords: keywords.trim(), start: '0' });
    if (location && location.trim()) {
      params.set('location', location.trim());
    }
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
    const html: string = await fetchCachedExternal(`linkedin:${params.toString()}`, url, 'text', 4 * 60 * 1000, 5500);
    const items: any[] = [];
    const liMatches = html.match(/<li>[\s\S]*?<\/li>/gi) || [];
    for (const block of liMatches) {
      const urnMatch = block.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i);
      const hrefMatch = block.match(/<a[^>]+class="[^"]*base-card__full-link[^"]*"[^>]+href="([^"]+)"/i);
      const titleMatch = block.match(/<h3[^>]+class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const companyMatch = block.match(/<h4[^>]+class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const locMatch = block.match(/<span[^>]+class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);

      const jobId = urnMatch?.[1];
      const title = stripHtmlTags(titleMatch?.[1] || '');
      const company = stripHtmlTags(companyMatch?.[1] || '');
      const applyHref = decodeHtmlEntities(hrefMatch?.[1] || '');
      if (!title || !company || !applyHref) continue;

      const locText = stripHtmlTags(locMatch?.[1] || '');
      const isRemote = /remote|remoto|teletrabalho|anywhere/i.test(`${title} ${locText}`);
      const isHybrid = /hybrid|hibrido|híbrido/i.test(`${title} ${locText}`);

      items.push({
        id: `linkedin:${jobId || encodeURIComponent(applyHref.slice(0, 80))}`,
        title,
        company,
        workplace: isRemote ? 'remote' : isHybrid ? 'hybrid' : 'onsite',
        locations: locText ? [locText] : [],
        allowedCountries: [],
        category: null,
        seniority: null,
        salary: null,
        skills: [],
        tags: [],
        descriptionSnippet: '',
        sourcePortal: 'linkedin',
        sourceName: 'LinkedIn',
        postedAt: timeMatch?.[1] ? `${timeMatch[1]}T12:00:00.000Z` : new Date().toISOString(),
        applyUrl: applyHref,
        portalUrl: applyHref
      });
    }
    return items;
  }

  function detectNormalizedContractType(rawList: any[], title?: string, snippet?: string): string | null {
    const combinedRaw = [
      ...(Array.isArray(rawList) ? rawList.map((x) => String(x || '')) : []),
      String(title || ''),
      String(snippet || '').slice(0, 350)
    ]
      .join(' ')
      .toLowerCase();

    if (/\b(intern|internship|estagio|estágio|trainee|apprentice)\b/i.test(combinedRaw)) {
      return 'internship';
    }
    if (/\b(part[\s_-]?time|meio[\s_-]?periodo|meio[\s_-]?período)\b/i.test(combinedRaw)) {
      return 'part_time';
    }
    if (/\b(contract|contractor|freelance|freelancer|pj|b2b|temporar[yi]|consultant)\b/i.test(combinedRaw)) {
      return 'contract';
    }
    if (/\b(full[\s_-]?time|permanent|tempo[\s_-]?integral|clt|efetivo|indefinite)\b/i.test(combinedRaw)) {
      return 'full_time';
    }
    return null;
  }

  async function fetchRemotiveJobs(searchTerm?: string): Promise<{ jobs: any[]; total: number }> {
    const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}&limit=50` : '?limit=60';
    const data = await fetchCachedExternal(`remotive:${q}`, `https://remotive.com/api/remote-jobs${q}`, 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data?.jobs) ? data.jobs : [];
    const normalized = list.map((j: any) => {
      const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
      return {
        id: `remotive:${j.id}`,
        title: String(j.title || ''),
        company: String(j.company_name || ''),
        workplace: 'remote',
        locations: j.candidate_required_location ? [String(j.candidate_required_location)] : ['Worldwide'],
        allowedCountries: [],
        category: j.category ? String(j.category) : null,
        seniority: null,
        employmentType: detectNormalizedContractType([j.job_type], j.title, desc),
        salary: formatSalaryField(j.salary),
        skills: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        tags: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        descriptionSnippet: desc,
        sourcePortal: 'remotive',
        sourceName: 'Remotive',
        postedAt: j.publication_date || null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
    return { jobs: normalized, total: Number(data?.['total-job-count'] || data?.['job-count'] || normalized.length) };
  }

  async function fetchArbeitnowJobs(): Promise<any[]> {
    const data = await fetchCachedExternal('arbeitnow:p1', 'https://www.arbeitnow.com/api/job-board-api', 'json', 5 * 60 * 1000, 6500);
    const list = Array.isArray(data?.data) ? data.data.slice(0, 120) : [];
    return list.map((j: any) => {
      const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
      const types = Array.isArray(j.job_types) ? j.job_types.map((t: any) => String(t)) : [];
      return {
        id: `arbeitnow:${j.slug}`,
        title: String(j.title || ''),
        company: String(j.company_name || ''),
        workplace: j.remote ? 'remote' : 'onsite',
        locations: j.location ? [String(j.location)] : [],
        allowedCountries: [],
        category: null,
        seniority: null,
        employmentType: detectNormalizedContractType(types, j.title, desc),
        salary: null,
        skills: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        tags: types,
        descriptionSnippet: desc,
        sourcePortal: 'arbeitnow',
        sourceName: 'Arbeitnow',
        postedAt: typeof j.created_at === 'number' ? new Date(j.created_at * 1000).toISOString() : null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
  }

  async function fetchJobicyJobs(tag?: string): Promise<any[]> {
    const q = tag ? `?count=40&tag=${encodeURIComponent(tag)}` : '?count=50';
    const data = await fetchCachedExternal(`jobicy:${q}`, `https://jobicy.com/api/v2/remote-jobs${q}`, 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data?.jobs) ? data.jobs : [];
    return list.map((j: any) => {
      const desc = stripHtmlTags(String(j.jobDescription || j.jobExcerpt || '')).slice(0, 2600);
      const types = Array.isArray(j.jobType) ? j.jobType.map((t: any) => String(t)) : [];
      const titleStr = decodeHtmlEntities(String(j.jobTitle || ''));
      return {
        id: `jobicy:${j.id}`,
        title: titleStr,
        company: decodeHtmlEntities(String(j.companyName || '')),
        workplace: 'remote',
        locations: j.jobGeo ? [String(j.jobGeo)] : ['Worldwide'],
        allowedCountries: [],
        category: Array.isArray(j.jobIndustry) ? j.jobIndustry.map((x: any) => decodeHtmlEntities(String(x))).join(', ') : null,
        seniority: j.jobLevel && j.jobLevel !== 'Any' ? String(j.jobLevel).toLowerCase() : null,
        employmentType: detectNormalizedContractType(types, titleStr, desc),
        salary: formatSalaryField(
          { min: j.salaryMin, max: j.salaryMax, currency: j.salaryCurrency, period: j.salaryPeriod }
        ),
        skills: [],
        tags: types,
        descriptionSnippet: desc,
        sourcePortal: 'jobicy',
        sourceName: 'Jobicy',
        postedAt: j.pubDate || null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
  }

  async function fetchRemoteOkJobs(): Promise<any[]> {
    const data = await fetchCachedExternal('remoteok:all', 'https://remoteok.com/api', 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data) ? data.slice(1, 100) : [];
    return list
      .filter((j: any) => j && j.position && j.company)
      .map((j: any) => {
        const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
        const tags = Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [];
        return {
          id: `remoteok:${j.id || j.slug}`,
          title: String(j.position || ''),
          company: String(j.company || ''),
          workplace: 'remote',
          locations: j.location ? [String(j.location)] : ['Worldwide'],
          allowedCountries: [],
          category: null,
          seniority: null,
          employmentType: detectNormalizedContractType(tags, j.position, desc),
          salary: formatSalaryField({ min: j.salary_min, max: j.salary_max, currency: 'USD', period: 'year' }),
          skills: tags,
          tags,
          descriptionSnippet: desc,
          sourcePortal: 'remoteok',
          sourceName: 'RemoteOK',
          postedAt: j.date || (typeof j.epoch === 'number' ? new Date(j.epoch * 1000).toISOString() : null),
          applyUrl: String(j.apply_url || j.url || ''),
          portalUrl: String(j.url || '')
        };
      });
  }

  const COUNTRY_PREFERENCE_RULES: Record<
    string,
    {
      label: string;
      linkedInLocation: string;
      indeedUrl: string;
      hints: string[];
      countryCodes: string[];
    }
  > = {
    remoto_global: {
      label: 'Remoto Global',
      linkedInLocation: '',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['worldwide', 'anywhere', 'global', 'remote'],
      countryCodes: []
    },
    brasil: {
      label: 'Brasil',
      linkedInLocation: 'Brazil',
      indeedUrl: 'https://br.indeed.com/jobs',
      hints: ['br', 'brazil', 'brasil', 'sao paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'latam', 'south america', 'americas'],
      countryCodes: ['br']
    },
    portugal: {
      label: 'Portugal',
      linkedInLocation: 'Portugal',
      indeedUrl: 'https://pt.indeed.com/jobs',
      hints: ['pt', 'portugal', 'lisboa', 'lisbon', 'porto', 'coimbra', 'braga', 'europe', 'eu', 'emea'],
      countryCodes: ['pt']
    },
    angola: {
      label: 'Angola',
      linkedInLocation: 'Angola',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['ao', 'angola', 'luanda', 'benguela', 'africa', 'emea'],
      countryCodes: ['ao']
    },
    espanha: {
      label: 'Espanha',
      linkedInLocation: 'Spain',
      indeedUrl: 'https://es.indeed.com/jobs',
      hints: ['es', 'spain', 'espanha', 'madrid', 'barcelona', 'europe', 'eu', 'emea'],
      countryCodes: ['es']
    },
    reino_unido: {
      label: 'Reino Unido',
      linkedInLocation: 'United Kingdom',
      indeedUrl: 'https://uk.indeed.com/jobs',
      hints: ['gb', 'uk', 'united kingdom', 'reino unido', 'london', 'manchester', 'england', 'scotland', 'europe', 'emea'],
      countryCodes: ['gb', 'uk']
    },
    alemanha: {
      label: 'Alemanha',
      linkedInLocation: 'Germany',
      indeedUrl: 'https://de.indeed.com/jobs',
      hints: ['de', 'germany', 'alemanha', 'berlin', 'munich', 'frankfurt', 'hamburg', 'europe', 'eu', 'emea'],
      countryCodes: ['de']
    },
    franca: {
      label: 'França',
      linkedInLocation: 'France',
      indeedUrl: 'https://fr.indeed.com/jobs',
      hints: ['fr', 'france', 'franca', 'paris', 'lyon', 'europe', 'eu', 'emea'],
      countryCodes: ['fr']
    },
    estados_unidos: {
      label: 'Estados Unidos',
      linkedInLocation: 'United States',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['us', 'usa', 'united states', 'estados unidos', 'new york', 'san francisco', 'austin', 'north america', 'americas'],
      countryCodes: ['us']
    },
    canada: {
      label: 'Canadá',
      linkedInLocation: 'Canada',
      indeedUrl: 'https://ca.indeed.com/jobs',
      hints: ['ca', 'canada', 'toronto', 'vancouver', 'montreal', 'north america', 'americas'],
      countryCodes: ['ca']
    },
    europa: {
      label: 'União Europeia',
      linkedInLocation: 'European Union',
      indeedUrl: 'https://pt.indeed.com/jobs',
      hints: ['eu', 'europe', 'europa', 'emea', 'portugal', 'spain', 'germany', 'france', 'netherlands', 'ireland', 'poland', 'italy', 'uk'],
      countryCodes: ['pt', 'es', 'de', 'fr', 'nl', 'ie', 'pl', 'it', 'be', 'at', 'se', 'fi', 'dk']
    }
  };

  app.post('/api/jobs/match', async (req, res) => {
    try {
      if (!checkJobsRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas pesquisas em sequência. Aguarde um minuto.' });
      }
      const {
        cv,
        search = '',
        workplace = 'all',
        source = 'all',
        preferences
      } = (req.body || {}) as {
        cv?: any;
        search?: string;
        workplace?: string;
        source?: string;
        preferences?: {
          countries?: string[];
          targetRoles?: string[];
          contractTypes?: string[];
        };
      };

      const prefCountries = Array.isArray(preferences?.countries)
        ? preferences!.countries.map((c) => String(c).trim()).filter(Boolean)
        : [];
      const prefRoles = Array.isArray(preferences?.targetRoles)
        ? preferences!.targetRoles.map((r) => String(r).trim()).filter(Boolean)
        : [];
      const prefContracts = Array.isArray(preferences?.contractTypes)
        ? preferences!.contractTypes.map((t) => String(t).trim()).filter(Boolean)
        : [];

      const personalTitle = String(cv?.personalDetails?.title || '');
      const personalLocation = String(cv?.personalDetails?.location || '');
      const summary = String(cv?.summary || '');
      const competenciesText = Array.isArray(cv?.competencies)
        ? cv.competencies.map((c: any) => `${c?.category || ''} ${c?.description || ''}`).join(' ')
        : '';
      const experienceRoles = Array.isArray(cv?.experiences)
        ? cv.experiences.slice(0, 4).map((e: any) => String(e?.role || '')).join(' ')
        : '';
      const experienceHighlights = Array.isArray(cv?.experiences)
        ? cv.experiences
            .slice(0, 4)
            .flatMap((e: any) => (Array.isArray(e?.highlights) ? e.highlights.slice(0, 4) : []))
            .join(' ')
        : '';

      const prefRoleTokens = tokenizeMeaningful(prefRoles.join(' '));
      const titleTokensRaw = tokenizeMeaningful(`${personalTitle} ${experienceRoles}`);
      const skillTokensRaw = tokenizeMeaningful(`${competenciesText} ${summary} ${experienceHighlights}`);

      const weightedTerms = new Map<string, { label: string; weight: number; isRole: boolean }>();

      const addTerm = (token: string, weight: number, isRole: boolean, label?: string) => {
        const clean = token.trim();
        if (!clean || clean.length < 2 || JOB_STOPWORDS.has(clean)) return;
        const existing = weightedTerms.get(clean);
        if (!existing || existing.weight < weight) {
          weightedTerms.set(clean, { label: label || clean, weight, isRole });
        }
        const synonyms = PT_EN_SYNONYM_MAP[clean];
        if (synonyms) {
          for (const syn of synonyms) {
            const synClean = normalizeTextToken(syn);
            const synEx = weightedTerms.get(synClean);
            if (!synEx || synEx.weight < weight * 0.92) {
              weightedTerms.set(synClean, {
                label: syn,
                weight: weight * 0.92,
                isRole
              });
            }
          }
        }
      };

      // User-configured target roles carry highest priority weight
      prefRoleTokens.forEach((tok) => addTerm(tok, 4.0, true));
      prefRoles.forEach((rolePhrase) => {
        const normPhrase = normalizeTextToken(rolePhrase);
        if (normPhrase.length >= 2) {
          weightedTerms.set(normPhrase, { label: rolePhrase, weight: 4.5, isRole: true });
        }
      });

      titleTokensRaw.forEach((tok, idx) => addTerm(tok, idx < 4 ? 3.2 : 2.5, true));
      skillTokensRaw.forEach((tok, idx) => addTerm(tok, idx < 18 ? 2.0 : 1.35, false));

      const exactCompTerms: string[] = Array.isArray(cv?.competencies)
        ? cv.competencies
            .map((c: any) => normalizeTextToken(String(c?.category || '')))
            .filter((t: string) => t.length >= 2 && t.length <= 36)
        : [];
      exactCompTerms.forEach((phrase) => {
        if (!JOB_STOPWORDS.has(phrase)) {
          weightedTerms.set(phrase, { label: phrase, weight: 2.6, isRole: false });
        }
      });

      const searchQueries: string[] = [];
      const pushQuery = (q: string) => {
        const clean = q.trim();
        if (clean.length >= 2 && !searchQueries.includes(clean)) {
          searchQueries.push(clean);
        }
      };

      if (typeof search === 'string' && search.trim()) {
        pushQuery(search.trim());
      }

      for (const r of prefRoles) {
        pushQuery(r);
        if (searchQueries.length >= 4) break;
      }

      for (const tok of [...prefRoleTokens, ...titleTokensRaw]) {
        const syns = PT_EN_SYNONYM_MAP[tok];
        if (syns && syns[0]) pushQuery(syns[0]);
        else pushQuery(tok);
        if (searchQueries.length >= 5) break;
      }

      for (const comp of Array.isArray(cv?.competencies) ? cv.competencies : []) {
        const catTokens = tokenizeMeaningful(String(comp?.category || ''));
        for (const t of catTokens) {
          const syns = PT_EN_SYNONYM_MAP[t];
          pushQuery(syns?.[0] || t);
          if (searchQueries.length >= 6) break;
        }
        if (searchQueries.length >= 6) break;
      }

      const wpParam =
        workplace && workplace !== 'all' ? `&workplace=${encodeURIComponent(workplace)}` : '';

      // Detect location preferences (explicit preferences override/enhance CV location)
      const locationNorm = normalizeTextToken(personalLocation);
      const userCountryHints: string[] = [];
      const selectedSpecificCountries = prefCountries.filter((c) => c !== 'remoto_global');
      const allowGlobalRemote = prefCountries.length === 0 || prefCountries.includes('remoto_global');
      let linkedInLocation = '';
      let secondaryLinkedInLocation = '';
      let indeedBaseUrl = 'https://www.indeed.com/jobs';
      let portalLocationLabel = personalLocation || 'Remote';

      if (prefCountries.length > 0) {
        const linkedInLocList: string[] = [];
        for (const code of prefCountries) {
          const rule = COUNTRY_PREFERENCE_RULES[code];
          if (rule) {
            userCountryHints.push(...rule.hints);
            if (rule.linkedInLocation && !linkedInLocList.includes(rule.linkedInLocation)) {
              linkedInLocList.push(rule.linkedInLocation);
            }
          }
        }
        const firstSpecificRule = selectedSpecificCountries[0]
          ? COUNTRY_PREFERENCE_RULES[selectedSpecificCountries[0]]
          : null;
        if (firstSpecificRule) {
          indeedBaseUrl = firstSpecificRule.indeedUrl;
          portalLocationLabel = firstSpecificRule.linkedInLocation || firstSpecificRule.label;
        }
        linkedInLocation = linkedInLocList[0] || '';
        secondaryLinkedInLocation = linkedInLocList[1] || '';
      } else {
        if (/brasil|brazil|sao paulo|rio de janeiro|belo horizonte|curitiba/.test(locationNorm)) {
          userCountryHints.push('br', 'brazil', 'latam', 'south america', 'americas');
          linkedInLocation = 'Brazil';
          indeedBaseUrl = 'https://br.indeed.com/jobs';
        } else if (/portugal|lisboa|porto|coimbra|braga/.test(locationNorm)) {
          userCountryHints.push('pt', 'portugal', 'europe', 'eu', 'emea');
          linkedInLocation = 'Portugal';
          indeedBaseUrl = 'https://pt.indeed.com/jobs';
        } else if (/angola|luanda|benguela|huambo/.test(locationNorm)) {
          userCountryHints.push('ao', 'angola', 'africa', 'emea');
          linkedInLocation = 'Angola';
        } else if (/espanha|spain|madrid|barcelona/.test(locationNorm)) {
          userCountryHints.push('es', 'spain', 'europe', 'eu', 'emea');
          linkedInLocation = 'Spain';
          indeedBaseUrl = 'https://es.indeed.com/jobs';
        }
      }

      const linkedInKeywordPrimary =
        (typeof search === 'string' && search.trim()) ||
        prefRoles[0] ||
        personalTitle.trim() ||
        searchQueries.slice(0, 2).join(' ') ||
        'software engineer';
      const linkedInKeywordEn = searchQueries.slice(0, 2).join(' ') || linkedInKeywordPrimary;

      const radarTasks: Promise<any>[] = [
        fetchRadarApiJson(`/api/jobs?page=1&pageSize=50${wpParam}`).catch(() => null),
        fetchRadarApiJson(`/api/jobs?page=2&pageSize=50${wpParam}`).catch(() => null),
        ...searchQueries.slice(0, 4).map((q) =>
          fetchRadarApiJson(`/api/jobs?q=${encodeURIComponent(q)}&pageSize=50${wpParam}`).catch(() => null)
        )
      ];

      const [
        radarResponses,
        liLocal,
        liSecondary,
        liGlobal,
        remotiveMain,
        remotiveFiltered,
        arbeitnowJobs,
        jobicyJobs,
        remoteOkJobs
      ] = await Promise.all([
        Promise.all(radarTasks),
        fetchLinkedInGuestJobs(linkedInKeywordPrimary, linkedInLocation).catch(() => []),
        secondaryLinkedInLocation
          ? fetchLinkedInGuestJobs(linkedInKeywordEn, secondaryLinkedInLocation).catch(() => [])
          : Promise.resolve([]),
        linkedInKeywordEn !== linkedInKeywordPrimary || linkedInLocation
          ? fetchLinkedInGuestJobs(linkedInKeywordEn, '').catch(() => [])
          : Promise.resolve([]),
        fetchRemotiveJobs().catch(() => ({ jobs: [], total: 0 })),
        searchQueries[0]
          ? fetchRemotiveJobs(searchQueries[0]).catch(() => ({ jobs: [], total: 0 }))
          : Promise.resolve({ jobs: [], total: 0 }),
        fetchArbeitnowJobs().catch(() => []),
        fetchJobicyJobs(searchQueries[0]).catch(() => []),
        fetchRemoteOkJobs().catch(() => [])
      ]);

      const radarTotal = Number(
        radarResponses.find((r) => r && typeof r.total === 'number')?.total || 0
      );

      const unifiedPool: any[] = [];
      for (const resp of radarResponses) {
        if (resp && Array.isArray(resp.jobs)) {
          for (const job of resp.jobs) {
            if (!job?.id) continue;
            const applyUrl = job.applyUrl || job.url || `${RADAR_BASE_URL}/jobs/${encodeURIComponent(job.id)}`;
            unifiedPool.push({
              id: String(job.id),
              title: String(job.title || ''),
              company: String(job.company || ''),
              workplace: String(job.workplace || 'remote'),
              locations: Array.isArray(job.locations) ? job.locations.map((l: any) => String(l)) : [],
              allowedCountries: Array.isArray(job.allowedCountries)
                ? job.allowedCountries.map((c: any) => String(c))
                : [],
              category: job.category ? String(job.category) : null,
              seniority: job.seniority ? String(job.seniority) : null,
              employmentType: detectNormalizedContractType([job.employmentType], job.title),
              salary: formatSalaryField(job.salary),
              skills: Array.isArray(job.skills) ? job.skills.map((s: any) => String(s)) : [],
              tags: Array.isArray(job.tags) ? job.tags.map((t: any) => String(t)) : [],
              descriptionSnippet: '',
              sourcePortal: 'radar',
              sourceName: 'Radar de Vagas',
              postedAt: job.postedAt || job.firstSeenAt || null,
              applyUrl: String(applyUrl),
              portalUrl: `${RADAR_BASE_URL}/jobs/${encodeURIComponent(job.id)}`
            });
          }
        }
      }

      // Normalize LinkedIn employmentType from title too
      const liCombined = [...liLocal, ...liSecondary, ...liGlobal].map((j) => ({
        ...j,
        employmentType: j.employmentType || detectNormalizedContractType([], j.title)
      }));

      unifiedPool.push(
        ...liCombined,
        ...remotiveMain.jobs,
        ...remotiveFiltered.jobs,
        ...arbeitnowJobs,
        ...jobicyJobs,
        ...remoteOkJobs
      );

      const deduped = new Map<string, any>();
      for (const job of unifiedPool) {
        if (!job?.title || !job?.company) continue;
        const key = `${normalizeTextToken(job.title)}::${normalizeTextToken(job.company)}`;
        if (!deduped.has(key)) {
          deduped.set(key, job);
        }
      }

      const titleNormForSeniority = normalizeTextToken(`${prefRoles.join(' ')} ${personalTitle} ${experienceRoles}`);
      const candidateSeniority =
        /diretor|director|vp|head|chief|c-level/.test(titleNormForSeniority)
          ? 'director'
          : /gerente|manager|lead|principal|staff|senior|sênior|sr\b/.test(titleNormForSeniority)
          ? 'senior'
          : /junior|jr\b|estagio|intern|trainee/.test(titleNormForSeniority)
          ? 'junior'
          : 'mid';

      const userSearchNorm = normalizeTextToken(String(search || ''));
      const sourceCountsAll: Record<string, number> = {
        radar: 0,
        linkedin: 0,
        remotive: 0,
        arbeitnow: 0,
        jobicy: 0,
        remoteok: 0
      };
      const allCompatibleJobs: any[] = [];

      for (const job of deduped.values()) {
        const jobTitleNorm = normalizeTextToken(job.title);
        const jobTagsNorm = normalizeTextToken(job.tags.join(' '));
        const jobSkillsNorm = normalizeTextToken(job.skills.join(' '));
        const jobCategoryNorm = normalizeTextToken(String(job.category || ''));
        const jobCompanyNorm = normalizeTextToken(job.company);
        const jobDescNorm = normalizeTextToken(String(job.descriptionSnippet || '').slice(0, 700));
        const jobFullNorm = `${jobTitleNorm} ${jobSkillsNorm} ${jobTagsNorm} ${jobCategoryNorm} ${jobCompanyNorm} ${jobDescNorm}`;

        if (userSearchNorm) {
          const queryTokens = tokenizeMeaningful(userSearchNorm);
          const allQueryMatch = queryTokens.every((qt) => jobFullNorm.includes(qt));
          if (!allQueryMatch && !jobFullNorm.includes(userSearchNorm)) {
            continue;
          }
        }

        if (workplace && workplace !== 'all' && job.workplace && job.workplace !== workplace) {
          continue;
        }

        // Contract type preference filter
        if (prefContracts.length > 0) {
          const detectedType = job.employmentType as string | null;
          if (detectedType) {
            if (!prefContracts.includes(detectedType)) {
              continue;
            }
          } else {
            // Unspecified jobs (common on LinkedIn guest cards) pass when full_time is accepted
            if (!prefContracts.includes('full_time')) {
              continue;
            }
          }
        }

        // Country preference filtering & affinity
        const allowedList = Array.isArray(job.allowedCountries)
          ? job.allowedCountries.map((c: string) => c.toLowerCase())
          : [];
        const locationsList = Array.isArray(job.locations)
          ? job.locations.map((l: string) => normalizeTextToken(l)).join(' ')
          : '';
        const isGlobalRemoteJob =
          job.workplace === 'remote' &&
          allowedList.length === 0 &&
          (locationsList === '' || /anywhere|worldwide|global|remote/i.test(locationsList));

        const matchesConfiguredCountry = userCountryHints.some(
          (hint) =>
            allowedList.includes(hint) ||
            (hint.length > 2 && locationsList.includes(hint))
        );

        if (prefCountries.length > 0) {
          if (selectedSpecificCountries.length > 0 && !allowGlobalRemote) {
            // User explicitly selected specific countries without "remoto_global"
            if (!matchesConfiguredCountry && !isGlobalRemoteJob) {
              continue;
            }
            // Exclude explicit foreign country restriction when it doesn't match user country codes
            if (allowedList.length > 0 && !matchesConfiguredCountry) {
              continue;
            }
          } else if (selectedSpecificCountries.length === 0 && allowGlobalRemote) {
            // User selected ONLY "Remoto Global"
            if (job.workplace !== 'remote') {
              continue;
            }
          } else if (selectedSpecificCountries.length > 0 && allowGlobalRemote) {
            // Selected specific countries + Remoto Global
            if (!matchesConfiguredCountry && !isGlobalRemoteJob) {
              continue;
            }
          }
        }

        let rawPoints = 0;
        let titleHits = 0;
        let skillHits = 0;
        const matchedKeywords: string[] = [];

        for (const [term, meta] of weightedTerms.entries()) {
          if (term.length < 2) continue;
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex =
            term.length <= 3
              ? new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i')
              : new RegExp(`(?:^|[^a-z0-9])${escaped}`, 'i');

          const inTitle = regex.test(jobTitleNorm);
          const inSkillsOrTags = regex.test(`${jobSkillsNorm} ${jobTagsNorm}`);
          const inCategoryOrDesc = regex.test(`${jobCategoryNorm} ${jobDescNorm}`);

          if (inTitle || inSkillsOrTags || inCategoryOrDesc) {
            const hitScore = inTitle
              ? meta.weight * 8.5
              : inSkillsOrTags
              ? meta.weight * 5.5
              : meta.weight * 2.8;
            rawPoints += hitScore;
            if (inTitle) titleHits += 1;
            else skillHits += 1;

            const displayKw = meta.label.length <= 2 ? meta.label.toUpperCase() : meta.label;
            if (!matchedKeywords.some((k) => k.toLowerCase() === displayKw.toLowerCase())) {
              matchedKeywords.push(displayKw);
            }
          }
        }

        if (!userSearchNorm && rawPoints < 14 && matchedKeywords.length === 0) {
          continue;
        }

        let locationMatched = false;
        if (matchesConfiguredCountry) {
          rawPoints += prefCountries.length > 0 ? 14 : 9;
          locationMatched = true;
        } else if (job.workplace === 'remote' && allowedList.length === 0) {
          rawPoints += 6;
          locationMatched = true;
        } else if (isGlobalRemoteJob) {
          rawPoints += 7;
          locationMatched = true;
        }

        const jobSen = String(job.seniority || '').toLowerCase();
        if (
          jobSen &&
          ((candidateSeniority === 'senior' && (jobSen === 'senior' || jobSen === 'lead')) ||
            (candidateSeniority === 'director' &&
              (jobSen === 'director' || jobSen === 'senior' || jobSen === 'lead')) ||
            (candidateSeniority === 'mid' && jobSen === 'mid') ||
            (candidateSeniority === 'junior' && (jobSen === 'junior' || jobSen === 'entry')))
        ) {
          rawPoints += 6;
        }

        const matchScore = userSearchNorm && rawPoints < 14
          ? 52
          : Math.min(98, Math.max(36, Math.round(32 + rawPoints * 1.15)));

        const topKeywords = matchedKeywords.slice(0, 6);
        const fitParts: string[] = [];
        if (titleHits > 0) fitParts.push('Alinhamento direto com o cargo');
        if (skillHits > 0) fitParts.push(`${skillHits} competência(s) compatível(eis)`);
        if (locationMatched) {
          fitParts.push(job.workplace === 'remote' ? 'Remoto compatível' : 'País compatível');
        }

        if (typeof sourceCountsAll[job.sourcePortal] === 'number') {
          sourceCountsAll[job.sourcePortal] += 1;
        }

        allCompatibleJobs.push({
          id: job.id,
          title: job.title,
          company: job.company,
          workplace: job.workplace,
          employmentType: job.employmentType || null,
          locations: job.locations,
          allowedCountries: job.allowedCountries,
          category: job.category,
          seniority: job.seniority,
          salary: job.salary,
          skills: job.skills.slice(0, 8),
          tags: job.tags.slice(0, 8),
          descriptionSnippet: job.descriptionSnippet || '',
          sourcePortal: job.sourcePortal,
          sourceName: job.sourceName,
          postedAt: job.postedAt,
          applyUrl: job.applyUrl,
          radarUrl: job.portalUrl,
          matchScore,
          matchedKeywords: topKeywords,
          fitReason: fitParts.join(' · ') || 'Perfil compatível com a vaga'
        });
      }

      allCompatibleJobs.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const tA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tB - tA;
      });

      const filteredBySource =
        source && source !== 'all'
          ? allCompatibleJobs.filter((j) => j.sourcePortal === source)
          : allCompatibleJobs;

      const roleQueryForExternal = encodeURIComponent(
        (typeof search === 'string' && search.trim()) ||
          prefRoles[0] ||
          personalTitle.trim() ||
          searchQueries[0] ||
          'Software'
      );
      const locQueryForExternal = encodeURIComponent(portalLocationLabel);

      const externalPortals = [
        {
          id: 'linkedin',
          name: 'LinkedIn Vagas',
          url: `https://www.linkedin.com/jobs/search/?keywords=${roleQueryForExternal}&location=${locQueryForExternal}`,
          liveCount: sourceCountsAll.linkedin
        },
        {
          id: 'indeed',
          name: 'Indeed',
          url: `${indeedBaseUrl}?q=${roleQueryForExternal}&l=${locQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'glassdoor',
          name: 'Glassdoor',
          url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'gupy',
          name: 'Gupy',
          url: `https://portal.gupy.io/job-search/term=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'infojobs',
          name: 'InfoJobs',
          url: `https://www.infojobs.com.br/empregos.aspx?palabra=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'wellfound',
          name: 'Wellfound',
          url: `https://wellfound.com/jobs?query=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'radar',
          name: 'Radar de Vagas',
          url: `${RADAR_BASE_URL}/?q=${roleQueryForExternal}`,
          liveCount: sourceCountsAll.radar
        }
      ];

      return res.json({
        sourceUrl: RADAR_BASE_URL,
        totalPlatformJobs: radarTotal + Number(remotiveMain.total || 0),
        scannedPoolCount: deduped.size,
        compatibleCount: filteredBySource.length,
        totalCompatibleAllSources: allCompatibleJobs.length,
        sourceCounts: sourceCountsAll,
        matchedJobs: filteredBySource.slice(0, 80),
        externalPortals,
        profileQueriesUsed: searchQueries.slice(0, 5),
        syncedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Erro ao consultar portais de vagas:', error?.message || error);
      return res.status(502).json({
        error: 'Não foi possível sincronizar vagas ao vivo neste momento.'
      });
    }
  });

  app.get('/api/jobs/detail', async (req, res) => {
    try {
      if (!checkJobsRateLimit(req)) {
        return res.status(429).json({ error: 'Demasiadas consultas em sequência. Aguarde um minuto.' });
      }
      const id = String(req.query.id || '').trim().slice(0, 160);
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório.' });
      }

      if (id.startsWith('linkedin:')) {
        const numericId = id.replace(/^linkedin:/, '');
        if (/^\d+$/.test(numericId)) {
          const html: string = await fetchCachedExternal(
            `li_detail:${numericId}`,
            `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${numericId}`,
            'text',
            10 * 60 * 1000,
            5500
          );
          const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          const titleMatch = html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
          const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
          return res.json({
            id,
            title: stripHtmlTags(titleMatch?.[1] || ''),
            company: stripHtmlTags(companyMatch?.[1] || ''),
            description: stripHtmlTags(descMatch?.[1] || ''),
            applyUrl: `https://www.linkedin.com/jobs/view/${numericId}`,
            radarUrl: `https://www.linkedin.com/jobs/view/${numericId}`
          });
        }
      }

      const data = await fetchRadarApiJson(`/api/jobs/${encodeURIComponent(id)}`);
      return res.json({
        id: data.id,
        title: data.title,
        company: data.company,
        description: data.description || '',
        applyUrl: data.applyUrl || data.url,
        radarUrl: `${RADAR_BASE_URL}/jobs/${encodeURIComponent(data.id || id)}`,
        locations: data.locations || [],
        workplace: data.workplace || null,
        skills: data.skills || [],
        tags: data.tags || []
      });
    } catch (error: any) {
      return res.status(502).json({
        error: error?.message || 'Erro ao obter detalhes completos da vaga.'
      });
    }
  });

  // -------------------------------------------------------------
  // SEO ENDPOINTS: DYNAMIC ROBOTS.TXT & MULTILINGUAL SITEMAP.XML
  // -------------------------------------------------------------
  function resolveSeoOrigin(req: express.Request): string {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/+$/, '');
    }
    const hostHeader = req.get('x-forwarded-host') || req.get('host');
    const protoHeader = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    if (hostHeader) {
      return `${protoHeader}://${hostHeader}`;
    }
    return 'https://ais-pre-ffiukhfder2kc5oxywnvqc-584774058317.europe-west2.run.app';
  }

  app.get('/robots.txt', (req, res) => {
    const origin = resolveSeoOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /conta',
        'Disallow: /admin',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        ''
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveSeoOrigin(req);
    const lastmod = new Date().toISOString().split('T')[0];
    const langs = ['pt', 'en', 'es', 'fr', 'de', 'it'] as const;
    const routes: Array<{ path: string; changefreq: string; priority: string }> = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/modelos-cv', changefreq: 'weekly', priority: '0.9' },
      { path: '/exemplos-cv', changefreq: 'weekly', priority: '0.9' },
      { path: '/modelos-carta', changefreq: 'weekly', priority: '0.85' },
      { path: '/exemplos-carta', changefreq: 'weekly', priority: '0.85' },
      { path: '/editor', changefreq: 'weekly', priority: '0.9' },
      { path: '/importar-curriculo', changefreq: 'monthly', priority: '0.8' },
      { path: '/radar-ats', changefreq: 'weekly', priority: '0.9' },
      { path: '/vagas', changefreq: 'daily', priority: '0.85' },
      { path: '/otimizador-ia', changefreq: 'weekly', priority: '0.85' },
      { path: '/carta-apresentacao', changefreq: 'weekly', priority: '0.85' },
      { path: '/simulador-entrevista', changefreq: 'weekly', priority: '0.8' }
    ];

    const urlEntries = routes
      .map((route) => {
        const loc = `${origin}${route.path}`;
        const alternates = [
          ...langs.map((lng) => {
            const href = lng === 'pt' ? loc : `${loc}?lang=${lng}`;
            return `    <xhtml:link rel="alternate" hreflang="${lng}" href="${href}" />`;
          }),
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`
        ].join('\n');

        return [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          `    <changefreq>${route.changefreq}</changefreq>`,
          `    <priority>${route.priority}</priority>`,
          alternates,
          '  </url>'
        ].join('\n');
      })
      .join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      urlEntries,
      '</urlset>'
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  });

  serverErrorStoreSink = (entry) => {
    authStore.errorLogs = [entry, ...(authStore.errorLogs || [])].slice(0, 100);
    persistAuthStore();
  };

  app.use(async (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    (res as any).__errorCaptured = true;
    await captureServerException(err, {
      route: req.originalUrl || req.path,
      method: req.method,
      statusCode: Number(err?.status) || 500,
      source: 'express_unhandled_middleware'
    });
    if (!res.headersSent) {
      return res.status(Number(err?.status) || 500).json({
        error: 'Erro interno do servidor ao processar a solicitação.'
      });
    }
  });

  return app;
}

export async function startServer() {
  const app = createApiApp();
  const httpServer = http.createServer(app);
  if (typeof (app as any).__attachSupportChatWs === 'function') {
    await (app as any).__attachSupportChatWs(httpServer);
  }
  let viteServer: { middlewares: any; close: () => Promise<void> } | null = null;

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const createdVite = (await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !disableHmr,
        ws: disableHmr ? false : { server: httpServer },
        watch: disableHmr ? null : {}
      },
      appType: 'spa'
    })) as { middlewares: any; close: () => Promise<void> };
    viteServer = createdVite;
    app.use(createdVite.middlewares);
  } else {
    app.use(express.static(path.resolve(SERVER_ROOT_DIR, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(SERVER_ROOT_DIR, 'dist', 'index.html'));
    });
  }

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    const forceTimer = setTimeout(() => {
      process.exit(0);
    }, 1500);
    forceTimer.unref();

    try {
      if (viteServer) {
        await viteServer.close();
      }
    } catch {
      // ignore vite close errors during shutdown
    }

    try {
      httpServer.close(() => {
        clearTimeout(forceTimer);
        process.exit(0);
      });
      if (typeof (httpServer as any).closeAllConnections === 'function') {
        (httpServer as any).closeAllConnections();
      }
    } catch {
      clearTimeout(forceTimer);
      process.exit(0);
    }
    void signal;
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`❌ Failed to start CV Studio Server on ${HOST}:${PORT}:`, err?.message || err);
    process.exit(1);
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 CV Studio Server running on http://${HOST}:${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer().catch((err) => {
    console.error('❌ Fatal error starting CV Studio Server:', err);
    process.exit(1);
  });
}
