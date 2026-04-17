-- MCV One — persona_voices real ElevenLabs voice IDs.
-- The initial seed used human-name aliases (rachel, josh, ...) which
-- ElevenLabs rejects with 404 voice_not_found. We now store the real
-- canonical premade voice IDs. We also seed the 13 onboarding agent
-- handles from agent_persona so the wizard's chat column can play
-- anyone who speaks.
--
-- Voice picks map each agent's personality label to the closest
-- available premade voice; every id below was verified against
-- https://api.elevenlabs.io/v1/voices.

begin;

-- Update the 12 NAOS codename rows to real voice IDs.
update persona_voices set voice_id = 'Xb7hH8MSUJpSbSDYk0k2', label = 'Alice · clear engaging educator'      where agent_codename = 'aegis'    and venture_id is null;
update persona_voices set voice_id = 'XrExE9yKIg1WjnnlVkGX', label = 'Matilda · knowledgable professional'  where agent_codename = 'athena'   and venture_id is null;
update persona_voices set voice_id = 'cjVigY5qzO86Huf0OWal', label = 'Eric · smooth trustworthy'            where agent_codename = 'atlas'    and venture_id is null;
update persona_voices set voice_id = 'onwK4e9ZLuTAKqWW03F9', label = 'Daniel · steady broadcaster'          where agent_codename = 'daedalus' and venture_id is null;
update persona_voices set voice_id = 'pNInz6obpgDQGcFmaJgB', label = 'Adam · dominant firm'                 where agent_codename = 'forge'    and venture_id is null;
update persona_voices set voice_id = 'pqHfZKP75CvOlQylNhV4', label = 'Bill · wise mature balanced'          where agent_codename = 'helios'   and venture_id is null;
update persona_voices set voice_id = 'TX3LPaxmHKxFdv7VOQHJ', label = 'Liam · energetic creator'             where agent_codename = 'hermes'   and venture_id is null;
update persona_voices set voice_id = 'FGY2WhTYpPnrIDTdsKH5', label = 'Laura · enthusiast quirky'            where agent_codename = 'minerva'  and venture_id is null;
update persona_voices set voice_id = 'cgSgspJ2msm6clMCkdW9', label = 'Jessica · playful bright warm'        where agent_codename = 'muse'     and venture_id is null;
update persona_voices set voice_id = 'JBFqnCBsd6RMkjVDRZzb', label = 'George · warm storyteller'            where agent_codename = 'scribe'   and venture_id is null;
update persona_voices set voice_id = 'nPczCjzI2devNBz1zQrb', label = 'Brian · deep resonant comforting'     where agent_codename = 'sentry'   and venture_id is null;
update persona_voices set voice_id = 'SOYHLrjzK2X1ezoPC6cr', label = 'Harry · fierce warrior'               where agent_codename = 'vulcan'   and venture_id is null;

-- Seed the onboarding agent handles (minus atlas, already present
-- above). Each row is a global default — a venture can override later
-- by inserting a matching (codename, venture_id) row.
insert into persona_voices (agent_codename, venture_id, provider, voice_id, label) values
  ('ada',      null, 'elevenlabs', 'XrExE9yKIg1WjnnlVkGX', 'Ada Marlowe · Matilda (professional)'),
  ('amara',    null, 'elevenlabs', 'EXAVITQu4vr4xnSDxMaL', 'Amara Reeves · Sarah (mature reassuring)'),
  ('dieter',   null, 'elevenlabs', 'CwhRBWXzGAHq8TQ4Fs17', 'Dieter Wren · Roger (laid-back casual)'),
  ('hannah',   null, 'elevenlabs', 'FGY2WhTYpPnrIDTdsKH5', 'Hannah Graham · Laura (enthusiast)'),
  ('hedy',     null, 'elevenlabs', 'Xb7hH8MSUJpSbSDYk0k2', 'Hedy Kovac · Alice (clear educator)'),
  ('justice',  null, 'elevenlabs', 'onwK4e9ZLuTAKqWW03F9', 'Justice Okonkwo · Daniel (steady broadcaster)'),
  ('leo',      null, 'elevenlabs', 'iP95p4xoKVk53GoZ742B', 'Leo Drucker · Chris (charming down-to-earth)'),
  ('linus',    null, 'elevenlabs', 'bIHbv24MWmeRgasZH58o', 'Linus Park · Will (relaxed optimist)'),
  ('nico',     null, 'elevenlabs', 'TX3LPaxmHKxFdv7VOQHJ', 'Nico Vega · Liam (energetic)'),
  ('satoshi',  null, 'elevenlabs', 'IKne3meq5aSn9XLyUdCD', 'Satoshi Kim · Charlie (deep confident)'),
  ('sterling', null, 'elevenlabs', 'hpp4J3VqNfWAUOO0d1Us', 'Hannah Sterling · Bella (professional bright)'),
  ('warren',   null, 'elevenlabs', 'pqHfZKP75CvOlQylNhV4', 'Warren Cho · Bill (wise mature balanced)')
on conflict (agent_codename, coalesce(venture_id, '')) do update
  set voice_id = excluded.voice_id,
      label    = excluded.label,
      provider = excluded.provider;

commit;

-- Post-apply verification:
-- select agent_codename, voice_id, label from persona_voices order by agent_codename;
