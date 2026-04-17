# Marathon #1 — Resume-Here Status (post-compact)

**Stopped:** 2026-04-17 after 3 foundation tasks + schema-drift reconciliation
**Resume target:** dispatch next parallel batch (T1.2 + T2.2 + T3.2) using the reality-corrected schema below, then continue through the plan

---

## TL;DR

15/26 tasks done. Foundation + batch-1/2/3 shipped. Four migrations live in Supabase. Schema drift reconciled iteratively. Three parallel worktrees healthy. Next step: keep dispatching (T1.5 + T2.5 + T3.6).

### Batch progress map

| Batch | T1 | T2 | T3 | Migrations applied |
|---|---|---|---|---|
| foundation | T1.1 `a2bee3e` | T2.1 `9b9c448` | T3.1 `9002b51` | crown_entities + prospect_profile_operator |
| batch 1    | T1.2 `edd4028` | T2.2 `bad0a4c` | T3.2 `e28837d` | + ventures_expansion |
| batch 2    | T1.3 `254b3bf` | T2.3 `c54b197` | T3.3 `9a89080` | + capital_round_ventures |
| batch 3    | T1.4 `a61085b` | T2.4 `40a4d7b` | T3.4 `ce1f00d` + T3.5 `d6b6038` | + venture_corporate_stack |

### Cumulative schema / contract corrections layered onto the plan

- `capital_legal_entity` — text ids, `label` not `name`, `parent_entity_id` already exists (T2.1)
- `ventures` — `funding_stage` not `stage`, `owner_entity_id` not `parent_entity_id uuid`, ADD `is_raising` (T2.2)
- `prospect_profile` / `prospect_journey` / `agent_persona` — singular names (T3.1/T3.2)
- `prospect_journey.prospect_id` NOT `prospect_profile_id` — verified against live schema + existing `start_journey` case (T3.2)
- API action names use **underscores** (`create_operator_prospect`) to match existing convention — NOT hyphens as plan said (T3.2)
- API body fields are **snake_case** (`full_name`, `source_venture_id`, `assigned_persona_id`) — hook translates camelCase input (T3.3)
- `use-prospects.ts` uses `apiPost` helper from `../lib/api/client`, not raw fetch (T3.3)
- T3 worktree now has node_modules junction (created mid-batch-2 for typechecking) — same setup as T1
- Modal at `src/components/ui/index.ts` barrel re-exports default; wizard imports `import { Modal } from '../ui'` (T3.4)
- `'investor_accredited'` confirmed valid TrackName in `@mcv/onboarding-sdk` (T3.4)
- Corporate Stack tables reference `capital_treasury(id uuid)` and `capital_compliance_rule_set(id uuid)` — both verified uuid before T2.4 (T2.4)
- `venture_brand_kits.primary_domain` intentionally lacks FK — T2.5 adds it via `ALTER TABLE` (deferred FK pattern)

## What's live

### In the database (project `kovsdngjojzfebrxulyj`)

- `capital_legal_entity.is_crown` column added
- `mcv-inc-crown` (MCV Inc., US-DE) seeded with `is_crown=true`
- `mcv-ltd-crown` (MCV LTD, UK) seeded with `is_crown=true`
- `edgeiq-holdings.parent_entity_id = 'mcv-inc-crown'` wired
- `prospect_profile` (singular — not plural) extended with 10 columns: `intake_source` · `operator_notes` · `relationship_history` · `prior_deals` · `aum_estimate` · `check_size_range` · `investor_thesis` · `social_profiles` · `priority` · `archetype`
- Indexes: `idx_prospect_profile_intake_source`, `idx_prospect_profile_priority`
- Supabase MCP migration names: `crown_entities_2026_04_17`, `prospect_profile_operator_2026_04_17`

### In git

| Worktree | Path | Branch | HEAD SHA | Pushed |
|---|---|---|---|---|
| T1 | `C:/Users/moust/mcv-one-desktop-t1-pinned-strip` | `marathon-1-t1-pinned-strip-2026-04-17` | `a2bee3e` | ✅ |
| T2 | `C:/Users/moust/mcv-one-desktop-t2-ventures-stack` | `marathon-1-t2-ventures-stack-2026-04-17` | `9b9c448` | ✅ |
| T3 | `C:/Users/moust/mcv-one-desktop-t3-operator-prospects` | `marathon-1-t3-operator-prospects-2026-04-17` | `9002b51` | ✅ |
| master | `C:/Users/moust/mcv-one-desktop` | `master` | (this commit) | pending |

### Tasks done (3/26)

- [x] **T1.1** — pinned-kpi types + SuiteId canon (`a2bee3e` on T1)
- [x] **T2.1** — dual-crown migration (`9b9c448` on T2, applied via MCP)
- [x] **T3.1** — prospect_profile operator extension (`9002b51` on T3, applied via MCP)

---

## 🚨 Schema reality — corrections to the plan 🚨

The plan at [`2026-04-17-marathon-1-pinned-strip-ventures-prospects.md`](2026-04-17-marathon-1-pinned-strip-ventures-prospects.md) assumed a schema that doesn't match reality in several places. **Future-session Claude: use this table as ground truth, NOT the plan.**

### `capital_legal_entity`
| Plan assumed | Reality |
|---|---|
| `id uuid` | `id text` |
| `name` column | `label` column (no `name`) |
| No `parent_entity_id` — add `parent_crown_id uuid` | `parent_entity_id text` already present — use it; no separate `parent_crown_id` needed |
| `entity_type` values: `'C-Corp'`, `'Limited Co.'` | Existing rows use `'corporation'` — stay consistent |
| Entity ids | Text kebab-case: `edgeiq-holdings`, `futurestate-gp`, `betedge-ops`, `warforge-studios`, `mcvgg-foundation`, `mcv-platform`, `arq-labs`, `edgeiq-markets`. New crowns added: `mcv-inc-crown`, `mcv-ltd-crown` |

### `ventures`
| Plan assumed | Reality |
|---|---|
| `is_raising boolean` | NOT present — must add in T2.2 |
| `stage text` | `funding_stage text` already exists (e.g., `'seed'`, `'pre-seed'`) — use this instead of adding `stage` |
| `parent_entity_id uuid` | `owner_entity_id text` is the FK to `capital_legal_entity.id` — use it |
| `parent_venture_id` | Also exists for sub-venture relationships (text) |
| Existing venture ids | `futurestate`, `betedge`, `warforge`, `mcvgg`, `arq-labs`, `edgeiq-markets`, `mcv-platform`. Also `tier`, `launch_stage`, `clerk_org_id`, `owner_entity_id` columns exist. |

### `prospect_profile` (singular!)
| Plan assumed | Reality |
|---|---|
| `prospect_profiles` (plural) | `prospect_profile` (singular) |
| Column names | `id uuid` · `email` · `full_name` · `country` · `role_hint` · `source_venture_id` · `source_channel` · `referrer_user_id` · `metadata` · `created_at` · `updated_at` |
| Tables prefix | All four singular: `prospect_profile`, `prospect_journey`, `prospect_journey_step`, `prospect_capture` |

### Personas table
| Plan assumed | Reality |
|---|---|
| `agents_roster` → rename to `personas` in T5 | Actual table is `agent_persona` (singular). Spec §6.4 and T5 must target `agent_persona` — not a rename but an extension. Handler `api/_handlers/prospects.ts` already uses `agent_persona` with `handle` column. |

### API handler pattern (from existing `api/_handlers/prospects.ts`)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

// Top-level handler file: api/prospects.ts (Vercel serverless)
// Handler logic: api/_handlers/prospects.ts with exported handle...() function
// Service client via ./_supabase (not from ../src/lib/supabase as T2.10 plan said)
```

The plan's T2.10 route stub referenced `from '../src/lib/supabase'` — the actual pattern is `from './_supabase'`. Update the T2.10 dispatch to use the real helper.

---

## Immediate next dispatches (post-compact)

### Parallel batch: T1.2 + T2.2 + T3.2

All three can launch in parallel (different worktrees). Use these reality-corrected prompts:

#### T1.2 — tile registry + 6 command-center tiles

Working dir: `C:/Users/moust/mcv-one-desktop-t1-pinned-strip`. Dependencies met (T1.1 types exist). Plan Task 2 is correct as-written — no schema drift applies (pure frontend). Include note: `node_modules` in T1 worktree is junction-linked from `C:/Users/moust/mcv-one-desktop` (T1.1 subagent set this up). Subagent should NOT re-run `pnpm install`.

#### T2.2 — ventures expansion (REALITY-CORRECTED)

Working dir: `C:/Users/moust/mcv-one-desktop-t2-ventures-stack`. The plan's SQL needs rewriting. Replacement SQL:

```sql
-- supabase/migration-ventures-expansion-2026-04-17.sql
-- Extends ventures with is_raising flag + seeds new MCV.* raising ventures.
-- SCHEMA: funding_stage column exists (keep it). owner_entity_id is FK to capital_legal_entity.
-- We only ADD is_raising here; stage/parent concepts already covered by funding_stage + owner_entity_id.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS is_raising boolean NOT NULL DEFAULT false;

-- Flag already-seeded raising ventures
UPDATE ventures SET is_raising = true
WHERE id IN ('futurestate','betedge','mcvgg','warforge');

-- Seed new raising ventures under EdgeIQ Holdings' operating umbrella
INSERT INTO ventures (id, name, is_raising, funding_stage, owner_entity_id, status, type, category) VALUES
  ('mcv-tech', 'MCV.Tech', true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-dev',  'MCV.DEV',  true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-cx',   'MCV.CX',   true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-inc',  'MCV.INC',  false, 'mature',   'mcv-inc-crown',   'active', 'holding',  'mcv-brand')
ON CONFLICT (id) DO UPDATE SET
  is_raising = EXCLUDED.is_raising,
  funding_stage = EXCLUDED.funding_stage,
  owner_entity_id = EXCLUDED.owner_entity_id;

COMMENT ON COLUMN ventures.is_raising IS 'TRUE when the venture has an active capital-raise posture.';
```

Commit message: `fix(ventures): reality-corrected expansion — funding_stage + owner_entity_id + is_raising (T2.2)`

Apply via Supabase MCP with name `ventures_expansion_2026_04_17`.

#### T3.2 — create-operator-prospect action (REALITY-CORRECTED)

Working dir: `C:/Users/moust/mcv-one-desktop-t3-operator-prospects`. Extend existing `api/_handlers/prospects.ts`. Use singular `prospect_profile` and `prospect_journey` tables. Use `agent_persona` for persona lookup (pattern already in the file: `supabase.from('agent_persona').select('id').eq('handle', handle).maybeSingle()`). The plan's Task 2 handler code is directionally right but needs these name substitutions.

### After parallel batch completes

Continue per plan, tracking schema corrections table for each subsequent task. Key reality checks:

- **T2.3** (`capital_round_ventures` junction) — plan references `capital_rounds.venture_id`. Verify column exists before back-fill.
- **T2.4** (corporate stack tables) — references `capital_treasury(id)` and `capital_compliance_rule_set(id)`. Verify these have `uuid` ids (plan assumed uuid).
- **T2.5** (`domain_registry`) — references `capital_legal_entity(id)` which is text. Adjust FK type accordingly.
- **T3.3-T3.8** — everywhere plan says `prospect_profiles`, substitute `prospect_profile`. Everywhere plan says `personas` or `agents_roster`, substitute `agent_persona`.

---

## Known setup notes

1. **T1 worktree `node_modules`** — junction-linked from `C:/Users/moust/mcv-one-desktop`. Do NOT `pnpm install` in T1 worktree. If it breaks, recreate junction: `cmd /c mklink /J node_modules ..\mcv-one-desktop\node_modules` from inside the worktree.
2. **T2 + T3 worktrees** — no `node_modules` present yet. If subagents need to run tests in those worktrees, same junction trick applies, OR run tests from the main worktree after merging.
3. **LF→CRLF warnings** — benign Windows line-ending normalization, ignore.

## Resume command

After `/compact`:

> Pick up marathon #1 from the status doc `docs/superpowers/plans/marathon-1-status-2026-04-17.md`. Dispatch the next parallel batch (T1.2 + T2.2 + T3.2) using the reality-corrected prompts in §"Immediate next dispatches". Continue through plan using the schema reality table as ground truth, not the original plan SQL.

---

*Brand voice reminder*: aggressive · decisive · production-grade · hive-mind · founder-family legacy (per `feedback_brand_tone_philosophy.md`). Apply to all commits, UI copy, agent prompts.
