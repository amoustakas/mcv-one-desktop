import type { KitInstance, KitToolSchema, KitExecutionContext, ToolCallResult, ReasoningStep } from '../kits/types';
import { getToolsForVenture, executeKitTool } from '../kits/loader';

// ---------------------------------------------------------------------------
// NAOS Autonomous Agent Framework
// ---------------------------------------------------------------------------
// Connects Gemini's function calling to ALL loaded kit tools.
// The agent receives a user request, Gemini decides which tools to call
// (and in what order), the framework executes them, feeds results back,
// and Gemini continues until the task is complete.
//
// This is what makes NAOS an AI Operating System rather than a chatbot:
// "Prepare the investor pitch" → Gemini autonomously calls:
//   gmail_search → drive_search → gcal_create_event → gmail_send
// All in one turn, decided by the AI.
// ---------------------------------------------------------------------------

/** Maximum tool-calling rounds before forcing completion */
const MAX_ROUNDS = 10;

/** Agent execution result */
export interface AgentResult {
  response: string;
  toolsUsed: Array<{ name: string; input: Record<string, unknown>; result: ToolCallResult }>;
  reasoningSteps: ReasoningStep[];
  rounds: number;
  totalDurationMs: number;
}

/** Agent options */
export interface AgentOptions {
  /** System instruction for the agent */
  systemPrompt?: string;
  /** Maximum tool-calling rounds (default: 10) */
  maxRounds?: number;
  /** Temperature (0-2, default: 0.7) */
  temperature?: number;
  /** Model to use (default: gemini-2.5-flash) */
  model?: string;
  /** Callback for each reasoning step (for real-time UI updates) */
  onStep?: (step: ReasoningStep) => void;
  /** Callback for streaming text chunks */
  onTextChunk?: (chunk: string) => void;
}

/**
 * Convert kit tool schemas to Gemini function declarations.
 * Kit schemas use Anthropic format; Gemini uses a slightly different structure.
 */
function kitToolsToGeminiFunctions(tools: KitToolSchema[]): Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}> {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.input_schema.properties,
      required: tool.input_schema.required || [],
    },
  }));
}

/**
 * Build a system prompt that describes the agent's capabilities.
 */
function buildAgentSystemPrompt(tools: KitToolSchema[], customPrompt?: string): string {
  const toolList = tools.map(t => `- **${t.name}**: ${t.description}`).join('\n');

  return `You are NAOS, the Neural Agentic Operating System for MCV One Desktop.

You are an autonomous agent that can execute multi-step workflows by calling tools.
When given a task, analyze what needs to be done, then call the appropriate tools in sequence.
You can call multiple tools in a single response, and you can call tools multiple times across rounds.

IMPORTANT GUIDELINES:
- Break complex tasks into steps and execute them sequentially
- Use tool results to inform your next actions
- If a tool fails, try an alternative approach or inform the user
- Summarize what you did and what you found at the end
- Be concise but thorough

${customPrompt ? `\nSPECIAL INSTRUCTIONS:\n${customPrompt}\n` : ''}
AVAILABLE TOOLS:
${toolList}`;
}

/**
 * Execute an autonomous agent session.
 * Sends the user's request to Gemini with function calling enabled,
 * executes tool calls, feeds results back, and loops until complete.
 */
export async function runAutonomousAgent(
  userMessage: string,
  kits: KitInstance[],
  context: KitExecutionContext,
  options: AgentOptions = {},
): Promise<AgentResult> {
  const startTime = Date.now();
  const maxRounds = options.maxRounds ?? MAX_ROUNDS;
  const model = options.model ?? 'gemini-2.5-flash';
  const temperature = options.temperature ?? 0.7;

  // Get all available tools for this venture
  const tools = getToolsForVenture(kits, context.ventureId);
  const geminiFunctions = kitToolsToGeminiFunctions(tools);
  const systemPrompt = buildAgentSystemPrompt(tools, options.systemPrompt);

  const toolsUsed: AgentResult['toolsUsed'] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let round = 0;

  // Build conversation history (Gemini format)
  const history: Array<{ role: string; parts: unknown[] }> = [];

  // Add user message
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  const emitStep = (step: ReasoningStep) => {
    reasoningSteps.push(step);
    options.onStep?.(step);
  };

  emitStep({
    id: `step-init`,
    timestamp: Date.now(),
    type: 'tool_assembly',
    description: `Agent initialized with ${tools.length} tools across ${kits.filter(k => k.status === 'loaded').length} kits`,
  });

  while (round < maxRounds) {
    round++;

    emitStep({
      id: `step-round-${round}`,
      timestamp: Date.now(),
      type: 'api_call',
      description: `Round ${round}: Calling Gemini ${model}`,
    });

    // Call Gemini with function calling
    const response = await fetch('/api/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'agent-execute',
        model,
        temperature,
        systemInstruction: systemPrompt,
        history,
        tools: [{ functionDeclarations: geminiFunctions }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Agent API error: ${response.status}`);
    }

    const data = await response.json();
    const candidates = data.candidates ?? [];
    const candidate = candidates[0];

    if (!candidate?.content?.parts) {
      break; // No response — done
    }

    const parts = candidate.content.parts;

    // Check for function calls
    const functionCalls = parts.filter((p: Record<string, unknown>) => p.functionCall);
    const textParts = parts.filter((p: Record<string, unknown>) => p.text);

    // If there's text, emit it
    if (textParts.length > 0) {
      const text = textParts.map((p: { text: string }) => p.text).join('');
      if (text.trim()) {
        options.onTextChunk?.(text);
      }
    }

    // Add assistant response to history
    history.push({ role: 'model', parts });

    // If no function calls, we're done
    if (functionCalls.length === 0) {
      break;
    }

    // Execute all function calls
    const functionResponses: Array<{ functionResponse: { name: string; response: unknown } }> = [];

    for (const part of functionCalls) {
      const fc = part.functionCall as { name: string; args: Record<string, unknown> };

      emitStep({
        id: `step-tool-${round}-${fc.name}`,
        timestamp: Date.now(),
        type: 'tool_dispatch',
        description: `Executing: ${fc.name}`,
        data: fc.args,
      });

      const toolStart = Date.now();
      const result = await executeKitTool(kits, fc.name, fc.args || {}, context);
      const toolDuration = Date.now() - toolStart;

      toolsUsed.push({ name: fc.name, input: fc.args || {}, result });

      emitStep({
        id: `step-result-${round}-${fc.name}`,
        timestamp: Date.now(),
        type: 'tool_result',
        description: `${fc.name} → ${result.success ? 'success' : 'error'}`,
        durationMs: toolDuration,
        data: result.success ? { preview: (result.displayMarkdown || '').slice(0, 200) } : { error: result.error },
      });

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: {
            success: result.success,
            data: result.data,
            markdown: result.displayMarkdown,
            error: result.error,
          },
        },
      });
    }

    // Add function responses to history
    history.push({ role: 'user', parts: functionResponses });
  }

  // Extract final text response
  const lastModelMessage = history.filter(h => h.role === 'model').pop();
  const finalText = (lastModelMessage?.parts as Array<{ text?: string }> | undefined)
    ?.filter((p) => Boolean(p.text))
    .map((p) => p.text || '')
    .join('') || 'Agent completed without a text response.';

  return {
    response: finalText,
    toolsUsed,
    reasoningSteps,
    rounds: round,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Pre-built agent profiles for common workflows.
 */
export const AGENT_PROFILES = {
  'chief-of-staff': {
    systemPrompt: `You are the user's Chief of Staff. Your job is to proactively manage their day. When asked to prepare, brief, or manage, gather information from all available tools (email, calendar, tasks, drive) and synthesize a comprehensive brief. Always check for urgent items first.`,
    model: 'gemini-2.5-flash',
    temperature: 0.5,
  },
  'research-analyst': {
    systemPrompt: `You are a research analyst. When given a topic, use Google Search grounding, document analysis, and structured output to produce thorough, well-sourced research briefs. Always cite your sources and quantify claims where possible.`,
    model: 'gemini-2.5-pro',
    temperature: 0.3,
  },
  'communications-manager': {
    systemPrompt: `You are a communications manager. When asked to handle communications, check emails, draft responses, schedule meetings, and create follow-up tasks. Maintain a professional, concise tone. Always confirm before sending emails.`,
    model: 'gemini-2.5-flash',
    temperature: 0.6,
  },
  'growth-strategist': {
    systemPrompt: `You are a growth strategist. Analyze Google Analytics data, Google Ads performance, and Search Console metrics to provide actionable growth insights. Recommend budget optimizations, content strategies, and campaign adjustments.`,
    model: 'gemini-2.5-pro',
    temperature: 0.4,
  },
  'venture-operator': {
    systemPrompt: `You are a venture operator. When managing a specific venture, filter all data by venture context. Check venture-specific emails, events, docs, analytics, and tasks. Provide a complete operational picture of the venture's status.`,
    model: 'gemini-2.5-flash',
    temperature: 0.5,
  },
} as const;

export type AgentProfile = keyof typeof AGENT_PROFILES;
