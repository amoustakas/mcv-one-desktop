# @mcv/intelligence — Intelligence Module (Tier 4, MCV-ONLY → future PUBLISHABLE)

> **AI/ML infrastructure — LLM gateway, RAG pipeline, embeddings, ML models, agent memory, context management, personas, streaming, and metrics.**

| Field | Value |
|---|---|
| **Package** | `@mcv/intelligence` |
| **Tier** | 4 — AI & Intelligence |
| **Classification** | MCV-ONLY → future PUBLISHABLE |
| **Current Version** | 1.0.0 |
| **Submodules** | `context` · `embed` · `embedding` · `gateway` · `knowledge` · `memory` · `metrics` · `ml` · `personas` · `rag` · `streaming` |
| **Internal Deps** | `@mcv/kernel` (Tier 1) · `@mcv/nexus` (Tier 3) · `@mcv/api` (Tier 3) |
| **External Deps** | OpenRouter · Neo4j · Pinecone/Qdrant · Google GenAI · tiktoken · ws |
| **DB Footprint** | ~25 tables across Supabase + pgvector, Neo4j graph, Pinecone/Qdrant vector stores |
| **Test Coverage Target** | ≥ 85 % unit · ≥ 70 % integration |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Position](#architecture-position)
3. [Core Concepts](#core-concepts)
4. [Module Layers](#module-layers)
5. [Submodule Deep Dives](#submodule-deep-dives)
   - 5.1 [context — AI Context Management](#51-context--ai-context-management)
   - 5.2 [embed — Embeddable AI Widgets](#52-embed--embeddable-ai-widgets)
   - 5.3 [embedding — Vector Database Management](#53-embedding--vector-database-management)
   - 5.4 [gateway — OpenRouter AI Gateway](#54-gateway--openrouter-ai-gateway)
   - 5.5 [knowledge — Knowledge Base Management](#55-knowledge--knowledge-base-management)
   - 5.6 [memory — AI Agent Memory](#56-memory--ai-agent-memory)
   - 5.7 [metrics — AI Metrics & Observability](#57-metrics--ai-metrics--observability)
   - 5.8 [ml — Custom ML Model Management](#58-ml--custom-ml-model-management)
   - 5.9 [personas — AI Persona Management](#59-personas--ai-persona-management)
   - 5.10 [rag — RAG Pipeline](#510-rag--rag-pipeline)
   - 5.11 [streaming — LLM Streaming](#511-streaming--llm-streaming)
6. [Cross-Module Integration Map](#cross-module-integration-map)
7. [Data Model & Schema](#data-model--schema)
8. [Configuration Reference](#configuration-reference)
9. [Security Architecture](#security-architecture)
10. [Performance Targets & SLAs](#performance-targets--slas)
11. [Commercialization Path](#commercialization-path)
12. [Testing Strategy](#testing-strategy)
13. [Deployment & Operations](#deployment--operations)
14. [Related Documentation](#related-documentation)

---

## Overview

`@mcv/intelligence` is the AI brain of the MCV.ONE ecosystem. It provides unified LLM access through OpenRouter (400+ models), semantic embeddings, retrieval-augmented generation (RAG), knowledge graphs, conversation memory, machine learning predictions, and embeddable AI widgets. Every AI-powered feature in MCV flows through this package.

**The Intelligence Layer turns data into understanding and understanding into action.**

### What This Package Does

| Capability | Description | Key Benefit |
|---|---|---|
| **Unified LLM Gateway** | Single interface to 400+ models via OpenRouter | No vendor lock-in, automatic failover |
| **Cost Optimization** | Intelligent model routing, caching, budgets | 40–60 % cost reduction vs. direct API |
| **Context Assembly** | Real-time data injection into prompts | Always-current AI responses |
| **Semantic Search** | Vector embeddings for document/content search | Find meaning, not just keywords |
| **Streaming Responses** | SSE/WebSocket for real-time LLM output | Sub-second first-token latency |
| **Knowledge Graphs** | Neo4j-powered entity relationships | Complex reasoning, fact verification |
| **RAG Pipelines** | Retrieval-augmented generation | Grounded, factual AI responses |
| **AI Personas** | Per-venture personality and voice | Consistent brand experience |
| **Conversation Memory** | Long-term context retention | Continuous user relationships |
| **ML Predictions** | Churn, recommendations, anomaly detection | Predictive intelligence |
| **Embeddable Widgets** | Chat, search, voice for any website | Zero-code AI integration |

### Design Principles

1. **Provider Agnostic** — No vendor lock-in. OpenRouter abstracts 400+ models; every provider is swappable.
2. **Venture Isolation** — Every venture's data, models, budgets, and knowledge are hermetically sealed.
3. **Cost Conscious** — Intelligent routing, prompt caching, and budget controls keep AI spend predictable.
4. **Stream First** — All LLM interactions default to streaming; batch is the opt-in exception.
5. **Observable** — Every token, every dollar, every millisecond is tracked and attributable.
6. **Layered Loading** — Core layer always loads; extension and plugin layers are lazy-loaded on demand.

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIER 6 — VENTURE APPS                          │
│                                                                         │
│  BetEdge AI    MCV Studios    Grant Concierge    Venture Dashboards    │
│  Predictions   NPCs/Agents    Document AI        Executive Insights     │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ uses
┌─────────────────────────────▼───────────────────────────────────────────┐
│                     TIER 5 — ENGAGEMENT LAYER                           │
│                                                                         │
│  @mcv/engage · @mcv/portal · @mcv/analytics                            │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ uses
┌─────────────────────────────▼───────────────────────────────────────────┐
│               ★  TIER 4 — @mcv/intelligence  (THIS MODULE)  ★          │
│                                                                         │
│  ┌───────────────────── CORE LAYER ─────────────────────────────┐      │
│  │  gateway · context · embedding · streaming · metrics         │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌───────────────────── EXTENSION LAYER ────────────────────────┐      │
│  │  rag · knowledge · personas · memory · ml                    │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌───────────────────── PLUGIN LAYER ───────────────────────────┐      │
│  │  embed (ChatWidget · SearchWidget · VoiceWidget · SDK)       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ depends on
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    TIER 3 — SERVICES LAYER                              │
│                                                                         │
│  @mcv/nexus (agents) · @mcv/api (routes) · @mcv/commerce (payments)    │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ depends on
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    TIER 2 — INFRASTRUCTURE LAYER                        │
│                                                                         │
│  @mcv/auth · @mcv/storage · @mcv/queue · @mcv/cache                    │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ depends on
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    TIER 1 — KERNEL (FOUNDATION)                         │
│                                                                         │
│  @mcv/kernel — Database, Config, Logging, Errors, Types                │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ connects to
┌─────────────────────────────▼───────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                 │
│                                                                         │
│  OpenRouter · Neo4j · Pinecone/Qdrant · Google GenAI · Redis ·         │
│  Supabase · Cloudflare Workers AI                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

- **Upward consumers:** Tier 5 engagement modules, Tier 6 venture applications, `@mcv/nexus` agents.
- **Downward dependencies:** `@mcv/kernel` (config, DB, logging), `@mcv/api` (HTTP routes), `@mcv/nexus` (agent orchestration).
- **Lateral peers:** `@mcv/commerce` (cost billing), `@mcv/auth` (venture/user identity).
- **External services:** OpenRouter (LLM), Neo4j (knowledge graphs), Pinecone/Qdrant (vectors), Google GenAI (File Search RAG), Redis (cache), Supabase (persistence).

---

## Core Concepts

### Three-Layer Architecture

`@mcv/intelligence` is organized into three loading tiers:

| Layer | Modules | Loading | Purpose |
|---|---|---|---|
| **Core** | `gateway`, `context`, `embedding`, `streaming`, `metrics` | Always loaded — foundation | Every AI interaction touches these |
| **Extension** | `rag`, `knowledge`, `personas`, `memory`, `ml` | Lazy-loaded on demand | Advanced capabilities loaded per-venture |
| **Plugin** | `embed` | External-facing, embeddable | Zero-code AI integration for any website |

### Venture Isolation Model

Every piece of intelligence data is scoped to a venture:

```
venture_betedge/
  ├── models/          → model preferences, routing rules, budgets
  ├── knowledge/       → Neo4j subgraph, document store
  ├── embeddings/      → Pinecone namespace, pgvector partition
  ├── personas/        → personality definition, voice rules
  ├── memory/          → user memories, conversation summaries
  ├── metrics/         → cost tracking, usage analytics
  └── ml/              → custom models, prediction configs
```

Row-level security (RLS) in Supabase enforces `venture_id` filtering. Neo4j uses labeled subgraphs. Pinecone uses namespace isolation. No cross-venture data leakage is possible without explicit federation.

### Token Economics

Every LLM request flows through the cost pipeline:

```
Request → Model Selection → Prompt Cache Check → Token Counting
    → Budget Validation → LLM Call → Cost Attribution → Metrics
```

Key cost controls:
- **Budget caps** — hard limits per venture per period (daily/weekly/monthly)
- **Prompt caching** — 90 % cost reduction on repeated system prompts (Claude, GPT)
- **Model tiering** — auto-route simple tasks to economy models
- **Zero Data Retention** — optional flag for privacy-sensitive requests (may increase cost)

---

## Module Layers

### Core Layer Exports

```typescript
// Always available — no lazy loading
export { gateway } from './gateway';      // LLM routing & completion
export { context } from './context';      // Prompt assembly & tokens
export { embedding } from './embedding';  // Vector embeddings & search
export { streaming } from './streaming';  // SSE / WebSocket streaming
export { metrics } from './metrics';      // Usage analytics & cost tracking
```

### Extension Layer Exports

```typescript
// Lazy-loaded on first access
export { rag } from './rag';              // Retrieval-augmented generation
export { knowledge } from './knowledge';  // Neo4j knowledge graphs
export { personas } from './personas';    // Per-venture AI personality
export { memory } from './memory';        // Conversation memory
export { ml } from './ml';               // ML predictions & models
```

### Plugin Layer Exports

```typescript
// External-facing embeddable widgets
export { ChatWidget, SearchWidget, VoiceWidget } from './embed';
```

### Shared Types

```typescript
export * from './types';
export { tokenize, countTokens } from './utils/tokens';
export { chunk, splitText } from './utils/chunking';
```

---

## Submodule Deep Dives

---

### 5.1 context — AI Context Management

> **Context window optimization, conversation history, context compression, token counting.**

#### Purpose

The `context` submodule is responsible for assembling complete prompts from multiple sources. It manages token budgets, prioritizes context sources, injects real-time data (user profile, venture settings, recent activity), compresses stale history, and ensures prompts never exceed model limits. Every LLM call in the ecosystem passes through context assembly.

#### Key Responsibilities

| Responsibility | Description |
|---|---|
| **Token Counting** | Accurate token counting per tokenizer (cl100k_base, o200k_base, etc.) via tiktoken |
| **Context Window Optimization** | Pack the most relevant information into available token budget |
| **Conversation History Management** | Maintain, truncate, and summarize chat history |
| **Context Compression** | Summarize old messages to reclaim token budget |
| **Priority Assembly** | System → RAG → Real-time Data → History → User Message ordering |
| **Template Rendering** | Mustache-style variable interpolation in prompt templates |
| **Real-time Injection** | Current timestamp, user profile, venture settings, permissions |

#### Context Assembly Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT ASSEMBLY PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SYSTEM PROMPT            (Highest Priority — Never Truncated)│
│     ├─ Model instructions & safety guidelines                    │
│     ├─ Persona definition (from personas submodule)              │
│     └─ Tool/function definitions                                 │
│                                                                  │
│  2. REAL-TIME DATA           (Dynamic Injection)                 │
│     ├─ Current timestamp & user timezone                         │
│     ├─ User profile, preferences, permissions                    │
│     ├─ Venture settings, branding, allowed operations            │
│     └─ Session metadata (device, locale, etc.)                   │
│                                                                  │
│  3. RAG CONTEXT              (Retrieved Knowledge)               │
│     ├─ Relevant documents from vector search                     │
│     ├─ Knowledge graph entities and relationships                │
│     └─ Recent conversation summaries from memory                 │
│                                                                  │
│  4. CONVERSATION HISTORY     (Compressed if Needed)              │
│     ├─ Recent messages (kept verbatim)                           │
│     ├─ Older messages (summarized via LLM)                       │
│     └─ System-injected context markers                           │
│                                                                  │
│  5. USER MESSAGE             (Current Input — Never Truncated)   │
│     └─ The actual user query/instruction                         │
│                                                                  │
│  ──────────────────────────────────────────────────              │
│  TOKEN BUDGET ENFORCEMENT                                        │
│  ├─ Count tokens at each layer                                   │
│  ├─ Truncate history first, then RAG, then real-time data        │
│  └─ System prompt & user message are sacrosanct                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Token Counting

Supports multiple tokenizer encodings for accurate counting across model families:

| Encoding | Models | Token/Word Ratio |
|---|---|---|
| `cl100k_base` | GPT-4, GPT-4o, text-embedding-3-* | ~1.3 |
| `o200k_base` | GPT-4o (latest), o3 series | ~1.2 |
| `claude` | Claude 3/3.5/4 family | ~1.3 |
| `gemini` | Gemini Pro/Ultra/Flash | ~1.3 |

The module auto-selects the correct tokenizer based on the target model. When the model is unknown at assembly time, it defaults to `cl100k_base` and adds a 5 % safety margin.

#### Context Compression Strategies

| Strategy | Trigger | Method | Token Savings |
|---|---|---|---|
| **Message Truncation** | History exceeds 60 % of budget | Drop oldest messages | 30–50 % |
| **LLM Summarization** | History exceeds 70 % of budget | Summarize older turns via economy model | 60–80 % |
| **Sliding Window** | Continuous conversation | Keep last N turns verbatim, summarize rest | 50–70 % |
| **Semantic Dedup** | Repeated context | Remove semantically similar chunks | 10–30 % |

#### Template System

```typescript
// Template with variables
const template = `You are {{persona.name}}, an AI assistant for {{venture.name}}.
Current time: {{now}}
User: {{user.displayName}} ({{user.role}})

{{#if ragContext}}
Relevant context:
{{ragContext}}
{{/if}}`;

// Rendering
const rendered = context.render(template, {
  persona: { name: 'Atlas' },
  venture: { name: 'BetEdge' },
  now: '2026-02-09T12:28:00Z',
  user: { displayName: 'John', role: 'subscriber' },
  ragContext: '...',
});
```

#### API Surface

```typescript
interface ContextModule {
  // Core assembly
  assemble(opts: AssembleOptions): Promise<AssembledContext>;
  render(template: string, vars: Record<string, unknown>): string;

  // Token utilities
  tokenize(text: string, encoding?: string): number[];
  countTokens(text: string, model?: string): number;
  estimateTokens(text: string): number; // fast approximation

  // History management
  truncateHistory(messages: Message[], maxTokens: number): Message[];
  summarizeHistory(messages: Message[], model?: string): Promise<string>;
  compressContext(ctx: AssembledContext, targetTokens: number): Promise<AssembledContext>;

  // Template management
  loadTemplate(templateId: string, ventureId: string): Promise<PromptTemplate>;
  saveTemplate(template: PromptTemplate): Promise<void>;
  listTemplates(ventureId: string): Promise<PromptTemplate[]>;
}

interface AssembleOptions {
  systemPrompt: string;
  userMessage: string;
  userId: string;
  ventureId: string;
  maxTokens: number;
  sources: ('profile' | 'rag' | 'history' | 'knowledge' | 'memory')[];
  model?: string;
  conversationId?: string;
  ragQuery?: string;
  ragTopK?: number;
  includeTools?: boolean;
  compressionStrategy?: 'truncate' | 'summarize' | 'sliding';
}

interface AssembledContext {
  messages: Message[];
  tokenCount: number;
  tokenBudget: number;
  sources: ContextSource[];
  metadata: {
    compressionApplied: boolean;
    ragChunksIncluded: number;
    historyTurnsIncluded: number;
    historyTurnsSummarized: number;
  };
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `prompt_templates` | Reusable prompt templates per venture | `id`, `venture_id`, `name`, `template`, `variables`, `version` |
| `context_configs` | Per-venture context assembly settings | `venture_id`, `max_tokens`, `compression_strategy`, `priority_order` |
| `conversation_turns` | Raw conversation history | `conversation_id`, `role`, `content`, `token_count`, `created_at` |
| `context_summaries` | Compressed conversation summaries | `conversation_id`, `summary`, `turns_covered`, `token_count` |

#### Integration Points

- **gateway** → context assembles the full prompt before gateway routes to a model
- **rag** → context includes RAG retrieval results in the assembled prompt
- **memory** → context pulls relevant memories from the memory submodule
- **personas** → context injects persona instructions into the system prompt
- **knowledge** → context can query knowledge graph for entity context
- **metrics** → context reports token counts to metrics for cost attribution

---

### 5.2 embed — Embeddable AI Widgets

> **Text embedding generation for vector search, batch embedding, embedding model selection. Plus: embeddable chat/search/voice widgets for external websites.**

#### Purpose

The `embed` submodule serves a dual purpose. First, it provides the text-to-vector embedding generation pipeline used by `embedding` and `rag` for semantic search. Second, it provides embeddable AI widgets (chat, search, voice, command palette) that any website can drop in with a `<script>` tag or React component. These widgets connect to the intelligence layer and provide zero-code AI integration for ventures.

#### Part A: Embedding Generation

##### Supported Embedding Models

| Model | Provider | Dimensions | Use Case | Cost per 1M Tokens |
|---|---|---|---|---|
| `text-embedding-3-small` | OpenAI | 1536 | General purpose, cost-effective | $0.02 |
| `text-embedding-3-large` | OpenAI | 3072 | High accuracy, complex semantics | $0.13 |
| `voyage-3` | Voyage AI | 1024 | Code and technical content | $0.06 |
| `voyage-3-lite` | Voyage AI | 512 | Lightweight, high throughput | $0.02 |
| `cohere-embed-v3` | Cohere | 1024 | Multilingual support | $0.10 |
| `nomic-embed-text` | Nomic | 768 | Open-source, self-hosted option | Free (self-hosted) |

##### Batch Embedding Pipeline

```
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌───────────┐
│  Input   │───▶│  Chunking │───▶│  Batch Queue │───▶│ Provider  │
│  Texts   │    │  Strategy │    │  (rate-limit) │    │  API Call │
└──────────┘    └───────────┘    └──────────────┘    └─────┬─────┘
                                                            │
┌──────────┐    ┌───────────┐    ┌──────────────┐          │
│  Vector  │◀──│  Normalize │◀──│  Response     │◀────────┘
│  Store   │    │  & Cache   │    │  Parsing     │
└──────────┘    └───────────┘    └──────────────┘
```

##### Embedding Model Selection Logic

```typescript
function selectEmbeddingModel(opts: EmbedOptions): EmbeddingModel {
  if (opts.language && opts.language !== 'en') return 'cohere-embed-v3';   // multilingual
  if (opts.contentType === 'code')              return 'voyage-3';         // code-optimized
  if (opts.priority === 'accuracy')             return 'text-embedding-3-large'; // best quality
  if (opts.priority === 'cost')                 return 'text-embedding-3-small'; // cheapest
  return 'text-embedding-3-small';                                         // default
}
```

##### Embedding API

```typescript
interface EmbedGenerationModule {
  // Single text embedding
  embed(text: string, model?: string): Promise<number[]>;

  // Batch embedding
  embedBatch(texts: string[], opts?: BatchEmbedOptions): Promise<number[][]>;

  // Model info
  getModelInfo(model: string): EmbeddingModelInfo;
  listModels(): EmbeddingModelInfo[];

  // Utilities
  cosineSimilarity(a: number[], b: number[]): number;
  dotProduct(a: number[], b: number[]): number;
  euclideanDistance(a: number[], b: number[]): number;
}

interface BatchEmbedOptions {
  model?: string;
  batchSize?: number;         // max texts per API call (default 100)
  concurrency?: number;       // parallel API calls (default 3)
  cacheResults?: boolean;     // cache embeddings in Redis (default true)
  cacheTTL?: number;          // cache TTL in seconds (default 86400)
  onProgress?: (done: number, total: number) => void;
}
```

#### Part B: Embeddable Widgets

##### Widget Types

| Widget | Description | Integration Method | Bundle Size |
|---|---|---|---|
| **ChatWidget** | Floating chat bubble or inline conversational AI | `<script>` or React | ~45 KB gzipped |
| **SearchWidget** | Semantic search bar with AI-powered results | `<script>` or React | ~30 KB gzipped |
| **VoiceWidget** | Voice input/output AI assistant | `<script>` or React | ~55 KB gzipped |
| **CommandWidget** | Command palette (Cmd+K / Ctrl+K style) | `<script>` or React | ~35 KB gzipped |

##### Script Tag Integration

```html
<!-- Drop-in chat widget -->
<script src="https://cdn.mcv.one/embed/v1/chat.js"></script>
<script>
  MCVChat.init({
    ventureId: 'venture_xyz',
    apiKey: 'pub_xxxxxxxx',
    position: 'bottom-right',
    theme: {
      primaryColor: '#6366f1',
      borderRadius: '12px',
      fontFamily: 'Inter, sans-serif',
    },
    welcomeMessage: 'Hi! How can I help you today?',
    placeholder: 'Ask me anything...',
    persistSession: true,
  });
</script>
```

##### React Integration

```tsx
import { ChatWidget, SearchWidget } from '@mcv/intelligence/embed';

function App() {
  return (
    <>
      <ChatWidget
        ventureId="venture_xyz"
        position="bottom-right"
        welcomeMessage="Hi! How can I help?"
        onMessage={(msg) => analytics.track('chat_message', msg)}
      />
      <SearchWidget
        ventureId="venture_xyz"
        collections={['help_articles', 'product_docs']}
        placeholder="Search our knowledge base..."
      />
    </>
  );
}
```

##### Widget Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER WEBSITE                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Embed Widget (iframe sandbox)                         │  │
│  │                                                         │  │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────────────┐ │  │
│  │  │   UI    │  │  State   │  │  WebSocket Client     │ │  │
│  │  │ (Preact)│  │ Manager  │  │  → api.mcv.one/embed  │ │  │
│  │  └─────────┘  └──────────┘  └───────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ WSS
┌──────────────────────────▼───────────────────────────────────┐
│                  MCV.ONE EMBED API                            │
│                                                              │
│  Auth → Rate Limit → Venture Lookup → Intelligence Pipeline  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

##### Widget Customization API

```typescript
interface WidgetConfig {
  ventureId: string;
  apiKey: string;            // public embed key (not secret)
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    darkMode?: boolean;
  };
  welcomeMessage?: string;
  placeholder?: string;
  persistSession?: boolean;
  language?: string;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  maxMessageLength?: number;
  onMessage?: (message: EmbedMessage) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
}
```

##### Analytics & Tracking

Widgets automatically track:
- Session starts/ends and duration
- Messages sent/received
- Search queries and click-through rates
- Voice interaction duration
- Widget open/close events
- User satisfaction ratings (thumbs up/down)

All analytics are venture-scoped and feed into the `metrics` submodule.

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `embed_configs` | Widget configuration per venture | `venture_id`, `widget_type`, `config_json`, `api_key` |
| `embed_sessions` | Widget session tracking | `session_id`, `venture_id`, `started_at`, `messages_count` |
| `embed_analytics` | Aggregated widget analytics | `venture_id`, `date`, `sessions`, `messages`, `searches` |
| `embedding_cache` | Cached text embeddings | `text_hash`, `model`, `vector`, `created_at`, `ttl` |

---

### 5.3 embedding — Vector Database Management

> **Vector database management (pgvector), similarity search, index management, hybrid search.**

#### Purpose

The `embedding` submodule manages vector storage and retrieval. It provides a unified interface over multiple vector backends (pgvector in Supabase, Pinecone, Qdrant), handles index lifecycle management, supports hybrid search (vector + keyword), and provides collection/namespace isolation per venture.

#### Vector Store Backends

| Backend | Use Case | Max Vectors | Latency (P95) | Cost |
|---|---|---|---|---|
| **pgvector** (Supabase) | Default, small-medium collections | ~5M per table | < 50 ms | Included in Supabase plan |
| **Pinecone** | Large-scale, managed, serverless | Unlimited | < 30 ms | $0.33/M reads |
| **Qdrant** | Self-hosted, filtering-heavy workloads | Unlimited | < 20 ms | Self-hosted |

#### Collection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VECTOR STORE ROUTER                          │
│                                                                  │
│  embedding.search(query)                                         │
│       │                                                          │
│       ├── Collection "help_articles"  → pgvector (small)         │
│       ├── Collection "product_catalog" → Pinecone (large)        │
│       ├── Collection "code_snippets"  → Qdrant (filtered)        │
│       └── Collection "user_content"   → pgvector (per-venture)   │
│                                                                  │
│  Each collection has:                                            │
│    - Dedicated namespace per venture                             │
│    - Configurable embedding model                                │
│    - Index type (HNSW, IVFFlat, etc.)                           │
│    - Metadata schema for filtering                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Index Types & Strategies

| Index Type | Algorithm | Best For | Trade-off |
|---|---|---|---|
| **HNSW** | Hierarchical Navigable Small World | General purpose, balanced speed/accuracy | Higher memory usage |
| **IVFFlat** | Inverted File with Flat quantization | Large collections, cost-sensitive | Lower recall at high speed |
| **Flat** | Brute-force exact search | Small collections (< 50K) | Perfect recall, slower at scale |

#### Hybrid Search

Combines vector similarity with traditional keyword search for best-of-both-worlds retrieval:

```
┌─────────────┐     ┌─────────────────┐
│  User Query │────▶│  Query Analysis │
└─────────────┘     └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │ Vector Search│ │ Keyword  │ │  Metadata    │
     │ (semantic)   │ │ Search   │ │  Filters     │
     │ cosine sim.  │ │ (tsvector│ │  (SQL WHERE) │
     └──────┬───────┘ └────┬─────┘ └──────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                  ┌─────────────────┐
                  │  Score Fusion   │
                  │  (RRF / linear) │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │  Ranked Results │
                  └─────────────────┘
```

**Score fusion methods:**
- **Reciprocal Rank Fusion (RRF)** — Default. Combines ranks from both searches. Robust, parameter-free.
- **Linear Combination** — Weighted sum: `α * vector_score + (1-α) * keyword_score`. Tunable per collection.
- **Cross-encoder Reranking** — Optional second pass with a cross-encoder model for highest precision.

#### Chunking Strategies

The embedding submodule includes a chunking engine for splitting documents before embedding:

| Strategy | Description | Best For | Avg Chunk Size |
|---|---|---|---|
| **Fixed** | Split at fixed token count | Uniform processing | 256–512 tokens |
| **Sentence** | Split at sentence boundaries | Short documents | 100–300 tokens |
| **Paragraph** | Split at paragraph boundaries | Structured documents | 200–800 tokens |
| **Semantic** | Split at topic boundaries (LLM-assisted) | Long-form content | 300–600 tokens |
| **Sliding Window** | Overlapping fixed-size windows | Dense information | 256 tokens + 50 overlap |
| **Recursive** | Hierarchical splitting (headings → paragraphs → sentences) | Markdown/HTML | Variable |

#### API Surface

```typescript
interface EmbeddingModule {
  // Collection management
  createCollection(opts: CollectionOptions): Promise<Collection>;
  deleteCollection(collectionId: string): Promise<void>;
  listCollections(ventureId: string): Promise<Collection[]>;
  getCollectionStats(collectionId: string): Promise<CollectionStats>;

  // Document indexing
  index(docs: DocumentInput[], collectionId: string): Promise<IndexResult>;
  upsert(docs: DocumentInput[], collectionId: string): Promise<UpsertResult>;
  delete(docIds: string[], collectionId: string): Promise<void>;

  // Search
  search(query: SearchQuery): Promise<SearchResult[]>;
  hybridSearch(query: HybridSearchQuery): Promise<SearchResult[]>;
  multiSearch(queries: SearchQuery[]): Promise<SearchResult[][]>;

  // Similarity
  similarity(vecA: number[], vecB: number[], method?: SimilarityMethod): number;

  // Chunking
  chunk(text: string, strategy: ChunkStrategy): TextChunk[];
  chunkDocument(doc: Buffer, opts: ChunkDocumentOptions): Promise<TextChunk[]>;

  // Index management
  rebuildIndex(collectionId: string): Promise<void>;
  optimizeIndex(collectionId: string): Promise<void>;
}

interface SearchQuery {
  query: string;                    // natural language query
  collection: string;              // collection id
  ventureId: string;               // venture scope
  topK?: number;                   // results to return (default 10)
  threshold?: number;              // minimum similarity (0–1)
  filter?: Record<string, any>;    // metadata filters
  includeMetadata?: boolean;       // include doc metadata (default true)
  includeVectors?: boolean;        // include raw vectors (default false)
  rerank?: boolean;                // cross-encoder reranking (default false)
}

interface HybridSearchQuery extends SearchQuery {
  keywordWeight?: number;          // 0–1, weight for keyword score (default 0.3)
  vectorWeight?: number;           // 0–1, weight for vector score (default 0.7)
  fusionMethod?: 'rrf' | 'linear'; // score fusion method (default 'rrf')
}

interface SearchResult {
  id: string;
  content: string;
  score: number;                   // combined similarity score
  metadata: Record<string, any>;
  source: {
    documentId: string;
    chunkIndex: number;
    pageNumber?: number;
  };
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `vector_collections` | Collection registry and config | `id`, `venture_id`, `name`, `backend`, `embedding_model`, `dimensions`, `index_type` |
| `vector_documents` | Source document metadata | `id`, `collection_id`, `filename`, `content_hash`, `chunk_count`, `indexed_at` |
| `vector_chunks` | Individual chunks with pgvector embeddings | `id`, `document_id`, `content`, `embedding vector(1536)`, `chunk_index`, `metadata` |
| `vector_index_jobs` | Background indexing job queue | `id`, `collection_id`, `status`, `documents_total`, `documents_processed` |

#### Performance Optimizations

1. **Embedding Cache** — Identical texts return cached vectors (Redis, 24h TTL)
2. **Batch Indexing** — Bulk insert with configurable concurrency
3. **Approximate Search** — HNSW provides sub-linear search time
4. **Metadata Pre-filtering** — SQL WHERE before vector search reduces candidate set
5. **Connection Pooling** — Shared pgvector connections across requests

---

### 5.4 gateway — OpenRouter AI Gateway

> **OpenRouter AI gateway — 400+ model routing, fallback chains, cost optimization, load balancing, model selection.**

#### Purpose

The `gateway` submodule is the central nervous system of `@mcv/intelligence`. Every LLM call in the ecosystem flows through it. It provides a unified interface to 400+ models via OpenRouter, handles intelligent routing based on task requirements, automatic failover when providers are down, cost tracking per venture, rate limiting, prompt caching, and response normalization.

#### Model Tiers

| Tier | Representative Models | Use Case | Cost Range |
|---|---|---|---|
| **Economy** | DeepSeek-V3, GPT-4o-mini, Gemini Flash 2.0 | High-volume, simple tasks | $0.10–0.50 / M tokens |
| **Standard** | Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro | General purpose, quality balance | $2–5 / M tokens |
| **Premium** | Claude Opus 4, GPT-4.5, Gemini Ultra | Complex reasoning, critical tasks | $10–30 / M tokens |
| **Reasoning** | o3, o3-mini, Claude Opus:thinking | Multi-step logic, planning, math | $15–50 / M tokens |
| **Specialized** | Code Llama, Mistral, Vision models | Domain-specific tasks | Varies |

#### Routing Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                       ROUTING ENGINE                             │
│                                                                  │
│  Request arrives with:                                           │
│    - task_type (chat, code, analysis, creative, etc.)            │
│    - tier preference (economy, standard, premium, auto)          │
│    - venture_id (for budget/config lookup)                       │
│    - optional model override                                     │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │ Venture     │───▶│ Model        │───▶│ Provider Health   │   │
│  │ Config      │    │ Selector     │    │ Check             │   │
│  └─────────────┘    └──────────────┘    └─────────┬─────────┘   │
│                                                    │             │
│  ┌─────────────┐    ┌──────────────┐              │             │
│  │ Budget      │◀──│ Cost         │◀─────────────┘             │
│  │ Validator   │    │ Estimator    │                             │
│  └──────┬──────┘    └──────────────┘                             │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              FAILOVER CHAIN                              │    │
│  │  Primary: claude-opus → Fallback: gpt-4o → Last: gemini │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Routing rules (configurable per venture):**

| Rule | Description | Example |
|---|---|---|
| **Task-based** | Route by task type | Code tasks → Claude Sonnet; creative → GPT-4o |
| **Cost-based** | Route to cheapest model meeting quality threshold | Auto-downgrade to economy for simple queries |
| **Latency-based** | Route to fastest responding provider | Real-time chat → lowest TTFT model |
| **Region-based** | Route to geographically closest provider | EU data → EU-hosted models |
| **Load-based** | Distribute across providers to avoid rate limits | Round-robin during peak |

#### Failover Chain

When a provider fails (timeout, 5xx, rate limit), the gateway automatically tries the next model in the chain:

```typescript
const response = await gateway.chat({
  messages: [...],
  models: ['claude-opus-4', 'gpt-4o', 'gemini-1.5-pro'], // failover order
  failoverOnError: true,
  failoverOnTimeout: true,
  timeoutMs: 30_000,
});
// Tries claude-opus-4 first; if it fails, tries gpt-4o; if that fails, gemini-1.5-pro
```

The gateway tracks provider health in real-time:

| Health Metric | Threshold | Action |
|---|---|---|
| Error rate > 10 % (5 min window) | Degraded | Move to end of failover chain |
| Error rate > 50 % | Down | Remove from chain entirely |
| Latency P95 > 2× baseline | Slow | Prefer faster alternatives |
| Rate limit hit | Throttled | Back off, try alternate provider |

#### Prompt Caching

Prompt caching can reduce costs by up to 90 % for repeated system prompts:

```
Without cache:  System prompt (2000 tokens) + User message (100 tokens) = 2100 input tokens
With cache:     System prompt (cached, ~0 tokens) + User message (100 tokens) = 100 input tokens
```

Supported by Claude (automatic), GPT-4o (explicit), and Gemini (context caching). The gateway auto-enables caching when:
1. System prompt exceeds 1024 tokens
2. Same system prompt used > 3 times in 1 hour
3. Venture has caching enabled in config

#### Cost Controls

```
┌─────────────────────────────────────────────────────────────────┐
│                      COST CONTROL PIPELINE                       │
│                                                                  │
│  1. PRE-REQUEST                                                  │
│     ├─ Estimate cost (tokens × model price)                      │
│     ├─ Check venture budget (daily / weekly / monthly)           │
│     └─ Reject if over budget (or downgrade tier)                 │
│                                                                  │
│  2. POST-REQUEST                                                 │
│     ├─ Record actual tokens (input + output + cache)             │
│     ├─ Calculate actual cost                                     │
│     └─ Update venture budget consumed                            │
│                                                                  │
│  3. ALERTS                                                       │
│     ├─ 50% budget consumed → info notification                   │
│     ├─ 80% budget consumed → warning notification                │
│     ├─ 95% budget consumed → critical alert                      │
│     └─ 100% budget consumed → hard stop (configurable)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### API Surface

```typescript
interface GatewayModule {
  // Chat completion
  chat(opts: ChatOptions): Promise<ChatResponse>;
  streamChat(opts: StreamChatOptions): AsyncIterable<ChatChunk>;

  // Text completion (legacy)
  complete(opts: CompleteOptions): Promise<CompleteResponse>;

  // Model management
  listModels(filter?: ModelFilter): Promise<ModelInfo[]>;
  getModel(modelId: string): Promise<ModelInfo>;
  routeModel(opts: RouteOptions): Promise<ModelInfo>;

  // Provider health
  getProviderHealth(): Promise<ProviderHealth[]>;

  // Cost
  estimateCost(opts: CostEstimateOptions): CostEstimate;
  getVentureBudget(ventureId: string): Promise<BudgetStatus>;

  // Configuration
  getVentureConfig(ventureId: string): Promise<GatewayConfig>;
  updateVentureConfig(ventureId: string, config: Partial<GatewayConfig>): Promise<void>;
}

interface ChatOptions {
  messages: Message[];
  model?: string;                   // specific model or 'auto'
  models?: string[];                // failover chain
  tier?: 'economy' | 'standard' | 'premium' | 'reasoning';
  ventureId: string;
  userId?: string;
  maxTokens?: number;               // max output tokens
  temperature?: number;             // 0–2 (default 0.7)
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | ToolChoice;
  responseFormat?: 'text' | 'json' | JsonSchema;
  cache?: boolean;                  // enable prompt caching
  zdr?: boolean;                    // zero data retention
  failoverOnError?: boolean;
  failoverOnTimeout?: boolean;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}

interface ChatResponse {
  id: string;
  model: string;                    // actual model used
  provider: string;                 // actual provider
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: 'USD';
  };
  latency: {
    ttft: number;                   // time to first token (ms)
    total: number;                  // total response time (ms)
  };
  metadata: {
    requestId: string;
    routingReason: string;
    failoverAttempts: number;
    cacheHit: boolean;
  };
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `llm_requests` | Every LLM request with full attribution | `id`, `venture_id`, `user_id`, `model`, `provider`, `tokens_in`, `tokens_out`, `cost_usd`, `latency_ms`, `status`, `created_at` |
| `model_configs` | Per-venture model preferences and routing rules | `venture_id`, `default_model`, `tier_overrides`, `failover_chain`, `routing_rules` |
| `cost_budgets` | Budget limits and current consumption | `venture_id`, `period`, `limit_usd`, `consumed_usd`, `alert_thresholds` |
| `provider_health` | Real-time provider status | `provider`, `model`, `error_rate_5m`, `latency_p95`, `status`, `last_check` |
| `prompt_cache` | Cached prompt hashes for cost reduction | `prompt_hash`, `model`, `response_hash`, `tokens_saved`, `created_at`, `expires_at` |

#### Rate Limiting

| Scope | Limit | Window | Action on Exceed |
|---|---|---|---|
| Per-venture | Configurable (default 1000 req/min) | 1 minute | 429 + retry-after header |
| Per-user | Configurable (default 60 req/min) | 1 minute | 429 + retry-after header |
| Per-model (upstream) | Provider-specific | Varies | Auto-failover to next model |
| Global platform | 50,000 req/min | 1 minute | Queue with backpressure |

---

### 5.5 knowledge — Knowledge Base Management

> **Document ingestion, chunking strategies, knowledge graphs, Q&A retrieval.**

#### Purpose

The `knowledge` submodule provides a Neo4j-powered knowledge graph for complex reasoning. It stores entities, relationships, and facts that AI can query for grounded responses. Beyond the graph, it manages document ingestion pipelines — PDF, DOCX, HTML, Markdown — and provides structured Q&A retrieval across venture knowledge bases.

#### Knowledge Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE PIPELINE                             │
│                                                                  │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │ Document │───▶│  Extraction   │───▶│  Entity Recognition  │  │
│  │ Ingestion│    │  (text, meta) │    │  (NER via LLM)       │  │
│  └──────────┘    └───────────────┘    └──────────┬───────────┘  │
│                                                   │              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  ┌───────────────┐    ┌───────────────┐                  │   │
│  │  │ Vector Store  │    │ Knowledge     │                  │   │
│  │  │ (embedding)   │    │ Graph (Neo4j) │                  │   │
│  │  │               │    │               │                  │   │
│  │  │ Chunks →      │    │ Entities →    │                  │   │
│  │  │ Embeddings    │    │ Relationships │                  │   │
│  │  └───────────────┘    └───────────────┘                  │   │
│  │                                                           │   │
│  │  ─── DUAL STORAGE ────────────────────────────────────── │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Document Ingestion

| Format | Extraction Method | Metadata Extracted |
|---|---|---|
| **PDF** | `pdf-parse` + OCR fallback | Title, author, page count, creation date |
| **DOCX** | `mammoth` | Title, author, headings, styles |
| **HTML** | `cheerio` + readability | Title, headings, links, publish date |
| **Markdown** | Native parser | Headings, front matter, links |
| **Plain Text** | Direct | None (user-supplied metadata) |
| **CSV/JSON** | Structured parser | Column names, row count |

#### Entity Types

| Entity Type | Description | Properties |
|---|---|---|
| `Person` | Users, contacts, team members | name, email, role, department |
| `Organization` | Companies, ventures, departments | name, industry, size, website |
| `Product` | Items, services, SKUs | name, sku, price, category |
| `Event` | Transactions, meetings, milestones | type, date, participants, outcome |
| `Location` | Addresses, regions, venues | name, coordinates, type |
| `Concept` | Categories, tags, topics | name, description, parent_concept |
| `Document` | Ingested documents | title, source, ingested_at, chunk_count |

#### Knowledge Graph Queries

The knowledge submodule exposes both high-level semantic queries and raw Cypher for advanced use:

```typescript
// High-level semantic query
const answer = await knowledge.ask({
  question: 'What products has John Smith purchased in the last 6 months?',
  ventureId: 'venture_xyz',
  maxHops: 3,            // relationship traversal depth
  includeEvidence: true,  // return source entities/relationships
});

// Raw Cypher for advanced queries
const results = await knowledge.cypher({
  query: `
    MATCH (p:Person {venture_id: $ventureId})-[:PURCHASED]->(prod:Product)
    WHERE p.name = $name AND p.purchase_date > date() - duration({months: 6})
    RETURN prod.name, prod.price ORDER BY prod.price DESC
  `,
  params: { ventureId: 'venture_xyz', name: 'John Smith' },
});
```

#### API Surface

```typescript
interface KnowledgeModule {
  // Document ingestion
  ingestDocument(doc: DocumentInput): Promise<IngestionResult>;
  ingestBatch(docs: DocumentInput[]): Promise<BatchIngestionResult>;
  deleteDocument(docId: string): Promise<void>;

  // Entity management
  addEntity(entity: EntityInput): Promise<Entity>;
  updateEntity(entityId: string, updates: Partial<EntityInput>): Promise<Entity>;
  deleteEntity(entityId: string): Promise<void>;
  findEntities(query: EntityQuery): Promise<Entity[]>;

  // Relationship management
  addRelation(relation: RelationInput): Promise<Relation>;
  findRelations(query: RelationQuery): Promise<Relation[]>;
  deleteRelation(relationId: string): Promise<void>;

  // Querying
  ask(query: KnowledgeQuery): Promise<KnowledgeAnswer>;
  cypher(query: CypherQuery): Promise<CypherResult>;

  // Fact verification
  verifyFact(claim: string, ventureId: string): Promise<FactVerification>;

  // Graph maintenance
  mergeEntities(entityIds: string[]): Promise<Entity>;
  rebuildGraph(ventureId: string): Promise<void>;
  getGraphStats(ventureId: string): Promise<GraphStats>;
}

interface DocumentInput {
  content: Buffer | string;
  filename: string;
  mimeType: string;
  ventureId: string;
  metadata?: Record<string, any>;
  chunkStrategy?: 'fixed' | 'sentence' | 'paragraph' | 'semantic' | 'recursive';
  extractEntities?: boolean;        // auto-extract entities via NER (default true)
  store?: 'venture_knowledge' | 'ecosystem_shared' | 'compliance';
}

interface KnowledgeAnswer {
  answer: string;
  confidence: number;               // 0–1
  evidence: {
    entities: Entity[];
    relationships: Relation[];
    documents: DocumentReference[];
  };
  reasoning: string;                 // explanation of how answer was derived
}
```

#### Knowledge Store Types

| Store | Purpose | Capacity | Isolation |
|---|---|---|---|
| **Venture Knowledge** | Per-venture documents and entities | 2 GB per venture | Strict venture isolation |
| **Ecosystem Shared** | Cross-venture reference materials | 10 GB | Read-only for ventures |
| **NAOS Instruments** | Agent prompt library | 1 GB | Read-only for agents |
| **Compliance** | Legal and governance documents | 5 GB | Read-only, audit-logged |

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `knowledge_documents` | Ingested document registry | `id`, `venture_id`, `filename`, `mime_type`, `status`, `chunk_count`, `entity_count` |
| `knowledge_entities` | Extracted entities (relational mirror) | `id`, `venture_id`, `type`, `name`, `properties`, `neo4j_id` |
| `knowledge_relations` | Extracted relationships (relational mirror) | `id`, `from_entity_id`, `to_entity_id`, `relation_type`, `properties` |
| `knowledge_ingestion_jobs` | Background ingestion job queue | `id`, `document_id`, `status`, `stage`, `error`, `started_at`, `completed_at` |

---

### 5.6 memory — AI Agent Memory

> **Short-term/long-term memory, memory consolidation, memory search, episodic vs semantic memory.**

#### Purpose

The `memory` submodule provides persistent memory for AI agents and conversations. It enables AI to remember user preferences, past interactions, important facts, and behavioral patterns across sessions. The module implements a three-tier memory hierarchy (working → short-term → long-term) with automatic consolidation and forgetting.

#### Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEMORY HIERARCHY                             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  WORKING MEMORY  (Current Session — In-Process)           │  │
│  │                                                            │  │
│  │  • Last N messages in full (verbatim)                     │  │
│  │  • Current conversation state and intent                  │  │
│  │  • Active tool calls and pending actions                  │  │
│  │  • Lifetime: session duration                              │  │
│  │  • Storage: in-memory (Redis)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ▼ consolidate                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  SHORT-TERM MEMORY  (Recent Sessions — 7 days)            │  │
│  │                                                            │  │
│  │  • Compressed summaries of recent conversations           │  │
│  │  • Key decisions and action items                         │  │
│  │  • Temporary facts ("meeting tomorrow at 3pm")            │  │
│  │  • Lifetime: 7 days (configurable)                         │  │
│  │  • Storage: Supabase + Redis cache                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ▼ consolidate                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  LONG-TERM MEMORY  (Persistent — No Expiry)               │  │
│  │                                                            │  │
│  │  • User preferences and facts                              │  │
│  │  • Important events and milestones                         │  │
│  │  • Learned patterns and behaviors                          │  │
│  │  • Relationship context ("John is the CTO")               │  │
│  │  • Lifetime: permanent (until manually deleted)            │  │
│  │  • Storage: Supabase + pgvector (for semantic recall)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Memory Types

| Type | Description | Examples | Retention |
|---|---|---|---|
| **Episodic** | Specific events and interactions | "User complained about slow checkout on Jan 15" | 30 days → consolidate |
| **Semantic** | Facts and knowledge about the user | "User prefers email over phone" | Permanent |
| **Procedural** | Learned patterns and behaviors | "User always asks for CSV exports" | Permanent |
| **Temporal** | Time-sensitive information | "Meeting at 3pm tomorrow" | Auto-expire |

#### Memory Consolidation

Automatic background process that promotes important short-term memories to long-term:

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Working Memory  │────▶│  Consolidation    │────▶│  Long-term       │
│  (session ends)  │     │  Engine           │     │  Memory          │
└──────────────────┘     │                   │     └──────────────────┘
                         │  • Summarize      │
                         │  • Extract facts   │
                         │  • Score importance│     ┌──────────────────┐
                         │  • Deduplicate     │────▶│  Forgotten       │
                         │  • Merge related   │     │  (low importance) │
                         └───────────────────┘     └──────────────────┘
```

**Importance scoring factors:**
- Frequency of reference (mentioned multiple times → important)
- Recency (recent memories score higher)
- Emotional valence (complaints, praise → higher importance)
- Action items (explicit requests → highest importance)
- Uniqueness (novel information → higher than repeated)

#### Memory Search

Memories are searchable via semantic similarity (vector search over memory embeddings):

```typescript
// Recall relevant memories for a query
const memories = await memory.recall({
  userId: 'user_abc',
  ventureId: 'venture_xyz',
  query: 'What does this user prefer for communication?',
  types: ['semantic', 'procedural'],  // filter by memory type
  limit: 10,
  minConfidence: 0.7,
  recencyBias: 0.3,                    // boost recent memories (0–1)
});
```

#### API Surface

```typescript
interface MemoryModule {
  // Remember
  remember(opts: RememberOptions): Promise<Memory>;
  rememberBatch(memories: RememberOptions[]): Promise<Memory[]>;

  // Recall
  recall(opts: RecallOptions): Promise<Memory[]>;
  recallAll(userId: string, ventureId: string): Promise<Memory[]>;

  // Conversation memory
  saveConversation(conversation: Conversation): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation>;
  summarizeConversation(conversationId: string): Promise<string>;

  // Consolidation
  consolidate(userId: string, ventureId: string): Promise<ConsolidationResult>;
  forceConsolidate(userId: string): Promise<ConsolidationResult>;

  // Management
  forget(memoryId: string): Promise<void>;
  forgetAll(userId: string, ventureId: string): Promise<void>;
  updateMemory(memoryId: string, updates: Partial<Memory>): Promise<Memory>;
  getMemoryStats(userId: string, ventureId: string): Promise<MemoryStats>;

  // Search
  search(query: MemorySearchQuery): Promise<Memory[]>;
}

interface RememberOptions {
  userId: string;
  ventureId: string;
  content: string;                    // the fact/event to remember
  type: 'episodic' | 'semantic' | 'procedural' | 'temporal';
  source: string;                     // conversation_id or system
  confidence: number;                 // 0–1
  importance?: number;                // 0–1 (auto-scored if omitted)
  expiresAt?: Date;                   // for temporal memories
  metadata?: Record<string, any>;
}

interface Memory {
  id: string;
  userId: string;
  ventureId: string;
  content: string;
  type: MemoryType;
  tier: 'working' | 'short_term' | 'long_term';
  confidence: number;
  importance: number;
  source: string;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  expiresAt?: Date;
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `memories` | All stored memories (all tiers) | `id`, `user_id`, `venture_id`, `content`, `type`, `tier`, `confidence`, `importance`, `embedding vector(1536)`, `expires_at` |
| `conversations` | Full conversation logs | `id`, `user_id`, `venture_id`, `messages`, `summary`, `created_at`, `updated_at` |
| `memory_consolidation_log` | Consolidation audit trail | `id`, `user_id`, `memories_processed`, `memories_promoted`, `memories_forgotten`, `run_at` |
| `memory_access_log` | Memory recall tracking (for importance scoring) | `memory_id`, `query`, `accessed_at` |

---

### 5.7 metrics — AI Metrics & Observability

> **Token usage, latency tracking, cost tracking, quality scoring, model comparison.**

#### Purpose

The `metrics` submodule tracks every aspect of AI operations across the platform. It provides cost attribution per venture/user/feature, latency monitoring, model performance analytics, quality scoring, budget consumption dashboards, and anomaly alerting. This is the observability layer that makes AI spend predictable and optimizable.

#### Metrics Pipeline

```
┌────────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────┐
│ LLM Request│───▶│ Metrics      │───▶│ Time-series   │───▶│ Dashboards │
│ (any       │    │ Collector    │    │ Storage       │    │ & Alerts   │
│  submodule)│    │              │    │ (Supabase +   │    │            │
└────────────┘    │ • tokens     │    │  aggregation) │    │ • Grafana  │
                  │ • cost       │    │               │    │ • Slack    │
                  │ • latency    │    └───────────────┘    │ • Email    │
                  │ • model      │                         └────────────┘
                  │ • status     │
                  │ • cache hit  │
                  └──────────────┘
```

#### Tracked Metrics

| Metric | Type | Granularity | Description |
|---|---|---|---|
| `tokens_input` | Counter | Per request | Input tokens consumed |
| `tokens_output` | Counter | Per request | Output tokens generated |
| `tokens_cached` | Counter | Per request | Tokens served from cache |
| `cost_usd` | Gauge | Per request | USD cost of request |
| `latency_ttft_ms` | Histogram | Per request | Time to first token |
| `latency_total_ms` | Histogram | Per request | Total response time |
| `cache_hit_rate` | Gauge | Per venture / 5 min | Prompt cache hit ratio |
| `error_rate` | Gauge | Per model / 5 min | Request failure ratio |
| `model_used` | Label | Per request | Actual model that responded |
| `quality_score` | Gauge | Per request (sampled) | LLM-judged response quality (0–1) |
| `user_satisfaction` | Gauge | Per conversation | Thumbs up/down ratio |

#### Aggregation Levels

| Level | Dimensions | Retention | Use Case |
|---|---|---|---|
| **Raw** | Every individual request | 90 days | Debugging, audit |
| **Hourly** | Per venture × model × hour | 1 year | Trend analysis |
| **Daily** | Per venture × day | 3 years | Budgeting, reporting |
| **Monthly** | Per venture × month | Forever | Historical billing |

#### Quality Scoring

Optional quality evaluation using a separate LLM judge:

```typescript
// Auto-score a sample of responses
const qualityConfig = {
  samplingRate: 0.05,         // score 5% of responses
  judgeModel: 'gpt-4o-mini', // cheap judge model
  criteria: [
    'relevance',              // does it answer the question?
    'accuracy',               // is the information correct?
    'helpfulness',            // is it actionable?
    'safety',                 // no harmful content?
  ],
};
```

#### Model Comparison

Compare models side-by-side on real production traffic:

```typescript
const comparison = await metrics.compareModels({
  ventureId: 'venture_xyz',
  models: ['claude-opus-4', 'gpt-4o', 'gemini-1.5-pro'],
  period: 'last_30_days',
  metrics: ['cost', 'latency', 'quality', 'error_rate'],
});

// Returns:
// {
//   'claude-opus-4':    { avgCost: 0.042, avgLatency: 1800, avgQuality: 0.92, errorRate: 0.01 },
//   'gpt-4o':           { avgCost: 0.028, avgLatency: 1200, avgQuality: 0.88, errorRate: 0.02 },
//   'gemini-1.5-pro':   { avgCost: 0.018, avgLatency: 900,  avgQuality: 0.85, errorRate: 0.03 },
// }
```

#### API Surface

```typescript
interface MetricsModule {
  // Recording
  track(event: MetricEvent): Promise<void>;
  trackBatch(events: MetricEvent[]): Promise<void>;

  // Querying
  getCosts(opts: CostQuery): Promise<CostReport>;
  getLatency(opts: LatencyQuery): Promise<LatencyReport>;
  getUsage(opts: UsageQuery): Promise<UsageReport>;
  getErrors(opts: ErrorQuery): Promise<ErrorReport>;

  // Dashboards
  dashboard(opts: DashboardQuery): Promise<DashboardData>;
  executiveSummary(ventureId: string, period: string): Promise<ExecutiveSummary>;

  // Model comparison
  compareModels(opts: ModelComparisonQuery): Promise<ModelComparison>;

  // Quality
  scoreQuality(requestId: string): Promise<QualityScore>;
  getQualityTrend(opts: QualityQuery): Promise<QualityTrend>;

  // Alerts
  configureAlert(alert: AlertConfig): Promise<void>;
  getAlerts(ventureId: string): Promise<Alert[]>;

  // Budget
  getBudgetStatus(ventureId: string): Promise<BudgetStatus>;
  setBudget(ventureId: string, budget: BudgetConfig): Promise<void>;
}

interface MetricEvent {
  requestId: string;
  ventureId: string;
  userId?: string;
  feature?: string;                  // which feature triggered this
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  tokensCached?: number;
  costUsd: number;
  latencyTtftMs?: number;
  latencyTotalMs: number;
  status: 'success' | 'error' | 'timeout';
  cacheHit: boolean;
  errorCode?: string;
  metadata?: Record<string, string>;
}

interface CostReport {
  total: number;
  byModel: Record<string, number>;
  byFeature: Record<string, number>;
  byDay: { date: string; cost: number }[];
  projectedMonthly: number;
  budgetRemaining: number;
  percentUsed: number;
}
```

#### Alert Configuration

```typescript
// Example alerts
await metrics.configureAlert({
  ventureId: 'venture_xyz',
  type: 'budget_threshold',
  threshold: 0.8,                    // 80% budget consumed
  channel: 'slack',                  // notification channel
  severity: 'warning',
});

await metrics.configureAlert({
  ventureId: 'venture_xyz',
  type: 'error_rate',
  threshold: 0.1,                    // 10% error rate
  window: '5m',
  channel: 'pagerduty',
  severity: 'critical',
});

await metrics.configureAlert({
  ventureId: 'venture_xyz',
  type: 'latency_spike',
  threshold: 5000,                   // P95 > 5s
  window: '15m',
  channel: 'slack',
  severity: 'warning',
});
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `ai_metrics_raw` | Individual request metrics | `request_id`, `venture_id`, `model`, `tokens_in`, `tokens_out`, `cost_usd`, `latency_ms`, `status`, `created_at` |
| `ai_metrics_hourly` | Hourly aggregations | `venture_id`, `model`, `hour`, `total_requests`, `total_tokens`, `total_cost`, `avg_latency`, `error_count` |
| `ai_metrics_daily` | Daily aggregations | `venture_id`, `date`, `total_requests`, `total_tokens`, `total_cost`, `avg_latency`, `p95_latency` |
| `ai_quality_scores` | LLM-judged quality scores | `request_id`, `judge_model`, `relevance`, `accuracy`, `helpfulness`, `safety`, `overall` |
| `ai_alerts` | Alert configurations and history | `id`, `venture_id`, `type`, `threshold`, `channel`, `last_triggered`, `status` |

---

### 5.8 ml — Custom ML Model Management

> **Model registry, inference endpoints, A/B testing, model versioning.**

#### Purpose

The `ml` submodule provides machine learning predictions for business intelligence. It includes pre-built models (churn prediction, product recommendations, anomaly detection, lead scoring, sentiment analysis) and a model registry for deploying custom venture-specific ML models. It supports A/B testing between model versions and tracks prediction accuracy over time.

#### Model Registry

```
┌─────────────────────────────────────────────────────────────────┐
│                       MODEL REGISTRY                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Pre-Built Models (Platform-wide)                        │    │
│  │                                                          │    │
│  │  • churn_predictor v3.2       (production)               │    │
│  │  • product_recommender v2.1   (production)               │    │
│  │  • anomaly_detector v1.5      (production)               │    │
│  │  • lead_scorer v2.0           (production)               │    │
│  │  • sentiment_analyzer v1.3    (production)               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Custom Models (Per-Venture)                             │    │
│  │                                                          │    │
│  │  venture_betedge/                                         │    │
│  │    • odds_predictor v4.1      (production)               │    │
│  │    • odds_predictor v4.2      (A/B test — 20% traffic)   │    │
│  │    • player_value v1.0        (staging)                   │    │
│  │                                                          │    │
│  │  venture_studios/                                         │    │
│  │    • content_classifier v2.0  (production)               │    │
│  │    • recommendation_v3 v3.1   (production)               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Pre-Built Models

| Model | Input | Output | Use Case | Accuracy |
|---|---|---|---|---|
| `churn_predictor` | User activity features | Churn probability (0–1) + risk factors | Retention campaigns | 87 % AUC |
| `product_recommender` | Purchase history + browsing | Ranked product list (top-N) | Upsell/cross-sell | 0.82 NDCG@10 |
| `anomaly_detector` | Transaction features | Anomaly score + explanation | Fraud prevention | 95 % precision |
| `lead_scorer` | Lead attributes + engagement | Score (0–100) + bucket | Sales prioritization | 0.79 correlation |
| `sentiment_analyzer` | Text | Sentiment (-1 to +1) + aspects | Feedback analysis | 91 % accuracy |

#### A/B Testing

```typescript
// Set up A/B test between model versions
await ml.createExperiment({
  name: 'churn_v3_vs_v4',
  ventureId: 'venture_xyz',
  modelName: 'churn_predictor',
  variants: [
    { version: 'v3.2', trafficPercent: 80 },   // control
    { version: 'v4.0', trafficPercent: 20 },    // challenger
  ],
  successMetric: 'retention_rate_30d',
  duration: '14d',
  minSampleSize: 1000,
});

// Predictions auto-route to appropriate variant
const prediction = await ml.predict('churn_predictor', {
  userId: 'user_abc',
  features: { ... },
  ventureId: 'venture_xyz',
});
// prediction.experimentVariant → 'v3.2' or 'v4.0'
```

#### Model Versioning

Every model version is immutable and auditable:

```
churn_predictor/
  ├── v1.0  (archived, 2025-03-15)
  ├── v2.0  (archived, 2025-07-20)
  ├── v3.0  (archived, 2025-11-01)
  ├── v3.1  (archived, 2026-01-05)
  ├── v3.2  (production, 2026-01-20)
  └── v4.0  (staging / A/B test, 2026-02-01)
```

#### Inference Pipeline

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────┐
│ Feature  │───▶│ Model       │───▶│ Prediction   │───▶│ Response │
│ Assembly │    │ Router      │    │ Engine       │    │ + Track  │
│          │    │ (A/B test)  │    │ (TF/PyTorch) │    │          │
└──────────┘    └─────────────┘    └──────────────┘    └──────────┘
     │                                                       │
     │         ┌─────────────┐                               │
     └────────▶│ Feature     │                               │
               │ Store       │◀──────────────────────────────┘
               │ (cached)    │    (feedback loop)
               └─────────────┘
```

#### API Surface

```typescript
interface MLModule {
  // Predictions
  predict(modelName: string, input: PredictInput): Promise<Prediction>;
  predictBatch(modelName: string, inputs: PredictInput[]): Promise<Prediction[]>;

  // Recommendations
  recommend(opts: RecommendOptions): Promise<Recommendation[]>;

  // Anomaly detection
  detectAnomalies(opts: AnomalyOptions): Promise<Anomaly[]>;

  // Model management
  registerModel(model: ModelRegistration): Promise<ModelVersion>;
  deployModel(modelName: string, version: string): Promise<void>;
  rollbackModel(modelName: string): Promise<void>;
  listModels(ventureId?: string): Promise<ModelInfo[]>;
  getModelMetrics(modelName: string, version?: string): Promise<ModelMetrics>;

  // A/B testing
  createExperiment(experiment: ExperimentConfig): Promise<Experiment>;
  getExperimentResults(experimentId: string): Promise<ExperimentResults>;
  concludeExperiment(experimentId: string, winner: string): Promise<void>;

  // Feature store
  setFeatures(entityId: string, features: Record<string, number>): Promise<void>;
  getFeatures(entityId: string): Promise<Record<string, number>>;
}

interface PredictInput {
  ventureId: string;
  userId?: string;
  entityId?: string;
  features: Record<string, number | string | boolean>;
  explain?: boolean;               // include feature importance (default false)
}

interface Prediction {
  modelName: string;
  modelVersion: string;
  prediction: number | string | Record<string, number>;
  confidence: number;
  explanation?: {
    featureImportance: Record<string, number>;
    reasoning: string;
  };
  experimentVariant?: string;
  latencyMs: number;
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `ml_models` | Model registry | `name`, `venture_id`, `description`, `current_version`, `status` |
| `ml_model_versions` | Immutable model versions | `model_name`, `version`, `artifact_path`, `metrics`, `created_at`, `deployed_at` |
| `ml_predictions` | Prediction log (for accuracy tracking) | `id`, `model_name`, `version`, `input_hash`, `prediction`, `actual_outcome`, `created_at` |
| `ml_experiments` | A/B test configurations | `id`, `model_name`, `variants`, `success_metric`, `status`, `started_at`, `ended_at` |
| `ml_feature_store` | Cached feature vectors per entity | `entity_id`, `venture_id`, `features`, `updated_at` |

---

### 5.9 personas — AI Persona Management

> **Personality definitions, voice/tone settings, per-venture personas, persona switching.**

#### Purpose

The `personas` submodule defines AI personality and voice for each venture. It ensures consistent brand experience across all AI interactions — chat, email, support tickets, embedded widgets, and agent actions. Personas control tone, vocabulary, boundaries, knowledge, and behavioral traits.

#### Persona Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      PERSONA DEFINITION                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  IDENTITY                                                │    │
│  │  • Name: "Atlas"                                         │    │
│  │  • Role: "AI Business Analyst"                           │    │
│  │  • Tagline: "Your data, decoded."                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  VOICE & TONE                                            │    │
│  │  • Tone: Professional, confident, approachable           │    │
│  │  • Formality: Medium (contractions OK, no slang)         │    │
│  │  • Vocabulary: Business-friendly, avoid jargon           │    │
│  │  • Preferred phrases: "Let me look into that"            │    │
│  │  • Avoided phrases: "I don't know", "I can't"            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PERSONALITY TRAITS                                      │    │
│  │  • Helpfulness: 0.9                                      │    │
│  │  • Wit: 0.4                                              │    │
│  │  • Empathy: 0.8                                          │    │
│  │  • Directness: 0.7                                       │    │
│  │  • Creativity: 0.5                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  BOUNDARIES                                              │    │
│  │  • Never mention competitors by name                     │    │
│  │  • Never provide legal/medical/financial advice          │    │
│  │  • Never share internal pricing or roadmap               │    │
│  │  • Always redirect billing questions to support          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  KNOWLEDGE                                               │    │
│  │  • Venture mission and values                            │    │
│  │  • Product features and pricing                          │    │
│  │  • FAQ and common workflows                              │    │
│  │  • Team structure (who to escalate to)                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Per-Venture Personas

Each venture can define one or more personas:

| Venture | Primary Persona | Description |
|---|---|---|
| **BetEdge** | "Edge" | Confident, data-driven sports analyst. Speaks in probabilities. |
| **MCV Studios** | "Muse" | Creative, enthusiastic content partner. Inspiring and visual. |
| **Grant Concierge** | "Grant" | Patient, thorough grant specialist. Precise and encouraging. |
| **Platform Default** | "Atlas" | Professional, versatile business assistant. Balanced and helpful. |

#### Persona Switching

Personas can switch mid-conversation based on context:

```typescript
// Context-based persona switching
const personaRouter = {
  'support_ticket':  'atlas_support',    // empathetic support persona
  'sales_inquiry':   'atlas_sales',      // persuasive sales persona
  'technical_docs':  'atlas_technical',  // precise technical persona
  'onboarding':      'atlas_onboarding', // friendly onboarding persona
};
```

#### API Surface

```typescript
interface PersonasModule {
  // Persona CRUD
  create(persona: PersonaDefinition): Promise<Persona>;
  update(personaId: string, updates: Partial<PersonaDefinition>): Promise<Persona>;
  delete(personaId: string): Promise<void>;
  get(personaId: string): Promise<Persona>;
  list(ventureId: string): Promise<Persona[]>;

  // Loading & application
  load(ventureId: string, context?: string): Promise<Persona>;
  apply(persona: Persona, prompt: PromptInput): PromptOutput;

  // Voice
  getVoice(personaId: string): VoiceGuidelines;

  // Testing
  preview(persona: PersonaDefinition, testMessages: string[]): Promise<PreviewResult[]>;
  compare(personaA: string, personaB: string, testMessages: string[]): Promise<ComparisonResult>;

  // A/B testing
  createVariant(personaId: string, variant: PersonaVariant): Promise<PersonaVariant>;
  getVariantResults(personaId: string): Promise<VariantResults>;
}

interface PersonaDefinition {
  ventureId: string;
  name: string;
  role: string;
  tagline?: string;
  voice: {
    tone: string[];                   // e.g. ['professional', 'warm']
    formality: 'casual' | 'medium' | 'formal';
    vocabulary: string[];             // preferred words/phrases
    avoid: string[];                  // words/phrases to never use
  };
  personality: {
    helpfulness: number;              // 0–1
    wit: number;
    empathy: number;
    directness: number;
    creativity: number;
  };
  boundaries: string[];               // things the persona must never do
  knowledge: string[];                 // key facts the persona knows
  systemPromptPrefix: string;          // injected at top of system prompt
  systemPromptSuffix?: string;         // injected at end of system prompt
  examples?: ConversationExample[];    // few-shot examples of ideal responses
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `personas` | Persona definitions | `id`, `venture_id`, `name`, `role`, `definition_json`, `is_default`, `status` |
| `persona_variants` | A/B test persona variants | `id`, `persona_id`, `variant_name`, `definition_json`, `traffic_percent` |
| `persona_usage` | Persona usage tracking | `persona_id`, `date`, `conversations`, `user_satisfaction`, `escalation_rate` |

---

### 5.10 rag — RAG Pipeline

> **Retrieval, augmentation, generation, source attribution, relevance scoring, chunk reranking.**

#### Purpose

The `rag` submodule implements full retrieval-augmented generation pipelines. It retrieves relevant context from document stores (vector search, keyword search, knowledge graph) before generating LLM responses, ensuring responses are grounded in factual, venture-specific knowledge. It supports Google File Search API for managed RAG, custom vector stores, multi-store routing, and source attribution.

#### RAG Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                              │
│                                                                  │
│  ┌──────────┐                                                   │
│  │ Question │                                                   │
│  └────┬─────┘                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────┐                                           │
│  │  Query Analysis  │  Determine intent, expand query,          │
│  │  & Rewriting     │  generate sub-queries if needed           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    RETRIEVAL PHASE                         │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ Vector      │  │ Keyword     │  │ Knowledge       │  │   │
│  │  │ Search      │  │ Search      │  │ Graph Query     │  │   │
│  │  │ (embedding) │  │ (tsvector)  │  │ (Neo4j)         │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │   │
│  │         │                │                   │           │   │
│  │         └────────────────┼───────────────────┘           │   │
│  │                          ▼                                │   │
│  │                   Score Fusion (RRF)                      │   │
│  │                                                           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  RERANKING PHASE                           │   │
│  │                                                           │   │
│  │  Cross-encoder reranking (optional)                      │   │
│  │  Relevance scoring per chunk                             │   │
│  │  Diversity filtering (avoid redundancy)                  │   │
│  │  Token budget fitting                                    │   │
│  │                                                           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AUGMENTATION PHASE                        │   │
│  │                                                           │   │
│  │  Inject retrieved chunks into prompt                     │   │
│  │  Add source citations                                    │   │
│  │  Apply persona voice                                     │   │
│  │  Enforce token budget via context module                 │   │
│  │                                                           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  GENERATION PHASE                          │   │
│  │                                                           │   │
│  │  LLM generates response (via gateway)                    │   │
│  │  Response includes inline source citations               │   │
│  │  Confidence scoring based on retrieval quality           │   │
│  │                                                           │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   OUTPUT                                   │   │
│  │                                                           │   │
│  │  • Generated answer                                      │   │
│  │  • Source attributions with page/chunk references         │   │
│  │  • Confidence score                                      │   │
│  │  • Retrieved chunks (for UI display)                     │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Store Types

| Store | Backend | Purpose | Capacity |
|---|---|---|---|
| **Google File Search** | Google GenAI Managed | Zero-query-cost RAG, managed index | 2 GB per venture |
| **Venture Knowledge** | pgvector / Pinecone | Per-venture document embeddings | 2 GB per venture |
| **Ecosystem Shared** | pgvector | Cross-venture reference docs | 10 GB |
| **Compliance** | pgvector | Legal and governance docs | 5 GB |

#### Query Analysis & Rewriting

Before retrieval, the RAG pipeline analyzes the query:

1. **Intent Detection** — Is this a factual question, opinion request, or action command?
2. **Query Expansion** — Generate synonyms and related terms to improve recall
3. **Sub-query Decomposition** — Complex questions split into simpler retrievable queries
4. **Temporal Awareness** — "latest" or "recent" queries filter by date

```typescript
// Example: complex query decomposition
const query = "What changed in our refund policy last month and how does it affect premium users?";
// Decomposes into:
// 1. "refund policy changes" (temporal filter: last 30 days)
// 2. "premium user refund policy impact"
// Results from both sub-queries are merged
```

#### Chunk Reranking

After initial retrieval, chunks are reranked for quality:

| Reranking Method | Latency | Accuracy | Cost |
|---|---|---|---|
| **Score-only (default)** | 0 ms | Good | Free |
| **Cross-encoder** | 50–100 ms | Excellent | ~$0.001 per query |
| **LLM-as-judge** | 200–500 ms | Best | ~$0.01 per query |

#### Source Attribution

Every RAG response includes traceable source citations:

```typescript
interface RAGResponse {
  answer: string;                    // "According to our policy [1], refunds are processed within..."
  sources: RAGSource[];
  confidence: number;                // 0–1 based on retrieval quality
  retrievalMetrics: {
    chunksRetrieved: number;
    chunksUsed: number;
    avgRelevanceScore: number;
    searchLatencyMs: number;
  };
}

interface RAGSource {
  id: string;
  documentTitle: string;
  documentId: string;
  chunkContent: string;             // the actual text chunk
  chunkIndex: number;
  pageNumber?: number;
  relevanceScore: number;
  url?: string;                      // link to source document
}
```

#### API Surface

```typescript
interface RAGModule {
  // Query with RAG
  query(opts: RAGQueryOptions): Promise<RAGResponse>;
  streamQuery(opts: RAGQueryOptions): AsyncIterable<RAGStreamChunk>;

  // Document management
  indexDocument(doc: RAGDocumentInput): Promise<IndexResult>;
  indexBatch(docs: RAGDocumentInput[]): Promise<BatchIndexResult>;
  deleteDocument(docId: string, store: string): Promise<void>;

  // Store management
  createStore(store: StoreConfig): Promise<Store>;
  listStores(ventureId: string): Promise<Store[]>;
  getStoreStats(storeId: string): Promise<StoreStats>;

  // Retrieval only (no generation)
  retrieve(opts: RetrieveOptions): Promise<RetrievedChunk[]>;

  // Evaluation
  evaluateRetrieval(opts: EvalOptions): Promise<RetrievalEvaluation>;
}

interface RAGQueryOptions {
  question: string;
  ventureId: string;
  stores?: string[];                 // stores to search (default: all venture stores)
  topK?: number;                     // chunks to retrieve (default 5)
  rerank?: boolean;                  // enable cross-encoder reranking (default false)
  generateResponse?: boolean;        // generate LLM answer or just retrieve (default true)
  model?: string;                    // LLM for generation (default venture config)
  includeMetadata?: boolean;
  stream?: boolean;
  filter?: Record<string, any>;      // metadata filters
  queryRewriting?: boolean;          // enable query analysis (default true)
}
```

#### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `rag_stores` | RAG store configurations | `id`, `venture_id`, `name`, `backend`, `config`, `status` |
| `rag_documents` | Indexed documents per store | `id`, `store_id`, `filename`, `mime_type`, `chunk_count`, `indexed_at` |
| `rag_queries` | Query log for evaluation | `id`, `venture_id`, `question`, `chunks_retrieved`, `answer`, `confidence`, `latency_ms` |
| `rag_feedback` | User feedback on RAG answers | `query_id`, `helpful`, `source_correct`, `feedback_text` |

---

### 5.11 streaming — LLM Streaming

> **SSE/WebSocket streaming, token-by-token delivery, stream aggregation, abort handling.**

#### Purpose

The `streaming` submodule provides real-time LLM response delivery. It supports Server-Sent Events (SSE) for HTTP clients and WebSockets for bidirectional interactive applications. It enables sub-second first-token latency, partial response rendering, backpressure handling for slow clients, and graceful error recovery during mid-stream failures.

#### Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     STREAMING ARCHITECTURE                       │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  LLM Provider│  (OpenRouter SSE)                             │
│  └──────┬──────┘                                                │
│         │ SSE events                                             │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │  Stream Parser    │  Parse provider-specific SSE formats      │
│  │  (normalize)      │  into unified token events                │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  Stream Router    │                                           │
│  │                   │                                           │
│  │  ┌────────────┐  │  ┌────────────────────────────────────┐  │
│  │  │ SSE Output │──┼─▶│ HTTP client (EventSource)           │  │
│  │  └────────────┘  │  └────────────────────────────────────┘  │
│  │                   │                                           │
│  │  ┌────────────┐  │  ┌────────────────────────────────────┐  │
│  │  │ WS Output  │──┼─▶│ WebSocket client (ws/socket.io)    │  │
│  │  └────────────┘  │  └────────────────────────────────────┘  │
│  │                   │                                           │
│  │  ┌────────────┐  │  ┌────────────────────────────────────┐  │
│  │  │ Callback   │──┼─▶│ Server-side consumer (onToken cb)  │  │
│  │  └────────────┘  │  └────────────────────────────────────┘  │
│  │                   │                                           │
│  └──────────────────┘                                           │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Stream Aggregator│  Collect tokens → full response           │
│  │  (parallel)       │  Track token count, latency               │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### SSE Event Format

```
event: token
data: {"content": "Hello", "index": 0}

event: token
data: {"content": " world", "index": 1}

event: tool_call
data: {"id": "call_123", "name": "search", "arguments": "{...}"}

event: usage
data: {"inputTokens": 150, "outputTokens": 42}

event: done
data: {"finishReason": "stop", "model": "claude-opus-4"}

event: error
data: {"code": "rate_limit", "message": "Rate limited, retrying..."}
```

#### WebSocket Protocol

```typescript
// Client → Server
interface WSClientMessage {
  type: 'chat' | 'abort' | 'ping';
  id: string;                        // request correlation ID
  payload?: {
    messages: Message[];
    model?: string;
    stream: true;
  };
}

// Server → Client
interface WSServerMessage {
  type: 'token' | 'tool_call' | 'usage' | 'done' | 'error' | 'pong';
  id: string;                        // correlates to request ID
  payload: {
    content?: string;
    index?: number;
    finishReason?: string;
    error?: { code: string; message: string };
  };
}
```

#### Backpressure Handling

When a client can't consume tokens fast enough:

| Strategy | Trigger | Action |
|---|---|---|
| **Buffer** | Client 50 ms behind | Buffer up to 100 tokens in memory |
| **Batch** | Client 200 ms behind | Batch tokens into larger chunks |
| **Pause** | Client 1s behind | Pause upstream SSE consumption |
| **Drop** | Buffer full (10 KB) | Drop oldest buffered tokens, send summary |

#### Abort Handling

```typescript
// Client-side abort
const controller = new AbortController();
const stream = streaming.streamChat({
  messages: [...],
  signal: controller.signal,
});

// User clicks "stop generating"
controller.abort();
// → Upstream LLM request cancelled
// → Partial response aggregated and returned
// → Metrics track partial completion
```

#### API Surface

```typescript
interface StreamingModule {
  // Server-side stream generation
  streamChat(opts: StreamChatOptions): AsyncIterable<StreamEvent>;
  streamComplete(opts: StreamCompleteOptions): AsyncIterable<StreamEvent>;

  // SSE endpoint helper
  createSSEHandler(opts: SSEHandlerOptions): RequestHandler;

  // WebSocket handler
  createWSHandler(opts: WSHandlerOptions): WebSocketHandler;

  // Client-side helpers (for embed widgets)
  createEventSource(url: string, opts: EventSourceOptions): ManagedEventSource;
  createWebSocket(url: string, opts: WebSocketOptions): ManagedWebSocket;

  // Stream utilities
  aggregate(stream: AsyncIterable<StreamEvent>): Promise<AggregatedResponse>;
  tee(stream: AsyncIterable<StreamEvent>, count: number): AsyncIterable<StreamEvent>[];
  transform(stream: AsyncIterable<StreamEvent>, fn: TransformFn): AsyncIterable<StreamEvent>;
}

interface StreamChatOptions {
  messages: Message[];
  model?: string;
  ventureId: string;
  onToken?: (token: string, index: number) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onUsage?: (usage: TokenUsage) => void;
  onComplete?: (response: AggregatedResponse) => void;
  onError?: (error: StreamError) => void;
  signal?: AbortSignal;
  backpressure?: 'buffer' | 'batch' | 'pause' | 'drop';
}

interface StreamEvent {
  type: 'token' | 'tool_call' | 'usage' | 'done' | 'error';
  content?: string;
  index?: number;
  toolCall?: ToolCall;
  usage?: TokenUsage;
  finishReason?: string;
  error?: { code: string; message: string };
  timestamp: number;
}

interface AggregatedResponse {
  content: string;
  toolCalls: ToolCall[];
  usage: TokenUsage;
  finishReason: string;
  model: string;
  tokenCount: number;
  latency: {
    ttft: number;
    total: number;
  };
  aborted: boolean;
  tokensStreamed: number;
}
```

#### Performance Characteristics

| Metric | Target | Measurement |
|---|---|---|
| Time-to-first-token (TTFT) | < 500 ms | P95 from request to first SSE event |
| Token delivery jitter | < 20 ms | Variance between consecutive tokens |
| Stream setup latency | < 50 ms | Time to establish SSE/WS connection |
| Abort propagation | < 100 ms | Time from abort signal to upstream cancellation |
| Memory per stream | < 50 KB | Buffer allocation per active stream |

---

## Cross-Module Integration Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CROSS-MODULE INTEGRATION MAP                          │
│                                                                          │
│                                                                          │
│    ┌─────────┐         ┌──────────┐         ┌──────────┐               │
│    │ gateway │────────▶│ streaming│         │ metrics  │               │
│    │         │         │          │         │          │               │
│    │ routes  │         │ delivers │         │ observes │               │
│    │ all LLM │         │ tokens   │         │ ALL      │               │
│    │ calls   │         │ to client│         │ modules  │               │
│    └────┬────┘         └──────────┘         └──────────┘               │
│         │                                        ▲                      │
│         │ provides LLM                           │ reports metrics      │
│         ▼                                        │                      │
│    ┌─────────┐    ┌──────────┐    ┌──────────┐  │                      │
│    │ context │◀──│ personas │    │  memory  │──┘                      │
│    │         │    │          │    │          │                          │
│    │assembles│    │ injects  │    │ provides │                          │
│    │ prompts │    │ voice    │    │ history  │                          │
│    └────┬────┘    └──────────┘    └─────┬────┘                          │
│         │                               │                               │
│         │ includes RAG context          │ uses for recall               │
│         ▼                               ▼                               │
│    ┌─────────┐    ┌──────────┐    ┌──────────┐                         │
│    │   rag   │◀──│embedding │    │   ml     │                         │
│    │         │    │          │    │          │                          │
│    │retrieves│    │ provides │    │ provides │                          │
│    │ context │    │ vectors  │    │ predict- │                          │
│    └────┬────┘    └──────────┘    │ ions     │                          │
│         │                         └──────────┘                          │
│         │ queries graph                                                 │
│         ▼                                                               │
│    ┌──────────┐    ┌──────────┐                                        │
│    │knowledge │    │  embed   │                                        │
│    │          │    │ (widgets)│                                        │
│    │ provides │    │          │                                        │
│    │ entities │    │ connects │                                        │
│    │ & facts  │    │ external │                                        │
│    └──────────┘    │ users to │                                        │
│                    │ pipeline │                                        │
│                    └──────────┘                                        │
│                                                                          │
│  KEY FLOWS:                                                              │
│  ─────────                                                              │
│  gateway ──▶ ALL AI features (central LLM access)                       │
│  rag ──▶ embedding + knowledge (retrieval sources)                      │
│  memory ──▶ context (history injection)                                 │
│  metrics ──▶ ALL modules (universal observability)                      │
│  personas ──▶ context (voice injection)                                 │
│  embed ──▶ gateway + rag + streaming (end-to-end widget pipeline)      │
│  context ──▶ gateway (assembled prompts for LLM calls)                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration Flow: End-to-End Chat Request

A typical chat request touches most submodules:

```
1. User sends message via embed widget (or API)
       │
2. embed → authenticates, creates session
       │
3. personas.load() → load venture persona
       │
4. memory.recall() → retrieve relevant memories for this user
       │
5. rag.retrieve() → search vector stores for relevant documents
       │     ├── embedding.search() → vector similarity search
       │     └── knowledge.findRelations() → graph traversal
       │
6. context.assemble() → combine system prompt + persona + RAG + memories + user message
       │     └── context.countTokens() → fit within model limit
       │
7. gateway.streamChat() → route to optimal model, stream response
       │     └── streaming → deliver tokens to client in real-time
       │
8. memory.remember() → extract and store notable facts from conversation
       │
9. metrics.track() → record tokens, cost, latency, model, status
       │
10. Response delivered to user with source citations
```

---

## Data Model & Schema

### Table Inventory (All Submodules)

| Submodule | Table Count | Key Tables |
|---|---|---|
| **gateway** | 5 | `llm_requests`, `model_configs`, `cost_budgets`, `provider_health`, `prompt_cache` |
| **context** | 4 | `prompt_templates`, `context_configs`, `conversation_turns`, `context_summaries` |
| **embedding** | 4 | `vector_collections`, `vector_documents`, `vector_chunks`, `vector_index_jobs` |
| **streaming** | 0 | (stateless — uses gateway and metrics tables) |
| **metrics** | 5 | `ai_metrics_raw`, `ai_metrics_hourly`, `ai_metrics_daily`, `ai_quality_scores`, `ai_alerts` |
| **rag** | 4 | `rag_stores`, `rag_documents`, `rag_queries`, `rag_feedback` |
| **knowledge** | 4 | `knowledge_documents`, `knowledge_entities`, `knowledge_relations`, `knowledge_ingestion_jobs` |
| **personas** | 3 | `personas`, `persona_variants`, `persona_usage` |
| **memory** | 4 | `memories`, `conversations`, `memory_consolidation_log`, `memory_access_log` |
| **ml** | 5 | `ml_models`, `ml_model_versions`, `ml_predictions`, `ml_experiments`, `ml_feature_store` |
| **embed** | 4 | `embed_configs`, `embed_sessions`, `embed_analytics`, `embedding_cache` |
| **Total** | ~42 tables | |

### Row-Level Security

All tables enforce venture isolation via RLS:

```sql
-- Example RLS policy (applied to all intelligence tables)
CREATE POLICY venture_isolation ON llm_requests
  USING (venture_id = current_setting('app.venture_id')::uuid);

-- Users can only see their own memories
CREATE POLICY user_memory_isolation ON memories
  USING (
    venture_id = current_setting('app.venture_id')::uuid
    AND user_id = current_setting('app.user_id')::uuid
  );
```

### External Data Stores

| Store | Technology | Purpose | Isolation |
|---|---|---|---|
| **Primary DB** | Supabase (PostgreSQL 15+) | All relational data, pgvector embeddings | RLS per venture |
| **Vector DB** | Pinecone / Qdrant | Large-scale vector search | Namespace per venture |
| **Graph DB** | Neo4j 5.x | Knowledge graphs, entity relationships | Labeled subgraphs per venture |
| **Cache** | Redis 7.x | Embedding cache, working memory, rate limits | Key prefix per venture |

---

## Configuration Reference

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════
# REQUIRED
# ═══════════════════════════════════════════════════════════════

OPENROUTER_API_KEY=sk-or-v1-xxx          # OpenRouter API key (gateway)
DATABASE_URL=postgresql://...             # Supabase connection (all modules)

# ═══════════════════════════════════════════════════════════════
# OPTIONAL — External Services
# ═══════════════════════════════════════════════════════════════

NEO4J_URI=bolt://localhost:7687          # Neo4j connection (knowledge)
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
PINECONE_API_KEY=xxx                      # Pinecone API key (embedding)
PINECONE_ENVIRONMENT=us-east-1
QDRANT_URL=http://localhost:6333         # Qdrant URL (embedding, alternative)
QDRANT_API_KEY=xxx
GOOGLE_GENAI_API_KEY=xxx                  # Google GenAI for File Search (rag)
REDIS_URL=redis://localhost:6379          # Redis for caching (all modules)

# ═══════════════════════════════════════════════════════════════
# OPTIONAL — Defaults
# ═══════════════════════════════════════════════════════════════

DEFAULT_MODEL=claude-sonnet               # Default chat model (gateway)
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small   # Default embedding model (embed)
MAX_CONTEXT_TOKENS=128000                 # Maximum context window (context)
CACHE_TTL_SECONDS=3600                    # Prompt cache TTL (gateway)
MEMORY_CONSOLIDATION_INTERVAL=3600        # Seconds between consolidation runs (memory)
METRICS_RETENTION_RAW_DAYS=90             # Raw metrics retention (metrics)
METRICS_RETENTION_HOURLY_DAYS=365         # Hourly aggregation retention (metrics)
RAG_DEFAULT_TOP_K=5                       # Default chunks to retrieve (rag)
RAG_RERANK_ENABLED=false                  # Enable cross-encoder reranking (rag)
```

### Per-Venture Configuration (Database)

Each venture can override defaults via the `model_configs` and `context_configs` tables:

```typescript
interface VentureIntelligenceConfig {
  // Gateway
  defaultModel: string;
  defaultTier: 'economy' | 'standard' | 'premium';
  failoverChain: string[];
  budgetMonthlyUsd: number;
  rateLimitPerMinute: number;
  cachingEnabled: boolean;
  zdrDefault: boolean;

  // Context
  maxContextTokens: number;
  compressionStrategy: 'truncate' | 'summarize' | 'sliding';
  historyTurnsToKeep: number;

  // RAG
  ragStores: string[];
  ragTopK: number;
  ragRerankEnabled: boolean;

  // Persona
  defaultPersonaId: string;

  // Memory
  memoryEnabled: boolean;
  memoryRetentionDays: number;
  autoConsolidate: boolean;

  // ML
  enabledModels: string[];
}
```

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|---|---|
| **Cross-venture data leakage** | RLS on all tables, namespace isolation in vector DBs, labeled subgraphs in Neo4j |
| **API key exposure** | Keys stored encrypted in vault, never in client-side code; embed widgets use public keys |
| **PII sent to LLMs** | PII detection and masking before external API calls; venture-configurable PII rules |
| **Prompt injection** | Input sanitization, system prompt hardening, output validation |
| **Cost abuse** | Per-venture budget caps, per-user rate limits, anomaly detection on spend |
| **Model hallucination** | RAG grounding, source attribution, confidence scoring, fact verification |
| **Data exfiltration via AI** | Boundary rules in personas, output filtering, audit logging |

### Security Controls

1. **API Key Encryption** — All external API keys (OpenRouter, Pinecone, Neo4j) stored encrypted at rest in the vault.
2. **Venture Isolation** — Row-level security, namespace isolation, and subgraph labeling ensure zero cross-venture access.
3. **PII Masking** — Configurable PII detection (regex + NER) masks sensitive data before sending to external LLMs.
4. **Rate Limiting** — Multi-tier rate limiting (per venture, per user, per model, global platform).
5. **Audit Logging** — Every LLM request, RAG query, and memory operation is logged for compliance.
6. **Zero Data Retention** — Optional ZDR flag on requests instructs providers not to retain data.
7. **Input Sanitization** — System prompts include injection-resistant instructions; user input is validated.
8. **Output Filtering** — Response content is scanned for policy violations before delivery.

---

## Performance Targets & SLAs

| Metric | Target | Measurement | SLA |
|---|---|---|---|
| **Time-to-first-token (TTFT)** | < 500 ms | P95 latency | 99.5 % |
| **Embedding generation** | < 100 ms | Per batch of 10 texts | 99.9 % |
| **RAG query (retrieval only)** | < 200 ms | End-to-end retrieval | 99.5 % |
| **Vector similarity search** | < 50 ms | Top-K=10 query (pgvector) | 99.9 % |
| **Knowledge graph query** | < 100 ms | 2-hop traversal (Neo4j) | 99.5 % |
| **Memory recall** | < 150 ms | Semantic search over memories | 99.5 % |
| **Stream setup** | < 50 ms | SSE/WS connection establishment | 99.9 % |
| **Metrics ingestion** | < 10 ms | Per event async write | 99.9 % |
| **Widget load time** | < 200 ms | Script download + init | 99.5 % |
| **Uptime** | 99.9 % | Gateway availability | SLA |

### Scaling Targets

| Dimension | Current | Year 1 | Year 2 |
|---|---|---|---|
| LLM requests/day | ~10K | ~100K | ~1M |
| Vectors stored | ~1M | ~50M | ~500M |
| Active ventures | ~5 | ~50 | ~500 |
| Concurrent streams | ~50 | ~500 | ~5,000 |
| Memory entries | ~100K | ~5M | ~50M |

---

## Commercialization Path

### Phase 1: Internal (Now → Q2 2026)

- Powers all MCV.ONE ventures exclusively
- All 11 submodules operational
- Cost optimization validated across BetEdge, Studios, Grant Concierge
- Performance baselines established

### Phase 2: White-Label (Q3 2026)

- Extract embeddable widgets into standalone SDK
- White-label AI assistant for venture customers
- Per-seat pricing for managed AI capabilities
- Multi-tenant isolation hardened for external customers

### Phase 3: SaaS Platform (2027 — mcv.dev)

- Full AI infrastructure as a service
- Self-service onboarding for new ventures
- Marketplace for custom ML models and personas
- Developer API with usage-based pricing

### Revenue Model

| Phase | Model | Pricing |
|---|---|---|
| **Internal** | Cost center (venture allocation) | Internal transfer pricing |
| **White-Label** | Per-venture license | $500–5,000/mo per venture |
| **SaaS (mcv.dev)** | Usage-based API | $ .001–0.01 per AI request + model pass-through |

### Key Milestones

| Milestone | Target Date | Success Criteria |
|---|---|---|
| All 11 submodules production-ready | Q1 2026 | 85 % test coverage, P95 latency targets met |
| First external white-label customer | Q3 2026 | Revenue-generating customer on platform |
| mcv.dev beta launch | Q1 2027 | Self-service onboarding, 10+ beta customers |
| mcv.dev GA | Q3 2027 | 100+ paying customers, $50K MRR |

---

## Testing Strategy

### Unit Tests (≥ 85 % Coverage)

Each submodule has comprehensive unit tests:

| Submodule | Key Test Areas |
|---|---|
| **gateway** | Model routing logic, failover chains, cost estimation, budget validation |
| **context** | Token counting accuracy, assembly priority, compression, template rendering |
| **embedding** | Chunking strategies, similarity calculations, collection CRUD |
| **streaming** | Event parsing, backpressure, abort handling, aggregation |
| **metrics** | Event recording, aggregation, alert triggering, budget calculations |
| **rag** | Query rewriting, retrieval scoring, reranking, source attribution |
| **knowledge** | Entity extraction, graph queries, fact verification |
| **memory** | Remember/recall, consolidation, importance scoring, expiration |
| **ml** | Prediction accuracy, A/B routing, model versioning |
| **personas** | Persona loading, voice application, boundary enforcement |
| **embed** | Widget rendering, session management, analytics |

### Integration Tests (≥ 70 % Coverage)

End-to-end flows across submodules:

- Chat completion: context → gateway → streaming → metrics
- RAG query: embedding → rag → context → gateway
- Memory recall: memory → context → gateway
- Widget session: embed → gateway → streaming → metrics
- Document ingestion: knowledge → embedding → rag

### Mock Strategy

External services are mocked in tests:

| Service | Mock |
|---|---|
| OpenRouter | Recorded response fixtures, configurable latency |
| Neo4j | In-memory graph (neo4j-driver-mock) |
| Pinecone | Local vector store mock |
| Redis | ioredis-mock |
| Supabase | Local PostgreSQL + pgvector |

---

## Deployment & Operations

### Infrastructure Requirements

| Component | Specification | Scaling |
|---|---|---|
| **Application** | Node.js 20+ | Horizontal (auto-scale on request rate) |
| **Primary DB** | Supabase Pro (PostgreSQL 15 + pgvector) | Vertical (compute size) |
| **Vector DB** | Pinecone Serverless (or Qdrant managed) | Auto-scales with index size |
| **Graph DB** | Neo4j AuraDB Professional | Vertical (memory + CPU) |
| **Cache** | Redis 7+ (Upstash or managed) | Auto-scales |
| **CDN** | Cloudflare (embed widget assets) | Global PoPs |

### Health Checks

`
GET /health/intelligence
{
  "status": "healthy",
  "modules": {
    "gateway":   { "status": "healthy", "providerCount": 12, "modelsAvailable": 423 },
    "context":   { "status": "healthy" },
    "embedding": { "status": "healthy", "collectionsActive": 15, "vectorsIndexed": 2400000 },
    "streaming": { "status": "healthy", "activeStreams": 23 },
    "metrics":   { "status": "healthy", "eventsToday": 14523 },
    "rag":       { "status": "healthy", "storesActive": 8 },
    "knowledge": { "status": "healthy", "entitiesTotal": 145000, "neo4jConnected": true },
    "memory":    { "status": "healthy", "memoriesTotal": 89000 },
    "ml":        { "status": "healthy", "modelsDeployed": 7 },
    "personas":  { "status": "healthy", "personasActive": 5 },
    "embed":     { "status": "healthy", "widgetSessionsActive": 12 }
  },
  "uptime": "14d 6h 23m"
}
`

### Monitoring & Alerting

| Monitor | Tool | Alert Channel |
|---|---|---|
| LLM provider health | Custom (provider_health table) | Slack + PagerDuty |
| Cost budget consumption | metrics submodule | Slack + Email |
| Error rate spikes | metrics submodule | PagerDuty |
| Latency degradation | metrics submodule | Slack |
| Database performance | Supabase dashboard | Email |
| Vector index health | Pinecone/Qdrant dashboard | Slack |
| Neo4j graph health | Neo4j Aura monitoring | Email |

---

## Related Documentation

| Document | Path | Description |
|---|---|---|
| Package Specification | `./01-PACKAGE-SPEC.md` | Full package spec with all module details |
| Technical Architecture | `./02-TECHNICAL-ARCHITECTURE.md` | Deep technical design |
| API Reference | `./03-API-REFERENCE.md` | Complete API documentation |
| Implementation Plan | `./04-IMPLEMENTATION-PLAN.md` | Sprint-by-sprint build plan |
| gateway MODULE | `./gateway/MODULE.md` | Gateway submodule deep dive |
| context MODULE | `./context/MODULE.md` | Context submodule deep dive |
| embedding MODULE | `./embedding/MODULE.md` | Embedding submodule deep dive |
| streaming MODULE | `./streaming/MODULE.md` | Streaming submodule deep dive |
| metrics MODULE | `./metrics/MODULE.md` | Metrics submodule deep dive |
| rag MODULE | `./rag/MODULE.md` | RAG submodule deep dive |
| knowledge MODULE | `./knowledge/MODULE.md` | Knowledge submodule deep dive |
| personas MODULE | `./personas/MODULE.md` | Personas submodule deep dive |
| memory MODULE | `./memory/MODULE.md` | Memory submodule deep dive |
| ml MODULE | `./ml/MODULE.md` | ML submodule deep dive |
| embed MODULE | `./embed/MODULE.md` | Embed widgets submodule deep dive |

---

*@mcv/intelligence — AI & Intelligence Layer*
