import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

const supabase = getServiceClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = (req.body ?? {}) as {
    action?: string;
    entity_type?: string;
    entity_id?: string;
  };

  try {
    switch (body.action) {
      case 'list_dossiers': {
        if (!body.entity_type || !body.entity_id) {
          return res.status(400).json({ error: 'entity_type and entity_id required' });
        }
        const { data, error } = await supabase
          .from('research_dossier')
          .select('*')
          .eq('entity_type', body.entity_type)
          .eq('entity_id', body.entity_id)
          .order('version', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ dossiers: data ?? [] });
      }
      case 'latest_dossier': {
        if (!body.entity_type || !body.entity_id) {
          return res.status(400).json({ error: 'entity_type and entity_id required' });
        }
        const { data, error } = await supabase
          .from('research_dossier')
          .select('*')
          .eq('entity_type', body.entity_type)
          .eq('entity_id', body.entity_id)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json({ dossier: data });
      }
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'research failed';
    console.error('[research] error:', message);
    return res.status(500).json({ error: message });
  }
}
