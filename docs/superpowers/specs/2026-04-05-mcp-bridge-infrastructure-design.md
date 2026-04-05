# MCV One Desktop — MCP Bridge Infrastructure

**Date**: 2026-04-05
**Status**: Approved
**Owner**: Tony (CEO, EdgeIQ Holdings)
**Agent**: NAOS

---

## 1. Overview

Build a native MCP (Model Context Protocol) client infrastructure into MCV Desktop, enabling NAOS to consume tools from any standards-compliant MCP server. This transforms the app from a closed kit system into an open orchestration hub — "npm for agents" that can pull in GitHub deep operations, web search, database queries, browser automation, and any future MCP server without writing custom kit code.

### Approach

**MCP Bridge Kit (Approach C)**: A single meta-kit that owns all MCP server connections and dynamically generates tool schemas from connected servers. The existing kit infrastructure (orchestrator, bridge, permissions, telemetry, venture scoping) is fully reused. A lightweight browser-native MCP client replaces the heavy official SDK. The local server on port 3100 extends to become a stdio process manager for MCP servers that run as local processes.

### Success Criteria

- Browser-native MCP client supporting Streamable HTTP, SSE, and stdio (via proxy) transports
- MCP Bridge Kit that dynamically exposes connected server tools through the existing orchestrator
- Stdio proxy on local server :3100 for process-based MCP servers
- IntegrationsHub UI with "MCP Servers" section — presets, custom config, per-tool toggles, venture scoping
- 4 Tier-1 server presets: GitHub (Deep), Brave Search, Fetch, PostgreSQL
- Tool namespacing (`mcp_{server}_{tool}`) to prevent collisions
- Credential reference system (`$oauth:`, `$apikey:`) for shared token management
- Event emitter on McpClient for future notification/real-time support
- All MCP tools visible in NAOS chat alongside existing kit tools

### Non-Goals (Phase 1)

- MCP Host/Provider (exposing our kits to external clients)
- Multi-device MCP bridging (LAN/remote — designed for, not built)
- Semantic tool routing / dynamic tool activation
- Full notification handler wiring (event emitter exists, handlers deferred)

---

## 2. MCP Protocol Client

### 2.1 Why Not the Official SDK

The `@modelcontextprotocol/sdk` package (~400KB) assumes Node.js: uses `child_process` for stdio, Node streams for transport. It doesn't run in the browser. We build a focused client:

- Browser-native (fetch + EventSource)
- ~2KB per transport
- Integrated with kit permission system
- Venture-scope aware
- Event emitter for future notification support

### 2.2 Protocol Types (`src/lib/mcp/types.ts`)

Core types following the MCP specification:

```typescript
// JSON-RPC 2.0 base
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

// MCP-specific
interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

interface McpToolCallResult {
  content: McpContent[];
  isError?: boolean;
}

type McpContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; text: string; mimeType?: string } };

interface McpServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
}

interface McpClientCapabilities {
  roots?: { listChanged?: boolean };
  sampling?: Record<string, never>;
}

// Transport interface
interface McpTransport {
  send(message: JsonRpcRequest | JsonRpcNotification): Promise<void>;
  onMessage(handler: (message: JsonRpcResponse | JsonRpcNotification) => void): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// Server configuration (persisted)
interface McpServerConfig {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  // stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;          // Supports $oauth:key and $apikey:key refs
  // http
  url?: string;
  headers?: Record<string, string>;      // Supports $oauth:key and $apikey:key refs
  // behavior
  ventureScope: string[] | '*';
  enabledTools: string[] | '*';
  disabledTools: string[];
  approvalMode: 'none' | 'destructive' | 'all';
  autoConnect: boolean;
  idleTimeoutMs: number;                  // Default 1800000 (30 min)
  // metadata
  preset?: string;                        // e.g. 'github' — links to preset definition
  iconUrl?: string;
  category?: 'code' | 'data' | 'comms' | 'infra' | 'specialized';
}
```

### 2.3 MCP Client (`src/lib/mcp/client.ts`)

A state machine managing a single MCP server connection:

```
States: disconnected → connecting → initializing → ready → error
                ▲                                      │
                └──────────── reconnecting ◄────────────┘
```

Responsibilities:
- Holds a transport instance
- Performs the initialize handshake (send capabilities, receive server capabilities)
- Sends `initialized` notification after handshake
- Discovers tools via `tools/list`, resources via `resources/list`, prompts via `prompts/list`
- Routes `tools/call` to the server and returns results
- Routes `resources/read` for resource access
- Correlates JSON-RPC request IDs to pending response promises
- Emits events: `connected`, `disconnected`, `error`, `tools-changed`, `notification`
- Request timeout (30s default, configurable)
- Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)

Event emitter interface (Evolution Hook for notifications):

```typescript
interface McpClientEvents {
  'connected': () => void;
  'disconnected': (reason: string) => void;
  'error': (error: Error) => void;
  'tools-changed': (tools: McpTool[]) => void;
  'resources-changed': (resources: McpResource[]) => void;
  'notification': (method: string, params: unknown) => void;
}
```

### 2.4 Connection Lifecycle

```
1. Transport.connect()                    — open channel
2. Client sends: initialize              — protocol version + client capabilities
3. Server responds: initialize result    — server capabilities + info
4. Client sends: initialized             — notification (no response)
5. Client sends: tools/list              — discover available tools
6. Client sends: resources/list          — discover available resources
7. Client sends: prompts/list            — discover available prompts
8. State → ready                          — tools registered in bridge kit
```

---

## 3. Transport Layer

### 3.1 Streamable HTTP (`src/lib/mcp/transports/streamable-http.ts`)

The primary transport for modern MCP servers. Browser-native using fetch.

- Sends JSON-RPC requests via `POST` to the server URL
- Response can be JSON (single response) or SSE stream (for streaming results)
- Handles session IDs via `Mcp-Session-Id` header
- Supports request cancellation via AbortController

### 3.2 SSE Transport (`src/lib/mcp/transports/sse.ts`)

Legacy transport for older MCP servers. Browser-native using EventSource.

- Opens persistent SSE connection to server's `/sse` endpoint
- Receives an endpoint URL from the `endpoint` event
- Sends JSON-RPC requests via `POST` to that endpoint
- Responses arrive as SSE `message` events on the persistent connection

### 3.3 Stdio Proxy Transport (`src/lib/mcp/transports/stdio-proxy.ts`)

For MCP servers that run as local processes (npm packages). Routes through the local server on port 3100.

- `connect()` → POST `/mcp/spawn` with command, args, env
- `send()` → POST `/mcp/message/{serverId}` with JSON-RPC payload
- `disconnect()` → POST `/mcp/kill/{serverId}`
- Polls `/mcp/health/{serverId}` for liveness (or uses WebSocket upgrade later)

---

## 4. Stdio Proxy — Local Server Extension

### 4.1 New Routes (`server/mcp-proxy.ts`)

Added to the existing Express server on port 3100:

```
POST   /mcp/spawn           — Start an MCP server process
POST   /mcp/message/:id     — Send JSON-RPC, receive response
POST   /mcp/kill/:id        — Terminate a server process
GET    /mcp/status           — List all running processes
GET    /mcp/health/:id      — Check if process is alive
```

### 4.2 Process Manager

Maintains `Map<string, McpProcess>` in memory:

```typescript
interface McpProcess {
  id: string;
  process: ChildProcess;
  pending: Map<string | number, {
    resolve: (value: JsonRpcResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
  buffer: string;                        // Partial stdout accumulator
  startedAt: number;
  lastActivity: number;
  config: { command: string; args: string[]; env: Record<string, string> };
}
```

### 4.3 Message Correlation

JSON-RPC messages have unique `id` fields. When the browser sends a message:

1. Proxy writes JSON + newline to process stdin
2. Proxy registers a pending promise keyed by `id`
3. Process writes response to stdout
4. Proxy parses stdout line-by-line, matches `id` to pending promise
5. Returns response to browser as HTTP response

Stdout buffering handles partial messages (MCP uses newline-delimited JSON).

### 4.4 Process Lifecycle

- **Idle timeout**: Processes with no activity for `idleTimeoutMs` are killed automatically. Timer resets on every message.
- **Crash detection**: If process exits unexpectedly, pending requests are rejected with error. Status changes to `crashed`.
- **Clean shutdown**: On server stop (`SIGTERM`), all processes receive `SIGTERM`, then `SIGKILL` after 5 seconds.
- **Command allowlist**: Only known MCP server packages can be spawned. Custom commands require explicit user approval in the UI.

### 4.5 Security

- Only localhost can reach port 3100 (existing constraint)
- Environment variables passed at spawn, never written to disk by proxy
- The proxy is purely a pipe relay — executes no code from MCP messages
- SSRF protection inherited from existing sandbox fetch proxy patterns

---

## 5. MCP Bridge Kit

### 5.1 Architecture (`src/lib/kits/builtin/mcp-bridge-kit.ts`)

A single kit that acts as the gateway between the MCP world and the kit world.

**Dynamic Manifest**: Unlike static kits, the bridge kit's `tools` array rebuilds whenever MCP servers connect/disconnect. The kit re-registers itself in the kit store on change.

**Single Routing Handler**: One handler function receives all MCP tool calls. It parses the tool name prefix to determine the target server and original tool name.

### 5.2 Tool Namespacing

All MCP-sourced tools are prefixed:

```
mcp_{serverId}_{originalToolName}
```

Examples:
- `mcp_github_create_issue`
- `mcp_brave_web_search`
- `mcp_postgres_query`
- `mcp_fetch_fetch`

The prefix is parsed at dispatch time to route to the correct MCP connection.

### 5.3 Schema Adapter (`src/lib/mcp/schema-adapter.ts`)

Translates between MCP and Kit formats:

| MCP Field | Kit Field | Transform |
|-----------|-----------|-----------|
| `name` | `name` | Prefix with `mcp_{serverId}_` |
| `description` | `description` | Prepend `[ServerName]` for Claude context |
| `inputSchema` | `input_schema` | camelCase → snake_case key rename |

Respects `enabledTools` / `disabledTools` from server config — filtered tools are never exposed to the orchestrator.

### 5.4 Resource Access

MCP resources are exposed as a tool per connected server:

```
mcp_{serverId}_read_resource
  input: { uri: string }
  returns: resource content as text
```

This keeps the tool-calling interface uniform — Claude requests resources through the same mechanism as tool calls.

### 5.5 Result Adaptation

MCP returns `content[]` arrays. The adapter transforms to `ToolCallResult`:

```typescript
function adaptMcpResult(mcpResult: McpToolCallResult): ToolCallResult {
  const textParts = mcpResult.content
    .filter(c => c.type === 'text')
    .map(c => c.text);
  
  return {
    success: !mcpResult.isError,
    data: mcpResult.content,
    error: mcpResult.isError ? textParts.join('\n') : undefined,
    displayMarkdown: textParts.join('\n\n'),
  };
}
```

---

## 6. Connection Manager

### 6.1 Responsibilities (`src/lib/mcp/connection-manager.ts`)

Central coordinator for all MCP connections:

- Holds `Map<string, McpClient>` of active connections
- Connects/disconnects servers on demand
- Auto-connects servers with `autoConnect: true` on app boot
- Rebuilds bridge kit manifest on any connection change
- Resolves credential references (`$oauth:github` → actual token)
- Health check loop (every 60s for connected servers)
- Emits aggregate events for UI reactivity

### 6.2 Credential Resolution (Evolution Hook)

Server configs can reference credentials from the existing IntegrationsHub:

```typescript
// In McpServerConfig.env:
{
  "GITHUB_TOKEN": "$oauth:github",       // Resolved from OAuth store
  "BRAVE_API_KEY": "$apikey:brave",       // Resolved from API key store
  "CUSTOM_SECRET": "literal-value"        // Used as-is
}

// Resolution at connect/spawn time:
function resolveCredentials(env: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value.startsWith('$oauth:')) {
      resolved[key] = getOAuthToken(value.slice(7));
    } else if (value.startsWith('$apikey:')) {
      resolved[key] = getApiKey(value.slice(8));
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}
```

Benefits:
- No duplicate credential storage
- OAuth token refresh propagates automatically on reconnect
- Single source of truth in IntegrationsHub

### 6.3 Connection State Events

```typescript
interface ConnectionManagerEvents {
  'server-connected': (serverId: string, tools: McpTool[]) => void;
  'server-disconnected': (serverId: string, reason: string) => void;
  'server-error': (serverId: string, error: Error) => void;
  'tools-updated': (allTools: Map<string, McpTool[]>) => void;
}
```

The Zustand MCP store subscribes to these events for UI reactivity.

---

## 7. Zustand Store (`src/stores/mcp.ts`)

```typescript
interface McpState {
  // Server configs (persisted)
  serverConfigs: Record<string, McpServerConfig>;
  
  // Runtime state (not persisted)
  connectionStatus: Record<string, 'disconnected' | 'connecting' | 'ready' | 'error'>;
  serverTools: Record<string, McpTool[]>;
  serverResources: Record<string, McpResource[]>;
  serverErrors: Record<string, string>;
  
  // Actions
  addServer(config: McpServerConfig): void;
  updateServer(id: string, updates: Partial<McpServerConfig>): void;
  removeServer(id: string): void;
  connectServer(id: string): Promise<void>;
  disconnectServer(id: string): Promise<void>;
  toggleTool(serverId: string, toolName: string, enabled: boolean): void;
  testConnection(id: string): Promise<{ ok: boolean; toolCount: number; error?: string }>;
  
  // Derived
  getConnectedServers(): McpServerConfig[];
  getAllMcpTools(): McpTool[];
  getToolsForVenture(ventureId: string): McpTool[];
}
```

Persisted via Zustand `persist` middleware — server configs survive page reload. Connection state is transient (servers reconnect on boot if `autoConnect` is true).

---

## 8. IntegrationsHub UI

### 8.1 MCP Servers Tab

New section in the existing IntegrationsHub component. Shows all configured servers with connection status, tool counts, and action buttons.

Each server card displays:
- Status indicator (green/red/yellow dot)
- Server name and description
- Tool count from the connected server
- Transport type badge (stdio / HTTP / SSE)
- Venture scope label
- Actions menu (connect, disconnect, configure, remove)

### 8.2 Add Server Flow

Modal with three paths:

**Quick Add (Presets)**: Grid of curated server cards. Selecting one pre-fills config and shows required credentials. User provides API key or connects OAuth, clicks "Connect."

**Custom Stdio**: Form fields for command, args, environment variables. For advanced users adding any npm MCP server.

**Custom HTTP**: Form fields for URL and headers. For remote/network MCP servers.

### 8.3 Server Detail Panel

Accessed by clicking into a connected server. Shows:

**Tools tab**: List of all tools with checkbox toggles. Disabled tools are never sent to the orchestrator.

**Resources tab**: List of available resources with URI and description.

**Config tab**: Edit server settings — venture scope, approval mode, idle timeout, credentials.

**Logs tab**: Recent tool call history for this server (from telemetry).

### 8.4 Preset Definitions

Stored in `src/lib/mcp/presets.ts`:

```typescript
interface McpServerPreset {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'data' | 'comms' | 'infra' | 'specialized';
  transport: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  url?: string;
  requiredCredentials: {
    key: string;                          // env var name
    label: string;                        // "GitHub Personal Access Token"
    type: 'oauth' | 'apikey' | 'manual';  // How to obtain it
    oauthProvider?: string;               // Maps to IntegrationsHub OAuth
    helpUrl?: string;                     // Where to get the key
  }[];
  defaultVentureScope: string[] | '*';
  recommendedDisabledTools?: string[];    // Tools disabled by default (destructive)
}
```

---

## 9. Curated Server Presets

### 9.1 Tier 1 — Ship Immediately

**GitHub (Deep)**
- Package: `@modelcontextprotocol/server-github`
- Transport: stdio
- Tools: ~20 (issues CRUD, PR management, code search, branches, actions, file operations)
- Credential: `GITHUB_TOKEN` via `$oauth:github` (existing OAuth flow)
- Default disabled: `delete_repository`, `delete_branch`
- Rationale: Current github-kit has 4 tools. This gives full GitHub API surface across all ventures.

**Brave Search**
- Package: `@modelcontextprotocol/server-brave-search`
- Transport: stdio
- Tools: 2 (web_search, local_search)
- Credential: `BRAVE_API_KEY` (manual — free tier available)
- Rationale: No web search capability exists. Critical for intelligence gathering.

**Fetch (Web Scraping)**
- Package: `@modelcontextprotocol/server-fetch`
- Transport: stdio
- Tools: 1 (fetch — retrieves URL and converts HTML to markdown)
- Credential: none
- Rationale: Read and parse any web page. Lightweight alternative to Playwright.

**PostgreSQL**
- Package: `@modelcontextprotocol/server-postgres`
- Transport: stdio
- Tools: ~3 (query, list_tables, describe_table)
- Credential: `DATABASE_URL` pointing to Supabase Postgres
- Default disabled: none (read-only by default)
- Approval mode: `all` (every query requires approval — safety for production DB)
- Rationale: Direct database queries from NAOS chat. Powerful for debugging and analytics.

### 9.2 Tier 2 — Add When Needed

| Preset | Package | Transport | Trigger |
|--------|---------|-----------|---------|
| Slack | `@modelcontextprotocol/server-slack` | stdio | When team coordination needed |
| Google Workspace | Community | stdio | When deeper Gmail/Calendar needed |
| Playwright | `@playwright/mcp` | stdio | When BetEdge browser testing starts |
| Memory | `@modelcontextprotocol/server-memory` | stdio | When cross-session knowledge needed |

### 9.3 Skip — Existing Kits Are Better

| Server | Why Skip |
|--------|----------|
| Filesystem MCP | local-server-kit has venture-aware context |
| Docker MCP | docker-kit is deeper and custom |
| Cloudflare MCP | cloudflare-kit has tailored handlers |
| Notion MCP | Current notion-kit covers needs |

---

## 10. Evolution Hooks

These interfaces are defined in Phase 1 but not fully implemented. They ensure the architecture scales without rearchitecting.

### 10.1 Tool Routing (Addresses: Tool Count Explosion)

**Problem**: At 100+ tools, Claude's selection accuracy degrades and token usage spikes.

**What we build now**:
- Tool namespacing (`mcp_{server}_{tool}`) enables filtering
- Per-tool toggles in UI reduce active tool count
- Venture scoping already limits tools per context

**What this enables later**:
- Semantic tool index: embed tool descriptions, retrieve top-N relevant tools per message
- Conversation-level tool activation: "I need GitHub tools" loads that server's tools for the session
- Tool groups / categories in the orchestrator

### 10.2 Notification Forwarding (Addresses: Real-time Events)

**Problem**: MCP servers can push notifications (file changes, PR updates, deployment events). Dropping them loses real-time intelligence.

**What we build now**:
- Event emitter interface on McpClient with `notification` event
- Transports forward all messages, not just request responses
- Connection manager has aggregate event bus

**What this enables later**:
- Real-time event stream in NAOS chat ("PR #42 just got approved")
- Multi-device event sync when bridge extends to LAN/remote
- Webhook-style triggers for n8n workflows

### 10.3 Credential Lifecycle (Addresses: Token Management at Scale)

**Problem**: 10-20 servers sharing credentials need refresh, rotation, and deduplication.

**What we build now**:
- `$oauth:` and `$apikey:` reference syntax in server env config
- Resolution at connect/spawn time from IntegrationsHub stores
- No duplicate credential storage

**What this enables later**:
- OAuth token refresh propagates to all dependent servers on reconnect
- Credential rotation without reconfiguring each server
- Shared credential pool (multiple servers using same GitHub token)

---

## 11. File Structure

```
src/lib/mcp/
├── types.ts                   # MCP protocol types, McpServerConfig,
│                              #   transport interface, event types
├── client.ts                  # McpClient — single connection state machine,
│                              #   JSON-RPC correlation, event emitter
├── transports/
│   ├── streamable-http.ts     # Fetch-based, Mcp-Session-Id, SSE streaming
│   ├── sse.ts                 # EventSource for legacy servers
│   └── stdio-proxy.ts         # Routes through local server :3100
├── connection-manager.ts      # All-connection coordinator, credential
│                              #   resolution, health checks, auto-connect
├── schema-adapter.ts          # MCP ↔ Kit schema translation, namespacing,
│                              #   tool filtering, result adaptation
├── server-registry.ts         # McpServerConfig CRUD, localStorage +
│                              #   Supabase persistence
└── presets.ts                 # Curated server preset definitions

src/lib/kits/builtin/
└── mcp-bridge-kit.ts          # Dynamic meta-kit, single routing handler,
                               #   manifest rebuilds on connection changes

server/
├── local.ts                   # Extended with /mcp/* route mounting
└── mcp-proxy.ts               # Stdio process manager — spawn, message
                               #   correlation, kill, health, idle timeout

src/stores/
└── mcp.ts                     # Zustand store — server configs (persisted),
                               #   connection state (transient), actions

src/components/
├── IntegrationsHub.tsx         # Extended with MCP Servers tab
├── McpServerCard.tsx           # Server list item with status/actions
├── McpAddServerModal.tsx       # Preset grid + custom stdio/http forms
└── McpServerDetail.tsx         # Tools/resources/config/logs tabs
```

---

## 12. Integration Points with Existing Systems

| System | Integration |
|--------|------------|
| **Kit Store** | Bridge kit registers/unregisters as MCP connections change |
| **Orchestrator** | No changes needed — assembleTools() picks up bridge kit tools automatically |
| **Permissions** | MCP servers inherit kit capability system; approval modes map to HITL gate |
| **Telemetry** | All MCP tool calls tracked through existing telemetry (kit tool call events) |
| **Venture Scoping** | Per-server venture scope in config, filtered during tool assembly |
| **IntegrationsHub** | MCP tab added alongside OAuth and API Keys |
| **OAuth Store** | Credential references resolve from existing OAuth tokens |
| **Local Server** | New /mcp/* routes added to Express server on :3100 |
| **Shared Context** | MCP tools can read/write shared context like any kit tool |

---

## 13. Error Handling

| Scenario | Behavior |
|----------|----------|
| Server fails to spawn | Connection status → error, error message in UI, toast notification |
| Server crashes mid-session | Pending tool calls rejected, auto-reconnect with backoff |
| Tool call times out (30s) | ToolCallResult with `success: false`, error message to Claude |
| Invalid JSON-RPC response | Logged to telemetry, treated as tool error |
| Credential reference unresolved | Connection blocked, UI shows "Configure [credential] in Integrations" |
| All MCP servers down | Bridge kit has 0 tools — existing native kits continue working |
| Stdio proxy unreachable (:3100) | Stdio-transport servers can't connect; HTTP servers unaffected |

---

## 14. Security Model

- **Process isolation**: Stdio MCP servers run as separate OS processes, not in the browser
- **Credential handling**: Tokens passed via environment variables at spawn, never stored by proxy
- **Command allowlist**: Only known MCP packages can be spawned without explicit approval
- **SSRF protection**: Inherited from existing kit sandbox patterns — private IPs blocked
- **No code evaluation**: Proxy is purely a message relay
- **Per-tool access control**: Individual tools can be disabled; destructive tools off by default
- **Approval modes**: Per-server HITL integration (none / destructive / all)
- **Venture isolation**: Server tools only visible in scoped ventures
