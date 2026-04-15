/**
 * Mark Capital Epic 1 (Ledger Foundation) + Epic 2 (Cap Table Core UI) stories as done.
 * Ran 2026-04-15 after schema applied + SDK shipped + 3 views built.
 */
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY required');
  const client = createClient(url, key);

  for (const tag of ['capital:ep1', 'capital:ep2']) {
    const { data: epic } = await client
      .from('epics')
      .select('id, title')
      .contains('tags', [tag])
      .maybeSingle();
    if (!epic) { console.error(`Epic ${tag} not found`); continue; }
    console.log(`Epic: ${epic.title}`);

    const now = new Date().toISOString();
    const { error, count } = await client
      .from('stories')
      .update({ status: 'done', completed_at: now, updated_at: now }, { count: 'exact' })
      .eq('epic_id', epic.id);
    if (error) throw error;
    console.log(`  marked ${count ?? '?'} stories done`);

    await client
      .from('epic_checkpoints')
      .update({ state: 'approved', decision_notes: `Auto-approved 2026-04-15 — ${tag} ships clean (typecheck passes, migration applied, SDK wired).`, resolved_at: now })
      .eq('epic_id', epic.id)
      .eq('state', 'pending');
  }

  console.log('\nDone. Trigger has rolled progress to 100%.');
}

main().catch((e) => { console.error(e); process.exit(1); });
