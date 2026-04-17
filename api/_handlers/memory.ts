import { createClient } from '@supabase/supabase-js';
import { indexContent } from './_rag-index.js';
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

  try {
    // ── DELETE /api/memory?id=X ──
    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const { error } = await supabase.from('project_memory').delete().eq('id', id);
      if (error) throw error;
      // Cascade: drop any chunks we auto-indexed for this memory.
      await supabase.from('storage_chunks').delete().eq('file_id', id);
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

      // Fire-and-forget auto-index. Serialize JSON value + key as the content.
      const textForIndex = [key, typeof value === 'string' ? value : JSON.stringify(value ?? {})]
        .filter(Boolean).join('\n');
      void indexContent({
        id: data.id, title: key, content: textForIndex,
        ventureId: ventureId || null, source: 'memory', userId,
        metadata: { memory_type: type },
      }).catch(err => {
        // eslint-disable-next-line no-console
        console.error('[memory auto-index]', data.id, err instanceof Error ? err.message : err);
      });

      return res.json({ memory: mapMemory(data) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
