-- MCV One Desktop — OAuth Connections Table
-- Run this in your Supabase SQL Editor after schema.sql

-- OAuth connections: encrypted token storage per user per provider
create table if not exists oauth_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  provider text not null check (provider in ('github', 'google', 'notion', 'cloudflare')),
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  provider_user_id text not null,
  provider_user_name text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_user_provider unique (user_id, provider)
);

-- Indexes for fast lookups
create index if not exists idx_oauth_user_provider on oauth_connections(user_id, provider);
create index if not exists idx_oauth_user_status on oauth_connections(user_id, status);
create index if not exists idx_oauth_updated on oauth_connections(user_id, updated_at desc);

-- Row-Level Security: users can only access their own connections
alter table oauth_connections enable row level security;

-- Policy: users can read their own connections
create policy "Users can read own connections"
  on oauth_connections for select
  using (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- Policy: users can insert their own connections
create policy "Users can insert own connections"
  on oauth_connections for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- Policy: users can update their own connections
create policy "Users can update own connections"
  on oauth_connections for update
  using (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- Policy: users can delete their own connections
create policy "Users can delete own connections"
  on oauth_connections for delete
  using (user_id = current_setting('request.jwt.claims', true)::json ->> 'sub');

-- Service role bypass (for server-side operations via SUPABASE_SERVICE_KEY)
-- The service role key automatically bypasses RLS, so no extra policy needed.

-- Auto-update updated_at on modifications
create or replace function update_oauth_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_oauth_updated
  before update on oauth_connections
  for each row execute function update_oauth_timestamp();
