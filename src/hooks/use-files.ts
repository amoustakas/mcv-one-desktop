// src/hooks/use-files.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFilesStore } from '../stores/files';
import { listFiles, readFile, writeFile, deleteFile, moveFile, copyFile } from '../lib/storage/orchestrator';
import type { StorageProviderId, ListOpts, FileMeta } from '../lib/storage/types';
import type { KitExecutionContext } from '../lib/kits/types';

// Default context for direct UI calls (not via kit orchestrator)
function defaultCtx(): KitExecutionContext {
  return {
    userId: 'local-user',
    ventureId: 'mcv',
    conversationId: 'direct',
    fetch: globalThis.fetch.bind(globalThis),
  };
}

export const fileKeys = {
  list: (provider: StorageProviderId, path: string) => ['files', provider, path] as const,
  detail: (provider: StorageProviderId, path: string) => ['files', 'detail', provider, path] as const,
  search: (query: string) => ['files', 'search', query] as const,
};

export function useFileList(provider: StorageProviderId, path: string, opts?: ListOpts) {
  const setFiles = useFilesStore(s => s.setFiles);
  const setLoading = useFilesStore(s => s.setLoading);
  const setError = useFilesStore(s => s.setError);

  return useQuery({
    queryKey: fileKeys.list(provider, path),
    queryFn: async () => {
      setLoading(true);
      try {
        const files = await listFiles(provider, path, opts, defaultCtx());
        setFiles(files);
        return files;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to list files';
        setError(msg);
        throw err;
      }
    },
  });
}

export function useFileUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      provider: StorageProviderId;
      path: string;
      file: File;
      meta?: FileMeta;
    }) => {
      return writeFile(params.provider, params.path, params.file, {
        ...params.meta,
        mimeType: params.file.type,
      }, defaultCtx());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { provider: StorageProviderId; path: string }) => {
      return deleteFile(params.provider, params.path, defaultCtx());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fromProvider: StorageProviderId;
      fromPath: string;
      toProvider: StorageProviderId;
      toPath: string;
    }) => {
      return moveFile(params.fromProvider, params.fromPath, params.toProvider, params.toPath, defaultCtx());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileCopy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fromProvider: StorageProviderId;
      fromPath: string;
      toProvider: StorageProviderId;
      toPath: string;
    }) => {
      return copyFile(params.fromProvider, params.fromPath, params.toProvider, params.toPath, defaultCtx());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileDownload() {
  return useMutation({
    mutationFn: async (params: { provider: StorageProviderId; path: string; filename: string }) => {
      const result = await readFile(params.provider, params.path, defaultCtx());
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = params.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
