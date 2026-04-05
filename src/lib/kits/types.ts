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
