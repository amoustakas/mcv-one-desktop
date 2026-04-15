import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const c = createClient(url, key);
const now = new Date().toISOString();
(async () => {
  const { data: e2 } = await c.from('epics').select('id').contains('tags', ['capital:ep2']).maybeSingle();
  if (!e2) return;
  const { data: s } = await c.from('stories').select('id,title,status').eq('epic_id', e2.id).ilike('title', '%Round%Wizard%');
  for (const r of s ?? []) {
    if (r.status !== 'done') {
      await c.from('stories').update({ status: 'done', completed_at: now, updated_at: now }).eq('id', r.id);
      console.log('[ok]', r.title.slice(0, 80));
    }
  }
})();
