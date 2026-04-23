// Step-up policy contract tests.

import { describe, it, expect } from 'vitest';

import {
  evaluateStepUp,
  RETAIL_POLICY,
  ELIGIBLE_POLICY,
  ACCREDITED_POLICY,
  SOVEREIGN_POLICY,
} from '../step-up';
import type { TrustScoreResult } from '../types';

const NOW = 1_700_000_000_000;

const mkCurrent = (score: number, clearance: TrustScoreResult['civicClearance']): Pick<TrustScoreResult, 'score' | 'civicClearance'> => ({
  score,
  civicClearance: clearance,
});

describe('evaluateStepUp — Trust Score gate', () => {
  it('allows when score meets the policy threshold', () => {
    const verdict = evaluateStepUp(RETAIL_POLICY, {
      current: mkCurrent(60, 'basic'),
      recentAttestations: {},
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(true);
  });

  it('rejects with passkey step-up when score below threshold', () => {
    const verdict = evaluateStepUp(RETAIL_POLICY, {
      current: mkCurrent(40, 'verified'),
      recentAttestations: {},
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.requiredStepUp).toBe('passkey');
    }
  });
});

describe('evaluateStepUp — Civic Clearance gate', () => {
  it('rejects with civic-proof when clearance below threshold', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'basic'),
      recentAttestations: { passkey: NOW },
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.requiredStepUp).toBe('civic-proof');
    }
  });

  it('allows when verified clearance meets ELIGIBLE_POLICY', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'verified'),
      recentAttestations: { passkey: NOW },
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(true);
  });

  it('sovereign ≥ verified', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'sovereign'),
      recentAttestations: { passkey: NOW },
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(true);
  });
});

describe('evaluateStepUp — freshness gate', () => {
  it('rejects when fresh passkey required but none present', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'verified'),
      recentAttestations: {},
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) {
      expect(verdict.requiredStepUp).toBe('passkey');
    }
  });

  it('rejects when fresh attestation stale beyond window', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'verified'),
      recentAttestations: { passkey: NOW - 20 * 60 * 1000 }, // 20 min old
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(false);
  });

  it('allows when attestation within window', () => {
    const verdict = evaluateStepUp(ELIGIBLE_POLICY, {
      current: mkCurrent(80, 'verified'),
      recentAttestations: { passkey: NOW - 5 * 60 * 1000 }, // 5 min old
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(true);
  });
});

describe('evaluateStepUp — canonical policies', () => {
  it('RETAIL_POLICY requires score ≥ 50', () => {
    expect(evaluateStepUp(RETAIL_POLICY, { current: mkCurrent(50, 'basic'), recentAttestations: {}, nowMs: NOW }).allowed).toBe(true);
    expect(evaluateStepUp(RETAIL_POLICY, { current: mkCurrent(49, 'basic'), recentAttestations: {}, nowMs: NOW }).allowed).toBe(false);
  });

  it('ACCREDITED_POLICY requires fresh liveness + verified clearance + score ≥ 85', () => {
    // Passes when all gates green
    const pass = evaluateStepUp(ACCREDITED_POLICY, {
      current: mkCurrent(90, 'verified'),
      recentAttestations: { liveness: NOW - 60_000 },
      nowMs: NOW,
    });
    expect(pass.allowed).toBe(true);
  });

  it('SOVEREIGN_POLICY requires iris + sovereign + score ≥ 95', () => {
    const stepUp = evaluateStepUp(SOVEREIGN_POLICY, {
      current: mkCurrent(95, 'sovereign'),
      recentAttestations: {},
      nowMs: NOW,
    });
    expect(stepUp.allowed).toBe(false);
    if (!stepUp.allowed) expect(stepUp.requiredStepUp).toBe('iris');

    const pass = evaluateStepUp(SOVEREIGN_POLICY, {
      current: mkCurrent(95, 'sovereign'),
      recentAttestations: { iris: NOW - 60_000 },
      nowMs: NOW,
    });
    expect(pass.allowed).toBe(true);
  });
});

describe('evaluateStepUp — accepts McvIdClaims shape', () => {
  it('reads score + clearance from JWT claims interchangeably with TrustScoreResult', () => {
    const verdict = evaluateStepUp(RETAIL_POLICY, {
      current: {
        mcv_trust_score: 60,
        mcv_civic_clearance: 'basic',
        mcv_trust_computed_at: '2026-04-22T21:00:00Z',
        mcv_active_fractures: [],
      },
      recentAttestations: {},
      nowMs: NOW,
    });
    expect(verdict.allowed).toBe(true);
  });
});
