// Biometric Core-Triangle AuthRouter contract tests.
//
// Locks the Phase 1 test gate from MCV_MASTER_SPEC §6.1 step 5:
//   "MCVClient instantiation throws when the App Attest 'Settle' phase
//    attestation is missing."
//
// Plus the full 4-phase matrix — each phase has a missing path, a failed
// verifier path, and (where applicable) a threshold path.

import { describe, it, expect } from 'vitest';

import {
  AuthRouter,
  AlwaysAllowLivenessVerifier,
  AlwaysAllowCommitVerifier,
  AlwaysAllowSettleVerifier,
  AlwaysAllowActivateVerifier,
  createMockAuthRouter,
  hashAttestations,
} from '../auth-router';
import { CoreTriangleAuthError } from '../attestations';
import type {
  ActivateVerifier,
  CommitVerifier,
  CoreTriangleAttestations,
  LivenessVerifier,
  SettleVerifier,
  SumsubLivenessAttestation,
  WebAuthnCommitAttestation,
  AppAttestSettleAttestation,
  BioCatchActivateAttestation,
} from '../attestations';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

const liveness: SumsubLivenessAttestation = {
  provider: 'sumsub',
  userId: 'user-test-001',
  sessionId: 'sumsub-session-1',
  livenessScore: 0.95,
  verifiedAt: '2026-04-22T21:00:00.000Z',
};

const commit: WebAuthnCommitAttestation = {
  provider: 'webauthn',
  userId: 'user-test-001',
  credentialId: 'cred-1',
  challengeHash: 'hash-1',
  signature: 'sig-1',
  verifiedAt: '2026-04-22T21:00:05.000Z',
};

const settle: AppAttestSettleAttestation = {
  provider: 'app-attest',
  userId: 'user-test-001',
  attestationToken: 'apple-token-1',
  deviceHash: 'device-hash-1',
  verifiedAt: '2026-04-22T21:00:10.000Z',
};

const activate: BioCatchActivateAttestation = {
  provider: 'biocatch',
  userId: 'user-test-001',
  sessionId: 'biocatch-session-1',
  behavioralRiskScore: 0.05,
  verifiedAt: '2026-04-22T21:00:15.000Z',
};

const fullAttestations: CoreTriangleAttestations = { liveness, commit, settle, activate };

// Each *AlwaysDeny* verifier always returns false — simulates a real
// platform partner flagging the attestation as invalid.
const denyLive: LivenessVerifier = { async verify() { return false; } };
const denyCommit: CommitVerifier = { async verify() { return false; } };
const denySettle: SettleVerifier = { async verify() { return false; } };
const denyActivate: ActivateVerifier = { async verify() { return false; } };

// ───────────────────────────────────────────────────────────────────────────
// Positive path
// ───────────────────────────────────────────────────────────────────────────

describe('AuthRouter — positive path', () => {
  it('produces an authenticated identity when all four attestations pass', async () => {
    const router = createMockAuthRouter();
    const identity = await router.authenticate(fullAttestations);

    expect(identity.userId).toBe('user-test-001');
    expect(identity.sessionId).toBe('sumsub-session-1');
    expect(identity.coreTriangleHash).toMatch(/^[0-9a-f]{64}$/);
    expect(identity.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(identity.attestations).toEqual(fullAttestations);
  });

  it('hashes attestations deterministically — same input → same hash', async () => {
    const h1 = await hashAttestations(fullAttestations);
    const h2 = await hashAttestations(fullAttestations);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes the hash when any attestation identifier changes', async () => {
    const baseline = await hashAttestations(fullAttestations);
    const mutated: CoreTriangleAttestations = {
      ...fullAttestations,
      settle: { ...settle, deviceHash: 'different-device' },
    };
    const changed = await hashAttestations(mutated);
    expect(changed).not.toBe(baseline);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Missing-phase paths — THE test gate from MCV_MASTER_SPEC §6.1 step 5
// ───────────────────────────────────────────────────────────────────────────

describe('AuthRouter — missing-phase failures', () => {
  it('throws "settle-missing" when Apple App Attest Settle attestation is absent', async () => {
    const router = createMockAuthRouter();
    await expect(router.authenticate({ liveness, commit, activate }))
      .rejects.toThrowError(CoreTriangleAuthError);
    try {
      await router.authenticate({ liveness, commit, activate });
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('settle-missing');
      expect((err as CoreTriangleAuthError).phase).toBe('settle');
    }
  });

  it('throws "liveness-missing" when Liveness attestation is absent', async () => {
    const router = createMockAuthRouter();
    try {
      await router.authenticate({ commit, settle, activate });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('liveness-missing');
      expect((err as CoreTriangleAuthError).phase).toBe('liveness');
    }
  });

  it('throws "commit-missing" when WebAuthn Commit attestation is absent', async () => {
    const router = createMockAuthRouter();
    try {
      await router.authenticate({ liveness, settle, activate });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('commit-missing');
      expect((err as CoreTriangleAuthError).phase).toBe('commit');
    }
  });

  it('throws "activate-missing" when BioCatch Activate attestation is absent', async () => {
    const router = createMockAuthRouter();
    try {
      await router.authenticate({ liveness, commit, settle });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('activate-missing');
      expect((err as CoreTriangleAuthError).phase).toBe('activate');
    }
  });

  it('throws on the FIRST missing phase in strict order (liveness > commit > settle > activate)', async () => {
    const router = createMockAuthRouter();
    // All four missing → liveness-missing must be reported first
    try {
      await router.authenticate({});
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('liveness-missing');
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Verifier-failed paths
// ───────────────────────────────────────────────────────────────────────────

describe('AuthRouter — verifier failures', () => {
  it('throws "liveness-failed" when Sumsub verifier returns false', async () => {
    const router = new AuthRouter({
      liveness: denyLive,
      commit: new AlwaysAllowCommitVerifier(),
      settle: new AlwaysAllowSettleVerifier(),
      activate: new AlwaysAllowActivateVerifier(),
    });
    try {
      await router.authenticate(fullAttestations);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('liveness-failed');
    }
  });

  it('throws "commit-failed" when WebAuthn verifier returns false', async () => {
    const router = new AuthRouter({
      liveness: new AlwaysAllowLivenessVerifier(),
      commit: denyCommit,
      settle: new AlwaysAllowSettleVerifier(),
      activate: new AlwaysAllowActivateVerifier(),
    });
    try {
      await router.authenticate(fullAttestations);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('commit-failed');
    }
  });

  it('throws "settle-failed" when App Attest verifier returns false', async () => {
    const router = new AuthRouter({
      liveness: new AlwaysAllowLivenessVerifier(),
      commit: new AlwaysAllowCommitVerifier(),
      settle: denySettle,
      activate: new AlwaysAllowActivateVerifier(),
    });
    try {
      await router.authenticate(fullAttestations);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('settle-failed');
    }
  });

  it('throws "activate-failed" when BioCatch verifier returns false', async () => {
    const router = new AuthRouter({
      liveness: new AlwaysAllowLivenessVerifier(),
      commit: new AlwaysAllowCommitVerifier(),
      settle: new AlwaysAllowSettleVerifier(),
      activate: denyActivate,
    });
    try {
      await router.authenticate(fullAttestations);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('activate-failed');
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Threshold paths
// ───────────────────────────────────────────────────────────────────────────

describe('AuthRouter — threshold failures', () => {
  it('throws "liveness-below-threshold" when livenessScore < threshold', async () => {
    const router = createMockAuthRouter({ livenessThreshold: 0.9 });
    const badLive: SumsubLivenessAttestation = { ...liveness, livenessScore: 0.5 };
    try {
      await router.authenticate({ ...fullAttestations, liveness: badLive });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('liveness-below-threshold');
    }
  });

  it('throws "activate-above-risk-threshold" when behavioralRiskScore > threshold', async () => {
    const router = createMockAuthRouter({ riskThreshold: 0.2 });
    const riskyActivate: BioCatchActivateAttestation = { ...activate, behavioralRiskScore: 0.8 };
    try {
      await router.authenticate({ ...fullAttestations, activate: riskyActivate });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as CoreTriangleAuthError).code).toBe('activate-above-risk-threshold');
    }
  });
});
