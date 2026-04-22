import { describe, it, expect, vi } from 'vitest';
import {
  FactoryClient,
  factoryPing,
  factoryHeartbeat,
  factoryFlows,
  factoryInvoke,
  factoryCapabilities,
  factoryBus,
  factoryListJobs,
  factoryScheduleJob,
  factoryDeleteJob,
  factoryRunJob,
  factoryEvents,
  factoryClearEvents,
  pillarOf,
  busToFabric,
  type FactoryBusEvent,
} from '../factory-client';

function mockFetch(responses: Array<Response | Promise<Response>>) {
  let i = 0;
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    void _input; void _init;
    return responses[i++] ?? new Response(null, { status: 404 });
  });
}

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('dispatch transport', () => {
  it('POSTs action + args to /api/factory by default', async () => {
    const fetch_impl = mockFetch([ok({ ok: true, flows: ['heartbeatPulse'] })]);
    await factoryFlows({ fetch_impl });
    const [url, init] = fetch_impl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/factory');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ action: 'flows' });
  });

  it('honors proxy_url override (e.g. for integration tests on a different mount point)', async () => {
    const fetch_impl = mockFetch([ok({ ok: true, flows: [] })]);
    await factoryFlows({ fetch_impl, proxy_url: '/v2/api/factory' });
    const [url] = fetch_impl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/v2/api/factory');
  });

  it('throws with server-provided error when response not ok', async () => {
    const fetch_impl = mockFetch([
      new Response(JSON.stringify({ error: 'Factory unreachable at http://localhost:7004' }), { status: 503 }),
    ]);
    await expect(factoryFlows({ fetch_impl })).rejects.toThrow(/Factory unreachable at http:/);
  });

  it('throws with status + body prefix when response has no JSON error', async () => {
    const fetch_impl = mockFetch([new Response('boom', { status: 500 })]);
    await expect(factoryFlows({ fetch_impl })).rejects.toThrow(/factory-proxy 500: boom/);
  });
});

describe('free-function API', () => {
  it('factoryPing dispatches action=ping', async () => {
    const fetch_impl = mockFetch([ok({ factory: { status: 'ok', pid: 1234 }, factoryUrl: 'http://localhost:7004' })]);
    const r = await factoryPing({ fetch_impl });
    expect(r.factory.pid).toBe(1234);
    expect(JSON.parse((fetch_impl.mock.calls[0][1] as RequestInit).body as string)).toEqual({ action: 'ping' });
  });

  it('factoryHeartbeat sends emit flag as string, defaulting to "true"', async () => {
    const fetch_impl = mockFetch([
      ok({ ok: true, heartbeat: { uptimeSec: 10, pid: 1, localModels: { reachable: true, models: ['llama3.1'] }, triangle: { fabric: { configured: true, url: 'x' }, intelligence: { configured: true, url: 'y' }, internalSecret: true }, emitted: { published: true }, timestamp: '2026-04-22T00:00:00Z' }, factoryUrl: 'x' }),
      ok({ ok: true, heartbeat: {}, factoryUrl: 'x' }),
    ]);
    await factoryHeartbeat({}, { fetch_impl });
    await factoryHeartbeat({ emit: false }, { fetch_impl });
    expect(JSON.parse((fetch_impl.mock.calls[0][1] as RequestInit).body as string)).toEqual({ action: 'heartbeat', emit: 'true' });
    expect(JSON.parse((fetch_impl.mock.calls[1][1] as RequestInit).body as string)).toEqual({ action: 'heartbeat', emit: 'false' });
  });

  it('factoryInvoke carries flowName + input payload', async () => {
    const fetch_impl = mockFetch([
      ok({ status: 'completed', flow: 'researchDossierBuilder', output: { dossier: { id: 'd1' } }, timestamp: '2026-04-22T00:00:00Z' }),
    ]);
    const r = await factoryInvoke('researchDossierBuilder', { entity: 'Hunter' }, { fetch_impl });
    expect(r.status).toBe('completed');
    expect(JSON.parse((fetch_impl.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      action: 'invoke',
      flowName: 'researchDossierBuilder',
      input: { entity: 'Hunter' },
    });
  });

  it('factoryCapabilities returns full snapshot shape', async () => {
    const fetch_impl = mockFetch([
      ok({
        ts: '2026-04-22T00:00:00Z',
        factory: { pid: 1, uptimeSec: 42, port: 7004 },
        flows: ['heartbeatPulse'],
        repos: [], jobs: { count: 0, enabled: 0, schedules: [] },
        webhooks: [], cli: {}, models: { cliAvailable: false, serverReachable: false, server: { reachable: false, models: [] }, installed: [], loaded: [] },
        devices: [], endpoints: ['/heartbeat', '/flows'],
      }),
    ]);
    const caps = await factoryCapabilities({ fetch_impl });
    expect(caps.factory.port).toBe(7004);
    expect(caps.flows).toEqual(['heartbeatPulse']);
  });

  it('factoryBus forwards limit + typePrefix filters', async () => {
    const fetch_impl = mockFetch([ok({ ok: true, events: [] })]);
    await factoryBus({ limit: 25, typePrefix: 'factory.job' }, { fetch_impl });
    expect(JSON.parse((fetch_impl.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      action: 'bus', limit: 25, typePrefix: 'factory.job',
    });
  });

  it('job lifecycle — list/schedule/delete/run each dispatch the right action', async () => {
    const fetch_impl = mockFetch([
      ok({ ok: true, jobs: [] }),
      ok({ job: { id: 'j1', name: 'n', flow: 'f', input: {}, cron: '* * * * *', nextRunAt: null, enabled: true, maxRetries: 3, timezone: null, tags: [], createdAt: 't', updatedAt: 't' } }),
      ok({ deleted: true }),
      ok({ run: { status: 'completed' } }),
    ]);
    await factoryListJobs({ fetch_impl });
    await factoryScheduleJob({ name: 'n', flow: 'f', input: {}, cron: '* * * * *' }, { fetch_impl });
    await factoryDeleteJob('j1', { fetch_impl });
    await factoryRunJob('j1', { fetch_impl });

    const actions = fetch_impl.mock.calls.map(
      (c) => JSON.parse((c[1] as RequestInit).body as string).action as string,
    );
    expect(actions).toEqual(['list-jobs', 'schedule-job', 'delete-job', 'run-job']);
  });

  it('events + events-clear use separate actions', async () => {
    const fetch_impl = mockFetch([ok({ ok: true, events: [] }), ok({ cleared: true })]);
    await factoryEvents(30, { fetch_impl });
    await factoryClearEvents({ fetch_impl });
    expect(JSON.parse((fetch_impl.mock.calls[0][1] as RequestInit).body as string)).toEqual({ action: 'events', limit: 30 });
    expect(JSON.parse((fetch_impl.mock.calls[1][1] as RequestInit).body as string)).toEqual({ action: 'events-clear' });
  });
});

describe('FactoryClient class', () => {
  it('heartbeat() unwraps nested response to raw heartbeat', async () => {
    const fetch_impl = mockFetch([
      ok({
        ok: true,
        heartbeat: {
          uptimeSec: 100, pid: 42,
          localModels: { reachable: true, models: ['llama3.1:8b'] },
          triangle: { fabric: { configured: true, url: '' }, intelligence: { configured: true, url: '' }, internalSecret: true },
          emitted: { published: true },
          timestamp: '2026-04-22T00:00:00Z',
        },
        factoryUrl: 'http://localhost:7004',
      }),
    ]);
    const c = new FactoryClient({ fetch_impl });
    const hb = await c.heartbeat();
    expect(hb.uptimeSec).toBe(100);
    expect(hb.localModels.models).toEqual(['llama3.1:8b']);
  });

  it('list_flows enriches string[] into FactoryFlow[] with heuristic pillar', async () => {
    const fetch_impl = mockFetch([ok({ ok: true, flows: ['oracleSynthesizer', 'repoCrawler', 'heartbeatPulse'] })]);
    const c = new FactoryClient({ fetch_impl });
    const flows = await c.list_flows();
    expect(flows.map((f) => f.pillar)).toEqual(['oracle', 'forge', 'heartbeat']);
  });

  it('invoke requires non-empty flow_name', async () => {
    const c = new FactoryClient({ fetch_impl: mockFetch([]) });
    await expect(c.invoke('', {})).rejects.toThrow(/flow_name required/);
  });
});

describe('pillarOf heuristic', () => {
  it.each([
    ['oracleSynthesizer', 'oracle'],
    ['researchDossierBuilder', 'oracle'],
    ['repoCrawler', 'forge'],
    ['julesSession', 'forge'],
    ['fabricPublisher', 'bloodstream'],
    ['gcpDriveIngester', 'architect'],
    ['stitchProjectFetcher', 'architect'],
    ['browserOps', 'crucible'],
    ['dockerContainerOps', 'crucible'],
    ['jobScheduler', 'scheduler'],
    ['randomName', 'heartbeat'],
  ] as const)('%s → %s', (name, expected) => {
    expect(pillarOf(name)).toBe(expected);
  });
});

describe('busToFabric adapter', () => {
  it('maps bus event to fabric-event-feed shape', () => {
    const evt: FactoryBusEvent = {
      id: 'evt-1',
      ts: '2026-04-22T00:00:00Z',
      type: 'factory.flow.invoked',
      source: 'flow-runner',
      correlationId: 'corr-abc',
      data: { ventureId: 'betedge', flow: 'oracleSynthesizer' },
    };
    const fabric = busToFabric(evt);
    expect(fabric.id).toBe('evt-1');
    expect(fabric.topic).toBe('factory.flow.invoked');
    expect(fabric.venture_id).toBe('betedge');
    expect(fabric.correlation_id).toBe('corr-abc');
    expect(fabric.timestamp).toBe('2026-04-22T00:00:00Z');
    expect(fabric.payload).toEqual({ ventureId: 'betedge', flow: 'oracleSynthesizer' });
  });

  it('handles missing optional fields cleanly', () => {
    const evt: FactoryBusEvent = {
      id: 'e', ts: 't', type: 'factory.heartbeat', source: 'src', data: null,
    };
    const fabric = busToFabric(evt);
    expect(fabric.venture_id).toBeNull();
    expect(fabric.correlation_id).toBeNull();
    expect(fabric.payload).toEqual({});
  });
});
