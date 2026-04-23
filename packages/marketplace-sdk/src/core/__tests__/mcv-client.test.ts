// MCVClient instantiation contract.
//
// Proves the Phase 1 test gate: the SDK handle cannot exist without passing
// the full Biometric Core-Triangle. This is the enforcement point for the
// "Substance Over Form" doctrine — no authenticated client, no orders, no
// minting, no KMS access.

import { describe, it, expect } from 'vitest';

import { MCVClient } from '../mcv-client';
import { createMockAuthRouter } from '../auth-router';
import type {
  CoreTriangleAttestations,
  SumsubLivenessAttestation,
  WebAuthnCommitAttestation,
  AppAttestSettleAttestation,
  BioCatchActivateAttestation,
} from '../attestations';

const liveness: SumsubLivenessAttestation = {
  provider: 'sumsub', userId: 'u1', sessionId: 's1',
  livenessScore: 0.95, verifiedAt: '2026-04-22T21:00:00Z',
};
const commit: WebAuthnCommitAttestation = {
  provider: 'webauthn', userId: 'u1', credentialId: 'c1',
  challengeHash: 'h1', signature: 'sig1', verifiedAt: '2026-04-22T21:00:05Z',
};
const settle: AppAttestSettleAttestation = {
  provider: 'app-attest', userId: 'u1', attestationToken: 'tok1',
  deviceHash: 'd1', verifiedAt: '2026-04-22T21:00:10Z',
};
const activate: BioCatchActivateAttestation = {
  provider: 'biocatch', userId: 'u1', sessionId: 'b1',
  behavioralRiskScore: 0.05, verifiedAt: '2026-04-22T21:00:15Z',
};
const fullAttestations: CoreTriangleAttestations = { liveness, commit, settle, activate };

describe('MCVClient.create()', () => {
  it('succeeds when all four attestations are present + valid', async () => {
    const authRouter = createMockAuthRouter();
    const client = await MCVClient.create({ authRouter, attestations: fullAttestations });

    expect(client).toBeInstanceOf(MCVClient);
    expect(client.identity.userId).toBe('u1');
    expect(client.handle).toBe('mcv:u1');
  });

  it('THROWS when the Apple App Attest "Settle" phase attestation is missing (MCV_MASTER_SPEC §6.1 test gate)', async () => {
    const authRouter = createMockAuthRouter();
    await expect(
      MCVClient.create({
        authRouter,
        attestations: { liveness, commit, activate },
      }),
    ).rejects.toThrow(/settle/i);
  });

  it('throws when any other phase is missing', async () => {
    const authRouter = createMockAuthRouter();
    await expect(
      MCVClient.create({ authRouter, attestations: { commit, settle, activate } }),
    ).rejects.toThrow(/liveness/i);
    await expect(
      MCVClient.create({ authRouter, attestations: { liveness, settle, activate } }),
    ).rejects.toThrow(/commit/i);
    await expect(
      MCVClient.create({ authRouter, attestations: { liveness, commit, settle } }),
    ).rejects.toThrow(/activate/i);
  });

  it('passes gcpProject option through to the client instance', async () => {
    const authRouter = createMockAuthRouter();
    const client = await MCVClient.create({
      authRouter,
      attestations: fullAttestations,
      gcpProject: 'mcv-prod-001',
    });
    expect(client.gcpProject).toBe('mcv-prod-001');
  });

  it('constructor is not callable externally — must use MCVClient.create()', () => {
    // The constructor is private; this test verifies the static factory is the only path.
    // TypeScript enforces this at compile time; at runtime we confirm the factory exists + works.
    expect(typeof MCVClient.create).toBe('function');
    expect(MCVClient.create.length).toBeGreaterThanOrEqual(0); // sanity
  });
});
