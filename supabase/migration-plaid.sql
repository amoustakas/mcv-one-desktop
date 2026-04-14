-- MCV One Desktop — Plaid items + ACH transfers
-- Already applied to production kovsdngjojzfebrxulyj on 2026-04-14 via MCP.

create table if not exists plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  venture_id text,
  item_id text not null,
  institution_id text,
  institution_name text,
  access_token_encrypted text not null,
  accounts jsonb not null default '[]',
  products text[] not null default '{}',
  consent_expiration_time timestamptz,
  status text not null default 'active' check (status in ('active','error','expired','revoked')),
  last_sync_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table plaid_items is 'Linked Plaid Items (bank accounts) per user + venture. access_token is AES-256-GCM encrypted with OAUTH_ENCRYPTION_KEY.';

create unique index if not exists idx_plaid_items_item on plaid_items(item_id);
create index if not exists idx_plaid_items_user on plaid_items(user_id);
create index if not exists idx_plaid_items_venture on plaid_items(venture_id);

alter table plaid_items enable row level security;
create policy "plaid_items_select" on plaid_items for select using (true);
create policy "plaid_items_insert" on plaid_items for insert with check (auth.uid() is not null);
create policy "plaid_items_update" on plaid_items for update using (auth.uid() is not null);
create policy "plaid_items_delete" on plaid_items for delete using (auth.uid() is not null);

create table if not exists plaid_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  venture_id text,
  plaid_item_id uuid references plaid_items(id) on delete set null,
  authorization_id text,
  transfer_id text,
  account_id text,
  type text check (type in ('debit','credit')),
  network text default 'ach',
  amount_cents bigint not null,
  currency text not null default 'USD',
  description text,
  user_info jsonb,
  status text not null default 'pending' check (status in ('pending','posted','settled','cancelled','failed','returned')),
  failure_reason text,
  authorized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plaid_transfers_user on plaid_transfers(user_id);
create index if not exists idx_plaid_transfers_venture on plaid_transfers(venture_id);
create index if not exists idx_plaid_transfers_status on plaid_transfers(status);
create index if not exists idx_plaid_transfers_transfer on plaid_transfers(transfer_id);

alter table plaid_transfers enable row level security;
create policy "plaid_transfers_select" on plaid_transfers for select using (true);
create policy "plaid_transfers_insert" on plaid_transfers for insert with check (auth.uid() is not null);
create policy "plaid_transfers_update" on plaid_transfers for update using (auth.uid() is not null);

create or replace function update_plaid_items_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_plaid_items_updated_at on plaid_items;
create trigger trg_plaid_items_updated_at before update on plaid_items
  for each row execute function update_plaid_items_updated_at();

create or replace function update_plaid_transfers_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_plaid_transfers_updated_at on plaid_transfers;
create trigger trg_plaid_transfers_updated_at before update on plaid_transfers
  for each row execute function update_plaid_transfers_updated_at();

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table plaid_items;
    alter publication supabase_realtime add table plaid_transfers;
  end if;
exception when duplicate_object then null;
end $$;
