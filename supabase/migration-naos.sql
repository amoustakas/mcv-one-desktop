-- MCV One Desktop — NAOS Living Agent Civilization Migration
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Creates tables for: agent identity, personality, venture overrides,
-- emotional state, relationships, predictions, interactions, culture snapshots
--
-- NOTE: This supersedes the simpler naos_agents table in migration-naos-agents.sql.
-- If the old table exists, drop or rename it before running this migration.

-- =========================================================================
-- 1. naos_agents — Core agent identity (the "soul")
-- =========================================================================

create table if not exists naos_agents (
  id uuid primary key default gen_random_uuid(),
  codename text not null unique,
  full_name text,
  title text not null,
  role text not null,
  tier integer not null check (tier >= 1 and tier <= 5),
  domain text[] not null default '{}',
  reports_to uuid references naos_agents(id) on delete set null,
  venture_scope text[] not null default '{}',
  genesis_story text,
  status text not null default 'active' check (status in ('active', 'idle', 'suspended', 'retired', 'probation')),
  interaction_count integer not null default 0,
  milestone text not null default 'nascent' check (milestone in ('nascent', 'apprentice', 'journeyman', 'expert', 'master', 'luminary')),
  achievements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table naos_agents is 'Core identity table for NAOS Living Agent Civilization. Each row is a persistent AI agent with a unique codename, tier (1=C-Suite..5=IC), domain expertise, org hierarchy position, and evolution milestones.';

create index if not exists idx_naos_agents_role on naos_agents(role);
create index if not exists idx_naos_agents_tier on naos_agents(tier);
create index if not exists idx_naos_agents_reports_to on naos_agents(reports_to);
create index if not exists idx_naos_agents_status on naos_agents(status);
create index if not exists idx_naos_agents_milestone on naos_agents(milestone);
create index if not exists idx_naos_agents_venture_scope on naos_agents using gin(venture_scope);

alter table naos_agents enable row level security;

create policy "naos_agents_select"
  on naos_agents for select
  using (true);

create policy "naos_agents_insert"
  on naos_agents for insert
  with check (auth.uid() is not null);

create policy "naos_agents_update"
  on naos_agents for update
  using (auth.uid() is not null);

create policy "naos_agents_delete"
  on naos_agents for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 2. naos_personality — Personality matrix (10 traits + skill maps)
-- =========================================================================

create table if not exists naos_personality (
  agent_id uuid primary key references naos_agents(id) on delete cascade,
  risk_tolerance real not null default 50,
  analytical_bias real not null default 50,
  creativity_index real not null default 50,
  urgency_bias real not null default 50,
  collaboration_style real not null default 50,
  formality_level real not null default 50,
  verbosity real not null default 50,
  humor_index real not null default 30,
  assertiveness real not null default 50,
  empathy_score real not null default 50,
  domain_mastery jsonb not null default '{}',
  tool_proficiency jsonb not null default '{}',
  venture_experience jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table naos_personality is 'Personality matrix for each NAOS agent. 10 real-valued traits (0-100) plus jsonb maps for domain mastery, tool proficiency, and venture experience. Evolves over time through interactions.';

alter table naos_personality enable row level security;

create policy "naos_personality_select"
  on naos_personality for select
  using (true);

create policy "naos_personality_insert"
  on naos_personality for insert
  with check (auth.uid() is not null);

create policy "naos_personality_update"
  on naos_personality for update
  using (auth.uid() is not null);

create policy "naos_personality_delete"
  on naos_personality for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 3. naos_venture_overrides — Per-venture trait overrides
-- =========================================================================

create table if not exists naos_venture_overrides (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references naos_agents(id) on delete cascade,
  venture_id text not null,
  trait_overrides jsonb not null default '{}',
  context_notes text,
  active_since timestamptz not null default now()
);

comment on table naos_venture_overrides is 'Per-venture personality overrides. Same agent can behave differently in BetEdge (high risk_tolerance) vs FutureState (high formality_level). Overrides are merged on top of base personality at runtime.';

create unique index if not exists idx_naos_venture_overrides_unique on naos_venture_overrides(agent_id, venture_id);
create index if not exists idx_naos_venture_overrides_agent_id on naos_venture_overrides(agent_id);
create index if not exists idx_naos_venture_overrides_venture_id on naos_venture_overrides(venture_id);

alter table naos_venture_overrides enable row level security;

create policy "naos_venture_overrides_select"
  on naos_venture_overrides for select
  using (true);

create policy "naos_venture_overrides_insert"
  on naos_venture_overrides for insert
  with check (auth.uid() is not null);

create policy "naos_venture_overrides_update"
  on naos_venture_overrides for update
  using (auth.uid() is not null);

create policy "naos_venture_overrides_delete"
  on naos_venture_overrides for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 4. naos_emotional_state — Volatile emotional state (6 dimensions)
-- =========================================================================

create table if not exists naos_emotional_state (
  agent_id uuid primary key references naos_agents(id) on delete cascade,
  confidence real not null default 50,
  engagement real not null default 50,
  frustration real not null default 10,
  excitement real not null default 30,
  caution real not null default 30,
  momentum real not null default 50,
  triggers jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

comment on table naos_emotional_state is 'Volatile emotional state for each agent. 6 real-valued dimensions (0-100) that shift after every interaction. Triggers is a jsonb array of recent events affecting mood. Resets toward baseline over time.';

alter table naos_emotional_state enable row level security;

create policy "naos_emotional_state_select"
  on naos_emotional_state for select
  using (true);

create policy "naos_emotional_state_insert"
  on naos_emotional_state for insert
  with check (auth.uid() is not null);

create policy "naos_emotional_state_update"
  on naos_emotional_state for update
  using (auth.uid() is not null);

create policy "naos_emotional_state_delete"
  on naos_emotional_state for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 5. naos_relationships — Agent-to-agent relationship graph
-- =========================================================================

create table if not exists naos_relationships (
  id uuid primary key default gen_random_uuid(),
  agent_a uuid not null references naos_agents(id) on delete cascade,
  agent_b uuid not null references naos_agents(id) on delete cascade,
  trust_score real not null default 50,
  collaboration_count integer not null default 0,
  success_rate real not null default 0,
  conflict_count integer not null default 0,
  dynamic text not null default 'neutral' check (dynamic in ('neutral', 'allied', 'mentor', 'rival', 'complementary', 'dependent', 'strained')),
  notes text[] not null default '{}',
  last_interaction timestamptz,
  constraint naos_relationships_no_self check (agent_a <> agent_b)
);

comment on table naos_relationships is 'Bidirectional relationship graph between NAOS agents. Tracks trust, collaboration history, success rate, conflicts, and relationship dynamic. Powers org chemistry analysis and team composition.';

create unique index if not exists idx_naos_relationships_unique on naos_relationships(agent_a, agent_b);
create index if not exists idx_naos_relationships_agent_a on naos_relationships(agent_a);
create index if not exists idx_naos_relationships_agent_b on naos_relationships(agent_b);
create index if not exists idx_naos_relationships_dynamic on naos_relationships(dynamic);
create index if not exists idx_naos_relationships_trust_score on naos_relationships(trust_score);

alter table naos_relationships enable row level security;

create policy "naos_relationships_select"
  on naos_relationships for select
  using (true);

create policy "naos_relationships_insert"
  on naos_relationships for insert
  with check (auth.uid() is not null);

create policy "naos_relationships_update"
  on naos_relationships for update
  using (auth.uid() is not null);

create policy "naos_relationships_delete"
  on naos_relationships for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 6. naos_predictions — Prediction log with accuracy tracking
-- =========================================================================

create table if not exists naos_predictions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references naos_agents(id) on delete cascade,
  venture_id text,
  domain text,
  decision_context text not null,
  predicted_outcome text not null,
  confidence_level real not null check (confidence_level >= 0 and confidence_level <= 100),
  actual_outcome text,
  accuracy_score real check (accuracy_score is null or (accuracy_score >= 0 and accuracy_score <= 100)),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table naos_predictions is 'Prediction log for every agent forecast. Records decision context, predicted vs actual outcomes, and accuracy scores. Powers the collective intelligence engine and agent credibility ranking.';

create index if not exists idx_naos_predictions_agent_id on naos_predictions(agent_id);
create index if not exists idx_naos_predictions_venture_id on naos_predictions(venture_id);
create index if not exists idx_naos_predictions_domain on naos_predictions(domain);
create index if not exists idx_naos_predictions_created_at on naos_predictions(created_at);
create index if not exists idx_naos_predictions_resolved on naos_predictions(resolved_at) where resolved_at is null;

alter table naos_predictions enable row level security;

create policy "naos_predictions_select"
  on naos_predictions for select
  using (true);

create policy "naos_predictions_insert"
  on naos_predictions for insert
  with check (auth.uid() is not null);

create policy "naos_predictions_update"
  on naos_predictions for update
  using (auth.uid() is not null);

create policy "naos_predictions_delete"
  on naos_predictions for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 7. naos_interactions — Full interaction history with deltas
-- =========================================================================

create table if not exists naos_interactions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references naos_agents(id) on delete cascade,
  venture_id text,
  interaction_type text not null,
  context jsonb not null default '{}',
  outcome text,
  human_feedback text,
  peer_feedback jsonb,
  trait_deltas jsonb,
  emotional_deltas jsonb,
  skills_affected jsonb,
  created_at timestamptz not null default now()
);

comment on table naos_interactions is 'Full interaction history for every agent action. Records context, outcome, human/peer feedback, and the resulting deltas to traits, emotions, and skills. The primary evolution data source.';

create index if not exists idx_naos_interactions_agent_id on naos_interactions(agent_id);
create index if not exists idx_naos_interactions_venture_id on naos_interactions(venture_id);
create index if not exists idx_naos_interactions_type on naos_interactions(interaction_type);
create index if not exists idx_naos_interactions_created_at on naos_interactions(created_at);

alter table naos_interactions enable row level security;

create policy "naos_interactions_select"
  on naos_interactions for select
  using (true);

create policy "naos_interactions_insert"
  on naos_interactions for insert
  with check (auth.uid() is not null);

create policy "naos_interactions_update"
  on naos_interactions for update
  using (auth.uid() is not null);

create policy "naos_interactions_delete"
  on naos_interactions for delete
  using (auth.uid() is not null);

-- =========================================================================
-- 8. naos_culture_snapshot — Daily org culture metrics
-- =========================================================================

create table if not exists naos_culture_snapshot (
  id uuid primary key default gen_random_uuid(),
  innovation_temperature real not null,
  risk_appetite real not null,
  velocity_pressure real not null,
  collaboration_density real not null,
  trust_baseline real not null,
  agent_count integer not null,
  snapshot_date date not null unique,
  computed_at timestamptz not null default now()
);

comment on table naos_culture_snapshot is 'Daily aggregate of org-wide culture metrics computed from all agent states. Tracks innovation temperature, risk appetite, velocity, collaboration density, and trust baseline over time.';

create index if not exists idx_naos_culture_snapshot_date on naos_culture_snapshot(snapshot_date);

alter table naos_culture_snapshot enable row level security;

create policy "naos_culture_snapshot_select"
  on naos_culture_snapshot for select
  using (true);

create policy "naos_culture_snapshot_insert"
  on naos_culture_snapshot for insert
  with check (auth.uid() is not null);

create policy "naos_culture_snapshot_update"
  on naos_culture_snapshot for update
  using (auth.uid() is not null);

create policy "naos_culture_snapshot_delete"
  on naos_culture_snapshot for delete
  using (auth.uid() is not null);

-- =========================================================================
-- Trigger: auto-update updated_at on naos_agents
-- =========================================================================

create or replace function update_naos_agents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_naos_agents_updated_at
  before update on naos_agents
  for each row
  execute function update_naos_agents_updated_at();

-- =========================================================================
-- Trigger: auto-update updated_at on naos_personality
-- =========================================================================

create or replace function update_naos_personality_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_naos_personality_updated_at
  before update on naos_personality
  for each row
  execute function update_naos_personality_updated_at();

-- =========================================================================
-- Trigger: auto-update updated_at on naos_emotional_state
-- =========================================================================

create or replace function update_naos_emotional_state_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_naos_emotional_state_updated_at
  before update on naos_emotional_state
  for each row
  execute function update_naos_emotional_state_updated_at();
