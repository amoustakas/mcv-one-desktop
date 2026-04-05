-- MCV One Desktop — Sequential Memory System Migration
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Creates tables for: session event log, project memory hub

-- =========================================================================
-- Session Events — sequential event log per session
-- =========================================================================

create table if not exists session_events (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null,
  user_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  venture_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_events_session_created
  on session_events(session_id, created_at desc);
create index if not exists idx_session_events_user_type
  on session_events(user_id, event_type);

alter table session_events enable row level security;
create policy "Allow all session_events read" on session_events for select using (true);
create policy "Allow all session_events write" on session_events for all using (true) with check (true);

-- =========================================================================
-- Project Memory — shared key-value memory hub across sessions
-- =========================================================================

create table if not exists project_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  memory_type text not null,
  key text not null,
  value jsonb not null default '{}',
  session_id text,
  venture_id text,
  ttl_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_project_memory_user_key unique (user_id, key)
);

create index if not exists idx_project_memory_user_type
  on project_memory(user_id, memory_type);
create index if not exists idx_project_memory_venture
  on project_memory(venture_id);

alter table project_memory enable row level security;
create policy "Allow all project_memory read" on project_memory for select using (true);
create policy "Allow all project_memory write" on project_memory for all using (true) with check (true);
