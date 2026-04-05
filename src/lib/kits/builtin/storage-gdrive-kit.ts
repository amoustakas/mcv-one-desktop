import type { KitManifest, KitToolHandler } from '../types';
import { gdriveList, gdriveSearch } from '../../storage/providers/gdrive';

const listFiles: KitToolHandler = async (input, ctx) => {
  const path = (input.path as string) || '';
  const files = await gdriveList(path, undefined, ctx);
  if (files.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No files found in Google Drive.' };
  }
  const lines = files.map(f =>
    `- ${f.isFolder ? '📁' : '📄'} **${f.name}** (${f.mimeType?.split('.').pop() || 'file'})`,
  );
  return { success: true, data: files, displayMarkdown: `## Google Drive\n\n${lines.join('\n')}` };
};

const searchFiles: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const files = await gdriveSearch(query, ctx);
  if (files.length === 0) {
    return { success: true, data: [], displayMarkdown: `No Drive files found for "${query}".` };
  }
  const lines = files.map(f => `- **${f.name}**`);
  return { success: true, data: files, displayMarkdown: `## Drive: ${query}\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'storage-gdrive',
  name: 'Google Drive Storage',
  version: '1.0.0',
  description: 'Browse and search files on Google Drive.',
  author: 'MCV',
  capabilities: ['storage', 'network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools to browse and search Google Drive files.',
  tools: [
    {
      name: 'gdrive_list_files',
      description: 'List files in Google Drive.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Folder ID or empty for root' } },
      },
    },
    {
      name: 'gdrive_search_files',
      description: 'Search Google Drive for files.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gdrive_list_files: listFiles,
  gdrive_search_files: searchFiles,
};
