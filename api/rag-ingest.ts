import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

// ---------------------------------------------------------------------------
// RAG Ingest API — chunks text, embeds with Gemini text-embedding-004,
// stores in storage_chunks with vector(768) for semantic retrieval.
// Actions: ingest-text, ingest-file, ingest-drive-file, reindex-corpus,
//          delete-chunks, list-chunks
// ---------------------------------------------------------------------------

const EMBED_MODEL = 'text-embedding-004';
const EMBED_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const CHARS_PER_TOKEN = 4;

function getGoogleKey(): string {
  return process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';
}

// ── Chunking (duplicated server-side — keeps API self-contained) ──
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?\n]+\s*/g);
  return (matches && matches.length) ? matches : [text];
}

function chunkText(text: string, maxTokens = 512, overlap = 50): { index: number; text: string; tokenCount: number }[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const clean = (text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const sentences = splitSentences(clean);
  const chunks: { index: number; text: string; tokenCount: number }[] = [];
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
          index: chunks.length, text: s.slice(i, i + maxChars).trim(),
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

// ── Embedding via Gemini ──
async function embedBatch(texts: string[], taskType = 'RETRIEVAL_DOCUMENT'): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = getGoogleKey();
  if (!key) throw new Error('GOOGLE_AI_KEY not configured');
  const results: number[][] = [];
  for (let offset = 0; offset < texts.length; offset += 100) {
    const slice = texts.slice(offset, offset + 100);
    const body = {
      requests: slice.map(text => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
      })),
    };
    const res = await fetch(`${EMBED_ENDPOINT}/models/${EMBED_MODEL}:batchEmbedContents?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Embed failed: ${res.status}`);
    }
    const data = await res.json();
    for (const e of (data.embeddings || [])) results.push(e.values);
  }
  return results;
}

async function embedSingle(text: string, taskType = 'RETRIEVAL_QUERY'): Promise<number[]> {
  const key = getGoogleKey();
  if (!key) throw new Error('GOOGLE_AI_KEY not configured');
  const res = await fetch(`${EMBED_ENDPOINT}/models/${EMBED_MODEL}:embedContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Embed failed: ${res.status}`);
  }
  const data = await res.json();
  return data.embedding?.values || [];
}

// ── Drive file fetch (google-drive.ts proxy) ──
async function fetchDriveFileText(driveFileId: string, userId: string): Promise<string> {
  const supabase = getServiceClient();
  const { data: oauth } = await supabase
    .from('oauth_connections')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();
  if (!oauth?.access_token) throw new Error('No Google OAuth connection');

  // First check metadata for mime type
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=name,mimeType`,
    { headers: { Authorization: `Bearer ${oauth.access_token}` } },
  );
  if (!metaRes.ok) throw new Error(`Drive meta fetch failed: ${metaRes.status}`);
  const meta = await metaRes.json();

  // Google Docs export as text/plain
  if (meta.mimeType?.startsWith('application/vnd.google-apps.')) {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${oauth.access_token}` } },
    );
    if (!exportRes.ok) throw new Error(`Drive export failed: ${exportRes.status}`);
    return await exportRes.text();
  }

  // Regular file — download bytes, decode as UTF-8 (plain text / markdown)
  const dlRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    { headers: { Authorization: `Bearer ${oauth.access_token}` } },
  );
  if (!dlRes.ok) throw new Error(`Drive download failed: ${dlRes.status}`);
  return await dlRes.text();
}

// ── Main ingest: chunk → embed → upsert storage_chunks → bump corpus ──
interface IngestInput {
  text: string;
  file_id?: string | null;
  venture_id?: string | null;
  corpus_id?: string | null;
  metadata?: Record<string, unknown>;
}

async function ingestText(input: IngestInput) {
  const supabase = getServiceClient();
  const chunks = chunkText(input.text, 512, 50);
  if (chunks.length === 0) return { chunk_count: 0 };

  const embeddings = await embedBatch(chunks.map(c => c.text), 'RETRIEVAL_DOCUMENT');
  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding mismatch: ${embeddings.length} vs ${chunks.length} chunks`);
  }

  // Delete previous chunks for this file (full re-index semantics)
  if (input.file_id) {
    await supabase.from('storage_chunks').delete().eq('file_id', input.file_id);
  }

  const rows = chunks.map((c, i) => ({
    file_id: input.file_id ?? null,
    venture_id: input.venture_id ?? null,
    corpus_id: input.corpus_id ?? null,
    chunk_index: c.index,
    content: c.text,
    embedding: embeddings[i],
    token_count: c.tokenCount,
    metadata: input.metadata || {},
  }));

  // Batch insert — Supabase accepts up to a few thousand rows per request.
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('storage_chunks').insert(rows.slice(i, i + BATCH));
    if (error) throw error;
  }

  // Bump corpus stats
  if (input.corpus_id) {
    const { data: corpus } = await supabase
      .from('storage_rag_corpora').select('file_count').eq('id', input.corpus_id).single();
    await supabase.from('storage_rag_corpora')
      .update({
        file_count: (corpus?.file_count || 0) + (input.file_id ? 1 : 0),
        last_indexed_at: new Date().toISOString(),
      })
      .eq('id', input.corpus_id);
  }

  return { chunk_count: chunks.length };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'ingest-text': {
        const { text, venture_id, corpus_id, file_id, metadata } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });
        const result = await ingestText({ text, venture_id, corpus_id, file_id, metadata });
        await supabase.from('storage_audit_log').insert({
          user_id: ctx.userId, file_id, venture_id, action: 'rag_ingest_text',
          details: { chunk_count: result.chunk_count, corpus_id },
        });
        return res.json({ success: true, ...result });
      }

      case 'ingest-file': {
        const { file_id, venture_id, corpus_id } = req.body;
        if (!file_id) return res.status(400).json({ error: 'file_id required' });
        const { data: file } = await supabase
          .from('storage_files').select('name, path, ai_summary, venture_id, metadata_json').eq('id', file_id).single();
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Prefer ai_summary + metadata text. For full content, callers should
        // provide `text` via ingest-text or fetch from the provider first.
        const text = String(
          (req.body.text as string) ||
          file.ai_summary ||
          `${file.name}\n${file.path}\n${JSON.stringify(file.metadata_json || {})}`,
        );
        const result = await ingestText({
          text, file_id,
          venture_id: venture_id || file.venture_id,
          corpus_id,
          metadata: { file_name: file.name, file_path: file.path },
        });
        await supabase.from('storage_audit_log').insert({
          user_id: ctx.userId, file_id, venture_id: venture_id || file.venture_id,
          action: 'rag_ingest_file', details: { chunk_count: result.chunk_count, corpus_id },
        });
        return res.json({ success: true, ...result });
      }

      case 'ingest-drive-file': {
        const { drive_file_id, venture_id, corpus_id, file_id } = req.body;
        if (!drive_file_id) return res.status(400).json({ error: 'drive_file_id required' });
        const text = await fetchDriveFileText(drive_file_id, ctx.userId);
        const result = await ingestText({
          text, file_id, venture_id, corpus_id,
          metadata: { source: 'drive', drive_file_id },
        });
        await supabase.from('storage_audit_log').insert({
          user_id: ctx.userId, file_id, venture_id, action: 'rag_ingest_drive',
          details: { drive_file_id, chunk_count: result.chunk_count, corpus_id },
        });
        return res.json({ success: true, ...result });
      }

      case 'reindex-corpus': {
        const { corpus_id } = req.body;
        if (!corpus_id) return res.status(400).json({ error: 'corpus_id required' });
        const { data: chunks } = await supabase
          .from('storage_chunks').select('file_id').eq('corpus_id', corpus_id);
        const fileIds = Array.from(new Set((chunks || []).map(c => c.file_id).filter(Boolean)));
        let totalChunks = 0;
        for (const fid of fileIds) {
          const { data: file } = await supabase
            .from('storage_files').select('name, path, ai_summary, venture_id, metadata_json').eq('id', fid).single();
          if (!file) continue;
          const text = String(file.ai_summary || `${file.name}\n${file.path}`);
          const r = await ingestText({
            text, file_id: fid as string, venture_id: file.venture_id, corpus_id,
            metadata: { file_name: file.name, file_path: file.path },
          });
          totalChunks += r.chunk_count;
        }
        return res.json({ success: true, files: fileIds.length, chunks: totalChunks });
      }

      case 'delete-chunks': {
        const { file_id, corpus_id } = req.body;
        let q = supabase.from('storage_chunks').delete();
        if (file_id) q = q.eq('file_id', file_id);
        else if (corpus_id) q = q.eq('corpus_id', corpus_id);
        else return res.status(400).json({ error: 'file_id or corpus_id required' });
        const { error } = await q;
        if (error) throw error;
        return res.json({ success: true });
      }

      case 'list-chunks': {
        const fileId = req.query.file_id || req.body?.file_id;
        if (!fileId) return res.status(400).json({ error: 'file_id required' });
        const { data, error } = await supabase
          .from('storage_chunks')
          .select('id, chunk_index, content, token_count, metadata, created_at')
          .eq('file_id', fileId)
          .order('chunk_index', { ascending: true });
        if (error) throw error;
        return res.json({ chunks: data || [] });
      }

      case 'embed-query': {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });
        const vec = await embedSingle(query, 'RETRIEVAL_QUERY');
        return res.json({ embedding: vec, dim: vec.length });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
