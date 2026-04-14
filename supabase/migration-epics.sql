-- MCV One Desktop — Task/Epic Pipeline Migration
-- Introduces the epic → story → task hierarchy that powers the NAOS-driven build flywheel.
--
-- Hierarchy: epic > story > task (task table already exists from earlier schema)
-- Run in Supabase SQL Editor AFTER migration-naos.sql (references naos_agents).

-- =========================================================================
-- 1. epics — top-level work items spanning multiple stories
-- =========================================================================

create table if not exists epics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  spec_md text,
  venture_id text,
  suite text,
  owner_agent uuid references naos_agents(id) on delete set null,
  created_by text,
  status text not null default 'draft' check (status in ('draft', 'proposed', 'approved', 'in-progress', 'blocked', 'review', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  priority_order integer not null default 100,
  progress_pct integer not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  target_completion timestamptz,
  tags text[] not null default '{}',
  linked_docs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table epics is 'Top-level work items. NAOS agents can draft epics via naos_propose_epic. Tony approves at checkpoints. Epics decompose into stories, stories into tasks.';

create index if not exists idx_epics_venture on epics(venture_id);
create index if not exists idx_epics_suite on epics(suite);
create index if not exists idx_epics_owner_agent on epics(owner_agent);
create index if not exists idx_epics_status on epics(status);
create index if not exists idx_epics_priority on epics(priority);
create index if not exists idx_epics_created_at on epics(created_at desc);
create index if not exists idx_epics_tags on epics using gin(tags);

alter table epics enable row level security;

create policy "epics_select" on epics for select using (true);
create policy "epics_insert" on epics for insert with check (auth.uid() is not null);
create policy "epics_update" on epics for update using (auth.uid() is not null);
create policy "epics_delete" on epics for delete using (auth.uid() is not null);

-- =========================================================================
-- 2. stories — mid-level work units assigned to a single agent
-- =========================================================================

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  epic_id uuid not null references epics(id) on delete cascade,
  title text not null,
  description text,
  acceptance_criteria text[] not null default '{}',
  assigned_agent uuid references naos_agents(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'blocked', 'done', 'cancelled')),
  priority_order integer not null default 100,
  artifacts jsonb not null default '[]',
  kit_invocations jsonb not null default '[]',
  estimated_effort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table stories is 'Mid-level units of an epic. Each story is assigned to one NAOS agent and has concrete acceptance criteria. Artifacts array records produced files/URLs; kit_invocations tracks which tools the agent used.';

create index if not exists idx_stories_epic on stories(epic_id);
create index if not exists idx_stories_assigned_agent on stories(assigned_agent);
create index if not exists idx_stories_status on stories(status);
create index if not exists idx_stories_created_at on stories(created_at desc);

alter table stories enable row level security;

create policy "stories_select" on stories for select using (true);
create policy "stories_insert" on stories for insert with check (auth.uid() is not null);
create policy "stories_update" on stories for update using (auth.uid() is not null);
create policy "stories_delete" on stories for delete using (auth.uid() is not null);

-- =========================================================================
-- 3. epic_checkpoints — approval gates between phases
-- =========================================================================

create table if not exists epic_checkpoints (
  id uuid primary key default gen_random_uuid(),
  epic_id uuid not null references epics(id) on delete cascade,
  checkpoint_type text not null check (checkpoint_type in ('spec-review', 'design-review', 'pre-commit', 'pre-merge', 'pre-deploy', 'post-deploy', 'custom')),
  title text not null,
  description text,
  required_approvers text[] not null default '{}',
  approved_by text[] not null default '{}',
  state text not null default 'pending' check (state in ('pending', 'awaiting-review', 'approved', 'rejected', 'skipped')),
  decision_notes text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table epic_checkpoints is 'Human-in-the-loop approval gates attached to epic lifecycle. Works with HITLModal to pause agent execution until Tony (or delegated approvers) sign off.';

create index if not exists idx_checkpoints_epic on epic_checkpoints(epic_id);
create index if not exists idx_checkpoints_state on epic_checkpoints(state);
create index if not exists idx_checkpoints_type on epic_checkpoints(checkpoint_type);
create index if not exists idx_checkpoints_pending on epic_checkpoints(resolved_at) where resolved_at is null;

alter table epic_checkpoints enable row level security;

create policy "checkpoints_select" on epic_checkpoints for select using (true);
create policy "checkpoints_insert" on epic_checkpoints for insert with check (auth.uid() is not null);
create policy "checkpoints_update" on epic_checkpoints for update using (auth.uid() is not null);
create policy "checkpoints_delete" on epic_checkpoints for delete using (auth.uid() is not null);

-- =========================================================================
-- 4. extend existing tasks table with epic/story linkage
-- =========================================================================

-- Idempotent column adds; tasks table already exists from earlier schema.
alter table if exists tasks
  add column if not exists epic_id uuid references epics(id) on delete set null,
  add column if not exists story_id uuid references stories(id) on delete set null,
  add column if not exists assigned_agent uuid references naos_agents(id) on delete set null,
  add column if not exists kit_invocations jsonb not null default '[]',
  add column if not exists outputs jsonb not null default '[]';

create index if not exists idx_tasks_epic on tasks(epic_id);
create index if not exists idx_tasks_story on tasks(story_id);
create index if not exists idx_tasks_assigned_agent on tasks(assigned_agent);

-- =========================================================================
-- 5. updated_at triggers (mirror existing pattern from migration-naos.sql)
-- =========================================================================

create or replace function update_epics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_epics_updated_at on epics;
create trigger trg_epics_updated_at before update on epics
  for each row execute function update_epics_updated_at();

create or replace function update_stories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_stories_updated_at on stories;
create trigger trg_stories_updated_at before update on stories
  for each row execute function update_stories_updated_at();

-- =========================================================================
-- 6. progress auto-roll-up: update epic.progress_pct when child stories change
-- =========================================================================

create or replace function recompute_epic_progress()
returns trigger as $$
declare
  target_epic uuid;
  total_count integer;
  done_count integer;
begin
  target_epic := coalesce(new.epic_id, old.epic_id);
  if target_epic is null then return coalesce(new, old); end if;

  select count(*), count(*) filter (where status = 'done')
    into total_count, done_count
    from stories where epic_id = target_epic;

  update epics
    set progress_pct = case when total_count = 0 then 0 else round((done_count::numeric / total_count::numeric) * 100)::integer end,
        completed_at = case when total_count > 0 and done_count = total_count then now() else null end,
        status = case when total_count > 0 and done_count = total_count then 'done' else status end
    where id = target_epic;

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_stories_epic_progress on stories;
create trigger trg_stories_epic_progress
  after insert or update or delete on stories
  for each row execute function recompute_epic_progress();

-- =========================================================================
-- 7. realtime publication (match existing pattern)
-- =========================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table epics;
    alter publication supabase_realtime add table stories;
    alter publication supabase_realtime add table epic_checkpoints;
  end if;
exception when duplicate_object then null;
end $$;
