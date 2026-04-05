// src/lib/kits/builtin/storage-supabase-kit.ts

import type { KitManifest, KitToolHandler } from '../types';
import { supabaseList, supabaseWrite, supabaseDelete, supabaseMove, supabaseCopy } from '../../storage/providers/supabase';

const listFiles: KitToolHandler = async (input, ctx) => {
  const path = (input.path as string) || '';
  const files = await supabaseList(path, undefined, ctx);
  if (files.length === 0) {
    return { success: true, data: [], displayMarkdown: `No files found at \`supabase://${path || '/'}\`` };
  }
  const lines = files.map(f =>
    `- ${f.isFolder ? '📁' : '📄'} **${f.name}**${f.sizeBytes ? ` (${formatBytes(f.sizeBytes)})` : ''}`,
  );
  return {
    success: true,
    data: files,
    displayMarkdown: `## Supabase: ${path || '/'}\n\n${lines.join('\n')}`,
  };
};

const uploadFile: KitToolHandler = async (input, ctx) => {
  const path = input.path as string;
  const content = input.content as string;
  const mimeType = (input.mime_type as string) || 'text/plain';
  const blob = new Blob([content], { type: mimeType });
  const result = await supabaseWrite(path, blob, { mimeType }, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `Uploaded **${path}** to Supabase (${formatBytes(result.size)})`,
  };
};

const deleteFile: KitToolHandler = async (input, ctx) => {
  const path = input.path as string;
  await supabaseDelete(path, ctx);
  return { success: true, displayMarkdown: `Deleted **${path}** from Supabase` };
};

const moveFile: KitToolHandler = async (input, ctx) => {
  const from = input.from as string;
  const to = input.to as string;
  await supabaseMove(from, to, ctx);
  return { success: true, displayMarkdown: `Moved **${from}** → **${to}** on Supabase` };
};

const copyFile: KitToolHandler = async (input, ctx) => {
  const from = input.from as string;
  const to = input.to as string;
  await supabaseCopy(from, to, ctx);
  return { success: true, displayMarkdown: `Copied **${from}** → **${to}** on Supabase` };
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const manifest: KitManifest = {
  id: 'storage-supabase',
  name: 'Supabase Storage',
  version: '1.0.0',
  description: 'Browse, upload, download, move, and delete files on Supabase Storage.',
  author: 'MCV',
  capabilities: ['storage', 'network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools to manage files stored in Supabase Storage. Default cloud storage provider.',
  tools: [
    {
      name: 'supabase_list_files',
      description: 'List files and folders in a Supabase Storage path.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Storage path to list (empty for root)' },
        },
      },
    },
    {
      name: 'supabase_upload_file',
      description: 'Upload a file to Supabase Storage.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Destination path' },
          content: { type: 'string', description: 'File content (text)' },
          mime_type: { type: 'string', description: 'MIME type (default: text/plain)' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'supabase_delete_file',
      description: 'Delete a file from Supabase Storage.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path to delete' } },
        required: ['path'],
      },
    },
    {
      name: 'supabase_move_file',
      description: 'Move a file within Supabase Storage.',
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
      name: 'supabase_copy_file',
      description: 'Copy a file within Supabase Storage.',
      input_schema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source path' },
          to: { type: 'string', description: 'Destination path' },
        },
        required: ['from', 'to'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  supabase_list_files: listFiles,
  supabase_upload_file: uploadFile,
  supabase_delete_file: deleteFile,
  supabase_move_file: moveFile,
  supabase_copy_file: copyFile,
};
