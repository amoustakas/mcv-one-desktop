# @mcv/intelligence — API Reference
## Complete Schema, Routes & Type Definitions

**Package:** `@mcv/intelligence`  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [TypeScript Types](#typescript-types)
2. [Zod Schemas](#zod-schemas)
3. [tRPC Routes](#trpc-routes)
4. [REST Endpoints](#rest-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Database Types](#database-types)

---

## TypeScript Types

### Core Types

```typescript
// @mcv/intelligence/types/core.ts

import { UUID, VentureID, UserID, ISOTimestamp } from '@mcv/kernel/types';

// ============================================================================
// MODEL & PROVIDER TYPES
// ============================================================================

export type ModelTier = 'economy' | 'standard' | 'premium' | 'reasoning' | 'specialized';

export type ModelProvider = 
  | 'openrouter'
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'cohere'
  | 'mistral'
  | 'meta'
  | 'deepseek';

export type ModelCapability = 
  | 'chat'
  | 'completion'
  | 'vision'
  | 'function_calling'
  | 'json_mode'
  | 'streaming'
  | 'caching';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  tier: ModelTier;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  cacheCostPer1M?: number;
  supportsZDR: boolean;
  deprecated?: boolean;
}

export interface ProviderHealth {
  provider: ModelProvider;
  model: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyP50Ms: number;
  latencyP99Ms: number;
  errorRatePercent: number;
  lastCheckedAt: ISOTimestamp;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

export type MessageContent = string | (TextContent | ImageContent)[];

export interface Message {
  role: MessageRole;
  content: MessageContent;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ChatRequest {
  // Messages
  messages: Message[];
  
  // Model selection
  model?: string;
  models?: string[];
  tier?: ModelTier;
  
  // Generation parameters
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
  
  // Features
  stream?: boolean;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  responseFormat?: { type: 'text' | 'json_object' };
  
  // MCV-specific
  ventureId?: VentureID;
  userId?: UserID;
  conversationId?: UUID;
  personaId?: UUID;
  
  // Options
  cacheEnabled?: boolean;
  zdrEnabled?: boolean;
  failoverEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  modelUsed: string;
  provider: ModelProvider;
  
  choices: Array<{
    index: number;
    message: Message;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;
  };
  
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: 'USD';
  };
  
  latency: {
    ttftMs: number;
    totalMs: number;
  };
  
  cacheHit: boolean;
  failoverUsed: boolean;
  failoverChain?: string[];
}

export interface StreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  
  choices: Array<{
    index: number;
    delta: Partial<Message>;
    finishReason: 'stop' | 'length' | 'tool_calls' | null;
  }>;
}

// ============================================================================
// EMBEDDING TYPES
// ============================================================================

export type EmbeddingModel = 
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'voyage-3'
  | 'cohere-embed-v3';

export interface EmbeddingRequest {
  input: string | string[];
  model?: EmbeddingModel;
  dimensions?: number;
  encodingFormat?: 'float' | 'base64';
}

export interface EmbeddingResponse {
  object: 'list';
  model: EmbeddingModel;
  data: Array<{
    object: 'embedding';
    index: number;
    embedding: number[];
  }>;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export type ChunkingStrategy = 
  | 'sentence'
  | 'paragraph'
  | 'semantic'
  | 'sliding_window'
  | 'recursive';

export interface ChunkOptions {
  strategy: ChunkingStrategy;
  maxTokens: number;
  overlap?: number;
  separators?: string[];
}

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
  metadata?: {
    startChar: number;
    endChar: number;
    headings?: string[];
  };
}

// ============================================================================
// RAG TYPES
// ============================================================================

export type RAGStoreType = 'venture' | 'shared' | 'compliance' | 'training';

export type RAGProvider = 'google_file_search' | 'pinecone' | 'qdrant' | 'weaviate';

export interface RAGStore {
  id: UUID;
  ventureId: VentureID | null;
  name: string;
  slug: string;
  storeType: RAGStoreType;
  provider: RAGProvider;
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  status: 'active' | 'indexing' | 'error';
}

export interface RAGDocument {
  id: UUID;
  storeId: UUID;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  chunkCount?: number;
  tokenCount?: number;
  errorMessage?: string;
  indexedAt?: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

export interface RAGQueryRequest {
  query: string;
  stores?: string[];
  topK?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
  generateResponse?: boolean;
  model?: string;
  systemPrompt?: string;
}

export interface RAGQueryResult {
  documents: Array<{
    id: UUID;
    storeId: UUID;
    filename: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  response?: {
    content: string;
    model: string;
    citations: Array<{
      documentId: UUID;
      filename: string;
      excerpt: string;
    }>;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ============================================================================
// KNOWLEDGE GRAPH TYPES
// ============================================================================

export type EntityType = 
  | 'Person'
  | 'Organization'
  | 'Product'
  | 'Event'
  | 'Location'
  | 'Concept'
  | 'Document';

export type RelationType = 
  | 'WORKS_FOR'
  | 'PURCHASED'
  | 'CREATED'
  | 'LOCATED_IN'
  | 'RELATED_TO'
  | 'PART_OF'
  | 'KNOWS'
  | 'MENTIONED_IN';

export interface Entity {
  id: UUID;
  type: EntityType;
  name: string;
  properties: Record<string, unknown>;
  embedding?: number[];
  ventureId: VentureID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Relation {
  id: UUID;
  fromEntity: { id: UUID; type: EntityType };
  toEntity: { id: UUID; type: EntityType };
  type: RelationType;
  properties: Record<string, unknown>;
  confidence: number;
  validFrom?: ISOTimestamp;
  validUntil?: ISOTimestamp;
}

export interface GraphQueryRequest {
  query: string;
  entityTypes?: EntityType[];
  relationTypes?: RelationType[];
  depth?: number;
  limit?: number;
}

export interface GraphQueryResult {
  entities: Entity[];
  relations: Relation[];
  paths?: Array<{
    nodes: Entity[];
    edges: Relation[];
  }>;
}

// ============================================================================
// PERSONA TYPES
// ============================================================================

export type ToneType = 
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'formal'
  | 'technical'
  | 'empathetic';

export interface PersonaPersonality {
  tone: ToneType;
  traits: string[];
  vocabulary: {
    greeting?: string;
    farewell?: string;
    affirmative?: string;
    negative?: string;
    thinking?: string;
  };
  avoid: string[];
  knowledge: Record<string, string>;
}

export interface Persona {
  id: UUID;
  ventureId: VentureID;
  name: string;
  slug: string;
  description?: string;
  systemPrompt: string;
  personality: PersonaPersonality;
  voiceId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
  };
  isDefault: boolean;
  status: 'active' | 'draft' | 'archived';
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryType = 'fact' | 'preference' | 'event' | 'summary' | 'instruction';

export type MemorySource = 'conversation' | 'explicit' | 'inferred' | 'system';

export interface Memory {
  id: UUID;
  ventureId: VentureID;
  userId: UserID;
  memoryType: MemoryType;
  content: string;
  sourceType: MemorySource;
  sourceId?: UUID;
  confidence: number;
  validFrom: ISOTimestamp;
  validUntil?: ISOTimestamp;
  status: 'active' | 'superseded' | 'deleted';
  accessCount: number;
  lastAccessedAt?: ISOTimestamp;
}

export interface MemoryRecallRequest {
  userId: UserID;
  query?: string;
  types?: MemoryType[];
  limit?: number;
  minConfidence?: number;
  includeExpired?: boolean;
}

export interface ConversationSummary {
  id: UUID;
  conversationId: UUID;
  content: string;
  keyPoints: string[];
  entities: Array<{ type: EntityType; name: string }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  createdAt: ISOTimestamp;
}

// ============================================================================
// ML TYPES
// ============================================================================

export type MLModelType = 
  | 'churn_predictor'
  | 'product_recommender'
  | 'anomaly_detector'
  | 'lead_scorer'
  | 'sentiment_analyzer'
  | 'content_classifier';

export interface MLModel {
  id: UUID;
  ventureId: VentureID | null;
  name: string;
  slug: string;
  version: string;
  modelType: MLModelType;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  metrics: {
    accuracy?: number;
    f1Score?: number;
    aucRoc?: number;
    trainingDate?: ISOTimestamp;
    trainingSamples?: number;
  };
  status: 'active' | 'deprecated' | 'training';
}

export interface PredictionRequest {
  modelSlug: string;
  entityType: string;
  entityId: UUID;
  features: Record<string, unknown>;
}

export interface PredictionResponse {
  modelId: UUID;
  modelVersion: string;
  prediction: Record<string, unknown>;
  confidence: number;
  factors?: Array<{
    feature: string;
    importance: number;
    direction: 'positive' | 'negative';
  }>;
  createdAt: ISOTimestamp;
}

export interface RecommendationRequest {
  userId: UserID;
  context?: string;
  limit?: number;
  excludeIds?: UUID[];
  filters?: Record<string, unknown>;
}

export interface Recommendation {
  itemId: UUID;
  itemType: string;
  score: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AnomalyDetectionRequest {
  ventureId: VentureID;
  dataType: 'transactions' | 'logins' | 'usage' | 'custom';
  window: string;
  threshold?: number;
}

export interface Anomaly {
  id: UUID;
  entityType: string;
  entityId: UUID;
  anomalyType: string;
  score: number;
  description: string;
  detectedAt: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EMBED WIDGET TYPES
// ============================================================================

export type WidgetType = 'chat' | 'search' | 'voice' | 'command';

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline';

export interface WidgetTheme {
  primaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface WidgetConfig {
  ventureId: VentureID;
  widgetType: WidgetType;
  position?: WidgetPosition;
  theme?: WidgetTheme;
  
  // Chat-specific
  welcomeMessage?: string;
  placeholder?: string;
  suggestedQuestions?: string[];
  
  // Search-specific
  searchPlaceholder?: string;
  resultsPerPage?: number;
  
  // Voice-specific
  voiceEnabled?: boolean;
  autoListen?: boolean;
  
  // Common
  personaId?: UUID;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface UsageMetrics {
  ventureId: VentureID;
  period: 'hour' | 'day' | 'week' | 'month';
  
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  
  tokens: {
    input: number;
    output: number;
    cached: number;
  };
  
  cost: {
    total: number;
    byModel: Record<string, number>;
    currency: 'USD';
  };
  
  latency: {
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  
  models: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export interface CostBudget {
  ventureId: VentureID;
  dailyLimitUsd?: number;
  weeklyLimitUsd?: number;
  monthlyLimitUsd?: number;
  dailyUsedUsd: number;
  weeklyUsedUsd: number;
  monthlyUsedUsd: number;
  alertAtPercent: number;
  hardLimitEnabled: boolean;
}
```

---

## Zod Schemas

```typescript
// @mcv/intelligence/schemas/index.ts

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid();
export const modelTierSchema = z.enum(['economy', 'standard', 'premium', 'reasoning', 'specialized']);
export const messageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const textContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const imageContentSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string().url(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
});

export const messageContentSchema = z.union([
  z.string(),
  z.array(z.union([textContentSchema, imageContentSchema])),
]);

export const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export const messageSchema = z.object({
  role: messageRoleSchema,
  content: messageContentSchema,
  name: z.string().optional(),
  tool_calls: z.array(toolCallSchema).optional(),
  tool_call_id: z.string().optional(),
});

export const toolDefinitionSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown()),
    strict: z.boolean().optional(),
  }),
});

// ============================================================================
// CHAT SCHEMAS
// ============================================================================

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.string().optional(),
  models: z.array(z.string()).optional(),
  tier: modelTierSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).max(200000).optional(),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  tools: z.array(toolDefinitionSchema).optional(),
  toolChoice: z.union([
    z.enum(['auto', 'none', 'required']),
    z.object({
      type: z.literal('function'),
      function: z.object({ name: z.string() }),
    }),
  ]).optional(),
  responseFormat: z.object({
    type: z.enum(['text', 'json_object']),
  }).optional(),
  ventureId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  conversationId: uuidSchema.optional(),
  personaId: uuidSchema.optional(),
  cacheEnabled: z.boolean().optional(),
  zdrEnabled: z.boolean().optional(),
  failoverEnabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const chatResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: z.string(),
  modelUsed: z.string(),
  provider: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: messageSchema,
    finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']),
  })),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
    cachedTokens: z.number().optional(),
  }),
  cost: z.object({
    inputCost: z.number(),
    outputCost: z.number(),
    totalCost: z.number(),
    currency: z.literal('USD'),
  }),
  latency: z.object({
    ttftMs: z.number(),
    totalMs: z.number(),
  }),
  cacheHit: z.boolean(),
  failoverUsed: z.boolean(),
  failoverChain: z.array(z.string()).optional(),
});

// ============================================================================
// EMBEDDING SCHEMAS
// ============================================================================

export const embeddingModelSchema = z.enum([
  'text-embedding-3-small',
  'text-embedding-3-large',
  'voyage-3',
  'cohere-embed-v3',
]);

export const embeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: embeddingModelSchema.optional(),
  dimensions: z.number().min(256).max(3072).optional(),
  encodingFormat: z.enum(['float', 'base64']).optional(),
});

export const embeddingResponseSchema = z.object({
  object: z.literal('list'),
  model: embeddingModelSchema,
  data: z.array(z.object({
    object: z.literal('embedding'),
    index: z.number(),
    embedding: z.array(z.number()),
  })),
  usage: z.object({
    promptTokens: z.number(),
    totalTokens: z.number(),
  }),
});

// ============================================================================
// RAG SCHEMAS
// ============================================================================

export const ragStoreTypeSchema = z.enum(['venture', 'shared', 'compliance', 'training']);

export const ragQueryRequestSchema = z.object({
  query: z.string().min(1).max(10000),
  stores: z.array(z.string()).optional(),
  topK: z.number().min(1).max(100).optional().default(5),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  filters: z.record(z.unknown()).optional(),
  generateResponse: z.boolean().optional().default(false),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export const ragIndexDocumentSchema = z.object({
  store: z.string(),
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// KNOWLEDGE GRAPH SCHEMAS
// ============================================================================

export const entityTypeSchema = z.enum([
  'Person', 'Organization', 'Product', 'Event', 'Location', 'Concept', 'Document',
]);

export const relationTypeSchema = z.enum([
  'WORKS_FOR', 'PURCHASED', 'CREATED', 'LOCATED_IN', 
  'RELATED_TO', 'PART_OF', 'KNOWS', 'MENTIONED_IN',
]);

export const addEntitySchema = z.object({
  type: entityTypeSchema,
  name: z.string().min(1).max(500),
  properties: z.record(z.unknown()).optional(),
});

export const addRelationSchema = z.object({
  from: z.object({
    type: entityTypeSchema,
    id: uuidSchema,
  }),
  relation: relationTypeSchema,
  to: z.object({
    type: entityTypeSchema,
    id: uuidSchema,
  }),
  properties: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional().default(1),
});

export const graphQuerySchema = z.object({
  query: z.string().min(1),
  entityTypes: z.array(entityTypeSchema).optional(),
  relationTypes: z.array(relationTypeSchema).optional(),
  depth: z.number().min(1).max(5).optional().default(2),
  limit: z.number().min(1).max(1000).optional().default(100),
});

// ============================================================================
// PERSONA SCHEMAS
// ============================================================================

export const toneTypeSchema = z.enum([
  'professional', 'friendly', 'casual', 'formal', 'technical', 'empathetic',
]);

export const personaPersonalitySchema = z.object({
  tone: toneTypeSchema,
  traits: z.array(z.string()),
  vocabulary: z.object({
    greeting: z.string().optional(),
    farewell: z.string().optional(),
    affirmative: z.string().optional(),
    negative: z.string().optional(),
    thinking: z.string().optional(),
  }).optional(),
  avoid: z.array(z.string()).optional(),
  knowledge: z.record(z.string()).optional(),
});

export const createPersonaSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).max(50000),
  personality: personaPersonalitySchema,
  voiceId: z.string().optional(),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarityBoost: z.number().min(0).max(1),
    style: z.number().min(0).max(1).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

// ============================================================================
// MEMORY SCHEMAS
// ============================================================================

export const memoryTypeSchema = z.enum(['fact', 'preference', 'event', 'summary', 'instruction']);
export const memorySourceSchema = z.enum(['conversation', 'explicit', 'inferred', 'system']);

export const rememberSchema = z.object({
  userId: uuidSchema,
  memoryType: memoryTypeSchema,
  content: z.string().min(1).max(10000),
  sourceType: memorySourceSchema.optional(),
  sourceId: uuidSchema.optional(),
  confidence: z.number().min(0).max(1).optional().default(1),
  validUntil: z.string().datetime().optional(),
});

export const recallSchema = z.object({
  userId: uuidSchema,
  query: z.string().optional(),
  types: z.array(memoryTypeSchema).optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  minConfidence: z.number().min(0).max(1).optional(),
  includeExpired: z.boolean().optional().default(false),
});

// ============================================================================
// ML SCHEMAS
// ============================================================================

export const mlModelTypeSchema = z.enum([
  'churn_predictor', 'product_recommender', 'anomaly_detector',
  'lead_scorer', 'sentiment_analyzer', 'content_classifier',
]);

export const predictSchema = z.object({
  modelSlug: z.string(),
  entityType: z.string(),
  entityId: uuidSchema,
  features: z.record(z.unknown()),
});

export const recommendSchema = z.object({
  userId: uuidSchema,
  context: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  excludeIds: z.array(uuidSchema).optional(),
  filters: z.record(z.unknown()).optional(),
});

export const detectAnomaliesSchema = z.object({
  dataType: z.enum(['transactions', 'logins', 'usage', 'custom']),
  window: z.string().regex(/^\d+[hdwm]$/), // e.g., "24h", "7d", "1w", "1m"
  threshold: z.number().min(0).max(1).optional().default(0.9),
});

// ============================================================================
// EMBED WIDGET SCHEMAS
// ============================================================================

export const widgetTypeSchema = z.enum(['chat', 'search', 'voice', 'command']);
export const widgetPositionSchema = z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'inline']);

export const widgetThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional(),
});

export const widgetConfigSchema = z.object({
  ventureId: uuidSchema,
  widgetType: widgetTypeSchema,
  position: widgetPositionSchema.optional().default('bottom-right'),
  theme: widgetThemeSchema.optional(),
  welcomeMessage: z.string().optional(),
  placeholder: z.string().optional(),
  suggestedQuestions: z.array(z.string()).optional(),
  searchPlaceholder: z.string().optional(),
  resultsPerPage: z.number().optional(),
  voiceEnabled: z.boolean().optional(),
  autoListen: z.boolean().optional(),
  personaId: uuidSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// METRICS SCHEMAS
// ============================================================================

export const metricsQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['model', 'user', 'feature']).optional(),
});

export const budgetUpdateSchema = z.object({
  dailyLimitUsd: z.number().min(0).optional(),
  weeklyLimitUsd: z.number().min(0).optional(),
  monthlyLimitUsd: z.number().min(0).optional(),
  alertAtPercent: z.number().min(0).max(100).optional(),
  hardLimitEnabled: z.boolean().optional(),
});
```

---

## tRPC Routes

```typescript
// @mcv/intelligence/server/router.ts

import { router, publicProcedure, protectedProcedure, ventureProcedure } from '@mcv/api/trpc';
import { z } from 'zod';
import * as schemas from '../schemas';

// ============================================================================
// GATEWAY ROUTER
// ============================================================================

export const gatewayRouter = router({
  // Chat completion
  chat: ventureProcedure
    .input(schemas.chatRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.gateway.chat({
        ...input,
        ventureId: ctx.venture.id,
        userId: ctx.user?.id,
      });
    }),

  // Streaming chat (returns async iterator for tRPC subscription)
  chatStream: ventureProcedure
    .input(schemas.chatRequestSchema)
    .subscription(async function* ({ ctx, input }) {
      const stream = ctx.intelligence.gateway.streamChat({
        ...input,
        ventureId: ctx.venture.id,
        userId: ctx.user?.id,
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    }),

  // List available models
  listModels: ventureProcedure
    .input(z.object({
      tier: schemas.modelTierSchema.optional(),
      capability: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.gateway.listModels(input);
    }),

  // Get provider health
  getProviderHealth: ventureProcedure
    .query(async ({ ctx }) => {
      return ctx.intelligence.gateway.getProviderHealth();
    }),

  // Route model (for testing routing logic)
  routeModel: ventureProcedure
    .input(z.object({
      tier: schemas.modelTierSchema.optional(),
      taskType: z.string().optional(),
      preferredModels: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.gateway.routeModel(ctx.venture.id, input);
    }),
});

// ============================================================================
// CONTEXT ROUTER
// ============================================================================

export const contextRouter = router({
  // Assemble context for a chat
  assemble: ventureProcedure
    .input(z.object({
      systemPrompt: z.string().optional(),
      userMessage: z.string(),
      conversationId: schemas.uuidSchema.optional(),
      maxTokens: z.number().optional(),
      sources: z.array(z.enum(['profile', 'rag', 'history', 'memory'])).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.context.assemble({
        ...input,
        ventureId: ctx.venture.id,
        userId: ctx.user?.id,
      });
    }),

  // Count tokens
  tokenize: publicProcedure
    .input(z.object({
      text: z.string(),
      model: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.context.tokenize(input.text, input.model);
    }),

  // Render template
  renderTemplate: ventureProcedure
    .input(z.object({
      template: z.string(),
      variables: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.context.render(input.template, input.variables);
    }),
});

// ============================================================================
// EMBEDDING ROUTER
// ============================================================================

export const embeddingRouter = router({
  // Generate embeddings
  embed: ventureProcedure
    .input(schemas.embeddingRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.embedding.embed(input);
    }),

  // Chunk text
  chunk: publicProcedure
    .input(z.object({
      text: z.string(),
      options: z.object({
        strategy: z.enum(['sentence', 'paragraph', 'semantic', 'sliding_window', 'recursive']),
        maxTokens: z.number(),
        overlap: z.number().optional(),
        separators: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.embedding.chunk(input.text, input.options);
    }),

  // Similarity search
  search: ventureProcedure
    .input(z.object({
      query: z.string(),
      collection: z.string(),
      topK: z.number().optional(),
      threshold: z.number().optional(),
      filters: z.record(z.unknown()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.embedding.search({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),
});

// ============================================================================
// RAG ROUTER
// ============================================================================

export const ragRouter = router({
  // Query with RAG
  query: ventureProcedure
    .input(schemas.ragQueryRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.rag.query({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Index a document
  indexDocument: ventureProcedure
    .input(schemas.ragIndexDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.rag.indexDocument({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // List stores
  listStores: ventureProcedure
    .query(async ({ ctx }) => {
      return ctx.intelligence.rag.listStores(ctx.venture.id);
    }),

  // Get store details
  getStore: ventureProcedure
    .input(z.object({ storeId: schemas.uuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.rag.getStore(ctx.venture.id, input.storeId);
    }),

  // List documents in store
  listDocuments: ventureProcedure
    .input(z.object({
      storeId: schemas.uuidSchema,
      status: z.enum(['pending', 'processing', 'indexed', 'failed']).optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.rag.listDocuments(ctx.venture.id, input);
    }),

  // Delete document
  deleteDocument: ventureProcedure
    .input(z.object({ documentId: schemas.uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.rag.deleteDocument(ctx.venture.id, input.documentId);
    }),
});

// ============================================================================
// KNOWLEDGE ROUTER
// ============================================================================

export const knowledgeRouter = router({
  // Add entity
  addEntity: ventureProcedure
    .input(schemas.addEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.knowledge.addEntity({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Get entity
  getEntity: ventureProcedure
    .input(z.object({
      type: schemas.entityTypeSchema,
      id: schemas.uuidSchema,
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.knowledge.getEntity(ctx.venture.id, input);
    }),

  // Add relation
  addRelation: ventureProcedure
    .input(schemas.addRelationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.knowledge.addRelation({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Find relations
  findRelations: ventureProcedure
    .input(z.object({
      from: z.object({
        type: schemas.entityTypeSchema.optional(),
        id: schemas.uuidSchema.optional(),
      }).optional(),
      to: z.object({
        type: schemas.entityTypeSchema.optional(),
        id: schemas.uuidSchema.optional(),
      }).optional(),
      relation: schemas.relationTypeSchema.optional(),
      depth: z.number().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.knowledge.findRelations(ctx.venture.id, input);
    }),

  // Natural language query
  query: ventureProcedure
    .input(schemas.graphQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.knowledge.query({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),
});

// ============================================================================
// PERSONAS ROUTER
// ============================================================================

export const personasRouter = router({
  // Create persona
  create: ventureProcedure
    .input(schemas.createPersonaSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.personas.create({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Get persona
  get: ventureProcedure
    .input(z.object({ id: schemas.uuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.personas.get(ctx.venture.id, input.id);
    }),

  // List personas
  list: ventureProcedure
    .input(z.object({
      status: z.enum(['active', 'draft', 'archived']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.personas.list(ctx.venture.id, input);
    }),

  // Update persona
  update: ventureProcedure
    .input(z.object({
      id: schemas.uuidSchema,
      data: schemas.createPersonaSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.personas.update(ctx.venture.id, input.id, input.data);
    }),

  // Delete persona
  delete: ventureProcedure
    .input(z.object({ id: schemas.uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.personas.delete(ctx.venture.id, input.id);
    }),

  // Load persona (for context assembly)
  load: ventureProcedure
    .input(z.object({
      idOrSlug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.personas.load(ctx.venture.id, input.idOrSlug);
    }),

  // Apply persona to prompt
  apply: ventureProcedure
    .input(z.object({
      personaId: schemas.uuidSchema,
      systemPrompt: z.string(),
      userMessage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.personas.apply(ctx.venture.id, input);
    }),
});

// ============================================================================
// MEMORY ROUTER
// ============================================================================

export const memoryRouter = router({
  // Remember a fact
  remember: ventureProcedure
    .input(schemas.rememberSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.memory.remember({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Recall memories
  recall: ventureProcedure
    .input(schemas.recallSchema)
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.memory.recall({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Summarize conversation
  summarize: ventureProcedure
    .input(z.object({
      conversationId: schemas.uuidSchema,
      style: z.enum(['paragraph', 'bullet_points', 'key_facts']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.memory.summarize(ctx.venture.id, input);
    }),

  // Get conversation history
  getHistory: ventureProcedure
    .input(z.object({
      userId: schemas.uuidSchema,
      limit: z.number().optional(),
      before: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.memory.getHistory(ctx.venture.id, input);
    }),

  // Delete memory
  forget: ventureProcedure
    .input(z.object({ memoryId: schemas.uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.memory.forget(ctx.venture.id, input.memoryId);
    }),
});

// ============================================================================
// ML ROUTER
// ============================================================================

export const mlRouter = router({
  // Get prediction
  predict: ventureProcedure
    .input(schemas.predictSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.ml.predict({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Get recommendations
  recommend: ventureProcedure
    .input(schemas.recommendSchema)
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.ml.recommend({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Detect anomalies
  detectAnomalies: ventureProcedure
    .input(schemas.detectAnomaliesSchema)
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.ml.detectAnomalies({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // List available models
  listModels: ventureProcedure
    .input(z.object({
      type: schemas.mlModelTypeSchema.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.ml.listModels(ctx.venture.id, input);
    }),

  // Get model details
  getModel: ventureProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.ml.getModel(ctx.venture.id, input.slug);
    }),
});

// ============================================================================
// METRICS ROUTER
// ============================================================================

export const metricsRouter = router({
  // Get usage metrics
  getUsage: ventureProcedure
    .input(schemas.metricsQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.metrics.getUsage(ctx.venture.id, input);
    }),

  // Get cost breakdown
  getCosts: ventureProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month']).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.metrics.getCosts(ctx.venture.id, input);
    }),

  // Get budget status
  getBudget: ventureProcedure
    .query(async ({ ctx }) => {
      return ctx.intelligence.metrics.getBudget(ctx.venture.id);
    }),

  // Update budget
  updateBudget: ventureProcedure
    .input(schemas.budgetUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.metrics.updateBudget(ctx.venture.id, input);
    }),

  // Get dashboard data
  getDashboard: ventureProcedure
    .input(z.object({
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.metrics.getDashboard(ctx.venture.id, input);
    }),
});

// ============================================================================
// EMBED ROUTER
// ============================================================================

export const embedRouter = router({
  // Get widget config
  getConfig: publicProcedure
    .input(z.object({ ventureId: schemas.uuidSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.embed.getConfig(input.ventureId);
    }),

  // Update widget config
  updateConfig: ventureProcedure
    .input(schemas.widgetConfigSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.intelligence.embed.updateConfig({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  // Generate embed code
  getEmbedCode: ventureProcedure
    .input(z.object({
      widgetType: schemas.widgetTypeSchema,
      format: z.enum(['script', 'iframe', 'react']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.embed.getEmbedCode(ctx.venture.id, input);
    }),

  // Get widget analytics
  getAnalytics: ventureProcedure
    .input(z.object({
      widgetType: schemas.widgetTypeSchema.optional(),
      period: z.enum(['day', 'week', 'month']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.intelligence.embed.getAnalytics(ctx.venture.id, input);
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const intelligenceRouter = router({
  gateway: gatewayRouter,
  context: contextRouter,
  embedding: embeddingRouter,
  rag: ragRouter,
  knowledge: knowledgeRouter,
  personas: personasRouter,
  memory: memoryRouter,
  ml: mlRouter,
  metrics: metricsRouter,
  embed: embedRouter,
});

export type IntelligenceRouter = typeof intelligenceRouter;
```

---

## REST Endpoints

For clients that prefer REST over tRPC:

```typescript
// @mcv/intelligence/server/rest.ts

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as schemas from '../schemas';

const app = new Hono();

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

/**
 * POST /v1/chat/completions
 * 
 * OpenAI-compatible chat completion endpoint.
 * Supports streaming via SSE when stream=true.
 */
app.post('/v1/chat/completions', 
  zValidator('json', schemas.chatRequestSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const userId = c.get('userId');
    
    if (input.stream) {
      // Return SSE stream
      return c.streamSSE(async (stream) => {
        for await (const chunk of gateway.streamChat({ ...input, ventureId, userId })) {
          await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        await stream.write('data: [DONE]\n\n');
      });
    }
    
    const response = await gateway.chat({ ...input, ventureId, userId });
    return c.json(response);
  }
);

/**
 * GET /v1/models
 * 
 * List available models.
 */
app.get('/v1/models', async (c) => {
  const tier = c.req.query('tier');
  const models = await gateway.listModels({ tier });
  return c.json({ object: 'list', data: models });
});

// ============================================================================
// EMBEDDING ENDPOINTS
// ============================================================================

/**
 * POST /v1/embeddings
 * 
 * OpenAI-compatible embedding endpoint.
 */
app.post('/v1/embeddings',
  zValidator('json', schemas.embeddingRequestSchema),
  async (c) => {
    const input = c.req.valid('json');
    const response = await embedding.embed(input);
    return c.json(response);
  }
);

// ============================================================================
// RAG ENDPOINTS
// ============================================================================

/**
 * POST /v1/rag/query
 * 
 * Query documents with RAG.
 */
app.post('/v1/rag/query',
  zValidator('json', schemas.ragQueryRequestSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const response = await rag.query({ ...input, ventureId });
    return c.json(response);
  }
);

/**
 * POST /v1/rag/documents
 * 
 * Index a new document.
 */
app.post('/v1/rag/documents',
  zValidator('json', schemas.ragIndexDocumentSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const response = await rag.indexDocument({ ...input, ventureId });
    return c.json(response, 201);
  }
);

/**
 * GET /v1/rag/stores
 * 
 * List RAG stores.
 */
app.get('/v1/rag/stores', async (c) => {
  const ventureId = c.get('ventureId');
  const stores = await rag.listStores(ventureId);
  return c.json({ data: stores });
});

/**
 * GET /v1/rag/stores/:storeId/documents
 * 
 * List documents in a store.
 */
app.get('/v1/rag/stores/:storeId/documents', async (c) => {
  const ventureId = c.get('ventureId');
  const storeId = c.req.param('storeId');
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '20');
  
  const response = await rag.listDocuments(ventureId, { storeId, cursor, limit });
  return c.json(response);
});

/**
 * DELETE /v1/rag/documents/:documentId
 * 
 * Delete a document.
 */
app.delete('/v1/rag/documents/:documentId', async (c) => {
  const ventureId = c.get('ventureId');
  const documentId = c.req.param('documentId');
  
  await rag.deleteDocument(ventureId, documentId);
  return c.json({ success: true });
});

// ============================================================================
// KNOWLEDGE GRAPH ENDPOINTS
// ============================================================================

/**
 * POST /v1/knowledge/entities
 * 
 * Create a new entity.
 */
app.post('/v1/knowledge/entities',
  zValidator('json', schemas.addEntitySchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const entity = await knowledge.addEntity({ ...input, ventureId });
    return c.json(entity, 201);
  }
);

/**
 * GET /v1/knowledge/entities/:type/:id
 * 
 * Get an entity.
 */
app.get('/v1/knowledge/entities/:type/:id', async (c) => {
  const ventureId = c.get('ventureId');
  const type = c.req.param('type');
  const id = c.req.param('id');
  
  const entity = await knowledge.getEntity(ventureId, { type, id });
  return c.json(entity);
});

/**
 * POST /v1/knowledge/relations
 * 
 * Create a new relation.
 */
app.post('/v1/knowledge/relations',
  zValidator('json', schemas.addRelationSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const relation = await knowledge.addRelation({ ...input, ventureId });
    return c.json(relation, 201);
  }
);

/**
 * POST /v1/knowledge/query
 * 
 * Natural language query.
 */
app.post('/v1/knowledge/query',
  zValidator('json', schemas.graphQuerySchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const result = await knowledge.query({ ...input, ventureId });
    return c.json(result);
  }
);

// ============================================================================
// MEMORY ENDPOINTS
// ============================================================================

/**
 * POST /v1/memory/remember
 * 
 * Store a memory.
 */
app.post('/v1/memory/remember',
  zValidator('json', schemas.rememberSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const memory = await mem.remember({ ...input, ventureId });
    return c.json(memory, 201);
  }
);

/**
 * POST /v1/memory/recall
 * 
 * Recall memories.
 */
app.post('/v1/memory/recall',
  zValidator('json', schemas.recallSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const memories = await mem.recall({ ...input, ventureId });
    return c.json({ data: memories });
  }
);

/**
 * DELETE /v1/memory/:memoryId
 * 
 * Delete a memory.
 */
app.delete('/v1/memory/:memoryId', async (c) => {
  const ventureId = c.get('ventureId');
  const memoryId = c.req.param('memoryId');
  
  await mem.forget(ventureId, memoryId);
  return c.json({ success: true });
});

// ============================================================================
// ML ENDPOINTS
// ============================================================================

/**
 * POST /v1/ml/predict
 * 
 * Get a prediction.
 */
app.post('/v1/ml/predict',
  zValidator('json', schemas.predictSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const prediction = await ml.predict({ ...input, ventureId });
    return c.json(prediction);
  }
);

/**
 * POST /v1/ml/recommend
 * 
 * Get recommendations.
 */
app.post('/v1/ml/recommend',
  zValidator('json', schemas.recommendSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const recommendations = await ml.recommend({ ...input, ventureId });
    return c.json({ data: recommendations });
  }
);

/**
 * POST /v1/ml/anomalies
 * 
 * Detect anomalies.
 */
app.post('/v1/ml/anomalies',
  zValidator('json', schemas.detectAnomaliesSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const anomalies = await ml.detectAnomalies({ ...input, ventureId });
    return c.json({ data: anomalies });
  }
);

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

/**
 * GET /v1/metrics/usage
 * 
 * Get usage metrics.
 */
app.get('/v1/metrics/usage', async (c) => {
  const ventureId = c.get('ventureId');
  const period = c.req.query('period') || 'day';
  
  const usage = await metrics.getUsage(ventureId, { period });
  return c.json(usage);
});

/**
 * GET /v1/metrics/costs
 * 
 * Get cost breakdown.
 */
app.get('/v1/metrics/costs', async (c) => {
  const ventureId = c.get('ventureId');
  const period = c.req.query('period') || 'month';
  
  const costs = await metrics.getCosts(ventureId, { period });
  return c.json(costs);
});

/**
 * GET /v1/metrics/budget
 * 
 * Get budget status.
 */
app.get('/v1/metrics/budget', async (c) => {
  const ventureId = c.get('ventureId');
  const budget = await metrics.getBudget(ventureId);
  return c.json(budget);
});

/**
 * PUT /v1/metrics/budget
 * 
 * Update budget.
 */
app.put('/v1/metrics/budget',
  zValidator('json', schemas.budgetUpdateSchema),
  async (c) => {
    const input = c.req.valid('json');
    const ventureId = c.get('ventureId');
    const budget = await metrics.updateBudget(ventureId, input);
    return c.json(budget);
  }
);

export default app;
```

---

## WebSocket Events

```typescript
// @mcv/intelligence/server/websocket.ts

/**
 * WebSocket event types for real-time streaming.
 */

// ============================================================================
// CLIENT → SERVER EVENTS
// ============================================================================

export interface ChatStartEvent {
  type: 'chat.start';
  payload: {
    messages: Message[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    conversationId?: string;
    personaId?: string;
  };
}

export interface ChatCancelEvent {
  type: 'chat.cancel';
  payload: {
    requestId: string;
  };
}

export interface TypingEvent {
  type: 'typing.start' | 'typing.stop';
  payload: {
    conversationId: string;
  };
}

export type ClientEvent = ChatStartEvent | ChatCancelEvent | TypingEvent;

// ============================================================================
// SERVER → CLIENT EVENTS
// ============================================================================

export interface ChatTokenEvent {
  type: 'chat.token';
  payload: {
    requestId: string;
    token: string;
    index: number;
  };
}

export interface ChatCompleteEvent {
  type: 'chat.complete';
  payload: {
    requestId: string;
    message: Message;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cost: {
      totalCost: number;
      currency: 'USD';
    };
    latency: {
      ttftMs: number;
      totalMs: number;
    };
  };
}

export interface ChatErrorEvent {
  type: 'chat.error';
  payload: {
    requestId: string;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
}

export interface ToolCallEvent {
  type: 'chat.tool_call';
  payload: {
    requestId: string;
    toolCall: ToolCall;
  };
}

export interface ConnectionEvent {
  type: 'connection.ready' | 'connection.error';
  payload: {
    sessionId?: string;
    error?: string;
  };
}

export type ServerEvent = 
  | ChatTokenEvent 
  | ChatCompleteEvent 
  | ChatErrorEvent 
  | ToolCallEvent 
  | ConnectionEvent;

// ============================================================================
// WEBSOCKET HANDLER
// ============================================================================

export function createWebSocketHandler() {
  return {
    async handleConnection(ws: WebSocket, context: MCVContext) {
      const sessionId = generateId('ws');
      
      // Send ready event
      ws.send(JSON.stringify({
        type: 'connection.ready',
        payload: { sessionId },
      } satisfies ConnectionEvent));
      
      // Handle messages
      ws.addEventListener('message', async (event) => {
        const message = JSON.parse(event.data) as ClientEvent;
        
        switch (message.type) {
          case 'chat.start':
            await handleChatStart(ws, message.payload, context);
            break;
          case 'chat.cancel':
            await handleChatCancel(message.payload.requestId);
            break;
          case 'typing.start':
          case 'typing.stop':
            // Broadcast to conversation participants
            break;
        }
      });
    },
  };
}

async function handleChatStart(
  ws: WebSocket, 
  payload: ChatStartEvent['payload'],
  context: MCVContext
) {
  const requestId = generateId('req');
  
  try {
    const stream = gateway.streamChat({
      ...payload,
      ventureId: context.venture.id,
      userId: context.user?.id,
    });
    
    let index = 0;
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        ws.send(JSON.stringify({
          type: 'chat.token',
          payload: {
            requestId,
            token: chunk.choices[0].delta.content,
            index: index++,
          },
        } satisfies ChatTokenEvent));
      }
      
      if (chunk.choices[0]?.delta?.tool_calls) {
        for (const toolCall of chunk.choices[0].delta.tool_calls) {
          ws.send(JSON.stringify({
            type: 'chat.tool_call',
            payload: { requestId, toolCall },
          } satisfies ToolCallEvent));
        }
      }
    }
    
    // Send complete event with final stats
    ws.send(JSON.stringify({
      type: 'chat.complete',
      payload: {
        requestId,
        message: { role: 'assistant', content: '...' }, // Full message
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: { totalCost: 0, currency: 'USD' },
        latency: { ttftMs: 0, totalMs: 0 },
      },
    } satisfies ChatCompleteEvent));
    
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'chat.error',
      payload: {
        requestId,
        error: {
          code: 'CHAT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    } satisfies ChatErrorEvent));
  }
}
```

---

## Database Types

```typescript
// @mcv/intelligence/db/types.ts

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

// ============================================================================
// INFERRED TYPES FROM DRIZZLE SCHEMA
// ============================================================================

// LLM Requests
export type LLMRequest = InferSelectModel<typeof schema.llmRequests>;
export type NewLLMRequest = InferInsertModel<typeof schema.llmRequests>;

// Model Configs
export type ModelConfig = InferSelectModel<typeof schema.modelConfigs>;
export type NewModelConfig = InferInsertModel<typeof schema.modelConfigs>;

// Cost Budgets
export type CostBudget = InferSelectModel<typeof schema.costBudgets>;
export type NewCostBudget = InferInsertModel<typeof schema.costBudgets>;

// Provider Health
export type ProviderHealthRecord = InferSelectModel<typeof schema.providerHealth>;
export type NewProviderHealthRecord = InferInsertModel<typeof schema.providerHealth>;

// Embeddings Cache
export type EmbeddingCache = InferSelectModel<typeof schema.embeddingsCache>;
export type NewEmbeddingCache = InferInsertModel<typeof schema.embeddingsCache>;

// Conversations
export type Conversation = InferSelectModel<typeof schema.conversations>;
export type NewConversation = InferInsertModel<typeof schema.conversations>;

// Messages
export type MessageRecord = InferSelectModel<typeof schema.messages>;
export type NewMessageRecord = InferInsertModel<typeof schema.messages>;

// Personas
export type PersonaRecord = InferSelectModel<typeof schema.personas>;
export type NewPersonaRecord = InferInsertModel<typeof schema.personas>;

// Memories
export type MemoryRecord = InferSelectModel<typeof schema.memories>;
export type NewMemoryRecord = InferInsertModel<typeof schema.memories>;

// RAG Stores
export type RAGStoreRecord = InferSelectModel<typeof schema.ragStores>;
export type NewRAGStoreRecord = InferInsertModel<typeof schema.ragStores>;

// RAG Documents
export type RAGDocumentRecord = InferSelectModel<typeof schema.ragDocuments>;
export type NewRAGDocumentRecord = InferInsertModel<typeof schema.ragDocuments>;

// ML Models
export type MLModelRecord = InferSelectModel<typeof schema.mlModels>;
export type NewMLModelRecord = InferInsertModel<typeof schema.mlModels>;

// ML Predictions
export type MLPredictionRecord = InferSelectModel<typeof schema.mlPredictions>;
export type NewMLPredictionRecord = InferInsertModel<typeof schema.mlPredictions>;
```

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)

---

*@mcv/intelligence — API Reference v1.0.0*
