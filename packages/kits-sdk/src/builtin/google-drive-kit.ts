import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function driveApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const r = await ctx.fetch(`/api/google-drive?${q}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Drive error'); }
  return r.json();
}

const searchFiles: KitToolHandler = async (input, ctx) => {
  const d = await driveApi('search', { query: input.query, pageSize: input.limit ?? 10 }, ctx);
  const files = d.files ?? [];
  const lines = files.map((f: { name: string; mimeType: string; webViewLink: string; modifiedTime: string }) =>
    `- **${f.name}** (${f.mimeType.split('.').pop()}) — [open](${f.webViewLink}) — ${new Date(f.modifiedTime).toLocaleDateString()}`);
  return { success: true, data: files, displayMarkdown: `## Drive Search: "${input.query}" (${files.length})\n\n${lines.join('\n')}` };
};

const listRecent: KitToolHandler = async (_i, ctx) => {
  const d = await driveApi('list-recent', {}, ctx);
  const files = d.files ?? [];
  const lines = files.map((f: { name: string; mimeType: string; modifiedTime: string }) =>
    `- **${f.name}** (${f.mimeType.split('.').pop()}) — ${new Date(f.modifiedTime).toLocaleDateString()}`);
  return { success: true, data: files, displayMarkdown: `## Recent Files (${files.length})\n\n${lines.join('\n')}` };
};

const getStorage: KitToolHandler = async (_i, ctx) => {
  const d = await driveApi('get-storage', {}, ctx);
  const q = d.storageQuota;
  return { success: true, data: d, displayMarkdown: `## Drive Storage\n\n- **Used:** ${(Number(q?.usage) / 1e9).toFixed(2)} GB\n- **Limit:** ${q?.limit ? (Number(q.limit) / 1e9).toFixed(0) + ' GB' : 'Unlimited'}\n- **User:** ${d.user?.displayName}` };
};

const exportFile: KitToolHandler = async (input, ctx) => {
  const d = await driveApi('export-file', { fileId: input.fileId, mimeType: input.format ?? 'text/plain' }, ctx);
  return { success: true, data: d, displayMarkdown: `## Exported File\n\n${(d.content || '').slice(0, 3000)}` };
};

const driveOverview: KitToolHandler = async (_i, ctx) => {
  const d = await driveApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Drive Overview\n\n- **User:** ${d.user} (${d.email})\n- **Storage:** ${d.storage_used_gb} / ${d.storage_limit_gb} GB\n- **Recent:** ${d.recent_files?.join(', ') || 'none'}` };
};

export const manifest: KitManifest = {
  id: 'google-drive-files', name: 'Google Drive', version: '1.0.0',
  description: 'Google Drive — search files, recent documents, storage, starred, shared, and file export.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use drive tools for file search, recent documents, storage info, and exporting Google Docs.',
  tools: [
    { name: 'gdrive_search', description: 'Search Google Drive files.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'gdrive_recent', description: 'List recently modified files.', input_schema: { type: 'object', properties: {} } },
    { name: 'gdrive_storage', description: 'Get storage usage.', input_schema: { type: 'object', properties: {} } },
    { name: 'gdrive_export', description: 'Export a Google Doc/Sheet as text.', input_schema: { type: 'object', properties: { fileId: { type: 'string' }, format: { type: 'string', description: 'text/plain, text/csv, application/pdf' } }, required: ['fileId'] } },
    { name: 'gdrive_overview', description: 'Drive summary: user, storage, recent files.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gdrive_search: searchFiles, gdrive_recent: listRecent, gdrive_storage: getStorage, gdrive_export: exportFile, gdrive_overview: driveOverview,
};
