import { describe, it, expect } from 'vitest';
import { buildEnvelope } from '../server/envelope-builder';

const baseInput = () => ({
  tenantId: 't1',
  parentVentureId: 'mcv',
  signer: { name: 'Tony', email: 'tony@mcv.one' },
  origin: 'human' as const,
  documents: [
    { templateId: 'nda', templateVersion: 1, renderedBytes: 'NDA body' },
  ],
});

describe('buildEnvelope', () => {
  it('composes a valid single-document envelope', () => {
    const { envelope, renderedShas } = buildEnvelope(baseInput());
    expect(envelope.documents.length).toBe(1);
    expect(envelope.documents[0].renderedSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(renderedShas).toEqual([envelope.documents[0].renderedSha256]);
    expect(envelope.status).toBe('issued');
    expect(envelope.envelopeVersion).toBe(1);
  });

  it('mints a publicId and synthesises document ids', () => {
    const { envelope } = buildEnvelope(baseInput());
    expect(envelope.publicId.length).toBeGreaterThan(8);
    expect(envelope.documents[0].id).toBe(`${envelope.publicId}:0`);
  });

  it('defaults expiresAt to issuedAt + 30 days', () => {
    const input = baseInput();
    input.documents[0] = { ...input.documents[0] };
    const fixed = new Date('2026-04-24T00:00:00.000Z').toISOString();
    const { envelope } = buildEnvelope({ ...input, issuedAt: fixed });
    const issued = new Date(envelope.issuedAt).getTime();
    const expires = new Date(envelope.expiresAt).getTime();
    expect(expires - issued).toBe(30 * 86400 * 1000);
  });

  it('rejects zero-document envelopes', () => {
    const input = { ...baseInput(), documents: [] };
    expect(() => buildEnvelope(input)).toThrow(/at least one document/);
  });

  it('rejects agent origin without attribution', () => {
    const input = { ...baseInput(), origin: 'agent' as const };
    expect(() => buildEnvelope(input)).toThrow(/generatedByAgent/);
  });

  it('tags every document with generatedByAgent when agent origin', () => {
    const input = {
      ...baseInput(),
      origin: 'agent' as const,
      generatedByAgent: { agentHandle: '@draft-agent', workflowId: 'wf-1' },
    };
    const { envelope } = buildEnvelope(input);
    expect(envelope.documents[0].generatedByAgent).toEqual({
      agentHandle: '@draft-agent',
      workflowId: 'wf-1',
    });
  });

  it('preserves child-venture tenancy', () => {
    const { envelope } = buildEnvelope({ ...baseInput(), childVentureId: 'futurestate' });
    expect(envelope.childVentureId).toBe('futurestate');
  });

  it('multi-document envelopes index sequential ids', () => {
    const { envelope } = buildEnvelope({
      ...baseInput(),
      documents: [
        { templateId: 'nda', templateVersion: 1, renderedBytes: 'A' },
        { templateId: 'ip-assign', templateVersion: 1, renderedBytes: 'B' },
        { templateId: 'side-letter', templateVersion: 1, renderedBytes: 'C' },
      ],
    });
    expect(envelope.documents.length).toBe(3);
    expect(envelope.documents.map((d) => d.id)).toEqual([
      `${envelope.publicId}:0`,
      `${envelope.publicId}:1`,
      `${envelope.publicId}:2`,
    ]);
    expect(new Set(envelope.documents.map((d) => d.renderedSha256)).size).toBe(3);
  });
});
