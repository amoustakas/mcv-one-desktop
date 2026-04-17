// src/lib/factory-client.ts
// Typed HTTP + SSE client for the MCV Local AI Factory (port 7004 dev / /api/factory-proxy prod).
// Pure logic — no React. Hooks layer consumes this.

export type FactoryPillar = 'oracle' | 'forge' | 'bloodstream' | 'architect' | 'crucible' | 'heartbeat' | 'scheduler';
export type FactoryRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface FactoryHeartbeat {
  uptime_ms: number;
  local_model: string | null;
  gemini_available: boolean;
  last_event_ts: string | null;
  active_runs: number;
  version?: string;
}

export interface FactoryFlow {
  name: string;
  description: string;
  pillar: FactoryPillar;
  input_schema: unknown;   // JSON schema (Zod-derived on Factory side)
  output_schema: unknown;
}

export interface FactoryRun {
  run_id: string;
  flow_name: string;
  pillar: FactoryPillar | null;
  status: FactoryRunStatus;
  started_at: string;
  completed_at: string | null;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
  duration_ms: number | null;
  emitted_event_ids: string[];
}

export interface FactoryFabricEvent {
  id: string;
  topic: string;
  venture_id: string | null;
  correlation_id: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type FactoryStreamEvent =
  | { type: 'token'; text: string; run_id: string }
  | { type: 'tool_call'; tool_name: string; input: unknown; run_id: string }
  | { type: 'tool_result'; tool_name: string; output: unknown; run_id: string }
  | { type: 'partial_result'; partial: unknown; run_id: string }
  | { type: 'complete'; result: unknown; run_id: string }
  | { type: 'error'; code: string; message: string; run_id: string };

export interface FactoryClientOptions {
  base_url?: string;           // override — defaults to /api/factory-proxy in prod, http://localhost:7004 in dev
  internal_secret?: string;    // optional — injected as X-Internal-Secret header when present
  fetch_impl?: typeof fetch;   // injectable for tests
}

export class FactoryClient {
  readonly base_url: string;
  private readonly headers: Record<string, string>;
  private readonly fetch_impl: typeof fetch;

  constructor(opts: FactoryClientOptions = {}) {
    const is_dev = typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
    this.base_url = opts.base_url ?? (is_dev ? 'http://localhost:7004' : '/api/factory-proxy');
    this.headers = { 'content-type': 'application/json' };
    if (opts.internal_secret) this.headers['X-Internal-Secret'] = opts.internal_secret;
    this.fetch_impl = opts.fetch_impl ?? fetch;
  }

  // ── HTTP reads ────────────────────────────────────────────────────────
  async heartbeat(): Promise<FactoryHeartbeat> {
    return this.get<FactoryHeartbeat>('/heartbeat');
  }

  async list_flows(): Promise<FactoryFlow[]> {
    const res = await this.get<{ flows: FactoryFlow[] }>('/flows');
    return res.flows;
  }

  async get_run(run_id: string): Promise<FactoryRun> {
    if (!run_id) throw new Error('run_id required');
    return this.get<FactoryRun>(`/runs/${encodeURIComponent(run_id)}`);
  }

  async list_runs(filter: { limit?: number; flow?: string; pillar?: FactoryPillar; status?: FactoryRunStatus } = {}): Promise<FactoryRun[]> {
    const params = new URLSearchParams();
    if (filter.limit !== undefined) params.set('limit', String(filter.limit));
    if (filter.flow) params.set('flow', filter.flow);
    if (filter.pillar) params.set('pillar', filter.pillar);
    if (filter.status) params.set('status', filter.status);
    const qs = params.toString();
    const res = await this.get<{ runs: FactoryRun[] }>(`/runs${qs ? `?${qs}` : ''}`);
    return res.runs;
  }

  // ── HTTP writes (invoke) ──────────────────────────────────────────────
  async invoke(flow_name: string, input: Record<string, unknown>): Promise<{ run_id: string }> {
    if (!flow_name) throw new Error('flow_name required');
    return this.post<{ run_id: string }>(`/invoke/${encodeURIComponent(flow_name)}`, input);
  }

  // ── SSE subscriptions ─────────────────────────────────────────────────
  // Returns a cleanup function. Callers MUST invoke it to close the stream.
  subscribe_run(
    run_id: string,
    on_event: (ev: FactoryStreamEvent) => void,
    on_error?: (err: Error) => void,
  ): () => void {
    return this.sse(`/runs/${encodeURIComponent(run_id)}/stream`, (data) => {
      try {
        on_event(JSON.parse(data) as FactoryStreamEvent);
      } catch (e) {
        on_error?.(e instanceof Error ? e : new Error(String(e)));
      }
    }, on_error);
  }

  subscribe_events(
    topic: string,
    on_event: (ev: FactoryFabricEvent) => void,
    opts: { since?: string; on_error?: (err: Error) => void } = {},
  ): () => void {
    const params = new URLSearchParams({ topic });
    if (opts.since) params.set('since', opts.since);
    return this.sse(`/events/subscribe?${params.toString()}`, (data) => {
      try {
        on_event(JSON.parse(data) as FactoryFabricEvent);
      } catch (e) {
        opts.on_error?.(e instanceof Error ? e : new Error(String(e)));
      }
    }, opts.on_error);
  }

  // ── Internals ─────────────────────────────────────────────────────────
  private async get<T>(path: string): Promise<T> {
    const res = await this.fetch_impl(`${this.base_url}${path}`, { method: 'GET', headers: this.headers });
    return this.parse<T>(res);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetch_impl(`${this.base_url}${path}`, {
      method: 'POST', headers: this.headers, body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let body: string;
      try { body = await res.text(); } catch { body = ''; }
      throw new Error(`factory ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  // SSE helper — uses native EventSource when available, falls back to fetch+stream parse.
  // EventSource doesn't support custom headers in browsers, so when internal_secret is needed,
  // we fall back to fetch streaming.
  private sse(path: string, on_data: (data: string) => void, on_error?: (err: Error) => void): () => void {
    const url = `${this.base_url}${path}`;
    const needs_headers = !!this.headers['X-Internal-Secret'];

    if (!needs_headers && typeof EventSource !== 'undefined') {
      const es = new EventSource(url);
      es.onmessage = (ev) => on_data(ev.data);
      es.onerror = () => on_error?.(new Error('SSE connection error'));
      return () => es.close();
    }

    // Fetch streaming fallback
    const controller = new AbortController();
    (async () => {
      try {
        const res = await this.fetch_impl(url, { method: 'GET', headers: this.headers, signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`SSE fetch failed: ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() ?? '';
          for (const msg of messages) {
            const data_line = msg.split('\n').find((l) => l.startsWith('data: '));
            if (data_line) on_data(data_line.slice(6));
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          on_error?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();
    return () => controller.abort();
  }
}

// Singleton — default for app-wide use. Callers can construct their own for testing.
export const factory_client = new FactoryClient();
