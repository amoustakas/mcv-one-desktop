import type { ToolCallResult } from '../kits/types';
import { flightRecorder } from '../telemetry/flight-recorder';

// ---------------------------------------------------------------------------
// HybridComputeRouter — decides when to use Gemini cloud capabilities
// (code execution, search grounding) instead of local kit execution.
// ---------------------------------------------------------------------------

/** Tool call descriptor (minimal shape from orchestrator) */
interface ToolCallInfo {
  name: string;
  input: Record<string, unknown>;
}

/** Patterns that suggest code execution would be more appropriate */
const CODE_EXECUTION_PATTERNS = [
  'gemini_code_execute',
  'calculate', 'compute', 'analyze_data', 'run_python',
];

/** Patterns that suggest search grounding would be more appropriate */
const SEARCH_PATTERNS = [
  'gemini_search',
  'web_search', 'google_search', 'search_web',
];

export class HybridComputeRouter {
  /**
   * Check if a tool call should be routed to Gemini cloud instead of local kits.
   * Returns the action type if cloud routing applies, null otherwise.
   */
  shouldUseCloud(toolCall: ToolCallInfo): 'code_execution' | 'search' | null {
    const name = toolCall.name.toLowerCase();

    if (CODE_EXECUTION_PATTERNS.some((p) => name.includes(p))) {
      return 'code_execution';
    }

    if (SEARCH_PATTERNS.some((p) => name.includes(p))) {
      return 'search';
    }

    return null;
  }

  /**
   * Execute a tool call via Gemini cloud capabilities.
   */
  async executeCloud(
    toolCall: ToolCallInfo,
    cloudAction: 'code_execution' | 'search',
  ): Promise<ToolCallResult> {
    const startTime = Date.now();
    flightRecorder.addStep('tool_dispatch', `Cloud ${cloudAction}: ${toolCall.name}`, { input: toolCall.input });

    try {
      const prompt = this.buildPromptFromInput(toolCall);
      const action = cloudAction === 'code_execution'
        ? 'generate-with-code-execution'
        : 'generate-with-search';

      const res = await fetch('/api/google-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Cloud ${cloudAction} failed`);
      }

      const data = await res.json();
      const duration = Date.now() - startTime;

      // Record telemetry
      if (data.usageMetadata) {
        flightRecorder.recordApiCall(
          'gemini-1.5-pro',
          data.usageMetadata,
          duration,
          { cloudAction, toolName: toolCall.name },
        );
      }

      flightRecorder.recordToolResult('gemini-cloud', toolCall.name, true, duration);

      let markdown = data.content || '';

      // Append code execution details if available
      if (data.codeResults?.length > 0) {
        markdown += '\n\n**Code Execution Results:**\n';
        for (const cr of data.codeResults) {
          if (cr.code) markdown += `\`\`\`${cr.language || 'python'}\n${cr.code}\n\`\`\`\n`;
          if (cr.output) markdown += `**Output:** ${cr.output}\n`;
          if (cr.outcome) markdown += `**Outcome:** ${cr.outcome}\n`;
        }
      }

      // Append grounding info if available
      if (data.groundingMetadata) {
        markdown += '\n\n*Grounded with Google Search*';
      }

      return {
        success: true,
        data,
        displayMarkdown: markdown,
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      flightRecorder.recordToolResult('gemini-cloud', toolCall.name, false, duration);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Cloud execution failed',
      };
    }
  }

  /**
   * Build a natural language prompt from tool call input.
   */
  private buildPromptFromInput(toolCall: ToolCallInfo): string {
    const { input } = toolCall;

    // If there's a direct prompt/query field, use it
    if (typeof input.prompt === 'string') return input.prompt;
    if (typeof input.query === 'string') return input.query;
    if (typeof input.question === 'string') return input.question;
    if (typeof input.code === 'string') return `Execute the following code and return the result:\n\n${input.code}`;

    // Fallback: describe the tool call
    return `Execute the following operation: ${toolCall.name}\nParameters: ${JSON.stringify(input, null, 2)}`;
  }
}

/** Singleton instance */
export const hybridComputeRouter = new HybridComputeRouter();
