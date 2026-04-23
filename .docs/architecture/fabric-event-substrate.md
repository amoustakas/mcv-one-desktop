# Fabric Event Substrate — Three-Mode Publisher Architecture

**Location:** `mcv-core-triangle/packages/fabric/src/services/`
**Shipped:** Marathon 5 P1.B Phase A (2026-04-22, branch `foundation-substrate-2026-04-22`)

---

## Purpose

Three production-grade `EventPublisher` modes behind a single env-gated factory, supporting the full lifecycle from local dev to sim-parity CI to durable production:

| Mode | Use | Durability | Observable |
|---|---|---|---|
| `in-process` (default) | Dev + single-instance fabric | None | Via subscribers only |
| `gcp-pubsub` | Production multi-instance | At-least-once via outbox drainer | Via subscribers + outbox rows |
| `sim-local` | CI + sim-dry-run + audit replay | None | **Bounded ring buffer (first-class)** |

---

## Mode selection

**Env var:** `EVENT_PUBLISHER=<mode>` (case-insensitive; default `in-process`)

```ts
// event-publisher.ts
export function getEventPublisher(): EventPublisher {
  if (!defaultPublisher) {
    const mode = (process.env.EVENT_PUBLISHER ?? 'in-process').toLowerCase()
    if (mode === 'gcp-pubsub') defaultPublisher = new GcpPubSubOutboxPublisher()
    else if (mode === 'sim-local') defaultPublisher = getSimLocalEventPublisher()
    else defaultPublisher = new InProcessEventPublisher()
  }
  return defaultPublisher
}
```

All three implement the single `EventPublisher` interface: `publish<T>(event: MCVEvent<T>): Promise<void>`. Consumer code is unchanged — the mode swap happens at startup.

---

## sim-local — observable publisher for CI + sim-dry-run

The innovation of Phase A. Unlike a mock, `SimLocalEventPublisher` is a fully-specified EventPublisher that:

1. **Validates every envelope** against the canonical `eventEnvelopeSchema` (Zod) — malformed events throw.
2. **Records every publish call** in a bounded ring buffer (default 1000 entries, oldest dropped on overflow).
3. **Mirrors into the InMemoryEventBus** so in-process handlers still fire — not a no-op.

**Observer API:**

```ts
import { getSimLocalEventPublisher } from '@mcv/fabric/services/sim-local-event-publisher'

const pub = getSimLocalEventPublisher()
const events = pub.getPublishedEvents() // ReadonlyArray<PublishedEventRecord>
const last = pub.getLastEvent()
pub.size()
pub.reset()
```

`PublishedEventRecord` = `{ event: MCVEvent<unknown>, receivedAt: string, sequence: number }`. Sequence counter is monotonic and persists across ring-buffer drops for deterministic assertions.

---

## Cross-repo envelope bridge

Fabric's native `MCVEvent` shape differs from `@mcv/events-sdk`'s `EventEnvelope` (Agentic OS nervous system). The bridge [src/lib/fabric-bridge/fabric-to-events.ts](../../src/lib/fabric-bridge/fabric-to-events.ts) maps losslessly:

| Fabric MCVEvent | EventEnvelope |
|---|---|
| `id` | `id` |
| `topic` | `topic` |
| `version` | `schemaVersion` |
| `correlationId` | `correlationId` |
| *(no cascade concept)* | `causationId = null` |
| `ventureId` | `ventureId` |
| `timestamp` | `emittedAt` |
| `source` | `emittedBy` (prefixed `fabric:`) |
| `data` | `payload.data` |
| `type` + `metadata` | `payload.__fabric.{type, metadata}` |

**Provenance preservation:** `emittedBy` is prefixed with `fabric:` so every bridged event self-identifies on the audit trail. Downstream handlers can grep by source domain.

**Round-trip lossless:** `envelopeToFabricEvent()` inverts the bridge byte-exactly on every required field. Foreign envelopes (no `__fabric` metadata) return null — bridge discrimination is explicit.

---

## Why type-only cross-repo import

Bridge module uses **structural typing** for `FabricMCVEvent<T>` — a local type alias mirroring the Fabric definition — rather than importing `@mcv/fabric-sdk` directly. Rationale:

- Avoids hard dep on mcv-core-triangle packages at this consumption point.
- Cross-repo npm topology (workspace / file-path / published) can evolve without breaking mcv-one-desktop consumers.
- Drift detection lives in the sim-parity test suite (8 contracts enforcing field-level parity).

When `@mcv/fabric` becomes available as a file-path dep (next session), the local type alias collapses to `import type { MCVEvent as FabricMCVEvent } from '@mcv/fabric-sdk/types'` — zero consumer changes.

---

## Components

| File | Purpose |
|---|---|
| [mcv-core-triangle/packages/fabric/src/services/event-publisher.ts](../../../mcv-core-triangle/packages/fabric/src/services/event-publisher.ts) | Factory + InProcess + GcpPubSubOutbox publishers |
| [mcv-core-triangle/packages/fabric/src/services/sim-local-event-publisher.ts](../../../mcv-core-triangle/packages/fabric/src/services/sim-local-event-publisher.ts) | SimLocalEventPublisher + observable ring buffer |
| [mcv-core-triangle/packages/fabric/src/services/pubsub.service.ts](../../../mcv-core-triangle/packages/fabric/src/services/pubsub.service.ts) | InMemoryEventBus + buildEvent + resetEventBus helper |
| [src/lib/fabric-bridge/fabric-to-events.ts](../../src/lib/fabric-bridge/fabric-to-events.ts) | Cross-repo envelope adapter (mcv-one-desktop side) |

---

## Test coverage

- `packages/fabric/src/services/__tests__/sim-local-event-publisher.test.ts` — 9 tests (sequence monotonicity, fan-out, bus opt-out, envelope validation, validation bypass, ring overflow, reset, handler-error isolation)
- `packages/fabric/src/services/__tests__/event-publisher.test.ts` — 10 tests (three-mode factory selection + case-insensitivity)
- `packages/fabric/src/services/__tests__/pubsub.service.test.ts` — 14 tests (bus semantics + resetEventBus contract)
- `src/lib/fabric-bridge/__tests__/fabric-to-events.test.ts` — 8 tests (field mapping, round-trip, provenance prefix, batch order)
- `scripts/__tests__/sim-parity.test.ts` — 8 new cross-repo contracts (out of 25 total)

**Phase A suite (@mcv/fabric):** 133 tests green (was 119, +14).
**Cross-repo parity contracts:** 16 tests total (8 bridge unit + 8 sim-parity CI).

---

## Deferred (explicit follow-ups)

1. **File-path dep wiring** — add `@mcv/fabric: "file:../mcv-core-triangle/packages/fabric"` to mcv-one-desktop devDependencies so sim-dry-run can exercise the real SimLocalEventPublisher runtime (not just the bridge contract).
2. **Publish `@mcv/fabric-sdk` to private npm** — drops file-path deps, enables Futurestate consumption.
3. **Fabric cascade semantics** — Fabric currently has no `causationId` / cascade concept; bridging to events-sdk produces roots only. When Fabric adds cascade support, the bridge adapter maps it through.
4. **Outbox drainer integration with sim-local** — today the drainer skips when not in `gcp-pubsub` mode; a `sim-local` drainer variant would exercise the full outbox → bus fan-out path in CI.
