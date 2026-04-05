import type { TuningTrace } from '../kits/types';

// ---------------------------------------------------------------------------
// Tuning Collector — formats approved HITL traces as .jsonl for fine-tuning
// ---------------------------------------------------------------------------

/**
 * Format a single trace into an OpenAI-compatible training example.
 */
export function formatTraceForTuning(trace: TuningTrace): Record<string, unknown> {
  return {
    messages: [
      ...trace.messages.map((m) => ({ role: m.role, content: m.content })),
      {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: `call_${trace.id}`,
          type: 'function',
          function: {
            name: trace.toolCall.name,
            arguments: JSON.stringify(trace.toolCall.input),
          },
        }],
      },
      {
        role: 'tool',
        tool_call_id: `call_${trace.id}`,
        content: trace.toolResult.displayMarkdown || JSON.stringify(trace.toolResult.data),
      },
    ],
  };
}

/**
 * Export multiple traces as a JSONL string.
 */
export function exportTracesAsJsonl(traces: TuningTrace[]): string {
  return traces
    .map(formatTraceForTuning)
    .map((obj) => JSON.stringify(obj))
    .join('\n');
}

/**
 * Create a downloadable Blob from traces.
 */
export function createTraceBlob(traces: TuningTrace[]): Blob {
  const jsonl = exportTracesAsJsonl(traces);
  return new Blob([jsonl], { type: 'application/jsonl' });
}
