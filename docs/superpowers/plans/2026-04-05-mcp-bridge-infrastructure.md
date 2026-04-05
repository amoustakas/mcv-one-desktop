# MCP Bridge Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native MCP client infrastructure into MCV Desktop so NAOS can consume tools from any MCP server — starting with GitHub Deep, Brave Search, Fetch, and PostgreSQL.

**Architecture:** MCP Bridge Kit approach — a single meta-kit owns all MCP server connections and dynamically generates tool schemas. A lightweight browser-native MCP client (not the official SDK) handles protocol. The local server on :3100 extends to proxy stdio-based MCP servers. IntegrationsHub gets an "MCP Servers" section with presets and custom config.

**Tech Stack:** TypeScript strict, Express 5 (server), React 19, Zustand 5, Vite, MCP protocol (JSON-RPC 2.0)

**Spec:** `docs/superpowers/specs/2026-04-05-mcp-bridge-infrastructure-design.md`

---

## File Structure

```
NEW FILES:
src/lib/mcp/types.ts                    — MCP protocol types, config interfaces, transport interface
src/lib/mcp/client.ts                   — McpClient state machine, JSON-RPC correlation, event emitter
src/lib/mcp/transports/streamable-http.ts — Fetch-based transport for modern MCP servers
src/lib/mcp/transports/sse.ts           — EventSource transport for legacy MCP servers
src/lib/mcp/transports/stdio-proxy.ts   — Routes through local server :3100
src/lib/mcp/schema-adapter.ts           — MCP ↔ Kit schema translation, namespacing, result adapt
src/lib/mcp/presets.ts                  — Curated server preset definitions (GitHub, Brave, etc.)
src/lib/mcp/server-registry.ts          — McpServerConfig CRUD, localStorage + Supabase persistence
src/lib/mcp/connection-manager.ts       — All-connection coordinator, credential resolution
src/lib/kits/builtin/mcp-bridge-kit.ts  — Dynamic meta-kit, single routing handler
server/mcp-routes.ts                    — Stdio process manager + HTTP routes
src/stores/mcp.ts                       — Zustand store for MCP state
src/components/McpServerCard.tsx         — Server card component for IntegrationsHub
src/components/McpAddServerModal.tsx     — Add server modal with presets + custom forms
src/components/McpServerDetail.tsx       — Server detail panel (tools, resources, config)

MODIFIED FILES:
server/local.ts:394-395                 — Mount MCP routes
src/lib/kits/loader.ts:1-84            — Register MCP bridge kit
src/components/IntegrationsHub.tsx       — Add MCP Servers tab
```

---

## Task 1: MCP Protocol Types

**Files:**
- Create: `src/lib/mcp/types.ts`

- [ ] **Step 1: Create MCP types file**

```typescript
// src/lib/mcp/types.ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/lib/mcp/types.ts 2>&1 | head -5`
Expected: No errors (pure type definitions, no imports)

- [ ] **Step 3: Commit**

```bash
git add src/lib/mcp/types.ts
git commit -m "feat(mcp): add MCP protocol types and configuration interfaces"
```

---

## Task 2: Streamable HTTP Transport

**Files:**
- Create: `src/lib/mcp/transports/streamable-http.ts`

- [ ] **Step 1: Create streamable HTTP transport**

```typescript
// src/lib/mcp/transports/streamable-http.ts
import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from '../types';

export class StreamableHttpTransport implements McpTransport {
  private url: string;
  private headers: Record<string, string>;
  private sessionId: string | null = null;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.sessionId = null;
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected) throw new Error('Transport not connected');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...this.headers,
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const res = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    // Capture session ID from response
    const sid = res.headers.get('Mcp-Session-Id');
    if (sid) this.sessionId = sid;

    // Notifications don't expect a response body
    if (!('id' in message)) return null;

    const contentType = res.headers.get('Content-Type') || '';

    if (contentType.includes('text/event-stream')) {
      return this.parseSSEResponse(res);
    }

    // Standard JSON response
    const json = await res.json();

    // If the response is an array (batched), find matching id
    if (Array.isArray(json)) {
      const match = json.find(
        (r: JsonRpcResponse) => r.id === (message as JsonRpcRequest).id,
      );
      // Forward non-matching items as notifications if they lack an id
      for (const item of json) {
        if (!('id' in item) && 'method' in item) {
          this.emitNotification(item as JsonRpcNotification);
        }
      }
      return match || null;
    }

    return json as JsonRpcResponse;
  }

  onNotification(handler: (n: JsonRpcNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitNotification(n: JsonRpcNotification): void {
    for (const h of this.notificationHandlers) h(n);
  }

  private async parseSSEResponse(res: Response): Promise<JsonRpcResponse | null> {
    const text = await res.text();
    const lines = text.split('\n');
    let result: JsonRpcResponse | null = null;

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        if ('id' in parsed) {
          result = parsed as JsonRpcResponse;
        } else if ('method' in parsed) {
          this.emitNotification(parsed as JsonRpcNotification);
        }
      } catch {
        // Skip malformed SSE data lines
      }
    }

    return result;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/transports/streamable-http.ts
git commit -m "feat(mcp): add Streamable HTTP transport for modern MCP servers"
```

---

## Task 3: SSE Transport

**Files:**
- Create: `src/lib/mcp/transports/sse.ts`

- [ ] **Step 1: Create SSE transport**

```typescript
// src/lib/mcp/transports/sse.ts
import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from '../types';

export class SseTransport implements McpTransport {
  private url: string;
  private headers: Record<string, string>;
  private eventSource: EventSource | null = null;
  private postEndpoint: string | null = null;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];
  private pendingRequests = new Map<
    string | number,
    { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }
  >();

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url);

      this.eventSource.addEventListener('endpoint', (e: MessageEvent) => {
        // Server tells us where to POST requests
        const endpoint = e.data;
        // Resolve relative URLs against the SSE URL
        this.postEndpoint = new URL(endpoint, this.url).toString();
        this.connected = true;
        resolve();
      });

      this.eventSource.addEventListener('message', (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          if ('id' in msg && this.pendingRequests.has(msg.id)) {
            const pending = this.pendingRequests.get(msg.id)!;
            this.pendingRequests.delete(msg.id);
            pending.resolve(msg as JsonRpcResponse);
          } else if ('method' in msg && !('id' in msg)) {
            this.emitNotification(msg as JsonRpcNotification);
          }
        } catch {
          // Skip malformed messages
        }
      });

      this.eventSource.onerror = () => {
        if (!this.connected) {
          reject(new Error('SSE connection failed'));
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
    this.postEndpoint = null;
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected || !this.postEndpoint) {
      throw new Error('Transport not connected');
    }

    const res = await fetch(this.postEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      throw new Error(`SSE POST failed: ${res.status} ${res.statusText}`);
    }

    // Notifications don't expect a response
    if (!('id' in message)) return null;

    // Wait for response via SSE stream
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timed out: ${message.method}`));
      }, 30_000);

      this.pendingRequests.set(message.id, {
        resolve: (r) => {
          clearTimeout(timeout);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });
    });
  }

  onNotification(handler: (n: JsonRpcNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitNotification(n: JsonRpcNotification): void {
    for (const h of this.notificationHandlers) h(n);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/transports/sse.ts
git commit -m "feat(mcp): add SSE transport for legacy MCP servers"
```

---

## Task 4: Stdio Proxy Transport

**Files:**
- Create: `src/lib/mcp/transports/stdio-proxy.ts`

- [ ] **Step 1: Create stdio proxy transport**

```typescript
// src/lib/mcp/transports/stdio-proxy.ts
import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  StdioSpawnRequest,
} from '../types';

const LOCAL_SERVER = 'http://localhost:3100';

export class StdioProxyTransport implements McpTransport {
  private config: StdioSpawnRequest;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];

  constructor(config: StdioSpawnRequest) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const res = await fetch(`${LOCAL_SERVER}/mcp/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.config),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Failed to spawn MCP server: ${body.error || res.statusText}`);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await fetch(`${LOCAL_SERVER}/mcp/kill/${this.config.id}`, {
      method: 'POST',
    }).catch(() => {
      // Best-effort cleanup
    });

    this.connected = false;
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected) throw new Error('Transport not connected');

    const res = await fetch(`${LOCAL_SERVER}/mcp/message/${this.config.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Stdio message failed: ${body.error || res.statusText}`);
    }

    // Notifications don't expect a response
    if (!('id' in message)) return null;

    const json = await res.json();

    // The proxy may return notifications alongside the response
    if (json.notifications && Array.isArray(json.notifications)) {
      for (const n of json.notifications) {
        this.emitNotification(n as JsonRpcNotification);
      }
    }

    return json.response as JsonRpcResponse;
  }

  onNotification(handler: (n: JsonRpcNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitNotification(n: JsonRpcNotification): void {
    for (const h of this.notificationHandlers) h(n);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/transports/stdio-proxy.ts
git commit -m "feat(mcp): add stdio proxy transport routing through local server :3100"
```

---

## Task 5: MCP Client

**Files:**
- Create: `src/lib/mcp/client.ts`

- [ ] **Step 1: Create MCP client state machine**

```typescript
// src/lib/mcp/client.ts
import type {
  McpTransport,
  McpConnectionState,
  McpTool,
  McpResource,
  McpPrompt,
  McpServerCapabilities,
  McpServerInfo,
  McpToolCallResult,
  McpContent,
  McpResourceContent,
  JsonRpcRequest,
  JsonRpcNotification,
  McpClientEventMap,
} from './types';

type EventHandler<K extends keyof McpClientEventMap> = (
  ...args: McpClientEventMap[K]
) => void;

const MCP_PROTOCOL_VERSION = '2025-03-26';

let nextRequestId = 1;

export class McpClient {
  private transport: McpTransport;
  private state: McpConnectionState = 'disconnected';
  private serverCapabilities: McpServerCapabilities | null = null;
  private serverInfo: McpServerInfo | null = null;
  private tools: McpTool[] = [];
  private resources: McpResource[] = [];
  private prompts: McpPrompt[] = [];
  private listeners = new Map<string, Set<EventHandler<keyof McpClientEventMap>>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(transport: McpTransport) {
    this.transport = transport;

    // Forward transport notifications
    this.transport.onNotification((notification) => {
      this.handleNotification(notification);
    });
  }

  // ── Public API ──

  getState(): McpConnectionState {
    return this.state;
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  getResources(): McpResource[] {
    return this.resources;
  }

  getPrompts(): McpPrompt[] {
    return this.prompts;
  }

  getServerInfo(): McpServerInfo | null {
    return this.serverInfo;
  }

  getServerCapabilities(): McpServerCapabilities | null {
    return this.serverCapabilities;
  }

  async connect(): Promise<void> {
    if (this.state === 'ready' || this.state === 'connecting') return;

    this.setState('connecting');

    try {
      await this.transport.connect();
      await this.initialize();
      await this.discoverCapabilities();

      this.reconnectAttempts = 0;
      this.setState('ready');
      this.emit('connected');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState('error');
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    await this.transport.disconnect();
    this.tools = [];
    this.resources = [];
    this.prompts = [];
    this.serverCapabilities = null;
    this.serverInfo = null;
    this.setState('disconnected');
    this.emit('disconnected', 'user-initiated');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    if (this.state !== 'ready') {
      throw new Error(`Cannot call tool: client is ${this.state}`);
    }

    const response = await this.request('tools/call', {
      name,
      arguments: args,
    });

    if (response.error) {
      return {
        content: [{ type: 'text', text: response.error.message }],
        isError: true,
      };
    }

    return response.result as McpToolCallResult;
  }

  async readResource(uri: string): Promise<McpResourceContent[]> {
    if (this.state !== 'ready') {
      throw new Error(`Cannot read resource: client is ${this.state}`);
    }

    const response = await this.request('resources/read', { uri });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const result = response.result as { contents: McpResourceContent[] };
    return result.contents;
  }

  async refreshTools(): Promise<McpTool[]> {
    const response = await this.request('tools/list', {});
    if (response.result) {
      const result = response.result as { tools: McpTool[] };
      this.tools = result.tools;
      this.emit('tools-changed', this.tools);
    }
    return this.tools;
  }

  // ── Event Emitter ──

  on<K extends keyof McpClientEventMap>(
    event: K,
    handler: EventHandler<K>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<keyof McpClientEventMap>);
  }

  off<K extends keyof McpClientEventMap>(
    event: K,
    handler: EventHandler<K>,
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<keyof McpClientEventMap>);
  }

  // ── Private ──

  private setState(state: McpConnectionState): void {
    this.state = state;
  }

  private emit<K extends keyof McpClientEventMap>(
    event: K,
    ...args: McpClientEventMap[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        (handler as EventHandler<K>)(...args);
      } catch {
        // Don't let listener errors crash the client
      }
    }
  }

  private async initialize(): Promise<void> {
    this.setState('initializing');

    const response = await this.request('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        roots: { listChanged: false },
      },
      clientInfo: {
        name: 'mcv-desktop',
        version: '1.0.0',
      },
    });

    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }

    const result = response.result as {
      protocolVersion: string;
      capabilities: McpServerCapabilities;
      serverInfo: McpServerInfo;
    };

    this.serverCapabilities = result.capabilities;
    this.serverInfo = result.serverInfo;

    // Send initialized notification
    await this.notify('notifications/initialized', {});
  }

  private async discoverCapabilities(): Promise<void> {
    // Discover tools
    if (this.serverCapabilities?.tools) {
      const toolsRes = await this.request('tools/list', {});
      if (toolsRes.result) {
        const result = toolsRes.result as { tools: McpTool[] };
        this.tools = result.tools;
      }
    }

    // Discover resources
    if (this.serverCapabilities?.resources) {
      const resourcesRes = await this.request('resources/list', {});
      if (resourcesRes.result) {
        const result = resourcesRes.result as { resources: McpResource[] };
        this.resources = result.resources;
      }
    }

    // Discover prompts
    if (this.serverCapabilities?.prompts) {
      const promptsRes = await this.request('prompts/list', {});
      if (promptsRes.result) {
        const result = promptsRes.result as { prompts: McpPrompt[] };
        this.prompts = result.prompts;
      }
    }
  }

  private async request(
    method: string,
    params: Record<string, unknown>,
  ) {
    const id = nextRequestId++;
    const message: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const response = await this.transport.send(message);

    if (!response) {
      throw new Error(`No response for ${method}`);
    }

    return response;
  }

  private async notify(method: string, params: Record<string, unknown>): Promise<void> {
    const message: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    await this.transport.send(message);
  }

  private handleNotification(notification: JsonRpcNotification): void {
    // Handle known MCP notifications
    if (notification.method === 'notifications/tools/list_changed') {
      this.refreshTools().catch(() => {});
    }

    // Forward all notifications to listeners
    this.emit('notification', notification.method, notification.params);
  }

  /** Attempt reconnection with exponential backoff */
  scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('error');
      this.emit('error', new Error('Max reconnection attempts exceeded'));
      return;
    }

    this.setState('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/client.ts
git commit -m "feat(mcp): add McpClient state machine with JSON-RPC, events, reconnect"
```

---

## Task 6: Schema Adapter

**Files:**
- Create: `src/lib/mcp/schema-adapter.ts`

- [ ] **Step 1: Create schema adapter**

```typescript
// src/lib/mcp/schema-adapter.ts
import type { KitToolSchema, ToolCallResult } from '../kits/types';
import type { McpTool, McpToolCallResult } from './types';

/**
 * Convert MCP tool schemas to Kit tool schemas with server-prefixed names.
 * Also handles result adaptation back from MCP format.
 */

/** Parse a namespaced tool name into server ID and original tool name */
export function parseToolName(namespacedName: string): {
  serverId: string;
  toolName: string;
} {
  // Format: mcp_{serverId}_{toolName}
  const prefix = 'mcp_';
  if (!namespacedName.startsWith(prefix)) {
    throw new Error(`Invalid MCP tool name: ${namespacedName}`);
  }
  const rest = namespacedName.slice(prefix.length);
  const underscoreIdx = rest.indexOf('_');
  if (underscoreIdx === -1) {
    throw new Error(`Invalid MCP tool name format: ${namespacedName}`);
  }
  return {
    serverId: rest.slice(0, underscoreIdx),
    toolName: rest.slice(underscoreIdx + 1),
  };
}

/** Create a namespaced tool name */
export function namespaceTool(serverId: string, toolName: string): string {
  return `mcp_${serverId}_${toolName}`;
}

/** Convert a single MCP tool schema to Kit tool schema */
export function mcpToolToKitSchema(
  serverId: string,
  serverName: string,
  tool: McpTool,
): KitToolSchema {
  return {
    name: namespaceTool(serverId, tool.name),
    description: `[${serverName}] ${tool.description || tool.name}`,
    input_schema: {
      type: 'object',
      properties: tool.inputSchema.properties || {},
      required: tool.inputSchema.required,
    },
  };
}

/** Convert all tools from an MCP server, respecting enabled/disabled filters */
export function convertServerTools(
  serverId: string,
  serverName: string,
  tools: McpTool[],
  enabledTools: string[] | '*',
  disabledTools: string[],
): KitToolSchema[] {
  return tools
    .filter((tool) => {
      if (disabledTools.includes(tool.name)) return false;
      if (enabledTools === '*') return true;
      return enabledTools.includes(tool.name);
    })
    .map((tool) => mcpToolToKitSchema(serverId, serverName, tool));
}

/** Build a "read_resource" tool schema for a server that exposes resources */
export function buildResourceTool(
  serverId: string,
  serverName: string,
): KitToolSchema {
  return {
    name: namespaceTool(serverId, 'read_resource'),
    description: `[${serverName}] Read a resource by URI from this MCP server`,
    input_schema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'The resource URI to read',
        },
      },
      required: ['uri'],
    },
  };
}

/** Convert MCP tool call result to Kit ToolCallResult */
export function adaptMcpResult(mcpResult: McpToolCallResult): ToolCallResult {
  const textParts = mcpResult.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text);

  const imageParts = mcpResult.content
    .filter((c): c is { type: 'image'; data: string; mimeType: string } => c.type === 'image');

  let displayMarkdown = textParts.join('\n\n');

  // Append images as markdown
  for (const img of imageParts) {
    displayMarkdown += `\n\n![image](data:${img.mimeType};base64,${img.data})`;
  }

  return {
    success: !mcpResult.isError,
    data: mcpResult.content,
    error: mcpResult.isError ? textParts.join('\n') : undefined,
    displayMarkdown: displayMarkdown || undefined,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/schema-adapter.ts
git commit -m "feat(mcp): add schema adapter for MCP ↔ Kit translation and namespacing"
```

---

## Task 7: Server Presets

**Files:**
- Create: `src/lib/mcp/presets.ts`

- [ ] **Step 1: Create preset definitions**

```typescript
// src/lib/mcp/presets.ts

export interface McpServerPreset {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'data' | 'comms' | 'infra' | 'specialized';
  transport: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  url?: string;
  requiredCredentials: {
    key: string;
    label: string;
    type: 'oauth' | 'apikey' | 'manual';
    oauthProvider?: string;
    helpUrl?: string;
  }[];
  defaultVentureScope: string[] | '*';
  recommendedDisabledTools?: string[];
  tier: 1 | 2 | 3;
}

export const MCP_PRESETS: McpServerPreset[] = [
  // ── Tier 1: Ship Immediately ──
  {
    id: 'github',
    name: 'GitHub (Deep)',
    description:
      'Full GitHub API — issues, PRs, code search, branches, actions, file operations. Far deeper than the built-in GitHub kit.',
    category: 'code',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    requiredCredentials: [
      {
        key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        label: 'GitHub Personal Access Token',
        type: 'oauth',
        oauthProvider: 'github',
        helpUrl: 'https://github.com/settings/tokens',
      },
    ],
    defaultVentureScope: '*',
    recommendedDisabledTools: ['delete_repository', 'delete_branch'],
    tier: 1,
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description:
      'Web search and local search via Brave Search API. Essential for intelligence gathering.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    requiredCredentials: [
      {
        key: 'BRAVE_API_KEY',
        label: 'Brave Search API Key',
        type: 'manual',
        helpUrl: 'https://brave.com/search/api/',
      },
    ],
    defaultVentureScope: '*',
    tier: 1,
  },
  {
    id: 'fetch',
    name: 'Web Fetch',
    description:
      'Retrieve any URL and convert HTML to clean markdown. Lightweight web scraping without browser overhead.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 1,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description:
      'Direct SQL queries, table listing, and schema inspection. Connect to Supabase or any Postgres database.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiredCredentials: [
      {
        key: 'DATABASE_URL',
        label: 'PostgreSQL Connection String',
        type: 'manual',
        helpUrl: 'https://supabase.com/dashboard/project/_/settings/database',
      },
    ],
    defaultVentureScope: '*',
    recommendedDisabledTools: [],
    tier: 1,
  },
  // ── Tier 2: Add When Needed ──
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Send messages, manage channels, search conversations. Team coordination from NAOS.',
    category: 'comms',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    requiredCredentials: [
      {
        key: 'SLACK_BOT_TOKEN',
        label: 'Slack Bot Token',
        type: 'manual',
        helpUrl: 'https://api.slack.com/apps',
      },
    ],
    defaultVentureScope: '*',
    tier: 2,
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description:
      'Browser automation — navigate, click, fill forms, screenshot, scrape dynamic content.',
    category: 'specialized',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 2,
  },
  {
    id: 'memory',
    name: 'Memory (Knowledge Graph)',
    description:
      'Persistent knowledge graph for cross-session memory. Stores entities and relations.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 2,
  },
];

/** Get presets by tier */
export function getPresetsByTier(tier: 1 | 2 | 3): McpServerPreset[] {
  return MCP_PRESETS.filter((p) => p.tier === tier);
}

/** Get a preset by ID */
export function getPreset(id: string): McpServerPreset | undefined {
  return MCP_PRESETS.find((p) => p.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/presets.ts
git commit -m "feat(mcp): add curated MCP server presets (GitHub, Brave, Fetch, Postgres)"
```

---

## Task 8: Server Registry

**Files:**
- Create: `src/lib/mcp/server-registry.ts`

- [ ] **Step 1: Create server registry with credential resolution**

```typescript
// src/lib/mcp/server-registry.ts
import type { McpServerConfig } from './types';
import { getPreset, type McpServerPreset } from './presets';

const STORAGE_KEY = 'mcv-mcp-servers';

/** CRUD for MCP server configurations with persistence */
export class McpServerRegistry {
  private configs = new Map<string, McpServerConfig>();

  constructor() {
    this.loadFromStorage();
  }

  getAll(): McpServerConfig[] {
    return Array.from(this.configs.values());
  }

  get(id: string): McpServerConfig | undefined {
    return this.configs.get(id);
  }

  add(config: McpServerConfig): void {
    this.configs.set(config.id, config);
    this.saveToStorage();
  }

  update(id: string, updates: Partial<McpServerConfig>): void {
    const existing = this.configs.get(id);
    if (!existing) return;
    this.configs.set(id, { ...existing, ...updates });
    this.saveToStorage();
  }

  remove(id: string): void {
    this.configs.delete(id);
    this.saveToStorage();
  }

  /** Create a config from a preset, merging user-provided credentials */
  createFromPreset(
    preset: McpServerPreset,
    credentials: Record<string, string>,
  ): McpServerConfig {
    const env: Record<string, string> = {};
    for (const cred of preset.requiredCredentials) {
      if (cred.type === 'oauth' && cred.oauthProvider) {
        env[cred.key] = `$oauth:${cred.oauthProvider}`;
      } else if (credentials[cred.key]) {
        env[cred.key] = credentials[cred.key];
      }
    }

    // For postgres, the DATABASE_URL is passed as an arg, not env
    const args = [...(preset.args || [])];
    if (preset.id === 'postgres' && credentials['DATABASE_URL']) {
      args.push(credentials['DATABASE_URL']);
    }

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      transport: preset.transport,
      command: preset.command,
      args,
      env,
      ventureScope: preset.defaultVentureScope,
      enabledTools: '*',
      disabledTools: preset.recommendedDisabledTools || [],
      approvalMode: preset.id === 'postgres' ? 'all' : 'none',
      autoConnect: true,
      idleTimeoutMs: 1800_000,
      preset: preset.id,
      category: preset.category,
    };
  }

  /** Resolve credential references ($oauth:xxx, $apikey:xxx) to actual values */
  resolveCredentials(
    env: Record<string, string>,
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Record<string, string> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      if (value.startsWith('$oauth:')) {
        const provider = value.slice(7);
        const token = oauthTokens[provider];
        if (!token) throw new Error(`OAuth token not found for "${provider}". Connect it in Integrations first.`);
        resolved[key] = token;
      } else if (value.startsWith('$apikey:')) {
        const keyName = value.slice(8);
        const apiKey = apiKeys[keyName];
        if (!apiKey) throw new Error(`API key not found for "${keyName}". Configure it in Integrations first.`);
        resolved[key] = apiKey;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as McpServerConfig[];
      for (const config of parsed) {
        this.configs.set(config.id, config);
      }
    } catch {
      // Corrupted storage — start fresh
    }
  }

  private saveToStorage(): void {
    try {
      const configs = Array.from(this.configs.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch {
      // Storage full or unavailable
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/server-registry.ts
git commit -m "feat(mcp): add server registry with credential resolution and preset support"
```

---

## Task 9: Connection Manager

**Files:**
- Create: `src/lib/mcp/connection-manager.ts`

- [ ] **Step 1: Create connection manager**

```typescript
// src/lib/mcp/connection-manager.ts
import type {
  McpServerConfig,
  McpTool,
  McpResource,
  McpConnectionState,
} from './types';
import { McpClient } from './client';
import { StreamableHttpTransport } from './transports/streamable-http';
import { SseTransport } from './transports/sse';
import { StdioProxyTransport } from './transports/stdio-proxy';
import { McpServerRegistry } from './server-registry';

export interface ConnectionInfo {
  config: McpServerConfig;
  client: McpClient;
  state: McpConnectionState;
  tools: McpTool[];
  resources: McpResource[];
  error?: string;
}

type ConnectionManagerListener = () => void;

/**
 * Manages all MCP server connections. Singleton coordinator.
 *
 * Responsibilities:
 * - Create transports from server configs
 * - Connect/disconnect servers
 * - Track connection state, tools, resources
 * - Resolve credentials before connecting
 * - Auto-connect servers flagged for it
 * - Notify listeners on any state change
 */
export class McpConnectionManager {
  private connections = new Map<string, ConnectionInfo>();
  private registry: McpServerRegistry;
  private listeners = new Set<ConnectionManagerListener>();
  private healthInterval: ReturnType<typeof setInterval> | null = null;

  constructor(registry: McpServerRegistry) {
    this.registry = registry;
  }

  /** Start the manager — auto-connect configured servers */
  async start(
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Promise<void> {
    const configs = this.registry.getAll();
    const autoConnectConfigs = configs.filter((c) => c.autoConnect);

    // Connect in parallel, don't fail on individual errors
    await Promise.allSettled(
      autoConnectConfigs.map((config) =>
        this.connectServer(config.id, oauthTokens, apiKeys),
      ),
    );

    // Start health check loop
    this.startHealthChecks();
  }

  /** Stop all connections and cleanup */
  async stop(): Promise<void> {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }

    await Promise.allSettled(
      Array.from(this.connections.keys()).map((id) => this.disconnectServer(id)),
    );
  }

  /** Connect a specific server by ID */
  async connectServer(
    serverId: string,
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Promise<void> {
    const config = this.registry.get(serverId);
    if (!config) throw new Error(`No config found for server "${serverId}"`);

    // Disconnect existing connection if any
    if (this.connections.has(serverId)) {
      await this.disconnectServer(serverId);
    }

    // Resolve credential references
    let resolvedEnv: Record<string, string> = {};
    try {
      resolvedEnv = this.registry.resolveCredentials(
        config.env || {},
        oauthTokens,
        apiKeys,
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.connections.set(serverId, {
        config,
        client: null as unknown as McpClient,
        state: 'error',
        tools: [],
        resources: [],
        error,
      });
      this.notify();
      throw err;
    }

    // Create transport
    const transport = this.createTransport(config, resolvedEnv);
    const client = new McpClient(transport);

    // Set initial state
    const info: ConnectionInfo = {
      config,
      client,
      state: 'connecting',
      tools: [],
      resources: [],
    };
    this.connections.set(serverId, info);
    this.notify();

    // Wire up events
    client.on('connected', () => {
      info.state = 'ready';
      info.tools = client.getTools();
      info.resources = client.getResources();
      info.error = undefined;
      this.notify();
    });

    client.on('disconnected', (reason) => {
      info.state = 'disconnected';
      info.error = reason;
      this.notify();
    });

    client.on('error', (error) => {
      info.state = 'error';
      info.error = error.message;
      this.notify();
    });

    client.on('tools-changed', (tools) => {
      info.tools = tools;
      this.notify();
    });

    client.on('resources-changed', (resources) => {
      info.resources = resources;
      this.notify();
    });

    // Connect
    try {
      await client.connect();
    } catch (err) {
      info.state = 'error';
      info.error = err instanceof Error ? err.message : String(err);
      this.notify();
      throw err;
    }
  }

  /** Disconnect a server */
  async disconnectServer(serverId: string): Promise<void> {
    const info = this.connections.get(serverId);
    if (!info?.client) return;

    try {
      await info.client.disconnect();
    } catch {
      // Best-effort disconnect
    }

    this.connections.delete(serverId);
    this.notify();
  }

  /** Get connection info for a server */
  getConnection(serverId: string): ConnectionInfo | undefined {
    return this.connections.get(serverId);
  }

  /** Get all connections */
  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /** Get all tools from all connected servers */
  getAllTools(): Map<string, McpTool[]> {
    const result = new Map<string, McpTool[]>();
    for (const [id, info] of this.connections) {
      if (info.state === 'ready') {
        result.set(id, info.tools);
      }
    }
    return result;
  }

  /** Call a tool on a specific server */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ) {
    const info = this.connections.get(serverId);
    if (!info?.client || info.state !== 'ready') {
      throw new Error(`Server "${serverId}" is not connected`);
    }
    return info.client.callTool(toolName, args);
  }

  /** Read a resource from a specific server */
  async readResource(serverId: string, uri: string) {
    const info = this.connections.get(serverId);
    if (!info?.client || info.state !== 'ready') {
      throw new Error(`Server "${serverId}" is not connected`);
    }
    return info.client.readResource(uri);
  }

  /** Subscribe to state changes */
  subscribe(listener: ConnectionManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Don't let listener errors crash the manager
      }
    }
  }

  private createTransport(
    config: McpServerConfig,
    resolvedEnv: Record<string, string>,
  ) {
    switch (config.transport) {
      case 'streamable-http':
        return new StreamableHttpTransport(
          config.url!,
          config.headers || {},
        );

      case 'sse':
        return new SseTransport(config.url!, config.headers || {});

      case 'stdio':
        return new StdioProxyTransport({
          id: config.id,
          command: config.command!,
          args: config.args || [],
          env: resolvedEnv,
        });

      default:
        throw new Error(`Unknown transport: ${config.transport}`);
    }
  }

  private startHealthChecks(): void {
    this.healthInterval = setInterval(() => {
      for (const [id, info] of this.connections) {
        if (info.state === 'error' && info.config.autoConnect) {
          // Attempt reconnection for auto-connect servers
          info.client?.scheduleReconnect();
        }
      }
    }, 60_000);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mcp/connection-manager.ts
git commit -m "feat(mcp): add connection manager with auto-connect, health checks, credential resolution"
```

---

## Task 10: MCP Bridge Kit

**Files:**
- Create: `src/lib/kits/builtin/mcp-bridge-kit.ts`

- [ ] **Step 1: Create the bridge kit**

```typescript
// src/lib/kits/builtin/mcp-bridge-kit.ts
import type {
  KitManifest,
  KitToolHandler,
  KitToolSchema,
  ToolCallResult,
} from '../types';
import type { McpConnectionManager } from '../../mcp/connection-manager';
import {
  parseToolName,
  convertServerTools,
  buildResourceTool,
  adaptMcpResult,
} from '../../mcp/schema-adapter';

// ---------------------------------------------------------------------------
// MCP Bridge Kit — Dynamic meta-kit that surfaces MCP server tools
// ---------------------------------------------------------------------------

// Module-level reference to the connection manager (set during init)
let connectionManager: McpConnectionManager | null = null;

/** Initialize the bridge kit with a connection manager reference */
export function initMcpBridge(mgr: McpConnectionManager): void {
  connectionManager = mgr;
}

/** Dynamically build the current tool list from all connected MCP servers */
export function getMcpTools(): KitToolSchema[] {
  if (!connectionManager) return [];

  const tools: KitToolSchema[] = [];
  const allConnections = connectionManager.getAllConnections();

  for (const info of allConnections) {
    if (info.state !== 'ready') continue;

    // Convert this server's tools to Kit format
    const serverTools = convertServerTools(
      info.config.id,
      info.config.name,
      info.tools,
      info.config.enabledTools,
      info.config.disabledTools,
    );
    tools.push(...serverTools);

    // Add resource tool if server exposes resources
    if (info.resources.length > 0) {
      tools.push(buildResourceTool(info.config.id, info.config.name));
    }
  }

  return tools;
}

/** Single routing handler for all MCP tool calls */
const mcpToolRouter: KitToolHandler = async (input, _context) => {
  if (!connectionManager) {
    return { success: false, error: 'MCP Bridge not initialized' };
  }

  // The tool name is passed via a special __toolName property by the bridge kit
  const toolName = (input as Record<string, unknown>).__mcpToolName as string;
  if (!toolName) {
    return { success: false, error: 'Missing MCP tool name' };
  }

  // Remove the internal property before forwarding
  const cleanInput = { ...input };
  delete cleanInput.__mcpToolName;

  try {
    const { serverId, toolName: originalName } = parseToolName(toolName);

    // Handle resource reads
    if (originalName === 'read_resource') {
      const uri = cleanInput.uri as string;
      if (!uri) return { success: false, error: 'Missing resource URI' };

      const contents = await connectionManager.readResource(serverId, uri);
      const text = contents.map((c) => c.text || '').join('\n');
      return {
        success: true,
        data: contents,
        displayMarkdown: text || '*Empty resource*',
      };
    }

    // Standard tool call
    const result = await connectionManager.callTool(serverId, originalName, cleanInput);
    return adaptMcpResult(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
};

// ── Static manifest (tools array is rebuilt dynamically) ──

export const manifest: KitManifest = {
  id: 'mcp-bridge',
  name: 'MCP Bridge',
  version: '1.0.0',
  description:
    'Bridges external MCP server tools into the kit system. Tools are dynamically discovered from connected MCP servers.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'MCP tools are prefixed with mcp_{server}_{tool}. Use them like any other tool. They connect to external services via the MCP protocol.',
  tools: [], // Populated dynamically
};

/**
 * Build handlers map for all currently available MCP tools.
 * Each tool name maps to the same router — it parses the prefix to dispatch.
 */
export function getMcpHandlers(): Record<string, KitToolHandler> {
  const tools = getMcpTools();
  const handlers: Record<string, KitToolHandler> = {};

  for (const tool of tools) {
    // Wrap the router to inject the tool name
    handlers[tool.name] = async (input, context) => {
      return mcpToolRouter(
        { ...input, __mcpToolName: tool.name },
        context,
      );
    };
  }

  return handlers;
}

// Default handlers export (empty — rebuilt dynamically)
export const handlers: Record<string, KitToolHandler> = {};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/kits/builtin/mcp-bridge-kit.ts
git commit -m "feat(mcp): add MCP Bridge Kit — dynamic meta-kit routing to MCP servers"
```

---

## Task 11: Register Bridge Kit in Loader

**Files:**
- Modify: `src/lib/kits/loader.ts:1-84`

- [ ] **Step 1: Add MCP bridge kit import and registration**

Add import at the end of the import block (after line 41 in `loader.ts`):

```typescript
import {
  manifest as mcpBridgeManifest,
  handlers as mcpBridgeHandlers,
  getMcpTools,
  getMcpHandlers,
} from './builtin/mcp-bridge-kit';
```

Add to the `builtinKits` array (after the deepgram entry, line 83):

```typescript
  kit(mcpBridgeManifest, mcpBridgeHandlers),
```

Add a function to refresh the bridge kit's dynamic tools (after `buildKitInstructions` function, ~line 158):

```typescript
/** Refresh the MCP Bridge Kit's tools and handlers in the kit list */
export function refreshMcpBridgeKit(kits: KitInstance[]): void {
  const bridgeKit = kits.find((k) => k.manifest.id === 'mcp-bridge');
  if (!bridgeKit) return;

  // Rebuild dynamic tools and handlers
  bridgeKit.manifest = {
    ...bridgeKit.manifest,
    tools: getMcpTools(),
  };
  bridgeKit.handlers = getMcpHandlers();
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/kits/loader.ts
git commit -m "feat(mcp): register MCP bridge kit in loader with dynamic refresh"
```

---

## Task 12: Stdio Process Manager (Server Routes)

**Files:**
- Create: `server/mcp-routes.ts`

- [ ] **Step 1: Create MCP proxy routes**

```typescript
// server/mcp-routes.ts
/**
 * MCP Stdio Process Manager
 *
 * Manages MCP server processes that communicate over stdin/stdout.
 * The browser can't spawn processes, so this acts as an HTTP↔stdio bridge.
 *
 * Routes:
 *   POST /mcp/spawn        — Start an MCP server process
 *   POST /mcp/message/:id  — Send JSON-RPC message and get response
 *   POST /mcp/kill/:id     — Terminate a server process
 *   GET  /mcp/status        — List all running processes
 *   GET  /mcp/health/:id   — Check if a specific process is alive
 */

import { spawn, type ChildProcess } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface McpProcess {
  id: string;
  process: ChildProcess;
  pending: Map<string | number, PendingRequest>;
  buffer: string;
  startedAt: number;
  lastActivity: number;
  idleTimeout: ReturnType<typeof setTimeout> | null;
  idleTimeoutMs: number;
}

// All active MCP server processes
const processes = new Map<string, McpProcess>();

// Known safe MCP server packages (validated at spawn time)
const ALLOWED_COMMANDS = new Set(['npx', 'node', 'bun', 'deno']);

function parseStdoutLines(proc: McpProcess): void {
  const lines = proc.buffer.split('\n');
  // Keep the last partial line in the buffer
  proc.buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const msg = JSON.parse(trimmed);

      // Match response to pending request by id
      if ('id' in msg && proc.pending.has(msg.id)) {
        const pending = proc.pending.get(msg.id)!;
        proc.pending.delete(msg.id);
        clearTimeout(pending.timeout);
        pending.resolve(msg);
      }
      // Notifications (no id) — currently logged, forwarded in future
    } catch {
      // Non-JSON output from the process (startup logs, etc.) — ignore
    }
  }
}

function resetIdleTimer(proc: McpProcess): void {
  if (proc.idleTimeout) clearTimeout(proc.idleTimeout);
  proc.idleTimeout = setTimeout(() => {
    console.log(`[MCP] Idle timeout for "${proc.id}" — killing process`);
    killProcess(proc.id);
  }, proc.idleTimeoutMs);
}

function killProcess(id: string): void {
  const proc = processes.get(id);
  if (!proc) return;

  if (proc.idleTimeout) clearTimeout(proc.idleTimeout);

  // Reject all pending requests
  for (const [, pending] of proc.pending) {
    clearTimeout(pending.timeout);
    pending.reject(new Error('Process terminated'));
  }
  proc.pending.clear();

  try {
    proc.process.kill('SIGTERM');
    // Force kill after 5s if still alive
    setTimeout(() => {
      try {
        proc.process.kill('SIGKILL');
      } catch {
        // Already dead
      }
    }, 5000);
  } catch {
    // Already dead
  }

  processes.delete(id);
}

export function registerMcpRoutes(app: ExpressApp): void {
  // ── Spawn a new MCP server process ──
  app.post('/mcp/spawn', (req: { body: { id: string; command: string; args: string[]; env: Record<string, string>; idleTimeoutMs?: number } }, res: { json: (body: unknown) => void; status: (code: number) => { json: (body: unknown) => void } }) => {
    const { id, command, args = [], env = {}, idleTimeoutMs = 1800_000 } = req.body;

    if (!id || !command) {
      return res.status(400).json({ error: 'Missing id or command' });
    }

    // Validate command
    const baseName = command.split('/').pop()?.split('\\').pop() || command;
    if (!ALLOWED_COMMANDS.has(baseName)) {
      return res.status(403).json({
        error: `Command "${baseName}" not allowed. Permitted: ${Array.from(ALLOWED_COMMANDS).join(', ')}`,
      });
    }

    // Kill existing process with same ID
    if (processes.has(id)) {
      killProcess(id);
    }

    try {
      const mergedEnv = { ...process.env, ...env };
      const child = spawn(command, args, {
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      const mcpProc: McpProcess = {
        id,
        process: child,
        pending: new Map(),
        buffer: '',
        startedAt: Date.now(),
        lastActivity: Date.now(),
        idleTimeout: null,
        idleTimeoutMs,
      };

      // Parse stdout for JSON-RPC responses
      child.stdout?.on('data', (data: Buffer) => {
        mcpProc.buffer += data.toString();
        mcpProc.lastActivity = Date.now();
        parseStdoutLines(mcpProc);
      });

      // Log stderr (MCP servers may print diagnostics here)
      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString().trim();
        if (text) console.log(`[MCP:${id}:stderr] ${text}`);
      });

      child.on('exit', (code) => {
        console.log(`[MCP] Process "${id}" exited with code ${code}`);
        // Reject all pending requests
        for (const [, pending] of mcpProc.pending) {
          clearTimeout(pending.timeout);
          pending.reject(new Error(`Process exited with code ${code}`));
        }
        mcpProc.pending.clear();
        processes.delete(id);
      });

      child.on('error', (err) => {
        console.error(`[MCP] Process "${id}" error:`, err.message);
        processes.delete(id);
      });

      processes.set(id, mcpProc);
      resetIdleTimer(mcpProc);

      res.json({ ok: true, pid: child.pid });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Failed to spawn: ${msg}` });
    }
  });

  // ── Send JSON-RPC message to a process ──
  app.post('/mcp/message/:id', async (req: { params: { id: string }; body: { message: unknown } }, res: { json: (body: unknown) => void; status: (code: number) => { json: (body: unknown) => void } }) => {
    const { id } = req.params;
    const { message } = req.body;

    const proc = processes.get(id);
    if (!proc) {
      return res.status(404).json({ error: `No process found with id "${id}"` });
    }

    if (!proc.process.stdin?.writable) {
      return res.status(500).json({ error: 'Process stdin not writable' });
    }

    const jsonMsg = JSON.stringify(message);

    // Write to stdin
    proc.process.stdin.write(jsonMsg + '\n');
    proc.lastActivity = Date.now();
    resetIdleTimer(proc);

    // If it's a notification (no id), respond immediately
    const msg = message as Record<string, unknown>;
    if (!('id' in msg)) {
      return res.json({ ok: true });
    }

    // Wait for response with timeout
    const requestId = msg.id as string | number;
    const REQUEST_TIMEOUT = 30_000;

    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          proc.pending.delete(requestId);
          reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
        }, REQUEST_TIMEOUT);

        proc.pending.set(requestId, { resolve, reject, timeout });
      });

      res.json({ response });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(504).json({ error: errMsg });
    }
  });

  // ── Kill a process ──
  app.post('/mcp/kill/:id', (req: { params: { id: string } }, res: { json: (body: unknown) => void }) => {
    const { id } = req.params;
    const existed = processes.has(id);
    killProcess(id);
    res.json({ ok: true, existed });
  });

  // ── List all processes ──
  app.get('/mcp/status', (_req: unknown, res: { json: (body: unknown) => void }) => {
    const status = Array.from(processes.entries()).map(([id, proc]) => ({
      id,
      pid: proc.process.pid,
      startedAt: proc.startedAt,
      lastActivity: proc.lastActivity,
      alive: !proc.process.killed,
      pendingRequests: proc.pending.size,
    }));
    res.json({ processes: status });
  });

  // ── Health check for a specific process ──
  app.get('/mcp/health/:id', (req: { params: { id: string } }, res: { json: (body: unknown) => void; status: (code: number) => { json: (body: unknown) => void } }) => {
    const { id } = req.params;
    const proc = processes.get(id);

    if (!proc) {
      return res.status(404).json({ alive: false, error: 'Not found' });
    }

    res.json({
      id,
      pid: proc.process.pid,
      alive: !proc.process.killed,
      startedAt: proc.startedAt,
      lastActivity: proc.lastActivity,
      uptimeMs: Date.now() - proc.startedAt,
    });
  });
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  console.log('[MCP] Shutting down — killing all MCP processes');
  for (const id of processes.keys()) {
    killProcess(id);
  }
});

process.on('SIGINT', () => {
  for (const id of processes.keys()) {
    killProcess(id);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/mcp-routes.ts
git commit -m "feat(mcp): add stdio process manager with spawn, message relay, idle timeout"
```

---

## Task 13: Mount MCP Routes in Local Server

**Files:**
- Modify: `server/local.ts:21-22,394-404`

- [ ] **Step 1: Add import**

Add after line 22 (`import { registerDockerRoutes } from './docker-routes';`):

```typescript
import { registerMcpRoutes } from './mcp-routes';
```

- [ ] **Step 2: Register routes**

After line 395 (`registerDockerRoutes(app);`), add:

```typescript
registerMcpRoutes(app);
```

- [ ] **Step 3: Update the startup log**

Update the console.log on line 404 to include MCP endpoints:

```typescript
  console.log(`  🔌 MCP Proxy: /mcp/spawn, /mcp/message/:id, /mcp/kill/:id, /mcp/status\n`);
```

- [ ] **Step 4: Verify local server compiles**

Run: `npx tsx --no-warnings server/local.ts &` then `curl http://localhost:3100/mcp/status` after 2 seconds.
Expected: `{"processes":[]}`

- [ ] **Step 5: Commit**

```bash
git add server/local.ts
git commit -m "feat(mcp): mount MCP proxy routes on local server :3100"
```

---

## Task 14: Zustand MCP Store

**Files:**
- Create: `src/stores/mcp.ts`

- [ ] **Step 1: Create MCP Zustand store**

```typescript
// src/stores/mcp.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  McpServerConfig,
  McpTool,
  McpResource,
  McpConnectionState,
} from '../lib/mcp/types';
import { McpConnectionManager } from '../lib/mcp/connection-manager';
import { McpServerRegistry } from '../lib/mcp/server-registry';
import { initMcpBridge, getMcpTools } from '../lib/kits/builtin/mcp-bridge-kit';
import { getPreset, type McpServerPreset } from '../lib/mcp/presets';

// Singleton instances
let registry: McpServerRegistry | null = null;
let connectionManager: McpConnectionManager | null = null;

function getRegistry(): McpServerRegistry {
  if (!registry) registry = new McpServerRegistry();
  return registry;
}

function getConnectionManager(): McpConnectionManager {
  if (!connectionManager) {
    connectionManager = new McpConnectionManager(getRegistry());
    initMcpBridge(connectionManager);
  }
  return connectionManager;
}

interface McpState {
  // Persisted server configs
  serverConfigs: Record<string, McpServerConfig>;

  // Runtime state (not persisted)
  connectionStatus: Record<string, McpConnectionState>;
  serverTools: Record<string, McpTool[]>;
  serverResources: Record<string, McpResource[]>;
  serverErrors: Record<string, string>;
  initialized: boolean;

  // Actions
  initialize: (oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<void>;
  addServerFromPreset: (presetId: string, credentials: Record<string, string>) => void;
  addCustomServer: (config: McpServerConfig) => void;
  removeServer: (id: string) => Promise<void>;
  updateServer: (id: string, updates: Partial<McpServerConfig>) => void;
  connectServer: (id: string, oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<void>;
  disconnectServer: (id: string) => Promise<void>;
  toggleTool: (serverId: string, toolName: string, enabled: boolean) => void;
  testConnection: (id: string, oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<{ ok: boolean; toolCount: number; error?: string }>;

  // Derived
  getConnectedServers: () => McpServerConfig[];
  getAllMcpToolCount: () => number;
}

export const useMcpStore = create<McpState>()(
  persist(
    (set, get) => ({
      serverConfigs: {},
      connectionStatus: {},
      serverTools: {},
      serverResources: {},
      serverErrors: {},
      initialized: false,

      initialize: async (oauthTokens, apiKeys) => {
        const mgr = getConnectionManager();
        const reg = getRegistry();

        // Sync persisted configs into registry
        const configs = get().serverConfigs;
        for (const config of Object.values(configs)) {
          reg.add(config);
        }

        // Subscribe to connection changes
        mgr.subscribe(() => {
          const status: Record<string, McpConnectionState> = {};
          const tools: Record<string, McpTool[]> = {};
          const resources: Record<string, McpResource[]> = {};
          const errors: Record<string, string> = {};

          for (const info of mgr.getAllConnections()) {
            status[info.config.id] = info.state;
            tools[info.config.id] = info.tools;
            resources[info.config.id] = info.resources;
            if (info.error) errors[info.config.id] = info.error;
          }

          set({
            connectionStatus: status,
            serverTools: tools,
            serverResources: resources,
            serverErrors: errors,
          });
        });

        // Start auto-connecting
        await mgr.start(oauthTokens, apiKeys).catch(() => {});
        set({ initialized: true });
      },

      addServerFromPreset: (presetId, credentials) => {
        const preset = getPreset(presetId);
        if (!preset) return;

        const reg = getRegistry();
        const config = reg.createFromPreset(preset, credentials);
        reg.add(config);

        set((s) => ({
          serverConfigs: { ...s.serverConfigs, [config.id]: config },
        }));
      },

      addCustomServer: (config) => {
        getRegistry().add(config);
        set((s) => ({
          serverConfigs: { ...s.serverConfigs, [config.id]: config },
        }));
      },

      removeServer: async (id) => {
        await getConnectionManager().disconnectServer(id).catch(() => {});
        getRegistry().remove(id);

        set((s) => {
          const configs = { ...s.serverConfigs };
          delete configs[id];
          const status = { ...s.connectionStatus };
          delete status[id];
          const tools = { ...s.serverTools };
          delete tools[id];
          const resources = { ...s.serverResources };
          delete resources[id];
          const errors = { ...s.serverErrors };
          delete errors[id];
          return { serverConfigs: configs, connectionStatus: status, serverTools: tools, serverResources: resources, serverErrors: errors };
        });
      },

      updateServer: (id, updates) => {
        getRegistry().update(id, updates);
        set((s) => {
          const existing = s.serverConfigs[id];
          if (!existing) return s;
          return {
            serverConfigs: {
              ...s.serverConfigs,
              [id]: { ...existing, ...updates },
            },
          };
        });
      },

      connectServer: async (id, oauthTokens, apiKeys) => {
        await getConnectionManager().connectServer(id, oauthTokens, apiKeys);
      },

      disconnectServer: async (id) => {
        await getConnectionManager().disconnectServer(id);
      },

      toggleTool: (serverId, toolName, enabled) => {
        const config = get().serverConfigs[serverId];
        if (!config) return;

        let disabledTools = [...config.disabledTools];
        if (enabled) {
          disabledTools = disabledTools.filter((t) => t !== toolName);
        } else if (!disabledTools.includes(toolName)) {
          disabledTools.push(toolName);
        }

        get().updateServer(serverId, { disabledTools });
      },

      testConnection: async (id, oauthTokens, apiKeys) => {
        try {
          await getConnectionManager().connectServer(id, oauthTokens, apiKeys);
          const info = getConnectionManager().getConnection(id);
          return {
            ok: info?.state === 'ready',
            toolCount: info?.tools.length || 0,
          };
        } catch (err) {
          return {
            ok: false,
            toolCount: 0,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      },

      getConnectedServers: () => {
        const { serverConfigs, connectionStatus } = get();
        return Object.values(serverConfigs).filter(
          (c) => connectionStatus[c.id] === 'ready',
        );
      },

      getAllMcpToolCount: () => {
        return getMcpTools().length;
      },
    }),
    {
      name: 'mcv-mcp',
      partialize: (s) => ({
        serverConfigs: s.serverConfigs,
      }),
    },
  ),
);
```

- [ ] **Step 2: Add MCP store export to stores index**

In `src/stores/index.ts`, add:

```typescript
export { useMcpStore } from './mcp';
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/mcp.ts src/stores/index.ts
git commit -m "feat(mcp): add Zustand MCP store with persist, preset support, tool toggles"
```

---

## Task 15: MCP Server Card Component

**Files:**
- Create: `src/components/McpServerCard.tsx`

- [ ] **Step 1: Create server card component**

```tsx
// src/components/McpServerCard.tsx
import { useState } from 'react';
import {
  Plug, PlugZap, AlertCircle, Loader2, Wrench,
  MoreVertical, Trash2, Settings, Play, Square, RefreshCw,
} from 'lucide-react';
import type { McpServerConfig, McpConnectionState, McpTool } from '../lib/mcp/types';

interface McpServerCardProps {
  config: McpServerConfig;
  status: McpConnectionState;
  tools: McpTool[];
  error?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onRemove: () => void;
  onConfigure: () => void;
}

const STATUS_CONFIG: Record<
  McpConnectionState,
  { color: string; bg: string; label: string }
> = {
  disconnected: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Disconnected' },
  connecting: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Connecting' },
  initializing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Initializing' },
  ready: { color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', label: 'Connected' },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Error' },
  reconnecting: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Reconnecting' },
};

const TRANSPORT_LABELS: Record<string, string> = {
  stdio: 'stdio',
  sse: 'SSE',
  'streamable-http': 'HTTP',
};

export default function McpServerCard({
  config,
  status,
  tools,
  error,
  onConnect,
  onDisconnect,
  onRemove,
  onConfigure,
}: McpServerCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const isConnected = status === 'ready';
  const isLoading = status === 'connecting' || status === 'initializing' || status === 'reconnecting';

  return (
    <div
      className="mcp-server-card"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,245,255,0.15)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {/* Status dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusCfg.color,
            boxShadow: isConnected ? `0 0 8px ${statusCfg.color}` : 'none',
            flexShrink: 0,
          }}
        />

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary, #e5e7eb)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {config.name}
          </div>
          {config.description && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary, #9ca3af)',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {config.description}
            </div>
          )}
        </div>

        {/* Menu button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mcp-icon-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--bg-elevated, #1a1a2e)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '4px',
                zIndex: 50,
                minWidth: '140px',
              }}
            >
              <button
                onClick={() => { onConfigure(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '8px 12px', background: 'none', border: 'none',
                  color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
                  cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
                }}
              >
                <Settings size={14} /> Configure
              </button>
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '8px 12px', background: 'none', border: 'none',
                  color: '#ef4444', fontSize: '13px',
                  cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {/* Tool count */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: isConnected ? '#00F5FF' : 'var(--text-secondary, #9ca3af)',
            background: isConnected ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.04)',
            padding: '3px 8px',
            borderRadius: '6px',
          }}
        >
          <Wrench size={11} />
          {isConnected ? tools.length : '—'} tools
        </span>

        {/* Transport badge */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary, #9ca3af)',
            background: 'rgba(255,255,255,0.04)',
            padding: '3px 8px',
            borderRadius: '6px',
          }}
        >
          {TRANSPORT_LABELS[config.transport] || config.transport}
        </span>

        {/* Status label */}
        <span
          style={{
            fontSize: '11px',
            color: statusCfg.color,
            background: statusCfg.bg,
            padding: '3px 8px',
            borderRadius: '6px',
          }}
        >
          {statusCfg.label}
        </span>

        {/* Venture scope */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary, #9ca3af)',
            background: 'rgba(255,255,255,0.04)',
            padding: '3px 8px',
            borderRadius: '6px',
          }}
        >
          {config.ventureScope === '*' ? 'All ventures' : (config.ventureScope as string[]).join(', ')}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '12px',
            color: '#ef4444',
            background: 'rgba(239,68,68,0.05)',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ wordBreak: 'break-word' }}>{error}</span>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: isConnected ? 'rgba(239,68,68,0.3)' : 'rgba(0,245,255,0.3)',
          background: isConnected ? 'rgba(239,68,68,0.05)' : 'rgba(0,245,255,0.05)',
          color: isConnected ? '#ef4444' : '#00F5FF',
          fontSize: '13px',
          fontWeight: 500,
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" /> Connecting...</>
        ) : isConnected ? (
          <><Square size={14} /> Disconnect</>
        ) : (
          <><Play size={14} /> Connect</>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/McpServerCard.tsx
git commit -m "feat(mcp): add McpServerCard component with status, tools, actions"
```

---

## Task 16: Add Server Modal

**Files:**
- Create: `src/components/McpAddServerModal.tsx`

- [ ] **Step 1: Create add server modal**

```tsx
// src/components/McpAddServerModal.tsx
import { useState } from 'react';
import {
  X, Zap, Globe, Database, Code, MessageSquare,
  Search, Terminal, Link,
} from 'lucide-react';
import { MCP_PRESETS, type McpServerPreset } from '../lib/mcp/presets';
import type { McpServerConfig } from '../lib/mcp/types';

interface McpAddServerModalProps {
  open: boolean;
  onClose: () => void;
  onAddPreset: (presetId: string, credentials: Record<string, string>) => void;
  onAddCustom: (config: McpServerConfig) => void;
}

const CATEGORY_ICONS: Record<string, typeof Code> = {
  code: Code,
  data: Database,
  comms: MessageSquare,
  infra: Globe,
  specialized: Zap,
};

type ModalView = 'presets' | 'preset-config' | 'custom-stdio' | 'custom-http';

export default function McpAddServerModal({
  open,
  onClose,
  onAddPreset,
  onAddCustom,
}: McpAddServerModalProps) {
  const [view, setView] = useState<ModalView>('presets');
  const [selectedPreset, setSelectedPreset] = useState<McpServerPreset | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [customConfig, setCustomConfig] = useState({
    id: '',
    name: '',
    command: 'npx',
    args: '',
    url: '',
    env: '',
    headers: '',
  });

  if (!open) return null;

  const handlePresetSelect = (preset: McpServerPreset) => {
    setSelectedPreset(preset);
    setCredentials({});
    if (preset.requiredCredentials.length === 0) {
      onAddPreset(preset.id, {});
      handleClose();
    } else {
      setView('preset-config');
    }
  };

  const handlePresetSubmit = () => {
    if (!selectedPreset) return;
    onAddPreset(selectedPreset.id, credentials);
    handleClose();
  };

  const handleCustomStdioSubmit = () => {
    const envPairs: Record<string, string> = {};
    if (customConfig.env.trim()) {
      for (const line of customConfig.env.split('\n')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          envPairs[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
        }
      }
    }

    const config: McpServerConfig = {
      id: customConfig.id || `custom-${Date.now()}`,
      name: customConfig.name || customConfig.id,
      transport: 'stdio',
      command: customConfig.command,
      args: customConfig.args.split(' ').filter(Boolean),
      env: envPairs,
      ventureScope: '*',
      enabledTools: '*',
      disabledTools: [],
      approvalMode: 'none',
      autoConnect: true,
      idleTimeoutMs: 1800_000,
      category: 'specialized',
    };

    onAddCustom(config);
    handleClose();
  };

  const handleCustomHttpSubmit = () => {
    const headerPairs: Record<string, string> = {};
    if (customConfig.headers.trim()) {
      for (const line of customConfig.headers.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          headerPairs[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
        }
      }
    }

    const config: McpServerConfig = {
      id: customConfig.id || `custom-${Date.now()}`,
      name: customConfig.name || customConfig.url,
      transport: 'streamable-http',
      url: customConfig.url,
      headers: headerPairs,
      ventureScope: '*',
      enabledTools: '*',
      disabledTools: [],
      approvalMode: 'none',
      autoConnect: true,
      idleTimeoutMs: 1800_000,
      category: 'specialized',
    };

    onAddCustom(config);
    handleClose();
  };

  const handleClose = () => {
    setView('presets');
    setSelectedPreset(null);
    setCredentials({});
    setCustomConfig({ id: '', name: '', command: 'npx', args: '', url: '', env: '', headers: '' });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'var(--text-primary, #e5e7eb)',
    fontSize: '13px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary, #9ca3af)',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          width: '560px',
          maxHeight: '80vh',
          background: 'var(--bg-surface, #0f0f23)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #e5e7eb)', margin: 0 }}>
              {view === 'presets' && 'Add MCP Server'}
              {view === 'preset-config' && `Configure ${selectedPreset?.name}`}
              {view === 'custom-stdio' && 'Custom Stdio Server'}
              {view === 'custom-http' && 'Custom HTTP Server'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', margin: '4px 0 0' }}>
              {view === 'presets' && 'Choose a preset or add a custom MCP server'}
              {view === 'preset-config' && 'Provide required credentials'}
              {view === 'custom-stdio' && 'Configure an npm MCP server package'}
              {view === 'custom-http' && 'Connect to a remote MCP server'}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #9ca3af)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Preset grid */}
          {view === 'presets' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                {MCP_PRESETS.map((preset) => {
                  const Icon = CATEGORY_ICONS[preset.category] || Zap;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary, #e5e7eb)',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                    >
                      <Icon size={18} style={{ color: '#00F5FF', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{preset.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)', marginTop: '3px', lineHeight: 1.4 }}>
                          {preset.description.slice(0, 80)}{preset.description.length > 80 ? '...' : ''}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            marginTop: '6px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: preset.tier === 1 ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.04)',
                            color: preset.tier === 1 ? '#00F5FF' : 'var(--text-secondary, #9ca3af)',
                          }}
                        >
                          {preset.tier === 1 ? 'Recommended' : 'Optional'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom options */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', marginBottom: '10px' }}>
                  Or add a custom server:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setView('custom-stdio')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px', color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <Terminal size={14} /> Stdio (npm package)
                  </button>
                  <button
                    onClick={() => setView('custom-http')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px', color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <Link size={14} /> HTTP (remote URL)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Preset credential config */}
          {view === 'preset-config' && selectedPreset && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedPreset.requiredCredentials.map((cred) => (
                <div key={cred.key}>
                  <label style={labelStyle}>{cred.label}</label>
                  <input
                    type={cred.type === 'oauth' ? 'text' : 'password'}
                    placeholder={cred.type === 'oauth' ? `Connected via ${cred.oauthProvider}` : `Enter ${cred.label}`}
                    value={credentials[cred.key] || ''}
                    onChange={(e) => setCredentials({ ...credentials, [cred.key]: e.target.value })}
                    disabled={cred.type === 'oauth'}
                    style={inputStyle}
                  />
                  {cred.helpUrl && (
                    <a
                      href={cred.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#00F5FF', marginTop: '4px', display: 'inline-block' }}
                    >
                      Get this credential
                    </a>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setView('presets')}
                  style={{
                    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                    color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handlePresetSubmit}
                  style={{
                    flex: 2, padding: '10px', background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px',
                    color: '#00F5FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Add & Connect
                </button>
              </div>
            </div>
          )}

          {/* Custom stdio form */}
          {view === 'custom-stdio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Server ID</label>
                <input
                  placeholder="e.g. my-server"
                  value={customConfig.id}
                  onChange={(e) => setCustomConfig({ ...customConfig, id: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  placeholder="e.g. My Custom Server"
                  value={customConfig.name}
                  onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Command</label>
                <input
                  placeholder="npx"
                  value={customConfig.command}
                  onChange={(e) => setCustomConfig({ ...customConfig, command: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Arguments (space-separated)</label>
                <input
                  placeholder="-y @some/mcp-server"
                  value={customConfig.args}
                  onChange={(e) => setCustomConfig({ ...customConfig, args: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Environment Variables (KEY=value, one per line)</label>
                <textarea
                  placeholder={"API_KEY=sk-...\nSECRET=..."}
                  value={customConfig.env}
                  onChange={(e) => setCustomConfig({ ...customConfig, env: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setView('presets')}
                  style={{
                    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                    color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCustomStdioSubmit}
                  disabled={!customConfig.id}
                  style={{
                    flex: 2, padding: '10px', background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px',
                    color: '#00F5FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    opacity: customConfig.id ? 1 : 0.5,
                  }}
                >
                  Add Server
                </button>
              </div>
            </div>
          )}

          {/* Custom HTTP form */}
          {view === 'custom-http' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Server ID</label>
                <input
                  placeholder="e.g. my-remote-server"
                  value={customConfig.id}
                  onChange={(e) => setCustomConfig({ ...customConfig, id: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  placeholder="e.g. My Remote MCP Server"
                  value={customConfig.name}
                  onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Server URL</label>
                <input
                  placeholder="https://mcp.example.com/sse"
                  value={customConfig.url}
                  onChange={(e) => setCustomConfig({ ...customConfig, url: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Headers (Key: Value, one per line)</label>
                <textarea
                  placeholder="Authorization: Bearer sk-..."
                  value={customConfig.headers}
                  onChange={(e) => setCustomConfig({ ...customConfig, headers: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setView('presets')}
                  style={{
                    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                    color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCustomHttpSubmit}
                  disabled={!customConfig.id || !customConfig.url}
                  style={{
                    flex: 2, padding: '10px', background: 'rgba(0,245,255,0.1)',
                    border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px',
                    color: '#00F5FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    opacity: (customConfig.id && customConfig.url) ? 1 : 0.5,
                  }}
                >
                  Add Server
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/McpAddServerModal.tsx
git commit -m "feat(mcp): add McpAddServerModal with presets, custom stdio, custom HTTP"
```

---

## Task 17: Server Detail Panel

**Files:**
- Create: `src/components/McpServerDetail.tsx`

- [ ] **Step 1: Create server detail panel**

```tsx
// src/components/McpServerDetail.tsx
import { useState } from 'react';
import {
  X, Wrench, FileText, Settings, Check, Square,
} from 'lucide-react';
import type { McpServerConfig, McpTool, McpResource } from '../lib/mcp/types';

interface McpServerDetailProps {
  config: McpServerConfig;
  tools: McpTool[];
  resources: McpResource[];
  onToggleTool: (toolName: string, enabled: boolean) => void;
  onUpdateConfig: (updates: Partial<McpServerConfig>) => void;
  onClose: () => void;
}

type Tab = 'tools' | 'resources' | 'config';

export default function McpServerDetail({
  config,
  tools,
  resources,
  onToggleTool,
  onUpdateConfig,
  onClose,
}: McpServerDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tools');

  const tabs: { id: Tab; label: string; count?: number; icon: typeof Wrench }[] = [
    { id: 'tools', label: 'Tools', count: tools.length, icon: Wrench },
    { id: 'resources', label: 'Resources', count: resources.length, icon: FileText },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        background: 'var(--bg-surface, #0f0f23)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #e5e7eb)', margin: 0 }}>
            {config.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', margin: '2px 0 0' }}>
            {config.id} · {config.transport}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #9ca3af)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #00F5FF' : '2px solid transparent',
                color: isActive ? '#00F5FF' : 'var(--text-secondary, #9ca3af)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: '11px', opacity: 0.7 }}>({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Tools tab */}
        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tools.length === 0 ? (
              <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '13px' }}>
                No tools available. Is the server connected?
              </p>
            ) : (
              tools.map((tool) => {
                const isDisabled = config.disabledTools.includes(tool.name);
                return (
                  <button
                    key={tool.name}
                    onClick={() => onToggleTool(tool.name, isDisabled)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      background: isDisabled ? 'rgba(255,255,255,0.01)' : 'rgba(0,245,255,0.03)',
                      border: '1px solid',
                      borderColor: isDisabled ? 'rgba(255,255,255,0.04)' : 'rgba(0,245,255,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'all 0.2s',
                      width: '100%',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `1.5px solid ${isDisabled ? 'rgba(255,255,255,0.2)' : '#00F5FF'}`,
                        background: isDisabled ? 'transparent' : 'rgba(0,245,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {!isDisabled && <Check size={12} style={{ color: '#00F5FF' }} />}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-primary, #e5e7eb)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {tool.name}
                      </div>
                      {tool.description && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary, #9ca3af)',
                            marginTop: '3px',
                            lineHeight: 1.4,
                          }}
                        >
                          {tool.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Resources tab */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resources.length === 0 ? (
              <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '13px' }}>
                No resources exposed by this server.
              </p>
            ) : (
              resources.map((resource) => (
                <div
                  key={resource.uri}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #e5e7eb)' }}>
                    {resource.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#00F5FF', fontFamily: 'monospace', marginTop: '3px' }}>
                    {resource.uri}
                  </div>
                  {resource.description && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)', marginTop: '3px' }}>
                      {resource.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Config tab */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Venture Scope */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #9ca3af)', marginBottom: '6px' }}>
                Venture Scope
              </label>
              <select
                value={config.ventureScope === '*' ? '*' : 'custom'}
                onChange={(e) => {
                  if (e.target.value === '*') onUpdateConfig({ ventureScope: '*' });
                }}
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
                }}
              >
                <option value="*">All Ventures</option>
                <option value="custom">Custom (coming soon)</option>
              </select>
            </div>

            {/* Approval Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #9ca3af)', marginBottom: '6px' }}>
                Require Approval
              </label>
              <select
                value={config.approvalMode}
                onChange={(e) => onUpdateConfig({ approvalMode: e.target.value as McpServerConfig['approvalMode'] })}
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
                }}
              >
                <option value="none">None</option>
                <option value="destructive">Destructive Only</option>
                <option value="all">All Tool Calls</option>
              </select>
            </div>

            {/* Auto-Connect */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-primary, #e5e7eb)' }}>
                Auto-connect on startup
              </label>
              <button
                onClick={() => onUpdateConfig({ autoConnect: !config.autoConnect })}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px',
                  background: config.autoConnect ? '#00F5FF' : 'rgba(255,255,255,0.15)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px',
                    left: config.autoConnect ? '21px' : '3px',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>

            {/* Idle Timeout */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #9ca3af)', marginBottom: '6px' }}>
                Idle Timeout (minutes)
              </label>
              <input
                type="number"
                value={Math.round(config.idleTimeoutMs / 60_000)}
                onChange={(e) => onUpdateConfig({ idleTimeoutMs: parseInt(e.target.value || '30') * 60_000 })}
                min={1}
                max={480}
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/McpServerDetail.tsx
git commit -m "feat(mcp): add McpServerDetail panel with tools, resources, config tabs"
```

---

## Task 18: Integrate into IntegrationsHub

**Files:**
- Modify: `src/components/IntegrationsHub.tsx`

- [ ] **Step 1: Read the full IntegrationsHub component to understand where to add the MCP tab**

Read the complete file to identify the tab rendering section and where to inject MCP content.

- [ ] **Step 2: Add MCP imports at the top of IntegrationsHub.tsx**

After the existing imports, add:

```typescript
import { useMcpStore } from '../stores/mcp';
import McpServerCard from './McpServerCard';
import McpAddServerModal from './McpAddServerModal';
import McpServerDetail from './McpServerDetail';
import type { McpServerConfig } from '../lib/mcp/types';
import { Plug } from 'lucide-react';
```

- [ ] **Step 3: Add MCP state and handlers inside the component**

Inside the component function, add the MCP state hooks and handlers:

```typescript
// MCP state
const mcpStore = useMcpStore();
const [mcpAddModalOpen, setMcpAddModalOpen] = useState(false);
const [mcpDetailServerId, setMcpDetailServerId] = useState<string | null>(null);

const mcpServers = Object.values(mcpStore.serverConfigs);
const mcpDetailConfig = mcpDetailServerId ? mcpStore.serverConfigs[mcpDetailServerId] : null;
```

- [ ] **Step 4: Add an "MCP Servers" tab alongside existing tabs**

Find the tabs rendering section and add:

```tsx
<button
  onClick={() => store.setActiveTab('mcp' as any)}
  style={{ /* match existing tab styles */ }}
>
  <Plug size={14} />
  MCP Servers
  <span>({mcpServers.length})</span>
</button>
```

- [ ] **Step 5: Add MCP servers content section**

When the 'mcp' tab is active, render the MCP server cards and add button:

```tsx
{store.activeTab === 'mcp' && (
  <div>
    {/* Server cards grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
      {mcpServers.map((config) => (
        <McpServerCard
          key={config.id}
          config={config}
          status={mcpStore.connectionStatus[config.id] || 'disconnected'}
          tools={mcpStore.serverTools[config.id] || []}
          error={mcpStore.serverErrors[config.id]}
          onConnect={() => mcpStore.connectServer(config.id, {}, {})}
          onDisconnect={() => mcpStore.disconnectServer(config.id)}
          onRemove={() => mcpStore.removeServer(config.id)}
          onConfigure={() => setMcpDetailServerId(config.id)}
        />
      ))}
    </div>

    {/* Add server button */}
    <button
      onClick={() => setMcpAddModalOpen(true)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        width: '100%', marginTop: '16px', padding: '14px',
        background: 'rgba(0,245,255,0.04)', border: '1px dashed rgba(0,245,255,0.2)',
        borderRadius: '12px', color: '#00F5FF', fontSize: '14px', fontWeight: 500,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      + Add MCP Server
    </button>

    {/* Modals */}
    <McpAddServerModal
      open={mcpAddModalOpen}
      onClose={() => setMcpAddModalOpen(false)}
      onAddPreset={(presetId, creds) => {
        mcpStore.addServerFromPreset(presetId, creds);
      }}
      onAddCustom={(config) => {
        mcpStore.addCustomServer(config);
      }}
    />

    {/* Detail panel */}
    {mcpDetailConfig && (
      <McpServerDetail
        config={mcpDetailConfig}
        tools={mcpStore.serverTools[mcpDetailServerId!] || []}
        resources={mcpStore.serverResources[mcpDetailServerId!] || []}
        onToggleTool={(toolName, enabled) => mcpStore.toggleTool(mcpDetailServerId!, toolName, enabled)}
        onUpdateConfig={(updates) => mcpStore.updateServer(mcpDetailServerId!, updates)}
        onClose={() => setMcpDetailServerId(null)}
      />
    )}
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/IntegrationsHub.tsx
git commit -m "feat(mcp): integrate MCP Servers tab into IntegrationsHub"
```

---

## Task 19: Build Verification & Integration Smoke Test

**Files:**
- No new files

- [ ] **Step 1: Run TypeScript compilation**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors (or only pre-existing ones)

- [ ] **Step 2: Fix any type errors found in Step 1**

Address each error specifically.

- [ ] **Step 3: Run the Vite dev build**

Run: `npx vite build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Run ESLint**

Run: `npx eslint src/lib/mcp/ src/stores/mcp.ts src/components/Mcp*.tsx server/mcp-routes.ts 2>&1`
Expected: No critical errors

- [ ] **Step 5: Verify local server compiles and MCP routes respond**

Run: `npx tsx server/local.ts &` then after 2s:
- `curl http://localhost:3100/mcp/status` → `{"processes":[]}`
- `curl http://localhost:3100/mcp/health/nonexistent` → 404

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(mcp): resolve build errors and lint issues"
```

---

## Dependency Graph

```
Task 1 (types) ─────────┬─────────────────────────────────────────┐
                         │                                         │
                    Task 2 (streamable-http)                       │
                    Task 3 (sse)                                   │
                    Task 4 (stdio-proxy) ──── Task 12 (server)    │
                         │                         │               │
                    Task 5 (client) ──────── Task 13 (mount)      │
                         │                                         │
                    Task 6 (schema-adapter)                        │
                    Task 7 (presets) ──────── Task 8 (registry)    │
                         │                         │               │
                    Task 9 (connection-mgr) ───────┘               │
                         │                                         │
                   Task 10 (bridge-kit) ─── Task 11 (loader)      │
                         │                                         │
                   Task 14 (store) ────────────────────────────────┘
                         │
                   Task 15 (card)
                   Task 16 (modal)
                   Task 17 (detail)
                         │
                   Task 18 (integrations-hub)
                         │
                   Task 19 (verify)
```

**Parallelizable groups:**
- Tasks 2, 3, 4 (transports — independent)
- Tasks 7, 8 (presets + registry — independent of transports)
- Tasks 12, 13 (server-side — independent of client-side)
- Tasks 15, 16, 17 (UI components — independent of each other)
