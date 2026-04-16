// MCV Sign adapter — unit tests.

import { describe, it, expect } from 'vitest';
import { createMCVSignAdapter, type MCVSignEnvelopeEvent } from '../mcv-sign-adapter';

const signedEvent: MCVSignEnvelopeEvent = {
  envelopePublicId: 'mcvs_abc',
  envelopeId: 'uuid-internal',
  status: 'signed',
  contentId: 'content-xyz',
  commitmentId: 'commit-123',
  completedAt: '2026-04-16T00:10:00Z',
  signers: [
    { name: 'Tony', email: 'tony@mcv.one', role: 'Investor', signedAt: '2026-04-16T00:09:30Z' },
  ],
};

describe('createMCVSignAdapter', () => {
  it('maps signed event to CapitalSigningEvent with contentId receipt route', async () => {
    const adapter = createMCVSignAdapter();
    const event = await adapter.fromForeign(signedEvent);
    expect(event).not.toBeNull();
    expect(event!.outcome).toBe('signed');
    expect(event!.source).toBe('mcv-sign');
    expect(event!.envelopeId).toBe('mcvs_abc');
    expect(event!.commitmentId).toBe('commit-123');
    expect(event!.receipt?.contentId).toBe('content-xyz');
  });

  it('returns null when commitmentId missing (non-commitment envelopes)', async () => {
    const adapter = createMCVSignAdapter();
    const event = await adapter.fromForeign({ ...signedEvent, commitmentId: null });
    expect(event).toBeNull();
  });

  it('handles declined/voided/expired outcomes', async () => {
    const adapter = createMCVSignAdapter();
    for (const status of ['declined', 'voided', 'expired'] as const) {
      const event = await adapter.fromForeign({ ...signedEvent, status });
      expect(event!.outcome).toBe(status);
    }
  });

  it('omits receipt when contentId missing', async () => {
    const adapter = createMCVSignAdapter();
    const event = await adapter.fromForeign({ ...signedEvent, contentId: null });
    expect(event!.receipt).toBeUndefined();
  });

  it('adapter id is "mcv-sign"', () => {
    expect(createMCVSignAdapter().id).toBe('mcv-sign');
  });
});
