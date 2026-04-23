// scripts/foundation/_lib/chunking — delegates to @mcv/rag-sdk chunker + adds
// a deterministic sha256 hash per chunk so re-ingestion can dedup.
//
// The plan (A.4) specs 800-token windows with 120-token overlap. The rag-sdk
// chunker defaults to 512/50 but accepts overrides, so we pass the foundation
// tuning here.

import { createHash } from 'node:crypto';
import { chunkText, type Chunk } from '@mcv/rag-sdk';

export const FOUNDATION_CHUNK_TOKENS = 800;
export const FOUNDATION_CHUNK_OVERLAP = 120;
export const FOUNDATION_CORPUS_TAG = 'counsel_v1';

export interface FoundationChunk extends Chunk {
  /** sha256(content) — used as the dedup key for re-ingestion. */
  hash: string;
  metadata: Record<string, unknown>;
}

export interface ChunkingOptions {
  sourceDoc: string;          // filename for provenance (e.g. 'MCV-IP-Inventory-v1.1.md')
  sourceSection?: string;     // breadcrumb-style section path (e.g. '1.1 Corporate Marks')
  extraMetadata?: Record<string, unknown>;
}

/**
 * Chunk a single text body into foundation-tuned windows with provenance metadata.
 * The content hash lets the caller skip re-inserts on repeat ingestion.
 */
export function chunkDocument(text: string, opts: ChunkingOptions): FoundationChunk[] {
  if (!text.trim()) return [];
  const base = chunkText(text, {
    maxTokens: FOUNDATION_CHUNK_TOKENS,
    overlap: FOUNDATION_CHUNK_OVERLAP,
    strategy: 'sentence',
  });
  return base.map((chunk) => ({
    ...chunk,
    hash: sha256(chunk.text),
    metadata: {
      corpus: FOUNDATION_CORPUS_TAG,
      source_doc: opts.sourceDoc,
      source_section: opts.sourceSection ?? null,
      chunk_hash: sha256(chunk.text),
      token_count: chunk.tokenCount,
      ...(opts.extraMetadata ?? {}),
    },
  }));
}

/** Chunk each discrete unit (e.g. a table row) as its own atomic chunk regardless of size. */
export function chunkAtomic(units: string[], opts: ChunkingOptions): FoundationChunk[] {
  return units
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .map((text, idx) => ({
      index: idx,
      text,
      tokenCount: Math.ceil(text.length / 4),
      startChar: 0,
      endChar: text.length,
      hash: sha256(text),
      metadata: {
        corpus: FOUNDATION_CORPUS_TAG,
        source_doc: opts.sourceDoc,
        source_section: opts.sourceSection ?? null,
        chunk_hash: sha256(text),
        atomic: true,
        ...(opts.extraMetadata ?? {}),
      },
    }));
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
