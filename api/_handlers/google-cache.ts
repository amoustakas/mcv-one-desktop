import type { VercelRequest, VercelResponse } from '@vercel/node';

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


// ---------------------------------------------------------------------------
// Google AI Context Caching API — create, get, update TTL, delete, list
// ---------------------------------------------------------------------------

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const CACHE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/cachedContents';

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

  if (!GOOGLE_AI_KEY) {
    return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
  }

  try {
    const { action } = req.body ?? req.query;

    switch (action) {
      // Create a new cached content
      case 'create': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

        const { model, contents, systemInstruction, ttlSeconds } = req.body;
        if (!model || !contents) {
          return res.status(400).json({ error: 'model and contents required' });
        }

        const body: Record<string, unknown> = {
          model: `models/${model}`,
          contents,
          ttl: `${ttlSeconds || 3600}s`,
        };
        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const createRes = await fetch(`${CACHE_API_BASE}?key=${GOOGLE_AI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!createRes.ok) {
          const err = await createRes.text();
          return res.status(createRes.status).json({ error: 'Cache creation failed', details: err });
        }

        const data = await createRes.json();
        return res.json({
          cacheName: data.name,
          model: data.model,
          createTime: data.createTime,
          expireTime: data.expireTime,
          usageMetadata: data.usageMetadata,
        });
      }

      // Get cache details
      case 'get': {
        const { name } = req.method === 'GET' ? req.query : req.body;
        if (!name) return res.status(400).json({ error: 'name required' });

        const getRes = await fetch(`${CACHE_API_BASE}/${name}?key=${GOOGLE_AI_KEY}`);
        if (!getRes.ok) {
          return res.status(getRes.status).json({ error: 'Failed to get cache' });
        }
        return res.json(await getRes.json());
      }

      // Update TTL (extend cache lifetime)
      case 'update-ttl': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { name, ttlSeconds } = req.body;
        if (!name || !ttlSeconds) return res.status(400).json({ error: 'name and ttlSeconds required' });

        const patchRes = await fetch(`${CACHE_API_BASE}/${name}?key=${GOOGLE_AI_KEY}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ttl: `${ttlSeconds}s` }),
        });

        if (!patchRes.ok) {
          return res.status(patchRes.status).json({ error: 'TTL update failed' });
        }
        return res.json(await patchRes.json());
      }

      // Delete a cached content
      case 'delete': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });

        const delRes = await fetch(`${CACHE_API_BASE}/${name}?key=${GOOGLE_AI_KEY}`, {
          method: 'DELETE',
        });
        if (!delRes.ok) {
          return res.status(delRes.status).json({ error: 'Delete failed' });
        }
        return res.json({ deleted: true });
      }

      // List all cached contents
      case 'list': {
        const listRes = await fetch(`${CACHE_API_BASE}?key=${GOOGLE_AI_KEY}&pageSize=50`);
        if (!listRes.ok) {
          return res.status(listRes.status).json({ error: 'List failed' });
        }
        const data = await listRes.json();
        return res.json({ cachedContents: data.cachedContents || [] });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    console.error('[google-cache]', message);
    return res.status(500).json({ error: message });
  }
}
