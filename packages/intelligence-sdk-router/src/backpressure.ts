/**
 * Per-tenant token bucket for observe() writes.
 *
 * Spec (Plan §1.4):
 *   Per-tenant token-bucket on observe() writes — 100 writes/sec default —
 *   overflow emits knowledge.backpressure event.
 *
 * Implementation is in-memory and scoped to a single Router instance
 * (which lives for the duration of one request in serverless). Per-tenant
 * rate smoothing across multiple instances is a Phase-5 Upstash follow-up.
 */

export interface TokenBucketOpts {
  /** Tokens added per second (== ratelimit in steady-state). */
  refillPerSec: number;
  /** Max tokens the bucket can hold. Defaults to `refillPerSec`. */
  capacity?: number;
  /** Clock injection point — useful for tests. */
  now?: () => number;
}

export class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private lastRefill: number;
  private readonly now: () => number;

  constructor(opts: TokenBucketOpts) {
    if (opts.refillPerSec <= 0) {
      throw new Error('TokenBucket: refillPerSec must be > 0');
    }
    this.capacity = opts.capacity ?? opts.refillPerSec;
    this.tokens = this.capacity;
    this.refillPerMs = opts.refillPerSec / 1000;
    this.now = opts.now ?? (() => Date.now());
    this.lastRefill = this.now();
  }

  /**
   * Attempt to consume `cost` tokens. Returns true if the bucket
   * had capacity; false if the call should be backpressured.
   */
  tryConsume(cost: number = 1): boolean {
    this.refill();
    if (this.tokens < cost) {
      return false;
    }
    this.tokens -= cost;
    return true;
  }

  /** Current token count after refill. Read-only snapshot. */
  peek(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const n = this.now();
    const elapsed = Math.max(0, n - this.lastRefill);
    if (elapsed === 0) return;
    const add = elapsed * this.refillPerMs;
    this.tokens = Math.min(this.capacity, this.tokens + add);
    this.lastRefill = n;
  }
}

/**
 * Registry of per-tenant buckets. Router holds one of these and
 * consults it on every observe() call.
 */
export class BackpressureRegistry {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly defaultRate: number;
  private readonly now: () => number;

  constructor(defaultRate: number = 100, now?: () => number) {
    this.defaultRate = defaultRate;
    this.now = now ?? (() => Date.now());
  }

  /** Returns true if the observe is allowed; false if throttled. */
  allow(tenantId: string, cost: number = 1): boolean {
    let bucket = this.buckets.get(tenantId);
    if (!bucket) {
      bucket = new TokenBucket({ refillPerSec: this.defaultRate, now: this.now });
      this.buckets.set(tenantId, bucket);
    }
    return bucket.tryConsume(cost);
  }

  /** Diagnostic: current tenant count. */
  size(): number {
    return this.buckets.size;
  }
}
