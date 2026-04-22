// Factory client — typed wrapper around /api/factory proxy endpoint.
// Calls the Local AI Factory runtime (mcv repo, port 7004) via the cockpit's
// own /api layer so we inherit Clerk auth + CORS for free.
//
// Flow outputs are intentionally typed as `unknown` at this layer — callers
// who know the specific flow's schema should cast. Keeps this file stable as
// the Factory's flow surface grows.

export type FlowName =
  | 'heartbeatPulse'
  | 'oracleSynthesizer'
  | 'repoCrawler'
  | 'researchDossierBuilder'
  | (string & {}); // open union so registry changes don't break consumers

export interface FactoryHeartbeat {
  uptimeSec: number;
  pid: number;
  localModels: { reachable: boolean; models: string[]; error?: string };
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

export interface FlowInvokeResult<T = unknown> {
  status: 'completed' | 'failed';
  flow: string;
  output?: T;
  error?: string;
  timestamp: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/factory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error ?? `Factory proxy returned ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json as T;
}

export async function factoryPing(): Promise<{ factory: { status: string; pid?: number }; factoryUrl: string }> {
  return call({ action: 'ping' });
}

export async function factoryHeartbeat(opts: { emit?: boolean } = {}): Promise<{
  ok: boolean;
  heartbeat: FactoryHeartbeat;
  factoryUrl: string;
}> {
  return call({ action: 'heartbeat', emit: opts.emit === false ? 'false' : 'true' });
}

export async function factoryFlows(): Promise<{ ok: boolean; flows: string[] }> {
  return call({ action: 'flows' });
}

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

export async function factoryEvents(limit = 50): Promise<{ ok: boolean; events: FactoryEvent[] }> {
  return call({ action: 'events', limit });
}

export async function factoryClearEvents(): Promise<{ cleared: boolean }> {
  return call({ action: 'events-clear' });
}

/**
 * Rich in-process event-bus entry. The Factory emits these for every
 * side-effect: process spawn/exit, repo file change, job lifecycle,
 * webhook received, Fabric emission, flow invoke, heartbeat, etc.
 */
export interface FactoryBusEvent<T = unknown> {
  id: string;
  ts: string;
  type: string;              // e.g. 'factory.repo.file_changed'
  source: string;            // emitting component, e.g. 'repo-watcher'
  correlationId?: string;
  data: T;
}

export async function factoryBus(opts: { limit?: number; typePrefix?: string; source?: string } = {}): Promise<{
  ok: boolean;
  events: FactoryBusEvent[];
}> {
  return call({ action: 'bus', ...opts });
}

export interface FactoryCapabilities {
  ts: string;
  factory: { pid: number; uptimeSec: number; port: number };
  flows: string[];
  repos: Array<{ id: string; label: string; root: string; tags: string[] }>;
  jobs: {
    count: number;
    enabled: number;
    schedules: Array<{ id: string; name: string; flow: string; cron: string | null; enabled: boolean }>;
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
  devices: Array<{ id: string; label: string; status: string; summary: string; integration: string; notes?: string }>;
  endpoints: string[];
}

export async function factoryCapabilities(): Promise<FactoryCapabilities> {
  return call({ action: 'capabilities' });
}

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

export async function factoryListJobs(): Promise<{ ok: boolean; jobs: FactoryJob[] }> {
  return call({ action: 'list-jobs' });
}

export async function factoryScheduleJob(input: {
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
}): Promise<{ job: FactoryJob }> {
  return call({ action: 'schedule-job', ...input });
}

export async function factoryDeleteJob(id: string): Promise<{ deleted: boolean }> {
  return call({ action: 'delete-job', id });
}

export async function factoryRunJob(id: string): Promise<{ run: unknown }> {
  return call({ action: 'run-job', id });
}

/**
 * Open an EventSource directly against the Factory's /stream endpoint.
 * Direct because SSE is a long-lived connection that doesn't play nicely
 * with Vercel serverless functions — at localhost-cockpit scope CORS on the
 * Factory side is already wide open, so this is the simplest path.
 *
 * Set `VITE_FACTORY_URL` to override for remote-Factory setups later.
 */
export function openFactoryStream(opts: {
  typePrefix?: string;
  source?: string;
  onEvent: (evt: FactoryBusEvent) => void;
  onOpen?: () => void;
  onError?: (err: Event) => void;
} = {} as any): EventSource {
  const base = (typeof window !== 'undefined' && (window as any).__FACTORY_URL__)
    || (import.meta as any).env?.VITE_FACTORY_URL
    || 'http://localhost:7004';
  const qs = new URLSearchParams();
  if (opts.typePrefix) qs.set('typePrefix', opts.typePrefix);
  if (opts.source) qs.set('source', opts.source);
  const url = `${base}/stream${qs.toString() ? `?${qs}` : ''}`;
  const es = new EventSource(url);
  if (opts.onOpen) es.addEventListener('open', opts.onOpen);
  if (opts.onError) es.addEventListener('error', opts.onError);
  es.addEventListener('message', (e) => {
    try { opts.onEvent(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
  });
  // The Factory sets `event: <type>` on each message — EventSource dispatches
  // as named events. Listen wildcard via the 'message' default + also tap
  // every factory.* type the stream might emit.
  const names = [
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
  for (const name of names) {
    es.addEventListener(name, (e) => {
      try { opts.onEvent(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });
  }
  return es;
}

/**
 * Invoke a flow on the Factory by name. Body shape is whatever the flow's
 * Zod inputSchema expects — pass it through. On failure the proxy still
 * returns JSON, so we surface the Factory's structured error.
 */
export async function factoryInvoke<T = unknown>(
  flowName: FlowName,
  input: Record<string, unknown>,
): Promise<FlowInvokeResult<T>> {
  return call({ action: 'invoke', flowName, input });
}

/** Convenience types for the research dossier flow output. */
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
