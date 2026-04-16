// MCV-1 contract tests: events.ts + venture-adapter.ts + event-publisher.ts.
// No DB. No network. Pure shape + behavior verification.

import { describe, it, expect, vi } from 'vitest';
import {
  CapitalEvent,
  CAPITAL_EVENT_TOPICS,
  composePublishers,
  nullEventPublisher,
  type CapitalEventPublisher,
} from '../events';
import { createVentureAdapter } from '../venture-adapter';
import {
  createConsolePublisher,
  createFabricPublisher,
} from '../event-publisher';

describe('CapitalEvent (Zod)', () => {
  const base = {
    id: 'evt_1',
    ts: '2026-04-16T00:00:00Z',
    ventureId: 'futurestate',
    actor: { kind: 'system' as const },
  };

  it('accepts every declared topic', () => {
    for (const topic of CAPITAL_EVENT_TOPICS) {
      const payload = topicToMinPayload(topic);
      const parsed = CapitalEvent.safeParse({ ...base, topic, payload });
      expect(parsed.success, `topic ${topic} failed: ${parsed.success ? '' : JSON.stringify(parsed.error.issues)}`).toBe(true);
    }
  });

  it('rejects an unknown topic', () => {
    const parsed = CapitalEvent.safeParse({ ...base, topic: 'capital.bogus', payload: {} });
    expect(parsed.success).toBe(false);
  });

  it('rejects bill.paid with missing required fields', () => {
    const parsed = CapitalEvent.safeParse({
      ...base,
      topic: 'capital.bill.paid',
      payload: { billId: 'b_1' }, // missing amount, currency
    });
    expect(parsed.success).toBe(false);
  });

  it('coerces actor shape', () => {
    const parsed = CapitalEvent.safeParse({
      ...base,
      actor: { kind: 'user', id: 'u_1', label: 'Tony' },
      topic: 'capital.bill.paid',
      payload: { billId: 'b_1', amount: 100, currency: 'CAD' },
    });
    expect(parsed.success).toBe(true);
  });
});

describe('composePublishers', () => {
  it('fans out to all and swallows individual failures', async () => {
    const seen: string[] = [];
    const good: CapitalEventPublisher = { async publish(e) { seen.push(`good:${e.topic}`); } };
    const bad: CapitalEventPublisher = { async publish() { throw new Error('boom'); } };
    const combo = composePublishers(good, bad, good);

    await combo.publish({
      id: 'e', ts: 't', ventureId: 'v', actor: { kind: 'system' },
      topic: 'capital.bill.paid',
      payload: { billId: 'b', amount: 1, currency: 'CAD' },
    } as CapitalEvent);

    expect(seen).toEqual(['good:capital.bill.paid', 'good:capital.bill.paid']);
  });
});

describe('createVentureAdapter', () => {
  it('stamps ventureId, id, ts, and default actor', async () => {
    const published: CapitalEvent[] = [];
    const adapter = createVentureAdapter({
      ventureId: 'betedge',
      publisher: { async publish(e) { published.push(e); } },
      clock: () => '2026-04-16T12:00:00.000Z',
      uuid: () => 'evt_fixed',
    });

    await adapter.emitBillPaid({ billId: 'b_1', amount: 250, currency: 'USD' });

    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      id: 'evt_fixed',
      ts: '2026-04-16T12:00:00.000Z',
      ventureId: 'betedge',
      topic: 'capital.bill.paid',
      actor: { kind: 'system' },
      payload: { billId: 'b_1', amount: 250, currency: 'USD' },
    });
  });

  it('accepts per-emit actor + correlationId + metadata overrides', async () => {
    const published: CapitalEvent[] = [];
    const adapter = createVentureAdapter({
      ventureId: 'futurestate',
      publisher: { async publish(e) { published.push(e); } },
    });

    await adapter.emitCommitmentCreated(
      { commitmentId: 'c_1', amount: 5000, currency: 'CAD' },
      { actor: { kind: 'user', id: 'u_1' }, correlationId: 'corr_1', metadata: { source: 'portal' } },
    );

    expect(published[0].actor).toEqual({ kind: 'user', id: 'u_1' });
    expect(published[0].correlationId).toBe('corr_1');
    expect(published[0].metadata).toEqual({ source: 'portal' });
  });

  it('never throws even when publisher rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = createVentureAdapter({
      ventureId: 'warforge',
      publisher: { async publish() { throw new Error('downstream dead'); } },
    });

    await expect(
      adapter.emitDistributionCompleted({
        distributionId: 'd_1', flowKind: 'ROYALTY_PAYOUT',
        totalAmount: 10, currency: 'USD', legCount: 1,
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('createFabricPublisher', () => {
  it('POSTs JSON with bearer auth', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 202 }));
    const pub = createFabricPublisher({
      url: 'https://fabric.mcv.one/events',
      token: 't0k3n',
      fetchImpl: fetchImpl as unknown as typeof globalThis.fetch,
    });

    await pub.publish({
      id: 'e', ts: 't', ventureId: 'mcvgg', actor: { kind: 'system' },
      topic: 'capital.distribution.completed',
      payload: { distributionId: 'd', flowKind: 'TOKEN_TGE_LAUNCH', totalAmount: 1, currency: 'USD', legCount: 1 },
    } as CapitalEvent);

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://fabric.mcv.one/events');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer t0k3n' });
  });

  it('swallows non-2xx response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    const pub = createFabricPublisher({
      url: 'x', fetchImpl: fetchImpl as unknown as typeof globalThis.fetch,
    });
    await pub.publish({
      id: 'e', ts: 't', ventureId: 'x', actor: { kind: 'system' },
      topic: 'capital.bill.paid', payload: { billId: 'b', amount: 1, currency: 'CAD' },
    } as CapitalEvent);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('createConsolePublisher + nullEventPublisher', () => {
  it('null publisher is a noop', async () => {
    await expect(
      nullEventPublisher.publish({
        id: 'e', ts: 't', ventureId: 'x', actor: { kind: 'system' },
        topic: 'capital.call.closed', payload: { callId: 'c' },
      } as CapitalEvent),
    ).resolves.toBeUndefined();
  });

  it('console publisher invokes custom logger', async () => {
    const logged: CapitalEvent[] = [];
    const pub = createConsolePublisher({ logger: (e) => logged.push(e) });
    await pub.publish({
      id: 'e', ts: 't', ventureId: 'x', actor: { kind: 'system' },
      topic: 'capital.call.closed', payload: { callId: 'c' },
    } as CapitalEvent);
    expect(logged).toHaveLength(1);
  });
});

// ─── helpers ──────────────────────────────────────────────────────────

function topicToMinPayload(topic: (typeof CAPITAL_EVENT_TOPICS)[number]): Record<string, unknown> {
  switch (topic) {
    case 'capital.call.created':     return { callId: 'c', targetAmount: 100, currency: 'CAD' };
    case 'capital.call.published':   return { callId: 'c' };
    case 'capital.call.funded':      return { callId: 'c', fundedAmount: 100, currency: 'CAD' };
    case 'capital.call.closed':      return { callId: 'c' };
    case 'capital.call.defaulted':   return { callId: 'c', defaultedAmount: 10, currency: 'CAD' };
    case 'capital.commitment.created':   return { commitmentId: 'x', amount: 1, currency: 'USD' };
    case 'capital.commitment.funded':    return { commitmentId: 'x', fundedAmount: 1, currency: 'USD' };
    case 'capital.commitment.withdrawn': return { commitmentId: 'x' };
    case 'capital.bill.generated':   return { billId: 'b', sourceType: 'capital_call_response', sourceId: 's', payeeType: 'property_spv', payeeId: 'p', amount: 1, currency: 'CAD' };
    case 'capital.bill.paid':        return { billId: 'b', amount: 1, currency: 'CAD' };
    case 'capital.bill.failed':      return { billId: 'b', reason: 'declined' };
    case 'capital.bill.reversed':    return { billId: 'b' };
    case 'capital.distribution.scheduled': return { distributionId: 'd', flowKind: 'RE_YIELD_DISTRIBUTION', sourceType: 'yield_payout', sourceId: 'y', totalAmount: 100, currency: 'CAD', scheduledAt: '2026-04-16T00:00:00Z' };
    case 'capital.distribution.completed': return { distributionId: 'd', flowKind: 'RE_YIELD_DISTRIBUTION', totalAmount: 100, currency: 'CAD', legCount: 5 };
    case 'capital.distribution.failed':    return { distributionId: 'd', reason: 'processor offline' };
    case 'capital.compliance.cleared': return { subjectType: 'contact', subjectId: 'u', ruleTypes: ['OFAC'] };
    case 'capital.compliance.review':  return { subjectType: 'contact', subjectId: 'u', ruleType: 'OFAC', reason: 'soft match' };
    case 'capital.compliance.blocked': return { subjectType: 'contact', subjectId: 'u', ruleType: 'OFAC', reason: 'strong match' };
  }
}
