// DocuSign adapter — unit tests for inbound mapping + outbound mock path.

import { describe, it, expect, afterEach } from 'vitest';
import {
  createDocuSignAdapter,
  createEnvelope,
  eventToOutcome,
  type DocuSignEnvelopeEvent,
} from '../docusign-adapter';

const completedEvent: DocuSignEnvelopeEvent = {
  event: 'envelope-completed',
  generatedDateTime: '2026-04-16T07:00:00Z',
  data: {
    envelopeId: 'env_abc_123',
    envelopeSummary: {
      status: 'completed',
      completedDateTime: '2026-04-16T06:59:30Z',
      recipients: {
        signers: [{
          name: 'Tony Moustakas',
          email: 'tony@mcv.one',
          roleName: 'Investor',
          signedDateTime: '2026-04-16T06:59:00Z',
        }],
      },
    },
    envelopeCustomFields: {
      textCustomFields: [{ name: 'capital_commitment_id', value: 'commit_xyz' }],
    },
  },
};

describe('eventToOutcome', () => {
  it('maps envelope-completed to signed', () => {
    expect(eventToOutcome('envelope-completed')).toBe('signed');
  });
  it('maps envelope-declined to declined', () => {
    expect(eventToOutcome('envelope-declined')).toBe('declined');
  });
  it('maps envelope-voided to voided', () => {
    expect(eventToOutcome('envelope-voided')).toBe('voided');
  });
  it('returns null for non-terminal events (envelope-sent, envelope-corrected)', () => {
    expect(eventToOutcome('envelope-sent')).toBeNull();
    expect(eventToOutcome('envelope-corrected')).toBeNull();
  });
});

describe('createDocuSignAdapter', () => {
  it('maps envelope-completed event to CapitalSigningEvent with signed outcome', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign(completedEvent);
    expect(event).not.toBeNull();
    expect(event!.outcome).toBe('signed');
    expect(event!.envelopeId).toBe('env_abc_123');
    expect(event!.commitmentId).toBe('commit_xyz');
    expect(event!.source).toBe('docusign');
    expect(event!.signers).toHaveLength(1);
    expect(event!.signers![0].email).toBe('tony@mcv.one');
    expect(event!.completedAt).toBe('2026-04-16T06:59:30Z');
  });

  it('returns commitmentId="" when custom field absent (forces lookup path)', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign({
      ...completedEvent,
      data: { ...completedEvent.data, envelopeCustomFields: undefined },
    });
    expect(event!.commitmentId).toBe('');
    expect(event!.envelopeId).toBe('env_abc_123');
  });

  it('returns null on non-terminal events (envelope-sent)', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign({ ...completedEvent, event: 'envelope-sent' });
    expect(event).toBeNull();
  });

  it('returns null on malformed events (no envelopeId)', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign({
      ...completedEvent,
      data: { ...completedEvent.data, envelopeId: '' },
    });
    expect(event).toBeNull();
  });

  it('maps declined event with declinedDateTime as completedAt', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign({
      event: 'envelope-declined',
      generatedDateTime: '2026-04-16T08:00:00Z',
      data: {
        envelopeId: 'env_decline_1',
        envelopeSummary: {
          status: 'declined',
          declinedDateTime: '2026-04-16T07:55:00Z',
        },
        envelopeCustomFields: {
          textCustomFields: [{ name: 'capital_commitment_id', value: 'commit_decline' }],
        },
      },
    });
    expect(event!.outcome).toBe('declined');
    expect(event!.completedAt).toBe('2026-04-16T07:55:00Z');
  });

  it('captures inline base64 PDF receipt when DocuSign Connect includes documents', async () => {
    const adapter = createDocuSignAdapter();
    const event = await adapter.fromForeign({
      ...completedEvent,
      data: {
        ...completedEvent.data,
        envelopeSummary: {
          ...completedEvent.data.envelopeSummary,
          envelopeDocuments: [{ documentId: '1', name: 'agreement.pdf', PDFBytes: 'aGVsbG8=' }],
        },
      },
    });
    expect(event!.receipt?.base64Pdf).toBe('aGVsbG8=');
    expect(event!.receipt?.contentType).toBe('application/pdf');
  });

  it('adapter id is "docusign"', () => {
    expect(createDocuSignAdapter().id).toBe('docusign');
  });
});

describe('createEnvelope (mock path when DOCUSIGN_INTEGRATION_KEY absent)', () => {
  const originalKey = process.env.DOCUSIGN_INTEGRATION_KEY;

  it('returns a deterministic mock envelope when no creds', async () => {
    delete process.env.DOCUSIGN_INTEGRATION_KEY;
    const env = await createEnvelope({
      commitmentId: 'commit_test',
      templateId: 'tpl_sub_agreement',
      signers: [{ name: 'Tony', email: 'tony@mcv.one', embedded: true }],
    });
    expect(env.source).toBe('docusign-mock');
    expect(env.envelopeId).toMatch(/^mock-env-commit_test-/);
    expect(env.status).toBe('mocked');
    expect(env.hostedRecipientUrls).toHaveLength(1);
    expect(env.hostedRecipientUrls![0].email).toBe('tony@mcv.one');
  });

  it('mock path skips hosted URL generation for non-embedded signers', async () => {
    delete process.env.DOCUSIGN_INTEGRATION_KEY;
    const env = await createEnvelope({
      commitmentId: 'commit_email_only',
      templateId: 'tpl_x',
      signers: [{ name: 'External', email: 'ext@example.com', embedded: false }],
    });
    expect(env.hostedRecipientUrls).toHaveLength(0);
  });

  afterEach(() => {
    if (originalKey !== undefined) process.env.DOCUSIGN_INTEGRATION_KEY = originalKey;
    else delete process.env.DOCUSIGN_INTEGRATION_KEY;
  });
});
