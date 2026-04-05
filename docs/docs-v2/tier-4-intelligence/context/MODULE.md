# @mcv/intelligence/context — Context Assembly Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Core)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `context` module handles the assembly of complete, token-optimized prompts from multiple data sources. It manages token budgets across model context windows, prioritizes context sources (system prompt → real-time data → RAG → history → user message), injects dynamic venture and user data, compresses conversation history, and renders prompt templates. Every LLM request in MCV flows through context assembly before reaching the gateway.

**This module ensures every AI response is informed by the right context within token limits.**

### Why Context Assembly Matters

Without centralized context assembly, every feature that calls an LLM would need to independently:

1. **Count tokens** — Each model has different context windows (4K–2M tokens). Exceeding them causes silent truncation or errors.
2. **Prioritize information** — When context exceeds the budget, *what* gets dropped matters enormously. A system prompt should never be truncated; old conversation history can be summarized.
3. **Inject dynamic data** — User profiles, venture settings, timezone, permissions, and real-time data must be woven into prompts consistently.
4. **Compress history** — Long conversations must be intelligently compressed without losing critical context.
5. **Render templates** — Prompt templates with variables, conditionals, and loops need consistent rendering.

The context module centralizes all of this into a single, well-tested pipeline that every AI feature uses.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Never truncate sacred content** | System prompts and the user's current message are never truncated. If they alone exceed the budget, the module raises an error rather than silently corrupting the prompt. |
| **Priority-based degradation** | When the token budget is tight, the module drops context in priority order: oldest history first, then RAG chunks by relevance score, then real-time data. |
| **Model-aware counting** | Token counting uses the correct tokenizer for each model family (cl100k_base for OpenAI, Claude tokenizer for Anthropic, etc.). |
| **Stateless by default** | Most operations are pure functions. The `ContextManager` class provides an optional stateful wrapper for conversation flows. |
| **Cost awareness** | Every assembly includes estimated input cost so callers can make informed decisions before sending to the gateway. |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════════

export {
  assembleContext,          // Build complete prompt from multiple sources
  assembleMessages,         // Assemble ChatMessage array with token management
  buildSystemPrompt,        // Build system prompt with injected data
} from './server/services/assembly-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  countTokens,              // Count tokens in text or messages
  estimateTokens,           // Fast approximate token count
  estimateCost,             // Estimate cost for token count + model
  getTokenLimit,            // Get context window for a model
  fitToTokenBudget,         // Truncate content to fit token budget
} from './server/services/token-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  truncateContext,           // Truncate messages to fit token limit
  summarizeContext,          // Summarize old messages via LLM
  compressHistory,           // Compress conversation history
  pruneMessages,             // Remove low-priority messages
} from './server/services/optimization-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export {
  renderTemplate,            // Render prompt template with variables
  createTemplate,            // Create a reusable template
  listTemplates,             // List available templates
  getTemplate,               // Get template by ID
  validateTemplate,          // Validate template syntax
} from './server/services/template-service';

// ═══════════════════════════════════════════════════════════════════════════════
// DATA INJECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  injectUserContext,         // Inject user profile and preferences
  injectVentureContext,      // Inject venture settings and branding
  injectTemporalContext,     // Inject current time, timezone, date
  injectRAGContext,          // Inject retrieved knowledge chunks
  registerContextSource,     // Register a custom context source
} from './server/services/injection-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ContextManager,            // Stateful context manager for conversations
  createContext,             // Factory for ContextManager
} from './server/context-manager';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useContextManager } from './client/hooks/use-context-manager';
export { useTokenCounter } from './client/hooks/use-token-counter';
export { useTemplateEditor } from './client/hooks/use-template-editor';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { TokenCounter } from './client/components/token-counter';
export { ContextDebugger } from './client/components/context-debugger';
export { TemplateEditor } from './client/components/template-editor';
export { ContextBudgetBar } from './client/components/context-budget-bar';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DEFAULT_CONTEXT_PRIORITIES,
  TOKEN_ENCODINGS,
  SUPPORTED_MODELS,
  CONTEXT_SOURCE_TYPES,
  MAX_HISTORY_MESSAGES,
  SACRED_ROLES,
  DEFAULT_RESERVE_TOKENS,
  CHARS_PER_TOKEN_ESTIMATE,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  AssemblyRequest,
  AssemblyResult,
  ContextSource,
  ContextSourceType,
  ContextPriority,
  TokenCount,
  TokenBudget,
  TokenBudgetAllocation,
  TruncationStrategy,
  CompressionResult,
  PromptTemplate,
  TemplateVariable,
  ContextManagerConfig,
  ContextManagerState,
  InjectionResult,
  OptimizationReport,
  ContextDebugInfo,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT ASSEMBLY ARCHITECTURE                                │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CONTEXT SOURCES (by priority)                         │   │
│  │                                                                               │   │
│  │  ┌─── P0 ────┐  ┌─── P1 ────┐  ┌─── P2 ────┐  ┌─── P3 ────┐  ┌── P4 ──┐  │   │
│  │  │  SYSTEM    │  │ REAL-TIME │  │    RAG     │  │ HISTORY   │  │  USER  │  │   │
│  │  │  PROMPT    │  │   DATA    │  │  CONTEXT   │  │           │  │MESSAGE │  │   │
│  │  │            │  │           │  │            │  │           │  │        │  │   │
│  │  │• Persona   │  │• Timestamp│  │• Retrieved │  │• Recent   │  │• Query │  │   │
│  │  │• Safety    │  │• User     │  │  chunks    │  │  messages │  │• Input │  │   │
│  │  │• Template  │  │  profile  │  │• Knowledge │  │• Summaries│  │        │  │   │
│  │  │• Rules     │  │• Venture  │  │  graph     │  │• Older    │  │[NEVER  │  │   │
│  │  │            │  │  config   │  │• Memories  │  │  context  │  │ TRUNC] │  │   │
│  │  │[NEVER     │  │• Timezone │  │            │  │           │  │        │  │   │
│  │  │ TRUNCATED] │  │• Perms    │  │[TRUNCATE   │  │[COMPRESS  │  │        │  │   │
│  │  │            │  │           │  │ IF NEEDED] │  │ OR DROP]  │  │        │  │   │
│  │  └─────┬──────┘  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └───┬────┘  │   │
│  │        │               │               │               │            │        │   │
│  │        └───────────────┴───────────────┴───────────────┴────────────┘        │   │
│  │                                        │                                      │   │
│  └────────────────────────────────────────┼──────────────────────────────────────┘   │
│                                           │                                          │
│  ┌────────────────────────────────────────▼──────────────────────────────────────┐   │
│  │                         ASSEMBLY PIPELINE                                      │   │
│  │                                                                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │  1.      │  │  2.      │  │  3.      │  │  4.      │  │  5.      │       │   │
│  │  │ Resolve  │─▶│ Inject   │─▶│  Count   │─▶│ Optimize │─▶│ Assemble │       │   │
│  │  │ Sources  │  │ Data     │  │ Tokens   │  │ & Fit    │  │ Messages │       │   │
│  │  │          │  │          │  │          │  │          │  │          │       │   │
│  │  │• Fetch   │  │• User    │  │• Exact   │  │• Truncate│  │• Ordered │       │   │
│  │  │  all     │  │• Venture │  │  count   │  │• Compress│  │  array   │       │   │
│  │  │  sources │  │• Time    │  │  per     │  │• Prune   │  │• Ready   │       │   │
│  │  │• Priorit.│  │• RAG     │  │  source  │  │• Summariz│  │  for LLM │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │   │
│  │                                                                                │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         TOKEN BUDGET ALLOCATION                                 │   │
│  │                                                                                 │   │
│  │  Model Context Window: 128,000 tokens (example: Claude 3.5 Sonnet)             │   │
│  │                                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ System [4K] │ Realtime [1K] │ RAG [8K] │ History [8K] │ User [1K] │ Res│  │   │
│  │  │  FIXED      │  FIXED        │ FLEXIBLE │  COMPRESSIBLE │ FIXED     │4K  │  │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │   │
│  │  ◄──────────────── Input Budget: 22K ──────────────────────► ◄── Reserve ──►  │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                    INTERCONNECTION WITH OTHER MODULES                            │   │
│  │                                                                                  │   │
│  │  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────────────┐ │   │
│  │  │  @mcv/kernel     │    │  @mcv/intel/rag    │    │  @mcv/intel/gateway      │ │   │
│  │  │                  │    │                    │    │                          │ │   │
│  │  │  • users table   │    │  • fileSearchStores│    │  • modelConfigs (ctx     │ │   │
│  │  │  • ventures table│    │  • retrieval API   │    │    window, tokenizer)    │ │   │
│  │  │  • aiAgents table│    │  • chunk results   │    │  • chat() consumes      │ │   │
│  │  │  • aiPrompts     │    │                    │    │    assembled messages    │ │   │
│  │  │  • aiConversation│    │                    │    │                          │ │   │
│  │  └──────────┬───────┘    └────────┬──────────┘    └────────────┬─────────────┘ │   │
│  │             │                     │                            │                │   │
│  │             └─────────────────────┴────────────────────────────┘                │   │
│  │                                   │                                             │   │
│  │                          context assembly                                       │   │
│  │                       reads from all three,                                     │   │
│  │                       outputs to gateway                                        │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Assembly Pipeline Detail

The pipeline executes in 5 sequential stages with clear data flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE-BY-STAGE DATA FLOW                      │
│                                                                  │
│  INPUT:                                                          │
│    AssemblyRequest {                                             │
│      systemPrompt, userMessage, ventureId, userId,              │
│      model, history[], ragResults[], templateVariables          │
│    }                                                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ STAGE 1: Resolve Sources                                  │   │
│  │                                                           │   │
│  │   • Parse systemPrompt (raw text or template ID)         │   │
│  │   • Look up model in modelConfigs → contextWindow        │   │
│  │   • Calculate available budget:                           │   │
│  │       budget = contextWindow - reserveTokens              │   │
│  │   • Collect all requested sources into ContextSource[]    │   │
│  │   • Sort by priority (P0 → P4)                           │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                 │                                │
│  ┌──────────────────────────────▼───────────────────────────┐   │
│  │ STAGE 2: Inject Data                                      │   │
│  │                                                           │   │
│  │   • injectTemporalContext(timezone) → time variables      │   │
│  │   • injectUserContext(userId) → user profile data         │   │
│  │   • injectVentureContext(ventureId) → venture settings    │   │
│  │   • injectRAGContext(ragResults) → formatted chunks       │   │
│  │   • renderTemplate(systemPrompt, allVariables)            │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                 │                                │
│  ┌──────────────────────────────▼───────────────────────────┐   │
│  │ STAGE 3: Count Tokens                                     │   │
│  │                                                           │   │
│  │   For each source, call countTokens(content, model):      │   │
│  │     system:   450 tokens  [SACRED - never truncate]       │   │
│  │     realtime: 120 tokens  [SACRED]                        │   │
│  │     rag:      3,200 tokens  [FLEXIBLE]                    │   │
│  │     history:  8,500 tokens  [COMPRESSIBLE]                │   │
│  │     user:     35 tokens   [SACRED - never truncate]       │   │
│  │     ─────────────────────────────────────                 │   │
│  │     total:    12,305 tokens                               │   │
│  │     budget:   22,000 tokens                               │   │
│  │     → FITS (no optimization needed)                       │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                 │                                │
│  ┌──────────────────────────────▼───────────────────────────┐   │
│  │ STAGE 4: Optimize & Fit                                   │   │
│  │                                                           │   │
│  │   IF total > budget:                                      │   │
│  │     1. Prune low-relevance RAG chunks                     │   │
│  │     2. Truncate history (oldest first)                    │   │
│  │     3. Compress history via summarization                 │   │
│  │     4. If STILL over: drop custom sources by priority     │   │
│  │     5. If STILL over: raise CTX_OVER_BUDGET error         │   │
│  │                                                           │   │
│  │   Sacred content (system + user) is NEVER touched.        │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                 │                                │
│  ┌──────────────────────────────▼───────────────────────────┐   │
│  │ STAGE 5: Assemble Messages                                │   │
│  │                                                           │   │
│  │   Build final ChatMessage[]:                              │   │
│  │     [0] { role: 'system', content: renderedSystemPrompt } │   │
│  │     [1] { role: 'system', content: realtimeData }         │   │
│  │     [2] { role: 'system', content: ragContext }            │   │
│  │     [3] { role: 'user', content: historySummary }          │   │
│  │     [4..N] history messages (recent, verbatim)            │   │
│  │     [N+1] { role: 'user', content: userMessage }          │   │
│  │                                                           │   │
│  │   Return AssemblyResult with messages + metadata          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OUTPUT:                                                         │
│    AssemblyResult {                                              │
│      messages: ChatMessage[],                                    │
│      tokenBreakdown: { system, realtime, rag, history, user },  │
│      budget: { modelLimit, reserved, available, used, remain },  │
│      optimizations: { truncated, summarized, pruned },           │
│      estimatedInputCost: number                                  │
│    }                                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Context Priority System

The module uses a numeric priority system where **lower numbers = higher priority** (P0 is most important):

| Priority | Source | Description | Behavior Under Budget Pressure |
|----------|--------|-------------|-------------------------------|
| **P0** | System Prompt | Agent persona, safety rules, instructions | **NEVER truncated.** If system + user alone exceed budget, error is raised. |
| **P0** | User Message | The user's current query/input | **NEVER truncated.** Sacred content. |
| **P1** | Real-time Data | Timestamp, user profile, venture config, permissions | Dropped last among non-sacred sources. Usually small (<1K tokens). |
| **P2** | RAG Context | Retrieved knowledge chunks, memories | Truncated by removing lowest-relevance chunks first. |
| **P3** | Conversation History | Previous messages in the conversation | Compressed via summarization, then truncated (oldest first). Recent N messages kept verbatim. |
| **P4** | Custom Sources | User-registered context sources (e.g., recent bets, analytics) | Dropped first when budget is tight. |

### Budget Allocation Strategy

When the model context window is known (via `modelConfigs.contextWindow`), the module allocates budget as follows:

```
Available Budget = Context Window - Reserved for Response

Allocation order (greedy):
  1. System prompt:  exact token count (no limit, but monitored)
  2. User message:   exact token count (no limit)
  3. Real-time data: exact token count (typically < 1K)
  4. Remaining budget split between RAG + History:
     - RAG gets min(ragTokens, maxRagBudget)
     - History gets the rest
  5. Custom sources fill any remaining gaps
```

---

## Core Interfaces

### AssemblyRequest

```typescript
interface AssemblyRequest {
  // ═══════════════════════════════════════════════════════════════════════════
  // PROMPTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** System prompt text, or template ID prefixed with 'template:' */
  systemPrompt: string;

  /** User's current message (sacred — never truncated) */
  userMessage: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Venture context for injection and data access */
  ventureId: string;

  /** User context for injection (optional for system/agent requests) */
  userId?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL & TOKEN BUDGET
  // ═══════════════════════════════════════════════════════════════════════════

  /** Model ID for token counting and context window lookup */
  model: string;

  /** Override max tokens (defaults to model's context window) */
  maxTokens?: number;

  /** Tokens to reserve for the response (default: 4096) */
  reserveTokens?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT SOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Context sources to include beyond system + user */
  sources?: ContextSourceType[];          // Default: ['realtime', 'rag', 'history']

  /** Conversation history messages */
  history?: ChatMessage[];

  /** RAG retrieval results to include */
  ragResults?: RetrievalResult[];

  /** Custom context data keyed by source name */
  customContext?: Record<string, string>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE VARIABLES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Variables for template rendering (merged with injected data) */
  templateVariables?: Record<string, unknown>;

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMIZATION OPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Truncation strategy when over budget (default: 'smart') */
  truncationStrategy?: TruncationStrategy;

  /** Compress old history via LLM summarization (default: true) */
  compressHistory?: boolean;

  /** Model for history summarization (default: economy tier) */
  compressionModel?: string;

  /** Number of recent messages to always keep verbatim (default: 6) */
  recentWindowSize?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET ALLOCATION OVERRIDES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Max tokens for RAG context (default: auto-calculated) */
  maxRagTokens?: number;

  /** Max tokens for conversation history (default: auto-calculated) */
  maxHistoryTokens?: number;

  /** Max tokens for custom context sources (default: 2000) */
  maxCustomTokens?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG
  // ═══════════════════════════════════════════════════════════════════════════

  /** Include detailed debug information in result */
  debug?: boolean;
}
```

### AssemblyResult

```typescript
interface AssemblyResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUT MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Assembled messages array ready for the gateway */
  messages: ChatMessage[];

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN BREAKDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  /** Token count per source category */
  tokenBreakdown: {
    system: number;       // System prompt tokens
    realtime: number;     // Injected real-time data tokens
    rag: number;          // RAG context tokens
    history: number;      // Conversation history tokens (after optimization)
    user: number;         // User message tokens
    custom: number;       // Custom source tokens
    total: number;        // Total input tokens
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET INFO
  // ═══════════════════════════════════════════════════════════════════════════

  /** Token budget allocation and usage */
  budget: {
    modelLimit: number;             // Model's context window
    reservedForResponse: number;    // Tokens reserved for output
    availableForInput: number;      // modelLimit - reserved
    used: number;                   // Actual input tokens used
    remaining: number;              // availableForInput - used
    utilizationPercent: number;     // (used / availableForInput) × 100
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMIZATION REPORT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Actions taken to fit context within budget */
  optimizations: {
    historyTruncated: boolean;          // Were history messages removed?
    historySummarized: boolean;         // Was history compressed via LLM?
    ragTruncated: boolean;              // Were RAG chunks removed?
    ragChunksDropped: number;           // How many RAG chunks were dropped
    messagesPruned: number;             // Total messages removed
    customSourcesDropped: string[];     // Custom sources that were dropped
    originalHistoryTokens: number;      // History tokens before optimization
    optimizedHistoryTokens: number;     // History tokens after optimization
    compressionRatio: number;           // original / optimized (> 1 means compressed)
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COST ESTIMATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Estimated cost based on model pricing from modelConfigs */
  estimatedInputCost: number;           // USD for input tokens
  estimatedTotalCost: number;           // USD for input + estimated output

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG (only populated when debug: true)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Detailed debug information for development */
  debugInfo?: ContextDebugInfo;
}
```

### ContextManagerConfig

```typescript
interface ContextManagerConfig {
  /** Maximum token budget for the context window */
  maxTokens: number;

  /** Tokens reserved for LLM response (default: 4096) */
  reserveTokens: number;

  /** Model for token counting (determines tokenizer) */
  model: string;

  /** System prompt (rendered with variables) */
  systemPrompt?: string;

  /** Template ID instead of raw system prompt */
  templateId?: string;

  /** Default template variables */
  templateVariables?: Record<string, unknown>;

  /** Truncation strategy */
  truncationStrategy?: TruncationStrategy;

  /** Enable automatic history compression */
  autoCompress?: boolean;               // Default: true

  /** Max messages before compression triggers */
  compressAfterMessages?: number;       // Default: 20

  /** Number of recent messages to keep verbatim during compression */
  recentWindowSize?: number;            // Default: 10

  /** Model for summarization (default: economy tier) */
  compressionModel?: string;

  /** Venture ID for context injection */
  ventureId?: string;

  /** User ID for context injection */
  userId?: string;
}

type TruncationStrategy =
  | 'fifo'          // Remove oldest messages first (simplest)
  | 'importance'    // Remove least important messages first (uses heuristics)
  | 'smart'         // Summarize old, keep recent, never truncate system/user
  | 'sliding';      // Fixed sliding window of N recent messages
```

### ContextManager State

```typescript
interface ContextManagerState {
  /** Configuration snapshot */
  config: ContextManagerConfig;

  /** All messages in the conversation (including summaries) */
  messages: ChatMessage[];

  /** Summary of compressed messages (null if no compression yet) */
  historySummary: string | null;

  /** Number of original messages that were summarized */
  summarizedMessageCount: number;

  /** Current total token count */
  tokenCount: number;

  /** Dynamic context data injected by caller */
  contextData: Record<string, unknown>;

  /** Serialization version for state migration */
  version: number;

  /** Timestamp of last modification */
  lastModified: Date;
}
```

### TokenCount

```typescript
interface TokenCount {
  /** Number of input tokens */
  input: number;

  /** Estimated output tokens (if applicable) */
  estimatedOutput?: number;

  /** Token encoding used */
  encoding: string;                     // 'cl100k_base' | 'claude' | 'gemini' | etc.

  /** Model used for counting */
  model: string;

  /** Whether this is an exact count or estimate */
  isExact: boolean;
}
```

### TokenBudgetAllocation

```typescript
interface TokenBudgetAllocation {
  /** Category name */
  category: ContextSourceType;

  /** Maximum tokens allocated for this category */
  maxTokens: number;

  /** Actual tokens used */
  usedTokens: number;

  /** Whether this category's content was truncated or compressed */
  wasOptimized: boolean;

  /** Is this category sacred (never truncated)? */
  isSacred: boolean;
}
```

### PromptTemplate

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;                      // Template with {{variable}} placeholders
  variables: TemplateVariable[];        // Declared variables
  ventureId: string | null;             // null = global template
  category: string;                     // 'system' | 'rag' | 'chat' | 'agent'
  version: number;
  isSystem: boolean;                    // System templates cannot be deleted
  usageCount: number;                   // How many times this template has been rendered
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariable {
  name: string;                         // e.g., 'user.name', 'venture.domain'
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: unknown;
  description: string;
  validation?: string;                  // Optional Zod schema string
}
```

### ContextSource

```typescript
interface ContextSource {
  /** Unique name for this source */
  name: string;

  /** Priority level (lower = higher priority) */
  priority: number;

  /** Maximum tokens this source can consume */
  maxTokens: number;

  /** Whether this source's content should never be truncated */
  sacred: boolean;

  /** Async function that fetches the content for this source */
  fetch: (ventureId: string, userId?: string) => Promise<string>;

  /** Content type hint for formatting */
  contentType?: 'text' | 'json' | 'markdown';

  /** Cache TTL in seconds (0 = no cache) */
  cacheTtl?: number;
}

type ContextSourceType =
  | 'system'
  | 'realtime'
  | 'rag'
  | 'history'
  | 'user'
  | 'custom';
```

### CompressionResult

```typescript
interface CompressionResult {
  /** Compressed messages array */
  messages: ChatMessage[];

  /** The generated summary text */
  summary: string;

  /** Token count after compression */
  tokenCount: number;

  /** Token count before compression */
  originalTokenCount: number;

  /** Compression ratio (original / compressed) */
  ratio: number;

  /** Number of messages that were summarized */
  messagesSummarized: number;

  /** Number of messages kept verbatim (recent window) */
  messagesKeptVerbatim: number;

  /** Model used for summarization */
  compressionModel: string;

  /** Cost of the summarization LLM call */
  compressionCostUsd: number;
}
```

### ContextDebugInfo

```typescript
interface ContextDebugInfo {
  /** Step-by-step trace of the assembly pipeline */
  pipelineTrace: Array<{
    stage: string;
    durationMs: number;
    details: Record<string, unknown>;
  }>;

  /** Per-source token allocation breakdown */
  allocations: TokenBudgetAllocation[];

  /** Raw content for each source (before assembly) */
  rawSources: Record<string, string>;

  /** Template rendering result (before injection) */
  renderedTemplate: string;

  /** All injected variables */
  injectedVariables: Record<string, unknown>;

  /** Optimization decisions log */
  optimizationLog: string[];
}
```

---

## Database Schema

The context module is **primarily stateless** — it assembles context on-the-fly from other modules' data. It does not define its own database tables. However, it reads from several key tables:

### Prompt Templates → ai_prompts Table

Prompt templates are stored in the `ai_prompts` table (defined in `@mcv/db/schema/ai-command`):

```typescript
export const aiPrompts = pgTable("ai_prompts", {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture that owns this template
  ventureId: text("venture_id").notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable name
  name: text("name").notNull(),

  // Optional description
  description: text("description"),

  // The prompt template with {{variables}} placeholders
  content: text("content").notNull(),

  // Detected/declared variables (auto-extracted from content)
  variables: jsonb("variables").$type<string[]>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // System templates cannot be deleted by users
  isSystem: boolean("is_system").default(false),

  // Category for organization: 'general', 'system', 'rag', 'chat', 'agent'
  category: text("category").default("general"),

  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  // How many times this template has been rendered
  usageCount: integer("usage_count").default(0),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Conversation History → ai_conversations Table

The context module reads conversation history from `ai_conversations`:

```typescript
export const aiConversations = pgTable("ai_conversations", {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),
  userId: text("user_id"),

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENT CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  // Primary agent handling the conversation (usually Queen)
  agentId: text("agent_id").references(() => aiAgents.id),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Conversation title/subject
  title: text("title"),

  // Array of message objects (ChatMessage[])
  messages: jsonb("messages"),

  // Attached entities, current page, user state, etc.
  // This is the "context snapshot" that the context module reads
  context: jsonb("context"),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  status: text("status").default("active").notNull(),  // 'active' | 'archived'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Agent System Prompts → ai_agents Table

Agent personas and system prompts are read from `ai_agents`:

```typescript
export const aiAgents = pgTable("ai_agents", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  ventureId: text("venture_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),             // queen, ralph, hephaestus, scout, talos, custom
  status: text("status").default("idle").notNull(),
  model: text("model").notNull(),           // Target model ID
  systemPrompt: text("system_prompt").notNull(),  // Agent's persona prompt
  skills: jsonb("skills").$type<string[]>(),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Model Context Windows → model_configs Table

The context module reads model context windows from `model_configs` (defined in `@mcv/db/schema/gateway`):

```typescript
export const modelConfigs = pgTable('model_configs', {
  modelId: varchar('model_id', { length: 128 }).notNull(),
  contextWindow: integer('context_window').notNull(),     // Used for budget calculation
  inputCostPer1m: decimal('input_cost_per_1m', { precision: 10, scale: 4 }).notNull(),
  outputCostPer1m: decimal('output_cost_per_1m', { precision: 10, scale: 4 }).notNull(),
  // ... (see gateway MODULE.md for full schema)
});
```

### Context Data Sources Summary

| Data Source | Table | What the Context Module Reads |
|-------------|-------|------------------------------|
| System prompts | `ai_agents` | `systemPrompt` field for agent persona |
| Prompt templates | `ai_prompts` | `content`, `variables` for template rendering |
| Conversation history | `ai_conversations` | `messages` JSON array, `context` snapshot |
| Model config | `model_configs` | `contextWindow`, `inputCostPer1m` for budget math |
| User profile | `users` | Name, email, role, timezone for injection |
| Venture settings | `ventures` | Name, domain, config for injection |
| RAG results | (runtime) | Passed in via `ragResults` parameter, not from DB |

---

## Usage Examples

### Basic Context Assembly

```typescript
import { assembleContext, countTokens, estimateCost } from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Assemble context for a chat request
// ═══════════════════════════════════════════════════════════════════════════════

const assembled = await assembleContext({
  systemPrompt: `You are a helpful assistant for {{venture.name}}.
Current time: {{time.now}}
User: {{user.name}} ({{user.role}})`,
  userMessage: 'What are my recent orders?',
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  model: 'anthropic/claude-3.5-sonnet',
  maxTokens: 128000,
  reserveTokens: 4096,
  sources: ['realtime', 'history'],
  history: conversationMessages,
  templateVariables: {},
});

console.log(`Assembled ${assembled.messages.length} messages`);
console.log(`Token breakdown:`, assembled.tokenBreakdown);
// { system: 450, realtime: 120, rag: 0, history: 2800, user: 35, custom: 0, total: 3405 }
console.log(`Budget: ${assembled.budget.used} / ${assembled.budget.availableForInput} tokens`);
console.log(`Utilization: ${assembled.budget.utilizationPercent.toFixed(1)}%`);

// Pass to gateway
const response = await chat({
  messages: assembled.messages,
  ventureId: 'betedge-venture-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Assemble with RAG context
// ═══════════════════════════════════════════════════════════════════════════════

const ragResults = await retrieve({
  query: 'How do I reset my password?',
  storeIds: ['help-store-uuid'],
  ventureId: 'betedge-venture-uuid',
  topK: 5,
});

const assembled = await assembleContext({
  systemPrompt: 'Answer based only on the provided context. Cite sources.',
  userMessage: 'How do I reset my password?',
  ventureId: 'betedge-venture-uuid',
  model: 'anthropic/claude-3.5-sonnet',
  sources: ['realtime', 'rag'],
  ragResults,
});

console.log(`RAG context: ${assembled.tokenBreakdown.rag} tokens`);
console.log(`RAG chunks used: ${ragResults.length - assembled.optimizations.ragChunksDropped}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Assemble with debug info for development
// ═══════════════════════════════════════════════════════════════════════════════

const assembled = await assembleContext({
  systemPrompt: 'You are a helpful assistant.',
  userMessage: 'Hello!',
  ventureId: 'test-venture',
  model: 'deepseek/deepseek-chat',
  debug: true,  // Enable debug output
});

if (assembled.debugInfo) {
  console.log('Pipeline trace:');
  for (const step of assembled.debugInfo.pipelineTrace) {
    console.log(`  ${step.stage}: ${step.durationMs}ms`);
  }
  console.log('Injected variables:', assembled.debugInfo.injectedVariables);
  console.log('Optimization log:', assembled.debugInfo.optimizationLog);
}
```

### Token Management

```typescript
import {
  countTokens,
  estimateTokens,
  estimateCost,
  fitToTokenBudget,
  getTokenLimit,
} from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Count tokens precisely
// ═══════════════════════════════════════════════════════════════════════════════

const tokens = countTokens(
  'The quick brown fox jumps over the lazy dog.',
  'anthropic/claude-3.5-sonnet'
);
console.log(`Tokens: ${tokens.input}`);           // 10
console.log(`Encoding: ${tokens.encoding}`);       // 'claude'
console.log(`Exact: ${tokens.isExact}`);           // true

// Count tokens in a message array (includes message framing overhead)
const messageTokens = countTokens([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
], 'openai/gpt-4o');
console.log(`Input tokens: ${messageTokens.input}`);  // ~15 (includes role tokens)

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Fast approximate token count (for UI feedback)
// ═══════════════════════════════════════════════════════════════════════════════

// estimateTokens is synchronous and ~100x faster than countTokens
const estimate = estimateTokens('A very long document...');
console.log(`Estimated: ~${estimate} tokens`);
// Uses: Math.ceil(text.length * 0.25) by default

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Estimate cost before sending
// ═══════════════════════════════════════════════════════════════════════════════

const cost = estimateCost(
  { input: 5000, estimatedOutput: 2000 },
  'anthropic/claude-3.5-sonnet'
);
console.log(`Input cost: $${cost.inputCost.toFixed(4)}`);
console.log(`Output cost: $${cost.outputCost.toFixed(4)}`);
console.log(`Total: $${cost.totalCost.toFixed(4)}`);
// Reads pricing from modelConfigs table

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Fit text to a token budget
// ═══════════════════════════════════════════════════════════════════════════════

const modelLimit = getTokenLimit('anthropic/claude-3.5-sonnet'); // 200000

const fitted = fitToTokenBudget(longDocument, {
  maxTokens: 8000,
  model: 'anthropic/claude-3.5-sonnet',
  strategy: 'end',      // Keep end (most recent), truncate from start
  ellipsis: true,        // Add '...' at truncation point
  preserveWords: true,   // Don't cut words in half
});

console.log(`Original: ${countTokens(longDocument, model).input} tokens`);
console.log(`Fitted: ${fitted.tokenCount} tokens`);
console.log(`Truncated: ${fitted.wasTruncated}`);
console.log(fitted.text);  // "...most recent part of the document"
```

### Context Optimization

```typescript
import {
  truncateContext,
  summarizeContext,
  compressHistory,
  pruneMessages,
} from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Truncate conversation history
// ═══════════════════════════════════════════════════════════════════════════════

const truncated = truncateContext(messages, {
  maxTokens: 4000,
  model: 'anthropic/claude-3.5-sonnet',
  strategy: 'fifo',         // Remove oldest first
  preserveSystem: true,      // Never truncate system prompt
  preserveLastN: 4,          // Always keep last 4 messages
});

console.log(`Truncated from ${messages.length} to ${truncated.messages.length} messages`);
console.log(`Removed: ${truncated.removedCount} messages`);
console.log(`Token count: ${truncated.tokenCount} / 4000`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Summarize old conversation history via LLM
// ═══════════════════════════════════════════════════════════════════════════════

const summarized = await summarizeContext(messages, {
  model: 'deepseek/deepseek-chat',    // Economy model for summarization
  targetTokens: 500,                   // Target summary length
  keepRecentMessages: 6,               // Keep last 6 messages verbatim
});

// Result: [system_message, summary_message, ...last_6_messages]
console.log(`Compressed to ${summarized.tokenCount} tokens (was ${originalTokenCount})`);
console.log(`Summary: ${summarized.summary}`);
console.log(`Compression ratio: ${summarized.ratio.toFixed(1)}x`);
console.log(`Summarization cost: $${summarized.compressionCostUsd.toFixed(6)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Smart automatic history compression
// ═══════════════════════════════════════════════════════════════════════════════

const compressed = await compressHistory(messages, {
  model: 'anthropic/claude-3.5-sonnet',
  maxTokens: 8000,
  compressionModel: 'deepseek/deepseek-chat',
  strategy: 'smart',          // Summarize old, keep recent verbatim
  recentWindowSize: 10,        // Keep last 10 messages verbatim
});

console.log(`Compression ratio: ${compressed.ratio.toFixed(1)}x`);
console.log(`Messages: ${compressed.messagesSummarized} summarized, ${compressed.messagesKeptVerbatim} kept`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Prune low-importance messages
// ═══════════════════════════════════════════════════════════════════════════════

const pruned = pruneMessages(messages, {
  maxTokens: 6000,
  model: 'openai/gpt-4o',
  criteria: [
    'remove_empty_messages',       // Remove messages with empty content
    'remove_tool_calls',           // Remove tool call/response pairs
    'prefer_recent',               // Weight recent messages higher
    'preserve_user_questions',     // Keep user questions over assistant responses
  ],
});

console.log(`Pruned from ${messages.length} to ${pruned.messages.length}`);
```

### Template System

```typescript
import {
  renderTemplate,
  createTemplate,
  validateTemplate,
  listTemplates,
  getTemplate,
} from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Render a prompt template with variables
// ═══════════════════════════════════════════════════════════════════════════════

const rendered = renderTemplate(
  `You are {{agent.name}}, an AI assistant for {{venture.name}}.
Your personality: {{persona.description}}

Rules:
{{#each rules}}
- {{this}}
{{/each}}

Current context:
- Time: {{time.now}}
- User: {{user.name}} ({{user.plan}} plan)
- Language: {{user.language}}`,
  {
    agent: { name: 'Atlas' },
    venture: { name: 'BetEdge' },
    persona: { description: 'Friendly, knowledgeable sports analytics expert' },
    rules: [
      'Always cite data sources',
      'Never give financial advice',
      'Respond in the user\'s language',
    ],
    time: { now: new Date().toISOString() },
    user: { name: 'John', plan: 'Pro', language: 'en' },
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Create and manage reusable templates
// ═══════════════════════════════════════════════════════════════════════════════

// Validate template syntax first
const validation = validateTemplate(`
{{#if user.isPro}}
Premium features available.
{{else}}
Upgrade to Pro for more features.
{{/if}}
{{#each tools}}
- {{this.name}}: {{this.description}}
{{/each}}
`);

if (!validation.isValid) {
  console.error('Template errors:', validation.errors);
} else {
  console.log('Variables found:', validation.detectedVariables);
  // ['user.isPro', 'tools']
}

// Create a reusable template (saved to ai_prompts table)
const template = await createTemplate({
  name: 'BetEdge Chat Agent',
  description: 'System prompt for BetEdge customer-facing chat',
  content: `You are an expert sports analytics assistant for BetEdge.
{{#if user.isPro}}
You can access advanced analytics and premium data.
{{else}}
Mention that Pro users get additional features.
{{/if}}`,
  variables: [
    {
      name: 'user.isPro',
      type: 'boolean',
      required: true,
      description: 'Whether user has Pro plan',
    },
  ],
  ventureId: 'betedge-venture-uuid',
  category: 'chat',
});

console.log(`Template created: ${template.id}`);

// List all templates for a venture
const templates = await listTemplates({
  ventureId: 'betedge-venture-uuid',
  category: 'system',
});

for (const t of templates) {
  console.log(`  ${t.name} (${t.category}) — used ${t.usageCount} times`);
}

// Use template by ID in assembly
const assembled = await assembleContext({
  systemPrompt: `template:${template.id}`,   // Prefix with 'template:' to load by ID
  userMessage: 'What teams are playing tonight?',
  ventureId: 'betedge-venture-uuid',
  model: 'anthropic/claude-3.5-sonnet',
  templateVariables: { user: { isPro: true } },
});
```

### ContextManager (Stateful)

```typescript
import { ContextManager, createContext } from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Stateful context manager for long-running conversation
// ═══════════════════════════════════════════════════════════════════════════════

const ctx = createContext({
  maxTokens: 128000,
  reserveTokens: 4096,
  model: 'anthropic/claude-3.5-sonnet',
  systemPrompt: 'You are a helpful assistant for BetEdge.',
  autoCompress: true,
  compressAfterMessages: 20,
  recentWindowSize: 10,
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
});

// Add messages as conversation progresses
ctx.addMessage({ role: 'user', content: 'Hello, what can you help me with?' });
ctx.addMessage({
  role: 'assistant',
  content: 'I can help with sports analytics, betting insights, and more!',
});
ctx.addMessage({ role: 'user', content: 'Show me Lakers stats' });

// Get optimized messages for LLM call (triggers compression if needed)
const messages = await ctx.getMessages();
console.log(`Messages: ${messages.length}`);
console.log(`Token count: ${ctx.getTokenCount()}`);
console.log(`Budget remaining: ${ctx.getRemainingTokens()}`);

// Inject dynamic context that persists across turns
ctx.addContext('user_info', {
  name: 'John',
  plan: 'Pro',
  favoriteTeam: 'Lakers',
});
ctx.addContext('recent_bets', recentBets.slice(0, 5));

// Serialize state for persistence (e.g., save to aiConversations.context)
const state = ctx.getState();
const serialized = JSON.stringify(state);

// Restore from persisted state (e.g., on next request)
const restored = ContextManager.fromState(JSON.parse(serialized));
const restoredMessages = await restored.getMessages();

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Context manager with small model and aggressive compression
// ═══════════════════════════════════════════════════════════════════════════════

const ctx = createContext({
  maxTokens: 8192,               // Small context window
  reserveTokens: 2048,
  model: 'deepseek/deepseek-chat',
  autoCompress: true,
  compressAfterMessages: 10,     // Compress early
  recentWindowSize: 4,           // Keep only last 4 messages verbatim
  compressionModel: 'deepseek/deepseek-chat',
});

// Simulate a long conversation
for (let i = 0; i < 25; i++) {
  ctx.addMessage({ role: 'user', content: `Message ${i}: Tell me about topic ${i}` });
  ctx.addMessage({
    role: 'assistant',
    content: `Response ${i}: Here's what I know about topic ${i}...`,
  });
}

const messages = await ctx.getMessages();
// Structure: [system, summary_of_messages_0_to_45, msg_46, msg_47, msg_48, msg_49]
console.log(`Compressed to ${messages.length} messages from 50 original`);
console.log(`Token usage: ${ctx.getTokenCount()} / ${8192 - 2048}`);
```

### Data Injection

```typescript
import {
  injectUserContext,
  injectVentureContext,
  injectTemporalContext,
  injectRAGContext,
  registerContextSource,
} from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Inject real-time data into prompts
// ═══════════════════════════════════════════════════════════════════════════════

const userCtx = await injectUserContext('user-123');
console.log(userCtx);
// {
//   name: 'John Doe',
//   email: 'john@example.com',
//   role: 'analyst',
//   plan: 'pro',
//   timezone: 'America/New_York',
//   language: 'en',
//   permissions: ['read', 'write', 'admin'],
// }

const ventureCtx = await injectVentureContext('betedge-venture-uuid');
console.log(ventureCtx);
// {
//   name: 'BetEdge',
//   domain: 'betedge.com',
//   features: ['analytics', 'predictions', 'social'],
//   settings: { theme: 'dark', currency: 'USD' },
//   agentName: 'Atlas',
// }

const timeCtx = injectTemporalContext('America/New_York');
console.log(timeCtx);
// {
//   now: '2026-02-08T14:30:00-05:00',
//   date: 'February 8, 2026',
//   dayOfWeek: 'Sunday',
//   timezone: 'America/New_York',
//   isWeekend: true,
//   isBusinessHours: false,
// }

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: Register a custom context source
// ═══════════════════════════════════════════════════════════════════════════════

registerContextSource({
  name: 'recent_bets',
  priority: 2.5,                // Between RAG (2) and history (3)
  maxTokens: 2000,
  sacred: false,                // Can be dropped under budget pressure
  cacheTtl: 60,                 // Cache for 60 seconds
  fetch: async (ventureId, userId) => {
    const bets = await getBetHistory(userId!, { limit: 10 });
    return `Recent betting activity:\n${bets
      .map(b => `- ${b.event}: $${b.amount} on ${b.selection} (${b.status})`)
      .join('\n')}`;
  },
});

// Now 'recent_bets' is automatically included when sources includes 'custom'
const assembled = await assembleContext({
  systemPrompt: 'You are a sports analytics assistant.',
  userMessage: 'How have my bets been doing?',
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  model: 'anthropic/claude-3.5-sonnet',
  sources: ['realtime', 'rag', 'history', 'custom'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 18: Inject RAG context with formatting
// ═══════════════════════════════════════════════════════════════════════════════

const ragContext = injectRAGContext(ragResults, {
  format: 'numbered',           // 'numbered' | 'bullet' | 'xml' | 'markdown'
  includeMetadata: true,        // Include source file names
  maxChunks: 5,                 // Limit chunks even if more were retrieved
  separator: '\n---\n',         // Separator between chunks
});

// Output:
// [1] From "password-reset-guide.md":
// To reset your password, navigate to Settings > Security > Reset Password...
// ---
// [2] From "faq.md":
// Q: How do I change my password? A: Go to your account settings...
```

### Client-Side Usage (React)

```tsx
import { useTokenCounter, useContextManager, useTemplateEditor } from '@mcv/intelligence/context/client';
import { TokenCounter, ContextBudgetBar, ContextDebugger, TemplateEditor } from '@mcv/intelligence/context/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 19: Token counter and budget bar for chat input
// ═══════════════════════════════════════════════════════════════════════════════

function ChatInput({ model, maxTokens, systemTokens, historyTokens }: Props) {
  const [input, setInput] = useState('');
  const { tokens, isOverBudget, isNearBudget } = useTokenCounter(input, model);

  return (
    <div className="space-y-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-3 border rounded-lg"
        placeholder="Ask anything..."
      />

      {/* Visual budget bar showing token allocation */}
      <ContextBudgetBar
        total={maxTokens}
        sections={[
          { label: 'System', tokens: systemTokens, color: 'blue' },
          { label: 'History', tokens: historyTokens, color: 'green' },
          { label: 'Your message', tokens: tokens, color: 'purple' },
        ]}
        reserved={4096}
      />

      {isOverBudget && (
        <p className="text-destructive text-sm">
          ⚠️ Message exceeds token limit ({tokens.toLocaleString()} tokens)
        </p>
      )}

      {isNearBudget && !isOverBudget && (
        <p className="text-warning text-sm">
          ⚡ Approaching token limit ({tokens.toLocaleString()} tokens)
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 20: Context debugger for development
// ═══════════════════════════════════════════════════════════════════════════════

function DevContextView({ assemblyResult }: { assemblyResult: AssemblyResult }) {
  return (
    <ContextDebugger
      result={assemblyResult}
      showRawSources={true}
      showTokenBreakdown={true}
      showOptimizationLog={true}
      showPipelineTrace={true}
    />
    // Renders an interactive panel showing:
    // - Token allocation pie chart
    // - Per-source token counts
    // - Optimization decisions taken
    // - Pipeline stage timings
    // - Raw source content (expandable)
  );
}
```

---

## Prompt Caching Integration

The context module works with the gateway's prompt caching to maximize cache hits:

### How Prompt Caching Works

When the same system prompt prefix is used across multiple requests, providers like Anthropic and OpenAI cache the tokenized prefix and charge reduced rates for subsequent requests:

| Provider | Minimum Prefix | Savings | TTL |
|----------|---------------|---------|-----|
| **Anthropic** | 1,024 tokens | 90% | 5 min |
| **OpenAI** | Any identical prefix | 50% | ~1 hour |
| **Google** | Explicit cache creation | 75% | Configurable |

### Context Module's Role in Cache Optimization

```typescript
// The context module ensures maximum cache hits by:
// 1. Placing STATIC content at the start of the system prompt
// 2. Placing DYNAMIC content after the static prefix
// 3. Never reordering sources between requests

// Example: optimal prompt structure for caching
const assembled = await assembleContext({
  systemPrompt: `
    [STATIC — cached by provider]
    You are Atlas, a sports analytics assistant for BetEdge.
    You help users with: analytics, predictions, betting insights.
    Rules: always cite sources, never give financial advice.
    ... (1024+ tokens of stable content)

    [DYNAMIC — changes per request, not cached]
    Current time: {{time.now}}
    User: {{user.name}} ({{user.plan}})
  `,
  userMessage: 'What are tonight\'s picks?',
  ventureId: 'betedge-venture-uuid',
  model: 'anthropic/claude-3.5-sonnet',
});

// First request: full price for system prompt
// Subsequent requests (within 5 min): 90% savings on the static prefix
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Token counting (text, <1K chars) | < 2ms | < 5ms | Uses cached tokenizer |
| Token counting (text, >10K chars) | < 10ms | < 25ms | Linear in text length |
| Token counting (messages array) | < 15ms | < 40ms | Counts each message + framing |
| Token estimation (approximate) | < 0.1ms | < 0.5ms | Simple character math |
| Context assembly (no compression) | < 25ms | < 60ms | DB lookups + token counting |
| Context assembly (with compression) | < 2s | < 5s | Includes summarization LLM call |
| Template rendering | < 2ms | < 5ms | Handlebars compile + render |
| Template validation | < 5ms | < 10ms | AST parsing |
| History summarization | < 3s | < 8s | Economy-tier LLM call |
| Data injection (user + venture) | < 10ms | < 30ms | DB queries with caching |
| ContextManager.getMessages() | < 30ms | < 80ms | May trigger lazy compression |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Assemblies/second | 200 | 2,000+ |
| Token counts/second | 1,000 | 10,000+ |
| Template renders/second | 5,000 | 50,000+ |
| Estimations/second | 100,000 | 1,000,000+ |

### Optimization Strategies

1. **Lazy token counting** — Only count tokens when budget utilization exceeds 60%
2. **Cached system prompt tokens** — System prompt token counts are cached since they rarely change (cache key: hash of rendered prompt)
3. **Approximate-first counting** — Use `estimateTokens` (chars × 0.25) for quick budget checks; only call `countTokens` when near the limit
4. **Compression amortization** — Only compress when approaching 85%+ budget utilization
5. **Template precompilation** — Handlebars templates are pre-parsed and cached for repeated use
6. **Priority truncation** — Drop lowest-priority sources first (avoids expensive compression when simple truncation suffices)
7. **Incremental assembly** — When adding a single message to ContextManager, only count the new message's tokens (don't recount everything)
8. **Injection caching** — User and venture context is cached in Redis with short TTL (60s)
9. **Tokenizer pooling** — Tokenizer instances are pooled per model family (one for OpenAI, one for Anthropic, etc.)

### Memory Footprint

| Component | Typical Size | Notes |
|-----------|-------------|-------|
| Tokenizer instance (cl100k_base) | ~4MB | Shared across all OpenAI model counts |
| Tokenizer instance (Claude) | ~3MB | Shared across all Anthropic model counts |
| Compiled Handlebars template | ~2KB | Per template, cached |
| ContextManager state | ~50KB | Per active conversation |
| Token count cache entry | ~100B | Per unique text hash |

---

## Security Considerations

### Data Handling

| Concern | Mitigation |
|---------|-----------|
| **PII in context** | User data injected into prompts is filtered when ZDR (Zero Data Retention) is enabled. Email addresses, phone numbers, and SSNs are redacted with `[REDACTED]` markers. |
| **Template injection** | Template variables are HTML-escaped by Handlebars by default. Raw output (`{{{triple}}}`) is disabled in system templates. Custom helpers are sandboxed. |
| **Context leakage** | Venture context is **never** leaked across venture boundaries. Each assembly request requires a `ventureId` and all data fetches are scoped to that venture. |
| **History isolation** | Conversation history is scoped to session and user via `aiConversations.ventureId` and `aiConversations.userId`. Cross-user history access is blocked. |
| **Prompt extraction** | System prompts are not exposed to end users via API responses. The `debugInfo` field is only populated in development mode. |
| **Token counting side channels** | Token counts are not exposed to end users in production to prevent prompt-length oracle attacks. |

### Access Control

| Action | Required Permission |
|--------|-------------------|
| Assemble context | Valid `ventureId` + request-scoped auth |
| Read user context | Same venture membership |
| Read venture context | Venture member or admin |
| Create/update templates | `admin` role within venture |
| Delete templates | `admin` role (system templates cannot be deleted) |
| Register custom sources | `admin` role |
| Access debug info | `dev` or `admin` role |

### Template Security

```typescript
// Templates are validated against these security rules:
const TEMPLATE_SECURITY_RULES = {
  maxLength: 50_000,                    // Max 50K characters
  maxVariables: 100,                    // Max 100 distinct variables
  maxNestingDepth: 5,                   // Max 5 levels of {{#if}}/{{#each}} nesting
  disallowedHelpers: ['raw', 'lookup'], // Prevent raw HTML output and prototype access
  disallowedPatterns: [
    /{{{\s*/,                           // Triple-stache (raw output) blocked
    /__proto__/,                        // Prototype pollution prevention
    /constructor/,                      // Constructor access prevention
  ],
};
```

---

## Audit Events

| Event | Category | Severity | Description |
|-------|----------|----------|-------------|
| `context.assembled` | system | info | Context assembled for LLM request |
| `context.truncated` | system | info | Context was truncated to fit budget |
| `context.compressed` | system | info | History was compressed via summarization |
| `context.over_budget` | system | warn | Assembly could not fit within token budget |
| `context.sacred_exceeded` | system | error | Sacred content (system + user) alone exceeds budget |
| `context.template.created` | admin | info | New prompt template created |
| `context.template.updated` | admin | info | Template modified |
| `context.template.deleted` | admin | warn | Template removed |
| `context.template.validation_failed` | admin | warn | Template failed syntax validation |
| `context.source.registered` | admin | info | Custom context source registered |
| `context.source.deregistered` | admin | info | Custom context source removed |
| `context.injection.failed` | system | warn | Failed to inject context source (gracefully degraded) |
| `context.injection.timeout` | system | warn | Context source fetch timed out |
| `context.pii.filtered` | security | info | PII was filtered from context (ZDR mode) |
| `context.template.security_violation` | security | error | Template contained disallowed patterns |
| `context.compression.failed` | system | warn | History summarization LLM call failed (fell back to truncation) |
| `context.compression.expensive` | billing | warn | Compression cost exceeded threshold |
| `context.cache.miss` | system | debug | Token count cache miss |
| `context.cache.eviction` | system | debug | Cached data evicted (TTL expired) |

### Audit Event Payload Example

```typescript
// context.assembled event payload
{
  event: 'context.assembled',
  category: 'system',
  severity: 'info',
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  metadata: {
    model: 'anthropic/claude-3.5-sonnet',
    tokensUsed: 3405,
    tokenBudget: 123904,
    utilizationPercent: 2.7,
    sourcesIncluded: ['system', 'realtime', 'history', 'user'],
    optimizationsApplied: [],
    assemblyDurationMs: 18,
    estimatedCostUsd: 0.0102,
  },
  timestamp: '2026-02-08T19:30:00.000Z',
}
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# TOKEN COUNTING
# ═══════════════════════════════════════════════════════════════════════════════

# Default token encoding when model-specific encoding is unavailable
CONTEXT_DEFAULT_ENCODING=cl100k_base

# Characters-to-tokens ratio for fast estimation
CONTEXT_ESTIMATE_RATIO=0.25

# Cache TTL for token count results (seconds, 0 = no caching)
CONTEXT_TOKEN_CACHE_TTL=300

# ═══════════════════════════════════════════════════════════════════════════════
# ASSEMBLY DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

# Default tokens reserved for LLM response
CONTEXT_DEFAULT_RESERVE_TOKENS=4096

# Maximum history messages to consider (prevents runaway assembly)
CONTEXT_MAX_HISTORY_MESSAGES=100

# Default truncation strategy ('fifo', 'importance', 'smart', 'sliding')
CONTEXT_DEFAULT_TRUNCATION=smart

# Default number of recent messages to keep verbatim during compression
CONTEXT_RECENT_WINDOW_SIZE=6

# Default context sources to include if not specified
CONTEXT_DEFAULT_SOURCES=realtime,history

# Budget utilization threshold before optimization kicks in (percent)
CONTEXT_OPTIMIZATION_THRESHOLD=85

# ═══════════════════════════════════════════════════════════════════════════════
# COMPRESSION
# ═══════════════════════════════════════════════════════════════════════════════

# Messages before auto-compression triggers (ContextManager)
CONTEXT_COMPRESS_AFTER_MESSAGES=20

# Economy model used for history summarization
CONTEXT_COMPRESSION_MODEL=deepseek/deepseek-chat

# Target token count for generated summary
CONTEXT_COMPRESSION_TARGET_TOKENS=500

# Maximum cost (USD) for a single summarization call before warning
CONTEXT_COMPRESSION_COST_THRESHOLD=0.01

# Timeout for summarization LLM calls (milliseconds)
CONTEXT_COMPRESSION_TIMEOUT_MS=15000

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum template size in characters
CONTEXT_TEMPLATE_MAX_SIZE=50000

# Template compilation cache TTL (seconds)
CONTEXT_TEMPLATE_CACHE_TTL=3600

# Maximum nesting depth for template conditionals/loops
CONTEXT_TEMPLATE_MAX_NESTING=5

# ═══════════════════════════════════════════════════════════════════════════════
# INJECTION
# ═══════════════════════════════════════════════════════════════════════════════

# Auto-inject temporal context (time, date, timezone)
CONTEXT_INJECT_TEMPORAL=true

# Auto-inject user profile data
CONTEXT_INJECT_USER=true

# Auto-inject venture configuration data
CONTEXT_INJECT_VENTURE=true

# Cache TTL for injected user/venture data (seconds)
CONTEXT_INJECTION_CACHE_TTL=60

# Timeout for individual injection source fetches (milliseconds)
CONTEXT_INJECTION_TIMEOUT_MS=5000

# ═══════════════════════════════════════════════════════════════════════════════
# SECURITY
# ═══════════════════════════════════════════════════════════════════════════════

# Enable PII filtering in context assembly (for ZDR compliance)
CONTEXT_PII_FILTER_ENABLED=false

# Enable debug output (ONLY in development — exposes raw prompts)
CONTEXT_DEBUG_ENABLED=false
```

---

## Error Codes

| Code | Name | HTTP | Description | Resolution |
|------|------|------|-------------|------------|
| `CTX_OVER_BUDGET` | Token Budget Exceeded | 413 | Assembled context exceeds model's token limit even after all optimizations | Reduce context sources, shorten system prompt, use smaller history, or switch to a larger model |
| `CTX_SYSTEM_TOO_LARGE` | System Prompt Too Large | 413 | System prompt alone (after template rendering) exceeds available budget | Shorten system prompt or use a model with larger context window |
| `CTX_USER_TOO_LARGE` | User Message Too Large | 413 | User message alone exceeds available budget | Truncate user input before assembly |
| `CTX_SACRED_EXCEEDED` | Sacred Content Exceeds Budget | 413 | Combined sacred content (system + user + realtime) exceeds available budget | Reduce sacred content or increase model context window |
| `CTX_MODEL_UNKNOWN` | Unknown Model | 404 | Specified model not found in `model_configs` table | Check model ID against `listModels()` or add model to `model_configs` |
| `CTX_MODEL_NO_TOKENIZER` | No Tokenizer Available | 500 | No tokenizer available for the specified model's family | Add tokenizer mapping or use default encoding |
| `CTX_TEMPLATE_NOT_FOUND` | Template Not Found | 404 | Template ID (from `template:` prefix) does not exist in `ai_prompts` | Verify template ID or create the template first |
| `CTX_TEMPLATE_INVALID` | Invalid Template Syntax | 400 | Template contains syntax errors (unclosed `{{#if}}`, invalid helpers) | Run `validateTemplate()` and fix reported errors |
| `CTX_TEMPLATE_VAR_MISSING` | Required Variable Missing | 400 | A required template variable was not provided in `templateVariables` | Pass all required variables or set defaults in the template |
| `CTX_TEMPLATE_TOO_LARGE` | Template Exceeds Size Limit | 400 | Template content exceeds `CONTEXT_TEMPLATE_MAX_SIZE` characters | Shorten template or increase the limit |
| `CTX_TEMPLATE_SECURITY` | Template Security Violation | 403 | Template contains disallowed patterns (raw output, prototype access) | Remove disallowed patterns from template content |
| `CTX_COMPRESSION_FAILED` | Compression Failed | 502 | History summarization LLM call failed (provider error or timeout) | Check compression model availability; falls back to truncation automatically |
| `CTX_COMPRESSION_TIMEOUT` | Compression Timed Out | 504 | Summarization LLM call exceeded `CONTEXT_COMPRESSION_TIMEOUT_MS` | Increase timeout or reduce history size |
| `CTX_INJECTION_FAILED` | Context Injection Failed | 502 | Failed to fetch data for a context source (DB error, service down) | Check source availability; assembly continues without the failed source |
| `CTX_INJECTION_TIMEOUT` | Injection Timed Out | 504 | Context source fetch exceeded `CONTEXT_INJECTION_TIMEOUT_MS` | Check source service latency or increase timeout |
| `CTX_VENTURE_NOT_FOUND` | Venture Not Found | 404 | Specified `ventureId` does not exist in `ventures` table | Verify venture UUID |
| `CTX_USER_NOT_FOUND` | User Not Found | 404 | Specified `userId` does not exist in `users` table | Verify user UUID |
| `CTX_SOURCE_CONFLICT` | Duplicate Source Name | 409 | Custom context source name conflicts with an existing source | Use a unique name for `registerContextSource()` |
| `CTX_SOURCE_NOT_FOUND` | Source Not Found | 404 | Referenced custom context source not registered | Register the source with `registerContextSource()` first |
| `CTX_ENCODING_UNSUPPORTED` | Unsupported Encoding | 400 | Token encoding not available for the specified model | Use a supported model or override with `CONTEXT_DEFAULT_ENCODING` |
| `CTX_HISTORY_EMPTY` | No History Available | 400 | `compressHistory` called with empty message array | Provide at least one message |
| `CTX_SERIALIZE_FAILED` | State Serialization Failed | 500 | `ContextManager.getState()` failed to serialize | Check for circular references in context data |
| `CTX_DESERIALIZE_FAILED` | State Deserialization Failed | 500 | `ContextManager.fromState()` failed to parse saved state | Check state format; may need migration for version changes |

### Error Handling Strategy

The context module uses **graceful degradation**: non-critical failures reduce context quality but don't prevent assembly.

```typescript
// Example: Injection failure is logged but doesn't block assembly
try {
  const userCtx = await injectUserContext(userId);
  variables.user = userCtx;
} catch (error) {
  audit.log('context.injection.failed', {
    source: 'user',
    error: error.message,
  });
  // Assembly continues without user context
}

// Only sacred content failures are fatal:
if (systemTokens + userTokens > availableBudget) {
  throw new ContextError('CTX_SACRED_EXCEEDED', {
    systemTokens,
    userTokens,
    availableBudget,
    model,
  });
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| tiktoken | ^1.x | Accurate token counting for OpenAI model family (cl100k_base, o200k_base) |
| @anthropic-ai/tokenizer | ^0.x | Claude token counting (Anthropic's native tokenizer) |
| handlebars | ^4.x | Template rendering engine (Mustache-compatible, with helpers) |
| drizzle-orm | ^0.29.x | Database ORM for reading ai_prompts, ai_conversations, model_configs |
| ioredis | ^5.x | Caching: token counts, compiled templates, injection data |
| zod | ^3.x | Input validation for AssemblyRequest, template variables, etc. |
| @mcv/db | workspace | Database schemas and connection |
| @mcv/intelligence/gateway | workspace | Model configs (context windows, pricing), chat (for compression) |
| @mcv/intelligence/rag | workspace | RetrievalResult type definition |
| @mcv/kernel | workspace | User and venture data access |
| @mcv/audit | workspace | Audit event logging |

### Dependency Graph

```
@mcv/intelligence/context
  ├── @mcv/db               (read: ai_prompts, ai_conversations, ai_agents, model_configs)
  ├── @mcv/kernel            (read: users, ventures)
  ├── @mcv/intelligence/gateway  (read: model_configs; call: chat for compression)
  ├── @mcv/intelligence/rag      (type: RetrievalResult)
  ├── @mcv/audit             (emit: audit events)
  ├── tiktoken               (token counting)
  ├── @anthropic-ai/tokenizer (token counting)
  ├── handlebars             (template rendering)
  ├── ioredis                (caching)
  └── zod                    (validation)
```

---

## Testing Notes

### Unit Testing

```typescript
import {
  countTokens,
  estimateTokens,
  assembleContext,
  truncateContext,
  renderTemplate,
  validateTemplate,
  getTokenLimit,
  fitToTokenBudget,
} from '@mcv/intelligence/context';

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN COUNTING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Token Counting', () => {
  it('should count tokens accurately for OpenAI models', () => {
    const tokens = countTokens('Hello, world!', 'openai/gpt-4o');
    expect(tokens.input).toBe(4);
    expect(tokens.encoding).toBe('cl100k_base');
    expect(tokens.isExact).toBe(true);
  });

  it('should count tokens for Anthropic models', () => {
    const tokens = countTokens('Hello, world!', 'anthropic/claude-3.5-sonnet');
    expect(tokens.input).toBeGreaterThan(0);
    expect(tokens.encoding).toBe('claude');
  });

  it('should count message array tokens including framing', () => {
    const tokens = countTokens([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hi!' },
    ], 'openai/gpt-4o');
    // Message framing adds ~4 tokens per message
    expect(tokens.input).toBeGreaterThan(6);
  });

  it('should estimate tokens within 20% of exact count', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100);
    const exact = countTokens(text, 'openai/gpt-4o').input;
    const estimate = estimateTokens(text);
    expect(Math.abs(estimate - exact) / exact).toBeLessThan(0.2);
  });

  it('should respect model context limits', () => {
    const limit = getTokenLimit('openai/gpt-4o-mini');
    expect(limit).toBe(128000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Context Assembly', () => {
  it('should never truncate system prompt or user message', async () => {
    const assembled = await assembleContext({
      systemPrompt: 'System prompt that should never be cut',
      userMessage: 'User question that should never be cut',
      ventureId: 'test-venture',
      model: 'openai/gpt-4o-mini',
      maxTokens: 100, // Very small budget
      sources: [], // No optional sources
    });

    const systemMsg = assembled.messages.find(m => m.role === 'system');
    const userMsg = assembled.messages[assembled.messages.length - 1];
    expect(systemMsg?.content).toContain('System prompt that should never be cut');
    expect(userMsg?.content).toBe('User question that should never be cut');
  });

  it('should raise CTX_SACRED_EXCEEDED when sacred content exceeds budget', async () => {
    const longPrompt = 'x'.repeat(100000); // Way more than any budget
    await expect(
      assembleContext({
        systemPrompt: longPrompt,
        userMessage: 'Hi',
        ventureId: 'test-venture',
        model: 'openai/gpt-4o-mini',
        maxTokens: 100,
      })
    ).rejects.toThrow('CTX_SACRED_EXCEEDED');
  });

  it('should truncate history before RAG when over budget', async () => {
    const assembled = await assembleContext({
      systemPrompt: 'System',
      userMessage: 'Question',
      ventureId: 'test-venture',
      model: 'openai/gpt-4o-mini',
      maxTokens: 500,
      history: generateLongHistory(100),
      ragResults: generateRagResults(5),
    });

    expect(assembled.optimizations.historyTruncated).toBe(true);
    expect(assembled.tokenBreakdown.total).toBeLessThanOrEqual(500);
  });

  it('should include all sources when budget allows', async () => {
    const assembled = await assembleContext({
      systemPrompt: 'System',
      userMessage: 'Question',
      ventureId: 'test-venture',
      model: 'anthropic/claude-3.5-sonnet',
      maxTokens: 128000, // Large budget
      sources: ['realtime', 'rag', 'history'],
      history: [{ role: 'user', content: 'Previous message' }],
      ragResults: [{ content: 'RAG chunk', score: 0.9 }],
    });

    expect(assembled.tokenBreakdown.rag).toBeGreaterThan(0);
    expect(assembled.tokenBreakdown.history).toBeGreaterThan(0);
    expect(assembled.optimizations.historyTruncated).toBe(false);
  });

  it('should calculate cost estimate correctly', async () => {
    const assembled = await assembleContext({
      systemPrompt: 'System',
      userMessage: 'Question',
      ventureId: 'test-venture',
      model: 'anthropic/claude-3.5-sonnet',
    });

    expect(assembled.estimatedInputCost).toBeGreaterThan(0);
    expect(assembled.estimatedTotalCost).toBeGreaterThan(assembled.estimatedInputCost);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template Rendering', () => {
  it('should render simple variables', () => {
    const result = renderTemplate('Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should render nested variables', () => {
    const result = renderTemplate('Hello {{user.name}}!', {
      user: { name: 'John' },
    });
    expect(result).toBe('Hello John!');
  });

  it('should handle conditionals', () => {
    const template = '{{#if premium}}Premium user{{else}}Free user{{/if}}';
    expect(renderTemplate(template, { premium: true })).toBe('Premium user');
    expect(renderTemplate(template, { premium: false })).toBe('Free user');
  });

  it('should handle each loops', () => {
    const result = renderTemplate(
      '{{#each items}}- {{this}}\n{{/each}}',
      { items: ['A', 'B', 'C'] }
    );
    expect(result).toBe('- A\n- B\n- C\n');
  });

  it('should escape HTML by default', () => {
    const result = renderTemplate('{{text}}', { text: '<script>alert("xss")</script>' });
    expect(result).not.toContain('<script>');
  });

  it('should validate template syntax', () => {
    const valid = validateTemplate('Hello {{name}}!');
    expect(valid.isValid).toBe(true);
    expect(valid.detectedVariables).toContain('name');

    const invalid = validateTemplate('Hello {{#if open}}unclosed');
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('should reject security-violating templates', () => {
    const result = validateTemplate('{{{raw_output}}}');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('security');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Context Optimization', () => {
  it('should fit text to token budget with word preservation', () => {
    const result = fitToTokenBudget(
      'The quick brown fox jumps over the lazy dog',
      { maxTokens: 5, model: 'openai/gpt-4o', preserveWords: true }
    );
    expect(result.wasTruncated).toBe(true);
    expect(result.tokenCount).toBeLessThanOrEqual(5);
    // Should not cut words in half
    expect(result.text).not.toMatch(/\w$/);
  });

  it('should preserve last N messages in truncation', () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant' as const,
      content: `Message ${i}`,
    }));

    const truncated = truncateContext(messages, {
      maxTokens: 100,
      model: 'openai/gpt-4o',
      strategy: 'fifo',
      preserveLastN: 4,
    });

    // Last 4 messages should be preserved
    const lastContent = truncated.messages.slice(-4).map(m => m.content);
    expect(lastContent).toContain('Message 16');
    expect(lastContent).toContain('Message 19');
  });
});
```

### Integration Testing

```typescript
describe('Context Assembly E2E', () => {
  it('should assemble context with real DB data', async () => {
    // Setup: create test venture, user, agent, and prompt template
    const venture = await createTestVenture();
    const user = await createTestUser(venture.id);
    const template = await createTemplate({
      name: 'Test Template',
      content: 'Hello {{user.name}} from {{venture.name}}!',
      ventureId: venture.id,
      category: 'system',
    });

    const assembled = await assembleContext({
      systemPrompt: `template:${template.id}`,
      userMessage: 'Test question',
      ventureId: venture.id,
      userId: user.id,
      model: 'deepseek/deepseek-chat',
    });

    const systemContent = assembled.messages[0].content;
    expect(systemContent).toContain(user.name);
    expect(systemContent).toContain(venture.name);
    expect(assembled.budget.used).toBeGreaterThan(0);
    expect(assembled.budget.remaining).toBeGreaterThan(0);
  });

  it('should handle compression with real LLM call', async () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant' as const,
      content: `This is message ${i} with some substantial content about various topics.`,
    }));

    const compressed = await compressHistory(messages, {
      model: 'deepseek/deepseek-chat',
      maxTokens: 500,
      compressionModel: 'deepseek/deepseek-chat',
      strategy: 'smart',
      recentWindowSize: 4,
    });

    expect(compressed.ratio).toBeGreaterThan(1);
    expect(compressed.summary).toBeTruthy();
    expect(compressed.messagesKeptVerbatim).toBe(4);
    expect(compressed.tokenCount).toBeLessThanOrEqual(500);
  });
});
```

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/intelligence/gateway` | **Primary Consumer** | Gateway calls context assembly before every LLM request. Also provides model configs (context windows, pricing) and the compression LLM endpoint. |
| `@mcv/intelligence/rag` | **Data Source** | RAG retrieval results (`RetrievalResult[]`) are injected as context chunks. |
| `@mcv/intelligence/memory` | **Data Source** | Long-term conversation memories and entity memories feed into context. |
| `@mcv/intelligence/embedding` | **Indirect** | Embeddings power RAG, which feeds context. Not called directly. |
| `@mcv/intelligence/personas` | **Data Source** | Agent persona definitions may be used as system prompt templates. |
| `@mcv/kernel` | **Data Source** | User profiles and venture configurations are injected as real-time context. |
| `@mcv/naos` | **Consumer** | Agent orchestration uses context assembly for all agent prompts (Queen, Ralph, etc.). |
| `@mcv/db` | **Data Access** | Reads from `ai_prompts`, `ai_conversations`, `ai_agents`, `model_configs` tables. |
| `@mcv/audit` | **Integration** | Emits audit events for all context operations. |

---

## Migration Guide

### From Direct Prompt Construction

```typescript
// ❌ Before: Manual prompt construction (fragile, no token management)
const messages = [
  { role: 'system', content: systemPrompt + '\n' + ragContext + '\n' + userInfo },
  ...history,
  { role: 'user', content: userMessage },
];

// Problems:
// - No token counting → may exceed context window
// - No priority-based truncation → important data lost randomly
// - No history compression → old conversations fail silently
// - No template rendering → hardcoded strings
// - No cost estimation → surprise bills

// ✅ After: Context assembly (robust, token-managed, cost-aware)
const assembled = await assembleContext({
  systemPrompt,
  userMessage,
  ventureId,
  userId,
  model: 'anthropic/claude-3.5-sonnet',
  sources: ['realtime', 'rag', 'history'],
  ragResults,
  history,
});
const messages = assembled.messages;

// Benefits:
// ✓ Automatic token counting with correct tokenizer
// ✓ Priority-based truncation (history dropped before RAG)
// ✓ Automatic compression when history grows long
// ✓ Template rendering with Handlebars
// ✓ Cost estimation before sending
// ✓ Audit logging for compliance
// ✓ Debug info for development
```

### From Custom Token Counter

```typescript
// ❌ Before: Character-based estimation (inaccurate)
const estimatedTokens = text.length / 4;

// ✅ After: Model-aware exact counting
const { input } = countTokens(text, 'anthropic/claude-3.5-sonnet');

// Or for UI feedback (fast, ~20% accuracy):
const estimate = estimateTokens(text);
```

### From Manual History Truncation

```typescript
// ❌ Before: Naive sliding window
const recentMessages = messages.slice(-10);

// ✅ After: Smart compression with summarization
const optimized = await compressHistory(messages, {
  model: 'anthropic/claude-3.5-sonnet',
  maxTokens: 8000,
  strategy: 'smart',
  recentWindowSize: 10,
});
// Old messages are summarized, not lost
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-15 | Initial context assembly with token counting |
| 0.2.0 | 2026-01-28 | Added template system (Handlebars-based) |
| 0.3.0 | 2026-02-01 | Added automatic history compression with economy-tier LLM |
| 0.4.0 | 2026-02-05 | Added custom context sources, ContextManager class |
| 0.5.0 | 2026-02-08 | Added debug mode, budget utilization tracking, graceful degradation for injection failures, template security validation, comprehensive audit events |

---

## FAQ

### Q: Why not just use the model's context window directly?

**A:** While modern models support 100K+ token windows, using them efficiently matters for cost and quality. A 128K-token request to Claude 3.5 Sonnet costs ~$0.38 for input alone. The context module ensures you only send what's needed, typically using 5-15% of the available window.

### Q: When should I use `estimateTokens` vs `countTokens`?

**A:** Use `estimateTokens` for real-time UI feedback (keystroke-level), preliminary budget checks, and any situation where speed matters more than precision. Use `countTokens` for final assembly, budget enforcement, and cost calculation. The estimate is typically within ±20% of the exact count.

### Q: How does compression affect response quality?

**A:** Summarization inherently loses some detail. The module mitigates this by: (1) always keeping the most recent N messages verbatim, (2) using explicit summarization prompts that preserve key facts and decisions, and (3) indicating in the summary which topics were discussed. In practice, users rarely notice the compression for conversations under ~50 messages.

### Q: Can I use the context module without the gateway?

**A:** Yes. `countTokens`, `estimateTokens`, `renderTemplate`, and `truncateContext` are pure functions that don't require database access or LLM calls. Only `assembleContext` (with injection), `summarizeContext`, and `compressHistory` require external dependencies.

### Q: How are template variables sanitized?

**A:** Handlebars escapes HTML entities by default (`<` → `&lt;`). The module additionally blocks triple-stache raw output (`{{{...}}}`), `__proto__` access, and `constructor` property access. Variables are validated against their declared types via Zod schemas when `validateTemplate` is called.

---

*@mcv/intelligence/context — Context Assembly Module*
