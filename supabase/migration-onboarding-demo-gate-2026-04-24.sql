-- supabase/migration-onboarding-demo-gate-2026-04-24.sql
-- =============================================================================
--   MCV ONBOARDING + DEMO GATE — DATA BACKBONE
-- =============================================================================
--
-- The invite-gated HARD GATE architecture for user onboarding across MCV
-- ventures. Tony (super-admin) issues invites; each invite carries a
-- pre-selected document bundle + access tier; on accept, the user's
-- requirements are materialized + eventually fulfilled via MCV Sign rails;
-- completion flips access grants that unlock demo launchpads (Futurestate
-- first, others to follow).
--
-- Five tables, one pipeline:
--
--   document_templates
--       ↓ (many-to-many via document_bundle_templates)
--   document_bundles
--       ↓ (referenced by)
--   onboarding_invites   ← created by super-admin
--       ↓ (on accept, materializes)
--   user_document_requirements → signing_envelopes (via MCV Sign)
--       ↓ (on all signed)
--   user_access_grants   → unlocks demo launchpads
--
-- Authoritative state split:
--   · document_templates / bundles = content catalog (what can be required)
--   · onboarding_invites           = super-admin's "you're cleared" statement
--   · user_document_requirements   = per-user checklist (what they owe)
--   · signing_envelopes (existing) = the signature lifecycle itself
--   · user_access_grants           = post-onboarding access ledger
--
-- Events flow through event_log via @mcv/events-sdk on every state change.
-- No RLS on these tables (service-role API handlers gate via Clerk); same
-- pattern as the newer Foundation migrations (Vercel, GitHub, agent_drafts).
-- =============================================================================


-- =============================================================================
-- 1. DOCUMENT TEMPLATES — the canonical content catalog
-- =============================================================================
-- Each row is a versioned, signable document. Bodies are markdown so they can
-- render in both the user-facing signer UI AND in admin preview surfaces.
--
-- EXPAND: locales — add `locale text NOT NULL DEFAULT 'en'` + unique-by
-- (template_key, locale, version) when i18n becomes a requirement.
-- EXPAND: template variables — add `variables jsonb` to support {{user_name}}
-- interpolation at envelope-creation time (MCV Sign already hashes content
-- post-interpolation so ESIGN integrity is preserved).

CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,              -- e.g. 'platform-tos'
  title text NOT NULL,                            -- e.g. 'MCV Platform Terms of Service'
  version text NOT NULL,                          -- e.g. 'v1.0' (bump for any content change)
  summary text NOT NULL,                          -- one-line for list views
  body_md text NOT NULL,                          -- full markdown content shown before signing
  doc_type text NOT NULL CHECK (doc_type IN (
    'terms_of_service',
    'privacy_policy',
    'nda',
    'accreditation_cert',
    'risk_acknowledgement',
    'kyc_consent',
    'token_terms',
    'custom'
  )),
  requires_e_signature boolean NOT NULL DEFAULT true,
  authored_by text NOT NULL,                      -- clerk super-admin user_id
  retired_at timestamptz,                         -- soft delete; filtered from new bundles
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,    -- free-form (jurisdiction, effective_date, etc.)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_templates_doc_type
  ON document_templates(doc_type) WHERE retired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_document_templates_key
  ON document_templates(template_key) WHERE retired_at IS NULL;

COMMENT ON TABLE document_templates IS
  'Canonical catalog of signable documents. Versioned by (template_key, version). Bodies are markdown. Referenced by document_bundles and materialized into user_document_requirements on invite accept.';


-- =============================================================================
-- 2. DOCUMENT BUNDLES — named SKUs of templates (what an invite assigns)
-- =============================================================================
-- Tony picks a bundle when creating an invite ("Futurestate Investor Default",
-- "BetEdge Preview Access", etc.). On invite accept, every template in the
-- bundle materializes as a user_document_requirements row.
--
-- EXPAND: conditional templates — add a `condition_jsonb` column on the join
-- table so a template only materializes if (e.g.) the user's jurisdiction
-- is US. Today all templates in a bundle are unconditional.

CREATE TABLE IF NOT EXISTS document_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_key text UNIQUE NOT NULL,                -- e.g. 'futurestate-investor-default'
  name text NOT NULL,                             -- e.g. 'Futurestate Investor — Default'
  description text NOT NULL,
  tier text NOT NULL,                             -- free-form taxonomy: 'investor', 'preview', 'admin', etc.
  authored_by text NOT NULL,                      -- clerk super-admin user_id
  retired_at timestamptz,                         -- soft delete
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_bundles_tier
  ON document_bundles(tier) WHERE retired_at IS NULL;

COMMENT ON TABLE document_bundles IS
  'Named packs of document_templates. Super-admin picks a bundle per invite; all bundle templates materialize as user requirements on accept.';


CREATE TABLE IF NOT EXISTS document_bundle_templates (
  bundle_id uuid NOT NULL REFERENCES document_bundles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,
  display_order int NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,         -- optional templates still appear but don't gate completion
  PRIMARY KEY (bundle_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_templates_by_bundle
  ON document_bundle_templates(bundle_id, display_order);

COMMENT ON TABLE document_bundle_templates IS
  'Join table: which templates belong to which bundle, in what order, required vs. optional.';


-- =============================================================================
-- 3. ONBOARDING INVITES — super-admin's "this person is cleared" statement
-- =============================================================================
-- The root of the onboarding flow. Only Tony (super-admin role) creates these.
-- Every invite carries a bundle + access tier + optional access_levels array;
-- the invite_code is the URL-safe token the user receives via email link.
--
-- EXPAND: invite-source tracking — add `source text` (email_drip, manual,
-- referral, api) + `campaign_id uuid` for attribution when invite issuance
-- becomes automated beyond super-admin manual creation.
-- EXPAND: rate-limit / per-admin quotas — add `created_by_email` + index for
-- analytics when multiple admins can issue invites.

CREATE TABLE IF NOT EXISTS onboarding_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text UNIQUE NOT NULL,               -- short URL-safe token (e.g. 'xK7p2aQw9') for ?invite=
  invited_email text NOT NULL,                    -- lowercased on write
  invited_name text,                              -- optional display name ("Hunter Milborne")
  invited_by text NOT NULL,                       -- clerk super-admin user_id
  bundle_id uuid NOT NULL REFERENCES document_bundles(id) ON DELETE RESTRICT,
  target_venture_id text,                         -- e.g. 'futurestate', 'betedge'; null = ecosystem-wide
  access_tier text NOT NULL,                      -- 'investor' | 'preview' | 'admin' | arbitrary
  access_levels jsonb NOT NULL DEFAULT '[]'::jsonb,  -- e.g. ["futurestate:view", "futurestate:invest"]
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'expired', 'revoked'
  )),
  instructions_md text,                           -- personal note from Tony shown on landing page
  expires_at timestamptz NOT NULL,                -- TTL; status auto-flips to 'expired' via cron or read-time check
  accepted_at timestamptz,
  accepted_user_id text,                          -- clerk user_id once claimed
  revoked_at timestamptz,
  revoked_by text,                                -- clerk super-admin user_id
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON onboarding_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_invites_code ON onboarding_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_status_created
  ON onboarding_invites(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invites_accepted_user
  ON onboarding_invites(accepted_user_id) WHERE accepted_user_id IS NOT NULL;

COMMENT ON TABLE onboarding_invites IS
  'Super-admin-issued onboarding clearance. Single source of truth for "who can onboard to what." Accepting an invite materializes user_document_requirements and (on completion) user_access_grants.';


-- =============================================================================
-- 4. USER DOCUMENT REQUIREMENTS — per-user signing checklist
-- =============================================================================
-- Materialized on invite accept: one row per template in the bundle. Each row
-- can optionally point to a signing_envelopes row once the user clicks
-- "Review & Sign" and an envelope is created via MCV Sign's createEnvelope().
--
-- Status lifecycle: pending → envelope_issued → signed (or declined / waived).
--
-- EXPAND: expiration of signatures — compliance may require re-signing after
-- N months (e.g. annual ToS re-ack). Add `signed_expires_at` + a cron that
-- flips rows back to 'pending' when stale.

CREATE TABLE IF NOT EXISTS user_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,                          -- clerk user_id
  invite_id uuid NOT NULL REFERENCES onboarding_invites(id) ON DELETE CASCADE,
  bundle_id uuid NOT NULL REFERENCES document_bundles(id) ON DELETE RESTRICT,
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,
  envelope_id uuid,                               -- references signing_envelopes(id); nullable until envelope created
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- requirement materialized, no envelope yet
    'envelope_issued',   -- envelope created, awaiting user action
    'signed',            -- user signed, envelope completed
    'declined',          -- user rejected in the signer UI
    'waived'             -- super-admin waived this requirement for this user
  )),
  required boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  signed_at timestamptz,
  declined_at timestamptz,
  declined_reason text,
  waived_at timestamptz,
  waived_by text,
  waived_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, invite_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_udr_user_status
  ON user_document_requirements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_udr_invite
  ON user_document_requirements(invite_id);
CREATE INDEX IF NOT EXISTS idx_udr_envelope
  ON user_document_requirements(envelope_id) WHERE envelope_id IS NOT NULL;

COMMENT ON TABLE user_document_requirements IS
  'Per-user signing checklist materialized from a bundle on invite accept. Each row may reference a signing_envelopes row once signing is kicked off. Completion (all required rows = signed) triggers access_grants activation.';


-- =============================================================================
-- 5. USER ACCESS GRANTS — post-onboarding access ledger
-- =============================================================================
-- Written when a user completes all required_docs for an invite. This is the
-- ledger that demo gates read ("does user X have 'futurestate:invest'?").
--
-- EXPAND: time-boxed access — add `expires_at` for NDA-gated time-limited
-- previews (e.g. 30-day evaluation access).
-- EXPAND: audit trail — granular revocation reasons + a grant_events table if
-- grant mutations need full history beyond what event_log provides.

CREATE TABLE IF NOT EXISTS user_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,                          -- clerk user_id
  invite_id uuid REFERENCES onboarding_invites(id) ON DELETE SET NULL,
  venture_id text,                                -- e.g. 'futurestate'; null = ecosystem-wide grant
  access_level text NOT NULL,                     -- e.g. 'futurestate:invest', 'betedge:preview', 'admin:full'
  granted_by text NOT NULL,                       -- clerk user_id (super-admin or 'system' for auto-grants from invite completion)
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by text,
  revoked_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, venture_id, access_level) WHERE revoked_at IS NULL
);

CREATE INDEX IF NOT EXISTS idx_grants_user_active
  ON user_access_grants(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grants_venture_active
  ON user_access_grants(venture_id, access_level) WHERE revoked_at IS NULL;

COMMENT ON TABLE user_access_grants IS
  'Post-onboarding access ledger. Demo gates check for active (revoked_at IS NULL) rows matching required (user_id, venture_id, access_level). Source: automatic on invite-requirement completion, or manual super-admin grant.';


-- =============================================================================
-- 6. SEED — 5 canonical templates + 1 Futurestate investor bundle
-- =============================================================================
-- Body markdown is deliberately realistic-not-final; content should be
-- replaced with counsel-reviewed text before production issuance. The
-- template_key + version combo is what admin flows will reference.
--
-- EXPAND: when counsel delivers final text, bump `version` to 'v1.1' and
-- insert new rows rather than updating existing (preserves the hash-chain
-- of anyone who already signed v1.0 via MCV Sign).
-- =============================================================================

INSERT INTO document_templates (template_key, title, version, summary, body_md, doc_type, authored_by, metadata) VALUES
  (
    'platform-tos',
    'MCV Platform — Terms of Service',
    'v1.0',
    'Binding terms governing your access to and use of the MCV platform and any venture surface you unlock through it.',
    E'# MCV Platform Terms of Service\n\n**Effective date:** 2026-04-24 (v1.0)\n\n## 1. Acceptance\nBy accepting these Terms you enter a binding agreement with MCV Inc. ("MCV") governing your access to the MCV platform, including any venture surface or demo environment unlocked via invite.\n\n## 2. Eligibility\nYou confirm you are at least 18 years old, have legal capacity to contract in your jurisdiction, and are not on any sanctions or prohibited-persons list.\n\n## 3. Invite-gated access\nYour access is granted by named super-admin invite. MCV reserves the right to revoke access at any time. You may not share your invite, credentials, or any demo surface with third parties.\n\n## 4. Confidentiality\nAll non-public information you encounter on the platform — including venture roadmaps, financials, IP inventory, partnership details, and pre-release product — is confidential. The NDA you also sign as part of onboarding governs the specifics.\n\n## 5. Acceptable use\nYou will not (a) reverse engineer, scrape, or automate access beyond explicit API allowances; (b) attempt to bypass authentication, authorization, or rate-limiting controls; (c) use the platform to transmit malware, spam, or unlawful content.\n\n## 6. Intellectual property\nMCV retains all IP in the platform, ventures, brands, and content. Nothing in these Terms transfers IP ownership to you.\n\n## 7. No investment advice\nContent on the platform is for informational purposes only. Unless explicitly presented as a regulated offering (with appropriate jurisdictional filings), nothing here is investment advice, an offer, or a solicitation.\n\n## 8. Changes\nMCV may update these Terms. Material changes will trigger a re-acceptance flow via MCV Sign.\n\n## 9. Governing law\nThese Terms are governed by the laws of the Province of Ontario, Canada.\n\n## 10. Contact\nlegal@mcv.one',
    'terms_of_service',
    'system:seed',
    '{"jurisdiction": "ON/CA", "effective_date": "2026-04-24"}'::jsonb
  ),
  (
    'privacy-policy',
    'MCV Platform — Privacy Policy',
    'v1.0',
    'How MCV collects, uses, and protects your personal information, including biometric signals captured during identity verification.',
    E'# MCV Privacy Policy\n\n**Effective date:** 2026-04-24 (v1.0)\n\n## 1. What we collect\n- **Account data:** name, email, authentication factors (Clerk + passkey).\n- **Identity signals:** passkey credential, optional selfie capture, and trust-engine signals (device fingerprint, WebAuthn attestation). See MCV ID documentation for the full taxonomy.\n- **Compliance data:** accreditation attestations, OFAC/AML check outcomes, document-signature audit trail.\n- **Usage data:** views, events emitted on the typed event bus, API call logs.\n\n## 2. How we use it\n- Granting and gating access to demo environments and venture surfaces.\n- Meeting our legal obligations (KYC/AML, securities compliance where applicable).\n- Improving the platform (aggregate analytics, never sold to third parties).\n\n## 3. Retention\n- Identity signals: retained for as long as your access is active, plus 7 years post-revocation for regulatory audit.\n- Signature audit trail (MCV Sign `signing_envelope_audit`): retained indefinitely as ESIGN evidence.\n\n## 4. Your rights\nYou may request access, correction, or deletion of your data by emailing privacy@mcv.one, subject to legal hold obligations.\n\n## 5. Security\nWe use industry-standard encryption in transit (TLS) and at rest (AES-256). Biometric captures are stored in access-controlled Supabase Storage with service-role-only write.\n\n## 6. International transfers\nData may be processed in the United States, Canada, and Europe. Where applicable, we rely on Standard Contractual Clauses for cross-border transfers.\n\n## 7. Changes\nWe will notify you of material changes and may require re-acceptance via MCV Sign.\n\n## 8. Contact\nprivacy@mcv.one',
    'privacy_policy',
    'system:seed',
    '{"jurisdiction": "ON/CA", "effective_date": "2026-04-24"}'::jsonb
  ),
  (
    'mutual-nda-standard',
    'MCV — Mutual Non-Disclosure Agreement',
    'v1.0',
    'Mutual confidentiality obligations covering non-public information exchanged during your access to MCV venture surfaces.',
    E'# Mutual Non-Disclosure Agreement\n\n**Effective date:** 2026-04-24 (v1.0)\n\n## Parties\n- **MCV Inc.** ("MCV")\n- The individual or entity accepting this agreement ("Recipient")\n\n## 1. Confidential Information\nMeans all non-public information disclosed by either party, including venture roadmaps, financial models, IP inventory, pre-release product, partnership terms, and any information marked or reasonably understood as confidential.\n\n## 2. Obligations\nRecipient will (a) hold Confidential Information in strict confidence; (b) use it solely for the purpose of evaluating the venture surface or offering; (c) not disclose it to any third party without prior written consent; (d) use at least the same degree of care Recipient uses to protect its own confidential information (and no less than reasonable care).\n\n## 3. Exclusions\nObligations do not apply to information that is (a) publicly available without breach; (b) already known to Recipient without obligation of confidence; (c) independently developed without reference to MCV information; (d) required to be disclosed by law or court order, provided MCV is given prompt notice.\n\n## 4. Term\nThree (3) years from the effective date; obligations regarding trade secrets survive indefinitely.\n\n## 5. No license\nNothing in this NDA grants Recipient any license or right in any IP of MCV.\n\n## 6. Remedies\nBreach may cause irreparable harm; MCV is entitled to injunctive relief in addition to any other remedies at law.\n\n## 7. Governing law\nProvince of Ontario, Canada.',
    'nda',
    'system:seed',
    '{"jurisdiction": "ON/CA", "term_years": 3}'::jsonb
  ),
  (
    'accredited-investor-cert',
    'Accredited / Qualified Investor Self-Certification',
    'v1.0',
    'Self-certification of your status as an accredited or equivalent sophisticated investor under applicable securities regulations.',
    E'# Accredited / Qualified Investor Self-Certification\n\n**Effective date:** 2026-04-24 (v1.0)\n\n## Purpose\nThis certification is required before you may view any regulated offering materials or participate in any securities-based venture round. MCV does not rely solely on self-certification for regulated closings — final verification is performed via an independent method (income/net-worth documentation, CPA letter, or third-party verification service).\n\n## Your certification\nBy signing, you certify ONE OR MORE of the following applies to you:\n\n**United States — Regulation D Rule 501:**\n- [ ] Individual net worth (excluding primary residence) > USD $1M, individually or with spouse\n- [ ] Individual income > USD $200,000 in each of the prior two years (or $300,000 with spouse), with reasonable expectation of same in current year\n- [ ] Hold a current Series 7, 65, or 82 license in good standing\n- [ ] Entity with > USD $5M in assets, or all equity owners are accredited\n\n**Canada — NI 45-106:**\n- [ ] Net income before taxes > CAD $200,000 in each of the prior two years (or $300,000 with spouse)\n- [ ] Financial assets (cash/securities) > CAD $1M, individually or with spouse\n- [ ] Net assets > CAD $5M\n\n**Other jurisdictions:**\n- [ ] You qualify as a Professional Client / Qualified Investor / Sophisticated Investor under the applicable law of your jurisdiction\n\n## Acknowledgements\n- You understand that MCV may request documentary verification before any actual offering participation.\n- Misrepresentation of your status may result in immediate termination of access, clawback of any allocation, and legal action.\n- This certification does not constitute an offer of securities; MCV makes no offer by virtue of this document.\n\n## Signature\nBy signing below you attest that the elections checked above are true and accurate as of the signing date.',
    'accreditation_cert',
    'system:seed',
    '{"jurisdictions": ["US", "CA"], "verification_required": true}'::jsonb
  ),
  (
    'risk-acknowledgement',
    'High-Risk Investment Risk Acknowledgement',
    'v1.0',
    'Acknowledgement of the risks associated with early-stage / alternative investments offered through the MCV ecosystem.',
    E'# High-Risk Investment Risk Acknowledgement\n\n**Effective date:** 2026-04-24 (v1.0)\n\nYou are about to access information about, and potentially participate in, investments that carry material risks. Before proceeding, you acknowledge:\n\n## 1. Loss of entire investment\nYou may lose the entire amount of any investment. Early-stage ventures have a high failure rate. Tokenized or alternative instruments may have limited or no market.\n\n## 2. Illiquidity\nInvestments offered through MCV ventures are typically illiquid. You may be unable to sell, redeem, or transfer your position for years, or ever.\n\n## 3. No market / pricing uncertainty\nThere may be no secondary market for any securities or tokens. Valuations shown on the platform are based on the most recent round or model and may not reflect realizable value.\n\n## 4. Regulatory risk\nThe regulatory landscape for alternative assets, RWA, and token-based instruments is evolving. Future regulatory changes could materially affect the value, liquidity, or legality of your investment.\n\n## 5. Concentration risk\nYou should not invest more than you can afford to lose, and any MCV-venture exposure should be a small portion of a diversified portfolio.\n\n## 6. No guarantees\nPast performance, pro forma projections, and target returns are not guarantees. No one at MCV is giving you investment advice; if you want advice, consult an independent licensed advisor.\n\n## 7. Jurisdiction-specific\nYou are responsible for ensuring your participation is legal in your jurisdiction. MCV may block access from jurisdictions where an offering is not registered or exempt.\n\n## Your acknowledgement\nBy signing, you confirm you have read and understood these risks, that you are investing only discretionary capital, and that you accept the possibility of total loss.',
    'risk_acknowledgement',
    'system:seed',
    '{}'::jsonb
  )
ON CONFLICT (template_key) DO NOTHING;


-- Seed bundle: the Futurestate Investor Default pack (all 5 templates in canonical order)
INSERT INTO document_bundles (bundle_key, name, description, tier, authored_by, metadata) VALUES
  (
    'futurestate-investor-default',
    'Futurestate Investor — Default',
    'Baseline document pack required for any invite granting Futurestate investor-tier access. Covers platform ToS, privacy, NDA, accreditation self-certification, and high-risk acknowledgement.',
    'investor',
    'system:seed',
    '{"ventures": ["futurestate"], "access_levels_suggested": ["futurestate:view", "futurestate:invest"]}'::jsonb
  )
ON CONFLICT (bundle_key) DO NOTHING;

-- Wire the 5 templates into the Futurestate Investor bundle with display order.
-- Uses subqueries so it's safe to re-run (ON CONFLICT on the composite PK).
INSERT INTO document_bundle_templates (bundle_id, template_id, display_order, required)
SELECT
  (SELECT id FROM document_bundles WHERE bundle_key = 'futurestate-investor-default'),
  (SELECT id FROM document_templates WHERE template_key = k.template_key),
  k.display_order,
  true
FROM (VALUES
  ('platform-tos', 1),
  ('privacy-policy', 2),
  ('mutual-nda-standard', 3),
  ('accredited-investor-cert', 4),
  ('risk-acknowledgement', 5)
) AS k(template_key, display_order)
ON CONFLICT (bundle_id, template_id) DO NOTHING;


-- =============================================================================
-- 7. NOTES FOR EXPANSION (grep // EXPAND: across this file for inline flags)
-- =============================================================================
-- When the Agentic OS reaches M3 (agent-fleet) and the specialized Documentation
-- OS team is spun up (see memory: project_documentation_os_future.md), THIS
-- migration is the last-mile onboarding scaffolding — everything that needs
-- to grow into a full doc OS (templating engine, multi-locale, provenance
-- graph, cross-venture auto-sync) should be greenfield under their
-- architecture, not bolted onto this table set.
--
-- Tables owned by THIS migration are intentionally narrow:
--   · legal-doc-style content (ToS, NDA, privacy, etc.)
--   · invite-driven assignment (not open catalog)
--   · gate-status tracking (signed / waived / declined)
-- That's it. If future work wants to add "internal wiki docs," "API refs,"
-- or "automated venture-doc-sync," it should be a separate module, not
-- extensions to document_templates / user_document_requirements.
-- =============================================================================
