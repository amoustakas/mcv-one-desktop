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

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const bucket = req.body?.bucket || 'documents';
        const path = req.body?.path || '';
        const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) throw error;
        return res.json({ files: data });
      }
      case 'upload': {
        const bucket = req.body?.bucket || 'documents';
        const path = req.body?.path;
        const content = req.body?.content; // base64 or text
        const contentType = req.body?.contentType || 'application/octet-stream';

        if (!path || !content) return res.status(400).json({ error: 'path and content required' });

        // Decode base64 content
        const buffer = Buffer.from(content, 'base64');
        const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
        if (error) throw error;
        return res.json({ file: data });
      }
      case 'download': {
        const bucket = req.body?.bucket || 'documents';
        const path = req.body?.path;
        if (!path) return res.status(400).json({ error: 'path required' });

        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) throw error;

        const buffer = Buffer.from(await data.arrayBuffer());
        return res.json({ content: buffer.toString('base64'), type: data.type });
      }
      case 'delete': {
        const bucket = req.body?.bucket || 'documents';
        const paths = req.body?.paths || [req.body?.path];
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) throw error;
        return res.json({ success: true });
      }
      case 'get-url': {
        const bucket = req.body?.bucket || 'assets';
        const path = req.body?.path;
        if (!path) return res.status(400).json({ error: 'path required' });

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return res.json({ url: data.publicUrl });
      }
      case 'buckets': {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        return res.json({ buckets: data });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
