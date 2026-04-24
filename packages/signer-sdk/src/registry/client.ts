// packages/signer-sdk/src/registry/client.ts
//
// Registry client — discover / register / install signer bundles.
// v0.1 ships an in-memory implementation suitable for tests + for the
// single-tenant default backbone. A Supabase-backed implementation
// lands in a follow-up session once the bundle tables exist in the
// signer migration (currently v0.1 ships the envelope tables only).
//
// Shape mirrors @mcv/kits-sdk's registry-client so callers already
// familiar with KitManifest / kit-registry apply the same mental model.

import { signerBundleManifestSchema, type SignerBundleManifest } from './manifest';

export interface RegistryFilter {
  /** Only bundles whose `parentVentureId` matches one of these. */
  parentVentureIds?: string[];
  /** Only bundles whose `roles` array intersects this list. When a bundle
   *  has no roles (generic), it matches any role filter. */
  roles?: string[];
  /** Only bundles certified for these jurisdictions. */
  jurisdictions?: Array<'us'>;
}

export interface SignerBundleRegistry {
  /** List available bundles, optionally filtered. */
  discover(filter?: RegistryFilter): Promise<SignerBundleManifest[]>;
  /** Look up a bundle by id. */
  get(id: string): Promise<SignerBundleManifest | null>;
  /** Register or update a bundle. Validates the manifest against the
   *  schema + the v0.1 SDK version pin; throws on drift. */
  register(manifest: SignerBundleManifest): Promise<void>;
  /** Remove a bundle by id. Idempotent. */
  unregister(id: string): Promise<void>;
}

/** Compile-time version pin — registered manifests must match.
 *  Follow-up sessions can widen to a semver range. */
export const SIGNER_SDK_VERSION = '0.1.0';

// ─── In-memory registry (v0.1 default) ──────────────────────────────────

export function createInMemoryRegistry(seed: SignerBundleManifest[] = []): SignerBundleRegistry {
  const bundles = new Map<string, SignerBundleManifest>();
  for (const s of seed) bundles.set(s.id, s);

  return {
    async discover(filter?: RegistryFilter): Promise<SignerBundleManifest[]> {
      const all = Array.from(bundles.values());
      if (!filter) return all;
      return all.filter((b) => {
        if (filter.parentVentureIds && !filter.parentVentureIds.includes(b.parentVentureId)) return false;
        if (filter.jurisdictions) {
          const intersect = b.jurisdictions.some((j) => filter.jurisdictions!.includes(j));
          if (!intersect) return false;
        }
        if (filter.roles) {
          // Empty / undefined roles on a bundle = generic → always matches.
          if (b.roles && b.roles.length > 0) {
            const intersect = b.roles.some((r) => filter.roles!.includes(r));
            if (!intersect) return false;
          }
        }
        return true;
      });
    },
    async get(id: string): Promise<SignerBundleManifest | null> {
      return bundles.get(id) ?? null;
    },
    async register(manifest: SignerBundleManifest): Promise<void> {
      const parsed = signerBundleManifestSchema.parse(manifest);
      if (parsed.sdkVersion !== SIGNER_SDK_VERSION) {
        throw new Error(
          `[signer-sdk] bundle ${parsed.id} targets sdkVersion ${parsed.sdkVersion}, ` +
          `current is ${SIGNER_SDK_VERSION}. Bundle authors should regenerate against the current SDK.`,
        );
      }
      bundles.set(parsed.id, parsed as SignerBundleManifest);
    },
    async unregister(id: string): Promise<void> {
      bundles.delete(id);
    },
  };
}
