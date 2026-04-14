-- MCV One Desktop — unified payment_events audit table.
-- Applied to production kovsdngjojzfebrxulyj on 2026-04-14 via MCP.
--
-- Every processor (stripe, plaid, solana, credits) writes to this single
-- table, giving a per-venture payment timeline independent of rail.

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'charge.created', 'charge.succeeded', 'charge.failed', 'charge.refunded',
    'refund.created', 'refund.succeeded', 'refund.failed',
    'payout.created', 'payout.succeeded', 'payout.failed',
    'transfer.created', 'transfer.succeeded', 'transfer.failed',
    'dispute.opened', 'dispute.resolved',
    'subscription.renewed', 'subscription.cancelled'
  )),
  processor text not null check (processor in ('stripe', 'plaid', 'solana', 'credits', 'other')),
  venture_id text,
  actor text,
  payment_id text,
  external_id text,
  external_signature text,
  amount_cents bigint,
  currency text default 'USD',
  status text,
  error_message text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
comment on table payment_events is 'Unified payment audit trail. Every charge/refund/payout/transfer from every processor lands here. Primary query: timeline per venture.';

create index if not exists idx_payment_events_venture on payment_events(venture_id);
create index if not exists idx_payment_events_processor on payment_events(processor);
create index if not exists idx_payment_events_type on payment_events(event_type);
create index if not exists idx_payment_events_created on payment_events(created_at desc);
create index if not exists idx_payment_events_payment on payment_events(payment_id);
create index if not exists idx_payment_events_external on payment_events(external_id);

alter table payment_events enable row level security;
create policy "payment_events_select" on payment_events for select using (true);
create policy "payment_events_insert" on payment_events for insert with check (auth.uid() is not null);
create policy "payment_events_update" on payment_events for update using (auth.uid() is not null);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table payment_events;
  end if;
exception when duplicate_object then null;
end $$;
