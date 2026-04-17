// api/_handlers/venture-detail.ts
// Per-venture god-view aggregator. Single round-trip returns:
//   venture + brand + corporate stack + rounds + recent commitments + activities + scoped personas.
// Used by the T7.2 useVentureDetail hook + T7.3 VentureDetailView.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

import { requestLogger } from '../../src/lib/server/logger';
const supabase = getServiceClient();

type Action = 'get_venture_detail';

async function getVentureDetail(ventureId: string) {
  const [
    { data: venture, error: vErr },
    { data: brand },
    { data: jurisdictions },
    { data: accounts },
    { data: rounds },
    { data: recentCommitments },
    { data: recentActivities },
    { data: scopedPersonas },
  ] = await Promise.all([
    supabase.from('ventures')
      .select('id, name, type, category, funding_stage, owner_entity_id, parent_venture_id, tier, launch_stage, status, is_raising')
      .eq('id', ventureId)
      .maybeSingle(),
    supabase.from('venture_brand_kits').select('*').eq('venture_id', ventureId).maybeSingle(),
    supabase.from('venture_jurisdictions').select('*').eq('venture_id', ventureId),
    supabase.from('venture_accounts').select('*').eq('venture_id', ventureId),
    supabase.from('capital_rounds')
      .select('id, name, slug, round_type, status, target_raise, total_committed, total_funded, total_investors, minimum_check, maximum_check, currency, is_public, accredited_only, open_date, close_date')
      .eq('venture_id', ventureId)
      .is('deleted_at', null)
      .order('open_date', { ascending: false, nullsFirst: false }),
    supabase.from('capital_commitments')
      .select('id, contact_id, round_id, status, amount, amount_usd, currency, soft_committed_at, funded_at, created_at')
      .eq('venture_id', ventureId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('capital_activities')
      .select('id, activity_type, title, description, actor_id, actor_type, occurred_at, metadata, round_id, commitment_id, contact_id')
      .eq('venture_id', ventureId)
      .order('occurred_at', { ascending: false })
      .limit(30),
    supabase.from('agent_persona')
      .select('id, handle, full_name, title, department, seniority, scope_kind, scope_value, avatar_url, accent_color, dimension, crown_affiliation, xp, persona_bio')
      .eq('scope_kind', 'venture')
      .eq('scope_value', ventureId)
      .eq('active', true),
  ]);
  if (vErr) throw vErr;
  if (!venture) return { venture: null };

  // Derivations
  const raising_rounds = (rounds ?? []).filter((r) => r.is_public && ['open', 'reserved'].includes(r.status));
  const commitments_by_status: Record<string, number> = {};
  let total_committed_usd = 0;
  let total_funded_usd = 0;
  for (const c of recentCommitments ?? []) {
    commitments_by_status[c.status] = (commitments_by_status[c.status] ?? 0) + 1;
    total_committed_usd += Number(c.amount_usd ?? 0);
    if (c.status === 'funded' || c.status === 'distributed') total_funded_usd += Number(c.amount_usd ?? 0);
  }

  return {
    venture,
    brand: brand ?? null,
    corporate_stack: {
      jurisdictions: jurisdictions ?? [],
      accounts: accounts ?? [],
    },
    rounds: rounds ?? [],
    raising_rounds,
    recent_commitments: recentCommitments ?? [],
    commitments_summary: {
      by_status: commitments_by_status,
      total_committed_usd,
      total_funded_usd,
      count: (recentCommitments ?? []).length,
    },
    recent_activities: recentActivities ?? [],
    scoped_personas: scopedPersonas ?? [],
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = (req.body ?? {}) as { action?: Action; venture_id?: string };
  try {
    switch (body.action) {
      case 'get_venture_detail': {
        if (!body.venture_id) return res.status(400).json({ error: 'venture_id required' });
        const result = await getVentureDetail(body.venture_id);
        if (!result.venture) return res.status(404).json({ error: `venture ${body.venture_id} not found` });
        return res.status(200).json(result);
      }
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'venture-detail failed';
    console.error('[venture-detail] error:', message);
    return res.status(500).json({ error: message });
  }
}
