// PlaidAdapter — unit tests for the inbound mapping logic.
// Uses a stub Supabase to validate match strategies.

import { describe, it, expect, vi } from 'vitest';
import { createPlaidAdapter, type PlaidTransferSettled } from '../adapters/plaid-adapter';

type SupabaseStub = {
  from: (table: string) => unknown;
};

function makeStub(seed: {
  contacts?: Array<{ id: string; metadata: Record<string, unknown> }>;
  commitments?: Array<{ id: string; contact_id: string; amount_usd: number; status: string; created_at: string }>;
}): SupabaseStub {
  const contacts = seed.contacts ?? [];
  const commitments = seed.commitments ?? [];

  return {
    from(table: string) {
      const filters: Array<{ col: string; val: unknown }> = [];
      let containsFilter: Record<string, unknown> | null = null;

      const builder: Record<string, unknown> = {
        select() { return builder; },
        eq(col: string, val: unknown) { filters.push({ col, val }); return builder; },
        in(col: string, vals: unknown[]) { filters.push({ col, val: vals }); return builder; },
        gte() { return builder; },
        lte() { return builder; },
        contains(_col: string, val: Record<string, unknown>) { containsFilter = val; return builder; },
        maybeSingle() {
          if (table === 'crm_contacts' && containsFilter) {
            const acct = containsFilter.plaid_account_id;
            const found = contacts.find((c) => c.metadata?.plaid_account_id === acct);
            return Promise.resolve({ data: found ?? null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(onF: (r: { data: unknown; error: null }) => unknown) {
          if (table === 'capital_commitments') {
            const cidFilter = filters.find((f) => f.col === 'contact_id')?.val;
            const rows = commitments.filter((c) => !cidFilter || c.contact_id === cidFilter);
            return Promise.resolve({ data: rows, error: null }).then(onF);
          }
          return Promise.resolve({ data: [], error: null }).then(onF);
        },
      };
      return builder;
    },
  };
}

const sample = (overrides: Partial<PlaidTransferSettled> = {}): PlaidTransferSettled => ({
  transfer_id: 'txfr_abc123',
  account_id: 'acc_tony',
  amount: '25000.00',
  iso_currency_code: 'USD',
  type: 'credit',
  status: 'settled',
  description: 'ACH credit',
  posted_at: '2026-04-15T10:00:00Z',
  ...overrides,
});

describe('PlaidAdapter', () => {
  it('skips non-settled events', async () => {
    const adapter = createPlaidAdapter({ supabase: makeStub({}) as never });
    const result = await adapter.fromForeign(sample({ status: 'pending' as never }));
    expect(result).toBeNull();
  });

  it('skips debit events (outbound money)', async () => {
    const adapter = createPlaidAdapter({ supabase: makeStub({}) as never });
    const result = await adapter.fromForeign(sample({ type: 'debit' }));
    expect(result).toBeNull();
  });

  it('skips non-USD events', async () => {
    const adapter = createPlaidAdapter({ supabase: makeStub({}) as never });
    const result = await adapter.fromForeign(sample({ iso_currency_code: 'EUR' as never }));
    expect(result).toBeNull();
  });

  it('maps unmatched settled credit (no contact linked) to null commitment + null contact', async () => {
    const adapter = createPlaidAdapter({ supabase: makeStub({}) as never });
    const result = await adapter.fromForeign(sample());
    expect(result).not.toBeNull();
    expect(result!.commitmentId).toBeNull();
    expect(result!.contactId).toBeNull();
    expect(result!.amountUsd).toBe(25000);
    expect(result!.paymentMethod).toBe('ach');
    expect(result!.paymentReference).toBe('txfr_abc123');
    expect(result!.matchDiagnostics.unambiguous).toBe(false);
  });

  it('matches contact by plaid_account_id + unambiguous commitment by amount+window', async () => {
    const stub = makeStub({
      contacts: [{ id: 'c-tony', metadata: { plaid_account_id: 'acc_tony' } }],
      commitments: [
        { id: 'comm-1', contact_id: 'c-tony', amount_usd: 25000, status: 'signed', created_at: '2026-04-14T10:00:00Z' },
      ],
    });
    const adapter = createPlaidAdapter({ supabase: stub as never });
    const result = await adapter.fromForeign(sample());
    expect(result!.contactId).toBe('c-tony');
    expect(result!.commitmentId).toBe('comm-1');
    expect(result!.matchDiagnostics.candidates).toBe(1);
    expect(result!.matchDiagnostics.unambiguous).toBe(true);
  });

  it('flags ambiguous match when multiple commitments share amount+window', async () => {
    const stub = makeStub({
      contacts: [{ id: 'c-tony', metadata: { plaid_account_id: 'acc_tony' } }],
      commitments: [
        { id: 'comm-1', contact_id: 'c-tony', amount_usd: 25000, status: 'signed', created_at: '2026-04-14T10:00:00Z' },
        { id: 'comm-2', contact_id: 'c-tony', amount_usd: 25000, status: 'pending_wire', created_at: '2026-04-14T12:00:00Z' },
      ],
    });
    const adapter = createPlaidAdapter({ supabase: stub as never });
    const result = await adapter.fromForeign(sample());
    expect(result!.commitmentId).toBeNull(); // ambiguous → manual review
    expect(result!.matchDiagnostics.candidates).toBe(2);
    expect(result!.matchDiagnostics.unambiguous).toBe(false);
  });

  it('detects wire based on description keyword', async () => {
    const adapter = createPlaidAdapter({ supabase: makeStub({}) as never });
    const result = await adapter.fromForeign(sample({ description: 'Wire from Fidelity' }));
    expect(result!.paymentMethod).toBe('wire');
  });

  it('adapter id is "plaid" (legacy registry key)', () => {
    const adapter = createPlaidAdapter({ supabase: null });
    expect(adapter.id).toBe('plaid');
  });
});
