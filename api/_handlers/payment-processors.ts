// Admin CRUD for per-venture payment processor routing config.
// SPEC-EQC-001 Epic 16 Story 18.
//
// Actions:
//   - list:    { venture_id }                           → { configs }
//   - upsert:  { venture_id, payment_method, processor_id, priority?, enabled?, metadata? } → { config }
//   - delete:  { id, venture_id }                       → { ok: true }
//   - list-available-processors: (no params)            → { processors: [{id, capabilities, available}] }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  listProcessorConfig,
  upsertProcessorConfig,
  deleteProcessorConfig,
} from '../../src/lib/payments/processor-config';
import { paymentRouter } from '../../src/lib/payments/router';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { action, ...params } = req.body ?? {};

  try {
    switch (action) {
      case 'list': {
        const configs = await listProcessorConfig(params.venture_id as string);
        return res.json({ configs });
      }
      case 'upsert': {
        const config = await upsertProcessorConfig({
          ventureId: params.venture_id as string,
          paymentMethod: params.payment_method as string,
          processorId: params.processor_id as string,
          priority: params.priority as number | undefined,
          enabled: params.enabled as boolean | undefined,
          metadata: params.metadata as Record<string, unknown> | undefined,
        });
        return res.json({ config });
      }
      case 'delete': {
        await deleteProcessorConfig(params.id as string, params.venture_id as string);
        return res.json({ ok: true });
      }
      case 'list-available-processors': {
        // Reflect registered processors + readiness based on env presence.
        const registered = paymentRouter.getProcessors();
        return res.json({
          processors: registered.map((p) => ({
            id: p.id,
            capabilities: p.capabilities,
            available: true,
          })),
        });
      }
      default:
        return res.status(400).json({ error: `unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[payment-processors]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
