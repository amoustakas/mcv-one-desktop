// Trust Engine contract tests.
//
// Locks the Phase 2-Alpha computation from the MVP plan §6.2:
// Trust Score computed deterministically from telemetry signal batch,
// score clamped to [0,100], civic clearance resolved from federated
// proofs, fractures produce sharp penalties.

import { describe, it, expect } from 'vitest';

import { computeTrustScore } from '../trust-engine';
import type { TelemetrySignalBatch } from '../types';

const NOW = 1_700_000_000_000;

function emptyBatch(): TelemetrySignalBatch {
  return { ambient: [], stepUp: [], civic: [] };
}

describe('computeTrustScore', () => {
  it('returns base score for empty batch', () => {
    const result = computeTrustScore(emptyBatch(), { nowMs: NOW });
    expect(result.score).toBe(50);
    expect(result.civicClearance).toBe('basic');
    expect(result.fractures).toEqual([]);
    expect(result.contributions).toEqual([]);
  });

  it('honors custom baseScore', () => {
    const result = computeTrustScore(emptyBatch(), { nowMs: NOW, baseScore: 30 });
    expect(result.score).toBe(30);
  });

  it('adds positive deltas for healthy ambient signals', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [
        { kind: 'kinematic', gaitMatchScore: 0.9, typingCadenceMatch: 0.9, observedAtMs: NOW },
        { kind: 'fused-location', latitude: 0, longitude: 0, accuracyMeters: 10, atRegisteredLocation: true, observedAtMs: NOW },
        { kind: 'recaptcha-enterprise', humanScore: 0.95, observedAtMs: NOW },
        { kind: 'play-integrity', deviceVerdict: 'MEETS_STRONG_INTEGRITY', appRecognized: true, observedAtMs: NOW },
      ],
      stepUp: [],
      civic: [],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.score).toBe(50 + 10 + 8 + 5 + 8); // = 81
    expect(result.contributions).toHaveLength(4);
  });

  it('sharply penalizes failed Play Integrity', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [{ kind: 'play-integrity', deviceVerdict: 'NO_INTEGRITY', appRecognized: false, observedAtMs: NOW }],
      stepUp: [],
      civic: [],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.score).toBe(0); // 50 - 50, clamped
  });

  it('ignores stale signals', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [{ kind: 'kinematic', gaitMatchScore: 0.9, typingCadenceMatch: 0.9, observedAtMs: NOW - 10 * 60 * 1000 }],
      stepUp: [],
      civic: [],
    };
    const result = computeTrustScore(batch, { nowMs: NOW, staleSignalMs: 5 * 60 * 1000 });
    expect(result.score).toBe(50);
    expect(result.contributions).toEqual([]);
  });

  it('resolves verified clearance when any civic proof present', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [],
      stepUp: [],
      civic: [{ kind: 'interac-verified', bank: 'rbc', verifiedAtMs: NOW }],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.civicClearance).toBe('verified');
    expect(result.score).toBe(70); // 50 + 20
  });

  it('resolves sovereign clearance when ePassport signature valid', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [],
      stepUp: [],
      civic: [{ kind: 'epassport-chip', signatureValid: true, issuingCountry: 'CA', verifiedAtMs: NOW }],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.civicClearance).toBe('sovereign');
  });

  it('invalid ePassport penalizes score AND downgrades clearance', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [],
      stepUp: [],
      civic: [{ kind: 'epassport-chip', signatureValid: false, issuingCountry: 'CA', verifiedAtMs: NOW }],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.score).toBe(30); // 50 - 20
    expect(result.civicClearance).toBe('basic'); // invalid → not sovereign / not verified
  });

  it('detects typing-while-driving fracture', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [
        { kind: 'kinematic', gaitMatchScore: 0.5, typingCadenceMatch: 0.9, observedAtMs: NOW },
        { kind: 'activity-recognition', activity: 'driving', confidence: 0.9, observedAtMs: NOW },
      ],
      stepUp: [],
      civic: [],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.fractures).toHaveLength(1);
    expect(result.fractures[0].kind).toBe('typing-while-driving');
    // score = 50 (base) + 0 (kinematic not > 0.8 nor < 0.4) - 40 (fracture) = 10
    expect(result.score).toBe(10);
  });

  it('duress trigger forces civic clearance back to basic + heavy penalty', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [],
      stepUp: [{ kind: 'duress', triggered: true, observedAtMs: NOW }],
      civic: [{ kind: 'epassport-chip', signatureValid: true, issuingCountry: 'CA', verifiedAtMs: NOW }],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    expect(result.civicClearance).toBe('basic'); // duress forces basic regardless of ePassport
    expect(result.fractures.some((f) => f.kind === 'duress')).toBe(true);
    // 50 (base) + 25 (epassport) - 70 (duress signal) - 40 (duress fracture) = -35 → clamp 0
    expect(result.score).toBe(0);
  });

  it('score clamped to [0,100]', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [],
      stepUp: [
        { kind: 'iris', matchScore: 0.95, observedAtMs: NOW },
        { kind: 'passkey', authenticatorId: 'auth', observedAtMs: NOW },
        { kind: 'face-landmark', livenessScore: 0.9, microExpressionVariance: 0.3, observedAtMs: NOW },
      ],
      civic: [
        { kind: 'epassport-chip', signatureValid: true, issuingCountry: 'CA', verifiedAtMs: NOW },
        { kind: 'interac-verified', bank: 'rbc', verifiedAtMs: NOW },
      ],
    };
    const result = computeTrustScore(batch, { nowMs: NOW });
    // 50 + 20 + 12 + 15 + 25 + 20 = 142, clamped to 100
    expect(result.score).toBe(100);
  });

  it('is deterministic — same input produces same output', () => {
    const batch: TelemetrySignalBatch = {
      ambient: [{ kind: 'recaptcha-enterprise', humanScore: 0.92, observedAtMs: NOW }],
      stepUp: [],
      civic: [{ kind: 'interac-verified', bank: 'td', verifiedAtMs: NOW }],
    };
    const a = computeTrustScore(batch, { nowMs: NOW });
    const b = computeTrustScore(batch, { nowMs: NOW });
    expect(a).toEqual(b);
  });
});
