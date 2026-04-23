// Step-up auth policies — gates sensitive actions on Trust Score + Civic
// Clearance + recent attestation freshness.
//
// Policies are declarative: each mutation entry point in the app attaches
// one, and the evaluateStepUp() function decides whether to allow, reject,
// or require a specific step-up attestation before retry.
//
// The step-up RESPONSE is an action directive — it does NOT itself run the
// biometric prompt. The frontend/handler takes the directive and opens the
// appropriate MediaPipe / WebAuthn / Iris flow. After re-attestation, the
// signal batch is rebuilt and Trust Score recomputed.

import type { CivicClearance, McvIdClaims, TrustScoreResult } from './types';

export type StepUpKind = 'liveness' | 'passkey' | 'iris' | 'civic-proof';

export interface StepUpPolicy {
  /** Human-readable label; logged + displayed in UI */
  action: string;
  /** Minimum Trust Score required (0-100) */
  minTrustScore: number;
  /** Minimum Civic Clearance required */
  minCivicClearance: CivicClearance;
  /** Required fresh attestation within `freshnessMs` at evaluate time */
  requiredFreshAttestation?: StepUpKind;
  /** Freshness window in ms for requiredFreshAttestation. Default 10 min. */
  freshnessMs?: number;
}

export type StepUpVerdict =
  | { allowed: true }
  | { allowed: false; reason: string; requiredStepUp: StepUpKind | 'impossible' };

export interface StepUpInput {
  /** Current Trust Engine result (or cached claims) */
  current: Pick<TrustScoreResult, 'score' | 'civicClearance'> | McvIdClaims;
  /** Attestation kind → latest epoch ms timestamp */
  recentAttestations: Partial<Record<StepUpKind, number>>;
  /** Current time for freshness check */
  nowMs: number;
}

const CLEARANCE_RANK: Record<CivicClearance, number> = {
  basic: 0,
  verified: 1,
  sovereign: 2,
};

/**
 * Evaluate a step-up policy against current identity state. Returns a
 * verdict the caller can translate into a UI action or API response.
 *
 * Semantics:
 *   - Trust Score below threshold → require passkey (cheapest signal)
 *   - Civic clearance below threshold → require civic-proof (federated ID)
 *   - Required fresh attestation not within window → require THAT attestation
 *   - All gates pass → allowed
 */
export function evaluateStepUp(policy: StepUpPolicy, input: StepUpInput): StepUpVerdict {
  const { current, recentAttestations, nowMs } = input;
  const freshnessMs = policy.freshnessMs ?? 10 * 60 * 1000;

  const score = 'score' in current ? current.score : current.mcv_trust_score;
  const clearance = 'civicClearance' in current ? current.civicClearance : current.mcv_civic_clearance;

  if (score < policy.minTrustScore) {
    return {
      allowed: false,
      reason: `Trust Score ${score} below minimum ${policy.minTrustScore} for action "${policy.action}"`,
      requiredStepUp: 'passkey',
    };
  }

  if (CLEARANCE_RANK[clearance] < CLEARANCE_RANK[policy.minCivicClearance]) {
    return {
      allowed: false,
      reason: `Civic clearance "${clearance}" below required "${policy.minCivicClearance}" for action "${policy.action}"`,
      requiredStepUp: 'civic-proof',
    };
  }

  if (policy.requiredFreshAttestation) {
    const latest = recentAttestations[policy.requiredFreshAttestation];
    if (latest === undefined || nowMs - latest > freshnessMs) {
      return {
        allowed: false,
        reason: `Fresh ${policy.requiredFreshAttestation} attestation required within ${freshnessMs / 1000}s`,
        requiredStepUp: policy.requiredFreshAttestation,
      };
    }
  }

  return { allowed: true };
}

// ───────────────────────────────────────────────────────────────────────────
// Pre-defined policies for canonical MCV actions
// ───────────────────────────────────────────────────────────────────────────

/** Retail $10k tier actions — basic clearance + moderate score. */
export const RETAIL_POLICY: StepUpPolicy = {
  action: 'retail-transaction',
  minTrustScore: 50,
  minCivicClearance: 'basic',
};

/** Eligible $30k/$100k tier actions — verified clearance + elevated score. */
export const ELIGIBLE_POLICY: StepUpPolicy = {
  action: 'eligible-transaction',
  minTrustScore: 70,
  minCivicClearance: 'verified',
  requiredFreshAttestation: 'passkey',
};

/** Accredited tier actions — sovereign clearance + high score + fresh liveness. */
export const ACCREDITED_POLICY: StepUpPolicy = {
  action: 'accredited-transaction',
  minTrustScore: 85,
  minCivicClearance: 'verified',
  requiredFreshAttestation: 'liveness',
};

/** Sovereign actions (RWA mint, Permanent Delegate, entity change) — max trust. */
export const SOVEREIGN_POLICY: StepUpPolicy = {
  action: 'sovereign-action',
  minTrustScore: 95,
  minCivicClearance: 'sovereign',
  requiredFreshAttestation: 'iris',
};
