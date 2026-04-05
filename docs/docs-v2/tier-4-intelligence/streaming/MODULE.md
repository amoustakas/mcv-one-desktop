# @mcv/intelligence/streaming — Streaming Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Core)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Current Implementation:** `@mcv/gateway` (stream method + `useGatewayStream` hook)  
**Last Updated:** February 8, 2026

---

## Purpose

The `streaming` module provides real-time LLM response delivery via Server-Sent Events (SSE) and WebSocket transports. It handles stream parsing from OpenRouter providers, token-by-token delivery, tool call detection during streaming, back-pressure management, client reconnection, and structured stream events. Every streaming AI interaction in MCV — from chat interfaces to agent orchestration — uses this module.

**This module makes AI responses feel instantaneous by delivering tokens as they're generated.**

### Why Streaming Matters

Traditional request/response AI interactions require the client to wait for the entire response to be generated — often 5-30 seconds for complex outputs. Streaming fundamentally changes the user experience:

- **Perceived latency drops from seconds to milliseconds** — users see the first token in ~300ms
- **Users can read while the model writes** — natural reading speed matches generation speed
- **Early cancellation saves money** — abort a bad response after the first sentence, not after 4000 tokens
- **Tool call detection happens in real-time** — agents can begin tool execution before the model finishes
- **Back-pressure prevents memory exhaustion** — slow consumers don't crash the server

### Module Boundaries

| Concern | Handled By |
|---------|-----------|
| Stream creation & token delivery | **This module** |
| Model selection & routing | `@mcv/intelligence/gateway` (`TierRouter`) |
| Usage logging after stream completion | `@mcv/intelligence/gateway` (`UsageTracker`) |
| Cost calculation | `@mcv/intelligence/gateway` (`McvGateway.calculateCost`) |
| Budget enforcement before streaming | `@mcv/intelligence/gateway` (`BudgetManager`, `AgentBudgetManager`) |
| Rate limiting before streaming | `@mcv/intelligence/gateway` (`RateLimiter`) |
| Distributed tracing correlation | `@mcv/intelligence/gateway` (`CorrelationContext`) |
| Metrics aggregation & dashboards | `@mcv/intelligence/metrics` |
| Client-side rendering of streamed markdown | **This module** (client components) |
| Audit event logging | `@mcv/audit` (via `GatewayAuditLogger`) |

### Current Implementation Status

The streaming module is currently implemented within the `@mcv/gateway` package. Key locations:

| Future Module Path | Current Implementation |
|---|---|
| `streaming/server/stream-service` | `@mcv/gateway/server/client.ts` → `McvGateway.stream()` |
| `streaming/server/transports` | Inline SSE in API route handlers |
| `streaming/client/hooks/use-stream-chat` | `@mcv/gateway/client/hooks/use-gateway-stream.ts` |
| `streaming/types` | `@mcv/gateway/types/gateway.ts` → `StreamResult`, `StreamPart` |
| `streaming/constants` | `@mcv/gateway/constants/index.ts` |

During Phase 2 refactoring, these will be extracted into the dedicated `@mcv/intelligence/streaming` module.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// STREAM CREATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  streamChat,               // Create streaming chat completion
  streamComplete,           // Create streaming text completion
  createStream,             // Low-level stream creation
} from './server/services/stream-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createSSEStream,          // Create SSE ReadableStream for HTTP responses
  createWebSocketStream,    // Create WebSocket stream handler
  createSSEResponse,        // Create complete SSE Response object
} from './server/transports';

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  StreamParser,             // Stateful stream parser
  StreamAggregator,         // Aggregate stream chunks into complete response
  StreamTransformer,        // Transform stream chunks (filter, map, etc.)
  streamToString,           // Collect stream to string
  streamToResponse,         // Collect stream to ChatResponse
} from './server/processing';

// ═══════════════════════════════════════════════════════════════════════════════
// BACK-PRESSURE & FLOW CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createBufferedStream,     // Buffer stream with back-pressure
  createThrottledStream,    // Throttle stream output rate
  createBatchedStream,      // Batch tokens into larger chunks
} from './server/flow-control';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useStreamChat } from './client/hooks/use-stream-chat';
export { useStreamCompletion } from './client/hooks/use-stream-completion';
export { useSSEConnection } from './client/hooks/use-sse-connection';
export { useStreamState } from './client/hooks/use-stream-state';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { StreamingResponse } from './client/components/streaming-response';
export { StreamingMarkdown } from './client/components/streaming-markdown';
export { TypingIndicator } from './client/components/typing-indicator';
export { StreamStatusBadge } from './client/components/stream-status-badge';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SSE_HEADERS,
  STREAM_EVENTS,
  DEFAULT_STREAM_TIMEOUT,
  DEFAULT_RECONNECT_DELAY,
  MAX_RECONNECT_ATTEMPTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  StreamChunk,
  StreamEvent,
  StreamOptions,
  StreamState,
  SSEConfig,
  WebSocketConfig,
  StreamParserConfig,
  StreamAggregatorResult,
  StreamTransform,
  BufferConfig,
  ThrottleConfig,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            STREAMING ARCHITECTURE                                     │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          CLIENT LAYER                                          │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  Browser      │  │  React Hook  │  │  Node.js     │  │  Mobile      │      │   │
│  │  │  EventSource  │  │  useGateway  │  │  Client      │  │  Client      │      │   │
│  │  │  (SSE)        │  │  Stream()    │  │  (WebSocket) │  │  (SSE/WS)    │      │   │
│  │  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                  │                  │                  │              │   │
│  │         └──────────────────┴──────────────────┴──────────────────┘              │   │
│  │                                    │                                            │   │
│  └────────────────────────────────────┼────────────────────────────────────────────┘   │
│                                       │ HTTP/WS                                        │
│  ┌────────────────────────────────────▼────────────────────────────────────────────┐   │
│  │                          TRANSPORT LAYER                                         │   │
│  │                                                                                  │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                     │   │
│  │  │       SSE Transport      │  │    WebSocket Transport   │                     │   │
│  │  │                          │  │                          │                     │   │
│  │  │ • ReadableStream API     │  │ • Bi-directional comms   │                     │   │
│  │  │ • Auto-reconnect         │  │ • Binary + text frames   │                     │   │
│  │  │ • Event ID tracking      │  │ • Ping/pong keepalive    │                     │   │
│  │  │ • Last-Event-ID resume   │  │ • Stream multiplexing    │                     │   │
│  │  │ • Keep-alive heartbeat   │  │ • Per-message auth       │                     │   │
│  │  └─────────────┬────────────┘  └─────────────┬────────────┘                     │   │
│  │                │                              │                                  │   │
│  │                └──────────────┬───────────────┘                                  │   │
│  │                               │                                                  │   │
│  └───────────────────────────────┼──────────────────────────────────────────────────┘   │
│                                  │                                                      │
│  ┌───────────────────────────────▼──────────────────────────────────────────────────┐   │
│  │                          STREAM PIPELINE                                          │   │
│  │                                                                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  1.      │  │  2.      │  │  3.      │  │  4.      │  │  5.      │           │   │
│  │  │ Provider │─▶│  Parse   │─▶│ Transform│─▶│  Buffer  │─▶│ Deliver  │           │   │
│  │  │ Stream   │  │  Chunks  │  │ & Filter │  │ & Flow   │  │ to Client│           │   │
│  │  │          │  │          │  │          │  │ Control  │  │          │           │   │
│  │  │• OpenAI  │  │• SSE line│  │• Token   │  │• Back-   │  │• SSE     │           │   │
│  │  │  format  │  │  parser  │  │  callback│  │  pressure│  │• WS      │           │   │
│  │  │• Anthro. │  │• JSON    │  │• Tool    │  │• Throttle│  │• Callback│           │   │
│  │  │  format  │  │  decode  │  │  detect  │  │• Batch   │  │• Iterator│           │   │
│  │  │• Google  │  │• Delta   │  │• Content │  │• High-   │  │• React   │           │   │
│  │  │  format  │  │  extract │  │  filter  │  │  water   │  │  state   │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  │                                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐     │   │
│  │  │                       AGGREGATION LAYER                                   │     │   │
│  │  │                                                                           │     │   │
│  │  │  Parallel tracking: full text │ token count │ tool calls │ finish reason  │     │   │
│  │  │  On completion: usage stats │ cost calculation │ latency │ trace logging  │     │   │
│  │  │  TTFT measurement │ tokens/sec calculation │ stream duration tracking     │     │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘     │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          INTEGRATION LAYER                                         │   │
│  │                                                                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │   │
│  │  │ Gateway Module   │  │ Metrics Module   │  │ Audit Module    │                   │   │
│  │  │                  │  │                  │  │                  │                   │   │
│  │  │ • Model routing  │  │ • TTFT tracking  │  │ • Stream events  │                   │   │
│  │  │ • Usage logging  │  │ • Throughput     │  │ • Error logging  │                   │   │
│  │  │ • Cost tracking  │  │ • Cost tracking  │  │ • Access control │                   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │   │
│  │                                                                                    │   │
│  └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Detail

```
User Request → Gateway (model selection) → Provider API (streaming)
                                                │
                                          Raw SSE bytes
                                                │
                                          ┌─────▼─────┐
                                          │  Parser    │ ← Vercel AI SDK streamText()
                                          │  (SSE →    │    + eventsource-parser
                                          │  chunks)   │
                                          └─────┬──────┘
                                                │
                                          StreamPart[]
                                                │
                                    ┌───────────┼───────────┐
                                    │           │           │
                              ┌─────▼────┐ ┌───▼────┐ ┌───▼─────┐
                              │ Callbacks│ │  SSE   │ │   WS    │
                              │ onChunk()│ │Response│ │  Frame  │
                              │ onFinish│ │        │ │         │
                              └──────────┘ └────────┘ └─────────┘
                                                │           │
                                          ┌─────▼───────────▼─────┐
                                          │     Client Layer       │
                                          │  useGatewayStream()    │
                                          │  React hooks / JS SDK  │
                                          └────────────────────────┘
```

### Internal Gateway Stream Flow

This diagram shows the actual execution path within `McvGateway.stream()`:

```
McvGateway.stream(params, options)
│
├─ 1. Create correlation IDs (traceId, spanId)
│     └─ CorrelationContext.set(correlationIds)
│
├─ 2. Audit: logRequestStart({ requestId, model: 'pending' })
│
├─ 3. Budget checks (venture + agent)
│     ├─ BudgetManager.check(ventureId)
│     └─ AgentBudgetManager.check(ventureId, agentType)
│         └─ Throws GatewayBudgetError if exceeded
│
├─ 4. Route to model
│     └─ TierRouter.route(params) → { tier, model, provider, complexityScore }
│
├─ 5. Rate limit check
│     └─ RateLimiter.check(ventureId, userId, model, tier, estimatedTokens)
│         └─ Throws GatewayRateLimitError if exceeded
│
├─ 6. Setup timeout + abort
│     ├─ AbortController with REQUEST_TIMEOUTS.streaming
│     └─ Chain user's abortSignal if provided
│
├─ 7. Execute streamText() via Vercel AI SDK
│     ├─ openrouter.chat(routing.model)
│     ├─ Pass messages, tools, temperature, maxTokens
│     ├─ Pass correlation headers for tracing
│     └─ onFinish callback:
│         ├─ Calculate cost via calculateCost()
│         ├─ UsageTracker.record({ ...usage, correlationIds })
│         ├─ BudgetManager.recordSpend(ventureId, cost)
│         ├─ AgentBudgetManager.recordSpend(ventureId, agentType, cost, tokens)
│         ├─ RateLimiter.record(ventureId, userId, model, tokens)
│         └─ Audit: logRequestComplete() or logRequestFailed()
│
└─ 8. Return StreamResult
      ├─ textStream: AsyncIterable<string>
      ├─ fullStream: AsyncIterable<StreamPart> (transformed)
      ├─ text: Promise<string>
      ├─ usage: Promise<TokenUsage>
      ├─ cost: Promise<CostBreakdown>
      └─ finishReason: Promise<FinishReason>
```

---

## Core Interfaces

### StreamPart (Current Implementation)

The actual stream part type from the current `@mcv/gateway` implementation. This is the fundamental discriminated union that flows through the stream pipeline:

```typescript
/**
 * Stream part types — discriminated union for all stream events.
 *
 * The fullStream async iterable yields these parts. Each part has a
 * `type` discriminant that determines which fields are available.
 *
 * From: @mcv/gateway/types/gateway.ts
 */
export type StreamPart =
  | { type: 'text-delta'; textDelta: string }
  | { type: 'tool-call'; toolCall: ToolCall }
  | { type: 'tool-result'; toolResult: { toolCallId: string; result: unknown } }
  | { type: 'error'; error: Error }
  | { type: 'finish'; finishReason: FinishReason; usage: TokenUsage };
```

### StreamResult (Current Implementation)

The return type of `McvGateway.stream()` — the primary server-side streaming interface:

```typescript
/**
 * Result of a streaming gateway request.
 *
 * Provides multiple consumption patterns:
 * - textStream: Simple async iterable of text chunks
 * - fullStream: Rich async iterable with tool calls, errors, finish events
 * - text/usage/cost/finishReason: Promises that resolve when stream completes
 *
 * From: @mcv/gateway/types/gateway.ts
 */
export interface StreamResult {
  /** Async iterable of text chunks (content only, no metadata) */
  textStream: AsyncIterable<string>;

  /** Async iterable of all stream parts (includes tool calls, errors, finish) */
  fullStream: AsyncIterable<StreamPart>;

  /** Promise that resolves to the full concatenated text when stream completes */
  text: Promise<string>;

  /** Promise that resolves to token usage statistics */
  usage: Promise<TokenUsage>;

  /** Promise that resolves to cost breakdown */
  cost: Promise<CostBreakdown>;

  /** Promise that resolves to finish reason */
  finishReason: Promise<FinishReason>;
}
```

### StreamChunk (Future Module Interface)

The normalized chunk type that the dedicated streaming module will expose. Each chunk represents a single event from the LLM provider, normalized regardless of upstream provider format:

```typescript
/**
 * A single chunk from an LLM streaming response.
 *
 * StreamChunks are emitted in order and contain either content tokens,
 * tool call deltas, or stream lifecycle events. The `done` flag indicates
 * the final chunk, which includes usage statistics.
 *
 * @example
 * // Content token chunk
 * { content: "Hello", event: "token", done: false, index: 0, timestamp: 1707400000000 }
 *
 * // Final chunk with usage
 * { content: "", event: "done", done: true, finishReason: "stop",
 *   usage: { promptTokens: 50, completionTokens: 120, totalTokens: 170 },
 *   index: 42, timestamp: 1707400003500 }
 */
interface StreamChunk {
  /** Token content (empty string for non-content events) */
  content: string;

  /** Stream event type */
  event: StreamEventType;

  /** Whether this is the final chunk */
  done: boolean;

  /** Tool call delta (if model is calling tools) */
  toolCallDelta?: {
    /** Unique tool call ID (stable across deltas) */
    id: string;
    /** Tool function name (only in first delta) */
    name?: string;
    /** Partial JSON arguments string (accumulated across deltas) */
    arguments?: string;
    /** Tool call index (for parallel tool calls) */
    index?: number;
  };

  /** Finish reason (only on final chunk) */
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';

  /** Usage data (only on final chunk, if available from provider) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Model identifier that generated this chunk */
  model?: string;

  /** Chunk index in stream (0-based, monotonically increasing) */
  index: number;

  /** Unix timestamp of this chunk (milliseconds) */
  timestamp: number;
}

/**
 * Stream event types representing the lifecycle of a streaming response.
 *
 * Events flow: token* → (tool_call_start → tool_call_delta* → tool_call_end)* → done
 * Any event can be interrupted by 'error'.
 */
type StreamEventType =
  | 'token'           // Normal text token
  | 'tool_call_start' // Tool call begins (name available)
  | 'tool_call_delta' // Tool call argument fragment
  | 'tool_call_end'   // Tool call arguments complete, ready to execute
  | 'error'           // Stream error (may be recoverable)
  | 'done';           // Stream complete (final chunk)
```

### StreamOptions

Configuration for stream creation and lifecycle callbacks:

```typescript
/**
 * Options for creating and consuming an LLM stream.
 *
 * All callbacks are optional. If no callbacks are provided, the stream
 * can be consumed via the async iterator interface instead.
 *
 * @example
 * const options: StreamOptions = {
 *   onToken: (t) => process.stdout.write(t),
 *   onComplete: (r) => console.log(`Done: ${r.usage.totalTokens} tokens`),
 *   signal: abortController.signal,
 *   timeoutMs: 30000,
 * };
 */
interface StreamOptions {
  /** Callback for each content token (text only, no metadata) */
  onToken?: (token: string) => void;

  /** Callback for each chunk (includes full metadata) */
  onChunk?: (chunk: StreamChunk) => void;

  /** Callback when a complete tool call is detected */
  onToolCall?: (toolCall: ToolCall) => void;

  /** Callback on stream completion with full aggregated response */
  onComplete?: (response: ChatResponse) => void;

  /** Callback on stream error */
  onError?: (error: StreamError) => void;

  /** Callback for TTFT measurement (time to first token in ms) */
  onFirstToken?: (ttftMs: number) => void;

  /** AbortSignal for cancellation */
  signal?: AbortSignal;

  /** Stream timeout in milliseconds (default: 60000) */
  timeoutMs?: number;

  /** Enable automatic reconnection on network disconnect (default: true) */
  autoReconnect?: boolean;

  /** Maximum reconnection attempts before giving up (default: 3) */
  maxReconnectAttempts?: number;

  /** Initial reconnection delay in milliseconds (default: 1000) */
  reconnectDelayMs?: number;

  /** Reconnection backoff strategy (default: 'exponential') */
  reconnectBackoff?: 'fixed' | 'linear' | 'exponential';
}
```

### UseGatewayStreamOptions (Current Client Implementation)

The actual React hook options from `use-gateway-stream.ts`:

```typescript
/**
 * Options for the useGatewayStream React hook.
 *
 * This is the primary client-side streaming interface. The hook manages
 * the full lifecycle of SSE streaming including fetch, parsing, state
 * management, and cleanup.
 *
 * From: @mcv/gateway/client/hooks/use-gateway-stream.ts
 */
export interface UseGatewayStreamOptions {
  /** Gateway context with venture and user info (required) */
  context: GatewayContext;

  /** Override complexity-based tier routing */
  forcedTier?: ModelTier;

  /** Override tier-based model selection with a specific model ID */
  forcedModel?: string;

  /** Custom API endpoint (defaults to /api/gateway/stream) */
  apiEndpoint?: string;

  /** Callback when streaming starts */
  onStart?: () => void;

  /** Callback for each text chunk received */
  onChunk?: (chunk: string) => void;

  /** Callback when streaming completes with full result */
  onFinish?: (result: StreamFinishResult) => void;

  /** Callback on streaming error */
  onError?: (error: Error) => void;
}

/**
 * Result passed to the onFinish callback when a stream completes.
 */
export interface StreamFinishResult {
  /** Full accumulated text content */
  text: string;

  /** Model that was used (from response metadata) */
  model: string | null;

  /** Tier that was used */
  tier: ModelTier | null;

  /** Token usage statistics */
  usage: TokenUsage | null;

  /** Budget status after the request */
  budgetStatus: BudgetStatus | null;

  /** Reason the generation finished */
  finishReason: FinishReason | null;
}

/**
 * Return type for the useGatewayStream hook.
 * Provides reactive state and imperative controls.
 */
export interface UseGatewayStreamReturn {
  /** Current accumulated streamed text */
  text: string;

  /** Whether a stream is currently active */
  isStreaming: boolean;

  /** Error if the stream failed */
  error: Error | null;

  /** The gateway context being used */
  context: GatewayContext;

  /** Current budget status (if available from metadata events) */
  budgetStatus: BudgetStatus | null;

  /** Whether the venture/agent budget is exceeded */
  isBudgetExceeded: boolean;

  /** Last model used (from response metadata) */
  lastModel: string | null;

  /** Last tier used (from response metadata) */
  lastTier: ModelTier | null;

  /** Last token usage stats */
  lastUsage: TokenUsage | null;

  /** Start streaming with the given messages */
  stream: (messages: ChatMessage[]) => Promise<void>;

  /** Abort the current stream */
  abort: () => void;

  /** Reset all state to initial values */
  reset: () => void;
}
```

### SSEConfig

Configuration for Server-Sent Events transport:

```typescript
/**
 * Configuration for SSE (Server-Sent Events) stream transport.
 *
 * SSE is the default transport for browser clients. It provides
 * unidirectional server-to-client streaming with automatic reconnection
 * built into the EventSource browser API.
 */
interface SSEConfig {
  /** Custom event formatter for non-standard SSE event shapes */
  formatEvent?: (chunk: StreamChunk) => SSEEvent;

  /** Include usage data in the final SSE event (default: true) */
  includeUsage?: boolean;

  /** Keep-alive comment interval to prevent proxy timeouts (default: 15000ms) */
  keepAliveMs?: number;

  /** Additional response headers */
  headers?: Record<string, string>;

  /** Enable Last-Event-ID based stream resumption (default: true) */
  enableResume?: boolean;

  /** Custom retry interval sent to client in ms (default: 3000) */
  retryMs?: number;
}

/** A single SSE event as sent over the wire */
interface SSEEvent {
  /** Event type (maps to EventSource.addEventListener) */
  event?: string;
  /** Event data payload (JSON stringified) */
  data: string;
  /** Unique event ID for Last-Event-ID resumption */
  id?: string;
  /** Client retry interval in ms */
  retry?: number;
}
```

### WebSocketConfig

Configuration for WebSocket transport:

```typescript
/**
 * Configuration for WebSocket stream transport.
 *
 * WebSocket transport is preferred for bidirectional communication,
 * binary data, and scenarios requiring multiple concurrent streams
 * on a single connection (multiplexing).
 */
interface WebSocketConfig {
  /** Message serialization format (default: 'json') */
  format?: 'json' | 'binary';

  /** Enable ping/pong keepalive frames (default: true) */
  keepAlive?: boolean;

  /** Keepalive ping interval in milliseconds (default: 30000) */
  keepAliveMs?: number;

  /** Enable stream multiplexing — multiple streams on one connection (default: false) */
  multiplex?: boolean;

  /** Custom message formatter for non-standard WebSocket protocols */
  formatMessage?: (chunk: StreamChunk) => unknown;

  /** Maximum message size in bytes (default: 1048576 = 1MB) */
  maxMessageSize?: number;
}
```

### StreamState

Client-side stream state for React hooks and UI rendering:

```typescript
/**
 * Reactive stream state used by client-side hooks.
 * Drives UI rendering — status determines what's shown, content
 * accumulates the response, and performance metrics update in real-time.
 */
interface StreamState {
  /** Current stream lifecycle status */
  status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

  /** Accumulated text content from all tokens received so far */
  content: string;

  /** Number of content tokens received */
  tokenCount: number;

  /** Time to first token in milliseconds (null if not yet received) */
  ttftMs: number | null;

  /** Total stream duration in milliseconds (null if not complete) */
  durationMs: number | null;

  /** Current throughput in tokens per second (rolling average) */
  tokensPerSecond: number;

  /** Pending or completed tool calls detected during streaming */
  toolCalls: ToolCall[];

  /** Error details if status is 'error' */
  error: StreamError | null;

  /** Whether the stream can be cancelled via AbortController */
  abortable: boolean;
}
```

### StreamError

Structured error type for stream failures:

```typescript
/**
 * Structured error for stream failures.
 * Includes machine-readable code, human-readable message, and recovery info.
 * Transient errors (network, timeout) are automatically retried when
 * autoReconnect is enabled.
 */
interface StreamError {
  /** Machine-readable error code */
  code: StreamErrorCode;

  /** Human-readable error message */
  message: string;

  /** Whether this error is retryable */
  retryable: boolean;

  /** HTTP status code from provider (if applicable) */
  statusCode?: number;

  /** Upstream provider error details */
  providerError?: {
    provider: string;
    code: string;
    message: string;
  };

  /** Number of retry attempts already made */
  retryCount?: number;

  /** Timestamp of the error */
  timestamp: number;
}

type StreamErrorCode =
  | 'STREAM_TIMEOUT'           // Stream exceeded timeoutMs
  | 'STREAM_ABORTED'           // Cancelled via AbortController
  | 'STREAM_NETWORK_ERROR'     // Network connectivity failure
  | 'STREAM_PARSE_ERROR'       // Failed to parse provider SSE data
  | 'STREAM_PROVIDER_ERROR'    // Upstream provider returned error
  | 'STREAM_RATE_LIMITED'      // Rate limit exceeded
  | 'STREAM_CONTENT_FILTER'    // Content blocked by safety filter
  | 'STREAM_OVERLOADED'        // Provider is overloaded (503)
  | 'STREAM_AUTH_ERROR'        // Authentication failure
  | 'STREAM_BUDGET_EXCEEDED'   // Venture/agent budget exhausted
  | 'STREAM_MAX_TOKENS'        // Max token limit reached
  | 'STREAM_CONNECTION_RESET'  // Connection reset by peer
  | 'STREAM_INTERNAL_ERROR';   // Unexpected internal error
```

### Gateway Error Classes (Current Implementation)

The actual error classes used in the streaming pipeline from `@mcv/gateway`:

```typescript
/**
 * Custom error for budget-related failures during streaming.
 * Thrown when venture or agent budget is exceeded before stream creation.
 *
 * From: @mcv/gateway/server/client.ts
 */
export class GatewayBudgetError extends Error {
  public readonly status: BudgetStatus;
  public readonly correlationIds?: CorrelationIds;

  constructor(message: string, status: BudgetStatus, correlationIds?: CorrelationIds) {
    super(message);
    this.name = 'GatewayBudgetError';
    this.status = status;
    this.correlationIds = correlationIds;
  }

  getTraceId(): string | undefined {
    return this.correlationIds?.traceId;
  }
}

/**
 * Custom error for rate limiting during streaming.
 * Includes retry-after information for client back-off.
 */
export class GatewayRateLimitError extends Error {
  public readonly rateLimitResult: RateLimitResult;
  public readonly correlationIds?: CorrelationIds;

  constructor(result: RateLimitResult, correlationIds?: CorrelationIds) {
    const limitedBy = result.limitedBy ?? 'unknown';
    super(
      `Rate limit exceeded at ${limitedBy} level. ` +
      `Current: ${result.currentCount}/${result.limit}. ` +
      `Retry after ${result.retryAfter ?? Math.ceil(result.resetInMs / 1000)}s`
    );
    this.name = 'GatewayRateLimitError';
    this.rateLimitResult = result;
    this.correlationIds = correlationIds;
  }

  getRetryAfter(): number {
    return this.rateLimitResult.retryAfter ?? Math.ceil(this.rateLimitResult.resetInMs / 1000);
  }
}

/**
 * Custom error for execution failures with retry/failover details.
 * Provides a summary of all attempts made before final failure.
 */
export class GatewayExecutionError extends Error {
  public readonly errorInfo: GatewayErrorInfo;
  public readonly failoverAttempts: FailoverAttempt[];
  public readonly retryAttempts: RetryAttempt[];
  public readonly correlationIds?: CorrelationIds;

  constructor(
    errorInfo: GatewayErrorInfo,
    failoverAttempts: FailoverAttempt[] = [],
    retryAttempts: RetryAttempt[] = [],
    correlationIds?: CorrelationIds,
  ) { /* ... */ }

  getSummary(): string {
    // Returns: "Error: msg | trace=xxx | Retries: 3 | Failovers: model-a -> model-b"
  }
}
```

### BufferConfig & ThrottleConfig

Flow control configuration interfaces:

```typescript
/**
 * Configuration for buffered streams with back-pressure management.
 */
interface BufferConfig {
  /** Maximum chunks to buffer before applying back-pressure (default: 100) */
  highWaterMark: number;

  /** Resume threshold — when buffer drains to this level, resume reading (default: 25) */
  lowWaterMark?: number;

  /** Callback when back-pressure is applied/released */
  onPressure?: (level: number) => void;

  /** Strategy when buffer overflows: 'drop' oldest or 'block' producer */
  overflowStrategy?: 'drop' | 'block';
}

/**
 * Configuration for throttled streams with rate limiting.
 */
interface ThrottleConfig {
  /** Maximum tokens per second to deliver (default: unlimited) */
  tokensPerSecond: number;

  /** Smoothing strategy: 'even' distributes evenly, 'burst' allows micro-bursts */
  strategy?: 'even' | 'burst';

  /** Burst size for 'burst' strategy (default: 5 tokens) */
  burstSize?: number;
}

/**
 * Configuration for batched streams that group tokens.
 */
interface BatchConfig {
  /** Number of tokens to group per batch (default: 5) */
  batchSize: number;

  /** Maximum time to wait before flushing a partial batch (default: 100ms) */
  flushIntervalMs: number;

  /** Whether to emit individual tokens alongside batches (default: false) */
  emitIndividual?: boolean;
}
```

### StreamAggregatorResult

Result of collecting an entire stream into a single response:

```typescript
/**
 * Complete result after a stream has been fully consumed.
 * Contains aggregated content plus all performance metrics.
 */
interface StreamAggregatorResult {
  /** Full concatenated text content */
  content: string;

  /** Finish reason from the final chunk */
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';

  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** All tool calls detected during the stream */
  toolCalls: ToolCall[];

  /** Model that generated the response */
  model: string;

  /** Performance metrics */
  performance: {
    /** Time to first token (ms) */
    ttftMs: number;
    /** Total stream duration (ms) */
    totalMs: number;
    /** Average tokens per second */
    tokensPerSecond: number;
    /** Total chunks received */
    chunkCount: number;
    /** Average inter-token latency (ms) */
    avgInterTokenMs: number;
    /** P99 inter-token latency (ms) */
    p99InterTokenMs: number;
  };
}
```

### Supporting Types from Gateway

These types are used throughout the streaming pipeline:

```typescript
/**
 * Correlation IDs for distributed tracing across the stream lifecycle.
 * Created at stream start, passed to provider via headers, logged on completion.
 *
 * From: @mcv/gateway/types/gateway.ts
 */
export interface CorrelationIds {
  /** Unique trace ID for the entire request chain */
  traceId: string;
  /** Span ID for this specific operation */
  spanId: string;
  /** Parent span ID (if this is a child operation) */
  parentSpanId?: string;
  /** Root request ID that initiated the chain */
  rootRequestId?: string;
}

/**
 * Token usage statistics returned by providers.
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Cost breakdown calculated after stream completion.
 */
export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Reason for generation completion.
 */
export type FinishReason = 'stop' | 'length' | 'tool-calls' | 'content-filter' | 'error';

/**
 * Error classification used for retry/failover decisions during streaming.
 */
export interface GatewayErrorInfo {
  type: GatewayErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  failoverable: boolean;
  originalError?: Error;
}

export type GatewayErrorType =
  | 'timeout'
  | 'rate_limit'
  | 'model_unavailable'
  | 'overloaded'
  | 'network'
  | 'authentication'
  | 'budget_exceeded'
  | 'unknown';
```

---

## Database Schema

The streaming module is a **pure transport/processing layer** and does not define its own database tables. Stream metadata (latency, TTFT, token count, cost) is recorded via the gateway module's `llm_usage_logs` table after stream completion.

### Related Schema: `llm_usage_logs` (from gateway module)

Stream completion data flows into this table via `UsageTracker.record()` in the `onFinish` callback:

```typescript
// From @mcv/db/schema/gateway.ts
export const llmUsageLogs = pgTable('llm_usage_logs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').references(() => ventures.id).notNull(),
  requestId:        varchar('request_id', { length: 64 }).notNull().unique(),

  // User context
  userId:           uuid('user_id'),

  // Model info
  model:            varchar('model', { length: 128 }).notNull(),
  tier:             integer('tier').notNull(),                    // 0-4
  provider:         varchar('provider', { length: 64 }),

  // Token usage
  promptTokens:     integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens:      integer('total_tokens').notNull(),

  // Cost tracking
  costUsd:          decimal('cost_usd', { precision: 10, scale: 6 }).notNull(),

  // Performance
  latencyMs:        integer('latency_ms'),                       // Total stream duration

  // Routing metadata
  complexityScore:  decimal('complexity_score', { precision: 4, scale: 2 }),
  agentType:        varchar('agent_type', { length: 32 }),
  taskId:           varchar('task_id', { length: 64 }),
  sessionId:        varchar('session_id', { length: 64 }),

  // Distributed tracing - correlation IDs
  traceId:          varchar('trace_id', { length: 64 }),
  spanId:           varchar('span_id', { length: 64 }),
  parentSpanId:     varchar('parent_span_id', { length: 64 }),

  // Status
  status:           varchar('status', { length: 16 }).notNull().default('completed'),
  errorMessage:     varchar('error_message', { length: 512 }),

  // Timestamps
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('llm_usage_venture_created_idx').on(table.ventureId, table.createdAt),
  index('llm_usage_model_created_idx').on(table.model, table.createdAt),
  index('llm_usage_agent_type_idx').on(table.agentType),
  index('llm_usage_user_id_idx').on(table.userId),
  index('llm_usage_trace_id_idx').on(table.traceId),
]);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `venture_id` | `uuid` | FK → ventures. Scopes usage to a venture |
| `request_id` | `varchar(64)` | Unique request identifier (for dedup) |
| `user_id` | `uuid` | User who initiated the request (nullable) |
| `model` | `varchar(128)` | Model ID (e.g., `anthropic/claude-3.5-sonnet`) |
| `tier` | `integer` | Model tier 0-4 |
| `provider` | `varchar(64)` | Provider name (e.g., `anthropic`, `openai`) |
| `prompt_tokens` | `integer` | Input token count |
| `completion_tokens` | `integer` | Output token count (from stream aggregation) |
| `total_tokens` | `integer` | Sum of prompt + completion tokens |
| `cost_usd` | `decimal(10,6)` | Calculated cost in USD |
| `latency_ms` | `integer` | Total stream duration in ms |
| `complexity_score` | `decimal(4,2)` | Routing complexity score (0-10) |
| `agent_type` | `varchar(32)` | Agent identifier (queen, ralph, etc.) |
| `task_id` | `varchar(64)` | Task correlation ID |
| `session_id` | `varchar(64)` | Session correlation ID |
| `trace_id` | `varchar(64)` | Distributed trace ID |
| `span_id` | `varchar(64)` | Span ID for this operation |
| `parent_span_id` | `varchar(64)` | Parent span for trace hierarchy |
| `status` | `varchar(16)` | `completed`, `failed`, `timeout` |
| `error_message` | `varchar(512)` | Error details if status is not `completed` |
| `created_at` | `timestamptz` | Record creation time |

### Related Schema: `venture_budgets`

Budget status checked before stream creation:

```typescript
export const ventureBudgets = pgTable('venture_budgets', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').references(() => ventures.id).notNull().unique(),
  dailyLimitUsd:          decimal('daily_limit_usd', { precision: 10, scale: 2 }).notNull().default('100'),
  monthlyLimitUsd:        decimal('monthly_limit_usd', { precision: 10, scale: 2 }).notNull().default('2000'),
  dailySpentUsd:          decimal('daily_spent_usd', { precision: 10, scale: 2 }).notNull().default('0'),
  monthlySpentUsd:        decimal('monthly_spent_usd', { precision: 10, scale: 2 }).notNull().default('0'),
  alertThresholdPercent:  integer('alert_threshold_percent').notNull().default(80),
  alertSentAt:            timestamp('alert_sent_at', { withTimezone: true }),
  hardLimit:              boolean('hard_limit').notNull().default(false),
  lastResetDaily:         timestamp('last_reset_daily', { withTimezone: true }),
  lastResetMonthly:       timestamp('last_reset_monthly', { withTimezone: true }),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Related Schema: `agent_budgets`

Per-agent budget checked before stream creation when `agentType` is provided:

```typescript
export const agentBudgets = pgTable('agent_budgets', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').references(() => ventures.id).notNull(),
  agentType:              varchar('agent_type', { length: 32 }).notNull(),
  dailyLimitUsd:          decimal('daily_limit_usd', { precision: 10, scale: 2 }).notNull().default('10'),
  monthlyLimitUsd:        decimal('monthly_limit_usd', { precision: 10, scale: 2 }).notNull().default('200'),
  dailySpentUsd:          decimal('daily_spent_usd', { precision: 10, scale: 2 }).notNull().default('0'),
  monthlySpentUsd:        decimal('monthly_spent_usd', { precision: 10, scale: 2 }).notNull().default('0'),
  dailyTokensUsed:        integer('daily_tokens_used').notNull().default(0),
  monthlyTokensUsed:      integer('monthly_tokens_used').notNull().default(0),
  dailyRequests:          integer('daily_requests').notNull().default(0),
  monthlyRequests:        integer('monthly_requests').notNull().default(0),
  maxDailyRequests:       integer('max_daily_requests'),
  maxMonthlyRequests:     integer('max_monthly_requests'),
  maxDailyTokens:         integer('max_daily_tokens'),
  maxMonthlyTokens:       integer('max_monthly_tokens'),
  maxTier:                integer('max_tier'),
  preferredTier:          integer('preferred_tier'),
  hardLimit:              boolean('hard_limit').notNull().default(false),
  enabled:                boolean('enabled').notNull().default(true),
  alertThresholdPercent:  integer('alert_threshold_percent').notNull().default(80),
  alertSentAt:            timestamp('alert_sent_at', { withTimezone: true }),
  lastResetDaily:         timestamp('last_reset_daily', { withTimezone: true }),
  lastResetMonthly:       timestamp('last_reset_monthly', { withTimezone: true }),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('agent_budgets_venture_agent_idx').on(table.ventureId, table.agentType),
  uniqueIndex('agent_budgets_venture_agent_unique').on(table.ventureId, table.agentType),
]);
```

### Related Schema: `model_configs`

Model configuration used during tier routing for stream creation:

```typescript
export const modelConfigs = pgTable('model_configs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  modelId:          varchar('model_id', { length: 128 }).notNull(),
  provider:         varchar('provider', { length: 64 }).notNull(),
  displayName:      varchar('display_name', { length: 128 }).notNull(),
  tier:             integer('tier').notNull(),
  priority:         integer('priority').notNull().default(0),
  inputCostPer1m:   decimal('input_cost_per_1m', { precision: 10, scale: 4 }).notNull(),
  outputCostPer1m:  decimal('output_cost_per_1m', { precision: 10, scale: 4 }).notNull(),
  contextWindow:    integer('context_window').notNull(),
  supportsTools:    boolean('supports_tools').notNull().default(true),
  supportsVision:   boolean('supports_vision').notNull().default(false),
  supportsStreaming: boolean('supports_streaming').notNull().default(true),
  enabled:          boolean('enabled').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('model_configs_tier_priority_idx').on(table.tier, table.priority),
  uniqueIndex('model_configs_model_id_unique').on(table.modelId),
]);
```

### Indexes Summary

```sql
-- llm_usage_logs
CREATE INDEX llm_usage_venture_created_idx ON llm_usage_logs (venture_id, created_at);
CREATE INDEX llm_usage_model_created_idx   ON llm_usage_logs (model, created_at);
CREATE INDEX llm_usage_agent_type_idx      ON llm_usage_logs (agent_type);
CREATE INDEX llm_usage_user_id_idx         ON llm_usage_logs (user_id);
CREATE INDEX llm_usage_trace_id_idx        ON llm_usage_logs (trace_id);

-- model_configs
CREATE INDEX model_configs_tier_priority_idx ON model_configs (tier, priority);
CREATE UNIQUE INDEX model_configs_model_id_unique ON model_configs (model_id);

-- agent_budgets
CREATE INDEX agent_budgets_venture_agent_idx ON agent_budgets (venture_id, agent_type);
CREATE UNIQUE INDEX agent_budgets_venture_agent_unique ON agent_budgets (venture_id, agent_type);
```

---

## Constants

```typescript
/**
 * Standard SSE response headers.
 * Must be set on every SSE endpoint to prevent buffering.
 */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',        // Disable nginx buffering
  'X-Content-Type-Options': 'nosniff',
} as const;

/**
 * Standard stream event names used in SSE event: field.
 */
export const STREAM_EVENTS = {
  TOKEN: 'token',
  TOOL_CALL_START: 'tool_call_start',
  TOOL_CALL_DELTA: 'tool_call_delta',
  TOOL_CALL_END: 'tool_call_end',
  ERROR: 'error',
  DONE: 'done',
  KEEPALIVE: 'keepalive',
} as const;

/** Default stream timeout: 60 seconds */
export const DEFAULT_STREAM_TIMEOUT = 60_000;

/** Default reconnection delay: 1 second */
export const DEFAULT_RECONNECT_DELAY = 1_000;

/** Maximum reconnection attempts before giving up */
export const MAX_RECONNECT_ATTEMPTS = 3;

/** SSE keep-alive interval: 15 seconds */
export const DEFAULT_KEEPALIVE_MS = 15_000;

/** WebSocket ping interval: 30 seconds */
export const DEFAULT_WS_KEEPALIVE_MS = 30_000;

/**
 * Request timeouts from gateway constants.
 * Different tiers get different timeout windows.
 *
 * From: @mcv/gateway/constants/index.ts
 */
export const REQUEST_TIMEOUTS = {
  default: 30_000,     // 30s for standard requests
  reasoning: 120_000,  // 120s for T4 reasoning models
  streaming: 300_000,  // 5min for streaming (total stream duration)
} as const;

/**
 * Retry configuration used by the gateway for failed streams.
 *
 * From: @mcv/gateway/constants/index.ts
 */
export const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 1_000,
  maxDelayMs: 10_000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
} as const;

/**
 * Failover configuration for model fallback chains.
 *
 * From: @mcv/gateway/constants/index.ts
 */
export const FAILOVER_CONFIG = {
  enabled: true,
  maxFailovers: 2,
  fallbackTierOrder: {
    0: [1, 0],     // T0 → try T1, then another T0
    1: [2, 0],     // T1 → try T2, then T0
    2: [3, 1],     // T2 → try T3, then T1
    3: [2, 4],     // T3 → try T2, then T4
    4: [3, 2],     // T4 → try T3, then T2
  },
} as const;
```

---

## Internal Implementation

### SSE Parsing in useGatewayStream

The current client-side implementation parses SSE events from a `ReadableStream`. Here is the actual parsing logic:

```typescript
/**
 * Parse SSE data line from the stream.
 * Handles three formats: [DONE] sentinel, JSON objects, and plain text.
 *
 * From: @mcv/gateway/client/hooks/use-gateway-stream.ts
 */
function parseSSELine(line: string): { type: string; data: unknown } | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6);
  if (data === '[DONE]') return { type: 'done', data: null };
  try {
    return JSON.parse(data) as { type: string; data: unknown };
  } catch {
    // Plain text chunk
    return { type: 'text', data };
  }
}
```

### SSE Event Types

The client-side parser handles these event types from the server:

| Event Type | Data Shape | Description |
|---|---|---|
| `text` / `text-delta` | `string` or `{ textDelta: string }` | Content token chunk |
| `metadata` | `{ model?, tier?, budgetStatus? }` | Stream metadata (sent once, early) |
| `finish` | `{ finishReason?, usage? }` | Stream completion with stats |
| `error` | `{ message: string }` | Server-side error |
| `done` | `null` (`[DONE]` sentinel) | End of stream marker |

### Server-Side Stream Transform

The `McvGateway` transforms Vercel AI SDK's raw stream into the MCV `StreamPart` format:

```typescript
/**
 * Transform the full stream from Vercel AI SDK format to MCV StreamPart format.
 * This is the bridge between the AI SDK's internal types and our public API.
 *
 * From: @mcv/gateway/server/client.ts → McvGateway.transformFullStream()
 */
private async *transformFullStream(
  stream: AsyncIterable<unknown>
): AsyncIterable<StreamPart> {
  for await (const part of stream) {
    const typedPart = part as {
      type: string;
      textDelta?: string;
      toolCall?: unknown;
      toolResult?: unknown;
      error?: Error;
      finishReason?: string;
      usage?: TokenUsage;
    };

    switch (typedPart.type) {
      case 'text-delta':
        yield { type: 'text-delta', textDelta: typedPart.textDelta ?? '' };
        break;
      case 'tool-call':
        yield { type: 'tool-call', toolCall: typedPart.toolCall as ToolCall };
        break;
      case 'tool-result':
        yield {
          type: 'tool-result',
          toolResult: typedPart.toolResult as { toolCallId: string; result: unknown },
        };
        break;
      case 'error':
        yield { type: 'error', error: typedPart.error ?? new Error('Unknown error') };
        break;
      case 'finish':
        yield {
          type: 'finish',
          finishReason: this.mapFinishReason(typedPart.finishReason),
          usage: typedPart.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
        break;
    }
  }
}
```

### Error Classification

The gateway classifies errors to determine retry and failover behavior during streaming:

```typescript
/**
 * Classify an error for retry/failover decisions.
 * Used by both execute() and stream() code paths.
 *
 * From: @mcv/gateway/server/client.ts → classifyError()
 */
function classifyError(error: unknown): GatewayErrorInfo {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  // Pattern matching for error classification:
  // timeout/aborted → retryable + failoverable
  // rate limit/429  → retryable + failoverable
  // model unavailable → NOT retryable, but failoverable
  // overloaded/503  → retryable + failoverable
  // network errors  → retryable, NOT failoverable
  // auth/401        → NOT retryable, NOT failoverable
  // unknown         → NOT retryable, NOT failoverable
}
```

### OpenRouter Provider Initialization

Stream creation uses a lazy-initialized OpenRouter provider with secret management:

```typescript
/**
 * Create OpenRouter provider instance.
 * Tries system vault first, falls back to environment variable.
 *
 * From: @mcv/gateway/server/client.ts → createOpenRouterProvider()
 */
async function createOpenRouterProvider() {
  // 1. Try System Vault (Google Secret Manager)
  try {
    const secrets = new SecretManagerService();
    const secretPath = 'projects/mcv-one-prototype/secrets/mcv-system-openrouter-api-key/versions/latest';
    const apiKey = await secrets.getSecret(secretPath);
    if (apiKey) return createOpenRouter({ apiKey });
  } catch (error) {
    console.warn('[McvGateway] Failed to fetch from vault, falling back to env');
  }

  // 2. Fallback to Environment Variable
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY environment variable is required');
  return createOpenRouter({ apiKey });
}
```

---

## Provider Stream Formats

The streaming module normalizes responses from different LLM providers. All providers communicate via OpenRouter, but their SSE formats differ:

### OpenAI Format (GPT-4, GPT-4o)

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1707400000,
       "model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1707400000,
       "model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],
       "usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}

data: [DONE]
```

### Anthropic Format (Claude 3.5, Claude 4)

```
event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},
       "usage":{"output_tokens":5}}

event: message_stop
data: {"type":"message_stop"}
```

### Google Format (Gemini)

```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},
       "finishReason":"STOP","index":0}],
       "usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":5,"totalTokenCount":15}}
```

The Vercel AI SDK (`streamText()`) handles provider-specific format normalization automatically via the `@openrouter/ai-sdk-provider`. The streaming module receives already-normalized `StreamPart` events.

---

## Usage Examples

### Example 1: Basic Server-Side Streaming via McvGateway

```typescript
import { getMcvGateway } from '@mcv/gateway/server';

// Use the singleton gateway instance for streaming
const gateway = getMcvGateway();

const result = await gateway.stream({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Write a short poem about the ocean.' },
  ],
  context: {
    ventureId: 'betedge-venture-uuid',
    userId: 'user-uuid',
    agentType: 'ralph',
    sessionId: 'session-123',
  },
});

// Consume the text stream
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Access final values (these are promises that resolve when stream completes)
const text = await result.text;
const usage = await result.usage;
const cost = await result.cost;
const reason = await result.finishReason;

console.log(`\nTokens: ${usage.totalTokens}, Cost: $${cost.totalCost.toFixed(6)}`);
```

### Example 2: Rich Stream with Tool Calls

```typescript
import { getMcvGateway } from '@mcv/gateway/server';
import type { StreamPart } from '@mcv/gateway';

const gateway = getMcvGateway();

const result = await gateway.stream({
  messages: [{ role: 'user', content: 'What is the weather in Montreal?' }],
  context: {
    ventureId: 'venture-uuid',
    agentType: 'ralph',
  },
  tools: {
    getWeather: {
      description: 'Get current weather for a city',
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ temp: 22, condition: 'sunny' }),
    },
  },
});

// Use fullStream for rich events including tool calls
for await (const part of result.fullStream) {
  switch (part.type) {
    case 'text-delta':
      process.stdout.write(part.textDelta);
      break;
    case 'tool-call':
      console.log(`\n[Tool: ${part.toolCall.toolName}(${JSON.stringify(part.toolCall.args)})]`);
      break;
    case 'tool-result':
      console.log(`[Result: ${JSON.stringify(part.toolResult.result)}]`);
      break;
    case 'finish':
      console.log(`\nFinished: ${part.finishReason}, Tokens: ${part.usage.totalTokens}`);
      break;
    case 'error':
      console.error(`Error: ${part.error.message}`);
      break;
  }
}
```

### Example 3: Collect Stream to String or Response

```typescript
import { getMcvGateway } from '@mcv/gateway/server';

const gateway = getMcvGateway();

// Quick collection — useful for non-interactive contexts (agents, cron jobs)
const result = await gateway.stream({
  messages: [{ role: 'user', content: 'What is 2+2?' }],
  context: { ventureId: 'venture-uuid' },
});

// The .text promise collects the full stream automatically
const fullText = await result.text;
console.log(fullText);              // "2 + 2 = 4"

const usage = await result.usage;
console.log(usage.totalTokens);     // 42

const cost = await result.cost;
console.log(cost.totalCost);        // 0.000126
```

### Example 4: Next.js App Router SSE Endpoint

```typescript
import { getMcvGateway } from '@mcv/gateway/server';
import { auth } from '@mcv/auth';

// POST /api/gateway/stream
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, context } = await req.json();

  // Validate venture access
  if (!session.ventures.includes(context.ventureId)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const gateway = getMcvGateway();
    const result = await gateway.stream({
      messages,
      context: {
        ...context,
        userId: session.userId,
      },
    });

    // Convert to SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send metadata event first
          const routing = await gateway.getTierRouter().route({ messages, context });
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'metadata', data: { model: routing.model, tier: routing.tier } })}\n\n`
          ));

          // Stream text deltas
          for await (const part of result.fullStream) {
            const sseData = JSON.stringify(part);
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          }

          // Send usage on completion
          const [usage, cost, finishReason] = await Promise.all([
            result.usage, result.cost, result.finishReason,
          ]);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'finish', data: { usage, cost, finishReason } })}\n\n`
          ));

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', data: { message: String(error) } })}\n\n`
          ));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof GatewayBudgetError) {
      return new Response(JSON.stringify({ error: error.message, traceId: error.getTraceId() }), {
        status: 402,
      });
    }
    if (error instanceof GatewayRateLimitError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { 'Retry-After': String(error.getRetryAfter()) },
      });
    }
    throw error;
  }
}
```

### Example 5: React Client with useGatewayStream

```tsx
import { useGatewayStream } from '@mcv/gateway/client';
import type { GatewayContext } from '@mcv/gateway';
import { useState, type FormEvent } from 'react';

function StreamingChat({ ventureId }: { ventureId: string }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const {
    text,
    isStreaming,
    error,
    budgetStatus,
    isBudgetExceeded,
    lastModel,
    lastTier,
    lastUsage,
    stream,
    abort,
    reset,
  } = useGatewayStream({
    context: { ventureId } as GatewayContext,
    onStart: () => {
      console.log('Stream started');
    },
    onChunk: (chunk) => {
      // Called for each text chunk — useful for analytics
    },
    onFinish: (result) => {
      console.log(`Finished: ${result.model} (T${result.tier})`);
      console.log(`Tokens: ${result.usage?.totalTokens}`);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.text },
      ]);
    },
    onError: (error) => {
      console.error('Stream error:', error.message);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    await stream([...messages, userMessage]);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Budget warning */}
      {isBudgetExceeded && (
        <div className="bg-red-50 border-red-200 border p-3 text-red-700 text-sm">
          Budget exceeded. Contact admin to increase limits.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block rounded-lg px-4 py-2 ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Live streaming text */}
        {isStreaming && text && (
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            {text}
            <span className="animate-pulse">▊</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Model info */}
      {lastModel && (
        <div className="text-xs text-gray-400 px-4">
          {lastModel} (T{lastTier}) • {lastUsage?.totalTokens} tokens
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={isStreaming || isBudgetExceeded}
        />
        {isStreaming ? (
          <button type="button" onClick={abort} className="bg-red-500 text-white px-4 py-2 rounded">
            Stop
          </button>
        ) : (
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Send
          </button>
        )}
      </form>
    </div>
  );
}
```

### Example 6: Stream with Forced Tier/Model

```typescript
import { getMcvGateway } from '@mcv/gateway/server';

const gateway = getMcvGateway();

// Force a specific tier (e.g., always use T3 Premium for this task)
const result = await gateway.stream({
  messages: [{ role: 'user', content: 'Analyze this complex legal document...' }],
  context: {
    ventureId: 'venture-uuid',
    agentType: 'queen',
    forcedTier: 3, // Premium tier
  },
});

// Or force a specific model entirely
const result2 = await gateway.stream({
  messages: [{ role: 'user', content: 'Generate code...' }],
  context: {
    ventureId: 'venture-uuid',
    agentType: 'hephaestus',
    forcedModel: 'anthropic/claude-sonnet-4-20250514', // Specific model
  },
});

// Note: forcedModel disables failover (can't failover if model is explicit)
```

### Example 7: Stream with Abort Signal and Timeout

```typescript
import { getMcvGateway } from '@mcv/gateway/server';

const gateway = getMcvGateway();
const controller = new AbortController();

try {
  const result = await gateway.stream(
    {
      messages: [{ role: 'user', content: 'Write a very long essay...' }],
      context: { ventureId: 'venture-uuid' },
    },
    {
      timeoutMs: 30_000,              // Override default 5-minute timeout
      abortSignal: controller.signal,  // External abort
    }
  );

  // Cancel after 5 seconds
  const cancelTimer = setTimeout(() => controller.abort(), 5000);

  let tokenCount = 0;
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    tokenCount++;
  }

  clearTimeout(cancelTimer);
  console.log(`\nReceived ${tokenCount} chunks before completion/cancel`);
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Stream was cancelled — partial tokens still billed');
  }
}
```

### Example 8: Stream with Distributed Tracing

```typescript
import { getMcvGateway } from '@mcv/gateway/server';
import { createRootCorrelation } from '@mcv/gateway/server/services/correlation';

const gateway = getMcvGateway();

// Create correlation IDs for distributed tracing
const correlationIds = createRootCorrelation('parent-request-123');

const result = await gateway.stream({
  messages: [{ role: 'user', content: 'Hello' }],
  context: {
    ventureId: 'venture-uuid',
    agentType: 'queen',
    sessionId: 'session-456',
    taskId: 'task-789',
    correlationIds, // Passed to provider headers + usage logs
  },
});

// The trace ID flows through:
// 1. Correlation headers to OpenRouter/provider
// 2. Usage log record (traceId, spanId, parentSpanId columns)
// 3. Audit events (logRequestStart, logRequestComplete)
// 4. Error objects (GatewayBudgetError.getTraceId())

const text = await result.text;
console.log(`Trace: ${correlationIds.traceId}, Span: ${correlationIds.spanId}`);
```

### Example 9: Agent-Aware Streaming with Budget Tracking

```typescript
import { getMcvGateway } from '@mcv/gateway/server';
import type { AgentType } from '@mcv/gateway';

async function agentStream(
  agentType: AgentType,
  messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>,
  ventureId: string,
) {
  const gateway = getMcvGateway();

  try {
    const result = await gateway.stream({
      messages,
      context: {
        ventureId,
        agentType,
        // Agent budget is checked automatically based on agentType
      },
    });

    const text = await result.text;
    const cost = await result.cost;
    const usage = await result.usage;

    return {
      text,
      cost: cost.totalCost,
      tokens: usage.totalTokens,
    };
  } catch (error) {
    if (error instanceof GatewayBudgetError) {
      // Check if it's a venture-level or agent-level budget issue
      const status = error.status;
      console.error(
        `Budget exceeded for ${agentType}: ` +
        `daily $${status.dailySpent}/$${status.dailyLimit}, ` +
        `monthly $${status.monthlySpent}/$${status.monthlyLimit}`
      );
      throw error;
    }
    throw error;
  }
}

// Usage — each agent has its own budget allocation
await agentStream('queen', [{ role: 'user', content: 'Plan a sprint' }], 'venture-uuid');
await agentStream('ralph', [{ role: 'user', content: 'Summarize this' }], 'venture-uuid');
await agentStream('hephaestus', [{ role: 'user', content: 'Write a function' }], 'venture-uuid');
```

### Example 10: Pages Router SSE Endpoint (Legacy)

```typescript
import { getMcvGateway } from '@mcv/gateway/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, context } = req.body;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Keep-alive timer
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  try {
    const gateway = getMcvGateway();
    const result = await gateway.stream({ messages, context });

    for await (const part of result.fullStream) {
      const data = JSON.stringify(part);
      res.write(`data: ${data}\n\n`);
    }

    // Send final usage
    const [usage, cost, finishReason] = await Promise.all([
      result.usage, result.cost, result.finishReason,
    ]);
    res.write(`data: ${JSON.stringify({ type: 'finish', usage, cost, finishReason })}\n\n`);
    res.write('data: [DONE]\n\n');
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: { message: String(error) } })}\n\n`);
  } finally {
    clearInterval(keepAlive);
    res.end();
  }
}

export const config = { api: { bodyParser: true } };
```

### Example 11: Buffered Stream with Back-Pressure

```typescript
import { createBufferedStream, streamChat } from '@mcv/intelligence/streaming';

const stream = await streamChat({ messages, ventureId });

// Buffer prevents memory overflow when consumer is slower than producer
const buffered = createBufferedStream(stream, {
  highWaterMark: 100,    // Buffer up to 100 chunks
  lowWaterMark: 25,      // Resume reading at 25% capacity
  overflowStrategy: 'block', // Block producer instead of dropping
  onPressure: (level) => {
    if (level > 80) {
      console.warn(`Back-pressure at ${level}% — consumer falling behind`);
    }
  },
});

// Consumer can be arbitrarily slow without crashing the server
for await (const chunk of buffered) {
  await slowDatabaseWrite(chunk); // 50ms per chunk? No problem.
}
```

### Example 12: Throttled Stream (Typewriter Effect)

```typescript
import { createThrottledStream, streamChat } from '@mcv/intelligence/streaming';

const stream = await streamChat({ messages, ventureId });

// Deliver at most 30 tokens per second for a typewriter animation effect
const throttled = createThrottledStream(stream, {
  tokensPerSecond: 30,
  strategy: 'even',  // Distribute tokens evenly across the second
});

for await (const chunk of throttled) {
  process.stdout.write(chunk.content);
  // Tokens arrive at ~33ms intervals regardless of model speed
}
```

### Example 13: Stream Cancellation with AbortController

```typescript
import { getMcvGateway } from '@mcv/gateway/server';

const gateway = getMcvGateway();
const controller = new AbortController();

// Start streaming
const result = await gateway.stream(
  {
    messages: [{ role: 'user', content: 'Write a very long essay about philosophy.' }],
    context: { ventureId: 'venture-uuid' },
  },
  { abortSignal: controller.signal }
);

// Cancel on user action
document.getElementById('stop-btn')?.addEventListener('click', () => {
  controller.abort();
});

// Or cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

// Consuming with error handling
try {
  for await (const chunk of result.textStream) {
    appendToChat(chunk);
  }
} catch (e) {
  if (e instanceof Error && e.name === 'AbortError') {
    showToast('Generation stopped — tokens so far still billed');
  } else {
    showErrorDialog(e.message);
  }
}
```

### Example 14: Convenience Shorthand via mcvGateway

```typescript
import { mcvGateway } from '@mcv/gateway/server';

// mcvGateway provides static-like access to the singleton
const result = await mcvGateway.stream({
  messages: [{ role: 'user', content: 'Hello' }],
  context: { ventureId: 'venture-uuid' },
});

const text = await result.text;
console.log(text);

// Equivalent to:
// const gateway = getMcvGateway();
// const result = await gateway.stream({ ... });
```

### Example 15: React Streaming Chat with Full UI

```tsx
import { useGatewayStream } from '@mcv/gateway/client';
import {
  StreamingMarkdown,
  TypingIndicator,
  StreamStatusBadge,
} from '@mcv/intelligence/streaming/client';

function StreamingChat({ ventureId }: { ventureId: string }) {
  const {
    messages,
    streamState,
    sendMessage,
    cancelStream,
    clearMessages,
  } = useStreamChat({
    ventureId,
    model: 'auto',
    systemPrompt: 'You are a helpful assistant for the MCV platform.',
    onFirstToken: (ttftMs) => {
      analytics.track('stream_ttft', { ttftMs, ventureId });
    },
    onComplete: (response) => {
      analytics.track('stream_complete', {
        tokens: response.usage.totalTokens,
        cost: response.cost.totalCost,
        duration: response.latencyMs,
      });
    },
  });

  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header with status */}
      <div className="border-b p-3 flex justify-between items-center">
        <h2 className="font-semibold">AI Chat</h2>
        <div className="flex items-center gap-2">
          <StreamStatusBadge status={streamState.status} />
          {streamState.status === 'streaming' && (
            <span className="text-xs text-muted-foreground">
              {streamState.tokensPerSecond.toFixed(0)} tok/s
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
            {msg.role === 'assistant' ? (
              <StreamingMarkdown content={msg.content} isStreaming={msg.isStreaming} />
            ) : (
              <div className="inline-block bg-blue-500 text-white rounded-lg px-4 py-2">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {streamState.status === 'connecting' && <TypingIndicator />}

        {streamState.error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            Error: {streamState.error.message}
            {streamState.error.retryable && (
              <button onClick={() => sendMessage(messages.at(-1)?.content ?? '')}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={streamState.status === 'streaming'}
        />
        {streamState.status === 'streaming' ? (
          <button type="button" onClick={cancelStream} className="bg-red-500 text-white px-4 py-2 rounded">
            Stop
          </button>
        ) : (
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Send
          </button>
        )}
      </form>
    </div>
  );
}
```

---

## Performance Considerations

### Latency Targets

| Metric | Target | P99 | Notes |
|--------|--------|-----|-------|
| Time to first token (TTFT) | < 500ms | < 1.5s | Depends on provider; Anthropic ~300ms, OpenAI ~400ms |
| Inter-token latency | < 50ms | < 100ms | Measured between consecutive chunk arrivals |
| SSE event serialization | < 1ms | < 3ms | JSON.stringify + SSE framing overhead |
| WebSocket frame overhead | < 0.5ms | < 2ms | JSON or binary frame construction |
| Stream completion callback | < 5ms | < 15ms | Time from last token to onFinish fire |
| Client reconnection | < 2s | < 5s | With exponential backoff |
| Keep-alive round-trip | < 100ms | < 500ms | SSE comment or WS ping/pong |
| Budget check latency | < 10ms | < 50ms | Database query before stream starts |
| Rate limit check | < 1ms | < 5ms | In-memory check |
| Tier routing decision | < 15ms | < 50ms | Complexity scoring + model lookup |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Concurrent SSE streams | 100 | 5,000+ |
| Concurrent WS streams | 200 | 10,000+ |
| Tokens/second per stream | 50-100 | 50-100 |
| Total tokens/second (all streams) | 5,000 | 100,000+ |
| Memory per SSE connection | ~2KB | ~2KB |
| Memory per WS connection | ~8KB | ~8KB |

### Optimization Strategies

1. **Token batching** — Group 3-5 tokens per network packet to reduce overhead. Use `createBatchedStream` with `batchSize: 5, flushIntervalMs: 100`. Reduces DOM updates by 80%.

2. **Back-pressure management** — Use `createBufferedStream` with `highWaterMark: 100` to prevent memory exhaustion when consumers are slow. Monitor with `onPressure` callback.

3. **Nginx/CDN configuration** — Set `X-Accel-Buffering: no` header. Without this, nginx buffers SSE events and delivers them in bursts, destroying the streaming experience. For Cloudflare, disable "Response Buffering".

4. **ReadableStream API** — Use native `ReadableStream` with `TransformStream` for zero-copy delivery. Avoid collecting chunks into arrays.

5. **Abort early** — Cancel streams immediately when users navigate away. Every token after cancellation is wasted cost. Use `useEffect` cleanup in React:
   ```typescript
   useEffect(() => {
     return () => controller.abort(); // Cleanup on unmount
   }, []);
   ```

6. **Connection pooling** — Reuse WebSocket connections for multiple sequential streams. Don't open a new WS per request.

7. **Keep-alive tuning** — Set keep-alive to 15s for SSE (proxy timeout is typically 60s). For WebSocket, 30s ping/pong. Too frequent wastes bandwidth; too infrequent risks disconnection.

8. **Edge deployment** — Deploy SSE endpoints at the edge (Vercel Edge Functions, Cloudflare Workers) to reduce TTFT by 50-200ms. Edge functions can proxy to the origin while streaming to the client.

9. **Memory-efficient aggregation** — `StreamAggregator` uses string concatenation with periodic flushing rather than array joins for content over 100KB.

10. **Client-side rendering** — Use `requestAnimationFrame` batching in `StreamingMarkdown` to avoid layout thrashing. Only re-render markdown on whole-word boundaries.

11. **Lazy provider initialization** — The `McvGateway` lazily initializes the OpenRouter provider on first use, avoiding unnecessary connection setup for cold starts.

12. **Async fire-and-forget logging** — Usage tracking, budget recording, and audit logging are all async and don't block the stream completion path. Failures are caught and logged without affecting the stream.

---

## Security Considerations

### Transport Security

- **TLS required** — All streams must use HTTPS (SSE) or WSS (WebSocket) in production. Plain HTTP/WS is rejected by middleware.
- **No caching** — `Cache-Control: no-cache, no-store, must-revalidate` on all SSE responses. Stream content must never be cached by CDN or browser.
- **Content-Type enforcement** — `X-Content-Type-Options: nosniff` prevents MIME-type confusion attacks on SSE endpoints.

### Authentication & Authorization

- **SSE endpoints** — Authenticate via Bearer token in `Authorization` header or session cookie. Validated before stream creation.
- **WebSocket connections** — Authenticate on connection handshake (token in query param or first message). All subsequent messages inherit the connection's auth context.
- **Venture isolation** — Every stream is scoped to a `ventureId`. Cross-venture stream access is impossible — the gateway enforces venture membership before stream creation.
- **User scoping** — Streams are tagged with `userId` for audit trail and per-user rate limiting.

### Stream Isolation

- Multiplexed WebSocket streams track authorization per `streamId` — a user cannot read another user's multiplexed stream.
- Stream content is processed in memory only; no intermediate persistence unless explicitly enabled.
- AbortController ensures clean resource cleanup — no orphaned streams or leaked connections.

### Budget Enforcement as Security

The gateway performs three levels of budget enforcement before stream creation:

1. **Venture budget** — `BudgetManager.check(ventureId)` prevents a compromised agent from spending unlimited funds
2. **Agent budget** — `AgentBudgetManager.check(ventureId, agentType)` limits per-agent spending within a venture
3. **Rate limiting** — `RateLimiter.check()` prevents abuse via request flooding

```typescript
// Budget check flow before any stream is created:
const budgetCheck = await this.budgetManager.check(params.context.ventureId);
if (!budgetCheck.allowed) {
  throw new GatewayBudgetError(budgetCheck.reason ?? 'Budget exceeded', budgetCheck.status);
}

if (params.context.agentType) {
  const agentBudgetCheck = await this.agentBudgetManager.check(
    params.context.ventureId,
    params.context.agentType
  );
  if (!agentBudgetCheck.allowed) {
    throw new GatewayBudgetError(agentBudgetCheck.reason ?? 'Agent budget exceeded');
  }
}
```

### API Key Security

- OpenRouter API key is fetched from Google Secret Manager (system vault) first
- Falls back to `OPENROUTER_API_KEY` environment variable only if vault is unavailable
- API key is never exposed to clients — streaming is always proxied through the gateway server

### Abuse Prevention

- **Stream timeout** — Enforced via `timeoutMs` (default 60s, streaming 5min). Prevents hung connections from consuming server resources indefinitely.
- **Max concurrent streams** — Per-user and per-venture limits enforced at the transport layer. Default: 5 concurrent streams per user, 50 per venture.
- **Rate limiting** — Inherited from gateway module. Budget checks occur before stream creation.
- **Content filtering** — Provider-side content filters are respected. `finishReason: 'content_filter'` triggers error.
- **Zero Data Retention (ZDR)** — Stream content is not logged or persisted by default. Only metadata (tokens, cost, latency) is recorded. Content logging requires explicit opt-in via venture configuration.

### Input Validation

```typescript
// All stream creation inputs are validated with Zod
const StreamChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(100),
  ventureId: z.string().uuid(),
  model: z.string().max(128).optional(),
  userId: z.string().uuid().optional(),
  timeoutMs: z.number().int().min(1000).max(300000).optional(),
  maxTokens: z.number().int().min(1).max(128000).optional(),
});
```

---

## Audit Events

| Event | Category | Trigger | Payload |
|-------|----------|---------|---------|
| `streaming.started` | system | `McvGateway.stream()` called, request begins | `{ requestId, ventureId, model: 'pending', userId, agentType, correlationIds }` |
| `streaming.first_token` | system | First content token received from provider | `{ requestId, ttftMs }` |
| `streaming.completed` | system | Stream finishes normally (onFinish callback) | `{ requestId, model, tier, tokens, cost, latencyMs, finishReason, complexityScore }` |
| `streaming.cancelled` | user | Client aborts stream via AbortController | `{ requestId, tokensBeforeCancel, userId }` |
| `streaming.error` | system | Stream error or finishReason === 'error' | `{ requestId, errorCode, errorType, message, latencyMs, failoverAttempts, retryAttempts }` |
| `streaming.timeout` | system | Stream exceeded timeout (AbortController fires) | `{ requestId, timeoutMs, tokensReceived }` |
| `streaming.budget_exceeded` | system | Budget check failed before stream creation | `{ requestId, ventureId, agentType, budgetStatus }` |
| `streaming.rate_limited` | system | Rate limit check failed before stream creation | `{ requestId, ventureId, limitedBy, currentCount, limit }` |
| `streaming.reconnected` | system | Client reconnected after disconnect | `{ requestId, attemptNumber, lastEventId }` |
| `streaming.tool_call` | system | Tool call detected mid-stream | `{ requestId, toolName, toolCallId }` |
| `streaming.back_pressure` | system | Buffer high-water mark reached | `{ requestId, bufferLevel, highWaterMark }` |
| `streaming.ws.connected` | system | WebSocket connection established | `{ connectionId, userId, protocol }` |
| `streaming.ws.disconnected` | system | WebSocket connection closed | `{ connectionId, code, reason, activeStreams }` |

### Audit Logger Integration

The gateway uses a dedicated `GatewayAuditLogger` for stream lifecycle events:

```typescript
// Audit events are fire-and-forget — they never block the stream
this.auditLogger
  .logRequestStart({ requestId, ventureId, userId, agentType, model, tier, correlationIds })
  .catch((err) => console.error('[McvGateway] Failed to log audit start:', err));

// On stream completion (inside onFinish callback):
this.auditLogger
  .logRequestComplete({
    requestId, ventureId, userId, agentType, model, tier, correlationIds,
    promptTokens, completionTokens, totalTokens, cost, latencyMs, finishReason,
    failoverAttempts: failoverAttempts.length,
    retryAttempts: retryAttempts.length,
    complexityScore,
  })
  .catch((err) => console.error('[McvGateway] Failed to log audit complete:', err));
```

---

## Error Codes

| Code | HTTP | Retryable | Description | Resolution |
|------|------|-----------|-------------|------------|
| `STREAM_TIMEOUT` | — | Yes | Stream exceeded `timeoutMs` | Increase timeout or reduce max_tokens |
| `STREAM_ABORTED` | — | No | Cancelled via AbortController | Expected on user cancellation |
| `STREAM_NETWORK_ERROR` | — | Yes | Network connectivity failure | Check connectivity; auto-reconnect handles this |
| `STREAM_PARSE_ERROR` | — | No | Failed to parse provider SSE data | Report to MCV team; provider format change |
| `STREAM_PROVIDER_ERROR` | 4xx/5xx | Varies | Upstream provider returned error | Check provider status; gateway may failover |
| `STREAM_RATE_LIMITED` | 429 | Yes | Rate limit exceeded at provider | Wait and retry; exponential backoff automatic |
| `STREAM_CONTENT_FILTER` | — | No | Content blocked by safety filter | Modify prompt; cannot bypass |
| `STREAM_OVERLOADED` | 503 | Yes | Provider is overloaded | Auto-failover to alternative model/provider |
| `STREAM_AUTH_ERROR` | 401 | No | Authentication failure | Check API key or session token |
| `STREAM_BUDGET_EXCEEDED` | 402 | No | Venture/agent budget exhausted | Increase budget or wait for reset |
| `STREAM_MAX_TOKENS` | — | No | Max token limit reached | Reduce max_tokens or split request |
| `STREAM_CONNECTION_RESET` | — | Yes | Connection reset by peer | Auto-reconnect handles this |
| `STREAM_INTERNAL_ERROR` | 500 | No | Unexpected internal error | Report to MCV team with requestId |

### Gateway Error Type Mapping

The gateway's internal error classification maps to stream error codes:

| `GatewayErrorType` | Stream Error Code | Retryable | Failoverable |
|---|---|---|---|
| `timeout` | `STREAM_TIMEOUT` | Yes | Yes |
| `rate_limit` | `STREAM_RATE_LIMITED` | Yes | Yes |
| `model_unavailable` | `STREAM_PROVIDER_ERROR` | No | Yes |
| `overloaded` | `STREAM_OVERLOADED` | Yes | Yes |
| `network` | `STREAM_NETWORK_ERROR` | Yes | No |
| `authentication` | `STREAM_AUTH_ERROR` | No | No |
| `budget_exceeded` | `STREAM_BUDGET_EXCEEDED` | No | No |
| `unknown` | `STREAM_INTERNAL_ERROR` | No | No |

### Retry Behavior

When a retryable error occurs during streaming:

```
Attempt 1 → Error (retryable)
  └─ Wait: baseDelay × backoffMultiplier^0 ± 20% jitter = ~1000ms
Attempt 2 → Error (retryable)
  └─ Wait: baseDelay × backoffMultiplier^1 ± 20% jitter = ~2000ms
Attempt 3 → Error (retryable)
  └─ Wait: baseDelay × backoffMultiplier^2 ± 20% jitter = ~4000ms (capped at 10000ms)
Final attempt → Error → failover to fallback model (if failoverable)
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# OPENROUTER / PROVIDER
# ═══════════════════════════════════════════════════════════════════════════════
OPENROUTER_API_KEY=sk-or-v1-xxx              # OpenRouter API key (fallback; prefer vault)

# ═══════════════════════════════════════════════════════════════════════════════
# STREAM DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════
STREAM_DEFAULT_TIMEOUT_MS=60000               # Stream timeout (default: 60s)
STREAM_MAX_TOKENS=16384                       # Max tokens per stream
STREAM_TOKEN_BATCH_SIZE=1                     # Tokens per delivery (1 = real-time)

# ═══════════════════════════════════════════════════════════════════════════════
# SSE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
SSE_KEEPALIVE_MS=15000                        # SSE keep-alive comment interval
SSE_ENABLE_RESUME=true                        # Enable Last-Event-ID resumption
SSE_MAX_CONNECTIONS=5000                      # Max concurrent SSE connections
SSE_RETRY_MS=3000                             # Client retry interval sent in SSE

# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
WS_KEEPALIVE_MS=30000                         # WebSocket ping interval
WS_MAX_CONNECTIONS=10000                      # Max concurrent WS connections
WS_MAX_MESSAGE_SIZE=1048576                   # Max WS message size (1MB)
WS_ENABLE_MULTIPLEX=false                     # Enable stream multiplexing

# ═══════════════════════════════════════════════════════════════════════════════
# RECONNECTION
# ═══════════════════════════════════════════════════════════════════════════════
STREAM_RECONNECT_DELAY_MS=1000               # Initial reconnect delay
STREAM_MAX_RECONNECT_ATTEMPTS=3              # Max reconnection attempts
STREAM_RECONNECT_BACKOFF=exponential         # Backoff strategy (fixed|linear|exponential)

# ═══════════════════════════════════════════════════════════════════════════════
# FLOW CONTROL
# ═══════════════════════════════════════════════════════════════════════════════
STREAM_BUFFER_HIGH_WATER=100                 # Buffer capacity (chunks)
STREAM_BUFFER_LOW_WATER=25                   # Resume threshold (chunks)
STREAM_THROTTLE_TPS=0                        # Tokens/sec limit (0 = unlimited)

# ═══════════════════════════════════════════════════════════════════════════════
# PERFORMANCE
# ═══════════════════════════════════════════════════════════════════════════════
STREAM_FLUSH_INTERVAL_MS=0                   # Force flush interval (0 = immediate)
STREAM_MAX_CONCURRENT_PER_USER=5             # Max concurrent streams per user
STREAM_MAX_CONCURRENT_PER_VENTURE=50         # Max concurrent streams per venture

# ═══════════════════════════════════════════════════════════════════════════════
# SECRETS
# ═══════════════════════════════════════════════════════════════════════════════
# OpenRouter API key path in Google Secret Manager (preferred over env var)
# projects/mcv-one-prototype/secrets/mcv-system-openrouter-api-key/versions/latest
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4.x` | Vercel AI SDK — `streamText()` function |
| `@openrouter/ai-sdk-provider` | `^0.x` | OpenRouter provider for Vercel AI SDK |
| `eventsource-parser` | `^3.x` | Parse SSE streams from providers (used internally by AI SDK) |
| `ws` | `^8.x` | WebSocket server implementation |
| `zod` | `^3.x` | Stream config and request validation; tool parameter schemas |
| `react` | `^18.x` | Client hooks and components (peer dependency) |
| `@mcv/secrets` | `workspace:*` | `SecretManagerService` for API key retrieval from Google Secret Manager |

### Internal Dependencies

| Module | Relationship | Purpose |
|--------|-------------|---------|
| `@mcv/intelligence/gateway` | **Primary** | `McvGateway.stream()` — creates streams via Vercel AI SDK; logs usage after completion; routes to models; enforces budgets |
| `@mcv/intelligence/metrics` | Consumer | Records TTFT, throughput, and stream error rate metrics |
| `@mcv/db` | Indirect (via gateway) | `llm_usage_logs`, `venture_budgets`, `agent_budgets`, `model_configs` tables |
| `@mcv/auth` | Transport layer | Request authentication before stream creation |
| `@mcv/audit` | Lifecycle events | `GatewayAuditLogger` records stream start/complete/failed events |
| `@mcv/secrets` | Provider init | Fetches OpenRouter API key from Google Secret Manager vault |

### Dependency Graph

```
@mcv/intelligence/streaming
├── @mcv/intelligence/gateway (stream creation, routing, budgets)
│   ├── ai (Vercel AI SDK)
│   │   └── @openrouter/ai-sdk-provider
│   ├── @mcv/db (schema, drizzle ORM)
│   ├── @mcv/secrets (Google Secret Manager)
│   └── zod (validation)
├── eventsource-parser (SSE parsing)
├── ws (WebSocket transport)
├── react (client hooks, peer dep)
└── @mcv/audit (lifecycle events)
```

---

## Observability & Monitoring

### Key Metrics to Track

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|-----------------|
| `stream.ttft_ms` | Histogram | Time to first token | P99 > 3s |
| `stream.duration_ms` | Histogram | Total stream duration | P99 > 60s |
| `stream.tokens_per_second` | Gauge | Current throughput per stream | < 10 tok/s |
| `stream.active_count` | Gauge | Currently active streams | > 80% capacity |
| `stream.error_rate` | Counter | Errors per minute | > 5% |
| `stream.budget_rejections` | Counter | Streams rejected by budget | > 10/hour |
| `stream.rate_limit_hits` | Counter | Streams rejected by rate limiter | > 50/hour |
| `stream.abort_rate` | Counter | User-initiated cancellations | > 30% |
| `stream.failover_count` | Counter | Failovers triggered | > 10/hour |
| `stream.retry_count` | Counter | Retries triggered | > 20/hour |

### Correlation ID Tracing

Every stream has correlation IDs that flow through the entire lifecycle:

```
Request → [traceId: "abc-123", spanId: "def-456"]
  ├── Audit: streaming.started   (traceId in payload)
  ├── Provider: HTTP headers      (X-Trace-Id, X-Span-Id)
  ├── Usage log: llm_usage_logs   (trace_id, span_id columns)
  ├── Audit: streaming.completed  (traceId in payload)
  └── Error: GatewayError         (.getTraceId() method)
```

Query usage logs by trace:
```sql
SELECT * FROM llm_usage_logs
WHERE trace_id = 'abc-123'
ORDER BY created_at;
```

---

## Testing

### Unit Testing Patterns

```typescript
import { StreamParser, StreamAggregator, createSSEStream } from '@mcv/intelligence/streaming';
import { describe, it, expect, vi } from 'vitest';

// Helper: create a mock async iterable stream
function createMockStream(tokens: string[]): AsyncIterable<StreamChunk> {
  let index = 0;
  return {
    async *[Symbol.asyncIterator]() {
      for (const token of tokens) {
        yield {
          content: token,
          event: 'token' as const,
          done: false,
          index: index++,
          timestamp: Date.now(),
        };
      }
      yield {
        content: '',
        event: 'done' as const,
        done: true,
        finishReason: 'stop' as const,
        usage: { promptTokens: 10, completionTokens: tokens.length, totalTokens: 10 + tokens.length },
        index: index++,
        timestamp: Date.now(),
      };
    },
  };
}

// Helper: create a mock StreamPart iterable (current format)
function createMockStreamParts(texts: string[]): AsyncIterable<StreamPart> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of texts) {
        yield { type: 'text-delta' as const, textDelta: text };
      }
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 10, completionTokens: texts.length, totalTokens: 10 + texts.length },
      };
    },
  };
}

describe('StreamParser', () => {
  it('should parse tokens from a stream', async () => {
    const tokens: string[] = [];
    const parser = new StreamParser({
      onToken: (token) => tokens.push(token),
    });

    const mockStream = createMockStream(['Hello', ' ', 'world', '!']);
    await parser.process(mockStream);

    expect(tokens).toEqual(['Hello', ' ', 'world', '!']);
  });

  it('should detect tool calls during stream', async () => {
    const toolCalls: ToolCall[] = [];
    const parser = new StreamParser({
      onToolCall: (tc) => { toolCalls.push(tc); },
    });

    const mockStream = createMockToolCallStream();
    await parser.process(mockStream);

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].name).toBe('search');
  });

  it('should measure TTFT accurately', async () => {
    let ttft: number | null = null;
    const parser = new StreamParser({
      onFirstToken: (ms) => { ttft = ms; },
    });

    const mockStream = createMockStream(['Hello']);
    await parser.process(mockStream);

    expect(ttft).toBeGreaterThanOrEqual(0);
    expect(ttft).toBeLessThan(100);
  });
});

describe('SSE Transport', () => {
  it('should format SSE events correctly', () => {
    const events = formatSSEChunk({
      content: 'Hello',
      event: 'token',
      done: false,
      index: 0,
      timestamp: Date.now(),
    });

    expect(events).toContain('event: token');
    expect(events).toContain('data:');
    expect(events).toContain('Hello');
    expect(events).toMatch(/\n\n$/);
  });

  it('should include usage in final event', () => {
    const events = formatSSEChunk({
      content: '',
      event: 'done',
      done: true,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      index: 5,
      timestamp: Date.now(),
    });

    const parsed = JSON.parse(events.match(/data: (.+)/)?.[1] ?? '');
    expect(parsed.usage.totalTokens).toBe(30);
  });
});

describe('SSE Parsing (Client)', () => {
  it('should parse text data lines', () => {
    const result = parseSSELine('data: {"type":"text","data":"Hello"}');
    expect(result).toEqual({ type: 'text', data: 'Hello' });
  });

  it('should handle [DONE] sentinel', () => {
    const result = parseSSELine('data: [DONE]');
    expect(result).toEqual({ type: 'done', data: null });
  });

  it('should handle plain text fallback', () => {
    const result = parseSSELine('data: Hello world');
    expect(result).toEqual({ type: 'text', data: 'Hello world' });
  });

  it('should return null for non-data lines', () => {
    expect(parseSSELine('event: message')).toBeNull();
    expect(parseSSELine(': keepalive')).toBeNull();
    expect(parseSSELine('')).toBeNull();
  });
});

describe('Cancellation', () => {
  it('should abort stream cleanly', async () => {
    const controller = new AbortController();
    const gateway = getMcvGateway();

    const result = await gateway.stream(
      {
        messages: [{ role: 'user', content: 'Write a very long essay.' }],
        context: { ventureId: 'test-venture' },
      },
      { abortSignal: controller.signal }
    );

    const chunks: string[] = [];
    setTimeout(() => controller.abort(), 100);

    try {
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).name).toBe('AbortError');
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe('Flow Control', () => {
  it('should respect throttle rate', async () => {
    const stream = createMockStream(Array(100).fill('x'));
    const throttled = createThrottledStream(stream, { tokensPerSecond: 50 });

    const start = Date.now();
    let count = 0;
    for await (const chunk of throttled) {
      count++;
    }
    const elapsed = Date.now() - start;

    // 100 tokens at 50/s should take ~2s
    expect(elapsed).toBeGreaterThan(1500);
    expect(count).toBeGreaterThan(100);
  });
});

describe('Error Classification', () => {
  it('should classify timeout errors as retryable', () => {
    const info = classifyError(new Error('Request timeout'));
    expect(info.type).toBe('timeout');
    expect(info.retryable).toBe(true);
    expect(info.failoverable).toBe(true);
  });

  it('should classify auth errors as non-retryable', () => {
    const info = classifyError(new Error('401 Unauthorized'));
    expect(info.type).toBe('authentication');
    expect(info.retryable).toBe(false);
    expect(info.failoverable).toBe(false);
  });

  it('should classify rate limits as retryable + failoverable', () => {
    const info = classifyError(new Error('429 Too Many Requests'));
    expect(info.type).toBe('rate_limit');
    expect(info.retryable).toBe(true);
    expect(info.failoverable).toBe(true);
  });
});
```

---

## Troubleshooting

### Stream Appears to Hang (No Tokens)

**Symptoms:** Client connects, receives SSE headers, but no tokens arrive.

**Causes & Fixes:**
1. **Nginx/proxy buffering** — SSE events are being buffered by a reverse proxy. Add `X-Accel-Buffering: no` header (included in `SSE_HEADERS`). For Cloudflare, disable "Response Buffering" in the dashboard.
2. **Budget check blocking** — The `BudgetManager.check()` or `AgentBudgetManager.check()` call may be slow due to database latency. Check DB connection health.
3. **Provider cold start** — Some models (especially T4 reasoning) have longer TTFT. Check `REQUEST_TIMEOUTS.reasoning` (120s).
4. **Missing `Accept: text/event-stream`** — Client must send this header. Without it, some middleware may not route correctly.

### Stream Disconnects Mid-Response

**Symptoms:** Tokens start flowing, then connection drops unexpectedly.

**Causes & Fixes:**
1. **Proxy timeout** — Default nginx `proxy_read_timeout` is 60s. If stream takes longer, nginx closes the connection. Increase to 300s or add keep-alive comments every 15s.
2. **AbortController triggered** — Check if the client-side component unmounts (React `useEffect` cleanup). The `useGatewayStream` hook aborts on unmount by design.
3. **Memory pressure** — If the server runs out of memory, streams may be killed. Monitor `STREAM_BUFFER_HIGH_WATER` and active connection count.

### Budget Exceeded Errors

**Symptoms:** `GatewayBudgetError` thrown before stream starts.

**Diagnosis:**
```sql
-- Check current venture budget status
SELECT venture_id, daily_spent_usd, daily_limit_usd,
       monthly_spent_usd, monthly_limit_usd, hard_limit
FROM venture_budgets WHERE venture_id = 'your-venture-uuid';

-- Check agent budget status
SELECT agent_type, daily_spent_usd, daily_limit_usd, enabled
FROM agent_budgets WHERE venture_id = 'your-venture-uuid';

-- Check recent spending
SELECT model, count(*) as requests, sum(cost_usd) as total_cost
FROM llm_usage_logs
WHERE venture_id = 'your-venture-uuid'
  AND created_at > now() - interval '24 hours'
GROUP BY model ORDER BY total_cost DESC;
```

### Rate Limit Errors

**Symptoms:** `GatewayRateLimitError` with `Retry-After` header.

**Diagnosis:** The rate limiter tracks requests in-memory. Check:
- `rateLimitResult.limitedBy` — which level hit the limit (user, venture, model, tier)
- `rateLimitResult.resetInMs` — how long until the window resets
- `rateLimitResult.retryAfter` — seconds to wait

### Missing Usage/Cost After Stream

**Symptoms:** Stream completes but `llm_usage_logs` has no record.

**Causes:** Usage tracking is async fire-and-forget in the `onFinish` callback. If the server crashes or the process exits before the async write completes, the record is lost.

**Fix:** Check server logs for `[McvGateway] Failed to record usage:` errors. Ensure database connectivity is healthy.

### Tracing a Specific Stream

Use the `traceId` from correlation IDs:

```sql
-- Find all events for a specific trace
SELECT request_id, model, tier, status, cost_usd, latency_ms, error_message
FROM llm_usage_logs
WHERE trace_id = 'your-trace-id'
ORDER BY created_at;
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| [`@mcv/intelligence/gateway`](../gateway/MODULE.md) | Creates streams via `McvGateway.stream()`; logs usage after completion via `UsageTracker`; enforces budgets via `BudgetManager` and `AgentBudgetManager`; routes to models via `TierRouter` |
| [`@mcv/intelligence/metrics`](../metrics/MODULE.md) | Records TTFT, throughput, and stream error rate metrics |
| [`@mcv/intelligence/prompts`](../prompts/MODULE.md) | Provides system prompts consumed by streaming chat |
| [`@mcv/intelligence/tools`](../tools/MODULE.md) | Executes tool calls detected during streaming (`StreamPart.type === 'tool-call'`) |
| [`@mcv/audit`](../../tier-2-platform/audit/MODULE.md) | Records stream lifecycle audit events via `GatewayAuditLogger` |
| [`@mcv/db`](../../tier-2-platform/db/MODULE.md) | Schema definitions for `llm_usage_logs`, `venture_budgets`, `agent_budgets`, `model_configs` |
| [`@mcv/secrets`](../../tier-2-platform/secrets/MODULE.md) | Provides `SecretManagerService` for retrieving OpenRouter API key from Google Secret Manager |
| [`@mcv/auth`](../../tier-2-platform/auth/MODULE.md) | Authenticates requests before stream creation |

---

*@mcv/intelligence/streaming — Real-time LLM response delivery for the MCV Agentic Operating System*