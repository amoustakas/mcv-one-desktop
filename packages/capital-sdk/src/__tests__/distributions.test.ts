// Distributions service + ecosystem bridge tests.
// Uses an in-memory Supabase stub + mock LedgerAdapter/PaymentRouter to
// verify the composition without hitting a real DB.

import { describe, it, expect, vi } from 'vitest';
import {
  createDistributionsService,
  type LedgerAdapterLike,
  type PaymentRouterLike,
} from '../distributions-service';
import {
  createNotificationsBridge,
  createVenturesBridge,
  setCapitalPaymentRouter,
  getCapitalPaymentRouter,
} from '../ecosystem-bridges';

type StubState = {
  distributions: Map<string, Record<string, unknown>>;
  recipients: Map<string, Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  ventures: Map<string, Record<string, unknown>>;
};

function makeStubSupabase(state: StubState) {
  const genId = () => Math.random().toString(36).slice(2, 10);
  type Filter = { col: string; val: unknown };

  const makeBuilder = (table: string) => {
    const filters: Filter[] = [];
    let insertPayload: unknown = undefined;
    let updatePayload: unknown = undefined;

    const runQuery = async (): Promise<{ data: unknown; error: { message: string } | null }> => {
      try {
        if (table === 'capital_distributions') {
          if (insertPayload) {
            const p = insertPayload as Record<string, unknown>;
            const id = genId();
            const row = { id, total_recipients: 0, total_paid: 0, ...p, created_at: 'ts', updated_at: 'ts' };
            state.distributions.set(id, row);
            return { data: row, error: null };
          }
          if (updatePayload) {
            const targetId = filters.find((f) => f.col === 'id')?.val as string | undefined;
            if (!targetId) return { data: null, error: { message: 'no id filter' } };
            const row = state.distributions.get(targetId);
            if (!row) return { data: null, error: { message: 'not found' } };
            const updated = { ...row, ...(updatePayload as Record<string, unknown>) };
            state.distributions.set(targetId, updated);
            return { data: updated, error: null };
          }
          const targetId = filters.find((f) => f.col === 'id')?.val as string | undefined;
          if (targetId) {
            const row = state.distributions.get(targetId);
            return { data: row ?? null, error: null };
          }
          const ventureFilter = filters.find((f) => f.col === 'venture_id')?.val;
          const rows = [...state.distributions.values()].filter((r) => !ventureFilter || r.venture_id === ventureFilter);
          return { data: rows, error: null };
        }
        if (table === 'capital_distribution_recipients') {
          if (insertPayload) {
            const payload = Array.isArray(insertPayload) ? insertPayload : [insertPayload];
            const inserted = payload.map((p) => {
              const row = { id: genId(), status: 'pending', amount_usd: 0, tax_withheld: 0, ...(p as Record<string, unknown>), created_at: 'ts', updated_at: 'ts' };
              state.recipients.set(row.id as string, row);
              return row;
            });
            return { data: inserted, error: null };
          }
          if (updatePayload) {
            const targetId = filters.find((f) => f.col === 'id')?.val as string;
            const row = state.recipients.get(targetId);
            if (!row) return { data: null, error: { message: 'not found' } };
            const updated = { ...row, ...(updatePayload as Record<string, unknown>) };
            state.recipients.set(targetId, updated);
            return { data: updated, error: null };
          }
          const distFilter = filters.find((f) => f.col === 'distribution_id')?.val;
          const rows = [...state.recipients.values()].filter((r) => !distFilter || r.distribution_id === distFilter);
          return { data: rows, error: null };
        }
        if (table === 'notifications') {
          if (insertPayload) {
            state.notifications.push(insertPayload as Record<string, unknown>);
            return { data: insertPayload, error: null };
          }
        }
        if (table === 'ventures') {
          const targetId = filters.find((f) => f.col === 'id')?.val as string | undefined;
          if (targetId) return { data: state.ventures.get(targetId) ?? null, error: null };
          return { data: [...state.ventures.values()], error: null };
        }
        return { data: null, error: { message: `unhandled ${table}` } };
      } catch (err) {
        return { data: null, error: { message: String(err) } };
      }
    };

    const chain: Record<string, unknown> = {
      insert(payload: unknown) { insertPayload = payload; return chain; },
      update(payload: unknown) { updatePayload = payload; return chain; },
      select() { return chain; },
      eq(col: string, val: unknown) { filters.push({ col, val }); return chain; },
      order() { return chain; },
      limit() { return chain; },
      single() { return runQuery(); },
      maybeSingle() { return runQuery(); },
      then(onFulfilled: (r: unknown) => unknown) { return runQuery().then(onFulfilled); },
    };
    return chain;
  };

  return { from(table: string) { return makeBuilder(table); } };
}

function newState(): StubState {
  return {
    distributions: new Map(),
    recipients: new Map(),
    notifications: [],
    ventures: new Map(),
  };
}

describe('DistributionsService', () => {
  it('creates a distribution with per-recipient line items', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;
    const svc = createDistributionsService({ supabase: sb });
    const dist = await svc.createDistribution({
      ventureId: 'betedge',
      distributionType: 'dividend',
      totalAmount: 10000,
      currency: 'USD',
      recipients: [
        { contactId: 'c1', amount: 6000, amountUsd: 6000 },
        { contactId: 'c2', amount: 4000, amountUsd: 4000 },
      ],
    });
    expect(dist.ventureId).toBe('betedge');
    expect(dist.distributionType).toBe('dividend');
    expect(dist.totalAmount).toBe(10000);
    expect(state.recipients.size).toBe(2);
  });

  it('processes a distribution: posts journal entry when ledger configured, marks recipients paid', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;

    const ledger: LedgerAdapterLike = {
      getAccountByCode: vi.fn(async (_v, code) => ({ id: `acct-${code}`, code })),
      createJournalEntry: vi.fn(async () => ({ id: 'je-1' })),
      postJournalEntry: vi.fn(async () => ({ ok: true })),
    };

    const svc = createDistributionsService({ supabase: sb, ledger });
    const dist = await svc.createDistribution({
      ventureId: 'betedge',
      distributionType: 'dividend',
      totalAmount: 10000,
      recipients: [{ contactId: 'c1', amount: 10000, amountUsd: 10000 }],
    });

    const processed = await svc.processDistribution(dist.id, 'tony');

    expect(processed.status).toBe('completed');
    expect(ledger.getAccountByCode).toHaveBeenCalledTimes(2); // cash + source
    expect(ledger.createJournalEntry).toHaveBeenCalledOnce();
    expect(ledger.postJournalEntry).toHaveBeenCalledOnce();

    // Recipient was marked paid
    const recipients = [...state.recipients.values()];
    expect(recipients[0].status).toBe('paid');
  });

  it('routes payments via PaymentRouter when configured', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;

    const paymentRouter: PaymentRouterLike = {
      processPayment: vi.fn(async () => ({
        result: { success: true, reference: 'pay-123' },
        decision: {},
      })),
    };

    const svc = createDistributionsService({ supabase: sb, paymentRouter });
    const dist = await svc.createDistribution({
      ventureId: 'betedge',
      distributionType: 'yield',
      totalAmount: 500,
      recipients: [{ contactId: 'c1', amount: 500, amountUsd: 500, paymentMethod: 'crypto_usdc' }],
    });

    const processed = await svc.processDistribution(dist.id);
    expect(processed.status).toBe('completed');
    expect(paymentRouter.processPayment).toHaveBeenCalledOnce();
    expect(paymentRouter.processPayment).toHaveBeenCalledWith(expect.objectContaining({
      amount: 500, currency: 'USD', method: 'crypto_usdc',
    }));

    const recipients = [...state.recipients.values()];
    expect(recipients[0].status).toBe('paid');
    expect(recipients[0].payment_reference).toBe('pay-123');
  });

  it('marks partial status when some payments fail', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;

    let callCount = 0;
    const paymentRouter: PaymentRouterLike = {
      processPayment: vi.fn(async () => {
        callCount++;
        return callCount === 1
          ? { result: { success: true, reference: 'ok' }, decision: {} }
          : { result: { success: false, error: 'insufficient funds' }, decision: {} };
      }),
    };

    const svc = createDistributionsService({ supabase: sb, paymentRouter });
    const dist = await svc.createDistribution({
      ventureId: 'betedge',
      distributionType: 'dividend',
      totalAmount: 200,
      recipients: [
        { contactId: 'c1', amount: 100, amountUsd: 100, paymentMethod: 'wire_usd' },
        { contactId: 'c2', amount: 100, amountUsd: 100, paymentMethod: 'wire_usd' },
      ],
    });
    const processed = await svc.processDistribution(dist.id);
    expect(processed.status).toBe('partial');
  });

  it('degrades gracefully with null supabase', async () => {
    const svc = createDistributionsService({ supabase: null });
    expect(await svc.listDistributions('any')).toEqual([]);
    expect(await svc.getDistribution('any')).toBeNull();
  });
});

describe('NotificationsBridge', () => {
  it('writes to notifications table with capital source', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;
    const bridge = createNotificationsBridge(sb);
    await bridge.notify({ title: 'Test', description: 'body', ventureId: 'betedge' });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].source).toBe('capital');
    expect(state.notifications[0].venture_id).toBe('betedge');
  });

  it('publishCapitalEvent writes a notification with the topic decoded as title', async () => {
    const state = newState();
    const sb = makeStubSupabase(state) as never;
    const bridge = createNotificationsBridge(sb);
    await bridge.publishCapitalEvent('capital.round.funded', { round_id: 'r1' }, { ventureId: 'betedge', type: 'success' });
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('success');
  });

  it('swallows errors from notify (best-effort)', async () => {
    const bridge = createNotificationsBridge(null);
    await expect(bridge.notify({ title: 'x' })).resolves.toBeUndefined();
  });
});

describe('VenturesBridge', () => {
  it('resolves venture by id', async () => {
    const state = newState();
    state.ventures.set('betedge', {
      id: 'betedge', name: 'BetEdge AI', slug: 'betedge', domain: 'betedge.ai',
      color: '#FF0000', icon: 'B', tier: 2, clerk_org_id: null, status: 'active',
      white_label: null, custom_domains: [],
    });
    const sb = makeStubSupabase(state) as never;
    const bridge = createVenturesBridge(sb);
    const v = await bridge.getVenture('betedge');
    expect(v?.name).toBe('BetEdge AI');
    expect(v?.color).toBe('#FF0000');
  });

  it('clerk org check allows null (shared root) and exact match', async () => {
    const state = newState();
    state.ventures.set('shared', { id: 'shared', name: 'Shared', status: 'active', clerk_org_id: null });
    state.ventures.set('scoped', { id: 'scoped', name: 'Scoped', status: 'active', clerk_org_id: 'org_abc' });
    const sb = makeStubSupabase(state) as never;
    const bridge = createVenturesBridge(sb);

    expect(await bridge.isVentureClerkOrg('shared', 'org_anything')).toBe(true);
    expect(await bridge.isVentureClerkOrg('scoped', 'org_abc')).toBe(true);
    expect(await bridge.isVentureClerkOrg('scoped', 'org_wrong')).toBe(false);
    expect(await bridge.isVentureClerkOrg('scoped', null)).toBe(false);
  });
});

describe('Payment router singleton', () => {
  it('starts null, can be set + read', () => {
    setCapitalPaymentRouter(null);
    expect(getCapitalPaymentRouter()).toBeNull();
    const router: PaymentRouterLike = { processPayment: async () => ({ result: { success: true }, decision: {} }) };
    setCapitalPaymentRouter(router);
    expect(getCapitalPaymentRouter()).toBe(router);
    setCapitalPaymentRouter(null);
  });
});
