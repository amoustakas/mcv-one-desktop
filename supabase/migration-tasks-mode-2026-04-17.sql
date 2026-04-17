-- supabase/migration-tasks-mode-2026-04-17.sql
-- Adds agentic/human/hybrid execution mode discriminator to tasks.
-- 'hybrid' = agent-drafted + human-approved.
-- Rows where assigned_agent is set default to 'agent' mode.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'human'
  CHECK (mode IN ('human','agent','hybrid'));

CREATE INDEX IF NOT EXISTS idx_tasks_mode ON tasks(mode);

UPDATE tasks SET mode = 'agent' WHERE assigned_agent IS NOT NULL AND mode = 'human';

COMMENT ON COLUMN tasks.mode IS 'Execution mode: human | agent | hybrid (agent-drafted + human-approved).';
