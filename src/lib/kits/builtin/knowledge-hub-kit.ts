import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Knowledge Hub Kit
// Unified cross-system search + retrieval across:
//   - Memory (project_memory, session_events)
//   - Documents (documents table)
//   - Files (storage_files + AI summaries)
//   - RAG (google_rag corpora)
//   - Google Drive (live search)
//
// All tools respect venture_id for compartmentalization.
// ---------------------------------------------------------------------------

async function postJson(path: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `${path} error` }));
    throw new Error(err.error || `${path}: ${res.status}`);
  }
  return res.json();
}

async function getJson(path: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
  ).toString();
  const res = await ctx.fetch(`${path}${qs ? '?' + qs : ''}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `${path} error` }));
    throw new Error(err.error || `${path}: ${res.status}`);
  }
  return res.json();
}

// ─── Unified search across all knowledge systems ──────────────────
const unifiedSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const ventureId = (input.venture_id as string) || ctx.ventureId;
  const limit = (input.limit as number) || 5;
  if (!query) return { success: false, error: 'query is required' };

  const md: string[] = [`## Knowledge Search: "${query}"\n`];
  if (ventureId && ventureId !== '*') md.push(`*Scope: ${ventureId}*\n`);

  // Query all systems in parallel
  const [memoryRes, docsRes, filesRes, ragRes, driveRes] = await Promise.allSettled([
    // Memory search
    getJson('/api/memory', { action: 'list', q: query, ventureId, limit }, ctx).catch(() => null),
    // Documents
    postJson('/api/docs', { action: 'query', question: query, venture_id: ventureId, limit }, ctx).catch(() => null),
    // Files (semantic via AI pipeline)
    postJson('/api/docs', { action: 'list', venture_id: ventureId, q: query, limit }, ctx).catch(() => null),
    // RAG grounding search
    postJson('/api/google-rag', { action: 'file_search', query, venture_id: ventureId }, ctx).catch(() => null),
    // Google Drive live search
    getJson('/api/google-drive', { action: 'search', q: query, maxResults: limit }, ctx).catch(() => null),
  ]);

  const results: Record<string, unknown[]> = {};

  // Memory results
  if (memoryRes.status === 'fulfilled' && memoryRes.value) {
    const memories = memoryRes.value.memories || memoryRes.value.items || [];
    if (memories.length > 0) {
      results.memories = memories;
      md.push(`### Memory (${memories.length})`);
      for (const m of memories.slice(0, 3)) {
        md.push(`- **${m.key}**: ${JSON.stringify(m.value).slice(0, 100)}`);
      }
      md.push('');
    }
  }

  // Documents — returns answer + sources
  if (docsRes.status === 'fulfilled' && docsRes.value) {
    const answer = docsRes.value.answer;
    const sources = docsRes.value.sources || [];
    if (answer) {
      results.documents = [{ answer, sources }];
      md.push('### Documents — AI Answer');
      md.push(answer.slice(0, 300));
      if (sources.length > 0) {
        md.push(`\n*Sources: ${sources.map((s: { title: string }) => s.title).slice(0, 3).join(', ')}*`);
      }
      md.push('');
    }
  }

  // Files
  if (filesRes.status === 'fulfilled' && filesRes.value) {
    const docs = filesRes.value.documents || filesRes.value.files || [];
    if (docs.length > 0) {
      results.files = docs;
      md.push(`### Files (${docs.length})`);
      for (const d of docs.slice(0, 3)) {
        md.push(`- **${d.title || d.name}** (${d.doc_type || d.type || 'file'})`);
      }
      md.push('');
    }
  }

  // RAG grounding
  if (ragRes.status === 'fulfilled' && ragRes.value) {
    const sources = ragRes.value.sources || [];
    if (sources.length > 0) {
      results.rag = sources;
      md.push(`### RAG Sources (${sources.length})`);
      for (const s of sources.slice(0, 3)) {
        md.push(`- **${s.name || s.title}** — ${s.uri || s.url || ''}`);
      }
      md.push('');
    }
  }

  // Drive
  if (driveRes.status === 'fulfilled' && driveRes.value) {
    const files = driveRes.value.files || [];
    if (files.length > 0) {
      results.drive = files;
      md.push(`### Google Drive (${files.length})`);
      for (const f of files.slice(0, 3)) {
        md.push(`- **${f.name}** — ${f.mimeType?.split('.').pop() || 'file'}`);
      }
      md.push('');
    }
  }

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  if (totalResults === 0) {
    md.push('No results found across Memory, Documents, Files, RAG, or Drive.');
  } else {
    md.push(`\n*Total: ${totalResults} results across ${Object.keys(results).length} systems*`);
  }

  return { success: true, data: results, displayMarkdown: md.join('\n') };
};

// ─── Ingest content to knowledge base ─────────────────────────────
const ingestToKnowledge: KitToolHandler = async (input, ctx) => {
  const title = input.title as string;
  const content = input.content as string;
  const type = (input.type as string) || 'note';
  const ventureId = (input.venture_id as string) || ctx.ventureId;
  const target = (input.target as string) || 'document'; // 'memory' | 'document' | 'rag'

  if (!title || !content) return { success: false, error: 'title and content required' };

  const md: string[] = [`## Ingested to ${target}\n`];

  if (target === 'memory') {
    await postJson('/api/memory', {
      action: 'upsert',
      key: title.toLowerCase().replace(/\s+/g, '-'),
      value: content,
      type: 'project',
      venture_id: ventureId,
    }, ctx);
    md.push(`Saved as memory key: \`${title.toLowerCase().replace(/\s+/g, '-')}\``);
  } else if (target === 'rag') {
    await postJson('/api/google-rag', {
      action: 'create_corpus',
      name: title,
      description: content.slice(0, 200),
      venture_id: ventureId,
    }, ctx);
    md.push(`Created RAG corpus: **${title}**`);
  } else {
    // Default: document
    await postJson('/api/docs', {
      action: 'create',
      title,
      content,
      doc_type: type,
      venture_id: ventureId,
    }, ctx);
    md.push(`Created document: **${title}** (${type})`);
  }

  md.push(`\n*Venture scope: ${ventureId || 'global'}*`);
  return { success: true, data: null, displayMarkdown: md.join('\n') };
};

// ─── Summarize venture knowledge state ────────────────────────────
const ventureKnowledgeSummary: KitToolHandler = async (input, ctx) => {
  const ventureId = (input.venture_id as string) || ctx.ventureId;
  const md: string[] = [`## Knowledge State — ${ventureId || 'Global'}\n`];

  const [docsRes, memoryRes, corporaRes, filesRes] = await Promise.allSettled([
    getJson('/api/docs', { action: 'list', venture_id: ventureId }, ctx).catch(() => null),
    getJson('/api/memory', { action: 'list', ventureId }, ctx).catch(() => null),
    postJson('/api/google-rag', { action: 'list_corpora', venture_id: ventureId }, ctx).catch(() => null),
    getJson('/api/docs', { action: 'list', venture_id: ventureId }, ctx).catch(() => null),
  ]);

  const docCount = docsRes.status === 'fulfilled' && docsRes.value ? (docsRes.value.documents?.length || 0) : 0;
  const memCount = memoryRes.status === 'fulfilled' && memoryRes.value ? (memoryRes.value.memories?.length || 0) : 0;
  const corpusCount = corporaRes.status === 'fulfilled' && corporaRes.value ? (corporaRes.value.corpora?.length || 0) : 0;
  const fileCount = filesRes.status === 'fulfilled' && filesRes.value ? (filesRes.value.documents?.length || 0) : 0;

  md.push(`- **Documents:** ${docCount}`);
  md.push(`- **Memories:** ${memCount}`);
  md.push(`- **RAG Corpora:** ${corpusCount}`);
  md.push(`- **Files:** ${fileCount}`);
  md.push(`\n**Total knowledge items: ${docCount + memCount + corpusCount + fileCount}**`);

  return {
    success: true,
    data: { docs: docCount, memories: memCount, corpora: corpusCount, files: fileCount, ventureId },
    displayMarkdown: md.join('\n'),
  };
};

// ─── Remember — shortcut to save an insight/fact ──────────────────
const rememberFact: KitToolHandler = async (input, ctx) => {
  const fact = input.fact as string;
  const key = (input.key as string) || fact.slice(0, 60).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const ventureId = (input.venture_id as string) || ctx.ventureId;

  if (!fact) return { success: false, error: 'fact required' };

  await postJson('/api/memory', {
    action: 'upsert',
    key,
    value: { fact, remembered_at: new Date().toISOString() },
    type: 'reference',
    venture_id: ventureId,
  }, ctx);

  return {
    success: true,
    data: { key, fact },
    displayMarkdown: `Remembered: **${key}** → "${fact.slice(0, 100)}${fact.length > 100 ? '...' : ''}"`,
  };
};

export const manifest: KitManifest = {
  id: 'knowledge-hub',
  name: 'Knowledge Hub',
  version: '1.0.0',
  description: 'Unified cross-system search and ingestion across Memory, Documents, Files, RAG, and Google Drive. All operations respect venture compartmentalization.',
  author: 'MCV',
  capabilities: ['network', 'supabase', 'storage', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use knowledge_search for any cross-system search — it queries Memory, Documents, Files, RAG, and Drive in parallel and unifies results. Use knowledge_ingest to save content to the appropriate system (defaults to document). Use knowledge_remember for quick factoid saves. Use knowledge_venture_summary to see the full knowledge state for a venture.`,
  tools: [
    {
      name: 'knowledge_search',
      description: 'Search across ALL knowledge systems in parallel: Memory, Documents, Files, RAG, and Google Drive. Respects venture scope.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          venture_id: { type: 'string', description: 'Venture to scope to (optional, uses current venture context)' },
          limit: { type: 'number', description: 'Results per system (default: 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'knowledge_ingest',
      description: 'Save content to the knowledge base. Auto-routes to Memory (for short facts), Documents (for notes), or RAG (for large corpora).',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          type: { type: 'string', description: 'Doc type: note | architecture | technical-spec | status-report | research' },
          target: { type: 'string', description: 'memory | document | rag (default: document)' },
          venture_id: { type: 'string' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'knowledge_remember',
      description: 'Remember a fact or insight. Quick save to Memory with auto-generated key.',
      input_schema: {
        type: 'object',
        properties: {
          fact: { type: 'string', description: 'The fact/insight to remember' },
          key: { type: 'string', description: 'Optional key (auto-generated if omitted)' },
          venture_id: { type: 'string' },
        },
        required: ['fact'],
      },
    },
    {
      name: 'knowledge_venture_summary',
      description: 'Summarize the complete knowledge state for a venture: docs, memories, RAG corpora, files.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string', description: 'Venture ID (optional, uses current venture)' },
        },
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  knowledge_search: unifiedSearch,
  knowledge_ingest: ingestToKnowledge,
  knowledge_remember: rememberFact,
  knowledge_venture_summary: ventureKnowledgeSummary,
};
