import type { KitInstance, KitToolSchema, KitExecutionContext, ToolCallResult, UploadedFile } from './types';
import { streamMessageWithTools, type ChatMessage, type ToolCallEvent, type StreamWithToolsCallbacks } from '../claude';
import { executeKitTool as executeKitToolFromLoader } from './loader';
import { executeKitTool as executeKitToolFromBridge } from './bridge';
import { searchKits } from './registry-client';
import { notifyToolError } from './kit-notifications';
import { flightRecorder } from '../telemetry/flight-recorder';
import { contextCacheManager } from '../google/context-cache-manager';
import { hybridComputeRouter } from '../google/hybrid-compute';
import { hitlGate } from '../hitl/intercept-gate';
import { usePresenceStore } from '../../stores/presence';
import { useDeviceStore } from '../../stores/devices';

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

  /**
   * Extract the cacheable portion of the system prompt (kit schemas + instructions).
   * This is the payload that benefits from Google AI context caching.
   */
  getCacheablePayload(): string {
    const activeKits = this.kits.filter((kit) => {
      if (kit.status !== 'loaded') return false;
      const scope = kit.manifest.ventureScope;
      return scope === '*' || scope.includes(this.ventureId);
    });

    if (activeKits.length === 0) return '';

    let payload = '## Kit Schemas & Instructions\n\n';
    for (const kit of activeKits) {
      payload += `### ${kit.manifest.name} (v${kit.manifest.version})\n`;
      payload += `${kit.manifest.description}\n`;
      if (kit.manifest.instructions) payload += `${kit.manifest.instructions}\n`;
      payload += `Tools: ${JSON.stringify(kit.manifest.tools, null, 2)}\n\n`;
    }
    return payload;
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

    // Inject connected device context
    try {
      const deviceState = useDeviceStore.getState();
      const deviceList = Object.values(deviceState.devices);
      const connected = deviceList.filter((d) => d.status === 'connected');
      if (connected.length > 0) {
        prompt += '\n\n## Connected Devices\n\n';
        prompt += 'The user has the following physical devices and agent sessions connected:\n\n';
        for (const d of connected) {
          prompt += `- **${d.name}** (${d.class}) — capabilities: ${d.capabilities.join(', ')}\n`;
        }
        const activeProfile = deviceState.activeProfileId
          ? deviceState.profiles[deviceState.activeProfileId]
          : null;
        if (activeProfile) {
          prompt += `\nActive device profile: **${activeProfile.name}**`;
          if (activeProfile.ventureId) prompt += ` (venture: ${activeProfile.ventureId})`;
          prompt += '\n';
        }
        prompt += '\nYou can control these devices using the device-hub kit tools (list_devices, send_device_command, etc.). ';
        prompt += 'Proactively suggest device configurations when relevant to the user\'s workflow.\n';
      }
    } catch { /* device store not available */ }

    // Inject user presence context (if available)
    try {
      const presence = usePresenceStore.getState().ownPresence;
      if (presence) {
        prompt += '\n\n## Current User Context\n\n';
        prompt += `- **Status:** ${presence.status} (${presence.statusText})\n`;
        prompt += `- **Device:** ${presence.deviceType} (${presence.screenClass})\n`;
        prompt += `- **Location:** ${presence.city || 'Unknown'}, ${presence.timezone}\n`;
        prompt += `- **Role:** ${presence.role} (${presence.accessTier})\n`;
        prompt += `- **Venture:** ${presence.activeVenture}\n`;
        prompt += '\nAdapt your responses to the user\'s current state and device. ';
        prompt += 'On smaller screens, prefer concise card-based responses. ';
        prompt += 'If the user is in a meeting or on a call, keep responses brief.\n';
      }
    } catch { /* presence store not available */ }

    return prompt;
  }

  /**
   * Process a user message through the orchestrator.
   * Handles tool assembly, system prompt enrichment, and the tool-calling loop.
   * Optionally accepts uploaded files to inject as Gemini file parts.
   */
  async processMessage(
    messages: ChatMessage[],
    callbacks: OrchestratorCallbacks,
    maxToolRounds = 5,
    files?: UploadedFile[],
  ): Promise<OrchestratorResult> {
    const assemblyStart = Date.now();
    const tools = this.assembleTools();
    let systemPrompt = this.buildSystemPrompt();

    flightRecorder.addStep('tool_assembly', `Assembled ${tools.length} tools from ${this.kits.filter((k) => k.status === 'loaded').length} kits`, { toolCount: tools.length }, Date.now() - assemblyStart);

    if (tools.length === 0) {
      throw new Error('NO_TOOLS');
    }

    // Epic 7: Attempt context caching for large kit payloads
    const cacheablePayload = this.getCacheablePayload();
    const cacheName = await contextCacheManager.getOrCreateCache(cacheablePayload).catch(() => null);
    if (cacheName) {
      flightRecorder.addStep('cache_lookup', `Using cached context: ${cacheName}`);
    }

    // If files are attached, add context about them to the system prompt
    if (files && files.length > 0) {
      systemPrompt += '\n\n## Attached Files\n\n';
      systemPrompt += 'The user has attached the following files to this conversation. You can reference their contents in your responses.\n\n';
      for (const f of files) {
        systemPrompt += `- **${f.localName}** (${f.mimeType}, ${(f.sizeBytes / 1024).toFixed(0)}KB)\n`;
      }
    }

    const toolExecutor = async (toolCall: ToolCallEvent): Promise<ToolCallResult> => {
      // Check if it's a meta-tool
      const metaResult = await this.handleMetaTool(toolCall);
      if (metaResult) return metaResult;

      // Epic 8: Check if this should be routed to Gemini cloud
      const cloudAction = hybridComputeRouter.shouldUseCloud(toolCall);
      if (cloudAction) {
        return hybridComputeRouter.executeCloud(toolCall, cloudAction);
      }

      // Find the kit that owns this tool
      const kit = this.kits.find(
        (k) => k.status === 'loaded' && k.manifest.tools.some((t) => t.name === toolCall.name),
      );

      if (!kit) {
        return { success: false, error: `No kit found for tool "${toolCall.name}"` };
      }

      // Epic 10: HITL gate — check if operator approval is required
      if (hitlGate.shouldIntercept(kit)) {
        const approval = await hitlGate.requestApproval(kit, toolCall);
        if (!approval.approved) {
          return { success: false, error: approval.error };
        }
        // Use potentially modified input
        toolCall = { ...toolCall, input: approval.input };
      }

      // Telemetry: tool dispatch
      flightRecorder.recordToolDispatch(kit.manifest.id, toolCall.name);
      flightRecorder.addStep('tool_dispatch', `Dispatching ${kit.manifest.id}/${toolCall.name}`, { input: toolCall.input });

      const execStart = Date.now();

      // Route through bridge for non-inline kits, loader for inline
      let result: ToolCallResult;
      if (kit.manifest.runtime === 'inline') {
        result = await executeKitToolFromLoader(this.kits, toolCall.name, toolCall.input, this.context);
      } else {
        result = await executeKitToolFromBridge(kit, toolCall.name, toolCall.input, this.context);
      }

      const execDuration = Date.now() - execStart;

      // Telemetry: tool result
      flightRecorder.recordToolResult(kit.manifest.id, toolCall.name, result.success, execDuration);
      flightRecorder.addStep('tool_result', `${toolCall.name} → ${result.success ? 'success' : 'error'}`, { success: result.success }, execDuration);

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

    const apiStart = Date.now();
    flightRecorder.addStep('api_call', 'Starting Claude streaming with tools');

    const result = await streamMessageWithTools(
      messages,
      systemPrompt,
      tools,
      toolExecutor,
      streamCallbacks,
      maxToolRounds,
    );

    flightRecorder.addStep('api_call', `Streaming complete — ${result.toolCalls.length} tool calls`, { toolCallCount: result.toolCalls.length }, Date.now() - apiStart);

    // Clear files after successful send
    if (files && files.length > 0) {
      // Files remain in store for re-use; user can manually clear
    }

    return result;
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
