// @mcv/capital-sdk/venture-adapter — the per-venture boundary object.
//
// Every venture (futurestate, betedge, warforge, mcvgg, arq, edgeiq-markets,
// mcv-platform) constructs exactly one VentureAdapter at process start and
// emits typed CapitalEvents through it on every state change. The adapter
// stamps ventureId + actor + timestamps so call sites only supply the payload.
//
// Fire-and-forget semantics: publish failures are logged but never thrown.
// The caller's primary transaction (Prisma, Supabase) must NEVER wait on
// eventing — events are telemetry, money is the product.
//
// See docs/capital/VENTURE_ADAPTER.md for integration guide.

import { randomUUID } from 'node:crypto';
import type {
  CapitalEvent,
  CapitalEventPublisher,
  EventActor,
} from './events.js';

export interface VentureAdapterOptions {
  ventureId: string;
  publisher: CapitalEventPublisher;
  /** Optional default actor for system-originated events. */
  defaultActor?: EventActor;
  /** Hook for unit tests to intercept IDs/timestamps. */
  clock?: () => string;
  uuid?: () => string;
}

type Payload<T extends CapitalEvent['topic']> = Extract<CapitalEvent, { topic: T }>['payload'];

export interface EmitOptions {
  actor?: EventActor;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface VentureAdapter {
  ventureId: string;

  // Capital calls
  emitCallCreated(payload: Payload<'capital.call.created'>, opts?: EmitOptions): Promise<void>;
  emitCallPublished(payload: Payload<'capital.call.published'>, opts?: EmitOptions): Promise<void>;
  emitCallFunded(payload: Payload<'capital.call.funded'>, opts?: EmitOptions): Promise<void>;
  emitCallClosed(payload: Payload<'capital.call.closed'>, opts?: EmitOptions): Promise<void>;
  emitCallDefaulted(payload: Payload<'capital.call.defaulted'>, opts?: EmitOptions): Promise<void>;

  // Commitments
  emitCommitmentCreated(payload: Payload<'capital.commitment.created'>, opts?: EmitOptions): Promise<void>;
  emitCommitmentFunded(payload: Payload<'capital.commitment.funded'>, opts?: EmitOptions): Promise<void>;
  emitCommitmentWithdrawn(payload: Payload<'capital.commitment.withdrawn'>, opts?: EmitOptions): Promise<void>;

  // Bills
  emitBillGenerated(payload: Payload<'capital.bill.generated'>, opts?: EmitOptions): Promise<void>;
  emitBillPaid(payload: Payload<'capital.bill.paid'>, opts?: EmitOptions): Promise<void>;
  emitBillFailed(payload: Payload<'capital.bill.failed'>, opts?: EmitOptions): Promise<void>;
  emitBillReversed(payload: Payload<'capital.bill.reversed'>, opts?: EmitOptions): Promise<void>;

  // Distributions
  emitDistributionScheduled(payload: Payload<'capital.distribution.scheduled'>, opts?: EmitOptions): Promise<void>;
  emitDistributionCompleted(payload: Payload<'capital.distribution.completed'>, opts?: EmitOptions): Promise<void>;
  emitDistributionFailed(payload: Payload<'capital.distribution.failed'>, opts?: EmitOptions): Promise<void>;

  // Compliance
  emitComplianceCleared(payload: Payload<'capital.compliance.cleared'>, opts?: EmitOptions): Promise<void>;
  emitComplianceReview(payload: Payload<'capital.compliance.review'>, opts?: EmitOptions): Promise<void>;
  emitComplianceBlocked(payload: Payload<'capital.compliance.blocked'>, opts?: EmitOptions): Promise<void>;

  /** Low-level escape hatch for custom topics added later. */
  emit<T extends CapitalEvent['topic']>(topic: T, payload: Payload<T>, opts?: EmitOptions): Promise<void>;
}

export function createVentureAdapter(options: VentureAdapterOptions): VentureAdapter {
  const { ventureId, publisher } = options;
  const defaultActor: EventActor = options.defaultActor ?? { kind: 'system' };
  const clock = options.clock ?? (() => new Date().toISOString());
  const uuid = options.uuid ?? (() => randomUUID());

  async function emit<T extends CapitalEvent['topic']>(
    topic: T,
    payload: Payload<T>,
    opts: EmitOptions = {},
  ): Promise<void> {
    const event = {
      id: uuid(),
      ts: clock(),
      ventureId,
      topic,
      payload,
      actor: opts.actor ?? defaultActor,
      correlationId: opts.correlationId,
      metadata: opts.metadata,
    } as CapitalEvent;

    try {
      await publisher.publish(event);
    } catch (err) {
      console.warn(`[capital-adapter/${ventureId}] publish failed for ${topic}:`, err);
    }
  }

  return {
    ventureId,
    emit,
    emitCallCreated:            (p, o) => emit('capital.call.created', p, o),
    emitCallPublished:          (p, o) => emit('capital.call.published', p, o),
    emitCallFunded:             (p, o) => emit('capital.call.funded', p, o),
    emitCallClosed:             (p, o) => emit('capital.call.closed', p, o),
    emitCallDefaulted:          (p, o) => emit('capital.call.defaulted', p, o),
    emitCommitmentCreated:      (p, o) => emit('capital.commitment.created', p, o),
    emitCommitmentFunded:       (p, o) => emit('capital.commitment.funded', p, o),
    emitCommitmentWithdrawn:    (p, o) => emit('capital.commitment.withdrawn', p, o),
    emitBillGenerated:          (p, o) => emit('capital.bill.generated', p, o),
    emitBillPaid:               (p, o) => emit('capital.bill.paid', p, o),
    emitBillFailed:             (p, o) => emit('capital.bill.failed', p, o),
    emitBillReversed:           (p, o) => emit('capital.bill.reversed', p, o),
    emitDistributionScheduled:  (p, o) => emit('capital.distribution.scheduled', p, o),
    emitDistributionCompleted:  (p, o) => emit('capital.distribution.completed', p, o),
    emitDistributionFailed:     (p, o) => emit('capital.distribution.failed', p, o),
    emitComplianceCleared:      (p, o) => emit('capital.compliance.cleared', p, o),
    emitComplianceReview:       (p, o) => emit('capital.compliance.review', p, o),
    emitComplianceBlocked:      (p, o) => emit('capital.compliance.blocked', p, o),
  };
}
