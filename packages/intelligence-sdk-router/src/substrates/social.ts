/**
 * Social substrate — naos_emotional_state + naos_relationships + naos_personality.
 *
 * Tables (migration-naos.sql):
 *   - naos_emotional_state (per-agent, single current row + history)
 *   - naos_relationships (agent-to-agent graph)
 *   - naos_personality (per-agent trait vector)
 *
 * Social recall returns the agent's CURRENT emotional snapshot + any
 * peer relationships that matter for agent-to-agent context. Non-vector.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const socialAdapter: SubstrateAdapter = {
  kind: 'social',
  async recall(_args: RecallArgs, _queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    void _queryEmbedding;
    void _args;
    if (!ctx.agentHandle) return [];

    // Resolve agent_id from handle — the agents table lands in M3, so this
    // Phase-1 path fails open until that table exists.
    const hits: RecallHit[] = [];
    let agentId: string | null = null;
    try {
      const agentRow = await ctx.supabase
        .from('agents')
        .select('id')
        .eq('handle', ctx.agentHandle)
        .maybeSingle();
      agentId = (agentRow.data as { id: string } | null)?.id ?? null;
    } catch {
      agentId = null;
    }

    // Without an agent_id, the naos_* queries can't filter. Try handle-scoped
    // fallback — some environments may have an alternate key; most will just
    // return [].
    if (!agentId) return hits;

    // Emotional state (1 row or 0).
    try {
      const emotional = await ctx.supabase
        .from('naos_emotional_state')
        .select('agent_id, confidence, engagement, frustration, excitement, caution, momentum, triggers, updated_at')
        .eq('agent_id', agentId)
        .maybeSingle();
      if (emotional.data) {
        const e = emotional.data as {
          agent_id: string;
          confidence: number | null;
          engagement: number | null;
          frustration: number | null;
          excitement: number | null;
          caution: number | null;
          momentum: number | null;
          triggers: unknown;
          updated_at: string;
        };
        hits.push({
          id: `emotional:${agentId}`,
          substrate: 'social',
          content: `agent emotional state — confidence:${e.confidence ?? 0} engagement:${e.engagement ?? 0} frustration:${e.frustration ?? 0}`,
          similarity: 0.5,
          recencyScore: recencyScore(e.updated_at),
          confidence: 0.9,
          provenance: { source: `emotional:${agentId}`, driver: 'social' },
          metadata: {
            confidence: e.confidence,
            engagement: e.engagement,
            frustration: e.frustration,
            excitement: e.excitement,
            caution: e.caution,
            momentum: e.momentum,
            triggers: e.triggers,
            updatedAt: e.updated_at,
          },
        });
      }
    } catch {
      /* noop — table may not exist in some envs */
    }

    // Personality (1 row).
    try {
      const personality = await ctx.supabase
        .from('naos_personality')
        .select('agent_id, risk_tolerance, analytical_bias, creativity_index, urgency_bias, updated_at')
        .eq('agent_id', agentId)
        .maybeSingle();
      if (personality.data) {
        const p = personality.data as {
          agent_id: string;
          risk_tolerance: number | null;
          analytical_bias: number | null;
          creativity_index: number | null;
          urgency_bias: number | null;
          updated_at: string;
        };
        hits.push({
          id: `personality:${agentId}`,
          substrate: 'social',
          content: `agent personality — risk:${p.risk_tolerance ?? 0} analytical:${p.analytical_bias ?? 0} creativity:${p.creativity_index ?? 0}`,
          similarity: 0.5,
          recencyScore: recencyScore(p.updated_at),
          confidence: 0.9,
          provenance: { source: `personality:${agentId}`, driver: 'social' },
          metadata: { traits: p, updatedAt: p.updated_at },
        });
      }
    } catch {
      /* noop */
    }

    // Top relationships (up to topK-2).
    try {
      const topK = Math.min(_args.topK ?? 8, 50);
      const relMax = Math.max(0, topK - hits.length);
      if (relMax > 0) {
        const rels = await ctx.supabase
          .from('naos_relationships')
          .select('id, agent_a, agent_b, trust_score, dynamic, last_interaction')
          .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)
          .order('last_interaction', { ascending: false, nullsFirst: false })
          .limit(relMax);
        const rows = (rels.data ?? []) as Array<{
          id: string;
          agent_a: string;
          agent_b: string;
          trust_score: number | null;
          dynamic: string | null;
          last_interaction: string | null;
        }>;
        for (const r of rows) {
          const other = r.agent_a === agentId ? r.agent_b : r.agent_a;
          hits.push({
            id: `relationship:${r.id}`,
            substrate: 'social',
            content: `relationship with ${other} — dynamic:${r.dynamic ?? 'unknown'} trust:${r.trust_score ?? 0}`,
            similarity: 0.45,
            recencyScore: r.last_interaction ? recencyScore(r.last_interaction) : 0.3,
            confidence: 0.8,
            provenance: { source: `relationship:${r.id}`, driver: 'social' },
            metadata: { other, trustScore: r.trust_score, dynamic: r.dynamic, lastInteraction: r.last_interaction },
          });
        }
      }
    } catch {
      /* noop */
    }

    return hits;
  },
};
