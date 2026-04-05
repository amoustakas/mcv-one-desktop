# @mcv/operations/editor

> Collaborative Editor — Real-time block-based document editing with CRDT synchronization, rich content types, page hierarchy, inline comments, version history, and granular permissions for the MCV.ONE operations platform.

**Module ID:** `@mcv/operations/editor`
**Layer:** Tier 5 — Domain (Operations)
**Status:** Stable
**Since:** 0.14.0
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [High-Level Overview](#high-level-overview)
  - [CRDT Synchronization Model](#crdt-synchronization-model)
  - [Block Rendering Pipeline](#block-rendering-pipeline)
  - [Collaboration Flow](#collaboration-flow)
  - [Page Tree Architecture](#page-tree-architecture)
- [Core Interfaces](#core-interfaces)
  - [Page](#page)
  - [Block](#block)
  - [BlockType & BlockContent](#blocktype--blockcontent)
  - [CollaborationSession](#collaborationsession)
  - [Comment & CommentThread](#comment--commentthread)
  - [Template & TemplateVariable](#template--templatevariable)
  - [PageVersion](#pageversion)
  - [Permission](#permission)
  - [Mention & Backlink](#mention--backlink)
  - [EditorService](#editorservice)
  - [CollaborationService](#collaborationservice)
  - [SlashCommand](#slashcommand)
  - [ExportOptions](#exportoptions)
  - [PageActivity](#pageactivity)
  - [PageFavorite](#pagefavorite)
- [Database Schemas](#database-schemas)
  - [pages](#pages)
  - [blocks](#blocks)
  - [page_versions](#page_versions)
  - [comments](#comments)
  - [comment_threads](#comment_threads)
  - [templates](#templates)
  - [template_variables](#template_variables)
  - [page_permissions](#page_permissions)
  - [mentions](#mentions)
  - [backlinks](#backlinks)
  - [page_favorites](#page_favorites)
  - [page_activities](#page_activities)
- [Code Examples](#code-examples)
  - [1. Creating a Page with Blocks](#1-creating-a-page-with-blocks)
  - [2. Real-Time Collaboration Session](#2-real-time-collaboration-session)
  - [3. Slash Command Registration](#3-slash-command-registration)
  - [4. Inline Comments](#4-inline-comments)
  - [5. Version History & Restore](#5-version-history--restore)
  - [6. Page Templates](#6-page-templates)
  - [7. Export to Multiple Formats](#7-export-to-multiple-formats)
  - [8. Page Permissions & Sharing](#8-page-permissions--sharing)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Row-Level Security (RLS)](#row-level-security-rls)
  - [Collaboration Security](#collaboration-security)
  - [Content Security](#content-security)
  - [Export & API Security](#export--api-security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [CRDT Conflict Tests](#crdt-conflict-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Performance Benchmarks](#performance-benchmarks)
- [Changelog](#changelog)

---

## Purpose

`@mcv/operations/editor` provides a full-featured collaborative document editor for the MCV.ONE platform. It enables teams to create, edit, and organize rich documents in real time—comparable to Notion, Google Docs, or Confluence—but deeply integrated with MCV's multi-tenant architecture, permissions model, and operational workflows.

### Why This Module Exists

Operational content—meeting notes, project briefs, runbooks, postmortems, decision logs, onboarding guides—is foundational to how teams function. Traditional approaches scatter this content across disconnected tools (Google Docs, Confluence, Notion, Slack messages, email threads), making it hard to find, hard to govern, and impossible to integrate with internal systems.

This module solves that by providing:

1. **A block-based editor** — Content is structured as a tree of typed blocks (headings, paragraphs, lists, tables, code, media, embeds). This enables programmatic access, structured rendering, and flexible layout without sacrificing authoring UX.

2. **Real-time collaboration** — Multiple users edit simultaneously with zero conflicts. CRDT (Conflict-free Replicated Data Type) synchronization via Yjs ensures that every edit from every participant converges to the same state, regardless of network conditions or edit ordering.

3. **Deep integration** — Pages can reference users (@mentions), link to other pages (#links), embed operational data, and trigger workflows. Content is queryable via tRPC and exportable in standard formats.

4. **Governance** — Per-page permissions, version history with named snapshots, audit trails, and content policies ensure that sensitive operational content is protected and traceable.

### Design Philosophy

- **Blocks, not blobs.** Content is a structured tree of typed blocks, not a flat HTML/Markdown string. This enables fine-grained operations, selective rendering, programmatic manipulation, and efficient CRDT sync.
- **Offline-first mindset.** The CRDT layer ensures that edits made offline merge cleanly when connectivity returns. The editor never loses work.
- **Keyboard-first UX.** Slash commands, markdown shortcuts, and keyboard navigation make the editor fast for power users while remaining approachable for casual editors.
- **Multi-tenant by default.** Every query, every WebSocket connection, every permission check is tenant-scoped. There is no "god mode" that bypasses tenant isolation.

---

## Exports

```typescript
// === Core Services ===
export { EditorService } from './services/editor.service';
export { CollaborationService } from './services/collaboration.service';
export { PageService } from './services/page.service';
export { BlockService } from './services/block.service';
export { CommentService } from './services/comment.service';
export { TemplateService } from './services/template.service';
export { VersionService } from './services/version.service';
export { PermissionService } from './services/permission.service';
export { ExportService } from './services/export.service';
export { MentionService } from './services/mention.service';
export { BacklinkService } from './services/backlink.service';
export { SearchService } from './services/search.service';
export { ActivityService } from './services/activity.service';

// === tRPC Router ===
export { editorRouter } from './router';
export type { EditorRouter } from './router';

// === Core Types ===
export type {
  Page,
  PageCreateInput,
  PageUpdateInput,
  PageWithBlocks,
  PageTreeNode,
  PageBreadcrumb,
} from './types/page';

export type {
  Block,
  BlockCreateInput,
  BlockUpdateInput,
  BlockType,
  BlockContent,
  TextBlock,
  HeadingBlock,
  TodoBlock,
  BulletedListBlock,
  NumberedListBlock,
  ToggleBlock,
  TableBlock,
  TableRow,
  TableCell,
  CodeBlock,
  ImageBlock,
  VideoBlock,
  EmbedBlock,
  CalloutBlock,
  DividerBlock,
  QuoteBlock,
  ColumnsBlock,
  ColumnBlock,
} from './types/block';

export type {
  CollaborationSession,
  CollaborationUser,
  CursorPosition,
  SelectionRange,
  AwarenessState,
  SyncMessage,
} from './types/collaboration';

export type {
  Comment,
  CommentCreateInput,
  CommentThread,
  CommentThreadCreateInput,
  CommentReaction,
  TextSelection,
} from './types/comment';

export type {
  Template,
  TemplateCreateInput,
  TemplateVariable,
  TemplateCategory,
} from './types/template';

export type {
  PageVersion,
  VersionDiff,
  VersionDiffBlock,
  VersionSnapshot,
} from './types/version';

export type {
  Permission,
  PermissionLevel,
  PermissionGrant,
  ShareLink,
  PageVisibility,
} from './types/permission';

export type {
  Mention,
  MentionType,
  Backlink,
  BacklinkContext,
} from './types/mention';

export type {
  SlashCommand,
  SlashCommandGroup,
  SlashCommandRegistry,
} from './types/slash-command';

export type {
  ExportOptions,
  ExportFormat,
  ExportResult,
} from './types/export';

export type {
  PageActivity,
  ActivityType,
  PageFavorite,
} from './types/activity';

// === Database Schema ===
export {
  pages,
  blocks,
  pageVersions,
  comments,
  commentThreads,
  templates,
  templateVariables,
  pagePermissions,
  mentions,
  backlinks,
  pageFavorites,
  pageActivities,
} from './schema';

// === React Components (Client) ===
export { Editor } from './components/Editor';
export { EditorProvider } from './components/EditorProvider';
export { BlockRenderer } from './components/BlockRenderer';
export { SlashCommandMenu } from './components/SlashCommandMenu';
export { MentionPopover } from './components/MentionPopover';
export { CommentSidebar } from './components/CommentSidebar';
export { VersionHistoryPanel } from './components/VersionHistoryPanel';
export { PageTree } from './components/PageTree';
export { PageBreadcrumbs } from './components/PageBreadcrumbs';
export { TemplateGallery } from './components/TemplateGallery';
export { ShareDialog } from './components/ShareDialog';
export { ExportDialog } from './components/ExportDialog';

// === Hooks ===
export { useEditor } from './hooks/useEditor';
export { useCollaboration } from './hooks/useCollaboration';
export { usePageTree } from './hooks/usePageTree';
export { useComments } from './hooks/useComments';
export { useVersionHistory } from './hooks/useVersionHistory';
export { usePermissions } from './hooks/usePermissions';
export { useSlashCommands } from './hooks/useSlashCommands';
export { useMentions } from './hooks/useMentions';
export { useBacklinks } from './hooks/useBacklinks';
export { usePageActivity } from './hooks/usePageActivity';

// === Utilities ===
export { blocksToMarkdown } from './utils/export-markdown';
export { blocksToHtml } from './utils/export-html';
export { markdownToBlocks } from './utils/import-markdown';
export { sanitizeBlockContent } from './utils/sanitize';
export { computeBlockDiff } from './utils/diff';
export { resolveTemplateVariables } from './utils/template-resolver';

// === Constants ===
export { BLOCK_TYPES, MAX_BLOCK_DEPTH, MAX_PAGE_DEPTH } from './constants';
export { EDITOR_ERROR_CODES } from './errors';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    EditorProvider                             │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │   │
│  │  │  TipTap /    │  │  Yjs Doc     │  │  Awareness        │   │   │
│  │  │  ProseMirror │  │  (CRDT)      │  │  (Cursors, etc.)  │   │   │
│  │  │  Editor      │  │              │  │                   │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘   │   │
│  │         │                 │                    │              │   │
│  │         └────────┬────────┘────────────────────┘              │   │
│  │                  │                                            │   │
│  │         ┌────────▼────────┐                                   │   │
│  │         │  HocuspocusProvider (WebSocket)                     │   │
│  │         └────────┬────────┘                                   │   │
│  └──────────────────┼───────────────────────────────────────────┘   │
│                     │                                               │
└─────────────────────┼───────────────────────────────────────────────┘
                      │ wss://
                      │
┌─────────────────────┼───────────────────────────────────────────────┐
│                     │           Server                              │
│         ┌───────────▼───────────┐                                   │
│         │  Hocuspocus Server    │                                   │
│         │  (WebSocket Hub)      │                                   │
│         │  - Auth on connect    │                                   │
│         │  - Room management    │                                   │
│         │  - Persistence hooks  │                                   │
│         └───────────┬───────────┘                                   │
│                     │                                               │
│         ┌───────────▼───────────┐   ┌──────────────────────┐       │
│         │  tRPC Router          │   │  Collaboration       │       │
│         │  (editorRouter)       │   │  Service             │       │
│         │  - CRUD operations    │◄──►  - Session mgmt      │       │
│         │  - Search / query     │   │  - Presence tracking  │       │
│         │  - Permissions        │   │  - Conflict resolution│       │
│         │  - Export             │   └──────────────────────┘       │
│         └───────────┬───────────┘                                   │
│                     │                                               │
│  ┌──────────────────▼──────────────────────────────────────────┐   │
│  │                    Service Layer                              │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │   │
│  │  │ PageService│ │BlockService│ │CommentSvc  │ │VersionSvc│ │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬─────┘ │   │
│  │  ┌─────┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐ ┌────┴─────┐ │   │
│  │  │TemplSvc    │ │PermSvc     │ │MentionSvc  │ │ExportSvc │ │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬─────┘ │   │
│  └────────┼──────────────┼──────────────┼──────────────┼───────┘   │
│           │              │              │              │            │
│  ┌────────▼──────────────▼──────────────▼──────────────▼───────┐   │
│  │                  Drizzle ORM + Supabase PostgreSQL           │   │
│  │                  (Multi-tenant RLS)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### CRDT Synchronization Model

The editor uses **Yjs** as its CRDT implementation, with **Hocuspocus** as the WebSocket server for synchronization. This combination provides:

#### How Yjs Works in the Editor

1. **Document as a Y.Doc** — Each page is represented as a single `Y.Doc`. The document contains a `Y.XmlFragment` that maps directly to the ProseMirror document tree.

2. **Operations, not snapshots** — When a user types a character, Yjs encodes that as a compact binary operation (typically 1-5 bytes). Only operations are transmitted over the wire, not full document states.

3. **Causal ordering** — Every operation carries a logical clock (Lamport timestamp). Yjs uses this to guarantee causal consistency: if user A's edit depends on user B's edit, A's edit will always be applied after B's, regardless of network delivery order.

4. **Merge semantics** — For concurrent edits to the same position, Yjs uses a deterministic tie-breaking rule based on client IDs. This means all clients converge to the same state without coordination.

```
Client A                    Hocuspocus Server              Client B
   │                              │                            │
   │  ── connect (auth) ────────► │ ◄──── connect (auth) ──── │
   │  ◄── sync step 1 ──────────►│ ◄────► sync step 1 ─────► │
   │  ◄── sync step 2 ──────────►│ ◄────► sync step 2 ─────► │
   │                              │                            │
   │  User types "Hello"          │                            │
   │  ── update (5 ops) ────────► │                            │
   │                              │ ── broadcast update ─────► │
   │                              │                            │  Applied locally
   │                              │                            │
   │                              │           User types "World" at same position
   │                              │ ◄──── update (5 ops) ──── │
   │  ◄── broadcast update ────── │                            │
   │  Applied locally (merged)    │                            │
   │                              │                            │
   │  State: "HelloWorld"         │       State: "HelloWorld"  │
   │  (deterministic merge)       │       (same result)        │
```

#### Persistence Strategy

Yjs documents are persisted in two forms:

1. **Full state snapshot** — The complete Yjs binary state is stored in the `pages.yjs_state` column (BYTEA). This is updated periodically (every 30 seconds of inactivity or on disconnect).

2. **Incremental updates** — Between snapshots, incremental Yjs updates are stored in a write-ahead log. On reconnect, the client receives the last snapshot plus any incremental updates.

3. **Block extraction** — When the Yjs state is persisted, the server also extracts the current block tree and writes it to the `blocks` table. This dual-write ensures that content is queryable via SQL even though the authoritative state lives in the CRDT.

```typescript
// Hocuspocus persistence hook (simplified)
const onStoreDocument = async ({ document, documentName }: onStoreDocumentPayload) => {
  const pageId = documentName; // Document name is the page ID
  const yjsState = Y.encodeStateAsUpdate(document);
  const blocks = prosemirrorToBlocks(document.getXmlFragment('content'));

  await db.transaction(async (tx) => {
    // Store CRDT state
    await tx.update(pages)
      .set({ yjsState, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    // Extract and store blocks for SQL queryability
    await tx.delete(blocksTable).where(eq(blocksTable.pageId, pageId));
    await tx.insert(blocksTable).values(
      blocks.map((block, index) => ({
        ...block,
        pageId,
        sortOrder: index,
      }))
    );
  });
};
```

#### Awareness Protocol

Beyond document state, Yjs provides an **awareness** protocol for ephemeral, non-persistent information:

- **Cursor positions** — Each user's cursor location in the document, displayed as a colored caret with their name.
- **Selection ranges** — When a user selects text, other users see a colored highlight.
- **User metadata** — Name, avatar, color (consistent per-user, derived from user ID hash).
- **Activity state** — Whether a user is actively editing, idle, or has the tab backgrounded.

```typescript
interface AwarenessState {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    color: string;        // Deterministic from user ID
  };
  cursor: {
    anchor: number;       // Absolute position in document
    head: number;         // Selection end (same as anchor if no selection)
  } | null;
  lastActive: number;     // Timestamp
  isTyping: boolean;
  focusedBlockId: string | null;
}
```

### Block Rendering Pipeline

The editor renders content through a pipeline that converts the Yjs CRDT state into a visual document:

```
Y.XmlFragment (CRDT)
       │
       ▼
ProseMirror Document (Schema-validated node tree)
       │
       ▼
TipTap Extensions (Behavior: shortcuts, input rules, paste handling)
       │
       ▼
Block Renderers (React components per block type)
       │
       ▼
Visual Document (DOM)
```

#### Block Type System

Every block has a `type` discriminator and a `content` payload specific to that type. The ProseMirror schema enforces structural rules (e.g., table cells can only exist inside table rows, list items can only exist inside lists).

```
Document
├── heading { level: 1 }
│   └── "Project Kickoff Notes"
├── paragraph
│   └── "Meeting held on " + mention { userId: "..." } + " at 2:00 PM"
├── callout { variant: "info", icon: "💡" }
│   └── paragraph
│       └── "Remember to update the sprint board after this meeting."
├── heading { level: 2 }
│   └── "Action Items"
├── todoList
│   ├── todoItem { checked: false }
│   │   └── "Set up CI/CD pipeline" + mention { userId: "..." }
│   ├── todoItem { checked: true }
│   │   └── "Create project repository"
│   └── todoItem { checked: false }
│       └── "Draft architecture document"
├── divider
├── toggle { summary: "Detailed Discussion Notes" }
│   ├── paragraph
│   │   └── "We discussed three approaches..."
│   └── numberedList
│       ├── listItem
│       │   └── "Microservices architecture"
│       ├── listItem
│       │   └── "Modular monolith"
│       └── listItem
│           └── "Hybrid approach (chosen)"
└── columns { count: 2 }
    ├── column
    │   ├── heading { level: 3 }
    │   │   └── "Pros"
    │   └── bulletedList
    │       ├── listItem → "Simpler deployment"
    │       └── listItem → "Shared database"
    └── column
        ├── heading { level: 3 }
        │   └── "Cons"
        └── bulletedList
            ├── listItem → "Tight coupling risk"
            └── listItem → "Scaling constraints"
```

### Collaboration Flow

The full lifecycle of a collaborative editing session:

```
1. User opens page
   │
   ├── Client: Fetch page metadata via tRPC (title, permissions, breadcrumbs)
   ├── Client: Initialize Yjs Y.Doc
   ├── Client: Connect HocuspocusProvider to wss://collab.mcv.one/{pageId}
   │
2. Server authenticates WebSocket
   │
   ├── Hocuspocus: onAuthenticate hook
   │   ├── Verify JWT token
   │   ├── Check tenant membership
   │   ├── Check page permission (read/edit/comment)
   │   └── Reject if unauthorized (closes WebSocket)
   │
3. Initial sync
   │
   ├── Server sends Yjs state snapshot (sync step 1)
   ├── Client merges with local state (sync step 2)
   ├── Server sends awareness states of other connected users
   └── Client renders document from merged Yjs state
   │
4. Collaborative editing
   │
   ├── User A types → Yjs operation → broadcast to server → fan out to B, C
   ├── User B moves cursor → awareness update → broadcast to A, C
   ├── User C inserts block → Yjs operation → broadcast to A, B
   │
5. Persistence
   │
   ├── Every 30s of inactivity: server persists Yjs state + block extraction
   ├── On last user disconnect: final persistence + version checkpoint
   └── Periodic: Auto-save named version every 10 minutes of editing
   │
6. Disconnect
   │
   ├── Client: HocuspocusProvider handles reconnection automatically
   ├── Server: Remove user from awareness after timeout (30s)
   └── Server: Persist on last-disconnect
```

### Page Tree Architecture

Pages are organized in a tree structure (like Notion's sidebar):

```
Workspace Root
├── 📄 Getting Started
├── 📁 Engineering
│   ├── 📄 Architecture Overview
│   ├── 📄 API Documentation
│   ├── 📁 Runbooks
│   │   ├── 📄 Incident Response
│   │   ├── 📄 Deploy Procedure
│   │   └── 📄 Database Migration
│   └── 📄 On-Call Schedule
├── 📁 Product
│   ├── 📄 Roadmap Q1 2026
│   ├── 📄 Feature Specs
│   └── 📁 Meeting Notes
│       ├── 📄 2026-02-03 Sprint Planning
│       └── 📄 2026-02-07 Retrospective
└── 📁 HR & Operations
    ├── 📄 Onboarding Guide
    └── 📄 Team Directory
```

Each page stores a `parentId` (nullable — null means root level) and a `sortOrder` (float) for positioning among siblings. This enables:

- **Drag-and-drop reordering** — Update `sortOrder` to move within a level, update `parentId` to move between levels.
- **Breadcrumb navigation** — Walk up the `parentId` chain to build breadcrumbs.
- **Recursive queries** — PostgreSQL recursive CTEs for efficient subtree fetching.
- **Depth limits** — Enforced maximum nesting depth (`MAX_PAGE_DEPTH = 8`) to prevent pathological trees.

---

## Core Interfaces

### Page

Represents a single document in the editor. A page contains metadata and a tree of blocks.

```typescript
/**
 * A page in the collaborative editor.
 *
 * Pages are the fundamental unit of content. Each page has a title, an icon,
 * optional cover image, and a tree of content blocks. Pages can be nested
 * (via parentId) to form a hierarchical document tree.
 */
interface Page {
  /** Unique page identifier (UUID v7). */
  id: string;

  /** Tenant this page belongs to. Enforced by RLS. */
  tenantId: string;

  /** Workspace within the tenant. */
  workspaceId: string;

  /** Parent page ID for nesting. Null = root level. */
  parentId: string | null;

  /** Page title. Displayed in sidebar, breadcrumbs, and page header. */
  title: string;

  /**
   * Page icon. Can be an emoji (e.g., "📄"), a named icon (e.g., "file-text"),
   * or null for no icon.
   */
  icon: string | null;

  /**
   * Cover image URL. Displayed as a banner at the top of the page.
   * Can be a URL to an uploaded image or a gradient identifier.
   */
  coverImage: string | null;

  /**
   * Cover image vertical position (0-100). Controls the focal point
   * when the cover is cropped to fit the banner area.
   */
  coverImagePosition: number;

  /**
   * Sort order among siblings. Float to allow insertions without reindexing.
   * Siblings are ordered by sortOrder ascending.
   */
  sortOrder: number;

  /**
   * Page visibility level.
   * - 'private': Only explicitly permitted users can access.
   * - 'workspace': All workspace members can access.
   * - 'public': Anyone with the link can access (read-only for anonymous).
   */
  visibility: PageVisibility;

  /**
   * Whether the page is a template. Template pages are not shown in the
   * regular page tree; they appear in the template gallery.
   */
  isTemplate: boolean;

  /**
   * Whether the page has been soft-deleted (moved to trash).
   * Trashed pages are hidden from navigation but recoverable.
   */
  isTrashed: boolean;

  /** Timestamp when the page was moved to trash, or null. */
  trashedAt: Date | null;

  /** User who created the page. */
  createdBy: string;

  /** User who last edited the page content (not metadata). */
  lastEditedBy: string;

  /** Creation timestamp. */
  createdAt: Date;

  /** Last update timestamp (content or metadata). */
  updatedAt: Date;

  /**
   * Binary Yjs state. The authoritative CRDT state of the document.
   * Not included in list queries; loaded only when opening the editor.
   */
  yjsState: Uint8Array | null;

  /**
   * Full-text search vector. Automatically maintained by a PostgreSQL trigger
   * that indexes the page title and extracted block text content.
   */
  searchVector: unknown; // tsvector — opaque in application code
}

/** Input for creating a new page. */
interface PageCreateInput {
  title: string;
  parentId?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  visibility?: PageVisibility;
  templateId?: string;           // Create from template
  initialBlocks?: BlockCreateInput[];
}

/** Input for updating page metadata. */
interface PageUpdateInput {
  title?: string;
  parentId?: string | null;
  sortOrder?: number;
  icon?: string | null;
  coverImage?: string | null;
  coverImagePosition?: number;
  visibility?: PageVisibility;
  isTrashed?: boolean;
}

/** A page with its immediate child blocks loaded. */
interface PageWithBlocks extends Page {
  blocks: Block[];
}

/** Lightweight representation for the page tree sidebar. */
interface PageTreeNode {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  hasChildren: boolean;
  /** Depth in the tree (0 = root). Computed, not stored. */
  depth: number;
}

/** Breadcrumb entry for navigating up the page hierarchy. */
interface PageBreadcrumb {
  id: string;
  title: string;
  icon: string | null;
}

type PageVisibility = 'private' | 'workspace' | 'public';
```

### Block

Represents a single content block within a page. Blocks form a tree (blocks can contain child blocks, e.g., toggle blocks, columns).

```typescript
/**
 * A content block within a page.
 *
 * Blocks are the fundamental content unit. Each block has a type (heading,
 * paragraph, todo, etc.) and type-specific content. Blocks can be nested
 * (e.g., a toggle block contains child blocks, a column layout contains
 * column blocks).
 *
 * Note: The authoritative block state lives in the Yjs CRDT document.
 * The blocks table is a denormalized extraction for SQL queryability
 * (search, backlinks, mentions). The Yjs state is the source of truth
 * during active editing sessions.
 */
interface Block {
  /** Unique block identifier (UUID v7). Also used as the Yjs node ID. */
  id: string;

  /** Page this block belongs to. */
  pageId: string;

  /**
   * Parent block ID for nested blocks. Null = top-level block in the page.
   * Used for toggle content, column children, list items, etc.
   */
  parentBlockId: string | null;

  /** Block type discriminator. */
  type: BlockType;

  /**
   * Type-specific content. Structure depends on the block type.
   * Stored as JSONB in PostgreSQL.
   */
  content: BlockContent;

  /** Sort order among siblings (same parentBlockId). Float-based. */
  sortOrder: number;

  /** Indentation level (0-based). Used for nested lists and visual indent. */
  indentLevel: number;

  /**
   * Extracted plain text content for full-text search.
   * Computed from the block's rich text content, stripped of formatting.
   */
  textContent: string;

  /** Creation timestamp. */
  createdAt: Date;

  /** Last update timestamp. */
  updatedAt: Date;
}

/** Input for creating a new block. */
interface BlockCreateInput {
  type: BlockType;
  content: BlockContent;
  parentBlockId?: string | null;
  sortOrder?: number;
  indentLevel?: number;
}

/** Input for updating a block. */
interface BlockUpdateInput {
  content?: BlockContent;
  sortOrder?: number;
  indentLevel?: number;
}
```

### BlockType & BlockContent

The discriminated union of all supported block types and their content structures.

```typescript
/**
 * All supported block types.
 */
type BlockType =
  | 'text'
  | 'heading'
  | 'todo'
  | 'bulletedList'
  | 'numberedList'
  | 'toggle'
  | 'table'
  | 'code'
  | 'image'
  | 'video'
  | 'embed'
  | 'callout'
  | 'divider'
  | 'quote'
  | 'columns'
  | 'column';

/**
 * Discriminated union of block content types.
 * The structure depends on the block's `type` field.
 */
type BlockContent =
  | TextBlockContent
  | HeadingBlockContent
  | TodoBlockContent
  | BulletedListBlockContent
  | NumberedListBlockContent
  | ToggleBlockContent
  | TableBlockContent
  | CodeBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | EmbedBlockContent
  | CalloutBlockContent
  | DividerBlockContent
  | QuoteBlockContent
  | ColumnsBlockContent
  | ColumnBlockContent;

/**
 * Rich text content. Used by paragraph blocks and as inline content
 * within other block types.
 */
interface RichText {
  /** The text content. */
  text: string;
  /** Bold formatting. */
  bold?: boolean;
  /** Italic formatting. */
  italic?: boolean;
  /** Underline formatting. */
  underline?: boolean;
  /** Strikethrough formatting. */
  strikethrough?: boolean;
  /** Inline code formatting. */
  code?: boolean;
  /** Text color (CSS color value or named color). */
  color?: string;
  /** Background highlight color. */
  backgroundColor?: string;
  /** Hyperlink URL. */
  href?: string;
}

/** Inline mention within rich text. */
interface InlineMention {
  type: 'user' | 'page' | 'date';
  /** For 'user': user ID. For 'page': page ID. For 'date': ISO date string. */
  targetId: string;
  /** Display text (denormalized for rendering without lookup). */
  displayText: string;
}

// === Block Content Types ===

interface TextBlockContent {
  richText: RichText[];
  mentions?: InlineMention[];
}

interface HeadingBlockContent {
  richText: RichText[];
  level: 1 | 2 | 3;
  /** Whether this heading is toggleable (click to collapse content below). */
  isToggleable?: boolean;
}

interface TodoBlockContent {
  richText: RichText[];
  checked: boolean;
  /** User who checked/unchecked this item, for activity tracking. */
  checkedBy?: string;
  checkedAt?: Date;
}

interface BulletedListBlockContent {
  richText: RichText[];
}

interface NumberedListBlockContent {
  richText: RichText[];
  /** Starting number (default 1). Allows continuing numbering from a previous list. */
  start?: number;
}

interface ToggleBlockContent {
  /** The summary line (always visible). */
  richText: RichText[];
  /**
   * Whether the toggle is expanded by default when the page loads.
   * Users can toggle locally; this is the default state.
   */
  defaultExpanded?: boolean;
}

interface TableBlockContent {
  /** Table rows. First row is the header if hasHeaderRow is true. */
  rows: TableRow[];
  /** Whether the first row should be styled as a header. */
  hasHeaderRow: boolean;
  /** Whether the first column should be styled as a header. */
  hasHeaderColumn: boolean;
  /** Column widths in pixels. If omitted, columns auto-size. */
  columnWidths?: number[];
}

interface TableRow {
  id: string;
  cells: TableCell[];
}

interface TableCell {
  id: string;
  richText: RichText[];
  /** Column span (default 1). */
  colSpan?: number;
  /** Row span (default 1). */
  rowSpan?: number;
  /** Cell background color. */
  backgroundColor?: string;
}

interface CodeBlockContent {
  /** The code content (plain text, not RichText). */
  code: string;
  /** Programming language for syntax highlighting. */
  language: string;
  /** Optional filename or label displayed above the code block. */
  caption?: string;
  /** Whether line numbers are shown. */
  showLineNumbers?: boolean;
  /** Whether word wrap is enabled. */
  wordWrap?: boolean;
}

interface ImageBlockContent {
  /** Image source URL. */
  src: string;
  /** Alt text for accessibility. */
  alt?: string;
  /** Caption text displayed below the image. */
  caption?: string;
  /** Display width in pixels. Null = full width. */
  width?: number | null;
  /** Alignment within the page. */
  alignment?: 'left' | 'center' | 'right';
}

interface VideoBlockContent {
  /** Video source URL (direct file or embed like YouTube). */
  src: string;
  /** Caption text. */
  caption?: string;
  /** Display width in pixels. */
  width?: number | null;
}

interface EmbedBlockContent {
  /** URL to embed (iFrame src). */
  src: string;
  /** Embed height in pixels. */
  height?: number;
  /** Caption text. */
  caption?: string;
}

interface CalloutBlockContent {
  richText: RichText[];
  /** Icon displayed to the left of the callout content. */
  icon: string;
  /**
   * Callout variant controlling background/border color.
   * - 'info': Blue
   * - 'warning': Yellow
   * - 'error': Red
   * - 'success': Green
   * - 'note': Gray
   */
  variant: 'info' | 'warning' | 'error' | 'success' | 'note';
}

interface DividerBlockContent {
  /** Divider style. */
  style?: 'solid' | 'dashed' | 'dotted';
}

interface QuoteBlockContent {
  richText: RichText[];
  /** Attribution/source of the quote. */
  attribution?: string;
}

interface ColumnsBlockContent {
  /** Number of columns (2-5). */
  count: number;
  /**
   * Column width ratios. Must sum to 1.0.
   * E.g., [0.5, 0.5] for equal halves, [0.33, 0.67] for 1/3 + 2/3.
   * If omitted, columns are equally sized.
   */
  ratios?: number[];
}

interface ColumnBlockContent {
  /** Column index (0-based). */
  index: number;
}
```

### CollaborationSession

Represents an active real-time editing session.

```typescript
/**
 * A collaboration session for a page.
 *
 * Tracks all connected users, their cursor positions, and session metadata.
 * Sessions are ephemeral — they exist only while at least one user is connected.
 */
interface CollaborationSession {
  /** Page ID this session is for. */
  pageId: string;

  /** Currently connected users. */
  users: CollaborationUser[];

  /** Session start time (first user connected). */
  startedAt: Date;

  /** Total number of operations applied in this session. */
  operationCount: number;

  /** Whether the document has unsaved changes. */
  isDirty: boolean;
}

/** A user participating in a collaboration session. */
interface CollaborationUser {
  /** User ID. */
  id: string;

  /** Display name. */
  name: string;

  /** Avatar URL. */
  avatar: string | null;

  /** Assigned color for cursor/selection display. */
  color: string;

  /** Current cursor position, or null if cursor is not in the document. */
  cursor: CursorPosition | null;

  /** Current text selection, or null if no selection. */
  selection: SelectionRange | null;

  /** When this user connected. */
  connectedAt: Date;

  /** When this user last performed an edit. */
  lastActiveAt: Date;

  /** Permission level for this session. */
  permissionLevel: PermissionLevel;
}

/** Cursor position within the document. */
interface CursorPosition {
  /** Absolute offset in the ProseMirror document. */
  offset: number;

  /** Block ID the cursor is within. */
  blockId: string;

  /** Offset within the block's text content. */
  blockOffset: number;
}

/** Text selection range. */
interface SelectionRange {
  /** Selection anchor (start). */
  anchor: CursorPosition;

  /** Selection head (end). */
  head: CursorPosition;
}

/**
 * Awareness state broadcast to all connected clients.
 * This is the full Yjs awareness state per user.
 */
interface AwarenessState {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    color: string;
  };
  cursor: {
    anchor: number;
    head: number;
  } | null;
  lastActive: number;
  isTyping: boolean;
  focusedBlockId: string | null;
}

/** Sync message types exchanged between client and server. */
type SyncMessage =
  | { type: 'sync-step-1'; stateVector: Uint8Array }
  | { type: 'sync-step-2'; update: Uint8Array }
  | { type: 'update'; update: Uint8Array }
  | { type: 'awareness'; states: Map<number, AwarenessState> };
```

### Comment & CommentThread

Inline comments anchored to text selections within the document.

```typescript
/**
 * A comment thread anchored to a specific text range in the document.
 *
 * Comment threads are attached to a text selection. They persist even if
 * the document text changes — the selection range is updated via the CRDT
 * position mapping to track the original text as it moves.
 */
interface CommentThread {
  /** Unique thread identifier. */
  id: string;

  /** Page this thread belongs to. */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /**
   * Text selection this thread is anchored to.
   * Stored as a Yjs relative position for CRDT-aware tracking.
   */
  selection: TextSelection;

  /**
   * The text that was selected when the thread was created.
   * Used for display and for resolving the selection if CRDT tracking fails.
   */
  selectedText: string;

  /** Whether this thread has been resolved. */
  isResolved: boolean;

  /** User who resolved the thread, if resolved. */
  resolvedBy: string | null;

  /** When the thread was resolved. */
  resolvedAt: Date | null;

  /** Comments within this thread (chronologically ordered). */
  comments: Comment[];

  /** Thread creator. */
  createdBy: string;

  /** Creation timestamp. */
  createdAt: Date;

  /** Last activity timestamp (last comment or resolution). */
  updatedAt: Date;
}

/** A single comment within a comment thread. */
interface Comment {
  /** Unique comment identifier. */
  id: string;

  /** Thread this comment belongs to. */
  threadId: string;

  /** Page ID (denormalized for RLS). */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /**
   * Comment content. Supports basic rich text (bold, italic, code)
   * and @mentions.
   */
  content: RichText[];

  /** Mentions within this comment. */
  mentions: InlineMention[];

  /** User who wrote this comment. */
  createdBy: string;

  /** Creation timestamp. */
  createdAt: Date;

  /** Last edit timestamp, or null if never edited. */
  editedAt: Date | null;

  /** Whether this comment has been soft-deleted. */
  isDeleted: boolean;

  /** Emoji reactions on this comment. */
  reactions: CommentReaction[];
}

/** Input for creating a comment thread. */
interface CommentThreadCreateInput {
  pageId: string;
  selection: TextSelection;
  selectedText: string;
  comment: {
    content: RichText[];
    mentions?: InlineMention[];
  };
}

/** Input for adding a comment to an existing thread. */
interface CommentCreateInput {
  threadId: string;
  content: RichText[];
  mentions?: InlineMention[];
}

/** Text selection anchor for a comment thread. */
interface TextSelection {
  /**
   * Yjs relative position for the start of the selection.
   * Encoded as a base64 string for storage.
   */
  anchorRelative: string;

  /**
   * Yjs relative position for the end of the selection.
   */
  headRelative: string;

  /** Block ID where the selection starts. */
  anchorBlockId: string;

  /** Block ID where the selection ends. */
  headBlockId: string;
}

/** Emoji reaction on a comment. */
interface CommentReaction {
  emoji: string;
  userIds: string[];
  count: number;
}
```

### Template & TemplateVariable

Page templates for common document types.

```typescript
/**
 * A page template.
 *
 * Templates are pre-built page structures (blocks, layout, content) that
 * users can instantiate to quickly create standardized documents.
 *
 * Examples: Meeting Notes, Project Brief, Sprint Retrospective, RFC,
 * Onboarding Checklist, Weekly Standup, Decision Log.
 */
interface Template {
  /** Unique template identifier. */
  id: string;

  /** Tenant ID. Null = system-provided (global) template. */
  tenantId: string | null;

  /** Workspace ID. Null = available to all workspaces in the tenant. */
  workspaceId: string | null;

  /** Template name (e.g., "Meeting Notes"). */
  name: string;

  /** Template description. */
  description: string;

  /** Icon for the template gallery. */
  icon: string;

  /** Category for grouping in the template gallery. */
  category: TemplateCategory;

  /**
   * Template content as a JSON structure of blocks.
   * Variables are represented as {{variable_name}} placeholders.
   */
  blocks: BlockCreateInput[];

  /** Variables that should be prompted when instantiating. */
  variables: TemplateVariable[];

  /**
   * Preview image URL for the template gallery.
   * Auto-generated from the template content on save.
   */
  previewImage: string | null;

  /** How many times this template has been used. */
  useCount: number;

  /** Who created the template. */
  createdBy: string;

  /** Whether this is a system template (not editable by users). */
  isSystem: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating a custom template. */
interface TemplateCreateInput {
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  blocks: BlockCreateInput[];
  variables?: TemplateVariable[];
}

/** A variable within a template that is resolved on instantiation. */
interface TemplateVariable {
  /** Variable name (used in {{name}} placeholders). */
  name: string;

  /** Human-readable label for the input prompt. */
  label: string;

  /** Variable type. */
  type: 'text' | 'date' | 'user' | 'select';

  /** Default value. */
  defaultValue?: string;

  /** For 'select' type: the options to choose from. */
  options?: string[];

  /** Whether this variable is required when instantiating. */
  required: boolean;

  /** Description/help text shown in the input prompt. */
  description?: string;
}

/** Template categories for gallery organization. */
type TemplateCategory =
  | 'meeting'
  | 'project'
  | 'engineering'
  | 'product'
  | 'hr'
  | 'general'
  | 'custom';
```

### PageVersion

Version history entries for a page.

```typescript
/**
 * A saved version of a page.
 *
 * Versions are created automatically (every 10 minutes of active editing)
 * and manually (when a user creates a named snapshot). They capture the
 * complete Yjs state at a point in time, allowing full document restoration.
 */
interface PageVersion {
  /** Unique version identifier. */
  id: string;

  /** Page this version belongs to. */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /**
   * Version number. Monotonically increasing per page.
   * Auto-versions use integer values; manual snapshots also get a version number.
   */
  versionNumber: number;

  /**
   * Version name. Auto-versions have generated names like "Auto-save Feb 9, 3:00 AM".
   * Named snapshots have user-provided names like "Final draft" or "Pre-review".
   */
  name: string;

  /** Whether this is a manually created named snapshot (vs auto-save). */
  isNamedSnapshot: boolean;

  /** Complete Yjs binary state at this version. */
  yjsState: Uint8Array;

  /**
   * Extracted blocks at this version (denormalized for quick preview
   * without decoding the Yjs state).
   */
  blocks: Block[];

  /** User who triggered this version (or 'system' for auto-saves). */
  createdBy: string;

  /** When this version was created. */
  createdAt: Date;

  /** Byte size of the Yjs state (for storage tracking). */
  byteSize: number;
}

/**
 * Diff between two page versions.
 *
 * Computes block-level differences for display in the version history panel.
 */
interface VersionDiff {
  /** The "from" version. */
  fromVersion: Pick<PageVersion, 'id' | 'versionNumber' | 'name' | 'createdAt'>;

  /** The "to" version. */
  toVersion: Pick<PageVersion, 'id' | 'versionNumber' | 'name' | 'createdAt'>;

  /** Block-level differences. */
  changes: VersionDiffBlock[];

  /** Summary statistics. */
  stats: {
    blocksAdded: number;
    blocksRemoved: number;
    blocksModified: number;
    charactersAdded: number;
    charactersRemoved: number;
  };
}

/** A single block difference between two versions. */
interface VersionDiffBlock {
  /** The block ID (same across versions if block was modified). */
  blockId: string;

  /** The type of change. */
  changeType: 'added' | 'removed' | 'modified' | 'moved';

  /** Block state in the "from" version (null if added). */
  before: Block | null;

  /** Block state in the "to" version (null if removed). */
  after: Block | null;

  /** For 'modified' blocks: inline text diff. */
  textDiff?: Array<{
    type: 'equal' | 'insert' | 'delete';
    text: string;
  }>;
}

/** A named snapshot with additional metadata. */
interface VersionSnapshot {
  version: PageVersion;

  /** Optional description of what changed. */
  description?: string;

  /** Tags for categorization. */
  tags?: string[];
}
```

### Permission

Page-level access control.

```typescript
/**
 * Permission levels for page access.
 *
 * - 'read': Can view the page content.
 * - 'comment': Can view and add comments (but not edit content).
 * - 'edit': Can view, comment, and edit content.
 * - 'full': Can do everything including manage permissions and delete.
 */
type PermissionLevel = 'read' | 'comment' | 'edit' | 'full';

/**
 * A permission grant on a page.
 *
 * Permissions can be granted to individual users or to roles.
 * The effective permission is the highest level from all applicable grants.
 */
interface Permission {
  /** Unique permission identifier. */
  id: string;

  /** Page this permission applies to. */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /**
   * Target type for this permission.
   * - 'user': Granted to a specific user.
   * - 'role': Granted to all users with a specific role.
   * - 'workspace': Granted to all workspace members.
   * - 'public': Granted to anyone (including anonymous users).
   */
  targetType: 'user' | 'role' | 'workspace' | 'public';

  /** Target ID. User ID for 'user', role ID for 'role', null for 'workspace'/'public'. */
  targetId: string | null;

  /** The permission level granted. */
  level: PermissionLevel;

  /** Who created this permission grant. */
  grantedBy: string;

  /** When this permission was granted. */
  grantedAt: Date;

  /** Optional expiration date. Null = no expiration. */
  expiresAt: Date | null;
}

/** Input for granting a permission. */
interface PermissionGrant {
  pageId: string;
  targetType: 'user' | 'role' | 'workspace' | 'public';
  targetId?: string;
  level: PermissionLevel;
  expiresAt?: Date;
}

/**
 * A share link for a page.
 *
 * Share links provide access to a page via a unique URL, optionally
 * protected by a password and/or expiration date.
 */
interface ShareLink {
  /** Unique share link identifier. */
  id: string;

  /** Page this link provides access to. */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /** The unique token in the share URL. */
  token: string;

  /** Permission level granted by this link. */
  level: PermissionLevel;

  /** Optional password required to access via this link. */
  passwordHash: string | null;

  /** Whether this link is currently active. */
  isActive: boolean;

  /** Optional expiration date. */
  expiresAt: Date | null;

  /** How many times this link has been used. */
  accessCount: number;

  /** Who created this share link. */
  createdBy: string;

  createdAt: Date;
}
```

### Mention & Backlink

Cross-referencing between pages and users.

```typescript
/**
 * A mention within a page.
 *
 * Mentions are created when a user types @ (for user mentions),
 * # (for page mentions), or @@ (for date mentions) in the editor.
 */
interface Mention {
  /** Unique mention identifier. */
  id: string;

  /** Page where the mention occurs. */
  sourcePageId: string;

  /** Block where the mention occurs. */
  sourceBlockId: string;

  /** Tenant ID. */
  tenantId: string;

  /** Type of mention. */
  type: MentionType;

  /**
   * Target of the mention.
   * - For 'user': the user ID.
   * - For 'page': the page ID.
   * - For 'date': the ISO date string.
   */
  targetId: string;

  /**
   * Display text at the time of mention creation.
   * Denormalized for rendering without lookup.
   */
  displayText: string;

  /** Who created this mention (the user who typed it). */
  createdBy: string;

  createdAt: Date;
}

type MentionType = 'user' | 'page' | 'date';

/**
 * A backlink — a reverse reference from one page to another.
 *
 * When page A mentions page B (via # or inline page link), a backlink
 * is created so that page B can display "Referenced by page A".
 * Backlinks are automatically maintained when pages are edited.
 */
interface Backlink {
  /** Unique backlink identifier. */
  id: string;

  /** The page that contains the reference (the "source"). */
  sourcePageId: string;

  /** The page being referenced (the "target"). */
  targetPageId: string;

  /** Block in the source page containing the reference. */
  sourceBlockId: string;

  /** Tenant ID. */
  tenantId: string;

  /** Context around the backlink for preview. */
  context: BacklinkContext;

  createdAt: Date;
  updatedAt: Date;
}

/** Contextual information around a backlink for preview display. */
interface BacklinkContext {
  /** Text before the link (truncated). */
  textBefore: string;

  /** The link text itself. */
  linkText: string;

  /** Text after the link (truncated). */
  textAfter: string;

  /** Source page title at the time of the last update. */
  sourcePageTitle: string;

  /** Source page icon. */
  sourcePageIcon: string | null;
}
```

### EditorService

The main service for page and block operations.

```typescript
/**
 * Core editor service.
 *
 * Handles CRUD operations for pages and blocks, search, import/export,
 * and orchestration of other sub-services.
 */
interface EditorService {
  // === Page Operations ===

  /** Create a new page. */
  createPage(input: PageCreateInput, ctx: ServiceContext): Promise<Page>;

  /** Get a page by ID (without blocks). */
  getPage(pageId: string, ctx: ServiceContext): Promise<Page>;

  /** Get a page with its blocks loaded. */
  getPageWithBlocks(pageId: string, ctx: ServiceContext): Promise<PageWithBlocks>;

  /** Update page metadata. */
  updatePage(pageId: string, input: PageUpdateInput, ctx: ServiceContext): Promise<Page>;

  /** Soft-delete a page (move to trash). */
  trashPage(pageId: string, ctx: ServiceContext): Promise<void>;

  /** Restore a trashed page. */
  restorePage(pageId: string, ctx: ServiceContext): Promise<Page>;

  /** Permanently delete a page and all its content. */
  deletePage(pageId: string, ctx: ServiceContext): Promise<void>;

  /** Duplicate a page (optionally including children). */
  duplicatePage(
    pageId: string,
    options: { includeChildren?: boolean; targetParentId?: string | null },
    ctx: ServiceContext,
  ): Promise<Page>;

  // === Page Tree ===

  /** Get the page tree for the sidebar. */
  getPageTree(workspaceId: string, ctx: ServiceContext): Promise<PageTreeNode[]>;

  /**
   * Get children of a specific page (lazy loading for deep trees).
   * Returns direct children only.
   */
  getPageChildren(pageId: string, ctx: ServiceContext): Promise<PageTreeNode[]>;

  /** Move a page to a new parent and/or position. */
  movePage(
    pageId: string,
    targetParentId: string | null,
    sortOrder: number,
    ctx: ServiceContext,
  ): Promise<void>;

  /** Get breadcrumbs for a page (root → ... → parent → current). */
  getBreadcrumbs(pageId: string, ctx: ServiceContext): Promise<PageBreadcrumb[]>;

  // === Search ===

  /**
   * Full-text search across all accessible pages.
   * Searches page titles and block text content.
   */
  searchPages(
    query: string,
    options: {
      workspaceId?: string;
      limit?: number;
      offset?: number;
    },
    ctx: ServiceContext,
  ): Promise<{
    results: Array<{
      page: Pick<Page, 'id' | 'title' | 'icon' | 'updatedAt'>;
      /** Matching text snippet with search terms highlighted. */
      snippet: string;
      /** Relevance score (higher = more relevant). */
      score: number;
    }>;
    total: number;
  }>;

  // === Import / Export ===

  /** Export a page to the specified format. */
  exportPage(
    pageId: string,
    options: ExportOptions,
    ctx: ServiceContext,
  ): Promise<ExportResult>;

  /** Import content from markdown into a new or existing page. */
  importMarkdown(
    markdown: string,
    options: {
      targetPageId?: string;  // Import into existing page
      parentId?: string;      // Or create new page under this parent
      title?: string;         // Title for the new page
    },
    ctx: ServiceContext,
  ): Promise<Page>;

  // === Favorites ===

  /** Add a page to the user's favorites. */
  favoritePage(pageId: string, ctx: ServiceContext): Promise<void>;

  /** Remove a page from the user's favorites. */
  unfavoritePage(pageId: string, ctx: ServiceContext): Promise<void>;

  /** Get the user's favorite pages. */
  getFavorites(ctx: ServiceContext): Promise<PageTreeNode[]>;
}
```

### CollaborationService

Manages real-time collaboration sessions.

```typescript
/**
 * Collaboration service.
 *
 * Manages WebSocket connections, Yjs document synchronization,
 * awareness (cursors, selections), and session lifecycle.
 */
interface CollaborationService {
  /**
   * Get the active collaboration session for a page.
   * Returns null if no users are currently connected.
   */
  getSession(pageId: string): CollaborationSession | null;

  /**
   * Get all active sessions in a workspace.
   * Used for the "currently editing" indicator in the sidebar.
   */
  getActiveSessions(workspaceId: string): Array<{
    pageId: string;
    pageTitle: string;
    userCount: number;
    users: Pick<CollaborationUser, 'id' | 'name' | 'avatar' | 'color'>[];
  }>;

  /**
   * Force-disconnect a user from a collaboration session.
   * Admin-only. Used for removing problematic connections.
   */
  disconnectUser(pageId: string, userId: string): Promise<void>;

  /**
   * Force-persist the current document state.
   * Used before operations that need the latest persisted state
   * (e.g., export, version snapshot).
   */
  forcePersist(pageId: string): Promise<void>;

  /**
   * Get connection statistics for monitoring.
   */
  getStats(): {
    totalConnections: number;
    totalDocuments: number;
    totalOperationsPerSecond: number;
    memoryUsageMb: number;
  };
}
```

### SlashCommand

Slash command system for the / menu.

```typescript
/**
 * A slash command entry.
 *
 * Slash commands appear when the user types "/" in the editor.
 * They provide quick access to block insertion and formatting operations.
 */
interface SlashCommand {
  /** Unique command identifier. */
  id: string;

  /** Display name (e.g., "Heading 1", "To-do List"). */
  name: string;

  /** Description shown below the name. */
  description: string;

  /** Icon displayed to the left of the command. */
  icon: string;

  /**
   * Search aliases. The command matches if the user's input matches
   * the name, description, or any alias.
   */
  aliases: string[];

  /** Group this command belongs to (for visual grouping in the menu). */
  group: SlashCommandGroup;

  /**
   * Keyboard shortcut (if any) displayed to the right of the command.
   * E.g., "Ctrl+Shift+1" for Heading 1.
   */
  shortcut?: string;

  /**
   * Execute the command. Inserts a block, applies formatting, or
   * performs another editor action.
   */
  execute: (editor: TipTapEditor) => void;
}

/** Slash command groups for menu organization. */
type SlashCommandGroup =
  | 'basic'       // Text, Heading, List, Todo, Toggle, Divider, Quote
  | 'media'       // Image, Video, Embed, Code
  | 'layout'      // Columns, Callout, Table
  | 'advanced'    // Template, Import, Embed page
  | 'inline'      // Mention user, Mention page, Date
  | 'actions';    // Turn into, Delete, Duplicate

/** Registry for managing slash commands. */
interface SlashCommandRegistry {
  /** Get all registered commands. */
  getAll(): SlashCommand[];

  /** Search commands by query string. */
  search(query: string): SlashCommand[];

  /** Register a custom command (for extensions). */
  register(command: SlashCommand): void;

  /** Unregister a command by ID. */
  unregister(commandId: string): void;

  /** Get commands in a specific group. */
  getByGroup(group: SlashCommandGroup): SlashCommand[];
}
```

### ExportOptions

Configuration for page export.

```typescript
/** Supported export formats. */
type ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx';

/** Options for exporting a page. */
interface ExportOptions {
  /** Target format. */
  format: ExportFormat;

  /** Whether to include child pages (recursive export). */
  includeChildren?: boolean;

  /** Whether to include comments in the export. */
  includeComments?: boolean;

  /**
   * Whether to include metadata (title, author, dates) as a header
   * or front matter in the exported document.
   */
  includeMetadata?: boolean;

  /** For PDF: page size. */
  pageSize?: 'a4' | 'letter' | 'legal';

  /** For PDF: include table of contents. */
  includeTableOfContents?: boolean;

  /** For HTML: whether to include inline CSS styles. */
  inlineStyles?: boolean;

  /** For markdown: which flavor to use. */
  markdownFlavor?: 'gfm' | 'commonmark';
}

/** Result of an export operation. */
interface ExportResult {
  /** The exported content. */
  content: string | Buffer;

  /** MIME type of the result. */
  mimeType: string;

  /** Suggested filename. */
  filename: string;

  /** Content size in bytes. */
  byteSize: number;
}
```

### PageActivity

Activity tracking for audit and feed.

```typescript
/**
 * An activity event on a page.
 *
 * Activities provide an audit trail and power the "recently edited"
 * and "activity feed" features.
 */
interface PageActivity {
  /** Unique activity identifier. */
  id: string;

  /** Page this activity is about. */
  pageId: string;

  /** Tenant ID. */
  tenantId: string;

  /** Activity type. */
  type: ActivityType;

  /** User who performed the action. */
  userId: string;

  /** Additional metadata specific to the activity type. */
  metadata: Record<string, unknown>;

  /** When the activity occurred. */
  createdAt: Date;
}

/** Types of page activities tracked. */
type ActivityType =
  | 'page_created'
  | 'page_edited'
  | 'page_renamed'
  | 'page_moved'
  | 'page_trashed'
  | 'page_restored'
  | 'page_deleted'
  | 'page_duplicated'
  | 'permission_granted'
  | 'permission_revoked'
  | 'comment_added'
  | 'comment_resolved'
  | 'version_created'
  | 'version_restored'
  | 'page_exported'
  | 'page_shared'
  | 'template_created'
  | 'template_used';

/** A page in the user's favorites. */
interface PageFavorite {
  /** Unique favorite identifier. */
  id: string;

  /** The favorited page. */
  pageId: string;

  /** User who favorited. */
  userId: string;

  /** Tenant ID. */
  tenantId: string;

  /** Sort order among the user's favorites. */
  sortOrder: number;

  /** When the page was favorited. */
  createdAt: Date;
}
```

---

## Database Schemas

All tables use multi-tenant Row-Level Security (RLS). Every query is automatically scoped to the authenticated user's tenant.

### pages

```sql
CREATE TABLE pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  parent_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  title         TEXT NOT NULL DEFAULT 'Untitled',
  icon          TEXT,
  cover_image   TEXT,
  cover_image_position INTEGER NOT NULL DEFAULT 50,
  sort_order    DOUBLE PRECISION NOT NULL DEFAULT 0,
  visibility    TEXT NOT NULL DEFAULT 'workspace'
                CHECK (visibility IN ('private', 'workspace', 'public')),
  is_template   BOOLEAN NOT NULL DEFAULT FALSE,
  is_trashed    BOOLEAN NOT NULL DEFAULT FALSE,
  trashed_at    TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES users(id),
  last_edited_by UUID NOT NULL REFERENCES users(id),
  yjs_state     BYTEA,
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pages_tenant_workspace ON pages(tenant_id, workspace_id)
  WHERE is_trashed = FALSE AND is_template = FALSE;
CREATE INDEX idx_pages_parent ON pages(parent_id, sort_order)
  WHERE is_trashed = FALSE;
CREATE INDEX idx_pages_search ON pages USING GIN(search_vector);
CREATE INDEX idx_pages_trashed ON pages(tenant_id, trashed_at)
  WHERE is_trashed = TRUE;
CREATE INDEX idx_pages_template ON pages(tenant_id, workspace_id)
  WHERE is_template = TRUE;
CREATE INDEX idx_pages_created_by ON pages(created_by);
CREATE INDEX idx_pages_updated_at ON pages(updated_at DESC);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION pages_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(text_content, ' ') FROM blocks WHERE page_id = NEW.id),
      ''
    )), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title ON pages
  FOR EACH ROW EXECUTE FUNCTION pages_search_vector_update();

-- Updated_at trigger
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pages_tenant_isolation ON pages
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY pages_select ON pages FOR SELECT
  USING (
    visibility = 'workspace'
    OR visibility = 'public'
    OR created_by = current_setting('app.user_id')::UUID
    OR EXISTS (
      SELECT 1 FROM page_permissions
      WHERE page_permissions.page_id = pages.id
        AND (
          (page_permissions.target_type = 'user'
           AND page_permissions.target_id = current_setting('app.user_id')::UUID)
          OR
          (page_permissions.target_type = 'role'
           AND page_permissions.target_id IN (
             SELECT role_id FROM user_roles
             WHERE user_id = current_setting('app.user_id')::UUID
           ))
        )
    )
  );
```

### blocks

```sql
CREATE TABLE blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  content         JSONB NOT NULL DEFAULT '{}',
  sort_order      DOUBLE PRECISION NOT NULL DEFAULT 0,
  indent_level    INTEGER NOT NULL DEFAULT 0,
  text_content    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_blocks_page ON blocks(page_id, sort_order);
CREATE INDEX idx_blocks_parent ON blocks(parent_block_id, sort_order);
CREATE INDEX idx_blocks_type ON blocks(page_id, type);
CREATE INDEX idx_blocks_text_search ON blocks USING GIN(
  to_tsvector('english', text_content)
);

-- RLS (inherits from pages via page_id join)
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocks_tenant_isolation ON blocks
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = blocks.page_id
        AND pages.tenant_id = current_setting('app.tenant_id')::UUID
    )
  );
```

### page_versions

```sql
CREATE TABLE page_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  version_number    INTEGER NOT NULL,
  name              TEXT NOT NULL,
  is_named_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
  yjs_state         BYTEA NOT NULL,
  blocks            JSONB NOT NULL DEFAULT '[]',
  created_by        UUID NOT NULL REFERENCES users(id),
  byte_size         INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (page_id, version_number)
);

-- Indexes
CREATE INDEX idx_page_versions_page ON page_versions(page_id, version_number DESC);
CREATE INDEX idx_page_versions_named ON page_versions(page_id)
  WHERE is_named_snapshot = TRUE;
CREATE INDEX idx_page_versions_created ON page_versions(page_id, created_at DESC);

-- Auto-cleanup: keep max 100 auto-saves per page, unlimited named snapshots
-- Implemented via a trigger or scheduled job.

-- RLS
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_versions_tenant_isolation ON page_versions
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### comments

```sql
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES comment_threads(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  content     JSONB NOT NULL DEFAULT '[]',
  mentions    JSONB NOT NULL DEFAULT '[]',
  created_by  UUID NOT NULL REFERENCES users(id),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at   TIMESTAMPTZ,
  reactions   JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_thread ON comments(thread_id, created_at);
CREATE INDEX idx_comments_page ON comments(page_id);
CREATE INDEX idx_comments_author ON comments(created_by);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_tenant_isolation ON comments
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### comment_threads

```sql
CREATE TABLE comment_threads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id        UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  selection      JSONB NOT NULL,
  selected_text  TEXT NOT NULL,
  is_resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by    UUID REFERENCES users(id),
  resolved_at    TIMESTAMPTZ,
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comment_threads_page ON comment_threads(page_id)
  WHERE is_resolved = FALSE;
CREATE INDEX idx_comment_threads_resolved ON comment_threads(page_id)
  WHERE is_resolved = TRUE;

-- RLS
ALTER TABLE comment_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_threads_tenant_isolation ON comment_threads
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### templates

```sql
CREATE TABLE templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),
  workspace_id  UUID REFERENCES workspaces(id),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  icon          TEXT NOT NULL DEFAULT '📄',
  category      TEXT NOT NULL DEFAULT 'general'
                CHECK (category IN (
                  'meeting', 'project', 'engineering',
                  'product', 'hr', 'general', 'custom'
                )),
  blocks        JSONB NOT NULL DEFAULT '[]',
  variables     JSONB NOT NULL DEFAULT '[]',
  preview_image TEXT,
  use_count     INTEGER NOT NULL DEFAULT 0,
  created_by    UUID NOT NULL REFERENCES users(id),
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_tenant ON templates(tenant_id, category);
CREATE INDEX idx_templates_workspace ON templates(workspace_id, category);
CREATE INDEX idx_templates_system ON templates(is_system, category)
  WHERE is_system = TRUE;
CREATE INDEX idx_templates_popular ON templates(use_count DESC);

-- RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_select ON templates FOR SELECT
  USING (
    is_system = TRUE
    OR tenant_id = current_setting('app.tenant_id')::UUID
  );

CREATE POLICY templates_modify ON templates FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::UUID
    AND is_system = FALSE
  );
```

### template_variables

```sql
CREATE TABLE template_variables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  label         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('text', 'date', 'user', 'select')),
  default_value TEXT,
  options       JSONB,
  required      BOOLEAN NOT NULL DEFAULT FALSE,
  description   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,

  UNIQUE (template_id, name)
);

-- Indexes
CREATE INDEX idx_template_variables_template ON template_variables(template_id, sort_order);
```

### page_permissions

```sql
CREATE TABLE page_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  target_type TEXT NOT NULL
              CHECK (target_type IN ('user', 'role', 'workspace', 'public')),
  target_id   UUID,
  level       TEXT NOT NULL
              CHECK (level IN ('read', 'comment', 'edit', 'full')),
  granted_by  UUID NOT NULL REFERENCES users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,

  -- Unique constraint: one permission per target per page
  UNIQUE (page_id, target_type, target_id)
);

-- Indexes
CREATE INDEX idx_page_permissions_page ON page_permissions(page_id);
CREATE INDEX idx_page_permissions_user ON page_permissions(target_id)
  WHERE target_type = 'user';
CREATE INDEX idx_page_permissions_role ON page_permissions(target_id)
  WHERE target_type = 'role';
CREATE INDEX idx_page_permissions_expiry ON page_permissions(expires_at)
  WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE page_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_permissions_tenant_isolation ON page_permissions
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### mentions

```sql
CREATE TABLE mentions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id  UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  source_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  type            TEXT NOT NULL CHECK (type IN ('user', 'page', 'date')),
  target_id       TEXT NOT NULL,
  display_text    TEXT NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mentions_source ON mentions(source_page_id);
CREATE INDEX idx_mentions_target_user ON mentions(target_id)
  WHERE type = 'user';
CREATE INDEX idx_mentions_target_page ON mentions(target_id)
  WHERE type = 'page';
CREATE INDEX idx_mentions_tenant ON mentions(tenant_id);

-- RLS
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentions_tenant_isolation ON mentions
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### backlinks

```sql
CREATE TABLE backlinks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id  UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id  UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  source_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  context         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (source_page_id, target_page_id, source_block_id)
);

-- Indexes
CREATE INDEX idx_backlinks_target ON backlinks(target_page_id);
CREATE INDEX idx_backlinks_source ON backlinks(source_page_id);
CREATE INDEX idx_backlinks_tenant ON backlinks(tenant_id);

-- RLS
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY backlinks_tenant_isolation ON backlinks
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### page_favorites

```sql
CREATE TABLE page_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  sort_order  DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (page_id, user_id)
);

-- Indexes
CREATE INDEX idx_page_favorites_user ON page_favorites(user_id, sort_order);
CREATE INDEX idx_page_favorites_page ON page_favorites(page_id);

-- RLS
ALTER TABLE page_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_favorites_own ON page_favorites
  USING (
    tenant_id = current_setting('app.tenant_id')::UUID
    AND user_id = current_setting('app.user_id')::UUID
  );
```

### page_activities

```sql
CREATE TABLE page_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  type        TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_page_activities_page ON page_activities(page_id, created_at DESC);
CREATE INDEX idx_page_activities_user ON page_activities(user_id, created_at DESC);
CREATE INDEX idx_page_activities_tenant ON page_activities(tenant_id, created_at DESC);
CREATE INDEX idx_page_activities_type ON page_activities(page_id, type);

-- Partitioning by month for large-scale deployments
-- CREATE TABLE page_activities (...) PARTITION BY RANGE (created_at);

-- RLS
ALTER TABLE page_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_activities_tenant_isolation ON page_activities
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

---

## Code Examples

### 1. Creating a Page with Blocks

Create a new page with initial content blocks, including nested structures.

```typescript
import { EditorService } from '@mcv/operations/editor';

const editorService = container.resolve(EditorService);

// Create a "Sprint Planning" page with initial blocks
const page = await editorService.createPage(
  {
    title: 'Sprint 14 Planning — Feb 10, 2026',
    parentId: meetingNotesPageId,
    icon: '📋',
    visibility: 'workspace',
    initialBlocks: [
      {
        type: 'callout',
        content: {
          richText: [{ text: 'Sprint Goal: Launch editor collaboration MVP' }],
          icon: '🎯',
          variant: 'info',
        },
      },
      {
        type: 'heading',
        content: {
          richText: [{ text: 'Attendees' }],
          level: 2,
        },
      },
      {
        type: 'text',
        content: {
          richText: [{ text: 'Present: ' }],
          mentions: [
            { type: 'user', targetId: 'user-alice', displayText: 'Alice Chen' },
            { type: 'user', targetId: 'user-bob', displayText: 'Bob Park' },
            { type: 'user', targetId: 'user-carol', displayText: 'Carol Zhang' },
          ],
        },
      },
      {
        type: 'heading',
        content: {
          richText: [{ text: 'Sprint Backlog' }],
          level: 2,
        },
      },
      {
        type: 'todo',
        content: {
          richText: [
            { text: 'Implement Yjs integration', bold: true },
            { text: ' — connect TipTap to Hocuspocus server' },
          ],
          checked: false,
        },
      },
      {
        type: 'todo',
        content: {
          richText: [
            { text: 'Cursor presence UI', bold: true },
            { text: ' — show collaborator cursors and selections' },
          ],
          checked: false,
        },
      },
      {
        type: 'todo',
        content: {
          richText: [
            { text: 'Slash command menu', bold: true },
            { text: ' — /-triggered command palette for block insertion' },
          ],
          checked: true,
          checkedBy: 'user-alice',
          checkedAt: new Date('2026-02-07'),
        },
      },
      {
        type: 'divider',
        content: { style: 'solid' },
      },
      {
        type: 'toggle',
        content: {
          richText: [{ text: 'Discussion Notes', bold: true }],
          defaultExpanded: false,
        },
      },
    ],
  },
  ctx,
);

console.log(`Created page: ${page.id} — "${page.title}"`);
// Created page: 01952a3b-... — "Sprint 14 Planning — Feb 10, 2026"
```

### 2. Real-Time Collaboration Session

Set up a real-time collaborative editing session with cursor presence.

```typescript
import { useEditor, useCollaboration } from '@mcv/operations/editor';

function CollaborativeEditor({ pageId }: { pageId: string }) {
  // Initialize the collaboration session
  const {
    provider,
    ydoc,
    isConnected,
    isSynced,
    connectedUsers,
    awareness,
  } = useCollaboration({
    pageId,
    // WebSocket URL for the Hocuspocus server
    url: `wss://${env.COLLAB_HOST}/collaboration`,
    // Auth token for the WebSocket connection
    token: session.accessToken,
    // User info for awareness (cursor display)
    user: {
      id: session.userId,
      name: session.userName,
      avatar: session.userAvatar,
      color: getUserColor(session.userId),
    },
    // Callbacks
    onConnect: () => console.log('Connected to collaboration server'),
    onDisconnect: () => console.log('Disconnected — will auto-reconnect'),
    onSynced: () => console.log('Initial sync complete'),
    onAuthenticationFailed: () => {
      toast.error('You do not have access to this page');
      router.push('/pages');
    },
  });

  // Initialize the TipTap editor with Yjs collaboration
  const { editor } = useEditor({
    ydoc,
    awareness,
    editable: permissionLevel === 'edit' || permissionLevel === 'full',
    // Editor extensions (block types, shortcuts, etc.)
    extensions: [
      // Collaboration extensions are added automatically by useEditor
      // Additional extensions can be added here
    ],
    onUpdate: ({ editor }) => {
      // Optional: track unsaved state, trigger auto-save, etc.
    },
  });

  if (!isSynced) {
    return <EditorSkeleton />;
  }

  return (
    <div className="editor-container">
      {/* Collaboration status bar */}
      <div className="collab-status">
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="status-dot status-connected" />
            <span>Connected</span>
            {/* Collaborator avatars */}
            <div className="flex -space-x-2">
              {connectedUsers.map((user) => (
                <Avatar
                  key={user.id}
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  style={{ borderColor: user.color }}
                  title={`${user.name} — editing`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="status-dot status-disconnected" />
            <span>Reconnecting...</span>
          </div>
        )}
      </div>

      {/* The editor itself */}
      <EditorContent editor={editor} />

      {/* Comment sidebar (shows inline comment threads) */}
      <CommentSidebar pageId={pageId} editor={editor} />
    </div>
  );
}
```

### 3. Slash Command Registration

Register custom slash commands and use the built-in command palette.

```typescript
import {
  useSlashCommands,
  SlashCommandRegistry,
  type SlashCommand,
} from '@mcv/operations/editor';

// Register a custom slash command
const customCommand: SlashCommand = {
  id: 'insert-standup-template',
  name: 'Daily Standup',
  description: 'Insert a standup update template',
  icon: '🌅',
  aliases: ['standup', 'daily', 'scrum'],
  group: 'advanced',
  shortcut: undefined,
  execute: (editor) => {
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '🌅 Daily Standup — ' + formatDate(new Date()) }],
        },
        {
          type: 'heading',
          attrs: { level: 4 },
          content: [{ type: 'text', text: 'Yesterday' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'What I completed...' }] },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 4 },
          content: [{ type: 'text', text: 'Today' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'What I plan to do...' }] },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 4 },
          content: [{ type: 'text', text: 'Blockers' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Any blockers or dependencies...' }],
                },
              ],
            },
          ],
        },
      ])
      .run();
  },
};

// In a React component
function EditorWithCustomCommands({ pageId }: { pageId: string }) {
  const { registerCommand, unregisterCommand } = useSlashCommands();

  useEffect(() => {
    registerCommand(customCommand);
    return () => unregisterCommand(customCommand.id);
  }, []);

  // The SlashCommandMenu component automatically includes all registered commands
  return (
    <EditorProvider pageId={pageId}>
      <Editor />
      <SlashCommandMenu />
    </EditorProvider>
  );
}

// === Built-in slash commands (registered by default) ===
//
// /text or /paragraph  — Insert a text block
// /h1, /h2, /h3       — Insert heading (level 1, 2, 3)
// /todo                — Insert a to-do checkbox
// /bullet              — Insert a bulleted list
// /numbered            — Insert a numbered list
// /toggle              — Insert a toggle (collapsible) block
// /quote               — Insert a block quote
// /divider             — Insert a horizontal divider
// /callout             — Insert a callout block
// /code                — Insert a code block
// /table               — Insert a table
// /image               — Insert an image
// /video               — Insert a video
// /embed               — Insert an embed (iframe)
// /columns             — Insert a column layout
// /mention or @        — Mention a user
// /page or #           — Link to a page
// /date or @@          — Insert a date mention
// /template            — Insert from template
```

### 4. Inline Comments

Create and manage inline comments on text selections.

```typescript
import { useComments, CommentSidebar } from '@mcv/operations/editor';

function PageWithComments({ pageId }: { pageId: string }) {
  const {
    threads,
    openThreads,
    resolvedThreads,
    createThread,
    addComment,
    resolveThread,
    reopenThread,
    deleteComment,
    isLoading,
  } = useComments({ pageId });

  // Create a new comment thread on a text selection
  const handleCreateComment = async (selection: TextSelection, selectedText: string) => {
    const thread = await createThread({
      pageId,
      selection,
      selectedText,
      comment: {
        content: [
          { text: 'This section needs more detail about the ' },
          { text: 'error handling', bold: true },
          { text: ' strategy. ' },
        ],
        mentions: [
          { type: 'user', targetId: 'user-bob', displayText: 'Bob Park' },
        ],
      },
    });

    console.log(`Created comment thread: ${thread.id}`);
    // Notification sent to @Bob Park automatically
  };

  // Reply to an existing thread
  const handleReply = async (threadId: string) => {
    await addComment({
      threadId,
      content: [
        { text: 'Good point! I\'ll add a section on retry logic and circuit breakers.' },
      ],
    });
  };

  // Resolve a thread (mark as addressed)
  const handleResolve = async (threadId: string) => {
    await resolveThread(threadId);
    // Thread is visually collapsed but remains accessible in "Resolved" tab
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <Editor pageId={pageId} />
      </div>

      {/* Comment sidebar */}
      <CommentSidebar
        threads={threads}
        onReply={handleReply}
        onResolve={handleResolve}
        onReopen={reopenThread}
        onDelete={deleteComment}
      />
    </div>
  );
}

// === Server-side: Comment notification ===
import { CommentService } from '@mcv/operations/editor';

const commentService = container.resolve(CommentService);

// When a comment is created, notify mentioned users
commentService.on('comment:created', async (event) => {
  const { comment, thread, page } = event;

  // Notify all mentioned users
  for (const mention of comment.mentions) {
    if (mention.type === 'user') {
      await notificationService.send({
        userId: mention.targetId,
        type: 'editor_comment_mention',
        title: `${event.authorName} mentioned you in "${page.title}"`,
        body: extractPlainText(comment.content).slice(0, 200),
        actionUrl: `/pages/${page.id}?thread=${thread.id}`,
      });
    }
  }

  // Notify other thread participants (who aren't mentioned)
  const participantIds = thread.comments
    .map((c) => c.createdBy)
    .filter((id) => id !== comment.createdBy)
    .filter((id) => !comment.mentions.some((m) => m.targetId === id));

  for (const userId of [...new Set(participantIds)]) {
    await notificationService.send({
      userId,
      type: 'editor_comment_reply',
      title: `${event.authorName} replied in "${page.title}"`,
      body: extractPlainText(comment.content).slice(0, 200),
      actionUrl: `/pages/${page.id}?thread=${thread.id}`,
    });
  }
});
```

### 5. Version History & Restore

Browse version history, compare versions, and restore previous states.

```typescript
import { useVersionHistory, VersionHistoryPanel } from '@mcv/operations/editor';

function PageWithVersionHistory({ pageId }: { pageId: string }) {
  const {
    versions,
    currentVersion,
    loadVersion,
    createSnapshot,
    restoreVersion,
    compareDiff,
    isLoading,
  } = useVersionHistory({ pageId });

  // Create a named snapshot before a big change
  const handleSnapshot = async () => {
    const version = await createSnapshot({
      name: 'Pre-refactor draft',
      description: 'Saving state before restructuring the architecture section',
    });
    toast.success(`Snapshot created: v${version.versionNumber}`);
  };

  // Compare two versions
  const handleCompare = async (fromId: string, toId: string) => {
    const diff = await compareDiff(fromId, toId);

    console.log('Version diff:', {
      blocksAdded: diff.stats.blocksAdded,
      blocksRemoved: diff.stats.blocksRemoved,
      blocksModified: diff.stats.blocksModified,
      charsAdded: diff.stats.charactersAdded,
      charsRemoved: diff.stats.charactersRemoved,
    });
    // Version diff: { blocksAdded: 3, blocksRemoved: 1, blocksModified: 5, charsAdded: 847, charsRemoved: 213 }

    return diff;
  };

  // Restore a previous version
  const handleRestore = async (versionId: string) => {
    // This creates a new version (snapshot of current state) before restoring,
    // so the restore is always reversible.
    const restoredPage = await restoreVersion(versionId);
    toast.success('Page restored to previous version');
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <Editor pageId={pageId} />
      </div>

      <VersionHistoryPanel
        versions={versions}
        currentVersion={currentVersion}
        onLoadVersion={loadVersion}
        onCreateSnapshot={handleSnapshot}
        onRestoreVersion={handleRestore}
        onCompare={handleCompare}
      />
    </div>
  );
}

// === Server-side: Version management ===
import { VersionService } from '@mcv/operations/editor';

const versionService = container.resolve(VersionService);

// Auto-save version every 10 minutes during active editing
// This is handled by the Hocuspocus server hooks:
const hocuspocusConfig = {
  onStoreDocument: async ({ document, documentName }) => {
    const pageId = documentName;
    const lastVersion = await versionService.getLatestVersion(pageId, ctx);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (!lastVersion || lastVersion.createdAt < tenMinutesAgo) {
      await versionService.createAutoVersion(pageId, document, ctx);
    }
  },
};

// Cleanup old auto-save versions (keep last 50, all named snapshots)
await versionService.pruneAutoVersions(pageId, { keepCount: 50 }, ctx);

// Get version at a specific point in time
const versionAtTime = await versionService.getVersionAt(
  pageId,
  new Date('2026-02-08T14:30:00Z'),
  ctx,
);
```

### 6. Page Templates

Use templates to create standardized pages quickly.

```typescript
import { TemplateService, TemplateGallery } from '@mcv/operations/editor';

const templateService = container.resolve(TemplateService);

// Create a custom template
const template = await templateService.createTemplate(
  {
    name: 'Sprint Retrospective',
    description: 'Template for sprint retrospective meetings with structured sections',
    icon: '🔄',
    category: 'meeting',
    variables: [
      {
        name: 'sprint_number',
        label: 'Sprint Number',
        type: 'text',
        required: true,
        description: 'e.g., "Sprint 14"',
      },
      {
        name: 'facilitator',
        label: 'Facilitator',
        type: 'user',
        required: true,
      },
      {
        name: 'sprint_date',
        label: 'Sprint End Date',
        type: 'date',
        required: true,
      },
    ],
    blocks: [
      {
        type: 'heading',
        content: {
          richText: [{ text: '🔄 {{sprint_number}} Retrospective — {{sprint_date}}' }],
          level: 1,
        },
      },
      {
        type: 'text',
        content: {
          richText: [
            { text: 'Facilitator: ', bold: true },
            { text: '{{facilitator}}' },
          ],
        },
      },
      {
        type: 'divider',
        content: { style: 'solid' },
      },
      {
        type: 'columns',
        content: { count: 3, ratios: [0.33, 0.34, 0.33] },
      },
      // Column 1: What went well
      {
        type: 'heading',
        content: {
          richText: [{ text: '✅ What Went Well' }],
          level: 2,
        },
        // Would be a child of column 0
      },
      {
        type: 'bulletedList',
        content: { richText: [{ text: 'Add items here...' }] },
      },
      // Column 2: What could improve
      {
        type: 'heading',
        content: {
          richText: [{ text: '🔧 What Could Improve' }],
          level: 2,
        },
      },
      {
        type: 'bulletedList',
        content: { richText: [{ text: 'Add items here...' }] },
      },
      // Column 3: Action items
      {
        type: 'heading',
        content: {
          richText: [{ text: '🎯 Action Items' }],
          level: 2,
        },
      },
      {
        type: 'todo',
        content: {
          richText: [{ text: 'Add action items here...' }],
          checked: false,
        },
      },
      {
        type: 'divider',
        content: { style: 'dashed' },
      },
      {
        type: 'toggle',
        content: {
          richText: [{ text: 'Sprint Metrics', bold: true }],
          defaultExpanded: false,
        },
      },
    ],
  },
  ctx,
);

// Instantiate a page from a template
const page = await editorService.createPage(
  {
    title: '', // Will be derived from template
    parentId: retrospectivesPageId,
    templateId: template.id,
    // Variable values for this instance
    // (prompted via UI when using TemplateGallery component)
  },
  ctx,
);

// React component: Template Gallery
function NewPageDialog({ parentId, onCreated }: Props) {
  return (
    <TemplateGallery
      onSelectTemplate={async (template, variables) => {
        const page = await editorService.createPage(
          {
            title: resolveTemplateTitle(template, variables),
            parentId,
            templateId: template.id,
          },
          ctx,
        );
        onCreated(page);
      }}
      onBlankPage={async () => {
        const page = await editorService.createPage(
          { title: 'Untitled', parentId },
          ctx,
        );
        onCreated(page);
      }}
    />
  );
}
```

### 7. Export to Multiple Formats

Export pages to Markdown, HTML, PDF, or DOCX.

```typescript
import { ExportService, type ExportOptions } from '@mcv/operations/editor';

const exportService = container.resolve(ExportService);

// Export to Markdown
const markdownResult = await exportService.exportPage(
  pageId,
  {
    format: 'markdown',
    markdownFlavor: 'gfm',
    includeChildren: false,
    includeComments: false,
    includeMetadata: true,
  },
  ctx,
);

console.log(markdownResult.content);
// ---
// title: Sprint 14 Planning — Feb 10, 2026
// author: Alice Chen
// created: 2026-02-09T08:00:00Z
// updated: 2026-02-09T15:30:00Z
// ---
//
// # Sprint 14 Planning — Feb 10, 2026
//
// > 🎯 Sprint Goal: Launch editor collaboration MVP
//
// ## Attendees
//
// Present: @Alice Chen, @Bob Park, @Carol Zhang
//
// ## Sprint Backlog
//
// - [x] **Implement Yjs integration** — connect TipTap to Hocuspocus server
// ...

// Export to PDF with table of contents
const pdfResult = await exportService.exportPage(
  pageId,
  {
    format: 'pdf',
    pageSize: 'a4',
    includeTableOfContents: true,
    includeChildren: true,  // Include nested sub-pages
    includeMetadata: true,
  },
  ctx,
);

// Save or send the PDF
await fs.writeFile(`/tmp/${pdfResult.filename}`, pdfResult.content);
console.log(`PDF exported: ${pdfResult.filename} (${pdfResult.byteSize} bytes)`);

// Export to HTML with inline styles (for email embedding)
const htmlResult = await exportService.exportPage(
  pageId,
  {
    format: 'html',
    inlineStyles: true,
    includeComments: true,  // Include comment threads as footnotes
  },
  ctx,
);

// Export to DOCX for sharing with external stakeholders
const docxResult = await exportService.exportPage(
  pageId,
  {
    format: 'docx',
    includeMetadata: true,
    includeChildren: false,
  },
  ctx,
);

// === Utility: Quick copy as markdown ===
import { blocksToMarkdown } from '@mcv/operations/editor';

// Convert blocks to markdown string (client-side, no service needed)
const pageWithBlocks = await editorService.getPageWithBlocks(pageId, ctx);
const markdown = blocksToMarkdown(pageWithBlocks.blocks);
await navigator.clipboard.writeText(markdown);
toast.success('Copied as Markdown');

// === Utility: Import from markdown ===
import { markdownToBlocks } from '@mcv/operations/editor';

const markdown = `
# Imported Document

This was written in an external editor.

## Section One

- Item A
- Item B
- Item C

\`\`\`typescript
const hello = 'world';
\`\`\`
`;

const blocks = markdownToBlocks(markdown);
const importedPage = await editorService.importMarkdown(
  markdown,
  { parentId: engineeringPageId, title: 'Imported Document' },
  ctx,
);
```

### 8. Page Permissions & Sharing

Manage per-page access control and generate share links.

```typescript
import { usePermissions, ShareDialog } from '@mcv/operations/editor';

// === Server-side permission management ===
import { PermissionService } from '@mcv/operations/editor';

const permissionService = container.resolve(PermissionService);

// Grant edit access to a specific user
await permissionService.grantPermission(
  {
    pageId,
    targetType: 'user',
    targetId: 'user-dave',
    level: 'edit',
  },
  ctx,
);

// Grant read access to a role
await permissionService.grantPermission(
  {
    pageId,
    targetType: 'role',
    targetId: 'role-engineering',
    level: 'read',
  },
  ctx,
);

// Grant comment access to the entire workspace
await permissionService.grantPermission(
  {
    pageId,
    targetType: 'workspace',
    level: 'comment',
  },
  ctx,
);

// Create a share link (read-only, expires in 7 days)
const shareLink = await permissionService.createShareLink(
  {
    pageId,
    level: 'read',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    password: undefined, // No password
  },
  ctx,
);

console.log(`Share URL: https://app.mcv.one/s/${shareLink.token}`);

// Check effective permission for a user
const effectivePermission = await permissionService.getEffectivePermission(
  pageId,
  userId,
  ctx,
);
console.log(`User has "${effectivePermission}" access`); // "edit"

// Revoke a permission
await permissionService.revokePermission(permissionId, ctx);

// List all permissions on a page
const permissions = await permissionService.listPermissions(pageId, ctx);
// [
//   { targetType: 'user', targetId: 'user-dave', level: 'edit', ... },
//   { targetType: 'role', targetId: 'role-engineering', level: 'read', ... },
//   { targetType: 'workspace', targetId: null, level: 'comment', ... },
// ]

// === Client-side: Share Dialog ===
function PageShareButton({ pageId }: { pageId: string }) {
  const {
    permissions,
    shareLinks,
    grantPermission,
    revokePermission,
    createShareLink,
    deactivateShareLink,
    effectivePermission,
  } = usePermissions({ pageId });

  return (
    <ShareDialog
      pageId={pageId}
      permissions={permissions}
      shareLinks={shareLinks}
      onGrant={grantPermission}
      onRevoke={revokePermission}
      onCreateLink={createShareLink}
      onDeactivateLink={deactivateShareLink}
      currentUserPermission={effectivePermission}
    />
  );
}
```

---

## Error Codes

All errors from `@mcv/operations/editor` use structured error codes with the `EDITOR_` prefix. Errors extend the platform's `AppError` base class and include machine-readable codes, human-readable messages, and contextual metadata.

| Code | HTTP | Description |
|------|------|-------------|
| `EDITOR_PAGE_NOT_FOUND` | 404 | The requested page does not exist or has been permanently deleted. |
| `EDITOR_PAGE_TRASHED` | 410 | The page has been moved to trash. Use `restorePage` to recover it. |
| `EDITOR_PAGE_ACCESS_DENIED` | 403 | The user does not have sufficient permissions to access this page. |
| `EDITOR_PAGE_EDIT_DENIED` | 403 | The user has read/comment access but not edit access to this page. |
| `EDITOR_PAGE_DELETE_DENIED` | 403 | The user does not have full permission required to delete this page. |
| `EDITOR_PAGE_DEPTH_EXCEEDED` | 400 | Cannot nest the page deeper than `MAX_PAGE_DEPTH` (8) levels. |
| `EDITOR_PAGE_CIRCULAR_PARENT` | 400 | Cannot move a page to be a descendant of itself (circular reference). |
| `EDITOR_PAGE_TITLE_TOO_LONG` | 400 | Page title exceeds 500 characters. |
| `EDITOR_BLOCK_NOT_FOUND` | 404 | The referenced block does not exist in this page. |
| `EDITOR_BLOCK_TYPE_INVALID` | 400 | The block type is not recognized. Must be one of the `BlockType` union. |
| `EDITOR_BLOCK_CONTENT_INVALID` | 400 | The block content does not match the schema for its type. |
| `EDITOR_BLOCK_DEPTH_EXCEEDED` | 400 | Block nesting exceeds `MAX_BLOCK_DEPTH` (6) levels. |
| `EDITOR_COLLAB_AUTH_FAILED` | 401 | WebSocket authentication failed. The token is invalid or expired. |
| `EDITOR_COLLAB_ROOM_FULL` | 429 | Too many concurrent editors on this page (max 50 per page). |
| `EDITOR_COLLAB_SYNC_FAILED` | 500 | CRDT sync failed. The client should reconnect. |
| `EDITOR_COLLAB_DISCONNECTED` | 503 | The collaboration server is unavailable. Edits are saved locally. |
| `EDITOR_COMMENT_NOT_FOUND` | 404 | The referenced comment or thread does not exist. |
| `EDITOR_COMMENT_EDIT_DENIED` | 403 | Cannot edit another user's comment. Only the author can edit. |
| `EDITOR_COMMENT_DELETE_DENIED` | 403 | Cannot delete another user's comment. Only the author or page owner can delete. |
| `EDITOR_COMMENT_THREAD_RESOLVED` | 400 | Cannot add comments to a resolved thread. Reopen the thread first. |
| `EDITOR_VERSION_NOT_FOUND` | 404 | The referenced version does not exist. |
| `EDITOR_VERSION_RESTORE_FAILED` | 500 | Failed to restore the version. The Yjs state may be corrupted. |
| `EDITOR_VERSION_LIMIT_REACHED` | 400 | Named snapshot limit reached (max 100 per page). Delete old snapshots first. |
| `EDITOR_TEMPLATE_NOT_FOUND` | 404 | The referenced template does not exist or is not accessible. |
| `EDITOR_TEMPLATE_SYSTEM_IMMUTABLE` | 403 | System templates cannot be modified or deleted. |
| `EDITOR_TEMPLATE_VARIABLE_MISSING` | 400 | Required template variable was not provided during instantiation. |
| `EDITOR_EXPORT_FORMAT_UNSUPPORTED` | 400 | The requested export format is not supported. |
| `EDITOR_EXPORT_TOO_LARGE` | 413 | The page is too large to export (>10MB for PDF, >50MB for other formats). |
| `EDITOR_IMPORT_PARSE_FAILED` | 400 | The markdown/HTML input could not be parsed into blocks. |
| `EDITOR_PERMISSION_ALREADY_EXISTS` | 409 | A permission grant already exists for this target on this page. |
| `EDITOR_PERMISSION_SELF_REVOKE` | 400 | Cannot revoke your own full permission (would lock you out). |
| `EDITOR_SHARE_LINK_EXPIRED` | 410 | The share link has expired. |
| `EDITOR_SHARE_LINK_PASSWORD_WRONG` | 401 | Incorrect password for the share link. |
| `EDITOR_SHARE_LINK_INACTIVE` | 410 | The share link has been deactivated. |
| `EDITOR_MENTION_TARGET_NOT_FOUND` | 404 | The mentioned user or page does not exist. |
| `EDITOR_SEARCH_QUERY_TOO_SHORT` | 400 | Search query must be at least 2 characters. |
| `EDITOR_SEARCH_QUERY_TOO_LONG` | 400 | Search query must not exceed 200 characters. |
| `EDITOR_RATE_LIMITED` | 429 | Too many requests. Rate limit: 100 mutations/min, 300 reads/min per user. |
| `EDITOR_CONTENT_TOO_LARGE` | 413 | Page content exceeds the maximum size (5MB of text content per page). |
| `EDITOR_IMAGE_UPLOAD_FAILED` | 500 | Image upload to storage failed. |
| `EDITOR_IMAGE_TOO_LARGE` | 413 | Uploaded image exceeds 10MB limit. |
| `EDITOR_EMBED_URL_BLOCKED` | 400 | The embed URL is not in the allowed embed domains list. |
| `EDITOR_WORKSPACE_NOT_FOUND` | 404 | The referenced workspace does not exist or the user is not a member. |

### Error Structure

```typescript
import { EDITOR_ERROR_CODES } from '@mcv/operations/editor';

// Example error thrown by the module
{
  code: 'EDITOR_PAGE_ACCESS_DENIED',
  message: 'You do not have permission to access this page',
  httpStatus: 403,
  metadata: {
    pageId: '01952a3b-...',
    userId: 'user-eve',
    requiredLevel: 'read',
    currentLevel: null,
  },
}

// Catching errors in client code
try {
  await editorService.getPage(pageId, ctx);
} catch (error) {
  if (error.code === EDITOR_ERROR_CODES.PAGE_ACCESS_DENIED) {
    router.push('/pages?error=access-denied');
  } else if (error.code === EDITOR_ERROR_CODES.PAGE_NOT_FOUND) {
    router.push('/pages?error=not-found');
  } else {
    throw error; // Unexpected error — let error boundary handle it
  }
}
```

---

## Security

### Row-Level Security (RLS)

All database tables in this module are protected by PostgreSQL Row-Level Security policies. Every query automatically filters by the authenticated user's `tenant_id`, set via `SET LOCAL app.tenant_id = '...'` at the start of each request.

**Tenant Isolation:**

- Every table includes a `tenant_id` column.
- RLS policies enforce `tenant_id = current_setting('app.tenant_id')::UUID` on all operations.
- There is no SQL path to access another tenant's data, even via raw queries.
- The Hocuspocus WebSocket server sets the tenant context on connection authentication.

**Page Access Control:**

Permission resolution follows this hierarchy (highest wins):

1. **Page creator** — Always has `full` access to their own pages.
2. **Explicit user permission** — Direct permission grant to the user.
3. **Role permission** — Permission granted to a role the user belongs to.
4. **Workspace permission** — Permission granted to all workspace members.
5. **Public permission** — Permission granted to anyone (including anonymous).
6. **Page visibility** — The `visibility` field on the page provides a baseline:
   - `private`: No access unless explicitly granted.
   - `workspace`: All workspace members get `read` access (overridden by explicit grants).
   - `public`: Everyone gets `read` access (overridden by explicit grants).

**Permission Inheritance:**

Child pages **do not** automatically inherit parent permissions. Each page has independent access control. This is a deliberate design choice:

- It prevents accidentally exposing sensitive sub-pages when sharing a parent.
- Users can set up specific permission trees using the bulk-permission feature.
- The UI warns when a child page has more restrictive permissions than its parent.

### Collaboration Security

**WebSocket Authentication:**

- Every WebSocket connection to Hocuspocus requires a valid JWT token.
- The token is validated on the `onAuthenticate` hook before any data is exchanged.
- Token refresh is handled transparently — the client re-authenticates when the token expires.
- Invalid or expired tokens result in immediate connection closure with `EDITOR_COLLAB_AUTH_FAILED`.

**Room Authorization:**

- Each Yjs document room corresponds to a page ID.
- On connection, the server checks the user's effective permission for that page.
- Users with `read` or `comment` permission can connect in **read-only mode** (receive updates but cannot send edits).
- Users with `edit` or `full` permission can connect in **read-write mode**.
- Permission changes take effect on the next WebSocket reconnect (not mid-session, to avoid disrupting active edits).

**Rate Limiting:**

- WebSocket messages are rate-limited to 100 operations per second per connection.
- Connections exceeding this limit are throttled (messages queued) rather than dropped.
- Sustained abuse (>500 ops/s) results in connection termination.

### Content Security

**Input Sanitization:**

- All block content is sanitized before persistence using `sanitizeBlockContent()`.
- HTML content in rich text is stripped to a safe allowlist (no `<script>`, `<iframe>`, `<object>`, event handlers).
- Image and video URLs are validated against an allowlist of domains (configurable per tenant).
- Embed URLs (iframes) are restricted to a configurable allowlist: YouTube, Vimeo, Figma, Loom, Google Drive, Miro, etc.

**Content Size Limits:**

| Limit | Value |
|-------|-------|
| Max page title length | 500 characters |
| Max text content per page | 5 MB |
| Max blocks per page | 10,000 |
| Max block nesting depth | 6 levels |
| Max page nesting depth | 8 levels |
| Max image upload size | 10 MB |
| Max concurrent editors per page | 50 |
| Max named snapshots per page | 100 |
| Max pages per workspace | 50,000 |

**XSS Prevention:**

- Rich text content is rendered via React components (not `dangerouslySetInnerHTML`).
- Mention display text is escaped before rendering.
- Code blocks use a sandboxed syntax highlighter that does not execute content.
- Embed URLs are rendered in sandboxed iframes with `sandbox="allow-scripts allow-same-origin"`.

### Export & API Security

- Export endpoints require at least `read` permission on the page.
- PDF export runs in a sandboxed headless browser (Puppeteer) with no network access.
- API access to page content (tRPC) respects the same permission model as the UI.
- Share links with passwords use bcrypt hashing (cost factor 12).
- Share link tokens are 32-byte cryptographically random values (URL-safe base64).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EDITOR_COLLAB_HOST` | Yes | — | Hostname for the Hocuspocus WebSocket server (e.g., `collab.mcv.one`). |
| `EDITOR_COLLAB_PORT` | No | `1234` | Port for the Hocuspocus server. |
| `EDITOR_COLLAB_SECRET` | Yes | — | Shared secret for Hocuspocus server-to-server authentication. |
| `EDITOR_MAX_CONNECTIONS_PER_DOC` | No | `50` | Maximum concurrent WebSocket connections per document. |
| `EDITOR_MAX_CONNECTIONS_TOTAL` | No | `5000` | Maximum total WebSocket connections across all documents. |
| `EDITOR_PERSISTENCE_INTERVAL_MS` | No | `30000` | How often to persist Yjs state during active editing (ms). |
| `EDITOR_AUTO_VERSION_INTERVAL_MS` | No | `600000` | How often to create auto-save versions during active editing (ms). Default: 10 minutes. |
| `EDITOR_MAX_AUTO_VERSIONS` | No | `100` | Maximum auto-save versions to keep per page (oldest pruned first). |
| `EDITOR_MAX_NAMED_SNAPSHOTS` | No | `100` | Maximum named snapshots per page. |
| `EDITOR_MAX_PAGE_SIZE_BYTES` | No | `5242880` | Maximum text content size per page (bytes). Default: 5 MB. |
| `EDITOR_MAX_IMAGE_SIZE_BYTES` | No | `10485760` | Maximum uploaded image size (bytes). Default: 10 MB. |
| `EDITOR_IMAGE_STORAGE_BUCKET` | No | `editor-images` | Supabase Storage bucket for uploaded images. |
| `EDITOR_EMBED_ALLOWLIST` | No | See below | Comma-separated list of allowed embed domains. |
| `EDITOR_EXPORT_PDF_TIMEOUT_MS` | No | `30000` | Timeout for PDF generation (ms). |
| `EDITOR_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum search query length. |
| `EDITOR_RATE_LIMIT_MUTATIONS` | No | `100` | Maximum mutations per minute per user. |
| `EDITOR_RATE_LIMIT_READS` | No | `300` | Maximum reads per minute per user. |

**Default Embed Allowlist:**

```
youtube.com, youtu.be, vimeo.com, figma.com, loom.com,
docs.google.com, drive.google.com, miro.com, airtable.com,
notion.so, github.com, codepen.io, codesandbox.io,
excalidraw.com, whimsical.com, lucid.app, pitch.com
```

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `yjs` | `^13.6` | CRDT implementation for conflict-free collaborative editing. |
| `@hocuspocus/server` | `^2.11` | WebSocket server for Yjs document synchronization. |
| `@hocuspocus/provider` | `^2.11` | Client-side WebSocket provider for Hocuspocus. |
| `@tiptap/core` | `^2.2` | Headless rich-text editor framework built on ProseMirror. |
| `@tiptap/pm` | `^2.2` | ProseMirror core libraries (model, state, view, transform). |
| `@tiptap/starter-kit` | `^2.2` | Base TipTap extensions (paragraph, heading, lists, etc.). |
| `@tiptap/extension-collaboration` | `^2.2` | TipTap extension for Yjs collaboration integration. |
| `@tiptap/extension-collaboration-cursor` | `^2.2` | TipTap extension for displaying collaborator cursors. |
| `@tiptap/extension-table` | `^2.2` | Table block support (rows, cells, headers). |
| `@tiptap/extension-code-block-lowlight` | `^2.2` | Code block with syntax highlighting via lowlight. |
| `@tiptap/extension-image` | `^2.2` | Image block support. |
| `@tiptap/extension-mention` | `^2.2` | @mention support with autocomplete. |
| `@tiptap/extension-placeholder` | `^2.2` | Placeholder text for empty blocks. |
| `@tiptap/extension-task-list` | `^2.2` | To-do / task list block support. |
| `@tiptap/extension-task-item` | `^2.2` | Individual task/to-do items. |
| `drizzle-orm` | `^0.30` | Type-safe SQL ORM for database operations. |
| `@trpc/server` | `^10.45` | Type-safe API layer for client-server communication. |
| `lowlight` | `^3.1` | Syntax highlighting engine for code blocks. |
| `marked` | `^12.0` | Markdown parser for import functionality. |
| `turndown` | `^7.1` | HTML-to-Markdown converter for export. |
| `diff` | `^5.2` | Text diffing for version comparison. |
| `bcrypt` | `^5.1` | Password hashing for share link authentication. |
| `nanoid` | `^5.0` | Secure random ID generation for share link tokens. |
| `sanitize-html` | `^2.12` | HTML sanitization for content security. |
| `zod` | `^3.22` | Schema validation for API inputs and block content. |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^1.2` | Test runner for unit and integration tests. |
| `@testing-library/react` | `^14.1` | React component testing utilities. |
| `@playwright/test` | `^1.41` | End-to-end browser testing. |
| `drizzle-kit` | `^0.20` | Database migration tooling. |
| `msw` | `^2.1` | Mock Service Worker for API mocking in tests. |
| `y-prosemirror` | `^1.2` | Yjs bindings for ProseMirror (used in test helpers). |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.2` | React runtime. |
| `react-dom` | `^18.2` | React DOM rendering. |
| `@supabase/supabase-js` | `^2.39` | Supabase client for storage and auth. |

---

## Testing

### Unit Tests

Unit tests cover individual services, utilities, and business logic in isolation.

```typescript
// __tests__/services/page.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PageService } from '../services/page.service';
import { createTestContext, createTestDb } from '@mcv/testing';

describe('PageService', () => {
  let pageService: PageService;
  let ctx: ServiceContext;

  beforeEach(async () => {
    const db = await createTestDb();
    pageService = new PageService(db);
    ctx = createTestContext({ tenantId: 'tenant-1', userId: 'user-alice' });
  });

  describe('createPage', () => {
    it('creates a page with default values', async () => {
      const page = await pageService.create(
        { title: 'Test Page' },
        ctx,
      );

      expect(page.title).toBe('Test Page');
      expect(page.visibility).toBe('workspace');
      expect(page.parentId).toBeNull();
      expect(page.icon).toBeNull();
      expect(page.isTrashed).toBe(false);
      expect(page.createdBy).toBe('user-alice');
    });

    it('enforces max page depth', async () => {
      let parentId: string | null = null;
      for (let i = 0; i < 8; i++) {
        const page = await pageService.create(
          { title: `Level ${i}`, parentId },
          ctx,
        );
        parentId = page.id;
      }

      // 9th level should fail
      await expect(
        pageService.create({ title: 'Too Deep', parentId }, ctx),
      ).rejects.toMatchObject({
        code: 'EDITOR_PAGE_DEPTH_EXCEEDED',
      });
    });

    it('prevents circular parent references', async () => {
      const parent = await pageService.create({ title: 'Parent' }, ctx);
      const child = await pageService.create(
        { title: 'Child', parentId: parent.id },
        ctx,
      );

      await expect(
        pageService.update(parent.id, { parentId: child.id }, ctx),
      ).rejects.toMatchObject({
        code: 'EDITOR_PAGE_CIRCULAR_PARENT',
      });
    });
  });

  describe('searchPages', () => {
    it('returns results ranked by relevance', async () => {
      await pageService.create({ title: 'Architecture Overview' }, ctx);
      await pageService.create({ title: 'API Architecture' }, ctx);
      await pageService.create({ title: 'Unrelated Page' }, ctx);

      const results = await pageService.search('architecture', {}, ctx);

      expect(results.total).toBe(2);
      expect(results.results[0].page.title).toContain('Architecture');
    });
  });
});
```

```typescript
// __tests__/utils/export-markdown.test.ts
import { describe, it, expect } from 'vitest';
import { blocksToMarkdown } from '../utils/export-markdown';

describe('blocksToMarkdown', () => {
  it('converts headings correctly', () => {
    const blocks = [
      {
        id: '1',
        type: 'heading' as const,
        content: { richText: [{ text: 'Hello World' }], level: 1 },
        sortOrder: 0,
        indentLevel: 0,
      },
    ];

    expect(blocksToMarkdown(blocks)).toBe('# Hello World\n');
  });

  it('converts todo items with checked state', () => {
    const blocks = [
      {
        id: '1',
        type: 'todo' as const,
        content: {
          richText: [{ text: 'Done task' }],
          checked: true,
        },
        sortOrder: 0,
        indentLevel: 0,
      },
      {
        id: '2',
        type: 'todo' as const,
        content: {
          richText: [{ text: 'Open task' }],
          checked: false,
        },
        sortOrder: 1,
        indentLevel: 0,
      },
    ];

    expect(blocksToMarkdown(blocks)).toBe(
      '- [x] Done task\n- [ ] Open task\n',
    );
  });

  it('handles rich text formatting', () => {
    const blocks = [
      {
        id: '1',
        type: 'text' as const,
        content: {
          richText: [
            { text: 'Normal ' },
            { text: 'bold', bold: true },
            { text: ' and ' },
            { text: 'italic', italic: true },
            { text: ' and ' },
            { text: 'code', code: true },
          ],
        },
        sortOrder: 0,
        indentLevel: 0,
      },
    ];

    expect(blocksToMarkdown(blocks)).toBe(
      'Normal **bold** and *italic* and `code`\n',
    );
  });

  it('converts tables to GFM format', () => {
    const blocks = [
      {
        id: '1',
        type: 'table' as const,
        content: {
          hasHeaderRow: true,
          hasHeaderColumn: false,
          rows: [
            {
              id: 'r1',
              cells: [
                { id: 'c1', richText: [{ text: 'Name' }] },
                { id: 'c2', richText: [{ text: 'Role' }] },
              ],
            },
            {
              id: 'r2',
              cells: [
                { id: 'c3', richText: [{ text: 'Alice' }] },
                { id: 'c4', richText: [{ text: 'Engineer' }] },
              ],
            },
          ],
        },
        sortOrder: 0,
        indentLevel: 0,
      },
    ];

    const md = blocksToMarkdown(blocks);
    expect(md).toContain('| Name | Role |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| Alice | Engineer |');
  });
});
```

### Integration Tests

Integration tests verify the interaction between services and the database.

```typescript
// __tests__/integration/collaboration.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

describe('Collaboration Integration', () => {
  let server: TestServer;

  afterEach(async () => {
    await server?.stop();
  });

  it('syncs edits between two clients', async () => {
    server = await createTestServer();

    const pageId = await server.createPage('Test Page');

    // Connect two clients
    const client1 = await server.connectClient(pageId, 'user-alice');
    const client2 = await server.connectClient(pageId, 'user-bob');

    // Wait for initial sync
    await client1.waitForSync();
    await client2.waitForSync();

    // Client 1 inserts text
    const fragment1 = client1.ydoc.getXmlFragment('content');
    const paragraph = new Y.XmlElement('paragraph');
    paragraph.insert(0, [new Y.XmlText('Hello from Alice')]);
    fragment1.insert(0, [paragraph]);

    // Wait for sync to propagate
    await new Promise((r) => setTimeout(r, 200));

    // Client 2 should see the text
    const fragment2 = client2.ydoc.getXmlFragment('content');
    const text = fragment2.toDOM().textContent;
    expect(text).toContain('Hello from Alice');
  });

  it('merges concurrent edits without conflict', async () => {
    server = await createTestServer();
    const pageId = await server.createPage('Merge Test');

    const client1 = await server.connectClient(pageId, 'user-alice');
    const client2 = await server.connectClient(pageId, 'user-bob');

    await client1.waitForSync();
    await client2.waitForSync();

    // Both clients edit simultaneously
    const frag1 = client1.ydoc.getXmlFragment('content');
    const p1 = new Y.XmlElement('paragraph');
    p1.insert(0, [new Y.XmlText('Alice\'s paragraph')]);
    frag1.insert(0, [p1]);

    const frag2 = client2.ydoc.getXmlFragment('content');
    const p2 = new Y.XmlElement('paragraph');
    p2.insert(0, [new Y.XmlText('Bob\'s paragraph')]);
    frag2.insert(0, [p2]);

    // Wait for convergence
    await new Promise((r) => setTimeout(r, 500));

    // Both documents should have both paragraphs
    const text1 = frag1.toDOM().textContent;
    const text2 = frag2.toDOM().textContent;

    expect(text1).toContain('Alice\'s paragraph');
    expect(text1).toContain('Bob\'s paragraph');
    expect(text1).toBe(text2); // Convergence
  });

  it('persists state on disconnect', async () => {
    server = await createTestServer();
    const pageId = await server.createPage('Persistence Test');

    // Connect, edit, disconnect
    const client1 = await server.connectClient(pageId, 'user-alice');
    await client1.waitForSync();

    const frag = client1.ydoc.getXmlFragment('content');
    const p = new Y.XmlElement('paragraph');
    p.insert(0, [new Y.XmlText('Persisted content')]);
    frag.insert(0, [p]);

    await client1.disconnect();
    await new Promise((r) => setTimeout(r, 1000)); // Wait for persistence

    // Reconnect and verify
    const client2 = await server.connectClient(pageId, 'user-bob');
    await client2.waitForSync();

    const frag2 = client2.ydoc.getXmlFragment('content');
    expect(frag2.toDOM().textContent).toContain('Persisted content');
  });
});
```

### CRDT Conflict Tests

Specific tests for edge cases in CRDT conflict resolution.

```typescript
// __tests__/crdt/conflict-resolution.test.ts
import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('CRDT Conflict Resolution', () => {
  it('handles simultaneous character insertion at same position', () => {
    const doc1 = new Y.Doc({ gc: false });
    const doc2 = new Y.Doc({ gc: false });

    const text1 = doc1.getText('content');
    const text2 = doc2.getText('content');

    // Initial state: "Hello"
    text1.insert(0, 'Hello');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Both insert at position 5 simultaneously
    text1.insert(5, ' World');
    text2.insert(5, ' Everyone');

    // Merge
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Both should converge (order determined by client ID)
    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toContain('Hello');
    expect(text1.toString()).toContain('World');
    expect(text1.toString()).toContain('Everyone');
  });

  it('handles delete + edit conflict on same block', () => {
    const doc1 = new Y.Doc({ gc: false });
    const doc2 = new Y.Doc({ gc: false });

    const array1 = doc1.getArray('blocks');
    const array2 = doc2.getArray('blocks');

    // Initial: one block
    const block = new Y.Map();
    block.set('text', 'Original content');
    block.set('type', 'paragraph');
    array1.push([block]);
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Client 1: deletes the block
    array1.delete(0, 1);

    // Client 2: edits the block text
    const block2 = array2.get(0) as Y.Map<any>;
    block2.set('text', 'Edited content');

    // Merge
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Delete wins in Yjs — block is gone from both
    expect(array1.length).toBe(0);
    expect(array2.length).toBe(0);
  });

  it('handles offline edits that reconnect', () => {
    const doc1 = new Y.Doc({ gc: false });
    const doc2 = new Y.Doc({ gc: false });

    const text1 = doc1.getText('content');
    const text2 = doc2.getText('content');

    // Both start with same state
    text1.insert(0, 'Shared baseline');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Simulate offline: doc2 makes many edits without syncing
    text2.insert(text2.length, ' + offline edit 1');
    text2.insert(text2.length, ' + offline edit 2');
    text2.insert(text2.length, ' + offline edit 3');

    // Meanwhile doc1 also edits
    text1.insert(text1.length, ' + online edit');

    // "Reconnect" — apply all pending updates
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Convergence
    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toContain('Shared baseline');
    expect(text1.toString()).toContain('offline edit 1');
    expect(text1.toString()).toContain('online edit');
  });
});
```

### End-to-End Tests

Browser-based tests using Playwright.

```typescript
// __tests__/e2e/editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'alice@test.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/pages');
  });

  test('creates a new page and types content', async ({ page }) => {
    // Create new page
    await page.click('[data-testid="new-page-button"]');
    await page.waitForSelector('[data-testid="editor-content"]');

    // Type a title
    await page.click('[data-testid="page-title"]');
    await page.keyboard.type('My Test Page');

    // Type in the editor
    await page.click('[data-testid="editor-content"]');
    await page.keyboard.type('Hello, this is a test paragraph.');

    // Verify content persists after reload
    await page.reload();
    await page.waitForSelector('[data-testid="editor-content"]');

    const title = await page.textContent('[data-testid="page-title"]');
    expect(title).toBe('My Test Page');

    const content = await page.textContent('[data-testid="editor-content"]');
    expect(content).toContain('Hello, this is a test paragraph.');
  });

  test('slash command inserts a heading', async ({ page }) => {
    await page.click('[data-testid="new-page-button"]');
    await page.waitForSelector('[data-testid="editor-content"]');
    await page.click('[data-testid="editor-content"]');

    // Type slash command
    await page.keyboard.type('/h1');
    await page.waitForSelector('[data-testid="slash-command-menu"]');

    // Select "Heading 1"
    await page.keyboard.press('Enter');

    // Type heading text
    await page.keyboard.type('My Heading');

    // Verify heading was created
    const heading = await page.locator('h1').textContent();
    expect(heading).toBe('My Heading');
  });

  test('two users collaborate in real time', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as different users
    await loginAs(page1, 'alice@test.com');
    await loginAs(page2, 'bob@test.com');

    // Alice creates a page
    await page1.click('[data-testid="new-page-button"]');
    const pageUrl = page1.url();

    // Bob opens the same page
    await page2.goto(pageUrl);

    // Both should see each other's avatars
    await page1.waitForSelector('[data-testid="collab-avatar"]');
    await page2.waitForSelector('[data-testid="collab-avatar"]');

    // Alice types
    await page1.click('[data-testid="editor-content"]');
    await page1.keyboard.type('Hello from Alice!');

    // Bob should see Alice's text
    await expect(page2.locator('[data-testid="editor-content"]'))
      .toContainText('Hello from Alice!', { timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
```

### Performance Benchmarks

```typescript
// __tests__/perf/editor-benchmarks.test.ts
import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { blocksToMarkdown } from '../utils/export-markdown';
import { markdownToBlocks } from '../utils/import-markdown';

describe('Performance Benchmarks', () => {
  it('handles 1000 concurrent operations in <100ms', () => {
    const doc = new Y.Doc();
    const text = doc.getText('content');

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      text.insert(i, `Character ${i} `);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    console.log(`1000 Yjs operations: ${elapsed.toFixed(2)}ms`);
  });

  it('exports a 500-block page to markdown in <50ms', () => {
    const blocks = Array.from({ length: 500 }, (_, i) => ({
      id: `block-${i}`,
      type: 'text' as const,
      content: {
        richText: [{ text: `Paragraph ${i} with some content that is reasonably long to simulate real usage.` }],
      },
      sortOrder: i,
      indentLevel: 0,
      pageId: 'page-1',
      parentBlockId: null,
      textContent: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const start = performance.now();
    const md = blocksToMarkdown(blocks);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(md.length).toBeGreaterThan(0);
    console.log(`500-block export: ${elapsed.toFixed(2)}ms, ${md.length} chars`);
  });

  it('Yjs document merge with 10K operations converges in <200ms', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const text1 = doc1.getText('content');
    const text2 = doc2.getText('content');

    // Both docs accumulate 5K operations independently
    for (let i = 0; i < 5000; i++) {
      text1.insert(i, String.fromCharCode(65 + (i % 26)));
      text2.insert(i, String.fromCharCode(97 + (i % 26)));
    }

    const start = performance.now();
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(text1.toString()).toBe(text2.toString()); // Convergence
    console.log(`10K operation merge: ${elapsed.toFixed(2)}ms`);
  });
});
```

### Running Tests

```bash
# Run all editor tests
pnpm test --filter @mcv/operations/editor

# Run unit tests only
pnpm test --filter @mcv/operations/editor -- --dir __tests__/services __tests__/utils

# Run integration tests (requires test database)
pnpm test:integration --filter @mcv/operations/editor

# Run CRDT conflict tests
pnpm test --filter @mcv/operations/editor -- --dir __tests__/crdt

# Run e2e tests (requires running dev server)
pnpm test:e2e --filter @mcv/operations/editor

# Run performance benchmarks
pnpm test --filter @mcv/operations/editor -- --dir __tests__/perf

# Coverage report
pnpm test:coverage --filter @mcv/operations/editor
# Target: >90% line coverage for services, >80% for components
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.14.0 | 2025-11-15 | Initial release: basic page CRUD, block-based editor, Yjs collaboration. |
| 0.14.1 | 2025-11-28 | Added slash command palette, keyboard shortcuts. |
| 0.15.0 | 2025-12-10 | Comments system: inline threads, mentions in comments, notifications. |
| 0.15.1 | 2025-12-20 | Version history: auto-save, named snapshots, diff viewer. |
| 0.16.0 | 2026-01-08 | Templates: template gallery, custom templates, template variables. |
| 0.16.1 | 2026-01-15 | Export: Markdown, HTML, PDF, DOCX. Import from Markdown. |
| 0.17.0 | 2026-01-25 | Permissions: per-page access control, share links, visibility levels. |
| 0.17.1 | 2026-02-01 | Backlinks, @mentions, page references, search improvements. |
| 0.17.2 | 2026-02-08 | Performance: persistence optimization, large document handling, rate limiting. |