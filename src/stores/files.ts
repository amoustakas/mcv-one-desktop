// src/stores/files.ts

import { create } from 'zustand';
import type {
  StorageItem, StorageProviderId, FileStatus,
  AuditEntry, ProviderInfo,
} from '../lib/storage/types';

type FilesViewMode = 'browser' | 'media-library' | 'all-sources';
type DisplayMode = 'browse' | 'discover';
type FileDisplayStyle = 'grid' | 'list';

interface FilesState {
  // View state
  viewMode: FilesViewMode;
  displayMode: DisplayMode;
  displayStyle: FileDisplayStyle;

  // Navigation
  currentProvider: StorageProviderId;
  currentPath: string;
  breadcrumbs: { label: string; path: string; provider: StorageProviderId }[];

  // File data
  files: StorageItem[];
  folders: StorageItem[];
  loading: boolean;
  error: string | null;

  // Selection
  selectedIds: Set<string>;
  previewFileId: string | null;

  // Filters
  typeFilter: string | null;
  statusFilter: FileStatus | null;
  ventureFilter: string | null;
  searchQuery: string;

  // Providers
  providers: ProviderInfo[];

  // Audit
  auditLog: AuditEntry[];

  // Actions
  setViewMode: (mode: FilesViewMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setDisplayStyle: (style: FileDisplayStyle) => void;
  setCurrentProvider: (provider: StorageProviderId) => void;
  navigateTo: (path: string, provider?: StorageProviderId) => void;
  navigateUp: () => void;
  setFiles: (files: StorageItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectRange: (fromId: string, toId: string) => void;
  setPreviewFile: (id: string | null) => void;
  setTypeFilter: (type: string | null) => void;
  setStatusFilter: (status: FileStatus | null) => void;
  setVentureFilter: (venture: string | null) => void;
  setSearchQuery: (query: string) => void;
  setProviders: (providers: ProviderInfo[]) => void;
  setAuditLog: (log: AuditEntry[]) => void;
}

function buildBreadcrumbs(path: string, provider: StorageProviderId) {
  const parts = path.split('/').filter(Boolean);
  const crumbs: { label: string; path: string; provider: StorageProviderId }[] = [{ label: provider, path: '', provider }];
  let accumulated = '';
  for (const part of parts) {
    accumulated += '/' + part;
    crumbs.push({ label: part, path: accumulated, provider });
  }
  return crumbs;
}

export const useFilesStore = create<FilesState>()((set, get) => ({
  viewMode: 'browser',
  displayMode: 'browse',
  displayStyle: 'grid',
  currentProvider: 'supabase' as StorageProviderId,
  currentPath: '',
  breadcrumbs: [{ label: 'supabase', path: '', provider: 'supabase' as StorageProviderId }],
  files: [],
  folders: [],
  loading: false,
  error: null,
  selectedIds: new Set(),
  previewFileId: null,
  typeFilter: null,
  statusFilter: null,
  ventureFilter: null,
  searchQuery: '',
  providers: [],
  auditLog: [],

  setViewMode: (mode) => set({ viewMode: mode }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setDisplayStyle: (style) => set({ displayStyle: style }),
  setCurrentProvider: (provider) => set({
    currentProvider: provider,
    currentPath: '',
    breadcrumbs: [{ label: provider, path: '', provider }],
  }),

  navigateTo: (path, provider) => {
    const p = provider ?? get().currentProvider;
    set({
      currentPath: path,
      currentProvider: p,
      breadcrumbs: buildBreadcrumbs(path, p),
      selectedIds: new Set(),
      previewFileId: null,
    });
  },

  navigateUp: () => {
    const { currentPath, currentProvider } = get();
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length ? '/' + parts.join('/') : '';
    set({
      currentPath: newPath,
      breadcrumbs: buildBreadcrumbs(newPath, currentProvider),
      selectedIds: new Set(),
    });
  },

  setFiles: (items) => {
    const folders = items.filter(f => f.isFolder);
    const files = items.filter(f => !f.isFolder);
    set({ files, folders, loading: false, error: null });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  toggleSelect: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  }),

  selectAll: () => set((s) => {
    const all = [...s.files, ...s.folders].map(f => f.id);
    return { selectedIds: new Set(all) };
  }),

  clearSelection: () => set({ selectedIds: new Set() }),

  selectRange: (fromId, toId) => set((s) => {
    const all = [...s.folders, ...s.files];
    const fromIdx = all.findIndex(f => f.id === fromId);
    const toIdx = all.findIndex(f => f.id === toId);
    if (fromIdx === -1 || toIdx === -1) return {};
    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const ids = all.slice(start, end + 1).map(f => f.id);
    return { selectedIds: new Set([...s.selectedIds, ...ids]) };
  }),

  setPreviewFile: (id) => set({ previewFileId: id }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setVentureFilter: (venture) => set({ ventureFilter: venture }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setProviders: (providers) => set({ providers }),
  setAuditLog: (log) => set({ auditLog: log }),
}));
