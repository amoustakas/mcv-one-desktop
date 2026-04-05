import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function sheetsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/google-sheets?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Sheets error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/google-sheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Sheets error'); }
  return r.json();
}

const readRange: KitToolHandler = async (input, ctx) => {
  const d = await sheetsApi('read-range', { spreadsheetId: input.spreadsheetId, range: input.range }, ctx);
  const rows = d.values ?? [];
  if (rows.length === 0) return { success: true, data: [], displayMarkdown: 'No data in range.' };
  // Format as markdown table
  const header = rows[0].map((h: string) => `**${h}**`).join(' | ');
  const sep = rows[0].map(() => '---').join(' | ');
  const body = rows.slice(1).map((r: string[]) => r.join(' | ')).join('\n');
  return { success: true, data: rows, displayMarkdown: `## ${input.range}\n\n${header}\n${sep}\n${body}` };
};

const writeRange: KitToolHandler = async (input, ctx) => {
  const d = await sheetsApi('write-range', { spreadsheetId: input.spreadsheetId, range: input.range, values: input.values }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Wrote ${d.updatedCells || '?'} cells to ${input.range}` };
};

const appendRows: KitToolHandler = async (input, ctx) => {
  const d = await sheetsApi('append-rows', { spreadsheetId: input.spreadsheetId, range: input.range, values: input.values }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Appended ${(input.values as unknown[][])?.length || '?'} rows to ${input.range}` };
};

const createSpreadsheet: KitToolHandler = async (input, ctx) => {
  const d = await sheetsApi('create-spreadsheet', { title: input.title, sheets: input.sheets }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Spreadsheet created: **${d.properties?.title}** — [open](https://docs.google.com/spreadsheets/d/${d.spreadsheetId})` };
};

export const manifest: KitManifest = {
  id: 'google-sheets', name: 'Google Sheets', version: '1.0.0',
  description: 'Google Sheets — read, write, append, create spreadsheets.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use sheets tools for reading/writing spreadsheet data, creating new sheets, and appending rows.',
  tools: [
    { name: 'gsheets_read', description: 'Read data from a spreadsheet range.', input_schema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string', description: 'e.g. Sheet1!A1:D10' } }, required: ['spreadsheetId', 'range'] } },
    { name: 'gsheets_write', description: 'Write data to a spreadsheet range.', input_schema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array', description: '2D array of values' } }, required: ['spreadsheetId', 'range', 'values'] } },
    { name: 'gsheets_append', description: 'Append rows to a spreadsheet.', input_schema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array', description: '2D array of rows to append' } }, required: ['spreadsheetId', 'range', 'values'] } },
    { name: 'gsheets_create', description: 'Create a new spreadsheet.', input_schema: { type: 'object', properties: { title: { type: 'string' }, sheets: { type: 'array', description: 'Array of sheet names' } }, required: ['title'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gsheets_read: readRange, gsheets_write: writeRange, gsheets_append: appendRows, gsheets_create: createSpreadsheet,
};
