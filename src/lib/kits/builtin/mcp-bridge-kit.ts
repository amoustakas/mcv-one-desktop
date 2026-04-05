import type {
  KitManifest,
  KitToolHandler,
  KitToolSchema,
  ToolCallResult,
} from '../types';
import type { McpConnectionManager } from '../../mcp/connection-manager';
import type { McpResourceContent } from '../../mcp/types';
import {
  parseToolName,
  convertServerTools,
  buildResourceTool,
  adaptMcpResult,
} from '../../mcp/schema-adapter';

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

    const serverTools = convertServerTools(
      info.config.id,
      info.config.name,
      info.tools,
      info.config.enabledTools,
      info.config.disabledTools,
    );
    tools.push(...serverTools);

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

  const toolName = (input as Record<string, unknown>).__mcpToolName as string;
  if (!toolName) {
    return { success: false, error: 'Missing MCP tool name' };
  }

  const cleanInput = { ...input };
  delete cleanInput.__mcpToolName;

  try {
    const { serverId, toolName: originalName } = parseToolName(toolName);

    // Handle resource reads
    if (originalName === 'read_resource') {
      const uri = cleanInput.uri as string;
      if (!uri) return { success: false, error: 'Missing resource URI' };

      const contents = await connectionManager.readResource(serverId, uri);
      const text = (contents as McpResourceContent[]).map((c) => c.text ?? '').join('\n');
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
  tools: [],
};

/**
 * Build handlers map for all currently available MCP tools.
 * Each tool name maps to the same router — it parses the prefix to dispatch.
 */
export function getMcpHandlers(): Record<string, KitToolHandler> {
  const tools = getMcpTools();
  const handlers: Record<string, KitToolHandler> = {};

  for (const tool of tools) {
    handlers[tool.name] = async (input, context): Promise<ToolCallResult> => {
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
