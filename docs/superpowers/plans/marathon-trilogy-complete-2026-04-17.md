# Marathon Trilogy — Complete (2026-04-17)

**Status:** All 9 PRs merged. 62 tasks shipped. 13 migrations applied. Foundation ready for the enterprise-refactor phase.

## Shipped summary

| Marathon | PRs | Tasks | Migrations | Contract tests | Wall-clock |
|---|---|---|---|---|---|
| M1 Capital God-View + Operator Intake | #47 #48 #49 | 26 | 6 | 3 | ~4h (initial run) |
| M2 Personas · Tasks+Research · Investor Flow | #50 #51 #52 | 18 | 3 | 36 | ~30m |
| M3 Venture Detail · Distributions · Gamification | #53 #54 #55 | 18 | 4 | 22 | ~65m |
| **Total** | **9** | **62** | **13** | **61** | — |

Final merge sweep of all 9 PRs: **4m 41s** on 2026-04-17 09:50:01–09:54:42 UTC, with 2 conflict resolutions on nav/App.tsx (trivial "keep both sides" pattern — both sides had registered routes to the same switch).

## Master state (post-merge)

Master HEAD: `8a02daf` (PR #55 merge commit)

Live Supabase prod (`kovsdngjojzfebrxulyj`) state:
- 7 raising ventures · 2 sovereign crowns · 4 round↔venture junction rows
- 22 Corporate Stack rows (9 jurisdictions + 6 accounts + 7 brand kits)
- 9 sovereign domains · 2 operator prospects (Hunter + Kirill)
- 13 Hit Squad personas (all dimension-tagged) · 4 prospect journeys with assigned agent
- 1 public open round (MCV.Tech Pre-Seed, $1M target)
- 3 research dossiers · 17 tasks with mode · 28 XP ledger events · 3 achievements
- Total XP across ladder: 3,140 · 1 scheduled distribution (demo)

## Features delivered (end-user visible)

### Command Center + Pinned KPIs (M1 T1)
- 60 tile definitions across 10 suites with default loadouts
- Per-user personalization (set/add/remove/reorder) via gear-modal
- SuiteShell wrapper wired into Command Center / Capital / CRM views

### Ventures + Crown + Corporate Stack + Domains (M1 T2)
- MCV Inc. + MCV LTD dual sovereign crowns (6D)
- 4 new MCV-brand ventures raising (Tech/DEV/CX/INC)
- Multi-venture round junction (shared cap tables)
- Per-venture jurisdictions + accounts + brand kits
- 9 seeded sovereign domains with deferred FK to brand kits

### Operator-Seeded Prospect Intake (M1 T3)
- 10 operator-intel columns on prospect_profile
- 5-step wizard (Identity → Intel → Relationship → Assign → Review)
- Hunter Milborne + Kirill Soloviev seeded as first prospects
- `intake_source` badge discriminates operator vs wizard intake

### Hit Squad Personas (M2 T5)
- Dimensional hierarchy (6D sovereign → 5D executive → 4D operator)
- `agent_persona` extended with dimension, crown_affiliation, xp
- PersonaRegistryView — roster grid grouped by department
- `composeSystemPrompt({ persona, venture?, lens?, context? })` pure function
- Hunter+Kirill backfilled with @sterling (Futurestate IR)

### Tasks + Research + Dossiers (M2 T4)
- `tasks.mode` discriminator (human|agent|hybrid)
- `research_dossier` primitive (polymorphic entity + findings + sources + confidence + staleness)
- ResearchDossierView wired into ProspectProfileView
- TaskMorphChip toggleable component
- 3 seeded dossiers (Hunter, Kirill, MCV.Tech)

### Capital × Commerce — Money IN (M2 T6)
- End-to-end investor flow: round browse → accreditation → soft commit → payment kickoff → funded
- 13 error codes on `create_soft_commit` (round/accreditation/jurisdiction/check-size validation)
- RoundBrowseView + RoundCard + AccreditationFlow (3-step) + SoftCommitModal
- FundingStepsView with 4s polling + PaymentProgressStrip (5-stage lifecycle)
- Webhook handler (`investor-flow-webhook`) dedupes on (processor, external_id) + marks funded

### Venture Detail God-View (M3 T7)
- Single round-trip aggregator handler (8 parallel Supabase reads)
- VentureLensHero (brand-gradient banner + aggregate raise progress)
- VentureRoundsPanel + VentureActivitiesFeed + VentureTeamBlock (scoped personas)

### Distributions + Royalty Graph — Money OUT (M3 T8)
- Distributions lifecycle (scheduled → processing → completed)
- `execute_distribution` computes per-leg splits from the active royalty graph (bps × total_amount / 10000)
- 10 error codes with structured details
- RoyaltyGraphView + LayerRow + LayerModal (bps validation, 10000-total indicator)
- **Bug fix**: widened `capital_activities.activity_type` CHECK to accept M2 T6 values (fixes latent runtime bug)

### Gamification Foundation (M3 T9)
- `persona_xp_event` immutable ledger + `persona_achievement` table (5 tiers)
- `accrue_persona_xp_for_activity()` trigger on `agent_activity_log` INSERT (action_kind → XP mapping)
- LadderView with podium styling + level badges (level = log₂(xp/100)+1)
- PersonaCharacterSheet with XP sparkline + achievements + chain-of-command + recent events feed

## Known follow-ups (accepted / deferred to refactor phase)

1. **T7 tabbed VentureDetailView regression** — the legacy tabbed workspace (Overview/Quests/Assets/Domains/Socials/Team/Docs/Ops/Settings) was replaced by the god-view. Tab deep-links via `openVentureDetailTab(tab)` no longer honor tabs. Tabbed panel components (VentureQuestPanel, AssetTierGraph, etc.) remain in the codebase reachable from other routes. Restoration is a small follow-up during the refactor phase if needed.
2. **FX placeholder in `create_soft_commit`** — non-USD amounts pass through at 1:1 with a metadata note. Real FX lookup is M4 work.
3. **Webhook signature verification** — currently warns on missing signature but accepts; M4 hardens with processor-specific signed-payload verification (Stripe / Plaid / USDC).
4. **Agent nav for the 8 raising ventures** — NavRail has a single "Ventures" group but doesn't expose sub-items per venture. Programmatic navigation works; UX can be enriched in the refactor phase.

## Playbook evolution (updated in `feedback_marathon_execution_playbook.md`)

Three new rules learned during M3:
- **Rule #11**: Pre-flight `pg_constraint` CHECK constraints in addition to `information_schema.columns` (caught latent M2 T6 bug before runtime failure).
- **Rule #12**: When two subagents share a worktree, use `git commit <specific-path>` (positional arg) to bypass the staged index — prevents sweep collisions between parallel sessions.
- **Rule #13**: Ledger ↔ denormalized sum invariant must be enforced by BOTH ledger inserts AND denormalized updates (caught T9.3 variance divergence mid-run, auto-corrected).

## Velocity

- M1 (26 tasks): ~4 hours (original run, before playbook)
- M2 (18 tasks): ~30 minutes (playbook applied: pre-flight + 5-wide + Opus tiering + speculative dispatch)
- M3 (18 tasks): ~65 minutes (playbook + new CHECK-constraint pre-flight rule)

**Compound effect**: M2+M3 combined (36 tasks) shipped in ~95 minutes vs. M1's 4 hours for 26 tasks — roughly **~3.5× per-task throughput** improvement without sacrificing quality (61 passing contract tests, 13 migrations applied cleanly, zero failed merges).

## Next phase

The repo is now ready for enterprise-grade system-admin + infrastructure work:
- Production deployment topology + CI/CD pipeline
- Observability (metrics, traces, incident response)
- RBAC hardening + signed-webhook verification
- Cross-venture tenant isolation at the DB + app layers
- Runbook + oncall rotation

All 62 features from the marathon trilogy are available as foundation surfaces for that work.
