import type {
  KitInstance,
  KitToolSchema,
  KitExecutionContext,
  ToolCallResult,
  UploadedFile,
} from './types';
import { executeKitTool as executeKitToolFromLoader } from './loader';
import { executeKitTool as executeKitToolFromBridge } from './bridge';

// ---------------------------------------------------------------------------
// Agent Orchestrator
// ---------------------------------------------------------------------------
// Sits between user intent and the LLM, dynamically assembling tools from
// loaded kits and managing the tool-calling conversation loop.
//
// The orchestrator is portable — every app concern (LLM streaming,
// telemetry, context caching, hybrid compute routing, HITL gating, kit
// registry search, error notifications, system-prompt enrichment) is
// supplied via the OrchestratorAdapters bag. Only `streamer` is required;
// everything else has a no-op default.

// ─── Chat surface (was in app's claude.ts) ─────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

export interface ToolCallEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface StreamWithToolsCallbacks {
  onText: (fullText: string) => void;
  onToolCall: (toolCall: ToolCallEvent) => void;
  onToolResult: (toolCallId: string, result: ToolCallResult) => void;
}

// ─── Adapter contracts (all optional except streamer) ─────────────────────

/** Streams a message to the LLM with tool-calling. Returns final result. */
export interface ChatStreamer {
  stream(
    messages: ChatMessage[],
    systemPrompt: string,
    tools: KitToolSchema[],
    toolExecutor: (toolCall: ToolCallEvent) => Promise<ToolCallResult>,
    callbacks: StreamWithToolsCallbacks,
    maxToolRounds: number,
    model?: string,
  ): Promise<{ text: string; toolCalls: ToolCallEvent[] }>;
}

/** Record telemetry events; all methods optional. No-op default. */
export interface TelemetryRecorder {
  addStep(type: string, description: string, data?: unknown, durationMs?: number): void;
  recordToolDispatch(kitId: string, toolName: string): void;
  recordToolResult(kitId: string, toolName: string, success: boolean, durationMs: number): void;
}

/** Look up or create a Gemini context cache. Return cache name or null. */
export interface ContextCacheManager {
  getOrCreateCache(payload: string): Promise<string | null>;
}

/** Decide whether a tool call should be routed to a cloud/heavy compute path. */
export interface HybridComputeRouter {
  shouldUseCloud(toolCall: ToolCallEvent): unknown | null;
  executeCloud(toolCall: ToolCallEvent, action: unknown): Promise<ToolCallResult>;
}

/** Gate kit execution behind a human approval flow. */
export interface HITLGate {
  shouldIntercept(kit: KitInstance): boolean;
  requestApproval(
    kit: KitInstance,
    toolCall: ToolCallEvent,
  ): Promise<{
    approved: boolean;
    input?: Record<string, unknown>;
    error?: string;
  }>;
}

/** Search the kit registry for the `search_kits` meta-tool. */
export interface RegistrySearcher {
  searchKits(query: string): Promise<
    Array<{
      kit_id: string;
      name: string;
      version: string;
      description: string;
      downloads?: number;
    }>
  >;
}

export interface OrchestratorAdapters {
  /** Required — the LLM streaming client. */
  streamer: ChatStreamer;
  telemetry?: TelemetryRecorder;
  cache?: ContextCacheManager;
  hybrid?: HybridComputeRouter;
  hitl?: HITLGate;
  registry?: RegistrySearcher;
  /** Called once per failed tool call; useful for surfacing errors in UI. */
  onToolError?: (
    kitName: string,
    toolName: string,
    error: string,
    ventureId: string,
  ) => void;
  /** Append app-specific content (device state, presence, etc.) to the
   *  system prompt before sending. Receives the current prompt, returns
   *  the augmented prompt. */
  systemPromptEnricher?: (currentPrompt: string) => string;
}

export interface OrchestratorCallbacks {
  onText: (fullText: string) => void;
  onToolCall: (toolCall: ToolCallEvent) => void;
  onToolResult: (toolCallId: string, result: ToolCallResult) => void;
}

export interface OrchestratorResult {
  text: string;
  toolCalls: ToolCallEvent[];
}

// ─── No-op defaults ───────────────────────────────────────────────────────

const NOOP_TELEMETRY: TelemetryRecorder = {
  addStep: () => undefined,
  recordToolDispatch: () => undefined,
  recordToolResult: () => undefined,
};

const NOOP_CACHE: ContextCacheManager = {
  getOrCreateCache: async () => null,
};

const NOOP_HYBRID: HybridComputeRouter = {
  shouldUseCloud: () => null,
  executeCloud: async () => ({ success: false, error: 'No hybrid compute router configured' }),
};

const NOOP_HITL: HITLGate = {
  shouldIntercept: () => false,
  requestApproval: async () => ({ approved: true }),
};

// ─── Orchestrator class ───────────────────────────────────────────────────

export class AgentOrchestrator {
  private kits: KitInstance[];
  private ventureId: string;
  private baseSystemPrompt: string;
  private context: KitExecutionContext;
  private model?: string;
  private adapters: OrchestratorAdapters;

  constructor(config: {
    kits: KitInstance[];
    ventureId: string;
    systemPrompt: string;
    context: KitExecutionContext;
    adapters: OrchestratorAdapters;
    model?: string;
  }) {
    this.kits = config.kits;
    this.ventureId = config.ventureId;
    this.baseSystemPrompt = config.systemPrompt;
    this.context = config.context;
    this.model = config.model;
    this.adapters = config.adapters;
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

  /** Cacheable portion of the system prompt (kit schemas + instructions).
   *  Stable across turns — benefits from LLM provider context caching. */
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

  /** Build the full system prompt with kit instructions + adapter-supplied
   *  enrichment (device state, presence, etc.) appended. */
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

    // App-specific enrichment (device state, presence, etc.) — opaque to SDK.
    if (this.adapters.systemPromptEnricher) {
      try {
        prompt = this.adapters.systemPromptEnricher(prompt);
      } catch {
        // Enricher failure must not break orchestration.
      }
    }

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
    const telemetry = this.adapters.telemetry ?? NOOP_TELEMETRY;
    const cache = this.adapters.cache ?? NOOP_CACHE;
    const hybrid = this.adapters.hybrid ?? NOOP_HYBRID;
    const hitl = this.adapters.hitl ?? NOOP_HITL;

    const assemblyStart = Date.now();
    const tools = this.assembleTools();
    let systemPrompt = this.buildSystemPrompt();

    telemetry.addStep(
      'tool_assembly',
      `Assembled ${tools.length} tools from ${this.kits.filter((k) => k.status === 'loaded').length} kits`,
      { toolCount: tools.length },
      Date.now() - assemblyStart,
    );

    if (tools.length === 0) {
      throw new Error('NO_TOOLS');
    }

    // Attempt context caching for large kit payloads (Gemini)
    const cacheablePayload = this.getCacheablePayload();
    const cacheName = await cache.getOrCreateCache(cacheablePayload).catch(() => null);
    if (cacheName) {
      telemetry.addStep('cache_lookup', `Using cached context: ${cacheName}`);
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

      // Hybrid compute router — route to cloud if applicable
      const cloudAction = hybrid.shouldUseCloud(toolCall);
      if (cloudAction) {
        return hybrid.executeCloud(toolCall, cloudAction);
      }

      // Find the kit that owns this tool
      const kit = this.kits.find(
        (k) => k.status === 'loaded' && k.manifest.tools.some((t) => t.name === toolCall.name),
      );

      if (!kit) {
        return { success: false, error: `No kit found for tool "${toolCall.name}"` };
      }

      // HITL gate — check if operator approval is required
      if (hitl.shouldIntercept(kit)) {
        const approval = await hitl.requestApproval(kit, toolCall);
        if (!approval.approved) {
          return { success: false, error: approval.error };
        }
        if (approval.input) {
          toolCall = { ...toolCall, input: approval.input };
        }
      }

      telemetry.recordToolDispatch(kit.manifest.id, toolCall.name);
      telemetry.addStep('tool_dispatch', `Dispatching ${kit.manifest.id}/${toolCall.name}`, { input: toolCall.input });

      const execStart = Date.now();

      // Route through bridge for non-inline kits, loader for inline
      let result: ToolCallResult;
      if (kit.manifest.runtime === 'inline') {
        result = await executeKitToolFromLoader(this.kits, toolCall.name, toolCall.input, this.context);
      } else {
        result = await executeKitToolFromBridge(kit, toolCall.name, toolCall.input, this.context);
      }

      const execDuration = Date.now() - execStart;

      telemetry.recordToolResult(kit.manifest.id, toolCall.name, result.success, execDuration);
      telemetry.addStep('tool_result', `${toolCall.name} → ${result.success ? 'success' : 'error'}`, { success: result.success }, execDuration);

      // Notify on errors so they appear in the notification center
      if (!result.success && this.adapters.onToolError) {
        try {
          this.adapters.onToolError(kit.manifest.name, toolCall.name, result.error || 'Unknown error', this.ventureId);
        } catch {
          // Notifier failure must not break orchestration.
        }
      }

      return result;
    };

    const streamCallbacks: StreamWithToolsCallbacks = {
      onText: callbacks.onText,
      onToolCall: callbacks.onToolCall,
      onToolResult: callbacks.onToolResult,
    };

    const apiStart = Date.now();
    telemetry.addStep('api_call', 'Starting LLM streaming with tools');

    const result = await this.adapters.streamer.stream(
      messages,
      systemPrompt,
      tools,
      toolExecutor,
      streamCallbacks,
      maxToolRounds,
      this.model,
    );

    telemetry.addStep('api_call', `Streaming complete — ${result.toolCalls.length} tool calls`, { toolCallCount: result.toolCalls.length }, Date.now() - apiStart);

    return result;
  }

  // -------------------------------------------------------------------------
  // Meta-Tools — hardcoded tools for kit management
  // -------------------------------------------------------------------------

  private getMetaTools(): KitToolSchema[] {
    const metaTools: KitToolSchema[] = [
      {
        name: 'list_loaded_kits',
        description: 'List all currently loaded kits and their available tools. Use when the user asks what capabilities are available.',
        input_schema: { type: 'object', properties: {}, required: [] },
      },
    ];

    // search_kits is only available when a registry adapter is wired
    if (this.adapters.registry) {
      metaTools.push({
        name: 'search_kits',
        description: 'Search the kit registry for available kits that can be installed. Use when the user needs a capability that no loaded kit provides.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query describing the needed capability' },
          },
          required: ['query'],
        },
      });
    }

    return metaTools;
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

    if (toolCall.name === 'search_kits' && this.adapters.registry) {
      const query = (toolCall.input.query as string) || '';
      try {
        const results = await this.adapters.registry.searchKits(query);
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
