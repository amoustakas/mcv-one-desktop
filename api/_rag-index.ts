// ---------------------------------------------------------------------------
// Shared RAG indexing helper — used by docs, memory, and rag-ingest routes.
// Chunks content, embeds via gemini-embedding-001 (with fallback), upserts
// into storage_chunks with file_id as the stable key.
// ---------------------------------------------------------------------------

import { embedMany } from './_embeddings.js';
import { getServiceClient } from './_supabase.js';

const CHARS_PER_TOKEN = 4;
const MIN_CONTENT_CHARS = 50;

export interface IndexRequest {
  /** Stable id for the source row (doc id, memory id, etc). Used as file_id. */
  id: string;
  /** Human-readable title (optional; stored in chunk metadata). */
  title?: string;
  /** The content to embed. */
  content: string;
  /** Venture to scope by. */
  ventureId?: string | null;
  /** Which system produced this content (docs / memory / files / etc). */
  source: string;
  /** Optional extra metadata to attach to every chunk. */
  metadata?: Record<string, unknown>;
  /** User id for audit log. Default 'system'. */
  userId?: string;
}

export interface IndexResult {
  chunkCount: number;
  skipped: boolean;
  reason?: string;
}

function chunkForIndex(text: string, maxTokens = 512, overlap = 50): { text: string; tokenCount: number }[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+\s*/g) || [clean];
  const chunks: { text: string; tokenCount: number }[] = [];
  let buf = '';
  const flush = () => {
    const t = buf.trim();
    if (!t) return;
    chunks.push({ text: t, tokenCount: Math.ceil(t.length / CHARS_PER_TOKEN) });
    buf = overlap > 0 ? t.slice(-overlap * CHARS_PER_TOKEN) + ' ' : '';
  };
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (buf.trim()) flush();
      for (let i = 0; i < s.length; i += (maxChars - overlap * CHARS_PER_TOKEN)) {
        const slice = s.slice(i, i + maxChars).trim();
        if (slice) chunks.push({ text: slice, tokenCount: Math.ceil(slice.length / CHARS_PER_TOKEN) });
      }
      buf = '';
      continue;
    }
    if ((buf.length + s.length) > maxChars && buf.trim()) flush();
    buf += s;
  }
  if (buf.trim()) flush();
  return chunks;
}

/**
 * Index content into storage_chunks. Replaces any existing chunks for the
 * same file_id so re-indexing is idempotent.
 */
export async function indexContent(req: IndexRequest): Promise<IndexResult> {
  const content = (req.content || '').trim();
  if (content.length < MIN_CONTENT_CHARS) {
    return { chunkCount: 0, skipped: true, reason: `content < ${MIN_CONTENT_CHARS} chars` };
  }

  const supabase = getServiceClient();
  const chunks = chunkForIndex(content);
  if (chunks.length === 0) return { chunkCount: 0, skipped: true, reason: 'no chunks produced' };

  const embeddings = await embedMany(chunks.map(c => c.text), 'RETRIEVAL_DOCUMENT');
  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding mismatch: ${embeddings.length} vs ${chunks.length}`);
  }

  // Replace previous chunks for this source id.
  await supabase.from('storage_chunks').delete().eq('file_id', req.id);

  const rows = chunks.map((c, i) => ({
    file_id: req.id,
    venture_id: req.ventureId ?? null,
    corpus_id: null,
    chunk_index: i,
    content: c.text,
    embedding: embeddings[i],
    token_count: c.tokenCount,
    metadata: {
      source: req.source,
      title: req.title,
      ...(req.metadata || {}),
    },
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from('storage_chunks').insert(rows.slice(i, i + 100));
    if (error) throw error;
  }

  await supabase.from('storage_audit_log').insert({
    user_id: req.userId || 'system',
    file_id: req.id,
    venture_id: req.ventureId ?? null,
    action: 'rag_auto_index',
    details: { chunks: chunks.length, source: req.source },
  });

  return { chunkCount: chunks.length, skipped: false };
}
