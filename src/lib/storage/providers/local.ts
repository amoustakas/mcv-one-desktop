// src/lib/storage/providers/local.ts

import type { KitExecutionContext } from '../../kits/types';
import type { StorageItem, ListOpts, StorageReadResult, StorageWriteResult, FileMeta, StorageProviderId } from '../types';

const API_BASE = '/api/storage-local';

async function postLocal(action: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Local storage error: ${res.status}`);
  }
  return res.json();
}

export async function localList(path: string, _opts: ListOpts | undefined, ctx: KitExecutionContext): Promise<StorageItem[]> {
  const data = await postLocal('list', { path }, ctx);
  return (data.files ?? []).map((f: any) => mapLocalFile(f, path));
}

export async function localRead(path: string, ctx: KitExecutionContext): Promise<StorageReadResult> {
  const data = await postLocal('read', { path }, ctx);
  const binary = atob(data.content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { data: new Blob([bytes]), mimeType: 'application/octet-stream', size: data.size };
}

export async function localWrite(path: string, data: Blob, _meta?: FileMeta, ctx?: KitExecutionContext): Promise<StorageWriteResult> {
  const buffer = await data.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  await postLocal('write', { path, content: base64 }, ctx!);
  return { id: `local:${path}`, path, provider: 'local' as StorageProviderId, size: data.size };
}

export async function localDelete(path: string, ctx: KitExecutionContext): Promise<void> {
  await postLocal('delete', { path }, ctx);
}

export async function localMove(from: string, to: string, ctx: KitExecutionContext): Promise<void> {
  await postLocal('move', { from, to }, ctx);
}

export async function localMkdir(path: string, ctx: KitExecutionContext): Promise<void> {
  await postLocal('mkdir', { path }, ctx);
}

function mapLocalFile(raw: any, parentPath: string): StorageItem {
  return {
    id: `local:${parentPath}/${raw.name}`,
    name: raw.name,
    path: parentPath ? `${parentPath}/${raw.name}` : raw.name,
    provider: 'local',
    isFolder: raw.isFolder,
    sizeBytes: raw.size,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || new Date().toISOString(),
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: {},
  };
}
