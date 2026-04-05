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
