// VerifyInvestor adapter — unit tests.
// Covers outcome mapping + request creation mock path. Webhook wiring
// is covered by integration test (future).

import { describe, it, expect } from 'vitest';
import {
  createVerifyInvestorAdapter,
  createVerificationRequest,
  vendorStatusToOutcome,
  type VerifyInvestorEvent,
} from '../verify-investor-adapter';

const approvedEvent: VerifyInvestorEvent = {
  id: 'vi_req_123',
  type: 'verification.completed',
  status: 'approved',
  subject: { id: 'subj_1', contactId: 'contact_1', clerkUserId: 'user_abc', email: 'tony@mcv.one' },
  accreditationBasis: 'income',
  jurisdiction: 'US',
  determinedAt: '2026-04-16T01:00:00Z',
};

describe('vendorStatusToOutcome', () => {
  it('approved → clear', () => {
    expect(vendorStatusToOutcome('approved')).toBe('clear');
  });
  it('rejected → match', () => {
    expect(vendorStatusToOutcome('rejected')).toBe('match');
  });
  it('needs_info → review', () => {
    expect(vendorStatusToOutcome('needs_info')).toBe('review');
  });
  it('expired → review', () => {
    expect(vendorStatusToOutcome('expired')).toBe('review');
  });
});

describe('createVerifyInvestorAdapter', () => {
  it('maps approved event to CapitalComplianceEvent outcome=clear, score=1', async () => {
    const adapter = createVerifyInvestorAdapter();
    const event = await adapter.fromForeign(approvedEvent);
    expect(event).not.toBeNull();
    expect(event!.outcome).toBe('clear');
    expect(event!.score).toBe(1);
    expect(event!.source).toBe('verify-investor');
    expect(event!.contactId).toBe('contact_1');
    expect(event!.matchedRecord).toBeUndefined();
  });

  it('maps rejected event to outcome=match, score=0, matchedRecord carries remediation hints', async () => {
    const adapter = createVerifyInvestorAdapter();
    const event = await adapter.fromForeign({
      ...approvedEvent,
      type: 'verification.rejected',
      status: 'rejected',
      remediationHints: ['Income threshold not met'],
    });
    expect(event!.outcome).toBe('match');
    expect(event!.score).toBe(0);
    expect(event!.matchedRecord?.programs).toEqual(['Income threshold not met']);
    expect(event!.matchedRecord?.sourceEntryId).toBe('vi_req_123');
  });

  it('maps needs_info event to outcome=review, score=0.5', async () => {
    const adapter = createVerifyInvestorAdapter();
    const event = await adapter.fromForeign({
      ...approvedEvent,
      type: 'verification.pending',
      status: 'needs_info',
      accreditationBasis: undefined,
    });
    expect(event!.outcome).toBe('review');
    expect(event!.score).toBe(0.5);
    expect(event!.matchedRecord).toBeDefined();
  });

  it('returns null when event is malformed (no id / no subject)', async () => {
    const adapter = createVerifyInvestorAdapter();
    expect(await adapter.fromForeign({ ...approvedEvent, id: '' })).toBeNull();
    expect(await adapter.fromForeign({ ...approvedEvent, subject: { ...approvedEvent.subject, contactId: '' } })).toBeNull();
  });

  it('adapter id is "verify-investor"', () => {
    const adapter = createVerifyInvestorAdapter();
    expect(adapter.id).toBe('verify-investor');
  });
});

describe('createVerificationRequest (mock path when API key absent)', () => {
  const originalKey = process.env.VERIFY_INVESTOR_API_KEY;

  it('returns a mock request with deterministic prefix when no API key', async () => {
    delete process.env.VERIFY_INVESTOR_API_KEY;
    const req = await createVerificationRequest({ contactId: 'contact_xyz' });
    expect(req.contactId).toBe('contact_xyz');
    expect(req.requestId).toMatch(/^mock_contact_xyz_/);
    expect(req.status).toBe('pending');
    expect(req.hostedUrl).toContain('mock-hosted-flow');
    expect(req.hostedUrl).toContain('contact_xyz');
  });

  afterEach(() => {
    if (originalKey !== undefined) process.env.VERIFY_INVESTOR_API_KEY = originalKey;
  });
});

// Minimal afterEach polyfill for the block above (vitest scoping rule)
import { afterEach } from 'vitest';
