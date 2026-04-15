# MCV Core Triangle Integration — mcv-one-desktop

This repo is now wired to the **MCV Core Triangle** (Identity / Fabric /
Intelligence) with a strict graceful-fallback contract: the app always boots
and chats even if no Triangle service is reachable.

## Canonical docs (sibling repo)

The authoritative docs live in the sibling Triangle repo:

```
C:\Users\moust\Documents\GitHub\mcv-core-triangle\docs\integration\
├── README.md
├── ventures\mcv-one-desktop.md     ← this venture's playbook
├── auth-migration.md
├── intelligence-gateway.md
├── fabric-events.md
└── local-dev.md                    ← how to boot Identity/Fabric/Intelligence locally
```

When the playbook in `ventures\mcv-one-desktop.md` is updated, re-read it
and update this file.

## Venture checklist

- [x] **Step 1 — Install Triangle SDKs.** The local workspace package
      `@mcv/core-triangle` (in `packages/core-triangle/`) is the integration
      layer. The separate `@mcv/identity-sdk` / `@mcv/fabric-sdk` /
      `@mcv/intelligence-sdk` packages from the sibling repo are NOT
      installed — they have `workspace:*` deps incompatible with this
      repo's npm/yarn-workspace topology. See `TRIANGLE_GAPS.md`.
- [x] **Step 2 — Swap mock clients to real SDK imports.** `src/lib/mcv-core/`
      is split into `identity.ts` / `fabric.ts` / `intelligence.ts`. Each
      provides a `createServer*()` factory that reads `*_URL` from
      `process.env`. Browser code keeps using `useCoreTriangle()`.
- [x] **Step 3 — Clerk → Identity token exchange.** Wired in
      `src/lib/mcv-core/identity-token.ts`. Endpoint missing on Identity
      (`/auth/exchange` is a stub) — call site catches 404, logs once,
      falls back to Clerk-only. See `TRIANGLE_GAPS.md`.
- [x] **Step 4 — Route `streamMessage` through Intelligence.**
      `api/_handlers/chat.ts` checks `INTELLIGENCE_URL` and routes via
      `IntelligenceClient.chatStream({ provider: 'anthropic', ... })`.
      `src/lib/claude.ts`'s public API is preserved verbatim — no client
      changes were needed.
- [x] **Step 5 — Route Gemini through Intelligence.**
      `api/_handlers/gemini.ts` routes via `provider: 'google'` when
      configured. Imagen, Veo, Gemini Live, Deepgram, ElevenLabs, Vapi
      stay direct (latency / media-gen scope). See `src/lib/README.md`.
- [x] **Step 6 — Selective EventEmitter3 → Fabric migration.** Voice
      EventEmitter3 stays. New audit events (chat.sent, chat.completed,
      chat.failed) publish via `createServerFabric()` in chat.ts;
      browser components use `useFabricAudit()` from
      `src/hooks/use-fabric-audit.ts`.
- [x] **Step 7 — RAG flag.** `chat` body now accepts `useRag` and
      `ragCorpora` which pass through to Intelligence's RAG fan-out.

## Current env-var status

| Var | Plumbed in | Status |
|---|---|---|
| `VITE_MCV_CORE_IDENTITY_URL` | `src/hooks/use-core-triangle.ts` | declared, optional |
| `VITE_MCV_CORE_FABRIC_URL` | `src/hooks/use-core-triangle.ts` | declared, optional |
| `VITE_MCV_CORE_INTELLIGENCE_URL` | `src/hooks/use-core-triangle.ts` | declared, optional |
| `IDENTITY_URL` | `src/lib/mcv-core/identity.ts` (server) | declared, optional |
| `FABRIC_URL` | `src/lib/mcv-core/fabric.ts` (server) | declared, optional |
| `INTELLIGENCE_URL` | `src/lib/mcv-core/intelligence.ts` (server) | declared, optional |
| `INTERNAL_SERVICE_SECRET` | All three `createServer*()` factories | declared, optional |

When unset, every consumer falls back to the existing direct path
(Clerk + Supabase + Anthropic SDK + Google GenAI SDK).

## Migrated call sites

| Site | Surface | Triangle service |
|---|---|---|
| `api/_handlers/chat.ts` | Claude streaming + non-streaming + tool-use | Intelligence |
| `api/_handlers/gemini.ts` | Gemini chat | Intelligence |
| `api/_handlers/chat.ts` | chat.sent / chat.completed / chat.failed audit | Fabric |
| `src/hooks/use-fabric-audit.ts` | browser audit hook | Fabric |
| `src/hooks/use-core-triangle.ts` | health polling, session, RBAC | Identity / Fabric / Intelligence |

## Clerk + Identity dual-stack strategy

We deliberately **did not rip out Clerk**. The dual-stack split:

- **Clerk owns the front door**: social login, email/password UX, magic links,
  MFA UI, session cookies. Clerk's React components and JWT verification
  (`@clerk/backend.verifyToken`) stay the auth surface in handlers.
- **Identity owns the back office**: venture-scoped JWTs, RBAC checks
  (`identity.can()`), tenant membership, audit linkage. When Identity is
  reachable, we exchange the Clerk JWT for an Identity token via
  `/auth/exchange` (when it ships) and use the Identity token for
  Triangle-internal calls.
- **Bridge**: `src/lib/mcv-core/identity-token.ts` does the exchange + caches
  + refreshes 60s before expiry. Currently a no-op because the endpoint is
  missing (see `TRIANGLE_GAPS.md`); flipping the gap requires zero
  app-side changes.

This means we get Clerk's polished UX **and** Triangle's centralized RBAC
without forcing the user through a second login.

## NAOS stays local — by design

The Phase-3 Intelligence agent runtime (`agentInvoke`) is stateless,
single-turn, and provider-agnostic. NAOS in this repo is a **kit-aware,
venture-context-switching, session-persistent** runtime with a rich
emotional/momentum state and tool dispatch through the Kit Orchestrator.

Migrating NAOS onto `Intelligence.agentInvoke` would lose:
- Persistent session state (Supabase `naos_sessions` / `naos_emotional_state`)
- Kit-driven tool registry and sandbox isolation
- Multi-turn agent memory across venture switches
- Inline NAOS interaction logging (`naos_interactions`, `naos_agents.interaction_count`)

We **do** route NAOS's underlying chat completions through Intelligence
(via `chat.ts`) so cost tracking and provider failover apply uniformly.
The runtime above stays here.

If a future Intelligence release ships streaming agents with session state
and pluggable tool registries, revisit this.

## Verification

See the verification block at the bottom of `ventures/mcv-one-desktop.md`
and the project `inherited-coalescing-codd.md` plan file. Quick smoke:

```bash
# 1. Boot Triangle (in sibling repo)
cd C:/Users/moust/Documents/GitHub/mcv-core-triangle
pnpm dev   # or per local-dev.md

# 2. Configure this repo's .env.local
echo 'IDENTITY_URL=http://localhost:7001'   >> .env.local
echo 'FABRIC_URL=http://localhost:7002'     >> .env.local
echo 'INTELLIGENCE_URL=http://localhost:7003' >> .env.local
echo 'INTERNAL_SERVICE_SECRET=devsecret'    >> .env.local
echo 'VITE_MCV_CORE_IDENTITY_URL=http://localhost:7001'   >> .env.local
echo 'VITE_MCV_CORE_FABRIC_URL=http://localhost:7002'     >> .env.local
echo 'VITE_MCV_CORE_INTELLIGENCE_URL=http://localhost:7003' >> .env.local

# 3. Boot
npm run dev:local

# 4. Send a chat in AegisChat. Expect token-by-token streaming.

# 5. Verify audit landed in Fabric
curl 'http://localhost:7002/v1/audit?action=chat.sent&ventureId=mcv'

# 6. Verify cost was tracked (Intelligence Postgres)
psql $INTELLIGENCE_DB -c "SELECT provider,model,total_tokens,cost_microcents \
  FROM intelligence_usage WHERE venture_id='mcv' \
  ORDER BY created_at DESC LIMIT 5;"

# 7. Stop Triangle services. App should keep working — chat falls back
#    to direct Anthropic SDK; health pill flips to 'offline'.
```
