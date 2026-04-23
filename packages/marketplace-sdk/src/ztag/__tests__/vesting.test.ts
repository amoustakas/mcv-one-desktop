// UWG 90-day time-weighted vesting contract tests.

import { describe, it, expect } from 'vitest';
import BN from 'bn.js';

import {
  UWG_VESTING_PERIOD_MS,
  vestedAmount,
  claimableAmount,
  recordClaim,
} from '../vesting';

const SCALE = new BN(10).pow(new BN(18));
const grant = new BN(1000).mul(SCALE); // $1,000

describe('UWG vesting', () => {
  it('UWG_VESTING_PERIOD_MS is exactly 90 days', () => {
    expect(UWG_VESTING_PERIOD_MS).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it('vested amount is 0 at grant time', () => {
    const v = vestedAmount({ grantedRaw: grant, grantedAtMs: 1000, atTimeMs: 1000 });
    expect(v.toString()).toBe('0');
  });

  it('vested amount is 0 before grant time', () => {
    const v = vestedAmount({ grantedRaw: grant, grantedAtMs: 2000, atTimeMs: 1000 });
    expect(v.toString()).toBe('0');
  });

  it('vested amount is 100% at grant + 90 days', () => {
    const v = vestedAmount({
      grantedRaw: grant,
      grantedAtMs: 0,
      atTimeMs: UWG_VESTING_PERIOD_MS,
    });
    expect(v.toString()).toBe(grant.toString());
  });

  it('vested amount is 100% beyond grant + 90 days (no over-vesting)', () => {
    const v = vestedAmount({
      grantedRaw: grant,
      grantedAtMs: 0,
      atTimeMs: UWG_VESTING_PERIOD_MS * 2,
    });
    expect(v.toString()).toBe(grant.toString());
  });

  it('linear mid-point (45 days) = 50% vested', () => {
    const v = vestedAmount({
      grantedRaw: grant,
      grantedAtMs: 0,
      atTimeMs: UWG_VESTING_PERIOD_MS / 2,
    });
    expect(v.toString()).toBe(grant.div(new BN(2)).toString());
  });

  it('claimable subtracts already-claimed amounts', () => {
    const c = claimableAmount({
      grantedRaw: grant,
      grantedAtMs: 0,
      atTimeMs: UWG_VESTING_PERIOD_MS / 2,
      alreadyClaimedRaw: grant.div(new BN(4)), // claimed 25%, vested 50% → 25% remaining
    });
    expect(c.toString()).toBe(grant.div(new BN(4)).toString());
  });

  it('claimable returns 0 if already-claimed exceeds vested (defensive)', () => {
    const c = claimableAmount({
      grantedRaw: grant,
      grantedAtMs: 0,
      atTimeMs: UWG_VESTING_PERIOD_MS / 4, // 25% vested
      alreadyClaimedRaw: grant.div(new BN(2)), // claimed 50% somehow
    });
    expect(c.toString()).toBe('0');
  });

  it('recordClaim advances state idempotently', () => {
    const initial = { grantedRaw: grant, grantedAtMs: 0, claimedRaw: new BN(0) };
    // First claim at mid-vesting — should release ~50%
    const { updated, releasedRaw } = recordClaim(initial, UWG_VESTING_PERIOD_MS / 2);
    expect(releasedRaw.toString()).toBe(grant.div(new BN(2)).toString());
    expect(updated.claimedRaw.toString()).toBe(grant.div(new BN(2)).toString());

    // Second claim at same time — no new release (idempotent)
    const second = recordClaim(updated, UWG_VESTING_PERIOD_MS / 2);
    expect(second.releasedRaw.toString()).toBe('0');

    // Third claim at full vesting — releases remaining 50%
    const third = recordClaim(second.updated, UWG_VESTING_PERIOD_MS);
    expect(third.releasedRaw.toString()).toBe(grant.div(new BN(2)).toString());
    expect(third.updated.claimedRaw.toString()).toBe(grant.toString());
  });
});
