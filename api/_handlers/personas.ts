// api/_handlers/personas.ts
// Persona Registry API — Marathon #2 T5.3
// Reads agent_persona rows with SELECT * so new M2 columns (dimension,
// crown_affiliation, xp) flow through transparently once T5.1 migration lands.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const body = (req.body ?? {}) as { action?: string };
  const supabase = getServiceClient();

  try {
    switch (body.action) {
      case 'list_personas': {
        const { data, error } = await supabase
          .from('agent_persona')
          .select('*')
          .eq('active', true)
          .order('department')
          .order('seniority', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ personas: data ?? [] });
      }
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'personas failed';
    console.error('[personas] error:', message);
    return res.status(500).json({ error: message });
  }
}
