/**
 * Import the Notion "Business Documents Tracker" into Supabase doc_templates.
 *
 * Idempotent: each row id is derived from department + slug(title), so
 * re-running updates via upsert instead of duplicating. Dry-run by default;
 * pass --commit to actually write to Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-notion-bdt.ts
 *   npx tsx scripts/import-notion-bdt.ts --commit
 *   npx tsx scripts/import-notion-bdt.ts --department legal --commit
 *
 * Env:
 *   NOTION_TOKEN, NOTION_BDT_DATABASE_ID
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY (for --commit)
 *
 * Expected BDT schema: Name (title), Department (select/multi_select:
 * legal|compliance|research|finance|ops|product), Description (rich_text),
 * optional Source (select), Status (select: rows with 'archived' are skipped).
 */
import { createClient } from '@supabase/supabase-js';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

type Department = 'legal' | 'compliance' | 'research' | 'finance' | 'ops' | 'product';
const VALID_DEPTS: Department[] = ['legal', 'compliance', 'research', 'finance', 'ops', 'product'];

type NotionRichText = { plain_text?: string; text?: { content?: string } };
type NotionPage = {
  id: string;
  properties: Record<string, {
    type: string;
    title?: NotionRichText[];
    rich_text?: NotionRichText[];
    select?: { name: string } | null;
    multi_select?: Array<{ name: string }>;
  }>;
};
type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

type TemplateRow = {
  id: string;
  department: Department;
  title: string;
  description: string | null;
  body_markdown: string;
  variables: string[];
  source: string;
  version: number;
};

function parseArgs(argv: string[]) {
  const args = { commit: false, department: null as Department | null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') args.commit = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--department') {
      const next = argv[++i];
      if (!VALID_DEPTS.includes(next as Department)) {
        throw new Error(`--department must be one of: ${VALID_DEPTS.join(', ')}`);
      }
      args.department = next as Department;
    }
  }
  return args;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

async function notion<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN not set');
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Notion ${path} failed: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function queryDatabase(databaseId: string): Promise<NotionPage[]> {
  const all: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const page = await notion<{ results: NotionPage[]; next_cursor: string | null; has_more: boolean }>(
      `/databases/${databaseId}/query`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    all.push(...page.results);
    cursor = page.has_more ? page.next_cursor || undefined : undefined;
  } while (cursor);
  return all;
}

async function fetchBlockChildren(blockId: string): Promise<NotionBlock[]> {
  const all: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const qs = cursor ? `?start_cursor=${cursor}` : '';
    const page = await notion<{ results: NotionBlock[]; next_cursor: string | null; has_more: boolean }>(
      `/blocks/${blockId}/children${qs}`,
    );
    all.push(...page.results);
    cursor = page.has_more ? page.next_cursor || undefined : undefined;
  } while (cursor);
  return all;
}

function richTextToPlain(rt?: NotionRichText[]): string {
  if (!rt?.length) return '';
  return rt.map(t => t.plain_text || t.text?.content || '').join('');
}

function extractProp(page: NotionPage, propName: string, kind: 'title' | 'rich_text' | 'select' | 'multi_select'): string | null {
  for (const [name, prop] of Object.entries(page.properties)) {
    if (name.toLowerCase() !== propName.toLowerCase()) continue;
    if (kind === 'title') return richTextToPlain(prop.title).trim() || null;
    if (kind === 'rich_text') return richTextToPlain(prop.rich_text).trim() || null;
    if (kind === 'select') return prop.select?.name?.trim().toLowerCase() || null;
    if (kind === 'multi_select') {
      const first = prop.multi_select?.[0]?.name?.trim().toLowerCase();
      return first || null;
    }
  }
  return null;
}

async function translateBlocksToMarkdown(blocks: NotionBlock[], depth = 0): Promise<string> {
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

    if (b.has_children && depth < 3) {
      const kids = await fetchBlockChildren(b.id);
      const nested = await translateBlocksToMarkdown(kids, depth + 1);
      if (nested) lines.push(nested);
    }
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractVariables(markdown: string): string[] {
  const seen = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(markdown))) seen.add(m[1]);
  return [...seen].sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseId = process.env.NOTION_BDT_DATABASE_ID;
  if (!databaseId) throw new Error('NOTION_BDT_DATABASE_ID not set');

  console.log(`Fetching BDT database ${databaseId}...`);
  const pages = await queryDatabase(databaseId);
  console.log(`  found ${pages.length} rows`);

  const rows: TemplateRow[] = [];
  const skipped: Array<{ page: string; reason: string }> = [];

  for (const page of pages) {
    const title = extractProp(page, 'Name', 'title') ?? extractProp(page, 'Title', 'title');
    const deptRaw = extractProp(page, 'Department', 'select') ?? extractProp(page, 'Department', 'multi_select');
    const description = extractProp(page, 'Description', 'rich_text');
    const source = extractProp(page, 'Source', 'select') || 'notion';
    const status = extractProp(page, 'Status', 'select');

    if (!title) { skipped.push({ page: page.id, reason: 'no title' }); continue; }
    if (status === 'archived') { skipped.push({ page: page.id, reason: `archived: ${title}` }); continue; }
    if (!deptRaw || !VALID_DEPTS.includes(deptRaw as Department)) {
      skipped.push({ page: page.id, reason: `unknown department "${deptRaw}" on: ${title}` });
      continue;
    }
    const department = deptRaw as Department;
    if (args.department && department !== args.department) continue;

    if (args.verbose) console.log(`  fetching body for: ${title}`);
    const blocks = await fetchBlockChildren(page.id);
    const body_markdown = await translateBlocksToMarkdown(blocks);

    rows.push({
      id: `${department}.${slug(title)}`,
      department,
      title,
      description,
      body_markdown,
      variables: extractVariables(body_markdown),
      source,
      version: 1,
    });
  }

  console.log(`\nImport plan (${rows.length} templates):`);
  const byDept: Record<string, number> = {};
  for (const r of rows) byDept[r.department] = (byDept[r.department] || 0) + 1;
  for (const [d, n] of Object.entries(byDept)) console.log(`  ${d.padEnd(12)} ${n}`);
  if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} rows:`);
    for (const s of skipped.slice(0, 20)) console.log(`  ${s.reason}`);
    if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
  }

  if (!args.commit) {
    console.log('\nDry-run mode. Re-run with --commit to write to Supabase.');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase env not set - need SUPABASE_URL + SUPABASE_SERVICE_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\nUpserting ${rows.length} rows to doc_templates...`);
  const { error } = await supabase.from('doc_templates').upsert(
    rows.map(r => ({
      id: r.id,
      department: r.department,
      title: r.title,
      description: r.description,
      body_markdown: r.body_markdown,
      variables: r.variables,
      source: r.source,
      version: r.version,
    })),
    { onConflict: 'id' },
  );
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  console.log(`Imported ${rows.length} templates.`);
}

main().catch(e => {
  console.error(`\nERROR: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
