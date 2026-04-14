-- MCV One Desktop — persona_voices migration.
-- Applied to production kovsdngjojzfebrxulyj on 2026-04-14 via MCP.
-- Seeds the 12 NAOS C-suite default voice mappings as global
-- (venture_id NULL) rows.

create table if not exists persona_voices (
  id uuid primary key default gen_random_uuid(),
  agent_codename text not null,
  venture_id text,
  provider text not null default 'elevenlabs' check (provider in ('elevenlabs', 'gemini-live', 'deepgram')),
  voice_id text not null,
  settings jsonb not null default '{}',
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table persona_voices is 'Per-agent per-venture branded voice mapping. resolvePersonaVoice() looks up by (codename, venture_id) with fallback to venture_id IS NULL.';

create unique index if not exists idx_persona_voices_unique
  on persona_voices(agent_codename, coalesce(venture_id, ''));
create index if not exists idx_persona_voices_venture on persona_voices(venture_id);

alter table persona_voices enable row level security;
create policy "persona_voices_select" on persona_voices for select using (true);
create policy "persona_voices_insert" on persona_voices for insert with check (auth.uid() is not null);
create policy "persona_voices_update" on persona_voices for update using (auth.uid() is not null);
create policy "persona_voices_delete" on persona_voices for delete using (auth.uid() is not null);

create or replace function update_persona_voices_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_persona_voices_updated_at on persona_voices;
create trigger trg_persona_voices_updated_at before update on persona_voices
  for each row execute function update_persona_voices_updated_at();

insert into persona_voices (agent_codename, venture_id, provider, voice_id, label) values
  ('aegis',    null, 'elevenlabs', 'rachel',    'Authoritative, clear'),
  ('athena',   null, 'elevenlabs', 'domi',      'Analytical, precise'),
  ('atlas',    null, 'elevenlabs', 'josh',      'Warm, confident'),
  ('daedalus', null, 'elevenlabs', 'adam',      'Technical, measured'),
  ('hermes',   null, 'elevenlabs', 'antoni',    'Energetic, engaging'),
  ('minerva',  null, 'elevenlabs', 'bella',     'Thoughtful, crisp'),
  ('vulcan',   null, 'elevenlabs', 'arnold',    'Stern, deliberate'),
  ('forge',    null, 'elevenlabs', 'sam',       'Practical, direct'),
  ('muse',     null, 'elevenlabs', 'elli',      'Creative, expressive'),
  ('sentry',   null, 'elevenlabs', 'callum',    'Calm, reliable'),
  ('scribe',   null, 'elevenlabs', 'charlotte', 'Articulate, narrative'),
  ('helios',   null, 'elevenlabs', 'dave',      'Operational, steady')
on conflict (agent_codename, coalesce(venture_id, '')) do nothing;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table persona_voices;
  end if;
exception when duplicate_object then null;
end $$;
