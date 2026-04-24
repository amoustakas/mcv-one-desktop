/**
 * Seed agent_drafts for the Draft Inbox demo.
 *
 * Upserts the same 7 drafts that supabase/migration-agent-drafts-2026-04-24.sql
 * seeds (idempotent on `created_key`), and additionally writes a
 * `agentic.draft.created` event into event_log per draft so the EventStreamView
 * lights up when the script runs.
 *
 * Usage:
 *   npx tsx scripts/seed-agent-drafts.ts                 # live run
 *   npx tsx scripts/seed-agent-drafts.ts --dry-run       # plan only, no writes
 *
 * Env (loaded from .env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Plan: C:\Users\moust\.claude\plans\lets-check-out-where-unified-pearl.md
 * Schema: supabase/migration-agent-drafts-2026-04-24.sql
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// ───────────────────────────────────────────────────────────────────────────
// Load .env.local (mirrors seed-github-repos.ts).
// ───────────────────────────────────────────────────────────────────────────
(function loadEnvLocal() {
  const cwd = process.cwd();
  for (const name of ['.env.local', '.env']) {
    const p = path.join(cwd, name);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const eq = line.indexOf('=');
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
})();

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY in .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface SeedDraft {
  draft_type:
    | 'nda'
    | 'ip_filing'
    | 'domain_acquisition'
    | 'contract_redline'
    | 'investor_update'
    | 'counsel_engagement_letter'
    | 'entity_formation';
  title: string;
  summary: string;
  body_md: string;
  emitter_agent: string;
  target_venture: string | null;
  context_refs: Array<{ kind: string; id: string; label: string }>;
  created_key: string;
}

const DRAFTS: SeedDraft[] = [
  {
    draft_type: 'nda',
    title: 'Mutual NDA — Goodmans LLP (IP workstream)',
    summary: 'NDA draft for Goodmans LLP so we can unlock P0 trade-secret disclosure on the FutureState partnership.',
    body_md: [
      '## Parties',
      '- MCV Inc. ("Disclosing")',
      '- Goodmans LLP ("Receiving")',
      '',
      '## Term',
      '3 years from execution; survivorship on trade-secret clauses indefinite.',
      '',
      '## Scope of Confidential Information',
      '- FutureState RWA program specifications',
      '- Hunter Milborne / Kirill Soloviev partnership structure',
      '- Draft trademark filings (MOOSETOWN, others)',
      '',
      '## Next step',
      'On approval, counsel inbox routes to Goodmans intake contact.',
    ].join('\n'),
    emitter_agent: 'argus',
    target_venture: 'mcv-inc-crown',
    context_refs: [{ kind: 'counsel_engagement', id: 'goodmans-ip', label: 'Goodmans LLP · IP' }],
    created_key: 'seed:nda-goodmans',
  },
  {
    draft_type: 'ip_filing',
    title: 'Trademark: MOOSETOWN — Class 9/42 USPTO',
    summary: 'P0 filing — blocks the FutureState disclosure gate. Standard-character mark.',
    body_md: [
      '## Mark',
      'MOOSETOWN (standard-character)',
      '',
      '## Classes',
      '- 9 (software)',
      '- 42 (SaaS / computer services)',
      '',
      '## Jurisdictions',
      'US first (priority date); Madrid Protocol extension to CA/UK/EU after 30-day clear.',
      '',
      '## Evidence of use',
      'Intent-to-use — no commercial use yet.',
    ].join('\n'),
    emitter_agent: 'argus',
    target_venture: 'mcv-inc-crown',
    context_refs: [{ kind: 'ip_mark', id: 'moosetown-std', label: 'MOOSETOWN' }],
    created_key: 'seed:filing-moosetown-us',
  },
  {
    draft_type: 'domain_acquisition',
    title: 'Acquire futurestate.capital — 7-day window',
    summary: 'Red-tier acquisition; gates the Hunter Milborne disclosure announcement.',
    body_md: [
      '## Domain',
      'futurestate.capital',
      '',
      '## Registrar',
      'Namecheap broker (already in contact with seller)',
      '',
      '## Price',
      'USD 4,200 (floor) — seller opened at 6,500; expect to close around 4,800.',
      '',
      '## Rationale',
      "Without this domain, the partnership cannot be announced without legal risk per IP Inventory §6.4.",
    ].join('\n'),
    emitter_agent: 'atlas',
    target_venture: 'futurestate',
    context_refs: [{ kind: 'acquisition_order', id: 'futurestate-capital', label: '🔴 red_7day' }],
    created_key: 'seed:acq-futurestate-capital',
  },
  {
    draft_type: 'contract_redline',
    title: 'Redline — Milborne Partnership LOI v3',
    summary: 'Counter-proposal on rev-share and IP assignment clauses for the Hunter Milborne LOI.',
    body_md: [
      '## Proposed edits',
      '- §4.2: rev-share 60/40 → 65/35 (MCV favored)',
      '- §7.1: delete mutual IP assignment, replace with license-back',
      '- §11: 12-month non-solicit instead of 24-month',
      '',
      '## Rationale',
      "Mutual IP assignment would compromise MCV's ability to spin FutureState as a standalone entity later. License-back preserves optionality.",
    ].join('\n'),
    emitter_agent: 'aegis',
    target_venture: 'futurestate',
    context_refs: [{ kind: 'document', id: 'milborne-loi-v2', label: 'Milborne LOI v2' }],
    created_key: 'seed:redline-milborne-loi',
  },
  {
    draft_type: 'investor_update',
    title: 'Q2-2026 investor update — seed round recap',
    summary: 'Quarterly update to 14 seed investors covering all 5 live ventures + treasury runway.',
    body_md: [
      '## TL;DR',
      '- Runway: 14 months at current burn',
      '- Booked ARR: growing (precise figure in treasury tab)',
      '- FutureState disclosure gate: 3 of 4 P0 items green',
      '- Foundation-OS v1 shipped April 23 (operator cockpit)',
      '',
      '## Asks',
      '- 2 intros to RWA-focused LPs for the FutureState round',
      '- 1 intro to a securities-focused partner at WSGR or similar',
    ].join('\n'),
    emitter_agent: 'atlas',
    target_venture: null,
    context_refs: [],
    created_key: 'seed:investor-q2-2026',
  },
  {
    draft_type: 'counsel_engagement_letter',
    title: 'Engagement letter — Wilson Sonsini (Securities)',
    summary: 'Retainer + scope for Reg D / Reg S work ahead of the FutureState seed round.',
    body_md: [
      '## Scope',
      '- Reg D Rule 506(c) filing prep',
      '- Form D on EDGAR',
      '- Accredited-investor verification workflow review',
      '- Blue Sky Notice filings in DE, CA, NY',
      '',
      '## Fee',
      'Flat USD 18,000 + filing fees (passthrough, ~USD 2,400 total).',
      '',
      '## Next step',
      'On approval: counter-sign, wire retainer, kick off first diligence call.',
    ].join('\n'),
    emitter_agent: 'argus',
    target_venture: 'mcv-inc-crown',
    context_refs: [{ kind: 'counsel_engagement', id: 'wsgr-securities', label: 'WSGR · Securities' }],
    created_key: 'seed:engage-wsgr',
  },
  {
    draft_type: 'entity_formation',
    title: 'Form MCV Futurestate Holdings Ltd (ON)',
    summary: 'Subsidiary under MCV LTD for FutureState operations. Ontario corporation.',
    body_md: [
      '## Entity',
      'MCV Futurestate Holdings Ltd.',
      '',
      '## Jurisdiction',
      'Ontario, Canada (parent: MCV LTD)',
      '',
      '## Rationale',
      'Isolates FutureState RWA operations in a compliant jurisdiction for the Canadian investor base. Parent-sub structure preserves tax optionality.',
      '',
      '## Filing path',
      'Goodmans handles incorporation + initial share structure. Timeline: ~5 business days.',
    ].join('\n'),
    emitter_agent: 'aegis',
    target_venture: 'futurestate',
    context_refs: [{ kind: 'entity', id: 'mcv-ltd-crown', label: 'parent: MCV LTD' }],
    created_key: 'seed:entity-futurestate-on',
  },
];

async function main() {
  console.log(`Seeding ${DRAFTS.length} agent drafts${dryRun ? ' (dry-run)' : ''}…`);

  if (dryRun) {
    for (const d of DRAFTS) {
      console.log(`  · ${d.created_key} — ${d.title}`);
    }
    console.log('Dry-run complete — no writes.');
    return;
  }

  const { data, error } = await supabase
    .from('agent_drafts')
    .upsert(
      DRAFTS.map((d) => ({
        draft_type: d.draft_type,
        title: d.title,
        summary: d.summary,
        body_md: d.body_md,
        emitter_agent: d.emitter_agent,
        target_venture: d.target_venture,
        context_refs: d.context_refs,
        created_key: d.created_key,
      })),
      { onConflict: 'created_key', ignoreDuplicates: false },
    )
    .select('id, title, draft_type, target_venture, emitter_agent, created_key');

  if (error) {
    console.error('Upsert failed:', error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`Upserted ${rows.length} rows into agent_drafts.`);

  // Emit one agentic.draft.created per row so the EventStreamView glows on seed.
  let emitted = 0;
  for (const r of rows) {
    const source = DRAFTS.find((d) => d.created_key === r.created_key);
    const { error: evErr } = await supabase.from('event_log').insert({
      topic: 'agentic.draft.created',
      schema_version: '1.0',
      correlation_id: crypto.randomUUID(),
      emitted_by: 'script:seed-agent-drafts',
      payload: {
        draftId: r.id,
        draftType: r.draft_type,
        title: r.title,
        emitterAgent: r.emitter_agent,
        targetVenture: r.target_venture,
        summary: source?.summary ?? '',
      },
      status: 'published',
    });
    if (evErr) {
      console.warn(`  event emit failed for ${r.created_key}: ${evErr.message}`);
    } else {
      emitted += 1;
    }
  }
  console.log(`Emitted ${emitted} / ${rows.length} agentic.draft.created events.`);
  console.log('Done. Open Foundation → Draft Inbox in the desktop to review.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
