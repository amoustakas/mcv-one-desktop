/**
 * Personal substrate — project_memory (user-scoped).
 *
 * Table: project_memory (migration-memory.sql)
 * Shape: id, user_id, memory_type, key, value jsonb, session_id,
 *        venture_id, ttl_seconds, created_at, updated_at
 * Scope: user-only (no tenant_id per plan §1.3; joined to user_tenants
 *        at query time via the userId→tenantId resolution done by
 *        the caller before invoking Router.
 *
 * Non-vector — ranked by recency + key substring match against
 * args.query. Returns up to topK rows.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const personalAdapter: SubstrateAdapter = {
  kind: 'personal',
  async recall(args: RecallArgs, _queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    void _queryEmbedding;
    if (!ctx.userId) return [];
    const topK = Math.min(args.topK ?? 8, 50);
    const query = args.query?.trim().toLowerCase();

    let builder = ctx.supabase
      .from('project_memory')
      .select('id, user_id, memory_type, key, value, venture_id, ttl_seconds, created_at, updated_at')
      .eq('user_id', ctx.userId)
      .order('updated_at', { ascending: false })
      .limit(topK * 4); // pull extra then client-filter by key substring

    if (args.filters?.ventureId ?? ctx.ventureId) {
      builder = builder.eq('venture_id', args.filters?.ventureId ?? ctx.ventureId ?? '');
    }
    if (args.filters?.since) {
      builder = builder.gte('updated_at', args.filters.since);
    }

    const { data, error } = await builder;
    if (error) throw new Error(`personal.recall: ${error.message}`);
    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      memory_type: string | null;
      key: string;
      value: unknown;
      venture_id: string | null;
      ttl_seconds: number | null;
      created_at: string;
      updated_at: string;
    }>;

    const substringHits = query
      ? rows.filter((r) => r.key.toLowerCase().includes(query))
      : rows;
    const chosen = (substringHits.length >= topK ? substringHits : rows).slice(0, topK);

    return chosen.map((r) => {
      const content = typeof r.value === 'string'
        ? r.value
        : JSON.stringify(r.value);
      const matchScore = query && r.key.toLowerCase().includes(query) ? 0.75 : 0.5;
      return {
        id: `project_memory:${r.id}`,
        substrate: 'personal' as const,
        content: `${r.key}: ${content.slice(0, 500)}`,
        similarity: matchScore,
        recencyScore: recencyScore(r.updated_at ?? r.created_at),
        confidence: 0.7,
        provenance: {
          source: `project_memory:${r.id}`,
          driver: 'personal',
          ventureId: r.venture_id ?? undefined,
        },
        metadata: {
          memoryType: r.memory_type,
          key: r.key,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          ttlSeconds: r.ttl_seconds,
        },
      };
    });
  },
};
