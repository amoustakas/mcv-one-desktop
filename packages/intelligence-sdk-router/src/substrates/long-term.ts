/**
 * Long-term substrate — agent_memory_longterm via match_agent_memories RPC.
 *
 * Table: agent_memory_longterm (new — migration-intelligence-unification-2026-04-28.sql)
 * RPC:   match_agent_memories(query_embedding vector(768), match_threshold,
 *                              match_count, filter_user, filter_venture, filter_agent)
 * Scope: tenant (STRICT RLS — set_tenant MUST be set).
 * Kinds: fact, preference, constraint, decision.
 *
 * This substrate is the ONLY writable substrate in Phase-1 — observe()
 * calls with kind ∈ {fact, preference, constraint, decision} land here.
 */

import type {
  ObserveArgs,
  RecallArgs,
  RecallHit,
  SubstrateContext,
  WritableSubstrateAdapter,
} from '../types.js';
import { recencyScore } from '../ranker.js';

export const longTermAdapter: WritableSubstrateAdapter = {
  kind: 'long-term',

  async recall(args: RecallArgs, queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    if (!queryEmbedding) return [];
    const topK = Math.min(args.topK ?? 8, 50);
    const { data, error } = await ctx.supabase.rpc('match_agent_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: topK,
      filter_user: args.filters?.userId ?? ctx.userId ?? null,
      filter_venture: args.filters?.ventureId ?? ctx.ventureId ?? null,
      filter_agent: args.filters?.agentHandle ?? ctx.agentHandle ?? null,
    });
    if (error) throw new Error(`long-term.recall: ${error.message}`);

    const rows = (data ?? []) as Array<{
      id: string;
      tenant_id: string;
      venture_id: string | null;
      user_id: string | null;
      agent_handle: string | null;
      kind: string;
      content: string;
      similarity: number;
      provenance: Record<string, unknown> | null;
      confidence: number;
      created_at: string;
    }>;

    const kindFilter = args.filters?.kinds;
    const filtered = kindFilter?.length
      ? rows.filter((r) => (kindFilter as string[]).includes(r.kind))
      : rows;

    return filtered.map((r) => ({
      id: `memory:${r.id}`,
      substrate: 'long-term' as const,
      content: r.content,
      similarity: typeof r.similarity === 'number' ? r.similarity : 0,
      recencyScore: recencyScore(r.created_at),
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.8,
      provenance: {
        source: `memory:${r.id}`,
        driver: 'long-term',
        ventureId: r.venture_id ?? undefined,
        userId: r.user_id ?? undefined,
        agentHandle: r.agent_handle ?? undefined,
        kind: r.kind,
        ...(r.provenance ?? {}),
      },
      metadata: {
        kind: r.kind,
        createdAt: r.created_at,
      },
    }));
  },

  async observe(args: ObserveArgs, embedding: number[] | null, ctx: SubstrateContext): Promise<{ id: string }> {
    if (!['fact', 'preference', 'constraint', 'decision'].includes(args.kind)) {
      throw new Error(`long-term.observe: kind "${args.kind}" not accepted`);
    }
    const { data, error } = await ctx.supabase
      .from('agent_memory_longterm')
      .insert({
        tenant_id: ctx.tenantId,
        venture_id: args.ventureId ?? ctx.ventureId ?? null,
        user_id: args.userId ?? ctx.userId ?? null,
        agent_handle: args.agentHandle ?? ctx.agentHandle ?? null,
        kind: args.kind,
        content: args.content,
        embedding: embedding ?? null,
        provenance: args.provenance as unknown as Record<string, unknown>,
        confidence: args.confidence,
        tags: args.tags ?? [],
        supersedes_id: args.supersedesId ?? null,
      })
      .select('id')
      .single();
    if (error) throw new Error(`long-term.observe: ${error.message}`);

    // If supersedes, mark the superseded row.
    if (args.supersedesId) {
      await ctx.supabase
        .from('agent_memory_longterm')
        .update({ superseded_at: new Date().toISOString() })
        .eq('id', args.supersedesId);
    }

    return { id: (data as { id: string }).id };
  },
};
