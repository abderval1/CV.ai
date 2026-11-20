export interface ErrorMonitoringContext {
  operationType?: string;
  tags?: Record<string, string | number | boolean | undefined>;
  extra?: Record<string, unknown>;
  componentStack?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info';
}

const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /sk_(?:live|test)_[0-9A-Za-z]{12,}/g,
  /rk_(?:live|test)_[0-9A-Za-z]{12,}/g,
  /(password|secret|token|cookie|authorization)=[^&\s]+/gi
];

function scrubText(value: unknown, maxLen = 800): string {
  let text = String(value ?? '').slice(0, maxLen * 2);
  for (const rx of SENSITIVE_PATTERNS) {
    text = text.replace(rx, '[REDACTED]');
  }
  return text.slice(0, maxLen);
}

let initialized = false;
const recentSignatures = new Map<string, number>();

function shouldSkipDuplicate(sig: string): boolean {
  const now = Date.now();
  if (recentSignatures.size > 100) {
    recentSignatures.clear();
  }
  const prev = recentSignatures.get(sig);
  if (prev && now - prev < 4000) return true;
  recentSignatures.set(sig, now);
  return false;
}

export function captureClientException(error: unknown, context: ErrorMonitoringContext = {}): void {
  if (typeof window === 'undefined') return;

  const errObj = error instanceof Error ? error : new Error(String(error || 'Unknown client error'));
  const errType = scrubText(errObj.name || 'Error', 60);
  const errMessage = scrubText(errObj.message || String(error || 'Erro inesperado'), 600);
  const stack = errObj.stack ? scrubText(errObj.stack, 1200) : undefined;
  const opType = scrubText(context.operationType || 'client_exception', 80);

  const signature = `${opType}:${errType}:${errMessage.slice(0, 140)}`;
  if (shouldSkipDuplicate(signature)) return;

  // Report sanitized diagnostics directly to internal backend /api/error-logs (no external keys required)
  if (!opType.includes('error_logs_self') && typeof window.fetch === 'function') {
    const detailedMsg = stack ? `${errMessage} | ${stack.split('\n').slice(0, 3).join(' ')}` : errMessage;
    void window
      .fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          id: `err_cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          operationType: opType,
          errorMessage: scrubText(detailedMsg, 950),
          modelUsed: 'internal-monitor'
        })
      })
      .catch(() => {});
  }
}

export function initClientErrorMonitoring(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  try {
    window.addEventListener('error', (event) => {
      if (!event.error && (!event.message || event.message === 'Script error.')) return;
      captureClientException(event.error || new Error(event.message), {
        operationType: 'window_error',
        tags: {
          filename: event.filename ? event.filename.split('?')[0].slice(-80) : 'inline',
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = String((reason as any)?.message || reason || '');
      if (msg.includes('AbortError') || msg.includes('WebSocket')) return;
      captureClientException(reason instanceof Error ? reason : new Error(msg || 'Unhandled rejection'), {
        operationType: 'unhandled_rejection'
      });
    });
  } catch {
    // never block application boot if listener registration is restricted
  }
}
