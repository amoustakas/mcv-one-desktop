# @mcv/intelligence/gateway — AI Gateway Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Core)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 9, 2026

---

## Purpose

The `gateway` module provides unified access to 400+ LLM models via OpenRouter. It handles intelligent routing based on task complexity, automatic failover when providers fail, per-venture and per-agent cost tracking, budget enforcement, rate limiting, and response caching. Every AI-powered feature in MCV — from chat assistants to NAOS agent orchestration — flows through this gateway.

**This is the single entry point for all LLM operations across the entire MCV ecosystem.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// GATEWAY API
// ═══════════════════════════════════════════════════════════════════════════════

// Core operations
export {
  chat,                    // Chat completion (non-streaming)
  complete,                // Text completion (legacy)
  streamChat,              // Streaming chat completion (SSE/WebSocket)
  embed,                   // Generate embeddings
} from './server/services/gateway-service';

// Gateway factory
export {
  createGateway,           // Create configured gateway instance
  getGateway,              // Get default gateway instance
} from './server/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL ROUTING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  routeModel,              // Intelligent model selection
  resolveModel,            // Resolve model ID to provider config
  getModelTier,            // Get tier for a model
  listModels,              // List available models with capabilities
  getModelConfig,          // Get full model configuration
} from './server/services/routing-service';

// Complexity scoring
export {
  scoreComplexity,         // Score request complexity (0-10)
  getComplexityWeights,    // Get current complexity weights
  updateComplexityWeights, // Update weights per venture
} from './server/services/complexity-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COST & BUDGET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  trackUsage,              // Record LLM usage
  getUsage,                // Query usage logs
  getCosts,                // Get cost breakdown
  getUsageSummary,         // Aggregated usage stats
} from './server/services/usage-service';

export {
  checkBudget,             // Check if request is within budget
  getBudget,               // Get venture budget
  updateBudget,            // Update venture budget limits
  getAgentBudget,          // Get per-agent budget
  updateAgentBudget,       // Update per-agent budget limits
  resetDailyBudgets,       // Cron: reset daily counters
  resetMonthlyBudgets,     // Cron: reset monthly counters
} from './server/services/budget-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  listModelConfigs,        // List all model configurations
  getModelConfigById,      // Get single model config
  createModelConfig,       // Add new model
  updateModelConfig,       // Update model settings
  deleteModelConfig,       // Remove model
  setModelEnabled,         // Enable/disable model
} from './server/services/model-config-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER HEALTH & FAILOVER
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getProviderHealth,       // Get provider status
  getFailoverChain,        // Get fallback model chain
  reportProviderError,     // Report provider failure
  resetProviderHealth,     // Reset health after recovery
} from './server/services/health-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT CACHING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getCacheStats,           // Get cache hit rates
  invalidateCache,         // Invalidate cached responses
  setCachePolicy,          // Configure caching behavior
} from './server/services/cache-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useChat } from './client/hooks/use-chat';
export { useStreamChat } from './client/hooks/use-stream-chat';
export { useCompletion } from './client/hooks/use-completion';
export { useUsageDashboard } from './client/hooks/use-usage-dashboard';
export { useBudgetManager } from './client/hooks/use-budget-manager';
export { useModelSelector } from './client/hooks/use-model-selector';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ChatInterface } from './client/components/chat-interface';
export { StreamingResponse } from './client/components/streaming-response';
export { UsageDashboard } from './client/components/usage-dashboard';
export { BudgetManager } from './client/components/budget-manager';
export { ModelSelector } from './client/components/model-selector';
export { ProviderHealthPanel } from './client/components/provider-health-panel';
export { CostBreakdownChart } from './client/components/cost-breakdown-chart';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MODEL_TIERS,
  TIER_NAMES,
  DEFAULT_TIER_THRESHOLDS,
  PROVIDER_LIST,
  OPENROUTER_BASE_URL,
  DEFAULT_BUDGET_LIMITS,
  RATE_LIMIT_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core types
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ChatMessageRole,
  StreamChatRequest,
  StreamChunk,
  CompletionRequest,
  CompletionResponse,

  // Model types
  ModelConfig,
  ModelTier,
  ModelCapabilities,
  ModelRouting,
  ModelResolution,

  // Routing types
  RoutingRequest,
  RoutingResult,
  ComplexityScore,
  ComplexityWeights,
  FailoverChain,

  // Budget types
  VentureBudget,
  AgentBudget,
  BudgetCheck,
  BudgetAlert,

  // Usage types
  LlmUsageLog,
  UsageSummary,
  UsageFilters,
  CostBreakdown,
  CostByModel,
  CostByAgent,
  CostTimeSeries,

  // Provider types
  ProviderHealth,
  ProviderStatus,
  ProviderError,

  // Cache types
  CachePolicy,
  CacheStats,

  // Gateway config
  GatewayConfig,
  GatewayOptions,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AI GATEWAY ARCHITECTURE                                 │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                            ENTRY POINTS                                       │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  API Routes  │  │ NAOS Agents  │  │   Widgets    │  │   Cron Jobs  │     │   │
│  │  │  /api/chat   │  │  Queen/Ralph │  │  Embedded    │  │  Scheduled   │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                 │               │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘               │   │
│  │                                    │                                           │   │
│  └────────────────────────────────────┼───────────────────────────────────────────┘   │
│                                       │                                               │
│  ┌────────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                          GATEWAY PIPELINE                                       │   │
│  │                                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │    1.       │  │    2.       │  │    3.       │  │    4.       │           │   │
│  │  │  Validate   │─▶│   Budget    │─▶│ Complexity  │─▶│   Route    │           │   │
│  │  │  Request    │  │   Check     │  │  Scoring    │  │   Model    │           │   │
│  │  │             │  │             │  │             │  │             │           │   │
│  │  │ • Schema    │  │ • Venture   │  │ • Tokens    │  │ • Tier     │           │   │
│  │  │ • Auth      │  │ • Agent     │  │ • Tools     │  │ • Priority │           │   │
│  │  │ • Rate limit│  │ • Daily     │  │ • Creativity│  │ • Failover │           │   │
│  │  │             │  │ • Monthly   │  │ • Dependency│  │ • Cost     │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬──────┘           │   │
│  │                                                             │                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────▼───────┐           │   │
│  │  │    8.       │  │    7.       │  │    6.       │  │    5.       │           │   │
│  │  │   Track     │◀─│  Response   │◀─│  Execute    │◀─│   Cache    │           │   │
│  │  │   Usage     │  │  Normalize  │  │  Request    │  │   Check    │           │   │
│  │  │             │  │             │  │             │  │             │           │   │
│  │  │ • Tokens    │  │ • Unified   │  │ • Provider  │  │ • Semantic  │           │   │
│  │  │ • Cost      │  │   format    │  │   API call  │  │   match    │           │   │
│  │  │ • Latency   │  │ • Metadata  │  │ • Stream    │  │ • TTL      │           │   │
│  │  │ • Tracing   │  │ • Audit     │  │ • Failover  │  │ • ZDR      │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          PROVIDER LAYER                                          │   │
│  │                                                                                  │   │
│  │    ┌────────────────────────────────────────────────────────────────────────┐   │   │
│  │    │                       OpenRouter Proxy                                  │   │   │
│  │    │                                                                         │   │   │
│  │    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │   │
│  │    │  │ Anthropic│ │  OpenAI  │ │  Google  │ │ DeepSeek │ │  Meta    │    │   │   │
│  │    │  │          │ │          │ │          │ │          │ │          │    │   │   │
│  │    │  │ Claude   │ │ GPT-4o   │ │ Gemini   │ │ DeepSeek │ │ Llama   │    │   │   │
│  │    │  │ Opus     │ │ GPT-4.5  │ │ Pro 2.0  │ │ V3       │ │ 3.3     │    │   │   │
│  │    │  │ Sonnet   │ │ o3/o3-m  │ │ Flash    │ │ R1       │ │ 405B    │    │   │   │
│  │    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │   │
│  │    │                                                                         │   │   │
│  │    │  + Mistral, Cohere, Perplexity, 01.AI, Qwen, Nous, + 400 more...      │   │   │
│  │    └────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATABASE LAYER                                          │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │  │
│  │  │ llm_usage_logs  │ │venture_budgets  │ │  agent_budgets  │ │ model_configs │ │  │
│  │  │                 │ │                 │ │                 │ │               │ │  │
│  │  │ Every request   │ │ Per-venture     │ │ Per-agent       │ │ Model tier,   │ │  │
│  │  │ with tokens,    │ │ daily/monthly   │ │ daily/monthly   │ │ cost, caps,   │ │  │
│  │  │ cost, latency,  │ │ spend limits    │ │ spend/token/    │ │ provider,     │ │  │
│  │  │ tracing IDs     │ │ & alerts        │ │ request limits  │ │ capabilities  │ │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                      complexity_weights                                      │ │  │
│  │  │                                                                              │ │  │
│  │  │  Per-venture or global weights for intelligent routing:                      │ │  │
│  │  │  token_weight + dependency_weight + tool_weight + creativity_weight = 1.0   │ │  │
│  │  │  Tier thresholds: t0 < 3.0, t1 < 6.5, t2 < 10.0                           │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Model Tier System

The gateway uses a 5-tier model classification system for intelligent routing:

| Tier | Name | Models | Use Case | Cost Range |
|------|------|--------|----------|------------|
| **0** | Economy | DeepSeek-V3, GPT-4o-mini, Gemini Flash 2.0 | High-volume, simple tasks (summarize, classify, extract) | $0.10–0.50/M tokens |
| **1** | Standard | Claude 3.5 Sonnet, GPT-4o, Gemini Pro 1.5 | General purpose, quality balance (chat, analysis, code) | $2–5/M tokens |
| **2** | Premium | Claude Opus, GPT-4.5, Gemini Ultra | Complex reasoning, critical decisions, creative writing | $10–30/M tokens |
| **3** | Reasoning | o3, o3-mini, Claude Opus:thinking | Multi-step logic, planning, mathematical proof | $15–50/M tokens |
| **4** | Specialized | Code Llama, Mistral-Large, Vision models | Domain-specific (code gen, vision, multilingual) | Varies |

### Complexity-Based Routing

The gateway automatically selects the optimal tier by scoring request complexity:

```
Complexity Score = (token_weight × token_factor)
                 + (dependency_weight × dependency_factor)
                 + (tool_weight × tool_factor)
                 + (creativity_weight × creativity_factor)

Score 0.0 – 3.0  →  Tier 0 (Economy)
Score 3.0 – 6.5  →  Tier 1 (Standard)
Score 6.5 – 10.0 →  Tier 2 (Premium)
Score 10.0+       →  Tier 3 (Reasoning)
```

| Factor | What It Measures | Range |
|--------|-----------------|-------|
| `token_factor` | Input token count relative to context window | 0–10 |
| `dependency_factor` | Number of tool calls, API dependencies | 0–10 |
| `tool_factor` | Complexity of tools required (simple lookup vs. multi-step) | 0–10 |
| `creativity_factor` | Open-endedness of the task (factual vs. creative) | 0–10 |

---

## Core Interfaces

### ChatRequest

```typescript
interface ChatRequest {
  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Conversation messages */
  messages: ChatMessage[];

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Specific model ID (e.g., 'anthropic/claude-3.5-sonnet') */
  model?: string;

  /** Model tier for automatic routing (0-4) */
  tier?: ModelTier;

  /** 'auto' = complexity-based routing */
  routing?: 'auto' | 'manual' | 'cheapest' | 'fastest' | 'best';

  /** Fallback models if primary fails */
  fallbackModels?: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATION PARAMETERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Sampling temperature (0-2, default: 0.7) */
  temperature?: number;

  /** Top-p nucleus sampling (0-1) */
  topP?: number;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Stop sequences */
  stop?: string[];

  /** Frequency penalty (-2 to 2) */
  frequencyPenalty?: number;

  /** Presence penalty (-2 to 2) */
  presencePenalty?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL USE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Available tools for the model */
  tools?: Tool[];

  /** Tool choice strategy */
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

  /** Parallel tool calls allowed */
  parallelToolCalls?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAMING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Enable streaming response */
  stream?: boolean;

  /** Callback for each token (streaming only) */
  onToken?: (token: string) => void;

  /** Callback on stream complete */
  onComplete?: (response: ChatResponse) => void;

  /** Callback on stream error */
  onError?: (error: GatewayError) => void;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Venture ID for cost tracking and config */
  ventureId: string;

  /** User ID for attribution */
  userId?: string;

  /** Agent type for NAOS agent tracking */
  agentType?: string;

  /** Task ID for distributed tracing */
  taskId?: string;

  /** Session ID for conversation continuity */
  sessionId?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CACHING & PRIVACY
  // ═══════════════════════════════════════════════════════════════════════════

  /** Cache policy for this request */
  cache?: CachePolicy;

  /** Zero Data Retention — don't store prompts/responses */
  zeroDataRetention?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Trace ID for distributed tracing (auto-generated if not provided) */
  traceId?: string;

  /** Parent span ID (for child operations) */
  parentSpanId?: string;

  /** Custom metadata for logging */
  metadata?: Record<string, unknown>;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  role: ChatMessageRole;                // 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentPart[];     // Text or multimodal content
  name?: string;                        // Participant name
  toolCalls?: ToolCall[];              // Tool calls (assistant messages)
  toolCallId?: string;                 // Tool response ID (tool messages)
}

type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };
```

### ChatResponse

```typescript
interface ChatResponse {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Generated content */
  content: string;

  /** Tool calls requested by the model */
  toolCalls?: ToolCall[];

  /** Finish reason */
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE & COST
  // ═══════════════════════════════════════════════════════════════════════════

  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;              // Prompt caching hits
  };

  /** Cost in USD */
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    cacheSavings?: number;              // Amount saved via caching
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL & ROUTING INFO
  // ═══════════════════════════════════════════════════════════════════════════

  /** Model that actually processed the request */
  model: string;

  /** Provider that served the request */
  provider: string;

  /** Model tier used */
  tier: ModelTier;

  /** Was this a failover from the primary model? */
  isFailover: boolean;

  /** Original model if failover occurred */
  requestedModel?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Total latency in milliseconds */
  latencyMs: number;

  /** Time to first token (streaming) */
  ttftMs?: number;

  /** Was this served from cache? */
  cached: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Request ID */
  requestId: string;

  /** Trace ID for distributed tracing */
  traceId: string;

  /** Span ID for this operation */
  spanId: string;

  /** Complexity score (if auto-routed) */
  complexityScore?: number;
}
```

### ModelConfig

```typescript
interface ModelConfig {
  id: string;                           // UUID primary key

  // Identity
  modelId: string;                      // e.g., 'anthropic/claude-3.5-sonnet'
  provider: string;                     // e.g., 'anthropic'
  displayName: string;                  // e.g., 'Claude 3.5 Sonnet'

  // Tier assignment
  tier: ModelTier;                      // 0-4
  priority: number;                     // Higher = preferred within tier

  // Cost (per 1M tokens)
  inputCostPer1m: number;              // Input token cost
  outputCostPer1m: number;             // Output token cost

  // Capabilities
  contextWindow: number;                // Max context tokens
  supportsTools: boolean;               // Function calling support
  supportsVision: boolean;              // Image input support
  supportsStreaming: boolean;            // Streaming response support

  // Status
  enabled: boolean;                     // Available for routing

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

type ModelTier = 0 | 1 | 2 | 3 | 4;
```

### VentureBudget

```typescript
interface VentureBudget {
  id: string;                           // UUID primary key
  ventureId: string;                    // One budget per venture

  // Limits (USD)
  dailyLimitUsd: number;               // Default: $100
  monthlyLimitUsd: number;             // Default: $2,000

  // Current spend
  dailySpentUsd: number;               // Reset daily at midnight UTC
  monthlySpentUsd: number;             // Reset on 1st of month

  // Alerts
  alertThresholdPercent: number;        // Default: 80%
  alertSentAt: Date | null;            // Last alert timestamp

  // Enforcement
  hardLimit: boolean;                   // true = block requests when exceeded

  // Reset tracking
  lastResetDaily: Date | null;
  lastResetMonthly: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### AgentBudget

```typescript
interface AgentBudget {
  id: string;                           // UUID primary key
  ventureId: string;                    // Parent venture
  agentType: string;                    // 'queen' | 'ralph' | 'hephaestus' | etc.

  // Spend limits (USD) — allocation within venture's total budget
  dailyLimitUsd: number;               // Default: $10
  monthlyLimitUsd: number;             // Default: $200

  // Current spend
  dailySpentUsd: number;
  monthlySpentUsd: number;

  // Token tracking
  dailyTokensUsed: number;
  monthlyTokensUsed: number;

  // Request tracking
  dailyRequests: number;
  monthlyRequests: number;

  // Limits on requests and tokens (null = no limit)
  maxDailyRequests: number | null;
  maxMonthlyRequests: number | null;
  maxDailyTokens: number | null;
  maxMonthlyTokens: number | null;

  // Tier restrictions
  maxTier: ModelTier | null;            // Highest tier this agent can use
  preferredTier: ModelTier | null;      // Default tier if not specified

  // Enforcement
  hardLimit: boolean;                   // Block when exceeded
  enabled: boolean;                     // false = agent can't make requests

  // Alerts
  alertThresholdPercent: number;        // Default: 80%
  alertSentAt: Date | null;

  // Reset tracking
  lastResetDaily: Date | null;
  lastResetMonthly: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### ComplexityWeights

```typescript
interface ComplexityWeights {
  id: string;                           // UUID primary key
  ventureId: string | null;             // null = global default

  // Weights (must sum to 1.0)
  tokenWeight: number;                  // Default: 0.20
  dependencyWeight: number;             // Default: 0.30
  toolWeight: number;                   // Default: 0.30
  creativityWeight: number;             // Default: 0.20

  // Tier thresholds
  t0Threshold: number;                  // Default: 3.0
  t1Threshold: number;                  // Default: 6.5
  t2Threshold: number;                  // Default: 10.0

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### LlmUsageLog

```typescript
interface LlmUsageLog {
  id: string;                           // UUID primary key
  ventureId: string;                    // Venture scope
  requestId: string;                    // Unique request ID

  // User context
  userId: string | null;                // Acting user

  // Model info
  model: string;                        // Model ID used
  tier: ModelTier;                      // Model tier (0-4)
  provider: string | null;              // Provider name

  // Token usage
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost
  costUsd: number;                      // Total cost in USD

  // Performance
  latencyMs: number | null;             // Request latency

  // Routing metadata
  complexityScore: number | null;       // Complexity score (if auto-routed)
  agentType: string | null;             // NAOS agent type
  taskId: string | null;                // NAOS task ID
  sessionId: string | null;             // Conversation session

  // Distributed tracing
  traceId: string | null;               // Unique trace for request chain
  spanId: string | null;                // Unique span for this operation
  parentSpanId: string | null;          // Parent span if child operation

  // Status
  status: 'completed' | 'failed' | 'timeout';
  errorMessage: string | null;

  // Timestamps
  createdAt: Date;
}
```

---

## Database Schema

### llm_usage_logs Table

```typescript
export const llmUsageLogs = pgTable('llm_usage_logs', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture for cost attribution (required)
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // Unique request identifier
  requestId: varchar('request_id', { length: 64 }).notNull().unique(),

  // User who initiated the request (null for system/agent requests)
  userId: uuid('user_id'),

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Full model identifier (e.g., 'anthropic/claude-3.5-sonnet')
  model: varchar('model', { length: 128 }).notNull(),

  // Model tier used (0=Economy, 1=Standard, 2=Premium, 3=Reasoning, 4=Specialized)
  tier: integer('tier').notNull(),

  // Provider that served the request (e.g., 'anthropic', 'openai')
  provider: varchar('provider', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN USAGE
  // ═══════════════════════════════════════════════════════════════════════════

  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // COST TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  // Total cost in USD (precision: 10 digits, 6 decimal places)
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  // End-to-end latency in milliseconds
  latencyMs: integer('latency_ms'),

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTING METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Complexity score from the routing engine (0.0-10.0+)
  complexityScore: decimal('complexity_score', { precision: 4, scale: 2 }),

  // NAOS agent type (e.g., 'queen', 'ralph', 'hephaestus', 'analyst')
  agentType: varchar('agent_type', { length: 32 }),

  // Task and session for correlation
  taskId: varchar('task_id', { length: 64 }),
  sessionId: varchar('session_id', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISTRIBUTED TRACING
  // ═══════════════════════════════════════════════════════════════════════════

  // OpenTelemetry-compatible tracing fields
  traceId: varchar('trace_id', { length: 64 }),
  spanId: varchar('span_id', { length: 64 }),
  parentSpanId: varchar('parent_span_id', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  // Request outcome
  status: varchar('status', { length: 16 }).notNull().default('completed'),

  // Error details if status is 'failed' or 'timeout'
  errorMessage: varchar('error_message', { length: 512 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('llm_usage_venture_created_idx').on(table.ventureId, table.createdAt),
  index('llm_usage_model_created_idx').on(table.model, table.createdAt),
  index('llm_usage_agent_type_idx').on(table.agentType),
  index('llm_usage_user_id_idx').on(table.userId),
  index('llm_usage_trace_id_idx').on(table.traceId),
]);
```

### venture_budgets Table

```typescript
export const ventureBudgets = pgTable('venture_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull().unique(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SPENDING LIMITS (USD)
  // ═══════════════════════════════════════════════════════════════════════════

  dailyLimitUsd: decimal('daily_limit_usd', { precision: 10, scale: 2 })
    .notNull().default('100'),
  monthlyLimitUsd: decimal('monthly_limit_usd', { precision: 10, scale: 2 })
    .notNull().default('2000'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CURRENT SPEND (reset by cron jobs)
  // ═══════════════════════════════════════════════════════════════════════════

  dailySpentUsd: decimal('daily_spent_usd', { precision: 10, scale: 2 })
    .notNull().default('0'),
  monthlySpentUsd: decimal('monthly_spent_usd', { precision: 10, scale: 2 })
    .notNull().default('0'),

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERT SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Send alert when spend reaches this % of limit
  alertThresholdPercent: integer('alert_threshold_percent').notNull().default(80),
  alertSentAt: timestamp('alert_sent_at', { withTimezone: true }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  // true = block requests when budget exceeded (default: soft limit — log only)
  hardLimit: boolean('hard_limit').notNull().default(false),

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  lastResetDaily: timestamp('last_reset_daily', { withTimezone: true }),
  lastResetMonthly: timestamp('last_reset_monthly', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### agent_budgets Table

```typescript
export const agentBudgets = pgTable('agent_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENT IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // NAOS agent type (e.g., 'queen', 'ralph', 'hephaestus', 'analyst', 'scout')
  agentType: varchar('agent_type', { length: 32 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEND LIMITS (USD) — allocation within venture total
  // ═══════════════════════════════════════════════════════════════════════════

  dailyLimitUsd: decimal('daily_limit_usd', { precision: 10, scale: 2 })
    .notNull().default('10'),
  monthlyLimitUsd: decimal('monthly_limit_usd', { precision: 10, scale: 2 })
    .notNull().default('200'),

  dailySpentUsd: decimal('daily_spent_usd', { precision: 10, scale: 2 })
    .notNull().default('0'),
  monthlySpentUsd: decimal('monthly_spent_usd', { precision: 10, scale: 2 })
    .notNull().default('0'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN & REQUEST TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  dailyTokensUsed: integer('daily_tokens_used').notNull().default(0),
  monthlyTokensUsed: integer('monthly_tokens_used').notNull().default(0),
  dailyRequests: integer('daily_requests').notNull().default(0),
  monthlyRequests: integer('monthly_requests').notNull().default(0),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL LIMITS (null = no limit)
  // ═══════════════════════════════════════════════════════════════════════════

  maxDailyRequests: integer('max_daily_requests'),
  maxMonthlyRequests: integer('max_monthly_requests'),
  maxDailyTokens: integer('max_daily_tokens'),
  maxMonthlyTokens: integer('max_monthly_tokens'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER RESTRICTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Maximum tier this agent can use (null = any tier)
  maxTier: integer('max_tier'),

  // Default tier for this agent when not specified in request
  preferredTier: integer('preferred_tier'),

  // ═══════════════════════════════════════════════════════════════════════════
  // ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  hardLimit: boolean('hard_limit').notNull().default(false),
  enabled: boolean('enabled').notNull().default(true),

  alertThresholdPercent: integer('alert_threshold_percent').notNull().default(80),
  alertSentAt: timestamp('alert_sent_at', { withTimezone: true }),

  lastResetDaily: timestamp('last_reset_daily', { withTimezone: true }),
  lastResetMonthly: timestamp('last_reset_monthly', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('agent_budgets_venture_agent_idx').on(table.ventureId, table.agentType),
  uniqueIndex('agent_budgets_venture_agent_unique').on(table.ventureId, table.agentType),
]);
```

### model_configs Table

```typescript
export const modelConfigs = pgTable('model_configs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  modelId: varchar('model_id', { length: 128 }).notNull(),
  provider: varchar('provider', { length: 64 }).notNull(),
  displayName: varchar('display_name', { length: 128 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER & PRIORITY
  // ═══════════════════════════════════════════════════════════════════════════

  tier: integer('tier').notNull(),
  priority: integer('priority').notNull().default(0),

  // ═══════════════════════════════════════════════════════════════════════════
  // COST (per 1M tokens)
  // ═══════════════════════════════════════════════════════════════════════════

  inputCostPer1m: decimal('input_cost_per_1m', { precision: 10, scale: 4 }).notNull(),
  outputCostPer1m: decimal('output_cost_per_1m', { precision: 10, scale: 4 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  contextWindow: integer('context_window').notNull(),
  supportsTools: boolean('supports_tools').notNull().default(true),
  supportsVision: boolean('supports_vision').notNull().default(false),
  supportsStreaming: boolean('supports_streaming').notNull().default(true),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  enabled: boolean('enabled').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('model_configs_tier_priority_idx').on(table.tier, table.priority),
  uniqueIndex('model_configs_model_id_unique').on(table.modelId),
]);
```

### complexity_weights Table

```typescript
export const complexityWeights = pgTable('complexity_weights', {
  id: uuid('id').primaryKey().defaultRandom(),

  // null = global default; set ventureId for per-venture overrides
  ventureId: uuid('venture_id').references(() => ventures.id),

  // ═══════════════════════════════════════════════════════════════════════════
  // WEIGHTS (must sum to 1.0)
  // ═══════════════════════════════════════════════════════════════════════════

  tokenWeight: decimal('token_weight', { precision: 3, scale: 2 }).notNull().default('0.20'),
  dependencyWeight: decimal('dependency_weight', { precision: 3, scale: 2 }).notNull().default('0.30'),
  toolWeight: decimal('tool_weight', { precision: 3, scale: 2 }).notNull().default('0.30'),
  creativityWeight: decimal('creativity_weight', { precision: 3, scale: 2 }).notNull().default('0.20'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  t0Threshold: decimal('t0_threshold', { precision: 3, scale: 1 }).notNull().default('3.0'),
  t1Threshold: decimal('t1_threshold', { precision: 3, scale: 1 }).notNull().default('6.5'),
  t2Threshold: decimal('t2_threshold', { precision: 3, scale: 1 }).notNull().default('10.0'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('complexity_weights_venture_unique').on(table.ventureId),
]);
```

---

## Usage Examples

### Basic Chat Completion

```typescript
import { chat, streamChat } from '@mcv/intelligence/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple chat completion
// ═══════════════════════════════════════════════════════════════════════════════

const response = await chat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant for BetEdge.' },
    { role: 'user', content: 'What are the odds for tonight\'s Lakers game?' },
  ],
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  tier: 1, // Standard tier
});

console.log(response.content);
console.log(`Model: ${response.model} (Tier ${response.tier})`);
console.log(`Cost: $${response.cost.totalCost.toFixed(6)}`);
console.log(`Latency: ${response.latencyMs}ms`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Auto-routed by complexity
// ═══════════════════════════════════════════════════════════════════════════════

const response = await chat({
  messages: [
    { role: 'user', content: 'Summarize this article in 3 bullet points.' },
  ],
  ventureId: 'serpspace-venture-uuid',
  routing: 'auto', // Gateway scores complexity and picks optimal tier
});

console.log(`Routed to: ${response.model} (complexity: ${response.complexityScore})`);
// Output: "Routed to: deepseek/deepseek-chat (complexity: 2.1)"
// Simple summarization → Economy tier

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Complex reasoning (auto-routes to higher tier)
// ═══════════════════════════════════════════════════════════════════════════════

const response = await chat({
  messages: [
    {
      role: 'user',
      content: 'Analyze this financial dataset, identify anomalies, project Q3 trends, and recommend portfolio adjustments.',
    },
  ],
  ventureId: 'futurestate-venture-uuid',
  routing: 'auto',
  tools: [financialAnalysisTool, portfolioTool, projectionTool],
});

console.log(`Routed to: ${response.model} (complexity: ${response.complexityScore})`);
// Output: "Routed to: anthropic/claude-3-opus (complexity: 8.7)"
// Complex multi-tool task → Premium tier
```

### Streaming Responses

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Server-side streaming
// ═══════════════════════════════════════════════════════════════════════════════

const stream = await streamChat({
  messages: [
    { role: 'user', content: 'Write a grant proposal for renewable energy research.' },
  ],
  ventureId: 'fullgain-venture-uuid',
  tier: 2, // Premium for quality writing
  onToken: (token) => {
    process.stdout.write(token);
  },
  onComplete: (response) => {
    console.log(`\n\nTotal tokens: ${response.usage.totalTokens}`);
    console.log(`Cost: $${response.cost.totalCost.toFixed(4)}`);
    console.log(`TTFT: ${response.ttftMs}ms`);
  },
  onError: (error) => {
    console.error('Stream error:', error.message);
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: API route with SSE streaming
// ═══════════════════════════════════════════════════════════════════════════════

// In Next.js API route
export async function POST(req: Request) {
  const { messages, ventureId } = await req.json();

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      await streamChat({
        messages,
        ventureId,
        routing: 'auto',
        onToken: (token) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
          );
        },
        onComplete: (response) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, usage: response.usage })}\n\n`)
          );
          controller.close();
        },
        onError: (error) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        },
      });
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Failover & Resilience

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Automatic failover chain
// ═══════════════════════════════════════════════════════════════════════════════

const response = await chat({
  messages: [{ role: 'user', content: 'Analyze this contract for risk factors.' }],
  ventureId: 'futurestate-venture-uuid',
  model: 'anthropic/claude-3-opus',
  fallbackModels: [
    'openai/gpt-4o',
    'google/gemini-pro-1.5',
    'deepseek/deepseek-chat',
  ],
});

if (response.isFailover) {
  console.warn(`Primary model unavailable. Used fallback: ${response.model}`);
  console.warn(`Requested: ${response.requestedModel}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Cost-optimized routing
// ═══════════════════════════════════════════════════════════════════════════════

// For batch processing, optimize for cost
const responses = await Promise.all(
  documents.map(doc =>
    chat({
      messages: [
        { role: 'system', content: 'Extract key entities from this document.' },
        { role: 'user', content: doc.content },
      ],
      ventureId: 'serpspace-venture-uuid',
      routing: 'cheapest', // Always use the cheapest model that can handle it
    })
  )
);

const totalCost = responses.reduce((sum, r) => sum + r.cost.totalCost, 0);
console.log(`Batch processed ${documents.length} docs for $${totalCost.toFixed(4)}`);
```

### Budget Management

```typescript
import { checkBudget, getBudget, updateBudget, getAgentBudget } from '@mcv/intelligence/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Check budget before request
// ═══════════════════════════════════════════════════════════════════════════════

const budgetCheck = await checkBudget({
  ventureId: 'betedge-venture-uuid',
  estimatedCost: 0.05, // $0.05 estimated
  agentType: 'analyst',
});

if (!budgetCheck.allowed) {
  console.error(`Budget exceeded: ${budgetCheck.reason}`);
  // "Venture daily budget exceeded: $100.00 / $100.00"
  // or "Agent 'analyst' monthly budget exceeded: $200.00 / $200.00"
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Get venture budget status
// ═══════════════════════════════════════════════════════════════════════════════

const budget = await getBudget('betedge-venture-uuid');

console.log(`Daily: $${budget.dailySpentUsd} / $${budget.dailyLimitUsd}`);
console.log(`Monthly: $${budget.monthlySpentUsd} / $${budget.monthlyLimitUsd}`);
console.log(`Hard limit: ${budget.hardLimit ? 'YES (will block)' : 'NO (log only)'}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Update budget limits
// ═══════════════════════════════════════════════════════════════════════════════

await updateBudget('betedge-venture-uuid', {
  dailyLimitUsd: 200,
  monthlyLimitUsd: 5000,
  hardLimit: true, // Now enforce hard limits
  alertThresholdPercent: 75, // Alert at 75%
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Per-agent budget management
// ═══════════════════════════════════════════════════════════════════════════════

const agentBudget = await getAgentBudget('betedge-venture-uuid', 'queen');

console.log(`Queen Agent:`);
console.log(`  Daily: $${agentBudget.dailySpentUsd} / $${agentBudget.dailyLimitUsd}`);
console.log(`  Monthly tokens: ${agentBudget.monthlyTokensUsed}`);
console.log(`  Monthly requests: ${agentBudget.monthlyRequests}`);
console.log(`  Max tier: ${agentBudget.maxTier ?? 'unrestricted'}`);
console.log(`  Preferred tier: ${agentBudget.preferredTier ?? 'auto'}`);
```

### Usage Analytics

```typescript
import { getUsage, getCosts, getUsageSummary } from '@mcv/intelligence/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Query usage logs
// ═══════════════════════════════════════════════════════════════════════════════

const usage = await getUsage({
  ventureId: 'betedge-venture-uuid',
  dateFrom: startOfMonth(new Date()),
  dateTo: new Date(),
  agentType: 'queen', // Filter by agent
  status: 'completed',
  limit: 100,
});

for (const log of usage.logs) {
  console.log(`${log.createdAt}: ${log.model} — ${log.totalTokens} tokens — $${log.costUsd}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Cost breakdown
// ═══════════════════════════════════════════════════════════════════════════════

const costs = await getCosts({
  ventureId: 'betedge-venture-uuid',
  dateFrom: startOfMonth(new Date()),
  dateTo: new Date(),
  groupBy: 'model', // or 'agent', 'tier', 'day'
});

console.log('Cost breakdown by model:');
for (const item of costs.breakdown) {
  console.log(`  ${item.model}: $${item.totalCost.toFixed(2)} (${item.requests} requests)`);
}
console.log(`Total: $${costs.totalCost.toFixed(2)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Usage summary for dashboard
// ═══════════════════════════════════════════════════════════════════════════════

const summary = await getUsageSummary('betedge-venture-uuid', 'month');

console.log('Monthly Summary:');
console.log(`  Total requests: ${summary.totalRequests}`);
console.log(`  Total tokens: ${summary.totalTokens.toLocaleString()}`);
console.log(`  Total cost: $${summary.totalCost.toFixed(2)}`);
console.log(`  Avg latency: ${summary.avgLatencyMs}ms`);
console.log(`  Cache hit rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`);
console.log(`  Error rate: ${(summary.errorRate * 100).toFixed(2)}%`);
console.log(`  Most used model: ${summary.topModel}`);
console.log(`  Most active agent: ${summary.topAgent}`);
```

### Model Configuration (Admin)

```typescript
import { createModelConfig, updateModelConfig, listModelConfigs } from '@mcv/intelligence/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Add a new model
// ═══════════════════════════════════════════════════════════════════════════════

await createModelConfig({
  modelId: 'anthropic/claude-4-opus',
  provider: 'anthropic',
  displayName: 'Claude 4 Opus',
  tier: 2,
  priority: 10, // Highest priority in Premium tier
  inputCostPer1m: 15.0,
  outputCostPer1m: 75.0,
  contextWindow: 200000,
  supportsTools: true,
  supportsVision: true,
  supportsStreaming: true,
  enabled: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: List models by tier
// ═══════════════════════════════════════════════════════════════════════════════

const models = await listModelConfigs({ tier: 1, enabled: true });

console.log('Available Standard-tier models:');
for (const model of models) {
  console.log(`  ${model.displayName} (${model.modelId})`);
  console.log(`    Context: ${model.contextWindow.toLocaleString()} tokens`);
  console.log(`    Cost: $${model.inputCostPer1m}/M in, $${model.outputCostPer1m}/M out`);
  console.log(`    Tools: ${model.supportsTools}, Vision: ${model.supportsVision}`);
}
```

### Client-Side Usage (React)

```tsx
import { useChat, useStreamChat, useUsageDashboard } from '@mcv/intelligence/gateway/client';
import { ChatInterface, UsageDashboard, ModelSelector } from '@mcv/intelligence/gateway/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: Chat hook with streaming
// ═══════════════════════════════════════════════════════════════════════════════

function AIChatPage({ ventureId }: { ventureId: string }) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isStreaming,
    error,
    usage,
  } = useStreamChat({
    ventureId,
    model: 'auto',
    systemPrompt: 'You are a helpful assistant.',
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && <TypingIndicator />}
      </div>

      <div className="border-t p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); setInput(''); }}>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={isStreaming}
            />
            <Button type="submit" disabled={isStreaming || !input.trim()}>
              Send
            </Button>
          </div>
        </form>
        {usage && (
          <p className="text-xs text-muted-foreground mt-2">
            {usage.totalTokens} tokens • ${usage.totalCost.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 18: Usage dashboard component
// ═══════════════════════════════════════════════════════════════════════════════

function AIUsagePage({ ventureId }: { ventureId: string }) {
  const {
    summary,
    costBreakdown,
    timeSeries,
    isLoading,
  } = useUsageDashboard(ventureId, 'month');

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total Cost" value={`$${summary.totalCost.toFixed(2)}`} />
        <StatsCard title="Requests" value={summary.totalRequests.toLocaleString()} />
        <StatsCard title="Avg Latency" value={`${summary.avgLatencyMs}ms`} />
        <StatsCard title="Cache Hit Rate" value={`${(summary.cacheHitRate * 100).toFixed(1)}%`} />
      </div>

      {/* Cost breakdown chart */}
      <CostBreakdownChart data={costBreakdown} groupBy="model" />

      {/* Usage over time */}
      <UsageDashboard timeSeries={timeSeries} />
    </div>
  );
}
```

---

## Prompt Caching

The gateway supports provider-native prompt caching for significant cost savings:

| Provider | Cache Type | Savings | Requirements |
|----------|-----------|---------|-------------|
| **Anthropic** | Automatic | 90% on cached tokens | System prompt ≥1024 tokens |
| **OpenAI** | Automatic | 50% on cached tokens | Identical prefix matching |
| **Google** | Context caching | 75% on cached tokens | Explicit cache creation |

```typescript
// Caching is automatic for supported providers
const response = await chat({
  messages: [
    { role: 'system', content: longSystemPrompt }, // Cached after first call
    { role: 'user', content: 'Question 1' },
  ],
  ventureId: 'venture-uuid',
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
});

console.log(`Cached tokens: ${response.usage.cachedTokens}`);
console.log(`Cache savings: $${response.cost.cacheSavings?.toFixed(4)}`);
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Chat (non-streaming) | < 2s | < 5s |
| TTFT (streaming) | < 500ms | < 1.5s |
| Budget check | < 5ms | < 15ms |
| Complexity scoring | < 10ms | < 25ms |
| Model routing | < 5ms | < 10ms |
| Usage logging | < 2ms (async) | < 5ms |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Concurrent requests | 50 | 500+ |
| Requests/minute | 200 | 2,000+ |
| Daily requests | 50,000 | 500,000+ |

### Optimization Strategies

1. **Prompt caching** — 50-90% cost reduction on repeated system prompts
2. **Complexity routing** — Use Economy tier for 60%+ of requests
3. **Response caching** — Cache identical queries (opt-in, respects ZDR)
4. **Batch processing** — Group similar requests for throughput
5. **Connection pooling** — Reuse HTTP connections to OpenRouter

---

## Security Considerations

### Data Privacy

- **Zero Data Retention (ZDR)**: Optional per-request flag to prevent prompt/response storage
- **No training**: OpenRouter providers do not use MCV data for model training
- **PII filtering**: Optional automatic PII redaction before sending to providers
- **Audit logging**: Every request logged with full context for compliance

### Access Control

- Gateway requires valid venture context (ventureId)
- Agent-level budgets enforce per-agent spending limits
- Tier restrictions prevent agents from using expensive models
- Rate limiting prevents abuse and ensures fair usage

### API Key Management

- Single OpenRouter API key managed centrally
- Per-venture API keys for external access (Tier 6: Presentation)
- Key rotation without downtime
- IP allowlisting for production

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `gateway.chat.completed` | system | Successful chat completion |
| `gateway.chat.failed` | system | Failed chat completion |
| `gateway.chat.timeout` | system | Chat request timed out |
| `gateway.failover` | system | Primary model failed, used fallback |
| `gateway.budget.exceeded` | billing | Budget limit reached |
| `gateway.budget.alert` | billing | Budget threshold alert sent |
| `gateway.budget.updated` | admin | Budget limits changed |
| `gateway.model.created` | admin | New model configuration added |
| `gateway.model.updated` | admin | Model configuration changed |
| `gateway.model.disabled` | admin | Model disabled |
| `gateway.rate_limited` | security | Rate limit exceeded |
| `gateway.agent.disabled` | admin | Agent blocked from making requests |
| `gateway.weights.updated` | admin | Complexity weights changed |

---

## Environment Variables

```bash
# OpenRouter configuration
OPENROUTER_API_KEY=sk-or-v1-xxx              # OpenRouter API key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://mcv.one          # For provider rankings
OPENROUTER_APP_NAME=MCV.ONE                  # For provider dashboard

# Default settings
GATEWAY_DEFAULT_TIER=1                        # Default model tier
GATEWAY_DEFAULT_TEMPERATURE=0.7               # Default temperature
GATEWAY_DEFAULT_MAX_TOKENS=4096               # Default max output tokens
GATEWAY_TIMEOUT_MS=30000                      # Request timeout

# Budget defaults
GATEWAY_DEFAULT_DAILY_LIMIT=100               # Default venture daily limit (USD)
GATEWAY_DEFAULT_MONTHLY_LIMIT=2000            # Default venture monthly limit (USD)
GATEWAY_AGENT_DEFAULT_DAILY_LIMIT=10          # Default agent daily limit (USD)
GATEWAY_AGENT_DEFAULT_MONTHLY_LIMIT=200       # Default agent monthly limit (USD)

# Caching
GATEWAY_CACHE_ENABLED=true                    # Enable response caching
GATEWAY_CACHE_TTL=3600                        # Default cache TTL (seconds)

# Rate limiting
GATEWAY_RATE_LIMIT_RPM=100                    # Requests per minute per venture
GATEWAY_RATE_LIMIT_TPM=100000                 # Tokens per minute per venture

# Cron schedules
GATEWAY_BUDGET_RESET_DAILY_CRON="0 0 * * *"  # Midnight UTC
GATEWAY_BUDGET_RESET_MONTHLY_CRON="0 0 1 * *" # 1st of month, midnight UTC
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| openai | ^4.x | OpenRouter-compatible client SDK |
| drizzle-orm | ^0.29.x | Database ORM |
| ioredis | ^5.x | Response caching, rate limiting |
| zod | ^3.x | Request/response validation |
| uuid | ^9.x | Request ID generation |
| eventsource-parser | ^1.x | SSE stream parsing |

---

## Testing Notes

### Unit Testing

```typescript
import { scoreComplexity, routeModel, checkBudget } from '@mcv/intelligence/gateway';

describe('Complexity Scoring', () => {
  it('should route simple summarization to Economy tier', () => {
    const score = scoreComplexity({
      messages: [{ role: 'user', content: 'Summarize this paragraph.' }],
      tools: [],
    });

    expect(score.score).toBeLessThan(3.0);
    expect(score.recommendedTier).toBe(0);
  });

  it('should route multi-tool reasoning to Premium tier', () => {
    const score = scoreComplexity({
      messages: [
        { role: 'user', content: 'Analyze financial data, cross-reference with market trends, and generate projections.' },
      ],
      tools: [analysisTool, marketTool, projectionTool],
    });

    expect(score.score).toBeGreaterThan(6.5);
    expect(score.recommendedTier).toBeGreaterThanOrEqual(2);
  });
});

describe('Budget Service', () => {
  it('should block request when hard limit exceeded', async () => {
    // Setup: venture with $0.01 remaining
    const check = await checkBudget({
      ventureId: 'test-venture',
      estimatedCost: 0.05,
    });

    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('daily budget exceeded');
  });

  it('should allow request when within budget', async () => {
    const check = await checkBudget({
      ventureId: 'test-venture',
      estimatedCost: 0.01,
    });

    expect(check.allowed).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Gateway E2E', () => {
  it('should complete chat request and log usage', async () => {
    const response = await chat({
      messages: [{ role: 'user', content: 'Hello' }],
      ventureId: 'test-venture',
      tier: 0, // Economy for test speed
    });

    expect(response.content).toBeTruthy();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
    expect(response.cost.totalCost).toBeGreaterThan(0);
    expect(response.latencyMs).toBeGreaterThan(0);

    // Verify usage was logged
    const logs = await getUsage({
      ventureId: 'test-venture',
      requestId: response.requestId,
    });
    expect(logs.logs).toHaveLength(1);
  });

  it('should failover when primary model is unavailable', async () => {
    const response = await chat({
      messages: [{ role: 'user', content: 'Test' }],
      ventureId: 'test-venture',
      model: 'nonexistent/model-that-will-fail',
      fallbackModels: ['openai/gpt-4o-mini'],
    });

    expect(response.isFailover).toBe(true);
    expect(response.model).toBe('openai/gpt-4o-mini');
  });
});
```

---

*@mcv/intelligence/gateway — Unified AI Gateway Module*
