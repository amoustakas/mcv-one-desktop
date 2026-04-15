-- Bootstrap migration for CRM/ops tables that were created via
-- `supabase/schema.sql` or the Supabase dashboard (out-of-band) and
-- never brought under migration control. The legacy migration
-- `enable_realtime_on_core_tables` (v20260405033145) assumes all of
-- them exist and fails on any fresh branch-preview replay.
--
-- This file documents the repair applied directly via MCP at
-- version 20260404120230 (inserted into supabase_migrations.schema_migrations
-- to land BETWEEN add_crm_tasks_forge at 20260404120223 and
-- enable_realtime_on_core_tables at 20260405033145). Idempotent on prod
-- (all tables already exist with data); a true bootstrap on branch previews.
--
-- Tables covered: activities, notifications, campaigns, team_members, documents.
-- (tasks, contacts, deals come from add_crm_tasks_forge; conversations +
-- messages from create_conversations_and_messages.)

-- ─── activities ────────────────────────────────────────────────────────
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

-- ─── notifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text DEFAULT '',
  source text DEFAULT 'system',
  read boolean DEFAULT false,
  venture_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all notifications" ON public.notifications;
CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ─── campaigns ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  type text NOT NULL DEFAULT 'marketing',
  venture_id text,
  channel text,
  budget numeric DEFAULT 0,
  reach integer DEFAULT 0,
  conversions integer DEFAULT 0,
  start_date date,
  end_date date,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all campaigns" ON public.campaigns;
CREATE POLICY "Allow all campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

-- ─── team_members ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id text,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'viewer',
  title text DEFAULT '',
  department text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  venture_assignments text[] DEFAULT '{}',
  permissions jsonb DEFAULT '{}',
  last_active timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all team_members" ON public.team_members;
CREATE POLICY "Allow all team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- ─── documents ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'note',
  venture_id text NOT NULL DEFAULT 'mcv',
  source_url text,
  metadata jsonb DEFAULT '{}',
  user_id text DEFAULT 'system',
  embedding_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_venture ON public.documents(venture_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(doc_type);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all documents" ON public.documents;
CREATE POLICY "Allow all documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
