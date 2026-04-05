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
// Kit Registry API
// ---------------------------------------------------------------------------
// Manages kit discovery, installation, and metadata in Supabase.
// Kits table stores manifests; user_kits tracks per-user installations.

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = req.method === 'GET'
    ? (req.query.action as string)
    : req.body?.action;

  try {
    switch (action) {
      // Search kits by query string
      case 'search': {
        const query = (req.query.q || req.body?.q || '') as string;
        const { data, error } = await supabase
          .from('kits')
          .select('kit_id, name, version, description, author, manifest, downloads, created_at')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,kit_id.ilike.%${query}%`)
          .eq('status', 'published')
          .order('downloads', { ascending: false })
          .limit(20);

        if (error) throw error;
        return res.json({ kits: data || [] });
      }

      // Get a single kit manifest
      case 'get': {
        const kitId = (req.query.id || req.body?.id) as string;
        if (!kitId) return res.status(400).json({ error: 'id required' });

        const { data, error } = await supabase
          .from('kits')
          .select('*')
          .eq('kit_id', kitId)
          .single();

        if (error) throw error;
        return res.json({ kit: data });
      }

      // List all available kits
      case 'list': {
        const { data, error } = await supabase
          .from('kits')
          .select('kit_id, name, version, description, author, downloads, created_at')
          .eq('status', 'published')
          .order('downloads', { ascending: false })
          .limit(50);

        if (error) throw error;
        return res.json({ kits: data || [] });
      }

      // Install a kit for the current user
      case 'install': {
        const kitId = req.body?.kitId as string;
        if (!kitId) return res.status(400).json({ error: 'kitId required' });

        // Check kit exists
        const { data: kit, error: kitError } = await supabase
          .from('kits')
          .select('kit_id, name')
          .eq('kit_id', kitId)
          .single();

        if (kitError || !kit) {
          return res.status(404).json({ error: `Kit "${kitId}" not found` });
        }

        // Upsert user installation
        const { error: installError } = await supabase
          .from('user_kits')
          .upsert(
            { user_id: userId, kit_id: kitId, enabled: true },
            { onConflict: 'user_id,kit_id' },
          );

        if (installError) throw installError;

        // Increment download count
        await supabase.rpc('increment_kit_downloads', { p_kit_id: kitId });

        return res.json({ success: true, message: `Kit "${kit.name}" installed` });
      }

      // Uninstall a kit
      case 'uninstall': {
        const kitId = req.body?.kitId as string;
        if (!kitId) return res.status(400).json({ error: 'kitId required' });

        const { error } = await supabase
          .from('user_kits')
          .delete()
          .eq('user_id', userId)
          .eq('kit_id', kitId);

        if (error) throw error;
        return res.json({ success: true });
      }

      // List user's installed kits
      case 'list-installed': {
        const { data, error } = await supabase
          .from('user_kits')
          .select(`
            kit_id,
            enabled,
            config,
            installed_at,
            kits!inner (
              name,
              version,
              description,
              author,
              manifest
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;
        return res.json({ installed: data || [] });
      }

      // Publish a new kit (admin/dev only for now)
      case 'publish': {
        const { manifest, bundle_path } = req.body;
        if (!manifest?.id || !manifest?.name) {
          return res.status(400).json({ error: 'manifest with id and name required' });
        }

        const { data, error } = await supabase
          .from('kits')
          .upsert(
            {
              kit_id: manifest.id,
              name: manifest.name,
              version: manifest.version || '1.0.0',
              description: manifest.description || '',
              author: manifest.author || 'Unknown',
              manifest,
              bundle_path: bundle_path || '',
              status: 'published',
            },
            { onConflict: 'kit_id' },
          )
          .select()
          .single();

        if (error) throw error;
        return res.json({ kit: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
