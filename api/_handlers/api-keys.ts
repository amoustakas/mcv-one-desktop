// Admin CRUD for platform API keys (Epic 6 Story 3).
// Actions:
//   list   { ventureId }                              → { keys }
//   create { ventureId, name, tier?, permissions?, expiresAt?, test? }
//                                                      → { key (including plaintext) }
//   revoke { id, ventureId }                          → { ok: true }

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestLogger } from '../../src/lib/server/logger';
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  type RateLimitTier,
} from '../../src/lib/platform/api-keys';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

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
        const keys = await listApiKeys(supabase, params.ventureId as string);
        return res.json({ keys });
      }
      case 'create': {
        const generated = await generateApiKey(
          supabase,
          params.ventureId as string,
          params.name as string,
          (params.tier as RateLimitTier | undefined) ?? 'free',
          {
            permissions: (params.permissions as string[] | undefined) ?? ['*'],
            expiresAt: (params.expiresAt as string | null | undefined) ?? null,
            test: Boolean(params.test),
          },
        );
        return res.json({ key: generated.key, plaintext: generated.plaintext });
      }
      case 'revoke': {
        await revokeApiKey(supabase, params.id as string, params.ventureId as string);
        return res.json({ ok: true });
      }
      default:
        return res.status(400).json({ error: `Unknown action "${action}"` });
    }
  } catch (err) {
    console.error('[api-keys]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
