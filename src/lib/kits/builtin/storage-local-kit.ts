// src/lib/kits/builtin/storage-local-kit.ts

import type { KitManifest, KitToolHandler } from '../types';
import { localList, localWrite, localDelete, localMove, localMkdir } from '../../storage/providers/local';

const listFiles: KitToolHandler = async (input, ctx) => {
  const path = (input.path as string) || '';
  const files = await localList(path, undefined, ctx);
  if (files.length === 0) {
    return { success: true, data: [], displayMarkdown: `No files at \`local://${path || '/'}\`` };
  }
  const lines = files.map(f =>
    `- ${f.isFolder ? '📁' : '📄'} **${f.name}**${f.sizeBytes ? ` (${(f.sizeBytes / 1024).toFixed(1)} KB)` : ''}`,
  );
  return { success: true, data: files, displayMarkdown: `## Local: ${path || '/'}\n\n${lines.join('\n')}` };
};

const writeFile: KitToolHandler = async (input, ctx) => {
  const path = input.path as string;
  const content = input.content as string;
  const blob = new Blob([content], { type: 'text/plain' });
  const result = await localWrite(path, blob, undefined, ctx);
  return { success: true, data: result, displayMarkdown: `Saved **${path}** to local storage` };
};

const deleteFile: KitToolHandler = async (input, ctx) => {
  const path = input.path as string;
  await localDelete(path, ctx);
  return { success: true, displayMarkdown: `Deleted **${path}** from local storage` };
};

const moveFile: KitToolHandler = async (input, ctx) => {
  const from = input.from as string;
  const to = input.to as string;
  await localMove(from, to, ctx);
  return { success: true, displayMarkdown: `Moved **${from}** → **${to}** on local storage` };
};

const createFolder: KitToolHandler = async (input, ctx) => {
  const path = input.path as string;
  await localMkdir(path, ctx);
  return { success: true, displayMarkdown: `Created folder **${path}** in local storage` };
};

export const manifest: KitManifest = {
  id: 'storage-local',
  name: 'Local Storage',
  version: '1.0.0',
  description: 'Browse, read, write, and manage files on the local filesystem (F:\\MCV-Desktop-SA).',
  author: 'MCV',
  capabilities: ['storage'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools to manage files on the local filesystem. Available only in development mode.',
  tools: [
    {
      name: 'local_list_files',
      description: 'List files and folders in a local storage path.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Directory path (relative to MCV-Desktop-SA root)' } },
      },
    },
    {
      name: 'local_write_file',
      description: 'Write a text file to local storage.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'local_delete_file',
      description: 'Delete a file or folder from local storage.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path to delete' } },
        required: ['path'],
      },
    },
    {
      name: 'local_move_file',
      description: 'Move a file within local storage.',
      input_schema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source path' },
          to: { type: 'string', description: 'Destination path' },
        },
        required: ['from', 'to'],
      },
    },
    {
      name: 'local_create_folder',
      description: 'Create a new folder in local storage.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Folder path to create' } },
        required: ['path'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  local_list_files: listFiles,
  local_write_file: writeFile,
  local_delete_file: deleteFile,
  local_move_file: moveFile,
  local_create_folder: createFolder,
};
