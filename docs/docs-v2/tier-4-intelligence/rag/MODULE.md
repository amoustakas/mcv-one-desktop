# @mcv/rag — Retrieval-Augmented Generation Module

**Package:** @mcv/rag (top-level package)  
**Tier:** 4 (Intelligence Layer — Extension)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `@mcv/rag` package provides enterprise-grade Retrieval-Augmented Generation for the MCV.ONE ecosystem. It manages document ingestion into isolated knowledge stores backed by Google GenAI File Search, performs semantic retrieval with LLM-based cross-encoder reranking, synthesizes grounded answers with citations, and tracks every query for analytics and cost attribution. The module integrates with the LLM Gateway for budget enforcement and rate limiting, ensuring AI responses are factual, verifiable, and grounded in venture-specific knowledge rather than relying solely on model training data.

**This module turns static documents into queryable intelligence that any MCV agent can access.**

Key capabilities:

- **Multi-tenant store isolation** — Each venture gets its own knowledge stores with configurable access controls
- **Google GenAI File Search** — Documents indexed into Google's managed vector store with semantic chunking
- **Deep RAG** — Recursive multi-hop retrieval with LLM-powered gap detection for complex queries
- **Semantic reranking** — LLM-based cross-encoder scoring with MMR diversity and Vertex AI fallback
- **Gateway integration** — Budget-aware synthesis with per-venture rate limiting via `@mcv/gateway`
- **NAOS tool** — First-class `query_knowledge_base` tool for NAOS agents (Queen, Ralph, etc.)
- **Real-time progress** — WebSocket-based progress events for uploads, indexing, and queries
- **Document sync** — Bidirectional state reconciliation between Google File Search and database
- **Full audit trail** — Every operation logged with actor, action, resource, and outcome

---

## Exports

```
@mcv/rag           → Types + Constants (safe everywhere)
@mcv/rag/client    → React hooks (client-side only)
@mcv/rag/server    → Services, GenAI client, NAOS tool (server-side only)
```

### Root Exports (`@mcv/rag`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (safe to import anywhere)
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Store types
  DataClassification,             // 'public' | 'internal' | 'confidential'
  ChunkingStrategy,               // 'semantic' | 'fixed'
  StoreConfig,                    // Config for creating stores
  StoreStats,                     // Store statistics
  StoreWithStats,                 // Enriched store with stats + config
  StoreListOptions,               // Filters for listing stores

  // File types
  FileStatus,                     // 'pending' | 'processing' | 'indexed' | 'failed'
  DocumentType,                   // 'prd' | 'spec' | 'policy' | 'kb' | 'guide' | etc.
  FileMetadata,                   // Document metadata for enrichment
  UploadParams,                   // Single file upload parameters
  BulkUploadParams,               // Batch upload parameters
  BulkUploadResult,               // Batch upload result summary
  FileRecord,                     // Database file record
  FileListOptions,                // Filters for listing files

  // Query types
  MetadataFilterOperator,         // 'eq' | 'neq' | 'contains' | 'gt' | etc.
  MetadataFilterCondition,        // Single filter condition
  MetadataFilterGroup,            // Compound AND/OR filter group
  MetadataFilter,                 // Union: condition | group
  DateRangeFilter,                // Temporal query filter
  QueryFilterOptions,             // Advanced query filter options
  QueryParams,                    // Basic RAG query parameters
  RetrievedChunk,                 // Retrieved text chunk with score
  QueryResult,                    // Chunks-only query result
  Citation,                       // Source citation reference
  SynthesizedResult,              // Answer + citations + confidence
  QueryWithSynthesisParams,       // Query with LLM synthesis parameters
  RerankOptions,                  // Semantic reranking options
  RankedChunk,                    // Chunk with rerank score + rank delta
  RerankResult,                   // Reranking operation result
  ChunkScore,                     // Individual chunk scoring result

  // Deep RAG types
  DeepQueryParams,                // Recursive multi-hop query parameters
  QueryNode,                      // Node in the recursive query tree
  DeepQueryResult,                // Deep RAG result with query tree
  GapDetectionResult,             // Gap analysis result
  RerankConfig,                   // Reranking configuration

  // Cost types
  CostOperation,                  // 'index' | 'query' | 'rerank' | 'synthesis'
  TrackCostParams,                // Cost tracking parameters
  CostSummary,                    // Cost summary with per-store breakdown
  CostTrendPoint,                 // Monthly cost data point
  CostReportParams,               // Cost report parameters
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS (safe to import anywhere)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // MIME type handling
  SUPPORTED_MIME_TYPES,           // 17 supported MIME types
  MIME_TYPE_EXTENSIONS,           // MIME → file extension mapping
  EXTENSION_TO_MIME,              // Extension → MIME mapping
  MAX_FILE_SIZE_BYTES,            // 50MB max file size
  isSupportedMimeType,            // Type guard function
  getMimeTypeFromExtension,       // Extension lookup helper
  validateFile,                   // File validation utility

  // Default configurations
  DEFAULT_STORE_CONFIG,           // Store defaults (2GB, 256 tokens, semantic)
  DEFAULT_QUERY_CONFIG,           // Query defaults (50 chunks, 1h cache)
  DEFAULT_DEEP_RAG_CONFIG,        // Deep RAG defaults (depth 3, gap 0.7)
  DEFAULT_RERANK_CONFIG,          // Reranking defaults (topK 10, batch 5)

  // Pricing
  INDEXING_COST_PER_1M_TOKENS,   // $0.15 per 1M tokens
  QUERY_COST_PER_1M_TOKENS,      // $0 (free retrieval)

  // Operational limits
  INDEXING_POLL_CONFIG,           // 2s interval, 60 attempts, 120s timeout
  RATE_LIMITS,                    // 20 uploads/min, 100 queries/min
  CONCURRENCY_LIMITS,             // 5 uploads, 10 queries, 3 gap queries
} from './constants';

export type { SupportedMimeType } from './constants';
```

### Server Exports (`@mcv/rag/server`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// GENAI CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getGenAIClient,                 // Get singleton GoogleGenAI instance
  setGenAIClient,                 // Inject mock client for testing
  resetGenAIClient,               // Reset singleton (key rotation)
  isGenAIConfigured,              // Check GOOGLE_GENAI_API_KEY availability
} from './genai-client';

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SERVICES (class + singleton)
// ═══════════════════════════════════════════════════════════════════════════════

export { StoreRegistry, storeRegistry } from './services';
export { DocumentIngestionPipeline, documentIngestion } from './services';
export { FileSearchManager, fileSearchManager } from './services';
export { DeepRagService, deepRagService } from './services';
export { CostTracker, costTracker } from './services';
export { SemanticRanker, semanticRanker } from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// GATEWAY INTEGRATION (budget + rate limiting)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  GatewayIntegration, gatewayIntegration, getGatewayIntegration,
  SynthesisBudgetExceededError,
  SynthesisRateLimitError,
  isSynthesisBudgetExceededError,
  isSynthesisRateLimitError,
  type SynthesisBudgetCheckParams,
  type SynthesisBudgetCheckResult,
  type ExecuteSynthesisParams,
  type SynthesisExecutionResult,
  type RemainingBudgetInfo,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// METADATA FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MetadataFilterService, metadataFilter,
  type FilteredFilesResult,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// CACHING (Redis + in-memory)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createQueryCache, queryCache,
  InMemoryCache, RedisCache,
  type QueryCache, type CacheStats,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS (RBAC)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  RagPermissionsGuard, ragPermissions,
  PermissionDeniedError,
  RAG_RESOURCES, RAG_ACTIONS, RAG_PERMISSIONS,
  type RagResource, type RagAction,
  type PermissionContext, type PermissionCheckResult, type CheckOptions,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  RagAuditLogger, ragAuditLogger,
  RAG_AUDIT_CATEGORIES, RAG_AUDIT_ACTIONS,
  type RagAuditCategory, type RagAuditAction,
  type AuditActor, type AuditResource, type RagAuditEntry,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT STORES (8 core stores per SPEC-004)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DEFAULT_STORES,                  // 8 core store definitions
  initializeDefaultStores,         // Idempotent store creation
  getDefaultStoreConfig,
  getSharedStores,
  getVentureStores,
  calculateTotalEstimatedStorage,
  type DefaultStoreConfig, type InitializeResult,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT SYNC (Google ↔ Database reconciliation)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DocumentSyncService, documentSync,
  type GoogleDocumentState, type GoogleDocumentInfo,
  type DocumentSyncResult, type StoreSyncResult,
  type OrphanFile, type OrphanReconcileResult,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// VERTEX AI RANKER (alternative to LLM-based reranking)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VertexRanker, vertexRanker,
  type VertexRankOptions, type VertexRankingModel,
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME PROGRESS EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  RagProgressEvents, ragProgressEvents, RagChannels,
  type RagBaseEvent, type RagEventType, type RagEvent,
  type RagEventPayloadMap, type RagEventHandler,
  type RagProgressEventsOptions,
  // 17 event payload types...
} from './services';

// ═══════════════════════════════════════════════════════════════════════════════
// NAOS TOOL (for agent integration)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  knowledgeBaseTool,              // NAOS-compatible tool definition
  knowledgeBaseQuerySchema,       // Zod schema for validation
  validateQueryParams,            // Parameter validation helper
  createKnowledgeQueryTool,       // Factory for simplified tool
  type KnowledgeBaseTool,
  type KnowledgeBaseQueryParams,
  type KnowledgeBaseQueryResult,
  type ToolCitation,
  type ToolExecutionContext,
} from './naos-tool';
```

### Client Exports (`@mcv/rag/client`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export {
  RagProvider,                     // React context provider
  useRagContext,                   // Access venture context
  useRagTrpc,                     // Access tRPC client
  useHasRagTrpc,                  // Check if provider is configured
  type RagTrpcClient,
  type RagContextValue,
  type RagProviderProps,
} from './context/rag-context';

// ═══════════════════════════════════════════════════════════════════════════════
// STORE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  storeKeys,                       // TanStack Query key factory
  useStores,                       // List accessible stores
  useStore,                        // Get single store by ID
  useCreateStore,                  // Mutation: create store
  useUpdateStore,                  // Mutation: update store config
  useDeleteStore,                  // Mutation: delete store
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════════
// FILE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  fileKeys,                        // TanStack Query key factory
  useFiles,                        // List files in a store
  useFile,                         // Get file status (auto-polls processing)
  useUploadFile,                   // Mutation: upload single file
  useUploadFiles,                  // Mutation: upload multiple files
  useDeleteFile,                   // Mutation: delete file
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  useRagQuery,                     // Basic RAG query (chunks only)
  useRagQueryWithSynthesis,        // RAG query with answer synthesis
  useDeepRagQuery,                 // Deep RAG recursive query
  useAskKnowledgeBase,             // Convenience: ask with synthesis
  useResearchQuery,                // Convenience: deep research
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  metricsKeys,                     // TanStack Query key factory
  useRagCosts,                     // Cost summary for date range
  useRagCostTrend,                 // Monthly cost trend
  useCurrentRagSpend,              // Current month spend
  useCurrentMonthCosts,            // Current month cost breakdown
  useLast30DaysCosts,              // Last 30 days cost breakdown
} from './hooks';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/rag  MODULE ARCHITECTURE                            │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ENTRY POINTS                                       │  │
│  │                                                                             │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  tRPC API   │  │ NAOS Agents  │  │  Admin UI    │  │  Cron Jobs   │    │  │
│  │  │  Routes     │  │ Queen/Ralph  │  │  React Hooks │  │  Doc Sync    │    │  │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │  │
│  │         │                │                  │                  │            │  │
│  │         └────────────────┴──────────────────┴──────────────────┘            │  │
│  │                                  │                                          │  │
│  └──────────────────────────────────┼──────────────────────────────────────────┘  │
│                                     │                                             │
│  ┌──────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                         QUERY PIPELINE                                      │  │
│  │                                                                             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐          │  │
│  │  │   1.       │  │   2.       │  │   3.       │  │   4.        │          │  │
│  │  │ Validate   │─▶│ Retrieve   │─▶│ Rerank     │─▶│ Synthesize  │          │  │
│  │  │ & Auth     │  │ Chunks     │  │ & Filter   │  │ Answer      │          │  │
│  │  │            │  │            │  │            │  │             │          │  │
│  │  │• Venture   │  │• Google    │  │• Semantic  │  │• Gateway    │          │  │
│  │  │  ACL check │  │  GenAI     │  │  Ranker    │  │  budget     │          │  │
│  │  │• Permission│  │  File      │  │• Vertex AI │  │• LLM call   │          │  │
│  │  │  guard     │  │  Search    │  │  fallback  │  │• Citations  │          │  │
│  │  │• Store     │  │• Metadata  │  │• MMR       │  │• Confidence │          │  │
│  │  │  resolution│  │  pre-filter│  │  diversity │  │  scoring    │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────┬──────┘          │  │
│  │                                                          │                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────▼──────┐          │  │
│  │  │   8.       │  │   7.       │  │   6.       │  │   5.        │          │  │
│  │  │ Audit Log  │◀─│ Track Cost │◀─│ Cache      │◀─│ Log Query   │          │  │
│  │  │            │  │            │  │ Response   │  │             │          │  │
│  │  │• Actor     │  │• Tokens    │  │• Redis or  │  │• Store IDs  │          │  │
│  │  │• Action    │  │• Per-store │  │  in-memory │  │• Latency    │          │  │
│  │  │• Outcome   │  │• Per-op    │  │• TTL 1h    │  │• Chunks     │          │  │
│  │  │• Metadata  │  │• USD       │  │• LRU 1000  │  │• Tokens     │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └─────────────┘          │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                      DEEP RAG PIPELINE                                      │  │
│  │                                                                             │  │
│  │  Query ──▶ Retrieve ──▶ Rerank ──▶ Gap Detection ──┐                       │  │
│  │                                    (LLM analysis)   │                       │  │
│  │                                                     ▼                       │  │
│  │                           coverage < 0.7? ──── YES ──▶ Generate sub-queries │  │
│  │                                │                         │                  │  │
│  │                               NO                         ▼                  │  │
│  │                                │              Recurse (parallel, max 3)     │  │
│  │                                ▼                         │                  │  │
│  │                    Synthesize final answer ◀──────────────┘                  │  │
│  │                    (all chunks, [N] citations)                               │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                     INGESTION PIPELINE                                      │  │
│  │                                                                             │  │
│  │  Upload ──▶ Validate ──▶ Create DB ──▶ Google GenAI ──▶ Poll ──▶ Update    │  │
│  │  (Buffer/  (MIME,       record       File Search      operation  metrics    │  │
│  │   Blob)    size ≤50MB,  (processing)  Store upload     (.done?)  + cost    │  │
│  │            venture)                   + chunking                            │  │
│  │                                                                             │  │
│  │  Bulk: p-limit(5 concurrent) ──▶ parallel ingestion ──▶ aggregated result  │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                       DATABASE LAYER                                        │  │
│  │                                                                             │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐           │  │
│  │  │file_search_stores│ │file_search_files │ │ rag_query_logs   │           │  │
│  │  │                  │ │                  │ │                  │           │  │
│  │  │ Store config,    │ │ Individual docs, │ │ Every query with │           │  │
│  │  │ chunking, ACLs,  │ │ status tracking, │ │ results, latency │           │  │
│  │  │ metrics, venture │ │ metadata, tags   │ │ cost, citations  │           │  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘           │  │
│  │                                                                             │  │
│  │  ┌──────────────────┐ ┌──────────────────┐                                │  │
│  │  │file_search_costs │ │ rag_audit_logs   │                                │  │
│  │  │                  │ │                  │                                │  │
│  │  │ Per-operation    │ │ Compliance audit │                                │  │
│  │  │ cost tracking    │ │ trail for all    │                                │  │
│  │  │ & attribution    │ │ RAG operations   │                                │  │
│  │  └──────────────────┘ └──────────────────┘                                │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                     EXTERNAL SERVICES                                       │  │
│  │                                                                             │  │
│  │  Google GenAI File Search  │  @mcv/gateway (synthesis)  │  Redis (cache)   │  │
│  │  @google/genai SDK         │  BudgetManager + RateLimiter│  @upstash/redis  │  │
│  │                            │                             │                  │  │
│  │  Vertex AI Discovery Engine│  @mcv/secrets (API keys)    │  @mcv/realtime   │  │
│  │  (alternative ranker)      │  SecretManagerService       │  (WebSocket)     │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Type Definitions

### Store Types

```typescript
/** Data classification levels for access control */
type DataClassification = 'public' | 'internal' | 'confidential';

/** Chunking strategy for document indexing */
type ChunkingStrategy = 'semantic' | 'fixed';

/** Configuration for creating a new store */
interface StoreConfig {
  displayName: string;                    // Human-readable name
  description?: string;                   // Optional description
  ventureId?: string;                     // Owner (null = shared store)
  isShared?: boolean;                     // Accessible to all ventures
  maxSizeBytes?: number;                  // Max storage (default: 2GB)
  chunkMaxTokens?: number;               // Tokens per chunk (default: 256)
  chunkOverlap?: number;                 // Overlap tokens (default: 64)
  chunkingStrategy?: ChunkingStrategy;    // Default: 'semantic'
  dataClassification?: DataClassification; // Default: 'internal'
  allowedVentures?: string[];             // Cross-venture access list
  requiredRoles?: string[];               // Required roles for access
}

/** Store statistics (denormalized for fast reads) */
interface StoreStats {
  totalFiles: number;
  totalTokens: number;
  totalSizeBytes: number;
  indexingCostUsd: number;
  pendingFiles: number;                   // Enriched from DB query
  failedFiles: number;                    // Enriched from DB query
}

/** Store with enriched statistics (returned by all store operations) */
interface StoreWithStats {
  id: string;                             // UUID primary key
  storeId: string;                        // Unique identifier (e.g., 'betedge-knowledge-v1')
  googleStoreName: string;                // Google's store reference
  displayName: string;
  description?: string;
  ventureId?: string;
  ventureName?: string;                   // Resolved from ventures table
  isShared: boolean;
  stats: StoreStats;
  config: {
    maxSizeBytes: number;
    chunkMaxTokens: number;
    chunkOverlap: number;
    chunkingStrategy: ChunkingStrategy;
    dataClassification: DataClassification;
    allowedVentures: string[];
    requiredRoles: string[];
  };
  createdAt: Date;
  lastIndexedAt?: Date;
  updatedAt: Date;
}

/** Store list filter options */
interface StoreListOptions {
  includeShared?: boolean;                // Default: true in list()
  dataClassification?: DataClassification;
  limit?: number;                         // Default: 100
  offset?: number;
}
```

### File Types

```typescript
/** File processing status lifecycle: pending → processing → indexed | failed */
type FileStatus = 'pending' | 'processing' | 'indexed' | 'failed';

/** Document type categories for filtering and organization */
type DocumentType =
  | 'prd'           // Product Requirements Document
  | 'spec'          // Technical Specification
  | 'policy'        // Policy Document
  | 'kb'            // Knowledge Base Article
  | 'guide'         // User Guide
  | 'api'           // API Documentation
  | 'code'          // Code / Source files
  | 'contract'      // Legal contracts
  | 'report'        // Reports and analytics
  | 'general';      // General Document

/** Metadata for document enrichment and filtering */
interface FileMetadata {
  documentType?: DocumentType;
  tags?: string[];
  customMetadata?: Record<string, string>;
}

/** Parameters for uploading a single file */
interface UploadParams {
  storeId: string;                        // Target store storeId
  file: Buffer | Blob;                    // File content
  filename: string;                       // Original filename
  mimeType: string;                       // MIME type (validated against SUPPORTED_MIME_TYPES)
  ventureId: string;                      // Owning venture
  metadata?: FileMetadata;
}

/** Parameters for bulk file upload */
interface BulkUploadParams {
  storeId: string;
  ventureId: string;
  files: Array<{
    file: Buffer | Blob;
    filename: string;
    mimeType: string;
    metadata?: FileMetadata;
  }>;
  concurrency?: number;                   // Default: 5
}

/** Bulk upload result summary */
interface BulkUploadResult {
  uploaded: number;
  failed: number;
  totalTokens: number;
  totalCost: number;
  errors: Array<{ filename: string; error: string }>;
}

/** File record stored in database */
interface FileRecord {
  id: string;
  storeId: string;
  googleFileName: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  tokenCount?: number;
  ventureId: string;
  documentType?: DocumentType;
  tags: string[];
  customMetadata: Record<string, string>;
  status: FileStatus;
  errorMessage?: string;
  uploadedAt: Date;
  indexedAt?: Date;
}
```

### Query Types

```typescript
/** Metadata filter operators (12 supported) */
type MetadataFilterOperator =
  | 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'notIn' | 'exists' | 'notExists';

/** Single metadata filter condition */
interface MetadataFilterCondition {
  field: string;
  operator: MetadataFilterOperator;
  value: string | number | boolean | string[] | number[];
}

/** Compound filter with AND/OR logic */
interface MetadataFilterGroup {
  logic: 'and' | 'or';
  conditions: Array<MetadataFilterCondition | MetadataFilterGroup>;
}

/** Complete metadata filter (union type) */
type MetadataFilter = MetadataFilterCondition | MetadataFilterGroup;

/** Advanced filter options for RAG queries */
interface QueryFilterOptions {
  documentTypes?: DocumentType[];         // Filter by doc type(s)
  tags?: string[];                        // Any tag matches
  tagsAll?: string[];                     // All tags must match
  excludeTags?: string[];                 // Exclude these tags
  metadata?: MetadataFilter;              // Custom metadata filter
  dateRange?: DateRangeFilter;            // Temporal filter
  fileIds?: string[];                     // Include specific files
  excludeFileIds?: string[];              // Exclude specific files
  minRelevanceScore?: number;             // Score threshold (0-1)
}

/** Parameters for a basic RAG query */
interface QueryParams {
  query: string;                          // Natural language query
  storeIds: string[];                     // Store IDs to search
  ventureId: string;                      // Venture context
  userId?: string;                        // For logging
  agentType?: string;                     // For analytics
  maxChunks?: number;                     // Default: 50
  documentType?: DocumentType;            // Deprecated: use filters
  tags?: string[];                        // Deprecated: use filters
  filters?: QueryFilterOptions;           // Advanced filters
  useCache?: boolean;                     // Default: true
}

/** A chunk of text retrieved from the knowledge base */
interface RetrievedChunk {
  text: string;                           // Chunk text content
  source: string;                         // Source URI / identifier
  fileName: string;                       // Original file name
  relevanceScore?: number;                // Retrieval score (0-1)
  chunkIndex?: number;                    // Position in document
  metadata?: Record<string, unknown>;
}

/** Chunks-only query result */
interface QueryResult {
  chunks: RetrievedChunk[];
  totalChunks: number;
  latencyMs: number;
  cacheHit: boolean;
}

/** Citation reference in synthesized answer */
interface Citation {
  fileName: string;
  source: string;
  relevantText: string;                   // Excerpt (truncated to 200 chars)
  chunkIndex: number;
  relevanceScore?: number;
}

/** Result of query with LLM synthesis */
interface SynthesizedResult {
  answer: string;                         // Synthesized answer
  citations: Citation[];                  // Source citations
  confidence: number;                     // 0-1 confidence score
  chunksUsed: number;
  latencyMs: number;
  tokenUsage?: {
    queryTokens: number;
    synthesisTokens: number;
  };
}

/** Parameters for query with synthesis */
interface QueryWithSynthesisParams extends QueryParams {
  systemPrompt?: string;                  // Custom system prompt
  synthesisModel?: string;                // Default: gemini-2.0-flash
  temperature?: number;                   // Default: 0.7
  skipBudgetCheck?: boolean;              // For emergency ops
  skipRateLimitCheck?: boolean;
}
```

### Deep RAG Types

```typescript
/** Parameters for recursive multi-hop retrieval */
interface DeepQueryParams {
  query: string;
  storeIds: string[];
  ventureId: string;
  userId?: string;
  agentType?: string;
  maxDepth?: number;                      // Default: 3
  gapThreshold?: number;                  // Default: 0.7 (coverage threshold)
  maxGapsPerLevel?: number;               // Default: 3 sub-queries per level
  synthesisModel?: string;                // Default: gemini-2.0-flash
  temperature?: number;
  useGateway?: boolean;                   // Default: true
  skipBudgetCheck?: boolean;
  skipRateLimitCheck?: boolean;
}

/** Node in the recursive query tree */
interface QueryNode {
  query: string;
  chunks: RetrievedChunk[];
  gaps: string[];                         // Detected knowledge gaps
  depth: number;                          // 0 = root
  children: QueryNode[];                  // Sub-query results
  partialAnswer?: string;
  tokenUsage?: { retrievalTokens: number; synthesisTokens: number };
}

/** Complete Deep RAG result */
interface DeepQueryResult {
  answer: string;
  citations: Citation[];
  confidence: number;
  chunksUsed: number;
  latencyMs: number;
  queryTree: QueryNode;                   // Full tree for transparency
  totalQueries: number;                   // Total sub-queries executed
  depth: number;                          // Maximum depth reached
  tokenUsage: {
    retrievalTokens: number;
    synthesisTokens: number;
    totalTokens: number;
  };
  cost?: {
    retrievalCost: number;                // $0 (free retrieval)
    synthesisCost: number;
    totalCost: number;
  };
}

/** Gap detection result from LLM analysis */
interface GapDetectionResult {
  gaps: string[];                         // Follow-up query strings
  coverage: number;                       // 0-1 coverage score
  needsMoreRetrieval: boolean;            // coverage < threshold
}
```

### Semantic Reranking Types

```typescript
/** Options for semantic reranking */
interface RerankOptions {
  topK?: number;                          // Default: 10
  threshold?: number;                     // Min score (default: 0.0)
  model?: string;                         // Default: gemini-2.0-flash
  batchScoring?: boolean;                 // Default: true
  batchSize?: number;                     // Default: 5
  temperature?: number;                   // Default: 0.0 (deterministic)
  ventureId?: string;                     // For gateway billing
}

/** Chunk with rerank score and position tracking */
interface RankedChunk extends RetrievedChunk {
  rerankScore: number;                    // Cross-encoder score (0-1)
  originalRank: number;                   // Position before reranking
  rankDelta: number;                      // Positive = moved up
}

/** Reranking operation result */
interface RerankResult {
  chunks: RankedChunk[];
  totalProcessed: number;
  filteredCount: number;
  latencyMs: number;
  tokenUsage?: { promptTokens: number; completionTokens: number };
}
```

### Cost Types

```typescript
type CostOperation = 'index' | 'query' | 'rerank' | 'synthesis';

interface TrackCostParams {
  ventureId: string;
  storeId?: string;
  fileId?: string;
  operation: CostOperation;
  tokenCount: number;
  costUsd: number;
}

interface CostSummary {
  totalCost: number;
  indexingCost: number;
  queryCost: number;
  rerankCost: number;
  synthesisCost: number;
  totalTokens: number;
  byStore: Array<{ storeId: string; displayName: string; cost: number; tokens: number }>;
}

interface CostTrendPoint {
  month: string;                          // YYYY-MM format
  cost: number;
  tokens: number;
}
```

### NAOS Tool Types

```typescript
/** NAOS-compatible tool definition for knowledge base queries */
interface KnowledgeBaseTool {
  name: 'query_knowledge_base';
  description: string;                    // Multi-line LLM description
  parameters: ZodSchema;                  // knowledgeBaseQuerySchema
  execute: (params: KnowledgeBaseQueryParams, context: ToolExecutionContext) => Promise<KnowledgeBaseQueryResult>;
  metadata: {
    category: 'knowledge';
    recommendedAgents: ['queen', 'ralph', 'mnemosyne', 'oracle', 'researcher'];
    costTier: 'low';
    latencyRange: { min: 500; max: 5000; unit: 'ms' };
    readOnly: true;
    requiredPermissions: ['rag.query'];
    version: '1.0.0';
  };
}

/** Tool query parameters (validated by Zod) */
interface KnowledgeBaseQueryParams {
  query: string;                          // 1-2000 chars
  storeIds?: string[];                    // Optional: searches all accessible if omitted
  documentType?: DocumentType;
  tags?: string[];
  maxChunks?: number;                     // 1-50, default: 10
  deepQuery?: boolean;                    // Default: false
  maxDepth?: number;                      // 1-5, default: 2
  includeQueryTree?: boolean;             // Default: false
}

/** Tool execution context (provided by NAOS framework) */
interface ToolExecutionContext {
  ventureId: string;
  userId?: string;
  agentType?: string;
  taskId?: string;
  sessionId?: string;
}

/** Tool query result */
interface KnowledgeBaseQueryResult {
  success: boolean;
  answer: string;
  citations: ToolCitation[];
  confidence: number;
  chunksUsed: number;
  latencyMs: number;
  deepQueryUsed: boolean;
  totalQueries?: number;
  depth?: number;
  queryTree?: unknown;
  error?: string;
}
```

### Permission Types

```typescript
/** RAG-specific resources */
const RAG_RESOURCES = {
  STORES: 'rag:stores',
  FILES: 'rag:files',
  QUERIES: 'rag:queries',
  ADMIN: 'rag:admin',
} as const;

/** RAG-specific actions */
const RAG_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  QUERY: 'query',
  UPLOAD: 'upload',
  EXPORT: 'export',
  CONFIGURE: 'configure',
  MANAGE_COSTS: 'manage-costs',
  VIEW_METRICS: 'view-metrics',
} as const;

/** Permission context for RBAC checks */
interface PermissionContext {
  userId: string;
  ventureId: string;
  tier?: 0 | 1 | 2 | 3;                  // 0 = super admin
  roles?: string[];
  permissions?: string[];
}

/** Permission check result */
interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
```

---

## Database Schema

### file_search_stores

```sql
CREATE TABLE file_search_stores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            TEXT NOT NULL UNIQUE,
  google_store_name   TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  description         TEXT,

  -- Ownership
  venture_id          UUID REFERENCES ventures(id),
  is_shared           BOOLEAN NOT NULL DEFAULT FALSE,

  -- Size limits
  max_size_bytes      BIGINT NOT NULL DEFAULT 2147483648,

  -- Chunking configuration
  chunk_max_tokens    INTEGER NOT NULL DEFAULT 256,
  chunk_overlap       INTEGER NOT NULL DEFAULT 64,
  chunking_strategy   VARCHAR(16) NOT NULL DEFAULT 'semantic',

  -- Access control
  allowed_ventures    TEXT[] DEFAULT '{}',
  required_roles      TEXT[] DEFAULT '{}',
  data_classification VARCHAR(16) NOT NULL DEFAULT 'internal',

  -- Denormalized metrics
  total_files         INTEGER NOT NULL DEFAULT 0,
  total_tokens        BIGINT NOT NULL DEFAULT 0,
  total_size_bytes    BIGINT NOT NULL DEFAULT 0,
  indexing_cost_usd   DECIMAL(10,4) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_indexed_at     TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX file_search_stores_venture_idx ON file_search_stores(venture_id);
CREATE INDEX file_search_stores_shared_idx ON file_search_stores(is_shared);
CREATE INDEX file_search_stores_classification_idx ON file_search_stores(data_classification);
```

### file_search_files

```sql
CREATE TABLE file_search_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES file_search_stores(id) ON DELETE CASCADE,
  google_file_name    TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  mime_type           VARCHAR(128) NOT NULL,
  size_bytes          BIGINT NOT NULL,
  token_count         INTEGER,

  -- Ownership
  venture_id          UUID NOT NULL REFERENCES ventures(id),

  -- Metadata for filtering
  document_type       VARCHAR(32),
  tags                TEXT[] DEFAULT '{}',
  custom_metadata     JSONB DEFAULT '{}',

  -- Status lifecycle: pending → processing → indexed | failed
  status              VARCHAR(16) NOT NULL DEFAULT 'pending',
  error_message       TEXT,

  -- Timestamps
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  indexed_at          TIMESTAMPTZ
);

-- Indexes
CREATE INDEX file_search_files_store_idx ON file_search_files(store_id);
CREATE INDEX file_search_files_status_idx ON file_search_files(status);
CREATE INDEX file_search_files_venture_idx ON file_search_files(venture_id);
CREATE INDEX file_search_files_document_type_idx ON file_search_files(document_type);
```

### rag_query_logs

```sql
CREATE TABLE rag_query_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query context
  store_ids           TEXT[] NOT NULL,
  query               TEXT NOT NULL,
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  user_id             UUID REFERENCES users(id),
  agent_type          VARCHAR(32),

  -- Results
  chunks_retrieved    INTEGER,
  chunks_after_rerank INTEGER,
  synthesized_answer  TEXT,                -- Truncated to 5000 chars
  citations           TEXT[],
  confidence_score    DECIMAL(3,2),

  -- Performance
  latency_ms          INTEGER,
  cache_hit           BOOLEAN NOT NULL DEFAULT FALSE,
  depth               INTEGER NOT NULL DEFAULT 1,

  -- Token usage
  query_tokens        INTEGER,
  synthesis_tokens    INTEGER,
  cost_usd            DECIMAL(10,6),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX rag_query_logs_venture_idx ON rag_query_logs(venture_id);
CREATE INDEX rag_query_logs_created_idx ON rag_query_logs(created_at);
CREATE INDEX rag_query_logs_agent_type_idx ON rag_query_logs(agent_type);
CREATE INDEX rag_query_logs_user_idx ON rag_query_logs(user_id);
```

### file_search_costs

```sql
CREATE TABLE file_search_costs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  store_id            UUID REFERENCES file_search_stores(id),
  file_id             UUID REFERENCES file_search_files(id),
  operation           VARCHAR(16) NOT NULL,   -- 'index' | 'query' | 'rerank' | 'synthesis'
  token_count         INTEGER NOT NULL,
  cost_usd            DECIMAL(10,6) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX file_search_costs_venture_created_idx ON file_search_costs(venture_id, created_at);
CREATE INDEX file_search_costs_store_idx ON file_search_costs(store_id);
CREATE INDEX file_search_costs_operation_idx ON file_search_costs(operation);
```

### rag_audit_logs

```sql
CREATE TABLE rag_audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_type          VARCHAR(16) NOT NULL,   -- 'user' | 'agent' | 'system' | 'cron'
  actor_id            TEXT NOT NULL,
  actor_name          TEXT,
  actor_email         TEXT,
  agent_type          VARCHAR(32),

  -- Action
  action              VARCHAR(64) NOT NULL,   -- e.g., 'rag:store.created'
  category            VARCHAR(32) NOT NULL,   -- 'rag:store' | 'rag:file' | 'rag:query' | 'rag:admin'

  -- Resource
  resource_type       VARCHAR(16) NOT NULL,   -- 'store' | 'file' | 'query'
  resource_id         TEXT NOT NULL,
  resource_name       TEXT,
  store_id            UUID REFERENCES file_search_stores(id),

  -- Context
  venture_id          UUID NOT NULL REFERENCES ventures(id),
  metadata            JSONB DEFAULT '{}',

  -- Outcome
  outcome             VARCHAR(16) NOT NULL,   -- 'success' | 'failure' | 'error'
  error_message       TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX rag_audit_logs_venture_idx ON rag_audit_logs(venture_id);
CREATE INDEX rag_audit_logs_actor_idx ON rag_audit_logs(actor_id);
CREATE INDEX rag_audit_logs_action_idx ON rag_audit_logs(action);
CREATE INDEX rag_audit_logs_created_idx ON rag_audit_logs(created_at);
CREATE INDEX rag_audit_logs_store_idx ON rag_audit_logs(store_id);
```

---

## Default Stores (SPEC-004)

The 8 core knowledge stores pre-defined for the MCV ecosystem:

| Store ID | Display Name | Venture | Shared | Classification | Est. Size |
|----------|-------------|---------|--------|----------------|-----------|
| `betedge-knowledge-v1` | BetEdge AI Knowledge | betedge | No | internal | 500MB |
| `mcv-studios-knowledge-v1` | MCV Studios Knowledge | mcv-studios | No | internal | 800MB |
| `edgeiq-knowledge-v1` | EdgeIQ Markets Knowledge | edgeiq | No | confidential | 400MB |
| `futurestate-knowledge-v1` | Futurestate RWA Knowledge | futurestate | No | confidential | 600MB |
| `mcv-ecosystem-shared-v1` | MCV Ecosystem Shared | — | Yes | internal | 1.2GB |
| `naos-prompts-v1` | NAOS Instrument Bank | — | Yes | internal | 200MB |
| `legal-compliance-v1` | Legal & Compliance | — | Yes | confidential | 400MB |
| `grant-concierge-v1` | Grant Concierge Knowledge | grant-concierge | No | internal | 300MB |

Total estimated storage: ~4.4GB across 8 stores. All use semantic chunking at 512 tokens / 64 overlap except NAOS Instrument Bank (fixed chunking at 256 tokens / 32 overlap for precise prompt boundaries).

---

## Supported MIME Types

17 file types supported for ingestion:

| MIME Type | Extensions | Category |
|-----------|-----------|----------|
| `application/pdf` | .pdf | Documents |
| `text/plain` | .txt | Documents |
| `text/markdown` | .md, .markdown | Documents |
| `text/html` | .html, .htm | Documents |
| `text/csv` | .csv | Data |
| `application/json` | .json | Data |
| `application/vnd.openxmlformats-...wordprocessingml.document` | .docx | Office |
| `application/vnd.openxmlformats-...spreadsheetml.sheet` | .xlsx | Office |
| `application/vnd.openxmlformats-...presentationml.presentation` | .pptx | Office |
| `text/x-python` | .py | Code |
| `text/javascript` | .js, .jsx, .mjs | Code |
| `text/typescript` | .ts, .tsx | Code |
| `text/x-java-source` | .java | Code |
| `text/x-c` | .c, .h | Code |
| `text/x-c++src` | .cpp, .hpp, .cc, .cxx | Code |
| `text/x-go` | .go | Code |
| `text/x-rust` | .rs | Code |

Maximum file size: **50MB** per file.

---

## Usage Examples

### Example 1: Create a Knowledge Store

```typescript
import { storeRegistry } from '@mcv/rag/server';

const store = await storeRegistry.create({
  displayName: 'BetEdge Knowledge Base',
  description: 'Sports analytics documentation and betting strategy guides',
  ventureId: 'betedge-venture-uuid',
  isShared: false,
  maxSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
  chunkMaxTokens: 512,
  chunkOverlap: 64,
  chunkingStrategy: 'semantic',
  dataClassification: 'internal',
  allowedVentures: [],
  requiredRoles: ['analyst', 'admin'],
});

console.log(`Store created: ${store.storeId}`);
console.log(`Google ref: ${store.googleStoreName}`);
// Store created: store_1707400000_a7b3c4d
// Google ref: corpora/xxx-yyy-zzz
```

### Example 2: List Stores for a Venture

```typescript
import { storeRegistry } from '@mcv/rag/server';

const stores = await storeRegistry.list('betedge-venture-uuid', {
  includeShared: true,
  dataClassification: 'internal',
});

for (const s of stores) {
  console.log(`${s.displayName}: ${s.stats.totalFiles} files, ${s.stats.totalTokens} tokens`);
  console.log(`  Size: ${(s.stats.totalSizeBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Pending: ${s.stats.pendingFiles}, Failed: ${s.stats.failedFiles}`);
}
```

### Example 3: Ingest a PDF Document

```typescript
import { documentIngestion } from '@mcv/rag/server';
import { readFileSync } from 'fs';

const pdfBuffer = readFileSync('./nba-analytics-guide-2026.pdf');

const file = await documentIngestion.ingest({
  storeId: 'store_abc123',         // Store's storeId
  ventureId: 'betedge-venture-uuid',
  file: pdfBuffer,
  filename: 'nba-analytics-guide-2026.pdf',
  mimeType: 'application/pdf',
  metadata: {
    documentType: 'guide',
    tags: ['nba', 'analytics', '2026'],
    customMetadata: {
      author: 'BetEdge Analytics Team',
      version: '3.1',
    },
  },
});

console.log(`File indexed: ${file.id}`);
console.log(`Status: ${file.status}`);        // 'indexed'
console.log(`Tokens: ${file.tokenCount}`);
console.log(`Google ref: ${file.googleFileName}`);
```

### Example 4: Bulk Ingest Multiple Files

```typescript
import { documentIngestion } from '@mcv/rag/server';

const result = await documentIngestion.bulkIngest({
  storeId: 'store_abc123',
  ventureId: 'betedge-venture-uuid',
  files: documents.map(doc => ({
    file: doc.buffer,
    filename: doc.name,
    mimeType: doc.mimeType,
    metadata: {
      documentType: 'kb',
      tags: doc.tags,
    },
  })),
  concurrency: 5, // Process 5 files in parallel (p-limit)
});

console.log(`Uploaded: ${result.uploaded}`);
console.log(`Failed: ${result.failed}`);
console.log(`Total tokens: ${result.totalTokens}`);
console.log(`Total cost: $${result.totalCost.toFixed(4)}`);

for (const err of result.errors) {
  console.error(`  ${err.filename}: ${err.error}`);
}
```

### Example 5: Query with Synthesis

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.queryWithSynthesis({
  query: 'What are the key factors in NBA player performance prediction?',
  storeIds: ['store_abc123'],
  ventureId: 'betedge-venture-uuid',
  userId: 'analyst-user-uuid',
  agentType: 'ralph',
  systemPrompt: 'You are a sports analytics expert. Cite sources with [N] notation.',
  synthesisModel: 'gemini-2.0-flash',
  temperature: 0.7,
});

console.log('Answer:', result.answer);
console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
console.log(`Chunks used: ${result.chunksUsed}`);
console.log(`Latency: ${result.latencyMs}ms`);
console.log(`Tokens: ${result.tokenUsage?.queryTokens} in, ${result.tokenUsage?.synthesisTokens} out`);

for (const cite of result.citations) {
  console.log(`  [${cite.chunkIndex}] ${cite.fileName} (${cite.relevanceScore?.toFixed(2)})`);
  console.log(`    "${cite.relevantText}"`);
}
```

### Example 6: Retrieve Chunks Only (No Synthesis)

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.query({
  query: 'player injury impact on betting lines',
  storeIds: ['store_abc123'],
  ventureId: 'betedge-venture-uuid',
  maxChunks: 50,
  filters: {
    documentTypes: ['guide', 'report'],
    tags: ['nba', 'injuries'],
    minRelevanceScore: 0.5,
  },
  useCache: true,
});

console.log(`Found ${result.totalChunks} chunks (cache: ${result.cacheHit})`);
for (const chunk of result.chunks) {
  console.log(`[${chunk.relevanceScore?.toFixed(2)}] ${chunk.fileName}: ${chunk.text.slice(0, 200)}...`);
}
```

### Example 7: Deep RAG (Recursive Multi-Hop)

```typescript
import { deepRagService } from '@mcv/rag/server';

const result = await deepRagService.deepQuery({
  query: 'Compare NBA and NFL prediction models and recommend which approach works better for real-time betting adjustments',
  storeIds: ['store_nba', 'store_nfl', 'store_methodology'],
  ventureId: 'betedge-venture-uuid',
  agentType: 'ralph',
  maxDepth: 3,                    // Up to 3 levels of recursion
  gapThreshold: 0.7,             // Recurse if coverage < 70%
  maxGapsPerLevel: 3,            // Max 3 sub-queries per level
});

console.log(`Deep RAG completed:`);
console.log(`  Answer: ${result.answer.slice(0, 200)}...`);
console.log(`  Depth reached: ${result.depth}`);
console.log(`  Total queries: ${result.totalQueries}`);
console.log(`  Chunks used: ${result.chunksUsed}`);
console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
console.log(`  Tokens: ${result.tokenUsage.totalTokens}`);
console.log(`  Cost: $${result.cost?.totalCost.toFixed(6)}`);
console.log(`  Latency: ${result.latencyMs}ms`);
console.log(`  Citations: ${result.citations.length}`);

// Inspect the query tree
const printTree = (node: QueryNode, indent = '') => {
  console.log(`${indent}[depth ${node.depth}] "${node.query}" → ${node.chunks.length} chunks`);
  if (node.gaps.length > 0) console.log(`${indent}  Gaps: ${node.gaps.join(', ')}`);
  for (const child of node.children) printTree(child, indent + '  ');
};
printTree(result.queryTree);
```

### Example 8: NAOS Agent Tool Integration

```typescript
import { knowledgeBaseTool, createKnowledgeQueryTool } from '@mcv/rag/server';

// Register with NAOS gateway
gateway.registerTool(knowledgeBaseTool);

// Or create a venture-scoped tool
const betedgeTool = createKnowledgeQueryTool('betedge-venture-uuid');

// Execute in agent context
const result = await knowledgeBaseTool.execute(
  {
    query: 'What is our product roadmap for Q2 2026?',
    deepQuery: true,
    maxDepth: 2,
    maxChunks: 15,
    documentType: 'prd',
  },
  {
    ventureId: 'betedge-venture-uuid',
    agentType: 'ralph',
    taskId: 'task-123',
    sessionId: 'session-456',
  }
);

if (result.success) {
  console.log(result.answer);
  console.log(`${result.citations.length} citations, ${result.confidence.toFixed(2)} confidence`);
} else {
  console.error(result.error);
}
```

### Example 9: Semantic Reranking with Diversity

```typescript
import { semanticRanker, fileSearchManager } from '@mcv/rag/server';

// First, retrieve chunks
const queryResult = await fileSearchManager.query({
  query: 'machine learning approaches for sports prediction',
  storeIds: ['store_abc123'],
  ventureId: 'betedge-venture-uuid',
});

// Rerank with semantic scoring
const reranked = await semanticRanker.rerank(
  'machine learning approaches for sports prediction',
  queryResult.chunks,
  {
    topK: 5,
    threshold: 0.3,
    batchScoring: true,
    batchSize: 5,
    model: 'gemini-2.0-flash',
    temperature: 0.0,
    ventureId: 'betedge-venture-uuid',
  }
);

console.log(`Reranked ${reranked.totalProcessed} → ${reranked.chunks.length} chunks`);
console.log(`Filtered: ${reranked.filteredCount}, Latency: ${reranked.latencyMs}ms`);

for (const chunk of reranked.chunks) {
  console.log(`  [${chunk.rerankScore.toFixed(3)}] ${chunk.fileName} (was #${chunk.originalRank}, Δ${chunk.rankDelta > 0 ? '+' : ''}${chunk.rankDelta})`);
}

// Or with MMR diversity consideration
const diverse = await semanticRanker.rerankWithDiversity(
  'machine learning approaches',
  queryResult.chunks,
  { topK: 5 },
  0.2  // 20% diversity weight
);
```

### Example 10: Cost Tracking and Analytics

```typescript
import { costTracker } from '@mcv/rag/server';

// Get cost summary for current month
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const summary = await costTracker.getSummary(
  'betedge-venture-uuid',
  startOfMonth,
  new Date()
);

console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
console.log(`  Indexing:  $${summary.indexingCost.toFixed(4)}`);
console.log(`  Queries:   $${summary.queryCost.toFixed(4)}`);
console.log(`  Reranking: $${summary.rerankCost.toFixed(4)}`);
console.log(`  Synthesis: $${summary.synthesisCost.toFixed(4)}`);
console.log(`  Tokens:    ${summary.totalTokens.toLocaleString()}`);

for (const store of summary.byStore) {
  console.log(`  ${store.displayName}: $${store.cost.toFixed(4)}`);
}

// Monthly trend
const trend = await costTracker.getMonthlyTrend('betedge-venture-uuid', 6);
for (const point of trend) {
  console.log(`  ${point.month}: $${point.cost.toFixed(2)} (${point.tokens.toLocaleString()} tokens)`);
}

// Current month spend
const spend = await costTracker.getCurrentMonthSpend('betedge-venture-uuid');
console.log(`Current month: $${spend.toFixed(4)}`);
```

### Example 11: Gateway Budget Integration

```typescript
import {
  gatewayIntegration,
  SynthesisBudgetExceededError,
  SynthesisRateLimitError,
} from '@mcv/rag/server';

// Pre-check budget before synthesis
const budgetCheck = await gatewayIntegration.checkBudgetForSynthesis({
  ventureId: 'betedge-venture-uuid',
  estimatedInputTokens: 5000,
  userId: 'user-123',
  agentType: 'ralph',
});

if (!budgetCheck.allowed) {
  console.error(`Denied: ${budgetCheck.reason}`);
  console.log(`Daily remaining: $${budgetCheck.budgetStatus.dailyRemaining.toFixed(2)}`);
  return;
}

// Get remaining budget info
const remaining = await gatewayIntegration.getRemainingBudget('betedge-venture-uuid');
console.log(`Daily syntheses remaining: ${remaining.estimatedDailySynthesesRemaining}`);
console.log(`Monthly syntheses remaining: ${remaining.estimatedMonthlySynthesesRemaining}`);
if (remaining.warning) console.warn(remaining.warning);

// Handle budget/rate limit errors in synthesis
try {
  const result = await fileSearchManager.queryWithSynthesis({ ... });
} catch (error) {
  if (error instanceof SynthesisBudgetExceededError) {
    console.error(`Budget exceeded for ${error.ventureId}: ${error.reason}`);
  } else if (error instanceof SynthesisRateLimitError) {
    console.error(`Rate limited: retry after ${error.retryAfterSeconds}s`);
  }
}
```

### Example 12: Document Sync and Orphan Detection

```typescript
import { documentSync } from '@mcv/rag/server';

// Sync all documents in a store with Google
const syncResult = await documentSync.syncStoreDocuments('store_abc123');
console.log(`Synced: ${syncResult.synced}/${syncResult.totalFiles}`);
console.log(`Updated: ${syncResult.updated}`);
console.log(`Failed: ${syncResult.failed}`);

for (const r of syncResult.results.filter(r => r.changed)) {
  console.log(`  ${r.googleFileName}: ${r.previousStatus} → ${r.newStatus}`);
}

// Detect and reconcile orphaned files
const orphans = await documentSync.reconcileOrphans('store_abc123', {
  deleteDbOrphans: false,         // Mark as 'failed' instead
  createGoogleOrphans: true,      // Create DB records for Google-only files
  defaultVentureId: 'betedge-venture-uuid',
});

console.log(`DB orphans: ${orphans.databaseOrphans.length}`);
console.log(`Google orphans: ${orphans.googleOrphans.length}`);
for (const action of orphans.actions) {
  console.log(`  ${action.orphan.name}: ${action.action}`);
}
```

### Example 13: Real-Time Progress Events

```typescript
import { ragProgressEvents, RagChannels } from '@mcv/rag/server';

// Set up the realtime server
ragProgressEvents.setServer(realtimeServer);

// Emit upload progress
ragProgressEvents.emitUploadStarted(fileId, 'doc.pdf', storeId, ventureId, {
  mimeType: 'application/pdf',
  sizeBytes: 1024 * 1024,
});

ragProgressEvents.emitUploadProgress(fileId, 'doc.pdf', 50, 'processing');

ragProgressEvents.emitUploadCompleted(
  fileId, 'doc.pdf', storeId, ventureId,
  25000,    // tokenCount
  0.00375,  // costUsd
  12500     // durationMs
);

// Subscribe locally (for testing)
const sub = ragProgressEvents.on('rag:query:completed', (event) => {
  console.log(`Query completed: ${event.payload.latencyMs}ms, cached: ${event.payload.cached}`);
});

// Channel naming conventions
const channels = {
  ventureUploads: RagChannels.ventureUploads('betedge-uuid'),    // rag:venture:{id}:uploads
  fileProgress:   RagChannels.fileProgress('file-uuid'),          // rag:file:{id}:progress
  storeActivity:  RagChannels.storeActivity('store-uuid'),        // rag:store:{id}:activity
  batchProgress:  RagChannels.batchProgress('batch-uuid'),        // rag:batch:{id}:progress
  queryProgress:  RagChannels.queryProgress('query-uuid'),        // rag:query:{id}:progress
};
```

### Example 14: Advanced Metadata Filtering

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.query({
  query: 'revenue projections for 2026',
  storeIds: ['store_finance'],
  ventureId: 'edgeiq-venture-uuid',
  filters: {
    documentTypes: ['report', 'prd'],
    tags: ['finance', '2026'],
    tagsAll: ['quarterly'],               // Must have ALL of these
    excludeTags: ['draft'],               // Exclude drafts
    metadata: {
      logic: 'and',
      conditions: [
        { field: 'department', operator: 'eq', value: 'finance' },
        { field: 'confidenceLevel', operator: 'gte', value: 0.8 },
        { field: 'status', operator: 'notIn', value: ['archived', 'superseded'] },
      ],
    },
    dateRange: {
      field: 'uploadedAt',
      from: '2025-06-01',
      to: '2026-02-08',
    },
    minRelevanceScore: 0.5,
  },
});
```

### Example 15: React Client Hooks

```tsx
import {
  useStores, useCreateStore, useDeleteStore,
  useFiles, useUploadFile,
  useAskKnowledgeBase, useResearchQuery,
  useCurrentMonthCosts, useRagCostTrend,
} from '@mcv/rag/client';

function KnowledgeSearch({ ventureId }: { ventureId: string }) {
  // List accessible stores
  const { data: stores, isLoading } = useStores({ includeShared: true });

  // Ask knowledge base (convenience hook)
  const { ask, data: result, isPending } = useAskKnowledgeBase();

  const handleSearch = async (query: string) => {
    if (!stores?.length) return;
    await ask(query, stores.map(s => s.storeId), {
      temperature: 0.5,
    });
  };

  // Deep research queries
  const { research, data: deepResult } = useResearchQuery();

  const handleResearch = async (query: string) => {
    if (!stores?.length) return;
    await research(query, stores.map(s => s.storeId), {
      maxDepth: 3,
      gapThreshold: 0.7,
    });
  };

  // Cost metrics
  const { data: costs } = useCurrentMonthCosts();
  const { data: trend } = useRagCostTrend(6);

  return (
    <div>
      {result && (
        <div>
          <p>{result.answer}</p>
          <p>Confidence: {(result.confidence * 100).toFixed(0)}%</p>
          <p>Latency: {result.latencyMs}ms</p>
          <ul>
            {result.citations.map((c, i) => (
              <li key={i}>{c.fileName}: "{c.relevantText}"</li>
            ))}
          </ul>
        </div>
      )}
      {costs && <p>This month: ${costs.totalCost.toFixed(2)}</p>}
    </div>
  );
}

function FileManager({ storeId }: { storeId: string }) {
  const { data } = useFiles(storeId, { status: 'indexed' });
  const upload = useUploadFile();

  const handleUpload = (file: File) => {
    upload.mutate({
      storeId,
      file,
      metadata: { documentType: 'kb', tags: ['manual-upload'] },
    });
  };

  return <div>{/* UI here */}</div>;
}
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Retrieve chunks (cached) | < 10ms | < 50ms |
| Retrieve chunks (uncached) | < 500ms | < 1.5s |
| Query with synthesis | < 3s | < 8s |
| Deep RAG (depth 2) | < 5s | < 15s |
| Deep RAG (depth 3) | < 10s | < 30s |
| File ingestion (per file) | < 30s | < 120s |
| Batch ingestion (100 files) | < 10min | < 30min |
| Store creation | < 2s | < 5s |
| Semantic reranking (batch 5) | < 1s | < 3s |

### Throughput and Limits

| Metric | Default | Configurable |
|--------|---------|-------------|
| Max concurrent uploads | 5 | `CONCURRENCY_LIMITS.maxConcurrentUploads` |
| Max concurrent queries | 10 | `CONCURRENCY_LIMITS.maxConcurrentQueries` |
| Max concurrent gap queries | 3 | `CONCURRENCY_LIMITS.maxConcurrentGapQueries` |
| Uploads per minute per venture | 20 | `RATE_LIMITS.uploadsPerMinute` |
| Queries per minute per venture | 100 | `RATE_LIMITS.queriesPerMinute` |
| Deep queries per minute | 20 | `RATE_LIMITS.deepQueriesPerMinute` |
| Max file size | 50MB | `MAX_FILE_SIZE_BYTES` |
| Max store size | 2GB | `DEFAULT_STORE_CONFIG.maxSizeBytes` |
| Cache TTL | 3600s (1h) | `DEFAULT_QUERY_CONFIG.cacheTtlSeconds` |
| Cache max entries (in-memory) | 1000 | LRU eviction |
| Max chunks per query | 50 | `DEFAULT_QUERY_CONFIG.maxChunks` |
| Max Deep RAG depth | 3 | `DEFAULT_DEEP_RAG_CONFIG.maxDepth` |
| Max gaps per level | 3 | `DEFAULT_DEEP_RAG_CONFIG.maxGapsPerLevel` |

### Optimization Strategies

1. **Query caching** — Redis-backed with in-memory LRU fallback; 1-hour TTL per venture+query combo
2. **Semantic chunking** — `chunkingStrategy: 'semantic'` produces better retrieval than fixed-size (larger chunks with more overlap preserve paragraph boundaries)
3. **Metadata pre-filtering** — Database-level filtering before Google File Search reduces noise and improves relevance
4. **Batch scoring** — Semantic ranker processes 5 chunks per LLM call instead of individual calls (5x fewer API calls)
5. **Store partitioning** — Separate stores by domain/venture for faster retrieval and access control
6. **Concurrency control** — `p-limit` for uploads and queries prevents Google API rate limiting
7. **Chunking configuration mapping** — Store's `chunkMaxTokens`/`chunkOverlap` mapped to Google's `maxChunkSize`/`minChunkSize`/`overlapSize`
8. **Deep RAG sparingly** — Parallel gap queries at each level, but each level adds ~1-3s latency
9. **Token estimation** — 4 chars/token heuristic for pre-flight budget checks before synthesis
10. **Fire-and-forget logging** — Query logs and cache writes don't block the response path

---

## Security Considerations

### Data Isolation

- **Venture-scoped stores**: Each store owned by a venture; access requires ownership, `isShared: true`, or explicit `allowedVentures` listing
- **Data classification**: Three levels — `public`, `internal`, `confidential` — with `confidential` enforcing stricter access
- **Role-based access**: `requiredRoles` array gates access to sensitive stores
- **Cascading deletes**: Deleting a store cascade-removes all files from both database and Google GenAI

### Access Control (RBAC)

| Operation | Minimum Tier | Permission String |
|-----------|-------------|-------------------|
| Query stores | 3 (any user) | `rag:queries:query` |
| Upload files | 3 | `rag:files:upload` |
| Read files | 3 | `rag:files:read` |
| Deep queries | 2 (or tier ≤1) | `rag:queries:deep` |
| Create stores | 1 (admin) | `rag:stores:create` |
| Delete stores | 1 (admin) | `rag:stores:delete` |
| Configure stores | 1 | `rag:stores:configure` |
| Manage costs | 1 | `rag:admin:manage-costs` |
| Admin all | 0 (super admin) | `rag:admin:*` |

Tier 0 (Super Admin) bypasses all permission checks. Wildcard permissions (`resource:*`, `*:*`) are supported.

### Credential Management

- Google GenAI API key retrieved from **System Vault** (`mcv-system-genai-master`) with fallback to `GOOGLE_GENAI_API_KEY` environment variable
- Redis credentials from System Vault (`mcv-system-redis-master`) with fallback to `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`
- Vertex AI uses Application Default Credentials, metadata server, `gcloud` CLI, or inline `GOOGLE_CREDENTIALS_JSON`
- Singleton GenAI client pattern prevents key sprawl; `resetGenAIClient()` supports key rotation

### Audit & Compliance

- Every operation logged in `rag_audit_logs` with actor type/id, action, resource, venture, outcome, and metadata
- Query logs retain query text, synthesized answer (truncated to 5000 chars), and cost for billing disputes
- Data classification system supports SOC 2 and GDPR requirements
- File metadata with tags and custom key-value pairs supports provenance tracking
- Audit logging never throws — failures are caught and logged to stderr

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `rag:store.created` | `rag:store` | New knowledge store created |
| `rag:store.updated` | `rag:store` | Store configuration changed |
| `rag:store.deleted` | `rag:store` | Store and all files deleted |
| `rag:store.access_granted` | `rag:store` | Venture added to allowedVentures |
| `rag:store.access_revoked` | `rag:store` | Venture removed from allowedVentures |
| `rag:file.uploaded` | `rag:file` | File uploaded and processing started |
| `rag:file.deleted` | `rag:file` | File removed from store |
| `rag:file.indexed` | `rag:file` | File successfully indexed |
| `rag:file.failed` | `rag:file` | File indexing failed |
| `rag:file.bulk_upload_started` | `rag:file` | Batch upload initiated |
| `rag:file.bulk_upload_completed` | `rag:file` | Batch upload finished |
| `rag:query.executed` | `rag:query` | Standard RAG query completed |
| `rag:query.deep_executed` | `rag:query` | Deep RAG multi-hop query completed |
| `rag:query.failed` | `rag:query` | Query execution failed |
| `rag:admin.cache_cleared` | `rag:admin` | Query cache cleared |
| `rag:admin.cost_threshold_exceeded` | `rag:admin` | Venture cost threshold exceeded |
| `rag:admin.retention_applied` | `rag:admin` | Data retention policy applied |

---

## Real-Time Events

17 event types across 4 categories, delivered via `@mcv/realtime` WebSocket channels:

| Event Type | Category | Payload |
|-----------|----------|---------|
| `rag:upload:started` | Upload | fileId, filename, storeId, ventureId, mimeType, sizeBytes |
| `rag:upload:progress` | Upload | fileId, filename, progress (0-100), stage |
| `rag:upload:completed` | Upload | fileId, filename, tokenCount, costUsd, durationMs |
| `rag:upload:failed` | Upload | fileId, filename, error, errorCode |
| `rag:indexing:started` | Indexing | fileId, filename, storeId, ventureId |
| `rag:indexing:processing` | Indexing | fileId, filename, percentComplete |
| `rag:indexing:completed` | Indexing | fileId, tokenCount, chunksCreated, durationMs |
| `rag:indexing:failed` | Indexing | fileId, filename, error, errorCode |
| `rag:bulk:started` | Bulk | batchId, storeId, totalFiles, totalSizeBytes |
| `rag:bulk:progress` | Bulk | batchId, current, total, successCount, failureCount |
| `rag:bulk:completed` | Bulk | batchId, totalFiles, totalTokens, totalCostUsd, durationMs |
| `rag:bulk:failed` | Bulk | batchId, error, completedCount, totalCount |
| `rag:query:started` | Query | queryId, query, storeIds, queryType |
| `rag:query:retrieving` | Query | queryId, stage (searching/ranking/filtering) |
| `rag:query:synthesizing` | Query | queryId, chunksRetrieved, tokensProcessing, model |
| `rag:query:completed` | Query | queryId, chunksRetrieved, confidence, latencyMs, cached |
| `rag:query:failed` | Query | queryId, error, errorCode |

**Channel naming conventions:**
- `rag:venture:{ventureId}:uploads` — All uploads for a venture
- `rag:file:{fileId}:progress` — Specific file progress
- `rag:store:{storeId}:activity` — Store-level activity
- `rag:batch:{batchId}:progress` — Bulk upload batch progress
- `rag:query:{queryId}:progress` — Query execution progress
- `rag:venture:{ventureId}:activity` — All RAG activity for a venture

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `RAG_STORE_NOT_FOUND` | 404 | Store does not exist | Verify storeId; call `storeRegistry.list()` |
| `RAG_STORE_LIMIT_EXCEEDED` | 413 | Store size limit reached | Delete old files or increase `maxSizeBytes` |
| `RAG_FILE_NOT_FOUND` | 404 | File does not exist in store | Verify file UUID |
| `RAG_FILE_TOO_LARGE` | 413 | File exceeds 50MB limit | Split file into smaller parts |
| `RAG_UNSUPPORTED_MIME` | 415 | MIME type not in SUPPORTED_MIME_TYPES | Use one of the 17 supported types |
| `RAG_INGESTION_FAILED` | 502 | Google GenAI rejected the file | Check `errorMessage` on file record |
| `RAG_INGESTION_TIMEOUT` | 504 | File processing exceeded 120s timeout | Increase timeout or split file |
| `RAG_ACCESS_DENIED` | 403 | Venture/role not authorized | Check `allowedVentures`, `requiredRoles`, `isShared` |
| `RAG_QUERY_EMPTY` | 400 | Query text is empty | Provide a non-empty query string |
| `RAG_NO_STORES` | 400 | No valid stores found | Provide at least one accessible storeId |
| `RAG_NO_RESULTS` | 200 | No chunks above threshold | Lower `threshold` or broaden query |
| `RAG_SYNTHESIS_FAILED` | 502 | LLM synthesis call failed | Check gateway health; use `synthesize: false` |
| `RAG_BUDGET_EXCEEDED` | 429 | Venture budget exhausted | Wait for reset or increase allocation |
| `RAG_RATE_LIMITED` | 429 | Too many requests | Reduce rate; check `retryAfterSeconds` |
| `RAG_GOOGLE_API_ERROR` | 502 | Google GenAI API error | Check API key, quota, project ID |
| `RAG_CACHE_UNAVAILABLE` | 200 | Redis unreachable; proceeds uncached | Check Redis connectivity |
| `RAG_PERMISSION_DENIED` | 403 | Permission string not held | Check user tier and permission strings |
| `RAG_VENTURE_REQUIRED` | 400 | Missing `ventureId` | All RAG operations require venture context |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# Google GenAI (required)
# ═══════════════════════════════════════════════════════════════════════════════
GOOGLE_GENAI_API_KEY=AIza...              # Google GenAI API key (fallback from System Vault)

# ═══════════════════════════════════════════════════════════════════════════════
# Vertex AI (optional — for Discovery Engine ranker)
# ═══════════════════════════════════════════════════════════════════════════════
GOOGLE_CLOUD_PROJECT=mcv-one-prod         # GCP project ID
GOOGLE_CLOUD_LOCATION=global              # Default: 'global'
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GOOGLE_CREDENTIALS_JSON='{"client_email":"...","private_key":"..."}'

# ═══════════════════════════════════════════════════════════════════════════════
# Redis Cache (optional — falls back to in-memory LRU)
# ═══════════════════════════════════════════════════════════════════════════════
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

> **Note:** The module reads sensible defaults from code constants rather than environment variables. Store configuration (chunk size, overlap, strategy, max size), query configuration (cache TTL, synthesis model, temperature), and operational limits (concurrency, rate limits) are all defined in `@mcv/rag/constants` and can be overridden per-store or per-query via API parameters.

---

## Constants Reference

```typescript
// Store defaults
DEFAULT_STORE_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024 * 1024,  // 2GB
  chunkMaxTokens: 256,
  chunkOverlap: 64,
  chunkingStrategy: 'semantic',
  dataClassification: 'internal',
};

// Query defaults
DEFAULT_QUERY_CONFIG = {
  maxChunks: 50,
  useCache: true,
  cacheTtlSeconds: 3600,                 // 1 hour
  synthesisModel: 'gemini-2.0-flash',
  synthesisTemperature: 0.7,
};

// Deep RAG defaults
DEFAULT_DEEP_RAG_CONFIG = {
  maxDepth: 3,
  gapThreshold: 0.7,
  maxGapsPerLevel: 3,
  synthesisModel: 'gemini-2.0-flash',
  rerankTopK: 5,
  initialRetrievalSize: 50,
  gapDetectionTemperature: 0.1,
  synthesisTemperature: 0.5,
};

// Reranking defaults
DEFAULT_RERANK_CONFIG = {
  topK: 10,
  threshold: 0.0,                         // Include all by default
  model: 'gemini-2.0-flash',
  batchScoring: true,
  batchSize: 5,
  temperature: 0.0,                       // Deterministic
  maxScoringTokens: 200,
  maxChunkTextLength: 1500,
};

// Pricing
INDEXING_COST_PER_1M_TOKENS = 0.15;      // $0.15/1M tokens
QUERY_COST_PER_1M_TOKENS = 0;            // Free retrieval

// Gateway synthesis cost estimates
SYNTHESIS_COST_ESTIMATES = {
  inputCostPer1M: 0.15,                  // $0.15/1M input tokens
  outputCostPer1M: 0.60,                 // $0.60/1M output tokens
  outputToInputRatio: 0.4,
};

// Indexing polling
INDEXING_POLL_CONFIG = {
  intervalMs: 2000,                       // 2 seconds
  maxAttempts: 60,
  timeoutMs: 120000,                      // 2 minutes
};

// Rate limits
RATE_LIMITS = {
  uploadsPerMinute: 20,
  queriesPerMinute: 100,
  deepQueriesPerMinute: 20,
};

// Concurrency limits
CONCURRENCY_LIMITS = {
  maxConcurrentUploads: 5,
  maxConcurrentQueries: 10,
  maxConcurrentGapQueries: 3,
};
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@google/genai` | Google GenAI File Search SDK — store/document CRUD, file search queries |
| `@mcv/db` | Drizzle ORM — all database operations (stores, files, queries, costs, audit) |
| `@mcv/gateway` | LLM Gateway — types for ChatMessage, BudgetStatus, AgentType |
| `@mcv/gateway/server` | Gateway server — BudgetManager, getRateLimiter, mcvGateway.execute() |
| `@mcv/secrets` | SecretManagerService — System Vault credential retrieval |
| `@mcv/realtime/server` | RealtimeServer — WebSocket event broadcasting |
| `@upstash/redis` | Redis client — query cache (optional, dynamically imported) |
| `@tanstack/react-query` | Client hooks — useQuery, useMutation, useQueryClient |
| `p-limit` | Concurrency control — bulk ingestion, parallel scoring |
| `zod` | Schema validation — NAOS tool parameter validation |
| `drizzle-orm/pg-core` | Schema definitions — all 5 database tables |

---

## Service Architecture Summary

| Service | Singleton | Purpose |
|---------|-----------|---------|
| `StoreRegistry` | `storeRegistry` | CRUD for knowledge stores; Google GenAI store lifecycle |
| `DocumentIngestionPipeline` | `documentIngestion` | Single/bulk file upload, indexing, deletion |
| `FileSearchManager` | `fileSearchManager` | RAG queries with caching, filtering, synthesis |
| `DeepRagService` | `deepRagService` | Recursive multi-hop retrieval with gap detection |
| `CostTracker` | `costTracker` | Per-operation cost tracking and reporting |
| `SemanticRanker` | `semanticRanker` | LLM-based cross-encoder reranking |
| `VertexRanker` | `vertexRanker` | Vertex AI Discovery Engine reranking (fallback) |
| `GatewayIntegration` | `gatewayIntegration` | Budget checks, rate limiting, cost estimation |
| `MetadataFilterService` | `metadataFilter` | Database-level pre-filtering for queries |
| `RagPermissionsGuard` | `ragPermissions` | RBAC permission checks (tier + permission strings) |
| `RagAuditLogger` | `ragAuditLogger` | Audit event logging to `rag_audit_logs` |
| `DocumentSyncService` | `documentSync` | Google ↔ Database state reconciliation |
| `RagProgressEvents` | `ragProgressEvents` | Real-time WebSocket progress events |

All services are instantiated as singletons for consistent state and efficient resource usage. The GenAI client (`getGenAIClient()`) is lazily initialized on first use with credentials from System Vault.

---

## Testing Notes

### Unit Testing

```typescript
import { setGenAIClient, resetGenAIClient } from '@mcv/rag/server';

// Inject mock client
beforeEach(() => {
  setGenAIClient(mockGenAI);
});

afterEach(() => {
  resetGenAIClient();
});

// Test store creation
describe('StoreRegistry', () => {
  it('creates store with defaults', async () => {
    const store = await storeRegistry.create({
      displayName: 'Test Store',
      ventureId: 'test-venture',
    });

    expect(store.config.chunkMaxTokens).toBe(256);
    expect(store.config.chunkOverlap).toBe(64);
    expect(store.config.chunkingStrategy).toBe('semantic');
    expect(store.config.dataClassification).toBe('internal');
    expect(store.isShared).toBe(false);
  });
});

// Test access control
describe('Access Control', () => {
  it('denies query to unauthorized venture', async () => {
    const canAccess = await storeRegistry.canAccess('private-store', 'unauthorized-venture');
    expect(canAccess).toBe(false);
  });

  it('allows query to shared store', async () => {
    const canAccess = await storeRegistry.canAccess('shared-store', 'any-venture');
    expect(canAccess).toBe(true);
  });
});

// Test NAOS tool validation
describe('Knowledge Base Tool', () => {
  it('validates query params', () => {
    const { valid, error } = validateQueryParams({ query: '' });
    expect(valid).toBe(false);
    expect(error).toContain('query');
  });

  it('accepts valid params', () => {
    const { valid, params } = validateQueryParams({
      query: 'test query',
      maxChunks: 10,
    });
    expect(valid).toBe(true);
    expect(params?.maxChunks).toBe(10);
  });
});
```

### Cache Testing

```typescript
import { InMemoryCache, RedisCache } from '@mcv/rag/server';

describe('InMemoryCache', () => {
  const cache = new InMemoryCache<string>(100);

  it('handles LRU eviction', async () => {
    for (let i = 0; i < 101; i++) {
      await cache.set(`key-${i}`, `value-${i}`);
    }
    // Oldest entry should be evicted
    expect(await cache.get('key-0')).toBeNull();
    expect(await cache.get('key-100')).toBe('value-100');
  });

  it('handles TTL expiration', async () => {
    await cache.set('expiring', 'value', 0); // 0 second TTL
    await new Promise(r => setTimeout(r, 10));
    expect(await cache.get('expiring')).toBeNull();
  });
});
```

---

*@mcv/rag — Retrieval-Augmented Generation Module*
