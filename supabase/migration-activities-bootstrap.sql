-- Bootstrap migration for the `activities` CRM interaction-log table.
-- Repair for a pre-existing gap: the table was created via supabase/schema.sql
-- out-of-band (never tracked as a migration). The legacy migration
-- `enable_realtime_on_core_tables` (v20260405033145) assumes the table
-- exists and fails on any fresh branch-preview replay.
--
-- This file documents the repair that was applied directly via MCP at
-- version 20260404120230 (inserted into supabase_migrations.schema_migrations).
-- Version is intentionally backdated to land BETWEEN add_crm_tasks_forge
-- (20260404120223) and enable_realtime_on_core_tables (20260405033145).
-- Idempotent: CREATE TABLE IF NOT EXISTS on prod where the table already
-- has 52 rows; a true bootstrap on branch previews.

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text DEFAULT '',
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  venture_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON public.activities(deal_id, created_at DESC);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all activities" ON public.activities;
CREATE POLICY "Allow all activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
