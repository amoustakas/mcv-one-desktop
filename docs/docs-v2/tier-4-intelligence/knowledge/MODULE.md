# @mcv/rag — Knowledge Base & RAG Module

**Package:** @mcv/rag  
**Tier:** 4 (Intelligence Layer — Knowledge)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q4 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `@mcv/rag` package implements the **Managed RAG (Retrieval-Augmented Generation) Layer** for the MCV ecosystem. Built on Google GenAI File Search, it provides multi-tenant knowledge stores where ventures can upload, index, and query documents using natural language. The system supports simple vector retrieval, synthesized answers with citations, recursive **Deep RAG** queries with automatic gap detection, LLM-based semantic reranking, and a NAOS-compatible tool interface so every AI agent in the ecosystem can tap into organizational knowledge.

Every venture gets isolated knowledge stores with configurable chunking strategies, access control via RBAC, per-operation cost tracking, and real-time progress events streamed over WebSocket. Eight default stores are pre-provisioned per SPEC-004, covering venture-specific knowledge, shared ecosystem docs, NAOS prompts, and legal/compliance materials.

**This module turns documents into queryable intelligence that every NAOS agent can reason over — with full cost attribution, budget enforcement, and audit trails.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (safe to import anywhere — client or server)
// ═══════════════════════════════════════════════════════════════════════════════

// Store types
export type {
  DataClassification,         // 'public' | 'internal' | 'confidential'
  ChunkingStrategy,           // 'semantic' | 'fixed'
  StoreConfig,                // Configuration for creating a new store
  StoreStats,                 // Store statistics (files, tokens, size, cost)
  StoreWithStats,             // Full store record with enriched stats
  StoreListOptions,           // Filter options for listing stores
} from './types/stores';

// File types
export type {
  FileStatus,                 // 'pending' | 'processing' | 'indexed' | 'failed'
  DocumentType,               // 'prd' | 'spec' | 'policy' | 'kb' | ... | 'general'
  FileMetadata,               // Tags, custom metadata, document type
  UploadParams,               // Single file upload parameters
  BulkUploadParams,           // Bulk upload parameters with concurrency control
  BulkUploadResult,           // Bulk upload outcome
  FileRecord,                 // Database file record
  FileListOptions,            // Filter options for listing files
} from './types/files';

// Query types
export type {
  MetadataFilterOperator,     // 'eq' | 'neq' | 'contains' | 'gt' | 'in' | ...
  MetadataFilterCondition,    // Single filter condition
  MetadataFilterGroup,        // AND/OR compound filter
  MetadataFilter,             // Condition | Group union
  DateRangeFilter,            // Temporal filter on upload/index dates
  QueryFilterOptions,         // Advanced filtering (types, tags, metadata, dates)
  QueryParams,                // Basic RAG query parameters
  RetrievedChunk,             // A chunk of text from the knowledge base
  QueryResult,                // Chunks-only query result
  Citation,                   // Citation reference in synthesized answer
  SynthesizedResult,          // Answer + citations + confidence
  QueryWithSynthesisParams,   // Query params with synthesis options
  RerankOptions,              // Semantic reranking options
  RankedChunk,                // Chunk with rerank score and rank delta
  RerankResult,               // Full reranking result
  ChunkScore,                 // Individual chunk scoring result
} from './types/queries';

// Deep RAG types
export type {
  DeepQueryParams,            // Recursive query parameters
  QueryNode,                  // Node in the recursive query tree
  DeepQueryResult,            // Final deep query result
  GapDetectionResult,         // Gap analysis from retrieved chunks
  RerankConfig,               // Reranking configuration
} from './types/deep-rag';

// Cost types
export type {
  CostOperation,              // 'index' | 'query' | 'rerank' | 'synthesis'
  TrackCostParams,            // Parameters for recording a cost event
  CostSummary,                // Aggregated cost report
  CostTrendPoint,             // Monthly cost data point
  CostReportParams,           // Cost report generation parameters
} from './types/costs';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS (safe to import anywhere)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_MIME_TYPES,       // 17 supported file types
  MIME_TYPE_EXTENSIONS,       // MIME → file extension mapping
  EXTENSION_TO_MIME,          // Extension → MIME mapping
  MAX_FILE_SIZE_BYTES,        // 50MB per file
  isSupportedMimeType,        // Type guard for MIME types
  getMimeTypeFromExtension,   // Extension lookup
  validateFile,               // File validation utility
} from './constants/mime-types';

export type { SupportedMimeType } from './constants/mime-types';

export {
  DEFAULT_STORE_CONFIG,       // Default store settings (2GB, 256 tokens, semantic)
  DEFAULT_QUERY_CONFIG,       // Default query settings (50 chunks, 1h cache)
  DEFAULT_DEEP_RAG_CONFIG,    // Default deep RAG (depth 3, gap threshold 0.7)
  DEFAULT_RERANK_CONFIG,      // Default reranking (top 10, batch size 5)
  INDEXING_COST_PER_1M_TOKENS,  // $0.15 per 1M tokens
  QUERY_COST_PER_1M_TOKENS,    // $0.00 (free retrieval)
  INDEXING_POLL_CONFIG,       // Polling interval and timeout
  RATE_LIMITS,                // Per-venture rate limits
  CONCURRENCY_LIMITS,         // Max concurrent operations
} from './constants/defaults';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER (import from '@mcv/rag/server')
// ═══════════════════════════════════════════════════════════════════════════════

// GenAI Client
export {
  getGenAIClient,             // Get Google GenAI singleton
  setGenAIClient,             // Inject mock for testing
  resetGenAIClient,           // Reset singleton
  isGenAIConfigured,          // Check env var presence
} from './server/genai-client';

// Core Services
export {
  StoreRegistry,              // Store lifecycle (create, read, update, delete)
  storeRegistry,              // Singleton instance
  DocumentIngestionPipeline,  // Document upload & indexing pipeline
  documentIngestion,          // Singleton instance
  FileSearchManager,          // RAG query engine with synthesis
  fileSearchManager,          // Singleton instance
  DeepRagService,             // Recursive retrieval with gap detection
  deepRagService,             // Singleton instance
  CostTracker,                // Per-operation cost tracking
  costTracker,                // Singleton instance
  SemanticRanker,             // LLM-based cross-encoder reranking
  semanticRanker,             // Singleton instance
} from './server/services';

// Gateway Integration (budget & rate limiting)
export {
  GatewayIntegration,
  gatewayIntegration,
  getGatewayIntegration,
  SynthesisBudgetExceededError,
  SynthesisRateLimitError,
  isSynthesisBudgetExceededError,
  isSynthesisRateLimitError,
} from './server/services/gateway-integration';

// Metadata Filtering
export {
  MetadataFilterService,
  metadataFilter,
} from './server/services/metadata-filter';

// Caching
export {
  createQueryCache,
  queryCache,
  InMemoryCache,
  RedisCache,
} from './server/services/cache';

// Permissions
export {
  RagPermissionsGuard,
  ragPermissions,
  PermissionDeniedError,
  RAG_RESOURCES,
  RAG_ACTIONS,
  RAG_PERMISSIONS,
} from './server/services/permissions-guard';

// Audit
export {
  RagAuditLogger,
  ragAuditLogger,
  RAG_AUDIT_CATEGORIES,
  RAG_AUDIT_ACTIONS,
} from './server/services/audit-logger';

// Default Stores (SPEC-004)
export {
  DEFAULT_STORES,
  initializeDefaultStores,
  getDefaultStoreConfig,
  getSharedStores,
  getVentureStores,
  calculateTotalEstimatedStorage,
} from './server/services/default-stores';

// Document Sync
export {
  DocumentSyncService,
  documentSync,
} from './server/services/document-sync';

// Vertex AI Ranker
export {
  VertexRanker,
  vertexRanker,
} from './server/services/vertex-ranker';

// Progress Events (real-time WebSocket)
export {
  RagProgressEvents,
  ragProgressEvents,
  RagChannels,
} from './server/services/progress-events';

// NAOS Knowledge Tool
export {
  knowledgeBaseTool,
  knowledgeBaseQuerySchema,
  validateQueryParams,
  createKnowledgeQueryTool,
} from './server/naos-tool';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (import from '@mcv/rag/client')
// ═══════════════════════════════════════════════════════════════════════════════

// Context
export {
  RagProvider,                // React context provider
  useRagContext,              // Access RAG context
  useRagTrpc,                // Get tRPC client
  useHasRagTrpc,             // Check tRPC availability
} from './client/context/rag-context';

// Store hooks
export {
  useStores,                  // List stores for venture
  useStore,                   // Get single store
  useCreateStore,             // Create store mutation
  useUpdateStore,             // Update store mutation
  useDeleteStore,             // Delete store mutation
} from './client/hooks/use-stores';

// File hooks
export {
  useFiles,                   // List files in store
  useFile,                    // Get single file
  useUploadFile,              // Upload single file
  useUploadFiles,             // Upload multiple files
  useDeleteFile,              // Delete file
} from './client/hooks/use-files';

// Query hooks
export {
  useRagQuery,                // Basic chunk retrieval
  useRagQueryWithSynthesis,   // Query with synthesized answer
  useDeepRagQuery,            // Deep RAG recursive query
  useAskKnowledgeBase,        // Simplified Q&A interface
  useResearchQuery,           // Research-mode deep query
} from './client/hooks/use-rag-query';

// Metrics hooks
export {
  useRagCosts,                // Cost summary for date range
  useRagCostTrend,            // Monthly cost trend
  useCurrentRagSpend,         // Current month spend
  useCurrentMonthCosts,       // Current month breakdown
  useLast30DaysCosts,         // Rolling 30-day costs
} from './client/hooks/use-rag-metrics';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/rag — KNOWLEDGE BASE ARCHITECTURE                      │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             ENTRY POINTS                                       │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  tRPC API    │  │ NAOS Agents  │  │  Admin UI    │  │   Webhooks   │      │   │
│  │  │  Routes      │  │  (via Tool)  │  │  Dashboard   │  │  (Realtime)  │      │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                 │                 │                 │                │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘                │   │
│  │                                    │                                            │   │
│  └────────────────────────────────────┼────────────────────────────────────────────┘   │
│                                       │                                                │
│  ┌────────────────────────────────────▼────────────────────────────────────────────┐   │
│  │                    PERMISSIONS & GATEWAY LAYER                                   │   │
│  │                                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │   │
│  │  │ RagPermissions │  │   Gateway      │  │   Rate         │                     │   │
│  │  │ Guard (RBAC)   │  │   Integration  │  │   Limiter      │                     │   │
│  │  │                │  │   (Budget)     │  │   (Venture +   │                     │   │
│  │  │ • Tier-based   │  │                │  │    User)       │                     │   │
│  │  │ • Per-resource │  │ • Pre-check    │  │                │                     │   │
│  │  │ • Venture iso  │  │ • Record spend │  │ • 20 uploads/m │                     │   │
│  │  └────────────────┘  │ • Hard limits  │  │ • 100 query/m  │                     │   │
│  │                      └────────────────┘  │ • 20 deep/m    │                     │   │
│  │                                          └────────────────┘                     │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                                │
│  ┌────────────────────────────────────▼────────────────────────────────────────────┐   │
│  │                         CORE SERVICE LAYER                                       │   │
│  │                                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │   │
│  │  │ Store Registry │  │  Document      │  │  File Search   │                     │   │
│  │  │                │  │  Ingestion     │  │  Manager       │                     │   │
│  │  │ • Create/CRUD  │  │  Pipeline      │  │                │                     │   │
│  │  │ • Access check │  │                │  │ • query()      │                     │   │
│  │  │ • getOrCreate  │  │ • Validate     │  │ • queryWith-   │                     │   │
│  │  │ • Enrich stats │  │ • Upload       │  │   Synthesis()  │                     │   │
│  │  │ • Multi-tenant │  │ • Index/poll   │  │ • Cache mgmt   │                     │   │
│  │  └────────────────┘  │ • Track cost   │  │ • Log queries  │                     │   │
│  │                      │ • Bulk upload  │  └────────────────┘                     │   │
│  │                      └────────────────┘                                          │   │
│  │                                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │   │
│  │  │ Deep RAG       │  │  Semantic      │  │  Metadata      │                     │   │
│  │  │ Service        │  │  Ranker        │  │  Filter        │                     │   │
│  │  │                │  │                │  │                │                     │   │
│  │  │ • Recursive    │  │ • LLM cross-   │  │ • Pre-filter   │                     │   │
│  │  │   retrieval    │  │   encoder      │  │   files in DB  │                     │   │
│  │  │ • Gap detect   │  │ • Batch score  │  │ • JSONB ops    │                     │   │
│  │  │ • Synthesize   │  │ • MMR diverse  │  │ • Date range   │                     │   │
│  │  │ • Query tree   │  │ • Fallback     │  │ • Tag filters  │                     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                     │   │
│  │                                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │   │
│  │  │ Cost Tracker   │  │  Document      │  │  Progress      │                     │   │
│  │  │                │  │  Sync          │  │  Events        │                     │   │
│  │  │ • Per-op cost  │  │                │  │                │                     │   │
│  │  │ • Monthly trend│  │ • Google ↔ DB  │  │ • WebSocket    │                     │   │
│  │  │ • By-store     │  │ • Orphan fix   │  │ • Upload/Index │                     │   │
│  │  │ • By-venture   │  │ • Status poll  │  │ • Query/Bulk   │                     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                     │   │
│  │                                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐                                         │   │
│  │  │ Vertex Ranker  │  │ NAOS Knowledge │                                         │   │
│  │  │ (optional)     │  │ Tool           │                                         │   │
│  │  │                │  │                │                                         │   │
│  │  │ • GCP Disc.Eng │  │ • Zod schema   │                                         │   │
│  │  │ • Batch 100    │  │ • Simple/Deep  │                                         │   │
│  │  │ • Fallback→LLM │  │ • Auto-resolve │                                         │   │
│  │  └────────────────┘  │   stores       │                                         │   │
│  │                      └────────────────┘                                         │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                                │
│  ┌────────────────────────────────────▼────────────────────────────────────────────┐   │
│  │                         STORAGE & EXTERNAL SERVICES                              │   │
│  │                                                                                  │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐   │   │
│  │  │   Google GenAI       │  │   PostgreSQL          │  │   Redis / Memory     │   │   │
│  │  │   File Search        │  │   (Drizzle ORM)       │  │   Cache              │   │   │
│  │  │                      │  │                       │  │                      │   │   │
│  │  │  ┌────────────────┐  │  │  file_search_stores   │  │  Query results       │   │   │
│  │  │  │ corpora/xxx    │  │  │  file_search_files    │  │  LRU (1000 entries)  │   │   │
│  │  │  │ documents/yyy  │  │  │  rag_query_logs       │  │  TTL: 1 hour         │   │   │
│  │  │  │                │  │  │  file_search_costs    │  │  Redis fallback      │   │   │
│  │  │  │ Vector index   │  │  │  rag_audit_logs       │  │                      │   │   │
│  │  │  │ Grounding API  │  │  │                       │  │  @upstash/redis      │   │   │
│  │  │  └────────────────┘  │  │  5 tables, 18 indexes │  │  (serverless)        │   │   │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘   │   │
│  │                                                                                  │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                              │   │
│  │  │   @mcv/gateway       │  │   @mcv/realtime       │                              │   │
│  │  │   (LLM Gateway)      │  │   (WebSocket)         │                              │   │
│  │  │                      │  │                       │                              │   │
│  │  │  • Synthesis calls   │  │  • Progress events    │                              │   │
│  │  │  • Gap detection     │  │  • Upload tracking    │                              │   │
│  │  │  • Reranking scores  │  │  • Query status       │                              │   │
│  │  │  • Budget enforce    │  │  • Bulk progress      │                              │   │
│  │  └──────────────────────┘  └──────────────────────┘                              │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Store Types

```typescript
/**
 * Data classification levels for access control
 */
type DataClassification = 'public' | 'internal' | 'confidential';

/**
 * Chunking strategy for document indexing
 */
type ChunkingStrategy = 'semantic' | 'fixed';

/**
 * Configuration for creating a new store
 */
interface StoreConfig {
  displayName: string;              // Human-readable name
  description?: string;             // Optional description
  ventureId?: string;               // Venture ID (null = shared store)
  isShared?: boolean;               // Shared across ventures
  maxSizeBytes?: number;            // Max storage (default: 2GB)
  chunkMaxTokens?: number;          // Tokens per chunk (default: 256)
  chunkOverlap?: number;            // Overlap tokens (default: 64)
  chunkingStrategy?: ChunkingStrategy; // 'semantic' | 'fixed'
  dataClassification?: DataClassification; // Default: 'internal'
  allowedVentures?: string[];       // Venture IDs allowed to query
  requiredRoles?: string[];         // Roles required for access
}

/**
 * Store with enriched statistics
 */
interface StoreWithStats {
  id: string;                       // Database UUID
  storeId: string;                  // Unique store identifier
  googleStoreName: string;          // Google corpus reference
  displayName: string;
  description?: string;
  ventureId?: string;               // Owner venture (null = shared)
  ventureName?: string;             // Resolved venture name
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

/**
 * Store statistics
 */
interface StoreStats {
  totalFiles: number;
  totalTokens: number;
  totalSizeBytes: number;
  indexingCostUsd: number;
  pendingFiles: number;
  failedFiles: number;
}
```

### File Types

```typescript
/**
 * File processing status lifecycle:
 * pending → processing → indexed (success) or failed (error)
 */
type FileStatus = 'pending' | 'processing' | 'indexed' | 'failed';

/**
 * Document type categories for filtering
 */
type DocumentType =
  | 'prd'       // Product Requirements Document
  | 'spec'      // Technical Specification
  | 'policy'    // Policy Document
  | 'kb'        // Knowledge Base Article
  | 'guide'     // User Guide
  | 'api'       // API Documentation
  | 'code'      // Code/Source files
  | 'contract'  // Legal contracts
  | 'report'    // Reports and analytics
  | 'general';  // General Document

/**
 * File metadata for enrichment and filtering
 */
interface FileMetadata {
  documentType?: DocumentType;
  tags?: string[];
  customMetadata?: Record<string, string>;
}

/**
 * File upload parameters
 */
interface UploadParams {
  storeId: string;
  file: Buffer | Blob;
  filename: string;
  mimeType: string;
  ventureId: string;
  metadata?: FileMetadata;
}

/**
 * Bulk upload parameters with concurrency control
 */
interface BulkUploadParams {
  storeId: string;
  ventureId: string;
  files: Array<{
    file: Buffer | Blob;
    filename: string;
    mimeType: string;
    metadata?: FileMetadata;
  }>;
  concurrency?: number;  // Default: 5
}

/**
 * Bulk upload result
 */
interface BulkUploadResult {
  uploaded: number;
  failed: number;
  totalTokens: number;
  totalCost: number;
  errors: Array<{ filename: string; error: string }>;
}

/**
 * Database file record
 */
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
/**
 * Metadata filter operators for advanced queries
 */
type MetadataFilterOperator =
  | 'eq' | 'neq'                    // Equality
  | 'contains' | 'startsWith' | 'endsWith'  // String ops
  | 'gt' | 'gte' | 'lt' | 'lte'    // Numeric comparison
  | 'in' | 'notIn'                  // Array membership
  | 'exists' | 'notExists';         // Field presence

/**
 * Single filter condition
 */
interface MetadataFilterCondition {
  field: string;
  operator: MetadataFilterOperator;
  value: string | number | boolean | string[] | number[];
}

/**
 * Compound filter with AND/OR logic
 */
interface MetadataFilterGroup {
  logic: 'and' | 'or';
  conditions: Array<MetadataFilterCondition | MetadataFilterGroup>;
}

/**
 * Advanced filter options for RAG queries
 */
interface QueryFilterOptions {
  documentTypes?: DocumentType[];      // Filter by document type(s)
  tags?: string[];                     // Any tag matches
  tagsAll?: string[];                  // All tags must match
  excludeTags?: string[];              // Exclude these tags
  metadata?: MetadataFilter;           // Custom metadata filter
  dateRange?: DateRangeFilter;         // Temporal filter
  fileIds?: string[];                  // Include specific files
  excludeFileIds?: string[];           // Exclude specific files
  minRelevanceScore?: number;          // Minimum score (0-1)
}

/**
 * Basic RAG query parameters
 */
interface QueryParams {
  query: string;                       // Natural language query
  storeIds: string[];                  // Stores to search
  ventureId: string;                   // Venture context
  userId?: string;                     // User for logging
  agentType?: string;                  // Agent type for analytics
  maxChunks?: number;                  // Max chunks (default: 50)
  filters?: QueryFilterOptions;        // Advanced filters
  useCache?: boolean;                  // Use cached results (default: true)
}

/**
 * Retrieved text chunk from knowledge base
 */
interface RetrievedChunk {
  text: string;                        // Chunk content
  source: string;                      // Source URI
  fileName: string;                    // Original file name
  relevanceScore?: number;             // 0-1 relevance score
  chunkIndex?: number;                 // Position in document
  metadata?: Record<string, unknown>;  // Additional metadata
}

/**
 * Query result (chunks only, no synthesis)
 */
interface QueryResult {
  chunks: RetrievedChunk[];
  totalChunks: number;
  latencyMs: number;
  cacheHit: boolean;
}

/**
 * Synthesized result with citations
 */
interface SynthesizedResult {
  answer: string;
  citations: Citation[];
  confidence: number;                  // 0-1
  chunksUsed: number;
  latencyMs: number;
  tokenUsage?: {
    queryTokens: number;
    synthesisTokens: number;
  };
}

/**
 * Citation reference
 */
interface Citation {
  fileName: string;
  source: string;
  relevantText: string;
  chunkIndex: number;
  relevanceScore?: number;
}

/**
 * Ranked chunk after semantic reranking
 */
interface RankedChunk extends RetrievedChunk {
  rerankScore: number;                 // Semantic relevance (0-1)
  originalRank: number;                // Rank before reranking
  rankDelta: number;                   // Position change (+ = moved up)
}
```

### Deep RAG Types

```typescript
/**
 * Deep RAG query parameters — recursive retrieval with gap detection
 */
interface DeepQueryParams {
  query: string;
  storeIds: string[];
  ventureId: string;
  userId?: string;
  agentType?: string;
  maxDepth?: number;                   // Default: 3
  gapThreshold?: number;              // 0-1, default: 0.7
  maxGapsPerLevel?: number;           // Default: 3
  synthesisModel?: string;            // Default: 'gemini-2.0-flash'
  temperature?: number;
  useGateway?: boolean;               // Use MCV Gateway (default: true)
  skipBudgetCheck?: boolean;
  skipRateLimitCheck?: boolean;
}

/**
 * Node in the recursive query tree
 */
interface QueryNode {
  query: string;                       // Query at this node
  chunks: RetrievedChunk[];            // Retrieved chunks
  gaps: string[];                      // Detected knowledge gaps
  depth: number;                       // Level (0 = root)
  children: QueryNode[];               // Follow-up query nodes
  partialAnswer?: string;
  tokenUsage?: {
    retrievalTokens: number;
    synthesisTokens: number;
  };
}

/**
 * Deep RAG query result
 */
interface DeepQueryResult {
  answer: string;                      // Final synthesized answer
  citations: Citation[];               // All citations used
  confidence: number;                  // 0-1
  chunksUsed: number;                  // Total across all levels
  latencyMs: number;
  queryTree: QueryNode;                // Full tree for transparency
  totalQueries: number;                // Sub-queries executed
  depth: number;                       // Max depth reached
  tokenUsage: {
    retrievalTokens: number;
    synthesisTokens: number;
    totalTokens: number;
  };
  cost?: {
    retrievalCost: number;
    synthesisCost: number;
    totalCost: number;
  };
}

/**
 * Gap detection result
 */
interface GapDetectionResult {
  gaps: string[];                      // Follow-up queries to fill gaps
  coverage: number;                    // 0-1, how well chunks answer query
  needsMoreRetrieval: boolean;
}
```

### NAOS Tool Types

```typescript
/**
 * NAOS-compatible tool for knowledge base queries
 */
interface KnowledgeBaseQueryParams {
  query: string;                       // Max 2000 chars
  storeIds?: string[];                 // Auto-resolves if omitted
  documentType?: DocumentType;
  tags?: string[];
  maxChunks?: number;                  // 1-50, default: 10
  deepQuery?: boolean;                 // Default: false
  maxDepth?: number;                   // 1-5, default: 2
  includeQueryTree?: boolean;          // Default: false
}

/**
 * Tool execution context
 */
interface ToolExecutionContext {
  ventureId: string;
  userId?: string;
  agentType?: string;
  taskId?: string;
  sessionId?: string;
}

/**
 * Tool query result
 */
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
/**
 * RAG resources for RBAC
 */
const RAG_RESOURCES = {
  STORES: 'rag:stores',
  FILES: 'rag:files',
  QUERIES: 'rag:queries',
  ADMIN: 'rag:admin',
} as const;

/**
 * RAG actions
 */
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

/**
 * Pre-built permission strings
 */
const RAG_PERMISSIONS = {
  STORES_CREATE: 'rag:stores:create',
  STORES_READ: 'rag:stores:read',
  STORES_UPDATE: 'rag:stores:update',
  STORES_DELETE: 'rag:stores:delete',
  STORES_CONFIGURE: 'rag:stores:configure',
  FILES_UPLOAD: 'rag:files:upload',
  FILES_READ: 'rag:files:read',
  FILES_DELETE: 'rag:files:delete',
  FILES_EXPORT: 'rag:files:export',
  QUERIES_EXECUTE: 'rag:queries:query',
  QUERIES_DEEP: 'rag:queries:deep',
  QUERIES_VIEW_HISTORY: 'rag:queries:read',
  ADMIN_ALL: 'rag:admin:*',
  ADMIN_COSTS: 'rag:admin:manage-costs',
  ADMIN_METRICS: 'rag:admin:view-metrics',
} as const;

/**
 * Permission context for checks
 */
interface PermissionContext {
  userId: string;
  ventureId: string;
  tier?: 0 | 1 | 2 | 3;  // 0 = Super Admin
  roles?: string[];
  permissions?: string[];
}

/**
 * Tier requirements by operation:
 *   Tier 0: Full access (Super Admin)
 *   Tier 1: Create/delete stores, configure, manage costs
 *   Tier 2: Deep queries, upload files
 *   Tier 3: Basic queries, read stores/files
 */
```

---

## Database Schema

### file_search_stores — Knowledge Repositories

```typescript
export const fileSearchStores = pgTable(
  'file_search_stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: text('store_id').notNull().unique(),
    googleStoreName: text('google_store_name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),

    // Ownership
    ventureId: uuid('venture_id').references(() => ventures.id),
    isShared: boolean('is_shared').default(false).notNull(),

    // Size limits
    maxSizeBytes: bigint('max_size_bytes', { mode: 'number' })
      .default(2147483648).notNull(),  // 2GB

    // Chunking configuration
    chunkMaxTokens: integer('chunk_max_tokens').default(256).notNull(),
    chunkOverlap: integer('chunk_overlap').default(64).notNull(),
    chunkingStrategy: varchar('chunking_strategy', { length: 16 })
      .default('semantic').notNull(),

    // Access control
    allowedVentures: text('allowed_ventures').array().default([]),
    requiredRoles: text('required_roles').array().default([]),
    dataClassification: varchar('data_classification', { length: 16 })
      .default('internal').notNull(),

    // Metrics (denormalized for fast reads)
    totalFiles: integer('total_files').default(0).notNull(),
    totalTokens: bigint('total_tokens', { mode: 'number' }).default(0).notNull(),
    totalSizeBytes: bigint('total_size_bytes', { mode: 'number' }).default(0).notNull(),
    indexingCostUsd: decimal('indexing_cost_usd', { precision: 10, scale: 4 })
      .default('0').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('file_search_stores_venture_idx').on(table.ventureId),
    index('file_search_stores_shared_idx').on(table.isShared),
    index('file_search_stores_classification_idx').on(table.dataClassification),
  ]
);
```

### file_search_files — Indexed Documents

```typescript
export const fileSearchFiles = pgTable(
  'file_search_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .references(() => fileSearchStores.id, { onDelete: 'cascade' }).notNull(),
    googleFileName: text('google_file_name').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    tokenCount: integer('token_count'),

    // Ownership
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

    // Metadata for filtering
    documentType: varchar('document_type', { length: 32 }),
    tags: text('tags').array().default([]),
    customMetadata: jsonb('custom_metadata').default({})
      .$type<Record<string, string>>(),

    // Status lifecycle: pending → processing → indexed | failed
    status: varchar('status', { length: 16 }).default('pending').notNull(),
    errorMessage: text('error_message'),

    // Timestamps
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
  },
  (table) => [
    index('file_search_files_store_idx').on(table.storeId),
    index('file_search_files_status_idx').on(table.status),
    index('file_search_files_venture_idx').on(table.ventureId),
    index('file_search_files_document_type_idx').on(table.documentType),
  ]
);
```

### rag_query_logs — Query Analytics

```typescript
export const ragQueryLogs = pgTable(
  'rag_query_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeIds: text('store_ids').array().notNull(),
    query: text('query').notNull(),
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
    userId: uuid('user_id').references(() => users.id),
    agentType: varchar('agent_type', { length: 32 }),

    // Results
    chunksRetrieved: integer('chunks_retrieved'),
    chunksAfterRerank: integer('chunks_after_rerank'),
    synthesizedAnswer: text('synthesized_answer'),  // Truncated to 5000 chars
    citations: text('citations').array(),
    confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),

    // Performance
    latencyMs: integer('latency_ms'),
    cacheHit: boolean('cache_hit').default(false).notNull(),
    depth: integer('depth').default(1).notNull(),  // 1 = simple, >1 = Deep RAG

    // Token usage
    queryTokens: integer('query_tokens'),
    synthesisTokens: integer('synthesis_tokens'),
    costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('rag_query_logs_venture_idx').on(table.ventureId),
    index('rag_query_logs_created_idx').on(table.createdAt),
    index('rag_query_logs_agent_type_idx').on(table.agentType),
    index('rag_query_logs_user_idx').on(table.userId),
  ]
);
```

### file_search_costs — Cost Attribution

```typescript
export const fileSearchCosts = pgTable(
  'file_search_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
    storeId: uuid('store_id').references(() => fileSearchStores.id),
    fileId: uuid('file_id').references(() => fileSearchFiles.id),
    operation: varchar('operation', { length: 16 }).notNull(),  // index|query|rerank|synthesis
    tokenCount: integer('token_count').notNull(),
    costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('file_search_costs_venture_created_idx').on(table.ventureId, table.createdAt),
    index('file_search_costs_store_idx').on(table.storeId),
    index('file_search_costs_operation_idx').on(table.operation),
  ]
);
```

### rag_audit_logs — Compliance & Security

```typescript
export const ragAuditLogs = pgTable(
  'rag_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Actor
    actorType: varchar('actor_type', { length: 16 }).notNull(),  // user|system|api_key|agent
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name'),
    actorEmail: text('actor_email'),
    agentType: varchar('agent_type', { length: 32 }),

    // Action
    action: varchar('action', { length: 64 }).notNull(),
    category: varchar('category', { length: 32 }).notNull(),   // rag:store|rag:file|rag:query|rag:admin

    // Resource
    resourceType: varchar('resource_type', { length: 16 }).notNull(),
    resourceId: text('resource_id').notNull(),
    resourceName: text('resource_name'),
    storeId: uuid('store_id').references(() => fileSearchStores.id),

    // Context
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),

    // Outcome
    outcome: varchar('outcome', { length: 16 }).notNull(),  // success|failure|error
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('rag_audit_logs_venture_idx').on(table.ventureId),
    index('rag_audit_logs_actor_idx').on(table.actorId),
    index('rag_audit_logs_action_idx').on(table.action),
    index('rag_audit_logs_created_idx').on(table.createdAt),
    index('rag_audit_logs_store_idx').on(table.storeId),
  ]
);
```

---

## Default Stores (SPEC-004)

The system provisions 8 core knowledge stores during setup:

| Store ID | Display Name | Venture | Shared | Classification | Est. Size |
|----------|-------------|---------|--------|----------------|-----------|
| `betedge-knowledge-v1` | BetEdge AI Knowledge | betedge | No | internal | 500 MB |
| `mcv-studios-knowledge-v1` | MCV Studios Knowledge | mcv-studios | No | internal | 800 MB |
| `edgeiq-knowledge-v1` | EdgeIQ Markets Knowledge | edgeiq | No | confidential | 400 MB |
| `futurestate-knowledge-v1` | Futurestate RWA Knowledge | futurestate | No | confidential | 600 MB |
| `mcv-ecosystem-shared-v1` | MCV Ecosystem Shared | — | **Yes** | internal | 1.2 GB |
| `naos-prompts-v1` | NAOS Instrument Bank | — | **Yes** | internal | 200 MB |
| `legal-compliance-v1` | Legal & Compliance | — | **Yes** | confidential | 400 MB |
| `grant-concierge-v1` | Grant Concierge Knowledge | grant-concierge | No | internal | 300 MB |

**Total estimated storage: ~4.4 GB across 8 stores.**

All stores use `semantic` chunking with 512 max tokens and 64 overlap, except `naos-prompts-v1` which uses `fixed` chunking with 256 tokens and 32 overlap (prompts need precise boundaries).

---

## Supported File Types

| MIME Type | Extensions | Category |
|-----------|-----------|----------|
| `application/pdf` | .pdf | Documents |
| `text/plain` | .txt | Text |
| `text/markdown` | .md, .markdown | Text |
| `text/html` | .html, .htm | Web |
| `text/csv` | .csv | Data |
| `application/json` | .json | Data |
| `application/vnd...wordprocessingml.document` | .docx | Documents |
| `application/vnd...spreadsheetml.sheet` | .xlsx | Documents |
| `application/vnd...presentationml.presentation` | .pptx | Documents |
| `text/x-python` | .py | Code |
| `text/javascript` | .js, .jsx, .mjs | Code |
| `text/typescript` | .ts, .tsx | Code |
| `text/x-java-source` | .java | Code |
| `text/x-c` | .c, .h | Code |
| `text/x-c++src` | .cpp, .hpp, .cc, .cxx | Code |
| `text/x-go` | .go | Code |
| `text/x-rust` | .rs | Code |

**Maximum file size: 50 MB per file.**

---

## Usage Examples

### Example 1 — Create a Knowledge Store

```typescript
import { storeRegistry } from '@mcv/rag/server';

const store = await storeRegistry.create({
  displayName: 'Product Documentation',
  description: 'All product specs, PRDs, and user guides',
  ventureId: 'betedge-venture-uuid',
  maxSizeBytes: 1024 * 1024 * 1024, // 1GB
  chunkingStrategy: 'semantic',
  chunkMaxTokens: 512,
  chunkOverlap: 64,
  dataClassification: 'internal',
  allowedVentures: ['mcv-shared-uuid'], // Cross-venture access
});

console.log(`Created store: ${store.storeId}`);
console.log(`Google ref: ${store.googleStoreName}`);
console.log(`Stats: ${store.stats.totalFiles} files, ${store.stats.totalTokens} tokens`);
```

### Example 2 — Upload a Document

```typescript
import { documentIngestion } from '@mcv/rag/server';
import { readFileSync } from 'fs';

const buffer = readFileSync('./product-roadmap.pdf');

const file = await documentIngestion.ingest({
  storeId: 'store_1707000000_abc1234',
  file: buffer,
  filename: 'product-roadmap-2026.pdf',
  mimeType: 'application/pdf',
  ventureId: 'betedge-venture-uuid',
  metadata: {
    documentType: 'prd',
    tags: ['roadmap', '2026', 'product'],
    customMetadata: {
      author: 'Product Team',
      version: '3.0',
      quarter: 'Q1-2026',
    },
  },
});

console.log(`Indexed: ${file.originalFilename}`);
console.log(`Status: ${file.status}`);
console.log(`Tokens: ${file.tokenCount}`);
```

### Example 3 — Bulk Upload Documents

```typescript
import { documentIngestion } from '@mcv/rag/server';

const result = await documentIngestion.bulkIngest({
  storeId: 'mcv-ecosystem-shared-v1',
  ventureId: 'mcv-core-uuid',
  files: [
    { file: buffer1, filename: 'arch-overview.md', mimeType: 'text/markdown' },
    { file: buffer2, filename: 'api-spec.json', mimeType: 'application/json' },
    { file: buffer3, filename: 'deploy-guide.pdf', mimeType: 'application/pdf' },
  ],
  concurrency: 3,  // Process 3 files simultaneously
});

console.log(`Uploaded: ${result.uploaded}, Failed: ${result.failed}`);
console.log(`Total tokens: ${result.totalTokens}`);
console.log(`Total cost: $${result.totalCost.toFixed(4)}`);

if (result.errors.length > 0) {
  for (const err of result.errors) {
    console.error(`  ✗ ${err.filename}: ${err.error}`);
  }
}
```

### Example 4 — Simple RAG Query (Chunks Only)

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.query({
  query: 'What are the key features of our Q1 2026 product roadmap?',
  storeIds: ['betedge-knowledge-v1', 'mcv-ecosystem-shared-v1'],
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  agentType: 'ralph',
  filters: {
    documentTypes: ['prd', 'spec'],
    tags: ['roadmap'],
    minRelevanceScore: 0.5,
  },
  useCache: true,
});

console.log(`Found ${result.totalChunks} chunks (cache: ${result.cacheHit})`);
console.log(`Latency: ${result.latencyMs}ms`);

for (const chunk of result.chunks) {
  console.log(`  [${chunk.relevanceScore?.toFixed(2)}] ${chunk.fileName}`);
  console.log(`    ${chunk.text.slice(0, 150)}...`);
}
```

### Example 5 — Query with Synthesis (Answer + Citations)

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.queryWithSynthesis({
  query: 'Summarize our data privacy policy for Canadian customers',
  storeIds: ['legal-compliance-v1'],
  ventureId: 'betedge-venture-uuid',
  userId: 'user-456',
  agentType: 'ralph',
  systemPrompt: 'You are a legal assistant. Provide precise, actionable summaries.',
  synthesisModel: 'gemini-2.0-flash',
  temperature: 0.3,
});

console.log(`Answer (${result.confidence * 100}% confidence):`);
console.log(result.answer);
console.log(`\nCitations (${result.citations.length}):`);
for (const cite of result.citations) {
  console.log(`  📄 ${cite.fileName} — "${cite.relevantText.slice(0, 80)}..."`);
}
console.log(`Tokens: ${result.tokenUsage?.queryTokens} in / ${result.tokenUsage?.synthesisTokens} out`);
```

### Example 6 — Deep RAG Query (Recursive with Gap Detection)

```typescript
import { deepRagService } from '@mcv/rag/server';

const result = await deepRagService.deepQuery({
  query: 'What is the complete financial health picture across all ventures?',
  storeIds: [
    'betedge-knowledge-v1',
    'edgeiq-knowledge-v1',
    'futurestate-knowledge-v1',
    'mcv-ecosystem-shared-v1',
  ],
  ventureId: 'mcv-core-uuid',
  userId: 'user-admin',
  agentType: 'queen',
  maxDepth: 3,
  gapThreshold: 0.7,
  maxGapsPerLevel: 3,
  useGateway: true,
});

console.log(`Deep RAG Result:`);
console.log(`  Answer: ${result.answer.slice(0, 200)}...`);
console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
console.log(`  Total queries: ${result.totalQueries}`);
console.log(`  Depth reached: ${result.depth}`);
console.log(`  Chunks used: ${result.chunksUsed}`);
console.log(`  Latency: ${result.latencyMs}ms`);
console.log(`  Tokens: ${result.tokenUsage.totalTokens}`);
console.log(`  Cost: $${result.cost?.totalCost.toFixed(4)}`);
console.log(`  Citations: ${result.citations.length} sources`);

// Inspect the query tree for transparency
const printTree = (node: QueryNode, indent = 0) => {
  const pad = '  '.repeat(indent);
  console.log(`${pad}Query: "${node.query.slice(0, 60)}..."`);
  console.log(`${pad}  Chunks: ${node.chunks.length}, Gaps: ${node.gaps.length}`);
  for (const child of node.children) {
    printTree(child, indent + 1);
  }
};
printTree(result.queryTree);
```

### Example 7 — Semantic Reranking

```typescript
import { semanticRanker, fileSearchManager } from '@mcv/rag/server';

// First, get raw chunks
const rawResult = await fileSearchManager.query({
  query: 'How does the authentication system work?',
  storeIds: ['mcv-ecosystem-shared-v1'],
  ventureId: 'mcv-core-uuid',
  maxChunks: 50,
});

// Rerank with semantic scoring
const reranked = await semanticRanker.rerank(
  'How does the authentication system work?',
  rawResult.chunks,
  {
    topK: 10,
    threshold: 0.3,
    batchScoring: true,
    batchSize: 5,
    ventureId: 'mcv-core-uuid',
  }
);

console.log(`Reranked ${reranked.totalProcessed} → ${reranked.chunks.length} chunks`);
console.log(`Filtered: ${reranked.filteredCount} below threshold`);
console.log(`Latency: ${reranked.latencyMs}ms`);

for (const chunk of reranked.chunks) {
  const delta = chunk.rankDelta > 0 ? `↑${chunk.rankDelta}` : chunk.rankDelta < 0 ? `↓${Math.abs(chunk.rankDelta)}` : '=';
  console.log(`  [${chunk.rerankScore.toFixed(2)}] (${delta}) ${chunk.fileName}`);
}

// Rerank with diversity (MMR-style)
const diverse = await semanticRanker.rerankWithDiversity(
  'How does the authentication system work?',
  rawResult.chunks,
  { topK: 10 },
  0.2  // 20% diversity weight
);
```

### Example 8 — NAOS Agent Tool Integration

```typescript
import { knowledgeBaseTool, createKnowledgeQueryTool } from '@mcv/rag/server';

// Register tool with gateway
gateway.registerTool(knowledgeBaseTool);

// Execute directly (used by NAOS agents)
const result = await knowledgeBaseTool.execute(
  {
    query: 'What are the compliance requirements for Ontario gaming?',
    documentType: 'policy',
    maxChunks: 15,
    deepQuery: false,
  },
  {
    ventureId: 'betedge-venture-uuid',
    agentType: 'ralph',
    userId: 'agent-ralph-session-123',
  }
);

if (result.success) {
  console.log(`Answer: ${result.answer}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Citations: ${result.citations.length}`);
} else {
  console.error(`Query failed: ${result.error}`);
}

// Create simplified tool for external use
const kbTool = createKnowledgeQueryTool('default-venture-uuid');
const externalResult = await kbTool.execute(
  { query: 'How to submit a grant application?' },
  { agentType: 'custom' }
);
```

### Example 9 — Advanced Metadata Filtering

```typescript
import { fileSearchManager } from '@mcv/rag/server';

const result = await fileSearchManager.query({
  query: 'Critical security vulnerabilities',
  storeIds: ['mcv-ecosystem-shared-v1'],
  ventureId: 'mcv-core-uuid',
  filters: {
    // Document type filter
    documentTypes: ['spec', 'report'],

    // Tags (any match)
    tags: ['security', 'vulnerability'],

    // Exclude certain tags
    excludeTags: ['archived', 'draft'],

    // Date range
    dateRange: {
      field: 'uploadedAt',
      from: '2025-01-01',
      to: '2026-12-31',
    },

    // Custom metadata filter (compound AND/OR logic)
    metadata: {
      logic: 'and',
      conditions: [
        { field: 'severity', operator: 'in', value: ['critical', 'high'] },
        { field: 'status', operator: 'neq', value: 'resolved' },
        {
          logic: 'or',
          conditions: [
            { field: 'team', operator: 'eq', value: 'platform' },
            { field: 'team', operator: 'eq', value: 'security' },
          ],
        },
      ],
    },

    // Minimum relevance
    minRelevanceScore: 0.6,
  },
});
```

### Example 10 — Cost Tracking & Reporting

```typescript
import { costTracker } from '@mcv/rag/server';

// Get cost summary for a venture
const summary = await costTracker.getSummary(
  'betedge-venture-uuid',
  new Date('2026-01-01'),
  new Date('2026-02-01')
);

console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
console.log(`  Indexing:  $${summary.indexingCost.toFixed(4)}`);
console.log(`  Queries:   $${summary.queryCost.toFixed(4)}`);
console.log(`  Reranking: $${summary.rerankCost.toFixed(4)}`);
console.log(`  Synthesis: $${summary.synthesisCost.toFixed(4)}`);
console.log(`  Tokens:    ${summary.totalTokens.toLocaleString()}`);

console.log('\nBy store:');
for (const store of summary.byStore) {
  console.log(`  ${store.displayName}: $${store.cost.toFixed(4)} (${store.tokens} tokens)`);
}

// Monthly trend
const trend = await costTracker.getMonthlyTrend('betedge-venture-uuid', 6);
for (const point of trend) {
  console.log(`  ${point.month}: $${point.cost.toFixed(2)} (${point.tokens} tokens)`);
}

// Current month spend
const currentSpend = await costTracker.getCurrentMonthSpend('betedge-venture-uuid');
console.log(`Current month: $${currentSpend.toFixed(4)}`);
```

### Example 11 — Real-Time Progress Events

```typescript
import { ragProgressEvents, RagChannels } from '@mcv/rag/server';

// Subscribe to upload events
const sub = ragProgressEvents.on('rag:upload:completed', (event) => {
  console.log(`✓ ${event.payload.filename} indexed`);
  console.log(`  Tokens: ${event.payload.tokenCount}`);
  console.log(`  Cost: $${event.payload.costUsd.toFixed(4)}`);
  console.log(`  Duration: ${event.payload.durationMs}ms`);
});

// Subscribe to all RAG events
const allSub = ragProgressEvents.onAny((event) => {
  console.log(`[${event.type}] ${JSON.stringify(event.payload)}`);
});

// WebSocket channel names for client subscriptions
const channels = {
  uploads: RagChannels.ventureUploads('betedge-venture-uuid'),
  // → "rag:venture:betedge-venture-uuid:uploads"
  fileProgress: RagChannels.fileProgress('file-uuid'),
  // → "rag:file:file-uuid:progress"
  storeActivity: RagChannels.storeActivity('store-id'),
  // → "rag:store:store-id:activity"
  batchProgress: RagChannels.batchProgress('batch-uuid'),
  // → "rag:batch:batch-uuid:progress"
  queryProgress: RagChannels.queryProgress('query-uuid'),
  // → "rag:query:query-uuid:progress"
};

// Clean up
sub.unsubscribe();
allSub.unsubscribe();
```

### Example 12 — Document Sync & Orphan Detection

```typescript
import { documentSync } from '@mcv/rag/server';

// Sync all documents in a store with Google
const syncResult = await documentSync.syncStoreDocuments('betedge-knowledge-v1');

console.log(`Synced: ${syncResult.synced}/${syncResult.totalFiles}`);
console.log(`Updated: ${syncResult.updated}`);
console.log(`Failed: ${syncResult.failed}`);

// Detect and reconcile orphaned files
const orphans = await documentSync.reconcileOrphans('betedge-knowledge-v1', {
  deleteDbOrphans: false,        // Mark as failed instead
  createGoogleOrphans: true,     // Create DB records for Google-only files
  defaultVentureId: 'betedge-venture-uuid',
});

console.log(`DB orphans: ${orphans.databaseOrphans.length}`);
console.log(`Google orphans: ${orphans.googleOrphans.length}`);

for (const action of orphans.actions) {
  console.log(`  ${action.orphan.name}: ${action.action}`);
}

// Check sync status
const status = await documentSync.getSyncStatus('betedge-knowledge-v1');
console.log(`Files: ${status.totalFiles}`);
console.log(`  Indexed: ${status.byStatus.indexed}`);
console.log(`  Pending: ${status.byStatus.pending}`);
console.log(`  Processing: ${status.byStatus.processing}`);
console.log(`  Failed: ${status.byStatus.failed}`);
console.log(`  Needs sync: ${status.needsSync}`);
```

### Example 13 — Permission Checks

```typescript
import { ragPermissions, RAG_RESOURCES, RAG_ACTIONS, PermissionDeniedError } from '@mcv/rag/server';

const userContext = {
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  tier: 2 as const,
  permissions: ['rag:queries:query', 'rag:files:upload'],
};

// Check if user can create stores
const canCreate = await ragPermissions.canCreateStore(userContext);
console.log(`Can create stores: ${canCreate.allowed}`); // false (requires tier 1)

// Check if user can query
const canQuery = await ragPermissions.canQuery(userContext);
console.log(`Can query: ${canQuery.allowed}`); // true

// Check if user can deep query
const canDeep = await ragPermissions.canDeepQuery(userContext);
console.log(`Can deep query: ${canDeep.allowed}`); // true (tier 2+)

// Assert permission (throws on denial)
try {
  await ragPermissions.assert(
    userContext,
    RAG_RESOURCES.STORES,
    RAG_ACTIONS.DELETE,
  );
} catch (error) {
  if (error instanceof PermissionDeniedError) {
    console.error(`Permission denied: ${error.message}`);
  }
}

// Get required tier for an operation
const requiredTier = ragPermissions.getRequiredTier(
  RAG_RESOURCES.STORES,
  RAG_ACTIONS.CREATE
);
console.log(`Create store requires tier: ${requiredTier}`); // 1
```

### Example 14 — Gateway Budget Integration

```typescript
import {
  gatewayIntegration,
  SynthesisBudgetExceededError,
  SynthesisRateLimitError,
} from '@mcv/rag/server';

// Check budget before synthesis
const budgetCheck = await gatewayIntegration.checkBudgetForSynthesis({
  ventureId: 'betedge-venture-uuid',
  estimatedInputTokens: 5000,
  userId: 'user-123',
  agentType: 'ralph',
});

if (!budgetCheck.allowed) {
  console.error(`Budget check failed: ${budgetCheck.reason}`);
  console.log(`Daily remaining: $${budgetCheck.budgetStatus.dailyRemaining.toFixed(2)}`);
}

// Get remaining budget info
const budget = await gatewayIntegration.getRemainingBudget('betedge-venture-uuid');

console.log(`Daily remaining: $${budget.dailyRemainingUsd.toFixed(2)}`);
console.log(`Monthly remaining: $${budget.monthlyRemainingUsd.toFixed(2)}`);
console.log(`Est. daily syntheses remaining: ${budget.estimatedDailySynthesesRemaining}`);
if (budget.warning) {
  console.warn(`⚠️ ${budget.warning}`);
}

// Handle budget/rate errors in queries
try {
  const result = await fileSearchManager.queryWithSynthesis({
    query: 'Summarize all Q4 reports',
    storeIds: ['betedge-knowledge-v1'],
    ventureId: 'betedge-venture-uuid',
  });
} catch (error) {
  if (error instanceof SynthesisBudgetExceededError) {
    console.error(`Budget exceeded for ${error.ventureId}: ${error.reason}`);
  } else if (error instanceof SynthesisRateLimitError) {
    console.error(`Rate limited. Retry after: ${error.retryAfterSeconds}s`);
  }
}
```

### Example 15 — Client-Side React Hooks

```tsx
import {
  RagProvider,
  useStores,
  useUploadFile,
  useAskKnowledgeBase,
  useDeepRagQuery,
  useCurrentMonthCosts,
} from '@mcv/rag/client';

// Wrap app with provider
function App() {
  return (
    <RagProvider trpcClient={trpc}>
      <KnowledgeSearch />
    </RagProvider>
  );
}

// Knowledge search component
function KnowledgeSearch() {
  const { data: stores, isLoading } = useStores();
  const askKB = useAskKnowledgeBase();
  const deepQuery = useDeepRagQuery();
  const upload = useUploadFile();
  const { data: costs } = useCurrentMonthCosts();

  const handleSearch = async (query: string) => {
    if (!stores?.length) return;

    const result = await askKB.ask(
      query,
      stores.map((s) => s.storeId)
    );

    console.log(result.answer);
    console.log(result.citations);
  };

  const handleDeepSearch = async (query: string) => {
    if (!stores?.length) return;

    const result = await deepQuery.query({
      query,
      storeIds: stores.map((s) => s.storeId),
      maxDepth: 3,
    });

    console.log(`Deep answer (${result.totalQueries} queries):`);
    console.log(result.answer);
  };

  const handleUpload = async (file: File) => {
    await upload.upload({
      storeId: stores![0].storeId,
      file,
      filename: file.name,
      mimeType: file.type,
    });
  };

  return (
    <div>
      <p>Stores: {stores?.length ?? 0}</p>
      <p>Monthly cost: ${costs?.totalCost.toFixed(2) ?? '0.00'}</p>
      {/* UI components */}
    </div>
  );
}
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Simple query (cached) | < 5ms | < 20ms | In-memory LRU hit |
| Simple query (uncached) | < 500ms | < 2s | Google File Search API |
| Query with synthesis | < 2s | < 5s | Includes LLM synthesis |
| Deep RAG (depth 1) | < 3s | < 8s | Single-level gap detection |
| Deep RAG (depth 3) | < 10s | < 30s | Full recursive retrieval |
| Semantic reranking (10 chunks) | < 1s | < 3s | LLM batch scoring |
| Document upload + index | < 30s | < 120s | Includes Google polling |
| Bulk upload (10 files) | < 60s | < 180s | 5 concurrent uploads |
| Store creation | < 2s | < 5s | Google + DB write |

### Caching Strategy

| Cache | Type | TTL | Max Entries | Notes |
|-------|------|-----|-------------|-------|
| Query results | LRU (in-memory) | 1 hour | 1,000 | First-level cache |
| Query results | Redis (@upstash) | 1 hour | Unlimited | Shared across workers |
| Store metadata | Per-request | — | — | Fetched fresh each time |

- **Cache key:** `rag:{sortedStoreIds}:{query}:{documentType}:{tags}:{ventureId}`
- **Invalidation:** Per-store pattern deletion on file upload/delete
- **Fallback:** Redis miss → in-memory miss → Google API call

### Concurrency Limits

| Resource | Limit | Scope |
|----------|-------|-------|
| Concurrent file uploads | 5 | Per bulk operation |
| Concurrent queries | 10 | System-wide |
| Concurrent gap queries (Deep RAG) | 3 | Per deep query |
| Indexing poll interval | 2 seconds | Per file |
| Indexing timeout | 120 seconds | Per file |

### Rate Limits

| Operation | Limit | Scope |
|-----------|-------|-------|
| File uploads | 20/minute | Per venture |
| Queries | 100/minute | Per venture |
| Deep queries | 20/minute | Per venture |

### Token Estimation

- **File indexing:** ~1 token per 4 bytes of source content
- **Query context:** ~3,000 tokens estimated per retrieval level
- **Gap detection:** ~500 tokens per LLM call
- **Final synthesis:** ~2,500 tokens estimated
- **Deep RAG worst case:** `sum(gapsPerLevel^depth) * contextPerLevel` tokens

---

## Security Considerations

### Multi-Tenant Isolation

- **Venture-scoped stores:** Each store has a `ventureId` or `isShared` flag
- **Query-time access check:** `resolveStores()` filters by ownership, `isShared`, and `allowedVentures`
- **File ownership:** Every file record tracks `ventureId` for audit attribution
- **Cross-venture access:** Explicit `allowedVentures` array on store config; shared stores accessible to all

### RBAC (Role-Based Access Control)

- **Tier-based permissions:** Tier 0 (Super Admin) has full access; Tier 3 limited to queries
- **Resource granularity:** Separate permissions for stores, files, queries, and admin operations
- **Wildcard support:** `rag:stores:*`, `rag:admin:*`, or `*:*` for blanket grants
- **Permission assertion:** `ragPermissions.assert()` throws `PermissionDeniedError` on failure

### Budget Enforcement

- **Pre-flight budget check** before every synthesis operation via `gatewayIntegration`
- **Hard limits:** Estimated cost checked against daily remaining budget
- **Rate limiting:** Per-venture and per-user rate limits via LLM Gateway rate limiter
- **Custom errors:** `SynthesisBudgetExceededError` and `SynthesisRateLimitError` with retry-after
- **Emergency bypass:** `skipBudgetCheck` and `skipRateLimitCheck` flags for system operations

### Data Classification

- **Three levels:** `public`, `internal`, `confidential`
- **Store-level classification** inherited by all documents
- **Filter by classification** in store listing queries
- **Audit logged** on classification changes

### Input Validation

- **File validation:** MIME type whitelist (17 types), 50 MB size limit
- **Query validation:** Zod schema for NAOS tool params (max 2000 chars)
- **Filter sanitization:** Parameterized SQL via Drizzle ORM; no raw query injection
- **Metadata filters:** JSONB operators via typed SQL builder

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `rag:store.created` | `rag:store` | New knowledge store created |
| `rag:store.updated` | `rag:store` | Store configuration changed |
| `rag:store.deleted` | `rag:store` | Store and all files removed |
| `rag:store.access_granted` | `rag:store` | Venture added to allowedVentures |
| `rag:store.access_revoked` | `rag:store` | Venture removed from allowedVentures |
| `rag:file.uploaded` | `rag:file` | Document uploaded and indexing started |
| `rag:file.deleted` | `rag:file` | Document removed from store |
| `rag:file.indexed` | `rag:file` | Document successfully indexed |
| `rag:file.failed` | `rag:file` | Document indexing failed |
| `rag:file.bulk_upload_started` | `rag:file` | Bulk upload batch initiated |
| `rag:file.bulk_upload_completed` | `rag:file` | Bulk upload batch finished |
| `rag:query.executed` | `rag:query` | Standard RAG query executed |
| `rag:query.deep_executed` | `rag:query` | Deep RAG query executed |
| `rag:query.failed` | `rag:query` | Query execution failed |
| `rag:admin.cache_cleared` | `rag:admin` | Query cache cleared |
| `rag:admin.cost_threshold_exceeded` | `rag:admin` | Venture cost threshold breach |
| `rag:admin.retention_applied` | `rag:admin` | Data retention policy executed |

### Audit Entry Structure

```typescript
interface RagAuditEntry {
  actor: {
    type: 'user' | 'system' | 'api_key' | 'agent';
    id: string;
    name?: string;
    email?: string;
    agentType?: string;
  };
  action: string;                    // e.g., 'rag:file.uploaded'
  category: string;                  // e.g., 'rag:file'
  resource: {
    type: 'store' | 'file' | 'query';
    id: string;
    name?: string;
    storeId?: string;
  };
  ventureId: string;
  metadata?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    query?: string;
    tokenCount?: number;
    costUsd?: number;
    latencyMs?: number;
    chunkCount?: number;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  };
  outcome: 'success' | 'failure' | 'error';
}
```

---

## Real-Time Progress Events

The RAG module emits typed events over WebSocket channels for real-time UI updates:

### Event Types

| Event Type | Payload | Channels |
|-----------|---------|----------|
| `rag:upload:started` | fileId, filename, storeId, mimeType, sizeBytes | venture, file, store |
| `rag:upload:progress` | fileId, progress (0-100), stage | file |
| `rag:upload:completed` | fileId, tokenCount, costUsd, durationMs | venture, file, store |
| `rag:upload:failed` | fileId, error, errorCode | venture, file, store |
| `rag:indexing:started` | fileId, filename, storeId | venture, file, store |
| `rag:indexing:processing` | fileId, percentComplete, chunksProcessed | file |
| `rag:indexing:completed` | fileId, tokenCount, chunksCreated, durationMs | venture, file, store |
| `rag:indexing:failed` | fileId, error, errorCode | venture, file, store |
| `rag:bulk:started` | batchId, totalFiles, totalSizeBytes | venture, batch, store |
| `rag:bulk:progress` | batchId, current/total, successCount, failureCount | venture, batch, store |
| `rag:bulk:completed` | batchId, successCount, failureCount, totalCostUsd | venture, batch, store |
| `rag:bulk:failed` | batchId, error, completedCount | venture, batch, store |
| `rag:query:started` | queryId, query, queryType | query, venture, stores |
| `rag:query:retrieving` | queryId, stage (searching/ranking/filtering) | query |
| `rag:query:synthesizing` | queryId, chunksRetrieved, tokensProcessing | query |
| `rag:query:completed` | queryId, chunksRetrieved, confidence, latencyMs | query, venture |
| `rag:query:failed` | queryId, error, errorCode | query, venture |

### Channel Naming Convention

```
rag:venture:{ventureId}:uploads    — All uploads for a venture
rag:file:{fileId}:progress         — Specific file progress
rag:store:{storeId}:activity       — Store-level activity
rag:batch:{batchId}:progress       — Bulk upload batch progress
rag:query:{queryId}:progress       — Query execution progress
rag:venture:{ventureId}:activity   — All RAG activity for venture
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_GENAI_API_KEY` | **Yes** | — | Google GenAI API key for File Search |
| `UPSTASH_REDIS_REST_URL` | No | — | Redis URL for distributed cache |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Redis auth token |
| `GOOGLE_CLOUD_PROJECT` | No | — | GCP project ID (Vertex AI ranker) |
| `GOOGLE_CLOUD_LOCATION` | No | `global` | GCP location (Vertex AI ranker) |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | — | Path to GCP service account JSON |
| `GOOGLE_CREDENTIALS_JSON` | No | — | Inline GCP credentials JSON |

---

## Error Codes & Custom Errors

| Error Class | Code | Description | Recovery |
|------------|------|-------------|----------|
| `PermissionDeniedError` | — | Insufficient permissions for operation | Check user tier/permissions |
| `SynthesisBudgetExceededError` | — | Venture budget exceeded for synthesis | Wait for budget reset or increase limits |
| `SynthesisRateLimitError` | — | Rate limit exceeded for synthesis | Retry after `retryAfterSeconds` |
| `Error: Store not found` | — | Invalid store ID | Verify store exists |
| `Error: Unsupported file type` | — | MIME type not in whitelist | Use one of 17 supported types |
| `Error: File too large` | — | File exceeds 50 MB limit | Split or compress file |
| `Error: Store size limit exceeded` | — | Store would exceed `maxSizeBytes` | Delete files or increase limit |
| `Error: No valid stores found` | — | No accessible stores for venture | Check store access/ownership |
| `Error: GOOGLE_GENAI_API_KEY required` | — | Missing API key env var | Set environment variable |

---

## Dependencies

### Internal MCV Packages

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM, database connection, schema imports |
| `@mcv/gateway` | LLM Gateway types (`ChatMessage`, `BudgetStatus`, `AgentType`) |
| `@mcv/gateway/server` | Gateway execution (`mcvGateway.execute`), `BudgetManager`, `getRateLimiter` |
| `@mcv/realtime/server` | WebSocket server for progress event broadcasting |
| `@mcv/permissions` | RBAC integration (via permissions guard) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/genai` | Latest | Google GenAI SDK (File Search, embeddings) |
| `@upstash/redis` | Latest | Serverless Redis cache (optional) |
| `drizzle-orm` | ^0.30 | Type-safe SQL query builder |
| `p-limit` | ^5.0 | Concurrency control for bulk operations |
| `zod` | ^3.22 | Schema validation for NAOS tool params |

### Peer Dependencies

| Package | Purpose |
|---------|---------|
| `react` | Client hooks (optional, only for `@mcv/rag/client`) |

---

## Configuration Defaults Reference

```typescript
// Store defaults
const DEFAULT_STORE_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024 * 1024,  // 2 GB
  chunkMaxTokens: 256,
  chunkOverlap: 64,
  chunkingStrategy: 'semantic',
  dataClassification: 'internal',
};

// Query defaults
const DEFAULT_QUERY_CONFIG = {
  maxChunks: 50,
  useCache: true,
  cacheTtlSeconds: 3600,         // 1 hour
  synthesisModel: 'gemini-2.0-flash',
  synthesisTemperature: 0.7,
};

// Deep RAG defaults
const DEFAULT_DEEP_RAG_CONFIG = {
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
const DEFAULT_RERANK_CONFIG = {
  topK: 10,
  threshold: 0.0,
  model: 'gemini-2.0-flash',
  batchScoring: true,
  batchSize: 5,
  temperature: 0.0,
  maxScoringTokens: 200,
  maxChunkTextLength: 1500,
};

// Cost constants
const INDEXING_COST_PER_1M_TOKENS = 0.15;  // USD
const QUERY_COST_PER_1M_TOKENS = 0;        // Free

// Rate limits
const RATE_LIMITS = {
  uploadsPerMinute: 20,
  queriesPerMinute: 100,
  deepQueriesPerMinute: 20,
};

// Concurrency limits
const CONCURRENCY_LIMITS = {
  maxConcurrentUploads: 5,
  maxConcurrentQueries: 10,
  maxConcurrentGapQueries: 3,
};

// Indexing polling
const INDEXING_POLL_CONFIG = {
  intervalMs: 2000,
  maxAttempts: 60,
  timeoutMs: 120000,   // 2 minutes
};
```

---

## Data Flow: Query Pipeline

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────┐
│  1. PERMISSIONS CHECK                            │
│     ragPermissions.check(ctx, QUERIES, QUERY)    │
│     Verify tier + venture access                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  2. CACHE CHECK (if useCache=true)               │
│     key = rag:{storeIds}:{query}:{filters}       │
│     Redis → InMemory → miss                      │
└────────────────────┬────────────────────────────┘
                     │ (cache miss)
                     ▼
┌─────────────────────────────────────────────────┐
│  3. STORE RESOLUTION                             │
│     resolveStores(storeIds, ventureId)           │
│     Filter: isShared ∨ owner ∨ allowedVentures   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  4. METADATA PRE-FILTERING (if filters active)   │
│     metadataFilter.getFilteredFiles()            │
│     SQL: documentType, tags, dateRange, JSONB    │
│     Returns: fileIds, googleFileNames            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  5. GOOGLE FILE SEARCH                           │
│     genai.models.generateContent({               │
│       tools: [{ fileSearch: { storeNames } }],   │
│       temperature: 0.1                           │
│     })                                           │
│     Extract: groundingMetadata.groundingChunks   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  6. POST-FILTER CHUNKS                           │
│     Match chunks against filtered file names     │
│     Apply minRelevanceScore threshold            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  7. CACHE RESULT (async, non-blocking)           │
│     Redis.setex(key, 3600, result)               │
│     InMemory.set(key, result, 3600)              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  8. LOG QUERY (async, non-blocking)              │
│     INSERT INTO rag_query_logs (...)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              QueryResult {
                chunks, totalChunks,
                latencyMs, cacheHit
              }
```

---

## Data Flow: Deep RAG Pipeline

```
Complex Query
    │
    ▼
┌─────────────────────────────────────────────────┐
│  1. BUDGET + RATE LIMIT CHECK                    │
│     estimateDeepQueryTokens(query, depth, gaps)  │
│     gatewayIntegration.checkBudgetForSynthesis() │
│     → SynthesisBudgetExceededError               │
│     → SynthesisRateLimitError                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  2. RECURSIVE RETRIEVAL (depth 0)                │
│     ┌──────────────────────────────────────┐     │
│     │ fileSearchManager.query(rootQuery)   │     │
│     │ → 50 raw chunks                      │     │
│     │ semanticRanker.rerank(top 5)         │     │
│     │ detectGaps(query, chunks, threshold) │     │
│     │ → gaps: ["sub-query 1", "sub-query 2"] │   │
│     └──────────────────────┬───────────────┘     │
│                            │                     │
│     ┌──────────────────────┼──────────────────┐  │
│     │  3. RECURSE (depth 1, parallel)         │  │
│     │                      │                  │  │
│     │  ┌───────────────┐  ┌───────────────┐   │  │
│     │  │ Sub-query 1   │  │ Sub-query 2   │   │  │
│     │  │ retrieve →    │  │ retrieve →    │   │  │
│     │  │ rerank →      │  │ rerank →      │   │  │
│     │  │ detect gaps   │  │ detect gaps   │   │  │
│     │  │ → recurse?    │  │ → recurse?    │   │  │
│     │  └───────────────┘  └───────────────┘   │  │
│     │         ... (up to maxDepth) ...        │  │
│     └─────────────────────────────────────────┘  │
│                            │                     │
└────────────────────────────┼─────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────┐
│  4. SYNTHESIZE FINAL ANSWER                      │
│     Collect all chunks from query tree           │
│     mcvGateway.execute({ messages, context })    │
│     Extract citations using [N] notation         │
│     Calculate confidence from coverage + gaps    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  5. TRACK & LOG                                  │
│     costTracker.track({ synthesis, tokens })     │
│     gatewayIntegration.recordRateLimitUsage()    │
│     INSERT INTO rag_query_logs (depth > 1)       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              DeepQueryResult {
                answer, citations, confidence,
                queryTree, totalQueries, depth,
                tokenUsage, cost
              }
```

---

## Testing

The package includes unit and integration tests:

```
packages/rag/tests/
├── integration/
│   ├── document-ingestion.test.ts    # Upload → index → query pipeline
│   └── store-registry.test.ts        # Store CRUD lifecycle
├── unit/
│   ├── cache.test.ts                 # LRU eviction, TTL, pattern delete
│   ├── metadata-filter.test.ts       # SQL condition building, JSONB ops
│   ├── permissions-guard.test.ts     # Tier checks, wildcard permissions
│   └── semantic-ranker.test.ts       # Score parsing, batch scoring, MMR
└── utils/
    ├── fixtures.ts                   # Test data factories
    ├── index.ts                      # Test utilities
    └── mocks.ts                      # Mock Google GenAI client
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/gateway` | LLM calls for synthesis, gap detection, reranking; budget management |
| `@mcv/db` | Schema definitions, Drizzle ORM queries |
| `@mcv/realtime` | WebSocket broadcasting for progress events |
| `@mcv/permissions` | RBAC integration (future tighter coupling) |
| `@mcv/audit` | Centralized audit log forwarding (planned) |
| NAOS Agents | Query knowledge via `knowledgeBaseTool` tool interface |
