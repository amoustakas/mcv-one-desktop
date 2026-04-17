// src/lib/server/require-venture-scope.ts
// Marathon #5 I3.4 — Clerk venture-scope RBAC.
//
// Layered on top of the I3.1 RLS work (0aff7b2), which reads
// `auth.jwt()->>'venture_scope'` at the Postgres row level. This helper is the
// application-layer counterpart: it re-verifies the Clerk session token and
// asserts that the caller's `venture_scope` claim matches the venture_id the
// handler is about to mutate. `mcv_admin` role bypasses the check.
//
// Used by high-value API handlers (capital / prospects / venture-detail /
// distributions). Composes cleanly with `withAuth` (api/_handlers/_auth.ts)
// and `withRateLimit` (src/lib/server/rate-limit.ts):
//
//   export default withRateLimit(LIMITS.DEFAULT)(
//     withVentureScope((req) => req.body?.venture_id)(handler)
//   );
//
// Claim layout (set by Clerk session token template — `venture_scope` is
// flattened from the active organization's publicMetadata.venture_id):
//
//   {
//     "sub": "user_xxx",
//     "org_id": "org_xxx",
//     "venture_scope": "futurestate",      // active venture
//     "role": "operator" | "mcv_admin",    // org role, flattened to `role`
//     "org_metadata": { "venture_id": "futurestate" }   // fallback source
//   }

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeErrorCode = 'no_auth' | 'no_scope' | 'scope_mismatch' | 'venture_not_found';

export class VentureScopeError extends Error {
  code: ScopeErrorCode;
  details?: unknown;
  constructor(code: ScopeErrorCode, details?: unknown) {
    super(`venture_scope_error:${code}`);
    this.code = code;
    this.details = details;
  }
}

export interface VentureScopeClaim {
  userId: string;
  orgId: string;
  role: string;
}

type AuthedRequest = VercelRequest & {
  auth?: {
    userId?: string;
    orgId?: string;
    sessionClaims?: Record<string, unknown>;
  };
};

// ─── Token hydration ──────────────────────────────────────────────────────────

/**
 * Re-verify the Clerk session token and hydrate `req.auth` with the full
 * claim set. The existing `withAuth` helper only attaches `userId` (Clerk sub),
 * which is insufficient for scope checks — we need the full session claims.
 *
 * Called by `requireVentureScope` on entry when `req.auth` isn't already set.
 * When `CLERK_SECRET_KEY` is unset (dev without Clerk), the helper falls back
 * to a permissive claim reader that reads `x-dev-auth-*` headers — matching
 * the rate-limit + webhook-verify test style.
 */
async function hydrateAuth(req: AuthedRequest): Promise<void> {
  if (req.auth?.sessionClaims) return;

  const secretKey = process.env.CLERK_SECRET_KEY;

  // Dev fallback — lets contract tests drive claims without minting a real
  // Clerk JWT. Headers checked:
  //   x-dev-auth-user-id, x-dev-auth-org-id, x-dev-auth-role,
  //   x-dev-auth-venture-scope
  if (!secretKey || process.env.VENTURE_SCOPE_DEV_HEADERS === 'true') {
    const h = req.headers ?? {};
    const devUserId = h['x-dev-auth-user-id'] as string | undefined;
    if (devUserId) {
      req.auth = {
        userId: devUserId,
        orgId: (h['x-dev-auth-org-id'] as string | undefined) ?? '',
        sessionClaims: {
          sub: devUserId,
          role: (h['x-dev-auth-role'] as string | undefined) ?? 'user',
          venture_scope: h['x-dev-auth-venture-scope'] as string | undefined,
        },
      };
      return;
    }
    if (!secretKey) {
      // No secret + no dev header — handler is running unauthenticated.
      // `requireVentureScope` will throw `no_auth`.
      return;
    }
  }

  const authHeader = req.headers?.authorization;
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const sessionCookie = (req.cookies as Record<string, string | undefined> | undefined)?.__session;
  const token = bearerToken || sessionCookie;
  if (!token) return;

  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    req.auth = {
      userId: payload.sub,
      orgId: (payload as unknown as { org_id?: string }).org_id ?? '',
      sessionClaims: payload as unknown as Record<string, unknown>,
    };
  } catch (err) {
    console.warn('[venture-scope] token verify failed:', err instanceof Error ? err.message : err);
  }
}

// ─── Core check ───────────────────────────────────────────────────────────────

/**
 * Extract the caller's venture_scope claim. Reads `venture_scope` first
 * (flat top-level claim), then `org_metadata.venture_id` (Clerk's default
 * shape for public org metadata when not flattened in the JWT template).
 */
function readVentureScope(claims: Record<string, unknown>): string | undefined {
  const direct = claims['venture_scope'];
  if (typeof direct === 'string' && direct.length > 0) return direct;
  const orgMeta = claims['org_metadata'];
  if (orgMeta && typeof orgMeta === 'object') {
    const vid = (orgMeta as Record<string, unknown>)['venture_id'];
    if (typeof vid === 'string' && vid.length > 0) return vid;
  }
  return undefined;
}

/**
 * Enforce that the authenticated caller has the given venture_id in their
 * Clerk session's `venture_scope` claim, OR that they hold the `mcv_admin`
 * role. Hydrates `req.auth` from the session token on first call.
 *
 * Throws VentureScopeError on failure. Returns {userId, orgId, role} on pass.
 */
export async function requireVentureScope(
  req: AuthedRequest,
  ventureId: string,
): Promise<VentureScopeClaim> {
  await hydrateAuth(req);

  const auth = req.auth;
  if (!auth?.userId) throw new VentureScopeError('no_auth');

  const claims = auth.sessionClaims ?? {};
  const role = (claims['role'] as string | undefined) ?? 'user';

  // MCV admin bypasses venture-scope check — gets ecosystem-wide access.
  if (role === 'mcv_admin') {
    return { userId: auth.userId, orgId: auth.orgId ?? '', role };
  }

  const scope = readVentureScope(claims);
  if (!scope) throw new VentureScopeError('no_scope');
  if (scope !== ventureId) {
    throw new VentureScopeError('scope_mismatch', { expected: ventureId, actual: scope });
  }

  return { userId: auth.userId, orgId: auth.orgId ?? '', role };
}

// ─── HOC wrapper ──────────────────────────────────────────────────────────────

const SCOPE_STATUS: Record<ScopeErrorCode, number> = {
  no_auth: 401,
  no_scope: 403,
  scope_mismatch: 403,
  venture_not_found: 404,
};

/**
 * Map a VentureScopeError to a structured JSON response. Handlers that do
 * per-action scoping inside the switch dispatch can call `requireVentureScope`
 * directly and catch + forward via this helper.
 */
export function respondToScopeError(res: VercelResponse, err: VentureScopeError): void {
  res.status(SCOPE_STATUS[err.code] ?? 403).json({
    error: err.message,
    code: err.code,
    details: err.details,
  });
}

/**
 * Higher-order wrapper — extracts venture_id from the request via the caller's
 * extractor, enforces scope, and delegates to the inner handler.
 *
 * Extractor may return `null | undefined` to skip the scope check — useful for
 * multi-action handlers where some actions are cross-venture by design
 * (e.g. list-public-rounds, admin search). Those actions still pass through
 * auth (`withAuth`) + rate-limit layers; only the scope gate is opt-in.
 */
export function withVentureScope<Req extends VercelRequest, Res extends VercelResponse>(
  extractVentureId: (req: Req) => string | null | undefined | Promise<string | null | undefined>,
) {
  return function wrap(handler: (req: Req, res: Res) => Promise<void> | void | Promise<unknown> | unknown) {
    return async function wrapped(req: Req, res: Res): Promise<void> {
      try {
        const ventureId = await extractVentureId(req);
        if (ventureId) {
          await requireVentureScope(
            req as unknown as AuthedRequest,
            ventureId,
          );
        }
        await handler(req, res);
        return;
      } catch (err) {
        if (err instanceof VentureScopeError) {
          respondToScopeError(res, err);
          return;
        }
        throw err;
      }
    };
  };
}
