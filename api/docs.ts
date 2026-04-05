import { requireAuth } from "./_auth";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        return res.json({ document: data });
      }

      // --- Delete document ---
      case 'delete': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { id: deleteId } = req.body;
        const { error } = await supabase.from('documents').delete().eq('id', deleteId);
        if (error) throw error;
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
