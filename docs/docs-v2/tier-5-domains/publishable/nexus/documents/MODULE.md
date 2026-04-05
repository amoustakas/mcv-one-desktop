# @mcv/nexus/documents

> **Document Management** — Storage, organization, collaboration, version control, and compliance for every document across the MCV.ONE platform.

**Package:** `@mcv/nexus/documents`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/nexus`
**Since:** 0.1.0
**Status:** Stable

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Storage Architecture](#storage-architecture)
  - [Collaboration Architecture](#collaboration-architecture)
  - [Search Architecture](#search-architecture)
  - [Version Control Architecture](#version-control-architecture)
  - [Preview Pipeline](#preview-pipeline)
- [Core Interfaces](#core-interfaces)
  - [Document](#document)
  - [DocumentVersion](#documentversion)
  - [Folder](#folder)
  - [Comment](#comment)
  - [AccessControl](#accesscontrol)
  - [SharedLink](#sharedlink)
  - [DocumentTemplate](#documenttemplate)
  - [RetentionPolicy](#retentionpolicy)
  - [SmartFolder](#smartfolder)
  - [StorageQuota](#storagequota)
  - [DocumentActivity](#documentactivity)
  - [DocumentTag](#documenttag)
  - [DocumentLock](#documentlock)
  - [CollaborationSession](#collaborationsession)
- [Service Interfaces](#service-interfaces)
  - [DocumentService](#documentservice)
  - [FolderService](#folderservice)
  - [VersionService](#versionservice)
  - [CollaborationService](#collaborationservice)
  - [TemplateService](#templateservice)
  - [AccessControlService](#accesscontrolservice)
  - [SearchService](#searchservice)
  - [RetentionService](#retentionservice)
  - [SmartFolderService](#smartfolderservice)
  - [StorageService](#storageservice)
  - [PreviewService](#previewservice)
- [Database Schemas](#database-schemas)
  - [documents](#documents-table)
  - [document_versions](#document_versions-table)
  - [folders](#folders-table)
  - [document_tags](#document_tags-table)
  - [comments](#comments-table)
  - [access_controls](#access_controls-table)
  - [shared_links](#shared_links-table)
  - [document_templates](#document_templates-table)
  - [retention_policies](#retention_policies-table)
  - [smart_folder_rules](#smart_folder_rules-table)
  - [storage_quotas](#storage_quotas-table)
  - [document_activities](#document_activities-table)
  - [document_locks](#document_locks-table)
  - [collaboration_sessions](#collaboration_sessions-table)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

Every MCV venture generates documents — contracts, proposals, invoices, design specs, legal agreements, marketing collateral, internal memos, technical documentation. `@mcv/nexus/documents` provides the unified document management layer that every other module in the platform can rely on.

### What This Module Does

1. **Stores documents** with full metadata, folder hierarchy, and tagging — backed by Supabase Storage for binary objects and PostgreSQL for metadata, search indices, and relational data.

2. **Versions everything** automatically. Every save creates a new version. Users can diff any two versions, roll back to any prior state, and even branch/merge collaborative documents.

3. **Enables real-time collaboration** via Yjs/CRDT. Multiple users can edit the same document simultaneously with conflict-free resolution, cursor presence, comments, suggested changes, and @mentions.

4. **Enforces access control** at the document level. Permissions (owner, editor, viewer, commenter) are checked on every operation. Documents can be shared via links — optionally password-protected and/or time-limited.

5. **Provides document templates** with variable substitution and merge fields. Generate contracts pre-filled from CRM data, invoices populated from billing records, or onboarding packets personalized per employee.

6. **Integrates with e-signatures** via `@mcv/nexus/sign`. Documents flow through signing workflows with defined signing order, reminders, and a complete audit trail.

7. **Renders previews** for dozens of file types — PDF, images, Office documents (via LibreOffice conversion), code files with syntax highlighting, and more. Thumbnails are generated automatically for visual browsing.

8. **Enforces retention and compliance** policies. Documents can be placed on legal hold, auto-archived after configurable periods, and purged in compliance with GDPR right-to-delete requests — all with full audit logging.

9. **Organizes via smart folders** — rule-based virtual folders that auto-populate based on tags, metadata, date ranges, or saved search queries.

10. **Manages storage** with per-venture and per-user quotas, content-hash deduplication, tiered storage (hot/cold/archive), and detailed analytics.

### Design Principles

- **Multi-tenant by default.** Every query is scoped to `venture_id` via PostgreSQL Row-Level Security. A document in Venture A is invisible to Venture B — enforced at the database level, not the application level.

- **Immutable versions.** Document content is never overwritten. Every edit creates a new version. The storage layer uses content-addressed hashing, so identical content is stored only once.

- **Eventually consistent collaboration.** Real-time co-editing uses CRDTs (Yjs) for conflict-free merging. Users see updates within milliseconds, and the system converges to a consistent state even under network partitions.

- **Audit everything.** Every document operation — create, read, update, delete, share, sign, download — is logged in `document_activities` with actor, timestamp, IP, and full change details.

- **Progressive enhancement.** Basic document CRUD works without any external services. Collaboration requires the Yjs server. Previews require the preview worker. Signing requires `@mcv/nexus/sign`. Each capability degrades gracefully when its backing service is unavailable.

---

## Exports

```typescript
// ── Core Services ──────────────────────────────────────────────
export { DocumentService }        from './services/document.service';
export { FolderService }          from './services/folder.service';
export { VersionService }         from './services/version.service';
export { CollaborationService }   from './services/collaboration.service';
export { TemplateService }        from './services/template.service';
export { AccessControlService }   from './services/access-control.service';
export { SearchService }          from './services/search.service';
export { RetentionService }       from './services/retention.service';
export { SmartFolderService }     from './services/smart-folder.service';
export { StorageService }         from './services/storage.service';
export { PreviewService }         from './services/preview.service';
export { SigningBridge }          from './services/signing-bridge.service';

// ── tRPC Router ────────────────────────────────────────────────
export { documentsRouter }        from './router';
export type { DocumentsRouter }   from './router';

// ── Database Schema ────────────────────────────────────────────
export {
  documents,
  documentVersions,
  folders,
  documentTags,
  comments,
  accessControls,
  sharedLinks,
  documentTemplates,
  retentionPolicies,
  smartFolderRules,
  storageQuotas,
  documentActivities,
  documentLocks,
  collaborationSessions,
} from './schema';

// ── Types & Interfaces ─────────────────────────────────────────
export type {
  Document,
  DocumentInsert,
  DocumentUpdate,
  DocumentVersion,
  DocumentVersionInsert,
  Folder,
  FolderInsert,
  FolderUpdate,
  FolderTree,
  Comment,
  CommentInsert,
  CommentThread,
  AccessControl,
  AccessControlInsert,
  AccessRole,
  SharedLink,
  SharedLinkInsert,
  DocumentTemplate,
  DocumentTemplateInsert,
  TemplateVariable,
  MergeFieldSource,
  RetentionPolicy,
  RetentionPolicyInsert,
  RetentionAction,
  SmartFolder,
  SmartFolderRule,
  SmartFolderInsert,
  StorageQuota,
  StorageQuotaInsert,
  StorageUsage,
  DocumentActivity,
  DocumentActivityType,
  DocumentTag,
  DocumentLock,
  CollaborationSession,
  CollaboratorPresence,
  SuggestedChange,
  DiffResult,
  DiffHunk,
  PreviewResult,
  ThumbnailSize,
  SearchQuery,
  SearchResult,
  SearchFacets,
  DocumentFilter,
  SortField,
  SortOrder,
  PaginatedDocuments,
  BulkOperation,
  BulkResult,
  UploadOptions,
  DownloadOptions,
  DocumentStats,
  StorageAnalytics,
  QuotaEnforcement,
} from './types';

// ── Enums ──────────────────────────────────────────────────────
export {
  AccessRole,
  DocumentStatus,
  ActivityType,
  RetentionAction,
  StorageTier,
  LockType,
  CommentStatus,
  TemplateVariableType,
  SmartFolderOperator,
  PreviewStatus,
  SigningStatus,
} from './enums';

// ── Utilities ──────────────────────────────────────────────────
export { computeContentHash }     from './utils/content-hash';
export { buildSearchVector }      from './utils/search-vector';
export { generateThumbnail }      from './utils/thumbnail';
export { detectMimeType }         from './utils/mime-detect';
export { sanitizeFilename }       from './utils/filename';
export { formatFileSize }         from './utils/format';
export { mergeTemplateFields }    from './utils/template-merge';
export { diffVersions }           from './utils/diff';
export { buildFolderTree }        from './utils/folder-tree';

// ── Hooks (React) ──────────────────────────────────────────────
export { useDocument }            from './hooks/use-document';
export { useDocuments }           from './hooks/use-documents';
export { useFolder }              from './hooks/use-folder';
export { useFolderTree }          from './hooks/use-folder-tree';
export { useCollaboration }       from './hooks/use-collaboration';
export { useDocumentSearch }      from './hooks/use-document-search';
export { useUpload }              from './hooks/use-upload';
export { usePreview }             from './hooks/use-preview';
export { useVersionHistory }      from './hooks/use-version-history';
export { useSmartFolder }         from './hooks/use-smart-folder';
export { useStorageQuota }        from './hooks/use-storage-quota';

// ── Constants ──────────────────────────────────────────────────
export {
  MAX_FILE_SIZE,
  MAX_FILENAME_LENGTH,
  SUPPORTED_PREVIEW_TYPES,
  THUMBNAIL_SIZES,
  DEFAULT_RETENTION_DAYS,
  STORAGE_TIERS,
  SEARCH_RESULT_LIMIT,
} from './constants';
```

---

## Architecture

### Storage Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Client Layer                            │
│  Upload (chunked) ──→ tRPC mutation ──→ DocumentService        │
│  Download ──────────→ Signed URL ────→ Supabase Storage        │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                    Document Service Layer                       │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │  Metadata     │  │  Storage     │  │  Content Hash     │    │
│  │  (PostgreSQL) │  │  (Supabase)  │  │  (Deduplication)  │    │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘    │
│         │                 │                     │              │
│         ▼                 ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Storage Router                         │  │
│  │   Hot (< 30d active) → Supabase Storage (Standard)      │  │
│  │   Warm (30-90d)      → Supabase Storage (Infrequent)    │  │
│  │   Cold (90d+)        → Archive Bucket (Lifecycle Rule)  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

Storage Path Convention:
  /{venture_id}/documents/{document_id}/v{version}/{filename}
  /{venture_id}/thumbnails/{document_id}/{size}.webp
  /{venture_id}/previews/{document_id}/v{version}.pdf
```

**Upload Flow:**

1. Client initiates upload via `documents.upload` tRPC mutation with file metadata (name, size, MIME type).
2. Server validates quota, file type restrictions, and filename sanitization.
3. Server computes a content hash (SHA-256) of the incoming file stream.
4. If the hash matches an existing stored object, a reference is created (deduplication) — no new bytes are written to storage.
5. Otherwise, the file is streamed to Supabase Storage at the versioned path.
6. Metadata record is inserted into `documents` (or a new `document_versions` row for updates).
7. Background jobs are dispatched: thumbnail generation, preview rendering, search index update.
8. Activity log entry is created.

**Download Flow:**

1. Client requests download via `documents.download` tRPC query.
2. Server checks access control (RLS + application-level permission check).
3. Server generates a time-limited signed URL from Supabase Storage.
4. Client follows the signed URL for direct download from storage CDN.
5. Activity log entry is created (`document.downloaded`).

**Deduplication:**

Content-hash deduplication operates at the storage level. When two documents (or versions) have identical binary content, only one copy is stored. The `content_hash` column in `document_versions` enables this:

```
document_versions:
  id: uuid
  document_id: uuid
  version_number: int
  content_hash: sha256  ──→  storage_objects (unique by hash)
  storage_path: text
```

When a version is deleted, the storage object is only removed if no other version references the same `content_hash`.

---

### Collaboration Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Client A              Client B               │
│                       │                      │                   │
│                       ▼                      ▼                   │
│              ┌─────────────────────────────────────┐             │
│              │         Yjs CRDT Document           │             │
│              │   (Shared Y.Doc across clients)     │             │
│              └──────────────┬──────────────────────┘             │
│                             │ WebSocket                          │
│                             ▼                                    │
│              ┌─────────────────────────────────┐                 │
│              │    Collaboration Server (Hocuspocus)              │
│              │                                 │                 │
│              │  ┌───────────┐  ┌────────────┐  │                 │
│              │  │ Awareness │  │ Persistence│  │                 │
│              │  │ (cursors, │  │ (Supabase) │  │                 │
│              │  │  presence)│  │            │  │                 │
│              │  └───────────┘  └────────────┘  │                 │
│              │                                 │                 │
│              │  ┌───────────┐  ┌────────────┐  │                 │
│              │  │ Auth Gate │  │ Webhook    │  │                 │
│              │  │ (JWT +    │  │ (version   │  │                 │
│              │  │  ACL)     │  │  snapshots)│  │                 │
│              │  └───────────┘  └────────────┘  │                 │
│              └─────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

**How Real-Time Collaboration Works:**

1. When a user opens a document for editing, the client establishes a WebSocket connection to the Hocuspocus collaboration server.
2. The server authenticates the connection via JWT and checks document-level access control (must be `editor` or `owner`).
3. A Yjs document (`Y.Doc`) is loaded — either from an active in-memory session or deserialized from the database.
4. Changes from each client propagate as Yjs updates (binary-encoded CRDT operations) to the server, which broadcasts them to all connected clients.
5. The Awareness protocol handles presence: cursor positions, user names/colors, and active selection ranges.
6. Periodically (configurable, default every 30 seconds) and on disconnect, the server persists the Y.Doc state to the database.
7. When all clients disconnect, a final snapshot is persisted and a new `document_version` is created.

**Comments & Suggested Changes:**

Comments and suggested changes are stored as Y.Doc annotations (using Yjs's shared types), which means they are synchronized in real-time alongside the document content. When a comment is resolved or a suggestion is accepted/rejected, the action propagates to all connected clients instantly.

For offline/non-collaborative access, comments are also mirrored to the `comments` PostgreSQL table for querying, notifications, and audit trails.

**Conflict Resolution:**

Yjs CRDTs guarantee eventual consistency without conflict. Two users typing at the same position will see both contributions preserved (insertion order determined by client ID). This is mathematically guaranteed to converge — no manual conflict resolution is ever needed.

For non-CRDT documents (binary files, PDFs), the system falls back to pessimistic locking: only one user can edit at a time, enforced via `document_locks`.

---

### Search Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Search Pipeline                          │
│                                                                 │
│  Document Created/Updated                                       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐    ┌──────────────────────┐                │
│  │ Text Extraction  │    │ Metadata Indexing     │                │
│  │                  │    │                      │                │
│  │ PDF → pdftotext  │    │ filename    → trgm   │                │
│  │ DOCX → mammoth   │    │ tags[]      → gin    │                │
│  │ XLSX → sheetjs   │    │ mime_type   → btree  │                │
│  │ TXT → direct     │    │ created_at  → btree  │                │
│  │ HTML → sanitize   │    │ folder_id   → btree  │                │
│  │ Code → direct     │    │ venture_id  → btree  │                │
│  └────────┬─────────┘    └───────────┬──────────┘                │
│           │                          │                           │
│           ▼                          ▼                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Search Index                      │   │
│  │                                                          │   │
│  │  search_vector (tsvector)   ← to_tsvector(content)       │   │
│  │  trigram_index (gin_trgm)   ← filename, title            │   │
│  │                                                          │   │
│  │  Full-text:  plainto_tsquery('english', $query)          │   │
│  │  Fuzzy:      similarity(filename, $query) > 0.3          │   │
│  │  Combined:   ts_rank() + similarity() weighted score     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Query Time:                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Parse search query (quoted phrases, operators)       │   │
│  │  2. Apply RLS filter (venture_id + user access)          │   │
│  │  3. Execute tsvector match + trigram similarity           │   │
│  │  4. Rank results (BM25-inspired + recency boost)         │   │
│  │  5. Apply facet filters (type, date, folder, tags)       │   │
│  │  6. Return paginated results with highlighted snippets   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Search Features:**

- **Full-text search** via PostgreSQL `tsvector` / `tsquery` with English stemming, stop-word removal, and phrase matching.
- **Fuzzy filename search** via `pg_trgm` trigram similarity — catches typos and partial matches.
- **Faceted filtering** by file type, date range, folder, tags, owner, and size.
- **Highlighted snippets** in search results using `ts_headline()`.
- **Saved searches** can be turned into smart folders.
- **Recent documents** and **frequently accessed** quick-access lists.

---

### Version Control Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Version Timeline                           │
│                                                                │
│  v1 ──→ v2 ──→ v3 ──→ v4 (current)                           │
│               │                                                │
│               └──→ v3-branch-1 ──→ v3-branch-1.1              │
│                         │                                      │
│                         └──→ merge back to v5                  │
│                                                                │
│  Each version stores:                                          │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  version_number   : sequential integer                │      │
│  │  content_hash     : SHA-256 of binary content         │      │
│  │  storage_path     : path in Supabase Storage          │      │
│  │  yjs_state        : serialized Y.Doc (if CRDT)        │      │
│  │  change_summary   : auto-generated or user-provided   │      │
│  │  created_by       : user who triggered the version    │      │
│  │  created_at       : timestamp                         │      │
│  │  byte_size        : size of this version's content    │      │
│  │  diff_from_prev   : computed delta from prior version │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

**Version Control Features:**

- **Automatic versioning**: Every save (manual or auto-save interval) creates a new version.
- **Version history**: Browse all versions with timestamps, authors, and change summaries.
- **Diff comparison**: Compare any two versions side-by-side. For text documents, uses Myers diff algorithm. For Yjs documents, uses CRDT state comparison.
- **Rollback**: Restore any prior version as the current version (creates a new version pointing to old content).
- **Branching**: Create a named branch from any version for parallel editing (useful for review workflows).
- **Merging**: Merge a branch back into the main line. For CRDT documents, this is conflict-free. For binary documents, the user must choose which version to keep.

---

### Preview Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      Preview Generation                         │
│                                                                 │
│  Upload/Version Created                                         │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │  Mime Type    │     │  Preview Strategy                    │  │
│  │  Detection    │──→  │                                      │  │
│  │  (file-type)  │     │  PDF       → pdf.js (client-side)   │  │
│  └──────────────┘     │  Images    → Sharp resize + webp     │  │
│                       │  DOCX      → LibreOffice → PDF       │  │
│                       │  XLSX      → LibreOffice → PDF       │  │
│                       │  PPTX      → LibreOffice → PDF       │  │
│                       │  Markdown  → remark → HTML           │  │
│                       │  Code      → Shiki → HTML            │  │
│                       │  Text      → Monospace wrap          │  │
│                       │  Video     → ffmpeg thumbnail        │  │
│                       │  Audio     → Waveform image          │  │
│                       │  Archive   → File listing            │  │
│                       │  Other     → Generic icon + metadata │  │
│                       └──────────────────────────────────────┘  │
│                                    │                            │
│                                    ▼                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Thumbnail Generation (Sharp)                            │   │
│  │                                                          │   │
│  │  Sizes: sm (64x64), md (256x256), lg (512x512)          │   │
│  │  Format: WebP (quality 80)                               │   │
│  │  Storage: /{venture_id}/thumbnails/{doc_id}/{size}.webp  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Document

The primary entity representing a document in the system.

```typescript
interface Document {
  /** Unique document identifier (UUIDv7). */
  id: string;

  /** Venture this document belongs to (multi-tenant scope). */
  venture_id: string;

  /** Display name of the document (e.g., "Q4 Financial Report"). */
  title: string;

  /** Original filename as uploaded (e.g., "q4-report-2025.pdf"). */
  filename: string;

  /** MIME type detected from file content (not extension). */
  mime_type: string;

  /** Size of the current version in bytes. */
  byte_size: number;

  /** Parent folder ID, or null if at the root. */
  folder_id: string | null;

  /** Current version number (starts at 1, increments on each save). */
  current_version: number;

  /** Document status. */
  status: DocumentStatus;

  /** Optional description or summary. */
  description: string | null;

  /** SHA-256 hash of the current version's binary content. */
  content_hash: string;

  /** Storage path in Supabase Storage for the current version. */
  storage_path: string;

  /** Full-text search vector (auto-populated). */
  search_vector: string | null;

  /** Extracted text content for search indexing (first 100KB). */
  extracted_text: string | null;

  /** Whether real-time collaboration is enabled. */
  collaboration_enabled: boolean;

  /** Serialized Yjs document state (for CRDT-enabled documents). */
  yjs_state: Uint8Array | null;

  /** Whether the document is under legal hold (cannot be deleted). */
  legal_hold: boolean;

  /** Retention policy ID applied to this document. */
  retention_policy_id: string | null;

  /** When the document should be archived (computed from retention policy). */
  archive_at: Date | null;

  /** When the document should be purged (computed from retention policy). */
  purge_at: Date | null;

  /** Signing status if the document is in a signing workflow. */
  signing_status: SigningStatus | null;

  /** Reference to the signing request in @mcv/nexus/sign. */
  signing_request_id: string | null;

  /** Thumbnail URLs for various sizes. */
  thumbnails: Record<ThumbnailSize, string> | null;

  /** Preview URL (rendered PDF or HTML preview). */
  preview_url: string | null;

  /** Preview generation status. */
  preview_status: PreviewStatus;

  /** Custom metadata key-value pairs. */
  metadata: Record<string, unknown>;

  /** User ID of the document creator. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last modification timestamp. */
  updated_at: Date;

  /** Soft-delete timestamp (null if not deleted). */
  deleted_at: Date | null;
}

enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SIGNING = 'signing',
  SIGNED = 'signed',
}

enum SigningStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  VOIDED = 'voided',
}
```

---

### DocumentVersion

An immutable snapshot of a document at a specific point in time.

```typescript
interface DocumentVersion {
  /** Unique version identifier. */
  id: string;

  /** Parent document ID. */
  document_id: string;

  /** Sequential version number (1, 2, 3, ...). */
  version_number: number;

  /** SHA-256 hash of the binary content. */
  content_hash: string;

  /** Storage path in Supabase Storage. */
  storage_path: string;

  /** Size of this version in bytes. */
  byte_size: number;

  /** MIME type (may differ across versions if format changed). */
  mime_type: string;

  /** Serialized Yjs state at this version (for CRDT documents). */
  yjs_state: Uint8Array | null;

  /** Human-readable change summary. */
  change_summary: string | null;

  /** Auto-generated diff description from previous version. */
  auto_summary: string | null;

  /** Branch name (null for main line, string for branches). */
  branch: string | null;

  /** Version this was branched from (for branch versions). */
  branched_from_version: number | null;

  /** Whether this version was created by merging a branch. */
  is_merge: boolean;

  /** User who created this version. */
  created_by: string;

  /** Creation timestamp (immutable). */
  created_at: Date;
}
```

---

### Folder

Hierarchical folder for organizing documents.

```typescript
interface Folder {
  /** Unique folder identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** Display name. */
  name: string;

  /** Parent folder ID (null for root-level folders). */
  parent_id: string | null;

  /** Materialized path for efficient tree queries (e.g., "/root/sub1/sub2"). */
  path: string;

  /** Depth in the folder hierarchy (0 for root). */
  depth: number;

  /** Optional color for UI display. */
  color: string | null;

  /** Optional icon identifier. */
  icon: string | null;

  /** Optional description. */
  description: string | null;

  /** Whether this folder inherits parent's access controls. */
  inherit_access: boolean;

  /** Sort order among siblings. */
  sort_order: number;

  /** Custom metadata. */
  metadata: Record<string, unknown>;

  /** Creator user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last modification timestamp. */
  updated_at: Date;

  /** Soft-delete timestamp. */
  deleted_at: Date | null;
}

/** Recursive folder tree structure for UI rendering. */
interface FolderTree extends Folder {
  children: FolderTree[];
  document_count: number;
  total_size: number;
}
```

---

### Comment

A comment attached to a document, optionally anchored to a specific position or text range.

```typescript
interface Comment {
  /** Unique comment identifier. */
  id: string;

  /** Document this comment belongs to. */
  document_id: string;

  /** Parent comment ID for threaded replies (null for top-level). */
  parent_id: string | null;

  /** Comment body (Markdown supported). */
  body: string;

  /** Anchor position in the document (for inline comments). */
  anchor: CommentAnchor | null;

  /** Users mentioned in this comment (@mentions). */
  mentions: string[];

  /** Comment status. */
  status: CommentStatus;

  /** User who resolved this comment (if resolved). */
  resolved_by: string | null;

  /** When the comment was resolved. */
  resolved_at: Date | null;

  /** Author user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last edit timestamp. */
  updated_at: Date;

  /** Soft-delete timestamp. */
  deleted_at: Date | null;
}

interface CommentAnchor {
  /** Type of anchor: 'range' for text selection, 'point' for cursor position, 'page' for page-level. */
  type: 'range' | 'point' | 'page';

  /** For Yjs documents: relative position that survives edits. */
  yjs_relative_position?: unknown;

  /** For static documents: page number. */
  page?: number;

  /** For static documents: character offset start. */
  offset_start?: number;

  /** For static documents: character offset end. */
  offset_end?: number;

  /** Quoted text at the time the comment was created (for context). */
  quoted_text?: string;
}

enum CommentStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  DELETED = 'deleted',
}

/** A threaded comment with its replies. */
interface CommentThread extends Comment {
  replies: Comment[];
  reply_count: number;
}
```

---

### AccessControl

Per-document or per-folder permission grant.

```typescript
interface AccessControl {
  /** Unique ACL entry identifier. */
  id: string;

  /** Document ID this permission applies to (mutually exclusive with folder_id). */
  document_id: string | null;

  /** Folder ID this permission applies to (mutually exclusive with document_id). */
  folder_id: string | null;

  /** Granted user ID (mutually exclusive with team_id). */
  user_id: string | null;

  /** Granted team ID (mutually exclusive with user_id). */
  team_id: string | null;

  /** Access role granted. */
  role: AccessRole;

  /** Who granted this permission. */
  granted_by: string;

  /** When this permission was granted. */
  granted_at: Date;

  /** When this permission expires (null for permanent). */
  expires_at: Date | null;

  /** Whether this ACL entry is inherited from a parent folder. */
  inherited: boolean;

  /** Source folder ID if this is an inherited permission. */
  inherited_from: string | null;
}

enum AccessRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}
```

---

### SharedLink

A shareable link providing access to a document without requiring authentication.

```typescript
interface SharedLink {
  /** Unique link identifier. */
  id: string;

  /** Document ID being shared. */
  document_id: string;

  /** The share token (URL-safe, 32 characters). */
  token: string;

  /** Access role granted via this link. */
  role: AccessRole;

  /** Whether a password is required. */
  password_protected: boolean;

  /** Bcrypt hash of the password (if password-protected). */
  password_hash: string | null;

  /** When this link expires (null for no expiry). */
  expires_at: Date | null;

  /** Maximum number of accesses allowed (null for unlimited). */
  max_accesses: number | null;

  /** Current access count. */
  access_count: number;

  /** Whether this link is currently active. */
  is_active: boolean;

  /** Whether downloaders can download (vs. view-only). */
  allow_download: boolean;

  /** Creator user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last access timestamp. */
  last_accessed_at: Date | null;
}
```

---

### DocumentTemplate

A reusable template for generating documents with variable substitution.

```typescript
interface DocumentTemplate {
  /** Unique template identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** Template display name. */
  name: string;

  /** Description of what this template produces. */
  description: string | null;

  /** Category for organizing templates. */
  category: string | null;

  /** MIME type of the output document. */
  output_mime_type: string;

  /** Template content (with {{variable}} placeholders). */
  content: string;

  /** Binary template file (for DOCX/XLSX templates). */
  template_storage_path: string | null;

  /** Defined variables and their metadata. */
  variables: TemplateVariable[];

  /** Merge field data sources. */
  merge_sources: MergeFieldSource[];

  /** Tags for categorization. */
  tags: string[];

  /** Whether this template is published (visible to non-admins). */
  published: boolean;

  /** Usage count. */
  use_count: number;

  /** Creator user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last modification timestamp. */
  updated_at: Date;
}

interface TemplateVariable {
  /** Variable key (used in {{key}} placeholders). */
  key: string;

  /** Human-readable label. */
  label: string;

  /** Variable type. */
  type: TemplateVariableType;

  /** Whether this variable is required. */
  required: boolean;

  /** Default value if not provided. */
  default_value: unknown | null;

  /** Validation rules (regex, min/max, etc.). */
  validation: Record<string, unknown> | null;

  /** Help text for the user filling in this variable. */
  description: string | null;
}

enum TemplateVariableType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RICH_TEXT = 'rich_text',
  IMAGE = 'image',
  TABLE = 'table',
}

interface MergeFieldSource {
  /** Unique key for this data source. */
  key: string;

  /** Human-readable name. */
  label: string;

  /** Source module (e.g., '@mcv/nexus/crm', '@mcv/nexus/billing'). */
  module: string;

  /** Entity type in the source module (e.g., 'contact', 'invoice'). */
  entity_type: string;

  /** Field mapping: template variable key → source entity field path. */
  field_mapping: Record<string, string>;
}
```

---

### RetentionPolicy

A configurable policy for automatic document lifecycle management.

```typescript
interface RetentionPolicy {
  /** Unique policy identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** Policy display name. */
  name: string;

  /** Description. */
  description: string | null;

  /** Number of days after last modification before action is taken. */
  retention_days: number;

  /** Action to take when retention period expires. */
  action: RetentionAction;

  /** Document filter criteria (which documents this policy applies to). */
  filter: DocumentFilter;

  /** Whether this policy is currently active. */
  is_active: boolean;

  /** Whether to notify document owners before action. */
  notify_before_action: boolean;

  /** Days before action to send notification. */
  notification_days: number;

  /** Creator user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last modification timestamp. */
  updated_at: Date;
}

enum RetentionAction {
  ARCHIVE = 'archive',
  DELETE = 'delete',
  MOVE_TO_COLD = 'move_to_cold',
  NOTIFY_ONLY = 'notify_only',
}

interface DocumentFilter {
  /** Filter by MIME types. */
  mime_types?: string[];

  /** Filter by folder IDs. */
  folder_ids?: string[];

  /** Filter by tags. */
  tags?: string[];

  /** Filter by document status. */
  statuses?: DocumentStatus[];

  /** Filter by minimum size (bytes). */
  min_size?: number;

  /** Filter by maximum size (bytes). */
  max_size?: number;

  /** Custom metadata key-value filters. */
  metadata?: Record<string, unknown>;
}
```

---

### SmartFolder

A virtual folder that auto-populates based on rules.

```typescript
interface SmartFolder {
  /** Unique smart folder identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** Display name. */
  name: string;

  /** Description. */
  description: string | null;

  /** Icon identifier. */
  icon: string | null;

  /** Color for UI display. */
  color: string | null;

  /** Rules that determine which documents appear in this smart folder. */
  rules: SmartFolderRule[];

  /** How rules are combined: 'all' (AND) or 'any' (OR). */
  match_mode: 'all' | 'any';

  /** Sort field for documents in this smart folder. */
  sort_field: SortField;

  /** Sort direction. */
  sort_order: SortOrder;

  /** Maximum documents to display. */
  display_limit: number | null;

  /** Whether this smart folder is pinned to the sidebar. */
  pinned: boolean;

  /** Creator user ID. */
  created_by: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last modification timestamp. */
  updated_at: Date;
}

interface SmartFolderRule {
  /** Field to match against. */
  field: string;

  /** Comparison operator. */
  operator: SmartFolderOperator;

  /** Value to compare against. */
  value: unknown;
}

enum SmartFolderOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  BETWEEN = 'between',
  MATCHES_REGEX = 'matches_regex',
}
```

---

### StorageQuota

Per-venture or per-user storage quota configuration.

```typescript
interface StorageQuota {
  /** Unique quota identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** User ID (null for venture-level quota). */
  user_id: string | null;

  /** Maximum storage in bytes. */
  max_bytes: number;

  /** Current usage in bytes. */
  used_bytes: number;

  /** Maximum number of documents (null for unlimited). */
  max_documents: number | null;

  /** Current document count. */
  document_count: number;

  /** Maximum single file size in bytes. */
  max_file_size: number;

  /** Warning threshold (0.0–1.0, triggers notification). */
  warning_threshold: number;

  /** Whether uploads are blocked when quota is exceeded. */
  enforce_hard_limit: boolean;

  /** Last time usage was recalculated. */
  last_recalculated_at: Date;

  /** Created timestamp. */
  created_at: Date;

  /** Updated timestamp. */
  updated_at: Date;
}

interface StorageUsage {
  /** Total bytes used. */
  total_bytes: number;

  /** Bytes by storage tier. */
  by_tier: Record<StorageTier, number>;

  /** Bytes by MIME type category. */
  by_type: Record<string, number>;

  /** Top 10 largest documents. */
  largest_documents: Array<{ id: string; title: string; byte_size: number }>;

  /** Bytes saved by deduplication. */
  dedup_savings: number;

  /** Percentage of quota used. */
  usage_percentage: number;
}

enum StorageTier {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  ARCHIVE = 'archive',
}
```

---

### DocumentActivity

Audit log entry for any document-related operation.

```typescript
interface DocumentActivity {
  /** Unique activity identifier. */
  id: string;

  /** Venture scope. */
  venture_id: string;

  /** Document ID (null for folder-level or system activities). */
  document_id: string | null;

  /** Folder ID (for folder-level activities). */
  folder_id: string | null;

  /** Activity type. */
  activity_type: ActivityType;

  /** User who performed the action. */
  actor_id: string;

  /** IP address of the actor. */
  ip_address: string | null;

  /** User agent string. */
  user_agent: string | null;

  /** Human-readable description. */
  description: string;

  /** Structured details of the change. */
  details: Record<string, unknown>;

  /** Timestamp. */
  created_at: Date;
}

enum ActivityType {
  // Document lifecycle
  DOCUMENT_CREATED = 'document.created',
  DOCUMENT_UPDATED = 'document.updated',
  DOCUMENT_DELETED = 'document.deleted',
  DOCUMENT_RESTORED = 'document.restored',
  DOCUMENT_ARCHIVED = 'document.archived',
  DOCUMENT_DOWNLOADED = 'document.downloaded',
  DOCUMENT_VIEWED = 'document.viewed',
  DOCUMENT_MOVED = 'document.moved',
  DOCUMENT_COPIED = 'document.copied',
  DOCUMENT_RENAMED = 'document.renamed',

  // Version control
  VERSION_CREATED = 'version.created',
  VERSION_ROLLED_BACK = 'version.rolled_back',
  VERSION_BRANCHED = 'version.branched',
  VERSION_MERGED = 'version.merged',

  // Collaboration
  COLLABORATION_STARTED = 'collaboration.started',
  COLLABORATION_ENDED = 'collaboration.ended',
  COMMENT_ADDED = 'comment.added',
  COMMENT_RESOLVED = 'comment.resolved',
  COMMENT_DELETED = 'comment.deleted',
  SUGGESTION_CREATED = 'suggestion.created',
  SUGGESTION_ACCEPTED = 'suggestion.accepted',
  SUGGESTION_REJECTED = 'suggestion.rejected',

  // Access control
  ACCESS_GRANTED = 'access.granted',
  ACCESS_REVOKED = 'access.revoked',
  ACCESS_CHANGED = 'access.changed',
  LINK_CREATED = 'link.created',
  LINK_ACCESSED = 'link.accessed',
  LINK_REVOKED = 'link.revoked',

  // Signing
  SIGNING_REQUESTED = 'signing.requested',
  SIGNING_COMPLETED = 'signing.completed',
  SIGNING_DECLINED = 'signing.declined',

  // Retention & compliance
  LEGAL_HOLD_APPLIED = 'legal_hold.applied',
  LEGAL_HOLD_RELEASED = 'legal_hold.released',
  RETENTION_APPLIED = 'retention.applied',
  GDPR_DELETE_REQUESTED = 'gdpr.delete_requested',
  GDPR_DELETE_COMPLETED = 'gdpr.delete_completed',

  // Folder operations
  FOLDER_CREATED = 'folder.created',
  FOLDER_UPDATED = 'folder.updated',
  FOLDER_DELETED = 'folder.deleted',
  FOLDER_MOVED = 'folder.moved',
}
```

---

### DocumentTag

A tag attached to a document for categorization and search.

```typescript
interface DocumentTag {
  /** Unique tag assignment identifier. */
  id: string;

  /** Document ID. */
  document_id: string;

  /** Tag name (lowercase, trimmed). */
  tag: string;

  /** Tag color (for UI). */
  color: string | null;

  /** User who applied this tag. */
  created_by: string;

  /** When the tag was applied. */
  created_at: Date;
}
```

---

### DocumentLock

Pessimistic lock for non-CRDT documents to prevent concurrent editing.

```typescript
interface DocumentLock {
  /** Unique lock identifier. */
  id: string;

  /** Locked document ID. */
  document_id: string;

  /** User holding the lock. */
  locked_by: string;

  /** Lock type. */
  lock_type: LockType;

  /** When the lock was acquired. */
  locked_at: Date;

  /** When the lock expires (auto-release). */
  expires_at: Date;

  /** Optional reason for the lock. */
  reason: string | null;
}

enum LockType {
  /** Exclusive edit lock — only the holder can edit. */
  EXCLUSIVE = 'exclusive',

  /** Shared lock — prevents deletion but allows viewing. */
  SHARED = 'shared',
}
```

---

### CollaborationSession

Tracks an active real-time collaboration session.

```typescript
interface CollaborationSession {
  /** Unique session identifier. */
  id: string;

  /** Document being collaboratively edited. */
  document_id: string;

  /** Currently connected collaborators. */
  collaborators: CollaboratorPresence[];

  /** When the session started. */
  started_at: Date;

  /** When the last change was made. */
  last_activity_at: Date;

  /** Total number of Yjs updates in this session. */
  update_count: number;
}

interface CollaboratorPresence {
  /** User ID. */
  user_id: string;

  /** Display name. */
  display_name: string;

  /** Avatar URL. */
  avatar_url: string | null;

  /** Assigned color for cursor/selection highlighting. */
  color: string;

  /** Current cursor position (Yjs relative position). */
  cursor: unknown | null;

  /** Current selection range (Yjs relative positions). */
  selection: { start: unknown; end: unknown } | null;

  /** When this collaborator last sent an update. */
  last_seen_at: Date;

  /** Whether the collaborator is actively typing. */
  is_typing: boolean;
}
```

---

## Service Interfaces

### DocumentService

The primary service for document CRUD operations.

```typescript
interface DocumentService {
  // ── Create ────────────────────────────────────────────────────
  /**
   * Upload a new document.
   * Validates quota, sanitizes filename, stores binary content,
   * computes content hash, triggers preview/thumbnail generation.
   */
  upload(input: {
    venture_id: string;
    title: string;
    file: ReadableStream | Buffer;
    filename: string;
    mime_type: string;
    byte_size: number;
    folder_id?: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    collaboration_enabled?: boolean;
  }): Promise<Document>;

  /**
   * Create a document from a template.
   */
  createFromTemplate(input: {
    venture_id: string;
    template_id: string;
    title: string;
    variables: Record<string, unknown>;
    merge_entity_id?: string;
    folder_id?: string;
  }): Promise<Document>;

  // ── Read ──────────────────────────────────────────────────────
  /**
   * Get a document by ID. Checks access control.
   */
  getById(id: string): Promise<Document | null>;

  /**
   * List documents with filtering, sorting, and pagination.
   */
  list(input: {
    venture_id: string;
    folder_id?: string | null;
    filter?: DocumentFilter;
    sort?: { field: SortField; order: SortOrder };
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedDocuments>;

  /**
   * Get a signed download URL for a document.
   */
  getDownloadUrl(id: string, version?: number): Promise<string>;

  /**
   * Get document statistics (view count, version count, etc.).
   */
  getStats(id: string): Promise<DocumentStats>;

  // ── Update ────────────────────────────────────────────────────
  /**
   * Update document metadata (title, description, folder, etc.).
   * Does NOT create a new version — use `uploadNewVersion` for content changes.
   */
  update(id: string, input: DocumentUpdate): Promise<Document>;

  /**
   * Upload a new version of an existing document.
   */
  uploadNewVersion(id: string, input: {
    file: ReadableStream | Buffer;
    filename?: string;
    mime_type?: string;
    byte_size: number;
    change_summary?: string;
  }): Promise<DocumentVersion>;

  /**
   * Move a document to a different folder.
   */
  move(id: string, target_folder_id: string | null): Promise<Document>;

  /**
   * Copy a document (with or without version history).
   */
  copy(id: string, input: {
    target_folder_id?: string;
    title?: string;
    include_versions?: boolean;
    include_comments?: boolean;
  }): Promise<Document>;

  /**
   * Add tags to a document.
   */
  addTags(id: string, tags: string[]): Promise<DocumentTag[]>;

  /**
   * Remove tags from a document.
   */
  removeTags(id: string, tags: string[]): Promise<void>;

  // ── Delete ────────────────────────────────────────────────────
  /**
   * Soft-delete a document (moves to trash).
   * Blocked if document is under legal hold.
   */
  softDelete(id: string): Promise<void>;

  /**
   * Permanently delete a document and all its versions.
   * Requires OWNER role. Blocked if under legal hold.
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Restore a soft-deleted document.
   */
  restore(id: string): Promise<Document>;

  /**
   * Empty trash (permanently delete all soft-deleted documents).
   */
  emptyTrash(venture_id: string): Promise<{ deleted_count: number }>;

  // ── Bulk Operations ───────────────────────────────────────────
  /**
   * Perform bulk operations (move, delete, tag, etc.).
   */
  bulk(operations: BulkOperation[]): Promise<BulkResult>;
}
```

---

### FolderService

```typescript
interface FolderService {
  /**
   * Create a new folder.
   */
  create(input: FolderInsert): Promise<Folder>;

  /**
   * Get a folder by ID.
   */
  getById(id: string): Promise<Folder | null>;

  /**
   * Get the full folder tree for a venture.
   */
  getTree(venture_id: string): Promise<FolderTree[]>;

  /**
   * Get breadcrumb path from root to a specific folder.
   */
  getBreadcrumbs(id: string): Promise<Folder[]>;

  /**
   * Update a folder.
   */
  update(id: string, input: FolderUpdate): Promise<Folder>;

  /**
   * Move a folder to a new parent (updates all descendant paths).
   */
  move(id: string, new_parent_id: string | null): Promise<Folder>;

  /**
   * Delete a folder. Can optionally move contents to parent or delete recursively.
   */
  delete(id: string, options?: {
    recursive?: boolean;
    move_contents_to?: string | null;
  }): Promise<void>;

  /**
   * Get folder size (total bytes of all documents, recursively).
   */
  getSize(id: string): Promise<{ total_bytes: number; document_count: number }>;
}
```

---

### VersionService

```typescript
interface VersionService {
  /**
   * Get version history for a document.
   */
  getHistory(document_id: string, options?: {
    branch?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ versions: DocumentVersion[]; next_cursor: string | null }>;

  /**
   * Get a specific version.
   */
  getVersion(document_id: string, version_number: number): Promise<DocumentVersion | null>;

  /**
   * Diff two versions. Returns structured diff result.
   */
  diff(document_id: string, from_version: number, to_version: number): Promise<DiffResult>;

  /**
   * Roll back to a specific version (creates a new version with old content).
   */
  rollback(document_id: string, to_version: number, summary?: string): Promise<DocumentVersion>;

  /**
   * Create a named branch from a specific version.
   */
  createBranch(document_id: string, from_version: number, branch_name: string): Promise<DocumentVersion>;

  /**
   * List all branches for a document.
   */
  listBranches(document_id: string): Promise<string[]>;

  /**
   * Merge a branch into the main line.
   */
  mergeBranch(document_id: string, branch_name: string, options?: {
    strategy?: 'auto' | 'theirs' | 'ours';
    summary?: string;
  }): Promise<DocumentVersion>;

  /**
   * Delete a branch (removes branch versions, not main-line references).
   */
  deleteBranch(document_id: string, branch_name: string): Promise<void>;

  /**
   * Get download URL for a specific version.
   */
  getVersionDownloadUrl(document_id: string, version_number: number): Promise<string>;

  /**
   * Purge old versions (keep last N or versions newer than date).
   */
  purgeOldVersions(document_id: string, options: {
    keep_last?: number;
    keep_after?: Date;
  }): Promise<{ purged_count: number; freed_bytes: number }>;
}

interface DiffResult {
  /** The two versions being compared. */
  from_version: number;
  to_version: number;

  /** Whether the content type supports textual diffing. */
  is_text_diff: boolean;

  /** Diff hunks (for text documents). */
  hunks: DiffHunk[];

  /** Size difference in bytes. */
  size_delta: number;

  /** Whether the MIME type changed. */
  mime_type_changed: boolean;

  /** Summary of changes. */
  summary: string;
}

interface DiffHunk {
  /** Line number in the 'from' version where this hunk starts. */
  from_start: number;

  /** Number of lines in the 'from' version. */
  from_count: number;

  /** Line number in the 'to' version where this hunk starts. */
  to_start: number;

  /** Number of lines in the 'to' version. */
  to_count: number;

  /** The diff lines (prefixed with ' ', '+', or '-'). */
  lines: string[];
}
```

---

### CollaborationService

```typescript
interface CollaborationService {
  /**
   * Initialize a collaboration session for a document.
   * Returns the WebSocket URL and auth token.
   */
  initSession(document_id: string): Promise<{
    session_id: string;
    websocket_url: string;
    auth_token: string;
    initial_state: Uint8Array | null;
  }>;

  /**
   * Get the current collaboration session for a document (if any).
   */
  getSession(document_id: string): Promise<CollaborationSession | null>;

  /**
   * Get all active collaboration sessions for a venture.
   */
  listActiveSessions(venture_id: string): Promise<CollaborationSession[]>;

  /**
   * Force-save the current collaboration state as a new version.
   */
  forceSave(document_id: string, summary?: string): Promise<DocumentVersion>;

  /**
   * Kick a collaborator from a session (admin action).
   */
  removeCollaborator(document_id: string, user_id: string, reason?: string): Promise<void>;

  /**
   * End a collaboration session (disconnects all clients, saves final state).
   */
  endSession(document_id: string): Promise<DocumentVersion>;

  /**
   * Add a comment to a collaborative document (synced via Yjs).
   */
  addComment(document_id: string, input: CommentInsert): Promise<Comment>;

  /**
   * Resolve a comment.
   */
  resolveComment(comment_id: string): Promise<Comment>;

  /**
   * Create a suggested change (tracked as a Yjs annotation).
   */
  suggestChange(document_id: string, input: {
    anchor: CommentAnchor;
    suggested_text: string;
    reason?: string;
  }): Promise<SuggestedChange>;

  /**
   * Accept a suggested change (applies it to the document).
   */
  acceptSuggestion(suggestion_id: string): Promise<void>;

  /**
   * Reject a suggested change.
   */
  rejectSuggestion(suggestion_id: string, reason?: string): Promise<void>;
}

interface SuggestedChange {
  id: string;
  document_id: string;
  anchor: CommentAnchor;
  original_text: string;
  suggested_text: string;
  reason: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_by: string;
  created_at: Date;
  resolved_by: string | null;
  resolved_at: Date | null;
}
```

---

### TemplateService

```typescript
interface TemplateService {
  /**
   * Create a new document template.
   */
  create(input: DocumentTemplateInsert): Promise<DocumentTemplate>;

  /**
   * Get a template by ID.
   */
  getById(id: string): Promise<DocumentTemplate | null>;

  /**
   * List templates with optional category/tag filtering.
   */
  list(venture_id: string, options?: {
    category?: string;
    tags?: string[];
    published_only?: boolean;
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ templates: DocumentTemplate[]; next_cursor: string | null }>;

  /**
   * Update a template.
   */
  update(id: string, input: Partial<DocumentTemplateInsert>): Promise<DocumentTemplate>;

  /**
   * Delete a template.
   */
  delete(id: string): Promise<void>;

  /**
   * Preview a template with sample data (returns rendered content without creating a document).
   */
  preview(id: string, variables: Record<string, unknown>): Promise<{
    content: string;
    mime_type: string;
  }>;

  /**
   * Generate a document from a template.
   */
  generate(input: {
    template_id: string;
    venture_id: string;
    title: string;
    variables: Record<string, unknown>;
    merge_entity_id?: string;
    folder_id?: string;
    auto_sign?: boolean;
    signers?: Array<{ user_id: string; order: number }>;
  }): Promise<Document>;

  /**
   * Resolve merge fields from external data sources (CRM, billing, etc.).
   */
  resolveMergeFields(template_id: string, entity_id: string): Promise<Record<string, unknown>>;

  /**
   * Validate that all required variables are provided.
   */
  validateVariables(template_id: string, variables: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: Array<{ key: string; message: string }>;
  }>;
}
```

---

### AccessControlService

```typescript
interface AccessControlService {
  /**
   * Grant access to a document or folder.
   */
  grant(input: AccessControlInsert): Promise<AccessControl>;

  /**
   * Revoke access from a user or team.
   */
  revoke(input: {
    document_id?: string;
    folder_id?: string;
    user_id?: string;
    team_id?: string;
  }): Promise<void>;

  /**
   * Change a user's role on a document/folder.
   */
  changeRole(input: {
    document_id?: string;
    folder_id?: string;
    user_id?: string;
    team_id?: string;
    new_role: AccessRole;
  }): Promise<AccessControl>;

  /**
   * List all access grants for a document or folder.
   */
  listGrants(input: {
    document_id?: string;
    folder_id?: string;
  }): Promise<AccessControl[]>;

  /**
   * Check if a user has a specific level of access.
   */
  checkAccess(input: {
    document_id?: string;
    folder_id?: string;
    user_id: string;
    required_role: AccessRole;
  }): Promise<boolean>;

  /**
   * Get the effective role for a user on a document (considering inheritance).
   */
  getEffectiveRole(user_id: string, document_id: string): Promise<AccessRole | null>;

  /**
   * Create a shared link for a document.
   */
  createSharedLink(input: SharedLinkInsert): Promise<SharedLink>;

  /**
   * Validate and consume a shared link access.
   */
  accessSharedLink(token: string, password?: string): Promise<{
    document: Document;
    role: AccessRole;
    allow_download: boolean;
  }>;

  /**
   * Revoke a shared link.
   */
  revokeSharedLink(id: string): Promise<void>;

  /**
   * List all shared links for a document.
   */
  listSharedLinks(document_id: string): Promise<SharedLink[]>;

  /**
   * Transfer document ownership.
   */
  transferOwnership(document_id: string, new_owner_id: string): Promise<void>;
}
```

---

### SearchService

```typescript
interface SearchService {
  /**
   * Full-text search across all accessible documents.
   */
  search(input: SearchQuery): Promise<SearchResult>;

  /**
   * Get search suggestions (typeahead/autocomplete).
   */
  suggest(venture_id: string, query: string, limit?: number): Promise<string[]>;

  /**
   * Get facet counts for a search query (without returning documents).
   */
  getFacets(input: SearchQuery): Promise<SearchFacets>;

  /**
   * Rebuild search index for a specific document (manual re-index).
   */
  reindex(document_id: string): Promise<void>;

  /**
   * Rebuild search index for all documents in a venture.
   */
  reindexAll(venture_id: string): Promise<{ indexed_count: number }>;

  /**
   * Get recently viewed documents for the current user.
   */
  getRecentlyViewed(venture_id: string, limit?: number): Promise<Document[]>;

  /**
   * Get frequently accessed documents for the current user.
   */
  getFrequentlyAccessed(venture_id: string, limit?: number): Promise<Document[]>;
}

interface SearchQuery {
  /** Venture scope. */
  venture_id: string;

  /** Search query string (supports quoted phrases and boolean operators). */
  query: string;

  /** Filter criteria. */
  filter?: DocumentFilter;

  /** Folder scope (search within a specific folder, optionally recursive). */
  folder_id?: string;
  recursive?: boolean;

  /** Sort field and order. */
  sort?: { field: SortField; order: SortOrder };

  /** Pagination cursor. */
  cursor?: string;

  /** Results per page. */
  limit?: number;

  /** Whether to include highlighted snippets. */
  highlight?: boolean;

  /** Whether to search within document content (not just metadata). */
  search_content?: boolean;
}

interface SearchResult {
  /** Matching documents with relevance scores. */
  hits: Array<{
    document: Document;
    score: number;
    highlights: Record<string, string[]>;
  }>;

  /** Total number of matching documents. */
  total_count: number;

  /** Pagination cursor for next page. */
  next_cursor: string | null;

  /** Query execution time in milliseconds. */
  took_ms: number;

  /** Facet counts. */
  facets: SearchFacets;
}

interface SearchFacets {
  /** Document count by MIME type. */
  by_mime_type: Record<string, number>;

  /** Document count by folder. */
  by_folder: Record<string, number>;

  /** Document count by tag. */
  by_tag: Record<string, number>;

  /** Document count by date range (last 24h, last week, last month, older). */
  by_date: Record<string, number>;

  /** Document count by owner. */
  by_owner: Record<string, number>;
}

type SortField = 'relevance' | 'title' | 'created_at' | 'updated_at' | 'byte_size' | 'filename';
type SortOrder = 'asc' | 'desc';
```

---

### RetentionService

```typescript
interface RetentionService {
  /**
   * Create a retention policy.
   */
  createPolicy(input: RetentionPolicyInsert): Promise<RetentionPolicy>;

  /**
   * Update a retention policy.
   */
  updatePolicy(id: string, input: Partial<RetentionPolicyInsert>): Promise<RetentionPolicy>;

  /**
   * Delete a retention policy.
   */
  deletePolicy(id: string): Promise<void>;

  /**
   * List retention policies for a venture.
   */
  listPolicies(venture_id: string): Promise<RetentionPolicy[]>;

  /**
   * Apply a retention policy to a document.
   */
  applyPolicy(document_id: string, policy_id: string): Promise<void>;

  /**
   * Remove a retention policy from a document.
   */
  removePolicy(document_id: string): Promise<void>;

  /**
   * Place a document under legal hold (prevents deletion/modification).
   */
  applyLegalHold(document_id: string, reason: string): Promise<void>;

  /**
   * Release a legal hold.
   */
  releaseLegalHold(document_id: string, reason: string): Promise<void>;

  /**
   * Execute retention actions for all documents that have reached their retention date.
   * Typically called by a scheduled job.
   */
  executeRetentionActions(venture_id: string): Promise<{
    archived_count: number;
    deleted_count: number;
    moved_to_cold_count: number;
    notified_count: number;
    skipped_legal_hold: number;
  }>;

  /**
   * Process a GDPR right-to-delete request.
   * Permanently deletes all documents owned by the specified user,
   * anonymizes activity logs, and returns a compliance report.
   */
  processGDPRDeletion(venture_id: string, user_id: string): Promise<{
    documents_deleted: number;
    versions_purged: number;
    activities_anonymized: number;
    comments_anonymized: number;
    storage_freed_bytes: number;
    completion_timestamp: Date;
  }>;

  /**
   * Generate a retention compliance report.
   */
  generateComplianceReport(venture_id: string): Promise<{
    total_documents: number;
    with_policy: number;
    without_policy: number;
    under_legal_hold: number;
    approaching_retention: number;
    overdue_for_action: number;
  }>;
}
```

---

### SmartFolderService

```typescript
interface SmartFolderService {
  /**
   * Create a smart folder.
   */
  create(input: SmartFolderInsert): Promise<SmartFolder>;

  /**
   * Get a smart folder by ID.
   */
  getById(id: string): Promise<SmartFolder | null>;

  /**
   * List smart folders for a venture.
   */
  list(venture_id: string): Promise<SmartFolder[]>;

  /**
   * Update a smart folder.
   */
  update(id: string, input: Partial<SmartFolderInsert>): Promise<SmartFolder>;

  /**
   * Delete a smart folder.
   */
  delete(id: string): Promise<void>;

  /**
   * Get documents matching a smart folder's rules.
   */
  getDocuments(id: string, options?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedDocuments>;

  /**
   * Preview which documents would match a set of rules (before saving).
   */
  previewRules(venture_id: string, rules: SmartFolderRule[], match_mode: 'all' | 'any'): Promise<{
    document_count: number;
    sample_documents: Document[];
  }>;

  /**
   * Create a smart folder from a saved search.
   */
  createFromSearch(venture_id: string, name: string, search_query: SearchQuery): Promise<SmartFolder>;
}
```

---

### StorageService

```typescript
interface StorageService {
  /**
   * Get storage usage for a venture.
   */
  getUsage(venture_id: string): Promise<StorageUsage>;

  /**
   * Get storage usage for a specific user.
   */
  getUserUsage(venture_id: string, user_id: string): Promise<StorageUsage>;

  /**
   * Get or create a storage quota.
   */
  getQuota(venture_id: string, user_id?: string): Promise<StorageQuota>;

  /**
   * Update a storage quota.
   */
  updateQuota(id: string, input: Partial<StorageQuotaInsert>): Promise<StorageQuota>;

  /**
   * Check if an upload would exceed quota.
   */
  checkQuota(venture_id: string, user_id: string, byte_size: number): Promise<QuotaEnforcement>;

  /**
   * Recalculate storage usage (fixes any drift).
   */
  recalculate(venture_id: string): Promise<StorageUsage>;

  /**
   * Get storage analytics (trends, growth, projections).
   */
  getAnalytics(venture_id: string, options?: {
    period_days?: number;
  }): Promise<StorageAnalytics>;

  /**
   * Run deduplication analysis (find duplicate content).
   */
  analyzeDuplication(venture_id: string): Promise<{
    duplicate_groups: Array<{
      content_hash: string;
      byte_size: number;
      documents: Array<{ id: string; title: string }>;
    }>;
    total_wasted_bytes: number;
    potential_savings_bytes: number;
  }>;

  /**
   * Move documents between storage tiers.
   */
  migrateTier(document_ids: string[], target_tier: StorageTier): Promise<{
    migrated_count: number;
    failed_count: number;
    errors: Array<{ document_id: string; error: string }>;
  }>;

  /**
   * Run automatic tiering based on access patterns.
   */
  autoTier(venture_id: string): Promise<{
    moved_to_warm: number;
    moved_to_cold: number;
    moved_to_archive: number;
    bytes_migrated: number;
  }>;
}

interface QuotaEnforcement {
  /** Whether the upload is allowed. */
  allowed: boolean;

  /** Current usage in bytes. */
  current_usage: number;

  /** Quota limit in bytes. */
  quota_limit: number;

  /** Usage after upload would be (bytes). */
  projected_usage: number;

  /** Usage percentage after upload. */
  projected_percentage: number;

  /** Whether the warning threshold would be exceeded. */
  exceeds_warning: boolean;

  /** Whether the hard limit would be exceeded. */
  exceeds_hard_limit: boolean;

  /** Human-readable message. */
  message: string;
}

interface StorageAnalytics {
  /** Daily usage data points. */
  daily_usage: Array<{ date: string; bytes: number; document_count: number }>;

  /** Average daily growth in bytes. */
  avg_daily_growth: number;

  /** Projected days until quota is reached. */
  days_until_full: number | null;

  /** Most active uploaders. */
  top_uploaders: Array<{ user_id: string; bytes_uploaded: number; document_count: number }>;

  /** Upload count by MIME type category. */
  uploads_by_type: Record<string, number>;

  /** Bytes by storage tier. */
  by_tier: Record<StorageTier, number>;
}
```

---

### PreviewService

```typescript
interface PreviewService {
  /**
   * Generate a preview for a document.
   */
  generatePreview(document_id: string, version?: number): Promise<PreviewResult>;

  /**
   * Get the preview URL for a document (generates if not cached).
   */
  getPreviewUrl(document_id: string, version?: number): Promise<string | null>;

  /**
   * Generate thumbnails for a document.
   */
  generateThumbnails(document_id: string): Promise<Record<ThumbnailSize, string>>;

  /**
   * Check if a MIME type is supported for preview.
   */
  isPreviewable(mime_type: string): boolean;

  /**
   * Regenerate preview (force, even if cached).
   */
  regeneratePreview(document_id: string): Promise<PreviewResult>;

  /**
   * Batch generate previews for multiple documents.
   */
  batchGenerate(document_ids: string[]): Promise<Map<string, PreviewResult>>;
}

interface PreviewResult {
  /** Whether preview generation succeeded. */
  success: boolean;

  /** Preview URL (for successful generations). */
  url: string | null;

  /** Preview MIME type (usually 'application/pdf' or 'text/html'). */
  preview_mime_type: string | null;

  /** Number of pages (for PDF previews). */
  page_count: number | null;

  /** Thumbnail URLs. */
  thumbnails: Record<ThumbnailSize, string> | null;

  /** Error message (for failed generations). */
  error: string | null;

  /** Processing time in milliseconds. */
  processing_time_ms: number;
}

type ThumbnailSize = 'sm' | 'md' | 'lg';
```

---

## Database Schemas

All schemas are defined using Drizzle ORM and enforce multi-tenant isolation via `venture_id` with PostgreSQL Row-Level Security (RLS).

### documents table

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tsvector } from '../custom-types';

export const documents = pgTable('documents', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  venture_id:             uuid('venture_id').notNull().references(() => ventures.id),
  title:                  text('title').notNull(),
  filename:               text('filename').notNull(),
  mime_type:              text('mime_type').notNull(),
  byte_size:              integer('byte_size').notNull(),
  folder_id:              uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  current_version:        integer('current_version').notNull().default(1),
  status:                 text('status').notNull().default('active'),
  description:            text('description'),
  content_hash:           text('content_hash').notNull(),
  storage_path:           text('storage_path').notNull(),
  search_vector:          tsvector('search_vector'),
  extracted_text:         text('extracted_text'),
  collaboration_enabled:  boolean('collaboration_enabled').notNull().default(false),
  yjs_state:              bytea('yjs_state'),
  legal_hold:             boolean('legal_hold').notNull().default(false),
  retention_policy_id:    uuid('retention_policy_id').references(() => retentionPolicies.id, { onDelete: 'set null' }),
  archive_at:             timestamp('archive_at', { withTimezone: true }),
  purge_at:               timestamp('purge_at', { withTimezone: true }),
  signing_status:         text('signing_status'),
  signing_request_id:     uuid('signing_request_id'),
  thumbnails:             jsonb('thumbnails'),
  preview_url:            text('preview_url'),
  preview_status:         text('preview_status').notNull().default('pending'),
  metadata:               jsonb('metadata').notNull().default({}),
  created_by:             uuid('created_by').notNull().references(() => users.id),
  created_at:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:             timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  // Multi-tenant index (every query uses this)
  ventureIdx:         index('documents_venture_id_idx').on(table.venture_id),

  // Folder browsing
  folderIdx:          index('documents_folder_id_idx').on(table.venture_id, table.folder_id),

  // Status filtering
  statusIdx:          index('documents_status_idx').on(table.venture_id, table.status),

  // Full-text search (GIN index on tsvector)
  searchIdx:          index('documents_search_vector_idx').using('gin', table.search_vector),

  // Trigram index for fuzzy filename search
  filenameTrigramIdx: index('documents_filename_trgm_idx').using('gin', table.filename),

  // Content hash for deduplication lookup
  contentHashIdx:     index('documents_content_hash_idx').on(table.content_hash),

  // Retention processing
  archiveAtIdx:       index('documents_archive_at_idx').on(table.archive_at).where(sql`archive_at IS NOT NULL`),
  purgeAtIdx:         index('documents_purge_at_idx').on(table.purge_at).where(sql`purge_at IS NOT NULL`),

  // Creator for user-scoped queries
  createdByIdx:       index('documents_created_by_idx').on(table.venture_id, table.created_by),

  // Soft-delete filter
  deletedAtIdx:       index('documents_deleted_at_idx').on(table.deleted_at).where(sql`deleted_at IS NOT NULL`),

  // Signing status for workflow queries
  signingIdx:         index('documents_signing_status_idx').on(table.signing_status).where(sql`signing_status IS NOT NULL`),
}));
```

**RLS Policy:**

```sql
-- Users can only see documents in their venture
CREATE POLICY documents_venture_isolation ON documents
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Additional access control check via access_controls table
CREATE POLICY documents_access_control ON documents
  FOR SELECT USING (
    created_by = current_setting('app.current_user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM access_controls ac
      WHERE ac.document_id = documents.id
        AND (ac.user_id = current_setting('app.current_user_id')::uuid
             OR ac.team_id IN (SELECT team_id FROM team_members WHERE user_id = current_setting('app.current_user_id')::uuid))
        AND (ac.expires_at IS NULL OR ac.expires_at > now())
    )
  );
```

---

### document_versions table

```typescript
export const documentVersions = pgTable('document_versions', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  document_id:            uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  version_number:         integer('version_number').notNull(),
  content_hash:           text('content_hash').notNull(),
  storage_path:           text('storage_path').notNull(),
  byte_size:              integer('byte_size').notNull(),
  mime_type:              text('mime_type').notNull(),
  yjs_state:              bytea('yjs_state'),
  change_summary:         text('change_summary'),
  auto_summary:           text('auto_summary'),
  branch:                 text('branch'),
  branched_from_version:  integer('branched_from_version'),
  is_merge:               boolean('is_merge').notNull().default(false),
  created_by:             uuid('created_by').notNull().references(() => users.id),
  created_at:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique version per document + branch combination
  uniqueVersion:    uniqueIndex('document_versions_unique_idx')
                      .on(table.document_id, table.version_number, table.branch),

  // Version history lookup (ordered by version number)
  historyIdx:       index('document_versions_history_idx')
                      .on(table.document_id, table.branch, table.version_number),

  // Content hash for deduplication
  contentHashIdx:   index('document_versions_content_hash_idx').on(table.content_hash),
}));
```

---

### folders table

```typescript
export const folders = pgTable('folders', {
  id:               uuid('id').primaryKey().defaultRandom(),
  venture_id:       uuid('venture_id').notNull().references(() => ventures.id),
  name:             text('name').notNull(),
  parent_id:        uuid('parent_id').references(() => folders.id, { onDelete: 'cascade' }),
  path:             text('path').notNull(),
  depth:            integer('depth').notNull().default(0),
  color:            text('color'),
  icon:             text('icon'),
  description:      text('description'),
  inherit_access:   boolean('inherit_access').notNull().default(true),
  sort_order:       integer('sort_order').notNull().default(0),
  metadata:         jsonb('metadata').notNull().default({}),
  created_by:       uuid('created_by').notNull().references(() => users.id),
  created_at:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:       timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx:     index('folders_venture_id_idx').on(table.venture_id),
  parentIdx:      index('folders_parent_id_idx').on(table.parent_id),
  pathIdx:        index('folders_path_idx').on(table.venture_id, table.path),
  uniqueName:     uniqueIndex('folders_unique_name_idx').on(table.venture_id, table.parent_id, table.name),
}));
```

---

### document_tags table

```typescript
export const documentTags = pgTable('document_tags', {
  id:             uuid('id').primaryKey().defaultRandom(),
  document_id:    uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  tag:            text('tag').notNull(),
  color:          text('color'),
  created_by:     uuid('created_by').notNull().references(() => users.id),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  documentIdx:    index('document_tags_document_id_idx').on(table.document_id),
  tagIdx:         index('document_tags_tag_idx').on(table.tag),
  uniqueTag:      uniqueIndex('document_tags_unique_idx').on(table.document_id, table.tag),
  // GIN index for array-style tag queries
  tagGinIdx:      index('document_tags_gin_idx').using('gin', table.tag),
}));
```

---

### comments table

```typescript
export const comments = pgTable('comments', {
  id:             uuid('id').primaryKey().defaultRandom(),
  document_id:    uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  parent_id:      uuid('parent_id').references(() => comments.id, { onDelete: 'cascade' }),
  body:           text('body').notNull(),
  anchor:         jsonb('anchor'),
  mentions:       jsonb('mentions').notNull().default([]),
  status:         text('status').notNull().default('active'),
  resolved_by:    uuid('resolved_by').references(() => users.id),
  resolved_at:    timestamp('resolved_at', { withTimezone: true }),
  created_by:     uuid('created_by').notNull().references(() => users.id),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:     timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  documentIdx:  index('comments_document_id_idx').on(table.document_id),
  parentIdx:    index('comments_parent_id_idx').on(table.parent_id),
  statusIdx:    index('comments_status_idx').on(table.document_id, table.status),
}));
```

---

### access_controls table

```typescript
export const accessControls = pgTable('access_controls', {
  id:               uuid('id').primaryKey().defaultRandom(),
  document_id:      uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  folder_id:        uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  user_id:          uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  team_id:          uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  role:             text('role').notNull(),
  granted_by:       uuid('granted_by').notNull().references(() => users.id),
  granted_at:       timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  expires_at:       timestamp('expires_at', { withTimezone: true }),
  inherited:        boolean('inherited').notNull().default(false),
  inherited_from:   uuid('inherited_from').references(() => folders.id),
}, (table) => ({
  documentIdx:    index('access_controls_document_id_idx').on(table.document_id),
  folderIdx:      index('access_controls_folder_id_idx').on(table.folder_id),
  userIdx:        index('access_controls_user_id_idx').on(table.user_id),
  teamIdx:        index('access_controls_team_id_idx').on(table.team_id),
  uniqueDocUser:  uniqueIndex('access_controls_doc_user_unique_idx')
                    .on(table.document_id, table.user_id)
                    .where(sql`document_id IS NOT NULL AND user_id IS NOT NULL`),
  uniqueDocTeam:  uniqueIndex('access_controls_doc_team_unique_idx')
                    .on(table.document_id, table.team_id)
                    .where(sql`document_id IS NOT NULL AND team_id IS NOT NULL`),
  uniqueFolderUser: uniqueIndex('access_controls_folder_user_unique_idx')
                      .on(table.folder_id, table.user_id)
                      .where(sql`folder_id IS NOT NULL AND user_id IS NOT NULL`),
  uniqueFolderTeam: uniqueIndex('access_controls_folder_team_unique_idx')
                      .on(table.folder_id, table.team_id)
                      .where(sql`folder_id IS NOT NULL AND team_id IS NOT NULL`),
}));
```

---

### shared_links table

```typescript
export const sharedLinks = pgTable('shared_links', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  document_id:          uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  token:                text('token').notNull().unique(),
  role:                 text('role').notNull().default('viewer'),
  password_protected:   boolean('password_protected').notNull().default(false),
  password_hash:        text('password_hash'),
  expires_at:           timestamp('expires_at', { withTimezone: true }),
  max_accesses:         integer('max_accesses'),
  access_count:         integer('access_count').notNull().default(0),
  is_active:            boolean('is_active').notNull().default(true),
  allow_download:       boolean('allow_download').notNull().default(true),
  created_by:           uuid('created_by').notNull().references(() => users.id),
  created_at:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  last_accessed_at:     timestamp('last_accessed_at', { withTimezone: true }),
}, (table) => ({
  tokenIdx:       uniqueIndex('shared_links_token_idx').on(table.token),
  documentIdx:    index('shared_links_document_id_idx').on(table.document_id),
  activeIdx:      index('shared_links_active_idx').on(table.is_active).where(sql`is_active = true`),
}));
```

---

### document_templates table

```typescript
export const documentTemplates = pgTable('document_templates', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  venture_id:             uuid('venture_id').notNull().references(() => ventures.id),
  name:                   text('name').notNull(),
  description:            text('description'),
  category:               text('category'),
  output_mime_type:       text('output_mime_type').notNull(),
  content:                text('content').notNull(),
  template_storage_path:  text('template_storage_path'),
  variables:              jsonb('variables').notNull().default([]),
  merge_sources:          jsonb('merge_sources').notNull().default([]),
  tags:                   jsonb('tags').notNull().default([]),
  published:              boolean('published').notNull().default(false),
  use_count:              integer('use_count').notNull().default(0),
  created_by:             uuid('created_by').notNull().references(() => users.id),
  created_at:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:     index('document_templates_venture_id_idx').on(table.venture_id),
  categoryIdx:    index('document_templates_category_idx').on(table.venture_id, table.category),
  publishedIdx:   index('document_templates_published_idx').on(table.venture_id, table.published),
}));
```

---

### retention_policies table

```typescript
export const retentionPolicies = pgTable('retention_policies', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  venture_id:             uuid('venture_id').notNull().references(() => ventures.id),
  name:                   text('name').notNull(),
  description:            text('description'),
  retention_days:         integer('retention_days').notNull(),
  action:                 text('action').notNull(),
  filter:                 jsonb('filter').notNull().default({}),
  is_active:              boolean('is_active').notNull().default(true),
  notify_before_action:   boolean('notify_before_action').notNull().default(true),
  notification_days:      integer('notification_days').notNull().default(7),
  created_by:             uuid('created_by').notNull().references(() => users.id),
  created_at:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:   index('retention_policies_venture_id_idx').on(table.venture_id),
  activeIdx:    index('retention_policies_active_idx').on(table.venture_id, table.is_active),
}));
```

---

### smart_folder_rules table

```typescript
export const smartFolderRules = pgTable('smart_folder_rules', {
  id:             uuid('id').primaryKey().defaultRandom(),
  venture_id:     uuid('venture_id').notNull().references(() => ventures.id),
  name:           text('name').notNull(),
  description:    text('description'),
  icon:           text('icon'),
  color:          text('color'),
  rules:          jsonb('rules').notNull().default([]),
  match_mode:     text('match_mode').notNull().default('all'),
  sort_field:     text('sort_field').notNull().default('updated_at'),
  sort_order:     text('sort_order').notNull().default('desc'),
  display_limit:  integer('display_limit'),
  pinned:         boolean('pinned').notNull().default(false),
  created_by:     uuid('created_by').notNull().references(() => users.id),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:   index('smart_folder_rules_venture_id_idx').on(table.venture_id),
  pinnedIdx:    index('smart_folder_rules_pinned_idx').on(table.venture_id, table.pinned),
}));
```

---

### storage_quotas table

```typescript
export const storageQuotas = pgTable('storage_quotas', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  venture_id:             uuid('venture_id').notNull().references(() => ventures.id),
  user_id:                uuid('user_id').references(() => users.id),
  max_bytes:              bigint('max_bytes', { mode: 'number' }).notNull(),
  used_bytes:             bigint('used_bytes', { mode: 'number' }).notNull().default(0),
  max_documents:          integer('max_documents'),
  document_count:         integer('document_count').notNull().default(0),
  max_file_size:          bigint('max_file_size', { mode: 'number' }).notNull(),
  warning_threshold:      real('warning_threshold').notNull().default(0.8),
  enforce_hard_limit:     boolean('enforce_hard_limit').notNull().default(true),
  last_recalculated_at:   timestamp('last_recalculated_at', { withTimezone: true }).notNull().defaultNow(),
  created_at:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:       index('storage_quotas_venture_id_idx').on(table.venture_id),
  uniqueVenture:    uniqueIndex('storage_quotas_venture_unique_idx')
                      .on(table.venture_id)
                      .where(sql`user_id IS NULL`),
  uniqueUser:       uniqueIndex('storage_quotas_user_unique_idx')
                      .on(table.venture_id, table.user_id)
                      .where(sql`user_id IS NOT NULL`),
}));
```

---

### document_activities table

```typescript
export const documentActivities = pgTable('document_activities', {
  id:               uuid('id').primaryKey().defaultRandom(),
  venture_id:       uuid('venture_id').notNull().references(() => ventures.id),
  document_id:      uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
  folder_id:        uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  activity_type:    text('activity_type').notNull(),
  actor_id:         uuid('actor_id').notNull().references(() => users.id),
  ip_address:       text('ip_address'),
  user_agent:       text('user_agent'),
  description:      text('description').notNull(),
  details:          jsonb('details').notNull().default({}),
  created_at:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:     index('document_activities_venture_id_idx').on(table.venture_id),
  documentIdx:    index('document_activities_document_id_idx').on(table.document_id),
  actorIdx:       index('document_activities_actor_id_idx').on(table.actor_id),
  typeIdx:        index('document_activities_type_idx').on(table.venture_id, table.activity_type),
  createdAtIdx:   index('document_activities_created_at_idx').on(table.venture_id, table.created_at),
}));
```

---

### document_locks table

```typescript
export const documentLocks = pgTable('document_locks', {
  id:             uuid('id').primaryKey().defaultRandom(),
  document_id:    uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }).unique(),
  locked_by:      uuid('locked_by').notNull().references(() => users.id),
  lock_type:      text('lock_type').notNull().default('exclusive'),
  locked_at:      timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
  expires_at:     timestamp('expires_at', { withTimezone: true }).notNull(),
  reason:         text('reason'),
}, (table) => ({
  documentIdx:  uniqueIndex('document_locks_document_id_idx').on(table.document_id),
  expiresIdx:   index('document_locks_expires_at_idx').on(table.expires_at),
}));
```

---

### collaboration_sessions table

```typescript
export const collaborationSessions = pgTable('collaboration_sessions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  document_id:        uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  collaborators:      jsonb('collaborators').notNull().default([]),
  started_at:         timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  last_activity_at:   timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  update_count:       integer('update_count').notNull().default(0),
  ended_at:           timestamp('ended_at', { withTimezone: true }),
}, (table) => ({
  documentIdx:    index('collaboration_sessions_document_id_idx').on(table.document_id),
  activeIdx:      index('collaboration_sessions_active_idx')
                    .on(table.document_id)
                    .where(sql`ended_at IS NULL`),
}));
```

---

## Code Examples

### Example 1: Upload a Document

```typescript
import { DocumentService } from '@mcv/nexus/documents';

const documentService = new DocumentService(ctx);

// Upload a new document
const document = await documentService.upload({
  venture_id: ctx.ventureId,
  title: 'Q4 2025 Financial Report',
  file: fileBuffer,
  filename: 'q4-2025-financial-report.pdf',
  mime_type: 'application/pdf',
  byte_size: fileBuffer.byteLength,
  folder_id: financeFolderId,
  description: 'Quarterly financial report for Q4 2025',
  tags: ['finance', 'quarterly', '2025', 'q4'],
  metadata: {
    department: 'finance',
    fiscal_year: 2025,
    quarter: 4,
  },
});

console.log(document.id);
// → "01932a4b-7c8d-7e5f-a123-456789abcdef"

console.log(document.current_version);
// → 1

console.log(document.content_hash);
// → "sha256:a1b2c3d4e5f6..."

// Upload a new version later
const newVersion = await documentService.uploadNewVersion(document.id, {
  file: updatedFileBuffer,
  byte_size: updatedFileBuffer.byteLength,
  change_summary: 'Updated revenue projections based on December actuals',
});

console.log(newVersion.version_number);
// → 2
```

---

### Example 2: Folder Hierarchy and Navigation

```typescript
import { FolderService } from '@mcv/nexus/documents';

const folderService = new FolderService(ctx);

// Create folder hierarchy
const rootFolder = await folderService.create({
  venture_id: ctx.ventureId,
  name: 'Finance',
  parent_id: null,
  color: '#2563eb',
  icon: 'calculator',
});

const quarterlyFolder = await folderService.create({
  venture_id: ctx.ventureId,
  name: '2025',
  parent_id: rootFolder.id,
});

const q4Folder = await folderService.create({
  venture_id: ctx.ventureId,
  name: 'Q4',
  parent_id: quarterlyFolder.id,
});

// Get the full tree
const tree = await folderService.getTree(ctx.ventureId);
// → [
//     {
//       name: 'Finance',
//       path: '/Finance',
//       depth: 0,
//       document_count: 5,
//       total_size: 15728640,
//       children: [
//         {
//           name: '2025',
//           path: '/Finance/2025',
//           depth: 1,
//           children: [
//             { name: 'Q4', path: '/Finance/2025/Q4', depth: 2, children: [], ... }
//           ], ...
//         }
//       ], ...
//     }
//   ]

// Breadcrumb navigation
const breadcrumbs = await folderService.getBreadcrumbs(q4Folder.id);
// → [
//     { name: 'Finance', id: '...' },
//     { name: '2025', id: '...' },
//     { name: 'Q4', id: '...' },
//   ]

// Get folder size
const size = await folderService.getSize(rootFolder.id);
// → { total_bytes: 52428800, document_count: 23 }
```

---

### Example 3: Real-Time Collaboration

```typescript
import { CollaborationService, useCollaboration } from '@mcv/nexus/documents';

// ── Server-side: Initialize session ─────────────────────────────
const collaborationService = new CollaborationService(ctx);

const session = await collaborationService.initSession(documentId);
// → {
//     session_id: '...',
//     websocket_url: 'wss://collab.mcv.one/doc/...',
//     auth_token: 'eyJ...',
//     initial_state: Uint8Array([...]),
//   }

// ── Client-side: React hook for collaborative editing ───────────
function DocumentEditor({ documentId }: { documentId: string }) {
  const {
    ydoc,
    provider,
    collaborators,
    isConnected,
    isSynced,
  } = useCollaboration(documentId);

  // ydoc is a Y.Doc — bind it to your editor (TipTap, ProseMirror, etc.)
  // collaborators shows who else is editing (with cursor positions)
  // isConnected tracks WebSocket state
  // isSynced indicates initial sync complete

  return (
    <div>
      <CollaboratorAvatars collaborators={collaborators} />
      <Editor ydoc={ydoc} />
      {!isConnected && <ReconnectingBanner />}
    </div>
  );
}

// ── Add a comment with anchor ────────────────────────────────────
const comment = await collaborationService.addComment(documentId, {
  document_id: documentId,
  body: 'These numbers look off — @jane can you double-check?',
  anchor: {
    type: 'range',
    yjs_relative_position: relativePosition,
    quoted_text: 'Revenue increased 45% YoY',
  },
  mentions: [janeUserId],
  created_by: ctx.userId,
});

// ── Suggest a change ─────────────────────────────────────────────
const suggestion = await collaborationService.suggestChange(documentId, {
  anchor: {
    type: 'range',
    yjs_relative_position: relativePosition,
    quoted_text: 'Revenue increased 45% YoY',
  },
  suggested_text: 'Revenue increased 43% YoY (adjusted for one-time items)',
  reason: 'Adjusted figure excludes the one-time asset sale in September.',
});

// Accept or reject the suggestion
await collaborationService.acceptSuggestion(suggestion.id);
```

---

### Example 4: Full-Text Search with Facets

```typescript
import { SearchService } from '@mcv/nexus/documents';

const searchService = new SearchService(ctx);

// Full-text search with filters
const results = await searchService.search({
  venture_id: ctx.ventureId,
  query: '"financial report" revenue 2025',
  filter: {
    mime_types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    tags: ['finance'],
  },
  sort: { field: 'relevance', order: 'desc' },
  highlight: true,
  search_content: true,
  limit: 20,
});

console.log(results.total_count);
// → 7

console.log(results.took_ms);
// → 23

for (const hit of results.hits) {
  console.log(`[${hit.score.toFixed(2)}] ${hit.document.title}`);
  console.log(`  Highlights: ${hit.highlights.extracted_text?.join(' ... ')}`);
}
// → [0.95] Q4 2025 Financial Report
//     Highlights: ...total <mark>revenue</mark> for <mark>2025</mark> exceeded...
// → [0.87] Annual Financial Summary 2025
//     Highlights: ...the <mark>financial report</mark> shows <mark>revenue</mark> growth...

// Faceted results
console.log(results.facets.by_mime_type);
// → { 'application/pdf': 5, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 2 }

console.log(results.facets.by_tag);
// → { 'finance': 7, 'quarterly': 4, '2025': 7, 'audit': 2 }

// Typeahead suggestions
const suggestions = await searchService.suggest(ctx.ventureId, 'fin');
// → ['financial report', 'finance department', 'final draft', 'findings']

// Recently viewed
const recent = await searchService.getRecentlyViewed(ctx.ventureId, 5);
```

---

### Example 5: Document Templates with Merge Fields

```typescript
import { TemplateService } from '@mcv/nexus/documents';

const templateService = new TemplateService(ctx);

// Create a contract template
const template = await templateService.create({
  venture_id: ctx.ventureId,
  name: 'Service Agreement',
  description: 'Standard service agreement template with auto-populated client details',
  category: 'Legal',
  output_mime_type: 'application/pdf',
  content: `
# SERVICE AGREEMENT

**Date:** {{date}}
**Agreement Number:** {{agreement_number}}

## Parties

**Service Provider:** MCV Ventures Inc.
**Client:** {{client.name}}
**Client Address:** {{client.address}}
**Client Contact:** {{client.contact_name}} ({{client.contact_email}})

## Scope of Services

{{scope_description}}

## Term

This agreement is effective from **{{start_date}}** to **{{end_date}}**.

## Compensation

Total contract value: **{{currency}} {{total_amount}}**
Payment terms: {{payment_terms}}

## Signatures

_________________________          _________________________
MCV Ventures Inc.                   {{client.name}}
Date: ___________                   Date: ___________
  `.trim(),
  variables: [
    { key: 'date', label: 'Agreement Date', type: 'date', required: true, default_value: null, validation: null, description: null },
    { key: 'agreement_number', label: 'Agreement Number', type: 'string', required: true, default_value: null, validation: { pattern: '^SA-\\d{6}$' }, description: 'Format: SA-XXXXXX' },
    { key: 'scope_description', label: 'Scope of Services', type: 'rich_text', required: true, default_value: null, validation: null, description: 'Detailed description of services to be provided' },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true, default_value: null, validation: null, description: null },
    { key: 'end_date', label: 'End Date', type: 'date', required: true, default_value: null, validation: null, description: null },
    { key: 'currency', label: 'Currency', type: 'select', required: true, default_value: 'USD', validation: { options: ['USD', 'CAD', 'EUR', 'GBP'] }, description: null },
    { key: 'total_amount', label: 'Total Amount', type: 'number', required: true, default_value: null, validation: { min: 0 }, description: null },
    { key: 'payment_terms', label: 'Payment Terms', type: 'select', required: true, default_value: 'Net 30', validation: { options: ['Net 15', 'Net 30', 'Net 60', 'Upon Completion'] }, description: null },
  ],
  merge_sources: [
    {
      key: 'client',
      label: 'Client from CRM',
      module: '@mcv/nexus/crm',
      entity_type: 'contact',
      field_mapping: {
        'client.name': 'company_name',
        'client.address': 'billing_address',
        'client.contact_name': 'primary_contact.full_name',
        'client.contact_email': 'primary_contact.email',
      },
    },
  ],
  tags: ['legal', 'contract', 'service-agreement'],
  published: true,
  created_by: ctx.userId,
});

// Resolve merge fields from CRM
const mergeData = await templateService.resolveMergeFields(template.id, crmContactId);
// → { 'client.name': 'Acme Corp', 'client.address': '123 Main St...', ... }

// Generate a document from the template
const document = await templateService.generate({
  template_id: template.id,
  venture_id: ctx.ventureId,
  title: 'Service Agreement — Acme Corp',
  variables: {
    date: '2025-12-01',
    agreement_number: 'SA-001234',
    scope_description: 'Comprehensive software development and maintenance services...',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    currency: 'USD',
    total_amount: 150000,
    payment_terms: 'Net 30',
  },
  merge_entity_id: crmContactId,
  folder_id: contractsFolderId,
  auto_sign: true,
  signers: [
    { user_id: ctoUserId, order: 1 },
    { user_id: clientSignerId, order: 2 },
  ],
});

// Document is created and automatically sent for e-signing
console.log(document.signing_status);
// → 'pending'
```

---

### Example 6: Access Control and Link Sharing

```typescript
import { AccessControlService, AccessRole } from '@mcv/nexus/documents';

const accessService = new AccessControlService(ctx);

// Grant editor access to a team member
await accessService.grant({
  document_id: documentId,
  user_id: colleagueUserId,
  role: AccessRole.EDITOR,
  granted_by: ctx.userId,
});

// Grant viewer access to an entire team
await accessService.grant({
  document_id: documentId,
  team_id: marketingTeamId,
  role: AccessRole.VIEWER,
  granted_by: ctx.userId,
});

// Check access before an operation
const canEdit = await accessService.checkAccess({
  document_id: documentId,
  user_id: someUserId,
  required_role: AccessRole.EDITOR,
});

if (!canEdit) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have edit access to this document.' });
}

// Get effective role (considers folder inheritance)
const effectiveRole = await accessService.getEffectiveRole(someUserId, documentId);
// → 'viewer' (inherited from parent folder)

// Create a password-protected, expiring shared link
const link = await accessService.createSharedLink({
  document_id: documentId,
  role: AccessRole.VIEWER,
  password_protected: true,
  password_hash: await bcrypt.hash('secret123', 12),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  max_accesses: 10,
  allow_download: false,
  created_by: ctx.userId,
});

console.log(`Share URL: https://app.mcv.one/d/${link.token}`);
// → "Share URL: https://app.mcv.one/d/xK9mP2qR..."

// Access the shared link (from the recipient's side)
const { document, role, allow_download } = await accessService.accessSharedLink(
  link.token,
  'secret123'
);

// List all grants for audit
const grants = await accessService.listGrants({ document_id: documentId });
// → [
//     { user_id: '...', role: 'owner', ... },
//     { user_id: '...', role: 'editor', ... },
//     { team_id: '...', role: 'viewer', ... },
//   ]
```

---

### Example 7: Version Control with Branching

```typescript
import { VersionService } from '@mcv/nexus/documents';

const versionService = new VersionService(ctx);

// Get version history
const { versions } = await versionService.getHistory(documentId);
// → [
//     { version_number: 3, change_summary: 'Updated financials', created_at: '...', ... },
//     { version_number: 2, change_summary: 'Added executive summary', created_at: '...', ... },
//     { version_number: 1, change_summary: null, created_at: '...', ... },
//   ]

// Diff two versions
const diff = await versionService.diff(documentId, 1, 3);

console.log(diff.summary);
// → "42 lines added, 7 lines removed across 5 sections"

for (const hunk of diff.hunks) {
  console.log(`@@ -${hunk.from_start},${hunk.from_count} +${hunk.to_start},${hunk.to_count} @@`);
  for (const line of hunk.lines) {
    console.log(line);
  }
}

// Rollback to version 1
const restored = await versionService.rollback(documentId, 1, 'Reverting to original draft per legal review');
console.log(restored.version_number);
// → 4 (rollback creates a new version)

// Create a branch for review
const branch = await versionService.createBranch(documentId, 3, 'legal-review');

// List branches
const branches = await versionService.listBranches(documentId);
// → ['main', 'legal-review']

// After changes on the branch, merge it back
const merged = await versionService.mergeBranch(documentId, 'legal-review', {
  strategy: 'auto',
  summary: 'Merged legal review changes',
});

// Clean up the branch
await versionService.deleteBranch(documentId, 'legal-review');

// Purge old versions to save storage
const purged = await versionService.purgeOldVersions(documentId, {
  keep_last: 10,
});
console.log(`Purged ${purged.purged_count} versions, freed ${purged.freed_bytes} bytes`);
```

---

### Example 8: Retention Policies and GDPR Compliance

```typescript
import { RetentionService, RetentionAction } from '@mcv/nexus/documents';

const retentionService = new RetentionService(ctx);

// Create a retention policy: archive after 2 years, delete after 7 years
const policy = await retentionService.createPolicy({
  venture_id: ctx.ventureId,
  name: 'Standard Financial Records',
  description: 'Financial documents are archived after 2 years and permanently deleted after 7 years.',
  retention_days: 730, // 2 years for archive
  action: RetentionAction.ARCHIVE,
  filter: {
    tags: ['finance'],
    folder_ids: [financeFolderId],
  },
  is_active: true,
  notify_before_action: true,
  notification_days: 30,
  created_by: ctx.userId,
});

// Apply the policy to a specific document
await retentionService.applyPolicy(documentId, policy.id);

// Place a document under legal hold (overrides retention)
await retentionService.applyLegalHold(documentId, 'Pending litigation — case #LIT-2025-0042');

// Try to delete a document under legal hold — will fail
try {
  await documentService.softDelete(documentId);
} catch (error) {
  console.error(error.message);
  // → "Cannot delete document: document is under legal hold (case #LIT-2025-0042)"
}

// Release the legal hold when litigation concludes
await retentionService.releaseLegalHold(documentId, 'Litigation resolved — case dismissed');

// Execute retention actions (typically run by a cron job)
const retentionResult = await retentionService.executeRetentionActions(ctx.ventureId);
console.log(retentionResult);
// → {
//     archived_count: 15,
//     deleted_count: 3,
//     moved_to_cold_count: 42,
//     notified_count: 8,
//     skipped_legal_hold: 2,
//   }

// Process a GDPR right-to-delete request
const gdprResult = await retentionService.processGDPRDeletion(ctx.ventureId, departedUserId);
console.log(gdprResult);
// → {
//     documents_deleted: 47,
//     versions_purged: 183,
//     activities_anonymized: 512,
//     comments_anonymized: 23,
//     storage_freed_bytes: 1073741824,
//     completion_timestamp: 2025-12-15T14:30:00.000Z,
//   }

// Generate a compliance report
const report = await retentionService.generateComplianceReport(ctx.ventureId);
console.log(report);
// → {
//     total_documents: 12847,
//     with_policy: 9231,
//     without_policy: 3616,
//     under_legal_hold: 14,
//     approaching_retention: 156,
//     overdue_for_action: 3,
//   }
```

---

## Error Codes

All errors thrown by `@mcv/nexus/documents` follow the standard MCV error format with a `code` string, human-readable `message`, and optional `details` object.

| Code | HTTP | Description |
|------|------|-------------|
| `DOCUMENT_NOT_FOUND` | 404 | The requested document does not exist or the user does not have access. |
| `FOLDER_NOT_FOUND` | 404 | The requested folder does not exist or the user does not have access. |
| `VERSION_NOT_FOUND` | 404 | The requested version does not exist for this document. |
| `TEMPLATE_NOT_FOUND` | 404 | The requested template does not exist or is not published. |
| `SHARED_LINK_NOT_FOUND` | 404 | The shared link token is invalid or has been revoked. |
| `ACCESS_DENIED` | 403 | The user does not have sufficient permissions for this operation. |
| `DOCUMENT_LOCKED` | 423 | The document is locked by another user for exclusive editing. |
| `LEGAL_HOLD_ACTIVE` | 403 | The operation is blocked because the document is under legal hold. |
| `QUOTA_EXCEEDED` | 413 | The upload would exceed the storage quota (venture or user level). |
| `FILE_TOO_LARGE` | 413 | The file exceeds the maximum allowed file size. |
| `UNSUPPORTED_FILE_TYPE` | 415 | The file MIME type is not allowed by the venture's file type policy. |
| `FILENAME_INVALID` | 400 | The filename contains invalid characters or exceeds the maximum length. |
| `FOLDER_DEPTH_EXCEEDED` | 400 | The folder hierarchy would exceed the maximum allowed depth (default: 20). |
| `FOLDER_CYCLE_DETECTED` | 400 | Moving the folder would create a circular reference in the hierarchy. |
| `BRANCH_EXISTS` | 409 | A branch with this name already exists for the document. |
| `BRANCH_NOT_FOUND` | 404 | The specified branch does not exist for this document. |
| `MERGE_CONFLICT` | 409 | The branch merge could not be completed automatically (binary files only). |
| `SHARED_LINK_EXPIRED` | 410 | The shared link has expired. |
| `SHARED_LINK_EXHAUSTED` | 410 | The shared link has reached its maximum access count. |
| `SHARED_LINK_PASSWORD_INVALID` | 401 | The password provided for the shared link is incorrect. |
| `TEMPLATE_VARIABLES_INVALID` | 400 | One or more required template variables are missing or fail validation. |
| `COLLABORATION_SESSION_EXISTS` | 409 | A collaboration session already exists for this document. |
| `COLLABORATION_NOT_ENABLED` | 400 | Real-time collaboration is not enabled for this document. |
| `PREVIEW_GENERATION_FAILED` | 500 | The preview could not be generated for this document. |
| `RETENTION_POLICY_CONFLICT` | 409 | The document already has a retention policy applied. Use `removePolicy` first. |
| `SEARCH_QUERY_INVALID` | 400 | The search query syntax is invalid (unclosed quotes, invalid operators). |
| `CONTENT_HASH_MISMATCH` | 422 | The computed content hash does not match the expected hash (data corruption). |
| `SMART_FOLDER_RULE_INVALID` | 400 | One or more smart folder rules have invalid field names or operator/value combinations. |
| `DOCUMENT_DELETED` | 410 | The document has been soft-deleted. Use `restore` to recover it. |
| `TRANSFER_SELF` | 400 | Cannot transfer document ownership to the current owner. |
| `VERSION_PURGE_DENIED` | 403 | Cannot purge versions — at least one version must be retained. |

### Error Format

```typescript
import { TRPCError } from '@trpc/server';

// All errors are thrown as TRPCError instances
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Document not found',
  cause: {
    code: 'DOCUMENT_NOT_FOUND',
    document_id: 'abc-123',
    details: {
      hint: 'The document may have been deleted or you may not have access.',
    },
  },
});

// Client-side error handling
try {
  const doc = await trpc.documents.getById.query({ id: 'abc-123' });
} catch (error) {
  if (error.data?.cause?.code === 'DOCUMENT_NOT_FOUND') {
    showNotification('Document not found. It may have been deleted.');
  } else if (error.data?.cause?.code === 'ACCESS_DENIED') {
    showNotification('You do not have access to this document.');
  } else if (error.data?.cause?.code === 'QUOTA_EXCEEDED') {
    const { current_usage, quota_limit } = error.data.cause.details;
    showNotification(`Storage quota exceeded (${formatBytes(current_usage)} / ${formatBytes(quota_limit)})`);
  }
}
```

---

## Security

### Multi-Tenant Isolation

Every database table includes a `venture_id` column. PostgreSQL Row-Level Security (RLS) policies ensure that queries can only access rows belonging to the current venture. The venture ID is set at the connection level via `SET app.current_venture_id = '...'` before any query executes.

```sql
-- RLS is enabled on ALL tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_controls ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Base isolation policy (applied to every table)
CREATE POLICY venture_isolation ON documents
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Access Control Model

```
Permission Hierarchy:

  OWNER   → Can do everything (edit, delete, share, transfer ownership, manage ACLs)
  EDITOR  → Can edit content, create versions, add comments, view
  COMMENTER → Can add comments, view (cannot edit content)
  VIEWER  → Can view and download (read-only)

Resolution Order:
  1. Direct document-level permission (highest priority)
  2. Team-level permission on the document
  3. Inherited folder-level permission (walks up the folder tree)
  4. Inherited team permission on a parent folder
  5. No access (denied)

The most permissive role wins when multiple grants apply.
```

### Storage Security

- **Signed URLs**: All file downloads use time-limited signed URLs (default: 15 minutes). URLs are generated server-side after access control checks.
- **Content-type validation**: MIME types are detected from file content (magic bytes), not file extensions. This prevents attacks where a malicious file is disguised with a safe extension.
- **Filename sanitization**: All filenames are sanitized to remove path traversal characters (`..`, `/`, `\`), null bytes, and control characters. Maximum filename length is enforced (255 characters).
- **Upload size limits**: Enforced at both the application level (quota check) and the storage level (Supabase bucket policies).
- **Virus scanning**: (Optional) Uploaded files can be routed through ClamAV scanning before being stored. Infected files are quarantined and the upload is rejected.

### Collaboration Security

- **WebSocket authentication**: Collaboration connections require a JWT token that is validated against the document's access control list. The token has a short TTL (5 minutes) and must be refreshed.
- **Role enforcement**: The collaboration server enforces edit permissions. A user with `viewer` role can observe changes in real-time but cannot send Yjs updates.
- **Rate limiting**: Collaboration updates are rate-limited per user (default: 100 updates/second) to prevent abuse.

### Shared Link Security

- **Token generation**: Shared link tokens are generated using `crypto.randomBytes(24).toString('base64url')` — 192 bits of entropy.
- **Password hashing**: Passwords are hashed with bcrypt (cost factor 12).
- **Expiration**: Shared links have configurable expiration and maximum access counts. Expired/exhausted links return a 410 Gone response.
- **Revocation**: Shared links can be revoked instantly. Revocation is checked on every access.

### Audit Trail

Every operation is logged to `document_activities` with:
- **Actor**: User ID (or `system` for automated actions)
- **IP address**: Client IP address (from `X-Forwarded-For` in production)
- **User agent**: Full User-Agent header
- **Timestamp**: Server-side UTC timestamp
- **Details**: Structured JSON with operation-specific details

Audit logs are append-only and cannot be modified or deleted through the application. For GDPR compliance, the `processGDPRDeletion` method anonymizes actor IDs in activity logs (replaces with a deterministic pseudonym).

### Data Encryption

- **At rest**: All data is encrypted at rest via Supabase's storage encryption (AES-256).
- **In transit**: All connections use TLS 1.3. WebSocket connections for collaboration use WSS.
- **Sensitive fields**: Password hashes for shared links use bcrypt. No plaintext passwords are ever stored.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (server-side only). |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key (for client-side signed URLs). |
| `DOCUMENTS_BUCKET` | No | `documents` | Supabase Storage bucket name for document files. |
| `THUMBNAILS_BUCKET` | No | `thumbnails` | Supabase Storage bucket name for generated thumbnails. |
| `PREVIEWS_BUCKET` | No | `previews` | Supabase Storage bucket name for generated previews. |
| `COLLABORATION_WS_URL` | No | `wss://collab.mcv.one` | WebSocket URL for the Hocuspocus collaboration server. |
| `COLLABORATION_SECRET` | No | — | Shared secret for authenticating with the collaboration server. |
| `MAX_FILE_SIZE_BYTES` | No | `104857600` (100MB) | Maximum single file upload size in bytes. |
| `MAX_FILENAME_LENGTH` | No | `255` | Maximum filename length in characters. |
| `MAX_FOLDER_DEPTH` | No | `20` | Maximum folder nesting depth. |
| `DEFAULT_SIGNED_URL_TTL` | No | `900` (15 min) | Default TTL for signed download URLs in seconds. |
| `PREVIEW_WORKER_URL` | No | — | URL of the preview generation worker (LibreOffice converter). |
| `PREVIEW_TIMEOUT_MS` | No | `30000` | Timeout for preview generation in milliseconds. |
| `THUMBNAIL_QUALITY` | No | `80` | WebP quality for generated thumbnails (1–100). |
| `SEARCH_RESULT_LIMIT` | No | `50` | Maximum number of search results per page. |
| `SEARCH_TRIGRAM_THRESHOLD` | No | `0.3` | Minimum trigram similarity score for fuzzy search matches. |
| `RETENTION_CHECK_CRON` | No | `0 2 * * *` | Cron schedule for retention policy execution (default: 2 AM daily). |
| `STORAGE_WARM_THRESHOLD_DAYS` | No | `30` | Days of inactivity before moving to warm storage tier. |
| `STORAGE_COLD_THRESHOLD_DAYS` | No | `90` | Days of inactivity before moving to cold storage tier. |
| `STORAGE_ARCHIVE_THRESHOLD_DAYS` | No | `365` | Days of inactivity before moving to archive storage tier. |
| `VERSION_AUTO_SAVE_INTERVAL_MS` | No | `30000` | Auto-save interval during collaboration sessions in milliseconds. |
| `COLLABORATION_MAX_CLIENTS` | No | `50` | Maximum concurrent collaborators per document. |
| `CLAMAV_HOST` | No | — | ClamAV daemon host for virus scanning (disabled if not set). |
| `CLAMAV_PORT` | No | `3310` | ClamAV daemon port. |
| `DEFAULT_VENTURE_QUOTA_BYTES` | No | `10737418240` (10GB) | Default storage quota for new ventures. |
| `DEFAULT_USER_QUOTA_BYTES` | No | `1073741824` (1GB) | Default storage quota for individual users. |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for storage and database operations. |
| `drizzle-orm` | `^0.34.0` | Type-safe SQL query builder and ORM. |
| `@trpc/server` | `^10.45.0` | tRPC server for API router definitions. |
| `yjs` | `^13.6.0` | CRDT library for real-time collaborative editing. |
| `@hocuspocus/server` | `^2.13.0` | Yjs WebSocket server for collaboration sessions. |
| `@hocuspocus/extension-database` | `^2.13.0` | Hocuspocus persistence extension for Supabase. |
| `sharp` | `^0.33.0` | High-performance image processing for thumbnail generation. |
| `file-type` | `^19.6.0` | MIME type detection from file content (magic bytes). |
| `diff` | `^7.0.0` | Text diffing library (Myers algorithm) for version comparison. |
| `bcrypt` | `^5.1.0` | Password hashing for shared link passwords. |
| `nanoid` | `^5.0.0` | URL-safe unique ID generation for shared link tokens. |
| `sanitize-filename` | `^1.6.0` | Filename sanitization to prevent path traversal. |
| `mammoth` | `^1.8.0` | DOCX → HTML extraction for text indexing and preview. |
| `xlsx` | `^0.18.0` | XLSX parsing for text extraction and preview. |
| `pdfjs-dist` | `^4.8.0` | PDF text extraction for search indexing. |
| `shiki` | `^1.24.0` | Syntax highlighting for code file previews. |
| `remark` | `^15.0.0` | Markdown → HTML rendering for preview and templates. |
| `zod` | `^3.23.0` | Runtime validation for API inputs. |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/nexus/auth` | `*` | Authentication context for user identity and JWT validation. |
| `@mcv/nexus/sign` | `*` | E-signature integration for document signing workflows. |
| `@mcv/nexus/crm` | `*` | (Optional) CRM data source for template merge fields. |
| `@mcv/nexus/billing` | `*` | (Optional) Billing data source for template merge fields. |
| `@mcv/nexus/notifications` | `*` | Push notifications for comments, @mentions, signing, and retention. |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.1.0` | Test runner. |
| `@testing-library/react` | `^16.1.0` | React hook testing for `useCollaboration`, `useUpload`, etc. |
| `msw` | `^2.6.0` | Mock Service Worker for API mocking in tests. |
| `testcontainers` | `^10.16.0` | PostgreSQL containers for integration tests. |
| `@faker-js/faker` | `^9.3.0` | Test data generation. |

---

## Testing

### Test Structure

```
src/
  __tests__/
    unit/
      content-hash.test.ts          # SHA-256 hashing utilities
      filename-sanitize.test.ts     # Filename sanitization
      search-vector.test.ts         # tsvector building
      diff.test.ts                  # Version diff algorithm
      folder-tree.test.ts           # Folder tree construction
      template-merge.test.ts        # Template variable substitution
      smart-folder-rules.test.ts    # Smart folder rule evaluation
      mime-detect.test.ts           # MIME type detection
    integration/
      document-service.test.ts      # Document CRUD with real DB
      folder-service.test.ts        # Folder hierarchy operations
      version-service.test.ts       # Version history, diff, rollback
      access-control.test.ts        # Permission checks, shared links
      search-service.test.ts        # Full-text search with PostgreSQL
      retention-service.test.ts     # Retention policies, legal hold, GDPR
      template-service.test.ts      # Template generation, merge fields
      storage-service.test.ts       # Quota enforcement, deduplication
      smart-folder-service.test.ts  # Smart folder rule matching
      collaboration-service.test.ts # Session lifecycle (mocked WS)
    e2e/
      upload-download.test.ts       # Full upload → download cycle
      collaboration.test.ts         # Multi-client collaboration
      sharing.test.ts               # Share link → access cycle
      retention.test.ts             # End-to-end retention workflow
      template-to-signing.test.ts   # Template → generate → sign cycle
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests (requires Docker for PostgreSQL)
pnpm test:integration

# Run e2e tests (requires full service stack)
pnpm test:e2e

# Run with coverage
pnpm test:coverage

# Run a specific test file
pnpm test src/__tests__/unit/content-hash.test.ts

# Watch mode
pnpm test:watch
```

### Test Utilities

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext, createTestDocument, createTestFolder } from '../test-utils';

describe('DocumentService', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    // Creates a fresh test venture, user, and database connection
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should upload a document and generate a content hash', async () => {
    const content = Buffer.from('Hello, world!');
    const doc = await ctx.documentService.upload({
      venture_id: ctx.ventureId,
      title: 'Test Document',
      file: content,
      filename: 'test.txt',
      mime_type: 'text/plain',
      byte_size: content.byteLength,
    });

    expect(doc.id).toBeDefined();
    expect(doc.content_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(doc.current_version).toBe(1);
    expect(doc.status).toBe('active');
  });

  it('should deduplicate identical content', async () => {
    const content = Buffer.from('Identical content');

    const doc1 = await ctx.documentService.upload({
      venture_id: ctx.ventureId,
      title: 'Doc 1',
      file: content,
      filename: 'doc1.txt',
      mime_type: 'text/plain',
      byte_size: content.byteLength,
    });

    const doc2 = await ctx.documentService.upload({
      venture_id: ctx.ventureId,
      title: 'Doc 2',
      file: content,
      filename: 'doc2.txt',
      mime_type: 'text/plain',
      byte_size: content.byteLength,
    });

    // Same content hash → same storage object
    expect(doc1.content_hash).toBe(doc2.content_hash);

    // Storage usage should only count the content once
    const usage = await ctx.storageService.getUsage(ctx.ventureId);
    expect(usage.dedup_savings).toBe(content.byteLength);
  });

  it('should enforce legal hold on deletion', async () => {
    const doc = await createTestDocument(ctx);

    await ctx.retentionService.applyLegalHold(doc.id, 'Test hold');

    await expect(
      ctx.documentService.softDelete(doc.id)
    ).rejects.toThrow('LEGAL_HOLD_ACTIVE');
  });

  it('should enforce quota limits', async () => {
    // Set a tiny quota
    await ctx.storageService.updateQuota(ctx.ventureQuotaId, {
      max_bytes: 100,
      enforce_hard_limit: true,
    });

    const content = Buffer.alloc(200); // 200 bytes — exceeds 100 byte quota

    await expect(
      ctx.documentService.upload({
        venture_id: ctx.ventureId,
        title: 'Too Large',
        file: content,
        filename: 'large.bin',
        mime_type: 'application/octet-stream',
        byte_size: content.byteLength,
      })
    ).rejects.toThrow('QUOTA_EXCEEDED');
  });

  it('should search documents by content', async () => {
    await createTestDocument(ctx, {
      title: 'Annual Report 2025',
      content: 'Revenue grew by 23% driven by enterprise sales.',
    });

    await createTestDocument(ctx, {
      title: 'Meeting Notes',
      content: 'Discussed product roadmap for Q1.',
    });

    // Wait for search index to update
    await ctx.searchService.reindexAll(ctx.ventureId);

    const results = await ctx.searchService.search({
      venture_id: ctx.ventureId,
      query: 'revenue enterprise',
      search_content: true,
    });

    expect(results.total_count).toBe(1);
    expect(results.hits[0].document.title).toBe('Annual Report 2025');
  });

  it('should version documents and support rollback', async () => {
    const doc = await createTestDocument(ctx, { content: 'Version 1 content' });

    await ctx.documentService.uploadNewVersion(doc.id, {
      file: Buffer.from('Version 2 content'),
      byte_size: 17,
      change_summary: 'Updated content',
    });

    await ctx.documentService.uploadNewVersion(doc.id, {
      file: Buffer.from('Version 3 content'),
      byte_size: 17,
      change_summary: 'Another update',
    });

    const { versions } = await ctx.versionService.getHistory(doc.id);
    expect(versions).toHaveLength(3);

    // Rollback to version 1
    const rolled = await ctx.versionService.rollback(doc.id, 1);
    expect(rolled.version_number).toBe(4); // New version created

    const current = await ctx.documentService.getById(doc.id);
    expect(current?.current_version).toBe(4);
  });
});
```

### Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Statements | ≥ 90% | — |
| Branches | ≥ 85% | — |
| Functions | ≥ 90% | — |
| Lines | ≥ 90% | — |

### Critical Test Scenarios

1. **Multi-tenant isolation**: Verify that a user in Venture A cannot access documents from Venture B, even with direct ID access.
2. **Access control inheritance**: Verify that folder-level permissions propagate correctly to documents, and that direct document permissions override inherited ones.
3. **Concurrent collaboration**: Verify that two clients editing simultaneously produce a consistent merged document.
4. **Quota enforcement edge cases**: Verify quota checks under concurrent uploads (race conditions).
5. **Legal hold enforcement**: Verify that no code path can delete or modify a document under legal hold.
6. **GDPR deletion completeness**: Verify that all user data (documents, versions, comments, activities) is properly deleted or anonymized.
7. **Shared link security**: Verify expired links, exhausted links, and wrong passwords are all correctly rejected.
8. **Search index consistency**: Verify that search results reflect the latest document state after create/update/delete operations.
9. **Version branching and merging**: Verify branch creation, independent editing, and merge-back produce correct version history.
10. **Preview pipeline**: Verify preview generation for all supported MIME types and graceful degradation for unsupported types.

---

*Last updated: 2026-02-09*
*Module maintainers: MCV Platform Team*