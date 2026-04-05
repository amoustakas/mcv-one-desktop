# @mcv/fabric/storage — File Storage Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `storage` module provides unified file storage infrastructure for the MCV ecosystem. It abstracts cloud storage providers (Supabase Storage, Google Cloud Storage), handles image processing and optimization, manages storage quotas per venture, and provides secure file access through signed URLs.

**All file uploads, media assets, and document storage flow through this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

// File operations
export { 
  uploadFile, 
  getFile, 
  listFiles, 
  deleteFile, 
  updateFile,
  getSignedUrl,
} from './server/services/storage-service';

// Folder operations
export { 
  createFolder, 
  listFolders, 
  deleteFolder, 
  renameFolder,
} from './server/services/storage-service';

// Image processing
export { 
  processImage, 
  getImageDimensions, 
  optimizeImage,
} from './server/services/image-processor';

// Quota management
export { 
  checkQuota, 
  getQuota, 
  updateQuotaUsage, 
  setQuotaLimit,
} from './server/services/quota-service';

// Storage providers
export { getStorageProvider } from './server/providers/supabase-storage';
export type { StorageProvider } from './server/providers/provider-interface';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { FileUpload } from './client/components/file-upload';
export { ImageUpload } from './client/components/image-upload';
export { AvatarUpload } from './client/components/avatar-upload';
export { FileManager } from './client/components/file-manager';
export { FileCard } from './client/components/file-card';
export { FilePreview } from './client/components/file-preview';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useUpload } from './client/hooks/use-upload';
export { useFiles } from './client/hooks/use-files';
export { useFolders } from './client/hooks/use-folders';
export { useStorageQuota } from './client/hooks/use-storage-quota';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Database types
  File,
  FileFolder,
  StorageQuota,
  FileVariant,
  FileMetadata,
  FileStatus,
  FileVisibility,
  
  // Service types
  FileWithUrl,
  FileFilters,
  FilePagination,
  FileListResponse,
  FolderWithCounts,
  UploadOptions,
  UploadResult,
  ImageVariantConfig,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export { isImageMimeType, getFileExtension } from './types';
export { MIME_TYPE_MAP, getMimeType } from './server/utils/mime-types';
export { DEFAULT_IMAGE_VARIANTS } from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STORAGE MODULE ARCHITECTURE                             │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            CLIENT LAYER                                      │ │
│  │                                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  FileUpload  │  │ ImageUpload  │  │ AvatarUpload │  │ FileManager  │    │ │
│  │  │              │  │              │  │              │  │              │    │ │
│  │  │  Drag & drop │  │  Crop/resize │  │  Circle crop │  │  Full file   │    │ │
│  │  │  Multi-file  │  │  Preview     │  │  Gravatar    │  │  browser     │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                 │                 │                 │            │ │
│  │         └─────────────────┼─────────────────┼─────────────────┘            │ │
│  │                           │                 │                              │ │
│  │                    ┌──────▼─────────────────▼──────┐                       │ │
│  │                    │        useUpload Hook         │                       │ │
│  │                    │                               │                       │ │
│  │                    │  • Progress tracking          │                       │ │
│  │                    │  • Error handling             │                       │ │
│  │                    │  • Retry logic                │                       │ │
│  │                    └───────────────┬───────────────┘                       │ │
│  │                                    │                                       │ │
│  └────────────────────────────────────┼───────────────────────────────────────┘ │
│                                       │                                         │
│  ┌────────────────────────────────────┼───────────────────────────────────────┐ │
│  │                          API LAYER │ (POST /api/storage/upload)            │ │
│  │                                    │                                       │ │
│  │  ┌─────────────────────────────────▼───────────────────────────────────┐   │ │
│  │  │                       Storage Service                                │   │ │
│  │  │                                                                      │   │ │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │ │
│  │  │  │  Quota Check   │  │ Image Process  │  │  Path Generate │         │   │ │
│  │  │  │                │  │                │  │                │         │   │ │
│  │  │  │  • Size limit  │  │  • Optimize    │  │  • Date-based  │         │   │ │
│  │  │  │  • Usage track │  │  • Variants    │  │  • Unique name │         │   │ │
│  │  │  └────────────────┘  └────────────────┘  └────────────────┘         │   │ │
│  │  │                                                                      │   │ │
│  │  └──────────────────────────────────┬──────────────────────────────────┘   │ │
│  │                                     │                                      │ │
│  └─────────────────────────────────────┼──────────────────────────────────────┘ │
│                                        │                                        │
│  ┌─────────────────────────────────────┼──────────────────────────────────────┐ │
│  │                        PROVIDER LAYER                                       │ │
│  │                                     │                                       │ │
│  │    ┌────────────────────────────────▼─────────────────────────────────┐    │ │
│  │    │                    Storage Provider Interface                     │    │ │
│  │    │                                                                   │    │ │
│  │    │  upload(bucket, path, file, options)  → StorageResult            │    │ │
│  │    │  delete(bucket, path)                 → void                      │    │ │
│  │    │  getPublicUrl(bucket, path)           → string                    │    │ │
│  │    │  getSignedUrl(bucket, path, expires)  → string                    │    │ │
│  │    └────────────────────────────────┬─────────────────────────────────┘    │ │
│  │                                     │                                       │ │
│  │         ┌───────────────────────────┼───────────────────────────┐          │ │
│  │         │                           │                           │          │ │
│  │    ┌────▼─────────────┐    ┌────────▼────────┐    ┌────────────▼───┐      │ │
│  │    │  Supabase Storage │    │  Google Cloud   │    │  Local FS      │      │ │
│  │    │  (Default)        │    │  Storage (GCS)  │    │  (Development) │      │ │
│  │    └───────────────────┘    └─────────────────┘    └────────────────┘      │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            DATABASE LAYER                                    │ │
│  │                                                                              │ │
│  │    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │ │
│  │    │      files       │  │   file_folders   │  │  storage_quotas  │        │ │
│  │    │                  │  │                  │  │                  │        │ │
│  │    │  • Metadata      │  │  • Hierarchy     │  │  • Per-venture   │        │ │
│  │    │  • Variants      │  │  • Slugs         │  │  • Limits        │        │ │
│  │    │  • Soft delete   │  │  • Permissions   │  │  • Usage         │        │ │
│  │    └──────────────────┘  └──────────────────┘  └──────────────────┘        │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### File

```typescript
interface File {
  id: string;                           // UUID primary key
  
  // Ownership
  ventureId: string | null;             // Multi-tenant scope
  uploadedById: string | null;          // User who uploaded
  
  // Identity
  name: string;                         // Display name
  originalName: string;                 // Original filename
  path: string;                         // Storage path
  gcsPath: string;                      // Full GCS path
  bucket: string;                       // Storage bucket name
  originalBucket: string | null;        // Original upload bucket
  optimizedBucket: string | null;       // Optimized variants bucket
  
  // File metadata
  mimeType: string;                     // MIME type (e.g., 'image/jpeg')
  size: number;                         // Size in bytes
  
  // Image-specific
  width: number | null;                 // Width in pixels
  height: number | null;                // Height in pixels
  altText: string | null;               // Accessibility text
  description: string | null;           // File description
  tags: string[];                       // Custom tags
  
  // Processing
  status: FileStatus;                   // 'pending' | 'processing' | 'ready' | 'failed' | 'deleted'
  processingError: string | null;       // Error message if failed
  
  // Access control
  visibility: FileVisibility;           // 'public' | 'private' | 'signed'
  
  // Variants (thumbnails, resized versions)
  variants: Record<string, string>;     // Map of variant name to URL/path
  
  // Custom metadata
  metadata: FileMetadata | null;        // Application-specific metadata
  
  // Organization
  folderId: string | null;              // Parent folder
  
  // Soft delete
  deletedAt: Date | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### FileWithUrl

```typescript
interface FileWithUrl extends Omit<File, 'variants'> {
  url: string;                          // Direct access URL
  signedUrl?: string;                   // Signed URL (for private files)
  thumbnailUrl?: string;                // Thumbnail variant URL
  variants?: FileVariantWithUrl[];      // All variants with URLs
}

interface FileVariantWithUrl {
  name: string;                         // Variant name
  path: string;                         // Storage path
  width?: number;                       // Width in pixels
  height?: number;                      // Height in pixels
  size: number;                         // Size in bytes
  url: string;                          // Access URL
}
```

### UploadOptions

```typescript
interface UploadOptions {
  // Storage location
  bucket?: string;                      // Target bucket (default: 'files')
  folder?: string;                      // Subfolder path
  folderId?: string;                    // Database folder ID
  
  // Validation
  allowedTypes?: string[];              // Allowed MIME types
  maxSize?: number;                     // Max file size in bytes
  
  // Image processing
  generateThumbnail?: boolean;          // Generate thumbnail
  variants?: ImageVariantConfig[];      // Custom variant configurations
  
  // Access control
  visibility?: FileVisibility;          // 'public' | 'private' | 'signed'
  
  // Custom metadata
  metadata?: Record<string, unknown>;
}
```

### ImageVariantConfig

```typescript
interface ImageVariantConfig {
  name: string;                         // Variant identifier
  width?: number;                       // Target width
  height?: number;                      // Target height
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;                     // JPEG/WebP quality (1-100)
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

// Default variants for image uploads
const DEFAULT_IMAGE_VARIANTS: ImageVariantConfig[] = [
  { name: 'thumbnail', width: 200, height: 200, fit: 'cover', quality: 80 },
  { name: 'medium', width: 800, height: 600, fit: 'inside', quality: 85 },
  { name: 'large', width: 1920, height: 1080, fit: 'inside', quality: 90 },
];
```

### UploadResult

```typescript
interface UploadResult {
  success: boolean;
  file?: FileWithUrl;                   // Uploaded file record
  error?: string;                       // Error message if failed
}
```

### FileFilters

```typescript
interface FileFilters {
  ventureId?: string;                   // Filter by venture
  folderId?: string | null;             // Filter by folder (null = root)
  mimeType?: string | string[];         // Filter by MIME type
  status?: FileStatus;                  // Filter by status
  visibility?: FileVisibility;          // Filter by visibility
  uploadedById?: string;                // Filter by uploader
  search?: string;                      // Search by name
  tags?: string[];                      // Filter by tags
  createdAfter?: Date;                  // Created after date
  createdBefore?: Date;                 // Created before date
}
```

### StorageQuota

```typescript
interface StorageQuota {
  id: string;
  ventureId: string;
  totalQuota: number;                   // Total allowed storage (bytes)
  usedStorage: number;                  // Current usage (bytes)
  maxFileSize: number;                  // Max single file size (bytes)
  updatedAt: Date;
}
```

---

## Database Schema

### files Table

```typescript
export const files = pgTable(
  'files',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════════
    
    // Venture scope for multi-tenancy
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),
    
    // User who uploaded the file
    uploadedById: uuid('uploaded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // FILE IDENTITY
    // ═══════════════════════════════════════════════════════════════════════
    
    // Display name (user-facing)
    name: text('name').notNull(),
    
    // Original filename from upload
    originalName: text('original_name').notNull(),
    
    // Legacy path (for backward compatibility)
    path: text('path'),
    
    // Full path in cloud storage (relative to bucket)
    gcsPath: text('gcs_path').notNull(),
    
    // Bucket names
    originalBucket: text('original_bucket'),
    optimizedBucket: text('optimized_bucket'),
    bucket: text('bucket').notNull().default('files'),

    // ═══════════════════════════════════════════════════════════════════════
    // FILE METADATA
    // ═══════════════════════════════════════════════════════════════════════
    
    // MIME type (e.g., 'image/jpeg', 'application/pdf')
    mimeType: text('mime_type').notNull(),
    
    // File size in bytes
    size: bigint('size', { mode: 'number' }).notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE-SPECIFIC FIELDS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Dimensions (for images)
    width: bigint('width', { mode: 'number' }),
    height: bigint('height', { mode: 'number' }),
    
    // Accessibility
    altText: text('alt_text'),
    description: text('description'),
    
    // Categorization
    tags: jsonb('tags').$type<string[]>().default([]),

    // ═══════════════════════════════════════════════════════════════════════
    // PROCESSING STATUS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Current processing status
    status: fileStatusEnum('status').default('pending').notNull(),
    
    // Error message if processing failed
    processingError: text('processing_error'),

    // ═══════════════════════════════════════════════════════════════════════
    // ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════════════
    
    // Visibility level
    visibility: fileVisibilityEnum('visibility').default('private').notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // VARIANTS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Map of variant name to path (thumbnails, resized versions)
    variants: jsonb('variants').$type<Record<string, string>>().default({}),

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOM METADATA
    // ═══════════════════════════════════════════════════════════════════════
    
    // Application-specific metadata
    metadata: jsonb('metadata').$type<FileMetadata>(),

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    // Parent folder (null = root)
    folderId: uuid('folder_id').references(() => fileFolders.id, {
      onDelete: 'set null',
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // SOFT DELETE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Soft delete timestamp
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Primary query patterns
    index('files_venture_idx').on(table.ventureId),
    index('files_uploaded_by_idx').on(table.uploadedById),
    index('files_status_idx').on(table.status),
    index('files_folder_idx').on(table.folderId),
    index('files_path_idx').on(table.gcsPath),
    index('files_mime_type_idx').on(table.mimeType),
    index('files_created_at_idx').on(table.createdAt),
    
    // Composite indexes
    index('files_venture_folder_idx').on(table.ventureId, table.folderId),
  ]
);
```

### file_folders Table

```typescript
export const fileFolders = pgTable(
  'file_folders',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════════
    
    // Venture scope (required)
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' })
      .notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // FOLDER IDENTITY
    // ═══════════════════════════════════════════════════════════════════════
    
    // Display name
    name: text('name').notNull(),
    
    // URL-safe slug
    slug: text('slug').notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // HIERARCHY
    // ═══════════════════════════════════════════════════════════════════════
    
    // Parent folder (null = root)
    parentId: uuid('parent_id'),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('file_folders_venture_idx').on(table.ventureId),
    index('file_folders_parent_idx').on(table.parentId),
    index('file_folders_slug_idx').on(table.ventureId, table.slug),
  ]
);
```

### storage_quotas Table

```typescript
export const storageQuotas = pgTable(
  'storage_quotas',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // VENTURE REFERENCE
    // ═══════════════════════════════════════════════════════════════════════
    
    // One quota record per venture
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE LIMITS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Total storage quota in bytes (default: 5GB)
    totalQuota: bigint('total_quota', { mode: 'number' })
      .notNull()
      .default(5368709120), // 5GB
    
    // Current storage usage in bytes
    usedStorage: bigint('used_storage', { mode: 'number' })
      .notNull()
      .default(0),

    // ═══════════════════════════════════════════════════════════════════════
    // FILE LIMITS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Maximum single file size in bytes (default: 50MB)
    maxFileSize: bigint('max_file_size', { mode: 'number' })
      .notNull()
      .default(52428800), // 50MB

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('storage_quotas_venture_idx').on(table.ventureId),
  ]
);
```

---

## Usage Examples

### Basic File Upload

```typescript
import { uploadFile, getFile, deleteFile } from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple file upload
// ═══════════════════════════════════════════════════════════════════════════════

async function handleUpload(formData: FormData, userId: string, ventureId: string) {
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const result = await uploadFile({
    file: buffer,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    ventureId,
    uploadedById: userId,
    options: {
      visibility: 'private',
    },
  });
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.file; // FileWithUrl
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Image upload with variants
// ═══════════════════════════════════════════════════════════════════════════════

async function uploadProductImage(
  imageBuffer: Buffer, 
  fileName: string, 
  ventureId: string
) {
  const result = await uploadFile({
    file: imageBuffer,
    fileName,
    mimeType: 'image/jpeg',
    size: imageBuffer.byteLength,
    ventureId,
    options: {
      bucket: 'products',
      generateThumbnail: true,
      variants: [
        { name: 'thumbnail', width: 150, height: 150, fit: 'cover', quality: 80 },
        { name: 'card', width: 400, height: 300, fit: 'cover', quality: 85 },
        { name: 'detail', width: 1200, height: 900, fit: 'inside', quality: 90 },
      ],
      visibility: 'public',
      metadata: {
        category: 'product',
        source: 'admin_upload',
      },
    },
  });
  
  if (result.success) {
    console.log('Original URL:', result.file.url);
    console.log('Thumbnail URL:', result.file.thumbnailUrl);
    console.log('All variants:', result.file.variants);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Upload with validation
// ═══════════════════════════════════════════════════════════════════════════════

async function uploadDocument(file: Buffer, fileName: string, ventureId: string) {
  const result = await uploadFile({
    file,
    fileName,
    mimeType: 'application/pdf',
    size: file.byteLength,
    ventureId,
    options: {
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSize: 10 * 1024 * 1024, // 10MB
      folder: 'documents',
      visibility: 'private',
    },
  });
  
  return result;
}
```

### File Management

```typescript
import { 
  listFiles, 
  getFile, 
  updateFile, 
  deleteFile,
  getSignedUrl,
} from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: List files with filters
// ═══════════════════════════════════════════════════════════════════════════════

const response = await listFiles(
  {
    ventureId: 'venture-uuid',
    mimeType: ['image/jpeg', 'image/png', 'image/webp'],
    folderId: null, // Root folder
    search: 'product',
  },
  {
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }
);

console.log(`Found ${response.total} files`);
console.log(`Page ${response.page}, hasMore: ${response.hasMore}`);

for (const file of response.files) {
  console.log(`${file.name} - ${file.url}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Get file with signed URL
// ═══════════════════════════════════════════════════════════════════════════════

const file = await getFile('file-uuid');

if (file && file.visibility === 'private') {
  const signedUrl = await getSignedUrl(file.id, 3600); // 1 hour expiry
  console.log('Download URL:', signedUrl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Update file metadata
// ═══════════════════════════════════════════════════════════════════════════════

const updated = await updateFile('file-uuid', {
  name: 'New Display Name',
  metadata: {
    alt: 'Product photo showing front view',
    caption: 'Premium Widget - Model X',
  },
  visibility: 'public',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Delete file
// ═══════════════════════════════════════════════════════════════════════════════

await deleteFile('file-uuid');
// File is soft-deleted, storage updated, variants cleaned up
```

### Folder Management

```typescript
import { 
  createFolder, 
  listFolders, 
  renameFolder, 
  deleteFolder,
} from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Create folder hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

// Create root folder
const productsFolder = await createFolder({
  ventureId: 'venture-uuid',
  name: 'Products',
});

// Create subfolder
const electronicsFolder = await createFolder({
  ventureId: 'venture-uuid',
  name: 'Electronics',
  parentId: productsFolder.id,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: List folders
// ═══════════════════════════════════════════════════════════════════════════════

// List root folders
const rootFolders = await listFolders({
  ventureId: 'venture-uuid',
  parentId: null,
});

// List subfolders
const subfolders = await listFolders({
  ventureId: 'venture-uuid',
  parentId: productsFolder.id,
});
```

### Quota Management

```typescript
import { checkQuota, getQuota, setQuotaLimit } from '@mcv/storage/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Check quota before upload
// ═══════════════════════════════════════════════════════════════════════════════

const fileSize = 50 * 1024 * 1024; // 50MB

const quotaCheck = await checkQuota('venture-uuid', fileSize);

if (!quotaCheck.allowed) {
  console.error(quotaCheck.reason);
  // "Insufficient storage quota. Used: 4.8GB / 5GB. Requested: 50MB"
} else {
  // Proceed with upload
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Get current quota status
// ═══════════════════════════════════════════════════════════════════════════════

const quota = await getQuota('venture-uuid');

console.log(`Used: ${formatBytes(quota.usedStorage)} / ${formatBytes(quota.totalQuota)}`);
console.log(`Available: ${formatBytes(quota.totalQuota - quota.usedStorage)}`);
console.log(`Max file size: ${formatBytes(quota.maxFileSize)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Update quota limit (admin)
// ═══════════════════════════════════════════════════════════════════════════════

await setQuotaLimit('venture-uuid', {
  totalQuota: 10 * 1024 * 1024 * 1024, // 10GB
  maxFileSize: 100 * 1024 * 1024,      // 100MB
});
```

### Client-Side Usage (React)

```tsx
import { useUpload, useFiles, useStorageQuota } from '@mcv/storage/client';
import { 
  FileUpload, 
  ImageUpload, 
  FileManager, 
  FilePreview 
} from '@mcv/storage/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: File upload component
// ═══════════════════════════════════════════════════════════════════════════════

function DocumentUploader({ ventureId }: { ventureId: string }) {
  const { upload, isUploading, progress, error } = useUpload({
    ventureId,
    allowedTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024,
  });
  
  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const result = await upload(file);
      if (result.success) {
        console.log('Uploaded:', result.file.url);
      }
    }
  };
  
  return (
    <FileUpload
      onUpload={handleUpload}
      accept=".pdf"
      multiple
      isLoading={isUploading}
      progress={progress}
      error={error}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Image upload with preview
// ═══════════════════════════════════════════════════════════════════════════════

function ProductImageUploader({ 
  productId, 
  ventureId,
  onImageUploaded,
}: { 
  productId: string;
  ventureId: string;
  onImageUploaded: (file: FileWithUrl) => void;
}) {
  return (
    <ImageUpload
      ventureId={ventureId}
      aspectRatio={4/3}
      maxWidth={1200}
      quality={85}
      variants={[
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'card', width: 400, height: 300 },
      ]}
      onUpload={onImageUploaded}
      placeholder="Drop product image here"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Full file manager
// ═══════════════════════════════════════════════════════════════════════════════

function FileManagerPage({ ventureId }: { ventureId: string }) {
  const { files, folders, isLoading, currentFolder, setCurrentFolder } = useFiles({
    ventureId,
  });
  
  const { quota, isLoading: quotaLoading } = useStorageQuota(ventureId);
  
  return (
    <div className="space-y-4">
      {/* Quota indicator */}
      {quota && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Storage Used</span>
            <span>{formatBytes(quota.usedStorage)} / {formatBytes(quota.totalQuota)}</span>
          </div>
          <Progress 
            value={(quota.usedStorage / quota.totalQuota) * 100} 
            className="mt-2"
          />
        </div>
      )}
      
      {/* File manager */}
      <FileManager
        files={files}
        folders={folders}
        currentFolder={currentFolder}
        onFolderChange={setCurrentFolder}
        onFileClick={(file) => openPreview(file)}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

---

## Image Processing

### Optimization Pipeline

```typescript
import { optimizeImage, getImageDimensions, processImage } from '@mcv/storage/server';
import sharp from 'sharp';

// Image optimization settings
const OPTIMIZATION_CONFIG = {
  // Maximum dimensions
  maxWidth: 4096,
  maxHeight: 4096,
  
  // Quality settings by format
  quality: {
    jpeg: 85,
    webp: 82,
    avif: 65,
    png: 90,
  },
  
  // Strip metadata for privacy
  stripMetadata: true,
  
  // Auto-rotate based on EXIF
  autoRotate: true,
};

// Automatic format conversion
const FORMAT_PRIORITY = ['avif', 'webp', 'jpeg'];
```

### Variant Generation

```typescript
// Process image and generate variants
async function processImage(options: {
  buffer: Buffer;
  originalPath: string;
  bucket: string;
  variants: ImageVariantConfig[];
  ventureId?: string;
}): Promise<ProcessedVariant[]> {
  const { buffer, originalPath, bucket, variants, ventureId } = options;
  const provider = await getStorageProvider();
  const results: ProcessedVariant[] = [];
  
  for (const variant of variants) {
    // Resize image
    let pipeline = sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: variant.fit || 'inside',
        withoutEnlargement: true,
      });
    
    // Apply format
    const format = variant.format || 'webp';
    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: variant.quality || 85 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality: variant.quality || 82 });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality: variant.quality || 65 });
    }
    
    const variantBuffer = await pipeline.toBuffer();
    
    // Generate variant path
    const variantPath = originalPath.replace(
      /\.([^.]+)$/,
      `_${variant.name}.${format}`
    );
    
    // Upload variant
    await provider.upload({
      bucket,
      path: variantPath,
      file: variantBuffer,
      contentType: `image/${format}`,
      visibility: 'public',
    });
    
    // Get dimensions
    const metadata = await sharp(variantBuffer).metadata();
    
    results.push({
      name: variant.name,
      path: variantPath,
      width: metadata.width,
      height: metadata.height,
      size: variantBuffer.byteLength,
    });
  }
  
  return results;
}
```

---

## Storage Providers

### Provider Interface

```typescript
interface StorageProvider {
  // Upload file
  upload(options: {
    bucket: string;
    path: string;
    file: Buffer | Blob;
    contentType: string;
    visibility?: FileVisibility;
  }): Promise<{ path: string; url: string }>;
  
  // Delete file
  delete(options: { bucket: string; path: string }): Promise<void>;
  
  // Get public URL (for public files)
  getPublicUrl(options: { bucket: string; path: string }): string;
  
  // Get signed URL (for private files)
  getSignedUrl(options: { 
    bucket: string; 
    path: string; 
    expiresIn?: number;  // seconds
  }): Promise<string>;
  
  // Check if file exists
  exists(options: { bucket: string; path: string }): Promise<boolean>;
  
  // List files in bucket/prefix
  list(options: { 
    bucket: string; 
    prefix?: string; 
    limit?: number;
  }): Promise<StorageObject[]>;
}
```

### Supabase Storage Provider

```typescript
// Default provider using Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function getStorageProvider(): Promise<StorageProvider> {
  return {
    async upload({ bucket, path, file, contentType, visibility }) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: false,
        });
      
      if (error) throw error;
      
      return {
        path: data.path,
        url: visibility === 'public' 
          ? this.getPublicUrl({ bucket, path })
          : '',
      };
    },
    
    async delete({ bucket, path }) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
    },
    
    getPublicUrl({ bucket, path }) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return data.publicUrl;
    },
    
    async getSignedUrl({ bucket, path, expiresIn = 3600 }) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) throw error;
      return data.signedUrl;
    },
    
    // ... other methods
  };
}
```

---

## Performance Considerations

### Upload Optimization

| Strategy | Impact | When to Use |
|----------|--------|-------------|
| Client-side resize | -80% upload size | Images > 2MB |
| Chunked upload | Better reliability | Files > 10MB |
| Presigned URLs | -1 hop latency | High-volume |
| CDN integration | -70% latency | Public assets |

### Recommended Limits

| Metric | Development | Production |
|--------|-------------|------------|
| Max file size | 50MB | 100MB |
| Default quota | 1GB | 5GB |
| Concurrent uploads | 3 | 5 |
| Image max dimension | 4096px | 8192px |

---

## Security Considerations

### Access Control

- All private files require signed URLs with expiration
- Signed URLs are single-use and time-limited (default: 1 hour)
- Public files served via CDN with cache headers
- Folder permissions inherit from venture permissions

### Content Validation

- MIME type verification (not just extension)
- Image dimension limits (prevent memory exhaustion)
- Malware scanning integration (optional)
- Filename sanitization (prevent path traversal)

### Data Protection

- All uploads encrypted in transit (TLS 1.3)
- Storage encrypted at rest (AES-256)
- Signed URLs use HMAC-SHA256
- Soft delete with configurable retention

---

## Environment Variables

```bash
# Storage provider
STORAGE_PROVIDER=supabase                # supabase | gcs | local

# Supabase configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Google Cloud Storage (alternative)
GCS_PROJECT_ID=mcv-production
GCS_CREDENTIALS_PATH=/path/to/service-account.json
GCS_BUCKET_DEFAULT=mcv-files

# Default settings
STORAGE_DEFAULT_BUCKET=files
STORAGE_DEFAULT_VISIBILITY=private
STORAGE_MAX_FILE_SIZE=52428800           # 50MB
STORAGE_DEFAULT_QUOTA=5368709120         # 5GB

# CDN configuration
STORAGE_CDN_URL=https://cdn.mcv.one
STORAGE_CDN_ENABLED=true

# Image processing
STORAGE_IMAGE_MAX_WIDTH=4096
STORAGE_IMAGE_MAX_HEIGHT=4096
STORAGE_IMAGE_DEFAULT_QUALITY=85
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.x | Supabase Storage client |
| sharp | ^0.33.x | Image processing |
| uuid | ^9.x | UUID generation |
| @mcv/db | workspace | Database schema |
| drizzle-orm | ^0.29.x | Database ORM |

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `storage.file.uploaded` | data | File uploaded |
| `storage.file.deleted` | data | File deleted |
| `storage.file.updated` | data | File metadata updated |
| `storage.file.accessed` | data | Private file accessed (signed URL generated) |
| `storage.folder.created` | data | Folder created |
| `storage.folder.deleted` | data | Folder deleted |
| `storage.quota.exceeded` | system | Upload rejected due to quota |
| `storage.quota.updated` | admin | Quota limit changed |

---

## Testing Notes

### Unit Testing

```typescript
import { uploadFile, checkQuota } from '@mcv/storage/server';

describe('Storage Service', () => {
  it('should upload file and return URL', async () => {
    const buffer = Buffer.from('test content');
    
    const result = await uploadFile({
      file: buffer,
      fileName: 'test.txt',
      mimeType: 'text/plain',
      size: buffer.byteLength,
      ventureId: 'test-venture',
    });
    
    expect(result.success).toBe(true);
    expect(result.file?.url).toBeDefined();
  });
  
  it('should reject file exceeding quota', async () => {
    // Setup: Venture with 1MB quota, 900KB used
    const result = await checkQuota('test-venture', 200 * 1024); // 200KB
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Insufficient storage quota');
  });
  
  it('should reject disallowed file type', async () => {
    const result = await uploadFile({
      file: Buffer.from('test'),
      fileName: 'test.exe',
      mimeType: 'application/x-msdownload',
      size: 100,
      ventureId: 'test-venture',
      options: {
        allowedTypes: ['image/jpeg', 'image/png'],
      },
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});
```

### Integration Testing

```typescript
describe('Image Processing', () => {
  it('should generate all variants', async () => {
    const imageBuffer = await fs.readFile('test-image.jpg');
    
    const result = await uploadFile({
      file: imageBuffer,
      fileName: 'product.jpg',
      mimeType: 'image/jpeg',
      size: imageBuffer.byteLength,
      ventureId: 'test-venture',
      options: {
        variants: [
          { name: 'thumbnail', width: 150, height: 150 },
          { name: 'medium', width: 800, height: 600 },
        ],
      },
    });
    
    expect(result.file?.variants).toHaveLength(2);
    expect(result.file?.thumbnailUrl).toBeDefined();
  });
});
```

---

*@mcv/fabric/storage — Enterprise File Storage Module*
