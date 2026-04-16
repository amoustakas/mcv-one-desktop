// @mcv/capital-sdk/events — typed cross-venture capital event contract.
//
// Every money-moving state change in every venture flows through one of these
// topics. The contract is the boundary; the underlying schema/rail is
// venture-specific. See docs/capital/VENTURE_ADAPTER.md for integration rules.
//
// Topic format: `capital.<entity>.<action>` — all lowercase, dot-separated.
// Aligns with existing publishCapitalEvent calls in api/_handlers/capital.ts.

import { z } from 'zod';

// ─── Common envelope ────────────────────────────────────────────────────

export const EventActor = z.object({
  kind: z.enum(['user', 'system', 'webhook', 'cron', 'agent']),
  id: z.string().optional(),
  label: z.string().optional(),
});
export type EventActor = z.infer<typeof EventActor>;

const baseFields = {
  id: z.string(),                    // event UUID
  ts: z.string(),                    // ISO timestamp at emission
  ventureId: z.string(),
  actor: EventActor,
  correlationId: z.string().optional(),   // groups related events (e.g., a distribution and its legs)
  metadata: z.record(z.string(), z.unknown()).optional(),
} as const;

// ─── Capital call events ────────────────────────────────────────────────

export const CapitalCallCreated = z.object({
  ...baseFields,
  topic: z.literal('capital.call.created'),
  payload: z.object({
    callId: z.string(),
    roundId: z.string().optional(),
    targetAmount: z.number(),
    currency: z.string(),
    dueAt: z.string().optional(),
  }),
});

export const CapitalCallPublished = z.object({
  ...baseFields,
  topic: z.literal('capital.call.published'),
  payload: z.object({ callId: z.string() }),
});

export const CapitalCallFunded = z.object({
  ...baseFields,
  topic: z.literal('capital.call.funded'),
  payload: z.object({
    callId: z.string(),
    fundedAmount: z.number(),
    currency: z.string(),
  }),
});

export const CapitalCallClosed = z.object({
  ...baseFields,
  topic: z.literal('capital.call.closed'),
  payload: z.object({ callId: z.string(), reason: z.string().optional() }),
});

export const CapitalCallDefaulted = z.object({
  ...baseFields,
  topic: z.literal('capital.call.defaulted'),
  payload: z.object({
    callId: z.string(),
    defaultedAmount: z.number(),
    currency: z.string(),
  }),
});

// ─── Commitment events ──────────────────────────────────────────────────

export const CapitalCommitmentCreated = z.object({
  ...baseFields,
  topic: z.literal('capital.commitment.created'),
  payload: z.object({
    commitmentId: z.string(),
    contactId: z.string().optional(),
    callId: z.string().optional(),
    roundId: z.string().optional(),
    amount: z.number(),
    currency: z.string(),
  }),
});

export const CapitalCommitmentFunded = z.object({
  ...baseFields,
  topic: z.literal('capital.commitment.funded'),
  payload: z.object({
    commitmentId: z.string(),
    fundedAmount: z.number(),
    currency: z.string(),
    rail: z.string().optional(), // 'stripe' | 'plaid' | 'spl' | etc.
  }),
});

export const CapitalCommitmentWithdrawn = z.object({
  ...baseFields,
  topic: z.literal('capital.commitment.withdrawn'),
  payload: z.object({ commitmentId: z.string(), reason: z.string().optional() }),
});

// ─── Bill events ────────────────────────────────────────────────────────

export const CapitalBillGenerated = z.object({
  ...baseFields,
  topic: z.literal('capital.bill.generated'),
  payload: z.object({
    billId: z.string(),
    sourceType: z.string(), // 'capital_call_response' | 'vendor_invoice' | ...
    sourceId: z.string(),
    payeeType: z.string(),  // 'property_spv' | 'platform_treasury' | 'sponsor_manager' | 'custom_vendor' | 'split'
    payeeId: z.string(),
    amount: z.number(),
    currency: z.string(),
  }),
});

export const CapitalBillPaid = z.object({
  ...baseFields,
  topic: z.literal('capital.bill.paid'),
  payload: z.object({
    billId: z.string(),
    stripeTransferId: z.string().optional(),
    paymentRef: z.string().optional(),
    amount: z.number(),
    currency: z.string(),
  }),
});

export const CapitalBillFailed = z.object({
  ...baseFields,
  topic: z.literal('capital.bill.failed'),
  payload: z.object({
    billId: z.string(),
    reason: z.string(),
    retryable: z.boolean().optional(),
  }),
});

export const CapitalBillReversed = z.object({
  ...baseFields,
  topic: z.literal('capital.bill.reversed'),
  payload: z.object({ billId: z.string(), reason: z.string().optional() }),
});

// ─── Distribution events ────────────────────────────────────────────────

export const CapitalDistributionScheduled = z.object({
  ...baseFields,
  topic: z.literal('capital.distribution.scheduled'),
  payload: z.object({
    distributionId: z.string(),
    flowKind: z.string(), // corresponds to CapitalFlow enum
    sourceType: z.string(),
    sourceId: z.string(),
    totalAmount: z.number(),
    currency: z.string(),
    scheduledAt: z.string(),
  }),
});

export const CapitalDistributionCompleted = z.object({
  ...baseFields,
  topic: z.literal('capital.distribution.completed'),
  payload: z.object({
    distributionId: z.string(),
    flowKind: z.string(),
    totalAmount: z.number(),
    currency: z.string(),
    legCount: z.number(),
    legFailedCount: z.number().optional(),
  }),
});

export const CapitalDistributionFailed = z.object({
  ...baseFields,
  topic: z.literal('capital.distribution.failed'),
  payload: z.object({
    distributionId: z.string(),
    reason: z.string(),
  }),
});

// ─── Compliance events ──────────────────────────────────────────────────

export const CapitalComplianceCleared = z.object({
  ...baseFields,
  topic: z.literal('capital.compliance.cleared'),
  payload: z.object({
    subjectType: z.string(), // 'contact' | 'commitment' | 'distribution_leg' | ...
    subjectId: z.string(),
    ruleTypes: z.array(z.string()),
  }),
});

export const CapitalComplianceReview = z.object({
  ...baseFields,
  topic: z.literal('capital.compliance.review'),
  payload: z.object({
    subjectType: z.string(),
    subjectId: z.string(),
    ruleType: z.string(),
    reason: z.string(),
  }),
});

export const CapitalComplianceBlocked = z.object({
  ...baseFields,
  topic: z.literal('capital.compliance.blocked'),
  payload: z.object({
    subjectType: z.string(),
    subjectId: z.string(),
    ruleType: z.string(),
    reason: z.string(),
  }),
});

// ─── Discriminated union ────────────────────────────────────────────────

export const CapitalEvent = z.discriminatedUnion('topic', [
  CapitalCallCreated,
  CapitalCallPublished,
  CapitalCallFunded,
  CapitalCallClosed,
  CapitalCallDefaulted,
  CapitalCommitmentCreated,
  CapitalCommitmentFunded,
  CapitalCommitmentWithdrawn,
  CapitalBillGenerated,
  CapitalBillPaid,
  CapitalBillFailed,
  CapitalBillReversed,
  CapitalDistributionScheduled,
  CapitalDistributionCompleted,
  CapitalDistributionFailed,
  CapitalComplianceCleared,
  CapitalComplianceReview,
  CapitalComplianceBlocked,
]);

export type CapitalEvent = z.infer<typeof CapitalEvent>;

export type CapitalEventTopic = CapitalEvent['topic'];

export const CAPITAL_EVENT_TOPICS = [
  'capital.call.created',
  'capital.call.published',
  'capital.call.funded',
  'capital.call.closed',
  'capital.call.defaulted',
  'capital.commitment.created',
  'capital.commitment.funded',
  'capital.commitment.withdrawn',
  'capital.bill.generated',
  'capital.bill.paid',
  'capital.bill.failed',
  'capital.bill.reversed',
  'capital.distribution.scheduled',
  'capital.distribution.completed',
  'capital.distribution.failed',
  'capital.compliance.cleared',
  'capital.compliance.review',
  'capital.compliance.blocked',
] as const satisfies readonly CapitalEventTopic[];

// ─── Publisher interface ────────────────────────────────────────────────
// Adapters/ventures implement this to fan out events to their chosen sinks.
// The VentureAdapter accepts any implementation, so Futurestate (Prisma)
// and mcv-one-desktop (Supabase) can both plug in without sharing a DB.

export interface CapitalEventPublisher {
  publish(event: CapitalEvent): Promise<void>;
}

/** No-op publisher — safe default when no sink is configured. */
export const nullEventPublisher: CapitalEventPublisher = {
  async publish() {
    /* no-op */
  },
};

/** Fan out to multiple publishers. Any single failure is swallowed; the
 *  caller's transaction is never blocked by eventing. */
export function composePublishers(...publishers: CapitalEventPublisher[]): CapitalEventPublisher {
  return {
    async publish(event) {
      await Promise.allSettled(publishers.map((p) => p.publish(event)));
    },
  };
}
