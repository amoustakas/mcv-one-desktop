-- supabase/migration-agent-drafts-2026-04-24.sql
-- Agentic OS · Layer 4 · Draft Inbox
--
-- The "Tony's morning inbox" surface: drafts produced by agents (or, for the
-- Waterloo demo, by the seed script) that require a human decision.
--
-- Seven plausible seed drafts land here via ON CONFLICT DO NOTHING on
-- `created_key`, so re-running the migration or the seed script is idempotent.
-- Writes go through /api/agentic (service-role); no RLS needed on this
-- Foundation-tier registry.

CREATE TABLE IF NOT EXISTS agent_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_type text NOT NULL CHECK (draft_type IN (
    'nda',
    'ip_filing',
    'domain_acquisition',
    'contract_redline',
    'investor_update',
    'counsel_engagement_letter',
    'entity_formation'
  )),
  title text NOT NULL,
  summary text NOT NULL,
  body_md text NOT NULL,
  emitter_agent text NOT NULL,
  target_venture text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'edited'
  )),
  context_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by text,
  created_key text UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_agent_drafts_status_created
  ON agent_drafts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_type
  ON agent_drafts(draft_type);

COMMENT ON TABLE agent_drafts IS
  'Agentic OS draft inbox. Each row is a human-review item produced by an agent (NDA, filing, redline, etc.) — approve/reject/edit transitions emit events on the agentic.* topic family.';

-- ─── Seed: 7 plausible demo drafts (idempotent via created_key) ───────────
INSERT INTO agent_drafts (draft_type, title, summary, body_md, emitter_agent, target_venture, context_refs, created_key) VALUES
  (
    'nda',
    'Mutual NDA — Goodmans LLP (IP workstream)',
    'NDA draft for Goodmans LLP so we can unlock P0 trade-secret disclosure on the FutureState partnership.',
    '## Parties' || E'\n' ||
    '- MCV Inc. ("Disclosing")' || E'\n' ||
    '- Goodmans LLP ("Receiving")' || E'\n\n' ||
    '## Term' || E'\n' ||
    '3 years from execution; survivorship on trade-secret clauses indefinite.' || E'\n\n' ||
    '## Scope of Confidential Information' || E'\n' ||
    '- FutureState RWA program specifications' || E'\n' ||
    '- Hunter Milborne / Kirill Soloviev partnership structure' || E'\n' ||
    '- Draft trademark filings (MOOSETOWN, others)' || E'\n\n' ||
    '## Next step' || E'\n' ||
    'On approval, counsel inbox routes to Goodmans intake contact.',
    'argus',
    'mcv-inc-crown',
    '[{"kind":"counsel_engagement","id":"goodmans-ip","label":"Goodmans LLP · IP"}]'::jsonb,
    'seed:nda-goodmans'
  ),
  (
    'ip_filing',
    'Trademark: MOOSETOWN — Class 9/42 USPTO',
    'P0 filing — blocks the FutureState disclosure gate. Standard-character mark.',
    '## Mark' || E'\n' ||
    'MOOSETOWN (standard-character)' || E'\n\n' ||
    '## Classes' || E'\n' ||
    '- 9 (software)' || E'\n' ||
    '- 42 (SaaS / computer services)' || E'\n\n' ||
    '## Jurisdictions' || E'\n' ||
    'US first (priority date); Madrid Protocol extension to CA/UK/EU after 30-day clear.' || E'\n\n' ||
    '## Evidence of use' || E'\n' ||
    'Intent-to-use — no commercial use yet.',
    'argus',
    'mcv-inc-crown',
    '[{"kind":"ip_mark","id":"moosetown-std","label":"MOOSETOWN"}]'::jsonb,
    'seed:filing-moosetown-us'
  ),
  (
    'domain_acquisition',
    'Acquire futurestate.capital — 7-day window',
    'Red-tier acquisition; gates the Hunter Milborne disclosure announcement.',
    '## Domain' || E'\n' ||
    'futurestate.capital' || E'\n\n' ||
    '## Registrar' || E'\n' ||
    'Namecheap broker (already in contact with seller)' || E'\n\n' ||
    '## Price' || E'\n' ||
    'USD 4,200 (floor) — seller opened at 6,500; expect to close around 4,800.' || E'\n\n' ||
    '## Rationale' || E'\n' ||
    'Without this domain, the partnership cannot be announced without legal risk per IP Inventory §6.4.',
    'atlas',
    'futurestate',
    '[{"kind":"acquisition_order","id":"futurestate-capital","label":"🔴 red_7day"}]'::jsonb,
    'seed:acq-futurestate-capital'
  ),
  (
    'contract_redline',
    'Redline — Milborne Partnership LOI v3',
    'Counter-proposal on rev-share and IP assignment clauses for the Hunter Milborne LOI.',
    '## Proposed edits' || E'\n' ||
    '- §4.2: rev-share 60/40 → 65/35 (MCV favored)' || E'\n' ||
    '- §7.1: delete mutual IP assignment, replace with license-back' || E'\n' ||
    '- §11: 12-month non-solicit instead of 24-month' || E'\n\n' ||
    '## Rationale' || E'\n' ||
    'Mutual IP assignment would compromise MCV''s ability to spin FutureState as a standalone entity later. License-back preserves optionality.',
    'aegis',
    'futurestate',
    '[{"kind":"document","id":"milborne-loi-v2","label":"Milborne LOI v2"}]'::jsonb,
    'seed:redline-milborne-loi'
  ),
  (
    'investor_update',
    'Q2-2026 investor update — seed round recap',
    'Quarterly update to 14 seed investors covering all 5 live ventures + treasury runway.',
    '## TL;DR' || E'\n' ||
    '- Runway: 14 months at current burn' || E'\n' ||
    '- Booked ARR: growing (precise figure in treasury tab)' || E'\n' ||
    '- FutureState disclosure gate: 3 of 4 P0 items green' || E'\n' ||
    '- Foundation-OS v1 shipped April 23 (operator cockpit)' || E'\n\n' ||
    '## Asks' || E'\n' ||
    '- 2 intros to RWA-focused LPs for the FutureState round' || E'\n' ||
    '- 1 intro to a securities-focused partner at WSGR or similar',
    'atlas',
    NULL,
    '[]'::jsonb,
    'seed:investor-q2-2026'
  ),
  (
    'counsel_engagement_letter',
    'Engagement letter — Wilson Sonsini (Securities)',
    'Retainer + scope for Reg D / Reg S work ahead of the FutureState seed round.',
    '## Scope' || E'\n' ||
    '- Reg D Rule 506(c) filing prep' || E'\n' ||
    '- Form D on EDGAR' || E'\n' ||
    '- Accredited-investor verification workflow review' || E'\n' ||
    '- Blue Sky Notice filings in DE, CA, NY' || E'\n\n' ||
    '## Fee' || E'\n' ||
    'Flat USD 18,000 + filing fees (passthrough, ~USD 2,400 total).' || E'\n\n' ||
    '## Next step' || E'\n' ||
    'On approval: counter-sign, wire retainer, kick off first diligence call.',
    'argus',
    'mcv-inc-crown',
    '[{"kind":"counsel_engagement","id":"wsgr-securities","label":"WSGR · Securities"}]'::jsonb,
    'seed:engage-wsgr'
  ),
  (
    'entity_formation',
    'Form MCV Futurestate Holdings Ltd (ON)',
    'Subsidiary under MCV LTD for FutureState operations. Ontario corporation.',
    '## Entity' || E'\n' ||
    'MCV Futurestate Holdings Ltd.' || E'\n\n' ||
    '## Jurisdiction' || E'\n' ||
    'Ontario, Canada (parent: MCV LTD)' || E'\n\n' ||
    '## Rationale' || E'\n' ||
    'Isolates FutureState RWA operations in a compliant jurisdiction for the Canadian investor base. Parent-sub structure preserves tax optionality.' || E'\n\n' ||
    '## Filing path' || E'\n' ||
    'Goodmans handles incorporation + initial share structure. Timeline: ~5 business days.',
    'aegis',
    'futurestate',
    '[{"kind":"entity","id":"mcv-ltd-crown","label":"parent: MCV LTD"}]'::jsonb,
    'seed:entity-futurestate-on'
  )
ON CONFLICT (created_key) DO NOTHING;
