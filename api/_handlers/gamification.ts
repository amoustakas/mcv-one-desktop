// api/_handlers/gamification.ts
// Gamification reads: ladder standings, per-persona XP history, achievement list.
// Marathon #3 T9.4.
//
// Actions:
//   get_ladder               — top-N personas by xp with computed rank + level
//   get_persona_xp           — single persona with recent xp events + by_kind breakdown
//   get_persona_achievements — list of earned achievements (newest first)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

import { requestLogger } from '../../src/lib/server/logger';
const supabase = getServiceClient();

// level = floor(log2(xp/100)) + 1, clamped to min 1 (Diablo-2-HC-ladder-inspired curve).
function computeLevel(xp: number): number {
  const safeXp = Math.max(xp, 1);
  return Math.max(1, Math.floor(Math.log2(safeXp / 100) + 1));
}

async function getLadder(params: { limit?: number }) {
  const { data, error } = await supabase
    .from('agent_persona')
    .select(
      'id, handle, full_name, title, department, seniority, scope_kind, scope_value, dimension, crown_affiliation, accent_color, avatar_url, xp',
    )
    .eq('active', true)
    .order('xp', { ascending: false })
    .limit(params.limit ?? 50);
  if (error) throw error;

  const ranked = (data ?? []).map((p, i) => ({
    ...p,
    rank: i + 1,
    level: computeLevel(Number(p.xp ?? 0)),
  }));

  return { ladder: ranked };
}

async function getPersonaXp(params: { agent_id: string; limit?: number }) {
  if (!params.agent_id) throw new Error('agent_id required');

  const [{ data: persona }, { data: events }] = await Promise.all([
    supabase
      .from('agent_persona')
      .select('id, handle, full_name, title, xp, dimension')
      .eq('id', params.agent_id)
      .maybeSingle(),
    supabase
      .from('persona_xp_event')
      .select('*')
      .eq('agent_id', params.agent_id)
      .order('occurred_at', { ascending: false })
      .limit(params.limit ?? 100),
  ]);
  if (!persona) throw new Error(`persona ${params.agent_id} not found`);

  // Breakdown by event_kind (count + xp total) for quick UI slicing.
  const by_kind: Record<string, { count: number; xp: number }> = {};
  for (const e of events ?? []) {
    const k = String(e.event_kind);
    if (!by_kind[k]) by_kind[k] = { count: 0, xp: 0 };
    by_kind[k].count += 1;
    by_kind[k].xp += Number(e.xp);
  }

  return { persona, events: events ?? [], by_kind };
}

async function getPersonaAchievements(params: { agent_id: string }) {
  if (!params.agent_id) throw new Error('agent_id required');
  const { data, error } = await supabase
    .from('persona_achievement')
    .select('*')
    .eq('agent_id', params.agent_id)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return { achievements: data ?? [] };
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
  const body = (req.body ?? {}) as { action?: string; [k: string]: unknown };
  try {
    switch (body.action) {
      case 'get_ladder':
        return res.status(200).json(
          await getLadder({ limit: body.limit as number | undefined }),
        );
      case 'get_persona_xp':
        return res.status(200).json(
          await getPersonaXp({
            agent_id: body.agent_id as string,
            limit: body.limit as number | undefined,
          }),
        );
      case 'get_persona_achievements':
        return res.status(200).json(
          await getPersonaAchievements({ agent_id: body.agent_id as string }),
        );
      default:
        return res.status(400).json({ error: `unknown action: ${body.action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'gamification failed';
    console.error('[gamification] error:', message);
    return res.status(500).json({ error: message });
  }
}
