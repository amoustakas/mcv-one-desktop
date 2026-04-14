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


// ---------------------------------------------------------------------------
// Kit Shared Context API — cross-device key-value store
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body?.action;

  try {
    switch (action) {
      case 'set': {
        const { key, value, kitId, ventureId, ttlMs } = req.body;
        if (!key || !kitId) return res.status(400).json({ error: 'key and kitId required' });

        const expiresAt = ttlMs ? new Date(Date.now() + ttlMs).toISOString() : null;
        const { error } = await supabase
          .from('kit_context')
          .upsert({
            key,
            value,
            kit_id: kitId,
            venture_id: ventureId || null,
            user_id: userId,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        if (error) throw error;
        return res.json({ success: true });
      }

      case 'get': {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'key required' });

        const { data, error } = await supabase
          .from('kit_context')
          .select('*')
          .eq('key', key)
          .eq('user_id', userId)
          .single();

        if (error || !data) return res.json({ value: null });

        // Check expiration
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          await supabase.from('kit_context').delete().eq('key', key);
          return res.json({ value: null });
        }

        return res.json({ value: data.value, kitId: data.kit_id, ventureId: data.venture_id });
      }

      case 'query': {
        const { prefix, ventureId } = req.body;
        let query = supabase
          .from('kit_context')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (prefix) query = query.like('key', `${prefix}%`);
        if (ventureId) query = query.eq('venture_id', ventureId);

        const { data, error } = await query;
        if (error) throw error;

        // Filter expired entries
        const now = new Date();
        const valid = (data ?? []).filter(
          (d) => !d.expires_at || new Date(d.expires_at) > now,
        );

        return res.json({ entries: valid });
      }

      case 'delete': {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'key required' });
        await supabase.from('kit_context').delete().eq('key', key).eq('user_id', userId);
        return res.json({ success: true });
      }

      case 'clear-kit': {
        const { kitId } = req.body;
        if (!kitId) return res.status(400).json({ error: 'kitId required' });
        await supabase.from('kit_context').delete().eq('kit_id', kitId).eq('user_id', userId);
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
