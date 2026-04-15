-- Notifications dispatch — additive columns for channel routing.
-- Existing writers (capital, crm, dashboard, epics, etc.) keep working
-- because every column is nullable / has a default. New writers can opt
-- in by populating channels + target_user_id.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS target_user_id text,
  ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_log jsonb DEFAULT '[]'::jsonb;

-- Cron-friendly index: only undispatched rows that requested a channel.
CREATE INDEX IF NOT EXISTS idx_notifications_pending_dispatch
  ON notifications (created_at)
  WHERE dispatched_at IS NULL AND channels <> '{}'::jsonb;

COMMENT ON COLUMN notifications.target_user_id IS
  'Clerk user_id whose OAuth tokens the dispatcher uses to deliver. Null = no per-user delivery.';
COMMENT ON COLUMN notifications.channels IS
  'Per-row channel routing config, e.g. {"slack": {"channel": "#capital"}, "email": {"to": "tony@..."}}';
COMMENT ON COLUMN notifications.dispatched_at IS
  'Set by cron-notifications-dispatch when delivery has been attempted across all channels.';
COMMENT ON COLUMN notifications.delivery_log IS
  'Append-only array of {channel, ok, error, at} entries from dispatch attempts.';
