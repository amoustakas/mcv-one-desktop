-- Marathon 5 I3.1 — RLS policy backfill for 8 zero-policy tables
-- Fixes the audit gap: every M-era table now has >= 1 authenticated SELECT policy.
--
-- Shape:
--   Venture-scoped tables (6): SELECT for 'authenticated' if venture_id (or joined
--   venture_id) matches auth.jwt()->>'venture_scope', OR JWT role = 'mcv_admin'.
--   Service role bypasses RLS, so inserts/updates/deletes run backend-only with
--   no authenticated mutation policy.
--
--   Persona-scoped tables (2): SELECT for 'authenticated' if the persona's
--   agent_persona.scope_value matches the caller's venture_scope claim
--   (and scope_kind = 'venture'), OR admin bypass.
--
-- Columns verified 2026-04-17 via Supabase MCP:
--   ventures.id is text (slug) — JWT venture_scope claim compares directly.
--   capital_round_ventures.venture_id is text (junction already exposes it).
--   domain_registry.venture_id is nullable text (null for org-level domains —
--     only admins see those rows).
--   persona_xp_event / persona_achievement use agent_id (-> agent_persona.id).
--   agent_persona uses (scope_kind, scope_value); scope_value = venture slug.
--   research_dossier is polymorphic (entity_type, entity_id); venture rows
--     have entity_id = venture slug.
--   venture_accounts / venture_brand_kits / venture_jurisdictions have
--     venture_id as text.

-- ----------------------------------------------------------------------------
-- 1. capital_round_ventures — junction (round_id, venture_id) funding
-- ----------------------------------------------------------------------------
CREATE POLICY "capital_round_ventures_select_scoped"
  ON public.capital_round_ventures
  FOR SELECT
  TO authenticated
  USING (
    venture_id = (auth.jwt() ->> 'venture_scope')
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 2. domain_registry — sovereign domain registry (venture_id nullable)
-- ----------------------------------------------------------------------------
CREATE POLICY "domain_registry_select_scoped"
  ON public.domain_registry
  FOR SELECT
  TO authenticated
  USING (
    (venture_id IS NOT NULL AND venture_id = (auth.jwt() ->> 'venture_scope'))
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 3. persona_achievement — persona_id -> agent_persona.scope_value join
-- ----------------------------------------------------------------------------
CREATE POLICY "persona_achievement_select_scoped"
  ON public.persona_achievement
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT id FROM public.agent_persona
      WHERE scope_kind = 'venture'
        AND scope_value = (auth.jwt() ->> 'venture_scope')
    )
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 4. persona_xp_event — immutable XP ledger, same persona-scope pattern
-- ----------------------------------------------------------------------------
CREATE POLICY "persona_xp_event_select_scoped"
  ON public.persona_xp_event
  FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT id FROM public.agent_persona
      WHERE scope_kind = 'venture'
        AND scope_value = (auth.jwt() ->> 'venture_scope')
    )
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 5. research_dossier — polymorphic (entity_type, entity_id)
--    For entity_type = 'venture' -> entity_id is the venture slug.
--    For entity_type = 'prospect' -> dossier is prospect research owned by a
--    venture; today the prospect_id is scoped via its owning venture in
--    application code, so we restrict prospect dossiers to admin until a
--    per-prospect venture mapping column lands. All other entity_types
--    (market, general research) are admin-only for now.
-- ----------------------------------------------------------------------------
CREATE POLICY "research_dossier_select_scoped"
  ON public.research_dossier
  FOR SELECT
  TO authenticated
  USING (
    (entity_type = 'venture' AND entity_id = (auth.jwt() ->> 'venture_scope'))
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 6. venture_accounts — per-venture financial accounts
-- ----------------------------------------------------------------------------
CREATE POLICY "venture_accounts_select_scoped"
  ON public.venture_accounts
  FOR SELECT
  TO authenticated
  USING (
    venture_id = (auth.jwt() ->> 'venture_scope')
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 7. venture_brand_kits — per-venture brand assets
-- ----------------------------------------------------------------------------
CREATE POLICY "venture_brand_kits_select_scoped"
  ON public.venture_brand_kits
  FOR SELECT
  TO authenticated
  USING (
    venture_id = (auth.jwt() ->> 'venture_scope')
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );

-- ----------------------------------------------------------------------------
-- 8. venture_jurisdictions — per-venture legal jurisdictions
-- ----------------------------------------------------------------------------
CREATE POLICY "venture_jurisdictions_select_scoped"
  ON public.venture_jurisdictions
  FOR SELECT
  TO authenticated
  USING (
    venture_id = (auth.jwt() ->> 'venture_scope')
    OR (auth.jwt() ->> 'role') = 'mcv_admin'
  );
