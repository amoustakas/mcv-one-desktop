// api/_handlers/agents.ts
// Agent Roster API — read/write the team that runs the ecosystem.
// Plan: C:\Users\moust\.claude\plans\agent-roster-foundation.md

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
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const params = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      case 'list': {
        let q = supabase
          .from('agent_persona')
          .select('id, handle, full_name, title, department, seniority, scope_kind, scope_value, reports_to_agent_id, interaction_mode, persona_bio, voice_profile, kit_allowlist, data_scopes, avatar_url, accent_color, active, hired_at, metadata')
          .eq('active', true)
          .order('seniority', { ascending: true })
          .order('department', { ascending: true })
          .order('full_name', { ascending: true });
        if (params.department) q = q.eq('department', params.department as string);
        if (params.seniority) q = q.eq('seniority', params.seniority as string);
        if (params.scope_kind) q = q.eq('scope_kind', params.scope_kind as string);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ agents: data ?? [] });
      }
      case 'get': {
        const handle = params.handle as string | undefined;
        const id = params.id as string | undefined;
        if (!handle && !id) return res.status(400).json({ error: 'handle or id required' });
        let q = supabase.from('agent_persona').select().eq('active', true);
        if (handle) q = q.eq('handle', handle);
        else q = q.eq('id', id!);
        const { data, error } = await q.maybeSingle();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ agent: data });
      }
      case 'org-chart': {
        const { data, error } = await supabase
          .from('agent_persona')
          .select('id, handle, full_name, title, department, seniority, scope_kind, scope_value, reports_to_agent_id, accent_color, avatar_url')
          .eq('active', true);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ nodes: data ?? [] });
      }
      case 'activity': {
        const agentId = params.agent_id as string | undefined;
        const limit = Number(params.limit ?? 50);
        let q = supabase
          .from('agent_activity_log')
          .select()
          .order('created_at', { ascending: false })
          .limit(Math.min(limit, 200));
        if (agentId) q = q.eq('agent_id', agentId);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ activity: data ?? [] });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  }
}
