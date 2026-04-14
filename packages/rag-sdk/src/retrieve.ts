// @mcv/rag-sdk/retrieve — pgvector query helper.
//
// Supabase-agnostic: caller injects the Supabase client so the SDK has
// zero runtime dependency on a specific DB instance. Works against the
// MCV canonical `match_chunks` RPC:
//
//   create function match_chunks(
//     query_embedding vector(768),
//     match_threshold float,
//     match_count integer,
//     filter_venture text,
//     filter_corpus text
//   ) returns table (id uuid, content text, similarity float, ...)
//
// Consumers that don't have this RPC can implement equivalent logic
// themselves — this helper just wraps the canonical MCV signature.

import { embedOne, type TaskType } from './embeddings';

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  file_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RetrieveOptions {
  /** Supabase client (or any object with `.rpc(name, args)`) */
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  query: string;
  ventureId?: string;
  corpusId?: string;
  topK?: number;
  threshold?: number;
  /** Embedding task type — defaults to RETRIEVAL_QUERY */
  taskType?: TaskType;
}

/**
 * Embed the query, call match_chunks, return ranked chunks.
 * Empty array on any failure. Use `throwOnError: true` in a future
 * variant if callers need to distinguish "no matches" from "failed".
 */
export async function retrieve(opts: RetrieveOptions): Promise<RetrievedChunk[]> {
  if (!opts.query || opts.query.trim().length < 2) return [];

  try {
    const embedding = await embedOne(opts.query, opts.taskType ?? 'RETRIEVAL_QUERY');
    const { data, error } = await opts.supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: opts.threshold ?? 0.6,
      match_count: opts.topK ?? 4,
      filter_venture: opts.ventureId ?? null,
      filter_corpus: opts.corpusId ?? null,
    });
    if (error) return [];
    return Array.isArray(data) ? (data as RetrievedChunk[]) : [];
  } catch {
    return [];
  }
}
