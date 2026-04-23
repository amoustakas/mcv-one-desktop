// api/_handlers/live-ephemeral-token.ts
//
// Phase-0 safety (2026-04-23): mint a short-lived ephemeral token for Gemini
// Live API browser WebSocket sessions. The browser used to read
// VITE_GOOGLE_AI_KEY directly and connect to
// `wss://generativelanguage.googleapis.com` with the raw key — that shape
// bundled the key into the public JS. The new flow:
//
//   1. Client POSTs to `/api/live-ephemeral-token` (auth required)
//   2. Server holds GOOGLE_AI_KEY and calls Google's auth_tokens.create
//      for a short-lived (≤ 30 minute) token bound to a single session
//   3. Server returns `{ token, expiresAt }` to the client
//   4. Client connects to the Live WebSocket using the ephemeral token
//   5. Even if the token is exfiltrated from the client, it expires fast
//      and cannot mint new sessions
//
// Reference: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_auth.js';
import { requestLogger } from '../../src/lib/server/logger';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const AUTH_TOKEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/auth_tokens';

// Default TTL ceiling. Google permits up to 30 minutes for Live-API tokens.
// We cap well under that so a leaked token's blast radius stays small.
const DEFAULT_TTL_SECONDS = 10 * 60;
const MAX_TTL_SECONDS = 30 * 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });

  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

  const body = (req.body || {}) as { ttlSeconds?: number; model?: string };
  const requestedTtl = typeof body.ttlSeconds === 'number' ? body.ttlSeconds : DEFAULT_TTL_SECONDS;
  const ttlSeconds = Math.min(Math.max(60, requestedTtl), MAX_TTL_SECONDS);
  const model = body.model || 'gemini-live-2.5-flash-preview';

  try {
    // Google's ephemeral-token API is currently a REST call against the
    // v1beta endpoint. When the Node SDK stabilizes a typed helper
    // (GoogleGenAI.authTokens.create), migrate this body to the helper —
    // the wire shape below stays identical.
    const expireTime = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const response = await fetch(`${AUTH_TOKEN_ENDPOINT}?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          uses: 1,
          expireTime,
          newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
          httpOptions: { apiVersion: 'v1alpha' },
          liveConnectConstraints: {
            model: `models/${model}`,
            config: { responseModalities: ['AUDIO'] },
          },
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = (errBody as { error?: { message?: string } }).error?.message
        || `Ephemeral token mint failed: ${response.status}`;
      __log.warn({ event: 'ephemeral_token_error', status: response.status, message: msg });
      return res.status(502).json({ error: msg });
    }

    const data = (await response.json()) as { name?: string; expireTime?: string };
    if (!data.name) {
      return res.status(502).json({ error: 'Ephemeral token response missing name field' });
    }
    return res.status(200).json({
      token: data.name,
      expiresAt: data.expireTime ?? expireTime,
      model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    __log.error({ event: 'ephemeral_token_exception', message });
    return res.status(500).json({ error: message });
  }
}
