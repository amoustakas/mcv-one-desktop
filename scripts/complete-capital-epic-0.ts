/**
 * Mark Epic 0 (Capital Prereqs) stories as done.
 * Ran 2026-04-15 at the end of Epic 0 execution. One-shot; safe to re-run.
 */
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY required');
  const client = createClient(url, key);

  const { data: epic } = await client
    .from('epics')
    .select('id, title')
    .contains('tags', ['capital:ep0'])
    .maybeSingle();

  if (!epic) {
    console.error('Epic capital:ep0 not found');
    process.exit(1);
  }
  console.log(`Epic: ${epic.title} (${epic.id})`);

  const { data: stories } = await client
    .from('stories')
    .select('id, title, status')
    .eq('epic_id', epic.id);

  if (!stories?.length) {
    console.log('No stories to complete');
    return;
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from('stories')
    .update({ status: 'done', completed_at: now, updated_at: now })
    .eq('epic_id', epic.id);

  if (error) throw error;

  console.log(`[ok] Marked ${stories.length} stories as done. Trigger will auto-roll-up epic progress.`);

  // Resolve the spec-review checkpoint
  await client
    .from('epic_checkpoints')
    .update({ state: 'approved', decision_notes: 'Architectural decisions locked in session 2026-04-15; plan file + MEMORY entry created.', resolved_at: now })
    .eq('epic_id', epic.id)
    .eq('state', 'pending');

  console.log('[ok] Resolved Epic 0 checkpoint.');
}

main().catch((e) => { console.error(e); process.exit(1); });
