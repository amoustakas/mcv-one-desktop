# Triangle Gaps — endpoints / methods this venture needs

Discovered while wiring `mcv-one-desktop` to the Triangle. Each item is
something we **wired the call site for** so the app is ready to consume it
the moment Triangle ships the corresponding piece — no app-side changes
required when filling these gaps.

Triangle repo: `C:\Users\moust\Documents\GitHub\mcv-core-triangle`

---

## P0 — auth blockers

### `POST /auth/exchange` on Identity
**Need.** Exchange a Clerk JWT for an MCV Identity-issued token (RS256,
`iss='mcv-identity'`, scoped to the active venture). Return shape:
```json
{ "accessToken": "...", "expiresAt": 1764000000000, "ventureId": "mcv" }
```
**Status.** Not implemented. Confirmed in
`docs/integration/auth-migration.md` ("Workaround: manual user
provisioning") and by reading `packages/identity/src/handlers/`.

**Wired here.** `src/lib/mcv-core/identity-token.ts:exchangeClerkToken()`
catches the 404, logs once, returns null. Caller falls back to
Clerk-only mode.

**Unblocks.** Server-side Identity calls with venture-scoped tokens
(currently we use `INTERNAL_SERVICE_SECRET` for S2S, which works but
loses per-user RBAC).

---

### `POST /internal/users` on Identity
**Need.** Bulk user provisioning for venture-tenant migrations. Accept
an array of `{ externalId, email, displayName, ventureMemberships }`.

**Status.** Not implemented (also flagged in `auth-migration.md`).

**Wired here.** Not yet — would be needed when we bulk-import
existing Clerk users into Identity. Currently no migration code path.

---

## P1 — Intelligence shape mismatches

### ~~Wire-format mismatch~~ RESOLVED (2026-04-15)
**Status.** Closed. `packages/core-triangle/src/{http,identity,fabric,intelligence}.ts`
were rewritten to speak the real Triangle HTTP contract:
  - Intelligence: `POST /chat`, `POST /chat/stream` (SSE: `event: chunk|done`,
    `data: {id,delta,model,finishReason?}`, terminal `data: [DONE]`),
    `POST /rag/query`, `GET /health`.
  - Fabric: `POST /events` (shape `{topic,type,source,ventureId,data,correlationId?,metadata?}`),
    `POST /audit`, `GET /audit`, `GET /health`.
  - Identity: `GET /users/me`, `GET /ventures`, `GET /health`.
  - `coreHttp` now unwraps the universal `{data: ...}` success envelope.

Public method surface on the local clients (`chat`, `chatStream`, `publish`,
`audit`, `session`, `tenants`) is preserved — consumers (the hook, chat.ts
handler, useFabricAudit) continue to compile without changes. See
`mcv-one-desktop` commit: `refactor(core-triangle): align wire format...`.

**Sub-gaps discovered during alignment (see below).**

---

### `@mcv/identity-sdk` / `@mcv/fabric-sdk` / `@mcv/intelligence-sdk` not installable here
**Need.** The playbook says `pnpm add @mcv/identity-sdk @mcv/fabric-sdk
@mcv/intelligence-sdk`. These packages exist at
`mcv-core-triangle/packages/{identity,fabric,intelligence}-sdk/` but
their `dependencies` use the pnpm `workspace:*` protocol for
`@mcv/kernel`. This monorepo (`mcv-one-desktop`) uses npm + yarn
workspaces, has no `@mcv/kernel` workspace, and cannot resolve
`workspace:*`.

**Status.** `npm add file:../mcv-core-triangle/packages/identity-sdk`
would fail at install time on the unresolvable transitive dep.

**Wired here.** We use the local `@mcv/core-triangle` workspace package
as the integration layer (it doesn't have a kernel dep). Once the real
SDKs are published to a private registry (Verdaccio / GitHub Packages /
npm scoped registry), swap to direct imports.

**Recommendation.** Publish the SDKs from the Triangle CI to a private
registry, then replace the local `@mcv/core-triangle` shim with thin
wrappers around the real SDKs. The internal API surface
(`createServerIntelligence`, `useCoreTriangle`, etc) stays unchanged.

---

### Streaming `agentInvoke` on Intelligence
**Need.** Long-running agent runs that stream intermediate steps
(tool decisions, partial outputs) over SSE. The current `agentInvoke`
is blocking and returns `{ runId, status, finalMessage }`.

**Status.** Not implemented (per intelligence-gateway.md SDK source).

**Wired here.** Not yet — NAOS agent runtime stays local for now,
partly because of this gap. Documented in `MCV_INTEGRATION.md`.

---

### SSE stream omits usage + toolCalls mid-flight
**Observation.** The real Intelligence `/chat/stream` SSE protocol emits
only `{id, delta, model, finishReason?}` per chunk and terminates with
`[DONE]`. There is no final `{response: ChatResponse}` envelope carrying
token counts, cost, or `tool_use` blocks.

**Wired here.** `chatStream()` synthesizes a `ChatResponse` by accumulating
deltas + reading `finishReason` from the last chunk; `usage` is zeroed
and `toolCalls` is omitted on the streaming path. Non-streaming `/chat`
still returns full usage + toolCalls in `metadata`.

**Impact.** Per-stream cost auditing in `chat.ts` (`publishChatAudit` for
`chat.completed` via Intelligence) will record `inputTokens: 0,
outputTokens: 0, costUsd: 0`. Non-streaming is accurate. Flag for the
Triangle team: consider adding a final SSE `event: summary` chunk that
carries `{usage, toolCalls, metadata}`.

### Embeddings endpoint not public
**Need.** The legacy `Intelligence.embed({texts, taskType})` maps to
Google `text-embedding-004` (what MCV Desktop's RAG uses). Real
Intelligence SDK has no public embeddings method.

**Wired here.** `embed()` returns `CoreNotAvailableError`. MCV Desktop
continues to call Google's embedding SDK directly via `api/_handlers/_embeddings.ts`.

### Fabric Jobs surface absent from public SDK
**Observation.** `enqueueJob`/`getJob`/`getJobStats` exist on the Fabric
internal SDK surface but aren't part of the public HTTP SDK contract the
local client aligns to.

**Wired here.** `enqueue()` returns `CoreNotAvailableError`. No caller in
mcv-one-desktop currently uses jobs.

### Fabric storage contract divergence
**Observation.** Legacy local client had `storagePut(bucket, key,
bodyBase64)` and `storageGetUrl(bucket, key)`. Real Fabric SDK has
`uploadFile`, `getSignedUrl`, `deleteFile`, `listFiles` — different
shape (buckets are fixed enum: avatars/documents/exports/assets/uploads),
different auth model (presigned upload).

**Wired here.** `storagePut` / `storageGetUrl` return `CoreNotAvailableError`.
MCV Desktop's current storage writes go through Supabase + S3 directly;
migration to Fabric storage is a future task.

### Identity RBAC `can()` not exposed publicly
**Observation.** RBAC check exists only on the Identity internal gRPC
client (`checkPermission`). Public HTTP SDK has no `/rbac/check` route.

**Wired here.** `can()` returns `CoreNotAvailableError`. Callers should
fall back to client-side role checks by reading `session().roles` and
`session().tenants`. Low impact: only a convenience wrapper
(`canOrFallback`) was using it.

## P2 — Fabric / observability

### Audit query response shape
**Observation.** The local `@mcv/core-triangle` Fabric client doesn't
expose an `audit query` method (only `audit write` and `events publish`).
The real Fabric SDK has `queryAudit({ventureId, action, from, to})`.

**Wired here.** Server-side audit publishing works (chat events land);
we don't yet have a UI that queries them back. Will need the query
method when we build the audit log viewer.

---

### Bidirectional realtime stream over Fabric
**Need.** Fabric `subscribe()` is implemented locally as SSE consume,
but server-side bidirectional WebSocket-style streaming for things like
collaborative cursors / live presence isn't part of the Fabric v1 surface.

**Status.** Currently NOT a blocker — voice EventEmitter3 + direct
Deepgram/Gemini Live cover live audio. Flag for when we build cursor
collaboration in Aegis.

---

## P3 — operational nice-to-haves

- **Email service stubbed.** Magic-link send is a no-op stub in
  `packages/identity`. Caller would need SendGrid/Postmark integration
  before Identity can replace Clerk magic-links.
- **Google OAuth + Solana/Ethereum signature handlers** in
  `packages/identity/src/handlers/auth.handler.ts` and
  `wallet.handler.ts` are stubs — verification logic is incomplete.
- **`vercel.json` not configured** for Triangle env-var injection.
  When deploying to Vercel, set the Triangle URLs via Vercel env vars
  (manual or via `vercel env`); no project-level config needed.
