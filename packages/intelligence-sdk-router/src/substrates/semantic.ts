/**
 * Semantic substrate — storage_chunks via match_chunks RPC.
 *
 * Table: storage_chunks (migration-pgvector.sql)
 * RPC:   match_chunks(query_embedding vector(768), match_threshold float,
 *                     match_count int, filter_venture text, filter_corpus uuid)
 * Scope: tenant (via RLS on storage_chunks) + optional venture filter.
 *
 * Requires a query embedding — caller produces it via the embed() fn
 * supplied to the Router constructor.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const semanticAdapter: SubstrateAdapter = {
  kind: 'semantic',
  async recall(args: RecallArgs, queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    if (!queryEmbedding) return [];
    const topK = Math.min(args.topK ?? 8, 50);
    const { data, error } = await ctx.supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: topK,
      filter_venture: args.filters?.ventureId ?? ctx.ventureId ?? null,
      filter_corpus: null,
    });
    if (error) throw new Error(`semantic.recall: ${error.message}`);
    const rows = (data ?? []) as Array<{
      id: string;
      venture_id: string | null;
      corpus_id: string | null;
      chunk_index: number | null;
      content: string;
      similarity: number;
      metadata: Record<string, unknown> | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      substrate: 'semantic',
      content: r.content,
      similarity: typeof r.similarity === 'number' ? r.similarity : 0,
      recencyScore: r.metadata && typeof r.metadata.createdAt === 'string'
        ? recencyScore(r.metadata.createdAt)
        : 0.5,
      confidence: 0.8,
      provenance: {
        source: `chunk:${r.id}`,
        driver: 'semantic',
        ventureId: r.venture_id ?? undefined,
        corpusId: r.corpus_id ?? undefined,
      },
      metadata: { ...(r.metadata ?? {}), chunkIndex: r.chunk_index ?? undefined },
    }));
  },
};
