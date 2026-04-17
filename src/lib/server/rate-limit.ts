// src/lib/server/rate-limit.ts
// Sliding-window rate limiter for investor/prospect/webhook handlers.
//
// Architecture:
//   • Primary: @upstash/ratelimit (Redis) — swap-in is one line in
//     checkRateLimit() when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//     are configured.
//   • Fallback: in-memory Map — per Vercel function instance, separate buckets
//     across instances. Adequate for M5 single-instance dev + low-traffic prod.
//
// Response headers follow the IETF draft-ietf-httpapi-ratelimit-headers spec:
//   x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset (Unix seconds)
// Plus retry-after (seconds) on 429.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;      // e.g. 60_000 for 1 minute
  maxRequests: number;   // e.g. 30
  keyPrefix: string;     // e.g. 'investor-flow'
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Unix ms
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

const buckets = new Map<string, { count: number; resetAt: number }>();

export function inMemoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }
  if (bucket.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count++;
  return { allowed: true, remaining: config.maxRequests - bucket.count, resetAt: bucket.resetAt };
}

// ─── Public check ─────────────────────────────────────────────────────────────

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  // TODO: swap in @upstash/ratelimit when UPSTASH_REDIS_REST_URL +
  // UPSTASH_REDIS_REST_TOKEN are set in env. One-line change:
  //   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`) });
  //   const { success, remaining, reset } = await ratelimit.limit(`${config.keyPrefix}:${identifier}`);
  //   return { allowed: success, remaining, resetAt: reset };
  const key = `${config.keyPrefix}:${identifier}`;
  return inMemoryCheck(key, config);
}

// ─── Well-known limit configs ─────────────────────────────────────────────────

export const LIMITS = {
  INVESTOR_FLOW:   { windowMs: 60_000, maxRequests: 30,  keyPrefix: 'investor-flow'   },
  PROSPECT_INTAKE: { windowMs: 60_000, maxRequests: 10,  keyPrefix: 'prospect-intake' },
  WEBHOOK:         { windowMs: 60_000, maxRequests: 100, keyPrefix: 'webhook'          },
  DEFAULT:         { windowMs: 60_000, maxRequests: 60,  keyPrefix: 'default'          },
} as const;

// ─── IP extraction ────────────────────────────────────────────────────────────

/** Extract the real client IP from a Vercel serverless request. */
export function getClientIp(req: { headers?: Record<string, unknown> }): string {
  const h = req.headers ?? {};
  const forwarded = (h['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const real = h['x-real-ip'] as string | undefined;
  return forwarded ?? real ?? 'unknown';
}

// ─── Higher-order wrapper ─────────────────────────────────────────────────────

/**
 * Wrap a Vercel handler with rate limiting.
 *
 * @param config       - RateLimitConfig (use LIMITS.* constants)
 * @param getIdentifier - extract a bucket key from the request (default: client IP)
 *
 * Compose with other HOCs:
 *   export default withAuth(withRateLimit(LIMITS.INVESTOR_FLOW)(handler));
 */
export function withRateLimit(
  config: RateLimitConfig,
  getIdentifier: (req: VercelRequest) => string = getClientIp,
) {
  return function wrap(
    handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void,
  ) {
    return async function wrapped(req: VercelRequest, res: VercelResponse) {
      const id = getIdentifier(req);
      const result = await checkRateLimit(id, config);

      res.setHeader('x-ratelimit-limit',     String(config.maxRequests));
      res.setHeader('x-ratelimit-remaining', String(result.remaining));
      res.setHeader('x-ratelimit-reset',     String(Math.floor(result.resetAt / 1000)));

      if (!result.allowed) {
        const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        res.setHeader('retry-after', String(retryAfter));
        res.status(429).json({
          error: 'rate_limit_exceeded',
          retry_after_s: retryAfter,
          limit: config.maxRequests,
          window_s: config.windowMs / 1000,
        });
        return;
      }

      return handler(req, res);
    };
  };
}
