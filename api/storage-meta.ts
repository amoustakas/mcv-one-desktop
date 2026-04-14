import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Storage Meta API — Versions, Compartments, Legal Hold, RAG Chunks
// Complements /api/storage (files) and /api/storage-audit (audit log)
// ---------------------------------------------------------------------------

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

async function logAudit(entry: Record<string, unknown>) {
  try { await supabase.from('storage_audit_log').insert(entry); } catch { /* non-fatal */ }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
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

      // ── RAG Chunks (lightweight, no pgvector — stored as JSON for now) ──
      case 'chunk-file': {
        const { file_id, corpus_id, chunks } = req.body;
        if (!file_id || !Array.isArray(chunks)) return res.status(400).json({ error: 'file_id + chunks[] required' });

        // Store chunks in storage_ai_analysis as analysis_type = 'rag_chunks'
        const { error } = await supabase.from('storage_ai_analysis').insert({
          file_id,
          analysis_type: 'rag_chunks',
          result_json: { corpus_id, chunks, chunk_count: chunks.length },
          model_used: 'chunker',
          tokens_used: chunks.reduce((sum: number, c: { text: string }) => sum + Math.ceil((c.text || '').length / 4), 0),
        });
        if (error) throw error;

        // Update corpus file count
        if (corpus_id) {
          const { data: corpus } = await supabase.from('storage_rag_corpora').select('file_count').eq('id', corpus_id).single();
          await supabase.from('storage_rag_corpora')
            .update({ file_count: (corpus?.file_count || 0) + 1, last_indexed_at: new Date().toISOString() })
            .eq('id', corpus_id);
        }

        await logAudit({ user_id: userId, file_id, action: 'rag_index', details: { corpus_id, chunk_count: chunks.length } });
        return res.json({ success: true, chunk_count: chunks.length });
      }

      case 'search-chunks': {
        const { query, corpus_id, venture_id, limit = 10 } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });

        // Simple text search over chunks (pgvector-ready — placeholder for semantic)
        let q = supabase
          .from('storage_ai_analysis')
          .select('file_id, result_json, created_at')
          .eq('analysis_type', 'rag_chunks')
          .order('created_at', { ascending: false })
          .limit(50);
        const { data, error } = await q;
        if (error) throw error;

        // Client-side text matching (in production: pgvector cosine similarity)
        const queryLower = String(query).toLowerCase();
        const matches: Array<{ file_id: string; chunk_text: string; chunk_index: number; score: number }> = [];

        for (const row of data || []) {
          const rj = row.result_json as { chunks?: Array<{ text: string }>; corpus_id?: string };
          if (corpus_id && rj.corpus_id !== corpus_id) continue;
          for (let i = 0; i < (rj.chunks || []).length; i++) {
            const chunk = rj.chunks![i];
            const text = String(chunk.text || '');
            const textLower = text.toLowerCase();
            if (textLower.includes(queryLower)) {
              const score = textLower.indexOf(queryLower) === 0 ? 1.0 : 0.8;
              matches.push({ file_id: row.file_id, chunk_text: text, chunk_index: i, score });
            }
          }
        }

        matches.sort((a, b) => b.score - a.score);
        await logAudit({ user_id: userId, action: 'rag_query', details: { query, matches: matches.length } });
        return res.json({ matches: matches.slice(0, limit), total: matches.length });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
