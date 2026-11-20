import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server';

let cachedApp: ReturnType<typeof createApiApp> | null = null;

function getApiApp() {
  if (!cachedApp) {
    cachedApp = createApiApp();
  }
  return cachedApp;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = getApiApp();
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('[api/index] Erro fatal ao inicializar ou processar pedido:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: 'Erro interno ao processar pedido no servidor.',
          code: 'SERVERLESS_HANDLER_ERROR'
        })
      );
    }
  }
}
