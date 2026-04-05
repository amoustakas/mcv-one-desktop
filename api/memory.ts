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

/* ── Snake-to-camelCase mappers ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemory(row: any) {
  return {
    id: row.id,
    type: row.memory_type,
    key: row.key,
    value: row.value,
    sessionId: row.session_id,
    ventureId: row.venture_id,
    userId: row.user_id,
    ttlSeconds: row.ttl_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any) {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    eventType: row.event_type,
    payload: row.payload,
    ventureId: row.venture_id,
    createdAt: row.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;

  try {
    // ── DELETE /api/memory?id=X ──
    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const { error } = await supabase.from('project_memory').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ── GET /api/memory ──
    if (req.method === 'GET') {
      // Session events mode
      if (req.query.events === 'true') {
        const sessionId = req.query.sessionId as string;
        const eventType = req.query.eventType as string;
        const limit = parseInt(req.query.limit as string) || 200;

        let q = supabase.from('session_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (sessionId) q = q.eq('session_id', sessionId);
        if (eventType) q = q.eq('event_type', eventType);

        const { data, error } = await q;
        if (error) throw error;
        return res.json({ events: (data || []).map(mapEvent) });
      }

      // Project memory mode
      const type = req.query.type as string;
      const ventureId = req.query.ventureId as string;
      const search = req.query.search as string;

      let q = supabase.from('project_memory')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (type) q = q.eq('memory_type', type);
      if (ventureId) q = q.eq('venture_id', ventureId);

      const { data, error } = await q;
      if (error) throw error;

      let results = data || [];

      // Server-side search filter (key + value text match)
      if (search) {
        const lower = search.toLowerCase();
        results = results.filter((m: Record<string, unknown>) =>
          (m.key as string).toLowerCase().includes(lower) ||
          JSON.stringify(m.value).toLowerCase().includes(lower)
        );
      }

      return res.json({ memories: results.map(mapMemory) });
    }

    // ── POST /api/memory ──
    if (req.method === 'POST') {
      const body = req.body;

      // Session event append mode
      if (body.event === true) {
        const { sessionId, eventType, payload, ventureId } = body;
        if (!sessionId || !eventType) {
          return res.status(400).json({ error: 'sessionId and eventType required' });
        }
        const { data, error } = await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: userId,
          event_type: eventType,
          payload: payload || {},
          venture_id: ventureId || null,
        }).select().single();
        if (error) throw error;
        return res.json({ event: mapEvent(data) });
      }

      // Project memory upsert mode
      const { type, key, value, sessionId, ventureId, ttlSeconds } = body;
      if (!type || !key) {
        return res.status(400).json({ error: 'type and key required' });
      }

      const row = {
        user_id: userId,
        memory_type: type,
        key,
        value: value || {},
        session_id: sessionId || null,
        venture_id: ventureId || null,
        ttl_seconds: ttlSeconds || null,
        updated_at: new Date().toISOString(),
      };

      // Upsert on (user_id, key) unique constraint
      const { data, error } = await supabase.from('project_memory')
        .upsert(row, { onConflict: 'user_id,key' })
        .select()
        .single();
      if (error) throw error;
      return res.json({ memory: mapMemory(data) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
