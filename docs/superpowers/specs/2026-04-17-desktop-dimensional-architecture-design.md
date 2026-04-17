# MCV Desktop — Dimensional Architecture & Suite Canon

**Date:** 2026-04-17
**Author:** NAOS (Claude Opus 4.7) × Tony
**Status:** Design — ready for implementation planning
**Supersedes / extends:** `2026-04-05-commerce-financial-os-design.md`, `2026-04-05-naos-living-agent-civilization-design.md`, `project_edgeiq_capital.md` (memory)

---

## TL;DR

MCV Desktop becomes a **6-dimensional operating shell** for the EdgeIQ / MCV conglomerate. A single primitive — the **PinnedKpiStrip** — composes with the **Lens** (multi-venture filter) and **SuiteShell** (domain workspace) to give Tony a view at every altitude: ecosystem protocol, dual-crown parent, operating holding, single venture, lens group, or row.

Nine canonical Suites (Capital · Growth · Payments · CRM · Creative · Engineering · Operations · Knowledge · Comms) absorb every existing view into a cohesive hierarchy. Three Beasts (Engineering GitHub ops · Tasks agent/human morph · Payments rails) get dedicated scope in follow-up specs.

The first marathon ships two tranches in parallel:

- **T1 — PinnedKpiStrip + SuiteShell primitives** (unblocks all suite pages)
- **T3 — Operator-Seeded Prospect Intake** (Hunter Milborne + Kirill Soloviev seeded tonight)

Plus the `venture` primitive expansion (T2) whose schema must land before T4 god-view composition is meaningful.

---

## 1. The Dimensional Model

The venture switcher in the global shell is a **dimensional elevator**. Selection state re-shapes every view below.

| Dim | Name | Trigger | What you see |
|-----|------|---------|--------------|
| **6D** | Ecosystem Crown | dedicated nav item (sovereign surface) | MCV Inc. + MCV LTD dual parent — **sovereign · dynastic · never for sale · royalty-up from every venture**. Tony only (successors = his two sons). Protocol health, consortium roster, cross-parent strategic roadmap, universal royalty graph. Tone: legacy / dynastic / non-SaaS |
| **5D** | Conglomerate | 6D → "enter holdings" | EdgeIQ Holdings CEO view. Brand portfolio grid, consolidated financials, inter-brand flows, exec agent briefs, cross-brand goals |
| **4.5D** | Lens | 2+ ventures selected | Blended view over a venture group (e.g., MCV.Tech + MCV.DEV shared cap). Pinned strip aggregates over lens; Suites show lens-filtered data |
| **4D** | Venture | single venture selected | Full operating stack for one brand. Corporate Stack row + venture pinned strip + 8 Suite tabs scoped to that venture |
| **3D** | Suite | Suite chosen inside 4D or 5D | Domain workspace (Capital · Growth · Payments · ...). Its own pinned KPI strip + Tool sub-nav |
| **2D** | Tool | Tool chosen inside Suite | Specific workspace (Rounds · Investors · Deploys · PRs · Tasks board) |
| **1D** | Row | single entity | One round · one commitment · one PR · one task · one contact |

**Navigation invariant:** lowering dimension narrows scope; raising dimension widens scope. The `<GlobalShell>` always shows a breadcrumb reflecting current dimensionality.

---

## 2. The Suite Canon (9 Suites)

Each Suite is a composition of existing views + net-new views, unified by a shared `<SuiteShell>` component. Every Suite owns a default `PinnedKpiStrip` loadout that the user can personalize.

### 2.1 Capital 💰
**Money IN from investors.**
Tools: Foundation · Rounds · Investors · Cap Table · Distributions · Treasury · Compliance · Launchpad · Sign Inbox.
Status: ~85% shipped (see `project_edgeiq_capital.md` memory — 23 NAOS tools live, Epic 16 complete).

### 2.2 Growth 📈 *(renamed from Commerce)*
**Money IN from customers + users.**
Tools: Commerce (stores · products · orders) · Financials (unit econ · CAC/LTV) · Users · Marketing · Business Dev · Campaigns · Cohorts · Revenue Analytics · Attribution.
Status: Commerce SDK (8 plans, 6 service layers, 44 tables, 33 tools) shipped. Growth framing + BD/Marketing tools are the extension.

### 2.3 Payments 💳 *(new top-level — split from Capital/Commerce)*
**Money OUT · rails · reconciliation.**
Tools: Processors (Stripe Connect · Plaid · Crypto) · Invoices · Bills · Payouts · Reconciliation · Tax Exports (1099-DIV · T5) · FX + Multi-Currency · Disputes · Merchant Accounts · Payment Methods.
Status: `@mcv/payments-sdk` exists + Plaid/Stripe inbound adapters live + tax-export service shipping. Missing: consolidated Suite surface, FX/multi-currency, full bill/payout UI.

### 2.4 CRM 👥
**The universal relationship graph — not capital-only.**
Every human the ecosystem touches: investors, customers, partners, collaborators, creators, vendors, advisors, team, prospects, platform users. Same primitive (`crm_contacts`), different archetypes.
Tools: Prospects · Pipeline · People · Companies · Activities · Campaigns (CRM-facet) · Personas (read-only surface — Operations owns the authoring side) · **Archetypes** (class/role classification per the gamification model — see §12).
Status: `crm_contacts` schema live, InvestorsPanel shipped, ProspectsView (408 LOC) shipped. Prospects is the highest-value extension (T3). Archetypes/classes layer ships with T3's operator-intake wizard (role picker).

### 2.5 Creative 🎨
**Make things.**
Tools: AI Studio · Creative Canvas · Voice Studio · Video Studio · Media Library · Brand Kits · Content OS hooks · Publishing Queue · Review Board.
Status: AI Studio + Voice + Video + Canvas shipped. Brand Kits + Publishing/Review are extensions.

### 2.6 Engineering ⚙️ *(BEAST)*
**Build systems — GitHub ops as first-class primitive.**
Tools: Repos · PRs · Issues · Actions · Environments · Secrets · Packages · Releases · Branch Protection · Teams · Deploys (Vercel · Cloudflare · Supabase) · War Room · Signals · Device Hub · Cron · Feature Flags · Error Tracking.
Status: github-kit shipped, War Room + Signals exist. GitHub-ops depth + cross-org view is net-new.

### 2.7 Operations 🧭
**Run · automate · govern.**
Tools: Tasks *(agent/human morph — BEAST)* · Epics · NAOS Command · Agents Roster · Personas (authoring) · Integrations · Governance (MCV Sign · Legal · Jurisdictions · Policies) · Audit Log.
Status: Epic tree, NAOS Command, Agents Roster, Sign all shipped. Tasks needs the morph primitive extension.

### 2.8 Knowledge 📚
**Know things.**
Tools: Docs Hub · Knowledge Hub · Files · Memory · Notebooks · **Research** *(new first-class primitive)* · RAG Search · Venture Docs.
Status: Docs + Files + Memory shipped. Research as a structured primitive (dossiers attached to Ventures, Prospects, Rounds, Contracts) is new.

### 2.9 Comms 💬
**Talk · presence.**
Tools: Inbox · Chat · Comms Hub (10-tab) · Presence · Calendar · Calls · Notifications Feed.
Status: CommsHub + Presence + NotificationCenter shipped. Calendar/Calls/unified Inbox are extensions.

---

## 3. First-Class Primitives

These are reusable entities that surface across multiple Suites and dimensions.

### 3.1 Corporate Stack
**Location:** surfaces at 4D (per-venture) and 5D (aggregate).
**Composition:** `<VentureCorporateStack ventureId={...}>` renders 5 blocks:
1. **Corps** — legal entities (from `capital_legal_entity`, extended)
2. **Jurisdictions** — where the venture legally operates (new `venture_jurisdictions` junction)
3. **Accounts** — bank · treasury · merchant · tax (new `venture_accounts` junction, resolves to `capital_treasury` when capital-scope)
4. **Team** — humans + assigned NAOS personas (joins `team_members` + `personas`)
5. **Brand** — domain · visual identity · voice persona · brand kit version (new `venture_brand_kits` + links to `domain_registry`)

### 3.2 Personas
**The NAOS agent cast with personality, tools, workflows.**
- Each persona is a reusable entity: `{id, handle, accent_color, role, tools[], system_prompt, voice_id}`
- Already exists (agents_roster) — elevated here to cross-Suite first-class citizen
- Shows as "assigned agent" card on: ProspectProfileView (live), round pages, task cards (future), research dossiers (future)
- Authored in **Operations → Agents Roster**; read in every Suite

### 3.3 Research
**Structured dossiers attached to any entity.**
- Schema: `research_dossiers` (id, title, target_type, target_id, author_id, content_id → Content OS, status, tags, visibility)
- Examples: jurisdictional compliance memo (attached to Venture), investor intel dossier (attached to Prospect), market analysis (attached to Round)
- Rendered in **Knowledge Suite → Research**; surfaced contextually on every parent entity's detail page (e.g., Hunter Milborne's ProspectProfileView shows attached dossiers)

### 3.4 Domain Registry
**The authoritative map of every domain we own, synced from Namecheap + Cloudflare.**
- Schema: `domain_registry` (id, fqdn, registrar, registrar_ref, parent_entity_id → legal_entity, venture_id? nullable, nameservers[], status, expires_at, last_synced_at)
- **First run**: hit Namecheap API + Cloudflare Zones API, upsert every domain. Never hand-maintain.
- Surfaces in: 6D crown (domain tree), 4D Corporate Stack (Brand block shows venture domains), Engineering (DNS/zone status)

### 3.5 Tasks Morph *(BEAST — own spec needed)*
**Tasks with agent/human morph capability.**
Core field additions: `mode: 'human' | 'agent' | 'handoff'` + `naos_persona_id` + `worktree_ref` + `venture_id` + `suite_id` + `blocked_on[]`.
Semantics: a task spawned in CRM can execute in Engineering (via Claude worktree), post back to Comms, update Capital — one primitive, any morph sequence.
**Out of scope for this spec** — gets dedicated spec: `2026-04-18-tasks-morph-primitive-design.md`.

---

## 4. The PinnedKpiStrip Pattern

**Single reusable component, per-suite data bindings.**

```tsx
<PinnedKpiStrip
  suite="capital" | "growth" | "crm" | ... | "command-center"
  lens={activeLens /* string[] of venture ids */}
  ventureId={selectedVentureId ?? null /* 4D context */}
/>
```

### 4.1 Default loadouts (ship with these, user can personalize)

| Suite | Tiles |
|-------|-------|
| **Command Center (5D)** | Consolidated NAV · Revenue MTD · Cash · Total Users · Team · Governance Pulse |
| **Command Center (6D)** | Ecosystem TVL · Protocol fees (30d) · Active Brands · Conformance level · Consortium members · Pending governance |
| **Capital** | Portfolio NAV · Open Rounds · Commits in-flight · Distributions Due · Verified Investors · Compliance Alerts |
| **Growth** | Revenue MTD · Users · MRR · CAC · LTV · Cohort retention |
| **Payments** | Settled Today · In-flight (reconcile queue) · Failed · FX exposure · Fee YTD · Tax forms due |
| **CRM** | Active Prospects · Pipeline $ · Conversion rate · Activities Today · New Captures · Stale deals |
| **Creative** | Assets Published · Render Queue · Awaiting Review · Voice Clones · Projects Shipping · Drafts |
| **Engineering** | Deploys Today · Open PRs · Test Failures · Incidents · Uptime 30d · Cron Health |
| **Operations** | Open Tasks · Blocked · Agent tasks running · Epics in-flight · Stale ≥14d · Governance items |
| **Knowledge** | Docs · Research dossiers · Memory entries · Files · RAG queries today · Stale ≥90d |
| **Comms** | Unread · DMs requiring reply · Calendar today · Missed calls · Mentions · Scheduled sends |

### 4.2 Personalization
- Store: extend `command-center.ts` Zustand store with `pinnedKpis: Record<SuiteId, KpiId[]>`
- UI: gear icon on each strip opens tile picker (reorder · hide · show)
- Persistence: existing `zustand/persist` middleware (no migration needed)

### 4.3 Tile types
- **v1 (ship first):** number + delta + optional secondary-label ("0/5 funded"; "▲ 12% MoM")
- **v2 (T1.5):** sparkline inside tile · goal-bar tile · agent-status pill · live-ticker
- Tile definitions: `src/lib/pinned-kpi/definitions.ts` — each tile has `{id, label, source: QueryFn, formatter, accent}`

---

## 5. The Lens (Venture filter)

- **Zustand store:** `useLens()` — `{selected: string[], setLens, addVenture, removeVenture, clear}`
- **Semantics:**
  - `selected.length === 0` → 5D god-view (all ventures aggregated)
  - `selected.length === 1` → 4D venture-mode (single venture focus)
  - `selected.length >= 2` → 4.5D lens-mode (group aggregate)
- **UI:** top of GlobalShell, chip-style multi-select, persists to localStorage
- **Propagation:** every data hook (`useAllVentureMetrics`, `useProspects`, `useCommerceOrders`, etc.) consumes lens and filters automatically

---

## 6. Schema Extensions

Grouped by tranche. All additive; zero breaking changes to existing tables.

### 6.1 Ventures primitive (T2)
```sql
-- Expand venture registry
ALTER TABLE ventures ADD COLUMN parent_entity_id uuid REFERENCES capital_legal_entity(id);
ALTER TABLE ventures ADD COLUMN is_raising boolean NOT NULL DEFAULT false;
ALTER TABLE ventures ADD COLUMN stage text; -- 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'growth' | 'mature'

-- Flag already-seeded ventures that are raising
UPDATE ventures SET is_raising = true
  WHERE id IN ('futurestate', 'betedge', 'mcvgg', 'warforge');

-- Seed the new raising ventures
INSERT INTO ventures (id, name, is_raising, parent_entity_id) VALUES
  ('mcv-tech', 'MCV.Tech', true, ...),
  ('mcv-dev',  'MCV.DEV',  true, ...), -- shares cap with MCV.Tech
  ('mcv-cx',   'MCV.CX',   true, ...),
  ('mcv-inc',  'MCV.INC',  false, ...); -- governance-only

-- Support shared cap tables (MCV.Tech + MCV.DEV)
CREATE TABLE capital_round_ventures (
  round_id uuid REFERENCES capital_rounds(id),
  venture_id text REFERENCES ventures(id),
  allocation_pct numeric, -- how round proceeds split across ventures
  PRIMARY KEY (round_id, venture_id)
);
-- Migrate capital_rounds.venture_id → junction (keep column as denormalized primary)
```

### 6.2 Corporate Stack (T2)
```sql
CREATE TABLE venture_jurisdictions (
  venture_id text REFERENCES ventures(id),
  jurisdiction_code text, -- 'US-DE', 'CA-ON', 'UK', etc.
  regulatory_frameworks text[], -- ['Reg D 506(c)', 'NI 45-106']
  tax_structure text, -- 'C-Corp', 'CCPC', 'LLP'
  compliance_rule_set_id uuid REFERENCES capital_compliance_rule_set(id),
  PRIMARY KEY (venture_id, jurisdiction_code)
);

CREATE TABLE venture_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id text REFERENCES ventures(id),
  account_type text, -- 'bank' | 'treasury' | 'merchant' | 'tax' | 'crypto'
  provider text, -- 'Mercury' | 'Wise' | 'Stripe' | 'USDC'
  account_ref text, -- external id
  currency text,
  balance_cached numeric,
  balance_synced_at timestamptz,
  treasury_id uuid REFERENCES capital_treasury(id) -- when capital-scope
);

CREATE TABLE venture_brand_kits (
  venture_id text PRIMARY KEY REFERENCES ventures(id),
  primary_domain text REFERENCES domain_registry(fqdn) DEFERRABLE INITIALLY DEFERRED,
  logo_asset_id uuid,
  color_primary text,
  color_accent text,
  voice_persona_id uuid REFERENCES personas(id),
  brand_kit_version text,
  style_guide_content_id uuid -- Content OS
);
-- FK is deferrable so venture_brand_kits can be seeded before domain_registry is synced from Namecheap/Cloudflare.
```

### 6.3 Parent Crown (T2)
```sql
-- Dual parent entities above existing EdgeIQ Holdings
INSERT INTO capital_legal_entity (id, name, entity_type, jurisdiction, is_crown) VALUES
  ('mcv-inc-crown', 'MCV Inc.', 'C-Corp',        'US-DE', true),
  ('mcv-ltd-crown', 'MCV LTD',  'Limited Co.',   'UK',    true);

ALTER TABLE capital_legal_entity ADD COLUMN is_crown boolean DEFAULT false;
ALTER TABLE capital_legal_entity ADD COLUMN parent_crown_id uuid REFERENCES capital_legal_entity(id);

UPDATE capital_legal_entity
SET parent_crown_id = (SELECT id FROM capital_legal_entity WHERE id='mcv-inc-crown')
WHERE id = 'edgeiq-holdings';
```

### 6.4 Personas primitive
```sql
-- Elevate existing agents_roster to cross-Suite personas
CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text UNIQUE NOT NULL, -- 'quinn', 'aegis', 'forge', 'atlas'
  display_name text NOT NULL,
  accent_color text,
  role text, -- 'Compliance Officer', 'IR Lead', 'Engineer', 'Chief of Staff'
  system_prompt_content_id uuid, -- Content OS
  tools text[],
  voice_id text, -- ElevenLabs id
  avatar_asset_id uuid,
  default_venture_id text REFERENCES ventures(id),
  is_active boolean DEFAULT true
);
-- Migrate existing agents_roster rows in place
```

### 6.5 Research primitive (T4 or T5)
```sql
CREATE TABLE research_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_type text NOT NULL, -- 'venture' | 'prospect' | 'round' | 'contact' | 'contract'
  target_id text NOT NULL,
  author_id uuid, -- user or persona
  author_persona_id uuid REFERENCES personas(id),
  content_id uuid, -- Content OS row
  status text DEFAULT 'draft', -- 'draft' | 'in-review' | 'published' | 'archived'
  tags text[],
  visibility text DEFAULT 'internal', -- 'internal' | 'team' | 'portfolio'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON research_dossiers (target_type, target_id);
```

### 6.6 Domain Registry (T2 or T4)
```sql
CREATE TABLE domain_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fqdn text UNIQUE NOT NULL,
  registrar text, -- 'Namecheap'
  registrar_ref text, -- Namecheap domain id
  cloudflare_zone_id text,
  parent_entity_id uuid REFERENCES capital_legal_entity(id),
  venture_id text REFERENCES ventures(id),
  nameservers text[],
  status text, -- 'active' | 'expiring' | 'expired' | 'transfer' | 'parked'
  registered_at date,
  expires_at date,
  auto_renew boolean,
  last_synced_at timestamptz
);
```

### 6.7 Operator-Seeded Prospects (T3)
```sql
-- Extend prospect_profiles for operator-authored intel
ALTER TABLE prospect_profiles
  ADD COLUMN intake_source text DEFAULT 'wizard', -- 'wizard' | 'operator' | 'referral' | 'import'
  ADD COLUMN operator_notes text,
  ADD COLUMN relationship_history text,
  ADD COLUMN prior_deals jsonb DEFAULT '[]', -- free-form array of past interactions
  ADD COLUMN aum_estimate numeric,
  ADD COLUMN check_size_range text, -- '$25k-$100k'
  ADD COLUMN investor_thesis text,
  ADD COLUMN social_profiles jsonb DEFAULT '{}', -- {linkedin, twitter, etc}
  ADD COLUMN priority text DEFAULT 'medium'; -- 'hot' | 'warm' | 'medium' | 'cold'
```

---

## 7. Tranches (Execution Sequence)

Each tranche is independently shippable and unblocks subsequent tranches.

### T1 — PinnedKpiStrip + SuiteShell primitives
**Scope:** Ship `<PinnedKpiStrip>` with v1 tile type (number + delta) and 9 default loadouts. Ship `<SuiteShell>` wrapper that every Suite page uses. Extend `command-center.ts` store with `pinnedKpis` personalization.
**Dependencies:** none.
**Size:** ~600 LOC across component + definitions + 9 loadouts + store extension + tests.
**Unblocks:** T4, and every future Suite page.

### T2 — Ventures registry + Corporate Stack + Parent Crown
**Scope:** Apply schema migrations in 6.1-6.3 + 6.6 (venture_jurisdictions, venture_accounts, venture_brand_kits, capital_round_ventures, is_crown + parent_crown_id, domain_registry). Seed new raising ventures (MCV.Tech, MCV.DEV shared, MCV.CX, MCV.INC governance). Ship `<VentureCorporateStack>` component.
**Dependencies:** none. Parallelizable with T1 in a worktree.
**Size:** ~800 LOC + 4 migrations + seed script.
**Unblocks:** T3 (prospect venture assignment), T4 (god-view brand portfolio).

### T3 — Operator-Seeded Prospect Intake ⭐ *(tonight's user-visible win)*
**Scope:** Apply schema migration in 6.7. Ship `<OperatorProspectIntakeWizard>` (multi-step: identity → intel → assets → relationship → assign-agent → seed-journey). Seed Hunter Milborne + Kirill Soloviev with real intel. Extend `ProspectsView` with "New Prospect (Operator)" button + intake_source badge. Assign Quinn as default agent for Futurestate investor track.
**Dependencies:** T2 (venture_id picker), weakly on T1 (the prospects pinned strip).
**Size:** ~900 LOC.
**Unblocks:** every downstream experience uses the operator-authored rows (god-view "Needs me" references Hunter/Kirill, NAOS briefings have real content).

### T4 — 5D Conglomerate Command Center + 4D Venture-Mode composition
**Scope:** Compose `<CommandCenter>` using T1 primitives. Build 5D layout (pinned strip + brand portfolio grid + inter-brand flows + strategic goals + exec agent feed). Build 4D layout (venture header + Corporate Stack row + venture pinned strip + Suite tab bar). Wire the venture switcher to toggle between 5D and 4D.
**Dependencies:** T1, T2.
**Size:** ~1200 LOC across views + hooks + composition layer.
**Unblocks:** the "god-view feel" — first marathon deliverable that makes Tony say "holy shit it's here."

### T5 — Personas + Research first-class
**Scope:** Migrate `agents_roster` → `personas` table. Ship Research primitive + `<ResearchDossierPanel>` on ventures/prospects/rounds. Wire cross-Suite "assigned persona" slot.
**Dependencies:** T2 for venture linking. Weakly on T3 for prospect dossier attach.
**Size:** ~700 LOC.
**Unblocks:** Tasks Morph (needs persona primitive).

### T6 — Tasks Agent/Human Morph
**Scope:** Extend `tasks` schema with `mode`/`naos_persona_id`/`worktree_ref`. Ship morph-aware task card. Integrate with Claude Code worktree runner. **Gets its own spec** (`2026-04-18-tasks-morph-primitive-design.md`) — this tranche only bookmarks the scope.
**Dependencies:** T5.
**Size:** TBD — full spec required.
**Unblocks:** seamless agent/human workflow across every Suite.

### Out of scope (future specs)
- **Commerce × Capital composition** (soft-commit as commerce checkout) — `2026-04-19-commerce-capital-composition-design.md`
- **Engineering Beast** (GitHub ops full depth) — `2026-04-19-engineering-github-ops-design.md`
- **Payments Beast** (processors + invoices + bills + payouts + FX) — `2026-04-20-payments-suite-design.md`
- **6D Ecosystem Crown surface** (protocol/consortium UI) — `2026-04-22-6d-ecosystem-crown-design.md`

---

## 8. Reuse Map (what we absorb, don't rebuild)

| Existing asset | Role in new architecture |
|----------------|--------------------------|
| `CommandCenter.tsx` | T4 composes over it — existing widgets become optional bottom row |
| `command-center.ts` store | T1 extends with `pinnedKpis`, existing `widgetVisibility` stays |
| `CapitalFoundationView.tsx` | Becomes the Capital Suite's `Foundation` tool inside `<SuiteShell>` |
| `ProspectsView.tsx` + `ProspectProfileView.tsx` | T3 extends with operator intake; existing wizard funnel remains |
| `apps/onboarding` | Remains as the public self-service wizard (outside-in); T3 adds the inside-out path |
| `@mcv/capital-sdk` + 20+ services | Capital Suite data layer — untouched |
| `@mcv/commerce-sdk` | Growth Suite data layer — untouched |
| `@mcv/payments-sdk` + processor-registry | Payments Suite backbone — untouched |
| `@mcv/kits-sdk` + 98 builtin kits | Every Suite pulls tools from kits |
| `capital_legal_entity` · `capital_treasury` · `capital_royalty_graph` · `capital_compliance_rule_set` · `capital_distribution_config` | Corporate Stack foundation — extend, don't replace |
| `agents_roster` | Becomes `personas` table (in-place migration) |
| `VentureSidebar` + venture switcher | Extends to multi-select Lens with fallback to single-select |
| Claude Code session runner + worktree scripts | T6 Tasks-Morph agent execution engine |
| Epic tree + trigger-computed `progress_pct` | Goals-rendering in Command Center middle panel derives from Epic rows until a first-class Goals primitive is scoped (future spec) |

---

## 9. Success Criteria

### Marathon #1 (T1 + T2 + T3)
- [ ] `<PinnedKpiStrip>` renders on 3+ suites with default loadouts
- [ ] Tile personalization persists across reload
- [ ] New raising ventures (MCV.Tech, MCV.DEV shared, MCV.CX, MCV.INC) live in ventures table
- [ ] `capital_round_ventures` junction supports MCV.Tech+MCV.DEV shared cap
- [ ] Corporate Stack row renders on at least 1 venture (Futurestate)
- [ ] Operator-seeded Hunter Milborne + Kirill Soloviev rows exist with real intel
- [ ] Both prospects show up in ProspectsView with `intake_source=operator` badge
- [ ] Quinn assigned as default Futurestate investor agent on both

### Follow-up marathon (T4 + T5)
- [ ] Switching venture in global shell toggles 5D ↔ 4D layouts
- [ ] 4D Venture-Mode renders full Corporate Stack + 8 Suite tabs
- [ ] Personas table live; every "assigned agent" slot reads from it
- [ ] Research dossiers attach to venture + prospect + round

---

## 10. Open Questions

1. **Parent crown allocation** — which ventures hang off MCV Inc. vs MCV LTD? Needs Tony's jurisdictional research artifact imported before seeding.
2. **Namecheap + Cloudflare sync credentials** — confirm the API keys + scopes Tony has available for `domain_registry` first-run sync.
3. **Real KPI data sources per suite** — T1 default loadouts cite sources in Section 4.1. Some (Attribution, MRR precisely, Tax forms due) need query functions written. Flagged per-tile in implementation plan.
4. **6D landing decision** — should the app land at 6D by default, or 5D? Recommendation: **5D default**, 6D promoted via a dedicated "Ecosystem" nav item (lighter daily cognitive load).
5. **Persona migration path** — in-place rename vs dual-write for a transition period? Recommendation: in-place, one transaction, zero dual-write (single-author codebase, no drift risk).

---

## 11. Non-goals (explicitly out of this spec)

- Tool-level UI design inside each Suite (deferred to per-suite specs)
- White-label / multi-tenant platform customizations (already scoped in Epic 6)
- On-chain cap table (Epic 8, multi-month arc)
- Consortium governance UX (Epic 14, separate spec)
- Mobile PWA responsive pass (handled in a follow-up pass after desktop lands)
- Real-time collaborative cursors / presence within Suites (post-T6 consideration)

---

---

## 12. Gamification Foundation — The Hardcore Ladder (below 6D)

Every layer below 6D operates as **the hardest gamification system known**. Diablo 2 Hardcore Ladder is the reference: real stakes, permanent consequences, prestige through contribution, ladder-based visibility. 6D itself stays sovereign/dynastic and is *outside* the game — it's the throne, not the board.

### 12.1 Character model
Every person onboarded (prospect, investor, partner, contributor, creator, team member) is a **character** with:
- **Class / archetype** — investor · operator · creator · advisor · partner · contributor · customer · founder · vendor
- **Level** — progression metric tied to real ecosystem contribution (capital deployed, work shipped, referrals onboarded, content published, token staked)
- **Attributes** — reputation · trust · accreditation status · contribution history · jurisdictional eligibility
- **Inventory** — owned equity · token holdings · credentials (VCs) · access grants · earned badges
- **Achievements** — first deal · first distribution · first referral · first token stake · first published asset · succession transfer received

### 12.2 Venture realms
Each venture is a **realm** with its own economy + rules but shared infrastructure. Characters are *placed* into realms with scoped roles — not free-roaming across every venture. Role scope = what you see + what you can do + what you can earn in that realm. Cross-realm travel is governed (introduction, invite, verification).

### 12.3 Hardcore stakes
- **Irreversibility** — equity commitments, token stakes, signed contracts don't roll back. One-way doors.
- **High-stakes gates** — accreditation, OFAC, VC verification are real barriers. Failure flags are permanent (with cryptographic audit).
- **Append-only record** — every action timestamped, signed, auditable. No silent resets.

### 12.4 Ladder (cross-venture leaderboards)
- Top investors by deployed capital (per-venture + consortium-wide)
- Top contributors by shipped work
- Top referrers by onboarded network
- Top creators by asset engagement
- Ladder tiers map to real access rights (gated rounds, exclusive governance votes, token allocations, invite-only events)

### 12.5 Progression is real
Levels are not cosmetic. They gate:
- Access to capital rounds (minimum tier for Seed, higher for private rounds)
- Governance voting weight
- Token allocation priority at TGE
- Exclusive content + research access
- Persona assignment (higher-level characters get Quinn — senior IR persona; lower-level get templated flows from junior personas)

### 12.6 Succession (real-world dynasty)
Mirrors the 6D dynastic principle. Passing equity · credentials · access grants · earned badges · reputation to a named successor is a **first-class operation** with cryptographic audit. Not a platform feature bolt-on — architectural from day one.

### 12.7 Implementation timing
- **Marathon #1 (T1+T2+T3):** design primitives so the ladder layer can hang off them later. `crm_contacts.metadata.archetype` + `crm_contacts.metadata.level` reserved. Operator-intake wizard captures archetype on creation.
- **Post-T6:** dedicated spec `2026-04-25-hardcore-ladder-design.md` details the progression engine, leaderboards, cross-realm governance, and succession operation.
- **Design invariant:** never ship a primitive that would have to be refactored to accommodate the ladder. Stakes are permanent, record is append-only, archetype is explicit.

---

## 13. Agent Hit Squad — Rollout Order

Agents are not generic tools — each is a role/department specialist. The squad operates as a hive-mind (shared memory graph, shared event bus, real-time evolution). See memory `project_hit_squad_agent_rollout.md` for canonical directive.

### 13.1 Top-down rollout
1. **6D executive tier FIRST** — CEO-proxy · protocol counsel · legacy steward · succession advisor · royalty architect. These agents encode Tony's sovereign/dynastic constraints + strategic reasoning. Every layer below inherits context from this tier.
2. **5D conglomerate tier** — CFO-proxy · Chief of Staff · brand-portfolio strategist · cross-brand risk officer · inter-brand capital router.
3. **4D venture tier** — operator · CMO · product lead · compliance officer · IR lead per venture (Quinn for Futurestate, TBD names for BetEdge / MCV.GG / WarForge / MCV.Tech+DEV / MCV.CX / MCV.INC-governance).
4. **3D suite tier** — engineering lead · compliance officer · creative director · growth strategist · ops chief per Suite (applied to a venture).
5. **2D / 1D tactical tier** — specialists for individual tools + rows (PR reviewer · deal intake agent · investor-brief drafter · etc.).

### 13.2 Hive-mind semantics
- **Shared substrate** — persona memory graph · Fabric event bus (pub/sub) · Content OS RAG corpus · activity + audit timeline
- **Specialized surface** — system prompts · tool loadouts · voice clones · accent_color · default venture scope · role
- **Real-time evolution** — system prompts + tool loadouts update continuously from agent-effectiveness telemetry
- **Cross-agent handoff** — agent A completes → agent B picks up via shared context (no re-briefing)

### 13.3 Implementation timing
- **T5 (Personas + Research)** elevates `agents_roster` to `personas` — the Hit Squad substrate
- **Post-T5 spec** `2026-04-21-agent-hit-squad-rollout-design.md` details the 6D agent cast, hive-mind event bus, evolution telemetry, cross-tier handoff, and real-time system-prompt updates
- **Design invariant for marathon #1:** every Suite surface exposes an "assigned persona" slot; every operator-seeded prospect in T3 is assigned at least one persona (Quinn for Futurestate investor track)

---

## 14. Brand Tone & Voice Invariants

The product, its copy, its agents, and its specs speak in one voice. See memory `feedback_brand_tone_philosophy.md` for the canonical rules. Applied to this spec, to every UI surface, to every agent system prompt, to every public artifact.

- Aggressive ambition · historic mission · founder-family legacy · elite hardcore · hive-mind intelligence · production-grade
- Never corporate-sanitized; never MVP-hedged
- Default voice check: *"Would an elite team changing history write this sentence?"* If not → rewrite.

---

*End of spec.*

