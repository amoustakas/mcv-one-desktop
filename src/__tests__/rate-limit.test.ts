// src/__tests__/rate-limit.test.ts
// Contract tests for the Marathon #5 I3.3 rate-limiting middleware.
//
// Covers:
//   • in-memory bucket returns allowed=true for first N requests
//   • in-memory bucket returns allowed=false for request N+1
//   • bucket resets after windowMs
//   • getClientIp parses x-forwarded-for (first hop) + x-real-ip fallback + unknown
//   • withRateLimit sets x-ratelimit-limit / x-ratelimit-remaining / x-ratelimit-reset headers
//   • withRateLimit returns 429 with retry_after_s on exhausted bucket
//   • withRateLimit calls through to the inner handler when allowed

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  inMemoryCheck,
  checkRateLimit,
  getClientIp,
  withRateLimit,
  LIMITS,
  type RateLimitConfig,
} from '../lib/server/rate-limit';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeConfig(overrides?: Partial<RateLimitConfig>): RateLimitConfig {
  return {
    windowMs: 60_000,
    maxRequests: 3,
    keyPrefix: 'test',
    ...overrides,
  };
}

// Minimal Vercel-like request / response mocks.
function makeMockReq(headers: Record<string, string | undefined> = {}): {
  headers: Record<string, string | undefined>;
  method: string;
  body: unknown;
  query: Record<string, string>;
} {
  return { headers, method: 'POST', body: {}, query: {} };
}

function makeMockRes() {
  const res = {
    _status: 200,
    _headers: {} as Record<string, string>,
    _body: null as unknown,
    status(code: number) { res._status = code; return res; },
    setHeader(k: string, v: string) { res._headers[k] = v; return res; },
    json(body: unknown) { res._body = body; return res; },
  };
  return res;
}

// ─── inMemoryCheck ────────────────────────────────────────────────────────────

describe('inMemoryCheck', () => {
  // Each test gets a unique key prefix to avoid cross-test bucket pollution.
  let cfg: RateLimitConfig;
  let uniqueKey: string;

  beforeEach(() => {
    // Use a unique key per test so buckets don't bleed across runs.
    uniqueKey = `test-${Math.random().toString(36).slice(2)}`;
    cfg = makeConfig({ keyPrefix: uniqueKey });
  });

  it('allows the first request and returns remaining = maxRequests - 1', () => {
    const result = inMemoryCheck(uniqueKey, cfg);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(cfg.maxRequests - 1);
  });

  it('allows up to maxRequests and then rejects the next one', () => {
    for (let i = 0; i < cfg.maxRequests; i++) {
      const r = inMemoryCheck(uniqueKey, cfg);
      expect(r.allowed).toBe(true);
    }
    const overflow = inMemoryCheck(uniqueKey, cfg);
    expect(overflow.allowed).toBe(false);
    expect(overflow.remaining).toBe(0);
  });

  it('remaining decrements on each allowed call', () => {
    for (let i = 0; i < cfg.maxRequests; i++) {
      const r = inMemoryCheck(uniqueKey, cfg);
      expect(r.remaining).toBe(cfg.maxRequests - 1 - i);
    }
  });

  it('resets after windowMs has elapsed', () => {
    // Exhaust the bucket.
    for (let i = 0; i < cfg.maxRequests; i++) inMemoryCheck(uniqueKey, cfg);
    expect(inMemoryCheck(uniqueKey, cfg).allowed).toBe(false);

    // Fake time past the window by directly calling with a config that
    // window=1ms; wait 2ms so Date.now() > resetAt.
    const fastCfg: RateLimitConfig = { ...cfg, windowMs: 1 };
    const fastKey = `${uniqueKey}-fast`;
    for (let i = 0; i < fastCfg.maxRequests; i++) inMemoryCheck(fastKey, fastCfg);
    expect(inMemoryCheck(fastKey, fastCfg).allowed).toBe(false);

    // Sleep 2ms then retry — bucket should have reset.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const r = inMemoryCheck(fastKey, fastCfg);
        expect(r.allowed).toBe(true);
        expect(r.remaining).toBe(fastCfg.maxRequests - 1);
        resolve();
      }, 5);
    });
  });

  it('resetAt is in the future', () => {
    const before = Date.now();
    const r = inMemoryCheck(uniqueKey, cfg);
    expect(r.resetAt).toBeGreaterThanOrEqual(before + cfg.windowMs - 5);
  });
});

// ─── checkRateLimit (async wrapper) ──────────────────────────────────────────

describe('checkRateLimit', () => {
  it('delegates to inMemoryCheck and returns a RateLimitResult', async () => {
    const key = `async-test-${Math.random().toString(36).slice(2)}`;
    const cfg = makeConfig({ keyPrefix: key });
    const r = await checkRateLimit(key, cfg);
    expect(r.allowed).toBe(true);
    expect(typeof r.remaining).toBe('number');
    expect(typeof r.resetAt).toBe('number');
  });
});

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('returns the first hop from x-forwarded-for', () => {
    const req = makeMockReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('trims whitespace from the first hop', () => {
    const req = makeMockReq({ 'x-forwarded-for': '  10.0.0.1 , 10.0.0.2' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeMockReq({ 'x-real-ip': '9.9.9.9' });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('returns "unknown" when no IP header is present', () => {
    const req = makeMockReq({});
    expect(getClientIp(req)).toBe('unknown');
  });

  it('handles req with no headers property', () => {
    expect(getClientIp({})).toBe('unknown');
  });

  it('x-forwarded-for takes precedence over x-real-ip', () => {
    const req = makeMockReq({ 'x-forwarded-for': '2.2.2.2', 'x-real-ip': '3.3.3.3' });
    expect(getClientIp(req)).toBe('2.2.2.2');
  });
});

// ─── withRateLimit ────────────────────────────────────────────────────────────

describe('withRateLimit', () => {
  it('sets x-ratelimit-limit header on every response', async () => {
    const cfg = makeConfig({ maxRequests: 5, keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const handler = vi.fn(async (_req: unknown, _res: unknown) => {});
    const wrapped = withRateLimit(cfg)(handler as never);
    const req = makeMockReq({ 'x-forwarded-for': '1.1.1.1' });
    const res = makeMockRes();
    await wrapped(req as never, res as never);
    expect(res._headers['x-ratelimit-limit']).toBe('5');
  });

  it('sets x-ratelimit-remaining correctly after first request', async () => {
    const cfg = makeConfig({ maxRequests: 5, keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const handler = vi.fn(async (_req: unknown, _res: unknown) => {});
    const wrapped = withRateLimit(cfg)(handler as never);
    const req = makeMockReq({ 'x-forwarded-for': '1.1.1.2' });
    const res = makeMockRes();
    await wrapped(req as never, res as never);
    expect(res._headers['x-ratelimit-remaining']).toBe('4');
  });

  it('sets x-ratelimit-reset as a unix second (integer-ish string)', async () => {
    const cfg = makeConfig({ keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const handler = vi.fn(async (_req: unknown, _res: unknown) => {});
    const wrapped = withRateLimit(cfg)(handler as never);
    const req = makeMockReq({ 'x-forwarded-for': '1.1.1.3' });
    const res = makeMockRes();
    await wrapped(req as never, res as never);
    const resetSec = Number(res._headers['x-ratelimit-reset']);
    expect(resetSec).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(Number.isInteger(resetSec)).toBe(true);
  });

  it('calls the inner handler when allowed', async () => {
    const cfg = makeConfig({ keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const innerHandler = vi.fn(async (_req: unknown, res: ReturnType<typeof makeMockRes>) => {
      res.status(200).json({ ok: true });
    });
    const wrapped = withRateLimit(cfg)(innerHandler as never);
    const req = makeMockReq({ 'x-forwarded-for': '5.5.5.5' });
    const res = makeMockRes();
    await wrapped(req as never, res as never);
    expect(innerHandler).toHaveBeenCalledOnce();
    expect(res._status).toBe(200);
  });

  it('returns 429 and does NOT call the inner handler when bucket is exhausted', async () => {
    const ip = `6.6.6.${Math.floor(Math.random() * 200)}`;
    const cfg = makeConfig({ maxRequests: 2, keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const innerHandler = vi.fn(async () => {});
    const wrapped = withRateLimit(cfg)(innerHandler as never);

    // Exhaust the bucket.
    for (let i = 0; i < cfg.maxRequests; i++) {
      const res = makeMockRes();
      await wrapped(makeMockReq({ 'x-forwarded-for': ip }) as never, res as never);
    }

    // Next call should be rejected.
    const res = makeMockRes();
    await wrapped(makeMockReq({ 'x-forwarded-for': ip }) as never, res as never);

    expect(res._status).toBe(429);
    expect((res._body as { error: string }).error).toBe('rate_limit_exceeded');
    expect(typeof (res._body as { retry_after_s: number }).retry_after_s).toBe('number');
    expect((res._body as { limit: number }).limit).toBe(cfg.maxRequests);
    expect((res._body as { window_s: number }).window_s).toBe(cfg.windowMs / 1000);
    // Inner handler should NOT have been called on the 429 response.
    expect(innerHandler).toHaveBeenCalledTimes(cfg.maxRequests);
  });

  it('sets retry-after header on 429', async () => {
    const ip = `7.7.7.${Math.floor(Math.random() * 200)}`;
    const cfg = makeConfig({ maxRequests: 1, keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const wrapped = withRateLimit(cfg)(vi.fn() as never);

    // First call — allowed.
    await wrapped(makeMockReq({ 'x-forwarded-for': ip }) as never, makeMockRes() as never);
    // Second call — rate limited.
    const res = makeMockRes();
    await wrapped(makeMockReq({ 'x-forwarded-for': ip }) as never, res as never);

    expect(Number(res._headers['retry-after'])).toBeGreaterThanOrEqual(1);
  });

  it('uses a custom identifier function when provided', async () => {
    const cfg = makeConfig({ maxRequests: 1, keyPrefix: `wrl-${Math.random().toString(36).slice(2)}` });
    const innerHandler = vi.fn(async () => {});
    // Always returns the same fixed key regardless of IP.
    const getKey = vi.fn(() => 'fixed-processor-key');
    const wrapped = withRateLimit(cfg, getKey)(innerHandler as never);

    await wrapped(makeMockReq({ 'x-forwarded-for': '1.2.3.4' }) as never, makeMockRes() as never);
    const res2 = makeMockRes();
    await wrapped(makeMockReq({ 'x-forwarded-for': '9.9.9.9' }) as never, res2 as never);

    // Both requests share the same bucket key — second should be 429.
    expect(res2._status).toBe(429);
    expect(getKey).toHaveBeenCalledTimes(2);
  });
});

// ─── LIMITS constants sanity ──────────────────────────────────────────────────

describe('LIMITS constants', () => {
  it('INVESTOR_FLOW has correct maxRequests=30', () => {
    expect(LIMITS.INVESTOR_FLOW.maxRequests).toBe(30);
  });
  it('PROSPECT_INTAKE has correct maxRequests=10', () => {
    expect(LIMITS.PROSPECT_INTAKE.maxRequests).toBe(10);
  });
  it('WEBHOOK has correct maxRequests=100', () => {
    expect(LIMITS.WEBHOOK.maxRequests).toBe(100);
  });
  it('all limits use 60s window', () => {
    for (const cfg of Object.values(LIMITS)) {
      expect(cfg.windowMs).toBe(60_000);
    }
  });
});
