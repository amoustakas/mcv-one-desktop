# Marathon #2 — Personas · Tasks+Research · Capital×Commerce Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute task-by-task. Steps use checkbox (`- [ ]`) syntax. Optimization playbook memory (`feedback_marathon_execution_playbook.md`) applies — pre-flight schema, speculative dispatch, Opus for architecture, `pnpm build` gate.

**Goal:** Finish the Hit Squad persona layer, wire agentic task mode + research dossier surfaces, and stand up the full investor money-in flow (round browse → accreditation → soft commit → payment → commitment update → distribution setup).

**Architecture:** Three parallel tranches in three worktrees, committing independently. All foundation tables already exist — M2 is predominantly extensions, seeds, wiring, and consumer-facing UI. Zero net-new DB tables for T5/T6; one new table (`research_dossier`) for T4.

**Tech Stack:** Same as M1 — React 19 + Vite + TS strict, Zustand + persist, React Query v5, Vitest (env='node', pool='vmForks'), Supabase (kovsdngjojzfebrxulyj), existing `@mcv/capital-sdk` + `@mcv/payments-sdk` + `@mcv/onboarding-sdk`, catchall `api/[...slug].ts` dispatcher routing to `api/_handlers/<slug>.ts` default exports.

---

## 🚨 Schema reality — ground truth verified via information_schema 2026-04-17

Every table a subagent touches has been pre-verified. Use this table, NOT guesses.

### `agent_persona` (24 cols, 13 rows seeded)

Columns: `id uuid`, `handle text NOT NULL` (e.g., `@sterling`, `@atlas`), `full_name`, `title`, `department`, `seniority`, `scope_kind text='global'|'venture'`, `scope_value text` (venture id when scope_kind='venture'), `reports_to_agent_id uuid`, `interaction_mode text='on_demand'`, `persona_bio`, `voice_profile jsonb`, `system_prompt text NOT NULL`, `kit_allowlist text[]`, `tool_allowlist text[]`, `data_scopes jsonb`, `workflows jsonb`, `avatar_url`, `accent_color`, `active bool`, `hired_at timestamptz`, `metadata jsonb`.

**Existing seed list:**
| handle | full_name | title | department | seniority | scope |
|---|---|---|---|---|---|
| @atlas | Atlas | Chief of Staff | chief_of_staff | chief_of_staff | global |
| @warren | Warren Cho | Finance Officer | finance_capital | chief | global |
| @amara | Amara Reeves | Investor Relations Chief | ir_comms | chief | global |
| @sterling | Hannah Sterling | Futurestate IR | ir_comms | senior | venture:futurestate |
| @ada | Ada Marlowe | Legal Counsel | legal | chief | global |
| @justice | Justice Okonkwo | Compliance Officer | legal_risk | chief | global |
| @hedy | Hedy Kovac | Ops Controller | ops_infra | chief | global |
| @linus | Linus Park | Engineering Lead | engineering_product | chief | global |
| @dieter | Dieter Wren | Creative Director | brand_content | chief | global |
| @hannah | Hannah Graham | Growth Chief | growth_marketing | chief | global |
| @leo | Leo Drucker | Product Strategist | strategy_research | chief | global |
| @nico | Nico Vega | BetEdge Growth | growth_marketing | senior | venture:betedge |
| @satoshi | Satoshi Kim | MCV.gg Tokenomics | finance_capital | senior | venture:mcvgg |

**Hunter + Kirill journey agent_id backfill → use `@sterling`** (the existing Futurestate IR senior). Plan-of-record "Quinn" does not exist and was a phantom — `@sterling` is the real IR lead per this seed.

### `prospect_journey` (live)

`id uuid`, `prospect_id uuid NOT NULL` (FK to prospect_profile.id — NOT prospect_profile_id), `track`, `status`, `current_step_index`, `steps jsonb NOT NULL DEFAULT '[]'::jsonb`, `agent_id uuid`, `started_at`, `last_activity_at`, `completed_at`, `metadata jsonb`. Hunter (`13412fb1-9e51-453b-b768-0395e6c34f26`) + Kirill (`6c4c7b35-eafc-4b40-9fc4-a8f2b91c1b82`) prospect_ids confirmed; journeys 45cea285… and 480517e2… have `agent_id=NULL`.

### `tasks` (31 cols, 17 rows)

Has `assigned_agent uuid`, `kit_invocations jsonb`, `outputs jsonb`, `task_type text DEFAULT 'task'`, `source text DEFAULT 'manual'`, `acceptance_criteria text[]`, `sprint_id`, `story_points`, `epic_id uuid`, `story_id uuid`. **No `mode` column** — T4.1 adds it.

### `epics` (19 cols, 62 rows)

Has `owner_agent uuid`, `suite text`, `venture_id text`, `priority_order`, `progress_pct`, `tags text[]`, `xp integer`. Extension optional for M2.

### `research_dossier` — DOES NOT EXIST. T4.2 creates it.

### Capital ecosystem (live, all columns verified)

- `capital_rounds` (55 cols, 4 rows) — full round economics, `status text='draft'`, `is_public bool=false`, `accredited_only bool=false`
- `capital_commitments` (37 cols, 0 rows) — `contact_id uuid NOT NULL`, `round_id uuid NOT NULL`, `venture_id`, `status text='interest'` (transitions: interest → soft_committed → reserved → funded → distributed), `amount`, `amount_usd`, `payment_method`, `payment_reference`, `docusign_envelope_id`, full lifecycle timestamps (`interest_expressed_at`, `soft_committed_at`, `reserved_at`, `funded_at`, `distributed_at`), `receipt_content_id uuid`
- `capital_investor_profile` — `contact_id uuid NOT NULL` (PK with venture_id), `accreditation_status text='unknown'`, `kyc_status text='not_started'`, `portal_enabled bool=false`, `portal_user_id text`, `wallet_address`, `wallet_chain`, `lead_score int=0`, `total_committed_usd`, `total_funded_usd`, `jurisdiction`, `accreditation_expiry`, `kyc_completed_at`
- `capital_activities` — append-only event log: `activity_type text NOT NULL`, `actor_id text`, `actor_type text='user'`, `title text NOT NULL`, `commitment_id`, `round_id`, `contact_id`, `occurred_at timestamptz=now()`
- `capital_distributions` + `capital_distribution_leg` + `capital_distribution_recipients` — payout lifecycle (scheduled → processing → completed), per-recipient legs with `stripe_transfer_id`, `tx_hash`, `idempotency_key`, FX snapshot, treasury_id + config_id links
- `capital_round_ventures` (live, 4 rows from M1 back-fill) — multi-venture junction

### Payment rails (live, no DDL needed)

- `payment_intents` — `venture_id NOT NULL`, `processor_id text NOT NULL`, `processor_payment_id text`, `amount numeric`, `status text='pending'`, `payment_method`, `customer_id`, `customer_country text='US'`, `fee_fixed/fee_percentage/fee_total`, `journal_entry_id uuid`
- `payment_records` — `payment_intent_id uuid`, `venture_id`, `amount`, `processor`, `rail text`, `status='pending'`, `metadata jsonb`
- `payment_events` — `event_type NOT NULL`, `processor NOT NULL`, `payment_id text`, `external_id text`, `external_signature text` (webhook sig), `amount_cents bigint`, `payload jsonb`
- `payment_processor_config` — per-venture processor routing: `venture_id`, `payment_method`, `processor_id`, `priority`, `enabled`

### CRM (live from M1)

- `crm_contacts` — renamed from `contacts` in PR #40. When referencing investor contacts, use `crm_contacts`. Compat view `contacts` exists.
- `prospect_profile` singular (M1 T3.1 extension live)

---

## Worktrees + branches (already set up)

| Worktree | Path | Branch |
|---|---|---|
| T5 | `C:/Users/moust/mcv-one-desktop-m2-t5-personas-hit-squad` | `marathon-2-t5-personas-hit-squad-2026-04-17` |
| T4 | `C:/Users/moust/mcv-one-desktop-m2-t4-tasks-research-domains` | `marathon-2-t4-tasks-research-domains-2026-04-17` |
| T6 | `C:/Users/moust/mcv-one-desktop-m2-t6-capital-commerce` | `marathon-2-t6-capital-commerce-wiring-2026-04-17` |

All 3 worktrees have `node_modules` junction-linked from main worktree. Do NOT `pnpm install` inside them.

All M2 branches forked from master c25cf12 (post-M1 merge-ready state).

---

## Tranche T5 — Personas + Hit Squad Polish (5 tasks)

**Goal:** Formalize the dimensional hierarchy already implicit in the 13-persona seed, backfill the Hunter/Kirill journeys with `@sterling`, expose the roster via a registry UI, and stand up system-prompt composition so personas can actually answer in character.

### Task T5.1 — Dimension + crown affiliation columns + index

**Files:** `supabase/migration-agent-persona-dimensions-2026-04-17.sql`

Add `dimension text` (values: `6D`/`5D`/`4D`/`3D`/`2D`/`1D` per the MCV.INC crown philosophy memory), `crown_affiliation text` (`mcv-inc-crown`|`mcv-ltd-crown`|null), and `xp integer DEFAULT 0` (gamification hook). Backfill existing chiefs → 5D; seniors → 4D; MCV.INC holding → 6D. Index on dimension.

```sql
-- supabase/migration-agent-persona-dimensions-2026-04-17.sql
ALTER TABLE agent_persona
  ADD COLUMN IF NOT EXISTS dimension text CHECK (dimension IN ('6D','5D','4D','3D','2D','1D')),
  ADD COLUMN IF NOT EXISTS crown_affiliation text REFERENCES capital_legal_entity(id),
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

UPDATE agent_persona SET dimension = '5D', crown_affiliation = 'mcv-inc-crown'
WHERE seniority = 'chief' AND dimension IS NULL;
UPDATE agent_persona SET dimension = '5D', crown_affiliation = 'mcv-inc-crown'
WHERE seniority = 'chief_of_staff' AND dimension IS NULL;
UPDATE agent_persona SET dimension = '4D', crown_affiliation = 'mcv-inc-crown'
WHERE seniority = 'senior' AND dimension IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_persona_dimension ON agent_persona(dimension);
CREATE INDEX IF NOT EXISTS idx_agent_persona_crown ON agent_persona(crown_affiliation);

COMMENT ON COLUMN agent_persona.dimension IS '6D sovereign / 5D executive / 4D operator / 3D tactical / 2D field / 1D entry-level per MCV.INC crown philosophy';
COMMENT ON COLUMN agent_persona.crown_affiliation IS 'Which sovereign crown this agent reports to (mcv-inc-crown or mcv-ltd-crown)';
```

Commit: `feat(persona): dimension + crown_affiliation + xp on agent_persona (T5.1)`. Apply via Supabase MCP with name `agent_persona_dimensions_2026_04_17`.

### Task T5.2 — Backfill Hunter + Kirill journeys with @sterling

Not a subagent task — controller runs direct MCP SQL. Lookup @sterling's id, UPDATE prospect_journey.agent_id for Hunter (prospect_id=`13412fb1-9e51-453b-b768-0395e6c34f26`) + Kirill (prospect_id=`6c4c7b35-eafc-4b40-9fc4-a8f2b91c1b82`).

```sql
UPDATE prospect_journey
SET agent_id = (SELECT id FROM agent_persona WHERE handle = '@sterling'),
    last_activity_at = now()
WHERE prospect_id IN (
  '13412fb1-9e51-453b-b768-0395e6c34f26',
  '6c4c7b35-eafc-4b40-9fc4-a8f2b91c1b82'
);
```

### Task T5.3 — usePersonaRegistry hook + types

**Files:** `src/hooks/use-persona-registry.ts`, `src/hooks/__tests__/use-persona-registry.test.ts`

Typed hook returning `{ personas: Persona[], byDepartment: Record<string, Persona[]>, byDimension: Record<Dimension, Persona[]>, isLoading }`. Use `/api/personas` action `list_personas` (T5.3b — if handler doesn't exist, add to existing `api/_handlers/personas.ts` OR create one). Contract test verifies snake_case body + expected response shape.

### Task T5.4 — PersonaRegistryView component

**Files:** `src/views/PersonaRegistryView.tsx`, `src/components/persona/PersonaCard.tsx`

Grid layout: 4 columns wide on desktop. Each card shows handle, full_name, title, department badge, dimension chip, crown glyph, and avatar initial. Group by department with collapsible sections. Wire into nav under a new "Hit Squad" or "Agent Roster" nav item.

### Task T5.5 — Persona system-prompt composition + contract test

**Files:** `src/lib/persona/compose.ts`, `src/lib/persona/__tests__/compose.test.ts`

Pure function `composeSystemPrompt({ persona, ventureId?, lens?, context? })`: returns the full system prompt string assembled from `persona.system_prompt` + venture context (resolved from `ventures` + `venture_brand_kits`) + optional lens (time-window, fiscal-quarter, etc.) + brand voice philosophy footer. Test asserts: inclusion of persona handle, inclusion of venture name when ventureId provided, brand-voice footer always present.

---

## Tranche T4 — Tasks Morph + Research Dossier + Domain Enrichment (6 tasks)

**Goal:** Formalize agentic vs human task modes, stand up a per-entity research dossier primitive (with 3 seeded dossiers for Hunter/Kirill/MCV.Tech), and add a Namecheap+Cloudflare sync stub for `domain_registry`.

### Task T4.1 — tasks.mode column + check constraint + index

**Files:** `supabase/migration-tasks-mode-2026-04-17.sql`

```sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'human'
  CHECK (mode IN ('human','agent','hybrid'));

CREATE INDEX IF NOT EXISTS idx_tasks_mode ON tasks(mode);

-- Rows where assigned_agent is set → infer agent mode
UPDATE tasks SET mode = 'agent' WHERE assigned_agent IS NOT NULL AND mode = 'human';

COMMENT ON COLUMN tasks.mode IS 'Execution mode: human | agent | hybrid. Hybrid = agent-drafted + human-approved.';
```

Apply as `tasks_mode_2026_04_17`.

### Task T4.2 — research_dossier migration

**Files:** `supabase/migration-research-dossier-2026-04-17.sql`

New table for per-entity research (prospect, venture, round, deal). Fields: findings, sources, confidence, stale_at. Linked via polymorphic (entity_type + entity_id).

```sql
CREATE TABLE IF NOT EXISTS research_dossier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('prospect','venture','round','contact','deal','organization')),
  entity_id text NOT NULL,  -- text to handle both uuid (venture_id is text) and uuid-as-text
  title text NOT NULL,
  summary text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array of {claim, evidence, confidence}
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,   -- array of {url, accessed_at, author}
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low','speculative')),
  authored_by_agent_id uuid REFERENCES agent_persona(id),
  authored_by_user_id text,
  stale_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_dossier_entity ON research_dossier(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_research_dossier_authored_by ON research_dossier(authored_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_research_dossier_stale ON research_dossier(stale_at) WHERE stale_at IS NOT NULL;

COMMENT ON TABLE research_dossier IS 'Per-entity research + intel. Agentic or human-authored. Stale_at triggers refresh prompts.';
```

Apply as `research_dossier_2026_04_17`.

### Task T4.3 — Seed 3 dossiers (Hunter, Kirill, MCV.Tech)

**Files:** `scripts/seed-research-dossiers-2026-04-17.ts` (write only; controller runs via MCP SQL)

Seed authoritative v1 dossiers for Hunter Milborne, Kirill Soloviev, and MCV.Tech. Authored by `@sterling` (for Hunter/Kirill) and `@leo` (for MCV.Tech). Each has 3-5 findings + 2-3 sources + confidence=high/medium.

### Task T4.4 — useResearchDossier + useTaskMode hooks + contract tests

**Files:** `src/hooks/use-research-dossier.ts`, `src/hooks/use-task-mode.ts`, contract tests

`useResearchDossier({ entityType, entityId })` → `{ dossiers, latest, isLoading, refresh }`. `useTaskMode()` → mutation for toggling mode on a task row. Both snake_case on the wire, camelCase input. Contract test pattern from T3.8.

### Task T4.5 — ResearchDossierView component

**Files:** `src/components/research/ResearchDossierView.tsx` + subcomponents

Per-entity panel showing: latest dossier title + confidence chip, findings list with evidence tooltips, sources with click-through, authored-by persona badge, stale-at indicator (red if past due). Wire into ProspectsView detail panel + VentureDetailView.

### Task T4.6 — TaskMorphChip + wire into TaskCard

**Files:** `src/components/tasks/TaskMorphChip.tsx`, modify `src/components/tasks/TaskCard.tsx`

Chip component showing mode with icon: 🧠 agent, 👤 human, ⚡ hybrid. Click → dropdown to change mode (invokes useTaskMode mutation). Wire into TaskCard next to priority chip.

---

## Tranche T6 — Capital × Commerce Wiring (7 tasks)

**Goal:** The end-to-end investor money-in flow. Consumer-facing UI for round browse → accreditation → soft commit → payment kickoff → commitment funded. Wires existing capital_commitments + payment_intents + capital_investor_profile through consumer-visible surfaces.

### Task T6.1 — Consumer round-browse handler (read actions)

**Files:** `api/_handlers/investor-flow.ts`

New handler with `default export` for catchall dispatcher. Actions:
- `list_public_rounds` — `SELECT * FROM capital_rounds WHERE is_public = true AND status IN ('open','reserved') ORDER BY featured_order, open_date DESC`, joined with venture names from `ventures` + venture brand_kits for logo/colors
- `get_round_detail` — single round by id or public_page_slug, with venture + brand_kit + round_ventures allocation breakdown

Use snake_case action names (underscore convention). Match existing `api/_handlers/capital.ts` pattern for auth + error shape. Opus-tier task.

### Task T6.2 — Accreditation submit handler

**Files:** extend `api/_handlers/investor-flow.ts`

Action `submit_accreditation`: takes `{ contact_id, venture_id, accreditation_method, documents[], jurisdiction }`. UPSERT into `capital_investor_profile` with `accreditation_status='pending'`, `kyc_status` update, `jurisdiction`. Emit `capital_activities` row with `activity_type='accreditation_submitted'`. Return updated profile + pending review estimate.

### Task T6.3 — Soft-commit handler

**Files:** extend `api/_handlers/investor-flow.ts`

Action `create_soft_commit`: takes `{ contact_id, round_id, amount, currency='USD', payment_method?, wallet_address? }`. Validates: round is `is_public=true` + `status IN ('open','reserved')` + amount >= minimum_check + (amount <= maximum_check if set), and verifies accreditation when round.accredited_only=true. INSERT `capital_commitments` with `status='soft_committed'`, `soft_committed_at=now()`, `amount_usd` computed via FX snapshot (use current rate, store in metadata). Emit `capital_activities` with activity_type='soft_commit_created'. Return commitment row. **Opus-tier** — critical business logic.

### Task T6.4 — Payment-kickoff handler + webhook

**Files:** extend `api/_handlers/investor-flow.ts`, plus `api/_handlers/investor-flow-webhook.ts` (separate handler for webhooks)

Action `kickoff_payment`: takes `{ commitment_id, payment_method }`. Looks up venture processor config, creates `payment_intents` row (links `processor_id` + venture_id + amount), updates `capital_commitments.payment_reference = payment_intent.id`, `status='reserved'`, `reserved_at=now()`. Returns payment_intent record with client_secret or processor redirect URL.

Webhook handler (`investor-flow-webhook`): inbound from Stripe/Plaid/USDC rails. Validates `external_signature`, writes `payment_events` row, when status=`succeeded` updates `capital_commitments.status='funded'`, `funded_at=now()`, `payment_received_at=now()`, emits `capital_activities` row.

### Task T6.5 — Investor-flow hooks with contract tests

**Files:** `src/hooks/use-investor-flow.ts`, `src/hooks/__tests__/use-investor-flow.test.ts`

Hooks: `usePublicRounds`, `useRoundDetail(roundId)`, `useSubmitAccreditation`, `useCreateSoftCommit`, `useKickoffPayment`. All camelCase-in / snake_case-out, using `apiPost`. Contract test suite with 5 assertions (one per hook). Opus-tier.

### Task T6.6 — Consumer round-browse UI

**Files:** `src/views/investor/RoundBrowseView.tsx`, `src/components/investor/RoundCard.tsx`, `src/components/investor/AccreditationFlow.tsx`, `src/components/investor/SoftCommitModal.tsx`

Marketing-grade round-browse grid. Each RoundCard shows venture brand + round name + target_raise + progress (total_committed/target_raise) + minimum_check + round_type + close_date countdown + "Invest" CTA. AccreditationFlow is a 3-step wizard (method selector → docs upload stub → jurisdiction confirm). SoftCommitModal shows amount input with minimum_check + maximum_check validation + round terms summary + primary "⚡ Reserve my allocation" CTA. Opus-tier.

### Task T6.7 — FundingSteps + payment-progress view

**Files:** `src/views/investor/FundingStepsView.tsx`, `src/components/investor/PaymentProgressStrip.tsx`

Post-soft-commit dashboard showing the 5-stage lifecycle (interest → soft_committed → reserved → funded → distributed) with current stage highlighted + per-stage timestamps + next-action CTA. Payment progress strip polls `useCommitment(commitmentId)` every 4s until funded. Wire into a new `/invest/[commitmentId]` route.

---

## Execution dispatch plan (optimization playbook active)

### Batch 1 (5-wide parallel) — Foundation + reality reads

Dispatch concurrently:
- **T5.1** (Opus) — persona dimension migration
- **T4.1** (Sonnet) — tasks.mode migration
- **T4.2** (Opus) — research_dossier migration
- **T6.1** (Opus) — investor-flow handler skeleton with list_public_rounds + get_round_detail actions
- **T5.3** (Sonnet) — usePersonaRegistry hook + types

Controller concurrently runs T5.2 backfill SQL via MCP as Batch 1 dispatches.

### Batch 2 (5-wide) — Wiring + seed scripts

Dispatch while Batch 1 reviews happen:
- **T5.4** (Sonnet) — PersonaRegistryView
- **T5.5** (Opus) — persona system-prompt composer + test
- **T4.3** (Sonnet) — seed 3 dossiers script
- **T4.4** (Opus) — useResearchDossier + useTaskMode + contract tests
- **T6.2** (Sonnet) — submit_accreditation action (extends T6.1 handler)

Controller applies T5.1, T4.1, T4.2 migrations via MCP as Batch 1 reports DONE.

### Batch 3 (5-wide) — Consumer UI + critical logic

- **T6.3** (Opus) — create_soft_commit action (critical biz logic)
- **T6.5** (Opus) — investor-flow hooks + contract tests
- **T4.5** (Sonnet) — ResearchDossierView
- **T4.6** (Sonnet) — TaskMorphChip + wire
- **T6.6** (Opus) — RoundBrowseView + AccreditationFlow + SoftCommitModal

### Batch 4 (2-wide) — Webhook + funding view

- **T6.4** (Opus) — kickoff_payment + webhook handler
- **T6.7** (Sonnet) — FundingStepsView + payment progress

### Final

- T6 seed: create 1 demo round for MCV.Tech (Tony as demo commitment) via MCP
- Review, push, 3 PRs (T5 #50, T4 #51, T6 #52)

---

## Gates (required for every subagent)

1. `pnpm vitest run <relevant paths>` — tests pass
2. `npx tsc --noEmit -p tsconfig.json` — strict typecheck
3. **`pnpm build`** — tsc -b walks full project-reference graph (catches bugs tsc --noEmit misses)
4. `git branch --show-current` before every commit
5. No `git add -A` — specific paths only

## Brand voice reminder

Every commit message, UI string, and subagent-emitted text applies the brand tone: aggressive · decisive · production-grade · hive-mind · founder-family legacy. No corporate-sanitized copy.
