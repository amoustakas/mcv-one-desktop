import { getProviderToken, getUserConnections, GOOGLE_SCOPES_VERSION } from '../_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// OAuth Health Check — Deep verification of each Google service
// ---------------------------------------------------------------------------
// GET /api/oauth/health?provider=google
// Tests actual API connectivity per service, returns granular status.

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

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unavailable' | 'scope_missing';
  latencyMs: number;
  error?: string;
  detail?: string;
}

// Lightweight probe for each Google service
const SERVICE_PROBES: Record<string, { url: string; requiredScope: string }> = {
  gmail:          { url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile', requiredScope: 'gmail' },
  calendar:       { url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', requiredScope: 'calendar' },
  drive:          { url: 'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)', requiredScope: 'drive' },
  sheets:         { url: 'https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId', requiredScope: 'spreadsheets' },
  tasks:          { url: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1', requiredScope: 'tasks' },
  contacts:       { url: 'https://people.googleapis.com/v1/people/me?personFields=names', requiredScope: 'contacts' },
  analytics:      { url: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=1', requiredScope: 'analytics' },
  searchConsole:  { url: 'https://searchconsole.googleapis.com/webmasters/v3/sites', requiredScope: 'webmasters' },
};

async function probeService(token: string, service: string, config: { url: string; requiredScope: string }, grantedScopes: string[]): Promise<ServiceHealth> {
  // Check if scope is granted
  const hasScope = grantedScopes.some(s => s.includes(config.requiredScope));
  if (!hasScope) {
    return { status: 'scope_missing', latencyMs: 0, error: `Scope not granted: ${config.requiredScope}` };
  }

  const start = Date.now();
  try {
    const res = await fetch(config.url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return { status: 'healthy', latencyMs };
    } else if (res.status === 401) {
      return { status: 'unavailable', latencyMs, error: 'Token expired or revoked' };
    } else if (res.status === 403) {
      return { status: 'scope_missing', latencyMs, error: 'Permission denied — scope may not be granted' };
    } else if (res.status === 429) {
      return { status: 'degraded', latencyMs, error: 'Rate limited' };
    } else {
      const body = await res.json().catch(() => ({}));
      return { status: 'degraded', latencyMs, error: `HTTP ${res.status}`, detail: body.error?.message };
    }
  } catch (err) {
    return {
      status: 'unavailable',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const provider = (req.query.provider as string) || 'google';

  if (provider !== 'google') {
    return res.status(400).json({ error: 'Health check currently supports Google only' });
  }

  try {
    // Get connection info
    const connections = await getUserConnections(userId);
    const googleConn = connections.find(c => c.provider === 'google');

    if (!googleConn || !googleConn.connected) {
      return res.json({
        provider: 'google',
        connected: false,
        healthy: false,
        services: {},
        message: 'Google not connected. Connect in Settings > Integrations.',
      });
    }

    // Get token
    const { token, source } = await getProviderToken(userId, 'google');
    const grantedScopes = googleConn.scopes || [];

    // Probe all services in parallel
    const probeEntries = Object.entries(SERVICE_PROBES);
    const results = await Promise.all(
      probeEntries.map(([service, config]) => probeService(token, service, config, grantedScopes)),
    );

    const services: Record<string, ServiceHealth> = {};
    probeEntries.forEach(([service], i) => {
      services[service] = results[i];
    });

    // Compute overall health
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    const overallHealthy = healthyCount === totalCount;
    const avgLatency = Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / totalCount);

    // Check for stale scopes
    const needsScopeUpgrade = googleConn.needsScopeUpgrade;

    // Token expiry
    const expiresAt = googleConn.expiresAt ? new Date(googleConn.expiresAt) : null;
    const expiresInSeconds = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : null;

    return res.json({
      provider: 'google',
      connected: true,
      healthy: overallHealthy,
      healthScore: Math.round((healthyCount / totalCount) * 100),
      services,
      tokenSource: source,
      userName: googleConn.userName,
      scopesVersion: googleConn.scopesVersion,
      needsScopeUpgrade,
      expiresInSeconds,
      avgLatencyMs: avgLatency,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      provider: 'google',
      connected: false,
      healthy: false,
      error: err instanceof Error ? err.message : 'Health check failed',
    });
  }
}
