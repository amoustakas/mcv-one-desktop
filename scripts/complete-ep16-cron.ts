import { createClient } from '@supabase/supabase-js';
const c = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
const { data: epic } = await c.from('epics').select('id').contains('tags', ['capital:ep16']).maybeSingle();
const { data: stories } = await c.from('stories').select('id, title, status').eq('epic_id', epic!.id);
const matches = (stories ?? []).filter((s) => /Cron: promote scheduled_for/i.test(s.title));
console.log('Found', matches.length, 'stories');
matches.forEach((s) => console.log('  -', s.title, `(was ${s.status})`));
if (matches.length) {
  await c.from('stories').update({ status: 'done', completed_at: new Date().toISOString() }).in('id', matches.map((s) => s.id));
  console.log('Marked done.');
}
