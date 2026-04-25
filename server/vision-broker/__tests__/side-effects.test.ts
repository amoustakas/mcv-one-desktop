// side-effects.test.ts — drives withSideEffectCapture against a
// synthetic CdpSession with an event-bus seam, simulating the CDP
// lifecycle of an action that triggers 2 POSTs + 1 GET + 1 cross-
// origin frame nav. No real Chromium needed.
//
// What we assert:
//   - networkRequests captures all 3 with correct method/status/url
//   - formSubmits counts the 2 hasPostData requests
//   - crossOriginNavigations contains only the cross-origin nav
//   - same-origin frame navs and subframe navs are NOT included
//   - subscription teardown runs even when fn throws

import { describe, expect, it } from 'vitest';

import type { CdpSession } from '@mcv/vision';

import { withSideEffectCapture } from '../side-effects';

// ---------------------------------------------------------------------------
// Synthetic CdpSession — event bus + send() recorder + leaked-handler check
// ---------------------------------------------------------------------------

interface MockCdp extends CdpSession {
  emit(event: string, params?: unknown): void;
  /** Number of currently-subscribed handlers across all events.
   *  Used to verify cleanup happens. */
  handlerCount(): number;
  sentCommands: string[];
}

function createMockCdp(): MockCdp {
  const handlers = new Map<string, Set<(params: unknown) => void>>();
  const sent: string[] = [];

  return {
    sentCommands: sent,
    async send(method: string): Promise<unknown> {
      sent.push(method);
      return {};
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
    handlerCount(): number {
      let n = 0;
      for (const set of handlers.values()) n += set.size;
      return n;
    },
  };
}

describe('vision-broker · withSideEffectCapture', () => {
  it('captures network requests, form submits, and cross-origin nav', async () => {
    const cdp = createMockCdp();

    const { result, sideEffects } = await withSideEffectCapture(
      cdp,
      'https://app.mcv.dev/dashboard',
      async () => {
        // Simulate action lifecycle: 2 POSTs + 1 GET + 1 cross-origin nav.
        cdp.emit('Network.requestWillBeSent', {
          requestId: 'r1',
          request: { url: 'https://app.mcv.dev/api/save', method: 'POST', hasPostData: true },
        });
        cdp.emit('Network.responseReceived', {
          requestId: 'r1',
          response: { url: 'https://app.mcv.dev/api/save', status: 201 },
        });

        cdp.emit('Network.requestWillBeSent', {
          requestId: 'r2',
          request: { url: 'https://app.mcv.dev/api/notify', method: 'POST', hasPostData: true },
        });
        cdp.emit('Network.responseReceived', {
          requestId: 'r2',
          response: { url: 'https://app.mcv.dev/api/notify', status: 200 },
        });

        cdp.emit('Network.requestWillBeSent', {
          requestId: 'r3',
          request: { url: 'https://app.mcv.dev/api/poll', method: 'GET', hasPostData: false },
        });
        cdp.emit('Network.responseReceived', {
          requestId: 'r3',
          response: { url: 'https://app.mcv.dev/api/poll', status: 200 },
        });

        cdp.emit('Page.frameNavigated', {
          frame: { url: 'https://stripe.com/checkout/session/cs_test' },
        });

        return 'action-payload';
      },
    );

    expect(result).toBe('action-payload');

    // 3 network requests captured, in the order responses arrived.
    expect(sideEffects.networkRequests).toHaveLength(3);
    expect(sideEffects.networkRequests[0]).toEqual({
      method: 'POST',
      url: 'https://app.mcv.dev/api/save',
      status: 201,
    });
    expect(sideEffects.networkRequests[1]).toEqual({
      method: 'POST',
      url: 'https://app.mcv.dev/api/notify',
      status: 200,
    });
    expect(sideEffects.networkRequests[2]).toEqual({
      method: 'GET',
      url: 'https://app.mcv.dev/api/poll',
      status: 200,
    });

    // 2 form submits (the hasPostData=true requests).
    expect(sideEffects.formSubmits).toBe(2);

    // 1 cross-origin navigation.
    expect(sideEffects.crossOriginNavigations).toEqual([
      'https://stripe.com/checkout/session/cs_test',
    ]);

    // Network.enable + Page.enable were sent on entry.
    expect(cdp.sentCommands).toContain('Network.enable');
    expect(cdp.sentCommands).toContain('Page.enable');
  });

  it('ignores same-origin and subframe navigations', async () => {
    const cdp = createMockCdp();

    const { sideEffects } = await withSideEffectCapture(
      cdp,
      'https://app.mcv.dev/dashboard',
      async () => {
        // Same-origin top-level — should NOT be flagged.
        cdp.emit('Page.frameNavigated', {
          frame: { url: 'https://app.mcv.dev/dashboard/settings' },
        });
        // Cross-origin SUBFRAME — should NOT be flagged (parentId set).
        cdp.emit('Page.frameNavigated', {
          frame: { url: 'https://ads.example.com/iframe', parentId: 'parent-1' },
        });
        // Cross-origin top-level — should be flagged.
        cdp.emit('Page.frameNavigated', {
          frame: { url: 'https://attacker.example.com/' },
        });
      },
    );

    expect(sideEffects.crossOriginNavigations).toEqual([
      'https://attacker.example.com/',
    ]);
  });

  it('tears down all event subscriptions even when fn throws', async () => {
    const cdp = createMockCdp();
    const before = cdp.handlerCount();

    await expect(
      withSideEffectCapture(cdp, 'https://app.mcv.dev/', async () => {
        throw new Error('action blew up');
      }),
    ).rejects.toThrow('action blew up');

    // All 3 subscriptions (request / response / frameNavigated) cleaned up.
    expect(cdp.handlerCount()).toBe(before);
  });

  it('returns empty SideEffectSummary when nothing happens during fn', async () => {
    const cdp = createMockCdp();

    const { sideEffects } = await withSideEffectCapture(
      cdp,
      'https://app.mcv.dev/',
      async () => 'noop',
    );

    expect(sideEffects.networkRequests).toEqual([]);
    expect(sideEffects.crossOriginNavigations).toEqual([]);
    expect(sideEffects.formSubmits).toBe(0);
  });

  it('falls back to response.url when method/url maps lack the requestId', async () => {
    const cdp = createMockCdp();

    const { sideEffects } = await withSideEffectCapture(
      cdp,
      'https://app.mcv.dev/',
      async () => {
        // Response arrives WITHOUT a prior requestWillBeSent — happens
        // when subscription started mid-flight. Fallback path uses
        // the response payload directly.
        cdp.emit('Network.responseReceived', {
          requestId: 'orphan',
          response: { url: 'https://app.mcv.dev/api/late', status: 304 },
        });
      },
    );

    expect(sideEffects.networkRequests).toEqual([
      { method: 'GET', url: 'https://app.mcv.dev/api/late', status: 304 },
    ]);
  });
});
