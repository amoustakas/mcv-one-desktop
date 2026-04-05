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

function timeAgo(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function simplifyMime(mime: string): string {
  if (!mime) return 'file';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet';
  if (mime.includes('document') || mime.includes('word')) return 'doc';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'slides';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image')) return 'image';
  if (mime.includes('folder')) return 'folder';
  return mime.split('/').pop()?.split('.').pop() || 'file';
}

const driveSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const data = await postJson('/api/drive', { action: 'search', query }, ctx);
  const files = data.files ?? [];
  if (files.length === 0) return { success: true, data: [], displayMarkdown: `No Drive files found for "${query}".` };
  const lines = files.map(
    (f: { name: string; mimeType: string; modifiedTime?: string; id: string; webViewLink?: string }) =>
      `- **${f.name}** (${simplifyMime(f.mimeType)})${f.modifiedTime ? ' · ' + timeAgo(f.modifiedTime) : ''}${f.webViewLink ? ' · [open](' + f.webViewLink + ')' : ''}`,
  );
  return { success: true, data: files, displayMarkdown: `## Drive: ${query}\n\n${lines.join('\n')}` };
};

const driveListFiles: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/drive', { action: 'list' }, ctx);
  const files = data.files ?? [];
  if (files.length === 0) return { success: true, data: [], displayMarkdown: 'No recent Drive files.' };
  const lines = files.map(
    (f: { name: string; mimeType: string; modifiedTime?: string; id: string }) =>
      `- **${f.name}** (${simplifyMime(f.mimeType)})${f.modifiedTime ? ' · ' + timeAgo(f.modifiedTime) : ''}`,
  );
  return { success: true, data: files, displayMarkdown: `## Recent Drive Files\n\n${lines.join('\n')}` };
};

const driveImportFile: KitToolHandler = async (input, ctx) => {
  const fileId = input.file_id as string;
  // Step 1: export from Drive
  const driveData = await postJson('/api/drive', { action: 'export', fileId }, ctx);
  const title = driveData.title || driveData.name || 'Imported from Drive';
  const content = driveData.content || driveData.text || '';
  if (!content) return { success: false, error: `Could not extract content from Drive file \`${fileId}\`.` };
  // Step 2: save to doc library
  const doc = await postJson('/api/docs', {
    action: 'create',
    title,
    content,
    doc_type: 'drive-import',
  }, ctx);
  return {
    success: true,
    data: doc.document,
    displayMarkdown: `**Imported from Drive:** ${doc.document?.title || title} — ${content.length} characters`,
  };
};

export const manifest: KitManifest = {
  id: 'drive-connector',
  name: 'Google Drive Connector',
  version: '1.0.0',
  description: 'Search Google Drive files, list recent documents, and import Drive content into the document library.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about Google Drive files, wants to search Drive, or import documents from Drive.',
  tools: [
    {
      name: 'drive_search',
      description: 'Search Google Drive for files matching a query.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
    {
      name: 'drive_list_files',
      description: 'List the most recently modified files in Google Drive.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'drive_import_file',
      description: 'Import a Google Drive document into the MCV document library.',
      input_schema: {
        type: 'object',
        properties: { file_id: { type: 'string', description: 'The Google Drive file ID to import' } },
        required: ['file_id'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  drive_search: driveSearch,
  drive_list_files: driveListFiles,
  drive_import_file: driveImportFile,
};
