// ---------------------------------------------------------------------------
// MCP Protocol Types — JSON-RPC 2.0 + Model Context Protocol
// ---------------------------------------------------------------------------

// ── JSON-RPC 2.0 ──

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

// ── MCP Server Capabilities ──

export interface McpServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
}

export interface McpClientCapabilities {
  roots?: { listChanged?: boolean };
  sampling?: Record<string, never>;
}

export interface McpServerInfo {
  name: string;
  version: string;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: McpServerCapabilities;
  serverInfo: McpServerInfo;
}

// ── MCP Tools ──

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallResult {
  content: McpContent[];
  isError?: boolean;
}

// ── MCP Resources ──

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceContent {
  uri: string;
  text?: string;
  blob?: string;
  mimeType?: string;
}

// ── MCP Prompts ──

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// ── MCP Content Types ──

export type McpContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; text: string; mimeType?: string } };

// ── Transport Interface ──

export interface McpTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null>;
  onNotification(handler: (notification: JsonRpcNotification) => void): void;
  isConnected(): boolean;
}

// ── Connection State ──

export type McpConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'ready'
  | 'error'
  | 'reconnecting';

// ── Server Configuration (persisted) ──

export interface McpServerConfig {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  // stdio fields
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // http fields
  url?: string;
  headers?: Record<string, string>;
  // behavior
  ventureScope: string[] | '*';
  enabledTools: string[] | '*';
  disabledTools: string[];
  approvalMode: 'none' | 'destructive' | 'all';
  autoConnect: boolean;
  idleTimeoutMs: number;
  // metadata
  preset?: string;
  iconUrl?: string;
  category?: 'code' | 'data' | 'comms' | 'infra' | 'specialized';
}

// ── Client Events ──

export type McpClientEventMap = {
  connected: [];
  disconnected: [reason: string];
  error: [error: Error];
  'tools-changed': [tools: McpTool[]];
  'resources-changed': [resources: McpResource[]];
  notification: [method: string, params: unknown];
};

// ── Stdio Proxy (server-side) ──

export interface StdioSpawnRequest {
  id: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface StdioMessageRequest {
  message: JsonRpcRequest | JsonRpcNotification;
}

export interface StdioProcessInfo {
  id: string;
  pid: number;
  startedAt: number;
  lastActivity: number;
  alive: boolean;
}
