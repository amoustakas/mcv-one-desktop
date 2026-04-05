import type { KitInstance, KitToolSchema, KitExecutionContext, ToolCallResult } from './types';
import { streamMessageWithTools, type ChatMessage, type ToolCallEvent, type StreamWithToolsCallbacks } from '../claude';
import { executeKitTool as executeKitToolFromLoader } from './loader';
import { executeKitTool as executeKitToolFromBridge } from './bridge';
import { searchKits } from './registry-client';
import { notifyToolError } from './kit-notifications';

// ---------------------------------------------------------------------------
// Agent Orchestrator
// ---------------------------------------------------------------------------
// Sits between user intent and Claude, dynamically assembling tools from
// loaded kits and managing the tool-calling conversation loop.

export interface OrchestratorCallbacks {
  onText: (fullText: string) => void;
  onToolCall: (toolCall: ToolCallEvent) => void;
  onToolResult: (toolCallId: string, result: ToolCallResult) => void;
}

export interface OrchestratorResult {
  text: string;
  toolCalls: ToolCallEvent[];
}

export class AgentOrchestrator {
  private kits: KitInstance[];
  private ventureId: string;
  private baseSystemPrompt: string;
  private context: KitExecutionContext;

  constructor(config: {
    kits: KitInstance[];
    ventureId: string;
    systemPrompt: string;
    context: KitExecutionContext;
  }) {
    this.kits = config.kits;
    this.ventureId = config.ventureId;
    this.baseSystemPrompt = config.systemPrompt;
    this.context = config.context;
  }

  /** Assemble all tool schemas from kits scoped to the current venture */
  assembleTools(): KitToolSchema[] {
    const tools: KitToolSchema[] = [];

    for (const kit of this.kits) {
      if (kit.status !== 'loaded') continue;
      const scope = kit.manifest.ventureScope;
      if (scope !== '*' && !scope.includes(this.ventureId)) continue;
      tools.push(...kit.manifest.tools);
    }

    // Add meta-tools (always available)
    tools.push(...this.getMetaTools());

    return tools;
  }

  /** Build the full system prompt with kit instructions appended */
  buildSystemPrompt(): string {
    let prompt = this.baseSystemPrompt;

    const activeKits = this.kits.filter((kit) => {
      if (kit.status !== 'loaded') return false;
      const scope = kit.manifest.ventureScope;
      return scope === '*' || scope.includes(this.ventureId);
    });

    if (activeKits.length > 0) {
      prompt += '\n\n## Available Tool Kits\n\n';
      prompt += 'You have the following tool kits loaded. Use them proactively to fulfill user requests:\n\n';

      for (const kit of activeKits) {
        prompt += `**${kit.manifest.name}** (v${kit.manifest.version}): ${kit.manifest.description}\n`;
        if (kit.manifest.instructions) {
          prompt += `  ${kit.manifest.instructions}\n`;
        }
        prompt += `  Tools: ${kit.manifest.tools.map((t) => t.name).join(', ')}\n\n`;
      }

      prompt += 'When a user request can be fulfilled by a tool, use the tool rather than giving a generic response. ';
      prompt += 'You can chain multiple tool calls to complete complex requests.\n';
    }

    return prompt;
  }

  /**
   * Process a user message through the orchestrator.
   * Handles tool assembly, system prompt enrichment, and the tool-calling loop.
   */
  async processMessage(
    messages: ChatMessage[],
    callbacks: OrchestratorCallbacks,
    maxToolRounds = 5,
  ): Promise<OrchestratorResult> {
    const tools = this.assembleTools();
    const systemPrompt = this.buildSystemPrompt();

    if (tools.length === 0) {
      // No tools available — signal caller to fall back to plain streaming
      throw new Error('NO_TOOLS');
    }

    const toolExecutor = async (toolCall: ToolCallEvent): Promise<ToolCallResult> => {
      // Check if it's a meta-tool
      const metaResult = await this.handleMetaTool(toolCall);
      if (metaResult) return metaResult;

      // Find the kit that owns this tool
      const kit = this.kits.find(
        (k) => k.status === 'loaded' && k.manifest.tools.some((t) => t.name === toolCall.name),
      );

      if (!kit) {
        return { success: false, error: `No kit found for tool "${toolCall.name}"` };
      }

      // Route through bridge for non-inline kits, loader for inline
      let result: ToolCallResult;
      if (kit.manifest.runtime === 'inline') {
        result = await executeKitToolFromLoader(this.kits, toolCall.name, toolCall.input, this.context);
      } else {
        result = await executeKitToolFromBridge(kit, toolCall.name, toolCall.input, this.context);
      }

      // Notify on errors so they appear in the notification center
      if (!result.success) {
        notifyToolError(kit.manifest.name, toolCall.name, result.error || 'Unknown error', this.ventureId);
      }

      return result;
    };

    const streamCallbacks: StreamWithToolsCallbacks = {
      onText: callbacks.onText,
      onToolCall: callbacks.onToolCall,
      onToolResult: callbacks.onToolResult,
    };

    return streamMessageWithTools(
      messages,
      systemPrompt,
      tools,
      toolExecutor,
      streamCallbacks,
      maxToolRounds,
    );
  }

  // -------------------------------------------------------------------------
  // Meta-Tools — hardcoded tools for kit management
  // -------------------------------------------------------------------------

  private getMetaTools(): KitToolSchema[] {
    return [
      {
        name: 'list_loaded_kits',
        description: 'List all currently loaded kits and their available tools. Use when the user asks what capabilities are available.',
        input_schema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'search_kits',
        description: 'Search the kit registry for available kits that can be installed. Use when the user needs a capability that no loaded kit provides.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query describing the needed capability' },
          },
          required: ['query'],
        },
      },
    ];
  }

  private async handleMetaTool(toolCall: ToolCallEvent): Promise<ToolCallResult | null> {
    if (toolCall.name === 'list_loaded_kits') {
      const activeKits = this.kits.filter((k) => k.status === 'loaded');
      const lines = activeKits.map((kit) => {
        const tools = kit.manifest.tools.map((t) => t.name).join(', ');
        return `- **${kit.manifest.name}** (${kit.manifest.id} v${kit.manifest.version}): ${tools}`;
      });

      return {
        success: true,
        data: activeKits.map((k) => ({
          id: k.manifest.id,
          name: k.manifest.name,
          tools: k.manifest.tools.map((t) => t.name),
        })),
        displayMarkdown: `## Loaded Kits\n\n${lines.join('\n')}\n\n*${activeKits.length} kits loaded with ${activeKits.reduce((sum, k) => sum + k.manifest.tools.length, 0)} total tools.*`,
      };
    }

    if (toolCall.name === 'search_kits') {
      const query = (toolCall.input.query as string) || '';
      try {
        const results = await searchKits(query);
        if (results.length === 0) {
          return {
            success: true,
            data: [],
            displayMarkdown: `No kits found for "${query}". The registry may not have matching kits yet.`,
          };
        }
        const lines = results.map(
          (k) => `- **${k.name}** (\`${k.kit_id}\` v${k.version}) — ${k.description}${k.downloads ? ` · ${k.downloads} downloads` : ''}`,
        );
        return {
          success: true,
          data: results,
          displayMarkdown: `## Registry Results: "${query}"\n\n${lines.join('\n')}\n\n*Open the Kit Store to install these kits.*`,
        };
      } catch {
        return {
          success: true,
          data: [],
          displayMarkdown: `Could not search the registry. The kit registry tables may not be set up yet.`,
        };
      }
    }

    // Not a meta-tool
    return null;
  }
}
