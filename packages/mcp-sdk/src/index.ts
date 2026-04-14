// @mcv/mcp-sdk — Model Context Protocol client suite.
//
// Pure MCP: types + transports + client + connection manager + registry +
// presets. The MCV kit-tool schema adapter (maps MCP → KitToolSchema)
// lives in MCV Desktop's root (src/lib/mcp/schema-adapter.ts) since it
// depends on @mcv/kits-runtime.

export * from './types';
export * from './client';
export * from './presets';
export * from './server-registry';
export * from './connection-manager';

export { StdioProxyTransport } from './transports/stdio-proxy';
export { SseTransport } from './transports/sse';
export { StreamableHttpTransport } from './transports/streamable-http';

export const MCV_MCP_SDK_VERSION = '0.1.0' as const;
