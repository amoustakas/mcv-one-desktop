import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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


const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '';
const NOTION_VERSION = '2022-06-28';
const NOTION_BASE = 'https://api.notion.com/v1';

function notionHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

/** Extract plain text from a Notion rich_text array */
function extractPlainText(richText: Array<{ plain_text?: string }> | undefined): string {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map((t) => t.plain_text || '').join('');
}

/** Simplify a Notion page object into a clean structure */
function simplifyPage(page: Record<string, unknown>): Record<string, unknown> {
  const properties = page.properties as Record<string, Record<string, unknown>> | undefined;
  const simplified: Record<string, string> = {};

  if (properties) {
    for (const [key, prop] of Object.entries(properties)) {
      const type = prop.type as string;
      switch (type) {
        case 'title':
          simplified[key] = extractPlainText(prop.title as Array<{ plain_text?: string }>);
          break;
        case 'rich_text':
          simplified[key] = extractPlainText(prop.rich_text as Array<{ plain_text?: string }>);
          break;
        case 'number':
          simplified[key] = String(prop.number ?? '');
          break;
        case 'select':
          simplified[key] = (prop.select as Record<string, string>)?.name || '';
          break;
        case 'multi_select':
          simplified[key] = ((prop.multi_select as Array<{ name: string }>) || []).map((s) => s.name).join(', ');
          break;
        case 'date':
          simplified[key] = (prop.date as Record<string, string>)?.start || '';
          break;
        case 'checkbox':
          simplified[key] = String(prop.checkbox);
          break;
        case 'url':
          simplified[key] = (prop.url as string) || '';
          break;
        case 'email':
          simplified[key] = (prop.email as string) || '';
          break;
        case 'phone_number':
          simplified[key] = (prop.phone_number as string) || '';
          break;
        case 'status':
          simplified[key] = (prop.status as Record<string, string>)?.name || '';
          break;
        default:
          simplified[key] = `[${type}]`;
      }
    }
  }

  return {
    id: page.id,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    archived: page.archived,
    properties: simplified,
  };
}

/** Simplify a Notion block into a clean structure */
function simplifyBlock(block: Record<string, unknown>): Record<string, unknown> {
  const type = block.type as string;
  const content = block[type] as Record<string, unknown> | undefined;

  let text = '';
  if (content?.rich_text) {
    text = extractPlainText(content.rich_text as Array<{ plain_text?: string }>);
  } else if (content?.text) {
    text = extractPlainText(content.text as Array<{ plain_text?: string }>);
  }

  return {
    id: block.id,
    type,
    text,
    hasChildren: block.has_children,
  };
}

/** Simplify a Notion database object */
function simplifyDatabase(db: Record<string, unknown>): Record<string, unknown> {
  const title = extractPlainText(db.title as Array<{ plain_text?: string }>);
  const description = extractPlainText(db.description as Array<{ plain_text?: string }>);
  const properties = db.properties as Record<string, Record<string, unknown>> | undefined;

  const fields: Record<string, string> = {};
  if (properties) {
    for (const [key, prop] of Object.entries(properties)) {
      fields[key] = prop.type as string;
    }
  }

  return {
    id: db.id,
    title,
    description,
    url: db.url,
    createdTime: db.created_time,
    lastEditedTime: db.last_edited_time,
    fields,
  };
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
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!NOTION_API_KEY) {
    return res.status(500).json({
      error: 'Notion API key not configured. Set NOTION_API_KEY or NOTION_TOKEN environment variable.',
    });
  }

  const { action } = req.body;

  try {
    switch (action) {
      // --- Search pages and databases ---
      case 'search': {
        const { query } = req.body;
        const response = await fetch(`${NOTION_BASE}/search`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({ query: query || '', page_size: 20 }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });

        const results = (data.results || []).map((item: Record<string, unknown>) => {
          if (item.object === 'page') return { type: 'page', ...simplifyPage(item) };
          if (item.object === 'database') return { type: 'database', ...simplifyDatabase(item) };
          return { type: item.object, id: item.id };
        });

        return res.json({ results, hasMore: data.has_more });
      }

      // --- Get a single page ---
      case 'get-page': {
        const { pageId } = req.body;
        if (!pageId) return res.status(400).json({ error: 'pageId is required' });

        const response = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
          method: 'GET',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });

        return res.json({ page: simplifyPage(data) });
      }

      // --- Get blocks (page content) ---
      case 'get-blocks': {
        const { blockId } = req.body;
        if (!blockId) return res.status(400).json({ error: 'blockId is required' });

        const response = await fetch(`${NOTION_BASE}/blocks/${blockId}/children?page_size=100`, {
          method: 'GET',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });

        const blocks = (data.results || []).map((block: Record<string, unknown>) => simplifyBlock(block));

        return res.json({ blocks, hasMore: data.has_more });
      }

      // --- List all databases ---
      case 'list-databases': {
        const response = await fetch(`${NOTION_BASE}/search`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({
            filter: { property: 'object', value: 'database' },
            page_size: 50,
          }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });

        const databases = (data.results || []).map((db: Record<string, unknown>) => simplifyDatabase(db));

        return res.json({ databases, hasMore: data.has_more });
      }

      // --- Create a new page ---
      case 'create-page': {
        const { parent, properties, children } = req.body;
        if (!parent) return res.status(400).json({ error: 'parent is required (database_id or page_id)' });
        const response = await fetch(`${NOTION_BASE}/pages`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({ parent, properties: properties || {}, children: children || [] }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ page: simplifyPage(data) });
      }

      // --- Update page properties ---
      case 'update-page': {
        const { pageId, properties } = req.body;
        if (!pageId) return res.status(400).json({ error: 'pageId is required' });
        if (!properties) return res.status(400).json({ error: 'properties is required' });
        const response = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
          method: 'PATCH',
          headers: notionHeaders(),
          body: JSON.stringify({ properties }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ page: simplifyPage(data) });
      }

      // --- Archive a page ---
      case 'archive-page': {
        const { pageId } = req.body;
        if (!pageId) return res.status(400).json({ error: 'pageId is required' });
        const response = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
          method: 'PATCH',
          headers: notionHeaders(),
          body: JSON.stringify({ archived: true }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ page: simplifyPage(data) });
      }

      // --- Create a database ---
      case 'create-database': {
        const { parent, title, properties } = req.body;
        if (!parent) return res.status(400).json({ error: 'parent (page_id) is required' });
        if (!title) return res.status(400).json({ error: 'title is required' });
        const response = await fetch(`${NOTION_BASE}/databases`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({
            parent,
            title: [{ type: 'text', text: { content: title } }],
            properties: properties || { Name: { title: {} } },
          }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ database: simplifyDatabase(data) });
      }

      // --- Get a database ---
      case 'get-database': {
        const { databaseId } = req.body;
        if (!databaseId) return res.status(400).json({ error: 'databaseId is required' });
        const response = await fetch(`${NOTION_BASE}/databases/${databaseId}`, {
          method: 'GET',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ database: simplifyDatabase(data) });
      }

      // --- Query a database ---
      case 'query-database': {
        const { databaseId, filter, sorts } = req.body;
        if (!databaseId) return res.status(400).json({ error: 'databaseId is required' });
        const body: Record<string, unknown> = { page_size: 50 };
        if (filter) body.filter = filter;
        if (sorts) body.sorts = sorts;
        const response = await fetch(`${NOTION_BASE}/databases/${databaseId}/query`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        const results = (data.results || []).map((item: Record<string, unknown>) => simplifyPage(item));
        return res.json({ results, hasMore: data.has_more });
      }

      // --- Get block children ---
      case 'get-block-children': {
        const { blockId } = req.body;
        if (!blockId) return res.status(400).json({ error: 'blockId is required' });
        const response = await fetch(`${NOTION_BASE}/blocks/${blockId}/children?page_size=100`, {
          method: 'GET',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        const blocks = (data.results || []).map((block: Record<string, unknown>) => simplifyBlock(block));
        return res.json({ blocks, hasMore: data.has_more });
      }

      // --- Append blocks to a page or block ---
      case 'append-blocks': {
        const { blockId, children } = req.body;
        if (!blockId) return res.status(400).json({ error: 'blockId is required' });
        if (!children || !Array.isArray(children)) return res.status(400).json({ error: 'children array is required' });
        const response = await fetch(`${NOTION_BASE}/blocks/${blockId}/children`, {
          method: 'PATCH',
          headers: notionHeaders(),
          body: JSON.stringify({ children }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        const blocks = (data.results || []).map((block: Record<string, unknown>) => simplifyBlock(block));
        return res.json({ blocks, hasMore: data.has_more });
      }

      // --- Delete a block ---
      case 'delete-block': {
        const { blockId } = req.body;
        if (!blockId) return res.status(400).json({ error: 'blockId is required' });
        const response = await fetch(`${NOTION_BASE}/blocks/${blockId}`, {
          method: 'DELETE',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ success: true, id: blockId });
      }

      // --- List users ---
      case 'list-users': {
        const response = await fetch(`${NOTION_BASE}/users`, {
          method: 'GET',
          headers: notionHeaders(),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        const users = (data.results || []).map((u: Record<string, unknown>) => ({
          id: u.id,
          name: u.name,
          type: u.type,
          avatarUrl: u.avatar_url,
        }));
        return res.json({ users });
      }

      // --- Add a comment ---
      case 'add-comment': {
        const { pageId, richText } = req.body;
        if (!pageId) return res.status(400).json({ error: 'pageId is required' });
        if (!richText) return res.status(400).json({ error: 'richText is required' });
        const response = await fetch(`${NOTION_BASE}/comments`, {
          method: 'POST',
          headers: notionHeaders(),
          body: JSON.stringify({
            parent: { page_id: pageId },
            rich_text: Array.isArray(richText)
              ? richText
              : [{ type: 'text', text: { content: String(richText) } }],
          }),
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error' });
        return res.json({ comment: { id: data.id, createdTime: data.created_time } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
