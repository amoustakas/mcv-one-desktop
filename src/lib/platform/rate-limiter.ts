// src/lib/platform/rate-limiter.ts
// In-memory sliding-window rate limiter
// Each serverless function instance maintains its own window.
// This is sufficient for Vercel's concurrency model — no shared state needed.

import type { RateLimitTier } from './api-keys';

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMIT CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const RATE_LIMITS: Record<RateLimitTier, number> = {
  free:       100,
  growth:     1_000,
  scale:      10_000,
  enterprise: 100_000,
};

const WINDOW_MS = 60_000; // 1 minute sliding window

// ─────────────────────────────────────────────────────────────────────────────
// SLIDING WINDOW STORE
// ─────────────────────────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];  // request timestamps within the current window
}

const store = new Map<string, WindowEntry>();

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMIT RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;       // ISO timestamp when window resets
  limit: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check and record a request against the rate limit for a given keyId + tier.
 * Uses sliding window: only counts requests within the last WINDOW_MS milliseconds.
 *
 * @param keyId  - The API key ID (used as map key)
 * @param tier   - The rate limit tier from the key record
 * @returns RateLimitResult indicating whether request is allowed
 */
export function checkRateLimit(keyId: string, tier: RateLimitTier): RateLimitResult {
  const limit = RATE_LIMITS[tier];
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = store.get(keyId);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(keyId, entry);
  }

  // Evict timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const count = entry.timestamps.length;
  const resetAt = new Date(now + WINDOW_MS).toISOString();

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt,
    limit,
  };
}

/**
 * Peek at current rate limit status without recording a request.
 */
export function peekRateLimit(keyId: string, tier: RateLimitTier): RateLimitResult {
  const limit = RATE_LIMITS[tier];
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const entry = store.get(keyId);
  const timestamps = (entry?.timestamps ?? []).filter((ts) => ts > windowStart);
  const count = timestamps.length;

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(now + WINDOW_MS).toISOString(),
    limit,
  };
}

/**
 * Clear the rate limit state for a key (useful for testing or admin resets).
 */
export function resetRateLimit(keyId: string): void {
  store.delete(keyId);
}
