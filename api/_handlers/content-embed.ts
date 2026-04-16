// api/_handlers/content-embed.ts
//
// Embeds `content.body_markdown` (or equivalent body field) into
// storage_chunks so RAG retrieval (match_chunks RPC) can answer content
// questions across every venture. Parallel to venture-docs-embed; same
// polymorphic source_type pattern (source_type='content', source_id=content.id).
//
// Three actions:
//   embed-one     { content_id }           — embed a single content row
//   embed-venture { venture_id [, corpus_id] } — embed every content row in a venture/corpus
//   embed-stale   {}                       — find all rows whose body hash has
//                                             changed since last_embedded_at;
//                                             cron entry point
//
// Auth:
//   Cron:        Bearer ${CRON_SECRET} header
//   Manual/agent: standard Clerk JWT via requireAuth
//
// Re-index semantics: each call deletes prior chunks for the content_id
// (source_type='content' AND source_id=content.id) before inserting the
// new batch — edits stay consistent, no duplicates. Hash check skips work
// when only metadata/status changed.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { getServiceClient, requireAuth } from './_supabase.js';
import { embedMany } from './_embeddings.js';

// ─── Chunking (mirrors venture-docs-embed for parity) ─────────────────────

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

// ─── Per-row embed primitive ──────────────────────────────────────────────

interface ContentRow {
  id: string;
  venture_id: string | null;
  corpus_id: string | null;
  slug: string | null;
  title: string | null;
  body_markdown: string | null;
  content_type: string | null;
  status: string | null;
  content_hash: string | null;
}

interface EmbedResult {
  content_id: string;
  status: 'embedded' | 'skipped-empty' | 'skipped-unchanged' | 'failed';
  chunks: number;
  duration_ms: number;
  error?: string;
}

function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function embedOneContent(row: ContentRow, opts: { force?: boolean } = {}): Promise<EmbedResult> {
  const start = Date.now();
  const supabase = getServiceClient();

  if (!row.body_markdown || !row.body_markdown.trim()) {
    await supabase.from('storage_chunks').delete()
      .eq('source_type', 'content').eq('source_id', row.id);
    await supabase.from('content').update({
      last_embedded_at: new Date().toISOString(),
      content_hash: '',
      embed_chunk_count: 0,
    }).eq('id', row.id);
    return { content_id: row.id, status: 'skipped-empty', chunks: 0, duration_ms: Date.now() - start };
  }

  const newHash = sha256Hex(row.body_markdown);
  if (!opts.force && row.content_hash === newHash) {
    return { content_id: row.id, status: 'skipped-unchanged', chunks: 0, duration_ms: Date.now() - start };
  }

  const chunks = chunkText(row.body_markdown, 512, 50);
  if (chunks.length === 0) {
    return { content_id: row.id, status: 'skipped-empty', chunks: 0, duration_ms: Date.now() - start };
  }

  let embeddings: number[][];
  try {
    embeddings = await embedMany(chunks.map((c) => c.text), 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    return {
      content_id: row.id, status: 'failed', chunks: 0, duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'embed failed',
    };
  }
  if (embeddings.length !== chunks.length) {
    return {
      content_id: row.id, status: 'failed', chunks: 0, duration_ms: Date.now() - start,
      error: `embedding count mismatch (${embeddings.length} vs ${chunks.length})`,
    };
  }

  await supabase.from('storage_chunks').delete()
    .eq('source_type', 'content').eq('source_id', row.id);

  const rows = chunks.map((c, i) => ({
    file_id: null,
    venture_id: row.venture_id,
    corpus_id: row.corpus_id,
    chunk_index: c.index,
    content: c.text,
    embedding: embeddings[i],
    token_count: c.tokenCount,
    source_type: 'content' as const,
    source_id: row.id,
    metadata: {
      kind: 'content',
      content_id: row.id,
      content_type: row.content_type,
      slug: row.slug,
      title: row.title,
      status: row.status,
    },
  }));

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('storage_chunks').insert(rows.slice(i, i + BATCH));
    if (error) {
      return {
        content_id: row.id, status: 'failed', chunks: i, duration_ms: Date.now() - start,
        error: error.message,
      };
    }
  }

  await supabase.from('content').update({
    last_embedded_at: new Date().toISOString(),
    content_hash: newHash,
    embed_chunk_count: chunks.length,
  }).eq('id', row.id);

  return { content_id: row.id, status: 'embedded', chunks: chunks.length, duration_ms: Date.now() - start };
}

// ─── Auth ─────────────────────────────────────────────────────────────────

function isCronRequest(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return req.headers.authorization === `Bearer ${cronSecret}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────

const STALE_BATCH_LIMIT = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'POST or GET required' });
  }

  const cron = isCronRequest(req);
  if (!cron) {
    const ctx = await requireAuth(req, res);
    if (!ctx) return;
  }

  const supabase = getServiceClient();
  const action = ((req.body as Record<string, unknown> | undefined)?.action as string | undefined)
    ?? (req.query.action as string | undefined)
    ?? 'embed-stale';
  const force = Boolean(((req.body as Record<string, unknown> | undefined)?.force) ?? req.query.force);

  try {
    // Defensive: if content table doesn't exist, return a clean no-op so the
    // cron log doesn't alarm during pre-content-corpus period.
    const tableCheck = await supabase.from('content').select('id').limit(1);
    if (tableCheck.error && /relation .* does not exist/i.test(tableCheck.error.message)) {
      return res.status(200).json({ ok: true, skipped: 'content table not yet provisioned' });
    }

    switch (action) {
      case 'embed-one': {
        const contentId = (req.body as Record<string, unknown> | undefined)?.content_id as string | undefined
          ?? req.query.content_id as string | undefined;
        if (!contentId) return res.status(400).json({ error: 'content_id required' });

        const { data, error } = await supabase.from('content')
          .select('id, venture_id, corpus_id, slug, title, body_markdown, content_type, status, content_hash')
          .eq('id', contentId).maybeSingle();
        if (error || !data) return res.status(404).json({ error: error?.message ?? 'not found' });

        const result = await embedOneContent(data as ContentRow, { force });
        return res.status(200).json({ ok: true, result });
      }

      case 'embed-venture': {
        const ventureId = (req.body as Record<string, unknown> | undefined)?.venture_id as string | undefined
          ?? req.query.venture_id as string | undefined;
        if (!ventureId) return res.status(400).json({ error: 'venture_id required' });
        const corpusId = (req.body as Record<string, unknown> | undefined)?.corpus_id as string | undefined
          ?? req.query.corpus_id as string | undefined;

        let q = supabase.from('content')
          .select('id, venture_id, corpus_id, slug, title, body_markdown, content_type, status, content_hash')
          .eq('venture_id', ventureId)
          .limit(500);
        if (corpusId) q = q.eq('corpus_id', corpusId);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });

        const rows = (data ?? []) as ContentRow[];
        const results: EmbedResult[] = [];
        for (const row of rows) {
          results.push(await embedOneContent(row, { force }));
        }
        return res.status(200).json({
          ok: true, venture_id: ventureId, total: rows.length, results,
        });
      }

      case 'embed-stale':
      default: {
        const { data, error } = await supabase.from('content')
          .select('id, venture_id, corpus_id, slug, title, body_markdown, content_type, status, content_hash, last_embedded_at, updated_at')
          .or('last_embedded_at.is.null,last_embedded_at.lt.updated_at')
          .limit(STALE_BATCH_LIMIT);
        if (error) return res.status(500).json({ error: error.message });

        const rows = (data ?? []) as ContentRow[];
        const results: EmbedResult[] = [];
        for (const row of rows) {
          results.push(await embedOneContent(row, { force }));
        }
        return res.status(200).json({
          ok: true, action: 'embed-stale', total: rows.length, results,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'internal error',
    });
  }
}
