import { requireAuth } from "./auth-middleware";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
