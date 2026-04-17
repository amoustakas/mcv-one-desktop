-- supabase/migration-prospect-profiles-operator-2026-04-17.sql
-- Extends prospect_profiles with operator-authored intel fields.
-- Adds intake_source discriminator so wizard-captured vs operator-seeded rows are distinguishable.

ALTER TABLE prospect_profiles
  ADD COLUMN IF NOT EXISTS intake_source text NOT NULL DEFAULT 'wizard' CHECK (intake_source IN ('wizard','operator','referral','import')),
  ADD COLUMN IF NOT EXISTS operator_notes text,
  ADD COLUMN IF NOT EXISTS relationship_history text,
  ADD COLUMN IF NOT EXISTS prior_deals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS aum_estimate numeric,
  ADD COLUMN IF NOT EXISTS check_size_range text,
  ADD COLUMN IF NOT EXISTS investor_thesis text,
  ADD COLUMN IF NOT EXISTS social_profiles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('hot','warm','medium','cold')),
  ADD COLUMN IF NOT EXISTS archetype text;

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_intake_source ON prospect_profiles(intake_source);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_priority ON prospect_profiles(priority);

COMMENT ON COLUMN prospect_profiles.intake_source IS 'wizard = public funnel | operator = Tony-seeded | referral | import';
COMMENT ON COLUMN prospect_profiles.archetype IS 'Character class per gamification model — investor/operator/creator/advisor/partner/contributor/customer/founder/vendor';
