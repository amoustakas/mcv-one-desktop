// api/_handlers/launchpad.ts
//
// Demo Launchpad — signed access-token issuer for cross-venture deep-links.
// Session 5 of the Onboarding + Demo Gate epic.
//
// POST /api/launchpad { action, ...params }
//
// Actions:
//   issue-token   → authed: verify user has an active user_access_grants row
//                   for the requested venture_id + access_level, then sign
//                   a short-lived HS256 JWT and return it for the client to
//                   append to the venture deep-link.
//   verify-token  → (diagnostic) decode + verify a token's signature and
//                   return its claims. Not for production trust decisions —
//                   the destination venture should verify server-side with
//                   its own copy of AGENT_SIGNING_KEY.
//
// Zero-dep HS256 JWT: we use Node's crypto.createHmac directly rather than
// adding jsonwebtoken/jose. The encoding is 15 lines; keeping deps lean
// matters for cold-start on Fluid Compute.
//
// Signing key: AGENT_SIGNING_KEY env (reserved in CLAUDE.md for M3 agent
// JWTs; repurposed here for the user-access flavor). If unset, dev-mode
// only: we fall back to a deterministic dev key so local testing works
// without configuration. Production deployments must set the real key.
//
// EXPAND: when multiple venture apps need to verify, ship a tiny
// @mcv/launchpad-sdk package with a `verify(token)` helper; today the
// destination app inlines the equivalent 5-line verify function.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { requestLogger } from '../../src/lib/server/logger';

// ─── Clerk auth (identical pattern to onboarding.ts) ──────────────────────
interface ClerkIdentity {
  userId: string;
  email: string | null;
  name: string | null;
}

async function resolveIdentity(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { userId: 'dev:no-secret', email: null, name: null };
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken, createClerkClient } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    const userId = payload.sub;
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(userId);
    return {
      userId,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    };
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

// ─── HS256 JWT helpers (zero-dep) ─────────────────────────────────────────

function base64url(buf: Buffer | string): string {
  return (typeof buf === 'string' ? Buffer.from(buf) : buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(s: string): Buffer {
  // Restore padding + URL-safe-to-standard substitutions.
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

interface JWTPayload {
  sub: string;              // Clerk user id
  email?: string | null;
  venture: string;          // e.g. 'futurestate'
  access_levels: string[];  // all granted levels for this venture
  tier?: string;            // access_tier from the invite that granted
  iat: number;              // seconds since epoch
  exp: number;              // seconds since epoch
  iss: string;              // 'mcv-one-desktop'
  aud: string;              // target venture id
}

function resolveSigningKey(): string {
  const key = process.env.AGENT_SIGNING_KEY;
  if (key && key.length >= 32) return key;
  // Dev fallback — deterministic so tokens issued in dev verify in dev.
  // NEVER reach production; guard via CLERK_SECRET_KEY absence (the auth
  // dev-escape only fires without Clerk, same invariant).
  if (!process.env.CLERK_SECRET_KEY) {
    return 'mcv-one-desktop-dev-signing-key-insecure-for-local-only-32ch';
  }
  throw new Error('AGENT_SIGNING_KEY must be at least 32 bytes in production');
}

function signJWT(payload: JWTPayload, key: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = crypto.createHmac('sha256', key).update(signingInput).digest();
  return `${signingInput}.${base64url(sig)}`;
}

function verifyJWT(token: string, key: string): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [headerPart, payloadPart, sigPart] = parts;
  const expected = base64url(crypto.createHmac('sha256', key).update(`${headerPart}.${payloadPart}`).digest());
  // Constant-time comparison so a mistimed compare can't reveal a signature byte-by-byte.
  if (expected.length !== sigPart.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigPart))) {
    throw new Error('Bad signature');
  }
  const payload = JSON.parse(base64urlDecode(payloadPart).toString('utf8')) as JWTPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');
  if (payload.iat > now + 60) throw new Error('Token issued in the future');
  return payload;
}

// ─── Access verification ──────────────────────────────────────────────────

interface GrantRow {
  id: string;
  user_id: string;
  invite_id: string | null;
  venture_id: string | null;
  access_level: string;
  granted_at: string;
  revoked_at: string | null;
}

interface InviteTierRow {
  access_tier: string;
}

async function loadActiveGrants(userId: string, ventureId: string): Promise<GrantRow[]> {
  const { data, error } = await supabase
    .from('user_access_grants')
    .select('id, user_id, invite_id, venture_id, access_level, granted_at, revoked_at')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .is('revoked_at', null);
  if (error) throw error;
  return (data ?? []) as GrantRow[];
}

async function loadTierForInvite(inviteId: string | null): Promise<string | null> {
  if (!inviteId) return null;
  const { data, error } = await supabase
    .from('onboarding_invites')
    .select('access_tier')
    .eq('id', inviteId)
    .maybeSingle();
  if (error) return null;
  return (data as InviteTierRow | null)?.access_tier ?? null;
}

// ─── Handler ──────────────────────────────────────────────────────────────

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in' });
  res.on('finish', () => {
    log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
  });

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const p = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      case 'issue-token': {
        const identity = await resolveIdentity(req, res);
        if (!identity) return;

        const ventureId = (p.venture_id as string)?.trim();
        if (!ventureId) return res.status(400).json({ error: 'venture_id required' });

        const grants = await loadActiveGrants(identity.userId, ventureId);
        if (grants.length === 0) {
          return res.status(403).json({
            error: 'No active access grant for this venture',
            hint: 'Complete onboarding at /onboard to earn venture access.',
          });
        }

        // Prefer the tier from the originating invite (most-recent active grant).
        const newest = grants.slice().sort(
          (a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime(),
        )[0];
        const tier = await loadTierForInvite(newest.invite_id);

        const now = Math.floor(Date.now() / 1000);
        const payload: JWTPayload = {
          sub: identity.userId,
          email: identity.email,
          venture: ventureId,
          access_levels: grants.map((g) => g.access_level),
          tier: tier ?? undefined,
          iat: now,
          exp: now + TOKEN_TTL_SECONDS,
          iss: 'mcv-one-desktop',
          aud: ventureId,
        };

        const token = signJWT(payload, resolveSigningKey());
        log.info({ event: 'token_issued', ventureId, userId: identity.userId, levels: payload.access_levels.length });

        return res.json({
          token,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          ventureId,
          accessLevels: payload.access_levels,
          tier: payload.tier ?? null,
          ttlSeconds: TOKEN_TTL_SECONDS,
        });
      }

      case 'verify-token': {
        // Diagnostic / debugging — the destination venture should verify
        // with its own copy of the signing key, not by calling us.
        const token = (p.token as string)?.trim();
        if (!token) return res.status(400).json({ error: 'token required' });
        try {
          const claims = verifyJWT(token, resolveSigningKey());
          return res.json({ ok: true, claims });
        } catch (err) {
          return res.status(401).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
        }
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          available: ['issue-token', 'verify-token'],
        });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'request_err', err: msg });
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
