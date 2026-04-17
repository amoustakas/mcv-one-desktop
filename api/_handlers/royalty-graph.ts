// api/_handlers/royalty-graph.ts
// Royalty graph reads + layer mutations for the T8.5 editor.
// Mutations are for the ACTIVE graph only (superseded_at IS NULL).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

const supabase = getServiceClient();

const VALID_KIND = ['platform_rake','venture_rake','ip_royalty','affiliate','creator_share','reserve','burn','fee_split','other'];
const VALID_RECIPIENT_TYPE = ['treasury','user','external_entity','pool'];

async function getActiveGraph(params: { venture_id: string }) {
  if (!params.venture_id) throw new Error('venture_id required');
  const { data: graph, error: gErr } = await supabase
    .from('capital_royalty_graph')
    .select('*')
    .eq('venture_id', params.venture_id)
    .is('superseded_at', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!graph) return { graph: null, layers: [], total_bps: 0 };

  const { data: layers } = await supabase
    .from('capital_royalty_graph_layer')
    .select('*')
    .eq('graph_id', graph.id)
    .order('sequence');

  const total_bps = (layers ?? []).reduce((sum, l) => sum + (l.bps ?? 0), 0);
  return { graph, layers: layers ?? [], total_bps };
}

async function addLayer(params: { graph_id: string; sequence: number; label: string; recipient_type: string; recipient_id: string; bps: number; kind: string; condition_expr?: string; jurisdiction?: string }) {
  if (!params.graph_id) throw new Error('graph_id required');
  if (!params.label) throw new Error('label required');
  if (!VALID_RECIPIENT_TYPE.includes(params.recipient_type)) throw new Error(`recipient_type must be one of: ${VALID_RECIPIENT_TYPE.join(', ')}`);
  if (!VALID_KIND.includes(params.kind)) throw new Error(`kind must be one of: ${VALID_KIND.join(', ')}`);
  if (!Number.isFinite(params.bps) || params.bps < 0 || params.bps > 10000) throw new Error('bps must be 0-10000');
  const { data, error } = await supabase.from('capital_royalty_graph_layer').insert({
    graph_id: params.graph_id,
    sequence: params.sequence,
    label: params.label,
    recipient_type: params.recipient_type,
    recipient_id: params.recipient_id,
    bps: params.bps,
    kind: params.kind,
    condition_expr: params.condition_expr ?? null,
    jurisdiction: params.jurisdiction ?? null,
  }).select('*').single();
  if (error) throw error;
  return { layer: data };
}

async function updateLayer(params: { layer_id: string; bps?: number; label?: string; sequence?: number }) {
  if (!params.layer_id) throw new Error('layer_id required');
  const updates: Record<string, unknown> = {};
  if (params.bps !== undefined) {
    if (!Number.isFinite(params.bps) || params.bps < 0 || params.bps > 10000) throw new Error('bps must be 0-10000');
    updates.bps = params.bps;
  }
  if (params.label !== undefined) updates.label = params.label;
  if (params.sequence !== undefined) updates.sequence = params.sequence;
  if (Object.keys(updates).length === 0) throw new Error('no updatable fields provided');
  const { data, error } = await supabase.from('capital_royalty_graph_layer').update(updates).eq('id', params.layer_id).select('*').single();
  if (error) throw error;
  return { layer: data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const body = (req.body ?? {}) as { action?: string; [k: string]: unknown };
  try {
    switch (body.action) {
      case 'get_active_graph':
        return res.status(200).json(await getActiveGraph({ venture_id: body.venture_id as string }));
      case 'add_layer':
        return res.status(200).json(await addLayer(body as never));
      case 'update_layer':
        return res.status(200).json(await updateLayer(body as never));
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'royalty-graph failed';
    console.error('[royalty-graph] error:', message);
    return res.status(500).json({ error: message });
  }
}
