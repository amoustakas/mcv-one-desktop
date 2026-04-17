import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';
import { embedOne } from './_embeddings.js';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// Google RAG API — real semantic retrieval via pgvector + Gemini synthesis.
//   file_search    — Gemini grounded web search (googleSearchRetrieval)
//   retrieve       — cosine-similarity match on storage_chunks (pgvector)
//   synthesize     — retrieve + Gemini answer with citations
//   create_corpus  — register a corpus in storage_rag_corpora
//   list_corpora   — list corpora (optionally venture-scoped)
//   delete_corpus  — cascade-delete chunks + corpus row
// ---------------------------------------------------------------------------

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';
const GEN_MODEL = 'gemini-1.5-pro';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

const embedQuery = (query: string) => embedOne(query, 'RETRIEVAL_QUERY');

async function generateGrounded(query: string, chunks: Array<{ content: string; source?: string }>): Promise<string> {
  if (!GOOGLE_AI_KEY) throw new Error('GOOGLE_AI_KEY not configured');
  const sources = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
  const prompt = `You are a retrieval-augmented assistant. Answer the question using ONLY the sources below. Cite sources inline as [1], [2], etc. If the sources don't answer the question, say so.

Sources:
${sources}

Question: ${query}

Answer:`;
  const res = await fetch(`${ENDPOINT}/models/${GEN_MODEL}:generateContent?key=${GOOGLE_AI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Generate failed: ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

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
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      // ── Web-grounded file search via Gemini ──
      case 'file_search': {
        const { query, max_results } = req.body;
        if (!GOOGLE_AI_KEY) return res.json({ results: [], message: 'Google AI key not configured' });
        const apiRes = await fetch(
          `${ENDPOINT}/models/${GEN_MODEL}:generateContent?key=${GOOGLE_AI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Search for files matching: ${query}` }] }],
              tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: 'MODE_DYNAMIC' } } }],
            }),
          },
        );
        if (!apiRes.ok) {
          const err = await apiRes.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Google API error');
        }
        const data = await apiRes.json();
        const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const results = groundingChunks.map((chunk: { web?: { title?: string; uri?: string } }, i: number) => ({
          name: chunk.web?.title || `Result ${i + 1}`,
          uri: chunk.web?.uri || '',
          type: 'web',
          score: 1 - (i * 0.1),
        }));
        return res.json({ results: results.slice(0, max_results || 10) });
      }

      // ── Real semantic retrieval via pgvector ──
      case 'retrieve': {
        const { query, corpus_id, venture_id, top_k, threshold } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });

        const queryEmbed = await embedQuery(query);
        const { data: matches, error } = await supabase.rpc('match_chunks', {
          query_embedding: queryEmbed,
          match_threshold: threshold ?? 0.65,
          match_count: top_k || 10,
          filter_venture: venture_id || null,
          filter_corpus: corpus_id || null,
        });
        if (error) throw error;

        // Enrich with file name/path for citations
        const fileIds = Array.from(new Set((matches || []).map((m: { file_id: string | null }) => m.file_id).filter(Boolean)));
        const { data: files } = fileIds.length
          ? await supabase.from('storage_files').select('id, name, path').in('id', fileIds as string[])
          : { data: [] };
        const fileMap = new Map((files || []).map(f => [f.id, f]));

        const chunks = (matches || []).map((m: { id: string; file_id: string | null; content: string; similarity: number; chunk_index: number; metadata: Record<string, unknown> }) => ({
          id: m.id,
          text: m.content,
          // Display name fallback chain: storage_files.name → metadata.title
          // (set by venture-docs-embed) → metadata.file_name (legacy) →
          // 'unknown'. Keeps venture_doc chunks citable alongside file chunks.
          source:
            (m.file_id && fileMap.get(m.file_id)?.name) ||
            (m.metadata?.title as string) ||
            (m.metadata?.file_name as string) ||
            'unknown',
          file_id: m.file_id,
          chunk_index: m.chunk_index,
          score: m.similarity,
        }));

        await supabase.from('storage_audit_log').insert({
          user_id: ctx.userId, venture_id: venture_id || null, action: 'rag_retrieve',
          details: { query, match_count: chunks.length, corpus_id },
        });

        return res.json({ chunks, count: chunks.length });
      }

      // ── Retrieve + Gemini answer with citations ──
      case 'synthesize': {
        const { query, corpus_id, venture_id, top_k, threshold } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });

        const queryEmbed = await embedQuery(query);
        const { data: matches, error } = await supabase.rpc('match_chunks', {
          query_embedding: queryEmbed,
          match_threshold: threshold ?? 0.65,
          match_count: top_k || 8,
          filter_venture: venture_id || null,
          filter_corpus: corpus_id || null,
        });
        if (error) throw error;

        if (!matches || matches.length === 0) {
          return res.json({
            answer: 'No relevant documents found. Try a different query or index more content.',
            citations: [], chunks: [],
          });
        }

        const fileIds = Array.from(new Set(matches.map((m: { file_id: string | null }) => m.file_id).filter(Boolean)));
        // Guard: an all-venture_doc result set has no file_ids; skip the
        // storage_files query rather than sending .in('id', []).
        const { data: files } = fileIds.length
          ? await supabase.from('storage_files').select('id, name, path').in('id', fileIds as string[])
          : { data: [] };
        const fileMap = new Map((files || []).map(f => [f.id, f]));

        const chunks = matches.map((m: { id: string; file_id: string | null; content: string; similarity: number; chunk_index: number; metadata: Record<string, unknown> }) => ({
          id: m.id, file_id: m.file_id,
          content: m.content, score: m.similarity,
          // See retrieve action for fallback rationale — keeps venture_doc
          // chunks identifiable by their doc title rather than 'unknown'.
          source:
            (m.file_id && fileMap.get(m.file_id)?.name) ||
            (m.metadata?.title as string) ||
            (m.metadata?.file_name as string) ||
            'unknown',
        }));

        const answer = await generateGrounded(query, chunks);
        const citations = chunks.map((c, i) => ({ n: i + 1, source: c.source, file_id: c.file_id, chunk_id: c.id }));

        await supabase.from('storage_audit_log').insert({
          user_id: ctx.userId, venture_id: venture_id || null, action: 'rag_synthesize',
          details: { query, chunks: chunks.length, corpus_id },
        });

        return res.json({ answer, citations, chunks });
      }

      case 'create_corpus': {
        const { name, description, venture_id } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        const { data, error } = await supabase.from('storage_rag_corpora').insert({
          name, description: description || '', venture_id,
          file_count: 0, google_corpus_id: null,
        }).select().single();
        if (error) throw error;
        return res.json({ corpus: data });
      }

      case 'list_corpora': {
        const ventureId = req.body?.venture_id || req.query.venture_id;
        // Use v_corpus_stats view for accurate file/chunk counts
        let query = supabase.from('v_corpus_stats').select('*');
        if (ventureId) query = query.eq('venture_id', ventureId);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ corpora: data || [] });
      }

      case 'delete_corpus': {
        const { corpus_id } = req.body;
        if (!corpus_id) return res.status(400).json({ error: 'corpus_id required' });
        await supabase.from('storage_chunks').delete().eq('corpus_id', corpus_id);
        const { error } = await supabase.from('storage_rag_corpora').delete().eq('id', corpus_id);
        if (error) throw error;
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
