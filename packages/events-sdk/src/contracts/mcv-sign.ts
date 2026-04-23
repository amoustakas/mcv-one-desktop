// packages/events-sdk/src/contracts/mcv-sign.ts
//
// MCV-Sign (protocol-native signing rail) emissions + subscriptions.
//
// Forward-looking — the mcv-sign module is operator-inbox today; emission
// wiring lands when PR #35 rebases. Declaring contracts first lets other
// modules (foundation NDAs, capital side-letters) already subscribe and the
// cockpit agents fleet (M-F3) can design subscriptions against a stable shape.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

const EnvelopeKind = z.enum(['nda', 'ip-assignment', 'subscription-agreement', 'side-letter', 'employment', 'contractor', 'other']);
const EnvelopeStatus = z.enum(['drafted', 'sent', 'viewed', 'signed', 'executed', 'declined', 'voided']);

export const McvSignContract: ContractDeclaration<'mcv-sign'> = {
  module: 'mcv-sign',
  version: '1.0',

  emits: [
    {
      topic: 'mcv-sign.envelope.created',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        kind: EnvelopeKind,
        subjectEntity: z.string().nullable(),
        subjectRef: z.string().nullable(),
      }),
      description: 'Signing envelope drafted (not yet sent).',
    },
    {
      topic: 'mcv-sign.envelope.sent',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        kind: EnvelopeKind,
        recipientCount: z.number(),
        sentAt: z.string(),
      }),
      description: 'Envelope delivered to signers (inbox-first UX kicks in for operators).',
    },
    {
      topic: 'mcv-sign.envelope.signed',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        signerId: z.string().uuid(),
        signedAt: z.string(),
      }),
      description: 'One signer has executed. Not yet fully executed if more signers remain.',
    },
    {
      topic: 'mcv-sign.envelope.executed',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        kind: EnvelopeKind,
        executedAt: z.string(),
        subjectEntity: z.string().nullable(),
        subjectRef: z.string().nullable(),
      }),
      description: 'All signers executed — envelope is enforceable. Foundation NDAs + Capital side-letters listen.',
    },
    {
      topic: 'mcv-sign.envelope.declined',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        declinedBy: z.string(),
        reason: z.string().nullable(),
      }),
      description: 'Signer declined the envelope. Operator action required.',
    },
    {
      topic: 'mcv-sign.envelope.voided',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        voidedBy: z.string(),
        reason: z.string().nullable(),
      }),
      description: 'Envelope voided before execution (typo, wrong signer, superseded version).',
    },
    {
      topic: 'mcv-sign.envelope.reminder-sent',
      schemaVersion: '1.0',
      payload: z.object({
        envelopeId: z.string().uuid(),
        recipientId: z.string(),
        daysOutstanding: z.number(),
      }),
      description: 'Reminder nudge sent to a pending signer.',
    },
  ],

  subscribes: [
    {
      topicPattern: 'foundation.counsel.engaged',
      description: 'New counsel engagement auto-drafts an NDA envelope.',
    },
    {
      topicPattern: 'capital.commitment.created',
      description: 'New commitment auto-drafts a subscription-agreement envelope.',
    },
    {
      topicPattern: 'foundation.ip-mark.created',
      description: 'New IP mark may need an IP-assignment envelope (Tony → MCV LTD → Root).',
    },
  ],
};

export { EnvelopeKind, EnvelopeStatus };
