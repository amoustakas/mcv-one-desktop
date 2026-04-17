import { getProviderConfig } from "../_oauth-helper";
import { randomBytes } from 'crypto';
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
// OAuth Connect — Initiates the OAuth authorization flow
// ---------------------------------------------------------------------------
// GET /api/oauth/connect?provider=github
// Returns a redirect URL to the provider's authorization page.

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

  const provider = (req.query.provider || req.body?.provider) as string;
  if (!provider) {
    return res.status(400).json({ error: 'provider query parameter required' });
  }

  try {
    const config = getProviderConfig(provider);

    if (!config.clientId) {
      return res.status(500).json({
        error: `${provider} OAuth not configured. Set ${provider.toUpperCase()}_OAUTH_CLIENT_ID and ${provider.toUpperCase()}_OAUTH_CLIENT_SECRET in Vercel env vars.`,
      });
    }

    // Generate state parameter (CSRF protection)
    const state = randomBytes(32).toString('hex');

    // Build the app's callback URL
    const origin = `https://${req.headers.host}`;
    const callbackUrl = `${origin}/api/oauth/callback`;

    // Build provider-specific auth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      state: `${provider}:${userId}:${state}`,
      response_type: 'code',
    });

    // Add scopes (provider-specific format)
    if (config.scopes.length > 0) {
      params.set('scope', config.scopes.join(' '));
    }

    // Provider-specific params
    if (provider === 'google') {
      params.set('access_type', 'offline'); // Get refresh token
      params.set('prompt', 'consent');       // Force consent to get refresh token
      params.set('include_granted_scopes', 'true'); // Incremental: keep existing scopes

      // Support requesting specific scopes only (incremental auth)
      const requestedScopes = req.query.scopes as string | undefined;
      if (requestedScopes) {
        // Override with only the requested scopes (Google merges with existing)
        params.set('scope', requestedScopes);
      }
    }

    if (provider === 'notion') {
      params.set('owner', 'user');
    }

    const redirectUrl = `${config.authUrl}?${params.toString()}`;

    return res.status(200).json({ redirectUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
