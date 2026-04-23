// packages/events-sdk/src/contracts/capital.ts
//
// EdgeIQ Capital emissions + subscriptions.
//
// Mirrors the topics already published by api/_handlers/capital.ts (see
// publishCapitalEvent call sites). Topic format documented in
// docs/capital/PROTOCOL.md §Event Schema: `capital.<entity>.<action>`.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

const RoundStatus      = z.enum([
  'draft', 'open', 'under_subscription', 'funded', 'closed', 'cancelled',
]);
const CommitmentStatus = z.enum([
  'pledged', 'funded', 'refunded', 'cancelled', 'settled',
]);
const DistributionKind = z.enum([
  'royalty', 'dividend', 'interest', 'return_of_capital', 'management_fee', 'carry',
]);

export const CapitalContract: ContractDeclaration<'capital'> = {
  module: 'capital',
  version: '1.0',

  emits: [
    // ── Rounds ──────────────────────────────────────────────────────────
    {
      topic: 'capital.round.created',
      schemaVersion: '1.0',
      payload: z.object({
        roundId: z.string().uuid(),
        name: z.string(),
        ventureId: z.string().nullable(),
      }),
      description: 'New funding round drafted.',
    },
    {
      topic: 'capital.round.status-changed',
      schemaVersion: '1.0',
      payload: z.object({
        roundId: z.string().uuid(),
        fromStatus: RoundStatus,
        toStatus: RoundStatus,
        ventureId: z.string().nullable(),
      }),
      description: 'Round lifecycle transition (draft → open → funded → closed).',
    },
    {
      topic: 'capital.round.funded',
      schemaVersion: '1.0',
      payload: z.object({
        roundId: z.string().uuid(),
        ventureId: z.string().nullable(),
        amountRaisedUsd: z.number(),
      }),
      description: 'Round fully subscribed + funds settled. Downstream triggers IP transfer-to-Root eligibility (foundation listens).',
    },

    // ── Commitments ─────────────────────────────────────────────────────
    {
      topic: 'capital.commitment.created',
      schemaVersion: '1.0',
      payload: z.object({
        commitmentId: z.string().uuid(),
        roundId: z.string().uuid(),
        amountUsd: z.number(),
        status: CommitmentStatus,
      }),
      description: 'Investor pledged capital to a round.',
    },
    {
      topic: 'capital.commitment.funded',
      schemaVersion: '1.0',
      payload: z.object({
        commitmentId: z.string().uuid(),
        roundId: z.string().uuid(),
        amountUsd: z.number(),
        fundedAt: z.string(),
      }),
      description: 'Investor wire / ACH cleared for a commitment.',
    },
    {
      topic: 'capital.commitment.refunded',
      schemaVersion: '1.0',
      payload: z.object({
        commitmentId: z.string().uuid(),
        reason: z.string().nullable(),
        amountUsd: z.number(),
      }),
      description: 'Commitment refunded (withdrawal, cancellation, compliance reject).',
    },

    // ── Accreditation + KYC ─────────────────────────────────────────────
    {
      topic: 'capital.accreditation.issued',
      schemaVersion: '1.0',
      payload: z.object({
        contactId: z.string().uuid(),
        method: z.string(),
        validUntil: z.string().nullable(),
      }),
      description: 'Investor accreditation verified (letter/ income/ net-worth/ entity).',
    },
    {
      topic: 'capital.kyc.approved',
      schemaVersion: '1.0',
      payload: z.object({
        contactId: z.string().uuid(),
        provider: z.string(),
      }),
      description: 'Investor KYC approved — cleared to receive capital calls + distributions.',
    },
    {
      topic: 'capital.kyc.rejected',
      schemaVersion: '1.0',
      payload: z.object({
        contactId: z.string().uuid(),
        reason: z.string(),
      }),
      description: 'Investor KYC rejected — compliance block engaged.',
    },

    // ── Distributions ───────────────────────────────────────────────────
    {
      topic: 'capital.distribution.created',
      schemaVersion: '1.0',
      payload: z.object({
        distributionId: z.string().uuid(),
        kind: DistributionKind,
        totalUsd: z.number(),
        ventureId: z.string().nullable(),
      }),
      description: 'Distribution scheduled for payout (awaiting paymentRouter).',
    },
    {
      topic: 'capital.distribution.paid',
      schemaVersion: '1.0',
      payload: z.object({
        distributionId: z.string().uuid(),
        kind: DistributionKind,
        status: z.string(),
        totalUsd: z.number(),
        ventureId: z.string().nullable(),
      }),
      description: 'Distribution payout settled via paymentRouter (cash leaves treasury).',
    },
  ],

  subscribes: [
    {
      topicPattern: 'commerce.order.paid',
      description:
        'Royalty / revenue-share recognition — paid orders flow into the royalty graph which may auto-schedule distributions.',
    },
    {
      topicPattern: 'mcv-sign.envelope.executed',
      description:
        'Subscription agreements / side-letters delivered via MCV-Sign update commitment status on executed.',
    },
    {
      topicPattern: 'foundation.filing.recorded',
      description:
        'Securities filings (Form D, Reg S etc.) update round compliance posture for the investor portal.',
    },
  ],
};
