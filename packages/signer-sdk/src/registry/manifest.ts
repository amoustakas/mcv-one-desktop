// packages/signer-sdk/src/registry/manifest.ts
//
// Signer bundle manifest — the declarative shape a venture uses to
// register a collection of signing templates with the MCV signing
// backbone. Mirrors the KitManifest pattern in @mcv/kits-sdk (see
// project_kits_sdk memory) so the two registries share vocabulary
// and a future unified admin UI can list them side-by-side.

import { z } from 'zod';

export interface SignerTemplateRef {
  /** Stable id — callers use this when assembling an envelope. Unique
   *  within a venture. */
  id: string;
  /** Monotonically-increasing integer. Bump = breaking change; readers
   *  compare this against the pinned `templateVersion` on issued
   *  envelopes to detect mutation. */
  version: number;
  /** Human-readable label shown in admin UIs. */
  title: string;
  description?: string;
  /** Venture-defined tags for discovery. Free-form. */
  tags?: string[];
  /** Whether this template requires signing by default (false = optional
   *  component of a larger bundle, e.g. a rider document). */
  required: boolean;
}

export interface SignerBundleManifest {
  /** Stable bundle id — stays constant across versions. */
  id: string;
  version: string;
  /** Which venture owns this bundle. Bundles are always scoped to a
   *  single parent venture; downstream ventures consume via the
   *  registry's `install()` op. */
  parentVentureId: string;
  /** Optional child-venture scope — when the bundle is owned by a
   *  specific child venture rather than the parent. */
  childVentureId?: string;
  name: string;
  description: string;
  /** Role(s) this bundle is appropriate for. Empty = generic / all roles. */
  roles?: string[];
  /** Jurisdictions this bundle is certified for. v0.1: `['us']`. */
  jurisdictions: Array<'us'>;
  templates: SignerTemplateRef[];
  /** SDK major version this manifest was built against. Future SDK
   *  upgrades can refuse to load incompatible manifests. */
  sdkVersion: string;
}

// ─── Zod schemas (for remote-registry validation) ───────────────────────

export const signerTemplateRefSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative(),
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  required: z.boolean(),
});

export const signerBundleManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  parentVentureId: z.string().min(1),
  childVentureId: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  roles: z.array(z.string()).optional(),
  jurisdictions: z.array(z.literal('us')).min(1),
  templates: z.array(signerTemplateRefSchema).min(1),
  sdkVersion: z.string().min(1),
});
