# Factory Supervisor Integration — mcv-one-desktop Handoff

**Date:** 2026-04-17
**Source:** Factory session (`c:\Users\moust\mcv`) Marathon #1 — Cognitive Kernel (Stride 1 of Hive Cognition Push)
**Factory-side brief:** `C:\Users\moust\.claude\plans\marathon-1-cognitive-kernel-2026-04-17.md`
**Factory extraction notes:** `c:\Users\moust\mcv\docs\extraction-notes-2026-04-17.md`
**Factory base plan:** `C:\Users\moust\.claude\plans\hive-cognition-push-2026-04-17.md`

This spec is **self-contained** — a mcv-one-desktop Claude Code session can execute it without referencing the Factory repo or Factory session context. All type shapes, API contracts, and file targets are embedded below.

---

## Why this spec exists

The Factory session built the Cognitive Kernel (supervisor, worker registry, kit loader, SPARC discipline, Memory Trinity) in `c:\Users\moust\mcv`. It intentionally **did not** build the cockpit-side UI because:
1. Parallel Claude Code + Gemini sessions are actively working in `mcv-one-desktop` on Factory-adjacent surfaces (`api/_handlers/factory.ts`, `src/lib/factory-client.ts`, `src/hooks/use-factory.ts`, `src/components/factory/`, `src/views/FactoryConsoleView.tsx`).
2. Existing kits-sdk at `src/lib/kits/` (10 files: loader, registry-client, orchestrator, sandbox, bridge, permissions, notifications, shared-context, types, tests) must be respected.
3. `src/views/CreativeCanvasView.tsx` already exists — collision with the new `CreativeStudioView` needs local resolution.

**This session owns all cockpit-side execution** for the Cognitive Kernel integration, coordinating its own lane-splits with any parallel work.

---

## Factory-side endpoints this session consumes

Once the Factory Marathon #1 ships, the Factory runtime exposes these NEW endpoints on `:7004` (all routed through the existing `api/_handlers/factory.ts` proxy pattern):

### Supervisor
- `POST /plan/:planId/run` — execute a kit-driven plan. Body: `{ kitId, objective, personaContext }`. Response: SSE stream of `WorkflowStepData` events + final `SupervisorRun` record.
- `GET /supervisor-runs` — list recent runs. Query: `?limit=50&status=completed`.
- `GET /supervisor-runs/:runId` — single run detail with full plan + worker outcomes.

### Kits
- `POST /kits/invoke` — invoke a kit one-shot. Body: `{ slug, input, personaContext }`. Response: `{ runId, output }`.
- `GET /kits` — list kits. Query: `?tag=oracle&stakes=low`.
- `GET /kits/:slug` — single kit manifest.

### Memory Trinity (query-only from cockpit)
- `GET /memory/private/:personaId?kind=...&limit=50` — tier-1 ledger for a persona
- `GET /memory/tenancy?persona_id=...&venture_id=...&crown=...&dimension=...` — tier-2 tenancy slice
- `GET /memory/hive?kind=...&tags=...` — tier-3 collective (anonymized)

All endpoints honor existing `X-MCV-Persona-*` headers (see `mcv/src/lib/tenancy.ts` — 6D tenancy model).

---

## Shared type shapes

These land in `src/lib/factory-client.ts` as extensions. Copy verbatim:

```ts
// Supervisor/plan
export type StepStatus = "running" | "success" | "error" | "suspended" | "cancelled" | "skipped";

export type WorkflowStep =
  | { type: "func";          id: string; workerName?: string }
  | { type: "parallel-all";  id: string; steps: WorkflowStep[] }
  | { type: "parallel-race"; id: string; steps: WorkflowStep[] }
  | { type: "branch";        id: string; condition: string; then: WorkflowStep; else?: WorkflowStep }
  | { type: "foreach";       id: string; itemsKey: string; step: WorkflowStep }
  | { type: "loop";          id: string; conditionKey: string; steps: WorkflowStep[] }
  | { type: "agent";         id: string; workerName: string }
  | { type: "guardrail";     id: string; validatorKey: string };

export interface WorkflowStepData {
  id: string;
  status: StepStatus;
  startAt: string;       // ISO timestamp
  endAt?: string;
  input?: unknown;
  output?: unknown;
  error?: { message: string; code?: string };
  workerName?: string;
  correlationId: string;
}

export interface SupervisorRun {
  runId: string;
  kitId: string;
  objective: string;
  personaContext: PersonaContext;
  plan: WorkflowStep;                        // root step (usually parallel-all or sequential)
  workerOutcomes: WorkflowStepData[];
  status: "planning" | "executing" | "completed" | "failed" | "aborted";
  totalCostUsd?: number;
  correlationId: string;
  startedAt: string;
  completedAt?: string;
}

// Kit manifest
export interface McvKitManifest {
  schema: "mcvkit/1.0";
  slug: string;
  version: string;                           // semver
  title: string;
  summary: string;
  discipline: "sparc" | "react" | "reducer" | "oneshot";
  personaId?: string;                        // FK -> agent_persona
  model: {
    router: "gemini" | "lmstudio" | "ollama" | "claude" | "openai";
    id: string;
    params?: Record<string, unknown>;
  };
  systemPrompt: string;
  toolAllowlist: string[];
  stakes: "low" | "medium" | "high" | "critical";
  extends?: string[];                        // parent kit slugs for composition
  tags: string[];
  pinnedVersion?: string;
}

// Persona context (matches existing mcv/src/lib/tenancy.ts)
export interface PersonaContext {
  personaId?: string;
  ventureId?: string;
  crown?: "mcv-inc-crown" | "mcv-ltd-crown" | "edgeiq-holdings";
  dimension?: string;
}

// Memory Trinity queries
export interface MemoryEntry {
  memoryId: string;
  personaId?: string;                        // null on hive tier
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
  tags?: string[];                           // hive only
}
```

Casing convention: **snake_case on the wire, camelCase in hooks**. Contract-test each hook (per M2 T3.8 / M3 T9.4 template) before wiring UI.

---

## Task matrix (mirrors the original F1-C plan)

| # | File | Task | Model | Depends on |
|---|------|------|-------|------------|
| C1 | `src/lib/factory-client.ts` | Extend with `runPlan(kitId, objective, personaCtx)`, `streamPlan(planId)` (EventSource-based SSE), `listKits()`, `getKit(slug)`, `listSupervisorRuns()`, `getSupervisorRun(runId)`, `queryMemory(tier, filters)` | Opus | Factory endpoints live |
| C2 | `src/hooks/use-supervisor.ts` | `useSupervisorRun(kitId, objective, personaCtx)`, `useSupervisorStream(planId)`, `useKitList(filters)`, `useKit(slug)`, `useSupervisorRuns(filters)`, `useSupervisorRunDetail(runId)` — all TanStack Query-based, contract-tested | Opus | C1 |
| C3 | `src/views/SupervisorView.tsx` | Main view: kit picker (persona-aware), objective input, "Run Plan" button, live plan DAG viewer, per-worker status grid, run history list (click-through to detail) | Opus | C2 |
| C4 | `src/components/supervisor/PlanGraph.tsx` | SVG DAG renderer: nodes colored by status (running=amber, success=green, error=red, cancelled=gray), edges between dependent steps, live updates from SSE stream, hover tooltips with worker name + latency | Opus | C2 |
| C5 | `src/components/supervisor/WorkerStatus.tsx` | Per-worker status card: name, discipline badge, model badge, latency, input/output preview (JSON collapsible), error details if failed | Sonnet | C2 |
| C6 | `src/components/supervisor/KitRegistry.tsx` | Kit browser: list with search by slug/tag, view manifest in modal (pretty-printed JSON + metadata), "Test Invoke" button (inline runner with mock input form generated from Zod schema) | Sonnet | C2 |
| C7 | `src/hooks/use-factory-memory.ts` | `useMemoryPrivate(personaId, kind?)`, `useMemoryTenancy(filters)`, `useMemoryHive(filters)` — TanStack-based with pagination | Sonnet | C1 |
| C8 | `src/views/CreativeStudioView.tsx` | Absorb MCV-One-Creative-Studio---prototype 3-column shell — see section "Creative Studio absorption" below | Sonnet | — (independent) |
| C9 | `src/App.tsx` + `src/stores/navigation.ts` + `src/lib/view-meta.ts` | Register SupervisorView + CreativeStudioView in NavRail + view-meta registry | Sonnet | C3, C8 |
| C10 | `src/components/factory/FactoryHeartbeat.tsx` (existing, modify) | Extend heartbeat tile to show "active plans: N" + "memory writes/min" from new Factory endpoints | Sonnet | C2 |

**Exit criteria:**
- `pnpm build` + `tsc -b` clean (the real gate, not `tsc --noEmit`)
- End-to-end smoke: click in Supervisor view → Factory runs plan → plan DAG renders live → memory tier-1 write visible in memory query → heartbeat tile shows the active plan counter tick
- Creative Studio view mounts (wire-less, ready for Stride 3 engine)

---

## Creative Studio absorption (C8 detail)

**Source:** https://github.com/amoustakas/MCV-One-Creative-Studio---prototype (private; React 19.2 + Vite 6 + TS 5.8 — same stack as mcv-one-desktop)

**Collision flagged:** `src/views/CreativeCanvasView.tsx` already exists. Recommended resolution: rename existing to `LegacyCreativeCanvasView.tsx` (if unused) OR fold its surface into the new Studio view. Confirm before dispatch.

**Absorb verbatim:**
- All 7 components from `components/Studio/*` → `src/components/creative-studio/*` (rename folder only)
- `components/Modals/AssetGenerator.tsx`
- Whole `types.ts` (`Layer`, `AssistantMessage`, `GroundingChunk`, `ProjectState`, `ToolType`, `AspectRatio`, `Resolution`)
- Custom `mcv` Tailwind palette — merge into `tailwind.config.ts`:
  ```
  mcv-900: #0a0a0f, mcv-800: #13131f, mcv-700: #1c1c2e, mcv-accent: #6366f1
  ```
  (fonts: Inter + Fira Code already in use)

**Replace:**
- Tailwind CDN `<script>` in index.html → desktop's compiled Tailwind (drop the CDN line)
- `importmap` → Vite bundling (strip, rebuild via existing imports)
- Mocked `handleAssetGenerated` / `handleAiMessage` setTimeout — **keep mocked for now**; wire to `factoryClient.runPlan()` in Stride 3 when engine ships (Seedance + Remotion + Google GenAI)
- `./Icon.tsx` wrapper → direct `lucide-react` imports (confirm desktop convention — check a sibling view)

**Drop:**
- Top `<header>` (logo, branch pill, Share button, avatar) — redundant with desktop global chrome
- `INITIAL_LAYERS` demo payload (NEBULA + BigBuckBunny) → empty array
- `metadata.json`, `Share Prototype` button/link

**State model:** pure `useState` in the view component — fine for v1, no Zustand/Redux needed.

---

## Lane coordination for this session

When this session starts, expect:
- `api/_handlers/factory.ts` — may have uncommitted Gemini + prior Claude work. DO NOT OVERWRITE. Extend with supervisor/kit/memory handlers as additive routes.
- `src/lib/factory-client.ts` — may exist with some Factory methods. ADD new methods, don't rewrite.
- `src/hooks/use-factory.ts` / `use-factory-jobs.ts` / `use-factory-docker.ts` / `use-lmstudio.ts` — existing pattern; `use-supervisor.ts` + `use-factory-memory.ts` are siblings.
- `src/components/factory/` — FactoryHeartbeat, FlowRunner, RunHistoryList, FactoryEventFeed, FactoryCapabilitiesPanel, FactoryJobsPanel, LMStudioPanel, DockerPanel, StreamDeckPanel, HotkeysPanel, AudioWidget, DossierCard, DossierGenerateButton — PRESERVE all. Add `src/components/supervisor/*` alongside, not inside.
- `src/views/FactoryConsoleView.tsx` — existing; supervisor gets its OWN view (`SupervisorView.tsx`), not folded into FactoryConsole.

**Active worktrees from prior marathons** (check before creating new):
- `mcv-one-desktop/.claude/worktrees/agent-a5539e45`
- `mcv-one-desktop/.claude/worktrees/agent-a32677c2`

---

## Suggested batch dispatch (marathon pattern, 1 worktree)

Worktree: `mcv-one-desktop/.claude/worktrees/cockpit-supervisor-integration`

### Batch 1 (3 parallel, ~40 min)
- C1 factory-client extension (Opus)
- C8 Creative Studio absorption (Sonnet) [independent of Factory endpoints]
- Confirm existing kits-sdk types compatibility (read `src/lib/kits/types.ts`, reconcile with `McvKitManifest` above — same shape?)

### Batch 2 (4 parallel, ~45 min)
- C2 use-supervisor (Opus)
- C3 SupervisorView (Opus)
- C4 PlanGraph SVG (Opus)
- C7 use-factory-memory (Sonnet)

### Batch 3 (3 parallel, ~25 min)
- C5 WorkerStatus (Sonnet)
- C6 KitRegistry (Sonnet)
- C10 FactoryHeartbeat extension (Sonnet)

### Batch 4 (integration, ~20 min)
- C9 NavRail + view-meta wiring (Sonnet)
- Merge, smoke-test end-to-end

**Total: ~2.5 hours active + verification.**

---

## Prerequisites before this session runs

- [x] **Factory Marathon #1 COMPLETE 2026-04-17** — 14/14 tasks, 42/42 tests, tsc clean. See `C:\Users\moust\.claude\plans\marathon-1-COMPLETE-2026-04-17.md`
- [x] Factory `:7004` exposes `/invoke/kit-run`, `/kernel/workers`, `/kernel/kits`, `/kernel/kits/:slug`, `/kernel/status`, `/stream?typePrefix=kernel.` + existing `/flows`, `/heartbeat`, etc.
- [ ] **ACTION REQUIRED before cockpit session starts:**
  - Supabase migration apply: `psql "$FACTORY_SUPABASE_URL" -f c:\Users\moust\mcv\supabase\migrations\2026-04-17-memory-trinity.sql` (creates 6 tables: kits, supervisor_run, persona_memory_private, persona_memory_tenancy, hive_memory, factory_usage_log)
  - `pnpm add @supabase/supabase-js` in `c:\Users\moust\mcv` (Triangle dual-write silently skips without it)
  - Docker pgvector on :5440 running for local hybrid memory cache
  - Verify boot: `pnpm dev` → `curl http://localhost:7004/kernel/status` returns `workers: 2+`
- [ ] Existing `src/lib/kits/types.ts` reviewed for shape alignment with `McvKitManifest` (see Shared Type Shapes section)
- [ ] Decision made on CreativeCanvasView collision (rename-legacy vs. fold-into-studio)

**Note to cockpit session:** The endpoint API above is stable + smoke-tested. Factory's `POST /plan/:planId/run` SSE + `fromPlanGraph` helper are Stride-2 deferred — for v1, drive the SupervisorView via `/invoke/kit-run` + `/stream?typePrefix=kernel.` event stream. Plan DAG viewer consumes the `PlanGraph` shape from `supervisor-flow.ts::toPlanGraph()` server-side (returned in the invoke response). Raw WorkflowStep plans (with function refs) cannot cross the wire — this is by design.

---

## Signals the mcv-one-desktop session should emit

When this integration ships, emit to the existing Fabric bus:
- `venture.mcv-one-desktop.factory.supervisor-view.mounted`
- `venture.mcv-one-desktop.factory.first-plan-run-observed`
- `venture.mcv-one-desktop.factory.creative-studio.scaffolded`

Feeds the Hive tier-3 automatically via Factory's Fabric subscriber.
