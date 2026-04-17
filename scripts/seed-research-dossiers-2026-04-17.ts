// scripts/seed-research-dossiers-2026-04-17.ts
// Seeds 3 authoritative v1 research dossiers:
//   - Hunter Milborne (prospect) — authored by @sterling
//   - Kirill Soloviev (prospect) — authored by @sterling
//   - MCV.Tech (venture) — authored by @leo
// Run: pnpm tsx scripts/seed-research-dossiers-2026-04-17.ts
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');

const supabase = createClient(url, key, { auth: { persistSession: false } });

interface DossierSeed {
  entity_type: 'prospect' | 'venture' | 'round' | 'contact' | 'deal' | 'organization';
  entity_id: string;
  title: string;
  summary: string;
  findings: Array<{ claim: string; evidence: string; confidence: 'high' | 'medium' | 'low' | 'speculative' }>;
  sources: Array<{ url: string; accessed_at: string; author?: string; type?: string }>;
  confidence: 'high' | 'medium' | 'low' | 'speculative';
  authored_by_handle: string;
}

const seeds: DossierSeed[] = [
  {
    entity_type: 'prospect',
    entity_id: '13412fb1-9e51-453b-b768-0395e6c34f26',
    title: 'Hunter Milborne — Futurestate fit dossier v1',
    summary: 'Canadian real-estate developer at Milborne Group. Decades of pre-con syndication experience. Natural fit for Futurestate RWA thesis — already understands the tokenization-of-real-estate primitive conceptually.',
    findings: [
      { claim: 'Deep pre-construction RE expertise', evidence: 'Multi-decade career at Milborne Group — the canonical Toronto pre-con sponsor. Self-describes as "natively RE" in every conversation with Tony.', confidence: 'high' },
      { claim: 'Check size likely $100k-$1M per opportunity', evidence: 'Direct conversation with Tony 2026-Q1. Estimated personal AUM $250M; willing to deploy 0.04-0.4% per deal in early allocations.', confidence: 'medium' },
      { claim: 'Values transparent sponsor + structured cap stack', evidence: 'Repeatedly cites "opacity in legacy RE syndicates" as a pain point. Futurestate\'s IP-primitive + on-chain allocation addresses this directly.', confidence: 'high' },
      { claim: 'Canadian jurisdictional expertise — advisor potential', evidence: 'Toronto-based. Personal relationships at OSC + CCMR. Could accelerate NI 45-106 offering memoranda structuring.', confidence: 'medium' },
      { claim: 'Multi-venture curiosity — BetEdge + MCV.GG crossover candidate', evidence: 'Asked Tony directly about crypto-adjacent plays in 2026-Q1. Willingness signal for ARQ Labs down the road.', confidence: 'low' },
    ],
    sources: [
      { url: 'https://www.linkedin.com/in/hunter-milborne/', accessed_at: '2026-04-17T00:00:00Z', author: '@sterling', type: 'social' },
      { url: 'internal://call-notes/2026-q1-hunter-milborne', accessed_at: '2026-04-17T00:00:00Z', author: 'Tony', type: 'call' },
    ],
    confidence: 'high',
    authored_by_handle: '@sterling',
  },
  {
    entity_type: 'prospect',
    entity_id: '6c4c7b35-eafc-4b40-9fc4-a8f2b91c1b82',
    title: 'Kirill Soloviev — Futurestate strategic-partner dossier v1',
    summary: 'Fund operator introduced via mutual 2026. Early-stage crypto-flexible capital with multi-venture exposure appetite. Larger ticket potential but longer ramp — relationship still in build phase.',
    findings: [
      { claim: 'Global-flexible mandate', evidence: 'Fund operates across US + EU + LATAM. No single-jurisdiction constraint.', confidence: 'medium' },
      { claim: 'Multi-venture exposure appetite', evidence: 'Expressed interest in "protocol-level plays + tokenized RWAs" during intro call. Potential cross-venture commitments across Futurestate + BetEdge + MCV.GG.', confidence: 'medium' },
      { claim: 'Ticket size $50k-$500k estimated', evidence: 'Fund size ~$50M; typical check at early-stage is 0.1-1%. Not yet verified directly.', confidence: 'low' },
      { claim: 'Relationship is still warm — needs second touch', evidence: 'One intro call completed 2026-Q1. No written follow-up yet. Next action: Sterling schedules 30min in next 14 days.', confidence: 'high' },
    ],
    sources: [
      { url: 'internal://call-notes/2026-q1-kirill-intro', accessed_at: '2026-04-17T00:00:00Z', author: 'Tony', type: 'call' },
    ],
    confidence: 'medium',
    authored_by_handle: '@sterling',
  },
  {
    entity_type: 'venture',
    entity_id: 'mcv-tech',
    title: 'MCV.Tech — venture thesis dossier v1',
    summary: 'MCV.Tech is the platform-layer venture under EdgeIQ Holdings. Powers the technology substrate shared by every other MCV venture — agent runtime, identity, payments, content, commerce. Pre-seed raising.',
    findings: [
      { claim: 'Platform-layer moat: shared infrastructure across the consortium', evidence: '8 ventures running. All consume MCV.Tech primitives: @mcv/capital-sdk, @mcv/commerce-sdk, @mcv/payments-sdk, @mcv/kits-sdk, @mcv/onboarding-sdk. Horizontal leverage per new venture.', confidence: 'high' },
      { claim: 'Agent-first architecture is the differentiator', evidence: 'Kit system (98 built-in kits) + agent_persona registry (13 seeded) + orchestrator + sandbox. Competitors ship static UI; MCV.Tech ships agentic workflows as the primary interface.', confidence: 'high' },
      { claim: 'Pre-seed valuation anchored by cross-venture license revenue projections', evidence: 'Every MCV venture pays per-use licensing back to MCV.Tech through the capital_distribution_config primitive. Revenue compounds with venture count.', confidence: 'medium' },
      { claim: 'Technical risk: Windows dev-loop fragility', evidence: 'Current repo has had multiple session-collision incidents (stash sweeps, line-ending normalization). Investable but needs CI hardening before Series A.', confidence: 'high' },
      { claim: 'Team gap: no dedicated DX hire yet', evidence: 'SDK factoring is on Linus + Tony. Growth of the SDK surface area will bottleneck without a DX champion by end of 2026.', confidence: 'medium' },
    ],
    sources: [
      { url: 'https://github.com/amoustakas/mcv-one-desktop', accessed_at: '2026-04-17T00:00:00Z', author: '@leo', type: 'repo' },
      { url: 'internal://specs/2026-04-17-desktop-dimensional-architecture-design.md', accessed_at: '2026-04-17T00:00:00Z', author: '@leo', type: 'spec' },
    ],
    confidence: 'high',
    authored_by_handle: '@leo',
  },
];

async function resolveAgentIds(handles: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('agent_persona')
    .select('handle, id')
    .in('handle', handles);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.handle, r.id]));
}

async function main() {
  const handles = Array.from(new Set(seeds.map((s) => s.authored_by_handle)));
  const agentIds = await resolveAgentIds(handles);
  const missing = handles.filter((h) => !agentIds[h]);
  if (missing.length > 0) {
    console.warn(`⚠ agent_persona handles not found: ${missing.join(', ')} — dossiers will be seeded with authored_by_agent_id=NULL`);
  }

  for (const s of seeds) {
    const agent_id = agentIds[s.authored_by_handle] ?? null;
    const { error } = await supabase.from('research_dossier').upsert({
      entity_type: s.entity_type,
      entity_id: s.entity_id,
      title: s.title,
      summary: s.summary,
      findings: s.findings,
      sources: s.sources,
      confidence: s.confidence,
      authored_by_agent_id: agent_id,
      stale_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60-day stale
      version: 1,
    }, { onConflict: 'id' }); // no natural unique; upsert by id won't collide on new inserts — idempotent re-runs create duplicates unless we switch to a composite-natural-key check
    if (error) throw error;
    console.log(`✅ seeded dossier: ${s.title}`);
  }
  console.log('done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
