// MCV One — Storage Orchestrator
// Routes operations to the correct provider by path prefix.
// Handles cross-provider moves/copies.

import type { KitExecutionContext } from '../kits/types';
import type {
  StorageItem, StorageProviderId, ListOpts,
  StorageReadResult, StorageWriteResult, FileMeta,
} from './types';

/**
 * Parses a prefixed path like "supabase://docs/file.pdf" into provider + path.
 * Defaults to supabase if no prefix.
 */
export function parsePath(fullPath: string): { provider: StorageProviderId; path: string } {
  const match = fullPath.match(/^(\w[\w-]*):\/{2}(.*)$/);
  if (match) {
    return { provider: match[1] as StorageProviderId, path: match[2] };
  }
  return { provider: 'supabase', path: fullPath };
}

export function buildFullPath(provider: StorageProviderId, path: string): string {
  return `${provider}://${path}`;
}

/**
 * Routes a list operation to the correct provider.
 */
export async function listFiles(
  provider: StorageProviderId,
  path: string,
  opts: ListOpts | undefined,
  ctx: KitExecutionContext,
): Promise<StorageItem[]> {
  switch (provider) {
    case 'supabase': {
      const { supabaseList } = await import('./providers/supabase');
      return supabaseList(path, opts, ctx);
    }
    case 'local': {
      const { localList } = await import('./providers/local');
      return localList(path, opts, ctx);
    }
    case 'gdrive': {
      const { gdriveList } = await import('./providers/gdrive');
      return gdriveList(path, opts, ctx);
    }
    case 'vercel-blob':
    case 'r2':
    case 'gcp':
      return []; // Providers added incrementally
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Routes a read operation to the correct provider.
 */
export async function readFile(
  provider: StorageProviderId,
  path: string,
  ctx: KitExecutionContext,
): Promise<StorageReadResult> {
  switch (provider) {
    case 'supabase': {
      const { supabaseRead } = await import('./providers/supabase');
      return supabaseRead(path, ctx);
    }
    case 'local': {
      const { localRead } = await import('./providers/local');
      return localRead(path, ctx);
    }
    default:
      throw new Error(`Read not supported for provider: ${provider}`);
  }
}

/**
 * Routes a write operation to the correct provider.
 */
export async function writeFile(
  provider: StorageProviderId,
  path: string,
  data: Blob,
  meta: FileMeta | undefined,
  ctx: KitExecutionContext,
): Promise<StorageWriteResult> {
  switch (provider) {
    case 'supabase': {
      const { supabaseWrite } = await import('./providers/supabase');
      return supabaseWrite(path, data, meta, ctx);
    }
    case 'local': {
      const { localWrite } = await import('./providers/local');
      return localWrite(path, data, meta, ctx);
    }
    default:
      throw new Error(`Write not supported for provider: ${provider}`);
  }
}

/**
 * Routes a delete operation to the correct provider.
 */
export async function deleteFile(
  provider: StorageProviderId,
  path: string,
  ctx: KitExecutionContext,
): Promise<void> {
  switch (provider) {
    case 'supabase': {
      const { supabaseDelete } = await import('./providers/supabase');
      return supabaseDelete(path, ctx);
    }
    case 'local': {
      const { localDelete } = await import('./providers/local');
      return localDelete(path, ctx);
    }
    default:
      throw new Error(`Delete not supported for provider: ${provider}`);
  }
}

/**
 * Routes a move operation to the correct provider.
 * Cross-provider moves are copy + delete.
 */
export async function moveFile(
  fromProvider: StorageProviderId,
  fromPath: string,
  toProvider: StorageProviderId,
  toPath: string,
  ctx: KitExecutionContext,
): Promise<void> {
  if (fromProvider === toProvider) {
    switch (fromProvider) {
      case 'supabase': {
        const { supabaseMove } = await import('./providers/supabase');
        return supabaseMove(fromPath, toPath, ctx);
      }
      case 'local': {
        const { localMove } = await import('./providers/local');
        return localMove(fromPath, toPath, ctx);
      }
      default:
        throw new Error(`Move not supported for provider: ${fromProvider}`);
    }
  }
  // Cross-provider: read from source, write to dest, delete source
  const data = await readFile(fromProvider, fromPath, ctx);
  await writeFile(toProvider, toPath, data.data, { mimeType: data.mimeType }, ctx);
  await deleteFile(fromProvider, fromPath, ctx);
}

/**
 * Cross-provider copy: read from source, write to dest.
 */
export async function copyFile(
  fromProvider: StorageProviderId,
  fromPath: string,
  toProvider: StorageProviderId,
  toPath: string,
  ctx: KitExecutionContext,
): Promise<void> {
  if (fromProvider === toProvider && fromProvider === 'supabase') {
    const { supabaseCopy } = await import('./providers/supabase');
    return supabaseCopy(fromPath, toPath, ctx);
  }
  const data = await readFile(fromProvider, fromPath, ctx);
  await writeFile(toProvider, toPath, data.data, { mimeType: data.mimeType }, ctx);
}
