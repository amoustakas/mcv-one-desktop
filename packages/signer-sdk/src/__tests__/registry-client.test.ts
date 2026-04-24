import { describe, it, expect } from 'vitest';
import { createInMemoryRegistry, SIGNER_SDK_VERSION } from '../registry/client';
import type { SignerBundleManifest } from '../registry/manifest';

const mkBundle = (overrides: Partial<SignerBundleManifest> = {}): SignerBundleManifest => ({
  id: 'bundle-a',
  version: '1',
  parentVentureId: 'mcv',
  name: 'Test bundle',
  description: 'test',
  jurisdictions: ['us'],
  templates: [{ id: 'nda', version: 1, title: 'NDA', required: true }],
  sdkVersion: SIGNER_SDK_VERSION,
  ...overrides,
});

describe('in-memory registry', () => {
  it('registers + retrieves a bundle', async () => {
    const reg = createInMemoryRegistry();
    const bundle = mkBundle();
    await reg.register(bundle);
    expect(await reg.get(bundle.id)).toEqual(bundle);
  });

  it('rejects a bundle targeting a wrong SDK version', async () => {
    const reg = createInMemoryRegistry();
    const stale = mkBundle({ sdkVersion: '9.9.9' });
    await expect(reg.register(stale)).rejects.toThrow(/sdkVersion/);
  });

  it('discover filters by parentVentureId', async () => {
    const reg = createInMemoryRegistry([
      mkBundle({ id: 'a', parentVentureId: 'mcv' }),
      mkBundle({ id: 'b', parentVentureId: 'futurestate' }),
    ]);
    const found = await reg.discover({ parentVentureIds: ['mcv'] });
    expect(found.map((b) => b.id)).toEqual(['a']);
  });

  it('discover treats generic bundles (no roles) as matching any role filter', async () => {
    const reg = createInMemoryRegistry([
      mkBundle({ id: 'a' }), // no roles
      mkBundle({ id: 'b', roles: ['investor'] }),
      mkBundle({ id: 'c', roles: ['employee'] }),
    ]);
    const found = await reg.discover({ roles: ['investor'] });
    expect(found.map((b) => b.id).sort()).toEqual(['a', 'b']);
  });

  it('unregister is idempotent', async () => {
    const reg = createInMemoryRegistry();
    await reg.unregister('does-not-exist');
    await reg.unregister('does-not-exist');
  });
});
