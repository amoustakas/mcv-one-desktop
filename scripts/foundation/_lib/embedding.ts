// scripts/foundation/_lib/embedding — writes foundation chunks to storage_chunks.
//
// Behavior:
//   - If GOOGLE_AI_KEY / VITE_GOOGLE_AI_KEY is set → embed via text-embedding-004
//     (rag-sdk handles the Gemini call) and insert chunks with 768-dim vectors.
//   - If no key is set → skip embedding and return { inserted: 0, skipped: N }.
//     Row-level foundation data (ip_marks, counsel_tasks, etc.) still lands.
//     Re-running with a key populates the vectors.
//   - Dedup by metadata.chunk_hash: if a chunk with the same hash already exists
//     for the same source_doc, skip insert.
//
// The storage_chunks schema uses `file_id uuid REFERENCES storage_files(id)` —
// nullable, so foreign-corpus chunks (not backed by a storage_files row) work.

import type { SupabaseClient } from '@supabase/supabase-js';
import { embedBatch } from '@mcv/rag-sdk';
import type { FoundationChunk } from './chunking';

const EMBED_BATCH_SIZE = 50;

export interface WriteChunksResult {
  inserted: number;
  dedupSkipped: number;
  embedSkipped: number;
  errored: number;
}

export async function writeChunks(
  supabase: SupabaseClient,
  chunks: FoundationChunk[],
): Promise<WriteChunksResult> {
  if (chunks.length === 0) return { inserted: 0, dedupSkipped: 0, embedSkipped: 0, errored: 0 };

  const { data: existingRows, error: lookupErr } = await supabase
    .from('storage_chunks')
    .select('metadata')
    .contains('metadata', { corpus: chunks[0].metadata.corpus });
  if (lookupErr) {
    console.warn(`  ⚠ dedup lookup failed (${lookupErr.message}) — falling back to no-dedup insert.`);
  }
  const existingHashes = new Set(
    ((existingRows ?? []) as Array<{ metadata: { chunk_hash?: string } }>)
      .map((r) => r.metadata?.chunk_hash)
      .filter((h): h is string => typeof h === 'string'),
  );

  const fresh = chunks.filter((c) => !existingHashes.has(c.hash));
  const dedupSkipped = chunks.length - fresh.length;
  if (fresh.length === 0) return { inserted: 0, dedupSkipped, embedSkipped: 0, errored: 0 };

  const hasKey = Boolean(
    process.env.GOOGLE_AI_KEY ?? process.env.VITE_GOOGLE_AI_KEY,
  );
  if (!hasKey) {
    return { inserted: 0, dedupSkipped, embedSkipped: fresh.length, errored: 0 };
  }

  let inserted = 0;
  let errored = 0;
  for (let offset = 0; offset < fresh.length; offset += EMBED_BATCH_SIZE) {
    const slice = fresh.slice(offset, offset + EMBED_BATCH_SIZE);
    let vectors: number[][];
    try {
      vectors = await embedBatch(slice.map((c) => c.text));
    } catch (err) {
      console.warn(`  ⚠ embedBatch failed on slice ${offset} (${(err as Error).message}) — skipping.`);
      errored += slice.length;
      continue;
    }
    const rows = slice.map((chunk, i) => ({
      file_id: null,
      venture_id: null,
      corpus_id: null,
      chunk_index: chunk.index,
      content: chunk.text,
      embedding: vectors[i],
      token_count: chunk.tokenCount,
      metadata: chunk.metadata,
    }));
    const { error, count } = await supabase
      .from('storage_chunks')
      .insert(rows, { count: 'exact' });
    if (error) {
      console.warn(`  ⚠ insert failed on slice ${offset} (${error.message}) — skipping.`);
      errored += rows.length;
      continue;
    }
    inserted += count ?? rows.length;
  }
  return { inserted, dedupSkipped, embedSkipped: 0, errored };
}

/** Check whether the embedding key is available without calling embed. */
export function embeddingKeyPresent(): boolean {
  return Boolean(process.env.GOOGLE_AI_KEY ?? process.env.VITE_GOOGLE_AI_KEY);
}
