// compliance-gate — unit tests for checkOfacGate policy.
// Stubs Supabase with inline rows; no I/O.

import { describe, it, expect } from 'vitest';
import { checkOfacGate } from '../compliance-gate';

type ProfileRow = { contact_id: string; metadata: Record<string, unknown> | null };

function makeSupabase(profiles: ProfileRow[]) {
  return {
    from(table: string) {
      const filters: Array<{ col: string; val: unknown }> = [];
      const api = {
        select: (_c: string) => api,
        eq: (col: string, val: unknown) => { filters.push({ col, val }); return api; },
        maybeSingle: async () => {
          if (table !== 'capital_investor_profile') return { data: null, error: null };
          const cid = filters.find((f) => f.col === 'contact_id')?.val;
          const hit = profiles.find((p) => p.contact_id === cid);
          return { data: hit ?? null, error: null };
        },
      };
      return api;
    },
  } as unknown as Parameters<typeof checkOfacGate>[0]['supabase'];
}

describe('checkOfacGate', () => {
  it('allows clear outcome with no flag', async () => {
    const supabase = makeSupabase([
      { contact_id: 'c1', metadata: { compliance: { ofac: { outcome: 'clear', score: 0.1 } } } },
    ]);
    const result = await checkOfacGate({ supabase, contactId: 'c1' });
    expect(result).toEqual({ allow: true });
  });

  it('allows review outcome with flag=review', async () => {
    const supabase = makeSupabase([
      { contact_id: 'c1', metadata: { compliance: { ofac: { outcome: 'review', score: 0.77 } } } },
    ]);
    const result = await checkOfacGate({ supabase, contactId: 'c1' });
    expect(result).toEqual({ allow: true, flag: 'review' });
  });

  it('blocks match outcome with OFAC_MATCH code and includes matchedRecord', async () => {
    const matched = { name: 'ROSNEFT', list: 'SDN', programs: ['UKRAINE'] };
    const supabase = makeSupabase([
      { contact_id: 'c1', metadata: { compliance: { ofac: { outcome: 'match', score: 0.98, matchedRecord: matched } } } },
    ]);
    const result = await checkOfacGate({ supabase, contactId: 'c1' });
    if (result.allow) throw new Error('expected block');
    expect(result.code).toBe('OFAC_MATCH');
    expect(result.matchedRecord).toEqual(matched);
  });

  it('allows with flag=unscreened when profile missing (default policy)', async () => {
    const supabase = makeSupabase([]);
    const result = await checkOfacGate({ supabase, contactId: 'c1' });
    expect(result).toEqual({ allow: true, flag: 'unscreened' });
  });

  it('allows with flag=unscreened when compliance.ofac absent', async () => {
    const supabase = makeSupabase([
      { contact_id: 'c1', metadata: { compliance: {} } },
    ]);
    const result = await checkOfacGate({ supabase, contactId: 'c1' });
    expect(result).toEqual({ allow: true, flag: 'unscreened' });
  });

  it('blocks with OFAC_UNSCREENED when requireScreening=true and profile missing', async () => {
    const supabase = makeSupabase([]);
    const result = await checkOfacGate({ supabase, contactId: 'c1', requireScreening: true });
    if (result.allow) throw new Error('expected block');
    expect(result.code).toBe('OFAC_UNSCREENED');
  });

  it('blocks match even when requireScreening=false (match always blocks)', async () => {
    const supabase = makeSupabase([
      { contact_id: 'c1', metadata: { compliance: { ofac: { outcome: 'match', score: 0.99 } } } },
    ]);
    const result = await checkOfacGate({ supabase, contactId: 'c1', requireScreening: false });
    if (result.allow) throw new Error('expected block');
    expect(result.code).toBe('OFAC_MATCH');
  });
});
