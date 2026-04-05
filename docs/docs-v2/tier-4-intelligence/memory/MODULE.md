# @mcv/intelligence/memory — Conversation Memory Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Extension)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q4 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `memory` module provides persistent conversation memory, long-term fact storage, automatic summarization, and memory-augmented generation for AI interactions. It enables AI assistants to remember user preferences, past conversations, and extracted facts across sessions — creating continuous, personalized relationships rather than stateless interactions. Memory is scoped per user per venture with configurable retention policies and privacy controls.

**This module gives AI the ability to remember — making every conversation build on the last.**

### Why Memory Matters

Without memory, every AI conversation starts from zero. The user repeats preferences, re-explains context, and never builds a relationship with the AI. Memory transforms AI from a stateless tool into a persistent partner that:

- **Remembers preferences** — "You prefer dark mode and metric units"
- **Tracks context** — "Last time we discussed your NBA parlay strategy"
- **Extracts facts** — "You're a software developer based in Toronto"
- **Follows instructions** — "Always respond in French when discussing football"
- **Summarizes history** — "Here's what we covered in your last 5 sessions"

Memory operates across three cognitive layers (working → episodic → semantic), mirroring how human memory consolidates short-term experiences into long-term knowledge.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY STORE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createMemoryStore,       // Create memory store for user/venture
  getMemoryStore,          // Get existing memory store
  deleteMemoryStore,       // Delete all memories for user/venture
} from './server/services/store-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  remember,                // Store a new memory
  recall,                  // Retrieve relevant memories
  forget,                  // Delete specific memory
  update,                  // Update existing memory
  search,                  // Search memories by text
  listMemories,            // List all memories with filters
  getMemoryById,           // Get single memory by ID
} from './server/services/memory-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  saveConversation,        // Save conversation messages
  getConversation,         // Get conversation by session ID
  listConversations,       // List user conversations
  deleteConversation,      // Delete conversation
  getRecentMessages,       // Get N most recent messages
} from './server/services/conversation-service';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-SUMMARIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  summarizeConversation,   // Generate conversation summary
  summarizeMemories,       // Consolidate old memories into summaries
  getSummary,              // Get summary by conversation/period
  runSummarizationJob,     // Cron: auto-summarize old conversations
} from './server/services/summarization-service';

// ═══════════════════════════════════════════════════════════════════════════════
// FACT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  extractFacts,            // Extract facts from conversation
  storeFact,               // Store a single fact
  getFacts,                // Get facts for user
  updateFact,              // Update fact
  deleteFact,              // Delete fact
} from './server/services/fact-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY-AUGMENTED GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  generateWithMemory,      // Chat completion with memory context
  buildMemoryContext,      // Build memory context for prompt assembly
  rankMemories,            // Score memory relevance for current query
} from './server/services/generation-service';

// ═══════════════════════════════════════════════════════════════════════════════
// RETENTION & PRIVACY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  setRetentionPolicy,      // Configure memory retention rules
  getRetentionPolicy,      // Get retention policy
  enforceRetention,        // Cron: delete expired memories
  exportUserMemories,      // GDPR: export all user memories
  purgeUserMemories,       // GDPR: purge all user memories
} from './server/services/retention-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useMemoryChat } from './client/hooks/use-memory-chat';
export { useMemoryExplorer } from './client/hooks/use-memory-explorer';
export { useConversationHistory } from './client/hooks/use-conversation-history';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { MemoryPanel } from './client/components/memory-panel';
export { ConversationList } from './client/components/conversation-list';
export { FactsEditor } from './client/components/facts-editor';
export { MemoryTimeline } from './client/components/memory-timeline';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MEMORY_TYPES,
  MEMORY_CATEGORIES,
  DEFAULT_RETENTION_DAYS,
  MAX_MEMORIES_PER_USER,
  SUMMARIZATION_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Memory,
  MemoryType,
  MemoryCategory,
  NewMemory,
  MemoryFilter,
  MemorySearchResult,

  Conversation,
  ConversationMessage,
  ConversationSummary,

  UserFact,
  FactCategory,
  ExtractedFact,

  RetentionPolicy,
  RetentionRule,

  MemoryContext,
  MemoryRanking,

  MemoryStoreConfig,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY MODULE ARCHITECTURE                                   │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         MEMORY LIFECYCLE                                      │   │
│  │                                                                               │   │
│  │   User Message                                                                │   │
│  │       │                                                                       │   │
│  │       ▼                                                                       │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │   │
│  │  │ Recall   │───▶│ Assemble │───▶│ Generate │───▶│ Extract  │              │   │
│  │  │ Relevant │    │ Context  │    │ Response │    │ & Store  │              │   │
│  │  │ Memories │    │          │    │          │    │ New Facts │              │   │
│  │  │          │    │ System + │    │ Gateway  │    │          │              │   │
│  │  │ Vector   │    │ Memory + │    │ Chat     │    │ Facts    │              │   │
│  │  │ Search   │    │ History +│    │ Request  │    │ Prefs    │              │   │
│  │  │          │    │ User Msg │    │          │    │ Summaries│              │   │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │   │
│  │       ▲                                               │                      │   │
│  │       │              ┌────────────────────────────────┘                      │   │
│  │       │              ▼                                                        │   │
│  │       │     ┌──────────────┐                                                  │   │
│  │       │     │  Importance  │                                                  │   │
│  │       └─────│  Decay +     │                                                  │   │
│  │             │  Access      │                                                  │   │
│  │             │  Tracking    │                                                  │   │
│  │             └──────────────┘                                                  │   │
│  │                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         MEMORY LAYERS                                         │   │
│  │                                                                               │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  WORKING MEMORY (Session-scoped)                                      │   │   │
│  │  │  • Current conversation messages                                      │   │   │
│  │  │  • Sliding window (last N messages, recent first)                     │   │   │
│  │  │  • Ephemeral — cleared when session ends                              │   │   │
│  │  │  • Stored in Redis (TTL: 24h)                                         │   │   │
│  │  │  • Key: mem:{ventureId}:{userId}:session:{sessionId}                  │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │
│  │                                       │ overflow/summarize                    │   │
│  │                                       ▼                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  EPISODIC MEMORY (Conversation-scoped)                                │   │   │
│  │  │  • Conversation summaries                                             │   │   │
│  │  │  • Auto-generated after session ends                                  │   │   │
│  │  │  • Retention: 90 days (configurable)                                  │   │   │
│  │  │  • Stored in PostgreSQL + pgvector                                    │   │   │
│  │  │  • HNSW index for sub-linear similarity search                        │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │
│  │                                       │ consolidate                           │   │
│  │                                       ▼                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  SEMANTIC MEMORY (User-scoped, permanent)                             │   │   │
│  │  │  • User preferences ("prefers dark mode")                             │   │   │
│  │  │  • Facts ("software developer", "lives in Toronto")                   │   │   │
│  │  │  • Goals ("wants to learn ML")                                        │   │   │
│  │  │  • Instructions ("always respond in French for football")             │   │   │
│  │  │  • Extracted from conversations automatically via LLM                 │   │   │
│  │  │  • Stored in PostgreSQL + pgvector                                    │   │   │
│  │  │  • Deduplicated on store (cosine similarity > 0.95 = update)          │   │   │
│  │  └───────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                    INTEGRATION WITH TIER 4 MODULES                            │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │   Gateway    │  │  Embedding   │  │   Personas   │  │     RAG      │    │   │
│  │  │              │  │              │  │              │  │              │    │   │
│  │  │ LLM calls   │  │ Vectorize    │  │ Persona-     │  │ Knowledge-   │    │   │
│  │  │ for summary, │  │ memories,    │  │ scoped       │  │ grounded     │    │   │
│  │  │ extraction,  │  │ facts, and   │  │ memory       │  │ memory       │    │   │
│  │  │ generation   │  │ queries      │  │ contexts     │  │ recall       │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  │                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐│
│  │                           DATABASE LAYER                                          ││
│  │                                                                                   ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            ││
│  │  │  memories    │ │ai_convs      │ │ user_facts   │ │conv_summaries│            ││
│  │  │              │ │              │ │              │ │              │            ││
│  │  │ Content,     │ │ Messages,    │ │ Extracted    │ │ AI-generated │            ││
│  │  │ embeddings,  │ │ session,     │ │ facts with   │ │ summaries of │            ││
│  │  │ categories,  │ │ metadata,    │ │ categories,  │ │ conversations│            ││
│  │  │ importance   │ │ token count  │ │ confidence   │ │              │            ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘            ││
│  │                                                                                   ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                              ││
│  │  │retention_    │ │ai_conv_      │ │ Redis        │                              ││
│  │  │policies      │ │messages      │ │              │                              ││
│  │  │              │ │              │ │ Working mem, │                              ││
│  │  │ Per-venture  │ │ Individual   │ │ session      │                              ││
│  │  │ retention    │ │ messages w/  │ │ messages,    │                              ││
│  │  │ rules        │ │ tool calls   │ │ hot cache    │                              ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘                              ││
│  │                                                                                   ││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Types

| Type | Scope | Retention | Storage | Description |
|------|-------|-----------|---------|-------------|
| `working` | Session | Session lifetime | Redis | Current conversation messages |
| `episodic` | Conversation | 90 days (configurable) | PostgreSQL + pgvector | Conversation summaries |
| `preference` | User | Permanent | PostgreSQL + pgvector | User preferences |
| `fact` | User | Permanent | PostgreSQL + pgvector | Factual information about user |
| `goal` | User | Permanent | PostgreSQL + pgvector | User goals and intentions |
| `instruction` | User | Permanent | PostgreSQL + pgvector | User-defined instructions ("always respond in French") |
| `interaction` | User | 30 days | PostgreSQL | Raw interaction metadata |

---

## Memory Ranking Algorithm

When recalling memories for context assembly, the module scores each candidate memory using a weighted combination of three factors:

```
Final Score = (relevanceWeight × relevanceScore)
            + (importanceWeight × importanceScore)
            + (recencyWeight × recencyScore)

Default weights:
  relevanceWeight  = 0.3   (semantic similarity to current query)
  importanceWeight = 0.4   (user-set or auto-calculated importance)
  recencyWeight    = 0.3   (time decay — fresher memories score higher)
```

### Relevance Score

Cosine similarity between the query embedding and the memory embedding (both 1536-dimension vectors via OpenAI `text-embedding-3-small` or equivalent):

```
relevanceScore = cosineSimilarity(queryEmbedding, memoryEmbedding)
// Range: 0.0 – 1.0 (negative similarities clamped to 0)
```

### Importance Score

Each memory has an `importance` field (0.0–1.0) that decays over time unless the memory is accessed:

```
effectiveImportance = baseImportance × decayFactor

decayFactor = max(0.1, 1.0 - (daysSinceLastAccess / 365))
// Memories lose up to 90% importance over a year without access
// Floor of 0.1 prevents total decay

// Access refreshes importance:
onRecall(memory):
  memory.accessCount += 1
  memory.lastAccessedAt = now()
  memory.importance = min(1.0, memory.importance + 0.05)  // Small boost on access
```

### Recency Score

Exponential decay based on memory age:

```
recencyScore = exp(-λ × hoursSinceCreation)

λ = 0.001 (configurable — slower decay = longer relevance window)
// 24h old → 0.976
// 7 days  → 0.845
// 30 days → 0.487
// 90 days → 0.115
```

### Top-K Selection

After scoring, memories are sorted by final score descending. The top-K memories (default K=15) are returned, subject to a `minRelevance` threshold (default 0.3). Memories below the threshold are excluded even if within top-K.

---

## Redis Key Schema

Working memory and hot caches are stored in Redis for sub-millisecond access:

```
# ═══════════════════════════════════════════════════════════════════════════════
# WORKING MEMORY (current session messages)
# ═══════════════════════════════════════════════════════════════════════════════

# Sorted set: messages ordered by timestamp
mem:{ventureId}:{userId}:session:{sessionId}:messages
  Score: Unix timestamp (ms)
  Member: JSON-serialized ConversationMessage

# Session metadata (hash)
mem:{ventureId}:{userId}:session:{sessionId}:meta
  personaId: string
  title: string
  messageCount: number
  totalTokens: number
  startedAt: ISO timestamp
  lastMessageAt: ISO timestamp

# TTL: 86400 seconds (24 hours) — auto-expires dead sessions

# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVE SESSION TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

# Set of active session IDs per user per venture
mem:{ventureId}:{userId}:active_sessions
  Members: sessionId strings

# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY HOT CACHE (frequently accessed semantic memories)
# ═══════════════════════════════════════════════════════════════════════════════

# Cache of recently recalled memories to avoid repeated DB/vector lookups
mem:{ventureId}:{userId}:cache:{queryHash}
  Value: JSON-serialized MemorySearchResult[]
  TTL: 300 seconds (5 minutes)

# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING BATCH QUEUE
# ═══════════════════════════════════════════════════════════════════════════════

# List of memories pending embedding generation (processed every 5 seconds)
mem:embedding_queue
  Members: JSON { memoryId, content, type }
```

---

## Core Interfaces

### Memory

```typescript
interface Memory {
  /** Unique memory ID */
  id: string;

  /** User scope */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Memory type */
  type: MemoryType;

  /** Memory category */
  category: MemoryCategory;

  /** Memory content (natural language) */
  content: string;

  /** Importance score (0-1) — higher = recalled more often */
  importance: number;

  /** Embedding vector for semantic recall */
  embedding?: number[];

  /** Source conversation ID (if extracted) */
  sourceConversationId?: string;

  /** Source message ID (if extracted) */
  sourceMessageId?: string;

  /** Extraction confidence (0-1) */
  confidence: number;

  /** Access count (incremented on recall) */
  accessCount: number;

  /** Last accessed timestamp */
  lastAccessedAt: Date;

  /** Whether memory has been verified by user */
  verified: boolean;

  /** Expiry date (null = permanent) */
  expiresAt?: Date;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type MemoryType =
  | 'working'
  | 'episodic'
  | 'preference'
  | 'fact'
  | 'goal'
  | 'instruction'
  | 'interaction';

type MemoryCategory =
  | 'personal_info'
  | 'preferences'
  | 'goals'
  | 'skills'
  | 'relationships'
  | 'work'
  | 'interests'
  | 'instructions'
  | 'context'
  | 'general';
```

### NewMemory (Input)

```typescript
interface NewMemory {
  /** User scope */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Memory type */
  type: MemoryType;

  /** Memory category */
  category: MemoryCategory;

  /** Memory content (natural language) */
  content: string;

  /** Importance score (0-1, default: 0.5) */
  importance?: number;

  /** Source conversation ID (if extracted) */
  sourceConversationId?: string;

  /** Source message ID (if extracted) */
  sourceMessageId?: string;

  /** Extraction confidence (0-1, default: 1.0) */
  confidence?: number;

  /** Expiry date (null = permanent) */
  expiresAt?: Date;

  /** Metadata */
  metadata?: Record<string, unknown>;
}
```

### MemoryFilter

```typescript
interface MemoryFilter {
  /** User scope (required) */
  userId: string;

  /** Venture scope (required) */
  ventureId: string;

  /** Filter by memory types */
  types?: MemoryType[];

  /** Filter by categories */
  categories?: MemoryCategory[];

  /** Minimum importance threshold */
  minImportance?: number;

  /** Only verified memories */
  verified?: boolean;

  /** Date range */
  createdAfter?: Date;
  createdBefore?: Date;

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Sort order */
  orderBy?: 'created_at' | 'importance' | 'last_accessed_at' | 'access_count';
  orderDir?: 'asc' | 'desc';
}
```

### MemorySearchResult

```typescript
interface MemorySearchResult extends Memory {
  /** Semantic relevance score (0-1) */
  relevance: number;

  /** Final ranking score (weighted combination) */
  finalScore: number;
}
```

### Conversation

```typescript
interface Conversation {
  /** Unique conversation/session ID */
  id: string;

  /** User scope */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Persona used (if any) */
  personaId?: string;

  /** Conversation title (auto-generated or user-set) */
  title: string;

  /** Messages in the conversation */
  messages: ConversationMessage[];

  /** Message count */
  messageCount: number;

  /** Total tokens used */
  totalTokens: number;

  /** Total cost */
  totalCostUsd: number;

  /** Whether conversation has been summarized */
  isSummarized: boolean;

  /** Summary ID (if summarized) */
  summaryId?: string;

  /** Timestamps */
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
}

interface ConversationMessage {
  /** Message ID */
  id: string;

  /** Role */
  role: 'user' | 'assistant' | 'system' | 'tool';

  /** Content */
  content: string;

  /** Token count */
  tokenCount: number;

  /** Model used (for assistant messages) */
  model?: string;

  /** Cost (for assistant messages) */
  costUsd?: number;

  /** Latency (for assistant messages) */
  latencyMs?: number;

  /** Tool calls */
  toolCalls?: Array<{ name: string; arguments: unknown; result?: unknown }>;

  /** Timestamp */
  timestamp: Date;
}
```

### ConversationSummary

```typescript
interface ConversationSummary {
  /** Summary ID */
  id: string;

  /** Source conversation ID */
  conversationId: string;

  /** User scope */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Summary text */
  summary: string;

  /** Key topics discussed */
  topics: string[];

  /** Action items identified */
  actionItems: string[];

  /** Facts extracted during summarization */
  extractedFactIds: string[];

  /** Sentiment of the conversation */
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';

  /** Resolution status */
  resolution: 'resolved' | 'unresolved' | 'escalated' | 'unknown';

  /** Embedding for semantic search */
  embedding?: number[];

  /** Tokens used for summarization */
  tokensUsed: number;

  /** Cost of summarization */
  costUsd: number;

  /** Timestamps */
  createdAt: Date;
}
```

### UserFact

```typescript
interface UserFact {
  /** Fact ID */
  id: string;

  /** User scope */
  userId: string;

  /** Venture scope */
  ventureId: string;

  /** Category */
  category: MemoryCategory;

  /** Fact content (natural language) */
  content: string;

  /** Structured key-value (optional) */
  key?: string;
  value?: unknown;

  /** Confidence score (0-1) */
  confidence: number;

  /** Source conversation ID */
  sourceConversationId?: string;

  /** Whether user has confirmed this fact */
  verified: boolean;

  /** Embedding for semantic recall */
  embedding?: number[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface ExtractedFact {
  /** Natural language fact */
  content: string;

  /** Category */
  category: MemoryCategory;

  /** Structured representation */
  key?: string;
  value?: unknown;

  /** Extraction confidence (0-1) */
  confidence: number;

  /** Text span from source */
  sourceSpan?: string;
}
```

### RetentionPolicy

```typescript
interface RetentionPolicy {
  /** Policy ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Rules per memory type */
  rules: RetentionRule[];

  /** Whether to auto-summarize before deleting */
  autoSummarize: boolean;

  /** Whether to auto-extract facts before deleting */
  autoExtractFacts: boolean;

  /** GDPR compliance mode */
  gdprMode: boolean;

  createdAt: Date;
  updatedAt: Date;
}

interface RetentionRule {
  /** Memory type this rule applies to */
  memoryType: MemoryType;

  /** Days to retain (null = permanent) */
  retentionDays: number | null;

  /** Max memories per user for this type */
  maxPerUser: number;

  /** When max exceeded: 'oldest' | 'least_important' | 'least_accessed' */
  evictionStrategy: 'oldest' | 'least_important' | 'least_accessed';
}
```

### MemoryContext

```typescript
interface MemoryContext {
  /** Retrieved memories for prompt injection */
  memories: Array<{
    content: string;
    type: MemoryType;
    category: MemoryCategory;
    importance: number;
    relevance: number;
    age: string;
  }>;

  /** User facts */
  facts: Array<{
    content: string;
    category: MemoryCategory;
    confidence: number;
  }>;

  /** Recent conversation summaries */
  recentSummaries: Array<{
    summary: string;
    date: string;
    topics: string[];
  }>;

  /** Total tokens consumed by memory context */
  tokenCount: number;

  /** Formatted context string for prompt injection */
  formatted: string;
}
```

### MemoryStoreConfig

```typescript
interface MemoryStoreConfig {
  /** Venture scope */
  ventureId: string;

  /** User scope */
  userId: string;

  /** Embedding model to use (default: text-embedding-3-small) */
  embeddingModel?: string;

  /** Embedding dimensions (default: 1536) */
  embeddingDimensions?: number;

  /** Similarity metric for vector search */
  similarityMetric?: 'cosine' | 'l2' | 'inner_product';

  /** HNSW index parameters */
  hnswConfig?: {
    m: number;              // Max connections per node (default: 16)
    efConstruction: number; // Size of dynamic candidate list during index build (default: 64)
    efSearch: number;       // Size of dynamic candidate list during search (default: 40)
  };

  /** Maximum memories before eviction kicks in */
  maxMemories?: number;

  /** Deduplication threshold (cosine similarity above this = considered duplicate) */
  deduplicationThreshold?: number;
}
```

---

## Database Schema

> **Note:** The memory module defines its own tables (`memories`, `ai_conversations`, `ai_conversation_messages`, `conversation_summaries`, `user_facts`, `retention_policies`) that are separate from the Contact Center's `conversations` and `messages` tables. The Contact Center tables handle multi-channel customer communications; the memory tables handle AI conversation persistence and cognitive memory.

### memories Table

```typescript
export const memories = pgTable('memories', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE (every memory is user + venture scoped)
  // ═══════════════════════════════════════════════════════════════════════════

  userId: uuid('user_id').references(() => users.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Type: 'working' | 'episodic' | 'preference' | 'fact' | 'goal' | 'instruction' | 'interaction'
  type: varchar('type', { length: 16 }).notNull(),

  // Category: 'personal_info' | 'preferences' | 'goals' | 'skills' | etc.
  category: varchar('category', { length: 32 }).notNull(),

  // Natural language memory content
  content: text('content').notNull(),

  // Importance score: 0.00 – 1.00 (decays over time unless accessed)
  importance: decimal('importance', { precision: 3, scale: 2 }).default('0.50').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDING (pgvector)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1536-dimension vector from text-embedding-3-small (or configured model)
  // Used for semantic recall via HNSW index
  embedding: vector('embedding', { dimensions: 1536 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  // Which conversation this memory was extracted from (null for manual memories)
  sourceConversationId: uuid('source_conversation_id'),

  // Specific message that triggered extraction
  sourceMessageId: uuid('source_message_id'),

  // LLM extraction confidence (1.00 for user-created memories)
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.00').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS TRACKING (for importance decay and relevance tuning)
  // ═══════════════════════════════════════════════════════════════════════════

  accessCount: integer('access_count').default(0).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  // Whether the user has explicitly confirmed this memory is accurate
  verified: boolean('verified').default(false).notNull(),

  // Expiry date for time-limited memories (null = permanent)
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Primary lookup: all memories for a user in a venture
  index('memories_user_venture_idx').on(table.userId, table.ventureId),

  // Filter by type within user scope
  index('memories_type_idx').on(table.userId, table.ventureId, table.type),

  // Filter by category within user scope
  index('memories_category_idx').on(table.userId, table.ventureId, table.category),

  // Sort by importance (for eviction strategies)
  index('memories_importance_idx').on(table.importance),

  // Expiry scan (for retention enforcement cron)
  index('memories_expires_idx').on(table.expiresAt),

  // HNSW vector index for semantic similarity search
  // CREATE INDEX memories_embedding_idx ON memories
  //   USING hnsw (embedding vector_cosine_ops)
  //   WITH (m = 16, ef_construction = 64);
]);
```

### ai_conversations Table

```typescript
export const aiConversations = pgTable('ai_conversations', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  userId: uuid('user_id').references(() => users.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Persona used for this conversation (null = default assistant)
  personaId: uuid('persona_id'),

  // Auto-generated or user-set title
  title: text('title').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE STATS
  // ═══════════════════════════════════════════════════════════════════════════

  messageCount: integer('message_count').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  totalCostUsd: decimal('total_cost_usd', { precision: 10, scale: 6 }).default('0').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARIZATION STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  isSummarized: boolean('is_summarized').default(false).notNull(),
  summaryId: uuid('summary_id'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => [
  // User's conversations in a venture
  index('ai_conversations_user_venture_idx').on(table.userId, table.ventureId),

  // Timeline query (most recent conversations first)
  index('ai_conversations_last_message_idx').on(table.userId, table.lastMessageAt),

  // Summarization cron (find unsummarized conversations older than threshold)
  index('ai_conversations_summarized_idx').on(table.isSummarized, table.lastMessageAt),
]);
```

### ai_conversation_messages Table

```typescript
export const aiConversationMessages = pgTable('ai_conversation_messages', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // PARENT CONVERSATION (cascade delete)
  // ═══════════════════════════════════════════════════════════════════════════

  conversationId: uuid('conversation_id')
    .references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // 'user' | 'assistant' | 'system' | 'tool'
  role: varchar('role', { length: 16 }).notNull(),

  // Message text content
  content: text('content').notNull(),

  // Token count for this message
  tokenCount: integer('token_count').default(0).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // AI-SPECIFIC FIELDS (only set for assistant messages)
  // ═══════════════════════════════════════════════════════════════════════════

  // Model that generated this response (e.g., 'anthropic/claude-3.5-sonnet')
  model: varchar('model', { length: 128 }),

  // Cost of generating this response
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),

  // Response generation latency
  latencyMs: integer('latency_ms'),

  // Tool calls made during generation
  toolCalls: jsonb('tool_calls').$type<Array<{
    name: string;
    arguments: unknown;
    result?: unknown;
  }>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // All messages in a conversation
  index('ai_conv_messages_conv_idx').on(table.conversationId),

  // Messages ordered by time (for conversation replay)
  index('ai_conv_messages_timestamp_idx').on(table.conversationId, table.timestamp),
]);
```

### conversation_summaries Table

```typescript
export const conversationSummaries = pgTable('conversation_summaries', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE & SOURCE
  // ═══════════════════════════════════════════════════════════════════════════

  conversationId: uuid('conversation_id')
    .references(() => aiConversations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // AI-generated summary of the conversation
  summary: text('summary').notNull(),

  // Key topics discussed
  topics: text('topics').array().default([]),

  // Action items identified during the conversation
  actionItems: text('action_items').array().default([]),

  // Facts extracted during summarization (references user_facts.id)
  extractedFactIds: text('extracted_fact_ids').array().default([]),

  // Conversation sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  sentiment: varchar('sentiment', { length: 16 }).default('neutral').notNull(),

  // Resolution: 'resolved' | 'unresolved' | 'escalated' | 'unknown'
  resolution: varchar('resolution', { length: 16 }).default('unknown').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDING (for semantic search across conversation history)
  // ═══════════════════════════════════════════════════════════════════════════

  embedding: vector('embedding', { dimensions: 1536 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // COST TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  tokensUsed: integer('tokens_used').default(0).notNull(),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).default('0').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('conv_summaries_user_venture_idx').on(table.userId, table.ventureId),
  index('conv_summaries_conv_idx').on(table.conversationId),
]);
```

### user_facts Table

```typescript
export const userFacts = pgTable('user_facts', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  userId: uuid('user_id').references(() => users.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // FACT CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Category: 'personal_info' | 'preferences' | 'goals' | 'skills' | etc.
  category: varchar('category', { length: 32 }).notNull(),

  // Natural language fact description
  content: text('content').notNull(),

  // Optional structured key-value representation
  // e.g., key: 'preferred_language', value: 'French'
  key: varchar('key', { length: 128 }),
  value: jsonb('value'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIDENCE & VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // LLM extraction confidence (1.00 for user-submitted facts)
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.00').notNull(),

  // Conversation this fact was extracted from
  sourceConversationId: uuid('source_conversation_id'),

  // Whether the user has explicitly confirmed this fact
  verified: boolean('verified').default(false).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDING (for semantic fact recall)
  // ═══════════════════════════════════════════════════════════════════════════

  embedding: vector('embedding', { dimensions: 1536 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_facts_user_venture_idx').on(table.userId, table.ventureId),
  index('user_facts_category_idx').on(table.userId, table.ventureId, table.category),
  index('user_facts_key_idx').on(table.userId, table.ventureId, table.key),
]);
```

### retention_policies Table

```typescript
export const retentionPolicies = pgTable('retention_policies', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE (one policy per venture)
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull().unique(),

  // ═══════════════════════════════════════════════════════════════════════════
  // RULES (stored as JSONB array of RetentionRule objects)
  // ═══════════════════════════════════════════════════════════════════════════

  rules: jsonb('rules').notNull().$type<RetentionRule[]>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATION FLAGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Auto-summarize conversations before deletion
  autoSummarize: boolean('auto_summarize').default(true).notNull(),

  // Auto-extract facts from conversations before deletion
  autoExtractFacts: boolean('auto_extract_facts').default(true).notNull(),

  // Strict GDPR compliance mode (enables consent tracking, right-to-forget)
  gdprMode: boolean('gdpr_mode').default(false).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('retention_policies_venture_idx').on(table.ventureId),
]);
```

---

## Vector Search Configuration

The memory module uses PostgreSQL's `pgvector` extension for semantic similarity search. Embeddings are stored as 1536-dimensional vectors and indexed using HNSW (Hierarchical Navigable Small Worlds).

### pgvector Setup

```sql
-- Enable the extension (run once per database)
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW index for memories table (cosine similarity)
CREATE INDEX memories_embedding_idx ON memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- HNSW index for conversation summaries
CREATE INDEX conv_summaries_embedding_idx ON conversation_summaries
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- HNSW index for user facts
CREATE INDEX user_facts_embedding_idx ON user_facts
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### HNSW Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `m` | 16 | Max bidirectional connections per node. Higher = better recall, more memory |
| `ef_construction` | 64 | Candidate list size during build. Higher = better index quality, slower build |
| `ef_search` | 40 | Candidate list size during query. Set via `SET hnsw.ef_search = 40` |

### Similarity Query Pattern

```sql
-- Recall top-K memories by semantic similarity
SELECT id, content, type, category, importance,
       1 - (embedding <=> $1::vector) AS similarity
FROM memories
WHERE user_id = $2
  AND venture_id = $3
  AND type = ANY($4)
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY embedding <=> $1::vector
LIMIT $5;

-- $1 = query embedding vector
-- $2 = userId, $3 = ventureId
-- $4 = memory types array
-- $5 = topK limit
```

---

## Embedding Pipeline

Memories are not embedded synchronously on write. Instead, they enter a batch pipeline for efficiency:

```
┌────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│ remember() │────▶│ Redis Queue  │────▶│ Batch Worker │────▶│ PostgreSQL │
│            │     │              │     │              │     │            │
│ Store in   │     │ mem:embed_q  │     │ Every 5s:    │     │ UPDATE     │
│ DB without │     │              │     │ • Dequeue    │     │ memories   │
│ embedding  │     │ FIFO list    │     │   up to 100  │     │ SET embed  │
│            │     │              │     │ • Call embed  │     │ = $vec     │
│            │     │              │     │   API (batch) │     │            │
└────────────┘     └──────────────┘     │ • Write back │     └────────────┘
                                        └──────────────┘

Batch embedding reduces API calls:
  100 memories × 1 call > 100 memories × 100 calls
  Typical batch: 50-100 memories, ~200ms total
```

The embedding model is configurable per venture via `MemoryStoreConfig.embeddingModel`. Default: `text-embedding-3-small` (1536 dimensions, $0.02/M tokens).

---

## tRPC Router

```typescript
// packages/intelligence/src/memory/server/router.ts

export const memoryRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  remember: protectedProcedure
    .input(newMemorySchema)
    .mutation(({ input, ctx }) => remember({ ...input, userId: ctx.user.id })),

  recall: protectedProcedure
    .input(recallSchema)
    .query(({ input, ctx }) => recall({ ...input, userId: ctx.user.id })),

  search: protectedProcedure
    .input(searchSchema)
    .query(({ input, ctx }) => search({ ...input, userId: ctx.user.id })),

  forget: protectedProcedure
    .input(z.object({ memoryId: z.string().uuid() }))
    .mutation(({ input, ctx }) => forget(input.memoryId, ctx.user.id)),

  list: protectedProcedure
    .input(memoryFilterSchema)
    .query(({ input, ctx }) => listMemories({ ...input, userId: ctx.user.id })),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input, ctx }) => getMemoryById(input.id, ctx.user.id)),

  update: protectedProcedure
    .input(updateMemorySchema)
    .mutation(({ input, ctx }) => update({ ...input, userId: ctx.user.id })),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  saveConversation: protectedProcedure
    .input(saveConversationSchema)
    .mutation(({ input, ctx }) => saveConversation({ ...input, userId: ctx.user.id })),

  getConversation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input, ctx }) => getConversation(input.id, ctx.user.id)),

  listConversations: protectedProcedure
    .input(listConversationsSchema)
    .query(({ input, ctx }) => listConversations({ ...input, userId: ctx.user.id })),

  deleteConversation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input, ctx }) => deleteConversation(input.id, ctx.user.id)),

  recentMessages: protectedProcedure
    .input(recentMessagesSchema)
    .query(({ input, ctx }) => getRecentMessages({ ...input, userId: ctx.user.id })),

  // ═══════════════════════════════════════════════════════════════════════════
  // FACT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  getFacts: protectedProcedure
    .input(getFactsSchema)
    .query(({ input, ctx }) => getFacts({ ...input, userId: ctx.user.id })),

  storeFact: protectedProcedure
    .input(storeFactSchema)
    .mutation(({ input, ctx }) => storeFact({ ...input, userId: ctx.user.id })),

  verifyFact: protectedProcedure
    .input(z.object({ factId: z.string().uuid(), verified: z.boolean() }))
    .mutation(({ input, ctx }) => updateFact({
      id: input.factId, userId: ctx.user.id, verified: input.verified,
    })),

  deleteFact: protectedProcedure
    .input(z.object({ factId: z.string().uuid() }))
    .mutation(({ input, ctx }) => deleteFact(input.factId, ctx.user.id)),

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  summarize: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(({ input }) => summarizeConversation({ conversationId: input.conversationId })),

  getSummary: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(({ input, ctx }) => getSummary(input.conversationId, ctx.user.id)),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY-AUGMENTED GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  generateWithMemory: protectedProcedure
    .input(generateWithMemorySchema)
    .mutation(({ input, ctx }) => generateWithMemory({ ...input, userId: ctx.user.id })),

  buildContext: protectedProcedure
    .input(buildContextSchema)
    .query(({ input, ctx }) => buildMemoryContext({ ...input, userId: ctx.user.id })),

  // ═══════════════════════════════════════════════════════════════════════════
  // RETENTION & PRIVACY (admin-only)
  // ═══════════════════════════════════════════════════════════════════════════

  setRetentionPolicy: adminProcedure
    .input(retentionPolicySchema)
    .mutation(({ input }) => setRetentionPolicy(input)),

  getRetentionPolicy: adminProcedure
    .input(z.object({ ventureId: z.string().uuid() }))
    .query(({ input }) => getRetentionPolicy(input.ventureId)),

  exportMyMemories: protectedProcedure
    .input(z.object({ format: z.enum(['json', 'csv']).default('json') }))
    .mutation(({ input, ctx }) => exportUserMemories({
      userId: ctx.user.id, ventureId: ctx.ventureId, format: input.format,
    })),

  purgeMyMemories: protectedProcedure
    .input(z.object({ confirm: z.literal(true) }))
    .mutation(({ ctx }) => purgeUserMemories({
      userId: ctx.user.id, ventureId: ctx.ventureId, confirm: true,
    })),
});
```

---

## API Routes

```typescript
// packages/intelligence/src/memory/server/api.ts
// Next.js App Router API routes

// POST /api/v1/memory/remember
// POST /api/v1/memory/recall
// GET  /api/v1/memory/search?q=...&types=...&limit=...
// GET  /api/v1/memory/:id
// PUT  /api/v1/memory/:id
// DELETE /api/v1/memory/:id

// POST /api/v1/memory/conversations
// GET  /api/v1/memory/conversations
// GET  /api/v1/memory/conversations/:id
// DELETE /api/v1/memory/conversations/:id
// GET  /api/v1/memory/conversations/recent-messages

// POST /api/v1/memory/facts
// GET  /api/v1/memory/facts
// PUT  /api/v1/memory/facts/:id
// DELETE /api/v1/memory/facts/:id

// POST /api/v1/memory/summarize/:conversationId
// GET  /api/v1/memory/summaries/:conversationId

// POST /api/v1/memory/generate           (memory-augmented generation)
// POST /api/v1/memory/context/build      (build memory context)

// PUT  /api/v1/memory/retention-policy    (admin)
// GET  /api/v1/memory/retention-policy
// POST /api/v1/memory/export             (GDPR)
// POST /api/v1/memory/purge              (GDPR)
```

---

## Usage Examples

### Storing and Recalling Memories

```typescript
import { remember, recall, search } from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Store memories of different types
// ═══════════════════════════════════════════════════════════════════════════════

await remember({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  type: 'preference',
  category: 'preferences',
  content: 'User prefers dark mode and metric units',
  importance: 0.8,
});

await remember({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  type: 'fact',
  category: 'personal_info',
  content: 'User is a software developer based in Toronto',
  importance: 0.7,
  metadata: { verified: false },
});

await remember({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  type: 'instruction',
  category: 'instructions',
  content: 'User wants responses in French when discussing soccer/football',
  importance: 0.9,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Recall relevant memories via semantic search
// ═══════════════════════════════════════════════════════════════════════════════

const memories = await recall({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  query: 'What settings does the user prefer?',
  topK: 10,
  minRelevance: 0.5,
  types: ['preference', 'instruction'],
});

for (const memory of memories) {
  console.log(`[${memory.type}] ${memory.content}`);
  console.log(`  Relevance: ${(memory.relevance * 100).toFixed(0)}%`);
  console.log(`  Importance: ${(memory.importance * 100).toFixed(0)}%`);
  console.log(`  Final Score: ${(memory.finalScore * 100).toFixed(0)}%`);
}

// Output:
// [preference] User prefers dark mode and metric units
//   Relevance: 87% | Importance: 80% | Final Score: 82%
// [instruction] User wants responses in French when discussing soccer/football
//   Relevance: 42% | Importance: 90% | Final Score: 55%

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Full-text memory search with category filters
// ═══════════════════════════════════════════════════════════════════════════════

const results = await search({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  query: 'Toronto',
  categories: ['personal_info', 'work'],
  limit: 20,
});

console.log(`Found ${results.length} memories matching "Toronto"`);
```

### Conversation Management

```typescript
import {
  saveConversation,
  getConversation,
  listConversations,
  getRecentMessages,
} from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Save a complete conversation
// ═══════════════════════════════════════════════════════════════════════════════

const conversationId = await saveConversation({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  personaId: 'support-agent-uuid',
  title: 'Withdrawal help',
  messages: [
    {
      role: 'user',
      content: 'How do I withdraw my winnings?',
      timestamp: new Date(),
    },
    {
      role: 'assistant',
      content: 'I can help with that! Go to your account settings...',
      model: 'anthropic/claude-3.5-sonnet',
      tokenCount: 150,
      costUsd: 0.003,
      latencyMs: 1200,
      timestamp: new Date(),
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Get recent messages across conversations for context
// ═══════════════════════════════════════════════════════════════════════════════

const recent = await getRecentMessages({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  limit: 20,
  maxAge: '24h',
});

console.log(`Last ${recent.length} messages across ${recent.conversationCount} conversations`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: List all conversations with pagination
// ═══════════════════════════════════════════════════════════════════════════════

const convos = await listConversations({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  limit: 20,
  offset: 0,
  orderBy: 'last_message_at',
  orderDir: 'desc',
});

for (const convo of convos.items) {
  console.log(`${convo.title} — ${convo.messageCount} messages — $${convo.totalCostUsd}`);
}
```

### Auto-Summarization

```typescript
import {
  summarizeConversation,
  runSummarizationJob,
  getSummary,
} from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Summarize a single conversation
// ═══════════════════════════════════════════════════════════════════════════════

const summary = await summarizeConversation({
  conversationId: 'conv-uuid',
  extractFacts: true,
  model: 'auto', // Gateway picks optimal model for summarization
});

console.log(`Summary: ${summary.summary}`);
console.log(`Topics: ${summary.topics.join(', ')}`);
console.log(`Sentiment: ${summary.sentiment}`);
console.log(`Resolution: ${summary.resolution}`);
console.log(`Action items: ${summary.actionItems.join('; ')}`);
console.log(`Facts extracted: ${summary.extractedFactIds.length}`);
console.log(`Cost: $${summary.costUsd.toFixed(4)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Run summarization cron job (batch)
// ═══════════════════════════════════════════════════════════════════════════════

// Summarize all conversations older than 24h that haven't been summarized
const jobResult = await runSummarizationJob({
  minAgeHours: 24,
  batchSize: 50,
  extractFacts: true,
});

console.log(`Summarized ${jobResult.processed} conversations`);
console.log(`Facts extracted: ${jobResult.factsExtracted}`);
console.log(`Total cost: $${jobResult.totalCostUsd.toFixed(4)}`);
console.log(`Errors: ${jobResult.errors.length}`);
```

### Fact Extraction

```typescript
import { extractFacts, getFacts, storeFact } from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Extract facts from a conversation
// ═══════════════════════════════════════════════════════════════════════════════

const facts = await extractFacts({
  conversationId: 'conv-uuid',
  categories: ['personal_info', 'preferences', 'goals', 'work'],
  confidenceThreshold: 0.7,
});

console.log(`Extracted ${facts.length} facts:`);
for (const fact of facts) {
  console.log(`  [${fact.category}] ${fact.content} (${(fact.confidence * 100).toFixed(0)}%)`);
}
// [personal_info] User is a software developer (95%)
// [preferences] Prefers Python over JavaScript (88%)
// [goals] Wants to build a SaaS product (72%)

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Get all verified facts for a user
// ═══════════════════════════════════════════════════════════════════════════════

const userFacts = await getFacts({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  categories: ['personal_info', 'preferences'],
  verified: true, // Only confirmed facts
});

for (const fact of userFacts) {
  console.log(`${fact.key || fact.category}: ${fact.content}`);
}
```

### Memory-Augmented Generation

```typescript
import { generateWithMemory, buildMemoryContext } from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Chat with full memory context
// ═══════════════════════════════════════════════════════════════════════════════

const response = await generateWithMemory({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  messages: [
    { role: 'user', content: 'What did we discuss last time?' },
  ],
  memoryConfig: {
    includeTypes: ['episodic', 'preference', 'fact', 'instruction'],
    topK: 15,
    maxTokens: 2000,
    recencyWeight: 0.3,
    importanceWeight: 0.4,
    relevanceWeight: 0.3,
  },
  model: 'auto',
});

console.log(response.content);
console.log(`Memory tokens used: ${response.memoryContext.tokenCount}`);
console.log(`Memories recalled: ${response.memoryContext.memories.length}`);
console.log(`Facts injected: ${response.memoryContext.facts.length}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Build memory context manually for custom prompt assembly
// ═══════════════════════════════════════════════════════════════════════════════

const context = await buildMemoryContext({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  query: 'Help me with my betting strategy',
  maxTokens: 1500,
  config: {
    includeTypes: ['preference', 'fact', 'episodic'],
    topK: 10,
    recencyWeight: 0.2,
    importanceWeight: 0.5,
    relevanceWeight: 0.3,
  },
});

console.log('Memory context for prompt:');
console.log(context.formatted);
// "## User Context
//  - Software developer based in Toronto
//  - Prefers analytical approaches to betting
//  - Previously discussed NBA parlay strategies (Jan 15)
//  - Prefers responses with statistical backing"

console.log(`Context tokens: ${context.tokenCount}`);
```

### Retention & Privacy

```typescript
import {
  setRetentionPolicy,
  enforceRetention,
  exportUserMemories,
  purgeUserMemories,
} from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Configure venture retention policy
// ═══════════════════════════════════════════════════════════════════════════════

await setRetentionPolicy({
  ventureId: 'betedge-venture-uuid',
  rules: [
    {
      memoryType: 'working',
      retentionDays: null,     // Handled by Redis TTL
      maxPerUser: 100,
      evictionStrategy: 'oldest',
    },
    {
      memoryType: 'episodic',
      retentionDays: 90,       // Keep summaries for 90 days
      maxPerUser: 500,
      evictionStrategy: 'least_accessed',
    },
    {
      memoryType: 'preference',
      retentionDays: null,     // Permanent
      maxPerUser: 200,
      evictionStrategy: 'least_important',
    },
    {
      memoryType: 'fact',
      retentionDays: null,     // Permanent
      maxPerUser: 500,
      evictionStrategy: 'least_important',
    },
    {
      memoryType: 'interaction',
      retentionDays: 30,       // Short-lived metadata
      maxPerUser: 1000,
      evictionStrategy: 'oldest',
    },
  ],
  autoSummarize: true,
  autoExtractFacts: true,
  gdprMode: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: GDPR data export and right-to-be-forgotten
// ═══════════════════════════════════════════════════════════════════════════════

// Export all user memories (GDPR data portability — Article 20)
const export_ = await exportUserMemories({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  format: 'json',
});

console.log(`Exported ${export_.memoryCount} memories`);
console.log(`Exported ${export_.factCount} facts`);
console.log(`Exported ${export_.conversationCount} conversations`);
// Returns downloadable JSON file URL

// Purge all user memories (GDPR right to erasure — Article 17)
const purge = await purgeUserMemories({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  confirm: true, // Safety flag: must be explicitly true
});

console.log(`Purged: ${purge.memoriesDeleted} memories`);
console.log(`Purged: ${purge.factsDeleted} facts`);
console.log(`Purged: ${purge.conversationsDeleted} conversations`);
console.log(`Redis keys cleared: ${purge.redisKeysCleared}`);
```

### Memory Consolidation

```typescript
import { summarizeMemories } from '@mcv/intelligence/memory';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Consolidate old episodic memories into compressed summaries
// ═══════════════════════════════════════════════════════════════════════════════

const consolidation = await summarizeMemories({
  userId: 'user-123',
  ventureId: 'betedge-venture-uuid',
  olderThan: '30d',
  types: ['episodic'],
  strategy: 'merge-by-topic',
});

console.log(`Consolidated ${consolidation.memoriesProcessed} memories`);
console.log(`Into ${consolidation.summariesCreated} topic summaries`);
console.log(`Tokens saved: ${consolidation.tokensSaved.toLocaleString()}`);
console.log(`Facts preserved: ${consolidation.factsPreserved}`);
// Consolidation compresses 30+ conversation summaries into ~5 topic summaries
// e.g., "User has discussed betting strategies across 12 sessions, focusing on
//         NBA parlays, soccer accumulators, and risk management approaches."
```

### Client-Side Usage (React)

```tsx
import { useMemoryChat, useMemoryExplorer } from '@mcv/intelligence/memory/client';
import { MemoryPanel, ConversationList, FactsEditor, MemoryTimeline } from '@mcv/intelligence/memory/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Memory-aware chat component
// ═══════════════════════════════════════════════════════════════════════════════

function MemoryChatPage({ ventureId, userId }: Props) {
  const {
    messages,
    sendMessage,
    isTyping,
    memoryContext,
    recalledMemories,
  } = useMemoryChat({
    ventureId,
    userId,
    personaSlug: 'support-agent',
  });

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <ChatMessages messages={messages} isTyping={isTyping} />
        <ChatInput onSend={sendMessage} />
      </div>

      {/* Sidebar showing what the AI "remembers" about this user */}
      <aside className="w-80 border-l p-4">
        <h3 className="font-medium mb-2">Recalled Memories</h3>
        <MemoryPanel
          memories={recalledMemories}
          showRelevance
          showCategory
        />
      </aside>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: Memory explorer (admin view of a user's memory store)
// ═══════════════════════════════════════════════════════════════════════════════

function UserMemoryExplorer({ ventureId, userId }: Props) {
  const {
    memories,
    facts,
    conversations,
    deleteMemory,
    verifyFact,
    isLoading,
    filters,
    setFilters,
  } = useMemoryExplorer({ ventureId, userId });

  return (
    <div className="space-y-6">
      <MemoryFilters value={filters} onChange={setFilters} />

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="facts">Facts ({facts.length})</TabsTrigger>
          <TabsTrigger value="conversations">
            Conversations ({conversations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <MemoryTimeline
            memories={memories}
            onDelete={deleteMemory}
          />
        </TabsContent>

        <TabsContent value="facts">
          <FactsEditor
            facts={facts}
            onVerify={verifyFact}
            onDelete={deleteMemory}
          />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationList
            conversations={conversations}
            showSummary
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Cron Jobs

| Job | Schedule | Description | Typical Duration |
|-----|----------|-------------|-----------------|
| `runSummarizationJob` | `0 2 * * *` (2 AM daily) | Summarize unsummarized conversations older than 24h | 30–120s |
| `enforceRetention` | `0 3 * * *` (3 AM daily) | Delete expired memories and enforce per-user limits | 15–60s |
| `compactMemories` | `0 4 * * 0` (4 AM Sunday) | Consolidate old episodic memories into topic summaries | 60–300s |
| `processEmbeddingQueue` | Every 5 seconds | Batch-embed queued memories from Redis | 100–500ms |
| `decayImportance` | `0 5 1 * *` (5 AM, 1st of month) | Apply importance decay to unaccessed memories | 10–30s |

### Summarization Cron Example

```typescript
// Registered in packages/intelligence/src/memory/server/cron.ts

import { defineCron } from '@mcv/core/cron';
import { runSummarizationJob, enforceRetention } from './services';

export const memorySummarizationCron = defineCron({
  name: 'memory:summarize-conversations',
  schedule: process.env.MEMORY_SUMMARIZATION_CRON || '0 2 * * *',
  handler: async () => {
    const result = await runSummarizationJob({
      minAgeHours: Number(process.env.MEMORY_SUMMARIZATION_MIN_AGE_HOURS) || 24,
      batchSize: Number(process.env.MEMORY_SUMMARIZATION_BATCH_SIZE) || 50,
      extractFacts: true,
    });

    return {
      processed: result.processed,
      factsExtracted: result.factsExtracted,
      totalCostUsd: result.totalCostUsd,
      errors: result.errors.length,
    };
  },
});

export const memoryRetentionCron = defineCron({
  name: 'memory:enforce-retention',
  schedule: process.env.MEMORY_RETENTION_CRON || '0 3 * * *',
  handler: async () => {
    // Enforce retention for all ventures with policies
    const result = await enforceRetention();
    return {
      venturesProcessed: result.venturesProcessed,
      memoriesDeleted: result.memoriesDeleted,
      conversationsDeleted: result.conversationsDeleted,
    };
  },
});
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Memory store (`remember`) | < 20ms | < 50ms | Write only; embedding is async |
| Memory recall (semantic) | < 50ms | < 150ms | HNSW index; cold cache |
| Memory recall (cached) | < 5ms | < 15ms | Redis hot cache hit |
| Memory search (full-text) | < 30ms | < 100ms | PostgreSQL tsvector |
| Conversation save | < 15ms | < 40ms | Batch insert messages |
| Context assembly | < 80ms | < 200ms | Recall + ranking + format |
| Fact extraction (per conv) | < 3s | < 8s | LLM call via Gateway |
| Summarization (per conv) | < 5s | < 15s | LLM call via Gateway |
| Retention enforcement (cron) | < 60s | < 300s | Full scan of expired |

### Optimization Strategies

1. **HNSW vector index** — Sub-linear recall on memory embeddings (O(log n) vs O(n) linear scan)
2. **Working memory in Redis** — Current session messages stored in Redis for sub-ms access
3. **Importance decay** — Importance scores decay over time unless accessed; reduces noise in recall
4. **Batch embeddings** — New memories embedded in batches every 5 seconds (100 memories per call)
5. **Lazy summarization** — Conversations summarized asynchronously after session ends via cron
6. **Memory compaction** — Old episodic memories consolidated into topic summaries weekly
7. **Token budget** — Memory context assembly respects token budget; prioritizes by `relevance × importance`
8. **Redis hot cache** — Recently recalled memory sets cached for 5 minutes (avoids repeated vector lookups)
9. **Deduplication** — New memories checked against existing via cosine similarity; duplicates update instead of insert
10. **Incremental conversation save** — Only new messages appended; no full rewrite per message

### Capacity Limits

| Resource | Default | Enterprise |
|----------|---------|------------|
| Memories per user per venture | 2,000 | 10,000 |
| Facts per user per venture | 500 | 2,000 |
| Conversations retained | 500 | 5,000 |
| Messages per conversation | 200 | 1,000 |
| Memory context tokens | 2,000 | 8,000 |
| Embedding dimensions | 1,536 | 3,072 (text-embedding-3-large) |
| Redis working memory TTL | 24h | 72h |
| Summarization batch size | 50 | 200 |

---

## Security Considerations

### Data Privacy

- **User isolation**: All memory operations scoped by `(userId, ventureId)` — no cross-user access. Every query includes both IDs as mandatory WHERE clauses.
- **Encryption at rest**: Memory content encrypted with per-user AES-256-GCM key derived from venture master key. Embeddings stored unencrypted (vector operations require plain vectors).
- **GDPR compliance**: Full export (`exportUserMemories`) and purge (`purgeUserMemories`) support. Retention policies enforced automatically via cron. Consent tracking available when `gdprMode = true`.
- **Consent tracking**: When GDPR mode is active, memory storage requires explicit user opt-in per venture. Opt-in status tracked in venture membership metadata.
- **PII detection**: Extracted facts are scanned for PII patterns (email, phone, SSN, credit card). Flagged facts require admin review before becoming queryable. Uses regex + lightweight classifier.
- **Access logging**: Every `recall()` and `search()` operation logged in audit trail with query text, user ID, and result count.
- **Zero Data Retention**: When a conversation or memory-augmented generation is marked `zeroDataRetention: true`, the conversation is not persisted and no facts are extracted.

### Access Control

| Operation | Required Role | Notes |
|-----------|---------------|-------|
| `remember`, `recall`, `search`, `forget` | Authenticated user | Scoped to own memories |
| `listMemories`, `getMemoryById` | Authenticated user | Scoped to own memories |
| `saveConversation`, `getConversation` | Authenticated user | Scoped to own conversations |
| `generateWithMemory` | Authenticated user | Scoped to own context |
| `exportMyMemories`, `purgeMyMemories` | Authenticated user | Own data only |
| `setRetentionPolicy` | Venture admin | Venture-wide policy |
| `enforceRetention` | System / cron | Automated only |
| View other user's memories | Super admin | Admin Memory Explorer |

---

## Error Codes

| Code | HTTP | Name | Description | Resolution |
|------|------|------|-------------|------------|
| `MEMORY_NOT_FOUND` | 404 | Memory Not Found | Memory ID does not exist or belongs to different user | Verify memory ID and user scope |
| `MEMORY_LIMIT_EXCEEDED` | 429 | Memory Limit Exceeded | User has reached max memories for this type | Delete old memories or upgrade limits |
| `MEMORY_DUPLICATE` | 409 | Duplicate Memory | Memory content too similar to existing (cosine > 0.95) | Existing memory was updated instead |
| `CONVERSATION_NOT_FOUND` | 404 | Conversation Not Found | Conversation ID does not exist or wrong user scope | Verify conversation ID |
| `CONVERSATION_LIMIT_EXCEEDED` | 429 | Conversation Limit | Max conversations per user reached | Delete old conversations |
| `FACT_NOT_FOUND` | 404 | Fact Not Found | Fact ID does not exist | Verify fact ID |
| `FACT_LIMIT_EXCEEDED` | 429 | Fact Limit Exceeded | Max facts per user reached | Delete old facts |
| `EXTRACTION_FAILED` | 502 | Extraction Failed | LLM fact extraction call failed | Retry; check Gateway health |
| `SUMMARIZATION_FAILED` | 502 | Summarization Failed | LLM summarization call failed | Retry; check Gateway health |
| `EMBEDDING_FAILED` | 502 | Embedding Failed | Embedding API call failed | Check embedding service; retry |
| `EMBEDDING_QUEUE_FULL` | 503 | Embedding Queue Full | Redis embedding queue exceeds 10,000 items | Queue is backed up; check worker |
| `RETENTION_POLICY_INVALID` | 400 | Invalid Retention Policy | Policy validation failed (e.g., negative days) | Fix input schema |
| `CONTEXT_TOKEN_EXCEEDED` | 400 | Context Token Limit | Requested context exceeds max token budget | Reduce topK or maxTokens |
| `USER_NOT_OPTED_IN` | 403 | Memory Consent Required | GDPR mode active but user hasn't opted in | Request user consent |
| `PURGE_CONFIRMATION_MISSING` | 400 | Purge Not Confirmed | `purgeUserMemories` called without `confirm: true` | Pass `confirm: true` |
| `VECTOR_SEARCH_UNAVAILABLE` | 503 | Vector Search Down | pgvector extension or index unavailable | Check PostgreSQL extension |

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `memory.stored` | data | New memory created |
| `memory.recalled` | system | Memories retrieved for context (includes query text) |
| `memory.updated` | data | Memory content or importance updated |
| `memory.deleted` | data | Memory explicitly deleted by user |
| `memory.expired` | system | Memory removed by retention policy |
| `memory.deduplicated` | system | New memory merged into existing (cosine > 0.95) |
| `memory.importance_decayed` | system | Monthly importance decay applied |
| `conversation.saved` | data | Conversation persisted to database |
| `conversation.summarized` | ai | Conversation auto-summarized by cron or on-demand |
| `conversation.deleted` | data | Conversation deleted |
| `fact.extracted` | ai | Fact extracted from conversation via LLM |
| `fact.verified` | data | User confirmed or denied extracted fact |
| `fact.deleted` | data | Fact deleted |
| `retention.enforced` | system | Retention policy cron job completed |
| `retention.policy_updated` | admin | Venture retention policy changed |
| `memory.exported` | compliance | User memory data exported (GDPR Article 20) |
| `memory.purged` | compliance | User memory data purged (GDPR Article 17) |
| `memory.consent_granted` | compliance | User opted in to memory storage |
| `memory.consent_revoked` | compliance | User opted out of memory storage |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_DEFAULT_IMPORTANCE=0.5                # Default importance score for new memories
MEMORY_MAX_PER_USER=2000                     # Max memories per user per venture
MEMORY_FACTS_MAX_PER_USER=500                # Max facts per user per venture
MEMORY_CONTEXT_MAX_TOKENS=2000               # Max tokens for assembled memory context
MEMORY_DEDUP_THRESHOLD=0.95                  # Cosine similarity threshold for dedup

# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_EMBEDDING_MODEL=text-embedding-3-small  # Embedding model
MEMORY_EMBEDDING_DIMENSIONS=1536               # Vector dimensions
MEMORY_EMBEDDING_BATCH_SIZE=100                # Max memories per embedding batch
MEMORY_EMBEDDING_INTERVAL_MS=5000              # Batch processing interval

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARIZATION
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_SUMMARIZATION_MODEL=auto              # Model for summarization (auto = Gateway routing)
MEMORY_SUMMARIZATION_MIN_AGE_HOURS=24        # Min conversation age before auto-summarize
MEMORY_SUMMARIZATION_BATCH_SIZE=50           # Conversations per cron run
MEMORY_SUMMARIZATION_CRON="0 2 * * *"        # Run at 2 AM daily

# ═══════════════════════════════════════════════════════════════════════════════
# FACT EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_FACT_EXTRACTION_MODEL=auto            # Model for fact extraction
MEMORY_FACT_CONFIDENCE_THRESHOLD=0.7         # Min confidence to auto-store extracted fact

# ═══════════════════════════════════════════════════════════════════════════════
# RETENTION & DECAY
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_RETENTION_CRON="0 3 * * *"            # Retention enforcement: 3 AM daily
MEMORY_COMPACTION_CRON="0 4 * * 0"           # Memory compaction: 4 AM Sunday
MEMORY_DECAY_CRON="0 5 1 * *"               # Importance decay: 5 AM, 1st of month
MEMORY_EPISODIC_RETENTION_DAYS=90            # Default episodic retention
MEMORY_INTERACTION_RETENTION_DAYS=30         # Default interaction retention
MEMORY_DECAY_LAMBDA=0.001                    # Exponential decay rate for recency scoring

# ═══════════════════════════════════════════════════════════════════════════════
# RANKING WEIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_RELEVANCE_WEIGHT=0.3                  # Weight for semantic relevance in ranking
MEMORY_IMPORTANCE_WEIGHT=0.4                 # Weight for importance in ranking
MEMORY_RECENCY_WEIGHT=0.3                    # Weight for recency in ranking

# ═══════════════════════════════════════════════════════════════════════════════
# WORKING MEMORY (Redis)
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_REDIS_PREFIX=mem:                     # Redis key prefix
MEMORY_SESSION_TTL=86400                     # Session TTL in seconds (24h)
MEMORY_CACHE_TTL=300                         # Hot cache TTL in seconds (5 min)
MEMORY_EMBEDDING_QUEUE_MAX=10000             # Max items in embedding queue

# ═══════════════════════════════════════════════════════════════════════════════
# VECTOR SEARCH (pgvector)
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_HNSW_M=16                             # HNSW max connections per node
MEMORY_HNSW_EF_CONSTRUCTION=64               # HNSW build-time candidate list size
MEMORY_HNSW_EF_SEARCH=40                     # HNSW search-time candidate list size

# ═══════════════════════════════════════════════════════════════════════════════
# PRIVACY & COMPLIANCE
# ═══════════════════════════════════════════════════════════════════════════════

MEMORY_ENCRYPTION_ENABLED=true               # Encrypt memory content at rest
MEMORY_GDPR_MODE=false                       # Enable strict GDPR compliance
MEMORY_PII_DETECTION_ENABLED=true            # Scan extracted facts for PII
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM for all memory tables |
| ioredis | ^5.x | Working memory, session cache, embedding queue |
| pgvector | ^0.1.x | Vector similarity search (HNSW index) |
| zod | ^3.x | Input validation for all memory operations |
| uuid | ^9.x | Memory and conversation ID generation |
| @mcv/intelligence/gateway | internal | LLM calls for summarization and fact extraction |
| @mcv/intelligence/embedding | internal | Memory embedding generation (batch pipeline) |
| @mcv/intelligence/personas | internal | Persona-scoped memory contexts |
| @mcv/core/cron | internal | Cron job scheduling for summarization, retention, compaction |
| @mcv/core/audit | internal | Audit event logging |
| @mcv/db | internal | Drizzle schema definitions and database client |

---

## Integration with Other Tier 4 Modules

### Gateway Integration

The memory module depends on the Gateway for all LLM operations (summarization, fact extraction, memory-augmented generation). All LLM calls are made through `@mcv/intelligence/gateway` and respect venture budgets, model routing, and cost tracking.

```typescript
// Memory module uses Gateway for summarization
import { chat } from '@mcv/intelligence/gateway';

const summaryResponse = await chat({
  messages: [
    { role: 'system', content: SUMMARIZATION_SYSTEM_PROMPT },
    { role: 'user', content: conversationTranscript },
  ],
  ventureId,
  routing: 'auto',      // Gateway picks optimal model
  agentType: 'memory',  // Tracked as memory module usage
});
```

### Embedding Integration

Memory embeddings are generated through the shared embedding module, which routes to the configured embedding provider:

```typescript
import { embed } from '@mcv/intelligence/embedding';

const vectors = await embed({
  inputs: memories.map(m => m.content),
  model: process.env.MEMORY_EMBEDDING_MODEL || 'text-embedding-3-small',
  ventureId,
});
```

### Personas Integration

When a memory-augmented generation uses a specific persona, the memory context is filtered and formatted according to the persona's configuration:

```typescript
import { getPersona } from '@mcv/intelligence/personas';

const persona = await getPersona(personaId);
const context = await buildMemoryContext({
  userId, ventureId, query,
  maxTokens: persona.memoryTokenBudget || 2000,
  config: persona.memoryConfig, // Persona may restrict memory types, categories
});
```

---

## Migration SQL

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Enable pgvector extension (required for embedding storage)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════════
-- memories table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  type VARCHAR(16) NOT NULL,
  category VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  importance DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  embedding VECTOR(1536),
  source_conversation_id UUID,
  source_message_id UUID,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memories_user_venture_idx ON memories(user_id, venture_id);
CREATE INDEX memories_type_idx ON memories(user_id, venture_id, type);
CREATE INDEX memories_category_idx ON memories(user_id, venture_id, category);
CREATE INDEX memories_importance_idx ON memories(importance);
CREATE INDEX memories_expires_idx ON memories(expires_at);
CREATE INDEX memories_embedding_idx ON memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ai_conversations table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  persona_id UUID,
  title TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  is_summarized BOOLEAN NOT NULL DEFAULT FALSE,
  summary_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX ai_conversations_user_venture_idx ON ai_conversations(user_id, venture_id);
CREATE INDEX ai_conversations_last_message_idx ON ai_conversations(user_id, last_message_at);
CREATE INDEX ai_conversations_summarized_idx ON ai_conversations(is_summarized, last_message_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ai_conversation_messages table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  model VARCHAR(128),
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  tool_calls JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_conv_messages_conv_idx ON ai_conversation_messages(conversation_id);
CREATE INDEX ai_conv_messages_timestamp_idx ON ai_conversation_messages(conversation_id, timestamp);

-- ═══════════════════════════════════════════════════════════════════════════════
-- conversation_summaries table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  summary TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  extracted_fact_ids TEXT[] DEFAULT '{}',
  sentiment VARCHAR(16) NOT NULL DEFAULT 'neutral',
  resolution VARCHAR(16) NOT NULL DEFAULT 'unknown',
  embedding VECTOR(1536),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conv_summaries_user_venture_idx ON conversation_summaries(user_id, venture_id);
CREATE INDEX conv_summaries_conv_idx ON conversation_summaries(conversation_id);
CREATE INDEX conv_summaries_embedding_idx ON conversation_summaries
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═══════════════════════════════════════════════════════════════════════════════
-- user_facts table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  category VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  key VARCHAR(128),
  value JSONB,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  source_conversation_id UUID,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_facts_user_venture_idx ON user_facts(user_id, venture_id);
CREATE INDEX user_facts_category_idx ON user_facts(user_id, venture_id, category);
CREATE INDEX user_facts_key_idx ON user_facts(user_id, venture_id, key);
CREATE INDEX user_facts_embedding_idx ON user_facts
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═══════════════════════════════════════════════════════════════════════════════
-- retention_policies table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL UNIQUE REFERENCES ventures(id),
  rules JSONB NOT NULL,
  auto_summarize BOOLEAN NOT NULL DEFAULT TRUE,
  auto_extract_facts BOOLEAN NOT NULL DEFAULT TRUE,
  gdpr_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX retention_policies_venture_idx ON retention_policies(venture_id);
```

---

## Testing Notes

### Unit Testing

```typescript
import { remember, recall, search, forget, listMemories } from '@mcv/intelligence/memory';

describe('Memory Module', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STORE & RECALL
  // ═══════════════════════════════════════════════════════════════════════════

  it('should store and recall memories by semantic relevance', async () => {
    await remember({
      userId: testUserId,
      ventureId: testVentureId,
      type: 'preference',
      category: 'preferences',
      content: 'Prefers dark mode and metric units',
      importance: 0.8,
    });

    // Wait for embedding to be processed
    await waitForEmbeddings();

    const recalled = await recall({
      userId: testUserId,
      ventureId: testVentureId,
      query: 'What theme does the user prefer?',
      topK: 5,
    });

    expect(recalled[0].content).toContain('dark mode');
    expect(recalled[0].relevance).toBeGreaterThan(0.5);
    expect(recalled[0].finalScore).toBeGreaterThan(0.3);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ISOLATION
  // ═══════════════════════════════════════════════════════════════════════════

  it('should enforce strict user isolation', async () => {
    await remember({
      userId: testUserId,
      ventureId: testVentureId,
      type: 'fact',
      category: 'personal_info',
      content: 'Secret personal information',
      importance: 0.9,
    });

    const memories = await recall({
      userId: 'different-user-uuid',
      ventureId: testVentureId,
      query: 'Secret personal information',
      topK: 5,
    });

    expect(memories).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEDUPLICATION
  // ═══════════════════════════════════════════════════════════════════════════

  it('should deduplicate similar memories', async () => {
    await remember({
      userId: testUserId,
      ventureId: testVentureId,
      type: 'preference',
      category: 'preferences',
      content: 'User prefers dark mode',
      importance: 0.7,
    });

    await remember({
      userId: testUserId,
      ventureId: testVentureId,
      type: 'preference',
      category: 'preferences',
      content: 'User likes dark mode theme',  // Very similar
      importance: 0.8,
    });

    const all = await listMemories({
      userId: testUserId,
      ventureId: testVentureId,
      types: ['preference'],
    });

    // Should have merged into one memory with updated importance
    expect(all).toHaveLength(1);
    expect(all[0].importance).toBe(0.8); // Updated to higher value
  });
});

describe('Fact Extraction', () => {
  it('should extract facts from conversations', async () => {
    const facts = await extractFacts({
      conversationId: testConvId,
      categories: ['personal_info'],
      confidenceThreshold: 0.5,
    });

    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0].confidence).toBeGreaterThanOrEqual(0.5);
    expect(facts[0].category).toBe('personal_info');
  });
});

describe('Retention Policy', () => {
  it('should enforce retention policies and delete expired memories', async () => {
    await setRetentionPolicy({
      ventureId: testVentureId,
      rules: [{
        memoryType: 'episodic',
        retentionDays: 0,           // Expire immediately
        maxPerUser: 0,
        evictionStrategy: 'oldest',
      }],
      autoSummarize: false,
      autoExtractFacts: false,
      gdprMode: false,
    });

    await enforceRetention(testVentureId);

    const remaining = await listMemories({
      userId: testUserId,
      ventureId: testVentureId,
      types: ['episodic'],
    });

    expect(remaining).toHaveLength(0);
  });
});

describe('GDPR Compliance', () => {
  it('should export all user memories in JSON format', async () => {
    const exported = await exportUserMemories({
      userId: testUserId,
      ventureId: testVentureId,
      format: 'json',
    });

    expect(exported.memoryCount).toBeGreaterThan(0);
    expect(exported.data).toBeDefined();
    expect(exported.data.memories).toBeInstanceOf(Array);
    expect(exported.data.facts).toBeInstanceOf(Array);
    expect(exported.data.conversations).toBeInstanceOf(Array);
  });

  it('should purge all user memories completely', async () => {
    const result = await purgeUserMemories({
      userId: testUserId,
      ventureId: testVentureId,
      confirm: true,
    });

    expect(result.memoriesDeleted).toBeGreaterThan(0);

    // Verify nothing remains
    const remaining = await listMemories({
      userId: testUserId,
      ventureId: testVentureId,
    });
    expect(remaining).toHaveLength(0);

    const facts = await getFacts({
      userId: testUserId,
      ventureId: testVentureId,
    });
    expect(facts).toHaveLength(0);
  });
});
```

### Integration Testing

```typescript
describe('Memory-Augmented Generation E2E', () => {
  it('should generate response with recalled memory context', async () => {
    // Setup: store some memories
    await remember({
      userId: testUserId,
      ventureId: testVentureId,
      type: 'fact',
      category: 'personal_info',
      content: 'User is a software developer who works with TypeScript',
      importance: 0.8,
    });

    await waitForEmbeddings();

    // Generate with memory
    const response = await generateWithMemory({
      userId: testUserId,
      ventureId: testVentureId,
      messages: [
        { role: 'user', content: 'Can you help me with a coding question?' },
      ],
      memoryConfig: {
        includeTypes: ['fact', 'preference'],
        topK: 10,
        maxTokens: 1000,
      },
    });

    // Response should reference known facts
    expect(response.content).toBeTruthy();
    expect(response.memoryContext.memories.length).toBeGreaterThan(0);
    expect(response.memoryContext.tokenCount).toBeLessThanOrEqual(1000);
  });

  it('should handle memory recall when no memories exist', async () => {
    const response = await generateWithMemory({
      userId: 'new-user-no-memories',
      ventureId: testVentureId,
      messages: [
        { role: 'user', content: 'Hello' },
      ],
      memoryConfig: { includeTypes: ['fact'], topK: 10, maxTokens: 1000 },
    });

    // Should still generate a response (just without memory context)
    expect(response.content).toBeTruthy();
    expect(response.memoryContext.memories).toHaveLength(0);
    expect(response.memoryContext.tokenCount).toBe(0);
  });
});
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Recall returns empty results | Embeddings not yet generated (async) | Wait for embedding batch (5s interval) or check Redis queue |
| Recall returns irrelevant memories | Query too broad or importance weights wrong | Increase `minRelevance`, tune ranking weights |
| High recall latency (>200ms) | HNSW index not created or `ef_search` too high | Run migration SQL; tune `hnsw.ef_search` |
| Duplicate memories appearing | Deduplication threshold too low | Increase `MEMORY_DEDUP_THRESHOLD` (default: 0.95) |
| Summarization cron timing out | Too many unsummarized conversations | Reduce `MEMORY_SUMMARIZATION_BATCH_SIZE` |
| Redis OOM errors | Too many active sessions or large embedding queue | Reduce `MEMORY_SESSION_TTL`; increase Redis memory |
| `VECTOR_SEARCH_UNAVAILABLE` | pgvector extension not installed | Run `CREATE EXTENSION vector` on database |
| Facts extracted with low confidence | Ambiguous conversation content | Increase `MEMORY_FACT_CONFIDENCE_THRESHOLD` |

### Diagnostic Queries

```sql
-- Count memories per user per type
SELECT user_id, type, COUNT(*) as count
FROM memories
WHERE venture_id = 'your-venture-id'
GROUP BY user_id, type
ORDER BY count DESC;

-- Find memories missing embeddings (stuck in queue)
SELECT id, content, created_at
FROM memories
WHERE embedding IS NULL
  AND created_at < NOW() - INTERVAL '1 minute'
ORDER BY created_at ASC
LIMIT 50;

-- Check HNSW index status
SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE '%embedding%';

-- Summarization backlog
SELECT COUNT(*) as unsummarized,
       MIN(last_message_at) as oldest
FROM ai_conversations
WHERE is_summarized = FALSE
  AND last_message_at < NOW() - INTERVAL '24 hours';
```

---

*@mcv/intelligence/memory — Conversation Memory & Summarization Module*
