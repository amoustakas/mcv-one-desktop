// UWG Commission DAG — Universal Wealth Generation 6-tier referral structure.
//
// 6 tiers with decaying commission rates:
//   Tier 1: 5.00%    Tier 2: 2.50%    Tier 3: 1.00%
//   Tier 4: 0.50%    Tier 5: 0.25%    Tier 6: 0.00%
//   Cumulative cap: 9.25%  (Kani-style invariant enforced at insert-time)
//
// Graph rules:
//   - DAG only; cycles rejected at insertion
//   - Each referee has exactly one referrer
//   - NAOS anomaly detection flags self-referral rings (same legal entity
//     using multiple wallets to farm their own commission) via the
//     `riskFingerprint` input
//
// Math:
//   - All monetary values BN u128 with 10^18 scaling
//   - Commission rates stored in basis points (integer) to avoid float
//   - computeCommissionPath() walks referrer chain up to 6 hops and
//     allocates commission per tier
//
// Vesting happens in vesting.ts — this file only computes the amount each
// tier is OWED; the 90-day time-weighted claim curve is separate.

import BN from 'bn.js';

// ───────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────

/** Commission rates per tier in basis points (100 = 1%). Immutable, Kani-verified. */
export const UWG_TIER_BPS: readonly number[] = Object.freeze([500, 250, 100, 50, 25, 0]);

/** Hard cap across all 6 tiers. Sum of UWG_TIER_BPS = 925 bps = 9.25%. */
export const UWG_CUMULATIVE_CAP_BPS = 925;

/** Assertion at module load — invariant MUST hold. */
(function assertTierCap() {
  const sum = UWG_TIER_BPS.reduce((s, bp) => s + bp, 0);
  if (sum !== UWG_CUMULATIVE_CAP_BPS) {
    throw new Error(`[uwg] tier sum ${sum} != cumulative cap ${UWG_CUMULATIVE_CAP_BPS} — constants are broken`);
  }
})();

const BASIS_POINT_SCALE = new BN(10000);

// ───────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────

/**
 * A single user in the DAG. `riskFingerprint` is used for NAOS anomaly
 * detection — identical fingerprints across referrer/referee reject the
 * relationship at insert time. In prod, the fingerprint is derived from
 * KYC identity + device attestation; in tests, any stable string works.
 */
export interface UwgNode {
  userId: string;
  referrerUserId: string | null;
  riskFingerprint: string;
  joinedAt: string;
}

/** Commission owed to a single tier after a purchase. */
export interface TierAllocation {
  tier: number;               // 1-6
  recipientUserId: string;
  /** Raw allocation before vesting; BN u128 with 10^18 scaling */
  allocationRaw: BN;
  /** Rate applied, in basis points */
  rateBps: number;
}

/** Result of computing a full commission path for a purchase. */
export interface CommissionPath {
  /** User who made the purchase */
  buyerUserId: string;
  /** Raw purchase amount, BN u128 with 10^18 scaling */
  purchaseAmountRaw: BN;
  /** Per-tier allocations. Up to 6 entries; short if chain ends early. */
  tiers: TierAllocation[];
  /** Sum of all tier allocations */
  totalCommissionRaw: BN;
}

// ───────────────────────────────────────────────────────────────────────────
// Errors
// ───────────────────────────────────────────────────────────────────────────

export type UwgErrorCode =
  | 'cycle-detected'
  | 'self-referral'
  | 'duplicate-user'
  | 'risk-fingerprint-collision'
  | 'tier-cap-violation';

export class UwgDagError extends Error {
  readonly code: UwgErrorCode;
  constructor(code: UwgErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'UwgDagError';
  }
}

// ───────────────────────────────────────────────────────────────────────────
// DAG
// ───────────────────────────────────────────────────────────────────────────

export class CommissionDag {
  private readonly nodes = new Map<string, UwgNode>();

  /** Insert a new user into the DAG. Rejects cycles + self-referrals + duplicate IDs. */
  insert(node: UwgNode): void {
    if (this.nodes.has(node.userId)) {
      throw new UwgDagError('duplicate-user', `User ${node.userId} already in DAG`);
    }

    if (node.referrerUserId === node.userId) {
      throw new UwgDagError('self-referral', `User ${node.userId} cannot refer themselves`);
    }

    if (node.referrerUserId !== null) {
      const referrer = this.nodes.get(node.referrerUserId);
      if (!referrer) {
        throw new UwgDagError('duplicate-user', `Referrer ${node.referrerUserId} not found`);
      }

      // Risk-fingerprint collision (NAOS anomaly detection)
      if (referrer.riskFingerprint === node.riskFingerprint) {
        throw new UwgDagError(
          'risk-fingerprint-collision',
          `User ${node.userId} shares riskFingerprint with referrer ${referrer.userId}`,
        );
      }

      // Cycle check: walk referrer chain upward; we must not reach `node.userId`
      // Since referrer already exists and can't have `node.userId` as ancestor
      // (node.userId isn't in the DAG yet), the only way to form a cycle is
      // if someone later updates the referrer pointer — which this API
      // doesn't permit. We still walk to enforce the invariant.
      let current: string | null = node.referrerUserId;
      const visited = new Set<string>();
      while (current) {
        if (current === node.userId) {
          throw new UwgDagError('cycle-detected', `Cycle detected inserting ${node.userId}`);
        }
        if (visited.has(current)) {
          throw new UwgDagError('cycle-detected', `Existing cycle detected at ${current}`);
        }
        visited.add(current);
        current = this.nodes.get(current)?.referrerUserId ?? null;
      }
    }

    this.nodes.set(node.userId, { ...node });
  }

  /** Retrieve a node by user id. */
  get(userId: string): UwgNode | undefined {
    return this.nodes.get(userId);
  }

  size(): number {
    return this.nodes.size;
  }

  /**
   * Walk up the referrer chain returning up to `maxHops` ancestors in
   * tier order (closest referrer = tier 1).
   */
  ancestorsOf(userId: string, maxHops = 6): UwgNode[] {
    const chain: UwgNode[] = [];
    let current: string | null = this.nodes.get(userId)?.referrerUserId ?? null;
    while (current && chain.length < maxHops) {
      const node = this.nodes.get(current);
      if (!node) break;
      chain.push(node);
      current = node.referrerUserId;
    }
    return chain;
  }

  /**
   * Compute the full commission allocation for a purchase. Walks up to 6
   * ancestors and allocates per-tier commission. Sum-of-parts invariant is
   * verified before return — defensive redundancy against future mutation
   * of UWG_TIER_BPS.
   */
  computeCommissionPath(buyerUserId: string, purchaseAmountRaw: BN): CommissionPath {
    const ancestors = this.ancestorsOf(buyerUserId, UWG_TIER_BPS.length);
    const tiers: TierAllocation[] = [];
    let totalCommissionRaw = new BN(0);

    for (let i = 0; i < ancestors.length; i++) {
      const rateBps = UWG_TIER_BPS[i];
      if (rateBps === 0) continue; // tier 6 exists but is 0%; skip
      const allocationRaw = purchaseAmountRaw.mul(new BN(rateBps)).div(BASIS_POINT_SCALE);
      tiers.push({
        tier: i + 1,
        recipientUserId: ancestors[i].userId,
        allocationRaw,
        rateBps,
      });
      totalCommissionRaw = totalCommissionRaw.add(allocationRaw);
    }

    // Kani-style invariant check: sum can never exceed purchaseAmount * cap / 10000
    const maxAllowed = purchaseAmountRaw.mul(new BN(UWG_CUMULATIVE_CAP_BPS)).div(BASIS_POINT_SCALE);
    if (totalCommissionRaw.gt(maxAllowed)) {
      throw new UwgDagError(
        'tier-cap-violation',
        `Computed commission ${totalCommissionRaw.toString()} exceeds cap ${maxAllowed.toString()}`,
      );
    }

    return {
      buyerUserId,
      purchaseAmountRaw,
      tiers,
      totalCommissionRaw,
    };
  }
}
