// api/mcp-resolve-credentials.ts
//
// MCP credential resolution endpoint — unblocks auto-connect of MCP servers
// that require credentials (GitHub, Slack, Notion, Postgres, etc.) on login.
//
// Contract:
//   POST  /api/mcp-resolve-credentials
//   Body: { server_ids: ['github', 'brave-search', ...] }
//   Resp: {
//     credentials: { [server_id]: { [env_key]: value } },
//     errors:      { [server_id]: reason }
//   }
//
// Each server's preset (from @mcv/mcp-sdk/presets) declares
// `requiredCredentials` — an array of { key, type, oauthProvider? } entries.
// For each:
//   - type 'oauth' → getProviderToken(userId, oauthProvider) handles
//     per-user OAuth tokens (with pre-expiry refresh) and API-key-provider
//     env fallbacks.
//   - type 'apikey' | 'manual' → read `process.env[cred.key]`. A future
//     user_api_keys table can override per-user if/when that lands.
//
// Unknown server_ids and missing credentials surface in the `errors` map
// so the client can tell the user what to connect in Integrations without
// blocking the rest of the auto-connect pass. Returning 200 with a partial
// map keeps startup flow simple.
//
// Security: decrypted secrets are only ever written back to the requesting
// Clerk user — no cross-user leaks because we key every lookup on `userId`.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPreset } from '@mcv/mcp-sdk/presets';
import { getProviderToken } from './_oauth-helper.js';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

interface ResolveResponse {
  credentials: Record<string, Record<string, string>>;
  errors: Record<string, string>;
}

async function resolveOneServer(
  userId: string,
  serverId: string,
): Promise<{ credentials?: Record<string, string>; error?: string }> {
  const preset = getPreset(serverId);
  if (!preset) return { error: `Unknown preset "${serverId}"` };

  const credentials: Record<string, string> = {};

  for (const cred of preset.requiredCredentials) {
    if (cred.type === 'oauth' && cred.oauthProvider) {
      try {
        const { token } = await getProviderToken(userId, cred.oauthProvider);
        credentials[cred.key] = token;
      } catch (err) {
        return {
          error: err instanceof Error
            ? err.message
            : `OAuth provider "${cred.oauthProvider}" not available`,
        };
      }
      continue;
    }

    // apikey / manual — sourced from process.env using the credential's
    // declared env key. This is the standard convention MCP servers use
    // (e.g. BRAVE_API_KEY, DATABASE_URL, SLACK_BOT_TOKEN).
    const value = process.env[cred.key];
    if (!value) {
      return {
        error: `Missing ${cred.label || cred.key}. Configure ${cred.key} in Vercel env or Settings > Integrations.`,
      };
    }
    credentials[cred.key] = value;
  }

  return { credentials };
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const serverIds = (req.body?.server_ids ?? []) as unknown;
  if (!Array.isArray(serverIds) || serverIds.length === 0) {
    return res.status(400).json({ error: 'server_ids must be a non-empty array' });
  }
  if (serverIds.length > 50) {
    return res.status(400).json({ error: 'server_ids limited to 50 per request' });
  }
  if (!serverIds.every((s): s is string => typeof s === 'string')) {
    return res.status(400).json({ error: 'server_ids must be strings' });
  }

  const out: ResolveResponse = { credentials: {}, errors: {} };

  // Resolve in parallel — each call is independent (different preset lookup
  // and a fresh getProviderToken read per OAuth credential).
  const results = await Promise.all(
    serverIds.map(async (id) => ({ id, result: await resolveOneServer(userId, id) })),
  );

  for (const { id, result } of results) {
    if (result.credentials) out.credentials[id] = result.credentials;
    if (result.error) out.errors[id] = result.error;
  }

  return res.json(out);
}
