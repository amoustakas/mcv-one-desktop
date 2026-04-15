/**
 * Mark Epic 7 Story 1 (publish MCP-Capital spec) as done since docs/capital/PROTOCOL.md shipped.
 */
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY required');
  const client = createClient(url, key);

  const { data: epic } = await client.from('epics').select('id').contains('tags', ['capital:ep7']).maybeSingle();
  if (!epic) throw new Error('Epic 7 not found');

  const { data: stories } = await client
    .from('stories')
    .select('id, title, status')
    .eq('epic_id', epic.id)
    .ilike('title', '%Publish MCP-Capital v0.1 spec%');

  if (!stories?.length) { console.log('Story not found'); return; }

  const now = new Date().toISOString();
  for (const s of stories) {
    await client.from('stories').update({ status: 'done', completed_at: now, updated_at: now }).eq('id', s.id);
    console.log(`[ok] ${s.title} → done`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
