import { describe, it, expect } from 'vitest';
import { TokenBucket, BackpressureRegistry } from '../backpressure.js';

describe('TokenBucket', () => {
  it('starts full at capacity', () => {
    const b = new TokenBucket({ refillPerSec: 10 });
    expect(b.peek()).toBe(10);
  });

  it('tryConsume succeeds within capacity', () => {
    const b = new TokenBucket({ refillPerSec: 10 });
    expect(b.tryConsume(1)).toBe(true);
    expect(b.tryConsume(1)).toBe(true);
  });

  it('tryConsume fails when empty', () => {
    const time = 0;
    const b = new TokenBucket({ refillPerSec: 1, capacity: 1, now: () => time });
    expect(b.tryConsume(1)).toBe(true);
    expect(b.tryConsume(1)).toBe(false); // bucket empty, no time passed
  });

  it('refills over time', () => {
    let time = 0;
    const b = new TokenBucket({ refillPerSec: 10, capacity: 10, now: () => time });
    // drain
    for (let i = 0; i < 10; i++) b.tryConsume(1);
    expect(b.tryConsume(1)).toBe(false);
    // 100ms → +1 token
    time = 100;
    expect(b.tryConsume(1)).toBe(true);
    expect(b.tryConsume(1)).toBe(false);
  });

  it('refill caps at capacity', () => {
    let time = 0;
    const b = new TokenBucket({ refillPerSec: 10, capacity: 10, now: () => time });
    time = 10_000; // 10 seconds later — infinite-feeling refill
    expect(b.peek()).toBe(10);
  });

  it('throws on invalid rate', () => {
    expect(() => new TokenBucket({ refillPerSec: 0 })).toThrow();
    expect(() => new TokenBucket({ refillPerSec: -1 })).toThrow();
  });
});

describe('BackpressureRegistry', () => {
  it('isolates buckets per tenant', () => {
    const time = 0;
    const reg = new BackpressureRegistry(1, () => time);
    expect(reg.allow('tenant-A', 1)).toBe(true);
    expect(reg.allow('tenant-A', 1)).toBe(false); // exhausted
    expect(reg.allow('tenant-B', 1)).toBe(true);  // different tenant, independent
  });

  it('counts active tenants', () => {
    const reg = new BackpressureRegistry(5);
    reg.allow('a');
    reg.allow('b');
    reg.allow('a');
    expect(reg.size()).toBe(2);
  });
});
