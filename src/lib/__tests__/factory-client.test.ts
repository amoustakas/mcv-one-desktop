import { describe, it, expect, vi } from 'vitest';
import { FactoryClient } from '../factory-client';

function mock_fetch(responses: Array<Response | Promise<Response>>) {
  let i = 0;
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    void _input; void _init;
    return responses[i++] ?? new Response(null, { status: 404 });
  });
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('FactoryClient', () => {
  it('heartbeat parses JSON from /heartbeat', async () => {
    const fetch_impl = mock_fetch([ok({ uptime_ms: 123, local_model: 'llama3.1:8b', gemini_available: true, last_event_ts: '2026-04-17T10:00:00Z', active_runs: 0 })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl });
    const hb = await c.heartbeat();
    expect(hb.uptime_ms).toBe(123);
    expect(hb.local_model).toBe('llama3.1:8b');
    expect(fetch_impl).toHaveBeenCalledWith('http://f/heartbeat', expect.objectContaining({ method: 'GET' }));
  });

  it('list_flows unwraps { flows: [...] }', async () => {
    const fetch_impl = mock_fetch([ok({ flows: [{ name: 'research-dossier-builder', description: '', pillar: 'oracle', input_schema: {}, output_schema: {} }] })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl });
    const flows = await c.list_flows();
    expect(flows).toHaveLength(1);
    expect(flows[0].pillar).toBe('oracle');
  });

  it('invoke POSTs input and returns run_id', async () => {
    const fetch_impl = mock_fetch([ok({ run_id: 'r-123' })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl });
    const res = await c.invoke('research-dossier-builder', { entity: 'Hunter Milborne' });
    expect(res.run_id).toBe('r-123');
    const call = fetch_impl.mock.calls[0];
    expect(call[0]).toBe('http://f/invoke/research-dossier-builder');
    expect((call[1] as RequestInit).method).toBe('POST');
    expect((call[1] as RequestInit).body).toBe(JSON.stringify({ entity: 'Hunter Milborne' }));
  });

  it('list_runs builds querystring from filter', async () => {
    const fetch_impl = mock_fetch([ok({ runs: [] })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl });
    await c.list_runs({ limit: 20, pillar: 'oracle', status: 'succeeded' });
    const call = fetch_impl.mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain('/runs?');
    expect(url).toContain('limit=20');
    expect(url).toContain('pillar=oracle');
    expect(url).toContain('status=succeeded');
  });

  it('injects X-Internal-Secret header when provided', async () => {
    const fetch_impl = mock_fetch([ok({ uptime_ms: 0, local_model: null, gemini_available: false, last_event_ts: null, active_runs: 0 })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl, internal_secret: 'dev-secret' });
    await c.heartbeat();
    const headers = (fetch_impl.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-Internal-Secret']).toBe('dev-secret');
  });

  it('throws with status + body prefix when response not ok', async () => {
    const fetch_impl = mock_fetch([new Response('boom internal err', { status: 500 })]);
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl });
    await expect(c.heartbeat()).rejects.toThrow(/factory 500: boom internal err/);
  });

  it('get_run requires run_id', async () => {
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl: mock_fetch([]) });
    await expect(c.get_run('')).rejects.toThrow(/run_id required/);
  });

  it('invoke requires flow_name', async () => {
    const c = new FactoryClient({ base_url: 'http://f', fetch_impl: mock_fetch([]) });
    await expect(c.invoke('', {})).rejects.toThrow(/flow_name required/);
  });
});
