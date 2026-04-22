# Marathon #3 — Venture Detail · Distributions+Royalty · Gamification

> Execution: `superpowers:subagent-driven-development` with optimization playbook from `feedback_marathon_execution_playbook.md`. Pre-flight done — use schema reality below as ground truth.

**Goal:** Per-venture deep-dive pages, distributions UI (money OUT) + royalty graph builder, and the gamification foundation (XP ledger + character sheets + ladder) materializing the Diablo 2 HC Ladder philosophy.

**Tech Stack:** Same as M1/M2.

---

## 🚨 Schema reality (verified via information_schema + pg_constraint 2026-04-17)

### CRITICAL BUG from M2 — `capital_activities.activity_type` CHECK constraint

Allowed values: `email, call, meeting, note, portal_view, portal_login, doc_sent, doc_signed, payment_received, payment_sent, status_change, token_distributed, enrichment, system`. **M2 T6 INSERTs `accreditation_submitted`, `soft_commit_created`, `payment_kicked_off` which are NOT allowed.** T8.1 fixes by widening the constraint.

### `agent_persona` (24 cols + 3 M2 additions, 13 rows)

- `seniority` CHECK: `principal | chief_of_staff | chief | senior | associate | contributor`
- `department` CHECK: `principal | chief_of_staff | finance_capital | legal_risk | legal | ir_comms | growth_marketing | brand_content | engineering_product | ops_infra | strategy_research`
- `interaction_mode` CHECK: `always_on | on_demand | scheduled | event_driven`
- `dimension` CHECK: `6D|5D|4D|3D|2D|1D`
- `xp integer NOT NULL DEFAULT 0` (M2 T5.1) — T9 writes to this

### `agent_activity_log` (2 rows)

- `action_kind` CHECK: `chat_turn | tool_call | workflow_run | handoff | system`
- Has `duration_ms`, `cost_usd`, `venture_id`, `correlation_id`

### `capital_royalty_graph` (7 rows) + `capital_royalty_graph_layer` (18 rows)

- Graph: `venture_id text`, `label`, `version int`, `effective_at`, `superseded_at`, `metadata jsonb`
- Layer: `graph_id`, `sequence int`, `label`, `recipient_type text`, `recipient_id text`, `bps integer CHECK (0-10000)`, `kind text`, `condition_expr`, `jurisdiction`
- Layer `kind` CHECK: `platform_rake | venture_rake | ip_royalty | affiliate | creator_share | reserve | burn | fee_split | other`
- Layer `recipient_type` CHECK: `treasury | user | external_entity | pool`

### `capital_distributions` (0 rows)

- `distribution_type` CHECK: `dividend | interest | yield | token_airdrop | buyback | return_of_capital | fee_rebate | other`
- `status` CHECK: `scheduled | processing | partial | completed | failed | cancelled`
- `total_amount >= 0` CHECK
- Existing cols: `venture_id`, `round_id`, `scheduled_for`, `processed_at`, `completed_at`, `total_amount`, `currency`, `total_recipients`, `total_paid`, `record_date`, `ex_date`, `journal_entry_id`, `content_id`, `flow_kind`, `fx_snapshot jsonb`, `correlation_id`, `treasury_id`, `config_id`, `idempotency_key`

### `capital_distribution_leg`

- `recipient_type` CHECK: `investor | vendor | platform | reserve | royalty_holder | creator | referrer | referee | liquidity_pool | external`
- `status` CHECK: `pending | sent | settled | failed | no_account | held_compliance | cancelled`
- `amount >= 0`

### `persona_xp_event` — DOES NOT EXIST. T9.1 creates.
### `persona_achievement` — DOES NOT EXIST. T9.2 creates.

---

## Worktrees (set up)

| Tranche | Path | Branch |
|---|---|---|
| T7 Venture Detail | `C:/Users/moust/mcv-one-desktop-m3-t7-venture-detail` | `marathon-3-t7-venture-detail-2026-04-17` |
| T8 Distributions+Royalty | `C:/Users/moust/mcv-one-desktop-m3-t8-distributions-royalty` | `marathon-3-t8-distributions-royalty-2026-04-17` |
| T9 Gamification | `C:/Users/moust/mcv-one-desktop-m3-t9-gamification` | `marathon-3-t9-gamification-2026-04-17` |

All worktrees junction-linked `node_modules`. All forked from master `c25cf12`.

---

## Tranche T7 — Venture Detail Pages (5 tasks, ZERO DDL)

Per-venture god-view. Pure wiring over M1/M2 primitives.

- **T7.1 (Sonnet)** — `api/_handlers/venture-detail.ts` with `get_venture_detail` action; returns venture + brand_kit + rounds + commitments + activities + scoped personas in a single round-trip.
- **T7.2 (Opus)** — `useVentureDetail` hook + contract tests. camelCase → snake_case pattern.
- **T7.3 (Sonnet)** — `VentureDetailView` shell + route `/venture/:id`. Wire into NavRail under Ventures group.
- **T7.4 (Sonnet)** — block components: `VentureRoundsPanel`, `VentureActivitiesFeed`, `VentureTeamBlock` (scoped personas via `scope_kind='venture' AND scope_value=ventureId`).
- **T7.5 (Opus)** — venture-lens hero: reuses `PinnedKpiStrip` with `ventureId` + `suite='capital'` lens, plus a summary pane (raise progress + active rounds count + recent activity count).

---

## Tranche T8 — Distributions + Royalty Graph UI + CHECK fix (6 tasks, 2 migrations)

- **T8.1 (Sonnet)** — Migration: widen `capital_activities_activity_type_check` to include `accreditation_submitted`, `soft_commit_created`, `soft_commit_updated`, `payment_kicked_off`. Fixes M2 T6.2/T6.3 bug.
- **T8.2 (Opus)** — `api/_handlers/distributions.ts` with actions: `list_distributions`, `get_distribution`, `create_scheduled_distribution`, `execute_distribution` (moves legs pending→settled via the royalty graph). Critical biz logic.
- **T8.3 (Opus)** — `useDistributions` + `useCreateDistribution` + `useExecuteDistribution` hooks + contract tests.
- **T8.4 (Sonnet)** — `DistributionsView` + `DistributionCreateModal` + `DistributionLegsTable`.
- **T8.5 (Opus)** — Royalty graph editor: `RoyaltyGraphView` per venture showing layers (sequence, label, recipient_type, bps, kind) + `GraphLayerModal` to add/edit layers. bps validation (0-10000, per-graph sum display).
- **T8.6 (Sonnet)** — Seed one demo scheduled distribution for MCV.Tech ($50k yield, scheduled 30 days out) — controller runs via MCP SQL.

---

## Tranche T9 — Gamification Foundation (6 tasks, 2 migrations)

- **T9.1 (Opus)** — Migration: `persona_xp_event` ledger table (`id uuid`, `agent_id uuid FK`, `event_kind text CHECK`, `xp int NOT NULL`, `source_type text`, `source_id text`, `description text`, `occurred_at timestamptz=now()`, `metadata jsonb`). Immutable ledger. Plus index on `(agent_id, occurred_at DESC)`.
- **T9.2 (Sonnet)** — Migration: `persona_achievement` table (`id uuid`, `agent_id uuid FK`, `achievement_key text`, `earned_at timestamptz=now()`, `metadata jsonb`, UNIQUE (agent_id, achievement_key)).
- **T9.3 (Opus)** — Migration: Postgres function `accrue_persona_xp()` that inserts into `persona_xp_event` AND updates `agent_persona.xp` atomically. Trigger on `agent_activity_log` INSERT that maps action_kind → xp (chat_turn=1, tool_call=5, workflow_run=20, handoff=10, system=0). Backfill XP from existing agent_activity_log rows. Seed a few XP events across personas for demo.
- **T9.4 (Opus)** — `useLadder` + `usePersonaXp(agentId)` hooks + contract tests.
- **T9.5 (Sonnet)** — `LadderView` — ranked leaderboard of all personas by xp, dimension chips, progress-to-next-level bar (levels by log₂(xp/100)+1), top-3 podium styling. Wired into nav.
- **T9.6 (Opus)** — `PersonaCharacterSheet` — per-persona detail modal/route with: xp history chart, achievements list, reports_to → graph rendering (who they report to + who reports to them), recent activity log slice.

---

## Execution plan (playbook active)

### Batch 1 (5-wide parallel) — Foundation migrations + handlers

- **T8.1** (Sonnet) — activity_type CHECK widening migration
- **T9.1** (Opus) — persona_xp_event ledger migration
- **T9.2** (Sonnet) — persona_achievement migration
- **T7.1** (Sonnet) — venture-detail handler
- **T8.2** (Opus) — distributions handler

Controller applies migrations via MCP as they commit.

### Batch 2 (5-wide) — Hooks + XP trigger + graph UI

- **T9.3** (Opus) — XP trigger + backfill + demo seed
- **T9.4** (Opus) — Ladder + XP hooks + tests
- **T7.2** (Opus) — useVentureDetail hook + tests
- **T8.3** (Opus) — distributions hooks + tests
- **T8.5** (Opus) — Royalty graph editor

### Batch 3 (5-wide) — Views + wire-up

- **T9.5** (Sonnet) — LadderView
- **T9.6** (Opus) — PersonaCharacterSheet
- **T7.3** + **T7.4** (Sonnet, combined) — VentureDetailView shell + block components
- **T7.5** (Opus) — venture-lens hero
- **T8.4** (Sonnet) — DistributionsView + modals

### Final

- T8.6 seed 1 demo distribution via MCP
- Verify: migrations live, XP accrued, demo round still there, ladder populated
- Push 3 branches, open 3 PRs (T7, T8, T9)
