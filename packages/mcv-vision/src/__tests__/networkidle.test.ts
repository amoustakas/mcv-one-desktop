// networkidle.test.ts — exercises wait({ kind: 'networkIdle' }) with a
// fully synthetic CdpSession that records sent commands and emits
// Network.* events on demand. No real Chromium needed; this is the
// only @mcv/vision test that does NOT spin up Playwright.
//
// The contract under test:
//   - wait() resolves when in-flight requests stay at 0 for ≥500ms
//   - a request that fires before the quiescence window resets it
//   - timeoutMs is honored even if requests keep firing
//   - getSnapshot() runs after the wait — so the mock must satisfy
//     the broader CdpSession interface (Target/Accessibility/etc.)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { wait } from '../actions';
import type { CdpSession } from '../snapshot';

// ---------------------------------------------------------------------------
// Synthetic CdpSession — minimal viable implementation of the structural
// interface, with an in-test handle for emitting events and replying to
// commands. getSnapshot() is invoked by wait() on success/failure paths so
// we stub the CDP commands it touches with empty-but-shaped payloads.
// ---------------------------------------------------------------------------

interface MockCdp extends CdpSession {
  emit(event: string, params?: unknown): void;
  sentCommands: string[];
}

function createMockCdp(): MockCdp {
  const handlers = new Map<string, Set<(params: unknown) => void>>();
  const sent: string[] = [];

  const cdp: MockCdp = {
    sentCommands: sent,
    async send(method: string): Promise<unknown> {
      sent.push(method);
      // Reply to the snapshot-pulling commands with empty-but-shaped data
      // so getSnapshot() (called on the success path of wait()) doesn't
      // throw. We don't assert on its output here.
      switch (method) {
        case 'Target.getTargetInfo':
          return { targetInfo: { url: 'about:blank', title: 'mock' } };
        case 'Accessibility.getFullAXTree':
          return { nodes: [] };
        case 'Page.getLayoutMetrics':
          return {
            cssVisualViewport: { clientWidth: 800, clientHeight: 600 },
          };
        case 'Page.captureScreenshot':
          return { data: '' };
        default:
          return {};
      }
    },
    on(event: string, handler: (params: unknown) => void): () => void {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => {
        handlers.get(event)?.delete(handler);
      };
    },
    emit(event: string, params: unknown = {}): void {
      const set = handlers.get(event);
      if (!set) return;
      for (const h of set) h(params);
    },
  };

  return cdp;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('@mcv/vision · wait({ kind: networkIdle })', () => {
  it('resolves immediately on cold-start when nothing is in flight', async () => {
    const cdp = createMockCdp();

    const promise = wait(cdp, { kind: 'networkIdle', timeoutMs: 5_000 });
    // Drain microtasks so the on()-subscriptions are wired and the
    // initial cold-start armQuiescenceTimerIfIdle() schedules a timer.
    await vi.advanceTimersByTimeAsync(0);
    // After 500ms of zero-flight, idle resolves and getSnapshot runs.
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result.ok).toBe(true);
    expect(cdp.sentCommands).toContain('Network.enable');
  });

  it('waits for in-flight requests to finish then settles', async () => {
    const cdp = createMockCdp();

    const promise = wait(cdp, { kind: 'networkIdle', timeoutMs: 5_000 });
    await vi.advanceTimersByTimeAsync(0); // wire subscriptions

    // Fire two requests, then finish them — quiescence window only arms
    // once the second one finishes.
    cdp.emit('Network.requestWillBeSent', { requestId: 'a' });
    cdp.emit('Network.requestWillBeSent', { requestId: 'b' });
    await vi.advanceTimersByTimeAsync(100);

    cdp.emit('Network.loadingFinished', { requestId: 'a' });
    // Still 1 in flight — should NOT settle yet.
    await vi.advanceTimersByTimeAsync(600);

    cdp.emit('Network.loadingFinished', { requestId: 'b' });
    // Now in-flight is 0; quiescence timer arms, fires after 500ms.
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result.ok).toBe(true);
  });

  it('resets the quiescence window when a new request fires inside it', async () => {
    const cdp = createMockCdp();

    const promise = wait(cdp, { kind: 'networkIdle', timeoutMs: 10_000 });
    await vi.advanceTimersByTimeAsync(0);

    cdp.emit('Network.requestWillBeSent', { requestId: 'a' });
    cdp.emit('Network.loadingFinished', { requestId: 'a' });
    // 200ms into the quiescence window…
    await vi.advanceTimersByTimeAsync(200);
    // …a fresh request bumps in-flight back to 1, must reset the timer.
    cdp.emit('Network.requestWillBeSent', { requestId: 'b' });
    await vi.advanceTimersByTimeAsync(400);
    // Even though 600ms total elapsed since the first finish, we should
    // NOT have settled — request b is still in flight.
    cdp.emit('Network.loadingFinished', { requestId: 'b' });
    // Now the FULL 500ms quiescence window applies.
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result.ok).toBe(true);
  });

  it('returns an error result when timeoutMs elapses without idle', async () => {
    const cdp = createMockCdp();

    const promise = wait(cdp, { kind: 'networkIdle', timeoutMs: 1_000 });
    await vi.advanceTimersByTimeAsync(0);

    // Keep a request open forever.
    cdp.emit('Network.requestWillBeSent', { requestId: 'never-finishes' });
    await vi.advanceTimersByTimeAsync(1_500);

    const result = await promise;
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  });

  it('treats Network.loadingFailed as a decrement (does not hang)', async () => {
    const cdp = createMockCdp();

    const promise = wait(cdp, { kind: 'networkIdle', timeoutMs: 5_000 });
    await vi.advanceTimersByTimeAsync(0);

    cdp.emit('Network.requestWillBeSent', { requestId: 'doomed' });
    cdp.emit('Network.loadingFailed', { requestId: 'doomed', errorText: 'net::ERR_ABORTED' });
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;
    expect(result.ok).toBe(true);
  });
});
