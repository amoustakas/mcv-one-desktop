import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function msApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const r = await ctx.fetch(`/api/microsoft-graph?${q}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'OneDrive error'); }
  return r.json();
}

const rootFiles: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('onedrive-root', {}, ctx);
  const items = d.value ?? [];
  const lines = items.map((f: { name: string; size: number; folder?: { childCount: number }; file?: { mimeType: string }; webUrl: string }) =>
    `- ${f.folder ? '📁' : '📄'} **${f.name}** ${f.folder ? `(${f.folder.childCount} items)` : `(${(f.size / 1024).toFixed(0)}KB)`} — [open](${f.webUrl})`);
  return { success: true, data: items, displayMarkdown: `## OneDrive Root (${items.length})\n\n${lines.join('\n')}` };
};

const browseFolder: KitToolHandler = async (input, ctx) => {
  const d = await msApi('onedrive-folder', { itemId: input.itemId }, ctx);
  const items = d.value ?? [];
  const lines = items.map((f: { name: string; size: number; folder?: { childCount: number }; webUrl: string }) =>
    `- ${f.folder ? '📁' : '📄'} **${f.name}** ${f.folder ? `(${f.folder.childCount} items)` : `(${(f.size / 1024).toFixed(0)}KB)`}`);
  return { success: true, data: items, displayMarkdown: `## Folder (${items.length})\n\n${lines.join('\n')}` };
};

const searchFiles: KitToolHandler = async (input, ctx) => {
  const d = await msApi('onedrive-search', { query: input.query, top: input.limit ?? 15 }, ctx);
  const items = d.value ?? [];
  const lines = items.map((f: { name: string; size: number; webUrl: string }) =>
    `- **${f.name}** (${(f.size / 1024).toFixed(0)}KB) — [open](${f.webUrl})`);
  return { success: true, data: items, displayMarkdown: `## Search: "${input.query}" (${items.length})\n\n${lines.join('\n')}` };
};

const recentFiles: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('onedrive-recent', {}, ctx);
  const items = d.value ?? [];
  const lines = items.map((f: { name: string; lastModifiedDateTime: string; webUrl: string }) =>
    `- **${f.name}** — ${new Date(f.lastModifiedDateTime).toLocaleDateString()} — [open](${f.webUrl})`);
  return { success: true, data: items, displayMarkdown: `## Recent Files (${items.length})\n\n${lines.join('\n')}` };
};

const storage: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('onedrive-storage', {}, ctx);
  const q = d.quota;
  return { success: true, data: q, displayMarkdown: `## OneDrive Storage\n\n- **Used:** ${((q?.used || 0) / 1e9).toFixed(2)} GB\n- **Total:** ${((q?.total || 0) / 1e9).toFixed(0)} GB\n- **Remaining:** ${((q?.remaining || 0) / 1e9).toFixed(2)} GB\n- **State:** ${q?.state || 'normal'}` };
};

export const manifest: KitManifest = {
  id: 'microsoft-onedrive', name: 'Microsoft OneDrive', version: '1.0.0',
  description: 'OneDrive — browse files, search, recent, shared, storage quota, and folder navigation.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use onedrive tools for Microsoft 365 file storage: browse, search, recent files, and storage usage.',
  tools: [
    { name: 'onedrive_root', description: 'List root OneDrive files and folders.', input_schema: { type: 'object', properties: {} } },
    { name: 'onedrive_folder', description: 'Browse a folder by item ID.', input_schema: { type: 'object', properties: { itemId: { type: 'string' } }, required: ['itemId'] } },
    { name: 'onedrive_search', description: 'Search OneDrive files.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'onedrive_recent', description: 'List recently modified files.', input_schema: { type: 'object', properties: {} } },
    { name: 'onedrive_storage', description: 'Get storage quota (used/total/remaining).', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  onedrive_root: rootFiles, onedrive_folder: browseFolder, onedrive_search: searchFiles, onedrive_recent: recentFiles, onedrive_storage: storage,
};
