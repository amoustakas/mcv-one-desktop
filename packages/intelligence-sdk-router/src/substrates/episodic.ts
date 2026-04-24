/**
 * Episodic substrate — naos_interactions + event_log.
 *
 * Tables:
 *   - naos_interactions (migration-naos.sql) — per-agent interaction history
 *   - event_log (migration-agentic-os-events-2026-04-22.sql) — canonical
 *     causal chain by correlation_id
 *
 * Non-vector. When `filters.correlationId` is set, returns event_log rows
 * for that correlation chain. Otherwise returns recent naos_interactions
 * for the agent.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const episodicAdapter: SubstrateAdapter = {
  kind: 'episodic',
  async recall(args: RecallArgs, _queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    void _queryEmbedding;
    const topK = Math.min(args.topK ?? 8, 50);

    // If correlation_id is scoped, return events from that causal chain.
    if (args.filters?.correlationId) {
      const { data, error } = await ctx.supabase
        .from('event_log')
        .select('id, topic, correlation_id, venture_id, emitted_at, emitted_by, payload')
        .eq('correlation_id', args.filters.correlationId)
        .order('emitted_at', { ascending: true })
        .limit(topK);
      if (error) throw new Error(`episodic.recall(events): ${error.message}`);
      const rows = (data ?? []) as Array<{
        id: string;
        topic: string;
        correlation_id: string;
        venture_id: string | null;
        emitted_at: string;
        emitted_by: string;
        payload: unknown;
      }>;
      return rows.map((r) => ({
        id: `event:${r.id}`,
        substrate: 'episodic' as const,
        content: `${r.topic} — ${summarizePayload(r.payload)}`,
        similarity: 0.7,
        recencyScore: recencyScore(r.emitted_at),
        confidence: 0.9,
        provenance: {
          source: `event:${r.id}`,
          driver: 'episodic',
          correlationId: r.correlation_id,
          ventureId: r.venture_id ?? undefined,
        },
        metadata: {
          topic: r.topic,
          emittedAt: r.emitted_at,
          emittedBy: r.emitted_by,
        },
      }));
    }

    // Otherwise: recent interactions for the agent (if agentHandle known).
    // naos_interactions uses agent_id (uuid FK); we don't have it here.
    // Phase-1 returns [] gracefully — M3 agent-fleet wires agent_id resolution.
    if (!ctx.agentHandle) return [];
    const { data, error } = await ctx.supabase
      .from('naos_interactions')
      .select('id, agent_id, venture_id, interaction_type, context, outcome, created_at')
      .order('created_at', { ascending: false })
      .limit(topK);
    if (error) {
      // Table may not exist yet in some envs; fail open with [] — plan §1.1
      // lists naos_interactions as LIVE on master, so in production this
      // shouldn't fire. Defensive for fresh schemas.
      return [];
    }
    const rows = (data ?? []) as Array<{
      id: string;
      agent_id: string;
      venture_id: string | null;
      interaction_type: string;
      context: Record<string, unknown> | null;
      outcome: string | null;
      created_at: string;
    }>;
    return rows.map((r) => ({
      id: `naos_interaction:${r.id}`,
      substrate: 'episodic' as const,
      content: `${r.interaction_type}${r.outcome ? ` → ${r.outcome}` : ''}`,
      similarity: 0.5,
      recencyScore: recencyScore(r.created_at),
      confidence: 0.8,
      provenance: {
        source: `naos_interaction:${r.id}`,
        driver: 'episodic',
        ventureId: r.venture_id ?? undefined,
        agentId: r.agent_id,
      },
      metadata: {
        interactionType: r.interaction_type,
        outcome: r.outcome,
        createdAt: r.created_at,
        context: r.context ?? {},
      },
    }));
  },
};

function summarizePayload(p: unknown): string {
  if (p === null || p === undefined) return '(empty)';
  if (typeof p === 'string') return p.slice(0, 120);
  try {
    const s = JSON.stringify(p);
    return s.length > 120 ? s.slice(0, 117) + '...' : s;
  } catch {
    return '(unserializable)';
  }
}
