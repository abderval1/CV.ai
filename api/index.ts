import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp, captureServerException } from '../server';

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
    void captureServerException(err, {
      route: req.url || '/api',
      method: req.method || 'GET',
      statusCode: 500,
      source: 'vercel_handler_catch'
    }).finally(() => {
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
    });
  }
}
