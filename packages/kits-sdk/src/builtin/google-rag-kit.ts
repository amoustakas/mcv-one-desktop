import type { KitManifest, KitToolHandler } from '../types';

const RAG_API = '/api/google-rag';

async function postRag(body: Record<string, unknown>, ctx: { fetch: typeof globalThis.fetch }) {
  const res = await ctx.fetch(RAG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'RAG API error' }));
    throw new Error(err.error || `RAG error: ${res.status}`);
  }
  return res.json();
}

const fileSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const fileTypes = input.file_types as string[] | undefined;
  const maxResults = (input.max_results as number) || 10;

  try {
    const data = await postRag({ action: 'file_search', query, file_types: fileTypes, max_results: maxResults }, ctx);
    const results = data.results || [];
    if (results.length === 0) {
      return { success: true, data: [], displayMarkdown: `No results found for "${query}" in Google File Search.` };
    }
    const lines = results.map((r: any) => `- **${r.name}** (${r.type || 'file'}) — relevance: ${r.score?.toFixed(2) || 'N/A'}`);
    return {
      success: true,
      data: results,
      displayMarkdown: `## Google File Search: "${query}"\n\n${lines.join('\n')}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'File search failed' };
  }
};

const ragRetrieve: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const corpusId = input.corpus_id as string;
  const topK = (input.similarity_top_k as number) || 5;

  try {
    const data = await postRag({ action: 'retrieve', query, corpus_id: corpusId, top_k: topK }, ctx);
    const chunks = data.chunks || [];
    if (chunks.length === 0) {
      return { success: true, data: [], displayMarkdown: `No relevant chunks found for "${query}" in corpus \`${corpusId}\`.` };
    }
    const lines = chunks.map((c: any, i: number) =>
      `### Chunk ${i + 1} (score: ${c.score?.toFixed(3) || 'N/A'})\n${c.text?.substring(0, 200)}${c.text?.length > 200 ? '...' : ''}`,
    );
    return {
      success: true,
      data: chunks,
      displayMarkdown: `## RAG Retrieval: "${query}"\n\nCorpus: \`${corpusId}\`\n\n${lines.join('\n\n')}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'RAG retrieval failed' };
  }
};

const createCorpus: KitToolHandler = async (input, ctx) => {
  const name = input.name as string;
  const description = (input.description as string) || '';
  const fileIds = (input.file_ids as string[]) || [];
  const ventureId = input.venture_id as string | undefined;

  try {
    const data = await postRag({
      action: 'create_corpus',
      name,
      description,
      file_ids: fileIds,
      venture_id: ventureId,
    }, ctx);
    return {
      success: true,
      data: data.corpus,
      displayMarkdown: `**Created RAG corpus:** "${name}"${ventureId ? ` (venture: ${ventureId})` : ''}\n\n${fileIds.length} files queued for indexing.`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Corpus creation failed' };
  }
};

const listCorpora: KitToolHandler = async (input, ctx) => {
  const ventureId = input.venture_id as string | undefined;

  try {
    const data = await postRag({ action: 'list_corpora', venture_id: ventureId }, ctx);
    const corpora = data.corpora || [];
    if (corpora.length === 0) {
      return { success: true, data: [], displayMarkdown: 'No RAG corpora found.' };
    }
    const lines = corpora.map((c: any) =>
      `- **${c.name}** — ${c.file_count} files${c.venture_id ? ` · ${c.venture_id}` : ''} · last indexed: ${c.last_indexed_at || 'never'}`,
    );
    return {
      success: true,
      data: corpora,
      displayMarkdown: `## RAG Corpora\n\n${lines.join('\n')}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'List corpora failed' };
  }
};

export const manifest: KitManifest = {
  id: 'google-rag',
  name: 'Google RAG',
  version: '1.0.0',
  description: 'Google File Search and RAG (Retrieval-Augmented Generation) for grounded AI responses using your venture documents.',
  author: 'MCV',
  capabilities: ['llm', 'network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools for document search and RAG-powered Q&A. Each venture has its own corpus. Use file_search for broad search, rag_retrieve for grounded answers from a specific corpus.',
  tools: [
    {
      name: 'google_file_search',
      description: 'Semantic search across Google Drive files using Google File Search API.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language search query' },
          file_types: { type: 'array', description: 'MIME type filters' },
          max_results: { type: 'number', description: 'Max results (default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'google_rag_retrieve',
      description: 'Retrieve relevant document chunks from a RAG corpus for grounded AI responses.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Query to retrieve relevant chunks for' },
          corpus_id: { type: 'string', description: 'RAG corpus ID to search' },
          similarity_top_k: { type: 'number', description: 'Number of top chunks to return (default 5)' },
        },
        required: ['query', 'corpus_id'],
      },
    },
    {
      name: 'google_rag_create_corpus',
      description: 'Create a new RAG corpus from selected files for grounded AI responses.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Corpus name' },
          description: { type: 'string', description: 'What this corpus contains' },
          file_ids: { type: 'array', description: 'File IDs to index into the corpus' },
          venture_id: { type: 'string', description: 'Venture this corpus belongs to' },
        },
        required: ['name'],
      },
    },
    {
      name: 'google_rag_list_corpora',
      description: 'List all RAG corpora, optionally filtered by venture.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string', description: 'Filter by venture ID' },
        },
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  google_file_search: fileSearch,
  google_rag_retrieve: ragRetrieve,
  google_rag_create_corpus: createCorpus,
  google_rag_list_corpora: listCorpora,
};
