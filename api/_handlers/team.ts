import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const { data, error } = await supabase.from('team_members').select('*').order('role').order('name');
        if (error) throw error;
        return res.json({ members: data });
      }
      case 'get': {
        const { data, error } = await supabase.from('team_members').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'create': {
        const { data, error } = await supabase.from('team_members').insert(req.body.member).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'update': {
        const { id, ...updates } = req.body.member;
        const { data, error } = await supabase.from('team_members')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      case 'delete': {
        await supabase.from('team_members').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }
      case 'assign-ventures': {
        const { id, venture_assignments } = req.body;
        const { data, error } = await supabase.from('team_members')
          .update({ venture_assignments, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ member: data });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
