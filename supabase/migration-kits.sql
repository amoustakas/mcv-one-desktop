-- MCV One Desktop — Kit System Migration
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Creates tables for: kit registry, user installations, audit logging, shared context

-- =========================================================================
-- Kit Registry — stores published kits available for installation
-- =========================================================================

create table if not exists kits (
  id uuid primary key default uuid_generate_v4(),
  kit_id text unique not null,
  name text not null,
  version text not null default '1.0.0',
  description text not null default '',
  author text not null default 'Unknown',
  manifest jsonb not null,
  bundle_path text not null default '',
  downloads integer not null default 0,
  status text not null default 'published' check (status in ('published', 'draft', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kits_status on kits(status);
create index if not exists idx_kits_downloads on kits(downloads desc);

alter table kits enable row level security;
create policy "Allow all kits read" on kits for select using (true);
create policy "Allow all kits write" on kits for all using (true) with check (true);

-- =========================================================================
-- User Kit Installations — tracks which kits each user has installed
-- =========================================================================

create table if not exists user_kits (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  kit_id text not null references kits(kit_id) on delete cascade,
  enabled boolean not null default true,
  config jsonb not null default '{}',
  installed_at timestamptz not null default now(),
  unique(user_id, kit_id)
);

create index if not exists idx_user_kits_user on user_kits(user_id);
create index if not exists idx_user_kits_kit on user_kits(kit_id);

alter table user_kits enable row level security;
create policy "Allow all user_kits" on user_kits for all using (true) with check (true);

-- =========================================================================
-- Kit Audit Log — execution telemetry for debugging and trust scoring
-- =========================================================================

create table if not exists kit_audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  kit_id text not null,
  tool_name text not null,
  duration_ms integer default 0,
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_kit_audit_user on kit_audit_log(user_id, created_at desc);
create index if not exists idx_kit_audit_kit on kit_audit_log(kit_id, created_at desc);

alter table kit_audit_log enable row level security;
create policy "Allow all kit_audit_log" on kit_audit_log for all using (true) with check (true);

-- =========================================================================
-- Kit Shared Context — inter-kit communication key-value store
-- =========================================================================

create table if not exists kit_context (
  key text primary key,
  value jsonb not null,
  kit_id text not null,
  venture_id text,
  user_id text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_kit_context_kit on kit_context(kit_id);
create index if not exists idx_kit_context_user on kit_context(user_id);
create index if not exists idx_kit_context_venture on kit_context(venture_id);

alter table kit_context enable row level security;
create policy "Allow all kit_context" on kit_context for all using (true) with check (true);

-- =========================================================================
-- Helper function: increment kit download count (used by registry API)
-- =========================================================================

create or replace function increment_kit_downloads(p_kit_id text)
returns void as $$
begin
  update kits set downloads = downloads + 1, updated_at = now()
  where kit_id = p_kit_id;
end;
$$ language plpgsql;

-- =========================================================================
-- Add metadata column to messages table (for tool call logs)
-- =========================================================================

alter table messages add column if not exists metadata jsonb default null;

-- =========================================================================
-- Notifications for kit events (uses existing notifications table if present)
-- =========================================================================

-- Insert a sample notification when this migration runs
insert into notifications (type, title, description, source, venture_id)
values ('info', 'Kit System Ready', 'The Agent-First Kit System has been initialized. Use /kits to see loaded kits.', 'system', 'mcv')
on conflict do nothing;
