# Intelligence Gateway — Production-Grade AI Routing

**Location:** `mcv-core-triangle/packages/intelligence/src/gateway/`
**SDK contract:** `@mcv/intelligence-sdk` subpaths `/public`, `/telemetry`, `/determinism`
**Shipped:** Marathon 5 P1.B Phase B (2026-04-22, branch `foundation-substrate-2026-04-22`)

---

## Purpose

Unified composition entrypoint wrapping `CompletionService` with three production-grade cross-cutting concerns:

1. **Telemetry** — every request emits an OpenTelemetry-compatible span with GenAI semantic-convention attributes.
2. **Deterministic replay** — fingerprint-hashed request identity enables byte-exact response replay for CI, audit, debugging, and cross-repo sim.
3. **Error envelope** — uncaught errors are recorded on the span before being re-thrown, so telemetry stays consistent even on failure paths.

The gateway is the canonical entrypoint. HTTP handlers, gRPC handlers, and (eventually) agent runtime callers route through `getGateway().complete()` / `.stream()` rather than invoking `CompletionService` directly.

---

## Request composition flow

```
GatewayCompletionRequest
        │
        ▼
┌──────────────────────────┐
│ IntelligenceGateway      │
│                          │
│ 1. openSpan() ───────────┼──► TelemetryRecorder
│                          │    (OTel-compatible SpanHandle)
│                          │
│ 2. fingerprint(req)      │
│                          │
│ 3. if replayMode:        │
│      store.get(fp) ──────┼──► hit ──► short-circuit return
│                          │                   │
│                          │    miss ──────────┘
│                          │
│ 4. completionService     │
│      .complete(req, ctx) ┼──► provider routing + failover
│                          │    budget + guardrails + usage
│                          │
│ 5. if replayMode:        │
│      store.set(fp, resp) │
│                          │
│ 6. annotate span         │
│                          │
│ 7. span.end()            │
└──────────────────────────┘
        │
        ▼
    CompletionResponse
```

Streaming (`gateway.stream()`) follows the same shape but skips step 3 — first chunk arrives before fingerprint lookup completes; per-chunk replay is a bigger contract change deferred to a later phase.

---

## Span attributes (OTel GenAI semantic-convention)

| Attribute | Value |
|---|---|
| `gen_ai.system` | Provider name (anthropic / openai / vertex / ...) |
| `gen_ai.request.model` | Model ID on request |
| `gen_ai.response.model` | Actual model used (post-failover) |
| `gen_ai.response.provider` | Actual provider used (streaming only) |
| `gen_ai.response.finish_reason` | stop / length / tool_use / max_tokens / error |
| `gen_ai.usage.input_tokens` | Prompt tokens |
| `gen_ai.usage.output_tokens` | Completion tokens |
| `gen_ai.usage.total_tokens` | Sum |
| `mcv.venture_id` | Scoping tenant |
| `mcv.user_id` | Caller (optional) |
| `mcv.correlation_id` | Cross-service trace correlation |
| `mcv.agent_run_id` | Agent-run attribution (optional) |
| `mcv.fingerprint` | Request fingerprint (SHA-256 hex) |
| `mcv.replay_mode` | Boolean — was replay active |
| `mcv.replay.hit` | Boolean — was response served from replay store |
| `mcv.cost_microcents` | Streaming only — total cost in microcents |
| `mcv.stream.chunk_count` | Streaming only — chunks yielded |

Span events: `replay.hit`, `replay.miss`, `replay.stored`, `stream.start`, `stream.end`, `exception`.

---

## Replay mode

**Env gate:** `INTELLIGENCE_MODE=replay`

**How it works:**
1. Request → `RequestFingerprinter.fingerprint()` produces a stable SHA-256 over `(model, messages, temperature, maxTokens, tools, ventureId)`.
2. If `replayMode` active: `DeterministicReplayStore.get(fp)` checked BEFORE provider call. Hit short-circuits; miss falls through + stores response on success.
3. Storage is in-memory LRU by default (bounded 1000 entries, LRU-touch on `get`). Custom backends (Redis, Postgres) implement the `DeterministicReplayStore` interface from `@mcv/intelligence-sdk/determinism`.

**Fingerprint stability guarantees:**
- Identical inputs → identical hash across machines, node versions, process restarts.
- Tool description edits → same hash (non-identity change).
- Tool schema shape changes → different hash (identity change, recursive through `properties` + `items` + `required`).
- `undefined` optional fields → normalize to `null` before hashing (stable).

**Use cases:**
- **CI:** identical inputs must produce identical outputs for assertions.
- **Audit:** regulators re-run historical decisions bit-exact.
- **Debugging:** reproduce production issues without hitting providers.
- **Sim-mode:** cross-repo sim-dry-run exercises intelligence offline.

---

## Consumer integration (Futurestate M15)

Futurestate's `apps/investor/src/app/api/chat/route.ts` today calls Anthropic directly via `@ai-sdk/anthropic@3.0.66`. The M15 migration path:

1. **Phase M15.1** — Install `@mcv/intelligence-sdk` as a workspace dep in Futurestate's `@futurestate/mcv-sdk`.
2. **Phase M15.2** — Create `@futurestate/mcv-sdk/intelligence` subpath that exports a thin client wrapping `@mcv/core-triangle`'s HTTP intelligence client with Futurestate-specific context injection (user tier, RAG docs, tool registry).
3. **Phase M15.3** — Replace `streamText({ model: anthropic(...) })` in chat/route.ts with the mcv-sdk client call. Gateway routing + telemetry + replay + cost attribution come free.

The `@mcv/intelligence-sdk/telemetry` + `/determinism` subpaths give Futurestate's test harness the DTOs to type-check against without pulling the gateway runtime.

---

## Components

| File | Purpose |
|---|---|
| [mcv-core-triangle/packages/intelligence/src/gateway/gateway.ts](../../../mcv-core-triangle/packages/intelligence/src/gateway/gateway.ts) | IntelligenceGateway composition class |
| [mcv-core-triangle/packages/intelligence/src/gateway/determinism.ts](../../../mcv-core-triangle/packages/intelligence/src/gateway/determinism.ts) | RequestFingerprinter + DeterministicReplayStore + InMemoryReplayStore |
| [mcv-core-triangle/packages/intelligence/src/observability/telemetry.ts](../../../mcv-core-triangle/packages/intelligence/src/observability/telemetry.ts) | TelemetryRecorder interface + Console / InMemory impls |
| [mcv-core-triangle/packages/intelligence-sdk/src/telemetry/](../../../mcv-core-triangle/packages/intelligence-sdk/src/telemetry/) | Public DTO contract for consumer integration |
| [mcv-core-triangle/packages/intelligence-sdk/src/determinism/](../../../mcv-core-triangle/packages/intelligence-sdk/src/determinism/) | Replay store contract + env-gate constants |

---

## Deferred (explicit follow-ups)

1. **Actual OTel SDK wire-up** — the span shape is already OTel-compatible; integrating `@opentelemetry/sdk-trace-node` + an exporter is mechanical.
2. **Prompt caching hook point** — the gateway is the natural place to add Anthropic `cache_control` injection; defer until the caching strategy is venture-specific.
3. **Streaming replay** — requires per-chunk fingerprint records and ordered delta replay; bigger contract change.
4. **Multi-tenant quotas beyond venture** — user/api-key granularity layered on top of the existing `BudgetService`.
5. **Response quality scoring / A/B harness** — independent agents can evaluate responses against golden fixtures.
6. **Idempotency keys** — gateway-level dedupe for client-side retry safety.

---

## Test coverage

- `packages/intelligence/src/gateway/__tests__/gateway.test.ts` — 9 tests (pass-through, telemetry shape, replay hit/miss/stored, field isolation, error capture, trace/span parentage, fingerprinter injection, streaming)
- `packages/intelligence/src/gateway/__tests__/determinism.test.ts` — 18 tests (hash stability, per-field sensitivity, tool shape vs description, nested schema, LRU, env gate, singletons)
- `packages/intelligence/src/observability/__tests__/telemetry.test.ts` — 12 tests (span duration, trace propagation, error capture, idempotent end, post-end mutation freeze, name filtering, capacity, reset, recorder swap)

**Total: 39 new tests, 365 @mcv/intelligence tests green.**
