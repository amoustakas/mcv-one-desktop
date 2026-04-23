// NI 45-106 exemption tiers — Canadian securities-law gate for RWA trading.
//
// Enforced at the order-router boundary (src/execution/OrderRouter.ts in
// Phase 4). Every RWA order carries an `ExemptionTier`; the router refuses
// to match orders whose tier is below the asset's offering minimum OR above
// per-investor per-year caps.
//
// Source: National Instrument 45-106 (Canadian Securities Administrators).
// US-side interpretive guidance: SEC Release No. 33-11412 (2026). Neither
// reference is literally imported here — this union is the code-level
// manifestation of the legal concept.

/** Stable discriminator used at runtime (union-of-strings pattern). */
export type ExemptionTierId =
  | 'Retail$10k'        // retail investors, $10k hard cap per offering
  | 'Eligible$30k'      // eligible investors, $30k per 12-month window
  | 'Eligible$100k'     // eligible investors, $100k per 12-month window
  | 'Accredited';       // accredited — no cap (still per-offering KYC)

/** Per-tier configuration. Locked at compile time; regulatory changes land here. */
export interface ExemptionTierConfig {
  id: ExemptionTierId;
  /** Human-readable label for ops UIs */
  label: string;
  /** Maximum USD-equivalent commit per offering. null = no cap (Accredited only). */
  maxPerOfferingUsd: number | null;
  /**
   * Maximum USD-equivalent commit per 12-month rolling window.
   * null = no cap. Order router checks against aggregated Fabric events.
   */
  maxPerYearUsd: number | null;
  /** Whether FINTRAC Form 45-106F9 is required at each commit */
  requiresForm45_106F9: boolean;
  /** Whether mutual NDAs must be on file before disclosure (counsel gate) */
  requiresPriorNda: boolean;
}

/** Canonical tier table. Source-of-truth for exemption gates across the SDK. */
export const EXEMPTION_TIERS: Record<ExemptionTierId, ExemptionTierConfig> = {
  'Retail$10k': {
    id: 'Retail$10k',
    label: 'Retail ($10k offering cap)',
    maxPerOfferingUsd: 10_000,
    maxPerYearUsd: 10_000,
    requiresForm45_106F9: true,
    requiresPriorNda: false,
  },
  'Eligible$30k': {
    id: 'Eligible$30k',
    label: 'Eligible Investor ($30k/yr)',
    maxPerOfferingUsd: 30_000,
    maxPerYearUsd: 30_000,
    requiresForm45_106F9: true,
    requiresPriorNda: false,
  },
  'Eligible$100k': {
    id: 'Eligible$100k',
    label: 'Eligible Investor ($100k/yr)',
    maxPerOfferingUsd: 100_000,
    maxPerYearUsd: 100_000,
    requiresForm45_106F9: true,
    requiresPriorNda: true,
  },
  'Accredited': {
    id: 'Accredited',
    label: 'Accredited Investor',
    maxPerOfferingUsd: null,
    maxPerYearUsd: null,
    requiresForm45_106F9: false,
    requiresPriorNda: true,
  },
};

/** Convenience getter — panics on unknown tier, which should be impossible given the union type. */
export function getTierConfig(id: ExemptionTierId): ExemptionTierConfig {
  const config = EXEMPTION_TIERS[id];
  if (!config) throw new Error(`[marketplace-sdk] unknown exemption tier: ${id}`);
  return config;
}

/**
 * Determines whether a tier permits a commit of the given USD amount in a
 * single offering. Per-year cap check lives in the OrderRouter because it
 * needs the aggregated Fabric event stream.
 */
export function isCommitWithinTier(tier: ExemptionTierId, commitUsd: number): boolean {
  const config = getTierConfig(tier);
  if (config.maxPerOfferingUsd === null) return true;
  return commitUsd <= config.maxPerOfferingUsd;
}
