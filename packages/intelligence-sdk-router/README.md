# @mcv/intelligence-sdk-router

> Phase-1 Intelligence Router — unified recall/observe across 7 memory/knowledge substrates for the MCV agentic OS.

**Status:** v0.1 · local-first · ships in `mcv-one-desktop/packages/` tonight · promotion path to `mcv-core-triangle/packages/intelligence-sdk/src/router/` pending.

---

## What this package is

The Intelligence Router is a single API (`recall` / `observe` / `trace` / `personality` / `context` / `record` / `emit`) that fans out across every memory and knowledge substrate in the MCV ecosystem: `storage_chunks` (semantic), `project_memory` (personal), `naos_interactions` + `event_log` (episodic), `kit_audit_log` (procedural), `naos_emotional_state` + `naos_relationships` + `naos_personality` (social), `agent_drafts.context_refs` (referential), and the new `agent_memory_longterm` (long-term).

Every MCV agent — Hit Squad, Futurestate counsel, BetEdge predictor, WarForge NPC, and Tony's own top-level Jarvis — will consume the same Router, with the same recall-ranking semantics (Reciprocal Rank Fusion @ k=60 + composite re-rank weighted 0.5·rrf + 0.25·sim + 0.15·recency + 0.10·confidence), with the same per-tenant RLS isolation, with the same event-emission contract (`knowledge.recall`, `knowledge.observed`, `knowledge.backpressure`).

Plan source of truth: `C:\Users\moust\.claude\plans\i-want-to-plan-synchronous-thacker.md` §1.1–1.6 (Phase-1 Unified Intelligence Layer).

---

## Why local in `mcv-one-desktop` first?

Phase-1's telemetry + determinism DTO contracts were authored on `mcv-core-triangle/origin/foundation-substrate-2026-04-22` at SHA `c532c7d` (2026-04-22) as part of M5 P1.B, but that branch **has not been merged to `core-triangle/main`**. So tonight the Router ships local — the telemetry + determinism files under `src/` are a forward-copy.

Same pattern as Phase-0's `@mcv/guardrails-sdk`: land the SDK local, prove the contract, promote later.

### Swap-to-SDK checklist (execute in a dedicated follow-up session)

When a dedicated session merges `foundation-substrate-2026-04-22` → `core-triangle/main` and publishes `@mcv/intelligence-sdk` with the `./telemetry` + `./determinism` subpaths, run through these steps in `mcv-one-desktop`:

1. **Add dependency** on `@mcv/intelligence-sdk` in the root `package.json` (file: pointer or tgz pack, matching the core-triangle packaging convention of the day).
2. **Delete `src/telemetry.ts`** and **`src/determinism.ts`**.
3. **Remove the `./telemetry` + `./determinism` subpath entries** from this package's `package.json` `exports`.
4. **Rewrite the `telemetry` + `determinism` re-exports** in `src/index.ts` from:
   ```ts
   export * as telemetry from './telemetry.js';
   export * as determinism from './determinism.js';
   ```
   to:
   ```ts
   export * as telemetry from '@mcv/intelligence-sdk/telemetry';
   export * as determinism from '@mcv/intelligence-sdk/determinism';
   ```
5. **Run `npx vitest run packages/intelligence-sdk-router`** — the DTO shapes are identical by design, so tests pass as-is.
6. **Run `npm run build`** — verifies `@mcv/intelligence-sdk` subpath resolution.
7. **Commit**: `refactor(intel-router): swap local telemetry/determinism DTOs for @mcv/intelligence-sdk subpaths (foundation-substrate-2026-04-22 landed upstream)`.

The Router's public API does not change through this swap. Consumers do not need to update.

---

## Usage

```ts
import { IntelligenceRouter } from '@mcv/intelligence-sdk-router';
import { createClient } from '@supabase/supabase-js';
import { createPublisher } from '@mcv/events-sdk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const events = createPublisher({ supabase });

// Server-side embedding via the Phase-0 proxy (never raw Google key):
async function embed(text: string): Promise<number[]> {
  const res = await fetch('/api/_embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: [text], scrubPii: true }),
  });
  const data = (await res.json()) as number[][];
  return data[0];
}

const router = new IntelligenceRouter({
  supabase, events, embed,
  tenantId: '00000000-0000-0000-0000-000000000000',  // platform tenant
  ventureId: 'futurestate',
  userId: 'clerk_user_abc',
  agentHandle: 'counsel-scribe',
});

// ── Recall ──
const result = await router.recall({
  query: 'who owns the Futurestate IP?',
  layers: ['semantic', 'personal', 'long-term'],
  topK: 8,
});

// ── Observe ──
await router.observe({
  kind: 'decision',
  content: 'MTY 60/40 split with Goodmans-IP counsel letter countersigned',
  provenance: {
    source: 'draft:0d3a-…',
    correlationId: 'abcd-efgh',
    driver: 'knowledge-observer',
  },
  confidence: 1.0,
  tags: ['venture:futurestate', 'topic:ip'],
});

// ── Trace a causal chain ──
const trace = await router.trace({ correlationId: 'abcd-efgh' });

// ── Load agent personality ──
const persona = await router.personality({ agentHandle: 'counsel-scribe' });

// ── Resolve a draft's context ──
const ctx = await router.context({ artifact: { kind: 'draft', id: '0d3a-…' } });
```

---

## Tenancy model (6D-ready)

The Router's primary scope tuple is **`(tenantId, ventureId, userId, agentHandle)`** — four dimensions of who-is-asking-what. This maps directly to the forthcoming T0/T1/T2 restructure Tony has on the roadmap:

- **T0 tenant** → `tenantId` (MCV INC at the top; individual sovereign tenants below)
- **T1 venture** → `ventureId` (FutureState, BetEdge, WarForge, …)
- **T2 product / feature** → `userId` / `agentHandle` narrow to a specific actor's scope

Nothing in the Router's API changes when the restructure lands. The `set_tenant(t uuid)` RPC already scales to nested tenants: a T1 venture tenant is still just a UUID that `app.tenant_id` holds for the duration of a transaction. RLS policies on substrate tables read that single dimension — all the venture/user/agent scoping stacks on top via column filters.

Phase-1 ships **STRICT RLS on `agent_memory_longterm` from day one** (no service-role-bypass clause). Other substrates retain the bypass predicate until each handler is individually hardened — see `docs/rls-migration-status.md`.

---

## Future architecture hooks (v0.2+ — NOT Phase-1)

The Router is designed for these extensions. They are **intentionally not implemented tonight** — each is a separate marathon.

### `writeGuard` — biometric / authorized-device attestation

Tony's Jarvis-tier direction: `observe()` writes to `agent_memory_longterm` eventually require device-bound signing (secure-enclave public key, biometric attestation at write time). The Router's `observe()` path is the chokepoint where this gate lives. Planned shape:

```ts
interface WriteGuard {
  verify(args: {
    tenantId: string;
    deviceAttestation: string;  // WebAuthn / Android Keystore assertion
    intent: 'observe';
    kind: ObserveKind;
  }): Promise<{ ok: boolean; reason?: string }>;
}

new IntelligenceRouter({ ..., writeGuard: new HWAttestedGuard({ ... }) });
```

When `writeGuard` is set, every `observe()` call invokes it before the DB write. If verification fails, `observe()` throws `WriteGuardRejectedError` — caller must re-prompt the user for biometric.

### `distill` — scoped memory export for cross-venture distribution

Once the top-tier stack works on Tony's authorized devices, the Router exposes a `distill({ agentHandle, recipient_venture })` method that produces a scoped memory export for downstream consumption by other ventures. Drip-feed distillation-downstream per Tony's direction.

### `PubSubBridge` — cross-tenant federation

Per plan Phase-5.4, when MCV scales to 10+ ventures the Router's `emit()` backend swaps from Supabase realtime to Google Cloud Pub/Sub for high-fanout events. Event topics under `knowledge.*` already use the canonical envelope shape — the swap is a publisher-adapter change, not an API change.

---

## Public API reference

### Constructor

```ts
new IntelligenceRouter({
  supabase: SupabaseClient;
  events: EventPublisher;
  tenantId: string;       // required
  ventureId?: string;
  userId?: string;
  agentHandle?: string;
  embed: (text: string) => Promise<number[]>;
  cache?: RecallCache;
  telemetry?: TelemetryRecorder;
  observeRateLimit?: number;  // default 100 writes/sec/tenant
});
```

### Methods

| Method | Purpose |
|---|---|
| `recall({ query, layers?, topK?, filters? })` | Fan-out recall across 7 substrates, RRF+composite re-rank. Emits `knowledge.recall`. |
| `observe({ kind, content, provenance, confidence, tags? })` | Route write by kind. Emits `knowledge.observed`. Rate-limited per tenant. |
| `trace({ correlationId, depth? })` | Read causal chain: event_log rows + drafts for one correlation id. |
| `personality({ agentHandle })` | Load agent's personality + emotional snapshot. |
| `context({ artifact })` | Resolve draft/workflow/event refs + related memories. |
| `record({ interaction })` | Structured `naos_interactions` row write. |
| `emit({ topic, payload, correlationId? })` | Pass-through to `@mcv/events-sdk` publisher. |

### Observe routing (Plan §1.2)

| `kind` | Substrate | Table |
|---|---|---|
| `fact`, `preference`, `constraint`, `decision` | long-term | `agent_memory_longterm` |
| `chunk` | semantic | `storage_chunks` |
| `interaction` | episodic | `naos_interactions` |
| `emotional_shift`, `relationship_update` | social | `naos_emotional_state` / `naos_relationships` |
| `connection_fact` | REJECTED — oauth stays outside Router | — |
| `document` | REJECTED in Phase-1 (M6 Documentation OS owns this) | — |

### Ranker

- Reciprocal Rank Fusion with k=60 (Cormack & Clarke canonical)
- Normalized RRF component: `rrfRaw / maxObservedRrf`
- Composite: `0.5·normalizedRrf + 0.25·similarity + 0.15·recency + 0.10·confidence` (weights sum = 1)
- Recency decay half-life: 30 days (`score = 2^(-ageDays / 30)`)
- Tie-break order: composite DESC → substrate priority (`semantic > long-term > episodic > personal > social > referential > procedural`) → id

---

## Events emitted

See `packages/events-sdk/src/contracts/knowledge.ts` for full contract, including schema versions and zod payload validators.

| Topic | When |
|---|---|
| `knowledge.recall.completed` | Every `router.recall()` call (includes per-layer latencies + hit count) |
| `knowledge.memory.observed` | Every successful `router.observe()` write |
| `knowledge.backpressure.triggered` | Per-tenant observe rate limit exceeded (default 100/s) |

(Topics follow the canonical `<module>.<entity>.<action>` 3-part kebab-case
convention enforced by `assertValidTopic` in `@mcv/events-sdk`.)

---

## Related files

- **Plan:** `C:\Users\moust\.claude\plans\i-want-to-plan-synchronous-thacker.md` §1.1–1.6
- **Phase-1 plan-of-record:** `C:\Users\moust\.claude\plans\start-phase-1-of-optimized-yeti.md`
- **Migration:** `supabase/migration-intelligence-unification-2026-04-28.sql`
- **Subscriber handler:** `api/_handlers/knowledge-observer.ts`
- **Workflow integration:** `packages/workflow-sdk/src/steps/dispatch-agent.ts` (optional `intel?` context)
- **Contracts (triple-wired):** `packages/events-sdk/src/contracts/knowledge.ts` + `contracts/registry.ts` + one-line `contracts/index.ts` entry
- **RLS status:** `docs/rls-migration-status.md`
- **Phase-0 landed:** memory `project_adk_phase0_landed.md`
- **Forward-copy source:** `mcv-core-triangle/origin/foundation-substrate-2026-04-22 @ c532c7d`

---

**Phase-1 of Gemini Enterprise Agent Platform integration. Jarvis for the entire MCV universe.**
