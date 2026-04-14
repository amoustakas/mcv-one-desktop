-- migration-plaid-webhook-cursors.sql
--
-- Tracks the last Plaid transfer event id we've successfully synced.
-- Plaid's /transfer/event/sync returns up to 25 new events per call with a
-- `has_more` flag. We advance this cursor after each successful batch so
-- TRANSFER_EVENTS_UPDATE webhooks only pull the delta.
--
-- Single-row table keyed by cursor_key — room to add other cursors later
-- (e.g. transactions sync, identity verification events) without another
-- migration.

create table if not exists plaid_webhook_cursors (
  cursor_key   text primary key,
  last_event_id bigint not null default 0,
  updated_at   timestamptz not null default now()
);

-- Seed the transfer-events cursor so upsert is never a no-op on first hit.
insert into plaid_webhook_cursors (cursor_key, last_event_id)
values ('transfer_events', 0)
on conflict (cursor_key) do nothing;

-- Service role writes; no RLS — these rows are operational, not user-owned.
alter table plaid_webhook_cursors enable row level security;
create policy "service role full access"
  on plaid_webhook_cursors
  for all
  to service_role
  using (true)
  with check (true);
