// ofac-sdn-cache — unit tests for loadSdnEntries + upsertSdnEntries.

import { describe, it, expect, vi } from 'vitest';
import { loadSdnEntries, upsertSdnEntries } from '../ofac-sdn-cache';
import { OFAC_SEED } from '../ofac-seed';

type TableRow = Record<string, unknown>;

interface StubState {
  entries: TableRow[];
  logs: TableRow[];
  upsertErr?: string;
}

function makeSupabase(state: StubState) {
  const builder = (table: string) => {
    const filters: Array<{ op: string; col: string; val: unknown }> = [];
    let pendingInsert: TableRow[] | null = null;
    let pendingUpdate: TableRow | null = null;
    let pendingDelete = false;
    let upsertConflict: string | undefined;

    const api = {
      select: (_c: string) => api,
      limit: (_n: number) => api,
      eq: (col: string, val: unknown) => { filters.push({ op: 'eq', col, val }); return api; },
      in: (col: string, val: unknown[]) => { filters.push({ op: 'in', col, val }); return api; },
      insert: (rows: TableRow | TableRow[]) => {
        pendingInsert = Array.isArray(rows) ? rows : [rows];
        return api;
      },
      upsert: async (rows: TableRow[], opts?: { onConflict: string }) => {
        upsertConflict = opts?.onConflict;
        if (state.upsertErr) return { error: { message: state.upsertErr } };
        if (table === 'ofac_sdn_entries') {
          for (const r of rows) {
            const existing = state.entries.findIndex((e) => e.id === r.id);
            if (existing >= 0) state.entries[existing] = r;
            else state.entries.push(r);
          }
        }
        return { error: null };
      },
      update: (patch: TableRow) => { pendingUpdate = patch; return api; },
      delete: () => { pendingDelete = true; return api; },
      maybeSingle: async () => {
        if (pendingInsert && table === 'ofac_sdn_refresh_log') {
          const row = { id: `log_${state.logs.length + 1}`, ...pendingInsert[0] };
          state.logs.push(row);
          return { data: row, error: null };
        }
        return { data: null, error: null };
      },
      then: undefined as unknown,
    };
    (api as unknown as { then: (cb: (v: { data: unknown; error: null }) => unknown) => unknown }).then = (cb) => {
      if (pendingDelete && table === 'ofac_sdn_entries') {
        const idsToDelete = filters.find((f) => f.op === 'in' && f.col === 'id')?.val as string[] | undefined;
        if (idsToDelete) {
          state.entries = state.entries.filter((r) => !idsToDelete.includes(r.id as string));
        }
        return Promise.resolve({ data: null, error: null }).then(cb);
      }
      if (pendingUpdate && table === 'ofac_sdn_refresh_log') {
        const logId = filters.find((f) => f.col === 'id')?.val;
        const idx = state.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) state.logs[idx] = { ...state.logs[idx], ...pendingUpdate };
        return Promise.resolve({ data: null, error: null }).then(cb);
      }
      if (table === 'ofac_sdn_entries') {
        return Promise.resolve({ data: state.entries, error: null }).then(cb);
      }
      return Promise.resolve({ data: [], error: null }).then(cb);
    };
    void upsertConflict; // silence unused var; only captured for inspection if tests need it
    return api;
  };
  return { from: (table: string) => builder(table) } as unknown as Parameters<typeof loadSdnEntries>[0];
}

describe('loadSdnEntries', () => {
  it('returns DB entries when table populated', async () => {
    const supabase = makeSupabase({
      entries: [
        { id: 'sdn-1', primary_name: 'Rosneft', aliases: ['ROSNEFT OIL'], list: 'SDN', programs: ['UKRAINE'] },
      ],
      logs: [],
    });
    const { entries, source } = await loadSdnEntries(supabase);
    expect(source).toBe('db');
    expect(entries).toHaveLength(1);
    expect(entries[0].primaryName).toBe('Rosneft');
  });

  it('falls back to OFAC_SEED when DB is empty', async () => {
    const supabase = makeSupabase({ entries: [], logs: [] });
    const { entries, source } = await loadSdnEntries(supabase);
    expect(source).toBe('seed');
    expect(entries).toBe(OFAC_SEED);
  });

  it('respects skipSeedFallback flag when DB is empty', async () => {
    const supabase = makeSupabase({ entries: [], logs: [] });
    const { entries, source } = await loadSdnEntries(supabase, { skipSeedFallback: true });
    expect(source).toBe('empty');
    expect(entries).toHaveLength(0);
  });

  it('respects preferSeed flag even when DB populated', async () => {
    const supabase = makeSupabase({
      entries: [{ id: 'sdn-1', primary_name: 'X', aliases: [], list: 'SDN', programs: [] }],
      logs: [],
    });
    const { entries, source } = await loadSdnEntries(supabase, { preferSeed: true });
    expect(source).toBe('seed');
    expect(entries).toBe(OFAC_SEED);
  });
});

describe('upsertSdnEntries', () => {
  it('upserts entries and records completed log', async () => {
    const state: StubState = { entries: [], logs: [] };
    const supabase = makeSupabase(state);
    const result = await upsertSdnEntries(supabase, [
      { id: 'sdn-1', primaryName: 'Alpha', list: 'SDN', programs: [] },
      { id: 'sdn-2', primaryName: 'Beta', list: 'SDN', programs: [] },
    ]);
    expect(result.upserted).toBe(2);
    expect(result.deleted).toBe(0);
    expect(state.entries).toHaveLength(2);
    expect(state.logs[0].status).toBe('completed');
  });

  it('deletes missing ids when deleteMissing=true', async () => {
    const state: StubState = {
      entries: [
        { id: 'sdn-old', primary_name: 'Old', aliases: [], list: 'SDN', programs: [] },
      ],
      logs: [],
    };
    const supabase = makeSupabase(state);
    await upsertSdnEntries(supabase, [
      { id: 'sdn-new', primaryName: 'New', list: 'SDN', programs: [] },
    ], { deleteMissing: true });
    const ids = state.entries.map((e) => e.id);
    expect(ids).not.toContain('sdn-old');
    expect(ids).toContain('sdn-new');
  });

  it('records failed status + error when upsert throws', async () => {
    const state: StubState = { entries: [], logs: [], upsertErr: 'db unreachable' };
    const supabase = makeSupabase(state);
    await expect(
      upsertSdnEntries(supabase, [{ id: 'x', primaryName: 'x', list: 'SDN', programs: [] }]),
    ).rejects.toThrow();
    expect(state.logs[0].status).toBe('failed');
    expect(state.logs[0].error).toContain('db unreachable');
  });
});
