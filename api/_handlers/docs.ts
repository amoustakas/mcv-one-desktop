import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { embedMany } from './_embeddings.js';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// Auto-index helper — chunks doc content, embeds, upserts into storage_chunks.
// Called fire-and-forget after create/update so the response stays fast.
// Skips docs shorter than 50 chars to avoid embedding trivial notes.
// ---------------------------------------------------------------------------
const CHARS_PER_TOKEN = 4;
const AUTO_INDEX_MIN_CHARS = 50;

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

async function autoIndexDoc(doc: {
  id: string; title: string; content?: string | null;
  venture_id?: string; doc_type?: string;
}) {
  const content = doc.content || '';
  if (content.trim().length < AUTO_INDEX_MIN_CHARS) return;
  try {
    const chunks = chunkForIndex(content);
    if (chunks.length === 0) return;
    const embeddings = await embedMany(chunks.map(c => c.text), 'RETRIEVAL_DOCUMENT');
    // Clear previous chunks for this doc, then insert fresh.
    await supabase.from('storage_chunks').delete().eq('file_id', doc.id);
    const rows = chunks.map((c, i) => ({
      file_id: doc.id,
      venture_id: doc.venture_id ?? null,
      corpus_id: null,
      chunk_index: i,
      content: c.text,
      embedding: embeddings[i],
      token_count: c.tokenCount,
      metadata: { source: 'docs', title: doc.title, doc_type: doc.doc_type || 'note' },
    }));
    // Insert in batches of 100 to stay under PostgREST payload limits.
    for (let i = 0; i < rows.length; i += 100) {
      await supabase.from('storage_chunks').insert(rows.slice(i, i + 100));
    }
    await supabase.from('storage_audit_log').insert({
      user_id: 'system', file_id: doc.id, venture_id: doc.venture_id ?? null,
      action: 'rag_auto_index', details: { chunks: chunks.length, doc_type: doc.doc_type },
    });
  } catch (err) {
    // Never fail the user request because indexing hit a snag. Log to console
    // for Vercel runtime logs so we can diagnose later.
    // eslint-disable-next-line no-console
    console.error('[docs auto-index]', doc.id, err instanceof Error ? err.message : err);
  }
}

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';

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
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;

  try {
    switch (action) {
      // --- List documents ---
      case 'list': {
        const ventureId = (req.query.venture_id || req.body?.venture_id) as string;
        const docType = (req.query.doc_type || req.body?.doc_type) as string;

        let query = supabase
          .from('documents')
          .select('id, title, doc_type, venture_id, source_url, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (ventureId) query = query.eq('venture_id', ventureId);
        if (docType) query = query.eq('doc_type', docType);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ documents: data });
      }

      // --- Get single document ---
      case 'get': {
        const id = (req.query.id || req.body?.id) as string;
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.json({ document: data });
      }

      // --- Create / upload document ---
      case 'create': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { title, content, venture_id, doc_type, source_url, metadata, user_id } = req.body;

        const { data, error } = await supabase
          .from('documents')
          .insert({
            title,
            content,
            venture_id: venture_id || 'mcv',
            doc_type: doc_type || 'note',
            source_url,
            metadata: metadata || {},
            user_id: user_id || 'system',
          })
          .select()
          .single();

        if (error) throw error;
        // Fire-and-forget auto-index so the response isn't blocked by embeds.
        void autoIndexDoc({
          id: data.id, title: data.title, content: data.content,
          venture_id: data.venture_id, doc_type: data.doc_type,
        });
        return res.json({ document: data });
      }

      // --- Update document ---
      case 'update': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { id: updateId, ...updates } = req.body;

        const { data, error } = await supabase
          .from('documents')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', updateId)
          .select()
          .single();

        if (error) throw error;
        // Re-index if content was part of the update (title/content changes only).
        if ('content' in updates || 'title' in updates) {
          void autoIndexDoc({
            id: data.id, title: data.title, content: data.content,
            venture_id: data.venture_id, doc_type: data.doc_type,
          });
        }
        return res.json({ document: data });
      }

      // --- Delete document ---
      case 'delete': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { id: deleteId } = req.body;
        const { error } = await supabase.from('documents').delete().eq('id', deleteId);
        if (error) throw error;
        // Cascade: drop any chunks we auto-indexed for this doc.
        await supabase.from('storage_chunks').delete().eq('file_id', deleteId);
        return res.json({ success: true });
      }

      // --- Search / query documents with Gemini ---
      case 'query': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

        const { question, venture_id: qVenture } = req.body;

        // Fetch relevant documents
        let docsQuery = supabase
          .from('documents')
          .select('id, title, content, doc_type, venture_id')
          .order('updated_at', { ascending: false })
          .limit(20);

        if (qVenture) docsQuery = docsQuery.eq('venture_id', qVenture);

        const { data: docs } = await docsQuery;
        if (!docs || docs.length === 0) {
          return res.json({ answer: 'No documents found to search.', sources: [] });
        }

        // Build context for Gemini
        const context = docs.map((d, i) =>
          `[Doc ${i + 1}: "${d.title}" (${d.doc_type}, ${d.venture_id})]\n${(d.content || '').slice(0, 8000)}`
        ).join('\n\n---\n\n');

        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(
          `You are NAOS, the intelligence system for MCV One / EdgeIQ Holdings. Answer the question based on the documents below. Cite document numbers when referencing them.\n\nDocuments:\n${context}\n\nQuestion: ${question}\n\nAnswer concisely and cite sources.`
        );

        const sources = docs.map((d) => ({ id: d.id, title: d.title, type: d.doc_type, venture: d.venture_id }));
        return res.json({ answer: result.response.text(), sources });
      }

      // --- Bulk ingest documents ---
      case 'ingest': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { documents: docsToIngest } = req.body;

        if (!Array.isArray(docsToIngest)) return res.status(400).json({ error: 'documents array required' });

        const { data, error } = await supabase
          .from('documents')
          .insert(docsToIngest.map((d: Record<string, unknown>) => ({
            title: d.title || 'Untitled',
            content: d.content || '',
            venture_id: d.venture_id || 'mcv',
            doc_type: d.doc_type || 'note',
            source_url: d.source_url || null,
            metadata: d.metadata || {},
            user_id: d.user_id || 'system',
          })))
          .select('id, title');

        if (error) throw error;
        return res.json({ ingested: data?.length || 0, documents: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
