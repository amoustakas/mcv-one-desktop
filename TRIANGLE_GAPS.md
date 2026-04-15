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

### Wire-format mismatch between local `@mcv/core-triangle` and real Triangle SDKs
**Observation.** The local `packages/core-triangle/src/*.ts` clients were
written speculatively before the real Triangle services shipped. The local
clients call paths like `/v1/chat/stream`, `/v1/events/publish`,
`/v1/session`. The real SDKs in
`mcv-core-triangle/packages/{identity,fabric,intelligence}-sdk/src/`
expose differently-shaped methods (e.g. `chatStream(req)` returns an
async generator of `{id, delta, finishReason?, model}` chunks; Fabric
`publishEvent({topic,type,source,...})` rather than `publish({topic,
payload, ...})`).

**Status.** Both implementations are real, but they don't speak the same
wire protocol.

**Wired here.** We use the local `@mcv/core-triangle` shape exclusively.
Verification step 5 (chat works end-to-end) WILL FAIL until either:
  (a) the Triangle services adopt the local client's URL/shape, OR
  (b) we rewrite `packages/core-triangle/src/*.ts` to match the real
      SDK shape (much larger PR).

**Recommendation.** Option (b) is the right long-term path. File a
follow-up issue: "Align `@mcv/core-triangle` HTTP client with the real
Triangle SDK wire format." Block on it before deploying to anything
beyond local-dev.

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
