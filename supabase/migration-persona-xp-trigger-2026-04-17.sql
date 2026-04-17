-- supabase/migration-persona-xp-trigger-2026-04-17.sql
-- Wires agent_activity_log → persona_xp_event + agent_persona.xp.
-- Function accrue_persona_xp_for_activity() runs AFTER INSERT on agent_activity_log,
-- maps action_kind → xp delta, inserts into the ledger, and updates the denormalized sum.
-- Also backfills XP from existing agent_activity_log rows.

CREATE OR REPLACE FUNCTION accrue_persona_xp_for_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_xp integer;
  v_event_kind text;
BEGIN
  -- Map action_kind → xp delta + event_kind
  CASE NEW.action_kind
    WHEN 'chat_turn'    THEN v_xp := 1;  v_event_kind := 'chat_turn';
    WHEN 'tool_call'    THEN v_xp := 5;  v_event_kind := 'tool_call';
    WHEN 'workflow_run' THEN v_xp := 20; v_event_kind := 'workflow_run';
    WHEN 'handoff'      THEN v_xp := 10; v_event_kind := 'handoff';
    ELSE v_xp := 0; v_event_kind := 'activity';  -- 'system' falls here
  END CASE;

  -- Skip zero-xp rows (system events don't accrue)
  IF v_xp = 0 THEN
    RETURN NEW;
  END IF;

  -- Insert ledger row
  INSERT INTO persona_xp_event (
    agent_id, event_kind, xp,
    source_type, source_id,
    description, occurred_at,
    metadata
  ) VALUES (
    NEW.agent_id, v_event_kind, v_xp,
    'agent_activity_log', NEW.id::text,
    COALESCE(NEW.tool_name, NEW.action_kind) || ' (+' || v_xp || ' xp)',
    NEW.created_at,
    jsonb_build_object('action_kind', NEW.action_kind, 'tool_name', NEW.tool_name, 'venture_id', NEW.venture_id)
  );

  -- Update denormalized sum on the persona
  UPDATE agent_persona
  SET xp = xp + v_xp, updated_at = now()
  WHERE id = NEW.agent_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_accrue_persona_xp ON agent_activity_log;
CREATE TRIGGER trg_accrue_persona_xp
  AFTER INSERT ON agent_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION accrue_persona_xp_for_activity();

-- Backfill from existing rows (one-time)
INSERT INTO persona_xp_event (agent_id, event_kind, xp, source_type, source_id, description, occurred_at, metadata)
SELECT
  a.agent_id,
  CASE a.action_kind
    WHEN 'chat_turn'    THEN 'chat_turn'
    WHEN 'tool_call'    THEN 'tool_call'
    WHEN 'workflow_run' THEN 'workflow_run'
    WHEN 'handoff'      THEN 'handoff'
    ELSE 'activity'
  END,
  CASE a.action_kind
    WHEN 'chat_turn'    THEN 1
    WHEN 'tool_call'    THEN 5
    WHEN 'workflow_run' THEN 20
    WHEN 'handoff'      THEN 10
    ELSE 0
  END,
  'agent_activity_log',
  a.id::text,
  COALESCE(a.tool_name, a.action_kind) || ' (backfilled)',
  a.created_at,
  jsonb_build_object('action_kind', a.action_kind, 'tool_name', a.tool_name, 'venture_id', a.venture_id, 'backfilled', true)
FROM agent_activity_log a
WHERE a.action_kind IN ('chat_turn','tool_call','workflow_run','handoff')
  AND NOT EXISTS (
    SELECT 1 FROM persona_xp_event pe
    WHERE pe.source_type = 'agent_activity_log' AND pe.source_id = a.id::text
  );

-- Sync agent_persona.xp to the sum of their ledger (authoritative)
UPDATE agent_persona
SET xp = COALESCE((SELECT SUM(xp) FROM persona_xp_event WHERE agent_id = agent_persona.id), 0),
    updated_at = now();

-- Seed demo milestones across the Hit Squad so the ladder has signal
-- (only if no milestone events exist yet — idempotent)
INSERT INTO persona_xp_event (agent_id, event_kind, xp, source_type, source_id, description, metadata)
SELECT p.id, 'milestone', 150, 'm3_seed', p.handle,
  'Demo milestone: seeded 2026-04-17 M3 gamification bootstrap',
  jsonb_build_object('seed_batch', 'm3_t9_3', 'reason', 'bootstrap_ladder')
FROM agent_persona p
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM persona_xp_event pe
    WHERE pe.agent_id = p.id AND pe.source_type = 'm3_seed'
  );

-- Additional variance: chiefs get +100, seniors +50 so the ladder isn't flat
UPDATE agent_persona
SET xp = xp + CASE
  WHEN seniority IN ('chief','chief_of_staff') THEN 100
  WHEN seniority = 'senior' THEN 50
  ELSE 0
END
WHERE active = true;

-- Seed 3 demo achievements (first 3 personas alphabetically by handle get a gold achievement)
INSERT INTO persona_achievement (agent_id, achievement_key, achievement_label, tier, xp_granted, metadata)
SELECT p.id, 'first_blood', 'First Blood — seeded at bootstrap', 'gold', 50,
  jsonb_build_object('seed_batch', 'm3_t9_3', 'rationale', 'Hit Squad day-one milestone')
FROM (SELECT id, handle FROM agent_persona WHERE active = true ORDER BY handle LIMIT 3) p
ON CONFLICT (agent_id, achievement_key) DO NOTHING;

COMMENT ON FUNCTION accrue_persona_xp_for_activity() IS 'Maps agent_activity_log action_kind to persona_xp_event + agent_persona.xp. 2026-04-17 M3 T9.3.';
