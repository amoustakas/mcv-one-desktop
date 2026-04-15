import type { KitExecutionContext } from '../types';
import type { StorageItem, ListOpts } from '../types';

async function postDrive(action: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/drive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Drive API error: ${res.status}`);
  }
  return res.json();
}

export async function gdriveList(path: string, _opts: ListOpts | undefined, ctx: KitExecutionContext): Promise<StorageItem[]> {
  const data = await postDrive(path ? 'search' : 'list', path ? { query: path } : {}, ctx);
  return (data.files ?? []).map(mapDriveFile);
}

export async function gdriveSearch(query: string, ctx: KitExecutionContext): Promise<StorageItem[]> {
  const data = await postDrive('search', { query }, ctx);
  return (data.files ?? []).map(mapDriveFile);
}

function mapDriveFile(raw: any): StorageItem {
  const isFolder = raw.mimeType === 'application/vnd.google-apps.folder';
  return {
    id: `gdrive:${raw.id}`,
    name: raw.name,
    path: raw.id,
    provider: 'gdrive',
    isFolder,
    mimeType: raw.mimeType,
    sizeBytes: raw.size ? parseInt(raw.size) : undefined,
    createdAt: raw.createdTime || new Date().toISOString(),
    updatedAt: raw.modifiedTime || new Date().toISOString(),
    thumbnail: raw.thumbnailLink,
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: { driveId: raw.id, webViewLink: raw.webViewLink },
  };
}
