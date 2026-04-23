# MCV Intelligence SDK — Desktop Client Integration

> **Status**: Phase 0 pointer. Desktop client implementation lands in Phase C.
> **Date**: 2026-04-23
> **Master plan**: `C:\Users\moust\.claude\plans\we-are-extracting-all-wondrous-quasar.md`

## Purpose

mcv-one-desktop is the **Tier 3 / Tier 0 dual-surface** consumer of the MCV Intelligence Engine. This document tells the desktop where to find the engine, how to consume it, and what to stop doing locally.

## Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  mcv-core-triangle (SDK hub)                                    │
│    packages/intelligence/ → dist-sdks/mcv-intelligence-sdk-*.tgz │
└───────────────────────────┬─────────────────────────────────────┘
                            │ tarball install
                ┌───────────┴────────────┐
                │                        │
  ┌─────────────▼──────────┐   ┌─────────▼────────────────────┐
  │ mcv-one-admin-prototype│   │ mcv-one-desktop (this repo)   │
  │   @mcv/intelligence    │   │   src/lib/intelligence/client │
  │   Super Admin UI       │   │   NAOSChat + PromptBankView   │
  │   (Tier 0 authoring)   │   │   (desktop consumer)          │
  └────────────────────────┘   └───────────────────────────────┘
```

Both repos install the Triangle SDK via the tarball path documented in `mcv-one-admin-prototype/docs/TRIANGLE-SDK-INSTALL.md`.

## What the Desktop Should Stop Doing

| Current pattern | Replacement |
|-----------------|-------------|
| Hardcoded venture system prompts in `src/lib/ventures.ts` | Fetch via `intelligence.prompts.get({ name: 'naos.venture.<ventureId>.system', version: 'latest' })` |
| Inline Anthropic API calls in `src/lib/claude.ts` (for NAOS system prompt resolution) | Still call Claude directly for chat, but bootstrap the system prompt from the engine |
| Builtin kit tool schemas hardcoded in `src/lib/kits/builtin/` | Pull `intelligence.kits.list` + hydrate schemas at runtime (Phase C) |
| Ad-hoc JSON parsing of AI tool responses in `src/lib/kits/orchestrator.ts` | Route through SDK `wrapValidated`-backed procedures |

## What the Desktop Should Start Doing

### 1. Install the SDK (Phase C Step C.7)

```bash
cd c:/Users/moust/mcv-one-desktop
pnpm add @mcv/intelligence-sdk@"file:../Documents/GitHub/mcv-core-triangle/dist-sdks/mcv-intelligence-sdk-<version>.tgz"
```

Pin the exact version in `package.json` just like `apps/admin` does. Re-run when triangle publishes a new tarball.

### 2. Add the client (Phase C Step C.8)

New file: `src/lib/intelligence/client.ts`

```ts
import { createIntelligenceClient } from "@mcv/intelligence-sdk";

const baseUrl = import.meta.env.VITE_INTELLIGENCE_GRPC_URL
  ?? import.meta.env.VITE_ADMIN_API_URL
  ?? "https://admin.mcv.one";

export const intelligenceClient = createIntelligenceClient({
  baseUrl,
  // Browser-side: use short-lived JWT from Clerk session
  getToken: async () => {
    const session = await window.Clerk?.session;
    return session?.getToken?.() ?? null;
  },
});
```

### 3. Wire NAOSChat (Phase C Step C.9)

Replace the local prompt map in `src/lib/ventures.ts` with a bootstrap call:

```ts
import { intelligenceClient } from "@/lib/intelligence/client";

export async function loadVenturePrompt(ventureId: string): Promise<string> {
  try {
    const prompt = await intelligenceClient.prompts.get({
      name: `naos.venture.${ventureId}.system`,
      version: "latest",
    });
    return prompt.rendered; // template vars materialized server-side
  } catch (err) {
    if (import.meta.env.VITE_INTELLIGENCE_REQUIRED === "false") {
      return LOCAL_FALLBACK_PROMPTS[ventureId] ?? LOCAL_FALLBACK_PROMPTS.mcv;
    }
    throw err;
  }
}
```

### 4. PromptBankView panel (Phase C Step C.10)

Read-only browse of the prompt bank inside the desktop. Powered by `intelligenceClient.prompts.list({ ventureId })`.

### 5. Orchestrator tool loading (Phase C Step C.11)

In `src/lib/kits/orchestrator.ts`, replace the static import of `src/lib/kits/builtin/*` with a runtime call to `intelligenceClient.kits.list({ ventureId })` and map returned tool schemas through the existing sandbox.

## Deprecation: `docs/google-ai-studio-apps/`

This desktop currently holds a **partial mirror** of Google AI Studio apps at `docs/google-ai-studio-apps/` (audio-orb, chatterbots, mediasim, infogenius, product-mockup-visualization, etc. — ~12 projects, with matching `.zip` archives).

That mirror is **superseded** by the canonical 114-project inventory:
- Canonical raw source: `C:\Users\moust\mcv-gg\aistudio-exports`
- Canonical inventory doc: `mcv-one-admin-prototype/docs/specs/v2/AI-STUDIO-INVENTORY.md`
- Canonical storage destination: `@mcv/intelligence/media` (Blob + `media_kits` / `interactive_kits` tables)

**Action**: once Phase A seeding completes and the admin Kit Catalog surface is live (Phase C Step C.4), delete the local mirror (`rm -rf docs/google-ai-studio-apps/`) to avoid drift. Until then, keep the mirror as a quick-reference artifact but do not add new projects to it.

## Environment Variables Added (Phase C)

| Name | Purpose | Example |
|------|---------|---------|
| `VITE_INTELLIGENCE_GRPC_URL` | gRPC endpoint for Triangle intelligence SDK (optional) | `https://grpc.mcv.one:443` |
| `VITE_ADMIN_API_URL` | tRPC endpoint on admin for prompt/kit/approval CRUD | `https://admin.mcv.one` |
| `VITE_INTELLIGENCE_REQUIRED` | If `false`, allow local prompt fallback on SDK failure (dev only) | `true` |

## Failure Isolation

If the desktop loses connectivity to admin:
1. Cached prompts persist via existing `@mcv/rag-sdk` chunk cache (memory).
2. If no cache entry, surface a clear error banner in NAOSChat: "NAOS Intelligence unreachable — using last known configuration."
3. Do NOT silently substitute local strings unless `VITE_INTELLIGENCE_REQUIRED=false`.

## Related Docs

- Master plan: `C:\Users\moust\.claude\plans\we-are-extracting-all-wondrous-quasar.md`
- Architecture canon: `mcv-one-admin-prototype/docs/specs/v2/00-MASTER-ARCHITECTURE.md`
- AI Studio inventory: `mcv-one-admin-prototype/docs/specs/v2/AI-STUDIO-INVENTORY.md`
- Intelligence quartet: `mcv-one-admin-prototype/docs/specs/v2/05-intelligence/01..04-*.md`
- Triangle SDK install: `mcv-one-admin-prototype/docs/TRIANGLE-SDK-INSTALL.md`
- Existing desktop Kits: `src/lib/kits/orchestrator.ts`, `src/lib/kits/builtin/`
- Foundation OS context: project memory `[Foundation OS v1 (Phase 1 done)](../memory/project_foundation_os.md)`
