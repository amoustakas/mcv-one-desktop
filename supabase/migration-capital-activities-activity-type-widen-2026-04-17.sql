-- supabase/migration-capital-activities-activity-type-widen-2026-04-17.sql
-- Widens capital_activities.activity_type CHECK to accept the activity kinds
-- introduced by M2 T6 (investor-flow):
--   accreditation_submitted, soft_commit_created, soft_commit_updated, payment_kicked_off
-- Without this, M2 T6.2/T6.3 rows would violate the existing CHECK constraint at runtime.

ALTER TABLE capital_activities
  DROP CONSTRAINT IF EXISTS capital_activities_activity_type_check;

ALTER TABLE capital_activities
  ADD CONSTRAINT capital_activities_activity_type_check
  CHECK (activity_type = ANY (ARRAY[
    -- Original 14 kinds (preserve all)
    'email', 'call', 'meeting', 'note',
    'portal_view', 'portal_login',
    'doc_sent', 'doc_signed',
    'payment_received', 'payment_sent',
    'status_change', 'token_distributed',
    'enrichment', 'system',
    -- M2 T6 additions (investor-flow lifecycle)
    'accreditation_submitted', 'soft_commit_created', 'soft_commit_updated', 'payment_kicked_off'
  ]));

COMMENT ON CONSTRAINT capital_activities_activity_type_check ON capital_activities IS 'Activity event taxonomy — extended 2026-04-17 (M3 T8.1) to accept M2 T6 investor-flow events.';
