// api/_handlers/distributions.ts
// Money-OUT: capital distributions lifecycle. Scheduled → Processing → Completed
// (via capital_distribution_leg per-recipient splits computed from the active royalty graph).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

import { requestLogger } from '../../src/lib/server/logger';
const supabase = getServiceClient();

type Action = 'list_distributions' | 'get_distribution' | 'create_scheduled_distribution' | 'execute_distribution';

interface DistributionError extends Error {
  code: string;
  http_status: number;
  details?: Record<string, unknown>;
}

function distError(code: string, http_status: number, message: string, details?: Record<string, unknown>): DistributionError {
  const err = new Error(message) as DistributionError;
  err.code = code;
  err.http_status = http_status;
  err.details = details;
  return err;
}

// ───────────────────────────────────────────────────────────────────────────
// Actions
// ───────────────────────────────────────────────────────────────────────────

async function listDistributions(params: { venture_id?: string; status?: string; limit?: number }) {
  let q = supabase.from('capital_distributions')
    .select('id, venture_id, round_id, distribution_type, status, scheduled_for, processed_at, completed_at, total_amount, currency, total_recipients, total_paid, flow_kind, created_at, updated_at')
    .order('scheduled_for', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (params.venture_id) q = q.eq('venture_id', params.venture_id);
  if (params.status) q = q.eq('status', params.status);
  q = q.limit(params.limit ?? 50);
  const { data, error } = await q;
  if (error) throw error;
  return { distributions: data ?? [] };
}

async function getDistribution(params: { distribution_id: string }) {
  if (!params.distribution_id) throw distError('missing_distribution_id', 400, 'distribution_id required');

  const [
    { data: distribution, error: dErr },
    { data: legs },
    { data: recipients },
  ] = await Promise.all([
    supabase.from('capital_distributions').select('*').eq('id', params.distribution_id).maybeSingle(),
    supabase.from('capital_distribution_leg').select('*').eq('distribution_id', params.distribution_id).order('created_at'),
    supabase.from('capital_distribution_recipients').select('*').eq('distribution_id', params.distribution_id).order('created_at'),
  ]);
  if (dErr) throw dErr;
  if (!distribution) throw distError('distribution_not_found', 404, `distribution ${params.distribution_id} not found`);

  return { distribution, legs: legs ?? [], recipients: recipients ?? [] };
}

interface CreateScheduledInput {
  venture_id: string;
  distribution_type: string;
  total_amount: number;
  currency?: string;
  round_id?: string;
  scheduled_for?: string;       // ISO; defaults to now
  record_date?: string;
  ex_date?: string;
  notes?: string;
  flow_kind?: string;
  created_by?: string;
}

async function createScheduledDistribution(params: CreateScheduledInput) {
  const validTypes = ['dividend', 'interest', 'yield', 'token_airdrop', 'buyback', 'return_of_capital', 'fee_rebate', 'other'];
  if (!params.venture_id) throw distError('missing_venture_id', 400, 'venture_id required');
  if (!params.distribution_type || !validTypes.includes(params.distribution_type)) {
    throw distError('invalid_distribution_type', 400, `distribution_type must be one of: ${validTypes.join(', ')}`);
  }
  if (typeof params.total_amount !== 'number' || !Number.isFinite(params.total_amount) || params.total_amount <= 0) {
    throw distError('invalid_total_amount', 400, 'total_amount must be a positive finite number');
  }

  const { data, error } = await supabase.from('capital_distributions').insert({
    venture_id: params.venture_id,
    round_id: params.round_id ?? null,
    distribution_type: params.distribution_type,
    status: 'scheduled',
    total_amount: params.total_amount,
    currency: params.currency ?? 'USD',
    scheduled_for: params.scheduled_for ?? new Date().toISOString(),
    record_date: params.record_date ?? null,
    ex_date: params.ex_date ?? null,
    notes: params.notes ?? null,
    flow_kind: params.flow_kind ?? null,
    created_by: params.created_by ?? null,
  }).select('*').single();
  if (error) throw error;
  return { distribution: data };
}

interface ExecuteInput {
  distribution_id: string;
  actor_id?: string;
}

async function executeDistribution(params: ExecuteInput) {
  if (!params.distribution_id) throw distError('missing_distribution_id', 400, 'distribution_id required');

  // 1. Load distribution
  const { data: dist, error: dErr } = await supabase.from('capital_distributions').select('*').eq('id', params.distribution_id).maybeSingle();
  if (dErr) throw dErr;
  if (!dist) throw distError('distribution_not_found', 404, `distribution ${params.distribution_id} not found`);
  if (dist.status !== 'scheduled') {
    throw distError('distribution_wrong_status', 409, `distribution.status=${dist.status} — must be scheduled to execute`);
  }

  // 2. Check for existing legs (guard double-execute)
  const { data: existingLegs } = await supabase.from('capital_distribution_leg').select('id').eq('distribution_id', dist.id).limit(1);
  if ((existingLegs ?? []).length > 0) {
    throw distError('distribution_already_has_legs', 409, 'distribution already has legs — was execute_distribution called twice?');
  }

  // 3. Load active royalty graph for venture
  const { data: graph, error: gErr } = await supabase.from('capital_royalty_graph')
    .select('id, venture_id, label, version')
    .eq('venture_id', dist.venture_id)
    .is('superseded_at', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!graph) throw distError('no_active_royalty_graph', 422, `no active royalty graph for venture ${dist.venture_id}`);

  const { data: layers, error: lErr } = await supabase.from('capital_royalty_graph_layer')
    .select('id, sequence, label, recipient_type, recipient_id, bps, kind')
    .eq('graph_id', graph.id)
    .order('sequence');
  if (lErr) throw lErr;
  if (!layers || layers.length === 0) throw distError('royalty_graph_empty', 422, 'royalty graph has no layers');

  const totalBps = layers.reduce((sum, l) => sum + l.bps, 0);
  if (totalBps !== 10000) {
    throw distError('royalty_graph_bps_mismatch', 422, `royalty graph bps sum ${totalBps} != 10000 — cannot execute cleanly`,
      { total_bps: totalBps, expected: 10000, layer_count: layers.length });
  }

  // 4. Mark distribution processing
  await supabase.from('capital_distributions').update({
    status: 'processing',
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', dist.id);

  // 5. Translate layer recipient_type → leg recipient_type
  // Graph layer recipient_type: treasury | user | external_entity | pool
  // Leg recipient_type:         investor | vendor | platform | reserve | royalty_holder | creator | referrer | referee | liquidity_pool | external
  const legRecipientType = (layerKind: string, layerRecipientType: string): string => {
    if (layerRecipientType === 'treasury') return 'platform';
    if (layerRecipientType === 'pool') return 'liquidity_pool';
    if (layerRecipientType === 'external_entity') return 'external';
    // user kind → pick by kind
    if (layerKind === 'creator_share') return 'creator';
    if (layerKind === 'affiliate') return 'referrer';
    if (layerKind === 'ip_royalty') return 'royalty_holder';
    return 'external';
  };

  // 6. Create one leg per layer with amount = total_amount * bps / 10000
  const legRows = layers.map((l) => ({
    distribution_id: dist.id,
    recipient_type: legRecipientType(l.kind, l.recipient_type),
    recipient_id: l.recipient_id,
    royalty_layer_id: l.id,
    amount: Number(dist.total_amount) * (l.bps / 10000),
    currency: dist.currency,
    status: 'pending' as const,
    metadata: { layer_label: l.label, layer_kind: l.kind, bps: l.bps, sequence: l.sequence },
  }));

  const { data: insertedLegs, error: iErr } = await supabase.from('capital_distribution_leg').insert(legRows).select('*');
  if (iErr) throw iErr;

  // 7. Update distribution totals
  await supabase.from('capital_distributions').update({
    total_recipients: legRows.length,
    updated_at: new Date().toISOString(),
  }).eq('id', dist.id);

  // 8. Audit activity
  await supabase.from('capital_activities').insert({
    venture_id: dist.venture_id,
    activity_type: 'payment_sent',  // closest allowed value in capital_activities CHECK
    title: `Distribution executed: ${dist.currency} ${dist.total_amount} across ${legRows.length} legs`,
    description: `distribution_type=${dist.distribution_type} graph_version=${graph.version}`,
    actor_id: params.actor_id ?? 'system',
    actor_type: 'system',
    metadata: { distribution_id: dist.id, graph_id: graph.id, leg_count: legRows.length },
  });

  return {
    distribution: { ...dist, status: 'processing', processed_at: new Date().toISOString(), total_recipients: legRows.length },
    legs: insertedLegs,
    graph: { id: graph.id, version: graph.version, label: graph.label, layer_count: layers.length },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Default export
// ───────────────────────────────────────────────────────────────────────────

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const body = (req.body ?? {}) as { action?: Action; [k: string]: unknown };
  try {
    switch (body.action) {
      case 'list_distributions':
        return res.status(200).json(await listDistributions({
          venture_id: body.venture_id as string | undefined,
          status: body.status as string | undefined,
          limit: body.limit as number | undefined,
        }));
      case 'get_distribution':
        return res.status(200).json(await getDistribution({ distribution_id: body.distribution_id as string }));
      case 'create_scheduled_distribution':
        return res.status(200).json(await createScheduledDistribution(body as unknown as CreateScheduledInput));
      case 'execute_distribution':
        return res.status(200).json(await executeDistribution({ distribution_id: body.distribution_id as string, actor_id: body.actor_id as string | undefined }));
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const anyErr = err as DistributionError;
    if (anyErr.code && anyErr.http_status) {
      return res.status(anyErr.http_status).json({ error: anyErr.message, code: anyErr.code, ...(anyErr.details ? { details: anyErr.details } : {}) });
    }
    const message = err instanceof Error ? err.message : 'distributions failed';
    console.error('[distributions] error:', message);
    return res.status(500).json({ error: message });
  }
}
