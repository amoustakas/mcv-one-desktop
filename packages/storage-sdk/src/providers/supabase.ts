// src/lib/storage/providers/supabase.ts

import type { KitExecutionContext } from '../types';
import type { StorageItem, ListOpts, StorageReadResult, StorageWriteResult, FileMeta, StorageProviderId } from '../types';

const API_BASE = '/api/storage';

async function postStorage(action: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Storage API error: ${res.status}`);
  }
  return res.json();
}

export async function supabaseList(path: string, opts: ListOpts | undefined, ctx: KitExecutionContext): Promise<StorageItem[]> {
  const data = await postStorage('list', { bucket: 'documents', path, ...opts }, ctx);
  const files = data.files ?? [];
  return files.map((f: any) => mapSupabaseFile(f, path));
}

export async function supabaseRead(path: string, ctx: KitExecutionContext): Promise<StorageReadResult> {
  const data = await postStorage('download', { path }, ctx);
  const binary = atob(data.content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return {
    data: new Blob([bytes], { type: data.type }),
    mimeType: data.type,
    size: bytes.length,
  };
}

export async function supabaseWrite(
  path: string, data: Blob, meta?: FileMeta, ctx?: KitExecutionContext,
): Promise<StorageWriteResult> {
  const buffer = await data.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const result = await postStorage('upload', {
    path,
    content: base64,
    contentType: meta?.mimeType || data.type || 'application/octet-stream',
    bucket: 'documents',
  }, ctx!);
  return {
    id: result.file?.path || path,
    path,
    provider: 'supabase' as StorageProviderId,
    size: data.size,
    url: undefined,
  };
}

export async function supabaseDelete(path: string, ctx: KitExecutionContext): Promise<void> {
  await postStorage('delete', { path }, ctx);
}

export async function supabaseMove(from: string, to: string, ctx: KitExecutionContext): Promise<void> {
  // Supabase doesn't have native move — copy + delete
  const readResult = await supabaseRead(from, ctx);
  await supabaseWrite(to, readResult.data, { mimeType: readResult.mimeType }, ctx);
  await supabaseDelete(from, ctx);
}

export async function supabaseCopy(from: string, to: string, ctx: KitExecutionContext): Promise<void> {
  const readResult = await supabaseRead(from, ctx);
  await supabaseWrite(to, readResult.data, { mimeType: readResult.mimeType }, ctx);
}

export async function supabaseGetPublicUrl(path: string, ctx: KitExecutionContext): Promise<string> {
  const data = await postStorage('get-url', { path, bucket: 'assets' }, ctx);
  return data.url;
}

function mapSupabaseFile(raw: any, parentPath: string): StorageItem {
  const isFolder = !raw.id && raw.name && !raw.metadata;
  return {
    id: raw.id || `folder:${parentPath}/${raw.name}`,
    name: raw.name,
    path: parentPath ? `${parentPath}/${raw.name}` : raw.name,
    provider: 'supabase',
    isFolder,
    mimeType: raw.metadata?.mimetype || undefined,
    sizeBytes: raw.metadata?.size || undefined,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.created_at || new Date().toISOString(),
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: raw.metadata || {},
  };
}
