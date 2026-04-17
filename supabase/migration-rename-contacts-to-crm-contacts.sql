-- supabase/migration-rename-contacts-to-crm-contacts.sql
-- =====================================================================
-- Wave-5D Resolution: Reconcile `contacts` (live schema) with
-- `crm_contacts` (Session-10+ capital code assumption).
--
-- DECISION (Session 13e, 2026-04-16): Tony's revert of migration-mcv-sign.sql
-- FK back to `crm_contacts(id)` signals the canonical name going forward is
-- `crm_contacts`. Rather than edit 20+ files + tests, we rename the table
-- at the database layer and leave a backward-compatibility view named
-- `contacts` so any pre-Session-10 code (older CRM surfaces, activities,
-- deals, etc.) that still queries `.from('contacts')` keeps working.
--
-- This is ONE migration instead of 20 call-site edits.
--
-- ADDITIONAL FIXES rolled in:
--   1. `full_name` column — code reads it (api/_handlers/capital.ts, 9 call
--      sites) but it doesn't exist on the real table. Added as a STORED
--      GENERATED column aliasing `name`, so it stays in sync automatically.
--   2. `country` column — code reads it (packages/capital-sdk/src/tax-export.ts
--      for 1099/T5 jurisdiction detection) but it doesn't exist. Added as
--      a nullable TEXT column; call sites can backfill or write-through.
--
-- SAFETY NOTES:
--   - Transactional (single BEGIN/COMMIT). If any statement fails, nothing
--     persists.
--   - `ALTER TABLE ... RENAME` in Postgres preserves ALL FK constraints;
--     every FK that targeted `contacts(id)` auto-retargets to
--     `crm_contacts(id)`. Verified pre-apply: 3 FKs point here
--     (activities.contact_id, deals.contact_id, signing_envelope_signers.contact_id).
--   - `ALTER TABLE ... RENAME` also moves realtime publication membership
--     with the table automatically (pg_publication_tables follows the oid).
--   - Simple single-table views are auto-updatable in Postgres
--     (https://www.postgresql.org/docs/current/sql-createview.html — section
--     on updatable views). Legacy INSERT/UPDATE/DELETE through `contacts`
--     still work.
--   - No DROP statements. No data loss surface.
--   - RLS on `crm_contacts` inherits from the pre-rename `contacts` table
--     (Postgres carries policies across RENAME).
--
-- PRE-APPLY STATE (verified via Supabase MCP on 2026-04-16):
--   - `contacts` exists; `crm_contacts` does not.
--   - 27 columns on `contacts`, including `name` (no `full_name`, no `country`).
--   - 4 rows in `contacts`.
--   - 3 inbound FKs targeting contacts(id):
--       * activities.contact_id
--       * deals.contact_id
--       * signing_envelope_signers.contact_id
--   - 1 RLS policy ("Allow all contacts", permissive, ALL, roles=public).
--   - Publication: supabase_realtime includes `contacts`.
-- =====================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Rename the base table. FKs, indexes, RLS policies, and publication
--    membership all follow automatically.
-- -----------------------------------------------------------------------
ALTER TABLE public.contacts RENAME TO crm_contacts;

-- -----------------------------------------------------------------------
-- 2. Add the missing columns code already reads.
--    `full_name` is a STORED generated column so it is always a mirror
--    of `name` — zero chance of drift, no trigger overhead on write paths
--    that don't touch it.
-- -----------------------------------------------------------------------
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS full_name TEXT
    GENERATED ALWAYS AS (name) STORED;

ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN public.crm_contacts.full_name IS
  'Generated mirror of `name` for compatibility with Session-10+ capital code that reads full_name. Single source of truth is `name`.';

COMMENT ON COLUMN public.crm_contacts.country IS
  'ISO-3166 country code (e.g. "US", "CA") used by tax-export.ts for 1099/T5 jurisdiction routing. Nullable; callers should backfill when known.';

-- -----------------------------------------------------------------------
-- 3. Backward-compat view for pre-Session-10 code that still queries
--    `.from('contacts')` (CRM surfaces, older activity/deal joins, etc.).
--    This is updatable since it's a simple SELECT * off a single base
--    table — INSERT/UPDATE/DELETE through the view still work.
--    Note: generated columns (full_name) are read-only through the view,
--    matching their behaviour on the base table.
-- -----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.contacts AS
  SELECT * FROM public.crm_contacts;

COMMENT ON VIEW public.contacts IS
  'Backward-compat view. Session-10+ capital code targets crm_contacts (the real table); this view lets legacy code keep using .from(''contacts'') without refactor. Safe to keep indefinitely — zero-cost passthrough.';

-- -----------------------------------------------------------------------
-- 4. DO NOT add the view to supabase_realtime publication. Realtime
--    subscribers should attach to the base table `crm_contacts` directly
--    (they already do by default since the rename carried publication
--    membership). Publishing the view would produce duplicate events.
-- -----------------------------------------------------------------------

COMMIT;

-- =====================================================================
-- POST-APPLY VERIFICATION QUERIES (run these by hand after apply)
-- =====================================================================
-- -- 1. Table now named crm_contacts:
-- SELECT table_name, table_type FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('contacts','crm_contacts');
-- -- expected: crm_contacts BASE TABLE, contacts VIEW
--
-- -- 2. New columns present:
-- SELECT column_name, data_type, is_generated, generation_expression
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'crm_contacts'
--   AND column_name IN ('full_name','country','name');
--
-- -- 3. FKs preserved and now target crm_contacts:
-- SELECT tc.constraint_name, tc.table_name AS child_table,
--        kcu.column_name AS child_column,
--        ccu.table_name AS parent_table, ccu.column_name AS parent_column
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage ccu
--   ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND ccu.table_name = 'crm_contacts';
-- -- expected: activities.contact_id, deals.contact_id, signing_envelope_signers.contact_id
--
-- -- 4. Row count unchanged:
-- SELECT COUNT(*) FROM crm_contacts; -- expected: 4
-- SELECT COUNT(*) FROM contacts;     -- expected: 4 (view)
--
-- -- 5. full_name mirrors name:
-- SELECT id, name, full_name FROM crm_contacts LIMIT 4;
-- -- expected: full_name = name for every row
--
-- -- 6. Write-through on view works:
-- -- INSERT INTO contacts (user_id, name, type, status)
-- --   VALUES ('test-user', 'Compat Test', 'lead', 'active');
-- -- SELECT * FROM crm_contacts WHERE name = 'Compat Test'; -- expected: 1 row
-- -- DELETE FROM contacts WHERE name = 'Compat Test';
-- =====================================================================
