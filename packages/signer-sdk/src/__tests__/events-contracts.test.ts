import { describe, it, expect } from 'vitest';
import { assertValidTopic } from '@mcv/events-sdk/envelope';
import { SigningContract } from '../events/contracts';

describe('SigningContract', () => {
  it('declares module "signing"', () => {
    expect(SigningContract.module).toBe('signing');
  });

  it('every emitted topic passes events-sdk assertValidTopic', () => {
    for (const emission of SigningContract.emits) {
      expect(() => assertValidTopic(emission.topic)).not.toThrow();
    }
  });

  it('emits exactly the 5 v0.1 topics', () => {
    const topics = SigningContract.emits.map((e) => e.topic).sort();
    expect(topics).toEqual([
      'signing.envelope.created',
      'signing.envelope.mutation-detected',
      'signing.envelope.signed',
      'signing.envelope.viewed',
      'signing.envelope.voided',
    ]);
  });

  it('declares schemaVersion 1.0 on every emission', () => {
    for (const e of SigningContract.emits) {
      expect(e.schemaVersion).toBe('1.0');
    }
  });

  it('created payload schema accepts a well-formed payload', () => {
    const emit = SigningContract.emits.find((e) => e.topic === 'signing.envelope.created')!;
    const result = emit.payload.safeParse({
      publicId: 'abc',
      tenantId: 't1',
      parentVentureId: 'mcv',
      documentCount: 2,
      signerEmail: 'tony@mcv.one',
      issuedAt: '2026-04-24T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('signed payload schema rejects a non-sha256 signatureHash', () => {
    const emit = SigningContract.emits.find((e) => e.topic === 'signing.envelope.signed')!;
    const result = emit.payload.safeParse({
      publicId: 'abc',
      tenantId: 't1',
      documentId: 'd1',
      signedAt: '2026-04-24T00:00:00.000Z',
      signatureHash: 'not-a-hash',
    });
    expect(result.success).toBe(false);
  });

  it('declares at least one subscription', () => {
    expect(SigningContract.subscribes.length).toBeGreaterThan(0);
  });
});
