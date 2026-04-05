# MCV One Desktop — File Manager, Media Library & Unified Data Fabric

**Date**: 2026-04-05
**Status**: Approved
**Owner**: Tony (CEO, EdgeIQ Holdings)
**Agent**: NAOS

---

## 1. Overview

Build a comprehensive File Manager, Media Library, and Unified Data Fabric for MCV One Desktop. This system provides three distinct but composable UI experiences — an OS-style file browser, a visual media gallery, and a venture-scoped workspace — all powered by a hybrid storage abstraction layer, AI intelligence (Claude + Gemini), Google RAG, full audit logging, and Solana-based NFT certification for legally binding documents.

The UI adopts FutureState investor app design language: glassmorphic cards, stagger animations, gradient accents, hover-lift micro-interactions, institutional typography, and a Netflix/Prime cinematic discovery layer for executive-level content surfacing.

### Approach

**Hybrid B+C**: Premium UI ships first with Supabase + Local FS working on day one. Each storage provider is modeled as a Kit (aligned with existing kit architecture) so Claude can manage files via tool-calling. Direct execution bridge handles high-throughput operations (uploads, downloads, browsing) without LLM routing. New providers are added incrementally — each one lights up a new option in Settings > Integrations.

### Success Criteria

- OS-style file browser with tree nav, breadcrumbs, grid/list, drag-drop, bulk select, context menus
- Media library with masonry grid, type filters, AI auto-tags, full preview panel
- Netflix-style Discover mode with hero spotlight, carousel rows, personalization
- Venture-scoped workspace that auto-filters when switching ventures
- Hybrid storage: Supabase (primary), Local FS (F:\MCV-Desktop-SA\), Google Drive, Vercel Blob, Cloudflare R2, GCP Cloud Storage
- AI-powered: auto-tagging, semantic search, generative media, executive briefs
- Google RAG corpora per venture for grounded AI responses
- File lifecycle: draft/active/review/approved/archived/trash/locked with stage progression
- Full audit log for every file action
- NFT certification on Solana for binding contracts
- All UI at FutureState institutional grade — glassmorphic, animated, responsive

---

## 2. Storage Abstraction Layer

### 2.1 StorageProvider Interface

Every storage backend implements one interface:

```typescript
interface StorageProvider {
  id: string                          // 'supabase' | 'local' | 'gdrive' | 'r2' | ...
  name: string                        // 'Supabase Storage'
  icon: LucideIcon
  capabilities: StorageCapability[]   // ['read','write','stream','search','sync','version']

  // Core operations
  list(path: string, opts?: ListOpts): Promise<StorageItem[]>
  read(path: string): Promise<StorageReadResult>
  write(path: string, data: Blob | ReadableStream, meta?: FileMeta): Promise<StorageWriteResult>
  delete(path: string): Promise<void>
  move(from: string, to: string): Promise<void>
  copy(from: string, to: string): Promise<void>

  // Optional capabilities
  search?(query: string, opts?: SearchOpts): Promise<StorageItem[]>
  getVersions?(path: string): Promise<FileVersion[]>
  getThumbnail?(path: string, size: ThumbSize): Promise<string>
  getPublicUrl?(path: string): Promise<string>
  sync?(direction: 'push' | 'pull' | 'bidirectional'): Promise<SyncResult>
}

type StorageCapability = 'read' | 'write' | 'stream' | 'search' | 'sync' | 'version' | 'public-url' | 'thumbnail'

interface StorageItem {
  id: string
  name: string
  path: string
  provider: string
  isFolder: boolean
  mimeType?: string
  sizeBytes?: number
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
  metadata?: Record<string, any>
}

interface ListOpts {
  prefix?: string
  limit?: number
  offset?: number
  orderBy?: 'name' | 'date' | 'size'
  orderDir?: 'asc' | 'desc'
  fileTypes?: string[]
}
```

### 2.2 Kit-Per-Provider Architecture

Each provider is a storage kit with dual-path execution:

- **Direct path**: UI calls `kit.handlers.list_files(input, ctx)` directly via execution bridge (fast, no LLM)
- **AI path**: Claude calls `list_files` tool via orchestrator (conversational, intelligent routing)

```
src/lib/kits/builtin/
├── storage-supabase-kit.ts    ← primary cloud (day 1)
├── storage-local-kit.ts       ← F:\MCV-Desktop-SA\ (day 1)
├── storage-gdrive-kit.ts      ← Google Drive sync (day 1)
├── storage-vercel-kit.ts      ← Vercel Blob CDN
├── storage-r2-kit.ts          ← Cloudflare R2
├── storage-gcp-kit.ts         ← GCP Cloud Storage
├── storage-ai-kit.ts          ← AI file operations (analyze, generate, search, brief)
├── storage-meta-kit.ts        ← cross-provider meta-ops (search all, migrate, replicate)
└── google-rag-kit.ts          ← Google RAG corpus management + retrieval
```

### 2.3 Storage Orchestrator

Lightweight routing layer (`src/lib/storage/orchestrator.ts`):

- Knows which providers are configured and healthy (from Settings)
- Routes operations by path prefix: `local://`, `supabase://`, `gdrive://`, `vercel://`, `r2://`, `gcp://`
- Handles cross-provider operations (copy from Drive to Supabase)
- Maintains unified metadata index in Supabase (`storage_files` table)
- Emits events for telemetry/activity system and audit logging

### 2.4 Provider Priority Stack

1. **Supabase Storage** — primary cloud default (already wired)
2. **Local Filesystem** — `F:\MCV-Desktop-SA\` for local-first heavy storage
3. **Google Drive** — live sync for docs/collaboration
4. **Vercel Blob** — CDN-optimized media assets
5. **Cloudflare R2** — S3-compatible bulk storage (free egress)
6. **GCP Cloud Storage** — enterprise tier, pairs with Google AI keys
7. **Neon** — structured data/metadata (Postgres, complements Supabase)

---

## 3. Navigation & View Structure

### 3.1 Two Nav Items, Venture-Aware

**Global NavRail** (Operations section):
- **Files** — full OS-style browser + media library as sub-tabs. Icon: `FolderOpen` (cyan accent)

**Venture NavRail** (auto-scoped):
- **Workspace** — venture-scoped file view, auto-filtered. Icon: `Archive` (venture theme color)

### 3.2 ViewId Additions

```typescript
// New ViewIds in navigation.ts
'files'              // Global Files view (Browser + Media Library + All Sources)
'venture-workspace'  // Venture-scoped file workspace
```

### 3.3 Files View — Three Mode Tabs + Discover Toggle

```
┌─────────────────────────────────────────────────────┐
│  Files                [ Browse | Discover ]  [+New] │
│  ───────────────────────────────────────────────────│
│  [Browse Mode]                                      │
│    [ Browser ]  [ Media Library ]  [ All Sources ]  │
│    ... active tab content ...                       │
│  [Discover Mode]                                    │
│    ... cinematic hero + carousel rows ...           │
└─────────────────────────────────────────────────────┘
```

**Browser tab**: OS-style file manager
- Tree sidebar (collapsible folder nav)
- Breadcrumb path bar with provider icon prefix
- Grid/List view toggle
- Drag-drop for move/copy
- Right-click context menu (rename, move, copy, delete, share, open with, AI analyze, certify on-chain)
- Bulk select with shift+click, ctrl+click
- Provider selector dropdown in breadcrumb

**Media Library tab**: Visual-first gallery
- Masonry grid of thumbnails/previews
- Type filters: Images, Video, Audio, Documents, Data, Recordings, Conversations
- Sort: Recent, Name, Size, AI Relevance
- Preview panel (click to expand with metadata sidebar)
- AI-powered: auto-tags as pills, similarity grouping, content search
- Generative actions: "Generate image for [venture]" routes to Gemini Imagen

**All Sources tab**: Unified data fabric
- Flat timeline of ALL interactions across providers
- Activity stream: file uploads, edits, AI generations, messages, meetings, recordings
- Filterable by venture, provider, type, date range
- AI semantic search bar

### 3.4 Venture Workspace View

Auto-scopes when venture is active:
- Category cards at top (KPI-style, FutureState pattern): Docs, Assets, Data, Media, Exports — each with count badge
- Click category to filter file list
- Recent files list with provider icon, relative timestamp
- Quick actions contextual to venture (WarForge: "Generate Art", FutureState: "Upload Deck")
- Cross-venture sharing via link/copy action

---

## 4. Cinematic Discovery Layer

### 4.1 Overview

Netflix/Prime-style presentation mode toggled via Browse/Discover switch. Content auto-curates based on user behavior and AI analysis.

### 4.2 Hero Spotlight

- Full-width glassmorphic banner with gradient overlay on background thumbnail
- Auto-rotates between AI-curated "most important" items (recency, access frequency, venture priority)
- Gradient text title (cyan to purple)
- AI-generated one-line summary
- Source count badge ("Auto-generated from 14 sources")
- Actions: Open, Share, AI Brief
- Parallax on mouse movement, auto-advances 8s with dot indicators

### 4.3 Carousel Rows

Horizontal drag-scroll collections with CSS scroll-snap:

**Smart rows (AI-curated, personalized over time)**:
- Continue Working — recently opened/edited, ranked by likely next action
- Hot Across Ventures — trending by access velocity
- Recently Generated by AI — images, reports, summaries from Claude/Gemini
- Needs Your Attention — shared with you, pending reviews, stale drafts
- Weekly Digest — AI-compiled highlights from past 7 days

**Venture rows**: One per active venture, using venture accent color
**Type rows**: Recordings & Meetings, Data & Analytics, Presentations & Decks

Features: fade gradients at edges, arrow buttons on hover (desktop), touch drag (mobile), stagger-in animation

### 4.4 Personalization Engine

Rows adapt based on usage signals:
- Access patterns reorder rows by frequency
- Time-of-day: morning shows "Daily Brief", evening shows "Wrap Up"
- Venture focus: active venture row rises to top
- Stale detection: 30+ day untouched files get demoted
- Stored in `storage_signals` table

### 4.5 Multi-User / Exec Access

- Same discovery UI, data scoped by permissions
- Shared collections: curated rows pinned by admins
- "Shared with me" row for cross-user content
- Role-based: execs see summaries, operators see raw files

---

## 5. Premium UI Component System

### 5.1 Design Language (Ported from FutureState)

All components use MCV Desktop CSS variables from `design-system.css`. FutureState patterns adopted:
- Glassmorphic cards with backdrop blur + semi-transparent backgrounds
- Gradient top-border decoration on major cards
- Stagger-in animations on lists/grids
- Hover-lift micro-interactions (y: -4px)
- Tap-scale feedback (scale: 0.97)
- Monospace text for data/codes
- Semantic color coding: cyan=action, green=positive, amber=caution, red=negative, purple=secondary
- Spring transitions (stiffness: 300, damping: 20 for playful; 200/40 for smooth)

### 5.2 New Components

**CinemaCard** — Netflix tile, reusable everywhere
- Thumbnail (16:9), gradient overlay, provider badge, venture color stripe
- Title (truncated), meta line (muted, monospace), AI tag pills (max 3)
- Hover: scale 1.05, glow border. Active: scale 0.98. Focus: cyan ring
- Props: `thumbnail, title, meta, tags[], provider, ventureId, onClick, onContextMenu, draggable`

**CarouselRow** — Horizontal scroll collection
- Section title with icon, "See All" link
- CSS scroll-snap, fade gradients at edges, arrow buttons on hover
- Stagger-in animation (FutureState StaggerContainer pattern)
- Props: `title, icon, accentColor, items[], onSeeAll, cardSize: 'sm' | 'md' | 'lg'`

**HeroSpotlight** — Full-width cinematic banner
- Background image with parallax (mouse ±10px), gradient overlay
- Venture badge, gradient-text title, subtitle, AI summary
- Action buttons: Open, Share, AI Brief
- Crossfade 600ms between items, dot indicators

**FilePreviewPanel** — Slide-in detail view
- Slides from right (spring: 300/30), semi-transparent backdrop
- Full preview render, filename, type/size, provider/path
- Tags section, AI Analysis section, Activity Log (audit entries)
- Actions: Open, Download, Move, Delete, Certify On-Chain

**StorageProviderBadge** — Provider identity pill
- Icon + name, provider-specific color. Compact mode: icon only
- Colors: Supabase=#3ECF8E, Local=#F59E0B, GDrive=#4285F4, Vercel=#FFFFFF, R2=#F6821F, GCP=#4285F4

**FileTreeSidebar** — OS-style folder navigation
- Provider roots (collapsible), nested folders, file items
- Active folder: cyan left-border + elevated bg
- Right-click context menu, drag target for moves

**StageProgressBar** — Workflow stage indicator
- Stages: concept > in-progress > review > approved > published
- Filled circles (cyan) for completed, pulse glow for current, muted for upcoming
- Gradient progress fill bar

**StatusBadge** — File status pill
- DRAFT=amber dashed, ACTIVE=cyan solid, REVIEW=purple pulse, APPROVED=green check
- ARCHIVED=grey muted, TRASH=red strikethrough, LOCKED=gold lock, NFT CERT=gradient chain

### 5.3 Animation System

```typescript
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}
const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
}
const hoverLift = { whileHover: { y: -4, transition: { duration: 0.2 } } }
const tapScale = { whileTap: { scale: 0.97, transition: { duration: 0.1 } } }
const slideInRight = {
  hidden: { x: '100%', opacity: 0 },
  show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
}
```

### 5.4 Design Token Additions

```css
/* Card enhancements */
--card-gradient-opacity: 0.05;
--card-glow-radius: 20px;
--card-hover-lift: -4px;
--card-border-gradient: linear-gradient(to right, transparent, var(--cyan), transparent);

/* Cinema/Discovery layer */
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

### 5.5 Component Hierarchy

```
FilesView
├── PageHeader (title, mode toggle: Browse | Discover)
├── [Browse Mode]
│   ├── Tabs (Browser | Media Library | All Sources)
│   ├── BrowserTab
│   │   ├── FileTreeSidebar
│   │   ├── BreadcrumbBar (with StorageProviderBadge)
│   │   ├── FileGrid / FileList (toggle)
│   │   │   └── FileRow / FileCard (with StatusBadge, StageProgressBar)
│   │   └── FilePreviewPanel (slide-in)
│   ├── MediaLibraryTab
│   │   ├── TypeFilterBar
│   │   ├── MasonryGrid
│   │   │   └── CinemaCard (thumbnail-focused)
│   │   └── FilePreviewPanel
│   └── AllSourcesTab
│       ├── SearchBar (AI semantic search)
│       ├── ActivityTimeline
│       └── FilterSidebar (venture, provider, type, date)
├── [Discover Mode]
│   ├── HeroSpotlight (auto-rotating)
│   ├── CarouselRow ("Continue Working")
│   ├── CarouselRow ("Hot Across Ventures")
│   ├── CarouselRow ("Recently Generated by AI")
│   ├── CarouselRow ("Needs Your Attention")
│   ├── CarouselRow (per-venture, dynamic)
│   └── CarouselRow (per-type, dynamic)
└── ContextMenu (shared, right-click actions)

VentureWorkspaceView
├── PageHeader (venture name + icon)
├── CategoryCards (KPI-style: Docs, Assets, Data, Media, Exports)
├── RecentFilesList
├── QuickActions (venture-contextual)
└── FilePreviewPanel
```

---

## 6. AI Integration Layer

### 6.1 Dual-Brain Architecture

- **Claude**: reasoning, writing, analysis, decisions, file management via chat
- **Gemini**: vision (image analysis, OCR), long-context (>100k docs), image generation (Imagen 3.0)
- AI Router in orchestrator decides which brain handles each request

### 6.2 AI Processing Pipeline

Runs async after every file upload/ingest:

```typescript
interface AIProcessingPipeline {
  analyze(file: StorageItem): Promise<AIAnalysis>
  generateThumbnail(file: StorageItem): Promise<string>
  extractText(file: StorageItem): Promise<string>
  suggestTags(file: StorageItem): Promise<string[]>
  classifyVenture(file: StorageItem): Promise<string[]>
  generateSummary(file: StorageItem): Promise<string>
}
```

Routing by type:
- Images → Gemini Vision (describe, OCR, objects, tags)
- Documents → Claude (topics, entities, venture relevance, action items)
- Audio/Video → Deepgram STT → Claude summary + tags
- Data files → Claude (schema analysis, column descriptions, quality flags)
- Code → Claude (language, framework, purpose, dependencies)

Tags stored in `storage_files.ai_tags[]`.

### 6.3 Semantic Search Pipeline

```
User query → Text match (fast) → Metadata match → Content match → Claude re-rank → Ranked results
```

Claude interprets intent: "that revenue model Devon shared last week" → `created_by: devon` + date range + content type. Google RAG provides deep document understanding when needed.

### 6.4 Generative Media

Modal accessible from Media Library, Venture Workspace, and chat:
- Images: Gemini Imagen 3.0 with venture-specific style presets
- Documents: Claude generates reports, briefs, summaries, proposals
- Audio: ElevenLabs TTS for voice content
- Video: placeholder for Gemini Veo (future)
- Venture style presets: WarForge=dark fantasy, FutureState=institutional fintech, BetEdge=sports analytics
- Generated media auto-saved to venture workspace, auto-tagged

### 6.5 Executive Brief

One-click executive summary via AI Brief button:
- Claude (or Gemini for >100k docs) reads full content
- Outputs: TL;DR, Key Numbers, Action Items, Risk Flags
- Action items pushable to Tasks view
- Brief saved as file metadata, regenerable with different focus (financial, legal, technical)
- RAG-enhanced: pulls context from related files across the venture corpus

### 6.6 Conversational File Management

Via existing kit system, Claude manages files from AegisChat:
- Natural language commands: "Move all WarForge concept art to approved-assets"
- Human-in-the-loop for destructive actions (move, delete, bulk ops)
- Uses storage kit tools via orchestrator

### 6.7 Storage AI Kit

```typescript
// storage-ai-kit.ts
manifest: {
  id: 'storage-ai',
  name: 'Storage AI',
  tools: [
    { name: 'analyze_file' },
    { name: 'generate_media' },
    { name: 'search_semantic' },
    { name: 'generate_brief' },
    { name: 'auto_tag' },
    { name: 'suggest_actions' },
    { name: 'batch_organize' },
  ],
  capabilities: ['llm', 'storage', 'network'],
  ventureScope: '*'
}
```

---

## 7. Google RAG + File Search

### 7.1 Google RAG Kit

```typescript
// google-rag-kit.ts
tools: [
  { name: 'google_file_search',    description: 'Semantic search across Google Drive' },
  { name: 'google_rag_retrieve',   description: 'Grounded retrieval from RAG corpus' },
  { name: 'google_rag_create_corpus', description: 'Create RAG corpus from files' },
]
```

### 7.2 Venture-to-Corpus Mapping

```
MCV Global Corpus        ← all cross-venture docs
├── FutureState Corpus   ← investor decks, property docs, legal
├── WarForge Corpus      ← game design, lore, asset manifests
├── BetEdge Corpus       ← sports models, odds, analytics
├── EdgeIQ Corpus        ← trading strategies, market research
├── ARQ Labs Corpus      ← research papers, experiments
├── mcv.gg Corpus        ← community content, Web3 docs
└── Executive Corpus     ← board docs, strategy, financials (restricted)
```

Auto-indexing: files uploaded to venture workspace automatically indexed into that venture's corpus.

### 7.3 RAG-Powered UI Features

- "Ask about this file" in FilePreviewPanel → opens chat grounded via RAG
- Cross-file Q&A in All Sources → retrieves from multiple docs, Claude synthesizes
- Auto-brief generation pulls context from related files via RAG
- Smart suggestions: "Based on this contract, also review [related document]"

### 7.4 API Routes

```
api/google-rag.ts     ← corpus CRUD, retrieve, search
api/google-files.ts   ← extend existing for File Search API
api/google-cache.ts   ← existing, context caching for large docs
```

---

## 8. File Lifecycle System

### 8.1 Status State Machine

```
CREATE/UPLOAD → DRAFT → ACTIVE → ARCHIVED → TRASH → PERMANENT DELETE (30d auto)
                  ↓        ↓        ↓         ↑
               REVIEW → APPROVED   restore ───┘
                           ↓
                        LOCKED (admin lock, legal hold, NFT-certified)
```

### 8.2 Types

```typescript
type FileStatus = 'draft' | 'active' | 'review' | 'approved' | 'archived' | 'trash' | 'locked'

type FileStage = 'concept' | 'in-progress' | 'review' | 'approved' | 'published' | 'superseded'

type FileVisibility = 'private' | 'venture' | 'internal' | 'shared' | 'public'

type FileCertification = 'none' | 'verified' | 'signed' | 'nft-certified' | 'legal-hold'
```

### 8.3 Compartmentalization

Files exist in multiple contexts without duplication:

```typescript
interface FileCompartment {
  fileId: string
  ventureId: string
  compartment: string        // 'legal' | 'brand' | 'engineering' | 'executive' | custom
  accessLevel: FileVisibility
  tags: string[]
  pinnedPosition?: number
}
```

One file, many compartments. Underlying file stored once; compartments are metadata references.

### 8.4 Trash System

- Cross-provider: trashing sets metadata status to `trash` + `trash_expires_at`
- 30-day auto-delete countdown
- Restore returns to previous state
- "Delete Now" for immediate permanent deletion
- Grouped by time period in Trash UI (Today, Last 7 Days, Older)

### 8.5 Version History

Every edit creates an immutable version snapshot. Versions stored per-provider alongside the file. Version restore creates a new version (non-destructive).

---

## 9. Audit Log System

### 9.1 Audit Entry

```typescript
interface AuditEntry {
  id: string
  timestamp: Date
  userId: string
  fileId: string
  action: AuditAction
  details: Record<string, any>
  provider: string
  ventureId?: string
  ipAddress?: string
  userAgent?: string
  previousState?: Partial<StorageFile>
}

type AuditAction =
  | 'create' | 'upload' | 'read' | 'download'
  | 'edit' | 'rename' | 'move' | 'copy'
  | 'trash' | 'restore' | 'delete_permanent'
  | 'status_change' | 'stage_change' | 'visibility_change'
  | 'share' | 'unshare' | 'compartment_add' | 'compartment_remove'
  | 'tag_add' | 'tag_remove' | 'ai_analyze' | 'ai_generate'
  | 'lock' | 'unlock' | 'nft_certify' | 'legal_hold'
  | 'version_create' | 'version_restore'
  | 'rag_index' | 'rag_query'
```

### 9.2 UI

- Inline activity log in FilePreviewPanel (recent 5 entries)
- Full Audit view link with filters, date range, export to CSV, search
- Color-coded action icons in timeline format

---

## 10. NFT Certification / Blockchain Verification

### 10.1 Certification Flow

1. User clicks "Certify On-Chain" on approved/locked file
2. System generates SHA-256 hash of file content
3. Mints Solana NFT via Anchor program with content hash in metadata
4. Arweave permanent storage of certified snapshot
5. NFT mint address stored in `storage_files.certification_json`
6. File auto-locked — cannot modify without creating new version

### 10.2 Data Model

```typescript
interface NFTCertification {
  fileId: string
  mintAddress: string
  metadataUri: string           // Arweave/IPFS
  contentHash: string           // SHA-256
  certifiedAt: Date
  certifiedBy: string
  chainVerified: boolean
  collectionAddress?: string    // grouped certifications
  attributes: {
    document_type: string       // 'contract' | 'agreement' | 'certificate' | 'asset'
    venture: string
    parties?: string[]
    effective_date?: string
    expiration_date?: string
  }
}
```

### 10.3 Verification UI

- Status: Verified On-Chain (with green checks)
- Content hash display with copy
- Solana NFT mint with Solscan link
- Integrity check: file hash matches on-chain hash
- Actions: Verify Again, Transfer NFT, View History

---

## 11. Database Schema

### 11.1 Core Tables

```sql
-- Unified file metadata index (all providers)
storage_files (
  id uuid PK DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  path text NOT NULL,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  venture_id text,
  tags text[] DEFAULT '{}',
  ai_tags text[] DEFAULT '{}',
  ai_summary text,
  thumbnail_url text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  accessed_at timestamptz DEFAULT now(),
  parent_id uuid REFERENCES storage_files(id),
  is_folder boolean DEFAULT false,
  metadata_json jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  stage text DEFAULT 'concept',
  visibility text DEFAULT 'private',
  certification_json jsonb,
  trash_expires_at timestamptz,
  locked_by text,
  locked_at timestamptz,
  version_count int DEFAULT 1,
  content_hash text
);

-- File compartments (many-to-many venture/context scoping)
storage_compartments (
  id uuid PK DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,
  venture_id text NOT NULL,
  compartment text NOT NULL,
  access_level text DEFAULT 'venture',
  tags text[] DEFAULT '{}',
  pinned_position int,
  created_at timestamptz DEFAULT now()
);

-- File version history
storage_versions (
  id uuid PK DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  provider text NOT NULL,
  path text NOT NULL,
  size_bytes bigint,
  content_hash text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  change_summary text
);

-- AI analysis cache
storage_ai_analysis (
  id uuid PK DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  result_json jsonb NOT NULL,
  model_used text,
  tokens_used int,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- User interaction signals (personalization)
storage_signals (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  file_id uuid REFERENCES storage_files(id) ON DELETE SET NULL,
  action text NOT NULL,
  venture_id text,
  duration_ms int,
  context text,
  created_at timestamptz DEFAULT now()
);

-- Generated media tracking
storage_generations (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  venture_id text,
  prompt text NOT NULL,
  model_used text NOT NULL,
  generation_type text NOT NULL,
  result_file_id uuid REFERENCES storage_files(id),
  style_preset text,
  tokens_used int,
  created_at timestamptz DEFAULT now()
);

-- Full audit log
storage_audit_log (
  id uuid PK DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  file_id uuid REFERENCES storage_files(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  provider text,
  venture_id text,
  ip_address inet,
  previous_state jsonb,
  created_at timestamptz DEFAULT now()
);
-- Indexes: (file_id, timestamp), (user_id, timestamp), (venture_id, timestamp), (action)

-- RAG corpora
storage_rag_corpora (
  id uuid PK DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  venture_id text,
  google_corpus_id text,
  file_count int DEFAULT 0,
  last_indexed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

## 12. New Files to Create

```
src/lib/storage/
├── types.ts                    # StorageProvider, StorageItem, all interfaces
├── orchestrator.ts             # Storage routing, cross-provider ops
├── providers/
│   ├── supabase.ts             # Supabase Storage adapter
│   ├── local.ts                # Local FS adapter (F:\MCV-Desktop-SA\)
│   ├── gdrive.ts               # Google Drive adapter
│   ├── vercel-blob.ts          # Vercel Blob adapter
│   ├── cloudflare-r2.ts        # Cloudflare R2 adapter
│   └── gcp.ts                  # GCP Cloud Storage adapter
├── ai-pipeline.ts              # AI processing pipeline (auto-tag, analyze, thumbnail)
├── search.ts                   # Semantic search pipeline
└── audit.ts                    # Audit log helpers

src/lib/kits/builtin/
├── storage-supabase-kit.ts
├── storage-local-kit.ts
├── storage-gdrive-kit.ts
├── storage-vercel-kit.ts
├── storage-r2-kit.ts
├── storage-gcp-kit.ts
├── storage-ai-kit.ts
├── storage-meta-kit.ts
└── google-rag-kit.ts

src/stores/
└── files.ts                    # File manager Zustand store

src/views/
├── FilesView.tsx               # Global Files view (Browser + Media Library + All Sources)
└── VentureWorkspaceView.tsx    # Venture-scoped workspace

src/components/files/
├── FileTreeSidebar.tsx
├── BreadcrumbBar.tsx
├── FileGrid.tsx
├── FileList.tsx
├── FileRow.tsx
├── FileCard.tsx
├── FilePreviewPanel.tsx
├── MediaMasonryGrid.tsx
├── AllSourcesTimeline.tsx
├── TypeFilterBar.tsx
├── FileContextMenu.tsx
├── StatusBadge.tsx
├── StageProgressBar.tsx
├── TrashView.tsx
├── AuditLogView.tsx
├── GenerateMediaModal.tsx
├── ExecutiveBriefPanel.tsx
├── NFTCertificationPanel.tsx
└── FileUploadModal.tsx

src/components/cinema/
├── HeroSpotlight.tsx
├── CarouselRow.tsx
├── CinemaCard.tsx
└── DiscoverView.tsx

src/components/ui/
└── StorageProviderBadge.tsx

src/hooks/
├── use-files.ts                # React Query hooks for file operations
├── use-storage.ts              # Storage provider management
└── use-rag.ts                  # RAG corpus queries

api/
├── storage.ts                  # extend existing — CRUD operations
├── storage-upload.ts           # file upload endpoint
├── storage-local.ts            # local FS proxy (server-side)
├── google-rag.ts               # RAG corpus management
└── storage-audit.ts            # audit log queries

src/styles/
└── files.css                   # File manager + cinema layer styles
```

---

## 13. Dependencies to Add

```
framer-motion          # animations (stagger, spring, hover-lift)
@solana/web3.js        # NFT certification
@coral-xyz/anchor      # Solana program interaction
arweave                # permanent storage for certified docs
react-virtuoso         # virtualized lists for large file sets
@dnd-kit/core          # drag-and-drop for file management
@dnd-kit/sortable      # sortable file grids
react-dropzone         # file upload dropzone
```

---

## 14. Out of Scope (Future)

- API Update Agent (separate spec — auto-watches provider API changes)
- Integrations Hub expansion (Stripe, Plaid, etc. — separate spec)
- Shared `@mcv/ui` component package extraction (milestone B)
- Video generation via Gemini Veo
- Real-time collaborative editing
- Mobile-native file manager (Capacitor)
