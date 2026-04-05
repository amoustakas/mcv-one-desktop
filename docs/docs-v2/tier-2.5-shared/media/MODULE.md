# @mcv/shared/media — Media Processing & Storage Module

**Parent Package:** @mcv/shared (maps to `@mcv/storage` in codebase)  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE (Phase 1)  
**Last Updated:** February 8, 2026

---

## Purpose

The `media` module provides comprehensive media asset management for the MCV.ONE platform: file upload with signed-URL direct-to-cloud flows, image processing (resize, crop, format conversion, optimization, blur placeholders), variant generation (thumbnails through zoom-resolution), folder-based organization, per-venture storage quota enforcement, MIME type validation and categorization, EXIF metadata extraction, and multi-provider storage abstraction (Supabase Storage, Google Cloud Storage, S3/R2). All image processing runs through Sharp with automatic WebP/AVIF conversion. The module exposes both server-side services and React client hooks/components for a complete upload-to-CDN pipeline.

**Every image, video, audio, and document file uploaded to any MCV venture flows through this module for storage, processing, optimization, and delivery.**

---

## Exports

### Server Exports (`@mcv/storage/server`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE PROVIDER ABSTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getStorageProvider,            // Get singleton Supabase storage provider
  resetStorageProvider,          // Reset provider (testing)
  SupabaseStorageProvider,       // Supabase Storage implementation
} from './providers/supabase-storage';

export type { StorageProvider } from './providers/provider-interface';

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CLOUD STORAGE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getGCSClient,                  // Get initialized GCS Storage client
  uploadFile as gcsUploadFile,   // Upload buffer to GCS bucket
  getSignedUploadUrl,            // Generate signed PUT URL (15min expiry)
  getSignedDownloadUrl,          // Generate signed GET URL (1hr expiry)
  getPublicUrl,                  // Get public or CDN URL for a file
  deleteFile as gcsDeleteFile,   // Delete file from GCS bucket
} from '../lib/gcs-client';

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE SERVICE (CRUD + Upload Pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  uploadFile as uploadFileService,   // Full upload pipeline (validate → process → store → record)
  getFile,                           // Get file by ID with URLs
  listFiles,                         // List files with filtering + pagination
  deleteFile as deleteFileService,   // Soft-delete file + remove from storage
  getSignedUrl,                      // Get signed download URL for private file
  updateFile,                        // Update file metadata / visibility / folder
  createFolder,                      // Create organizational folder
  listFolders,                       // List folders for a venture
  deleteFolder,                      // Delete folder (moves files to root)
  renameFolder,                      // Rename folder + regenerate slug
} from './services/storage-service';

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  processImage,                  // Process image → generate multiple variants
  getImageDimensions,            // Extract width × height from buffer
  optimizeImage,                 // Optimize single image (resize, format, quality)
  getImageExif,                  // Extract raw EXIF data
  generateBlurPlaceholder,       // Generate tiny base64 blur placeholder (LQIP)
} from './services/image-processor';

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getQuotaInfo,                  // Get venture storage quota with usage
  checkQuota,                    // Check if upload is allowed (size + quota)
  updateQuotaUsage,              // Increment/decrement used storage
  updateQuotaLimits,             // Admin: change quota limits
  recalculateQuotaUsage,         // Recalculate from actual files (repair drift)
  type QuotaInfo,
  type QuotaCheckResult,
} from './services/quota-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MIME TYPE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  validateMimeType,              // Check MIME against allowlist
  getMimeCategory,               // Classify: image | document | video | audio | other
  getMimeFriendlyName,           // Human-readable name ('JPEG Image')
  getMimeIcon,                   // Icon identifier for UI rendering
} from './utils/mime-types';
```

### Client Exports (`@mcv/storage/client`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  useUpload,                     // Upload files with progress tracking
  useFiles,                      // Fetch paginated file list (React Query)
  useInfiniteFiles,              // Infinite-scroll file list
  useFile,                       // Fetch single file by ID
  useSignedUrl,                  // Get time-limited signed URL
  useDeleteFile,                 // Delete file mutation
  useUpdateFile,                 // Update file metadata mutation
  useStorageQuota,               // Fetch venture storage quota
  useFolders,                    // Fetch folder list
  useCreateFolder,               // Create folder mutation
  useRenameFolder,               // Rename folder mutation
  useDeleteFolder,               // Delete folder mutation
  type StorageQuotaInfo,
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════════
// REACT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  FileUpload,                    // Basic file upload button
  ImageUpload,                   // Image-specific upload with preview
  AvatarUpload,                  // Circular avatar upload with crop
  FilePreview,                   // File thumbnail/icon preview
  FileCard,                      // File card with metadata display
  FileManager,                   // Full file browser with folders
} from './components';
```

### Type & Constant Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (re-exported from @mcv/db)
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  File,                          // Full file database record
  NewFile,                       // Insert type for files table
  FileFolder,                    // Folder database record
  NewFileFolder,                 // Insert type for folders table
  StorageQuota,                  // Quota database record
  FileVariant,                   // Variant metadata (name, path, dimensions, size)
  FileMetadata,                  // JSONB metadata (alt, caption, tags, exif)
  FileStatus,                    // 'pending' | 'processing' | 'ready' | 'failed' | 'deleted'
  FileVisibility,                // 'public' | 'private' | 'signed'
} from '@mcv/db';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  FileWithUrl,                   // File + computed url, signedUrl, thumbnailUrl
  FileVariantWithUrl,            // Variant + computed URL
  FileFilters,                   // Filtering options for list queries
  FilePagination,                // Page, pageSize, sortBy, sortOrder
  FileListResponse,              // Paginated response { files, total, hasMore }
  FolderWithCounts,              // Folder + fileCount, childCount, totalSize
  UploadOptions,                 // Upload configuration (bucket, folder, variants, etc.)
  ImageVariantConfig,            // Variant definition (name, dimensions, format, quality)
  UploadProgress,                // Progress tracking { fileId, progress, status }
  UploadResult,                  // Upload outcome { success, file?, error? }
  BatchUploadResult,             // Batch result { successful[], failed[] }
  StorageConfig,                 // Provider config (supabase | s3 | r2)
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ALLOWED_IMAGE_TYPES,           // ['image/jpeg', 'image/png', 'image/gif', ...]
  ALLOWED_DOCUMENT_TYPES,        // ['application/pdf', 'application/msword', ...]
  ALLOWED_VIDEO_TYPES,           // ['video/mp4', 'video/webm', ...]
  ALLOWED_AUDIO_TYPES,           // ['audio/mpeg', 'audio/wav', ...]
  ALL_ALLOWED_TYPES,             // Union of all allowed MIME types
  FILE_SIZE_LIMITS,              // { avatar: 5MB, image: 10MB, document: 50MB, video: 500MB }
  DEFAULT_IMAGE_VARIANTS,        // [thumbnail 150px, small 400px, medium 800px, large 1600px]
  AVATAR_VARIANTS,               // [small 48px, medium 96px, large 256px]
  formatBytes,                   // Helper: bytes → '4.2 MB'
  isImageMimeType,               // Check if MIME is image/*
  isVideoMimeType,               // Check if MIME is video/*
  isAudioMimeType,               // Check if MIME is audio/*
  isDocumentMimeType,            // Check if MIME is document type
  getExtensionFromMimeType,      // MIME → file extension
  getMimeTypeFromExtension,      // Extension → MIME type
} from './types/config';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                     MEDIA PROCESSING & STORAGE ARCHITECTURE                           │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          CLIENT LAYER (React)                                  │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐     │   │
│  │  │  FileUpload  │  │ ImageUpload  │  │ AvatarUpload │  │  FileManager  │     │   │
│  │  │  (basic)     │  │ (preview)    │  │ (crop)       │  │ (browse all)  │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘     │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘               │   │
│  │                                    │                                           │   │
│  │  ┌─────────────────────────────────┼──────────────────────────────────────┐   │   │
│  │  │             REACT HOOKS         │                                      │   │   │
│  │  │                                 │                                      │   │   │
│  │  │  useUpload ──── useFiles ──── useStorageQuota ──── useFolders         │   │   │
│  │  │  (progress)     (paginated)    (quota info)        (hierarchy)         │   │   │
│  │  └─────────────────────────────────┼──────────────────────────────────────┘   │   │
│  │                                    │                                           │   │
│  └────────────────────────────────────┼───────────────────────────────────────────┘   │
│                                       │                                               │
│                              POST /api/storage/upload                                 │
│                              FormData (multipart)                                     │
│                                       │                                               │
│  ┌────────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                       SERVER UPLOAD PIPELINE                                    │   │
│  │                                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐          │   │
│  │  │    1.       │  │    2.       │  │    3.       │  │    4.        │          │   │
│  │  │  Validate   │─▶│  Check      │─▶│  Process    │─▶│  Generate   │          │   │
│  │  │  & Parse    │  │  Quota      │  │  Image      │  │  Variants   │          │   │
│  │  │             │  │             │  │             │  │              │          │   │
│  │  │ • MIME type │  │ • File size │  │ • Optimize  │  │ • thumbnail │          │   │
│  │  │ • Allowlist │  │ • Available │  │ • Auto-     │  │ • small     │          │   │
│  │  │ • File size │  │   storage   │  │   orient    │  │ • medium    │          │   │
│  │  │             │  │ • Max file  │  │ • Format    │  │ • large     │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬───────┘          │   │
│  │                                                             │                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────▼──────────────┐   │   │
│  │  │    7.            │  │    6.            │  │    5.                      │   │   │
│  │  │  Update Quota    │◀─│  Insert DB       │◀─│  Upload to Storage        │   │   │
│  │  │                  │  │  Record          │  │                           │   │   │
│  │  │ • Add file size  │  │ • files table    │  │ • Original + all variants │   │   │
│  │  │ • Track usage    │  │ • variants JSONB │  │ • Content-type headers    │   │   │
│  │  └──────────────────┘  │ • status: ready  │  │ • Visibility setting      │   │   │
│  │                        └──────────────────┘  └────────────────────────────┘   │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      STORAGE PROVIDER LAYER                                      │   │
│  │                                                                                  │   │
│  │  ┌─────────────────────┐                                                        │   │
│  │  │  StorageProvider     │◀─── Interface (upload, delete, getSignedUrl,           │   │
│  │  │  (Abstract)          │     getPublicUrl, copy, move, exists, list, download)  │   │
│  │  └──────────┬──────────┘                                                        │   │
│  │             │                                                                    │   │
│  │  ┌──────────┴──────────────────────────────────────────────────────────┐        │   │
│  │  │                                                                     │        │   │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │        │   │
│  │  │  │ Supabase Storage │  │ Google Cloud      │  │ S3 / R2          │ │        │   │
│  │  │  │ (active)         │  │ Storage (GCS)     │  │ (planned)        │ │        │   │
│  │  │  │                  │  │                   │  │                  │ │        │   │
│  │  │  │ • upload         │  │ • uploadFile      │  │ • StorageConfig  │ │        │   │
│  │  │  │ • delete         │  │ • getSignedUpload │  │   interface      │ │        │   │
│  │  │  │ • getSignedUrl   │  │ • getSignedDown   │  │                  │ │        │   │
│  │  │  │ • getPublicUrl   │  │ • getPublicUrl    │  │                  │ │        │   │
│  │  │  │ • copy/move      │  │ • deleteFile      │  │                  │ │        │   │
│  │  │  │ • list/download  │  │ • CDN integration │  │                  │ │        │   │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────────┘ │        │   │
│  │  │                                                                     │        │   │
│  │  └─────────────────────────────────────────────────────────────────────┘        │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      IMAGE PROCESSING ENGINE                                     │   │
│  │                                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                        Sharp (libvips)                                   │    │   │
│  │  │                                                                          │    │   │
│  │  │  processImage()        optimizeImage()        getImageDimensions()       │    │   │
│  │  │  ├─ resize (fit modes) ├─ max dimensions      ├─ width × height         │    │   │
│  │  │  ├─ format convert     ├─ auto-orient (EXIF)  └─ from metadata          │    │   │
│  │  │  │  ├─ JPEG            ├─ quality control                                │    │   │
│  │  │  │  ├─ PNG             └─ format conversion    getImageExif()            │    │   │
│  │  │  │  ├─ WebP (default)                          ├─ raw EXIF base64       │    │   │
│  │  │  │  └─ AVIF                                    └─ camera, GPS, etc.     │    │   │
│  │  │  ├─ quality per format                                                   │    │   │
│  │  │  └─ withoutEnlargement  generateBlurPlaceholder()                        │    │   │
│  │  │                         ├─ 10×10 resize                                  │    │   │
│  │  │                         └─ data:image/png;base64 LQIP                    │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATABASE LAYER (PostgreSQL + Drizzle)                    │  │
│  │                                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │     files        │  │  file_folders    │  │ storage_quotas   │                │  │
│  │  │                  │  │                  │  │                  │                │  │
│  │  │ Original file    │  │ Folder hierarchy │  │ Per-venture      │                │  │
│  │  │ metadata, MIME,  │  │ for organizing   │  │ storage limits   │                │  │
│  │  │ dimensions,      │  │ media assets     │  │ and live usage   │                │  │
│  │  │ variants JSONB,  │  │ (self-referencing│  │ tracking         │                │  │
│  │  │ status, visibility│ │  parentId)       │  │                  │                │  │
│  │  │ soft-delete      │  │                  │  │ Defaults: 5GB    │                │  │
│  │  └──────────────────┘  └──────────────────┘  │ quota, 50MB max  │                │  │
│  │                                               └──────────────────┘                │  │
│  │  8 indexes on files table for query performance                                   │  │
│  │  Composite: (venture_id, folder_id) for folder browsing                           │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Upload → CDN

```
                                                   ┌─────────────────┐
 Browser                                           │  Google Cloud   │
 ┌────────┐  FormData    ┌────────┐  Signed URL   │  Storage (GCS)  │
 │ Client │─────────────▶│ Server │───────────────▶│                 │
 │        │              │        │               │  Raw bucket     │
 └────────┘              └───┬────┘               └────────┬────────┘
                             │                             │
                     ┌───────▼───────┐              GCF Trigger
                     │  Image        │                     │
                     │  Processing   │              ┌──────▼─────────┐
                     │  (Sharp)      │              │  Cloud Function │
                     │               │              │  (optimization) │
                     │  • optimize   │              │                 │
                     │  • variants   │              │  • WebP/AVIF    │
                     │  • blur hash  │              │  • Resize       │
                     └───────┬───────┘              └──────┬─────────┘
                             │                             │
                     ┌───────▼───────┐              ┌──────▼─────────┐
                     │  Supabase     │              │  Optimized     │
                     │  Storage      │              │  GCS Bucket    │
                     │  (variants)   │              │                │
                     └───────────────┘              └──────┬─────────┘
                                                           │
                                                    ┌──────▼─────────┐
                                                    │  Google Cloud  │
                                                    │  CDN           │
                                                    │                │
                                                    │  cdn.mcv.one/… │
                                                    └────────────────┘
```

---

## Core Interfaces

### StorageProvider (Abstract Interface)

```typescript
/**
 * Storage provider interface
 * Abstracts the underlying storage backend (Supabase, S3, R2, GCS, etc.)
 * All storage operations go through this interface for provider portability.
 */
interface StorageProvider {
  /** Upload a file to storage */
  upload(params: {
    bucket: string;
    path: string;
    file: Buffer | Blob;
    contentType: string;
    visibility: FileVisibility;
  }): Promise<{ path: string; url: string }>;

  /** Delete a file from storage */
  delete(params: {
    bucket: string;
    path: string;
  }): Promise<void>;

  /** Get a signed URL for a private file */
  getSignedUrl(params: {
    bucket: string;
    path: string;
    expiresIn?: number;               // seconds (default: 3600)
  }): Promise<string>;

  /** Get the public URL for a file */
  getPublicUrl(params: {
    bucket: string;
    path: string;
  }): string;

  /** Copy a file within storage */
  copy(params: {
    bucket: string;
    fromPath: string;
    toPath: string;
  }): Promise<void>;

  /** Move a file within storage */
  move(params: {
    bucket: string;
    fromPath: string;
    toPath: string;
  }): Promise<void>;

  /** Check if a file exists */
  exists(params: {
    bucket: string;
    path: string;
  }): Promise<boolean>;

  /** List files in a path */
  list(params: {
    bucket: string;
    path: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<{ name: string; size: number; updatedAt: Date }>>;

  /** Download a file to buffer */
  download(params: {
    bucket: string;
    path: string;
  }): Promise<Buffer>;
}
```

### StorageConfig

```typescript
/**
 * Multi-provider storage configuration.
 * Switch providers by changing the `provider` field — all operations
 * route through the StorageProvider interface automatically.
 */
interface StorageConfig {
  provider: 'supabase' | 's3' | 'r2';
  publicUrl: string;

  // Supabase specific
  supabase?: {
    url: string;
    serviceKey: string;
  };

  // S3/R2 specific
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;                  // Custom endpoint for R2
  };
}
```

### File (Database Record)

```typescript
/**
 * Complete file record as stored in the `files` table.
 * Inferred from Drizzle schema — every field maps to a DB column.
 */
interface File {
  id: UUID;                             // Primary key (auto-generated UUIDv4)

  // ── Ownership ──────────────────────────────────────────────────────────
  ventureId: UUID | null;               // Owning venture (cascade delete)
  uploadedById: UUID | null;            // Uploading user (set null on delete)

  // ── File Identity ──────────────────────────────────────────────────────
  name: string;                         // Display name (may be renamed)
  originalName: string;                 // Original filename at upload time
  path: string | null;                  // Legacy path (Supabase)
  gcsPath: string;                      // Relative path in GCS bucket
  originalBucket: string | null;        // GCS raw bucket name
  optimizedBucket: string | null;       // GCS optimized bucket name
  bucket: string;                       // Active bucket name (default: 'files')

  // ── File Metadata ──────────────────────────────────────────────────────
  mimeType: string;                     // MIME type (e.g., 'image/jpeg')
  size: number;                         // Size in bytes (bigint)

  // ── Image Specific ─────────────────────────────────────────────────────
  width: number | null;                 // Image/video width (px)
  height: number | null;                // Image/video height (px)
  altText: string | null;               // Accessibility alt text
  description: string | null;           // User description
  tags: string[];                       // JSONB string array (default: [])

  // ── Processing ─────────────────────────────────────────────────────────
  status: FileStatus;                   // 'pending' | 'processing' | 'ready' | 'failed' | 'deleted'
  processingError: string | null;       // Error message if status = 'failed'

  // ── Access Control ─────────────────────────────────────────────────────
  visibility: FileVisibility;           // 'public' | 'private' | 'signed'

  // ── Variants ───────────────────────────────────────────────────────────
  variants: Record<string, string>;     // JSONB: variant name → URL/path

  // ── Metadata ───────────────────────────────────────────────────────────
  metadata: FileMetadata | null;        // JSONB: alt, caption, tags, exif, etc.

  // ── Organization ───────────────────────────────────────────────────────
  folderId: UUID | null;                // Parent folder (set null on folder delete)

  // ── Lifecycle ──────────────────────────────────────────────────────────
  deletedAt: ISOTimestamp | null;       // Soft-delete timestamp
  createdAt: ISOTimestamp;              // Upload timestamp
  updatedAt: ISOTimestamp;              // Last modification
}

type FileStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
type FileVisibility = 'public' | 'private' | 'signed';
```

### FileVariant

```typescript
/**
 * Metadata for a processed image variant (stored as JSONB in files.variants).
 */
interface FileVariant {
  name: string;                         // e.g., 'thumbnail', 'medium', 'large'
  path: string;                         // Storage path (relative to bucket)
  width?: number;                       // Variant width (px)
  height?: number;                      // Variant height (px)
  size: number;                         // Variant file size (bytes)
}

/** FileVariant enriched with a computed URL for client consumption */
interface FileVariantWithUrl extends FileVariant {
  url: string;                          // Public or signed URL
}
```

### FileMetadata

```typescript
/**
 * Extensible metadata stored as JSONB on each file record.
 * Supports arbitrary keys for custom venture-specific fields.
 */
interface FileMetadata {
  alt?: string;                         // Accessibility alt text
  caption?: string;                     // Display caption
  description?: string;                 // Detailed description
  tags?: string[];                      // Categorization tags
  exif?: Record<string, unknown>;       // Raw EXIF data (base64 encoded)
  [key: string]: unknown;               // Venture-specific extensions
}
```

### FileWithUrl

```typescript
/**
 * File record enriched with computed URLs for client delivery.
 * This is what React hooks return — never raw database records.
 */
interface FileWithUrl extends Omit<File, 'variants'> {
  url: string;                          // Public URL (or empty for private)
  signedUrl?: string;                   // Time-limited signed URL
  thumbnailUrl?: string;                // Quick-access thumbnail variant URL
  variants?: FileVariantWithUrl[];      // All variants with URLs
}
```

### ImageVariantConfig

```typescript
/**
 * Configuration for generating an image variant.
 * Used in DEFAULT_IMAGE_VARIANTS, AVATAR_VARIANTS, and custom pipelines.
 */
interface ImageVariantConfig {
  name: string;                         // Variant identifier
  width?: number;                       // Target width (px)
  height?: number;                      // Target height (px)
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;                     // Output quality (1-100)
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}
```

### UploadOptions

```typescript
/**
 * Configuration for the upload pipeline.
 * Controls validation, processing, and storage behavior.
 */
interface UploadOptions {
  ventureId?: string;                   // Venture scope for quota
  bucket?: string;                      // Target bucket (default: 'files')
  folder?: string;                      // Logical folder path
  folderId?: string;                    // Database folder ID
  visibility?: FileVisibility;          // Access level (default: 'private')
  maxSize?: number;                     // Max file size in bytes
  allowedTypes?: string[];              // Allowed MIME types
  generateThumbnail?: boolean;          // Auto-generate thumbnails
  variants?: ImageVariantConfig[];      // Custom variant configs
  metadata?: Record<string, unknown>;   // Initial metadata
}
```

### UploadProgress

```typescript
/**
 * Real-time upload progress state tracked by useUpload hook.
 */
type UploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';

interface UploadProgress {
  fileId: string;                       // Client-generated UUID
  fileName: string;                     // Original file name
  progress: number;                     // 0-100
  status: UploadStatus;                 // Current phase
  error?: string;                       // Error message if status = 'error'
  file?: FileWithUrl;                   // Completed file record
}
```

### BatchUploadResult

```typescript
/**
 * Result of uploading multiple files.
 * Continues past individual failures — never all-or-nothing.
 */
interface BatchUploadResult {
  successful: FileWithUrl[];            // Files that uploaded + processed OK
  failed: Array<{
    name: string;                       // Original file name
    error: string;                      // Human-readable error
  }>;
}
```

### FileFilters & Pagination

```typescript
/**
 * Filtering options for file list queries.
 * All fields are optional — combine as needed.
 */
interface FileFilters {
  ventureId?: string;
  folderId?: string | null;             // null = root level only
  mimeType?: string | string[];         // Single type or array
  status?: FileStatus;
  visibility?: FileVisibility;
  uploadedById?: string;
  search?: string;                      // Case-insensitive name search (ILIKE)
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Pagination and sorting for file list queries.
 */
interface FilePagination {
  page?: number;                        // 1-indexed (default: 1)
  pageSize?: number;                    // Items per page (default: 20)
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';          // Default: 'desc'
}

/**
 * Paginated response returned by listFiles() and useFiles().
 */
interface FileListResponse {
  files: FileWithUrl[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### QuotaInfo & QuotaCheckResult

```typescript
/**
 * Storage quota information for a venture.
 * Returned by getQuotaInfo() and useStorageQuota().
 */
interface QuotaInfo {
  totalQuota: number;                   // Total allowed storage (bytes)
  usedStorage: number;                  // Current usage (bytes)
  availableStorage: number;             // Remaining capacity (bytes)
  maxFileSize: number;                  // Per-file size limit (bytes)
  usagePercentage: number;             // 0-100, rounded
}

/**
 * Result of a pre-upload quota check.
 */
interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;                      // Human-readable rejection reason
}
```

---

## Database Schema

### files Table

```typescript
export const files = pgTable('files', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // OWNERSHIP
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture that owns this file (cascade: venture delete removes all files)
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' }),

  // User who uploaded (set null if user is deleted — file survives)
  uploadedById: uuid('uploaded_by_id')
    .references(() => users.id, { onDelete: 'set null' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  name: text('name').notNull(),                    // Display name (renameable)
  originalName: text('original_name').notNull(),   // Immutable original filename
  path: text('path'),                              // Legacy Supabase path
  gcsPath: text('gcs_path').notNull(),             // GCS relative path
  originalBucket: text('original_bucket'),         // Raw upload bucket
  optimizedBucket: text('optimized_bucket'),       // Optimized output bucket
  bucket: text('bucket').notNull().default('files'),

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE-SPECIFIC COLUMNS
  // ═══════════════════════════════════════════════════════════════════════════

  width: bigint('width', { mode: 'number' }),
  height: bigint('height', { mode: 'number' }),
  altText: text('alt_text'),
  description: text('description'),
  tags: jsonb('tags').$type<string[]>().default([]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  status: fileStatusEnum('status').default('pending').notNull(),
  processingError: text('processing_error'),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  visibility: fileVisibilityEnum('visibility').default('private').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANTS (JSONB)
  // ═══════════════════════════════════════════════════════════════════════════

  // Map of variant name → storage path/URL
  // e.g., { "thumbnail": "ventures/abc/2026/01/photo_a1b2.webp" }
  variants: jsonb('variants').$type<Record<string, string>>().default({}),

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTENSIBLE METADATA (JSONB)
  // ═══════════════════════════════════════════════════════════════════════════

  metadata: jsonb('metadata').$type<FileMetadata>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLDER ORGANIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  folderId: uuid('folder_id')
    .references(() => fileFolders.id, { onDelete: 'set null' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // ── Performance Indexes ────────────────────────────────────────────────
  index('files_venture_idx').on(table.ventureId),
  index('files_uploaded_by_idx').on(table.uploadedById),
  index('files_status_idx').on(table.status),
  index('files_folder_idx').on(table.folderId),
  index('files_path_idx').on(table.gcsPath),
  index('files_mime_type_idx').on(table.mimeType),
  index('files_created_at_idx').on(table.createdAt),
  // Composite: fast folder browsing within a venture
  index('files_venture_folder_idx').on(table.ventureId, table.folderId),
]);
```

### file_folders Table

```typescript
export const fileFolders = pgTable('file_folders', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Ownership (cascade: venture delete removes folders)
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .notNull(),

  // Folder identity
  name: text('name').notNull(),                    // Display name
  slug: text('slug').notNull(),                    // URL-safe slug (auto-generated)

  // Hierarchy (self-referencing for nested folders)
  parentId: uuid('parent_id'),                     // null = root folder

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('file_folders_venture_idx').on(table.ventureId),
  index('file_folders_parent_idx').on(table.parentId),
  index('file_folders_slug_idx').on(table.ventureId, table.slug),
]);
```

### storage_quotas Table

```typescript
export const storageQuotas = pgTable('storage_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),

  // One quota record per venture (unique constraint)
  ventureId: uuid('venture_id')
    .references(() => ventures.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),

  // ── Limits (in bytes) ──────────────────────────────────────────────────
  totalQuota: bigint('total_quota', { mode: 'number' })
    .notNull()
    .default(5368709120),               // 5 GB default
  usedStorage: bigint('used_storage', { mode: 'number' })
    .notNull()
    .default(0),
  maxFileSize: bigint('max_file_size', { mode: 'number' })
    .notNull()
    .default(52428800),                 // 50 MB default

  // Timestamps
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('storage_quotas_venture_idx').on(table.ventureId),
]);
```

### Enums

```typescript
export const fileStatusEnum = pgEnum('file_status', [
  'pending',      // Upload initiated, not yet processed
  'processing',   // Image optimization / variant generation in progress
  'ready',        // All processing complete, file is available
  'failed',       // Processing pipeline failed (see processingError column)
  'deleted',      // Soft-deleted (deletedAt timestamp set)
]);

export const fileVisibilityEnum = pgEnum('file_visibility', [
  'public',       // Accessible via direct public URL (no auth required)
  'private',      // Requires authentication — served via API
  'signed',       // Requires time-limited signed URL (default: 1 hour)
]);
```

### Relations

```typescript
export const filesRelations = relations(files, ({ one }) => ({
  venture: one(ventures, {
    fields: [files.ventureId],
    references: [ventures.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
  folder: one(fileFolders, {
    fields: [files.folderId],
    references: [fileFolders.id],
  }),
}));

export const fileFoldersRelations = relations(fileFolders, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [fileFolders.ventureId],
    references: [ventures.id],
  }),
  parent: one(fileFolders, {
    fields: [fileFolders.parentId],
    references: [fileFolders.id],
    relationName: 'folderHierarchy',
  }),
  children: many(fileFolders, { relationName: 'folderHierarchy' }),
  files: many(files),
}));

export const storageQuotasRelations = relations(storageQuotas, ({ one }) => ({
  venture: one(ventures, {
    fields: [storageQuotas.ventureId],
    references: [ventures.id],
  }),
}));
```

---

## Built-in Variant Presets

### DEFAULT_IMAGE_VARIANTS

Standard variants generated for every image upload (when `generateThumbnail: true`):

| Variant | Width | Height | Fit | Format | Quality | Use Case |
|---------|-------|--------|-----|--------|---------|----------|
| `thumbnail` | 150 | 150 | cover | WebP | 80 | Grid previews, file browser |
| `small` | 400 | 400 | inside | WebP | 85 | Inline content, cards |
| `medium` | 800 | 800 | inside | WebP | 85 | Standard display, blog posts |
| `large` | 1600 | 1600 | inside | WebP | 90 | Hero images, full-width |

### AVATAR_VARIANTS

Square-cropped variants for profile photos and user avatars:

| Variant | Width | Height | Fit | Format | Quality | Use Case |
|---------|-------|--------|-----|--------|---------|----------|
| `small` | 48 | 48 | cover | WebP | 80 | Comment avatars, lists |
| `medium` | 96 | 96 | cover | WebP | 85 | Sidebar, nav bar |
| `large` | 256 | 256 | cover | WebP | 90 | Profile page, settings |

---

## Supported MIME Types & File Size Limits

### Allowed Image Types

| MIME Type | Extension | Notes |
|-----------|-----------|-------|
| `image/jpeg` | .jpg, .jpeg | Most common upload format |
| `image/png` | .png | Alpha channel preserved |
| `image/gif` | .gif | Animated GIF supported |
| `image/webp` | .webp | Default output format |
| `image/svg+xml` | .svg | Passed through (no processing) |
| `image/avif` | .avif | Best compression ratio |

### Allowed Video Types

| MIME Type | Extension | Notes |
|-----------|-----------|-------|
| `video/mp4` | .mp4 | Universal playback |
| `video/webm` | .webm | Web-optimized |
| `video/ogg` | .ogv | Open format |
| `video/quicktime` | .mov | iPhone/Mac source |

### Allowed Audio Types

| MIME Type | Extension | Notes |
|-----------|-----------|-------|
| `audio/mpeg` | .mp3 | Universal playback |
| `audio/wav` | .wav | Lossless |
| `audio/ogg` | .ogg | Open format |
| `audio/webm` | .weba | Web-optimized |

### Allowed Document Types

| MIME Type | Extension | Notes |
|-----------|-----------|-------|
| `application/pdf` | .pdf | PDF documents |
| `application/msword` | .doc | Word (legacy) |
| `application/vnd.openxmlformats-...wordprocessingml.document` | .docx | Word |
| `application/vnd.ms-excel` | .xls | Excel (legacy) |
| `application/vnd.openxmlformats-...spreadsheetml.sheet` | .xlsx | Excel |
| `application/vnd.ms-powerpoint` | .ppt | PowerPoint (legacy) |
| `application/vnd.openxmlformats-...presentationml.presentation` | .pptx | PowerPoint |
| `text/plain` | .txt | Plain text |
| `text/csv` | .csv | CSV data |

### File Size Limits

| Category | Max Size | Notes |
|----------|----------|-------|
| Avatar | 5 MB | Profile photos, user icons |
| Image | 10 MB | Standard image uploads |
| Document | 50 MB | PDFs, Office documents |
| Video | 500 MB | Video uploads |
| Default | 50 MB | Fallback for unrecognized types |

---

## Usage Examples

### Example 1: Upload a File with Variant Generation

```typescript
import {
  uploadFileService,
  DEFAULT_IMAGE_VARIANTS,
} from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Full upload pipeline: validate → quota check → optimize → variants → store
// ═══════════════════════════════════════════════════════════════════════════════

const result = await uploadFileService({
  file: imageBuffer,
  fileName: 'product-hero.jpg',
  mimeType: 'image/jpeg',
  size: imageBuffer.byteLength,
  ventureId: 'venture-uuid-here',
  uploadedById: 'user-uuid-here',
  options: {
    bucket: 'files',
    visibility: 'public',
    generateThumbnail: true,              // Uses DEFAULT_IMAGE_VARIANTS
    metadata: {
      alt: 'Red sneakers on white background',
      tags: ['product', 'shoes', 'hero'],
    },
  },
});

if (result.success) {
  console.log('File ID:', result.file!.id);
  console.log('Public URL:', result.file!.url);
  console.log('Thumbnail:', result.file!.thumbnailUrl);
  console.log('Variants:', result.file!.variants?.length);
  // File ID: a1b2c3d4-...
  // Public URL: https://...supabase.co/storage/v1/object/public/files/...
  // Thumbnail: https://...supabase.co/storage/v1/object/public/files/.../variants/photo_thumb.webp
  // Variants: 4
} else {
  console.error('Upload failed:', result.error);
  // "Insufficient storage. Available: 2.1 MB, Required: 5.3 MB"
  // "File type application/zip is not allowed"
}
```

### Example 2: Image Processing with Custom Variants

```typescript
import { processImage } from '@mcv/storage/server';
import type { ImageVariantConfig } from '@mcv/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate custom variants for a product catalog
// ═══════════════════════════════════════════════════════════════════════════════

const productVariants: ImageVariantConfig[] = [
  { name: 'cart-thumb',  width: 80,   height: 80,   fit: 'cover',  format: 'webp', quality: 75 },
  { name: 'card',        width: 300,  height: 300,  fit: 'cover',  format: 'webp', quality: 85 },
  { name: 'detail',      width: 800,                fit: 'inside', format: 'webp', quality: 90 },
  { name: 'zoom',        width: 2000,               fit: 'inside', format: 'jpeg', quality: 95 },
  { name: 'og-image',    width: 1200, height: 630,  fit: 'cover',  format: 'jpeg', quality: 85 },
];

const variants = await processImage({
  buffer: imageBuffer,
  originalPath: 'ventures/abc/2026/02/sneakers_a1b2c3d4.jpg',
  bucket: 'files',
  variants: productVariants,
  ventureId: 'venture-uuid',
});

for (const variant of variants) {
  console.log(`${variant.name}: ${variant.width}x${variant.height} — ${variant.size} bytes`);
}
// cart-thumb: 80x80 — 1,240 bytes
// card: 300x300 — 8,450 bytes
// detail: 800x600 — 42,300 bytes
// zoom: 2000x1500 — 285,000 bytes
// og-image: 1200x630 — 68,200 bytes
```

### Example 3: Optimize Image for Web Delivery

```typescript
import { optimizeImage } from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Optimize a single image: auto-orient, resize, convert to WebP
// ═══════════════════════════════════════════════════════════════════════════════

const optimized = await optimizeImage(rawBuffer, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'webp',
});

console.log(`Original: ${rawBuffer.byteLength} bytes (${rawBuffer.byteLength / 1024}KB)`);
console.log(`Optimized: ${optimized.byteLength} bytes (${optimized.byteLength / 1024}KB)`);
console.log(`Savings: ${((1 - optimized.byteLength / rawBuffer.byteLength) * 100).toFixed(1)}%`);
// Original: 2,450,000 bytes (2392KB)
// Optimized: 185,000 bytes (181KB)
// Savings: 92.4%

// AVIF for maximum compression (slower encode, smaller files)
const avifOptimized = await optimizeImage(rawBuffer, {
  maxWidth: 1920,
  quality: 75,
  format: 'avif',
});
// AVIF output: ~120,000 bytes — 95.1% smaller than original JPEG
```

### Example 4: EXIF Extraction and Blur Placeholder

```typescript
import {
  getImageExif,
  getImageDimensions,
  generateBlurPlaceholder,
} from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Extract metadata for display and generate LQIP placeholder
// ═══════════════════════════════════════════════════════════════════════════════

// Get dimensions
const dims = await getImageDimensions(photoBuffer);
if (dims) {
  console.log(`Dimensions: ${dims.width}×${dims.height}`);
  console.log(`Aspect ratio: ${(dims.width / dims.height).toFixed(2)}`);
  // Dimensions: 4032×3024
  // Aspect ratio: 1.33
}

// Extract EXIF
const exif = await getImageExif(photoBuffer);
if (exif) {
  console.log('EXIF data available:', Object.keys(exif));
  // EXIF data available: ['raw']
  // Raw EXIF is base64-encoded for safe JSON serialization
}

// Generate blur placeholder (Low-Quality Image Placeholder)
const blurDataUrl = await generateBlurPlaceholder(photoBuffer);
console.log('Blur placeholder:', blurDataUrl.substring(0, 50) + '...');
// Blur placeholder: data:image/png;base64,iVBORw0KGgoAAAAN...

// Use in HTML for progressive loading:
// <img src={blurDataUrl} data-src={fullUrl} class="lazy" />
```

### Example 5: Storage Quota Management

```typescript
import {
  getQuotaInfo,
  checkQuota,
  updateQuotaLimits,
  recalculateQuotaUsage,
} from '@mcv/storage/server';
import { formatBytes } from '@mcv/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// Query and manage per-venture storage quotas
// ═══════════════════════════════════════════════════════════════════════════════

const quota = await getQuotaInfo('venture-uuid');
console.log(`Storage: ${formatBytes(quota.usedStorage)} / ${formatBytes(quota.totalQuota)}`);
console.log(`Available: ${formatBytes(quota.availableStorage)}`);
console.log(`Usage: ${quota.usagePercentage}%`);
console.log(`Max file: ${formatBytes(quota.maxFileSize)}`);
// Storage: 1.8 GB / 5 GB
// Available: 3.2 GB
// Usage: 36%
// Max file: 50 MB

// Pre-check before upload
const check = await checkQuota('venture-uuid', 15 * 1024 * 1024); // 15MB
if (!check.allowed) {
  console.error(check.reason);
  // "File size exceeds maximum allowed size of 50 MB"
  // "Insufficient storage. Available: 200 KB, Required: 15 MB"
}

// Admin: upgrade a venture to 20GB quota with 100MB max file
await updateQuotaLimits('venture-uuid', {
  totalQuota: 20 * 1024 * 1024 * 1024,   // 20GB
  maxFileSize: 100 * 1024 * 1024,         // 100MB
});

// Repair quota drift (recalculate from actual files)
const actualUsage = await recalculateQuotaUsage('venture-uuid');
console.log(`Recalculated usage: ${formatBytes(actualUsage)}`);
```

### Example 6: GCS Direct Upload with Signed URLs

```typescript
import {
  getSignedUploadUrl,
  getSignedDownloadUrl,
  getPublicUrl,
  gcsDeleteFile,
} from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Google Cloud Storage operations for direct client uploads
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Server generates a signed PUT URL (15-minute expiry)
const uploadUrl = await getSignedUploadUrl(
  'ventures/abc/2026/02/hero-banner.jpg',
  'image/jpeg'
);
// Client uploads directly to GCS: fetch(uploadUrl, { method: 'PUT', body: file })

// Step 2: Get public URL (uses CDN if IMAGE_CDN_BASE_URL is set)
const publicUrl = getPublicUrl('ventures/abc/2026/02/hero-banner.jpg', true);
// With CDN: "https://cdn.mcv.one/ventures/abc/2026/02/hero-banner.jpg"
// Without: "https://storage.googleapis.com/mcv-optimized/ventures/abc/..."

// Step 3: Generate signed download URL for private files (1-hour expiry)
const downloadUrl = await getSignedDownloadUrl(
  'ventures/abc/2026/02/confidential-report.pdf'
);
// Signed URL with v4 signature, expires in 1 hour

// Step 4: Delete file from GCS
const deleted = await gcsDeleteFile('ventures/abc/2026/02/hero-banner.jpg');
console.log(deleted ? 'Deleted' : 'Already gone (404)');
```

### Example 7: MIME Type Validation and Categorization

```typescript
import {
  validateMimeType,
  getMimeCategory,
  getMimeFriendlyName,
  getMimeIcon,
  isImageMimeType,
  isVideoMimeType,
  getExtensionFromMimeType,
  getMimeTypeFromExtension,
} from '@mcv/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// Validate and categorize files by MIME type
// ═══════════════════════════════════════════════════════════════════════════════

// Validate against global allowlist
validateMimeType('image/jpeg');            // true
validateMimeType('application/zip');       // false

// Validate against custom allowlist
validateMimeType('image/webp', ['image/jpeg', 'image/png']);  // false

// Categorize
getMimeCategory('image/jpeg');             // 'image'
getMimeCategory('application/pdf');        // 'document'
getMimeCategory('video/mp4');              // 'video'
getMimeCategory('audio/mpeg');             // 'audio'
getMimeCategory('application/zip');        // 'other'

// Display names for UI
getMimeFriendlyName('image/jpeg');                          // 'JPEG Image'
getMimeFriendlyName('application/vnd.openxmlformats-...'); // 'Word Document'
getMimeFriendlyName('video/quicktime');                     // 'QuickTime Video'

// Icon identifiers (for lucide-react, etc.)
getMimeIcon('image/png');                  // 'image'
getMimeIcon('application/pdf');            // 'file-text'
getMimeIcon('video/mp4');                  // 'video'
getMimeIcon('audio/wav');                  // 'music'

// Type guards
isImageMimeType('image/webp');             // true
isVideoMimeType('video/mp4');              // true

// Conversion utilities
getExtensionFromMimeType('image/jpeg');    // 'jpg'
getExtensionFromMimeType('video/quicktime'); // 'mov'
getMimeTypeFromExtension('xlsx');          // 'application/vnd.openxmlformats-...'
getMimeTypeFromExtension('mp3');           // 'audio/mpeg'
```

### Example 8: React Upload Hook with Progress

```tsx
import { useUpload, type UploadProgress } from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Upload files with real-time progress tracking
// ═══════════════════════════════════════════════════════════════════════════════

function ProductImageUploader({ ventureId }: { ventureId: string }) {
  const {
    upload,
    uploadMultiple,
    reset,
    progress,
    isUploading,
    error,
  } = useUpload({
    ventureId,
    bucket: 'files',
    visibility: 'public',
    generateThumbnail: true,
    variants: [
      { name: 'thumb', width: 200, height: 200, fit: 'cover', format: 'webp', quality: 80 },
      { name: 'display', width: 800, fit: 'inside', format: 'webp', quality: 85 },
    ],
    onProgress: (p: UploadProgress) => {
      console.log(`${p.fileName}: ${p.progress}% (${p.status})`);
    },
    onSuccess: (file) => {
      console.log('Uploaded:', file.url);
      console.log('Thumbnail:', file.thumbnailUrl);
    },
    onError: (err) => {
      console.error('Upload failed:', err);
    },
  });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 1) {
      await upload(files[0]);
    } else {
      const result = await uploadMultiple(files);
      console.log(`${result.successful.length} uploaded, ${result.failed.length} failed`);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={isUploading}
      />
      {progress && (
        <div>
          <span>{progress.fileName}</span>
          <progress value={progress.progress} max={100} />
          <span>{progress.status}</span>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {isUploading && <button onClick={reset}>Cancel</button>}
    </div>
  );
}
```

### Example 9: React File Browser with Folders

```tsx
import {
  useFiles,
  useInfiniteFiles,
  useFolders,
  useCreateFolder,
  useDeleteFile,
  useUpdateFile,
  useStorageQuota,
} from '@mcv/storage/client';
import { formatBytes } from '@mcv/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// Full file browser with folders, search, and quota display
// ═══════════════════════════════════════════════════════════════════════════════

function FileBrowser({ ventureId }: { ventureId: string }) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Quota info
  const { data: quota } = useStorageQuota(ventureId);

  // Folders
  const { data: folders } = useFolders({
    ventureId,
    parentId: currentFolder,
  });

  // Files (paginated)
  const { data: fileData, isLoading } = useFiles({
    filters: {
      ventureId,
      folderId: currentFolder,
      search: search || undefined,
    },
    pagination: { page: 1, pageSize: 24, sortBy: 'createdAt', sortOrder: 'desc' },
  });

  // Mutations
  const { mutate: deleteFile } = useDeleteFile();
  const { mutate: createFolder } = useCreateFolder();
  const { mutate: updateFile } = useUpdateFile();

  return (
    <div>
      {/* Quota bar */}
      {quota && (
        <div className="quota-bar">
          <span>{formatBytes(quota.usedStorage)} / {formatBytes(quota.totalQuota)}</span>
          <progress value={quota.usagePercentage} max={100} />
        </div>
      )}

      {/* Search */}
      <input
        placeholder="Search files..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Folders */}
      <div className="folders">
        {currentFolder && (
          <button onClick={() => setCurrentFolder(null)}>← Back to root</button>
        )}
        {folders?.map((folder) => (
          <div key={folder.id} onClick={() => setCurrentFolder(folder.id)}>
            📁 {folder.name}
          </div>
        ))}
        <button onClick={() => createFolder({
          ventureId,
          name: 'New Folder',
          parentId: currentFolder || undefined,
        })}>
          + New Folder
        </button>
      </div>

      {/* Files grid */}
      <div className="grid grid-cols-4 gap-4">
        {fileData?.files.map((file) => (
          <div key={file.id} className="file-card">
            {file.thumbnailUrl ? (
              <img src={file.thumbnailUrl} alt={file.name} />
            ) : (
              <span className="icon">{file.mimeType.split('/')[0]}</span>
            )}
            <p>{file.name}</p>
            <span>{formatBytes(file.size)}</span>
            <button onClick={() => deleteFile(file.id)}>Delete</button>
            <button onClick={() => updateFile({
              id: file.id,
              visibility: 'public',
            })}>
              Make Public
            </button>
          </div>
        ))}
      </div>

      {/* Pagination info */}
      {fileData && (
        <p>{fileData.total} files • Page {fileData.page} • {fileData.hasMore ? 'More →' : 'End'}</p>
      )}
    </div>
  );
}
```

### Example 10: Infinite Scroll Media Gallery

```tsx
import { useInfiniteFiles } from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Infinite-scroll image gallery using React Query
// ═══════════════════════════════════════════════════════════════════════════════

function MediaGallery({ ventureId }: { ventureId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteFiles({
    filters: {
      ventureId,
      mimeType: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      status: 'ready',
    },
  });

  // Flatten pages into single array
  const allFiles = data?.pages.flatMap((page) => page.files) ?? [];

  // Intersection observer for auto-loading
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading gallery...</div>;

  return (
    <div className="columns-3 gap-4">
      {allFiles.map((file) => (
        <div key={file.id} className="break-inside-avoid mb-4">
          <img
            src={file.thumbnailUrl || file.url}
            alt={file.name}
            width={file.width || undefined}
            height={file.height || undefined}
            loading="lazy"
          />
        </div>
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={loadMoreRef}>
        {isFetchingNextPage && <span>Loading more...</span>}
      </div>
    </div>
  );
}
```

### Example 11: Avatar Upload with Custom Variants

```tsx
import { useUpload } from '@mcv/storage/client';
import { AVATAR_VARIANTS } from '@mcv/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// Avatar upload with automatic square-crop variants
// ═══════════════════════════════════════════════════════════════════════════════

function AvatarUploader({
  ventureId,
  userId,
  onAvatarChange,
}: {
  ventureId: string;
  userId: string;
  onAvatarChange: (url: string) => void;
}) {
  const { upload, isUploading, progress } = useUpload({
    ventureId,
    bucket: 'avatars',
    visibility: 'public',
    variants: AVATAR_VARIANTS,   // [48×48, 96×96, 256×256] all WebP cover-crop
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,   // 5MB limit for avatars
    onSuccess: (file) => {
      // Use the medium (96×96) variant for UI
      const mediumVariant = file.variants?.find((v) => v.name === 'medium');
      onAvatarChange(mediumVariant?.url || file.url);
    },
    onError: (err) => alert(`Avatar upload failed: ${err}`),
  });

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="animate-pulse">Uploading {progress?.progress}%...</div>
      ) : (
        <div className="rounded-full w-24 h-24 bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
          📷 Change Avatar
        </div>
      )}
    </label>
  );
}
```

### Example 12: Signed URL for Private File Access

```tsx
import { useFile, useSignedUrl } from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Access a private file via time-limited signed URL
// ═══════════════════════════════════════════════════════════════════════════════

function PrivateDocumentViewer({ fileId }: { fileId: string }) {
  const { data: file, isLoading: fileLoading } = useFile(fileId);
  const { data: signedUrl, isLoading: urlLoading } = useSignedUrl(fileId, {
    expiresIn: 3600,   // 1 hour
  });

  if (fileLoading || urlLoading) return <div>Loading...</div>;
  if (!file) return <div>File not found</div>;

  return (
    <div>
      <h2>{file.name}</h2>
      <p>Type: {file.mimeType} • Size: {formatBytes(file.size)}</p>
      <p>Visibility: {file.visibility}</p>

      {file.mimeType === 'application/pdf' && signedUrl ? (
        <iframe src={signedUrl} className="w-full h-[80vh]" />
      ) : (
        <a href={signedUrl || '#'} download={file.originalName}>
          Download {file.originalName}
        </a>
      )}
    </div>
  );
}
```

### Example 13: File Metadata Update

```tsx
import { useFile, useUpdateFile } from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Edit file metadata: name, visibility, folder assignment
// ═══════════════════════════════════════════════════════════════════════════════

function FileEditor({ fileId }: { fileId: string }) {
  const { data: file } = useFile(fileId);
  const { mutate: updateFile, isPending } = useUpdateFile();

  if (!file) return null;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      updateFile({
        id: fileId,
        name: form.get('name') as string,
        visibility: form.get('visibility') as 'public' | 'private' | 'signed',
        metadata: {
          alt: form.get('alt') as string,
          description: form.get('description') as string,
        },
      });
    }}>
      <input name="name" defaultValue={file.name} />
      <input name="alt" defaultValue={file.metadata?.alt || ''} placeholder="Alt text" />
      <textarea name="description" defaultValue={file.metadata?.description || ''} />
      <select name="visibility" defaultValue={file.visibility}>
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="signed">Signed URL</option>
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Example 14: Folder Management

```tsx
import {
  useFolders,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
} from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Complete folder CRUD with nested hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

function FolderTree({ ventureId }: { ventureId: string }) {
  const [parentId, setParentId] = useState<string | null>(null);

  // Fetch folders at current level
  const { data: folders, isLoading } = useFolders({
    ventureId,
    parentId,
  });

  // Mutations
  const { mutate: createFolder } = useCreateFolder();
  const { mutate: renameFolder } = useRenameFolder();
  const { mutate: deleteFolder } = useDeleteFolder();

  if (isLoading) return <div>Loading folders...</div>;

  return (
    <div>
      {parentId && (
        <button onClick={() => setParentId(null)}>📁 ← Root</button>
      )}

      {folders?.map((folder) => (
        <div key={folder.id} className="flex items-center gap-2 p-2">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => setParentId(folder.id)}
          >
            📁 {folder.name}
          </span>
          <button onClick={() => {
            const newName = prompt('Rename folder:', folder.name);
            if (newName) renameFolder({ id: folder.id, name: newName });
          }}>
            ✏️
          </button>
          <button onClick={() => {
            if (confirm(`Delete "${folder.name}"? Files will move to root.`)) {
              deleteFolder({ id: folder.id, ventureId });
            }
          }}>
            🗑️
          </button>
        </div>
      ))}

      <button onClick={() => {
        const name = prompt('Folder name:');
        if (name) createFolder({ ventureId, name, parentId: parentId || undefined });
      }}>
        + New Folder
      </button>
    </div>
  );
}
```

### Example 15: Storage Provider Operations (Supabase)

```typescript
import { getStorageProvider } from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Low-level storage provider operations for advanced use cases
// ═══════════════════════════════════════════════════════════════════════════════

const provider = await getStorageProvider();

// Upload directly to storage (bypasses upload pipeline)
const { path, url } = await provider.upload({
  bucket: 'files',
  path: 'exports/2026/02/report.pdf',
  file: pdfBuffer,
  contentType: 'application/pdf',
  visibility: 'private',
});

// Check existence
const exists = await provider.exists({
  bucket: 'files',
  path: 'exports/2026/02/report.pdf',
});
console.log('File exists:', exists);    // true

// List files in directory
const dirFiles = await provider.list({
  bucket: 'files',
  path: 'exports/2026/02/',
  limit: 50,
  offset: 0,
});
console.log(`Found ${dirFiles.length} files`);

// Copy file
await provider.copy({
  bucket: 'files',
  fromPath: 'exports/2026/02/report.pdf',
  toPath: 'archives/2026/02/report-backup.pdf',
});

// Download to buffer
const downloaded = await provider.download({
  bucket: 'files',
  path: 'exports/2026/02/report.pdf',
});
console.log(`Downloaded ${downloaded.byteLength} bytes`);

// Get signed URL for private access
const signedUrl = await provider.getSignedUrl({
  bucket: 'files',
  path: 'exports/2026/02/report.pdf',
  expiresIn: 7200,   // 2 hours
});
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Image resize (single variant) | < 200ms | < 500ms | Sharp + libvips, memory-efficient |
| Image optimize (WebP) | < 500ms | < 1.5s | Includes auto-orient + format convert |
| 4-variant generation | < 800ms | < 2s | Parallel Sharp pipelines |
| Blur placeholder (LQIP) | < 50ms | < 100ms | 10×10 resize + base64 |
| Dimensions extraction | < 20ms | < 50ms | Metadata-only read |
| EXIF extraction | < 30ms | < 80ms | Metadata-only read |
| MIME validation | < 5ms | < 10ms | In-memory string lookup |
| GCS signed URL generation | < 100ms | < 300ms | GCS v4 signing |
| File upload (10MB image) | < 3s | < 8s | Network + processing + DB |
| File list query (100 files) | < 50ms | < 150ms | Indexed DB query |
| Quota check | < 20ms | < 50ms | Single row lookup |

### Resource Limits

| Resource | Default | Configurable | Notes |
|----------|---------|--------------|-------|
| Max image size | 10 MB | FILE_SIZE_LIMITS.image | Configurable per-type |
| Max video size | 500 MB | FILE_SIZE_LIMITS.video | Largest allowed |
| Max document size | 50 MB | FILE_SIZE_LIMITS.document | PDFs, Office docs |
| Max avatar size | 5 MB | FILE_SIZE_LIMITS.avatar | Profile photos |
| Storage quota (per venture) | 5 GB | storage_quotas.totalQuota | Admin-adjustable |
| Max file size (per venture) | 50 MB | storage_quotas.maxFileSize | Admin-adjustable |
| Max image dimensions | 2048×2048 | optimizeImage maxWidth/maxHeight | Input capping |
| React Query stale time (files) | 30s | useFiles staleTime | Cache freshness |
| React Query stale time (quota) | 60s | useStorageQuota staleTime | Less volatile |
| Signed URL expiry (upload) | 15 min | getSignedUploadUrl | GCS PUT URLs |
| Signed URL expiry (download) | 1 hour | getSignedDownloadUrl | GCS GET URLs |

### Optimization Strategies

1. **Sharp memory efficiency** — Sharp uses libvips which processes images in tiles/streams, never loading the entire image into RAM. A 50MP image uses ~50MB RAM vs. ~300MB for canvas-based libraries.

2. **Variant generation in sequence** — Variants are generated sequentially from the same optimized buffer to avoid duplicating the decode step. Each variant reuses the shared Sharp pipeline.

3. **Auto-orient first** — `sharp.rotate()` with no argument uses EXIF orientation, preventing inverted images on mobile uploads (common with iPhone photos).

4. **WebP as default output** — WebP provides 25-35% smaller files than JPEG at equivalent quality. All variants default to WebP with AVIF available for maximum compression.

5. **`withoutEnlargement: true`** — Prevents upscaling small images beyond their native resolution, avoiding blurry enlarged variants.

6. **CDN integration** — When `IMAGE_CDN_BASE_URL` is configured, `getPublicUrl()` returns CDN URLs. Set long cache TTLs (1 year) for content-hashed paths since variants are immutable.

7. **Lazy variant loading** — React components use `thumbnailUrl` for grid views and only load full-size URLs when the user clicks to expand. Pagination with `pageSize: 24` keeps initial loads fast.

8. **React Query caching** — All file queries go through React Query with 30-60s stale times. Mutations auto-invalidate related queries via `queryClient.invalidateQueries()`.

9. **Soft delete** — Files are soft-deleted (setting `deletedAt` and `status: 'deleted'`), keeping them recoverable. Actual storage cleanup can happen via a cron job.

10. **Streaming uploads** — Client-side uploads use FormData multipart or GCS signed PUT URLs for direct-to-cloud transfer, bypassing server memory for large files.

---

## Security Considerations

### File Validation

- **MIME allowlist** — Uploads are validated against explicit MIME type allowlists (`ALL_ALLOWED_TYPES`). Unknown types are rejected by default.
- **File size enforcement** — Per-type size limits enforced at upload time, before any processing. Configurable per-venture via `maxFileSize` in `storage_quotas`.
- **Extension validation** — `getMimeTypeFromExtension()` provides safe extension-to-MIME mapping. Never trust file extensions alone for security decisions.

### Storage Security

- **Signed URLs** — Private and signed-visibility files are never exposed via direct public URLs. Time-limited signed URLs (default: 1 hour download, 15 minutes upload) prevent link sharing.
- **Path sanitization** — Generated storage paths use `generatePath()` which replaces non-alphanumeric characters with underscores, adds UUID suffixes, and uses date-based directory structure to prevent collisions and path traversal.
- **Visibility enforcement** — Three visibility levels (`public`, `private`, `signed`) control URL generation behavior. The `addUrlsToFile()` helper returns empty URLs for private files, forcing callers through the signed-URL path.

### Image Processing Security

- **EXIF GPS stripping** — While raw EXIF is preserved for metadata queries, the optimized variants processed through Sharp have EXIF data stripped by default, removing GPS coordinates and personal information.
- **SVG passthrough** — SVG files are stored but not processed through Sharp to avoid SVG-based attack vectors. Applications consuming SVGs should implement their own sanitization (e.g., DOMPurify).
- **Image bomb protection** — `optimizeImage()` enforces `maxWidth`/`maxHeight` limits (default: 2048×2048) to prevent decompression bombs from consuming excessive memory.

### Access Control

- **Venture isolation** — All file operations are scoped by `ventureId`. Cross-venture file access is prevented at the database query level.
- **Quota enforcement** — Per-venture storage quotas prevent resource exhaustion. Quotas are checked before upload and updated atomically after successful storage.
- **Soft-delete safety** — Files are never hard-deleted through the API. The `deleteFile` service marks files as deleted and removes from storage, but database records persist for audit trails.

### GCS Credential Security

- **Service account credentials** — GCS credentials are loaded from environment variables (`GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`). In production, these should be managed via Google Secret Manager or injected by the orchestration platform.
- **Principle of least privilege** — The GCS service account should have only Storage Object Admin and Cloud Functions Invoker roles. Bucket-level IAM policies should restrict access to the specific raw and optimized buckets.

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `media.uploaded` | system | New file uploaded and processed | `{ fileId, ventureId, mimeType, size, variants }` |
| `media.processed` | system | Image optimization + variants complete | `{ fileId, variantCount, totalSize }` |
| `media.processing_failed` | system | Image processing failed | `{ fileId, error, mimeType }` |
| `media.deleted` | admin | File soft-deleted | `{ fileId, ventureId, fileName, size }` |
| `media.updated` | admin | File metadata or visibility changed | `{ fileId, changes: {} }` |
| `media.visibility_changed` | admin | File access level changed | `{ fileId, from, to }` |
| `media.folder_created` | admin | New folder created | `{ folderId, ventureId, name, parentId }` |
| `media.folder_deleted` | admin | Folder deleted (files moved to root) | `{ folderId, ventureId, movedFiles }` |
| `media.folder_renamed` | admin | Folder renamed | `{ folderId, oldName, newName }` |
| `media.quota_warning` | system | Storage usage exceeded 80% of quota | `{ ventureId, usagePercent, used, total }` |
| `media.quota_exceeded` | security | Upload rejected — quota exhausted | `{ ventureId, fileSize, available }` |
| `media.validation_failed` | security | File rejected by validation | `{ ventureId, mimeType, size, reason }` |
| `media.signed_url_generated` | system | Signed download URL created | `{ fileId, expiresIn }` |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE CLOUD STORAGE
# ═══════════════════════════════════════════════════════════════════════════════

GCS_PROJECT_ID=your-gcp-project-id                  # GCP project ID
GCS_CLIENT_EMAIL=sa@project.iam.gserviceaccount.com  # Service account email
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."   # Service account private key (newlines escaped)
GCS_BUCKET_NAME=mcv-media-raw                        # Raw upload bucket
GCS_OPTIMIZED_BUCKET_NAME=mcv-media-optimized        # Optimized output bucket

# ═══════════════════════════════════════════════════════════════════════════════
# SUPABASE STORAGE (Active provider)
# ═══════════════════════════════════════════════════════════════════════════════

SUPABASE_URL=https://your-project.supabase.co        # Supabase project URL
SUPABASE_SERVICE_KEY=eyJ...                          # Service role key (not anon key!)

# ═══════════════════════════════════════════════════════════════════════════════
# CDN & DELIVERY
# ═══════════════════════════════════════════════════════════════════════════════

IMAGE_CDN_BASE_URL=https://cdn.mcv.one               # CDN base URL (for optimized bucket)
IMAGE_OPTIMIZER_FUNCTION_REGION=us-central1           # GCF region for image optimizer
IMAGE_OPTIMIZER_FUNCTION_NAME=mcv-image-optimizer     # GCF function name

# ═══════════════════════════════════════════════════════════════════════════════
# PROCESSING DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

MEDIA_DEFAULT_QUALITY=85                              # Default JPEG/WebP quality (1-100)
MEDIA_DEFAULT_FORMAT=webp                             # Default output format
MEDIA_MAX_DIMENSION=2048                              # Max resize dimension (px)
MEDIA_STRIP_EXIF_DEFAULT=true                         # Strip EXIF from optimized output

# ═══════════════════════════════════════════════════════════════════════════════
# QUOTAS
# ═══════════════════════════════════════════════════════════════════════════════

MEDIA_DEFAULT_STORAGE_QUOTA=5368709120                # Default 5GB per venture (bytes)
MEDIA_DEFAULT_MAX_FILE_SIZE=52428800                  # Default 50MB max per file (bytes)
MEDIA_QUOTA_WARNING_THRESHOLD=0.8                     # Warn at 80% usage
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `MEDIA_FILE_TOO_LARGE` | 413 | File exceeds per-type or per-venture max file size | Reduce file size or request admin to increase `maxFileSize` |
| `MEDIA_TYPE_NOT_ALLOWED` | 415 | MIME type not in `ALL_ALLOWED_TYPES` or custom allowlist | Convert file to an allowed format |
| `MEDIA_QUOTA_EXCEEDED` | 507 | Venture storage quota exhausted | Free space or request admin to increase `totalQuota` |
| `MEDIA_QUOTA_FILE_TOO_LARGE` | 413 | File exceeds venture's `maxFileSize` setting | Request admin quota increase |
| `MEDIA_PROCESSING_FAILED` | 500 | Sharp image processing failed | Check `processingError` on file record; likely corrupt input |
| `MEDIA_UPLOAD_FAILED` | 500 | Storage provider upload failed | Check provider credentials and bucket permissions |
| `MEDIA_FILE_NOT_FOUND` | 404 | File ID does not exist or is soft-deleted | Verify file ID; check `deletedAt` is null |
| `MEDIA_FOLDER_NOT_FOUND` | 404 | Folder ID does not exist | Verify folder ID |
| `MEDIA_SIGNED_URL_FAILED` | 500 | Failed to generate signed URL | Check GCS/Supabase credentials and permissions |
| `MEDIA_GCS_NOT_CONFIGURED` | 503 | GCS credentials or bucket names missing | Set `GCS_*` environment variables |
| `MEDIA_PROVIDER_NOT_CONFIGURED` | 503 | Supabase credentials missing | Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` |
| `MEDIA_DB_NOT_INITIALIZED` | 503 | Database connection not available | Check database connection and initialization |
| `MEDIA_INVALID_VISIBILITY` | 400 | Invalid visibility value | Must be `public`, `private`, or `signed` |
| `MEDIA_DIMENSION_EXTRACT_FAILED` | 400 | Could not read image dimensions | File may be corrupt or not a supported image format |

---

## Dependencies

| Package | Version | Purpose | Server/Client |
|---------|---------|---------|---------------|
| `sharp` | ^0.33.x | Image processing: resize, crop, format convert, optimize, EXIF, blur | Server |
| `@google-cloud/storage` | ^7.x | Google Cloud Storage client: upload, signed URLs, public URLs, delete | Server |
| `@supabase/supabase-js` | ^2.x | Supabase Storage provider: upload, signed URLs, list, download | Server |
| `drizzle-orm` | ^0.29.x | Database ORM for files, folders, quotas tables | Server |
| `uuid` | ^9.x | UUID generation for file IDs and storage paths | Server |
| `react` | ^18.x | React hooks and components (peer dependency) | Client |
| `@tanstack/react-query` | ^5.x | Server-state management: caching, pagination, mutations | Client |

---

## Storage Path Convention

All files are stored using a deterministic path structure generated by `generatePath()`:

```
{ventureId}/{folder?}/{year}/{month}/{baseName}_{uuid8}.{extension}
```

**Examples:**

```
ventures/a1b2c3d4/2026/02/product-hero_e5f6g7h8.jpg           # Root upload
ventures/a1b2c3d4/products/2026/02/sneakers_i9j0k1l2.webp     # With folder
ventures/a1b2c3d4/2026/02/variants/sneakers_i9j0k1l2_thumbnail.webp  # Variant
```

**Path safety guarantees:**
- Non-alphanumeric characters in filenames replaced with `_`
- 8-character UUID suffix prevents collisions
- Date-based partitioning (year/month) prevents directory bloat
- Variant paths nested under `variants/` subdirectory

---

## Testing Notes

```typescript
describe('ImageProcessor', () => {
  it('should generate all configured variants', async () => {
    const variants = await processImage({
      buffer: testImageBuffer,
      originalPath: 'test/2026/01/test.jpg',
      bucket: 'test-bucket',
      variants: DEFAULT_IMAGE_VARIANTS,
    });

    expect(variants).toHaveLength(4);
    expect(variants.map((v) => v.name)).toEqual(['thumbnail', 'small', 'medium', 'large']);
  });

  it('should respect withoutEnlargement for small images', async () => {
    const smallImage = createTestImage(100, 100);
    const optimized = await optimizeImage(smallImage, { maxWidth: 2048 });
    const dims = await getImageDimensions(optimized);
    expect(dims!.width).toBeLessThanOrEqual(100);
  });

  it('should convert JPEG to WebP with quality control', async () => {
    const webp = await optimizeImage(jpegBuffer, { format: 'webp', quality: 75 });
    expect(webp.byteLength).toBeLessThan(jpegBuffer.byteLength);
  });

  it('should extract dimensions from various formats', async () => {
    const jpeg = await getImageDimensions(jpegBuffer);
    const png = await getImageDimensions(pngBuffer);
    expect(jpeg).toEqual({ width: 1920, height: 1080 });
    expect(png).toEqual({ width: 800, height: 600 });
  });

  it('should generate base64 blur placeholder', async () => {
    const blur = await generateBlurPlaceholder(testImageBuffer);
    expect(blur).toMatch(/^data:image\/png;base64,/);
    expect(blur.length).toBeLessThan(500); // Tiny placeholder
  });

  it('should return null dimensions for corrupt files', async () => {
    const corrupt = Buffer.from('not an image');
    const dims = await getImageDimensions(corrupt);
    expect(dims).toBeNull();
  });
});

describe('QuotaService', () => {
  it('should create default quota for new venture', async () => {
    const quota = await getQuotaInfo('new-venture-id');
    expect(quota.totalQuota).toBe(5368709120);  // 5GB
    expect(quota.usedStorage).toBe(0);
    expect(quota.maxFileSize).toBe(52428800);   // 50MB
    expect(quota.usagePercentage).toBe(0);
  });

  it('should reject upload when quota exceeded', async () => {
    // Set low quota
    await updateQuotaLimits('test-venture', { totalQuota: 1024 });
    const check = await checkQuota('test-venture', 2048);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Insufficient storage');
  });

  it('should reject file exceeding maxFileSize', async () => {
    await updateQuotaLimits('test-venture', { maxFileSize: 1024 });
    const check = await checkQuota('test-venture', 2048);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('maximum allowed size');
  });

  it('should recalculate usage from actual files', async () => {
    const usage = await recalculateQuotaUsage('test-venture');
    expect(typeof usage).toBe('number');
    expect(usage).toBeGreaterThanOrEqual(0);
  });
});

describe('StorageService', () => {
  it('should generate unique paths with date partitioning', () => {
    const path1 = generatePath({ ventureId: 'abc', fileName: 'photo.jpg' });
    const path2 = generatePath({ ventureId: 'abc', fileName: 'photo.jpg' });
    expect(path1).not.toBe(path2);  // UUID suffix makes paths unique
    expect(path1).toMatch(/abc\/\d{4}\/\d{2}\/photo_[a-f0-9]{8}\.jpg/);
  });

  it('should soft-delete file and update quota', async () => {
    const result = await uploadFileService({ /* ... */ });
    await deleteFileService(result.file!.id);
    const file = await getFile(result.file!.id);
    expect(file).toBeNull();  // Soft-deleted files are excluded
  });

  it('should list files with filters', async () => {
    const response = await listFiles(
      { ventureId: 'test', mimeType: 'image/jpeg' },
      { page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' }
    );
    expect(response.files.every((f) => f.mimeType === 'image/jpeg')).toBe(true);
    expect(response.hasMore).toBeDefined();
  });
});

describe('MimeTypes', () => {
  it('should validate allowed types', () => {
    expect(validateMimeType('image/jpeg')).toBe(true);
    expect(validateMimeType('application/zip')).toBe(false);
  });

  it('should categorize MIME types correctly', () => {
    expect(getMimeCategory('image/webp')).toBe('image');
    expect(getMimeCategory('application/pdf')).toBe('document');
    expect(getMimeCategory('video/mp4')).toBe('video');
    expect(getMimeCategory('audio/mpeg')).toBe('audio');
    expect(getMimeCategory('application/zip')).toBe('other');
  });

  it('should convert between extensions and MIME types', () => {
    expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
    expect(getMimeTypeFromExtension('mp4')).toBe('video/mp4');
    expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
  });
});

describe('SupabaseStorageProvider', () => {
  it('should upload and return path + URL', async () => {
    const provider = await getStorageProvider();
    const result = await provider.upload({
      bucket: 'test',
      path: 'test/file.txt',
      file: Buffer.from('hello'),
      contentType: 'text/plain',
      visibility: 'public',
    });
    expect(result.path).toBe('test/file.txt');
    expect(result.url).toContain('supabase');
  });

  it('should check file existence', async () => {
    const provider = await getStorageProvider();
    const exists = await provider.exists({ bucket: 'test', path: 'nonexistent.txt' });
    expect(exists).toBe(false);
  });
});
```

---

## Related Modules

| Module | Relationship | Direction |
|--------|-------------|-----------|
| `@mcv/db` | Drizzle schema: `files`, `fileFolders`, `storageQuotas` tables and enums | ← depends on |
| `@mcv/api` | tRPC `storage.router.ts` wraps this module's services for API exposure | → consumed by |
| `@mcv/core/catalog` | Product catalog references file IDs for product images | → consumed by |
| `@mcv/core/cms` | CMS content blocks embed media assets (TipTap image inserts) | → consumed by |
| `@mcv/fabric/notifications` | Notification attachments use file references | → consumed by |
| `@mcv/shared/auth` | `uploadedById` links to authenticated user via `@mcv/auth` session | ← depends on |
| `@mcv/ui` | `MediaLibraryModal`, `MediaDetailsModal` consume client hooks | → consumed by |

---

## GCP Infrastructure Notes

### Cloud Function: Image Optimizer

The planned GCS-triggered Cloud Function (`mcv-image-optimizer`) will handle async optimization:

- **Trigger:** GCS object finalization on `GCS_BUCKET_NAME`
- **Runtime:** Node.js + Sharp
- **Output:** WebP variants to `GCS_OPTIMIZED_BUCKET_NAME`
- **Variants:** thumbnail (150×150), medium (600w), large (1200w)
- **DB update:** Updates `files.variants` JSONB with optimized CDN URLs
- **Deployment:** Separate from main app — manual GCF deploy or CI/CD

### Cloud CDN Configuration

1. Create HTTP(S) Load Balancer → backend bucket pointing to `GCS_OPTIMIZED_BUCKET_NAME`
2. Enable Cloud CDN on the frontend configuration
3. Map custom domain (`cdn.mcv.one`) via DNS
4. Set `IMAGE_CDN_BASE_URL=https://cdn.mcv.one` in environment
5. Cache-Control headers set to `max-age=31536000, immutable` for content-hashed paths

---

## Migration Notes

### From Legacy Path to GCS Path

The `files` table contains both `path` (legacy Supabase path) and `gcsPath` (new GCS path). During the migration period:

- New uploads populate `gcsPath` and leave `path` null
- Legacy files have `path` set and `gcsPath` backfilled during migration
- `addUrlsToFile()` checks both columns when constructing URLs
- After full migration, `path` column can be dropped

### Variant Schema Change

The `variants` column migrated from `Array<FileVariant>` to `Record<string, string>` (JSONB). The `addUrlsToFile()` helper handles both formats during the transition:

```typescript
// Old format: [{ name: 'thumb', path: '...', width: 150, height: 150, size: 1240 }]
// New format: { "thumb": "https://cdn.../thumb.webp", "medium": "https://cdn.../medium.webp" }
```

---

*@mcv/shared/media — Media Processing & Storage Module*
