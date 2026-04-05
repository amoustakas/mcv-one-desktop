import type { TelemetryEvent, GeminiUsageMetadata, ReasoningStep, ReasoningStepType } from '../kits/types';
import { useTelemetry } from '../../stores/telemetry';

// ---------------------------------------------------------------------------
// FlightRecorder — singleton that instruments orchestrator operations
// and emits telemetry events to the telemetry store.
// ---------------------------------------------------------------------------

// Approximate pricing per 1K tokens (USD) — Gemini 1.5 Pro
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function estimateCost(model: string, usage: GeminiUsageMetadata): number {
  const pricing = PRICING[model] ?? PRICING['gemini-1.5-pro'];
  const inputCost = (usage.promptTokenCount / 1000) * pricing.input;
  const outputCost = (usage.candidatesTokenCount / 1000) * pricing.output;
  // Cached tokens are free (context caching benefit)
  return inputCost + outputCost;
}

class FlightRecorderSingleton {
  /**
   * Record a telemetry event from an API call.
   */
  recordApiCall(
    model: string,
    usage: GeminiUsageMetadata | undefined,
    durationMs: number,
    metadata?: Record<string, unknown>,
  ): void {
    const cost = usage ? estimateCost(model, usage) : 0;
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type: 'api_call',
      model,
      usage,
      durationMs,
      costEstimate: cost,
      metadata,
    });
  }

  /**
   * Record a tool dispatch event.
   */
  recordToolDispatch(kitId: string, toolName: string): void {
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type: 'tool_dispatch',
      kitId,
      toolName,
    });
  }

  /**
   * Record a tool result event.
   */
  recordToolResult(
    kitId: string,
    toolName: string,
    success: boolean,
    durationMs: number,
  ): void {
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type: 'tool_result',
      kitId,
      toolName,
      success,
      durationMs,
    });
  }

  /**
   * Record a cache hit or miss.
   */
  recordCacheEvent(hit: boolean, metadata?: Record<string, unknown>): void {
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type: hit ? 'cache_hit' : 'cache_miss',
      metadata,
    });
  }

  /**
   * Record a file upload event.
   */
  recordFileUpload(fileName: string, mimeType: string, sizeBytes: number): void {
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type: 'file_upload',
      metadata: { fileName, mimeType, sizeBytes },
    });
  }

  /**
   * Record a HITL request/response event.
   */
  recordHITL(type: 'hitl_request' | 'hitl_response', metadata: Record<string, unknown>): void {
    this.emit({
      id: generateId(),
      timestamp: Date.now(),
      type,
      metadata,
    });
  }

  /**
   * Add a reasoning step to the current conversation trace.
   */
  addStep(type: ReasoningStepType, description: string, data?: unknown, durationMs?: number): void {
    const step: ReasoningStep = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      description,
      data,
      durationMs,
    };
    useTelemetry.getState().addReasoningStep(step);
  }

  private emit(event: TelemetryEvent): void {
    useTelemetry.getState().recordEvent(event);
  }
}

/** Singleton instance */
export const flightRecorder = new FlightRecorderSingleton();
