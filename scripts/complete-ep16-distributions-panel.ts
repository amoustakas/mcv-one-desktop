import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const c = createClient(url, key);

async function main() {
  const { data: epic } = await c.from('epics').select('id').contains('tags', ['capital:ep16']).maybeSingle();
  if (!epic) { console.error('epic not found'); process.exit(1); }
  const { data: stories } = await c.from('stories').select('id, title, status').eq('epic_id', epic.id);
  const matches = (stories ?? []).filter((s) => /DistributionsPanel component in CapitalRoundDetailView/i.test(s.title));
  console.log(`Found ${matches.length} stories:`);
  for (const s of matches) console.log('  -', s.title, `(was ${s.status})`);
  if (!matches.length) return;
  const { error } = await c.from('stories')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .in('id', matches.map((s) => s.id));
  if (error) throw error;
  console.log(`\nMarked ${matches.length} done.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
