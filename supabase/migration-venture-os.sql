-- MCV One Desktop — Venture OS Migration
-- Elevates the `ventures` table into the tenancy/workspace primitive.
-- Adds: tier hierarchy, Clerk org linkage, custom domains, white-label, doc namespace,
--       venture_assets, xp columns on epics/stories/tasks, venture_quests matview.
--
-- Idempotent and defensive: `ventures` table was created ad-hoc in prod,
-- so we CREATE IF NOT EXISTS on the table and ADD IF NOT EXISTS on every column.
-- Run AFTER migration-epics.sql.

-- =========================================================================
-- 1. ventures — defensive base definition + extensions
-- =========================================================================

create table if not exists ventures (
  id text primary key,
  name text not null,
  tagline text,
  description text,
  icon text,
  color text,
  accent text,
  domain text,
  type text,
  status text default 'concept' check (status in ('active', 'development', 'planned', 'concept')),
  system_prompt text,
  socials jsonb default '{}'::jsonb,
  team jsonb default '[]'::jsonb,
  tech_stack text[] default '{}',
  founded text,
  funding_stage text,
  category text,
  competitors text[] default '{}',
  key_metrics jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Venture OS extensions
alter table ventures add column if not exists clerk_org_id text unique;
alter table ventures add column if not exists tier smallint default 1 check (tier between 1 and 3);
alter table ventures add column if not exists parent_venture_id text references ventures(id);
alter table ventures add column if not exists custom_domains jsonb not null default '[]'::jsonb;
alter table ventures add column if not exists white_label jsonb not null default '{}'::jsonb;
alter table ventures add column if not exists doc_namespace text;
alter table ventures add column if not exists quest_state jsonb not null default '{}'::jsonb;

comment on column ventures.clerk_org_id is 'Null while venture uses shared root org (EdgeIQ Holdings). Set once venture is promoted to dedicated Clerk tenant.';
comment on column ventures.tier is '1=portfolio lead (MCV One), 2=branded sub-platform (mcv.gg, MCV Dev), 3=supporting asset (prototype repos, internal tools).';
comment on column ventures.custom_domains is 'Array of domain objects with {host, status, verified_at, vercel_id}.';
comment on column ventures.white_label is 'Clerk appearance + brand overrides applied on org switch.';
comment on column ventures.quest_state is 'Lightweight denormalized wizard progress (source of truth = Epic tree).';

create index if not exists idx_ventures_parent on ventures(parent_venture_id);
create index if not exists idx_ventures_tier on ventures(tier);
create index if not exists idx_ventures_clerk_org on ventures(clerk_org_id) where clerk_org_id is not null;

-- RLS: dual-mode. Org-scoped when clerk_org_id is set; otherwise open (UI layer handles venture_assignments).
-- The fallback to team_members.venture_assignments is enforced at the API layer
-- because the JWT claim for org_id may be absent for users in the root org.
alter table ventures enable row level security;

drop policy if exists "ventures_select" on ventures;
create policy "ventures_select" on ventures for select using (
  clerk_org_id is null
  or (auth.jwt() ->> 'org_id') = clerk_org_id
);

drop policy if exists "ventures_mutate" on ventures;
create policy "ventures_mutate" on ventures for all using (
  auth.uid() is not null
  and (clerk_org_id is null or (auth.jwt() ->> 'org_id') = clerk_org_id)
) with check (
  auth.uid() is not null
  and (clerk_org_id is null or (auth.jwt() ->> 'org_id') = clerk_org_id)
);

-- =========================================================================
-- 2. venture_assets — Tier 1/2/3 related assets (repos, apps, domains, socials)
-- =========================================================================

create table if not exists venture_assets (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references ventures(id) on delete cascade,
  kind text not null check (kind in ('repo', 'app', 'domain', 'doc', 'integration', 'social', 'workspace')),
  name text not null,
  url text,
  meta jsonb not null default '{}'::jsonb,
  tier smallint not null default 2 check (tier between 1 and 3),
  discovered boolean not null default false,
  confirmed boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table venture_assets is 'Related assets graph for a venture. `discovered=true, confirmed=false` = auto-suggested by asset-discovery service, awaiting user confirmation.';

create index if not exists idx_venture_assets_venture on venture_assets(venture_id, tier);
create index if not exists idx_venture_assets_kind on venture_assets(kind);
create index if not exists idx_venture_assets_pending on venture_assets(venture_id) where discovered and not confirmed;

alter table venture_assets enable row level security;

drop policy if exists "venture_assets_select" on venture_assets;
create policy "venture_assets_select" on venture_assets for select using (
  exists (
    select 1 from ventures v
    where v.id = venture_assets.venture_id
      and (v.clerk_org_id is null or (auth.jwt() ->> 'org_id') = v.clerk_org_id)
  )
);

drop policy if exists "venture_assets_mutate" on venture_assets;
create policy "venture_assets_mutate" on venture_assets for all using (
  auth.uid() is not null
) with check (
  auth.uid() is not null
);

create or replace function update_venture_assets_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_venture_assets_updated_at on venture_assets;
create trigger trg_venture_assets_updated_at before update on venture_assets
  for each row execute function update_venture_assets_updated_at();

-- =========================================================================
-- 3. XP columns on Epic hierarchy (gamification source data)
-- =========================================================================

alter table epics add column if not exists xp integer not null default 0 check (xp >= 0);
alter table stories add column if not exists xp integer not null default 0 check (xp >= 0);
alter table tasks add column if not exists xp integer not null default 0 check (xp >= 0);

-- Backfill xp from artifacts jsonb where the seed script stashed it
-- Shape: artifacts = [{"kind":"plan-xp","xp":40}, ...]
update stories
set xp = coalesce((
  select (a->>'xp')::int
  from jsonb_array_elements(artifacts) a
  where a->>'kind' = 'plan-xp'
  limit 1
), xp)
where xp = 0 and artifacts is not null;

-- Backfill epic xp from sum of story xp if epic.xp is still 0
update epics e
set xp = s.total
from (select epic_id, sum(xp) as total from stories group by epic_id) s
where e.id = s.epic_id and e.xp = 0 and s.total > 0;

-- =========================================================================
-- 4. venture_quests — materialized view projecting Epic tree into quest log
-- =========================================================================

drop materialized view if exists venture_quests;
create materialized view venture_quests as
select
  e.venture_id,
  e.id                      as epic_id,
  e.title                   as epic_title,
  e.status                  as epic_status,
  e.progress_pct            as epic_progress,
  e.xp                      as epic_xp,
  s.id                      as story_id,
  s.title                   as story_title,
  s.status                  as story_status,
  s.xp                      as story_xp,
  t.id                      as task_id,
  t.title                   as task_title,
  t.status                  as task_status,
  t.xp                      as task_xp,
  coalesce(t.status, s.status, e.status)  as effective_status,
  coalesce(t.xp, s.xp, e.xp, 0)           as effective_xp
from epics e
left join stories s on s.epic_id = e.id
left join tasks t   on t.story_id = s.id
where e.venture_id is not null;

create index if not exists idx_venture_quests_venture on venture_quests(venture_id);
create index if not exists idx_venture_quests_status  on venture_quests(venture_id, effective_status);

-- Refresh hook: trigger-based refresh is expensive; instead expose an RPC
-- that clients (or a background worker) call after material Epic/Story/Task updates.
create or replace function refresh_venture_quests()
returns void as $$
begin
  refresh materialized view venture_quests;
end;
$$ language plpgsql;

-- =========================================================================
-- 5. updated_at trigger on ventures
-- =========================================================================

create or replace function update_ventures_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_ventures_updated_at on ventures;
create trigger trg_ventures_updated_at before update on ventures
  for each row execute function update_ventures_updated_at();

-- =========================================================================
-- 6. Realtime publication additions
-- =========================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table ventures;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table venture_assets;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
