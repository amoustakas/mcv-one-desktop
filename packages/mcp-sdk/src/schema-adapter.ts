// Structurally-identical to @mcv/kits-sdk's `KitToolSchema` and `ToolCallResult`;
// declared locally to keep mcp-sdk a zero-external-SDK-dep leaf. TS structural
// typing makes the two interchangeable at any call site.
interface KitToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  displayMarkdown?: string;
}

import type { McpTool, McpToolCallResult } from './types';

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
