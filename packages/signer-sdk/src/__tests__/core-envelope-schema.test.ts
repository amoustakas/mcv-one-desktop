import { describe, it, expect } from 'vitest';
import { envelopeSchema, signerDocumentSchema } from '../core/envelope-schema';

const baseEnvelope = () => ({
  publicId: 'abc123',
  tenantId: 'tenant-a',
  parentVentureId: 'mcv',
  envelopeVersion: 1,
  documents: [{
    id: 'abc123:0',
    templateId: 'tpl-nda',
    templateVersion: 1,
    origin: 'human' as const,
    renderedBytes: 'This is the NDA.',
    renderedAt: '2026-04-24T00:00:00.000Z',
    renderedSha256: 'a'.repeat(64),
  }],
  signer: { name: 'Tony', email: 'tony@mcv.one' },
  status: 'issued' as const,
  issuedAt: '2026-04-24T00:00:00.000Z',
  expiresAt: '2026-05-24T00:00:00.000Z',
  audit: {
    issuedAt: '2026-04-24T00:00:00.000Z',
    issuedBy: 'system:test',
  },
});

describe('envelopeSchema', () => {
  it('accepts a minimal valid envelope', () => {
    const result = envelopeSchema.safeParse(baseEnvelope());
    expect(result.success).toBe(true);
  });

  it('rejects an envelope with zero documents', () => {
    const env = baseEnvelope();
    env.documents = [];
    const result = envelopeSchema.safeParse(env);
    expect(result.success).toBe(false);
  });

  it('rejects agent-origin document without attribution', () => {
    const doc = {
      id: 'x:0',
      templateId: 'tpl-nda',
      templateVersion: 1,
      origin: 'agent' as const,
      renderedBytes: '…',
      renderedAt: '2026-04-24T00:00:00.000Z',
      renderedSha256: 'a'.repeat(64),
    };
    const result = signerDocumentSchema.safeParse(doc);
    expect(result.success).toBe(false);
  });

  it('accepts agent-origin document with attribution', () => {
    const doc = {
      id: 'x:0',
      templateId: 'tpl-nda',
      templateVersion: 1,
      origin: 'agent' as const,
      generatedByAgent: { agentHandle: '@draft-agent', workflowId: 'wf-1' },
      renderedBytes: '…',
      renderedAt: '2026-04-24T00:00:00.000Z',
      renderedSha256: 'a'.repeat(64),
    };
    const result = signerDocumentSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it('rejects a bad sha256 shape', () => {
    const env = baseEnvelope();
    env.documents[0].renderedSha256 = 'not-a-real-hash';
    const result = envelopeSchema.safeParse(env);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid signer email', () => {
    const env = baseEnvelope();
    env.signer.email = 'not-an-email';
    const result = envelopeSchema.safeParse(env);
    expect(result.success).toBe(false);
  });
});
