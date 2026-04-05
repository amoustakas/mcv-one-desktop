# File Manager, Media Library & Unified Data Fabric — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive File Manager, Media Library, and cinematic discovery layer for MCV One Desktop with hybrid storage, AI intelligence, Google RAG, full audit logging, and NFT certification.

**Architecture:** Hybrid B+C approach — premium FutureState-grade UI ships first with Supabase + Local FS on day one. Each storage provider is a Kit with dual-path execution (direct for UI, AI-path for chat). Storage orchestrator routes by path prefix. Unified metadata index in Supabase powers cross-provider search, audit, and discovery.

**Tech Stack:** React 18, TypeScript strict, Zustand (stores), React Query (data fetching), Framer Motion (animations), CSS variables (design system), Vercel Functions (API), Supabase (DB + Storage), @dnd-kit (drag-drop), react-dropzone (upload), react-virtuoso (virtualized lists), @solana/web3.js + @coral-xyz/anchor (NFT).

---

## Phase 1: Storage Foundation

### Task 1: Storage Type Definitions

**Files:**
- Create: `src/lib/storage/types.ts`

- [ ] **Step 1: Create the storage types file**

```typescript
// src/lib/storage/types.ts

import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Storage Provider Abstraction
// ---------------------------------------------------------------------------

export type StorageCapability =
  | 'read' | 'write' | 'stream' | 'search'
  | 'sync' | 'version' | 'public-url' | 'thumbnail';

export type StorageProviderId =
  | 'supabase' | 'local' | 'gdrive'
  | 'vercel-blob' | 'r2' | 'gcp';

export type FileStatus = 'draft' | 'active' | 'review' | 'approved' | 'archived' | 'trash' | 'locked';
export type FileStage = 'concept' | 'in-progress' | 'review' | 'approved' | 'published' | 'superseded';
export type FileVisibility = 'private' | 'venture' | 'internal' | 'shared' | 'public';
export type FileCertification = 'none' | 'verified' | 'signed' | 'nft-certified' | 'legal-hold';

export interface StorageItem {
  id: string;
  name: string;
  path: string;
  provider: StorageProviderId;
  isFolder: boolean;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
  accessedAt?: string;
  thumbnail?: string;
  parentId?: string;
  ventureId?: string;
  tags: string[];
  aiTags: string[];
  aiSummary?: string;
  status: FileStatus;
  stage: FileStage;
  visibility: FileVisibility;
  certification: FileCertification;
  certificationJson?: NFTCertification;
  contentHash?: string;
  versionCount: number;
  metadata: Record<string, unknown>;
}

export interface StorageFolder extends StorageItem {
  isFolder: true;
  childCount?: number;
}

export interface ListOpts {
  prefix?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'date' | 'size';
  orderDir?: 'asc' | 'desc';
  fileTypes?: string[];
  status?: FileStatus;
  ventureId?: string;
}

export interface StorageReadResult {
  data: Blob;
  mimeType: string;
  size: number;
}

export interface StorageWriteResult {
  id: string;
  path: string;
  provider: StorageProviderId;
  size: number;
  url?: string;
}

export interface FileMeta {
  ventureId?: string;
  tags?: string[];
  status?: FileStatus;
  stage?: FileStage;
  visibility?: FileVisibility;
  parentId?: string;
  mimeType?: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  provider: StorageProviderId;
  path: string;
  sizeBytes: number;
  contentHash: string;
  createdBy: string;
  createdAt: string;
  changeSummary?: string;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: string[];
}

export interface SearchOpts {
  ventureId?: string;
  providers?: StorageProviderId[];
  fileTypes?: string[];
  status?: FileStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export type ThumbSize = 'sm' | 'md' | 'lg';

export interface StorageProvider {
  id: StorageProviderId;
  name: string;
  icon: LucideIcon;
  capabilities: StorageCapability[];
  connected: boolean;

  list(path: string, opts?: ListOpts): Promise<StorageItem[]>;
  read(path: string): Promise<StorageReadResult>;
  write(path: string, data: Blob | ReadableStream, meta?: FileMeta): Promise<StorageWriteResult>;
  delete(path: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
  copy(from: string, to: string): Promise<void>;

  search?(query: string, opts?: SearchOpts): Promise<StorageItem[]>;
  getVersions?(path: string): Promise<FileVersion[]>;
  getThumbnail?(path: string, size: ThumbSize): Promise<string>;
  getPublicUrl?(path: string): Promise<string>;
  sync?(direction: 'push' | 'pull' | 'bidirectional'): Promise<SyncResult>;
}

// ---------------------------------------------------------------------------
// File Compartments
// ---------------------------------------------------------------------------

export interface FileCompartment {
  id: string;
  fileId: string;
  ventureId: string;
  compartment: string;
  accessLevel: FileVisibility;
  tags: string[];
  pinnedPosition?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// NFT Certification
// ---------------------------------------------------------------------------

export interface NFTCertification {
  fileId: string;
  mintAddress: string;
  metadataUri: string;
  contentHash: string;
  certifiedAt: string;
  certifiedBy: string;
  chainVerified: boolean;
  collectionAddress?: string;
  attributes: {
    document_type: string;
    venture: string;
    parties?: string[];
    effective_date?: string;
    expiration_date?: string;
  };
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'create' | 'upload' | 'read' | 'download'
  | 'edit' | 'rename' | 'move' | 'copy'
  | 'trash' | 'restore' | 'delete_permanent'
  | 'status_change' | 'stage_change' | 'visibility_change'
  | 'share' | 'unshare' | 'compartment_add' | 'compartment_remove'
  | 'tag_add' | 'tag_remove' | 'ai_analyze' | 'ai_generate'
  | 'lock' | 'unlock' | 'nft_certify' | 'legal_hold'
  | 'version_create' | 'version_restore'
  | 'rag_index' | 'rag_query';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  fileId: string;
  action: AuditAction;
  details: Record<string, unknown>;
  provider: string;
  ventureId?: string;
  previousState?: Partial<StorageItem>;
}

// ---------------------------------------------------------------------------
// AI Pipeline
// ---------------------------------------------------------------------------

export interface AIAnalysis {
  tags: string[];
  summary: string;
  ventureRelevance: string[];
  contentType: string;
  extractedText?: string;
}

export interface ContentSignal {
  userId: string;
  fileId: string;
  action: 'open' | 'edit' | 'share' | 'download' | 'generate' | 'delete' | 'search_click';
  ventureId: string;
  timestamp: string;
  durationMs?: number;
  context?: string;
}

// ---------------------------------------------------------------------------
// Provider metadata for UI
// ---------------------------------------------------------------------------

export interface ProviderInfo {
  id: StorageProviderId;
  name: string;
  color: string;
  iconName: string;
  connected: boolean;
  capabilities: StorageCapability[];
}

export const PROVIDER_COLORS: Record<StorageProviderId, string> = {
  supabase: '#3ECF8E',
  local: '#F59E0B',
  gdrive: '#4285F4',
  'vercel-blob': '#FFFFFF',
  r2: '#F6821F',
  gcp: '#4285F4',
};

export const PROVIDER_NAMES: Record<StorageProviderId, string> = {
  supabase: 'Supabase',
  local: 'Local',
  gdrive: 'Google Drive',
  'vercel-blob': 'Vercel Blob',
  r2: 'Cloudflare R2',
  gcp: 'GCP Storage',
};

export const STATUS_COLORS: Record<FileStatus, string> = {
  draft: '#F59E0B',
  active: '#00F0FF',
  review: '#8B5CF6',
  approved: '#10B981',
  archived: '#6B7280',
  trash: '#EF4444',
  locked: '#F59E0B',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/storage/types.ts
git commit -m "feat(storage): add comprehensive type definitions for hybrid storage layer"
```

---

### Task 2: Files Zustand Store

**Files:**
- Create: `src/stores/files.ts`

- [ ] **Step 1: Create the files store**

```typescript
// src/stores/files.ts

import { create } from 'zustand';
import type {
  StorageItem, StorageProviderId, FileStatus, FileStage,
  FileVisibility, ListOpts, AuditEntry, ProviderInfo,
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
  const crumbs = [{ label: provider, path: '', provider }];
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
  currentProvider: 'supabase',
  currentPath: '',
  breadcrumbs: [{ label: 'supabase', path: '', provider: 'supabase' }],
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
```

- [ ] **Step 2: Export from stores barrel**

Add to `src/stores/index.ts`:

```typescript
export { useFilesStore } from './files';
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/files.ts src/stores/index.ts
git commit -m "feat(storage): add files Zustand store with selection, navigation, filters"
```

---

### Task 3: Supabase Storage Provider Kit

**Files:**
- Create: `src/lib/storage/providers/supabase.ts`
- Create: `src/lib/kits/builtin/storage-supabase-kit.ts`

- [ ] **Step 1: Create the Supabase storage provider**

```typescript
// src/lib/storage/providers/supabase.ts

import type { KitExecutionContext } from '../../kits/types';
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
```

- [ ] **Step 2: Create the Supabase storage kit**

```typescript
// src/lib/kits/builtin/storage-supabase-kit.ts

import type { KitManifest, KitToolHandler } from '../types';
import { supabaseList, supabaseRead, supabaseWrite, supabaseDelete, supabaseMove, supabaseCopy } from '../../storage/providers/supabase';

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
```

- [ ] **Step 3: Register kit in loader.ts**

Add to `src/lib/kits/loader.ts` imports and builtinKits array:

```typescript
import { manifest as storageSupabaseManifest, handlers as storageSupabaseHandlers } from './builtin/storage-supabase-kit';
// ... in builtinKits array:
kit(storageSupabaseManifest, storageSupabaseHandlers),
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage/providers/supabase.ts src/lib/kits/builtin/storage-supabase-kit.ts src/lib/kits/loader.ts
git commit -m "feat(storage): add Supabase storage provider + kit with list/upload/delete/move/copy"
```

---

### Task 4: Local Filesystem Storage Provider Kit

**Files:**
- Create: `src/lib/storage/providers/local.ts`
- Create: `src/lib/kits/builtin/storage-local-kit.ts`
- Create: `api/storage-local.ts`

- [ ] **Step 1: Create the local storage API route**

```typescript
// api/storage-local.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_ROOT = process.env.MCV_LOCAL_STORAGE_PATH || 'F:\\MCV-Desktop-SA';

function safePath(userPath: string): string {
  const resolved = path.resolve(LOCAL_ROOT, userPath);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Local storage only available in development
  if (process.env.VERCEL) {
    return res.status(400).json({ error: 'Local storage not available in production' });
  }

  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'list': {
        const dirPath = safePath(req.body?.path || '');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const files = entries.map(entry => {
          const fullPath = path.join(dirPath, entry.name);
          const stat = fs.statSync(fullPath);
          return {
            name: entry.name,
            isFolder: entry.isDirectory(),
            size: stat.size,
            created_at: stat.birthtime.toISOString(),
            updated_at: stat.mtime.toISOString(),
          };
        });
        return res.json({ files });
      }

      case 'read': {
        const filePath = safePath(req.body?.path);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
        const content = fs.readFileSync(filePath);
        return res.json({ content: content.toString('base64'), size: content.length });
      }

      case 'write': {
        const filePath = safePath(req.body?.path);
        const content = Buffer.from(req.body?.content, 'base64');
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content);
        return res.json({ success: true, size: content.length });
      }

      case 'delete': {
        const filePath = safePath(req.body?.path);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) fs.rmSync(filePath, { recursive: true });
        else fs.unlinkSync(filePath);
        return res.json({ success: true });
      }

      case 'move': {
        const from = safePath(req.body?.from);
        const to = safePath(req.body?.to);
        const toDir = path.dirname(to);
        if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
        fs.renameSync(from, to);
        return res.json({ success: true });
      }

      case 'mkdir': {
        const dirPath = safePath(req.body?.path);
        fs.mkdirSync(dirPath, { recursive: true });
        return res.json({ success: true });
      }

      case 'exists': {
        const checkPath = safePath(req.body?.path || '');
        return res.json({ exists: fs.existsSync(checkPath) });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
```

- [ ] **Step 2: Create the local storage provider**

```typescript
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
```

- [ ] **Step 3: Create the local storage kit**

```typescript
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
```

- [ ] **Step 4: Register kit in loader.ts**

Add import and entry to `src/lib/kits/loader.ts`:

```typescript
import { manifest as storageLocalManifest, handlers as storageLocalHandlers } from './builtin/storage-local-kit';
// in builtinKits:
kit(storageLocalManifest, storageLocalHandlers),
```

- [ ] **Step 5: Commit**

```bash
git add api/storage-local.ts src/lib/storage/providers/local.ts src/lib/kits/builtin/storage-local-kit.ts src/lib/kits/loader.ts
git commit -m "feat(storage): add local filesystem storage provider + kit (F:\\MCV-Desktop-SA)"
```

---

### Task 5: Storage Orchestrator

**Files:**
- Create: `src/lib/storage/orchestrator.ts`

- [ ] **Step 1: Create the storage orchestrator**

```typescript
// src/lib/storage/orchestrator.ts

import type { KitExecutionContext } from '../kits/types';
import type { StorageItem, StorageProviderId, ListOpts, StorageReadResult, StorageWriteResult, FileMeta, SearchOpts } from './types';
import { supabaseList, supabaseRead, supabaseWrite, supabaseDelete, supabaseMove, supabaseCopy } from './providers/supabase';
import { localList, localRead, localWrite, localDelete, localMove } from './providers/local';

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
    case 'supabase': return supabaseList(path, opts, ctx);
    case 'local': return localList(path, opts, ctx);
    case 'gdrive':
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
    case 'supabase': return supabaseRead(path, ctx);
    case 'local': return localRead(path, ctx);
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
    case 'supabase': return supabaseWrite(path, data, meta, ctx);
    case 'local': return localWrite(path, data, meta, ctx);
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
    case 'supabase': return supabaseDelete(path, ctx);
    case 'local': return localDelete(path, ctx);
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
      case 'supabase': return supabaseMove(fromPath, toPath, ctx);
      case 'local': return localMove(fromPath, toPath, ctx);
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
    return supabaseCopy(fromPath, toPath, ctx);
  }
  const data = await readFile(fromProvider, fromPath, ctx);
  await writeFile(toProvider, toPath, data.data, { mimeType: data.mimeType }, ctx);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/storage/orchestrator.ts
git commit -m "feat(storage): add storage orchestrator with path routing and cross-provider ops"
```

---

### Task 6: React Query Hooks for Files

**Files:**
- Create: `src/hooks/use-files.ts`

- [ ] **Step 1: Create the files hooks**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-files.ts
git commit -m "feat(storage): add React Query hooks for file operations"
```

---

## Phase 2: Navigation Integration

### Task 7: Add ViewIds and NavRail Items

**Files:**
- Modify: `src/stores/navigation.ts`
- Modify: `src/components/NavRail.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add new ViewIds to navigation store**

In `src/stores/navigation.ts`, add to the ViewId type:

```typescript
  // Files & Storage
  | 'files'
  | 'venture-workspace'
```

Add to the VIEW_LABELS object:

```typescript
  files: 'Files', 'venture-workspace': 'Workspace',
```

- [ ] **Step 2: Add Files to NavRail global sections**

In `src/components/NavRail.tsx`, add the `FolderOpen` and `Archive` imports:

```typescript
import {
  LayoutGrid, PieChart, Bot, Brain, Landmark, Activity,
  Wrench, Radio, Settings, ChevronLeft, ChevronRight, ChevronDown,
  CheckSquare, Users, Hammer, BookOpen, Monitor, Sparkles,
  Wand2, Swords, TrendingUp, FileText, Plus, Package,
  Database, GitBranch, Radar, FolderOpen, Archive,
} from 'lucide-react';
```

Add to VIEW_ICONS:

```typescript
  files: FolderOpen,
  'venture-workspace': Archive,
```

Add `{ id: 'files', label: 'Files' }` to the Operations section in globalSections:

```typescript
  {
    label: 'Operations', key: 'ops-section',
    items: [
      { id: 'tasks', label: 'Task Board' },
      { id: 'docs', label: 'Docs Hub' },
      { id: 'files', label: 'Files' },
      { id: 'team', label: 'Team' },
      { id: 'pipeline', label: 'Pipeline' },
    ],
  },
```

Add `{ id: 'venture-workspace', label: 'Workspace' }` to the Venture > Build section in ventureSections:

```typescript
  {
    label: 'Build', key: 'venture-build',
    items: [
      { id: 'venture-engineering', label: 'Engineering' },
      { id: 'venture-forge', label: 'The Forge' },
      { id: 'venture-docs', label: 'Documents' },
      { id: 'venture-workspace', label: 'Workspace' },
    ],
  },
```

- [ ] **Step 3: Add view routing in App.tsx**

Add lazy imports at top of `src/App.tsx`:

```typescript
const FilesView = lazy(() => import('./views/FilesView'));
const VentureWorkspaceView = lazy(() => import('./views/VentureWorkspaceView'));
```

Add cases in the `renderView` switch:

```typescript
    case 'files':
      return <FilesView />;
    case 'venture-workspace':
      return <VentureWorkspaceView />;
```

Add to VIEW_LABELS and SECTION_MAP:

```typescript
// VIEW_LABELS
  files: 'Files', 'venture-workspace': 'Workspace',
// SECTION_MAP
  files: 'Operations',
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/navigation.ts src/components/NavRail.tsx src/App.tsx
git commit -m "feat(nav): add Files and Venture Workspace to navigation system"
```

---

## Phase 3: Core UI Components

### Task 8: Design Token Additions + Animation Utilities

**Files:**
- Modify: `src/styles/design-system.css`
- Create: `src/lib/animations.ts`

- [ ] **Step 1: Add new CSS variables to design-system.css**

Append inside the `:root` block in `src/styles/design-system.css`:

```css
  /* Card enhancements (FutureState patterns) */
  --card-gradient-opacity: 0.05;
  --card-glow-radius: 20px;
  --card-hover-lift: -4px;

  /* Cinema / Discovery layer */
  --hero-height: 320px;
  --hero-height-mobile: 200px;
  --carousel-card-width: 200px;
  --carousel-card-width-lg: 280px;
  --carousel-gap: 16px;
  --carousel-fade-width: 60px;

  /* Provider colors */
  --provider-supabase: #3ECF8E;
  --provider-local: #F59E0B;
  --provider-gdrive: #4285F4;
  --provider-vercel: #FFFFFF;
  --provider-r2: #F6821F;
  --provider-gcp: #4285F4;
```

- [ ] **Step 2: Create the animation utilities**

```typescript
// src/lib/animations.ts

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
};

export const tapScale = {
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const slideInRight = {
  hidden: { x: '100%', opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export const slideInLeft = {
  hidden: { x: '-100%', opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/design-system.css src/lib/animations.ts
git commit -m "feat(ui): add FutureState design tokens and animation utilities"
```

---

### Task 9: StorageProviderBadge + StatusBadge + StageProgressBar Components

**Files:**
- Create: `src/components/files/StorageProviderBadge.tsx`
- Create: `src/components/files/StatusBadge.tsx`
- Create: `src/components/files/StageProgressBar.tsx`

- [ ] **Step 1: Create StorageProviderBadge**

```typescript
// src/components/files/StorageProviderBadge.tsx

import { Cloud, HardDrive, Globe, Triangle, CloudCog } from 'lucide-react';
import type { StorageProviderId } from '../../lib/storage/types';
import { PROVIDER_COLORS, PROVIDER_NAMES } from '../../lib/storage/types';

const ICONS: Record<StorageProviderId, React.FC<{ size: number }>> = {
  supabase: Cloud,
  local: HardDrive,
  gdrive: Globe,
  'vercel-blob': Triangle,
  r2: CloudCog,
  gcp: Cloud,
};

interface Props {
  provider: StorageProviderId;
  compact?: boolean;
}

export default function StorageProviderBadge({ provider, compact }: Props) {
  const Icon = ICONS[provider] || Cloud;
  const color = PROVIDER_COLORS[provider];
  const name = PROVIDER_NAMES[provider];

  return (
    <span className="provider-badge" style={{ '--provider-color': color } as React.CSSProperties}>
      <Icon size={compact ? 10 : 12} />
      {!compact && <span className="provider-badge-text">{name}</span>}
      <style>{`
        .provider-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--provider-color) 10%, transparent);
          color: var(--provider-color);
          font-size: 10px;
          font-weight: 600;
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .provider-badge-text {
          letter-spacing: 0.3px;
        }
      `}</style>
    </span>
  );
}
```

- [ ] **Step 2: Create StatusBadge**

```typescript
// src/components/files/StatusBadge.tsx

import { Lock, Trash2, Archive, Eye, CheckCircle, Clock, Edit3, Link2 } from 'lucide-react';
import type { FileStatus } from '../../lib/storage/types';
import { STATUS_COLORS } from '../../lib/storage/types';

const STATUS_ICONS: Record<FileStatus, React.FC<{ size: number }>> = {
  draft: Clock,
  active: Eye,
  review: Edit3,
  approved: CheckCircle,
  archived: Archive,
  trash: Trash2,
  locked: Lock,
};

const STATUS_LABELS: Record<FileStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  review: 'Review',
  approved: 'Approved',
  archived: 'Archived',
  trash: 'Trash',
  locked: 'Locked',
};

interface Props {
  status: FileStatus;
  certification?: string;
}

export default function StatusBadge({ status, certification }: Props) {
  if (certification === 'nft-certified') {
    return (
      <span className="status-badge" style={{ '--status-color': 'var(--cyan)' } as React.CSSProperties}>
        <Link2 size={10} />
        <span>On-Chain</span>
        <style>{statusStyles}</style>
      </span>
    );
  }

  const Icon = STATUS_ICONS[status];
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className={`status-badge ${status === 'draft' ? 'status-draft' : ''} ${status === 'review' ? 'status-pulse' : ''}`}
      style={{ '--status-color': color } as React.CSSProperties}
    >
      <Icon size={10} />
      <span>{label}</span>
      <style>{statusStyles}</style>
    </span>
  );
}

const statusStyles = `
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--status-color) 12%, transparent);
    color: var(--status-color);
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, var(--status-color) 20%, transparent);
  }
  .status-draft {
    border-style: dashed;
  }
  .status-pulse::after {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-color);
    animation: statusPulse 2s infinite;
  }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
```

- [ ] **Step 3: Create StageProgressBar**

```typescript
// src/components/files/StageProgressBar.tsx

import type { FileStage } from '../../lib/storage/types';

const STAGES: FileStage[] = ['concept', 'in-progress', 'review', 'approved', 'published'];
const STAGE_LABELS: Record<FileStage, string> = {
  concept: 'Concept',
  'in-progress': 'In Progress',
  review: 'Review',
  approved: 'Approved',
  published: 'Published',
  superseded: 'Superseded',
};

interface Props {
  stage: FileStage;
  compact?: boolean;
}

export default function StageProgressBar({ stage, compact }: Props) {
  const currentIdx = STAGES.indexOf(stage);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / STAGES.length) * 100 : 0;

  if (compact) {
    return (
      <div className="stage-compact">
        <div className="stage-compact-bar">
          <div className="stage-compact-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="stage-compact-label">{STAGE_LABELS[stage]}</span>
        <style>{stageStyles}</style>
      </div>
    );
  }

  return (
    <div className="stage-progress">
      <div className="stage-dots">
        {STAGES.map((s, i) => (
          <div key={s} className={`stage-dot ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'current' : ''} ${i > currentIdx ? 'upcoming' : ''}`}>
            <div className="stage-dot-circle" />
            <span className="stage-dot-label">{STAGE_LABELS[s]}</span>
          </div>
        ))}
      </div>
      <div className="stage-track">
        <div className="stage-fill" style={{ width: `${progress}%` }} />
      </div>
      <style>{stageStyles}</style>
    </div>
  );
}

const stageStyles = `
  .stage-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stage-dots {
    display: flex;
    justify-content: space-between;
  }
  .stage-dot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .stage-dot-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--text-muted);
    background: transparent;
    transition: all 0.3s;
  }
  .stage-dot.completed .stage-dot-circle {
    background: var(--cyan);
    border-color: var(--cyan);
  }
  .stage-dot.current .stage-dot-circle {
    border-color: var(--cyan);
    box-shadow: 0 0 8px var(--cyan-glow);
    animation: stagePulse 2s infinite;
  }
  .stage-dot-label {
    font-size: 8px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stage-dot.current .stage-dot-label,
  .stage-dot.completed .stage-dot-label {
    color: var(--cyan);
  }
  .stage-track {
    height: 3px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
  }
  .stage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan), var(--purple));
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  .stage-compact {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stage-compact-bar {
    flex: 1;
    height: 3px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
  }
  .stage-compact-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan), var(--purple));
    transition: width 0.3s;
  }
  .stage-compact-label {
    font-size: 9px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    white-space: nowrap;
  }
  @keyframes stagePulse {
    0%, 100% { box-shadow: 0 0 4px var(--cyan-glow); }
    50% { box-shadow: 0 0 12px var(--cyan-intense); }
  }
`;
```

- [ ] **Step 4: Commit**

```bash
git add src/components/files/StorageProviderBadge.tsx src/components/files/StatusBadge.tsx src/components/files/StageProgressBar.tsx
git commit -m "feat(ui): add StorageProviderBadge, StatusBadge, StageProgressBar components"
```

---

### Task 10: CinemaCard Component

**Files:**
- Create: `src/components/cinema/CinemaCard.tsx`

- [ ] **Step 1: Create the CinemaCard**

```typescript
// src/components/cinema/CinemaCard.tsx

import { motion } from 'framer-motion';
import { fadeInUp, hoverLift, tapScale } from '../../lib/animations';
import StorageProviderBadge from '../files/StorageProviderBadge';
import type { StorageProviderId } from '../../lib/storage/types';
import { File, Image, Film, Music, FileText, Code, Database, MessageSquare } from 'lucide-react';

const TYPE_ICONS: Record<string, React.FC<{ size: number }>> = {
  image: Image,
  video: Film,
  audio: Music,
  document: FileText,
  code: Code,
  data: Database,
  conversation: MessageSquare,
};

function getTypeIcon(mimeType?: string): React.FC<{ size: number }> {
  if (!mimeType) return File;
  if (mimeType.startsWith('image')) return Image;
  if (mimeType.startsWith('video')) return Film;
  if (mimeType.startsWith('audio')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) return FileText;
  if (mimeType.includes('json') || mimeType.includes('csv') || mimeType.includes('spreadsheet')) return Database;
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python')) return Code;
  return File;
}

interface CinemaCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  mimeType?: string;
  meta: string;
  tags?: string[];
  provider: StorageProviderId;
  ventureColor?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CinemaCard({
  title, thumbnail, mimeType, meta, tags = [], provider,
  ventureColor, onClick, onContextMenu, size = 'md',
}: CinemaCardProps) {
  const Icon = getTypeIcon(mimeType);
  const w = size === 'sm' ? 160 : size === 'lg' ? 280 : 200;

  return (
    <motion.div
      className="cinema-card"
      style={{ width: w, '--venture-stripe': ventureColor || 'var(--cyan)' } as React.CSSProperties}
      variants={fadeInUp}
      {...hoverLift}
      {...tapScale}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="cinema-card-thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="cinema-card-img" />
        ) : (
          <div className="cinema-card-placeholder">
            <Icon size={32} />
          </div>
        )}
        <div className="cinema-card-overlay" />
        <div className="cinema-card-provider">
          <StorageProviderBadge provider={provider} compact />
        </div>
        <div className="cinema-card-stripe" />
      </div>
      <div className="cinema-card-body">
        <div className="cinema-card-title">{title}</div>
        <div className="cinema-card-meta">{meta}</div>
        {tags.length > 0 && (
          <div className="cinema-card-tags">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="cinema-card-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .cinema-card {
          flex-shrink: 0;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          border: 1px solid var(--border);
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cinema-card:hover {
          border-color: var(--border-active);
          box-shadow: 0 0 var(--card-glow-radius) var(--cyan-glow);
        }
        .cinema-card-thumb {
          position: relative;
          aspect-ratio: 16/10;
          overflow: hidden;
          background: var(--bg-elevated);
        }
        .cinema-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cinema-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .cinema-card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(transparent, var(--bg-card));
        }
        .cinema-card-provider {
          position: absolute;
          top: 8px;
          right: 8px;
        }
        .cinema-card-stripe {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: var(--venture-stripe);
        }
        .cinema-card-body {
          padding: 10px 12px 12px;
        }
        .cinema-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cinema-card-meta {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          margin-top: 2px;
        }
        .cinema-card-tags {
          display: flex;
          gap: 4px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .cinema-card-tag {
          font-size: 9px;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          background: var(--cyan-glow);
          color: var(--cyan);
          font-weight: 500;
        }
      `}</style>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cinema/CinemaCard.tsx
git commit -m "feat(ui): add CinemaCard component with Netflix-style thumbnail cards"
```

---

### Task 11: CarouselRow Component

**Files:**
- Create: `src/components/cinema/CarouselRow.tsx`

- [ ] **Step 1: Create CarouselRow**

```typescript
// src/components/cinema/CarouselRow.tsx

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { staggerContainer } from '../../lib/animations';
import type { LucideIcon } from 'lucide-react';

interface CarouselRowProps {
  title: string;
  icon?: LucideIcon;
  accentColor?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}

export default function CarouselRow({ title, icon: Icon, accentColor, onSeeAll, children }: CarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [children]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="carousel-row" style={{ '--carousel-accent': accentColor || 'var(--cyan)' } as React.CSSProperties}>
      <div className="carousel-header">
        <div className="carousel-title-group">
          {Icon && <Icon size={16} style={{ color: 'var(--carousel-accent)' }} />}
          <h3 className="carousel-title">{title}</h3>
        </div>
        {onSeeAll && (
          <button className="carousel-see-all" onClick={onSeeAll}>
            See All <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="carousel-track-wrapper">
        {canScrollLeft && (
          <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll('left')}>
            <ChevronLeft size={18} />
          </button>
        )}

        <motion.div
          className="carousel-track"
          ref={scrollRef}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {children}
        </motion.div>

        {canScrollRight && (
          <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll('right')}>
            <ChevronRight size={18} />
          </button>
        )}

        {canScrollLeft && <div className="carousel-fade carousel-fade-left" />}
        {canScrollRight && <div className="carousel-fade carousel-fade-right" />}
      </div>

      <style>{`
        .carousel-row {
          margin-bottom: var(--space-lg);
        }
        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
          padding: 0 var(--space-md);
        }
        .carousel-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .carousel-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }
        .carousel-see-all {
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 2px;
          transition: color 0.15s;
        }
        .carousel-see-all:hover {
          color: var(--carousel-accent);
        }
        .carousel-track-wrapper {
          position: relative;
        }
        .carousel-track {
          display: flex;
          gap: var(--carousel-gap);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding: 4px var(--space-md);
        }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-track > * {
          scroll-snap-align: start;
        }
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .carousel-track-wrapper:hover .carousel-arrow { opacity: 1; }
        .carousel-arrow:hover {
          background: var(--bg-card);
          border-color: var(--carousel-accent);
        }
        .carousel-arrow-left { left: 4px; }
        .carousel-arrow-right { right: 4px; }
        .carousel-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: var(--carousel-fade-width);
          pointer-events: none;
          z-index: 1;
        }
        .carousel-fade-left {
          left: 0;
          background: linear-gradient(to right, var(--bg-deep), transparent);
        }
        .carousel-fade-right {
          right: 0;
          background: linear-gradient(to left, var(--bg-deep), transparent);
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cinema/CarouselRow.tsx
git commit -m "feat(ui): add CarouselRow component with scroll-snap, arrows, and fade edges"
```

---

### Task 12: FilesView — Main View with Browser Tab

**Files:**
- Create: `src/views/FilesView.tsx`
- Create: `src/components/files/BreadcrumbBar.tsx`
- Create: `src/components/files/FileGrid.tsx`
- Create: `src/components/files/FileCard.tsx`
- Create: `src/styles/files.css`

- [ ] **Step 1: Create files.css with all file manager styles**

```css
/* src/styles/files.css */

/* ── Files View Layout ── */
.files-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.files-toolbar { display: flex; align-items: center; justify-content: space-between; padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--border); gap: var(--space-sm); flex-shrink: 0; }
.files-toolbar-left { display: flex; align-items: center; gap: var(--space-sm); }
.files-toolbar-right { display: flex; align-items: center; gap: var(--space-xs); }
.files-body { flex: 1; display: flex; overflow: hidden; }
.files-main { flex: 1; overflow-y: auto; padding: var(--space-md); }

/* ── Mode Toggle ── */
.mode-toggle { display: flex; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; }
.mode-toggle-btn { padding: 5px 14px; font-size: 11px; font-weight: 500; color: var(--text-muted); transition: all 0.15s; }
.mode-toggle-btn.active { background: var(--cyan-glow); color: var(--cyan); }

/* ── Breadcrumb Bar ── */
.breadcrumb-bar { display: flex; align-items: center; gap: 2px; font-size: 12px; flex: 1; min-width: 0; }
.breadcrumb-item { padding: 4px 8px; border-radius: var(--radius-sm); color: var(--text-muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.breadcrumb-item:hover { background: var(--bg-card); color: var(--text-primary); }
.breadcrumb-item.active { color: var(--text-secondary); font-weight: 500; }
.breadcrumb-sep { color: var(--text-muted); opacity: 0.3; font-size: 10px; }

/* ── File Grid ── */
.file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-md); }
.file-list { display: flex; flex-direction: column; gap: 1px; }

/* ── File Card (Grid Mode) ── */
.file-card { border-radius: var(--radius-md); background: var(--bg-card); border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.2s; position: relative; }
.file-card:hover { border-color: var(--border-active); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.file-card.selected { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan); }
.file-card-thumb { aspect-ratio: 4/3; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--text-muted); position: relative; overflow: hidden; }
.file-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
.file-card-thumb-overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 40%; background: linear-gradient(transparent, var(--bg-card)); }
.file-card-info { padding: 10px 12px; }
.file-card-name { font-size: 12px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-card-meta { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px; display: flex; align-items: center; gap: 6px; }
.file-card-check { position: absolute; top: 8px; left: 8px; width: 18px; height: 18px; border-radius: 4px; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.file-card:hover .file-card-check, .file-card.selected .file-card-check { opacity: 1; }
.file-card.selected .file-card-check { background: var(--cyan); border-color: var(--cyan); }

/* ── File Row (List Mode) ── */
.file-row { display: flex; align-items: center; gap: var(--space-sm); padding: 8px var(--space-md); border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
.file-row:hover { background: var(--bg-card); }
.file-row.selected { background: rgba(0,240,255,0.04); }
.file-row-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
.file-row-name { flex: 1; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-row-size { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); width: 80px; text-align: right; }
.file-row-date { font-size: 11px; color: var(--text-muted); width: 100px; text-align: right; }

/* ── Discover Mode ── */
.discover-view { overflow-y: auto; padding: var(--space-md) 0; }

/* ── Preview Panel ── */
.preview-panel { width: 360px; border-left: 1px solid var(--border); background: var(--bg-surface); overflow-y: auto; flex-shrink: 0; }
.preview-panel-header { padding: var(--space-md); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.preview-panel-thumb { aspect-ratio: 16/10; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.preview-panel-thumb img { width: 100%; height: 100%; object-fit: contain; }
.preview-panel-body { padding: var(--space-md); }
.preview-section { margin-bottom: var(--space-lg); }
.preview-section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); margin-bottom: var(--space-sm); }
.preview-field { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px; }
.preview-field-label { color: var(--text-muted); }
.preview-field-value { color: var(--text-primary); font-family: var(--font-mono); font-size: 11px; }
.preview-actions { display: flex; gap: var(--space-sm); padding: var(--space-md); border-top: 1px solid var(--border); }

/* ── Venture Workspace ── */
.workspace-categories { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-xl); }
.workspace-category-card { padding: var(--space-md); border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; text-align: center; position: relative; overflow: hidden; }
.workspace-category-card::before { content: ""; position: absolute; top: 0; left: 20%; right: 20%; height: 1px; background: linear-gradient(to right, transparent, var(--cyan), transparent); }
.workspace-category-card:hover { border-color: var(--border-active); transform: translateY(-2px); box-shadow: 0 0 20px var(--cyan-glow); }
.workspace-category-icon { font-size: 24px; margin-bottom: var(--space-sm); }
.workspace-category-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.workspace-category-count { font-size: 20px; font-weight: 700; color: var(--cyan); font-family: var(--font-mono); margin-top: 4px; }
```

- [ ] **Step 2: Create BreadcrumbBar component**

```typescript
// src/components/files/BreadcrumbBar.tsx

import { ChevronRight } from 'lucide-react';
import StorageProviderBadge from './StorageProviderBadge';
import type { StorageProviderId } from '../../lib/storage/types';

interface Crumb {
  label: string;
  path: string;
  provider: StorageProviderId;
}

interface Props {
  crumbs: Crumb[];
  onNavigate: (path: string, provider: StorageProviderId) => void;
}

export default function BreadcrumbBar({ crumbs, onNavigate }: Props) {
  return (
    <div className="breadcrumb-bar">
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {i > 0 && <ChevronRight size={10} className="breadcrumb-sep" />}
          {i === 0 ? (
            <span
              className="breadcrumb-item"
              onClick={() => onNavigate('', crumb.provider)}
            >
              <StorageProviderBadge provider={crumb.provider} compact />
            </span>
          ) : (
            <span
              className={`breadcrumb-item ${i === crumbs.length - 1 ? 'active' : ''}`}
              onClick={() => onNavigate(crumb.path, crumb.provider)}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create FileCard component**

```typescript
// src/components/files/FileCard.tsx

import { Folder, File, Image, Film, Music, FileText, Code, Database, Check } from 'lucide-react';
import StorageProviderBadge from './StorageProviderBadge';
import StatusBadge from './StatusBadge';
import type { StorageItem } from '../../lib/storage/types';

function getIcon(item: StorageItem) {
  if (item.isFolder) return Folder;
  const mime = item.mimeType || '';
  if (mime.startsWith('image')) return Image;
  if (mime.startsWith('video')) return Film;
  if (mime.startsWith('audio')) return Music;
  if (mime.includes('pdf') || mime.includes('document')) return FileText;
  if (mime.includes('json') || mime.includes('csv')) return Database;
  if (mime.includes('javascript') || mime.includes('typescript')) return Code;
  return File;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  item: StorageItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (item: StorageItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: StorageItem) => void;
  displayStyle: 'grid' | 'list';
}

export default function FileCard({ item, selected, onSelect, onClick, onContextMenu, displayStyle }: Props) {
  const Icon = getIcon(item);

  if (displayStyle === 'list') {
    return (
      <div
        className={`file-row ${selected ? 'selected' : ''}`}
        onClick={() => onClick(item)}
        onContextMenu={(e) => onContextMenu?.(e, item)}
      >
        <div className="file-row-icon" style={item.isFolder ? { color: 'var(--gold)' } : undefined}>
          <Icon size={16} />
        </div>
        <span className="file-row-name">{item.name}</span>
        {item.status !== 'active' && <StatusBadge status={item.status} certification={item.certification} />}
        <StorageProviderBadge provider={item.provider} compact />
        <span className="file-row-size">{formatSize(item.sizeBytes)}</span>
        <span className="file-row-date">{timeAgo(item.updatedAt)}</span>
      </div>
    );
  }

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick(item)}
      onContextMenu={(e) => onContextMenu?.(e, item)}
    >
      <div
        className="file-card-check"
        onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      >
        {selected && <Check size={12} color="var(--bg-deep)" />}
      </div>
      <div className="file-card-thumb">
        {item.thumbnail ? (
          <>
            <img src={item.thumbnail} alt={item.name} />
            <div className="file-card-thumb-overlay" />
          </>
        ) : (
          <Icon size={28} style={item.isFolder ? { color: 'var(--gold)' } : undefined} />
        )}
      </div>
      <div className="file-card-info">
        <div className="file-card-name">{item.name}</div>
        <div className="file-card-meta">
          <span>{formatSize(item.sizeBytes)}</span>
          <span>{timeAgo(item.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create FileGrid component**

```typescript
// src/components/files/FileGrid.tsx

import type { StorageItem } from '../../lib/storage/types';
import FileCard from './FileCard';

interface Props {
  items: StorageItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (item: StorageItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: StorageItem) => void;
  displayStyle: 'grid' | 'list';
}

export default function FileGrid({ items, selectedIds, onSelect, onClick, onContextMenu, displayStyle }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14 }}>No files here yet</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>Upload files or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className={displayStyle === 'grid' ? 'file-grid' : 'file-list'}>
      {items.map(item => (
        <FileCard
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={onSelect}
          onClick={onClick}
          onContextMenu={onContextMenu}
          displayStyle={displayStyle}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create FilesView main component**

```typescript
// src/views/FilesView.tsx

import { useEffect } from 'react';
import { LayoutGrid, List, Upload, FolderPlus, Sparkles, Eye } from 'lucide-react';
import { PageShell, PageHeader, Tabs } from '../components/ui';
import BreadcrumbBar from '../components/files/BreadcrumbBar';
import FileGrid from '../components/files/FileGrid';
import { useFilesStore } from '../stores/files';
import { useFileList } from '../hooks/use-files';
import type { StorageItem } from '../lib/storage/types';
import '../styles/files.css';

const VIEW_TABS = [
  { id: 'browser', label: 'Browser' },
  { id: 'media-library', label: 'Media Library' },
  { id: 'all-sources', label: 'All Sources' },
];

export default function FilesView() {
  const {
    viewMode, setViewMode, displayMode, setDisplayMode,
    displayStyle, setDisplayStyle, currentProvider, currentPath,
    breadcrumbs, navigateTo, files, folders, selectedIds,
    toggleSelect, previewFileId, setPreviewFile, loading,
  } = useFilesStore();

  const { refetch } = useFileList(currentProvider, currentPath);

  useEffect(() => { refetch(); }, [currentProvider, currentPath, refetch]);

  const allItems = [...folders, ...files];

  function handleItemClick(item: StorageItem) {
    if (item.isFolder) {
      navigateTo(item.path, item.provider);
    } else {
      setPreviewFile(item.id);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Files"
        icon="FolderOpen"
        actions={
          <div className="mode-toggle">
            <button
              className={`mode-toggle-btn ${displayMode === 'browse' ? 'active' : ''}`}
              onClick={() => setDisplayMode('browse')}
            >
              Browse
            </button>
            <button
              className={`mode-toggle-btn ${displayMode === 'discover' ? 'active' : ''}`}
              onClick={() => setDisplayMode('discover')}
            >
              <Sparkles size={12} style={{ marginRight: 4 }} />
              Discover
            </button>
          </div>
        }
      />

      {displayMode === 'browse' ? (
        <div className="files-view">
          <Tabs
            tabs={VIEW_TABS}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id as typeof viewMode)}
          />

          <div className="files-toolbar">
            <div className="files-toolbar-left">
              <BreadcrumbBar
                crumbs={breadcrumbs}
                onNavigate={navigateTo}
              />
            </div>
            <div className="files-toolbar-right">
              <button
                className="header-icon-btn"
                onClick={() => setDisplayStyle(displayStyle === 'grid' ? 'list' : 'grid')}
                title={displayStyle === 'grid' ? 'List view' : 'Grid view'}
              >
                {displayStyle === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
              </button>
              <button className="header-icon-btn" title="New folder">
                <FolderPlus size={14} />
              </button>
              <button className="header-icon-btn" title="Upload">
                <Upload size={14} />
              </button>
            </div>
          </div>

          <div className="files-body">
            <div className="files-main">
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Loading files...
                </div>
              ) : (
                <FileGrid
                  items={allItems}
                  selectedIds={selectedIds}
                  onSelect={toggleSelect}
                  onClick={handleItemClick}
                  displayStyle={displayStyle}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="discover-view">
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={32} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14 }}>Discover mode — coming next</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>AI-curated content rows will appear here</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
```

- [ ] **Step 6: Import files.css in main.tsx**

Verify `src/main.tsx` imports styles (if not using a CSS import chain, add):

```typescript
import './styles/files.css';
```

- [ ] **Step 7: Commit**

```bash
git add src/views/FilesView.tsx src/components/files/BreadcrumbBar.tsx src/components/files/FileCard.tsx src/components/files/FileGrid.tsx src/styles/files.css src/main.tsx
git commit -m "feat(files): add FilesView with browser tab, file grid/list, breadcrumbs, and mode toggle"
```

---

### Task 13: VentureWorkspaceView

**Files:**
- Create: `src/views/VentureWorkspaceView.tsx`

- [ ] **Step 1: Create VentureWorkspaceView**

```typescript
// src/views/VentureWorkspaceView.tsx

import { FileText, Image, Database, Film, Download, PenTool, Upload, BarChart3 } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { getVenture } from '../lib/ventures';
import '../styles/files.css';

const CATEGORIES = [
  { key: 'docs', label: 'Docs', icon: FileText, count: 0 },
  { key: 'assets', label: 'Assets', icon: Image, count: 0 },
  { key: 'data', label: 'Data', icon: Database, count: 0 },
  { key: 'media', label: 'Media', icon: Film, count: 0 },
  { key: 'exports', label: 'Exports', icon: Download, count: 0 },
];

export default function VentureWorkspaceView() {
  const { activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv');

  return (
    <PageShell>
      <PageHeader
        title={`${venture?.name || 'Venture'} Workspace`}
        icon="Archive"
      />

      <div style={{ padding: 'var(--space-md)' }}>
        {/* Category cards */}
        <div className="workspace-categories">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="workspace-category-card">
                <div className="workspace-category-icon">
                  <Icon size={24} style={{ color: 'var(--cyan)' }} />
                </div>
                <div className="workspace-category-label">{cat.label}</div>
                <div className="workspace-category-count">{cat.count}</div>
              </div>
            );
          })}
        </div>

        {/* Recent files */}
        <GlassCard>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Recent Files
          </h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 24 }}>
            No files in this workspace yet. Upload files or use Aegis to generate content.
          </div>
        </GlassCard>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <button className="mode-toggle-btn active" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--cyan-glow)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.2)', cursor: 'pointer' }}>
            <Upload size={14} /> Upload
          </button>
          <button className="mode-toggle-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <PenTool size={14} /> Generate
          </button>
          <button className="mode-toggle-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <BarChart3 size={14} /> Import Data
          </button>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/VentureWorkspaceView.tsx
git commit -m "feat(files): add VentureWorkspaceView with category cards and quick actions"
```

---

## Phase 4: Install Dependencies

### Task 14: Add Required Packages

- [ ] **Step 1: Install framer-motion and dnd-kit**

```bash
npm install framer-motion @dnd-kit/core @dnd-kit/sortable react-dropzone react-virtuoso
```

- [ ] **Step 2: Commit package changes**

```bash
git add package.json package-lock.json
git commit -m "deps: add framer-motion, dnd-kit, react-dropzone, react-virtuoso"
```

---

## Phase 5: HeroSpotlight + Discover Mode

### Task 15: HeroSpotlight Component

**Files:**
- Create: `src/components/cinema/HeroSpotlight.tsx`

- [ ] **Step 1: Create HeroSpotlight**

```typescript
// src/components/cinema/HeroSpotlight.tsx

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Share2, Sparkles } from 'lucide-react';
import StorageProviderBadge from '../files/StorageProviderBadge';
import type { StorageItem, StorageProviderId } from '../../lib/storage/types';

interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  aiSummary?: string;
  thumbnail?: string;
  provider: StorageProviderId;
  ventureLabel?: string;
  ventureColor?: string;
}

interface Props {
  items: SpotlightItem[];
  onOpen?: (id: string) => void;
  onShare?: (id: string) => void;
  onAiBrief?: (id: string) => void;
}

export default function HeroSpotlight({ items, onOpen, onShare, onAiBrief }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    if (items.length <= 1) return;
    setActiveIndex(i => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(advance, 8000);
    return () => clearInterval(timer);
  }, [paused, advance, items.length]);

  if (items.length === 0) return null;
  const item = items[activeIndex];

  return (
    <div
      className="hero-spotlight"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="hero-spotlight-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {item.thumbnail && (
            <div className="hero-spotlight-bg" style={{ backgroundImage: `url(${item.thumbnail})` }} />
          )}
          <div className="hero-spotlight-gradient" />

          <div className="hero-spotlight-content">
            {item.ventureLabel && (
              <span className="hero-venture-badge" style={{ borderColor: item.ventureColor }}>
                {item.ventureLabel}
              </span>
            )}
            <h2 className="hero-title">{item.title}</h2>
            <p className="hero-subtitle">{item.subtitle}</p>
            {item.aiSummary && <p className="hero-summary">{item.aiSummary}</p>}
            <div className="hero-actions">
              <button className="hero-btn hero-btn-primary" onClick={() => onOpen?.(item.id)}>
                <ExternalLink size={14} /> Open
              </button>
              <button className="hero-btn" onClick={() => onShare?.(item.id)}>
                <Share2 size={14} /> Share
              </button>
              <button className="hero-btn" onClick={() => onAiBrief?.(item.id)}>
                <Sparkles size={14} /> AI Brief
              </button>
            </div>
          </div>

          <div className="hero-provider">
            <StorageProviderBadge provider={item.provider} />
          </div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="hero-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      )}

      <style>{`
        .hero-spotlight {
          position: relative;
          height: var(--hero-height);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        @media (max-width: 768px) { .hero-spotlight { height: var(--hero-height-mobile); } }
        .hero-spotlight-inner {
          position: absolute;
          inset: 0;
        }
        .hero-spotlight-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.3;
          filter: blur(2px);
        }
        .hero-spotlight-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, var(--bg-card) 40%, transparent 100%);
        }
        .hero-spotlight-content {
          position: relative;
          z-index: 1;
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          max-width: 60%;
        }
        .hero-venture-badge {
          display: inline-flex;
          align-self: flex-start;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          border: 1px solid;
          color: var(--text-secondary);
          margin-bottom: var(--space-sm);
        }
        .hero-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--cyan), var(--purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        .hero-subtitle {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .hero-summary {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: var(--space-sm);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hero-actions {
          display: flex;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }
        .hero-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s;
        }
        .hero-btn:hover { border-color: var(--border-active); color: var(--text-primary); }
        .hero-btn-primary {
          background: var(--cyan-glow);
          border-color: rgba(0,240,255,0.3);
          color: var(--cyan);
        }
        .hero-btn-primary:hover { box-shadow: 0 0 12px var(--cyan-glow); }
        .hero-provider {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          z-index: 1;
        }
        .hero-dots {
          position: absolute;
          bottom: var(--space-md);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .hero-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          opacity: 0.4;
          cursor: pointer;
          transition: all 0.2s;
        }
        .hero-dot.active {
          background: var(--cyan);
          opacity: 1;
          box-shadow: 0 0 8px var(--cyan-glow);
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cinema/HeroSpotlight.tsx
git commit -m "feat(cinema): add HeroSpotlight with auto-rotation, parallax, and AI Brief actions"
```

---

### Task 16: Wire Discover Mode into FilesView

**Files:**
- Create: `src/components/cinema/DiscoverView.tsx`
- Modify: `src/views/FilesView.tsx`

- [ ] **Step 1: Create DiscoverView**

```typescript
// src/components/cinema/DiscoverView.tsx

import { Clock, Flame, Sparkles, Bell, Calendar } from 'lucide-react';
import HeroSpotlight from './HeroSpotlight';
import CarouselRow from './CarouselRow';
import CinemaCard from './CinemaCard';

// Placeholder data until AI personalization is wired
const PLACEHOLDER_SPOTLIGHT = [
  {
    id: 'spotlight-1',
    title: 'Welcome to MCV Files',
    subtitle: 'Your unified data fabric across all ventures and storage providers',
    aiSummary: 'Upload files, connect storage providers, and let AI organize everything for you.',
    provider: 'supabase' as const,
    ventureLabel: 'MCV ONE',
    ventureColor: 'var(--cyan)',
  },
];

export default function DiscoverView() {
  return (
    <div className="discover-view">
      <HeroSpotlight items={PLACEHOLDER_SPOTLIGHT} />

      <CarouselRow title="Continue Working" icon={Clock} accentColor="var(--cyan)">
        <CinemaCard
          id="cw-1" title="Getting Started" meta="Just now · Supabase" provider="supabase"
          size="md"
        />
      </CarouselRow>

      <CarouselRow title="Hot Across Ventures" icon={Flame} accentColor="var(--error)">
        <CinemaCard
          id="hv-1" title="No trending files yet" meta="Upload to get started" provider="supabase"
          size="md"
        />
      </CarouselRow>

      <CarouselRow title="Recently Generated by AI" icon={Sparkles} accentColor="var(--purple)">
        <CinemaCard
          id="ai-1" title="No AI-generated content yet" meta="Use Aegis to generate" provider="supabase"
          size="md"
        />
      </CarouselRow>
    </div>
  );
}
```

- [ ] **Step 2: Update FilesView to use DiscoverView**

In `src/views/FilesView.tsx`, replace the discover placeholder with:

```typescript
import DiscoverView from '../components/cinema/DiscoverView';
```

And replace the discover-view div:

```typescript
      ) : (
        <DiscoverView />
      )}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cinema/DiscoverView.tsx src/views/FilesView.tsx
git commit -m "feat(cinema): add DiscoverView with hero spotlight and carousel rows"
```

---

## Phase 6: Google Drive Storage Kit

### Task 17: Google Drive Storage Provider Kit

**Files:**
- Create: `src/lib/storage/providers/gdrive.ts`
- Create: `src/lib/kits/builtin/storage-gdrive-kit.ts`

- [ ] **Step 1: Create the Google Drive storage provider**

```typescript
// src/lib/storage/providers/gdrive.ts

import type { KitExecutionContext } from '../../kits/types';
import type { StorageItem, ListOpts, StorageProviderId } from '../types';

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
```

- [ ] **Step 2: Create the Google Drive storage kit**

```typescript
// src/lib/kits/builtin/storage-gdrive-kit.ts

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
```

- [ ] **Step 3: Register kit in loader.ts**

```typescript
import { manifest as storageGdriveManifest, handlers as storageGdriveHandlers } from './builtin/storage-gdrive-kit';
// in builtinKits:
kit(storageGdriveManifest, storageGdriveHandlers),
```

- [ ] **Step 4: Add gdrive routing to orchestrator**

In `src/lib/storage/orchestrator.ts`, update the `listFiles` function:

```typescript
    case 'gdrive': {
      const { gdriveList } = await import('./providers/gdrive');
      return gdriveList(path, opts, ctx);
    }
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/providers/gdrive.ts src/lib/kits/builtin/storage-gdrive-kit.ts src/lib/kits/loader.ts src/lib/storage/orchestrator.ts
git commit -m "feat(storage): add Google Drive storage provider + kit with list and search"
```

---

## Phase 7-9: Remaining Phases (Summary Tasks)

> Phases 7-9 cover AI Pipeline, Audit System, Google RAG, and NFT Certification. These build on the foundation above and follow identical patterns. Listed as summary tasks to keep the plan actionable — each will be expanded when Phase 6 is complete.

### Task 18: Storage AI Kit (auto-tag, generate, search, brief)

**Files:**
- Create: `src/lib/kits/builtin/storage-ai-kit.ts`
- Create: `src/lib/storage/ai-pipeline.ts`

Implements: `analyze_file`, `generate_media`, `search_semantic`, `generate_brief`, `auto_tag`, `suggest_actions`, `batch_organize` tool handlers. Routes image analysis to Gemini Vision, text analysis to Claude. Auto-tag pipeline runs async after uploads.

- [ ] Implement AI pipeline with dual-brain routing (Claude for text, Gemini for vision)
- [ ] Create storage-ai-kit with 7 tool handlers
- [ ] Wire auto-tag trigger into file upload flow
- [ ] Register kit in loader.ts
- [ ] Commit

### Task 19: Audit Log System

**Files:**
- Create: `src/lib/storage/audit.ts`
- Create: `api/storage-audit.ts`
- Create: `src/components/files/AuditLogView.tsx`

Implements: `logAudit()` helper called from every storage operation. API route for querying audit entries with filters. Inline audit timeline in FilePreviewPanel. Full audit view with date range, export CSV.

- [ ] Create audit helper and API route
- [ ] Add `logAudit()` calls to all provider operations
- [ ] Build AuditLogView component with filters and timeline
- [ ] Commit

### Task 20: File Preview Panel

**Files:**
- Create: `src/components/files/FilePreviewPanel.tsx`

Implements: Slide-in panel from right with full file preview (image render, PDF first page, code syntax, audio waveform placeholder). Metadata section, tags, AI analysis, activity log (audit entries), action buttons (Open, Download, Move, Delete, Certify).

- [ ] Build FilePreviewPanel with motion slide-in
- [ ] Wire into FilesView (show when previewFileId is set)
- [ ] Connect audit log entries
- [ ] Commit

### Task 21: Google RAG Kit

**Files:**
- Create: `src/lib/kits/builtin/google-rag-kit.ts`
- Create: `api/google-rag.ts`
- Create: `src/hooks/use-rag.ts`

Implements: `google_file_search`, `google_rag_retrieve`, `google_rag_create_corpus` tool handlers. API route proxying to Google RAG API. Venture-to-corpus mapping. "Ask about this file" button in FilePreviewPanel.

- [ ] Create Google RAG API route
- [ ] Build google-rag-kit with 3 tools
- [ ] Add React Query hooks for RAG queries
- [ ] Wire "Ask about this file" into preview panel
- [ ] Commit

### Task 22: NFT Certification

**Files:**
- Create: `src/components/files/NFTCertificationPanel.tsx`
- Create: `src/lib/storage/certification.ts`

Implements: SHA-256 hashing via Web Crypto API. Solana NFT minting flow (placeholder until Anchor program is deployed). Certification panel UI with verification checks. "Certify On-Chain" action in FilePreviewPanel for approved/locked files.

- [ ] Create certification utility with SHA-256 hashing
- [ ] Build NFTCertificationPanel with verification UI
- [ ] Wire into FilePreviewPanel actions
- [ ] Commit

### Task 23: Supabase Migration for Storage Tables

**Files:**
- Create: `supabase/migration-storage.sql`

Implements: All tables from spec Section 11 — `storage_files`, `storage_compartments`, `storage_versions`, `storage_ai_analysis`, `storage_signals`, `storage_generations`, `storage_audit_log`, `storage_rag_corpora`. With indexes and RLS policies.

- [ ] Write full migration SQL
- [ ] Run migration via Supabase CLI or dashboard
- [ ] Commit

### Task 24: Integration Test — Full Flow Verification

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to Files view via NavRail
- [ ] Verify Browser tab loads with Supabase file listing
- [ ] Switch provider to Local, verify breadcrumbs update
- [ ] Toggle grid/list view
- [ ] Switch to Discover mode, verify HeroSpotlight renders
- [ ] Switch to a venture, verify Workspace view loads with category cards
- [ ] Test file upload via toolbar button
- [ ] Test file click → preview panel slides in
- [ ] Verify no console errors or TypeScript compilation issues

```bash
npm run build
```

- [ ] Commit any fixes

```bash
git add -A
git commit -m "feat: complete File Manager + Media Library + Cinema Discovery v1.0"
```

---

## File Map Summary

### New Files (32 total)

```
src/lib/storage/
├── types.ts                           # Task 1
├── orchestrator.ts                    # Task 5
├── providers/
│   ├── supabase.ts                    # Task 3
│   ├── local.ts                       # Task 4
│   └── gdrive.ts                      # Task 17
├── ai-pipeline.ts                     # Task 18
├── audit.ts                           # Task 19
└── certification.ts                   # Task 22

src/lib/kits/builtin/
├── storage-supabase-kit.ts            # Task 3
├── storage-local-kit.ts               # Task 4
├── storage-gdrive-kit.ts              # Task 17
├── storage-ai-kit.ts                  # Task 18
└── google-rag-kit.ts                  # Task 21

src/stores/files.ts                    # Task 2
src/hooks/use-files.ts                 # Task 6
src/hooks/use-rag.ts                   # Task 21
src/lib/animations.ts                  # Task 8

src/views/
├── FilesView.tsx                      # Task 12
└── VentureWorkspaceView.tsx           # Task 13

src/components/files/
├── StorageProviderBadge.tsx           # Task 9
├── StatusBadge.tsx                    # Task 9
├── StageProgressBar.tsx               # Task 9
├── BreadcrumbBar.tsx                  # Task 12
├── FileGrid.tsx                       # Task 12
├── FileCard.tsx                       # Task 12
├── FilePreviewPanel.tsx               # Task 20
├── AuditLogView.tsx                   # Task 19
└── NFTCertificationPanel.tsx          # Task 22

src/components/cinema/
├── CinemaCard.tsx                     # Task 10
├── CarouselRow.tsx                    # Task 11
├── HeroSpotlight.tsx                  # Task 15
└── DiscoverView.tsx                   # Task 16

src/styles/files.css                   # Task 12
api/storage-local.ts                   # Task 4
api/storage-audit.ts                   # Task 19
api/google-rag.ts                      # Task 21
supabase/migration-storage.sql         # Task 23
```

### Modified Files (5 total)

```
src/stores/navigation.ts              # Task 7 — add ViewIds
src/components/NavRail.tsx             # Task 7 — add nav items
src/App.tsx                            # Task 7 — add view routing
src/lib/kits/loader.ts                # Tasks 3,4,17 — register kits
src/styles/design-system.css           # Task 8 — add tokens
```
