import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

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

const notionSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const data = await postJson('/api/notion', { action: 'search', query }, ctx);
  const results = data.results ?? [];
  if (results.length === 0) return { success: true, data: [], displayMarkdown: `No Notion results for "${query}".` };
  const lines = results.map(
    (r: { title: string; type: string; url?: string; id: string }) =>
      `- **${r.title || 'Untitled'}** (${r.type || 'page'})${r.url ? ' · [open](' + r.url + ')' : ''} \`${r.id.slice(0, 8)}\``,
  );
  return { success: true, data: results, displayMarkdown: `## Notion: ${query}\n\n${lines.join('\n')}` };
};

const notionListDatabases: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/notion', { action: 'list-databases' }, ctx);
  const dbs = data.databases ?? [];
  if (dbs.length === 0) return { success: true, data: [], displayMarkdown: 'No Notion databases found.' };
  const lines = dbs.map(
    (db: { title: string; id: string; url?: string }) =>
      `- **${db.title || 'Untitled'}** \`${db.id.slice(0, 8)}\`${db.url ? ' · [open](' + db.url + ')' : ''}`,
  );
  return { success: true, data: dbs, displayMarkdown: `## Notion Databases\n\n${lines.join('\n')}` };
};

const notionImportPage: KitToolHandler = async (input, ctx) => {
  const pageId = input.page_id as string;
  // Step 1: fetch Notion page content
  const pageData = await postJson('/api/notion', { action: 'get-page', pageId }, ctx);
  const title = pageData.title || 'Imported from Notion';
  const content = pageData.content || pageData.markdown || '';
  if (!content) return { success: false, error: `Could not extract content from Notion page \`${pageId}\`.` };
  // Step 2: save as a doc in the document library
  const doc = await postJson('/api/docs', {
    action: 'create',
    title,
    content,
    doc_type: 'notion-import',
  }, ctx);
  return {
    success: true,
    data: doc.document,
    displayMarkdown: `**Imported from Notion:** ${doc.document?.title || title} — ${content.length} characters`,
  };
};

export const manifest: KitManifest = {
  id: 'notion-connector',
  name: 'Notion Connector',
  version: '1.0.0',
  description: 'Search Notion pages, list databases, and import Notion content into the document library.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about Notion pages, databases, or wants to import content from Notion.',
  tools: [
    {
      name: 'notion_search',
      description: 'Search Notion pages and databases by query.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
    {
      name: 'notion_list_databases',
      description: 'List all Notion databases accessible to the integration.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'notion_import_page',
      description: 'Import a Notion page into the MCV document library.',
      input_schema: {
        type: 'object',
        properties: { page_id: { type: 'string', description: 'The Notion page ID to import' } },
        required: ['page_id'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  notion_search: notionSearch,
  notion_list_databases: notionListDatabases,
  notion_import_page: notionImportPage,
};
