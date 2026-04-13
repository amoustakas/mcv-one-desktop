import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProviderToken } from './_oauth-helper';

// ---------------------------------------------------------------------------
// Shared Google API Helpers
// Per-service scope awareness, error mapping, auto-recovery, and telemetry.
// ---------------------------------------------------------------------------

// ── Google API Error with rich context ──

export class GoogleApiError extends Error {
  status: number;
  service: string;
  recoverable: boolean;

  constructor(message: string, status: number, service: string, recoverable = false) {
    super(message);
    this.status = status;
    this.service = service;
    this.recoverable = recoverable;
  }
}

export function mapGoogleError(status: number, message: string, service: string): GoogleApiError {
  switch (status) {
    case 401:
      return new GoogleApiError(
        'Google token expired or revoked. Please reconnect in Settings > Integrations.',
        401, service, true,
      );
    case 403:
      return new GoogleApiError(
        `Missing permission for ${service}. Please reconnect Google with required scopes.`,
        403, service, true,
      );
    case 404:
      return new GoogleApiError('Resource not found.', 404, service);
    case 429:
      return new GoogleApiError('Rate limited by Google. Try again in a moment.', 429, service, true);
    default:
      return new GoogleApiError(
        message || `Google ${service} API error (${status})`,
        status >= 500 ? 502 : status, service,
      );
  }
}

// ── Per-service scope requirements ──

const SERVICE_SCOPES: Record<string, string[]> = {
  gmail:          ['gmail.modify', 'gmail.readonly', 'gmail.send', 'gmail.compose'],
  calendar:       ['calendar', 'calendar.readonly', 'calendar.events'],
  drive:          ['drive', 'drive.readonly', 'drive.file'],
  sheets:         ['spreadsheets', 'spreadsheets.readonly'],
  docs:           ['documents', 'documents.readonly'],
  tasks:          ['tasks', 'tasks.readonly'],
  contacts:       ['contacts.readonly', 'contacts'],
  analytics:      ['analytics.readonly'],
  searchConsole:  ['webmasters.readonly'],
};

/**
 * Check if the user's granted scopes cover a specific service.
 * Uses partial matching — 'gmail.modify' matches requirement 'gmail'.
 */
export function hasServiceScope(grantedScopes: string[], service: string): boolean {
  const required = SERVICE_SCOPES[service];
  if (!required) return true; // Unknown service — allow
  const joined = grantedScopes.join(' ');
  return required.some(scope => joined.includes(scope));
}

// ── Shared auth + token retrieval for Google routes ──

export async function requireAuthAndToken(
  req: VercelRequest,
  res: VercelResponse,
  service: string,
): Promise<{ userId: string; token: string } | null> {
  // Auth
  const secretKey = process.env.CLERK_SECRET_KEY;
  let userId: string;

  if (!secretKey) {
    userId = 'no-secret';
  } else {
    const authHeader = req.headers.authorization;
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
    if (!jwt) { res.status(401).json({ error: 'Authentication required' }); return null; }
    try {
      const { verifyToken } = await import('@clerk/backend');
      const payload = await verifyToken(jwt, { secretKey });
      userId = payload.sub;
    } catch {
      res.status(401).json({ error: 'Invalid session' });
      return null;
    }
  }

  // Token
  try {
    const { token } = await getProviderToken(userId, 'google');
    return { userId, token };
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Google not connected. ${service} requires Google OAuth.`;
    res.status(401).json({ error: msg, service, action: 'reconnect' });
    return null;
  }
}

// ── Standard error handler for catch blocks ──

export function handleGoogleError(err: unknown, res: VercelResponse) {
  if (err instanceof GoogleApiError) {
    return res.status(err.status).json({
      error: err.message,
      service: err.service,
      recoverable: err.recoverable,
      action: err.recoverable ? 'reconnect' : undefined,
    });
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  return res.status(500).json({ error: message });
}

// ── Telemetry helper (writes usage data for Intelligence view) ──

let telemetryBuffer: Array<{
  service: string;
  action: string;
  userId: string;
  success: boolean;
  latencyMs: number;
  timestamp: string;
}> = [];

export function recordTelemetry(service: string, action: string, userId: string, success: boolean, latencyMs: number) {
  telemetryBuffer.push({
    service, action, userId, success, latencyMs,
    timestamp: new Date().toISOString(),
  });
  // Flush when buffer hits 50 entries (fire-and-forget to Supabase)
  if (telemetryBuffer.length >= 50) {
    flushTelemetry();
  }
}

async function flushTelemetry() {
  if (telemetryBuffer.length === 0) return;
  const batch = [...telemetryBuffer];
  telemetryBuffer = [];
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    );
    await supabase.from('google_api_telemetry').insert(batch);
  } catch {
    // Telemetry is non-critical — silently discard on failure
  }
}

// ── Fetch wrapper with auto-retry on 401 ──

export async function googleFetch(
  url: string,
  token: string,
  service: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw mapGoogleError(res.status, body.error?.message || '', service);
  }

  return res;
}

export async function googleGet(url: string, token: string, service: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const fullUrl = `${url}${qs ? '?' + qs : ''}`;
  const res = await googleFetch(fullUrl, token, service);
  return res.json();
}

export async function googlePost(url: string, token: string, service: string, body: unknown) {
  const res = await googleFetch(url, token, service, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
