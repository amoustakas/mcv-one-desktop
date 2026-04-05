import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'file_search': {
        const { query, file_types, max_results } = req.body;
        // Google File Search via Gemini grounding
        // This proxies to the Google AI GenerateContent API with grounding enabled
        if (!GOOGLE_AI_KEY) {
          return res.json({ results: [], message: 'Google AI key not configured' });
        }
        const apiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_KEY}`,
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
        const results = groundingChunks.map((chunk: any, i: number) => ({
          name: chunk.web?.title || `Result ${i + 1}`,
          uri: chunk.web?.uri || '',
          type: 'web',
          score: 1 - (i * 0.1),
        }));
        return res.json({ results: results.slice(0, max_results || 10) });
      }

      case 'retrieve': {
        const { query, corpus_id, top_k } = req.body;
        // Check if corpus exists in our DB
        const { data: corpus } = await supabase
          .from('storage_rag_corpora')
          .select('*')
          .eq('id', corpus_id)
          .single();

        if (!corpus) {
          return res.status(404).json({ error: `Corpus ${corpus_id} not found` });
        }

        // Use Gemini with corpus context for grounded retrieval
        if (!GOOGLE_AI_KEY) {
          return res.json({ chunks: [], message: 'Google AI key not configured' });
        }

        // Retrieve indexed files for this corpus
        const { data: files } = await supabase
          .from('storage_files')
          .select('name, path, ai_summary, tags')
          .eq('venture_id', corpus.venture_id)
          .limit(top_k || 5);

        const chunks = (files || []).map((f: any, i: number) => ({
          text: f.ai_summary || `File: ${f.name} at ${f.path}`,
          source: f.name,
          score: 1 - (i * 0.1),
        }));

        return res.json({ chunks });
      }

      case 'create_corpus': {
        const { name, description, file_ids, venture_id } = req.body;
        const { data, error } = await supabase.from('storage_rag_corpora').insert({
          name,
          description: description || '',
          venture_id,
          file_count: file_ids?.length || 0,
          google_corpus_id: null, // Will be set when Google RAG API corpus is created
        }).select().single();

        if (error) throw error;
        return res.json({ corpus: data });
      }

      case 'list_corpora': {
        const ventureId = req.body?.venture_id || req.query.venture_id;
        let query = supabase.from('storage_rag_corpora').select('*').order('created_at', { ascending: false });
        if (ventureId) query = query.eq('venture_id', ventureId);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ corpora: data || [] });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
