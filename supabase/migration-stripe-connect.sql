-- MCV One Desktop — Stripe Connect Migration
-- One Stripe Express account per venture + audit trail.
-- Already applied to production kovsdngjojzfebrxulyj on 2026-04-14 via MCP.

create table if not exists venture_stripe_accounts (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null unique,
  stripe_account_id text not null unique,
  account_type text not null default 'express' check (account_type in ('express', 'standard', 'custom')),
  country text not null default 'US',
  default_currency text not null default 'usd',
  email text,
  business_name text,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  onboarding_completed_at timestamptz,
  requirements_currently_due text[] not null default '{}',
  requirements_eventually_due text[] not null default '{}',
  requirements_past_due text[] not null default '{}',
  capabilities jsonb not null default '{}',
  application_fee_bps integer not null default 1000 check (application_fee_bps >= 0 and application_fee_bps <= 10000),
  last_synced_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table venture_stripe_accounts is 'Stripe Connect Express accounts, one per venture. application_fee_bps is the platform cut in basis points (default 1000 = 10%).';

create index if not exists idx_vsa_venture on venture_stripe_accounts(venture_id);
create index if not exists idx_vsa_stripe on venture_stripe_accounts(stripe_account_id);
create index if not exists idx_vsa_charges_enabled on venture_stripe_accounts(charges_enabled);

alter table venture_stripe_accounts enable row level security;

create policy "vsa_select" on venture_stripe_accounts for select using (true);
create policy "vsa_insert" on venture_stripe_accounts for insert with check (auth.uid() is not null);
create policy "vsa_update" on venture_stripe_accounts for update using (auth.uid() is not null);
create policy "vsa_delete" on venture_stripe_accounts for delete using (auth.uid() is not null);

create or replace function update_vsa_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_vsa_updated_at on venture_stripe_accounts;
create trigger trg_vsa_updated_at before update on venture_stripe_accounts
  for each row execute function update_vsa_updated_at();

create table if not exists stripe_connect_events (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null,
  stripe_account_id text not null,
  event_type text not null check (event_type in ('account.created', 'account.updated', 'onboarding.started', 'onboarding.completed', 'capability.updated', 'payout.created', 'payout.failed', 'transfer.created')),
  stripe_event_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table stripe_connect_events is 'Audit trail for Stripe Connect lifecycle (account creation, onboarding, capability changes, payouts).';

create index if not exists idx_sce_venture on stripe_connect_events(venture_id);
create index if not exists idx_sce_account on stripe_connect_events(stripe_account_id);
create index if not exists idx_sce_type on stripe_connect_events(event_type);
create index if not exists idx_sce_created_at on stripe_connect_events(created_at desc);

alter table stripe_connect_events enable row level security;

create policy "sce_select" on stripe_connect_events for select using (true);
create policy "sce_insert" on stripe_connect_events for insert with check (auth.uid() is not null);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table venture_stripe_accounts;
    alter publication supabase_realtime add table stripe_connect_events;
  end if;
exception when duplicate_object then null;
end $$;
