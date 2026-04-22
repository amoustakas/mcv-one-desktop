-- supabase/migration-foundation-os-v1-2026-04-22.sql
--
-- Foundation OS v1 — operationalizes Tony's .docs/counsel corpus (IP Inventory v1.1,
-- Counsel Onboarding Pack v2.0, 6 T0-T6 CSVs) as first-class rows the cockpit can
-- surface and NAOS can query / mutate through foundation-kit.
--
-- Nine new tables:
--   ip_marks            — trademarks, patents, copyrights, trade secrets (unified kind enum)
--   counsel_engagements — law firms on the 3 workstreams (Corp/Tax, IP, Securities)
--   counsel_tasks       — CT-1..CT-9, IP-1..IP-7, SEC-1..SEC-6 task tables
--   filing_records      — every filing action; each emits a CapitalFlow row via LedgerAdapter
--   acquisition_orders  — domain / mark / asset buy queue (🔴 FutureState triplet, 🟠 naos.ai/coretriangle.com)
--   naming_ratifications — 6 deprecated→ratified mappings (Citizen/Root/Weave/Chorus/Unsworn/MCV Atlas)
--   naming_occurrences  — per-file per-line scan results, classified, approvable in batches
--   naming_batches      — audit-friendly approval/apply batches with pre/post commit SHAs for rollback
--   docs_ingestion_runs — audit of corpus ingestion passes
--
-- Schema notes (cross-checked against existing tables):
--   capital_legal_entity.id is TEXT PRIMARY KEY (e.g. 'mcv-inc-crown'); all entity FKs
--     from this migration use `text references capital_legal_entity(id)`.
--   domain_registry.id is uuid PK; ip_marks.domain_fk uses uuid.
--   epics.id is uuid PK; counsel_tasks.epic_id uses uuid.
--   Storage chunks already exist (vector(768), text-embedding-004) via pgvector 0.8.0.
--
-- RLS posture: authenticated SELECT requires auth.jwt()->>'role' = 'mcv_admin'.
-- Service role bypasses RLS (writes run backend-only through @mcv/foundation-sdk).
-- Foundation data is org-level, not venture-level — no venture_scope predicate.

-- ============================================================================
-- 1. Enum types (idempotent via duplicate_object guard)
-- ============================================================================

do $$ begin create type ip_mark_kind as enum ('trademark','patent','copyright','trade_secret'); exception when duplicate_object then null; end $$;
do $$ begin create type ip_priority_tier as enum ('P0','P1','P2','P3','DNF','PP0','PP1','PP2'); exception when duplicate_object then null; end $$;
do $$ begin create type ip_status as enum ('identified','clearance_in_progress','filed','published','registered','refused','abandoned'); exception when duplicate_object then null; end $$;
do $$ begin create type counsel_workstream as enum ('corp_tax','ip','securities'); exception when duplicate_object then null; end $$;
do $$ begin create type counsel_engagement_status as enum ('prospecting','nda_sent','nda_executed','engagement_letter_sent','engaged','active','paused','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type counsel_task_status as enum ('backlog','proposed','approved','in_progress','review','done','blocked'); exception when duplicate_object then null; end $$;
do $$ begin create type filing_type as enum ('clearance_search','trademark_filing','provisional_patent','utility_patent','copyright_registration','madrid_extension','renewal'); exception when duplicate_object then null; end $$;
do $$ begin create type acquisition_asset_kind as enum ('domain','trademark_purchase','patent_purchase'); exception when duplicate_object then null; end $$;
do $$ begin create type acquisition_urgency_tier as enum ('red_7day','orange_30day','yellow_90day','green_defensive'); exception when duplicate_object then null; end $$;
do $$ begin create type acquisition_status as enum ('scoped','cart','acquired','deferred','killed'); exception when duplicate_object then null; end $$;
do $$ begin create type naming_occurrence_kind as enum ('markdown_prose','code_comment','string_literal','identifier','import_path','type_name','test_name','ui_copy'); exception when duplicate_object then null; end $$;
do $$ begin create type naming_classification as enum ('safe','risky','unsafe','ambiguous'); exception when duplicate_object then null; end $$;
do $$ begin create type naming_approval_status as enum ('pending','approved','rejected','applied'); exception when duplicate_object then null; end $$;
do $$ begin create type naming_context as enum ('prose','identifier','any'); exception when duplicate_object then null; end $$;
do $$ begin create type ingestion_source_kind as enum ('counsel_markdown','csv_portfolio','csv_entities','csv_gaps','csv_carts'); exception when duplicate_object then null; end $$;
do $$ begin create type holding_chain_stage as enum ('interim_mcv_inc','final_root','transferred'); exception when duplicate_object then null; end $$;
do $$ begin create type provisional_draft_status as enum ('unscoped','outline','draft','reviewed','filed'); exception when duplicate_object then null; end $$;
do $$ begin create type patent_filing_vehicle as enum ('counsel_drafted','patent_nlp','hybrid'); exception when duplicate_object then null; end $$;
do $$ begin create type conflicts_check_status as enum ('not_run','clean','conflict_flagged'); exception when duplicate_object then null; end $$;
do $$ begin create type nda_template_kind as enum ('capital','partner'); exception when duplicate_object then null; end $$;
do $$ begin create type ingestion_status as enum ('running','ok','failed'); exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. ip_marks — unified registry of every IP asset (TM / patent / copyright / trade_secret)
-- ============================================================================

create table if not exists ip_marks (
  id uuid primary key default gen_random_uuid(),
  mark_text text not null,
  mark_kind ip_mark_kind not null,
  priority_tier ip_priority_tier not null,
  classes int[] not null default '{}',                 -- Nice classes for TMs
  jurisdictions text[] not null default '{}',          -- 'US','CA','EU','UK','SG','UAE'
  owner_entity_id text references capital_legal_entity(id),
  holding_chain_stage holding_chain_stage not null default 'interim_mcv_inc',
  domain_fk uuid references domain_registry(id),
  status ip_status not null default 'identified',
  filing_number text,
  registration_number text,
  filed_at timestamptz,
  registered_at timestamptz,
  renewal_due timestamptz,
  is_compound boolean not null default false,
  compound_parent_mark_id uuid references ip_marks(id),
  -- Patent-specific extension columns (null unless mark_kind='patent')
  claim_summary text,
  novelty_hook text,
  supporting_artifacts text[] default '{}',
  provisional_draft_status provisional_draft_status,
  filing_vehicle patent_filing_vehicle,
  notes text,
  source_doc text,           -- which counsel doc this was seeded from
  source_section text,       -- e.g. '§1.4', '§2.2'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ip_marks_patent_cols check (
    mark_kind = 'patent'
    or (claim_summary is null and novelty_hook is null
        and provisional_draft_status is null and filing_vehicle is null)
  ),
  constraint ip_marks_mark_tier_kind_unique unique (mark_text, mark_kind, priority_tier)
);

create index if not exists idx_ip_marks_kind on ip_marks(mark_kind);
create index if not exists idx_ip_marks_tier on ip_marks(priority_tier);
create index if not exists idx_ip_marks_status on ip_marks(status);
create index if not exists idx_ip_marks_owner on ip_marks(owner_entity_id);
create index if not exists idx_ip_marks_domain on ip_marks(domain_fk);
create index if not exists idx_ip_marks_compound_parent on ip_marks(compound_parent_mark_id);
create index if not exists idx_ip_marks_holding_stage on ip_marks(holding_chain_stage);

comment on table ip_marks is 'Unified IP registry: trademarks / patents / copyrights / trade secrets. Patent extension columns gated by CHECK constraint. Seeded from MCV-IP-Inventory-v1.1.md.';

-- ============================================================================
-- 3. counsel_engagements — law firms on 3 workstreams
-- ============================================================================

create table if not exists counsel_engagements (
  id uuid primary key default gen_random_uuid(),
  firm_name text not null,
  workstream counsel_workstream not null,
  contact_name text,
  contact_email text,
  status counsel_engagement_status not null default 'prospecting',
  conflicts_check_status conflicts_check_status not null default 'not_run',
  scoping_call_at timestamptz,
  engagement_letter_url text,
  nda_template_used nda_template_kind,
  nda_executed_at timestamptz,
  budget_allocated_usd numeric(14,2) not null default 0,
  budget_consumed_usd numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_counsel_engagements_workstream on counsel_engagements(workstream);
create index if not exists idx_counsel_engagements_status on counsel_engagements(status);

comment on table counsel_engagements is 'Law firm engagements — one per (firm, workstream). Workstream is corp_tax | ip | securities.';

-- ============================================================================
-- 4. counsel_tasks — CT-1..CT-9, IP-1..IP-7, SEC-1..SEC-6
-- ============================================================================

create table if not exists counsel_tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text unique not null,                       -- 'CT-1','IP-3','SEC-2'
  workstream counsel_workstream not null,
  title text not null,
  description text,
  deliverable text,
  depends_on text[] not null default '{}',              -- other task_codes
  critical_path boolean not null default false,
  assigned_engagement_id uuid references counsel_engagements(id) on delete set null,
  status counsel_task_status not null default 'backlog',
  priority int not null default 100,
  due_at timestamptz,
  completed_at timestamptz,
  epic_id uuid references epics(id) on delete set null,
  source_doc text,
  source_section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_counsel_tasks_workstream on counsel_tasks(workstream);
create index if not exists idx_counsel_tasks_status on counsel_tasks(status);
create index if not exists idx_counsel_tasks_engagement on counsel_tasks(assigned_engagement_id);
create index if not exists idx_counsel_tasks_epic on counsel_tasks(epic_id);
create index if not exists idx_counsel_tasks_critical on counsel_tasks(critical_path) where critical_path;

comment on table counsel_tasks is 'Counsel Pack v2.0 task tables — 9 corp/tax + 7 IP + 6 securities = 22 task codes.';

-- ============================================================================
-- 5. filing_records — every filing action emits a CapitalFlow via LedgerAdapter
-- ============================================================================

create table if not exists filing_records (
  id uuid primary key default gen_random_uuid(),
  ip_mark_id uuid not null references ip_marks(id) on delete cascade,
  filing_type filing_type not null,
  jurisdiction text not null,
  filed_at timestamptz,
  filing_number text,
  counsel_engagement_id uuid references counsel_engagements(id) on delete set null,
  fee_filing_usd numeric(14,2) not null default 0,
  fee_counsel_usd numeric(14,2) not null default 0,
  fee_total_usd numeric(14,2) generated always as (fee_filing_usd + fee_counsel_usd) stored,
  status ip_status not null default 'filed',
  notes text,
  capital_flow_id uuid,                                 -- FK to capital flow row (nullable until ledger emits)
  created_at timestamptz not null default now()
);

create index if not exists idx_filing_records_mark on filing_records(ip_mark_id);
create index if not exists idx_filing_records_engagement on filing_records(counsel_engagement_id);
create index if not exists idx_filing_records_type on filing_records(filing_type);

comment on table filing_records is 'Each row = one filing action (clearance / TM filing / provisional / utility / Madrid / renewal). FilingsService emits a CapitalFlow of kind ip_filing_expense on insert via injected LedgerAdapter.';

-- ============================================================================
-- 6. acquisition_orders — domain / mark / asset buy queue
-- ============================================================================

create table if not exists acquisition_orders (
  id uuid primary key default gen_random_uuid(),
  asset_kind acquisition_asset_kind not null,
  asset_identifier text not null,                       -- e.g. 'futurestate.app'
  urgency_tier acquisition_urgency_tier not null,
  target_registrar text,
  price_cad numeric(14,2),
  price_usd numeric(14,2),
  broker_contact text,
  status acquisition_status not null default 'scoped',
  blocks_disclosure boolean not null default false,
  blocks_venture_name text,
  notes text,
  acquired_at timestamptz,
  acquired_registrar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acquisition_orders_asset_unique unique (asset_kind, asset_identifier)
);

create index if not exists idx_acq_orders_urgency on acquisition_orders(urgency_tier);
create index if not exists idx_acq_orders_status on acquisition_orders(status);
create index if not exists idx_acq_orders_blocks_disclosure on acquisition_orders(blocks_disclosure) where blocks_disclosure;

comment on table acquisition_orders is 'Acquisition queue for domains / TM purchases / patent purchases. red_7day tier surfaces 🔴 in DomainPortfolioView.';

-- ============================================================================
-- 7. naming_ratifications — 6 deprecated→ratified mappings
-- ============================================================================

create table if not exists naming_ratifications (
  id uuid primary key default gen_random_uuid(),
  deprecated_name text not null,
  ratified_name text not null,
  context naming_context not null default 'any',
  effective_at timestamptz not null default now(),
  rationale text,
  created_at timestamptz not null default now(),
  constraint naming_ratifications_deprecated_context_unique unique (deprecated_name, context)
);

comment on table naming_ratifications is 'Deprecated→ratified naming mappings. 6 rows seeded per IP Inventory v1.1 §0.1.';

-- Seed the 6 ratified names inline (these are Locked per Tony — no external source needed).
insert into naming_ratifications (deprecated_name, ratified_name, context, rationale) values
  ('Sovereign Citizen', 'Citizen',   'any',  'Brand-risk kill — institutional LPs pattern-match "Sovereign Citizen" to the legal-extremist movement. See IP Inventory §9.3.'),
  ('Covenant',          'Root',      'any',  'Naming ratification per IP Inventory v1.1 §0.1. Root names the Layer 0 Purpose Trust.'),
  ('Confluence',        'Weave',     'any',  'Naming ratification per IP Inventory v1.1 §0.1.'),
  ('Whole',             'Chorus',    'any',  'Naming ratification per IP Inventory v1.1 §0.1.'),
  ('Unhoused',          'Unsworn',   'any',  'Naming ratification per IP Inventory v1.1 §0.1. Distinctive in civic/gaming context.'),
  ('ATLAS',             'MCV Atlas', 'prose','Compound filing strategy per IP Inventory §1.5 — standalone ATLAS faces massive prior art (CERN, MongoDB, etc.). Only rewrite prose occurrences; identifiers like agent id ''atlas'' stay.')
on conflict (deprecated_name, context) do nothing;

-- ============================================================================
-- 8. naming_batches — audit-friendly approval/apply batches with rollback support
-- ============================================================================

create table if not exists naming_batches (
  id uuid primary key default gen_random_uuid(),
  approved_by text,
  approved_at timestamptz,
  applied_at timestamptz,
  commit_sha text,                                      -- post-apply commit
  pre_commit_sha text,                                  -- recorded before apply for rollback
  occurrence_count int not null default 0,
  rollback_of uuid references naming_batches(id),       -- self-FK: if this batch reverts another
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_naming_batches_applied on naming_batches(applied_at);
create index if not exists idx_naming_batches_rollback on naming_batches(rollback_of);

comment on table naming_batches is 'Groups approved naming_occurrences into a single git commit. pre_commit_sha enables rollback.';

-- ============================================================================
-- 9. naming_occurrences — per-file per-line scan results, classified, approvable
-- ============================================================================

create table if not exists naming_occurrences (
  id uuid primary key default gen_random_uuid(),
  ratification_id uuid not null references naming_ratifications(id) on delete cascade,
  file_path text not null,
  line_number int not null,
  column_number int not null,
  context_before text,
  match_text text not null,
  context_after text,
  occurrence_kind naming_occurrence_kind not null,
  classification naming_classification not null default 'ambiguous',
  proposed_replacement text,
  approval_status naming_approval_status not null default 'pending',
  approved_by text,
  approved_at timestamptz,
  applied_at timestamptz,
  commit_sha text,
  batch_id uuid references naming_batches(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_naming_occ_ratification on naming_occurrences(ratification_id);
create index if not exists idx_naming_occ_status on naming_occurrences(approval_status);
create index if not exists idx_naming_occ_file on naming_occurrences(file_path);
create index if not exists idx_naming_occ_batch on naming_occurrences(batch_id);
create index if not exists idx_naming_occ_classification on naming_occurrences(classification);

comment on table naming_occurrences is 'Per-file per-line scan output. Classification drives whether a row is auto-approvable (safe) or requires override (unsafe).';

-- ============================================================================
-- 10. docs_ingestion_runs — audit of corpus ingestion passes
-- ============================================================================

create table if not exists docs_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_path text not null,
  source_kind ingestion_source_kind not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_inserted int not null default 0,
  chunks_embedded int not null default 0,
  status ingestion_status not null default 'running',
  error_log text
);

create index if not exists idx_ingestion_runs_path on docs_ingestion_runs(source_path, started_at desc);
create index if not exists idx_ingestion_runs_status on docs_ingestion_runs(status);

comment on table docs_ingestion_runs is 'Audit trail of counsel-corpus ingestion runs. Append-only — one row per run per source file.';

-- ============================================================================
-- 11. RLS — authenticated select requires mcv_admin role; service role bypasses
-- ============================================================================

alter table ip_marks             enable row level security;
alter table counsel_engagements  enable row level security;
alter table counsel_tasks        enable row level security;
alter table filing_records       enable row level security;
alter table acquisition_orders   enable row level security;
alter table naming_ratifications enable row level security;
alter table naming_occurrences   enable row level security;
alter table naming_batches       enable row level security;
alter table docs_ingestion_runs  enable row level security;

-- Drop-then-create pattern since Postgres doesn't support "create policy if not exists"
drop policy if exists "ip_marks_admin_select" on ip_marks;
create policy "ip_marks_admin_select" on ip_marks
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "counsel_engagements_admin_select" on counsel_engagements;
create policy "counsel_engagements_admin_select" on counsel_engagements
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "counsel_tasks_admin_select" on counsel_tasks;
create policy "counsel_tasks_admin_select" on counsel_tasks
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "filing_records_admin_select" on filing_records;
create policy "filing_records_admin_select" on filing_records
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "acquisition_orders_admin_select" on acquisition_orders;
create policy "acquisition_orders_admin_select" on acquisition_orders
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

-- naming_ratifications is effectively public-read for authenticated users
-- (the 6 mappings are already external-facing brand updates); scan results stay admin.
drop policy if exists "naming_ratifications_authenticated_select" on naming_ratifications;
create policy "naming_ratifications_authenticated_select" on naming_ratifications
  for select to authenticated
  using (true);

drop policy if exists "naming_occurrences_admin_select" on naming_occurrences;
create policy "naming_occurrences_admin_select" on naming_occurrences
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "naming_batches_admin_select" on naming_batches;
create policy "naming_batches_admin_select" on naming_batches
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

drop policy if exists "docs_ingestion_runs_admin_select" on docs_ingestion_runs;
create policy "docs_ingestion_runs_admin_select" on docs_ingestion_runs
  for select to authenticated
  using ((auth.jwt() ->> 'role') = 'mcv_admin');

-- ============================================================================
-- 12. updated_at triggers — match the convention used by capital_legal_entity
-- ============================================================================

create or replace function foundation_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ip_marks_updated on ip_marks;
create trigger trg_ip_marks_updated before update on ip_marks
  for each row execute function foundation_touch_updated_at();

drop trigger if exists trg_counsel_engagements_updated on counsel_engagements;
create trigger trg_counsel_engagements_updated before update on counsel_engagements
  for each row execute function foundation_touch_updated_at();

drop trigger if exists trg_counsel_tasks_updated on counsel_tasks;
create trigger trg_counsel_tasks_updated before update on counsel_tasks
  for each row execute function foundation_touch_updated_at();

drop trigger if exists trg_acquisition_orders_updated on acquisition_orders;
create trigger trg_acquisition_orders_updated before update on acquisition_orders
  for each row execute function foundation_touch_updated_at();

-- ============================================================================
-- End of migration-foundation-os-v1-2026-04-22.sql
-- Expected post-ingestion counts:
--   ip_marks: ~108 (75 TM + 13 patent + 20 copyright)
--   counsel_engagements: 3 (Corp/Tax, IP, Securities — status='prospecting')
--   counsel_tasks: 22 (9 CT + 7 IP + 6 SEC)
--   acquisition_orders: 5 🔴🟠 + deferred rows for 🟡🟢
--   naming_ratifications: 6 (seeded above, locked)
--   domain_registry: upsert to 111 total (28 owned + 83 pending)
--   epics: +23 (1 Foundation OS v1 parent + 22 counsel_tasks children)
-- ============================================================================
