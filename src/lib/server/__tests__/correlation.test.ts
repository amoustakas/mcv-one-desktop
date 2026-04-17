import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveCorrelationId,
  withCorrelationHeader,
  runWithCorrelation,
  getActiveCorrelationId,
} from '../correlation';
import { fetchWithCorrelation } from '../fetch-with-correlation';

describe('resolveCorrelationId', () => {
  it('prefers x-correlation-id over x-request-id', () => {
    const id = resolveCorrelationId({
      headers: { 'x-correlation-id': 'corr-1', 'x-request-id': 'req-1' },
    });
    expect(id).toBe('corr-1');
  });

  it('falls back to x-request-id when x-correlation-id is absent', () => {
    const id = resolveCorrelationId({ headers: { 'x-request-id': 'req-2' } });
    expect(id).toBe('req-2');
  });

  it('generates a UUID when both headers are absent', () => {
    const id = resolveCorrelationId({ headers: {} });
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe('withCorrelationHeader', () => {
  it('preserves existing headers and adds x-correlation-id', () => {
    const out = withCorrelationHeader({ authorization: 'Bearer x' }, 'corr-9');
    expect(out).toEqual({ authorization: 'Bearer x', 'x-correlation-id': 'corr-9' });
  });

  it('uses active AsyncLocalStorage id when called inside runWithCorrelation', () => {
    runWithCorrelation('als-id', () => {
      const out = withCorrelationHeader({ a: 'b' });
      expect(out['x-correlation-id']).toBe('als-id');
      expect(getActiveCorrelationId()).toBe('als-id');
    });
  });

  it('returns base unchanged when no id is active and none explicitly passed', () => {
    const out = withCorrelationHeader({ foo: 'bar' });
    expect(out).toEqual({ foo: 'bar' });
    expect(out['x-correlation-id']).toBeUndefined();
  });
});

describe('fetchWithCorrelation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('auto-injects x-correlation-id when inside runWithCorrelation', async () => {
    const calls: Array<[unknown, RequestInit | undefined]> = [];
    const spy = vi.fn(async (input: unknown, init?: RequestInit) => {
      calls.push([input, init]);
      return new Response('ok');
    });
    vi.stubGlobal('fetch', spy);
    await runWithCorrelation('als-fetch', async () => {
      await fetchWithCorrelation('https://example.test/ping');
    });
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    expect(headers?.['x-correlation-id']).toBe('als-fetch');
  });
});
