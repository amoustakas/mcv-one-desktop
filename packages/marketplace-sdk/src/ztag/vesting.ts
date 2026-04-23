// UWG Vesting — 90-day time-weighted linear vesting for commissions.
//
// Commission allocations (from commission-dag.ts) are not immediately
// claimable. They vest linearly over 90 days starting from the grant
// timestamp. At t=0 none is claimable; at t=45 days, 50% is claimable;
// at t=90 days, 100% is claimable. Claims are idempotent — caller tracks
// already-claimed totals.
//
// Math is deterministic integer arithmetic (BN u128, 10^18 scaling).
// Time inputs are epoch ms; elapsed fractions round toward zero.

import BN from 'bn.js';

/** 90 days in milliseconds. */
export const UWG_VESTING_PERIOD_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Compute the portion of a grant that is vested at a given time.
 * Returns zero before grant time, full amount at/after grant + 90 days,
 * linear interpolation in between.
 *
 * Pure function — deterministic, no clock calls.
 */
export function vestedAmount(params: {
  grantedRaw: BN;
  grantedAtMs: number;
  atTimeMs: number;
}): BN {
  const elapsedMs = params.atTimeMs - params.grantedAtMs;
  if (elapsedMs <= 0) return new BN(0);
  if (elapsedMs >= UWG_VESTING_PERIOD_MS) return params.grantedRaw.clone();
  // vested = grantedRaw * elapsedMs / UWG_VESTING_PERIOD_MS
  return params.grantedRaw.mul(new BN(elapsedMs)).div(new BN(UWG_VESTING_PERIOD_MS));
}

/**
 * Compute the amount claimable RIGHT NOW given an already-claimed running
 * total. Guarantees claimable >= 0 even if a claim history has been over-
 * withdrawn due to clock drift (which shouldn't happen in prod but we
 * refuse to return a negative value).
 */
export function claimableAmount(params: {
  grantedRaw: BN;
  grantedAtMs: number;
  atTimeMs: number;
  alreadyClaimedRaw: BN;
}): BN {
  const vested = vestedAmount({
    grantedRaw: params.grantedRaw,
    grantedAtMs: params.grantedAtMs,
    atTimeMs: params.atTimeMs,
  });
  const remaining = vested.sub(params.alreadyClaimedRaw);
  return remaining.isNeg() ? new BN(0) : remaining;
}

export interface VestingState {
  grantedRaw: BN;
  grantedAtMs: number;
  claimedRaw: BN;
}

/** Record a claim, returning the updated state + amount actually released. */
export function recordClaim(
  state: VestingState,
  atTimeMs: number,
): { updated: VestingState; releasedRaw: BN } {
  const released = claimableAmount({
    grantedRaw: state.grantedRaw,
    grantedAtMs: state.grantedAtMs,
    atTimeMs,
    alreadyClaimedRaw: state.claimedRaw,
  });
  return {
    updated: {
      grantedRaw: state.grantedRaw,
      grantedAtMs: state.grantedAtMs,
      claimedRaw: state.claimedRaw.add(released),
    },
    releasedRaw: released,
  };
}
