# @mcv/intelligence/embedding — Embedding & Vector Storage Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Core)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `embedding` module provides end-to-end text embedding and vector storage capabilities for the MCV ecosystem. It generates vector representations of text using multiple embedding providers (OpenAI, Cohere, Google), stores them in PostgreSQL via pgvector, and provides similarity search with cosine, euclidean, and inner-product distance metrics. The module powers RAG retrieval, semantic search, document deduplication, and knowledge graph construction across all MCV ventures.

**This module is the vector backbone — every semantic operation in MCV flows through embedding generation and vector search.**

### Design Context

The current production RAG pipeline (`@mcv/rag`) delegates embedding and vector storage to Google GenAI File Search, which provides a managed embedding + retrieval service. This `embedding` module extracts, generalizes, and self-hosts those capabilities so MCV can:

1. **Eliminate vendor lock-in** — swap between OpenAI, Cohere, Google, or local (Ollama) models
2. **Control vector storage** — use pgvector for full SQL-level control, partitioning, and multi-tenancy
3. **Enable hybrid search** — combine vector similarity with PostgreSQL full-text search (tsvector)
4. **Reduce cost** — avoid per-query GenAI pricing for high-volume semantic operations
5. **Support advanced retrieval** — multi-store search, cross-encoder reranking, MMR diversity

The module integrates tightly with the existing `@mcv/rag` package's `DocumentIngestionPipeline`, `FileSearchManager`, `SemanticRanker`, and `DeepRagService`.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDING GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  embed,                    // Generate embedding for single text
  embedBatch,               // Generate embeddings for multiple texts
  embedWithModel,           // Generate embedding with specific model override
} from './server/services/embedding-service';

// ═══════════════════════════════════════════════════════════════════════════════
// VECTOR STORE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VectorStore,              // Vector store class with full CRUD + search
  createVectorStore,        // Factory for VectorStore instances
} from './server/vector-store';

// ═══════════════════════════════════════════════════════════════════════════════
// VECTOR OPERATIONS (CRUD)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  upsertVectors,            // Insert or update vectors (idempotent)
  deleteVectors,            // Delete vectors by ID or filter
  getVector,                // Get a single vector by ID
  listVectors,              // List vectors with pagination
  countVectors,             // Count vectors matching filter
} from './server/services/vector-operations';

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

export {
  searchVectors,            // Pure vector similarity search (ANN via pgvector)
  hybridSearch,             // Combined vector + full-text search (RRF fusion)
  multiStoreSearch,         // Search across multiple stores simultaneously
  rerankResults,            // Rerank search results with cross-encoder scoring
} from './server/services/search-service';

// ═══════════════════════════════════════════════════════════════════════════════
// INDEX MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createIndex,              // Create pgvector index (IVFFlat or HNSW)
  dropIndex,                // Drop an existing index
  rebuildIndex,             // Rebuild index after bulk operations
  getIndexStats,            // Get index size and performance stats
  analyzeIndex,             // Run ANALYZE on index for query optimization
} from './server/services/index-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CHUNKING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  chunkText,                // Split text into overlapping chunks (fixed-size)
  chunkDocument,            // Split document with metadata preservation
  chunkMarkdown,            // Markdown-aware chunking (respects headers/code blocks)
  chunkCode,                // Code-aware chunking (respects functions/classes)
} from './server/services/chunking-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getEmbeddingModel,        // Get configured embedding model details
  listEmbeddingModels,      // List available embedding models
  getModelDimensions,       // Get vector dimensions for a model
  setDefaultModel,          // Set default embedding model (runtime)
} from './server/services/model-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useVectorStore } from './client/hooks/use-vector-store';
export { useSemanticSearch } from './client/hooks/use-semantic-search';
export { useEmbeddingStats } from './client/hooks/use-embedding-stats';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { VectorStoreManager } from './client/components/vector-store-manager';
export { EmbeddingVisualizer } from './client/components/embedding-visualizer';
export { SearchPlayground } from './client/components/search-playground';
export { IndexHealthPanel } from './client/components/index-health-panel';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EMBEDDING_MODELS,         // Registry of supported embedding models
  DEFAULT_DIMENSIONS,       // Default dimension count (1536)
  DISTANCE_METRICS,         // Available distance metrics
  INDEX_TYPES,              // Available index types (hnsw, ivfflat, none)
  DEFAULT_CHUNK_SIZE,       // Default max tokens per chunk (256)
  DEFAULT_CHUNK_OVERLAP,    // Default overlap tokens (64)
  MAX_BATCH_SIZE,           // Max texts per batch request (100)
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Vector,
  VectorMetadata,
  VectorQuery,
  VectorFilter,
  SearchResult,
  HybridSearchQuery,
  VectorStoreConfig,
  EmbeddingModel,
  EmbeddingRequest,
  EmbeddingResult,
  ChunkOptions,
  ChunkResult,
  IndexConfig,
  IndexStats,
  DistanceMetric,
  IndexType,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         EMBEDDING & VECTOR STORAGE ARCHITECTURE                          │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            EMBEDDING GENERATION                                    │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │  │
│  │  │   OpenAI     │    │   Cohere     │    │   Google     │    │   Local      │    │  │
│  │  │              │    │              │    │              │    │  (Ollama)    │    │  │
│  │  │ text-embed-  │    │ embed-v4.0   │    │ text-embed-  │    │              │    │  │
│  │  │ ding-3-small │    │              │    │ 005          │    │ nomic-embed  │    │  │
│  │  │ (1536d)      │    │ (1024d)      │    │ (768d)       │    │ (768d)       │    │  │
│  │  │              │    │              │    │              │    │              │    │  │
│  │  │ text-embed-  │    │ embed-multi  │    │              │    │ bge-large    │    │  │
│  │  │ ding-3-large │    │ lingual-v3.0 │    │              │    │ (1024d)      │    │  │
│  │  │ (3072d)      │    │ (1024d)      │    │              │    │              │    │  │
│  │  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │  │
│  │         │                   │                   │                   │            │  │
│  │         └───────────────────┴───────────────────┴───────────────────┘            │  │
│  │                                     │                                            │  │
│  │                          ┌──────────▼──────────┐                                │  │
│  │                          │  EMBEDDING SERVICE   │                                │  │
│  │                          │                      │                                │  │
│  │                          │  • Model selection   │                                │  │
│  │                          │  • Batch processing  │                                │  │
│  │                          │  • Rate limiting     │                                │  │
│  │                          │  • Dimension norm.   │                                │  │
│  │                          │  • Redis caching     │                                │  │
│  │                          └──────────┬──────────┘                                │  │
│  └─────────────────────────────────────┼──────────────────────────────────────────┘  │
│                                        │                                              │
│  ┌─────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                           CHUNKING PIPELINE                                     │  │
│  │                                                                                  │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │  │
│  │  │  Input   │    │  Split   │    │  Overlap │    │  Embed   │                  │  │
│  │  │ Document │───▶│  Chunks  │───▶│  Windows │───▶│  Each    │                  │  │
│  │  │          │    │          │    │          │    │  Chunk   │                  │  │
│  │  │ text/md/ │    │ semantic │    │ 64 token │    │  in      │                  │  │
│  │  │ code/pdf │    │ or fixed │    │ overlap  │    │  batch   │                  │  │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │  │
│  │                                                                                  │  │
│  │  Strategies:  fixed │ semantic │ markdown │ code                                 │  │
│  │  Config:      maxTokens=256, overlap=64, minTokens=20                           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                              │
│  ┌─────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                       VECTOR STORE (pgvector)                                    │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PostgreSQL + pgvector extension                                          │  │  │
│  │  │                                                                            │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  document_embeddings                                                │  │  │  │
│  │  │  │                                                                     │  │  │  │
│  │  │  │  id │ store_id │ content │ vector(1536) │ metadata │ created_at    │  │  │  │
│  │  │  │  ───┼──────────┼─────────┼──────────────┼──────────┼─────────────  │  │  │  │
│  │  │  │  ... │ ...     │ ...     │ [0.02, ...]  │ {...}    │ 2026-02-08   │  │  │  │
│  │  │  └─────────────────────────────────────────────────────────────────────┘  │  │  │
│  │  │                                                                            │  │  │
│  │  │  Indexes:                        Full-Text Search:                         │  │  │
│  │  │  ┌──────────┐  ┌──────────┐    ┌────────────────────┐                    │  │  │
│  │  │  │ IVFFlat  │  │  HNSW    │    │  content_tsv       │                    │  │  │
│  │  │  │          │  │          │    │  (tsvector)        │                    │  │  │
│  │  │  │ Fast     │  │ Accurate │    │                    │                    │  │  │
│  │  │  │ build    │  │ queries  │    │  GIN index for     │                    │  │  │
│  │  │  │ Good for │  │ Better   │    │  hybrid search     │                    │  │  │
│  │  │  │ bulk ops │  │ recall   │    │                    │                    │  │  │
│  │  │  └──────────┘  └──────────┘    └────────────────────┘                    │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                              │
│  ┌─────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │                          SEARCH PIPELINE                                        │  │
│  │                                                                                  │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │  │
│  │  │  Query   │    │  Embed   │    │  Vector  │    │  Rerank  │                  │  │
│  │  │  Text    │───▶│  Query   │───▶│  Search  │───▶│  Results │                  │  │
│  │  │          │    │          │    │          │    │          │                  │  │
│  │  │          │    │ Same     │    │ pgvector │    │ Cross-   │                  │  │
│  │  │          │    │ model as │    │ cosine / │    │ encoder  │                  │  │
│  │  │          │    │ indexed  │    │ L2 / IP  │    │ scoring  │                  │  │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │  │
│  │                                                                                  │  │
│  │  Hybrid Search:  vector_score × weight + text_score × (1 - weight)              │  │
│  │  Default weights: vector=0.7, text=0.3                                          │  │
│  │                                                                                  │  │
│  │  MMR Diversity:  (1-λ) × relevance - λ × maxSimilarity(candidate, selected)    │  │
│  │  Default λ=0.2                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Document Ingestion → Embedding → Search

```
                                     INGESTION FLOW
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Document │     │ Validate │     │  Chunk   │     │  Embed   │     │  Store   │
  │ Upload   │────▶│ & Parse  │────▶│  (split  │────▶│  (batch  │────▶│  Vectors │
  │          │     │          │     │  + meta)  │     │  API)    │     │  (upsert)│
  │ file/text│     │ mimetype │     │ 256 tok  │     │ 100/batch│     │ pgvector │
  │ metadata │     │ size chk │     │ 64 over  │     │ 1536 dim │     │ + meta   │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                                            │
                                                                            ▼
                                                                     ┌──────────┐
                                                                     │ Track    │
                                                                     │ Cost     │
                                                                     │ $0.15/1M │
                                                                     └──────────┘

                                      SEARCH FLOW
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Query   │     │  Embed   │     │  ANN     │     │  Rerank  │     │  Return  │
  │  Text    │────▶│  Query   │────▶│  Search  │────▶│  (LLM    │────▶│  Top-K   │
  │          │     │          │     │          │     │  scoring) │     │  Results │
  │ "How do  │     │ same     │     │ HNSW or  │     │ batch    │     │ + scores │
  │  I..."   │     │ model    │     │ IVFFlat  │     │ cross-   │     │ + meta   │
  │          │     │ + cache  │     │ top-50   │     │ encoder  │     │ + cites  │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                          │
                                          ├─── metadata filter (pre-search)
                                          ├─── full-text search (hybrid)
                                          └─── multi-store merge (RRF)
```

### Integration with @mcv/rag

```
  @mcv/rag (current production)              @mcv/intelligence/embedding (target)
  ┌─────────────────────────────┐            ┌─────────────────────────────────┐
  │                             │            │                                 │
  │  DocumentIngestionPipeline  │───────────▶│  chunkDocument() + embedBatch() │
  │  • validates files          │  replaces  │  + upsertVectors()              │
  │  • uploads to Google GenAI  │  Google    │  • local pgvector storage       │
  │  • polls for completion     │  upload    │  • immediate indexing           │
  │                             │            │  • cost tracking built-in       │
  │  FileSearchManager          │───────────▶│  searchVectors() + hybridSearch │
  │  • queries via Gemini API   │  replaces  │  • direct pgvector queries      │
  │  • extracts grounding chunks│  GenAI     │  • full-text + vector fusion    │
  │  • caches with Redis        │  search    │  • metadata pre-filtering       │
  │                             │            │                                 │
  │  SemanticRanker             │───────────▶│  rerankResults()                │
  │  • LLM-based cross-encoder  │  wraps     │  • LLM cross-encoder scoring    │
  │  • batch + individual score │            │  • MMR diversity selection       │
  │  • MMR diversity selection  │            │  • Cohere rerank-v3.5 support   │
  │                             │            │                                 │
  │  DeepRagService             │───────────▶│  multiStoreSearch()             │
  │  • recursive gap detection  │  uses      │  • query tree retrieval         │
  │  • multi-level synthesis    │            │  • cross-store fusion           │
  │                             │            │                                 │
  └─────────────────────────────┘            └─────────────────────────────────┘
```

---

## Core Interfaces

### Vector

```typescript
/**
 * A stored vector embedding with its source content and metadata.
 * Each vector represents one chunk of a larger document.
 */
interface Vector {
  /** Unique identifier for the vector (UUID) */
  id: string;

  /** Store this vector belongs to (maps to file_search_stores.id) */
  storeId: string;

  /** Original text content that was embedded */
  content: string;

  /** The embedding vector (float array, e.g., 1536 dimensions) */
  vector: number[];

  /** Arbitrary metadata for filtering and display */
  metadata: VectorMetadata;

  /** Venture that owns this vector (tenant isolation) */
  ventureId: string;

  /** Source document ID (references file_search_files.id) */
  sourceId?: string;

  /** Chunk index within source document (0-based) */
  chunkIndex?: number;

  /** Total chunks in source document */
  totalChunks?: number;

  /** Embedding model used to generate this vector */
  embeddingModel: string;

  /** Vector dimensions (must match store configuration) */
  dimensions: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Flexible metadata attached to each vector for filtering and display.
 * Stored as JSONB in PostgreSQL with GIN index for fast queries.
 */
interface VectorMetadata {
  /** Document title */
  title?: string;

  /** Document category (e.g., 'support', 'billing', 'developer') */
  category?: string;

  /** Document type (e.g., 'prd', 'spec', 'kb', 'api', 'guide') */
  documentType?: string;

  /** Tags for filtering (stored as TEXT[] with GIN index) */
  tags?: string[];

  /** Source URL */
  sourceUrl?: string;

  /** Language (ISO 639-1, e.g., 'en', 'fr') */
  language?: string;

  /** Heading hierarchy for markdown chunks (e.g., ['Getting Started', 'Installation']) */
  headings?: string[];

  /** Code entity info for code chunks (e.g., {type: 'method', name: 'UserService.createUser'}) */
  codeEntity?: { type: string; name: string };

  /** Any additional key-value pairs (JSONB) */
  [key: string]: unknown;
}
```

### VectorStoreConfig

```typescript
/**
 * Configuration for creating a vector store.
 * Maps to a logical partition within the document_embeddings table,
 * scoped by store_id and venture_id.
 */
interface VectorStoreConfig {
  /** Unique store identifier (e.g., 'betedge-knowledge-v1') */
  storeId: string;

  /** PostgreSQL table name for vectors */
  tableName?: string;                    // Default: 'document_embeddings'

  /** Vector dimensions (must match embedding model output) */
  dimensions: number;                    // e.g., 1536 for text-embedding-3-small

  /** Distance metric for similarity computation */
  distanceMetric: DistanceMetric;        // Default: 'cosine'

  /** Index type for search acceleration */
  indexType: IndexType;                  // Default: 'hnsw'

  /** Embedding model to use for this store */
  embeddingModel?: string;              // Default: EMBEDDING_DEFAULT_MODEL env var

  /** Venture scope (tenant isolation) */
  ventureId?: string;

  /** Whether to auto-create the table + extensions if missing */
  autoCreate?: boolean;                  // Default: true

  /** Database connection (if not using default @mcv/db pool) */
  db?: DrizzleInstance;

  /** Chunking configuration (mirrors file_search_stores schema) */
  chunkConfig?: {
    maxTokens: number;                   // Default: 256
    overlap: number;                     // Default: 64
    strategy: 'fixed' | 'semantic';      // Default: 'semantic'
  };

  /** Maximum storage in bytes (default: 2GB, from store schema) */
  maxSizeBytes?: number;

  /** Data classification for access control */
  dataClassification?: 'public' | 'internal' | 'confidential';
}

/**
 * Distance metrics for vector similarity.
 * Maps to pgvector operator classes.
 */
type DistanceMetric =
  | 'cosine'          // vector_cosine_ops — 1 - cosine_similarity (most common)
  | 'euclidean'       // vector_l2_ops — L2 distance
  | 'inner_product';  // vector_ip_ops — Negative inner product (for normalized vectors)

/**
 * Index types for approximate nearest neighbor (ANN) search.
 */
type IndexType =
  | 'ivfflat'         // Inverted file flat — fast build, good for bulk ingest
  | 'hnsw'            // Hierarchical Navigable Small World — better recall, slower build
  | 'none';           // No index — exact search, perfect recall, slow for >10K vectors
```

### EmbeddingRequest / EmbeddingResult

```typescript
/**
 * Request to generate embeddings from text.
 * Supports single text or batch of texts.
 */
interface EmbeddingRequest {
  /** Text or texts to embed */
  input: string | string[];

  /** Embedding model to use (overrides default) */
  model?: string;                        // Default: EMBEDDING_DEFAULT_MODEL

  /** Venture for cost tracking and rate limiting */
  ventureId: string;

  /** Desired output dimensions (for models that support truncation) */
  dimensions?: number;

  /** Encoding format for the response */
  encodingFormat?: 'float' | 'base64';  // Default: 'float'
}

/**
 * Result from embedding generation.
 * Includes vectors, usage stats, and cost attribution.
 */
interface EmbeddingResult {
  /** Generated embeddings (same order as input) */
  embeddings: number[][];

  /** Model that was used */
  model: string;

  /** Dimensions per vector */
  dimensions: number;

  /** Token usage for cost attribution */
  usage: {
    promptTokens: number;
    totalTokens: number;
  };

  /** Cost in USD (based on model pricing per 1M tokens) */
  costUsd: number;

  /** Latency in milliseconds */
  latencyMs: number;
}
```

### SearchResult / VectorQuery

```typescript
/**
 * A single search result with similarity score and metadata.
 */
interface SearchResult {
  /** Vector ID (UUID) */
  id: string;

  /** Original content text (the embedded chunk) */
  content: string;

  /** Similarity score (0-1 for cosine; lower=better for euclidean) */
  score: number;

  /** Raw distance from query vector */
  distance: number;

  /** Vector metadata (title, category, tags, etc.) */
  metadata: VectorMetadata;

  /** Source document ID (for citation tracking) */
  sourceId?: string;

  /** Chunk index within source document */
  chunkIndex?: number;

  /** Store ID (relevant for multi-store search) */
  storeId?: string;
}

/**
 * Query parameters for vector similarity search.
 */
interface VectorQuery {
  /** Query vector (pre-computed embedding) */
  vector: number[];

  /** Number of results to return */
  topK: number;                          // Default: 10

  /** Minimum similarity score threshold */
  minScore?: number;                     // Default: 0.0 (no filter)

  /** Metadata filter (pre-applied before ANN search for efficiency) */
  filter?: VectorFilter;

  /** Include raw vector data in results (saves bandwidth when false) */
  includeVectors?: boolean;             // Default: false

  /** Include content text in results */
  includeContent?: boolean;             // Default: true

  /** Venture scope for tenant isolation */
  ventureId?: string;

  /** Store scope (search within specific store) */
  storeId?: string;
}

/**
 * Filter conditions applied before or during vector search.
 * Translates to PostgreSQL WHERE clauses on JSONB metadata.
 */
interface VectorFilter {
  /** Exact match filters on metadata fields */
  where?: Record<string, unknown>;

  /** Array contains filter (e.g., tags contains 'api') */
  whereIn?: Record<string, unknown[]>;

  /** Exclusion filter */
  whereNot?: Record<string, unknown>;

  /** Date range filter on created_at */
  createdAfter?: Date;
  createdBefore?: Date;
}
```

### HybridSearchQuery

```typescript
/**
 * Hybrid search combines vector similarity with PostgreSQL full-text search.
 * Uses Reciprocal Rank Fusion (RRF) or weighted scoring to merge results.
 *
 * Especially useful when:
 * - User queries contain specific technical terms
 * - Semantic similarity alone might miss exact keyword matches
 * - You need both conceptual and lexical relevance
 */
interface HybridSearchQuery extends Omit<VectorQuery, 'vector'> {
  /** Query vector for semantic search component */
  vector: number[];

  /** Query text for full-text search component */
  text: string;

  /** Weight for vector score (0-1) */
  vectorWeight: number;                  // Default: 0.7

  /** Weight for text score (0-1, = 1 - vectorWeight) */
  textWeight: number;                    // Default: 0.3

  /** Full-text search language for tsvector */
  language?: string;                     // Default: 'english'

  /** Ranking function for text search */
  rankFunction?: 'rank' | 'rank_cd';    // Default: 'rank_cd'
}
```

### ChunkOptions / ChunkResult

```typescript
/**
 * Configuration for text chunking.
 * Mirrors the chunking config stored in file_search_stores schema.
 */
interface ChunkOptions {
  /** Maximum tokens per chunk */
  maxTokens: number;                     // Default: 256 (from DEFAULT_STORE_CONFIG)

  /** Overlap tokens between adjacent chunks */
  overlap: number;                       // Default: 64 (from DEFAULT_STORE_CONFIG)

  /** Chunking strategy */
  strategy: 'fixed' | 'semantic' | 'markdown' | 'code';

  /** Model for token counting (uses tiktoken) */
  model?: string;                        // Default: embedding model's tokenizer

  /** Preserve paragraph boundaries when splitting */
  respectParagraphs?: boolean;           // Default: true

  /** Minimum chunk size (skip tiny trailing chunks) */
  minTokens?: number;                    // Default: 20

  /** Include source metadata in each chunk (heading path, code entity) */
  includeMetadata?: boolean;             // Default: true
}

/**
 * Result from chunking a document.
 */
interface ChunkResult {
  /** Array of text chunks */
  chunks: string[];

  /** Token count per chunk */
  tokenCounts: number[];

  /** Total chunks generated */
  totalChunks: number;

  /** Total tokens across all chunks */
  totalTokens: number;

  /** Metadata per chunk (heading hierarchy, code entity info, etc.) */
  chunkMetadata: Record<string, unknown>[];
}
```

### IndexConfig / IndexStats

```typescript
/**
 * Configuration for creating a pgvector index.
 * Supports IVFFlat and HNSW index types.
 */
interface IndexConfig {
  /** Index type */
  type: IndexType;

  /** IVFFlat: number of inverted lists (clusters). sqrt(n) is a good default. */
  lists?: number;                        // Default: auto-calculated from vector count

  /** HNSW: max connections per node. Higher = better recall, more memory. */
  m?: number;                            // Default: 16

  /** HNSW: construction search depth. Higher = better index quality, slower build. */
  efConstruction?: number;               // Default: 64

  /** HNSW: search depth at query time. Higher = better recall, slower queries. */
  efSearch?: number;                     // Default: 40

  /** Distance metric for the index operator class */
  distanceMetric?: DistanceMetric;       // Default: from store config

  /** Number of dimensions (must match vectors in table) */
  dimensions?: number;                   // Default: from store config
}

/**
 * Statistics about a pgvector index.
 * Retrieved via pg_stat queries and pg_class inspection.
 */
interface IndexStats {
  /** Index type */
  type: IndexType;

  /** Index size in bytes (from pg_relation_size) */
  sizeBytes: number;

  /** Number of indexed vectors */
  vectorCount: number;

  /** Estimated recall at current settings (HNSW: based on ef_search vs m) */
  estimatedRecall: number;

  /** Average query time (ms) from pg_stat_user_tables */
  avgQueryMs: number;

  /** Last reindex time */
  lastReindexAt: Date | null;

  /** Whether index should be rebuilt (after >30% updates/deletes) */
  needsRebuild: boolean;
}
```

### EmbeddingModel

```typescript
/**
 * Configuration for a supported embedding model.
 * Used by the model registry and model selection logic.
 */
interface EmbeddingModel {
  /** Model identifier (e.g., 'openai/text-embedding-3-small') */
  id: string;

  /** Provider name */
  provider: 'openai' | 'cohere' | 'google' | 'local';

  /** Human-readable display name */
  displayName: string;

  /** Output dimensions */
  dimensions: number;

  /** Max input tokens per text */
  maxInputTokens: number;

  /** Max batch size for batch embedding */
  maxBatchSize: number;

  /** Cost per 1M tokens (USD) */
  costPer1mTokens: number;

  /** Whether model supports output dimension truncation */
  supportsDimensionTruncation: boolean;

  /** Whether model is currently enabled */
  enabled: boolean;

  /** Supported distance metrics for this model's embeddings */
  supportedMetrics: DistanceMetric[];
}
```

---

## Database Schema

### document_embeddings

The primary vector storage table, managed by pgvector. Each row stores one embedded chunk with its vector, source content, and filterable metadata.

```sql
-- Requires: CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_embeddings (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES file_search_stores(id) ON DELETE CASCADE,
  
  -- Content
  content         TEXT NOT NULL,                          -- Original text chunk
  vector          VECTOR(1536) NOT NULL,                  -- Embedding vector (dimension varies per store)
  
  -- Source tracking
  source_id       UUID REFERENCES file_search_files(id),  -- Source file
  chunk_index     INTEGER,                                -- Position in source document (0-based)
  total_chunks    INTEGER,                                -- Total chunks from source
  
  -- Metadata (JSONB + array columns for fast filtering)
  metadata        JSONB NOT NULL DEFAULT '{}',            -- Arbitrary key-value metadata
  document_type   VARCHAR(32),                            -- 'prd', 'spec', 'kb', 'api', 'guide', etc.
  tags            TEXT[] DEFAULT '{}',                     -- Filterable tags array
  language        VARCHAR(8) DEFAULT 'en',                -- ISO 639-1 language code
  
  -- Embedding info
  embedding_model VARCHAR(128) NOT NULL,                  -- Model used to generate (e.g., 'openai/text-embedding-3-small')
  dimensions      INTEGER NOT NULL,                       -- Vector dimensions (must match VECTOR() size)
  
  -- Ownership (tenant isolation)
  venture_id      UUID NOT NULL REFERENCES ventures(id),
  
  -- Full-text search (auto-generated from content for hybrid search)
  content_tsv     TSVECTOR GENERATED ALWAYS AS (
                    to_tsvector('english', content)
                  ) STORED,
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- B-tree indexes (filtering)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX doc_embed_store_idx ON document_embeddings(store_id);
CREATE INDEX doc_embed_venture_idx ON document_embeddings(venture_id);
CREATE INDEX doc_embed_source_idx ON document_embeddings(source_id);
CREATE INDEX doc_embed_type_idx ON document_embeddings(document_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- GIN indexes (JSONB + array + full-text)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX doc_embed_tags_idx ON document_embeddings USING GIN(tags);
CREATE INDEX doc_embed_metadata_idx ON document_embeddings USING GIN(metadata);
CREATE INDEX doc_embed_tsv_idx ON document_embeddings USING GIN(content_tsv);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Vector indexes (choose ONE per store based on workload)
-- ═══════════════════════════════════════════════════════════════════════════════

-- HNSW — recommended for query-heavy workloads (better recall, slower build)
CREATE INDEX doc_embed_vector_hnsw_idx ON document_embeddings 
  USING hnsw (vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- IVFFlat — recommended for bulk-ingest-heavy workloads (faster build)
-- CREATE INDEX doc_embed_vector_ivf_idx ON document_embeddings
--   USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
```

### Drizzle Schema Definition

```typescript
import { pgTable, uuid, text, varchar, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core'; // pgvector extension support

export const documentEmbeddings = pgTable(
  'document_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .references(() => fileSearchStores.id, { onDelete: 'cascade' })
      .notNull(),

    // Content
    content: text('content').notNull(),
    vector: vector('vector', { dimensions: 1536 }).notNull(),

    // Source tracking
    sourceId: uuid('source_id').references(() => fileSearchFiles.id),
    chunkIndex: integer('chunk_index'),
    totalChunks: integer('total_chunks'),

    // Metadata
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    documentType: varchar('document_type', { length: 32 }),
    tags: text('tags').array().default([]),
    language: varchar('language', { length: 8 }).default('en'),

    // Embedding info
    embeddingModel: varchar('embedding_model', { length: 128 }).notNull(),
    dimensions: integer('dimensions').notNull(),

    // Ownership
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('doc_embed_store_idx').on(table.storeId),
    index('doc_embed_venture_idx').on(table.ventureId),
    index('doc_embed_source_idx').on(table.sourceId),
    index('doc_embed_type_idx').on(table.documentType),
  ]
);

// Inferred types
export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbeddings.$inferInsert;
```

### Related Tables (from @mcv/db/schema/rag.ts)

The embedding module reads from and writes to several related tables defined in the RAG schema. These are the **actual production Drizzle definitions** from `packages/db/src/schema/rag.ts`:

#### file_search_stores

Vector store configuration and metrics. Each store is an isolated knowledge repository that maps to a chunking + embedding configuration.

```typescript
// Actual Drizzle schema from @mcv/db/schema/rag.ts
export const fileSearchStores = pgTable(
  'file_search_stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: text('store_id').notNull().unique(),
    googleStoreName: text('google_store_name').notNull(),  // Google GenAI ref (migration path)
    displayName: text('display_name').notNull(),
    description: text('description'),

    // Ownership
    ventureId: uuid('venture_id').references(() => ventures.id),
    isShared: boolean('is_shared').default(false).notNull(),

    // Size limits
    maxSizeBytes: bigint('max_size_bytes', { mode: 'number' }).default(2147483648).notNull(),

    // Chunking configuration (used by embedding module's chunking pipeline)
    chunkMaxTokens: integer('chunk_max_tokens').default(256).notNull(),
    chunkOverlap: integer('chunk_overlap').default(64).notNull(),
    chunkingStrategy: varchar('chunking_strategy', { length: 16 }).default('semantic').notNull(),

    // Access control
    allowedVentures: text('allowed_ventures').array().default([]),
    requiredRoles: text('required_roles').array().default([]),
    dataClassification: varchar('data_classification', { length: 16 }).default('internal').notNull(),

    // Metrics (updated on ingest/delete)
    totalFiles: integer('total_files').default(0).notNull(),
    totalTokens: bigint('total_tokens', { mode: 'number' }).default(0).notNull(),
    totalSizeBytes: bigint('total_size_bytes', { mode: 'number' }).default(0).notNull(),
    indexingCostUsd: decimal('indexing_cost_usd', { precision: 10, scale: 4 }).default('0').notNull(),

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

```
┌────────────────────────┬──────────────┬──────────────────────────────────────────────┐
│ Column                 │ Type         │ Description                                  │
├────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ id                     │ UUID PK      │ Primary key                                  │
│ store_id               │ TEXT UNIQUE  │ Logical identifier (e.g., 'betedge-kb-v1')   │
│ google_store_name      │ TEXT         │ Google GenAI store ref (migration path)       │
│ display_name           │ TEXT         │ Human-readable name                           │
│ description            │ TEXT         │ Optional description                          │
│ venture_id             │ UUID FK      │ Owning venture (null = shared)                │
│ is_shared              │ BOOLEAN      │ Accessible to all ventures                    │
│ max_size_bytes         │ BIGINT       │ Max storage (default: 2GB)                    │
│ chunk_max_tokens       │ INTEGER      │ Max tokens per chunk (default: 256)           │
│ chunk_overlap          │ INTEGER      │ Overlap tokens (default: 64)                  │
│ chunking_strategy      │ VARCHAR(16)  │ 'semantic' or 'fixed'                         │
│ allowed_ventures       │ TEXT[]       │ Venture IDs with query access                 │
│ required_roles         │ TEXT[]       │ Roles needed for access                       │
│ data_classification    │ VARCHAR(16)  │ 'public' / 'internal' / 'confidential'        │
│ total_files            │ INTEGER      │ Indexed file count                            │
│ total_tokens           │ BIGINT       │ Total tokens across files                     │
│ total_size_bytes       │ BIGINT       │ Total storage used                            │
│ indexing_cost_usd      │ DECIMAL      │ Cumulative indexing cost                      │
│ created_at             │ TIMESTAMPTZ  │ Creation time                                 │
│ last_indexed_at        │ TIMESTAMPTZ  │ Last indexing time                            │
│ updated_at             │ TIMESTAMPTZ  │ Last update time                              │
└────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

#### file_search_files

Documents indexed within stores. Tracks individual files including processing status.

```typescript
export const fileSearchFiles = pgTable(
  'file_search_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .references(() => fileSearchStores.id, { onDelete: 'cascade' })
      .notNull(),
    googleFileName: text('google_file_name').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    tokenCount: integer('token_count'),

    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

    documentType: varchar('document_type', { length: 32 }),
    tags: text('tags').array().default([]),
    customMetadata: jsonb('custom_metadata').default({}).$type<Record<string, string>>(),

    status: varchar('status', { length: 16 }).default('pending').notNull(),
    errorMessage: text('error_message'),

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

```
┌────────────────────────┬──────────────┬──────────────────────────────────────────────┐
│ Column                 │ Type         │ Description                                  │
├────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ id                     │ UUID PK      │ Primary key                                  │
│ store_id               │ UUID FK      │ Parent store (cascade delete)                 │
│ google_file_name       │ TEXT         │ Google file reference                         │
│ original_filename      │ TEXT         │ Original upload filename                      │
│ mime_type              │ VARCHAR(128) │ MIME type                                     │
│ size_bytes             │ BIGINT       │ File size in bytes                            │
│ token_count            │ INTEGER      │ Token count (set after indexing)              │
│ venture_id             │ UUID FK      │ Uploading venture                             │
│ document_type          │ VARCHAR(32)  │ 'prd'/'spec'/'policy'/'kb'/'guide'/'api'/'code'│
│ tags                   │ TEXT[]       │ Filterable tags                               │
│ custom_metadata        │ JSONB        │ Custom key-value metadata                     │
│ status                 │ VARCHAR(16)  │ 'pending'/'processing'/'indexed'/'failed'     │
│ error_message          │ TEXT         │ Error details if failed                        │
│ uploaded_at            │ TIMESTAMPTZ  │ Upload time                                   │
│ indexed_at             │ TIMESTAMPTZ  │ Indexing completion time                       │
└────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

#### file_search_costs

Granular cost tracking for all embedding and RAG operations, enabling per-venture and per-store cost attribution.

```typescript
export const fileSearchCosts = pgTable(
  'file_search_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
    storeId: uuid('store_id').references(() => fileSearchStores.id),
    fileId: uuid('file_id').references(() => fileSearchFiles.id),
    operation: varchar('operation', { length: 16 }).notNull(),  // 'index'|'query'|'rerank'|'synthesis'
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

#### rag_query_logs

Tracks all RAG queries for analytics, debugging, and cost attribution. Records include depth (for Deep RAG), cache hit status, and token usage.

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

    chunksRetrieved: integer('chunks_retrieved'),
    chunksAfterRerank: integer('chunks_after_rerank'),
    synthesizedAnswer: text('synthesized_answer'),
    citations: text('citations').array(),
    confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),

    latencyMs: integer('latency_ms'),
    cacheHit: boolean('cache_hit').default(false).notNull(),
    depth: integer('depth').default(1).notNull(),  // 1 for simple, >1 for Deep RAG

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

#### rag_audit_logs

Compliance audit trail for all RAG operations including actor identification, resource tracking, and outcome recording.

```typescript
export const ragAuditLogs = pgTable(
  'rag_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    actorType: varchar('actor_type', { length: 16 }).notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name'),
    actorEmail: text('actor_email'),
    agentType: varchar('agent_type', { length: 32 }),

    action: varchar('action', { length: 64 }).notNull(),
    category: varchar('category', { length: 32 }).notNull(),

    resourceType: varchar('resource_type', { length: 16 }).notNull(),
    resourceId: text('resource_id').notNull(),
    resourceName: text('resource_name'),
    storeId: uuid('store_id').references(() => fileSearchStores.id),

    ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),

    outcome: varchar('outcome', { length: 16 }).notNull(),
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

### Inferred TypeScript Types

```typescript
// All types are exported from @mcv/db/schema
export type FileSearchStore = typeof fileSearchStores.$inferSelect;
export type NewFileSearchStore = typeof fileSearchStores.$inferInsert;
export type FileSearchFile = typeof fileSearchFiles.$inferSelect;
export type NewFileSearchFile = typeof fileSearchFiles.$inferInsert;
export type RagQueryLog = typeof ragQueryLogs.$inferSelect;
export type NewRagQueryLog = typeof ragQueryLogs.$inferInsert;
export type FileSearchCost = typeof fileSearchCosts.$inferSelect;
export type NewFileSearchCost = typeof fileSearchCosts.$inferInsert;
export type RagAuditLog = typeof ragAuditLogs.$inferSelect;
export type NewRagAuditLog = typeof ragAuditLogs.$inferInsert;
```

---

## Usage Examples

### Example 1: Generate Embeddings

```typescript
import { embed, embedBatch } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Single text embedding
// ═══════════════════════════════════════════════════════════════════════════════

const result = await embed({
  input: 'How do I reset my password?',
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

console.log(`Dimensions: ${result.dimensions}`);       // 1536
console.log(`Tokens used: ${result.usage.totalTokens}`); // 7
console.log(`Cost: $${result.costUsd.toFixed(6)}`);     // $0.000000
console.log(`Latency: ${result.latencyMs}ms`);          // ~80ms
console.log(`Vector sample:`, result.embeddings[0].slice(0, 5));
// [0.0234, -0.0156, 0.0891, -0.0023, 0.0445]
```

### Example 2: Batch Embeddings

```typescript
import { embedBatch } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Batch embedding for multiple documents (up to MAX_BATCH_SIZE=100)
// ═══════════════════════════════════════════════════════════════════════════════

const documents = [
  'Password reset instructions',
  'Account billing FAQ',
  'Getting started guide',
  'API authentication docs',
  'Troubleshooting network issues',
];

const result = await embedBatch({
  input: documents,
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

console.log(`Generated ${result.embeddings.length} embeddings`);  // 5
console.log(`Total tokens: ${result.usage.totalTokens}`);          // ~25
console.log(`Total cost: $${result.costUsd.toFixed(6)}`);          // ~$0.000001
console.log(`Latency: ${result.latencyMs}ms`);                     // ~120ms

// Each embedding corresponds to the input at the same index
documents.forEach((doc, i) => {
  console.log(`"${doc}" → ${result.embeddings[i].length}d vector`);
});
```

### Example 3: Create and Configure a Vector Store

```typescript
import { createVectorStore } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a vector store with HNSW index and store-level chunking config
// ═══════════════════════════════════════════════════════════════════════════════

const store = createVectorStore({
  storeId: 'betedge-knowledge-v1',
  dimensions: 1536,
  distanceMetric: 'cosine',
  indexType: 'hnsw',
  embeddingModel: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
  autoCreate: true,
  chunkConfig: {
    maxTokens: 256,       // Matches DEFAULT_STORE_CONFIG.chunkMaxTokens
    overlap: 64,          // Matches DEFAULT_STORE_CONFIG.chunkOverlap
    strategy: 'semantic', // Matches DEFAULT_STORE_CONFIG.chunkingStrategy
  },
  maxSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB (from DEFAULT_STORE_CONFIG)
  dataClassification: 'internal',
});

// Create optimized HNSW index
await store.createIndex({
  type: 'hnsw',
  m: 16,                   // Max connections per node
  efConstruction: 64,      // Build-time search depth
  efSearch: 40,            // Query-time search depth
});

// Get index stats
const stats = await store.getIndexStats();
console.log(`Index size: ${(stats.sizeBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`Vectors indexed: ${stats.vectorCount}`);
console.log(`Avg query time: ${stats.avgQueryMs}ms`);
console.log(`Estimated recall: ${(stats.estimatedRecall * 100).toFixed(1)}%`);
```

### Example 4: Upsert Vectors

```typescript
import { upsertVectors, embedBatch } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Store embedded documents in the vector store (idempotent upsert)
// ═══════════════════════════════════════════════════════════════════════════════

const embedResult = await embedBatch({
  input: ['Password reset guide', 'Billing FAQ', 'API docs'],
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

await upsertVectors(store, [
  {
    id: 'doc-password-reset',
    content: 'Password reset guide',
    vector: embedResult.embeddings[0],
    metadata: {
      title: 'Password Reset Guide',
      category: 'support',
      documentType: 'kb',
      tags: ['password', 'reset', 'account'],
    },
  },
  {
    id: 'doc-billing-faq',
    content: 'Billing FAQ',
    vector: embedResult.embeddings[1],
    metadata: {
      title: 'Billing FAQ',
      category: 'billing',
      documentType: 'kb',
      tags: ['billing', 'payment', 'invoice'],
    },
  },
  {
    id: 'doc-api-docs',
    content: 'API docs',
    vector: embedResult.embeddings[2],
    metadata: {
      title: 'API Documentation',
      category: 'developer',
      documentType: 'api',
      tags: ['api', 'developer', 'integration'],
    },
  },
]);

console.log('Upserted 3 vectors');

// Upsert is idempotent — calling again with same IDs updates vectors in place
// Cost tracked automatically via costTracker.track()
```

### Example 5: Vector Similarity Search

```typescript
import { searchVectors, embed } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Search for similar documents using ANN (approximate nearest neighbor)
// ═══════════════════════════════════════════════════════════════════════════════

// First, embed the query using the same model as the indexed vectors
const queryResult = await embed({
  input: 'How do I change my password?',
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

// Search the vector store
const results = await searchVectors(store, {
  vector: queryResult.embeddings[0],
  topK: 5,
  minScore: 0.7,           // Only return results with >70% similarity
  filter: {
    where: { category: 'support' },
  },
  includeContent: true,
  includeVectors: false,    // Don't return raw vectors (saves bandwidth)
});

console.log(`Found ${results.length} results:`);
results.forEach((r, i) => {
  console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.metadata.title}`);
  console.log(`     ${r.content.substring(0, 100)}...`);
});
// Output:
//   1. [0.934] Password Reset Guide
//      Password reset guide...
//   2. [0.812] Account Security Settings
//      Account security settings...
```

### Example 6: Hybrid Search (Vector + Full-Text)

```typescript
import { hybridSearch, embed } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Combine semantic similarity with PostgreSQL tsvector keyword matching
// ═══════════════════════════════════════════════════════════════════════════════

const queryEmbedding = await embed({
  input: 'configure API authentication',
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

const results = await hybridSearch(store, {
  vector: queryEmbedding.embeddings[0],
  text: 'API authentication OAuth',  // Keywords for full-text search
  topK: 10,
  vectorWeight: 0.7,                 // 70% semantic similarity
  textWeight: 0.3,                   // 30% keyword match
  language: 'english',               // tsvector language config
  rankFunction: 'rank_cd',           // cover density ranking
  filter: {
    where: { documentType: 'api' },
  },
});

results.forEach((r, i) => {
  console.log(`${i + 1}. [${r.score.toFixed(3)}] ${r.metadata.title}`);
});

// Generated SQL (conceptual):
//   SELECT *,
//     (0.7 * (1 - (vector <=> $queryVector))) +
//     (0.3 * ts_rank_cd(content_tsv, plainto_tsquery('english', $text)))
//     AS combined_score
//   FROM document_embeddings
//   WHERE store_id = $storeId AND document_type = 'api'
//   ORDER BY combined_score DESC
//   LIMIT 10
```

### Example 7: Document Chunking and Indexing Pipeline

```typescript
import {
  chunkDocument,
  embedBatch,
  upsertVectors,
  createVectorStore,
} from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Full document ingestion pipeline (mirrors DocumentIngestionPipeline in @mcv/rag)
// ═══════════════════════════════════════════════════════════════════════════════

async function ingestDocument(
  store: VectorStore,
  document: { id: string; content: string; title: string; type: string },
  ventureId: string,
) {
  // Step 1: Chunk the document using store's chunk config
  const chunks = chunkDocument(document.content, {
    maxTokens: 256,           // DEFAULT_STORE_CONFIG.chunkMaxTokens
    overlap: 64,              // DEFAULT_STORE_CONFIG.chunkOverlap
    strategy: 'semantic',     // DEFAULT_STORE_CONFIG.chunkingStrategy
    respectParagraphs: true,
    minTokens: 20,
    includeMetadata: true,
  });

  console.log(`Split "${document.title}" into ${chunks.totalChunks} chunks`);
  console.log(`Total tokens: ${chunks.totalTokens}`);

  // Step 2: Embed all chunks in batches (MAX_BATCH_SIZE=100)
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.chunks.length; i += batchSize) {
    const batch = chunks.chunks.slice(i, i + batchSize);
    const result = await embedBatch({
      input: batch,
      model: 'openai/text-embedding-3-small',
      ventureId,
    });
    allEmbeddings.push(...result.embeddings);
  }

  // Step 3: Store vectors with source tracking
  const vectors = chunks.chunks.map((content, i) => ({
    id: `${document.id}-chunk-${i}`,
    content,
    vector: allEmbeddings[i],
    metadata: {
      title: document.title,
      documentType: document.type,
      ...chunks.chunkMetadata[i],
    },
    sourceId: document.id,
    chunkIndex: i,
    totalChunks: chunks.totalChunks,
  }));

  await upsertVectors(store, vectors);

  // Step 4: Track cost (mirrors costTracker.track() in @mcv/rag)
  const cost = (chunks.totalTokens / 1_000_000) * 0.15; // INDEXING_COST_PER_1M_TOKENS
  console.log(`Indexed ${vectors.length} vectors for "${document.title}" ($${cost.toFixed(6)})`);
}

// Usage
await ingestDocument(store, {
  id: 'doc-123',
  content: longDocumentText,
  title: 'BetEdge API Reference',
  type: 'api',
}, 'betedge-venture-uuid');
```

### Example 8: Markdown-Aware Chunking

```typescript
import { chunkMarkdown } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Chunk markdown preserving heading hierarchy as chunk metadata
// ═══════════════════════════════════════════════════════════════════════════════

const markdown = `
# Getting Started

Welcome to BetEdge. This guide covers setup and configuration.

## Installation

Install the SDK via npm:

\`\`\`bash
npm install @betedge/sdk
\`\`\`

## Authentication

### API Keys

Generate API keys from your dashboard...

### OAuth 2.0

For user-facing apps, use OAuth 2.0 flow...

## Quick Start

Here's a minimal example...
`;

const chunks = chunkMarkdown(markdown, {
  maxTokens: 200,
  overlap: 32,
  minTokens: 20,
});

chunks.chunks.forEach((chunk, i) => {
  const meta = chunks.chunkMetadata[i] as { headings: string[] };
  console.log(`Chunk ${i}: [${meta.headings.join(' > ')}]`);
  console.log(`  ${chunk.substring(0, 80)}...`);
  console.log(`  Tokens: ${chunks.tokenCounts[i]}`);
});
// Chunk 0: [Getting Started]
//   Welcome to BetEdge. This guide covers setup and configuration....
//   Tokens: 45
// Chunk 1: [Getting Started > Installation]
//   Install the SDK via npm: ```bash npm install @betedge/sdk ```...
//   Tokens: 38
// Chunk 2: [Getting Started > Authentication > API Keys]
//   Generate API keys from your dashboard...
//   Tokens: 120
```

### Example 9: Multi-Store Search

```typescript
import { multiStoreSearch, embed } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Search across multiple knowledge stores simultaneously
// Mirrors FileSearchManager.queryMultiStore() in @mcv/rag
// ═══════════════════════════════════════════════════════════════════════════════

const queryEmbedding = await embed({
  input: 'How do I handle rate limiting?',
  model: 'openai/text-embedding-3-small',
  ventureId: 'betedge-venture-uuid',
});

const results = await multiStoreSearch({
  vector: queryEmbedding.embeddings[0],
  storeIds: [
    'betedge-api-docs',
    'betedge-support-kb',
    'shared-best-practices',    // Shared store (isShared=true)
  ],
  topK: 10,
  minScore: 0.6,
  ventureId: 'betedge-venture-uuid',
  mergeStrategy: 'interleave', // or 'concatenate', 'rerank'
});

// Results include storeId so you know which store each result came from
results.forEach((r, i) => {
  console.log(`${i + 1}. [${r.score.toFixed(3)}] [${r.storeId}] ${r.metadata.title}`);
});

// Access control is enforced:
// - Shared stores: accessible to all ventures
// - Owner stores: only the owning venture
// - allowedVentures: specific ventures with read access
```

### Example 10: Reranking Results with Cross-Encoder

```typescript
import { searchVectors, rerankResults } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Two-stage retrieval: fast ANN search → accurate LLM reranking
// Mirrors SemanticRanker from @mcv/rag with batch/individual scoring
// ═══════════════════════════════════════════════════════════════════════════════

// Stage 1: Fast approximate search (retrieve more candidates)
const candidates = await searchVectors(store, {
  vector: queryEmbedding,
  topK: 50,              // Fetch 50 candidates (DEFAULT_DEEP_RAG_CONFIG.initialRetrievalSize)
  minScore: 0.5,
});

// Stage 2: Rerank with cross-encoder for precision
const reranked = await rerankResults({
  query: 'How do I handle API rate limiting?',
  results: candidates,
  model: 'cohere/rerank-v3.5',    // Or 'gemini-2.0-flash' for LLM-based scoring
  topK: 5,                         // Return top 5 after reranking
  ventureId: 'betedge-venture-uuid',
  batchScoring: true,              // Score in batches for efficiency
  batchSize: 5,                    // DEFAULT_RERANK_CONFIG.batchSize
  threshold: 0.0,                  // DEFAULT_RERANK_CONFIG.threshold
});

console.log('Reranked results:');
reranked.forEach((r, i) => {
  console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.metadata.title}`);
  console.log(`     Original rank: ${r.originalRank}, Delta: ${r.rankDelta}`);
});

// Reranking improves quality significantly:
// - Vector search is fast but approximate
// - Cross-encoder considers query-document interaction
// - Typical improvement: 15-30% better relevance in top-5
```

### Example 11: Delete and Manage Vectors

```typescript
import { deleteVectors, countVectors, listVectors } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Vector lifecycle management (CRUD operations)
// ═══════════════════════════════════════════════════════════════════════════════

// Count vectors in store (uses pg_class.reltuples for >10K vectors)
const count = await countVectors(store, {
  filter: { where: { documentType: 'kb' } },
});
console.log(`Knowledge base vectors: ${count}`);

// List vectors with pagination
const page = await listVectors(store, {
  limit: 20,
  offset: 0,
  filter: { where: { category: 'support' } },
  orderBy: 'createdAt',
  order: 'desc',
});
console.log(`Page 1: ${page.vectors.length} vectors (total: ${page.total})`);

// Delete specific vectors by ID
await deleteVectors(store, {
  ids: ['doc-old-1', 'doc-old-2'],
});

// Delete by filter (e.g., remove all vectors from a deleted file)
// Mirrors DocumentIngestionPipeline.delete() in @mcv/rag
await deleteVectors(store, {
  filter: { where: { sourceId: 'deleted-file-uuid' } },
});

// Delete all vectors in a store (requires explicit confirmation)
await deleteVectors(store, {
  filter: { where: { storeId: store.storeId } },
  confirm: true, // Required for bulk deletes
});
```

### Example 12: Index Management and Optimization

```typescript
import { createVectorStore } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Index lifecycle: create, monitor, rebuild, optimize
// ═══════════════════════════════════════════════════════════════════════════════

const store = createVectorStore({
  storeId: 'betedge-knowledge-v1',
  dimensions: 1536,
  distanceMetric: 'cosine',
  indexType: 'hnsw',
  ventureId: 'betedge-venture-uuid',
});

// Check if index needs rebuild (after >30% updates/deletes)
const stats = await store.getIndexStats();
if (stats.needsRebuild) {
  console.log('Index needs rebuild — starting...');
  
  // Drop old index
  await store.dropIndex();
  
  // Rebuild with parameters tuned for vector count
  const vectorCount = stats.vectorCount;
  await store.createIndex({
    type: 'hnsw',
    m: vectorCount > 100000 ? 32 : 16,         // More connections for large stores
    efConstruction: vectorCount > 100000 ? 128 : 64,  // Deeper build for large stores
    efSearch: 40,
  });
  
  // Run ANALYZE for query planner optimization
  await store.analyzeIndex();
  
  console.log('Index rebuilt successfully');
}

// For bulk import workflows, use IVFFlat (faster build time)
const bulkStore = createVectorStore({
  storeId: 'bulk-import-store',
  dimensions: 1536,
  distanceMetric: 'cosine',
  indexType: 'ivfflat',
  ventureId: 'betedge-venture-uuid',
});

await bulkStore.createIndex({
  type: 'ivfflat',
  lists: Math.ceil(Math.sqrt(expectedVectorCount)), // sqrt(n) lists is optimal
});
```

### Example 13: Code-Aware Chunking

```typescript
import { chunkCode } from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Chunk source code preserving function and class boundaries
// ═══════════════════════════════════════════════════════════════════════════════

const sourceCode = `
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User> {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const validated = userSchema.parse(data);
    return this.db.insert('users', validated);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete('users', { id });
  }
}
`;

const chunks = chunkCode(sourceCode, {
  maxTokens: 200,
  overlap: 32,
  strategy: 'code',
  // Respects: function boundaries, class boundaries, import blocks
});

chunks.chunks.forEach((chunk, i) => {
  const meta = chunks.chunkMetadata[i] as { type: string; name: string };
  console.log(`Chunk ${i}: [${meta.type}] ${meta.name}`);
  console.log(`  ${chunk.substring(0, 60)}...`);
});
// Chunk 0: [class] UserService
//   export class UserService { constructor(private db: Database)...
// Chunk 1: [method] UserService.createUser
//   async createUser(data: CreateUserInput): Promise<User> { ...
```

### Example 14: Embedding Model Comparison

```typescript
import {
  embedWithModel,
  listEmbeddingModels,
  getModelDimensions,
} from '@mcv/intelligence/embedding';

// ═══════════════════════════════════════════════════════════════════════════════
// Compare embedding models for quality, dimensions, and cost
// ═══════════════════════════════════════════════════════════════════════════════

const models = listEmbeddingModels();
console.log('Available embedding models:');
models.forEach((m) => {
  console.log(`  ${m.id}: ${m.dimensions}d, $${m.costPer1mTokens}/1M tok, max ${m.maxInputTokens} tok`);
});
// openai/text-embedding-3-small: 1536d, $0.02/1M tok, max 8192 tok
// openai/text-embedding-3-large: 3072d, $0.13/1M tok, max 8192 tok
// cohere/embed-v4.0:            1024d, $0.10/1M tok, max 2048 tok
// google/text-embedding-005:     768d, $0.00/1M tok, max 2048 tok

// Compare embeddings from different models
const text = 'Machine learning is a subset of artificial intelligence';
const query = 'What is ML?';

for (const model of [
  'openai/text-embedding-3-small',
  'openai/text-embedding-3-large',
  'cohere/embed-v4.0',
]) {
  const [textEmb, queryEmb] = await Promise.all([
    embedWithModel(text, model, 'test-venture'),
    embedWithModel(query, model, 'test-venture'),
  ]);

  const similarity = cosineSimilarity(textEmb.embeddings[0], queryEmb.embeddings[0]);
  console.log(
    `${model}: sim=${similarity.toFixed(4)}, dims=${textEmb.dimensions}, cost=$${textEmb.costUsd.toFixed(8)}`
  );
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
```

### Example 15: React Components — Search Playground & Index Health

```tsx
import { useSemanticSearch, useVectorStore } from '@mcv/intelligence/embedding/client';
import { SearchPlayground, IndexHealthPanel } from '@mcv/intelligence/embedding/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Semantic search React component with live results
// ═══════════════════════════════════════════════════════════════════════════════

function KnowledgeSearch({ storeId, ventureId }: Props) {
  const { search, results, isSearching } = useSemanticSearch({
    storeId,
    ventureId,
    model: 'openai/text-embedding-3-small',
    topK: 10,
    minScore: 0.6,
  });

  const [query, setQuery] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={() => search(query)}
          disabled={isSearching}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.map((r) => (
        <div key={r.id} className="border rounded p-3">
          <div className="flex justify-between text-sm text-muted">
            <span>{r.metadata.title}</span>
            <span>{(r.score * 100).toFixed(1)}% match</span>
          </div>
          <p className="mt-1">{r.content}</p>
          <div className="text-xs text-muted mt-1">
            Store: {r.storeId} | Chunk {r.chunkIndex}
          </div>
        </div>
      ))}

      {/* Built-in playground component with model selector + filters */}
      <SearchPlayground storeId={storeId} ventureId={ventureId} />
      
      {/* Index health monitoring with rebuild controls */}
      <IndexHealthPanel storeId={storeId} />
    </div>
  );
}
```

---

## Configuration Constants

Default values derived from the production `@mcv/rag` package's `constants/defaults.ts`:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// STORE DEFAULTS (from DEFAULT_STORE_CONFIG)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_STORE_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024 * 1024,   // 2GB maximum store size
  chunkMaxTokens: 256,                      // Balanced context per chunk
  chunkOverlap: 64,                         // Context continuity between chunks
  chunkingStrategy: 'semantic' as const,    // Intelligent boundary detection
  dataClassification: 'internal' as const,  // Default access level
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DEFAULTS (from DEFAULT_QUERY_CONFIG)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_QUERY_CONFIG = {
  maxChunks: 50,                            // Maximum chunks to retrieve
  useCache: true,                           // Redis-backed caching enabled
  cacheTtlSeconds: 3600,                    // 1 hour cache TTL
  synthesisModel: 'gemini-2.0-flash',       // Model for answer synthesis
  synthesisTemperature: 0.7,                // Temperature for synthesis
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DEEP RAG DEFAULTS (from DEFAULT_DEEP_RAG_CONFIG)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_DEEP_RAG_CONFIG = {
  maxDepth: 3,                              // Maximum recursion depth
  gapThreshold: 0.7,                        // Coverage threshold for gap detection
  maxGapsPerLevel: 3,                       // Maximum follow-up queries per level
  synthesisModel: 'gemini-2.0-flash',       // Model for synthesis
  rerankTopK: 5,                            // Chunks after reranking
  initialRetrievalSize: 50,                 // Initial retrieval before reranking
  gapDetectionTemperature: 0.1,             // Low temp for deterministic gap detection
  synthesisTemperature: 0.5,                // Moderate temp for synthesis
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// RERANKING DEFAULTS (from DEFAULT_RERANK_CONFIG)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_RERANK_CONFIG = {
  topK: 10,                                 // Chunks returned after reranking
  threshold: 0.0,                           // No threshold by default
  model: 'gemini-2.0-flash',               // LLM for cross-encoder scoring
  batchScoring: true,                       // Batch for efficiency
  batchSize: 5,                             // Chunks per batch
  temperature: 0.0,                         // Deterministic scoring
  maxScoringTokens: 200,                    // Max tokens per scoring response
  maxChunkTextLength: 1500,                 // Truncate long chunks for scoring
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COST CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const INDEXING_COST_PER_1M_TOKENS = 0.15;  // Google GenAI File Search
export const QUERY_COST_PER_1M_TOKENS = 0;         // Queries are essentially free

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
  uploadsPerMinute: 20,                     // Per venture
  queriesPerMinute: 100,                    // Per venture
  deepQueriesPerMinute: 20,                 // Per venture
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CONCURRENCY LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

export const CONCURRENCY_LIMITS = {
  maxConcurrentUploads: 5,                  // Parallel file uploads
  maxConcurrentQueries: 10,                 // Parallel search queries
  maxConcurrentGapQueries: 3,               // Parallel Deep RAG gap queries
} as const;
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Single embedding (API) | < 100ms | < 300ms |
| Batch embedding (100 texts) | < 500ms | < 1.5s |
| Vector search (HNSW, 100K vectors) | < 10ms | < 30ms |
| Vector search (HNSW, 1M vectors) | < 20ms | < 50ms |
| Vector search (IVFFlat, 100K vectors) | < 15ms | < 40ms |
| Hybrid search (100K vectors) | < 25ms | < 60ms |
| Upsert single vector | < 5ms | < 15ms |
| Upsert batch (100 vectors) | < 50ms | < 150ms |
| Semantic rerank (10 chunks, batch) | < 500ms | < 1.5s |
| Semantic rerank (10 chunks, individual) | < 2s | < 5s |
| Deep RAG query (depth 3) | < 10s | < 30s |
| Index rebuild (100K vectors, HNSW) | < 60s | < 120s |
| Index rebuild (1M vectors, HNSW) | < 600s | < 900s |
| Text chunking (10K tokens) | < 10ms | < 30ms |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Embeddings/second | 100 | 1,000+ |
| Vector searches/second | 500 | 5,000+ |
| Upserts/second | 200 | 2,000+ |
| Hybrid searches/second | 200 | 2,000+ |
| Semantic reranks/second | 5 | 50+ |

### Optimization Strategies

1. **Batch embedding** — Always use `embedBatch()` for multiple texts; single-call overhead adds ~50ms per request
2. **Dimension reduction** — Use `text-embedding-3-small` (1536d) instead of `text-embedding-3-large` (3072d) unless quality requires it; halves storage and speeds search by ~2x
3. **HNSW over IVFFlat** — HNSW has better recall and query performance; use IVFFlat only for bulk imports (faster build time)
4. **Index tuning** — Increase `m` and `efConstruction` for better recall; increase `efSearch` for better query accuracy at slight latency cost
5. **Metadata filtering first** — Apply metadata `WHERE` clauses before vector search to reduce the candidate set
6. **Embedding caching** — Cache frequently-used query embeddings in Redis (TTL: 1 hour from `DEFAULT_QUERY_CONFIG.cacheTtlSeconds`)
7. **Partitioned tables** — For >10M vectors, partition `document_embeddings` by `venture_id` or `store_id`
8. **Vacuuming** — Run `VACUUM ANALYZE` after bulk deletes to reclaim space and update planner stats
9. **Connection pooling** — Use PgBouncer for high-concurrency vector search workloads
10. **Approximate counts** — Use `reltuples` from `pg_class` instead of `COUNT(*)` for tables with >10K rows
11. **Batch reranking** — Use `batchScoring: true` with `batchSize: 5` for SemanticRanker (scores 5 chunks per LLM call)
12. **Concurrency limits** — Enforce `CONCURRENCY_LIMITS.maxConcurrentUploads=5` and `maxConcurrentQueries=10` via `p-limit`

### Storage Estimates

| Vectors | Dimensions | Index Type | Approximate Size |
|---------|-----------|------------|------------------|
| 10,000 | 1536 | HNSW | ~100 MB |
| 100,000 | 1536 | HNSW | ~1 GB |
| 1,000,000 | 1536 | HNSW | ~10 GB |
| 10,000 | 3072 | HNSW | ~200 MB |
| 100,000 | 3072 | HNSW | ~2 GB |
| 1,000,000 | 3072 | HNSW | ~20 GB |

### Embedding Model Cost Comparison

| Model | Dimensions | Cost/1M Tokens | Max Input | Batch Size | Quality |
|-------|-----------|---------------|-----------|------------|---------|
| openai/text-embedding-3-small | 1536 | $0.02 | 8192 | 100 | Good |
| openai/text-embedding-3-large | 3072 | $0.13 | 8192 | 100 | Best |
| cohere/embed-v4.0 | 1024 | $0.10 | 2048 | 96 | Good |
| cohere/embed-multilingual-v3.0 | 1024 | $0.10 | 2048 | 96 | Good (multilingual) |
| google/text-embedding-005 | 768 | $0.00 | 2048 | 100 | Good |
| local/nomic-embed | 768 | Free | 8192 | 512 | Adequate |
| local/bge-large | 1024 | Free | 512 | 256 | Adequate |

---

## Security Considerations

### Data Isolation (Multi-Tenancy)

- **Venture scoping**: All vector operations require and are scoped to `ventureId`; cross-venture queries are structurally impossible
- **Store ACLs**: `file_search_stores.allowed_ventures` and `required_roles` enforce access control at the store level
- **Data classification**: Stores have `data_classification` ('public', 'internal', 'confidential') which gates access levels
- **Row-level security**: PostgreSQL RLS policies enforce venture isolation at the database level
- **Shared stores**: Stores with `isShared=true` are accessible to all ventures; `allowedVentures[]` grants read access to specific ventures

### Embedding Privacy

- **No PII reconstruction from vectors**: Embeddings are one-way transformations; raw text cannot be reconstructed from vectors alone
- **Content storage**: Original `content` is stored alongside vectors for search result display — apply PII filtering/redaction before indexing if ZDR (Zero Data Retention) is required
- **API key security**: Embedding API keys (OpenAI, Cohere, Google) are stored in environment variables or `@mcv/secrets` System Vault, never in database
- **Transit encryption**: All embedding API calls use TLS 1.3
- **Local model option**: For maximum data privacy, use local Ollama models (nomic-embed, bge-large) — text never leaves the infrastructure

### Access Control Matrix

| Operation | Required Role | Scope |
|-----------|--------------|-------|
| searchVectors / hybridSearch | viewer | Own venture or shared store |
| multiStoreSearch | viewer | Per-store ACL check |
| upsertVectors | editor | Own venture stores only |
| deleteVectors | editor | Own venture stores only |
| deleteVectors (bulk) | admin | Own venture + `confirm: true` |
| createVectorStore | admin | Own venture |
| dropIndex / rebuildIndex | admin | Own venture |
| Store creation/deletion | admin | Own venture |
| Store config change | admin | Own venture |
| setDefaultModel | super_admin | Global |

### Budget & Rate Limiting

The embedding module integrates with the `@mcv/gateway` budget service for cost control:

- **Pre-flight budget check**: Before synthesis operations, `gatewayIntegration.executeSynthesisWithBudget()` verifies the venture has remaining budget
- **Rate limiting per venture**: Enforced via `RATE_LIMITS` (20 uploads/min, 100 queries/min, 20 deep queries/min)
- **Cost tracking**: Every embedding, query, rerank, and synthesis operation is tracked in `file_search_costs`
- **Budget exceeded errors**: `SynthesisBudgetExceededError` thrown with budget status details
- **Rate limit errors**: `SynthesisRateLimitError` thrown with retry-after header

---

## Audit Events

All operations are logged to `rag_audit_logs` for compliance and security auditing.

| Event | Category | Description |
|-------|----------|-------------|
| `embedding.generated` | system | Single embedding generated for text |
| `embedding.batch_generated` | system | Batch embedding completed |
| `embedding.failed` | system | Embedding generation failed (API error, rate limit, etc.) |
| `vector.upserted` | system | Vectors inserted or updated |
| `vector.deleted` | system | Specific vectors deleted by ID |
| `vector.bulk_deleted` | admin | Bulk vector deletion by filter (requires `confirm: true`) |
| `vector.searched` | system | Vector similarity search performed |
| `vector.hybrid_searched` | system | Hybrid (vector + full-text) search performed |
| `vector.multi_store_searched` | system | Multi-store search performed |
| `store.created` | admin | Vector store created |
| `store.deleted` | admin | Vector store deleted |
| `store.config_updated` | admin | Store configuration changed (chunk config, ACLs, etc.) |
| `index.created` | admin | pgvector index created (HNSW or IVFFlat) |
| `index.dropped` | admin | pgvector index dropped |
| `index.rebuilt` | admin | pgvector index rebuilt |
| `index.analyzed` | admin | ANALYZE run on index |
| `chunk.processed` | system | Document chunked for indexing |
| `embedding.model_changed` | admin | Default embedding model changed |
| `embedding.cost_tracked` | system | Embedding cost recorded to `file_search_costs` |
| `rerank.completed` | system | Semantic reranking completed |
| `rerank.fallback` | system | Reranking failed, fell back to original scores |
| `deep_rag.query` | system | Deep RAG recursive query executed |
| `deep_rag.gap_detected` | system | Information gap detected in Deep RAG |
| `budget.exceeded` | system | Operation blocked due to budget limit |
| `rate_limit.exceeded` | system | Operation blocked due to rate limit |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING MODEL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

EMBEDDING_DEFAULT_MODEL=openai/text-embedding-3-small  # Default embedding model
EMBEDDING_DEFAULT_DIMENSIONS=1536                       # Default vector dimensions
EMBEDDING_MAX_BATCH_SIZE=100                            # Max texts per batch request
EMBEDDING_MAX_INPUT_TOKENS=8192                         # Max tokens per input text
EMBEDDING_ENCODING_FORMAT=float                         # 'float' or 'base64'

# ═══════════════════════════════════════════════════════════════════════════════
# API KEYS (fetched from @mcv/secrets System Vault in production)
# ═══════════════════════════════════════════════════════════════════════════════

OPENAI_API_KEY=sk-...                                   # OpenAI API key (embeddings)
COHERE_API_KEY=...                                      # Cohere API key (reranking + embeddings)
GOOGLE_GENAI_API_KEY=...                                # Google GenAI API key (required for @mcv/rag)

# ═══════════════════════════════════════════════════════════════════════════════
# VECTOR STORE
# ═══════════════════════════════════════════════════════════════════════════════

VECTOR_DEFAULT_TABLE=document_embeddings                # Default table name
VECTOR_DEFAULT_DISTANCE=cosine                          # Default distance metric
VECTOR_DEFAULT_INDEX=hnsw                               # Default index type
VECTOR_AUTO_CREATE_TABLE=true                           # Auto-create table + pgvector ext if missing

# ═══════════════════════════════════════════════════════════════════════════════
# HNSW INDEX DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

HNSW_M=16                                               # Max connections per node
HNSW_EF_CONSTRUCTION=64                                  # Build-time search depth
HNSW_EF_SEARCH=40                                        # Query-time search depth

# ═══════════════════════════════════════════════════════════════════════════════
# IVFFLAT INDEX DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

IVFFLAT_LISTS=100                                        # Number of inverted lists
IVFFLAT_PROBES=10                                        # Probes at query time

# ═══════════════════════════════════════════════════════════════════════════════
# CHUNKING DEFAULTS (mirrors DEFAULT_STORE_CONFIG)
# ═══════════════════════════════════════════════════════════════════════════════

CHUNK_MAX_TOKENS=256                                     # Default max tokens per chunk
CHUNK_OVERLAP=64                                         # Default overlap tokens
CHUNK_STRATEGY=semantic                                  # Default: 'semantic' | 'fixed'
CHUNK_MIN_TOKENS=20                                      # Minimum chunk size (skip tiny chunks)

# ═══════════════════════════════════════════════════════════════════════════════
# CACHING (Redis-backed with in-memory fallback)
# ═══════════════════════════════════════════════════════════════════════════════

EMBEDDING_CACHE_ENABLED=true                             # Cache embeddings in Redis
EMBEDDING_CACHE_TTL=3600                                 # Cache TTL in seconds (1 hour)
EMBEDDING_CACHE_MAX_SIZE=10000                           # Max cached embeddings

# ═══════════════════════════════════════════════════════════════════════════════
# RATE LIMITING (mirrors RATE_LIMITS constant)
# ═══════════════════════════════════════════════════════════════════════════════

EMBEDDING_RATE_LIMIT_RPM=3000                            # Requests per minute (OpenAI default)
EMBEDDING_RATE_LIMIT_TPM=1000000                         # Tokens per minute
EMBEDDING_RETRY_MAX=3                                    # Max retries on rate limit
EMBEDDING_RETRY_DELAY_MS=1000                            # Initial retry delay (exponential backoff)

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

DATABASE_URL=postgresql://...                            # PostgreSQL connection (with pgvector)
PGVECTOR_EXTENSION=true                                  # Ensure pgvector extension is loaded
```

---

## Error Codes

| Code | Name | HTTP | Description | Resolution |
|------|------|------|-------------|------------|
| `EMB_MODEL_NOT_FOUND` | Unknown Embedding Model | 400 | Specified model not found in configuration | Check model ID against `listEmbeddingModels()` |
| `EMB_INPUT_TOO_LONG` | Input Exceeds Max Tokens | 400 | Input text exceeds model's `maxInputTokens` | Chunk the text first using `chunkText()` |
| `EMB_BATCH_TOO_LARGE` | Batch Size Exceeded | 400 | Batch contains more texts than `MAX_BATCH_SIZE` | Split into smaller batches (max: 100) |
| `EMB_API_ERROR` | Embedding API Error | 502 | External API returned an error | Check API key, rate limits, and model availability |
| `EMB_RATE_LIMITED` | Rate Limited | 429 | API rate limit exceeded | Wait and retry; auto-retry with exponential backoff is built in |
| `EMB_DIMENSION_MISMATCH` | Dimension Mismatch | 400 | Vector dimensions don't match store config | Ensure embedding model matches store's `dimensions` |
| `VEC_STORE_NOT_FOUND` | Store Not Found | 404 | Vector store ID not found in `file_search_stores` | Verify store ID or create the store first |
| `VEC_INDEX_EXISTS` | Index Already Exists | 409 | Attempted to create index that already exists | Drop existing index first or use `rebuildIndex()` |
| `VEC_INDEX_NOT_FOUND` | Index Not Found | 404 | No index exists for this store | Create an index using `createIndex()` |
| `VEC_FILTER_INVALID` | Invalid Filter | 400 | Metadata filter syntax is invalid | Check filter format against `VectorFilter` interface |
| `VEC_UPSERT_FAILED` | Upsert Failed | 500 | Failed to insert/update vectors | Check database connectivity and constraints |
| `VEC_SEARCH_FAILED` | Search Failed | 500 | Vector search query failed | Check index health and database connectivity |
| `VEC_PGVECTOR_MISSING` | pgvector Not Installed | 500 | pgvector extension not available in PostgreSQL | Run `CREATE EXTENSION IF NOT EXISTS vector` |
| `VEC_SIZE_EXCEEDED` | Store Size Limit Exceeded | 413 | Store's `maxSizeBytes` would be exceeded | Delete old vectors or increase `maxSizeBytes` |
| `CHUNK_EMPTY_INPUT` | Empty Input | 400 | Empty or whitespace-only text provided | Provide non-empty text content |
| `CHUNK_STRATEGY_UNKNOWN` | Unknown Strategy | 400 | Unrecognized chunking strategy | Use 'fixed', 'semantic', 'markdown', or 'code' |
| `BUDGET_EXCEEDED` | Budget Exceeded | 402 | Venture's LLM budget exceeded for synthesis | Check budget status; contact admin to increase |
| `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | 429 | Venture-level rate limit exceeded | Wait for retry-after period; reduce request frequency |
| `ACCESS_DENIED` | Access Denied | 403 | Venture not authorized for this store | Check `allowedVentures` and `requiredRoles` on store |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pgvector | ^0.2.x | PostgreSQL vector similarity search extension |
| drizzle-orm | ^0.29.x | Database ORM with pgvector support |
| @mcv/db | workspace | Shared database connection, schemas, and Drizzle instance |
| @mcv/gateway | workspace | LLM Gateway for reranking, synthesis, and budget enforcement |
| openai | ^4.x | OpenAI embedding API client |
| cohere-ai | ^7.x | Cohere embedding and reranking API |
| @google/genai | ^0.x | Google GenAI API (embeddings + File Search) |
| tiktoken | ^1.x | Token counting for accurate chunking |
| ioredis | ^5.x | Embedding cache (Redis-backed with in-memory fallback) |
| zod | ^3.x | Input validation for all public APIs |
| p-limit | ^8.x | Concurrency-limited batch processing |
| p-queue | ^8.x | Rate-limited API request queues |

---

## Testing Notes

### Unit Testing

```typescript
import {
  embed,
  embedBatch,
  searchVectors,
  chunkText,
  chunkMarkdown,
} from '@mcv/intelligence/embedding';

describe('Embedding Generation', () => {
  it('should generate embedding with correct dimensions', async () => {
    const result = await embed({
      input: 'Hello, world!',
      model: 'openai/text-embedding-3-small',
      ventureId: 'test-venture',
    });
    expect(result.embeddings).toHaveLength(1);
    expect(result.embeddings[0]).toHaveLength(1536);
    expect(result.dimensions).toBe(1536);
  });

  it('should handle batch embedding', async () => {
    const result = await embedBatch({
      input: ['Text 1', 'Text 2', 'Text 3'],
      model: 'openai/text-embedding-3-small',
      ventureId: 'test-venture',
    });
    expect(result.embeddings).toHaveLength(3);
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.costUsd).toBeGreaterThanOrEqual(0);
  });

  it('should reject input exceeding max tokens', async () => {
    await expect(embed({
      input: 'x'.repeat(100000),
      ventureId: 'test-venture',
    })).rejects.toThrow('EMB_INPUT_TOO_LONG');
  });

  it('should reject batch exceeding MAX_BATCH_SIZE', async () => {
    const inputs = Array(101).fill('test');
    await expect(embedBatch({
      input: inputs,
      ventureId: 'test-venture',
    })).rejects.toThrow('EMB_BATCH_TOO_LARGE');
  });
});

describe('Vector Search', () => {
  it('should return results sorted by similarity', async () => {
    const results = await searchVectors(testStore, {
      vector: queryVector,
      topK: 5,
    });
    expect(results).toHaveLength(5);
    // Scores should be descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it('should respect minScore filter', async () => {
    const results = await searchVectors(testStore, {
      vector: queryVector,
      topK: 10,
      minScore: 0.8,
    });
    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('should apply metadata filters', async () => {
    const results = await searchVectors(testStore, {
      vector: queryVector,
      topK: 5,
      filter: { where: { category: 'support' } },
    });
    results.forEach((r) => {
      expect(r.metadata.category).toBe('support');
    });
  });

  it('should enforce venture isolation', async () => {
    const results = await searchVectors(testStore, {
      vector: queryVector,
      topK: 100,
      ventureId: 'venture-a',
    });
    results.forEach((r) => {
      // All results must belong to venture-a (RLS enforced)
      expect(r.ventureId).toBe('venture-a');
    });
  });
});

describe('Chunking', () => {
  it('should chunk text within token limits', () => {
    const chunks = chunkText(longText, { maxTokens: 200, overlap: 32, strategy: 'fixed' });
    chunks.tokenCounts.forEach((tc) => {
      expect(tc).toBeLessThanOrEqual(200);
    });
  });

  it('should respect minTokens and skip tiny chunks', () => {
    const chunks = chunkText('Short.', { maxTokens: 200, overlap: 0, strategy: 'fixed', minTokens: 20 });
    // "Short." is <20 tokens, but if it's the only content, it should still be returned
    expect(chunks.totalChunks).toBeGreaterThanOrEqual(1);
  });

  it('should produce overlapping chunks', () => {
    const chunks = chunkText(longText, { maxTokens: 100, overlap: 20, strategy: 'fixed' });
    expect(chunks.totalChunks).toBeGreaterThan(1);
    for (let i = 1; i < chunks.chunks.length; i++) {
      const prevEnd = chunks.chunks[i - 1].slice(-50);
      const currStart = chunks.chunks[i].slice(0, 50);
      expect(prevEnd.length + currStart.length).toBeGreaterThan(0);
    }
  });

  it('should preserve markdown headings in chunk metadata', () => {
    const chunks = chunkMarkdown('# Title\n\nContent\n\n## Section\n\nMore', {
      maxTokens: 100,
      overlap: 0,
    });
    const meta = chunks.chunkMetadata[0] as { headings: string[] };
    expect(meta.headings).toContain('Title');
  });
});

describe('Semantic Reranking', () => {
  it('should rerank and return top-K results', async () => {
    const reranked = await rerankResults({
      query: 'test query',
      results: candidates,
      topK: 5,
      ventureId: 'test-venture',
    });
    expect(reranked).toHaveLength(5);
    // All results should have rerankScore
    reranked.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it('should fall back to original scores on error', async () => {
    // Mock LLM failure
    const reranked = await rerankResults({
      query: 'test query',
      results: candidates,
      topK: 3,
      ventureId: 'test-venture',
      model: 'nonexistent/model',
    });
    // Should still return results (fallback to original scores)
    expect(reranked.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing

```typescript
describe('Full Ingestion Pipeline', () => {
  it('should ingest, embed, store, and search a document', async () => {
    // 1. Create store
    const store = createVectorStore({
      storeId: 'test-store',
      dimensions: 1536,
      ventureId: 'test-venture',
    });

    // 2. Chunk document
    const chunks = chunkDocument('Long document text...', {
      maxTokens: 256,
      overlap: 64,
      strategy: 'semantic',
    });

    // 3. Embed chunks
    const embedResult = await embedBatch({
      input: chunks.chunks,
      ventureId: 'test-venture',
    });

    // 4. Store vectors
    await upsertVectors(store, chunks.chunks.map((content, i) => ({
      id: `test-chunk-${i}`,
      content,
      vector: embedResult.embeddings[i],
      metadata: { title: 'Test Doc' },
    })));

    // 5. Search
    const queryEmbed = await embed({
      input: 'search query',
      ventureId: 'test-venture',
    });

    const results = await searchVectors(store, {
      vector: queryEmbed.embeddings[0],
      topK: 3,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });
});
```

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/rag` | **Primary Consumer** | RAG uses embeddings for document ingestion (via `DocumentIngestionPipeline`), retrieval (`FileSearchManager`), reranking (`SemanticRanker`), and deep retrieval (`DeepRagService`) |
| `@mcv/intelligence/gateway` | **Provider** | Gateway's `embed()` function delegates to this module; budget/rate limiting enforced via `gatewayIntegration` |
| `@mcv/intelligence/context` | **Indirect Consumer** | Context assembly includes RAG results powered by embeddings |
| `@mcv/intelligence/memory` | **Consumer** | Memory uses embeddings for semantic memory recall and association |
| `@mcv/db` | **Infrastructure** | Provides pgvector-enabled PostgreSQL schemas, Drizzle ORM instance, and shared types |
| `@mcv/audit` | **Cross-cutting** | Audit events written to `rag_audit_logs` for compliance |
| `@mcv/secrets` | **Infrastructure** | API keys (OpenAI, Cohere, Google) fetched from System Vault in production |

---

## Migration Path: Google GenAI → pgvector

The current production RAG system uses Google GenAI File Search as a managed embedding + retrieval service. This module provides a migration path to self-hosted pgvector:

### Phase 1: Parallel Operation (Current)
- Google GenAI File Search handles production embedding/retrieval
- `@mcv/intelligence/embedding` implements the same interfaces against pgvector
- Both systems run in parallel for validation

### Phase 2: Dual Write
- New documents are indexed in both Google GenAI and pgvector
- Search can be routed to either backend via feature flag
- Performance and quality metrics compared

### Phase 3: pgvector Primary
- pgvector becomes the primary search backend
- Google GenAI used as fallback only
- Cost savings realized ($0.15/1M tokens → near-zero for self-hosted)

### Phase 4: Google GenAI Deprecation
- `google_store_name` and `google_file_name` columns become legacy
- `getGenAIClient()` in `@mcv/rag` no longer required
- Full control over embedding model, chunking strategy, and search pipeline

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-10 | Initial vector store with OpenAI embeddings and IVFFlat index |
| 0.2.0 | 2026-01-22 | Added HNSW index support, hybrid search with tsvector |
| 0.3.0 | 2026-02-01 | Added chunking service (fixed, semantic, markdown, code strategies) |
| 0.4.0 | 2026-02-05 | Added Cohere reranking, multi-store search, MMR diversity |
| 0.5.0 | 2026-02-08 | Added batch embedding, Redis caching, model comparison, budget integration |

---

*@mcv/intelligence/embedding — Embedding & Vector Storage Module*
