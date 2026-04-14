# @mcv/mcp-sdk

Model Context Protocol client suite for MCV venture apps.

## Contents

- **Client** — JSON-RPC 2.0 MCP client (initialize, list tools, call tool, list resources)
- **Transports** — `stdio-proxy` (via MCV Desktop server.ts on :3100), `sse`, `streamable-http`
- **Connection manager** — parallel server lifecycle, health checks, auto-reconnect
- **Registry** — CRUD for server configs with localStorage persistence
- **Schema adapter** — MCP tool schemas → Claude/Gemini/OpenAI tool schemas
- **Presets** — 15+ ready configs (GitHub, Postgres, Brave, Filesystem, Memory, Fetch, Slack, Notion, etc.)

## Usage

```ts
import {
  McpServerRegistry,
  McpConnectionManager,
  MCP_PRESETS,
} from '@mcv/mcp-sdk';

const registry = new McpServerRegistry();
registry.createFromPreset(MCP_PRESETS.find(p => p.id === 'github')!, {
  GITHUB_PERSONAL_ACCESS_TOKEN: token,
});

const mgr = new McpConnectionManager(registry);
await mgr.start({ github: token }, { /* api keys */ });
```

## Transport notes

- **stdio-proxy**: needs a local HTTP server that spawns MCP subprocesses.
  MCV Desktop's `server.ts` on :3100 implements this. Venture apps that
  run in the browser only should use SSE or streamable-HTTP transports.
- **streamable-http**: MCP over regular HTTP — works everywhere.
- **sse**: MCP over Server-Sent Events — works everywhere.

## Consumers

- mcv-one-desktop (via `src/lib/mcp/` shim)
- FutureState / BetEdge / mcv.gg (planned)
