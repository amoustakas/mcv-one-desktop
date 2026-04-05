import { requireAuth } from "./_auth";
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await requireAuth(req, res);
    if (!userId) return;
    const { data, error } = await supabase.from('tasks').select('id, title').limit(3);
    res.json({ ok: true, userId, tasks: data, error: error?.message });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined });
  }
}
