import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  try {
    switch (action) {
      case 'list': {
        const v = req.query.venture_id || req.body?.venture_id;
        const status = req.query.status || req.body?.status;
        let q = supabase.from('tasks').select('*').order('priority_order', { ascending: true }).order('created_at', { ascending: false }).limit(200);
        if (v) q = q.eq('venture_id', v);
        if (status) q = q.eq('status', status);
        // fallback sort if priority_order doesn't exist
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        let filtered = data || [];
        if (v) filtered = filtered.filter((t: any) => t.venture_id === v);
        if (status) filtered = filtered.filter((t: any) => t.status === status);
        return res.json({ tasks: filtered });
      }
      case 'create': {
        const { data, error } = await supabase.from('tasks').insert(req.body.task).select().single();
        if (error) throw error;
        await supabase.from('notifications').insert({ type: 'info', title: `Task created: ${data.title}`, description: `Priority: ${data.priority || 'medium'}`, source: 'system', venture_id: data.venture_id });
        return res.json({ task: data });
      }
      case 'update': {
        const { id, ...updates } = req.body;
        if (updates.status === 'done' && !updates.completed_at) updates.completed_at = new Date().toISOString();
        const { data, error } = await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ task: data });
      }
      case 'delete': {
        await supabase.from('tasks').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'update_task_mode': {
        const task_id = req.body?.task_id as string | undefined;
        const mode = req.body?.mode as string | undefined;
        if (!task_id) return res.status(400).json({ error: 'task_id required' });
        if (!mode || !['human', 'agent', 'hybrid'].includes(mode)) {
          return res.status(400).json({ error: 'mode must be human|agent|hybrid' });
        }
        const { data, error } = await supabase
          .from('tasks')
          .update({ mode, updated_at: new Date().toISOString() })
          .eq('id', task_id)
          .select('*')
          .single();
        if (error) throw error;
        return res.json({ task: data });
      }
      case 'stats': {
        const { data } = await supabase.from('tasks').select('status, priority, venture_id');
        const tasks = data || [];
        const byStatus: Record<string, number> = {};
        const byPriority: Record<string, number> = {};
        tasks.forEach((t: any) => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        });
        return res.json({ total: tasks.length, byStatus, byPriority });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
