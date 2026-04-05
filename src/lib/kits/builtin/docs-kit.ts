import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const listDocuments: KitToolHandler = async (input, ctx) => {
  const ventureId = (input.venture as string) || undefined;
  const data = await postJson('/api/docs', {
    action: 'list',
    venture_id: ventureId,
  }, ctx);

  const docs = data.documents || [];
  if (docs.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No documents found.' };
  }

  const lines = docs.map(
    (d: { title: string; doc_type: string; venture_id: string; id: string }) =>
      `- **${d.title}** (${d.doc_type}) — ${d.venture_id || 'global'} \`${d.id.slice(0, 8)}\``,
  );
  return {
    success: true,
    data: docs,
    displayMarkdown: `## Documents\n\n${lines.join('\n')}`,
  };
};

const queryDocuments: KitToolHandler = async (input, ctx) => {
  const question = input.question as string;
  if (!question) {
    return { success: false, error: 'A question is required.' };
  }

  const data = await postJson('/api/docs', { action: 'query', question }, ctx);

  let md = `## Answer\n\n${data.answer || 'No answer available.'}`;
  if (data.sources?.length) {
    md += `\n\n**Sources:** ${data.sources.map((s: { title: string }) => s.title).join(', ')}`;
  }
  return { success: true, data, displayMarkdown: md };
};

const createNote: KitToolHandler = async (input, ctx) => {
  const title = input.title as string;
  const content = (input.content as string) || title;
  const venture = (input.venture as string) || undefined;

  const data = await postJson('/api/docs', {
    action: 'create',
    title,
    content,
    doc_type: 'note',
    venture_id: venture,
  }, ctx);

  const doc = data.document;
  return {
    success: true,
    data: doc,
    displayMarkdown: `**Note Saved:** ${doc?.title || title}${doc?.id ? ' `' + doc.id.slice(0, 8) + '`' : ''}`,
  };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'docs-intelligence',
  name: 'Document Intelligence',
  version: '1.0.0',
  description: 'List, query, and create documents in the document library. Uses Gemini RAG for intelligent document Q&A.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about documents, wants to search their document library, ask questions about stored content, or save notes.',
  tools: [
    {
      name: 'list_documents',
      description: 'List documents in the library, optionally filtered by venture.',
      input_schema: {
        type: 'object',
        properties: {
          venture: { type: 'string', description: 'Filter by venture slug' },
        },
      },
    },
    {
      name: 'query_documents',
      description: 'Ask a question against the document library using Gemini RAG. Returns an AI-generated answer with source citations.',
      input_schema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to ask about stored documents' },
        },
        required: ['question'],
      },
    },
    {
      name: 'create_note',
      description: 'Save a new note/document to the document library.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          content: { type: 'string', description: 'Note content (markdown supported)' },
          venture: { type: 'string', description: 'Venture slug to scope the note to' },
        },
        required: ['title'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_documents: listDocuments,
  query_documents: queryDocuments,
  create_note: createNote,
};
