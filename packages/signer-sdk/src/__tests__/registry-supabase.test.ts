import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseRegistry } from '../registry/supabase';
import { SIGNER_SDK_VERSION } from '../registry/client';
import type { SignerBundleManifest } from '../registry/manifest';

// ─── Hand-rolled Supabase mock ─────────────────────────────────────────
// Vitest/node, no @supabase/supabase-js runtime import needed — the
// adapter only calls a narrow surface (from/select/eq/in/is/overlaps/
// maybeSingle/upsert/delete/insert). We implement just that surface so
// the tests exercise the mapping logic without a real database.

type FilterOp = { kind: string; column: string; value: unknown };
interface TableState {
  bundles: Record<string, unknown>[];
  templates: Record<string, unknown>[];
}

function createMockClient(state: TableState): {
  client: SupabaseClient;
  state: TableState;
} {
  function applyFilters<T extends Record<string, unknown>>(rows: T[], filters: FilterOp[]): T[] {
    return rows.filter((row) => filters.every((f) => {
      switch (f.kind) {
        case 'eq':       return row[f.column] === f.value;
        case 'in':       return Array.isArray(f.value) && (f.value as unknown[]).includes(row[f.column]);
        case 'is':
          // Treat undefined as null for IS NULL-style filters — mirrors
          // Postgres's "column that was never set" semantics.
          if (f.value === null) return row[f.column] === null || row[f.column] === undefined;
          return row[f.column] === f.value;
        case 'overlaps': {
          const cell = row[f.column];
          if (!Array.isArray(cell) || !Array.isArray(f.value)) return false;
          return (cell as unknown[]).some((v) => (f.value as unknown[]).includes(v));
        }
        default: return true;
      }
    }));
  }

  function makeQuery(table: 'signing_bundles' | 'signing_bundle_templates') {
    const filters: FilterOp[] = [];
    const api: Record<string, unknown> = {};

    const select = () => api;
    api.select = select;
    api.eq = (column: string, value: unknown) => { filters.push({ kind: 'eq', column, value }); return api; };
    api.in = (column: string, value: unknown[]) => { filters.push({ kind: 'in', column, value }); return api; };
    api.is = (column: string, value: unknown) => { filters.push({ kind: 'is', column, value }); return api; };
    api.overlaps = (column: string, value: unknown[]) => { filters.push({ kind: 'overlaps', column, value }); return api; };
    api.maybeSingle = async () => {
      const rows = applyFilters(state[table === 'signing_bundles' ? 'bundles' : 'templates'], filters);
      return { data: rows[0] ?? null, error: null };
    };
    api.upsert = async (row: Record<string, unknown>) => {
      const bucket = table === 'signing_bundles' ? state.bundles : state.templates;
      const idx = bucket.findIndex((r) => r.id === row.id);
      if (idx >= 0) bucket[idx] = { ...bucket[idx], ...row };
      else bucket.push(row);
      return { data: [row], error: null };
    };
    api.delete = () => ({
      eq: async (column: string, value: unknown) => {
        const bucket = table === 'signing_bundles' ? state.bundles : state.templates;
        const before = bucket.length;
        const filtered = bucket.filter((r) => r[column] !== value);
        bucket.length = 0;
        bucket.push(...filtered);
        return { data: null, error: null, count: before - filtered.length };
      },
    });
    api.insert = async (rows: Record<string, unknown>[]) => {
      const bucket = table === 'signing_bundles' ? state.bundles : state.templates;
      bucket.push(...rows);
      return { data: rows, error: null };
    };

    // Terminal call resolves to { data, error } shape.
    const thenable = {
      then(resolve: (v: { data: unknown[]; error: null }) => unknown) {
        const rows = applyFilters(state[table === 'signing_bundles' ? 'bundles' : 'templates'], filters);
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      },
    };
    Object.assign(api, thenable);

    return api;
  }

  const client = {
    from: (table: string) => makeQuery(table as 'signing_bundles' | 'signing_bundle_templates'),
  } as unknown as SupabaseClient;

  return { client, state };
}

// ─── Tests ─────────────────────────────────────────────────────────────

const mkManifest = (overrides: Partial<SignerBundleManifest> = {}): SignerBundleManifest => ({
  id: 'bundle-a',
  version: '1',
  parentVentureId: 'mcv',
  name: 'Test',
  description: 'desc',
  jurisdictions: ['us'],
  templates: [{ id: 'nda', version: 1, title: 'NDA', required: true }],
  sdkVersion: SIGNER_SDK_VERSION,
  ...overrides,
});

describe('createSupabaseRegistry', () => {
  it('registers a bundle and retrieves it back by id', async () => {
    const { client, state } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });

    await reg.register(mkManifest());

    expect(state.bundles.length).toBe(1);
    expect(state.templates.length).toBe(1);

    const out = await reg.get('bundle-a');
    expect(out?.id).toBe('bundle-a');
    expect(out?.templates[0].title).toBe('NDA');
  });

  it('rejects registering a bundle with the wrong SDK version', async () => {
    const { client } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });
    await expect(reg.register(mkManifest({ sdkVersion: '9.9.9' }))).rejects.toThrow(/sdkVersion/);
  });

  it('returns null for unknown bundle id', async () => {
    const { client } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });
    expect(await reg.get('does-not-exist')).toBeNull();
  });

  it('replace-in-place semantics: register twice keeps template count stable', async () => {
    const { client, state } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });
    await reg.register(mkManifest({
      templates: [
        { id: 'nda', version: 1, title: 'NDA', required: true },
        { id: 'side-letter', version: 1, title: 'Side Letter', required: false },
      ],
    }));
    expect(state.templates.length).toBe(2);

    // Re-register with fewer templates — old ones must go.
    await reg.register(mkManifest({
      templates: [{ id: 'nda', version: 2, title: 'NDA', required: true }],
    }));
    expect(state.templates.length).toBe(1);
    expect((state.templates[0] as Record<string, unknown>).version).toBe(2);
  });

  it('unregister removes the bundle', async () => {
    const { client, state } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });
    await reg.register(mkManifest());
    expect(state.bundles.length).toBe(1);
    await reg.unregister('bundle-a');
    expect(state.bundles.length).toBe(0);
  });

  it('role filter applies the "empty roles = generic matches" rule', async () => {
    const { client } = createMockClient({ bundles: [], templates: [] });
    const reg = createSupabaseRegistry({ supabase: client });
    await reg.register(mkManifest({ id: 'a' }));                        // no roles = generic
    await reg.register(mkManifest({ id: 'b', roles: ['investor'] }));
    await reg.register(mkManifest({ id: 'c', roles: ['employee'] }));

    const matches = await reg.discover({ roles: ['investor'] });
    expect(matches.map((m) => m.id).sort()).toEqual(['a', 'b']);
  });
});
