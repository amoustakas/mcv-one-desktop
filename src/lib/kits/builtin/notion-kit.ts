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

const notionCreatePage: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'create-page', parentId: input.parentId, title: input.title, content: input.content }, ctx);
  return { success: true, data: d, displayMarkdown: `**Page created:** ${d.title || input.title} \`${d.id}\`` };
};

const notionUpdatePage: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'update-page', pageId: input.pageId, properties: input.properties }, ctx);
  return { success: true, data: d, displayMarkdown: `**Page updated:** \`${input.pageId}\`` };
};

const notionArchivePage: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'archive-page', pageId: input.pageId }, ctx);
  return { success: true, data: d, displayMarkdown: `**Page archived:** \`${input.pageId}\`` };
};

const notionCreateDatabase: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'create-database', parentPageId: input.parentPageId, title: input.title, properties: input.properties }, ctx);
  return { success: true, data: d, displayMarkdown: `**Database created:** ${d.title || input.title} \`${d.id}\`` };
};

const notionQueryDatabase: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'query-database', databaseId: input.databaseId, filter: input.filter, sorts: input.sorts }, ctx);
  const results = d.results ?? [];
  return { success: true, data: results, displayMarkdown: `## Query Results (${results.length})\n\n${JSON.stringify(results).slice(0, 1000)}` };
};

const notionGetBlockChildren: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'get-block-children', blockId: input.blockId }, ctx);
  const blocks = d.results ?? [];
  return { success: true, data: blocks, displayMarkdown: `## Block Children (${blocks.length})\n\n${JSON.stringify(blocks).slice(0, 1000)}` };
};

const notionAppendBlocks: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'append-blocks', blockId: input.blockId, children: input.children }, ctx);
  return { success: true, data: d, displayMarkdown: `**Blocks appended to** \`${input.blockId}\`` };
};

const notionAddComment: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/notion', { action: 'add-comment', pageId: input.pageId, text: input.text }, ctx);
  return { success: true, data: d, displayMarkdown: `**Comment added to** \`${input.pageId}\`` };
};

export const manifest: KitManifest = {
  id: 'notion-connector',
  name: 'Notion Connector',
  version: '2.0.0',
  description: 'Search, create, update, and archive Notion pages and databases. Import content, query databases, manage blocks and comments.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about Notion pages, databases, blocks, comments, or wants to import/create/update content in Notion.',
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
    {
      name: 'notion_create_page',
      description: 'Create a new page in Notion under a parent page or database.',
      input_schema: {
        type: 'object',
        properties: { parentId: { type: 'string', description: 'Parent page or database ID' }, title: { type: 'string', description: 'Page title' }, content: { type: 'string', description: 'Page content (markdown)' } },
        required: ['parentId', 'title'],
      },
    },
    {
      name: 'notion_update_page',
      description: 'Update properties on an existing Notion page.',
      input_schema: {
        type: 'object',
        properties: { pageId: { type: 'string', description: 'Page ID' }, properties: { type: 'object', description: 'Properties to update' } },
        required: ['pageId', 'properties'],
      },
    },
    {
      name: 'notion_archive_page',
      description: 'Archive (soft-delete) a Notion page.',
      input_schema: {
        type: 'object',
        properties: { pageId: { type: 'string', description: 'Page ID to archive' } },
        required: ['pageId'],
      },
    },
    {
      name: 'notion_create_database',
      description: 'Create a new database in Notion under a parent page.',
      input_schema: {
        type: 'object',
        properties: { parentPageId: { type: 'string', description: 'Parent page ID' }, title: { type: 'string', description: 'Database title' }, properties: { type: 'object', description: 'Database property schema' } },
        required: ['parentPageId', 'title'],
      },
    },
    {
      name: 'notion_query_database',
      description: 'Query a Notion database with optional filters and sorts.',
      input_schema: {
        type: 'object',
        properties: { databaseId: { type: 'string', description: 'Database ID' }, filter: { type: 'object', description: 'Notion filter object' }, sorts: { type: 'array', description: 'Sort criteria' } },
        required: ['databaseId'],
      },
    },
    {
      name: 'notion_get_block_children',
      description: 'Get all child blocks of a Notion block or page.',
      input_schema: {
        type: 'object',
        properties: { blockId: { type: 'string', description: 'Block or page ID' } },
        required: ['blockId'],
      },
    },
    {
      name: 'notion_append_blocks',
      description: 'Append child blocks to a Notion block or page.',
      input_schema: {
        type: 'object',
        properties: { blockId: { type: 'string', description: 'Block or page ID' }, children: { type: 'array', description: 'Array of block objects to append' } },
        required: ['blockId', 'children'],
      },
    },
    {
      name: 'notion_add_comment',
      description: 'Add a comment to a Notion page.',
      input_schema: {
        type: 'object',
        properties: { pageId: { type: 'string', description: 'Page ID' }, text: { type: 'string', description: 'Comment text' } },
        required: ['pageId', 'text'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  notion_search: notionSearch,
  notion_list_databases: notionListDatabases,
  notion_import_page: notionImportPage,
  notion_create_page: notionCreatePage,
  notion_update_page: notionUpdatePage,
  notion_archive_page: notionArchivePage,
  notion_create_database: notionCreateDatabase,
  notion_query_database: notionQueryDatabase,
  notion_get_block_children: notionGetBlockChildren,
  notion_append_blocks: notionAppendBlocks,
  notion_add_comment: notionAddComment,
};
