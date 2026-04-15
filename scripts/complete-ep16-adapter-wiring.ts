// Mark Epic 16 Stories 12-13 (host-app adapter wiring) as done.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const c = createClient(url, key);

async function main() {
  const tag = 'capital:ep16';
  const { data: epic } = await c.from('epics').select('id, title').contains('tags', [tag]).maybeSingle();
  if (!epic) { console.error('epic not found'); process.exit(1); }

  const { data: stories } = await c.from('stories')
    .select('id, title, status')
    .eq('epic_id', epic.id)
    .order('priority_order');

  if (!stories) { console.error('no stories'); process.exit(1); }

  const matches = stories.filter((s) =>
    /ledger-sdk adapter at app startup|payments-sdk router at app startup/i.test(s.title)
  );

  console.log(`Found ${matches.length} stories to mark done:`);
  for (const s of matches) console.log('  -', s.title, `(was ${s.status})`);

  const now = new Date().toISOString();
  const ids = matches.map((s) => s.id);
  const { error } = await c.from('stories').update({ status: 'done', completed_at: now }).in('id', ids);
  if (error) throw error;
  console.log(`\nMarked ${ids.length} stories done.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
