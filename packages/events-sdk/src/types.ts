// packages/events-sdk/src/types.ts
//
// Core types for the Typed Nervous System (M-F1).
//
// Two categories of types here:
//   1. Transport types: EventEnvelope<T>, EventStatus — shape of what travels
//      through the bus and gets archived to event_log.
//   2. Contract types: EmissionDeclaration, SubscriptionDeclaration,
//      ContractDeclaration<M> — what each module declares it emits + listens for.
//
// Nothing in this file depends on Supabase or zod at runtime — pure TS types
// so tree-shaking / consumer bundlers have full freedom.

import type { z } from 'zod';

// ─── Transport ──────────────────────────────────────────────────────────────

/** Lifecycle status written to event_log.status. */
export type EventStatus = 'published' | 'failed' | 'retried';

/**
 * The canonical envelope every event rides in. Shape matches the event_log
 * row one-for-one (modulo camelCase). Subscribers always receive envelopes,
 * never raw payloads — correlation + causation metadata is part of the
 * handler's job to preserve across cascading publishes.
 */
export interface EventEnvelope<TPayload = unknown> {
  /** uuid — event_log.id */
  id: string;
  /** `<module>.<entity>.<action>` — e.g., `foundation.counsel.nda-executed`. */
  topic: string;
  /** Bumps on payload shape change. Major = breaking, minor = additive. */
  schemaVersion: string;
  /** Ties a cascade together. Root events generate their own; follow-ups inherit. */
  correlationId: string;
  /** id of the parent event in the cascade; null for roots. */
  causationId: string | null;
  /** null for org-level events (e.g. `foundation.*`). */
  ventureId: string | null;
  /** ISO timestamp, set by the DB default. */
  emittedAt: string;
  /**
   * `system:<domain>` | `agent:<handle>` | `user:<userId>` | `cron:<jobName>`.
   * Free-form string for now; a stricter union can land later.
   */
  emittedBy: string;
  payload: TPayload;
  status: EventStatus;
}

/** Options passed to publish(). Most fields default. */
export interface PublishOptions {
  correlationId?: string;
  causationId?: string | null;
  ventureId?: string | null;
  emittedBy?: string;
  schemaVersion?: string;
}

// ─── Contract declarations ──────────────────────────────────────────────────

/**
 * One emission declaration: topic + zod schema + docstring. Modules export
 * a bundle of these to tell the rest of the system what they broadcast.
 */
export interface EmissionDeclaration<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  topic: string;
  schemaVersion: string;
  /** zod schema — used both for publish-side validation and for JSON Schema dump in integration_contracts. */
  payload: TSchema;
  description: string;
}

/**
 * One subscription declaration: topic pattern + optional handler / agent binding
 * + docstring. Pattern supports wildcards via `*` at the end (`foundation.*`).
 */
export interface SubscriptionDeclaration {
  topicPattern: string;
  /** Optional remote webhook binding for durable subscribers. */
  handlerUrl?: string;
  /** Optional agent handle binding, e.g. `@argus`. */
  agentId?: string;
  description: string;
}

/**
 * Full per-module declaration. `module` is the stable ID ('foundation'), version
 * bumps when emissions/subscriptions schemas change. Registered to
 * integration_contracts at module boot.
 */
export interface ContractDeclaration<M extends string = string> {
  module: M;
  version: string;
  emits: ReadonlyArray<EmissionDeclaration>;
  subscribes: ReadonlyArray<SubscriptionDeclaration>;
}

// ─── Subscriber handles ─────────────────────────────────────────────────────

/** Opaque handle returned by subscribe(); pass to unsubscribe() to tear down. */
export interface SubscriberHandle {
  /** Unique within a Subscriber instance. */
  readonly id: string;
  /** The pattern the handler registered for. */
  readonly topicPattern: string;
  /** Best-effort tear-down. Idempotent. */
  unsubscribe(): Promise<void>;
}

/**
 * Any function that accepts an envelope. Handlers MUST be async so errors can
 * be caught by the dispatcher and written to event_dead_letters.
 */
export type EventHandler<TPayload = unknown> = (event: EventEnvelope<TPayload>) => Promise<void>;

// ─── Row shapes (for direct DB reads in publisher/replay) ──────────────────

/** Camel→snake mapping of EventEnvelope. What event_log rows look like on the wire. */
export interface EventLogRow {
  id: string;
  topic: string;
  schema_version: string;
  correlation_id: string;
  causation_id: string | null;
  venture_id: string | null;
  emitted_at: string;
  emitted_by: string;
  payload: unknown;
  status: EventStatus;
}

export interface IntegrationContractRow {
  id: string;
  module: string;
  version: string;
  emits: unknown;
  subscribes: unknown;
  registered_at: string;
}

export interface EventDeadLetterRow {
  id: string;
  event_id: string;
  subscriber_id: string | null;
  subscriber_label: string;
  topic: string;
  error_message: string;
  error_stack: string | null;
  attempt_count: number;
  first_failed_at: string;
  last_failed_at: string;
  next_retry_at: string | null;
  status: 'pending' | 'retrying' | 'resolved' | 'abandoned';
}
