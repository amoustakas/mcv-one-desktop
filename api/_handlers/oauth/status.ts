import { getUserConnections } from "../_oauth-helper";
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../../src/lib/server/logger';
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
// OAuth Status — Returns connection status for all providers
// ---------------------------------------------------------------------------

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

  try {
    const connections = await getUserConnections(userId);

    // Phase-0 safety (2026-04-23): health checks must NOT treat VITE_* as a
    // valid source. Those names leak into browser bundles — reporting a key
    // as "configured" when it's only present via its VITE_ shape would mask
    // a live vulnerability. LLM/voice provider keys are server-only from
    // this commit forward. See docs/CLAUDE.md "ENVIRONMENT VARIABLES".
    const health: Record<string, boolean> = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_KEY: !!process.env.GOOGLE_AI_KEY,
      DEEPGRAM_API_KEY: !!process.env.DEEPGRAM_API_KEY,
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
      GOOGLE_MAPS_KEY: !!(process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY),
      VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
      N8N_API_KEY: !!process.env.N8N_API_KEY,
      SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    };

    return res.json({ connections, health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
