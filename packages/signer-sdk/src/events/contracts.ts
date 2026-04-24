// packages/signer-sdk/src/events/contracts.ts
//
// Typed emission + subscription contracts for the `signing` module.
//
// NOTE ON NAMESPACE: the existing @mcv/events-sdk `./contracts/mcv-sign`
// declares `mcv-sign.envelope.*` topics for the OPERATOR inbox (PR #35).
// This SDK introduces the `signing.*` namespace for the signer-page +
// venture-agnostic primitive. Two namespaces, one lifecycle — a future
// session can converge or keep them separate; the bridge is straight-
// forward because schemaVersion lives on each event, not in the topic.
//
// Topic naming follows events-sdk's `<module>.<entity>.<action>` convention
// — 3 parts, lowercase kebab. `.v1` suffix style from the original plan
// was dropped because the regex rejects underscores and the topic
// hierarchy is cleaner without it; schemaVersion carries the version
// signal per existing events-sdk convention.

import { z } from 'zod';
import type { ContractDeclaration } from '@mcv/events-sdk/types';

// ─── Payload schemas ────────────────────────────────────────────────────

const envelopeCreatedSchema = z.object({
  publicId: z.string().min(1),
  tenantId: z.string().min(1),
  parentVentureId: z.string().min(1),
  childVentureId: z.string().optional(),
  documentCount: z.number().int().positive(),
  signerEmail: z.string().email(),
  issuedAt: z.string().datetime({ offset: true }),
});

const envelopeViewedSchema = z.object({
  publicId: z.string().min(1),
  tenantId: z.string().min(1),
  viewedAt: z.string().datetime({ offset: true }),
  userAgent: z.string().optional(),
  /** SHA-256 hash of (ip + publicId), never the raw IP. */
  ipHash: z.string().optional(),
});

const envelopeSignedSchema = z.object({
  publicId: z.string().min(1),
  tenantId: z.string().min(1),
  documentId: z.string().min(1),
  signedAt: z.string().datetime({ offset: true }),
  signatureHash: z.string().regex(/^[a-f0-9]{64}$/i),
});

const envelopeVoidedSchema = z.object({
  publicId: z.string().min(1),
  tenantId: z.string().min(1),
  voidedAt: z.string().datetime({ offset: true }),
  voidedBy: z.string().min(1),
  reason: z.string().optional(),
});

const envelopeMutationSchema = z.object({
  publicId: z.string().min(1),
  templateId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  actualVersion: z.number().int().nonnegative(),
  detectedAt: z.string().datetime({ offset: true }),
});

// ─── Contract declaration ───────────────────────────────────────────────

export const SigningContract: ContractDeclaration<'signing'> = {
  module: 'signing',
  version: '1.0',

  emits: [
    {
      topic: 'signing.envelope.created',
      schemaVersion: '1.0',
      payload: envelopeCreatedSchema,
      description:
        'Server-side: envelope row inserted + signer notification dispatched. Fires once per envelope.',
    },
    {
      topic: 'signing.envelope.viewed',
      schemaVersion: '1.0',
      payload: envelopeViewedSchema,
      description:
        'Client: first render of the signer page. May fire multiple times if the same signer returns.',
    },
    {
      topic: 'signing.envelope.signed',
      schemaVersion: '1.0',
      payload: envelopeSignedSchema,
      description:
        'After Ed25519-verified accept. One event per document in the envelope — multi-document envelopes fire N events.',
    },
    {
      topic: 'signing.envelope.voided',
      schemaVersion: '1.0',
      payload: envelopeVoidedSchema,
      description: 'Admin or workflow voided the envelope before it was fully signed.',
    },
    {
      topic: 'signing.envelope.mutation-detected',
      schemaVersion: '1.0',
      payload: envelopeMutationSchema,
      description:
        'Template version moved after envelope issue — signer view would diverge from signed bytes. Compliance must investigate.',
    },
  ],

  subscribes: [
    {
      topicPattern: 'agentic.draft_approved',
      description:
        'Agent-generated document draft was approved in the Draft Inbox — envelope-builder composes + issues a signing envelope.',
    },
    {
      topicPattern: 'onboarding.invite.accepted',
      description:
        'Invited signer completed KYC — ready to receive bundled signing envelopes per their access tier.',
    },
    {
      topicPattern: 'foundation.counsel.engaged',
      description:
        'New counsel engagement → auto-draft NDA signing envelope. Parallel to the mcv-sign contract\'s subscription.',
    },
  ],
};

// Schema re-exports for direct use in publisher validators + tests.
export {
  envelopeCreatedSchema,
  envelopeViewedSchema,
  envelopeSignedSchema,
  envelopeVoidedSchema,
  envelopeMutationSchema,
};
