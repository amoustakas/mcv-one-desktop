import type { EventEnvelope } from '@mcv/events-sdk/types'

/**
 * Cross-repo envelope bridge — adapt Fabric's `MCVEvent` (from
 * `@mcv/fabric-sdk/types` in `mcv-core-triangle`) into the canonical
 * `@mcv/events-sdk` `EventEnvelope` consumed by the mcv-one-desktop
 * Agentic OS nervous system.
 *
 * Structural type only — we do NOT take a hard dep on `@mcv/fabric-sdk`
 * at this consumption point. The shape below mirrors the Fabric
 * definition in `packages/fabric-sdk/src/types/index.ts` of
 * mcv-core-triangle. Drift detection lives in the sim-parity test.
 *
 * Field mapping:
 *
 *   Fabric MCVEvent        →  EventEnvelope (@mcv/events-sdk)
 *   ────────────────────────────────────────────────────────
 *   id                     →  id
 *   topic                  →  topic
 *   version                →  schemaVersion
 *   correlationId          →  correlationId
 *   (no field)             →  causationId = null (Fabric has no cascade
 *                             concept today)
 *   ventureId              →  ventureId
 *   timestamp              →  emittedAt
 *   source                 →  emittedBy ("fabric:<source>" prefixed)
 *   data                   →  payload
 *   type + metadata        →  folded into payload metadata envelope so
 *                             nothing is lost on bridge
 *
 * The mapping is lossless: every Fabric MCVEvent field survives the
 * round-trip. Fabric-specific fields that have no direct EventEnvelope
 * slot (`type`, `metadata`) live in `payload.__fabric` to keep the
 * payload useful to handlers that care only about the domain data.
 */

/**
 * Structural subset of Fabric's `MCVEvent<T>` from
 * `@mcv/fabric-sdk/types` in `mcv-core-triangle`. Kept as a local type
 * alias so this module doesn't need a hard dep on the sibling repo.
 */
export interface FabricMCVEvent<T = unknown> {
  id: string
  topic: string
  type: string
  source: string
  ventureId: string
  correlationId: string
  timestamp: string
  version: string
  data: T
  metadata?: Record<string, unknown>
}

/** Data wrapper added to payload when bridging. Consumers that care
 *  about the Fabric-specific bits can unpack from `__fabric`. */
export interface FabricBridgePayload<T = unknown> {
  /** Original data from the Fabric event (domain payload). */
  data: T
  /** Fabric-side fields that don't map 1:1 to EventEnvelope slots. */
  __fabric: {
    type: string
    metadata?: Record<string, unknown>
  }
}

/**
 * Bridge a Fabric `MCVEvent` to a canonical `@mcv/events-sdk`
 * `EventEnvelope`. Pure function — deterministic, side-effect-free,
 * safe to call in hot paths.
 *
 * The returned envelope has `status: 'pending'` — consumers that
 * persist it into `event_log` should update status per their
 * processing contract. For in-memory sim observation no state change
 * is needed.
 *
 * `emittedBy` is prefixed with `fabric:` so cross-repo provenance is
 * preserved on the audit trail — any handler can see at a glance
 * that the event originated on the mcv-core-triangle side.
 */
export function fabricToEventEnvelope<T>(
  event: FabricMCVEvent<T>,
): EventEnvelope<FabricBridgePayload<T>> {
  return {
    id: event.id,
    topic: event.topic,
    schemaVersion: event.version,
    correlationId: event.correlationId,
    // Fabric has no cascade concept today — every bridged event is a
    // root until Fabric gains causation semantics of its own.
    causationId: null,
    ventureId: event.ventureId,
    emittedAt: event.timestamp,
    emittedBy: `fabric:${event.source}`,
    payload: {
      data: event.data,
      __fabric: {
        type: event.type,
        ...(event.metadata ? { metadata: event.metadata } : {}),
      },
    },
    status: 'pending',
  }
}

/**
 * Batch helper — bridge an array of Fabric events in order. Equivalent
 * to `events.map(fabricToEventEnvelope)` but kept as a named export for
 * call-site clarity when mass-bridging (e.g. sim-dry-run reading the
 * sim-local publisher's ring buffer).
 */
export function fabricBatchToEnvelopes<T = unknown>(
  events: ReadonlyArray<FabricMCVEvent<T>>,
): EventEnvelope<FabricBridgePayload<T>>[] {
  return events.map((e) => fabricToEventEnvelope(e))
}

/**
 * Inverse — extract a FabricMCVEvent shape from a bridged envelope.
 * Useful for sim-parity tests that want to assert the round-trip is
 * lossless. Returns null if the envelope doesn't carry the
 * `__fabric` metadata (i.e. was not produced by this bridge).
 */
export function envelopeToFabricEvent<T = unknown>(
  envelope: EventEnvelope<unknown>,
): FabricMCVEvent<T> | null {
  const payload = envelope.payload as Partial<FabricBridgePayload<T>> | null
  if (!payload || typeof payload !== 'object' || !payload.__fabric) return null
  const source = envelope.emittedBy.startsWith('fabric:')
    ? envelope.emittedBy.slice('fabric:'.length)
    : envelope.emittedBy
  return {
    id: envelope.id,
    topic: envelope.topic,
    type: payload.__fabric.type,
    source,
    ventureId: envelope.ventureId ?? '',
    correlationId: envelope.correlationId,
    timestamp: envelope.emittedAt,
    version: envelope.schemaVersion,
    data: payload.data as T,
    ...(payload.__fabric.metadata ? { metadata: payload.__fabric.metadata } : {}),
  }
}
