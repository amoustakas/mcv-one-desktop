// src/lib/factory-client.ts
//
// Typed client for the MCV Local AI Factory runtime (c:/Users/moust/mcv on :7004).
// Goes through the cockpit's /api/factory proxy so we inherit Clerk auth, CORS,
// and M5 observability (pino logs, AsyncLocalStorage correlation_id, rate-limit,
// requireVentureScope) for free. See api/_handlers/factory.ts for the server side.
//
// Two surface shapes are exported:
//   (1) Free functions — the primary API. Lightweight and ergonomic.
//   (2) `factory_client` singleton — class-based wrapper for snake_case callers
//       and test-friendly DI (inject a mock fetch). Delegates to the free fns.
//
// Both point at the same transport: POST /api/factory with { action, ...args }.

// ── Pillar + run status enum types ────────────────────────────────────────
// Conceptual — the Factory hasn't fully wired runs-tracking yet, but these
// enums are stable contracts used by the UI (pinned-kpi tiles, RunStatusBadge).

export type FactoryPillar =
  | 'oracle' | 'forge' | 'bloodstream' | 'architect' | 'crucible'
  | 'heartbeat' | 'scheduler';

export type FactoryRunStatus =
  | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

// ── FlowName — open union ─────────────────────────────────────────────────
// Known at-time-of-writing, but `(string & {})` keeps any new flow name
// accepted without a type error. If you know the exact flow, cast at call site.

export type FlowName =
  | 'heartbeatPulse'
  | 'oracleSynthesizer'
  | 'repoCrawler'
  | 'researchDossierBuilder'
  | (string & {});

// ── Heartbeat (matches actual :7004 runtime response) ─────────────────────

export interface FactoryHeartbeat {
  uptimeSec: number;
  pid: number;
  localModels: {
    reachable: boolean;
    models: string[];
    error?: string;
  };
  triangle: {
    fabric: { configured: boolean; url: string };
    intelligence: { configured: boolean; url: string };
    internalSecret: boolean;
  };
  emitted: {
    published: boolean;
    eventId?: string;
    skippedReason?: string;
    error?: string;
  };
  timestamp: string;
}

// ── FactoryFlow — Factory currently returns string[]; we enrich with pillar. ──

export interface FactoryFlow {
  name: string;
  description: string;
  pillar: FactoryPillar;
  input_schema: unknown;
  output_schema: unknown;
}

/**
 * Heuristic pillar assignment from flow name. Factory doesn't tag flows with
 * pillars yet, so we infer from naming convention. Fallback is 'heartbeat'
 * (catch-all). Adjust here when Factory starts returning pillar metadata.
 */
export function pillarOf(flowName: string): FactoryPillar {
  const lower = flowName.toLowerCase();
  if (lower.includes('oracle') || lower.includes('dossier') || lower.includes('synthesiz')) return 'oracle';
  if (lower.includes('repo') || lower.includes('jules') || lower.includes('forge')) return 'forge';
  if (lower.includes('fabric') || lower.includes('emit') || lower.includes('bloodstream')) return 'bloodstream';
  if (lower.includes('crawl') || lower.includes('gcp') || lower.includes('stitch') || lower.includes('drive')) return 'architect';
  if (lower.includes('browser') || lower.includes('docker') || lower.includes('device') || lower.includes('crucible')) return 'crucible';
  if (lower.includes('schedule') || lower.includes('job') || lower.includes('cron')) return 'scheduler';
  return 'heartbeat';
}

// ── FlowInvokeResult ──────────────────────────────────────────────────────

export interface FlowInvokeResult<T = unknown> {
  status: 'completed' | 'failed';
  flow: string;
  output?: T;
  error?: string;
  timestamp: string;
}

// ── FactoryEvent — in-memory event log ring buffer ────────────────────────

export interface FactoryEvent {
  loggedAt: string;
  topic: string;
  type: string;
  ventureId: string;
  subject: string;
  data: unknown;
  correlationId?: string;
  emitStatus: 'published' | 'skipped' | 'error';
  eventId?: string;
  skippedReason?: string;
  error?: string;
}

// ── FactoryBusEvent — rich internal event bus entry (stream payload) ──────

export interface FactoryBusEvent<T = unknown> {
  id: string;
  ts: string;
  type: string;
  source: string;
  correlationId?: string;
  data: T;
}

/**
 * Adapter: bus event → Fabric-event-feed shape expected by the UI EventFeed.
 * Keeps the existing FactoryEventFeed component working without a full rewrite.
 */
export interface FactoryFabricEvent {
  id: string;
  topic: string;
  venture_id: string | null;
  correlation_id: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
}

export function busToFabric(evt: FactoryBusEvent): FactoryFabricEvent {
  const data = (evt.data ?? {}) as Record<string, unknown>;
  return {
    id: evt.id,
    topic: evt.type,
    venture_id: (typeof data.ventureId === 'string' ? data.ventureId : null),
    correlation_id: evt.correlationId ?? null,
    timestamp: evt.ts,
    payload: data,
  };
}

// ── FactoryCapabilities — /capabilities snapshot ──────────────────────────

export interface FactoryCapabilities {
  ts: string;
  factory: { pid: number; uptimeSec: number; port: number };
  flows: string[];
  repos: Array<{ id: string; label: string; root: string; tags: string[] }>;
  jobs: {
    count: number;
    enabled: number;
    schedules: Array<{
      id: string;
      name: string;
      flow: string;
      cron: string | null;
      enabled: boolean;
    }>;
  };
  webhooks: string[];
  cli: Record<string, boolean>;
  models: {
    cliAvailable: boolean;
    serverReachable: boolean;
    server: { reachable: boolean; models: string[]; error?: string };
    installed: Array<{ id?: string; path?: string; architecture?: string; sizeBytes?: number }>;
    loaded: Array<{ id?: string; path?: string }>;
  };
  devices: Array<{
    id: string;
    label: string;
    status: string;
    summary: string;
    integration: string;
    notes?: string;
  }>;
  endpoints: string[];
}

// ── FactoryJob ────────────────────────────────────────────────────────────

export interface FactoryJob {
  id: string;
  name: string;
  flow: string;
  input: Record<string, unknown>;
  cron: string | null;
  nextRunAt: string | null;
  enabled: boolean;
  maxRetries: number;
  timezone: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Research dossier convenience types (for one specific flow's output) ───

export interface ResearchDossier {
  id: string;
  title: string;
  entityName: string;
  domain: string;
  summary: string;
  findings: Array<{ statement: string; relevance: 'critical' | 'high' | 'medium' | 'low' }>;
  openQuestions: string[];
  confidence: number;
  createdAt: string;
}

export interface ResearchDossierFlowOutput {
  dossier: ResearchDossier;
  stored: { id: string; stored: boolean; error?: string };
  emitted: { published: boolean; eventId?: string; skippedReason?: string; error?: string };
  memoryHealth: { localPg: boolean; triangleIntel: boolean };
  inferenceTier: string;
  inferenceModel: string;
}

// ── Client options + transport ────────────────────────────────────────────

export interface FactoryClientOptions {
  /** Override the proxy endpoint. Defaults to '/api/factory'. */
  proxy_url?: string;
  /** Injected fetch for tests. Defaults to global fetch. */
  fetch_impl?: typeof fetch;
}

const DEFAULT_PROXY = '/api/factory';

async function dispatch<T>(
  action: string,
  args: Record<string, unknown>,
  opts: { proxy_url?: string; fetch_impl?: typeof fetch } = {},
): Promise<T> {
  const fetchFn = opts.fetch_impl ?? fetch;
  const url = opts.proxy_url ?? DEFAULT_PROXY;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...args }),
  });
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg =
      (json as { error?: string } | null)?.error
      ?? `factory-proxy ${res.status}: ${text.slice(0, 200)}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json as T;
}

// ── Free-function API (primary) ───────────────────────────────────────────

export async function factoryPing(opts?: FactoryClientOptions): Promise<{
  factory: { status: string; pid?: number };
  factoryUrl: string;
}> {
  return dispatch('ping', {}, opts);
}

export async function factoryHeartbeat(
  args: { emit?: boolean } = {},
  opts?: FactoryClientOptions,
): Promise<{ ok: boolean; heartbeat: FactoryHeartbeat; factoryUrl: string }> {
  return dispatch('heartbeat', { emit: args.emit === false ? 'false' : 'true' }, opts);
}

export async function factoryFlows(opts?: FactoryClientOptions): Promise<{
  ok: boolean;
  flows: string[];
}> {
  return dispatch('flows', {}, opts);
}

export async function factoryEvents(
  limit = 50,
  opts?: FactoryClientOptions,
): Promise<{ ok: boolean; events: FactoryEvent[] }> {
  return dispatch('events', { limit }, opts);
}

export async function factoryClearEvents(opts?: FactoryClientOptions): Promise<{ cleared: boolean }> {
  return dispatch('events-clear', {}, opts);
}

export async function factoryBus(
  args: { limit?: number; typePrefix?: string; source?: string } = {},
  opts?: FactoryClientOptions,
): Promise<{ ok: boolean; events: FactoryBusEvent[] }> {
  return dispatch('bus', args, opts);
}

export async function factoryCapabilities(opts?: FactoryClientOptions): Promise<FactoryCapabilities> {
  return dispatch('capabilities', {}, opts);
}

export async function factoryListJobs(opts?: FactoryClientOptions): Promise<{
  ok: boolean;
  jobs: FactoryJob[];
}> {
  return dispatch('list-jobs', {}, opts);
}

export async function factoryScheduleJob(
  input: {
    id?: string;
    name: string;
    flow: string;
    input: Record<string, unknown>;
    cron?: string | null;
    nextRunAt?: string | null;
    enabled?: boolean;
    maxRetries?: number;
    timezone?: string | null;
    tags?: string[];
  },
  opts?: FactoryClientOptions,
): Promise<{ job: FactoryJob }> {
  return dispatch('schedule-job', input, opts);
}

export async function factoryDeleteJob(id: string, opts?: FactoryClientOptions): Promise<{ deleted: boolean }> {
  return dispatch('delete-job', { id }, opts);
}

export async function factoryRunJob(id: string, opts?: FactoryClientOptions): Promise<{ run: unknown }> {
  return dispatch('run-job', { id }, opts);
}

export async function factoryInvoke<T = unknown>(
  flowName: FlowName,
  input: Record<string, unknown>,
  opts?: FactoryClientOptions,
): Promise<FlowInvokeResult<T>> {
  return dispatch('invoke', { flowName, input }, opts);
}

// ── SSE stream helper (direct to Factory — proxy doesn't forward SSE) ─────

/**
 * Open an EventSource directly against the Factory's /stream endpoint.
 * Direct because SSE is a long-lived connection that doesn't play nicely
 * with serverless functions. Factory CORS is wide open in dev; prod will
 * need a tunneled Factory URL via VITE_FACTORY_URL.
 */
export interface FactoryStreamHandle {
  close: () => void;
}

export function openFactoryStream(opts: {
  typePrefix?: string;
  source?: string;
  onEvent: (evt: FactoryBusEvent) => void;
  onOpen?: () => void;
  onError?: (err: Event) => void;
}): EventSource {
  const base =
    (typeof window !== 'undefined' && (window as unknown as { __FACTORY_URL__?: string }).__FACTORY_URL__)
    || (import.meta as unknown as { env?: { VITE_FACTORY_URL?: string } }).env?.VITE_FACTORY_URL
    || 'http://localhost:7004';

  const qs = new URLSearchParams();
  if (opts.typePrefix) qs.set('typePrefix', opts.typePrefix);
  if (opts.source) qs.set('source', opts.source);
  const url = `${base}/stream${qs.toString() ? `?${qs}` : ''}`;

  const es = new EventSource(url);
  if (opts.onOpen) es.addEventListener('open', opts.onOpen);
  if (opts.onError) es.addEventListener('error', opts.onError);

  const onMessage = (e: MessageEvent) => {
    try { opts.onEvent(JSON.parse(e.data)); } catch { /* skip malformed */ }
  };
  es.addEventListener('message', onMessage);

  // Factory emits named events (event: <type>) — subscribe to the canonical set
  // so EventSource routes them to our handler rather than dropping on the floor.
  const KNOWN_TYPES = [
    'factory.heartbeat',
    'factory.flow.invoked', 'factory.flow.failed',
    'factory.process.spawned', 'factory.process.exited',
    'factory.process.stdout', 'factory.process.stderr', 'factory.process.errored',
    'factory.repo.file_changed', 'factory.repo.branch_changed',
    'factory.repo.watcher_started', 'factory.repo.watcher_stopped',
    'factory.job.queue_started', 'factory.job.created', 'factory.job.updated',
    'factory.job.deleted', 'factory.job.started', 'factory.job.completed', 'factory.job.failed',
    'factory.webhook.received', 'factory.webhook.accepted', 'factory.webhook.ignored',
    'factory.webhook.error',
    'factory.fabric.published', 'factory.fabric.skipped', 'factory.fabric.error',
    'factory.lmstudio.load_requested', 'factory.lmstudio.load_completed', 'factory.lmstudio.load_failed',
    'factory.lmstudio.unload_completed', 'factory.lmstudio.unload_failed', 'factory.lmstudio.server_stopped',
    'factory.runtime.started', 'factory.runtime.stopping',
  ];
  for (const name of KNOWN_TYPES) {
    es.addEventListener(name, onMessage as EventListener);
  }

  return es;
}

// ── FactoryClient class (compat shell + DI for tests) ────────────────────

export class FactoryClient {
  constructor(private readonly options: FactoryClientOptions = {}) {}

  // All methods delegate to the free-function API with the injected options.
  // Methods are named snake_case to match the consumer code master shipped.

  ping() { return factoryPing(this.options); }

  heartbeat(args: { emit?: boolean } = {}) {
    return factoryHeartbeat(args, this.options).then((r) => r.heartbeat);
  }

  list_flows(): Promise<FactoryFlow[]> {
    return factoryFlows(this.options).then((r) =>
      (r.flows ?? []).map((name) => ({
        name,
        description: '',
        pillar: pillarOf(name),
        input_schema: {},
        output_schema: {},
      })),
    );
  }

  async invoke<T = unknown>(flow_name: string, input: Record<string, unknown>): Promise<FlowInvokeResult<T>> {
    if (!flow_name) throw new Error('flow_name required');
    return factoryInvoke<T>(flow_name, input, this.options);
  }

  events(limit = 50) { return factoryEvents(limit, this.options); }
  clear_events() { return factoryClearEvents(this.options); }
  bus(args: { limit?: number; typePrefix?: string; source?: string } = {}) {
    return factoryBus(args, this.options);
  }
  capabilities() { return factoryCapabilities(this.options); }
  list_jobs() { return factoryListJobs(this.options); }
  schedule_job(input: Parameters<typeof factoryScheduleJob>[0]) {
    return factoryScheduleJob(input, this.options);
  }
  delete_job(id: string) { return factoryDeleteJob(id, this.options); }
  run_job(id: string) { return factoryRunJob(id, this.options); }

  /**
   * Subscribe to the Factory event bus filtered by topic prefix.
   * Returns a cleanup function — callers MUST invoke it to close the stream.
   * Events are adapted from FactoryBusEvent → FactoryFabricEvent for UI consumers.
   */
  subscribe_events(
    topic: string,
    on_event: (ev: FactoryFabricEvent) => void,
    opts: { on_error?: (err: Error) => void } = {},
  ): () => void {
    // Topic with trailing .* means "any type under this prefix" — strip the .*
    const typePrefix = topic.endsWith('.*') ? topic.slice(0, -2) : topic;
    const es = openFactoryStream({
      typePrefix,
      onEvent: (busEvt) => on_event(busToFabric(busEvt)),
      onError: () => opts.on_error?.(new Error('SSE connection error')),
    });
    return () => es.close();
  }
}

/** Singleton — default for app-wide use. Callers can construct their own for testing. */
export const factory_client = new FactoryClient();
