// src/lib/mcv-core/identity-token.ts
//
// Clerk JWT → MCV Identity token exchange, with in-memory caching and refresh-
// before-expiry. Used at app boot and on demand whenever an authenticated
// Identity API call needs a fresh venture-scoped token.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPORTANT: The /auth/exchange endpoint does not yet exist on the Identity
// service. See TRIANGLE_GAPS.md. Until it ships, exchangeClerkToken() will
// catch the 404, log once, and return null — callers must keep operating in
// "Clerk-only" mode (existing behavior). This file wires the call site so
// that flipping the gap into a working endpoint is a zero-app-change deploy.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface IdentityTokenBundle {
  /** Identity-issued JWT (RS256, iss='mcv-identity'). */
  accessToken: string;
  /** Unix epoch ms at which the token expires. */
  expiresAtMs: number;
  /** Venture this token is scoped to (if scoping was requested). */
  ventureId?: string;
}

interface CacheEntry extends IdentityTokenBundle {
  /** Identifier we exchanged from — re-keys the cache when Clerk session changes. */
  clerkSubject: string;
}

let cache: CacheEntry | null = null;
let exchangeWarnedOnce = false;

/** Refresh window: re-exchange this many ms before expiry. */
const REFRESH_LEAD_MS = 60_000;

export function clearIdentityTokenCache(): void {
  cache = null;
}

/**
 * Decode a JWT payload without verification (we trust the issuer at the
 * point of use; this is just for reading `sub` / `exp`).
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const part = jwt.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export interface ExchangeOptions {
  /** Identity service base URL — must be set or exchange returns null. */
  identityUrl: string | undefined;
  /** Clerk JWT to exchange. */
  clerkJwt: string;
  /** Optional venture scope to embed in the resulting Identity token. */
  ventureId?: string;
  /** Override for tests. */
  fetchImpl?: typeof fetch;
}

/**
 * Exchange a Clerk JWT for an Identity-issued token. Returns null when:
 *   - identityUrl is unset (Triangle not configured)
 *   - the /auth/exchange endpoint returns 404 (gap; documented)
 *   - any network failure (graceful fallback to Clerk-only)
 *
 * On 4xx/5xx other than 404 we still return null but log; callers degrade.
 */
export async function exchangeClerkToken(opts: ExchangeOptions): Promise<IdentityTokenBundle | null> {
  if (!opts.identityUrl) return null;
  const f = opts.fetchImpl ?? fetch;
  try {
    const res = await f(`${opts.identityUrl.replace(/\/$/, '')}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.clerkJwt}` },
      body: JSON.stringify({ provider: 'clerk', token: opts.clerkJwt, ventureId: opts.ventureId }),
    });
    if (res.status === 404) {
      if (!exchangeWarnedOnce) {
        // eslint-disable-next-line no-console
        console.warn('[identity] /auth/exchange not implemented on Identity service — see TRIANGLE_GAPS.md. Falling back to Clerk-only auth.');
        exchangeWarnedOnce = true;
      }
      return null;
    }
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[identity] /auth/exchange failed (${res.status}); falling back to Clerk-only.`);
      return null;
    }
    const body = (await res.json()) as { accessToken: string; expiresAt: string | number; ventureId?: string };
    const expiresAtMs = typeof body.expiresAt === 'number' ? body.expiresAt : Date.parse(body.expiresAt);
    return { accessToken: body.accessToken, expiresAtMs, ventureId: body.ventureId };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[identity] /auth/exchange network error; falling back to Clerk-only.', err);
    return null;
  }
}

/**
 * Cached exchange — call this on every Identity request. Re-exchanges if no
 * cache entry, if the Clerk subject changed, or if the token is within
 * REFRESH_LEAD_MS of expiry.
 */
export async function getIdentityToken(opts: {
  identityUrl: string | undefined;
  clerkJwt: string;
  ventureId?: string;
}): Promise<IdentityTokenBundle | null> {
  const decoded = decodeJwtPayload(opts.clerkJwt);
  const subject = String(decoded?.sub ?? '');
  const now = Date.now();

  if (
    cache &&
    cache.clerkSubject === subject &&
    cache.ventureId === opts.ventureId &&
    cache.expiresAtMs - REFRESH_LEAD_MS > now
  ) {
    return cache;
  }

  const fresh = await exchangeClerkToken({
    identityUrl: opts.identityUrl,
    clerkJwt: opts.clerkJwt,
    ventureId: opts.ventureId,
  });
  if (!fresh) {
    cache = null;
    return null;
  }
  cache = { ...fresh, clerkSubject: subject };
  return fresh;
}
