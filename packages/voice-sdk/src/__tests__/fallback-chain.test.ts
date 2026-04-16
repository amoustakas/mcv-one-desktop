// @mcv/voice-sdk — FallbackChain contract tests.

import { describe, it, expect, vi } from 'vitest';
import { FallbackChain, type FallbackCandidate } from '../router/FallbackChain';

const candidates: FallbackCandidate[] = [
  { provider: 'gemini-live', reason: 'primary' },
  { provider: 'elevenlabs', reason: 'fallback-1' },
  { provider: 'azure-speech', reason: 'fallback-2' },
];

describe('FallbackChain', () => {
  it('returns the primary result when it succeeds', async () => {
    const chain = new FallbackChain(candidates);
    const result = await chain.run(async (c) => `ok:${c.provider}`);
    expect(result.index).toBe(0);
    expect(result.candidate.provider).toBe('gemini-live');
    expect(result.value).toBe('ok:gemini-live');
  });

  it('advances to fallback-1 when primary throws', async () => {
    const chain = new FallbackChain(candidates);
    let calls = 0;
    const result = await chain.run(async (c) => {
      calls++;
      if (c.provider === 'gemini-live') throw new Error('boom');
      return `ok:${c.provider}`;
    });
    expect(calls).toBe(2);
    expect(result.index).toBe(1);
    expect(result.candidate.provider).toBe('elevenlabs');
  });

  it('advances past slow primary via timeout', async () => {
    const chain = new FallbackChain(candidates, { timeoutMs: 50 });
    const result = await chain.run(async (c) => {
      if (c.provider === 'gemini-live') {
        return new Promise((resolve) => setTimeout(() => resolve('slow'), 500));
      }
      return `ok:${c.provider}`;
    });
    expect(result.candidate.provider).toBe('elevenlabs');
  });

  it('exhausts and throws when all candidates fail', async () => {
    const chain = new FallbackChain(candidates);
    await expect(chain.run(async () => { throw new Error('all down'); })).rejects.toThrow(/exhausted/);
  });

  it('emits failure + success callbacks', async () => {
    const onFailure = vi.fn();
    const onSuccess = vi.fn();
    const chain = new FallbackChain(candidates, { onFailure, onSuccess });
    await chain.run(async (c) => {
      if (c.provider === 'gemini-live') throw new Error('primary down');
      return c.provider;
    });
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('throws on empty candidate list', () => {
    expect(() => new FallbackChain([])).toThrow();
  });
});
