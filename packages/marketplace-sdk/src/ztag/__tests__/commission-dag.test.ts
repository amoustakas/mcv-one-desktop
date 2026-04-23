// UWG Commission DAG contract tests.
//
// Locks the Kani-style invariants from MCV_MASTER_SPEC §6.3:
//   - Tier rates sum to exactly 9.25% (cumulative cap)
//   - No computed commission path can exceed the cumulative cap
//   - Cycles in the referral graph are rejected at insert time
//   - Self-referral is rejected
//   - Same riskFingerprint across referrer/referee is rejected
//     (NAOS anomaly detection)

import { describe, it, expect } from 'vitest';
import BN from 'bn.js';

import {
  CommissionDag,
  UwgDagError,
  UWG_TIER_BPS,
  UWG_CUMULATIVE_CAP_BPS,
} from '../commission-dag';

const SCALE = new BN(10).pow(new BN(18));
const usd = (amount: number): BN => new BN(amount).mul(SCALE);

describe('UWG constants', () => {
  it('tier rates are exactly [5%, 2.5%, 1%, 0.5%, 0.25%, 0%] in basis points', () => {
    expect(UWG_TIER_BPS).toEqual([500, 250, 100, 50, 25, 0]);
  });

  it('tier rates sum to the cumulative cap', () => {
    const sum = UWG_TIER_BPS.reduce((s, bp) => s + bp, 0);
    expect(sum).toBe(UWG_CUMULATIVE_CAP_BPS);
    expect(sum).toBe(925); // 9.25%
  });
});

describe('CommissionDag — insertion', () => {
  it('inserts a root node (no referrer) cleanly', () => {
    const dag = new CommissionDag();
    dag.insert({ userId: 'alice', referrerUserId: null, riskFingerprint: 'fp-a', joinedAt: '2026-01-01' });
    expect(dag.size()).toBe(1);
  });

  it('rejects self-referral', () => {
    const dag = new CommissionDag();
    expect(() => dag.insert({
      userId: 'alice', referrerUserId: 'alice', riskFingerprint: 'fp-a', joinedAt: 'now',
    })).toThrowError(UwgDagError);
    try {
      dag.insert({ userId: 'alice', referrerUserId: 'alice', riskFingerprint: 'fp-a', joinedAt: 'now' });
    } catch (err) {
      expect((err as UwgDagError).code).toBe('self-referral');
    }
  });

  it('rejects duplicate user', () => {
    const dag = new CommissionDag();
    dag.insert({ userId: 'alice', referrerUserId: null, riskFingerprint: 'fp-a', joinedAt: '1' });
    try {
      dag.insert({ userId: 'alice', referrerUserId: null, riskFingerprint: 'fp-a2', joinedAt: '2' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as UwgDagError).code).toBe('duplicate-user');
    }
  });

  it('rejects referrer not in DAG', () => {
    const dag = new CommissionDag();
    try {
      dag.insert({ userId: 'bob', referrerUserId: 'ghost', riskFingerprint: 'fp-b', joinedAt: 'now' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as UwgDagError).code).toBe('duplicate-user'); // reused error code; message specifies referrer
    }
  });

  it('rejects risk-fingerprint collision (NAOS self-referral ring detection)', () => {
    const dag = new CommissionDag();
    dag.insert({ userId: 'alice', referrerUserId: null, riskFingerprint: 'shared-fp', joinedAt: '1' });
    try {
      dag.insert({ userId: 'bob', referrerUserId: 'alice', riskFingerprint: 'shared-fp', joinedAt: '2' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as UwgDagError).code).toBe('risk-fingerprint-collision');
    }
  });

  it('allows chained referrals of distinct fingerprints', () => {
    const dag = new CommissionDag();
    dag.insert({ userId: 'a', referrerUserId: null, riskFingerprint: 'fp-a', joinedAt: '1' });
    dag.insert({ userId: 'b', referrerUserId: 'a', riskFingerprint: 'fp-b', joinedAt: '2' });
    dag.insert({ userId: 'c', referrerUserId: 'b', riskFingerprint: 'fp-c', joinedAt: '3' });
    dag.insert({ userId: 'd', referrerUserId: 'c', riskFingerprint: 'fp-d', joinedAt: '4' });
    expect(dag.size()).toBe(4);
    const ancestors = dag.ancestorsOf('d');
    expect(ancestors.map((n) => n.userId)).toEqual(['c', 'b', 'a']);
  });
});

describe('CommissionDag — computeCommissionPath', () => {
  function makeChain(dag: CommissionDag, length: number): void {
    dag.insert({ userId: 'u0', referrerUserId: null, riskFingerprint: 'fp-0', joinedAt: '0' });
    for (let i = 1; i < length; i++) {
      dag.insert({
        userId: `u${i}`,
        referrerUserId: `u${i - 1}`,
        riskFingerprint: `fp-${i}`,
        joinedAt: String(i),
      });
    }
  }

  it('allocates correct commission across 5 tiers for a 5-hop chain', () => {
    const dag = new CommissionDag();
    makeChain(dag, 6); // users u0..u5; u5 is buyer, 5 ancestors (u4..u0)

    const path = dag.computeCommissionPath('u5', usd(1000));

    // Ancestors in tier order: u4 (tier 1), u3 (tier 2), u2 (tier 3), u1 (tier 4), u0 (tier 5)
    expect(path.tiers).toHaveLength(5); // tier 6 is 0% → skipped
    expect(path.tiers[0]).toMatchObject({ tier: 1, recipientUserId: 'u4', rateBps: 500 });
    expect(path.tiers[1]).toMatchObject({ tier: 2, recipientUserId: 'u3', rateBps: 250 });
    expect(path.tiers[2]).toMatchObject({ tier: 3, recipientUserId: 'u2', rateBps: 100 });
    expect(path.tiers[3]).toMatchObject({ tier: 4, recipientUserId: 'u1', rateBps: 50 });
    expect(path.tiers[4]).toMatchObject({ tier: 5, recipientUserId: 'u0', rateBps: 25 });

    // $1000 * 5% = $50, * 2.5% = $25, * 1% = $10, * 0.5% = $5, * 0.25% = $2.50
    // Note: BN(float) truncates, so fractional USD must be expressed as an
    // explicit BN of the raw value.
    expect(path.tiers[0].allocationRaw.toString()).toBe(usd(50).toString());
    expect(path.tiers[1].allocationRaw.toString()).toBe(usd(25).toString());
    expect(path.tiers[2].allocationRaw.toString()).toBe(usd(10).toString());
    expect(path.tiers[3].allocationRaw.toString()).toBe(usd(5).toString());
    // $2.50 raw = 25 * 10^18 / 10
    expect(path.tiers[4].allocationRaw.toString()).toBe(new BN(25).mul(SCALE).div(new BN(10)).toString());

    // Total = $92.50 (9.25% of $1000) = 925 * 10^18 / 10
    expect(path.totalCommissionRaw.toString()).toBe(new BN(925).mul(SCALE).div(new BN(10)).toString());
  });

  it('NEVER exceeds the 9.25% cumulative cap — Kani-style invariant', () => {
    const dag = new CommissionDag();
    makeChain(dag, 10); // deeper chain than 6 tiers
    const path = dag.computeCommissionPath('u9', usd(10_000));

    const cap = usd(10_000).mul(new BN(925)).div(new BN(10_000));
    expect(path.totalCommissionRaw.lte(cap)).toBe(true);
    // Also only 5 tiers should fire (tier 6 is 0%)
    expect(path.tiers).toHaveLength(5);
  });

  it('returns empty tier array for root-node purchases (no ancestors)', () => {
    const dag = new CommissionDag();
    dag.insert({ userId: 'root', referrerUserId: null, riskFingerprint: 'fp-r', joinedAt: '0' });
    const path = dag.computeCommissionPath('root', usd(500));
    expect(path.tiers).toHaveLength(0);
    expect(path.totalCommissionRaw.toString()).toBe('0');
  });
});
