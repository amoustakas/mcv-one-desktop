// Notion to Markdown translator.
//
// Pure-function layer extracted from scripts/import-notion-bdt.ts so it can
// be reused by in-app Notion kit tools and covered by unit tests without
// pulling in the Supabase client or running the CLI.
//
// The translator is intentionally narrow: it covers the block types we see
// in the Business Documents Tracker layout. Unknown types degrade gracefully
// to their plain-text content so templates never lose data silently.

export interface NotionRichText {
  plain_text?: string;
  text?: { content?: string };
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
}

export type FetchChildren = (blockId: string) => Promise<NotionBlock[]>;

export function richTextToPlain(rt?: NotionRichText[]): string {
  if (!rt?.length) return '';
  return rt.map(t => t.plain_text || t.text?.content || '').join('');
}

export function slug(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function extractVariables(markdown: string): string[] {
  const seen = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(markdown))) seen.add(m[1]);
  return [...seen].sort();
}

const MAX_DEPTH = 3;

export async function translateBlocksToMarkdown(
  blocks: NotionBlock[],
  fetchChildren: FetchChildren,
  depth = 0,
): Promise<string> {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  for (const b of blocks) {
    const type = b.type;
    const payload = (b as Record<string, { rich_text?: NotionRichText[]; language?: string }>)[type] || {};
    const text = richTextToPlain(payload.rich_text);

    switch (type) {
      case 'heading_1': lines.push(`${indent}# ${text}`); break;
      case 'heading_2': lines.push(`${indent}## ${text}`); break;
      case 'heading_3': lines.push(`${indent}### ${text}`); break;
      case 'paragraph': if (text) lines.push(`${indent}${text}`); break;
      case 'bulleted_list_item': lines.push(`${indent}- ${text}`); break;
      case 'numbered_list_item': lines.push(`${indent}1. ${text}`); break;
      case 'to_do': lines.push(`${indent}- [ ] ${text}`); break;
      case 'quote': lines.push(`${indent}> ${text}`); break;
      case 'code': lines.push(`${indent}\`\`\`${payload.language || ''}\n${text}\n${indent}\`\`\``); break;
      case 'divider': lines.push('---'); break;
      case 'callout': if (text) lines.push(`${indent}> **Note:** ${text}`); break;
      default:
        if (text) lines.push(`${indent}${text}`);
    }

    if (b.has_children && depth < MAX_DEPTH) {
      const kids = await fetchChildren(b.id);
      const nested = await translateBlocksToMarkdown(kids, fetchChildren, depth + 1);
      if (nested) lines.push(nested);
    }
    lines.push('');
  }

  // Collapse excessive blank lines but preserve leading indentation produced
  // by recursion at depth > 0. A full .trim() would strip the indent on
  // nested bullets when this call returns into a parent level.
  const joined = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
  return depth === 0 ? joined.trimStart() : joined;
}
