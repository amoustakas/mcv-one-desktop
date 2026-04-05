# @mcv/intelligence — Package Specification
## Tier 4: AI Intelligence Layer

**Package:** `@mcv/intelligence`  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/intelligence` is the AI brain of the MCV.ONE ecosystem. It provides unified LLM access through OpenRouter, semantic embeddings, retrieval-augmented generation (RAG), knowledge graphs, conversation memory, machine learning predictions, and embeddable AI widgets. Every AI-powered feature in MCV flows through this package.

**The Intelligence Layer turns data into understanding and understanding into action.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    VENTURE APPLICATIONS                                      │
│                                                                                              │
│   BetEdge AI       MCV Studios       Grant Concierge       Venture Dashboards              │
│   Predictions      NPCs/Agents       Document AI           Executive Insights               │
│                                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                           │ uses
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   @mcv/intelligence                                          │
│                                                                                              │
│  ┌─────────────────────────────────── CORE LAYER ──────────────────────────────────────┐   │
│  │                         (Always Loaded - Foundation)                                  │   │
│  │                                                                                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ gateway  │ │ context  │ │embedding │ │streaming │ │ metrics  │                   │   │
│  │  │          │ │          │ │          │ │          │ │          │                   │   │
│  │  │OpenRouter│ │ Assembly │ │  Vector  │ │ SSE/WS   │ │  Usage   │                   │   │
│  │  │ Routing  │ │ Tokens   │ │  Search  │ │ Realtime │ │Analytics │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│  ┌─────────────────────────────── EXTENSION LAYER ─────────────────────────────────────┐   │
│  │                        (Dynamically Loadable - Optional)                             │   │
│  │                                                                                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │   rag    │ │knowledge │ │ personas │ │  memory  │ │    ml    │                   │   │
│  │  │          │ │          │ │          │ │          │ │          │                   │   │
│  │  │ Retrieval│ │ Neo4j    │ │  Brand   │ │ Long-term│ │Prediction│                   │   │
│  │  │Augmented │ │ Graph    │ │  Voice   │ │ Context  │ │  Models  │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│  ┌─────────────────────────────── PLUGIN LAYER ────────────────────────────────────────┐   │
│  │                         (External-Facing - Embeddable)                               │   │
│  │                                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                                embed                                          │   │   │
│  │  │                                                                               │   │   │
│  │  │    Chat Widget    │    Search Widget    │    Voice Widget    │    SDK         │   │   │
│  │  └──────────────────────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                           │ depends on
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DEPENDENCIES                                               │
│                                                                                              │
│  @mcv/kernel    │    @mcv/nexus    │    @mcv/api    │    @mcv/commerce                      │
│  (foundation)        (agents)           (routes)         (transactions)                      │
│                                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                           │ depends on
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EXTERNAL SERVICES                                            │
│                                                                                              │
│  OpenRouter │ Neo4j │ Pinecone/Qdrant │ Google GenAI │ Redis │ Supabase │ Cloudflare        │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### What This Package Does

| Capability | Description | Key Benefit |
|------------|-------------|-------------|
| **Unified LLM Gateway** | Single interface to 400+ models via OpenRouter | No vendor lock-in, automatic failover |
| **Cost Optimization** | Intelligent model routing, caching, budgets | 40-60% cost reduction vs. direct API |
| **Context Assembly** | Real-time data injection into prompts | Always-current AI responses |
| **Semantic Search** | Vector embeddings for document/content search | Find meaning, not just keywords |
| **Streaming Responses** | SSE/WebSocket for real-time LLM output | Sub-second first-token latency |
| **Knowledge Graphs** | Neo4j-powered entity relationships | Complex reasoning, fact verification |
| **RAG Pipelines** | Retrieval-augmented generation | Grounded, factual AI responses |
| **AI Personas** | Per-venture personality and voice | Consistent brand experience |
| **Conversation Memory** | Long-term context retention | Continuous user relationships |
| **ML Predictions** | Churn, recommendations, anomaly detection | Predictive intelligence |
| **Embeddable Widgets** | Chat, search, voice for any website | Zero-code AI integration |

---

## Sub-Modules Overview

### Core Layer (Always Loaded)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **gateway** | OpenRouter integration, model routing, failover | `chat`, `complete`, `routeModel` |
| **context** | Context assembly, token management | `assembleContext`, `tokenize` |
| **embedding** | Text to vectors, chunking strategies | `embed`, `chunk`, `similarity` |
| **streaming** | SSE/WebSocket streaming | `streamChat`, `streamComplete` |
| **metrics** | Usage analytics, cost tracking | `trackUsage`, `getCosts` |

### Extension Layer (Loadable)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **rag** | Retrieval-augmented generation | `query`, `indexDocument` |
| **knowledge** | Knowledge graph with Neo4j | `addEntity`, `findRelations` |
| **personas** | Per-venture AI personality | `loadPersona`, `applyVoice` |
| **memory** | Conversation memory, summaries | `remember`, `recall`, `summarize` |
| **ml** | Predictions, recommendations | `predict`, `recommend`, `detectAnomaly` |

### Plugin Layer

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **embed** | Embeddable AI widgets | `ChatWidget`, `SearchWidget`, `VoiceWidget` |

---

## Module: gateway

### Purpose

The gateway module provides unified access to 400+ LLM models via OpenRouter. It handles intelligent routing based on task requirements, automatic failover when providers are down, cost tracking per venture, rate limiting, and response caching.

### Key Features

1. **Multi-Model Access** — GPT-4o, Claude Opus, Gemini Pro, DeepSeek, Llama, and 400+ more
2. **Intelligent Routing** — Route by task type, cost tier, or custom rules
3. **Automatic Failover** — Seamless switch to backup models on provider failure
4. **Prompt Caching** — 90% cost reduction on repeated prompts (Claude, GPT)
5. **Zero Data Retention** — Optional ZDR for privacy-sensitive requests
6. **Cost Controls** — Per-venture budgets with alerts and hard limits
7. **Rate Limiting** — Prevent abuse, ensure fair usage across ventures

### Model Tiers

| Tier | Models | Use Case | Cost |
|------|--------|----------|------|
| **Economy** | DeepSeek-V3, GPT-4o-mini, Gemini Flash 2.0 | High-volume, simple tasks | $0.10-0.50/M tokens |
| **Standard** | Claude Sonnet, GPT-4o, Gemini Pro | General purpose, quality balance | $2-5/M tokens |
| **Premium** | Claude Opus, GPT-4.5, Gemini Ultra | Complex reasoning, critical tasks | $10-30/M tokens |
| **Reasoning** | o3, o3-mini, Claude Opus:thinking | Multi-step logic, planning | $15-50/M tokens |
| **Specialized** | Code Llama, Mistral, Vision models | Domain-specific tasks | Varies |

### API Preview

```typescript
import { gateway } from '@mcv/intelligence';

// Simple chat completion
const response = await gateway.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  model: 'auto', // Routes to optimal model
  tier: 'standard',
});

// With streaming
const stream = await gateway.streamChat({
  messages: [...],
  onToken: (token) => console.log(token),
  onComplete: (response) => handleComplete(response),
});

// With failover chain
const response = await gateway.chat({
  messages: [...],
  models: ['claude-opus', 'gpt-4o', 'gemini-pro'], // Try in order
  failoverOnError: true,
});
```

### Database Tables

- `llm_requests` — Every LLM request with tokens, cost, latency
- `model_configs` — Per-venture model preferences and routing rules
- `cost_budgets` — Budget limits and current usage
- `provider_health` — Real-time provider status for failover decisions

---

## Module: context

### Purpose

The context module handles the assembly of complete prompts from multiple sources. It manages token budgets, prioritizes context sources, injects real-time data (user profile, venture settings, recent activity), and ensures prompts stay within model limits.

### Key Features

1. **Token Management** — Automatic truncation to fit model limits
2. **Priority Assembly** — System → RAG → User → History ordering
3. **Real-time Injection** — Current time, user data, venture context
4. **Template System** — Reusable prompt templates with variables
5. **Context Compression** — Summarize old context to save tokens

### Context Sources (Priority Order)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. SYSTEM PROMPT (Highest Priority - Never Truncated)                    │
│    - Model instructions, safety guidelines, persona definition           │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. REAL-TIME DATA (Dynamic Injection)                                    │
│    - Current timestamp, user timezone                                    │
│    - User profile, preferences, permissions                              │
│    - Venture settings, branding, allowed operations                      │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. RAG CONTEXT (Retrieved Knowledge)                                     │
│    - Relevant documents from vector search                               │
│    - Knowledge graph entities and relationships                          │
│    - Recent conversation summaries                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. CONVERSATION HISTORY (Compressed if Needed)                           │
│    - Recent messages (kept in full)                                      │
│    - Older messages (summarized)                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ 5. USER MESSAGE (Current Input - Never Truncated)                        │
│    - The actual user query/instruction                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### API Preview

```typescript
import { context } from '@mcv/intelligence';

// Assemble full context for a chat
const assembled = await context.assemble({
  systemPrompt: 'You are a helpful assistant for {{venture.name}}',
  userMessage: 'What are my recent orders?',
  userId: 'user_abc123',
  ventureId: 'venture_xyz',
  maxTokens: 8192,
  sources: ['profile', 'rag', 'history'],
});

// Count tokens
const tokenCount = context.tokenize(text, 'cl100k_base');

// Template rendering
const prompt = context.render(template, {
  venture: { name: 'BetEdge' },
  user: { name: 'John' },
});
```

---

## Module: embedding

### Purpose

The embedding module converts text into vector representations for semantic search. It handles chunking strategies, embedding generation via multiple providers, similarity calculations, and integration with vector databases.

### Key Features

1. **Multi-Provider Support** — OpenAI, Cohere, Voyage, local models
2. **Smart Chunking** — Sentence, paragraph, semantic, and sliding window
3. **Batch Processing** — Efficient embedding of large document sets
4. **Similarity Search** — Cosine, dot product, Euclidean distance
5. **Hybrid Search** — Combine vector + keyword for best results

### Embedding Models

| Model | Dimensions | Use Case | Cost |
|-------|------------|----------|------|
| `text-embedding-3-small` | 1536 | General purpose, cost-effective | $0.02/M tokens |
| `text-embedding-3-large` | 3072 | High accuracy, complex semantics | $0.13/M tokens |
| `voyage-3` | 1024 | Code and technical content | $0.06/M tokens |
| `cohere-embed-v3` | 1024 | Multilingual support | $0.10/M tokens |

### API Preview

```typescript
import { embedding } from '@mcv/intelligence';

// Generate embeddings
const vectors = await embedding.embed([
  'The quick brown fox jumps over the lazy dog',
  'Machine learning is transforming industries',
]);

// Smart chunking
const chunks = embedding.chunk(longDocument, {
  strategy: 'semantic',
  maxTokens: 512,
  overlap: 50,
});

// Similarity search
const similar = await embedding.search({
  query: 'How do I reset my password?',
  collection: 'help_articles',
  topK: 5,
  threshold: 0.7,
});
```

---

## Module: streaming

### Purpose

The streaming module provides real-time LLM response delivery via Server-Sent Events (SSE) and WebSockets. It enables sub-second first-token latency, partial response rendering, and graceful error handling during streams.

### Key Features

1. **SSE Support** — Standard Server-Sent Events for HTTP clients
2. **WebSocket Support** — Bidirectional streaming for interactive apps
3. **Token-by-Token** — Render responses as they arrive
4. **Backpressure Handling** — Pause/resume for slow clients
5. **Error Recovery** — Graceful handling of mid-stream failures

### API Preview

```typescript
import { streaming } from '@mcv/intelligence';

// SSE streaming
const eventSource = streaming.createSSE({
  url: '/api/chat/stream',
  onToken: (token) => appendToUI(token),
  onComplete: (response) => finalize(response),
  onError: (error) => handleError(error),
});

// WebSocket streaming
const ws = streaming.createWebSocket({
  url: 'wss://api.mcv.one/chat',
  onMessage: (msg) => handleMessage(msg),
});

// Server-side stream generation
const stream = streaming.generate({
  messages: [...],
  format: 'sse', // or 'websocket'
});
```

---

## Module: metrics

### Purpose

The metrics module tracks all AI usage across the platform. It provides cost attribution per venture, latency monitoring, model performance analytics, and usage dashboards.

### Key Features

1. **Cost Attribution** — Track spend per venture, user, feature
2. **Latency Tracking** — Time-to-first-token, total response time
3. **Model Analytics** — Success rates, error patterns, quality scores
4. **Budget Monitoring** — Real-time budget consumption alerts
5. **Usage Dashboards** — Executive views of AI operations

### Tracked Metrics

| Metric | Description | Granularity |
|--------|-------------|-------------|
| `tokens_input` | Input tokens consumed | Per request |
| `tokens_output` | Output tokens generated | Per request |
| `cost_usd` | USD cost of request | Per request |
| `latency_ttft_ms` | Time to first token | Per request |
| `latency_total_ms` | Total response time | Per request |
| `cache_hit` | Whether prompt cache hit | Per request |
| `model_used` | Actual model that responded | Per request |
| `success` | Whether request succeeded | Per request |

### API Preview

```typescript
import { metrics } from '@mcv/intelligence';

// Track a request
await metrics.track({
  requestId: 'req_123',
  ventureId: 'venture_xyz',
  model: 'claude-opus',
  tokensIn: 1500,
  tokensOut: 800,
  costUsd: 0.045,
  latencyMs: 2340,
});

// Get venture costs
const costs = await metrics.getCosts({
  ventureId: 'venture_xyz',
  period: 'month',
});

// Usage dashboard data
const dashboard = await metrics.dashboard({
  ventureId: 'venture_xyz',
  dateRange: { start: '2026-01-01', end: '2026-01-31' },
});
```

---

## Module: rag

### Purpose

The RAG (Retrieval-Augmented Generation) module provides grounded AI responses by retrieving relevant context from document stores before generating. It integrates with Google File Search API for managed RAG and supports custom vector stores.

### Key Features

1. **Google File Search** — Managed RAG with $0 query costs
2. **Custom Vector Stores** — Pinecone, Qdrant, Weaviate support
3. **Multi-Store Routing** — Query multiple stores, merge results
4. **Document Processing** — PDF, DOCX, HTML, Markdown ingestion
5. **Venture Isolation** — Strict data separation per venture

### Store Types

| Store | Purpose | Capacity |
|-------|---------|----------|
| **Venture Knowledge** | Per-venture documents | 2GB per venture |
| **Ecosystem Shared** | Cross-venture reference docs | 10GB |
| **NAOS Instruments** | Agent prompt library | 1GB |
| **Compliance** | Legal and governance docs | 5GB |

### API Preview

```typescript
import { rag } from '@mcv/intelligence';

// Query with RAG
const response = await rag.query({
  question: 'What is the refund policy?',
  stores: ['venture_knowledge', 'compliance'],
  topK: 5,
  generateResponse: true,
});

// Index a document
await rag.indexDocument({
  content: pdfBuffer,
  filename: 'refund-policy.pdf',
  store: 'venture_knowledge',
  metadata: { category: 'policies' },
});
```

---

## Module: knowledge

### Purpose

The knowledge module provides a Neo4j-powered knowledge graph for complex reasoning. It stores entities, relationships, and facts that AI can query for grounded responses.

### Key Features

1. **Entity Extraction** — Auto-extract entities from text
2. **Relationship Mapping** — Connect entities with typed edges
3. **Graph Queries** — Cypher queries for complex lookups
4. **Fact Verification** — Check claims against known facts
5. **Temporal Knowledge** — Track when facts were true

### Entity Types

- `Person` — Users, contacts, team members
- `Organization` — Companies, ventures, departments
- `Product` — Items, services, SKUs
- `Event` — Transactions, meetings, milestones
- `Location` — Addresses, regions, venues
- `Concept` — Categories, tags, topics

### API Preview

```typescript
import { knowledge } from '@mcv/intelligence';

// Add an entity
await knowledge.addEntity({
  type: 'Person',
  name: 'John Smith',
  properties: { email: 'john@example.com', role: 'Customer' },
});

// Create relationship
await knowledge.addRelation({
  from: { type: 'Person', id: 'john_123' },
  relation: 'PURCHASED',
  to: { type: 'Product', id: 'prod_456' },
  properties: { date: '2026-01-15', amount: 299.99 },
});

// Query relationships
const purchases = await knowledge.findRelations({
  from: { type: 'Person', id: 'john_123' },
  relation: 'PURCHASED',
  depth: 2, // Include related products
});
```

---

## Module: personas

### Purpose

The personas module defines AI personality and voice for each venture. It ensures consistent brand experience across all AI interactions.

### Key Features

1. **Personality Profiles** — Tone, style, vocabulary per venture
2. **Voice Guidelines** — What to say, what to avoid
3. **Dynamic Loading** — Switch personas per conversation
4. **A/B Testing** — Test persona variations
5. **Fine-tuning Configs** — Custom model training parameters

### Persona Components

| Component | Description | Example |
|-----------|-------------|---------|
| **Tone** | Overall communication style | Professional, Friendly, Casual |
| **Voice** | Specific word choices | "We're thrilled" vs "We are pleased" |
| **Boundaries** | What AI should never say | Competitor mentions, legal advice |
| **Knowledge** | Venture-specific facts | Founding date, mission statement |
| **Personality** | Character traits | Helpful, Witty, Empathetic |

### API Preview

```typescript
import { personas } from '@mcv/intelligence';

// Load venture persona
const persona = await personas.load('venture_betedge');

// Apply to prompt
const enhancedPrompt = personas.apply(persona, {
  systemPrompt: baseSystemPrompt,
  userMessage: 'Tell me about your predictions',
});

// Get voice guidelines
const voice = personas.getVoice('venture_betedge');
// { tone: 'confident', avoid: ['guaranteed', 'certain'], ... }
```

---

## Module: memory

### Purpose

The memory module provides long-term context retention for AI conversations. It stores conversation summaries, user preferences, and facts learned over time.

### Key Features

1. **Conversation History** — Full message logs per user
2. **Automatic Summaries** — Compress old conversations
3. **Fact Extraction** — Remember key details mentioned
4. **User Preferences** — Learn communication preferences
5. **Cross-Session Context** — Continue conversations seamlessly

### Memory Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WORKING MEMORY (Current Session)                                        │
│ - Last N messages in full                                               │
│ - Current conversation state                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ SHORT-TERM MEMORY (Recent Sessions - 7 days)                            │
│ - Compressed summaries of recent conversations                          │
│ - Key decisions and action items                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ LONG-TERM MEMORY (Persistent)                                           │
│ - User preferences and facts                                            │
│ - Important events and milestones                                       │
│ - Learned patterns and behaviors                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Preview

```typescript
import { memory } from '@mcv/intelligence';

// Remember a fact
await memory.remember({
  userId: 'user_abc',
  fact: 'Prefers email communication over phone',
  source: 'conversation_123',
  confidence: 0.95,
});

// Recall relevant memories
const memories = await memory.recall({
  userId: 'user_abc',
  query: 'How should I contact this user?',
  types: ['preference', 'fact'],
  limit: 5,
});

// Summarize a conversation
const summary = await memory.summarize({
  conversationId: 'conv_xyz',
  style: 'bullet_points',
});
```

---

## Module: ml

### Purpose

The ml module provides machine learning predictions for business intelligence. It includes churn prediction, product recommendations, anomaly detection, lead scoring, and custom model deployment.

### Key Features

1. **Churn Prediction** — Identify at-risk customers
2. **Recommendations** — Product, content, next-action suggestions
3. **Anomaly Detection** — Fraud, unusual patterns
4. **Lead Scoring** — Prioritize sales opportunities
5. **Custom Models** — Deploy venture-specific ML models

### Pre-Built Models

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| `churn_predictor` | User activity data | Churn probability (0-1) | Retention campaigns |
| `product_recommender` | Purchase history | Ranked product list | Upsell/cross-sell |
| `anomaly_detector` | Transaction data | Anomaly score | Fraud prevention |
| `lead_scorer` | Lead attributes | Score (0-100) | Sales prioritization |
| `sentiment_analyzer` | Text | Sentiment score | Feedback analysis |

### API Preview

```typescript
import { ml } from '@mcv/intelligence';

// Predict churn
const churnRisk = await ml.predict('churn_predictor', {
  userId: 'user_abc',
  features: {
    daysSinceLastPurchase: 45,
    supportTicketsLast30Days: 3,
    loginFrequency: 2,
  },
});
// { probability: 0.72, risk: 'high', factors: [...] }

// Get recommendations
const recs = await ml.recommend({
  userId: 'user_abc',
  context: 'post_purchase',
  limit: 5,
});

// Detect anomalies
const anomalies = await ml.detectAnomalies({
  ventureId: 'venture_xyz',
  dataType: 'transactions',
  window: '24h',
});
```

---

## Module: embed

### Purpose

The embed module provides embeddable AI widgets for any website. Drop in a chat widget, semantic search, or voice interface with minimal code.

### Key Features

1. **Chat Widget** — Full conversational AI interface
2. **Search Widget** — Semantic search over venture content
3. **Voice Widget** — Voice-activated AI assistant
4. **Customization** — Match venture branding
5. **Analytics** — Track widget usage and effectiveness

### Widget Types

| Widget | Description | Integration |
|--------|-------------|-------------|
| **Chat** | Floating chat bubble or inline chat | `<script>` or React component |
| **Search** | Search bar with AI-powered results | `<script>` or React component |
| **Voice** | Voice input/output interface | `<script>` or React component |
| **Command** | Command palette (Cmd+K style) | `<script>` or React component |

### API Preview

```typescript
// Script tag integration
<script src="https://cdn.mcv.one/embed.js"></script>
<script>
  MCVEmbed.init({
    ventureId: 'venture_xyz',
    widget: 'chat',
    position: 'bottom-right',
    theme: {
      primaryColor: '#6366f1',
      borderRadius: '12px',
    },
  });
</script>

// React integration
import { ChatWidget } from '@mcv/intelligence/embed';

function App() {
  return (
    <ChatWidget
      ventureId="venture_xyz"
      position="bottom-right"
      welcomeMessage="Hi! How can I help?"
    />
  );
}
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | ^1.0.0 | Database, config, logging, errors |
| `@mcv/nexus` | ^1.0.0 | Agent orchestration |
| `@mcv/api` | ^1.0.0 | API routes and validation |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | ^4.x | OpenAI API client (also works for OpenRouter) |
| `@anthropic-ai/sdk` | ^0.x | Anthropic client for direct Claude access |
| `@google/generative-ai` | ^0.x | Google GenAI client |
| `neo4j-driver` | ^5.x | Neo4j graph database |
| `@pinecone-database/pinecone` | ^2.x | Pinecone vector database |
| `tiktoken` | ^1.x | Token counting |
| `eventsource-parser` | ^1.x | SSE parsing |
| `ws` | ^8.x | WebSocket support |
| `ml-matrix` | ^6.x | Matrix operations for ML |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.x | TypeScript |
| `react` | ^18.x | React (for embed widgets) |

---

## Package Exports

```typescript
// @mcv/intelligence/index.ts

// Core Layer - Always available
export { gateway } from './gateway';
export { context } from './context';
export { embedding } from './embedding';
export { streaming } from './streaming';
export { metrics } from './metrics';

// Extension Layer - Lazy loaded
export { rag } from './rag';
export { knowledge } from './knowledge';
export { personas } from './personas';
export { memory } from './memory';
export { ml } from './ml';

// Plugin Layer - External facing
export { ChatWidget, SearchWidget, VoiceWidget } from './embed';

// Types
export * from './types';

// Utilities
export { tokenize, countTokens } from './utils/tokens';
export { chunk, splitText } from './utils/chunking';
```

---

## Configuration

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxx          # OpenRouter API key
DATABASE_URL=postgresql://...             # Supabase connection

# Optional - External Services
NEO4J_URI=bolt://localhost:7687          # Neo4j connection
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
PINECONE_API_KEY=xxx                      # Pinecone API key
PINECONE_ENVIRONMENT=us-east-1
GOOGLE_GENAI_API_KEY=xxx                  # Google GenAI for File Search

# Optional - Defaults
DEFAULT_MODEL=claude-sonnet               # Default chat model
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
MAX_CONTEXT_TOKENS=128000                 # Maximum context window
CACHE_TTL_SECONDS=3600                    # Prompt cache TTL
```

---

## Security Considerations

1. **API Key Protection** — All external API keys stored encrypted in vault
2. **Venture Isolation** — RAG stores and knowledge graphs strictly isolated
3. **PII Handling** — Personal data masked before sending to external LLMs
4. **Rate Limiting** — Per-venture, per-user limits prevent abuse
5. **Audit Logging** — All AI requests logged for compliance
6. **ZDR Support** — Zero Data Retention flag for sensitive requests

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-first-token | < 500ms | P95 latency |
| Embedding generation | < 100ms | Per batch of 10 texts |
| RAG query latency | < 200ms | End-to-end retrieval |
| Vector similarity search | < 50ms | Top-K=10 query |
| Knowledge graph query | < 100ms | 2-hop traversal |

---

## Related Documentation

- [gateway Module](./gateway/MODULE.md)
- [context Module](./context/MODULE.md)
- [embedding Module](./embedding/MODULE.md)
- [streaming Module](./streaming/MODULE.md)
- [metrics Module](./metrics/MODULE.md)
- [rag Module](./rag/MODULE.md)
- [knowledge Module](./knowledge/MODULE.md)
- [personas Module](./personas/MODULE.md)
- [memory Module](./memory/MODULE.md)
- [ml Module](./ml/MODULE.md)
- [embed Module](./embed/MODULE.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)

---

*@mcv/intelligence — The Brain of MCV.ONE*
