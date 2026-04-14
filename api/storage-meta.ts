import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

// ---------------------------------------------------------------------------
// Storage Meta API — Versions, Compartments, Legal Hold, RAG Chunks
// Complements /api/storage (files) and /api/storage-audit (audit log).
// Chunks now live in storage_chunks with pgvector embeddings; search-chunks
// delegates to /api/rag-ingest for a query embedding + match_chunks RPC.
// ---------------------------------------------------------------------------

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';
const EMBED_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

async function embedQuery(query: string): Promise<number[] | null> {
  if (!GOOGLE_AI_KEY) return null;
  try {
    const r = await fetch(`${EMBED_ENDPOINT}?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: query }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.embedding?.values || null;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const userId = ctx.userId;
  const supabase = getServiceClient();
  const logAudit = async (entry: Record<string, unknown>) => {
    try { await supabase.from('storage_audit_log').insert(entry); } catch { /* non-fatal */ }
  };
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      // ── Versions ──
      case 'list-versions': {
        const fileId = req.query.file_id || req.body?.file_id;
        if (!fileId) return res.status(400).json({ error: 'file_id required' });
        const { data, error } = await supabase
          .from('storage_versions')
          .select('*')
          .eq('file_id', fileId)
          .order('version_number', { ascending: false });
        if (error) throw error;
        return res.json({ versions: data || [] });
      }

      case 'create-version': {
        const { file_id, version_number, provider, path, size_bytes, content_hash, change_summary } = req.body;
        if (!file_id || !path) return res.status(400).json({ error: 'file_id + path required' });
        const { data, error } = await supabase
          .from('storage_versions')
          .insert({
            file_id, version_number, provider, path, size_bytes, content_hash,
            change_summary, created_by: userId,
          })
          .select().single();
        if (error) throw error;
        await logAudit({ user_id: userId, file_id, action: 'version_create', details: { version_number, change_summary } });
        return res.json({ version: data });
      }

      // ── Compartments ──
      case 'list-compartments': {
        const fileId = req.query.file_id || req.body?.file_id;
        if (!fileId) return res.status(400).json({ error: 'file_id required' });
        const { data, error } = await supabase
          .from('storage_compartments')
          .select('*')
          .eq('file_id', fileId);
        if (error) throw error;
        return res.json({ compartments: data || [] });
      }

      case 'add-compartment': {
        const { file_id, venture_id, compartment, access_level, tags } = req.body;
        if (!file_id || !venture_id) return res.status(400).json({ error: 'file_id + venture_id required' });
        const { data, error } = await supabase
          .from('storage_compartments')
          .insert({
            file_id, venture_id,
            compartment: compartment || 'default',
            access_level: access_level || 'venture',
            tags: tags || [],
          })
          .select().single();
        if (error) throw error;
        await logAudit({ user_id: userId, file_id, venture_id, action: 'compartment_add', details: { compartment, access_level } });
        return res.json({ compartment: data });
      }

      case 'remove-compartment': {
        const { file_id, compartment_id } = req.body;
        if (!compartment_id) return res.status(400).json({ error: 'compartment_id required' });
        const { error } = await supabase
          .from('storage_compartments').delete().eq('id', compartment_id);
        if (error) throw error;
        await logAudit({ user_id: userId, file_id, action: 'compartment_remove', details: { compartment_id } });
        return res.json({ success: true });
      }

      // ── Legal Hold ──
      case 'legal-hold': {
        const { file_id, reason, hold } = req.body;
        if (!file_id) return res.status(400).json({ error: 'file_id required' });
        const certification = hold ? 'legal-hold' : 'none';
        const { error } = await supabase
          .from('storage_files')
          .update({ certification })
          .eq('id', file_id);
        if (error) throw error;
        await logAudit({
          user_id: userId, file_id,
          action: hold ? 'legal_hold' : 'legal_hold_release',
          details: { reason, certification },
        });
        return res.json({ success: true, certification });
      }

      case 'legal-hold-list': {
        const ventureId = req.query.venture_id || req.body?.venture_id;
        let query = supabase.from('storage_files').select('*').eq('certification', 'legal-hold');
        if (ventureId) query = query.eq('venture_id', ventureId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ files: data || [] });
      }

      // ── RAG Chunks: pgvector-backed storage_chunks table ──
      // Accepts pre-computed chunks { text, embedding?, token_count? }.
      // If no embedding supplied, chunks are stored without vectors (lexical
      // fallback). For full semantic indexing, prefer /api/rag-ingest.
      case 'chunk-file': {
        const { file_id, corpus_id, venture_id, chunks } = req.body;
        if (!file_id || !Array.isArray(chunks)) return res.status(400).json({ error: 'file_id + chunks[] required' });

        // Replace existing chunks for this file (idempotent re-index)
        await supabase.from('storage_chunks').delete().eq('file_id', file_id);

        const rows = chunks.map((c: { text: string; embedding?: number[]; token_count?: number; metadata?: Record<string, unknown> }, i: number) => ({
          file_id, venture_id: venture_id ?? null, corpus_id: corpus_id ?? null,
          chunk_index: i, content: String(c.text || ''),
          embedding: c.embedding || null,
          token_count: c.token_count ?? Math.ceil((c.text || '').length / 4),
          metadata: c.metadata || {},
        }));
        const { error } = await supabase.from('storage_chunks').insert(rows);
        if (error) throw error;

        if (corpus_id) {
          const { data: corpus } = await supabase.from('storage_rag_corpora').select('file_count').eq('id', corpus_id).single();
          await supabase.from('storage_rag_corpora')
            .update({ file_count: (corpus?.file_count || 0) + 1, last_indexed_at: new Date().toISOString() })
            .eq('id', corpus_id);
        }

        await logAudit({ user_id: userId, file_id, venture_id, action: 'rag_index', details: { corpus_id, chunk_count: chunks.length } });
        return res.json({ success: true, chunk_count: chunks.length });
      }

      case 'search-chunks': {
        const { query, corpus_id, venture_id, limit = 10, threshold = 0.6 } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });

        const queryEmbed = await embedQuery(String(query));

        // Vector path — preferred
        if (queryEmbed) {
          const { data, error } = await supabase.rpc('match_chunks', {
            query_embedding: queryEmbed,
            match_threshold: threshold,
            match_count: limit,
            filter_venture: venture_id || null,
            filter_corpus: corpus_id || null,
          });
          if (error) throw error;
          const matches = (data || []).map((m: { id: string; file_id: string; chunk_index: number; content: string; similarity: number }) => ({
            file_id: m.file_id, chunk_text: m.content, chunk_index: m.chunk_index, score: m.similarity,
          }));
          await logAudit({ user_id: userId, action: 'rag_query', details: { query, matches: matches.length, mode: 'vector' } });
          return res.json({ matches, total: matches.length, mode: 'vector' });
        }

        // Lexical fallback — used when Google AI key is absent (dev / offline).
        let q = supabase.from('storage_chunks').select('file_id, chunk_index, content').limit(200);
        if (corpus_id) q = q.eq('corpus_id', corpus_id);
        if (venture_id) q = q.eq('venture_id', venture_id);
        const { data, error } = await q;
        if (error) throw error;
        const queryLower = String(query).toLowerCase();
        const matches = (data || [])
          .filter(r => String(r.content).toLowerCase().includes(queryLower))
          .slice(0, limit)
          .map(r => ({ file_id: r.file_id, chunk_text: r.content, chunk_index: r.chunk_index, score: 0.5 }));
        await logAudit({ user_id: userId, action: 'rag_query', details: { query, matches: matches.length, mode: 'lexical' } });
        return res.json({ matches, total: matches.length, mode: 'lexical' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
