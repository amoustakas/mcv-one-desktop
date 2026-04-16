// rail-router — unit tests. Pure function + one DB read.

import { describe, it, expect, afterEach } from 'vitest';
import { pickSigningRail } from '../rail-router';

function makeSupabase(configRow: { rail: string } | null) {
  return {
    from() {
      const api = {
        select: (_c: string) => api,
        eq: (_c: string, _v: unknown) => api,
        maybeSingle: async () => ({ data: configRow, error: null }),
      };
      return api;
    },
  } as unknown as Parameters<typeof pickSigningRail>[0];
}

const saved = { force: process.env.MCV_SIGN_FORCE_RAIL, def: process.env.DEFAULT_SIGNING_RAIL };

describe('pickSigningRail', () => {
  it('honors MCV_SIGN_FORCE_RAIL env override', async () => {
    process.env.MCV_SIGN_FORCE_RAIL = 'mcv-sign';
    const rail = await pickSigningRail(makeSupabase(null), 'any-venture');
    expect(rail).toBe('mcv-sign');
  });

  it('reads per-venture signing_rail_config', async () => {
    delete process.env.MCV_SIGN_FORCE_RAIL;
    const rail = await pickSigningRail(makeSupabase({ rail: 'mcv-sign' }), 'v-1');
    expect(rail).toBe('mcv-sign');
  });

  it('falls back to docusign default when no config', async () => {
    delete process.env.MCV_SIGN_FORCE_RAIL;
    delete process.env.DEFAULT_SIGNING_RAIL;
    const rail = await pickSigningRail(makeSupabase(null), 'v-unset');
    expect(rail).toBe('docusign');
  });

  it('honors DEFAULT_SIGNING_RAIL env default', async () => {
    delete process.env.MCV_SIGN_FORCE_RAIL;
    process.env.DEFAULT_SIGNING_RAIL = 'mcv-sign';
    const rail = await pickSigningRail(makeSupabase(null), 'v-unset');
    expect(rail).toBe('mcv-sign');
  });

  it('rejects invalid configured rails and falls back', async () => {
    delete process.env.MCV_SIGN_FORCE_RAIL;
    delete process.env.DEFAULT_SIGNING_RAIL;
    const rail = await pickSigningRail(makeSupabase({ rail: 'bogus' }), 'v-bogus');
    expect(rail).toBe('docusign');
  });

  afterEach(() => {
    if (saved.force !== undefined) process.env.MCV_SIGN_FORCE_RAIL = saved.force; else delete process.env.MCV_SIGN_FORCE_RAIL;
    if (saved.def !== undefined) process.env.DEFAULT_SIGNING_RAIL = saved.def; else delete process.env.DEFAULT_SIGNING_RAIL;
  });
});
