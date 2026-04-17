// scripts/seed-operator-prospects-hunter-kirill.ts
// Seeds Tony's first two operator-authored prospects.
// Hunter Milborne — Canadian RE developer, Milborne Group.
// Kirill Soloviev — strategic partner / fund operator.
// Both assigned Quinn as default Futurestate investor persona.
// Run: pnpm tsx scripts/seed-operator-prospects-hunter-kirill.ts
//
// SCHEMA: Tables are SINGULAR (prospect_profile, prospect_journey, agent_persona).
// prospect_journey FK is prospect_id (uuid). agent_id is uuid, resolved from agent_persona.handle.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');

const supabase = createClient(url, key, { auth: { persistSession: false } });

interface OperatorSeed {
  email: string;
  full_name: string;
  country: string;
  role_hint: string;
  source_venture_id: string;
  intake_source: 'operator';
  operator_notes: string;
  relationship_history: string;
  prior_deals: string[];
  aum_estimate: number;
  check_size_range: string;
  investor_thesis: string;
  social_profiles: Record<string, string>;
  priority: 'hot' | 'warm' | 'medium' | 'cold';
  archetype: string;
}

const seeds: OperatorSeed[] = [
  {
    email: 'hunter@milbornegroup.example',
    full_name: 'Hunter Milborne',
    country: 'Canada',
    role_hint: 'Founder · Milborne Group · Canadian RE developer',
    source_venture_id: 'futurestate',
    intake_source: 'operator',
    operator_notes: 'Long relationship. Understands pre-construction deeply. Natural fit for Futurestate RWA thesis — sees the IP primitive.',
    relationship_history: 'Known Tony several years via Toronto RE circles. Multiple prior conversations about structured RE vehicles.',
    prior_deals: ['Toronto pre-con syndicate participation (prior firms)', 'Advisory discussions on RWA tokenization'],
    aum_estimate: 250_000_000,
    check_size_range: '$100k–$1M',
    investor_thesis: 'Real estate + tokenization. Canadian jurisdictional expertise. Values structured sponsor + transparency.',
    social_profiles: { linkedin: 'https://www.linkedin.com/in/hunter-milborne/' },
    priority: 'hot',
    archetype: 'investor',
  },
  {
    email: 'kirill@solovievfund.example',
    full_name: 'Kirill Soloviev',
    country: 'Global',
    role_hint: 'Fund operator · strategic partner',
    source_venture_id: 'futurestate',
    intake_source: 'operator',
    operator_notes: 'Strategic introduction. Potential for larger ticket + multi-venture exposure. Evaluate for BetEdge + MCV.GG crossover.',
    relationship_history: 'Introduced 2026. Initial call pending; warm via mutual.',
    prior_deals: [],
    aum_estimate: 50_000_000,
    check_size_range: '$50k–$500k',
    investor_thesis: 'Global-flexible. Interested in protocol-level plays + tokenized RWAs.',
    social_profiles: {},
    priority: 'warm',
    archetype: 'investor',
  },
];

async function resolveQuinnAgentId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('agent_persona')
    .select('id')
    .eq('handle', 'Quinn')
    .maybeSingle();
  if (error) {
    console.warn(`[seed] Quinn lookup failed: ${error.message}`);
    return null;
  }
  return data?.id ?? null;
}

async function main() {
  const quinnId = await resolveQuinnAgentId();
  if (!quinnId) {
    console.warn('⚠ Quinn persona not found in agent_persona — seeding journeys with agent_id=NULL. Re-run after T5 persona seed.');
  } else {
    console.log(`✓ Quinn resolved to agent_id ${quinnId}`);
  }

  for (const s of seeds) {
    const { data: profile, error: pe } = await supabase
      .from('prospect_profile')
      .upsert(s, { onConflict: 'email' })
      .select('*')
      .single();
    if (pe) throw pe;

    const { data: existing } = await supabase
      .from('prospect_journey')
      .select('id')
      .eq('prospect_id', profile.id)
      .maybeSingle();

    if (!existing) {
      const { error: je } = await supabase.from('prospect_journey').insert({
        prospect_id: profile.id,
        track: 'investor_accredited',
        status: 'active',
        current_step_index: 0,
        agent_id: quinnId,
        metadata: { venture_id: s.source_venture_id, intake_source: 'operator' },
      });
      if (je) throw je;
      console.log(`✅ seeded + journey: ${s.full_name}`);
    } else {
      console.log(`↺ upserted (journey existed): ${s.full_name}`);
    }
  }
  console.log('done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
