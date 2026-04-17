// api/_handlers/venture-docs-embed.ts
//
// Embeds venture_docs.body_markdown into storage_chunks so the rest of the
// app's RAG retrieval (match_chunks RPC) can answer venture-doc questions.
//
// Three actions:
//   embed-one     { doc_id }     — embed a single doc, used by UI on save
//   embed-venture { venture_id } — embed every doc in a venture, used by
//                                  bulk operators after Notion-BDT import
//   embed-stale   {}             — find all docs whose body_markdown hash
//                                  has changed since last_embedded_at and
//                                  embed them. Cron entry point.
//
// Auth:
//   * Cron: Bearer ${CRON_SECRET} header (mirrors compliance-cron pattern).
//   * Manual / agent: standard Clerk JWT via requireAuth.
//
// Re-index semantics: each call deletes prior chunks for the doc_id (keyed
// on source_type='venture_doc' AND source_id=doc.id) before inserting the
// new batch — so editing a doc keeps storage_chunks consistent without
// duplicates. Hash check skips no-op work when only meta/status changed.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { getServiceClient, requireAuth } from './_supabase.js';
import { embedMany } from './_embeddings.js';

import { requestLogger } from '../../src/lib/server/logger';
// ─── Chunking (mirrors rag-ingest.ts; keeps this handler self-contained
//     so a future SDK extraction can replace both at once) ────────────────

const CHARS_PER_TOKEN = 4;

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?\n]+\s*/g);
  return (matches && matches.length) ? matches : [text];
}

interface Chunk { index: number; text: string; tokenCount: number }

function chunkText(text: string, maxTokens = 512, overlap = 50): Chunk[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const clean = (text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const sentences = splitSentences(clean);
  const chunks: Chunk[] = [];
  let buf = '';
  const flush = () => {
    const t = buf.trim();
    if (!t) return;
    chunks.push({ index: chunks.length, text: t, tokenCount: Math.ceil(t.length / CHARS_PER_TOKEN) });
    buf = overlap > 0 ? t.slice(-overlap * CHARS_PER_TOKEN) + ' ' : '';
  };
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (buf.trim()) flush();
      for (let i = 0; i < s.length; i += (maxChars - overlap * CHARS_PER_TOKEN)) {
        chunks.push({
          index: chunks.length,
          text: s.slice(i, i + maxChars).trim(),
          tokenCount: Math.ceil(Math.min(maxChars, s.length - i) / CHARS_PER_TOKEN),
        });
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

// ─── Per-doc embed primitive ───────────────────────────────────────────

interface DocRow {
  id: string;
  venture_id: string;
  department: string;
  title: string;
  body_markdown: string | null;
  template_id: string | null;
  status: string;
  embed_content_hash: string | null;
}

interface EmbedResult {
  doc_id: string;
  status: 'embedded' | 'skipped-empty' | 'skipped-unchanged' | 'failed';
  chunks: number;
  duration_ms: number;
  error?: string;
}

function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function embedOneDoc(doc: DocRow, opts: { force?: boolean } = {}): Promise<EmbedResult> {
  const start = Date.now();
  const supabase = getServiceClient();

  if (!doc.body_markdown || !doc.body_markdown.trim()) {
    // Doc has no body — wipe any stale chunks and mark as embedded with 0 chunks.
    await supabase
      .from('storage_chunks')
      .delete()
      .eq('source_type', 'venture_doc')
      .eq('source_id', doc.id);
    await supabase
      .from('venture_docs')
      .update({
        last_embedded_at: new Date().toISOString(),
        embed_content_hash: '',
        embed_chunk_count: 0,
      })
      .eq('id', doc.id);
    return { doc_id: doc.id, status: 'skipped-empty', chunks: 0, duration_ms: Date.now() - start };
  }

  const newHash = sha256Hex(doc.body_markdown);
  if (!opts.force && doc.embed_content_hash === newHash) {
    return { doc_id: doc.id, status: 'skipped-unchanged', chunks: 0, duration_ms: Date.now() - start };
  }

  const chunks = chunkText(doc.body_markdown, 512, 50);
  if (chunks.length === 0) {
    return { doc_id: doc.id, status: 'skipped-empty', chunks: 0, duration_ms: Date.now() - start };
  }

  let embeddings: number[][];
  try {
    embeddings = await embedMany(chunks.map((c) => c.text), 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    return {
      doc_id: doc.id,
      status: 'failed',
      chunks: 0,
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'embed failed',
    };
  }
  if (embeddings.length !== chunks.length) {
    return {
      doc_id: doc.id,
      status: 'failed',
      chunks: 0,
      duration_ms: Date.now() - start,
      error: `embedding count mismatch (${embeddings.length} vs ${chunks.length})`,
    };
  }

  // Wipe previous chunks for this doc, then insert fresh batch.
  await supabase
    .from('storage_chunks')
    .delete()
    .eq('source_type', 'venture_doc')
    .eq('source_id', doc.id);

  const rows = chunks.map((c, i) => ({
    file_id: null,
    venture_id: doc.venture_id,
    corpus_id: null,
    chunk_index: c.index,
    content: c.text,
    embedding: embeddings[i],
    token_count: c.tokenCount,
    source_type: 'venture_doc' as const,
    source_id: doc.id,
    metadata: {
      kind: 'venture_doc',
      doc_id: doc.id,
      department: doc.department,
      title: doc.title,
      template_id: doc.template_id,
      status: doc.status,
    },
  }));

  // Supabase batch limit is generous; 100/insert keeps payload small.
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('storage_chunks').insert(rows.slice(i, i + BATCH));
    if (error) {
      return {
        doc_id: doc.id,
        status: 'failed',
        chunks: i,
        duration_ms: Date.now() - start,
        error: error.message,
      };
    }
  }

  await supabase
    .from('venture_docs')
    .update({
      last_embedded_at: new Date().toISOString(),
      embed_content_hash: newHash,
      embed_chunk_count: chunks.length,
    })
    .eq('id', doc.id);

  return {
    doc_id: doc.id,
    status: 'embedded',
    chunks: chunks.length,
    duration_ms: Date.now() - start,
  };
}

// ─── Auth — accepts Clerk JWT or the cron bearer secret ─────────────────

function isCronRequest(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${cronSecret}`;
}

// ─── Handler ────────────────────────────────────────────────────────────

const STALE_BATCH_LIMIT = 50; // safety cap per cron tick — tune up later

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
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'POST or GET required' });
  }

  const cron = isCronRequest(req);
  if (!cron) {
    const ctx = await requireAuth(req, res);
    if (!ctx) return;
  }

  const supabase = getServiceClient();
  const action = (req.body?.action || req.query.action) as string | undefined;
  const force = Boolean(req.body?.force ?? req.query.force);

  // Default action when hit by cron without a body — embed-stale
  const effective = action || (cron ? 'embed-stale' : null);
  if (!effective) return res.status(400).json({ error: 'action required' });

  const SELECT = 'id, venture_id, department, title, body_markdown, template_id, status, embed_content_hash';

  try {
    if (effective === 'embed-one') {
      const docId = (req.body?.doc_id || req.query.doc_id) as string | undefined;
      if (!docId) return res.status(400).json({ error: 'doc_id required' });

      const { data: doc, error } = await supabase
        .from('venture_docs')
        .select(SELECT)
        .eq('id', docId)
        .maybeSingle<DocRow>();

      if (error) throw error;
      if (!doc) return res.status(404).json({ error: 'doc not found' });

      const result = await embedOneDoc(doc, { force });
      return res.json({ result });
    }

    if (effective === 'embed-venture') {
      const ventureId = (req.body?.venture_id || req.query.venture_id) as string | undefined;
      if (!ventureId) return res.status(400).json({ error: 'venture_id required' });

      const { data: docs, error } = await supabase
        .from('venture_docs')
        .select(SELECT)
        .eq('venture_id', ventureId)
        .returns<DocRow[]>();

      if (error) throw error;
      const results: EmbedResult[] = [];
      for (const doc of docs ?? []) {
        results.push(await embedOneDoc(doc, { force }));
      }
      return res.json({ count: results.length, results });
    }

    if (effective === 'embed-stale') {
      // Stale = (never embedded) OR (updated_at > last_embedded_at) OR forced.
      // We over-fetch by embed_content_hash check to also catch cases where
      // the timestamp lies but content actually matches (cheap skip below).
      const query = supabase
        .from('venture_docs')
        .select(SELECT)
        .not('body_markdown', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(STALE_BATCH_LIMIT)
        .returns<DocRow[]>();

      const { data: docs, error } = await query;
      if (error) throw error;

      // Filter to those genuinely stale to keep the cron tick cheap.
      // If forced, process all returned. Otherwise check the embed metadata.
      const candidates = (docs ?? []).filter((d) => {
        if (force) return true;
        if (!d.embed_content_hash) return true; // never embedded
        return sha256Hex(d.body_markdown ?? '') !== d.embed_content_hash;
      });

      const results: EmbedResult[] = [];
      for (const doc of candidates) {
        results.push(await embedOneDoc(doc, { force }));
      }

      return res.json({
        scanned: docs?.length ?? 0,
        candidates: candidates.length,
        embedded: results.filter((r) => r.status === 'embedded').length,
        skipped: results.filter((r) => r.status.startsWith('skipped')).length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      });
    }

    return res.status(400).json({ error: `unknown action "${effective}"` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[venture-docs-embed]', msg);
    return res.status(500).json({ error: msg });
  }
}
