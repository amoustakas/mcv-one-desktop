/**
 * Public DTO contract for intelligence-gateway telemetry.
 *
 * PHASE-1 LOCAL COPY. Source of truth:
 *   mcv-core-triangle @ origin/foundation-substrate-2026-04-22
 *   packages/intelligence-sdk/src/telemetry/index.ts
 *   commit c532c7d (2026-04-22)
 *
 * This file is LOCAL to mcv-one-desktop because the foundation branch
 * above is unmerged to core-triangle/main. When a follow-up session
 * merges that branch AND publishes @mcv/intelligence-sdk with a
 * `./telemetry` subpath, delete this file and replace all imports
 * with `from '@mcv/intelligence-sdk/telemetry'`. One-file mechanical
 * swap; zero semantic change.
 *
 * Span shape is OpenTelemetry-compatible — a future OTel exporter can
 * map field-for-field without contract changes.
 */

export type SpanStatus = 'unset' | 'ok' | 'error';

export interface TelemetrySpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  status: SpanStatus;
  attributes: Record<string, string | number | boolean>;
  events: Array<{
    time: string;
    name: string;
    attributes?: Record<string, string | number | boolean>;
  }>;
  error?: { kind: string; message: string };
}

export interface SpanHandle {
  readonly span: TelemetrySpan;
  setAttribute(key: string, value: string | number | boolean): void;
  setAttributes(attrs: Record<string, string | number | boolean>): void;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
  setStatus(status: SpanStatus): void;
  recordError(err: unknown): void;
  end(): void;
}

export interface StartSpanOptions {
  traceId?: string;
  parentSpanId?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface TelemetryRecorder {
  startSpan(name: string, options?: StartSpanOptions): SpanHandle;
}

export const GEN_AI_ATTRS = {
  SYSTEM: 'gen_ai.system',
  REQUEST_MODEL: 'gen_ai.request.model',
  RESPONSE_MODEL: 'gen_ai.response.model',
  RESPONSE_PROVIDER: 'gen_ai.response.provider',
  RESPONSE_FINISH_REASON: 'gen_ai.response.finish_reason',
  USAGE_INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  USAGE_OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',
  USAGE_TOTAL_TOKENS: 'gen_ai.usage.total_tokens',
} as const;

export const MCV_TELEMETRY_ATTRS = {
  VENTURE_ID: 'mcv.venture_id',
  USER_ID: 'mcv.user_id',
  CORRELATION_ID: 'mcv.correlation_id',
  AGENT_RUN_ID: 'mcv.agent_run_id',
  FINGERPRINT: 'mcv.fingerprint',
  REPLAY_MODE: 'mcv.replay_mode',
  REPLAY_HIT: 'mcv.replay.hit',
  COST_MICROCENTS: 'mcv.cost_microcents',
  STREAM_CHUNK_COUNT: 'mcv.stream.chunk_count',
} as const;

export const GATEWAY_SPAN_NAMES = {
  COMPLETE: 'intelligence.complete',
  STREAM: 'intelligence.stream',
} as const;

/** MCV-Router span names — emitted by IntelligenceRouter itself. */
export const ROUTER_SPAN_NAMES = {
  RECALL: 'intelligence.router.recall',
  OBSERVE: 'intelligence.router.observe',
  TRACE: 'intelligence.router.trace',
  CONTEXT: 'intelligence.router.context',
} as const;

/** No-op recorder — used when Router is constructed without a telemetry backend. */
export class NoopTelemetryRecorder implements TelemetryRecorder {
  startSpan(name: string, options?: StartSpanOptions): SpanHandle {
    const startTime = new Date().toISOString();
    const span: TelemetrySpan = {
      spanId: cryptoRandomId(),
      traceId: options?.traceId ?? cryptoRandomId(),
      parentSpanId: options?.parentSpanId,
      name,
      startTime,
      status: 'unset',
      attributes: { ...(options?.attributes ?? {}) },
      events: [],
    };
    return {
      span,
      setAttribute: (k, v) => { span.attributes[k] = v; },
      setAttributes: (a) => { Object.assign(span.attributes, a); },
      addEvent: (n, a) => { span.events.push({ time: new Date().toISOString(), name: n, attributes: a }); },
      setStatus: (s) => { span.status = s; },
      recordError: (err) => {
        span.status = 'error';
        span.error = { kind: err instanceof Error ? err.name : 'unknown', message: err instanceof Error ? err.message : String(err) };
      },
      end: () => {
        span.endTime = new Date().toISOString();
        span.durationMs = Date.parse(span.endTime) - Date.parse(span.startTime);
      },
    };
  }
}

function cryptoRandomId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
