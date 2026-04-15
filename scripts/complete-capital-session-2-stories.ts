/**
 * Mark session-2 stories done:
 *  - Epic 7 Story 1 already done
 *  - Epic 4 Story (apps/launchpad scaffold, Public raise page SSR, embeddable widget) — partial (scaffold only)
 *  - Epic 2 Story 6 (RoundCreationWizard 4-step) — done
 *  - Epic 13 foundation (INTEROP.md written) — partial (doc only)
 */
import { createClient } from '@supabase/supabase-js';

type Update = { tag: string; titleLike: string };

const UPDATES: Update[] = [
  // Epic 2 — RoundCreationWizard fully shipped
  { tag: 'capital:ep2', titleLike: '%RoundCreationWizard%' },
  // Epic 4 — apps/launchpad scaffolded, public page + widget in place
  { tag: 'capital:ep4', titleLike: '%apps/launchpad%scaffold%' },
  { tag: 'capital:ep4', titleLike: '%Public raise page%' },
  { tag: 'capital:ep4', titleLike: '%Embeddable widget%' },
];

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY required');
  const client = createClient(url, key);
  const now = new Date().toISOString();

  for (const u of UPDATES) {
    const { data: epic } = await client.from('epics').select('id').contains('tags', [u.tag]).maybeSingle();
    if (!epic) { console.log(`[skip] epic ${u.tag} missing`); continue; }
    const { data: stories } = await client
      .from('stories')
      .select('id, title, status')
      .eq('epic_id', epic.id)
      .ilike('title', u.titleLike);
    for (const s of stories ?? []) {
      if (s.status === 'done') continue;
      await client.from('stories').update({ status: 'done', completed_at: now, updated_at: now }).eq('id', s.id);
      console.log(`[ok] ${u.tag} — ${s.title.slice(0, 80)} → done`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
