// Stripe inbound reconciliation adapter — unit tests.
// Mirror of Plaid adapter coverage; in-memory Supabase stub, no I/O.

import { describe, it, expect } from 'vitest';
import { createStripeAdapter, type StripePaymentIntentSucceeded } from '../stripe-adapter';

type StubRow = Record<string, unknown>;
type StubState = {
  contacts: StubRow[];
  commitments: StubRow[];
};

function makeStub(state: StubState) {
  // Minimal supabase-js surface exercised by the adapter:
  //   .from(table).select(cols).contains(col, partial).maybeSingle()
  //   .from(table).select(cols).eq(col,val).in(col,arr).gte(col,val).lte(col,val)
  const builder = (table: string) => {
    const filters: Array<{ op: string; col: string; val: unknown }> = [];
    let containsFilter: { col: string; partial: Record<string, unknown> } | null = null;
    const api = {
      select: (_cols: string) => api,
      eq: (col: string, val: unknown) => { filters.push({ op: 'eq', col, val }); return api; },
      in: (col: string, val: unknown[]) => { filters.push({ op: 'in', col, val }); return api; },
      gte: (col: string, val: unknown) => { filters.push({ op: 'gte', col, val }); return api; },
      lte: (col: string, val: unknown) => { filters.push({ op: 'lte', col, val }); return api; },
      contains: (col: string, partial: Record<string, unknown>) => { containsFilter = { col, partial }; return api; },
      maybeSingle: async () => {
        const rows = run();
        return { data: rows[0] ?? null, error: null };
      },
      then: undefined as unknown,
    };

    function run(): StubRow[] {
      const source = table === 'crm_contacts' ? state.contacts : state.commitments;
      return source.filter((r) => {
        if (containsFilter) {
          const field = r[containsFilter.col] as Record<string, unknown> | undefined;
          if (!field) return false;
          for (const [k, v] of Object.entries(containsFilter.partial)) {
            if (field[k] !== v) return false;
          }
        }
        for (const f of filters) {
          const v = r[f.col];
          if (f.op === 'eq' && v !== f.val) return false;
          if (f.op === 'in' && !(f.val as unknown[]).includes(v)) return false;
          if (f.op === 'gte' && !(String(v) >= String(f.val))) return false;
          if (f.op === 'lte' && !(String(v) <= String(f.val))) return false;
        }
        return true;
      });
    }

    // Thenable so `await builder` resolves to the full row list (used when
    // no maybeSingle is called — mirrors how the adapter consumes the
    // capital_commitments query).
    (api as unknown as { then: (cb: (v: { data: unknown; error: null }) => unknown) => unknown }).then = (cb) => {
      return Promise.resolve({ data: run(), error: null }).then(cb);
    };
    return api;
  };

  return { from: (table: string) => builder(table) } as unknown as Parameters<typeof createStripeAdapter>[0]['supabase'];
}

const baseEvent: StripePaymentIntentSucceeded = {
  id: 'pi_test_abc',
  object: 'payment_intent',
  amount: 5000_00,               // $5,000
  amount_received: 5000_00,
  currency: 'usd',
  status: 'succeeded',
  customer: 'cus_test_1',
  payment_method_types: ['card'],
  created: Math.floor(new Date('2026-04-15T12:00:00Z').getTime() / 1000),
  metadata: {},
};

describe('createStripeAdapter', () => {
  it('fast-paths when metadata.capital_commitment_id is explicit', async () => {
    const adapter = createStripeAdapter({ supabase: null });
    const out = await adapter.fromForeign({
      ...baseEvent,
      metadata: { capital_commitment_id: 'commit_explicit_1' },
    });
    expect(out).not.toBeNull();
    expect(out!.commitmentId).toBe('commit_explicit_1');
    expect(out!.matchDiagnostics.strategy).toBe('stripe-metadata.capital_commitment_id');
    expect(out!.matchDiagnostics.unambiguous).toBe(true);
  });

  it('skips commerce-owned intents', async () => {
    const adapter = createStripeAdapter({ supabase: null });
    const out = await adapter.fromForeign({
      ...baseEvent,
      metadata: { commerce_order_id: 'ord_1' },
    });
    expect(out).toBeNull();
  });

  it('skips non-succeeded intents', async () => {
    const adapter = createStripeAdapter({ supabase: null });
    const out = await adapter.fromForeign({ ...baseEvent, status: 'requires_action' });
    expect(out).toBeNull();
  });

  it('skips non-USD intents', async () => {
    const adapter = createStripeAdapter({ supabase: null });
    const out = await adapter.fromForeign({ ...baseEvent, currency: 'cad' });
    expect(out).toBeNull();
  });

  it('reports unmatched when no contact has the stripe_customer_id stamped', async () => {
    const supabase = makeStub({
      contacts: [],
      commitments: [],
    });
    const adapter = createStripeAdapter({ supabase });
    const out = await adapter.fromForeign(baseEvent);
    expect(out).not.toBeNull();
    expect(out!.commitmentId).toBeNull();
    expect(out!.contactId).toBeNull();
    expect(out!.matchDiagnostics.candidates).toBe(0);
    expect(out!.matchDiagnostics.unambiguous).toBe(false);
  });

  it('reconciles unambiguous single-commitment match by customer+amount+date', async () => {
    const supabase = makeStub({
      contacts: [{ id: 'contact_1', metadata: { stripe_customer_id: 'cus_test_1' } }],
      commitments: [
        {
          id: 'commit_1',
          contact_id: 'contact_1',
          status: 'signed',
          amount_usd: '5000.00',
          created_at: '2026-04-15T11:30:00Z',
        },
      ],
    });
    const adapter = createStripeAdapter({ supabase });
    const out = await adapter.fromForeign(baseEvent);
    expect(out!.commitmentId).toBe('commit_1');
    expect(out!.contactId).toBe('contact_1');
    expect(out!.matchDiagnostics.unambiguous).toBe(true);
    expect(out!.matchDiagnostics.candidates).toBe(1);
    expect(out!.paymentMethod).toBe('other'); // card → 'other' per DB CHECK
    expect(out!.paymentReference).toBe('pi_test_abc');
  });

  it('flags ambiguous multi-match as review_needed', async () => {
    const supabase = makeStub({
      contacts: [{ id: 'contact_1', metadata: { stripe_customer_id: 'cus_test_1' } }],
      commitments: [
        { id: 'commit_a', contact_id: 'contact_1', status: 'signed', amount_usd: '5000.00', created_at: '2026-04-15T11:30:00Z' },
        { id: 'commit_b', contact_id: 'contact_1', status: 'signed', amount_usd: '5000.00', created_at: '2026-04-15T12:10:00Z' },
      ],
    });
    const adapter = createStripeAdapter({ supabase });
    const out = await adapter.fromForeign(baseEvent);
    expect(out!.commitmentId).toBeNull();
    expect(out!.contactId).toBe('contact_1');
    expect(out!.matchDiagnostics.candidates).toBe(2);
    expect(out!.matchDiagnostics.unambiguous).toBe(false);
  });

  it('maps us_bank_account payment_method_types to ach', async () => {
    const adapter = createStripeAdapter({ supabase: null });
    const out = await adapter.fromForeign({
      ...baseEvent,
      metadata: { capital_commitment_id: 'commit_x' },
      payment_method_types: ['us_bank_account'],
    });
    expect(out!.paymentMethod).toBe('ach');
  });
});
