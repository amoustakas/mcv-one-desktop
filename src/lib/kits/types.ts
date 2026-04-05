// ---------------------------------------------------------------------------
// Kit System — Core Type Definitions
// ---------------------------------------------------------------------------

/** Capability a kit can request from the host */
export type KitCapability =
  | 'network'       // can make HTTP requests (via proxy)
  | 'supabase'      // can read/write Supabase tables
  | 'storage'       // can access file storage
  | 'credentials'   // needs external API credentials
  | 'llm';          // can call LLM APIs

/** Where the kit's handler code executes */
export type KitRuntime = 'inline' | 'worker' | 'serverless';

/** Tool schema matching the Anthropic tool-calling format */
export interface KitToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** Declarative manifest describing a kit's metadata and tools */
export interface KitManifest {
  id: string;                        // e.g. "github-ops"
  name: string;                      // "GitHub Operations"
  version: string;                   // semver "1.0.0"
  description: string;
  author: string;
  tools: KitToolSchema[];
  capabilities: KitCapability[];
  runtime: KitRuntime;
  ventureScope: string[] | '*';      // which ventures can use ('*' = all)
  instructions?: string;             // extra system prompt context for the LLM
  /** Epic 8 — Gemini structured output schema for this kit's tools */
  response_schema?: GeminiResponseSchema;
  /** Epic 10 — require operator approval before executing this kit's tools */
  requires_human_approval?: boolean;
}

/** Runtime context injected into kit tool handlers */
export interface KitExecutionContext {
  userId: string;
  ventureId: string;
  conversationId: string;
  /** Authenticated fetch — already has Clerk JWT attached */
  fetch: typeof globalThis.fetch;
}

/** Result returned by a kit tool handler */
export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  /** Markdown-formatted output for display in chat */
  displayMarkdown?: string;
}

/** Handler function signature for a kit tool */
export type KitToolHandler = (
  input: Record<string, unknown>,
  context: KitExecutionContext,
) => Promise<ToolCallResult>;

/** A loaded kit instance with runtime state */
export interface KitInstance {
  manifest: KitManifest;
  handlers: Record<string, KitToolHandler>;
  status: 'loaded' | 'error' | 'disabled';
  source: 'builtin' | 'registry' | 'local';
  loadedAt: number;
}

/** Tool-use request from Claude (matches Anthropic content_block) */
export interface ToolUseRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Tool result sent back to Claude */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// ---------------------------------------------------------------------------
// Epic 6 — Multimodal File Bridge
// ---------------------------------------------------------------------------

/** A file uploaded to Google AI File API */
export interface UploadedFile {
  id: string;
  localName: string;
  mimeType: string;
  sizeBytes: number;
  geminiFileUri: string;
  state: 'uploading' | 'processing' | 'active' | 'failed';
  uploadedAt: number;
}

/** Content part referencing a Gemini-hosted file */
export interface FilePartContent {
  fileData: { fileUri: string; mimeType: string };
}

// ---------------------------------------------------------------------------
// Epic 7 — Context Caching
// ---------------------------------------------------------------------------

/** A cached content entry from Google AI Context Caching API */
export interface CacheEntry {
  cacheName: string;
  model: string;
  tokenCount: number;
  createTime: string;
  expireTime: string;
  ttlSeconds: number;
}

// ---------------------------------------------------------------------------
// Epic 8 — Structured Output / Hybrid Compute
// ---------------------------------------------------------------------------

/** Gemini response schema for deterministic JSON output */
export interface GeminiResponseSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, GeminiResponseSchema>;
  required?: string[];
  items?: GeminiResponseSchema;
  enum?: string[];
  description?: string;
}

// ---------------------------------------------------------------------------
// Epic 9 — Telemetry / Flight Recorder
// ---------------------------------------------------------------------------

/** Usage metadata from a Gemini API response */
export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  cachedContentTokenCount?: number;
}

/** Telemetry event types */
export type TelemetryEventType =
  | 'api_call'
  | 'tool_dispatch'
  | 'tool_result'
  | 'cache_hit'
  | 'cache_miss'
  | 'file_upload'
  | 'hitl_request'
  | 'hitl_response';

/** A single telemetry event logged by the FlightRecorder */
export interface TelemetryEvent {
  id: string;
  timestamp: number;
  type: TelemetryEventType;
  model?: string;
  usage?: GeminiUsageMetadata;
  durationMs?: number;
  kitId?: string;
  toolName?: string;
  success?: boolean;
  costEstimate?: number;
  metadata?: Record<string, unknown>;
}

/** Reasoning step types */
export type ReasoningStepType =
  | 'tool_assembly'
  | 'api_call'
  | 'tool_dispatch'
  | 'tool_result'
  | 'cache_lookup';

/** A step in the agent's reasoning chain */
export interface ReasoningStep {
  id: string;
  timestamp: number;
  type: ReasoningStepType;
  description: string;
  data?: unknown;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Epic 10 — HITL (Human-in-the-Loop)
// ---------------------------------------------------------------------------

export type HITLDecision = 'approved' | 'rejected' | 'modified';

/** Emitted when a sandbox operation requires human override */
export interface HITLRequest {
  id: string;
  toolCallId: string;
  kitId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
  reason?: string;
}

/** Operator's response to a HITL request */
export interface HITLResponse {
  requestId: string;
  decision: HITLDecision;
  modifiedInput?: Record<string, unknown>;
  respondedAt: number;
}

/** A trace of an approved tool execution for fine-tuning export */
export interface TuningTrace {
  id: string;
  messages: Array<{ role: string; content: string }>;
  toolCall: { name: string; input: Record<string, unknown> };
  toolResult: ToolCallResult;
  decision: HITLDecision;
  timestamp: number;
}
