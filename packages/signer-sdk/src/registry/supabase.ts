// packages/signer-sdk/src/registry/supabase.ts
//
// Supabase-backed SignerBundleRegistry implementation. Retires the
// "in-memory only" asterisk from v0.1 README. Backed by the
// signing_bundles + signing_bundle_templates tables (see
// supabase/migration-signer-bundles-2026-04-24.sql).
//
// Peer-depends on @supabase/supabase-js. Consumers that don't want
// a Supabase dependency can continue using createInMemoryRegistry —
// both satisfy the same SignerBundleRegistry interface.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  signerBundleManifestSchema,
  type SignerBundleManifest,
  type SignerTemplateRef,
} from './manifest';
import {
  SIGNER_SDK_VERSION,
  type SignerBundleRegistry,
  type RegistryFilter,
} from './client';

export interface SupabaseRegistryOptions {
  supabase: SupabaseClient;
  /** Default: false — retired bundles are filtered out of discover().
   *  Set true when composing a "full history" compliance view. */
  includeRetired?: boolean;
}

// ─── Row shapes ────────────────────────────────────────────────────────

interface BundleRow {
  id: string;
  version: string;
  parent_venture_id: string;
  child_venture_id: string | null;
  name: string;
  description: string;
  roles: string[] | null;
  jurisdictions: string[];
  sdk_version: string;
  created_at: string;
  updated_at: string;
  retired_at: string | null;
}

interface TemplateRow {
  bundle_id: string;
  template_id: string;
  version: number;
  title: string;
  description: string | null;
  tags: string[] | null;
  required: boolean;
  display_order: number;
}

// ─── Adapter ───────────────────────────────────────────────────────────

function rowToManifest(bundle: BundleRow, templates: TemplateRow[]): SignerBundleManifest {
  const sorted = [...templates]
    .filter((t) => t.bundle_id === bundle.id)
    .sort((a, b) => a.display_order - b.display_order || a.template_id.localeCompare(b.template_id));

  const refs: SignerTemplateRef[] = sorted.map((t) => ({
    id: t.template_id,
    version: t.version,
    title: t.title,
    description: t.description ?? undefined,
    tags: t.tags ?? undefined,
    required: t.required,
  }));

  return {
    id: bundle.id,
    version: bundle.version,
    parentVentureId: bundle.parent_venture_id,
    childVentureId: bundle.child_venture_id ?? undefined,
    name: bundle.name,
    description: bundle.description,
    roles: bundle.roles && bundle.roles.length > 0 ? bundle.roles : undefined,
    jurisdictions: bundle.jurisdictions as Array<'us'>,
    templates: refs,
    sdkVersion: bundle.sdk_version,
  };
}

// ─── Registry implementation ───────────────────────────────────────────

export function createSupabaseRegistry(options: SupabaseRegistryOptions): SignerBundleRegistry {
  const { supabase, includeRetired = false } = options;

  return {
    async discover(filter?: RegistryFilter): Promise<SignerBundleManifest[]> {
      let query = supabase.from('signing_bundles').select('*');
      if (!includeRetired) query = query.is('retired_at', null);
      if (filter?.parentVentureIds?.length) {
        query = query.in('parent_venture_id', filter.parentVentureIds);
      }
      if (filter?.jurisdictions?.length) {
        // Postgres array-overlap: any bundle whose jurisdictions column
        // intersects the filter's jurisdictions.
        query = query.overlaps('jurisdictions', filter.jurisdictions);
      }

      const { data: bundles, error } = await query;
      if (error) throw new Error(`[signer-sdk] discover() failed: ${error.message}`);
      if (!bundles || bundles.length === 0) return [];

      const bundleIds = (bundles as BundleRow[]).map((b) => b.id);
      const { data: templates, error: terr } = await supabase
        .from('signing_bundle_templates')
        .select('*')
        .in('bundle_id', bundleIds);
      if (terr) throw new Error(`[signer-sdk] discover() templates failed: ${terr.message}`);

      let manifests = (bundles as BundleRow[]).map((b) => rowToManifest(b, (templates as TemplateRow[]) ?? []));

      // Role filter is client-side because Postgres array intersection
      // with the "empty = generic" semantics is awkward in SQL. Generic
      // bundles (no roles) match any role filter; role-scoped bundles
      // must share ≥ 1 role with the filter.
      if (filter?.roles?.length) {
        const filterRoles = filter.roles;
        manifests = manifests.filter((m) => {
          if (!m.roles || m.roles.length === 0) return true;
          return m.roles.some((r) => filterRoles.includes(r));
        });
      }

      return manifests;
    },

    async get(id: string): Promise<SignerBundleManifest | null> {
      const { data: bundle, error } = await supabase
        .from('signing_bundles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`[signer-sdk] get(${id}) failed: ${error.message}`);
      if (!bundle) return null;

      const { data: templates, error: terr } = await supabase
        .from('signing_bundle_templates')
        .select('*')
        .eq('bundle_id', id);
      if (terr) throw new Error(`[signer-sdk] get(${id}) templates failed: ${terr.message}`);

      return rowToManifest(bundle as BundleRow, (templates as TemplateRow[]) ?? []);
    },

    async register(manifest: SignerBundleManifest): Promise<void> {
      const parsed = signerBundleManifestSchema.parse(manifest);
      if (parsed.sdkVersion !== SIGNER_SDK_VERSION) {
        throw new Error(
          `[signer-sdk] bundle ${parsed.id} targets sdkVersion ${parsed.sdkVersion}, ` +
          `current is ${SIGNER_SDK_VERSION}. Bundle authors should regenerate against the current SDK.`,
        );
      }

      const bundleRow = {
        id: parsed.id,
        version: parsed.version,
        parent_venture_id: parsed.parentVentureId,
        child_venture_id: parsed.childVentureId ?? null,
        name: parsed.name,
        description: parsed.description,
        roles: parsed.roles ?? [],
        jurisdictions: parsed.jurisdictions,
        sdk_version: parsed.sdkVersion,
      };
      const { error: upErr } = await supabase
        .from('signing_bundles')
        .upsert(bundleRow, { onConflict: 'id' });
      if (upErr) throw new Error(`[signer-sdk] register(${parsed.id}) failed: ${upErr.message}`);

      // Templates: replace-in-place. Delete existing then insert fresh.
      const { error: delErr } = await supabase
        .from('signing_bundle_templates')
        .delete()
        .eq('bundle_id', parsed.id);
      if (delErr) throw new Error(`[signer-sdk] register(${parsed.id}) clear templates failed: ${delErr.message}`);

      if (parsed.templates.length > 0) {
        const rows = parsed.templates.map((t, idx) => ({
          bundle_id: parsed.id,
          template_id: t.id,
          version: t.version,
          title: t.title,
          description: t.description ?? null,
          tags: t.tags ?? [],
          required: t.required,
          display_order: idx,
        }));
        const { error: insErr } = await supabase
          .from('signing_bundle_templates')
          .insert(rows);
        if (insErr) throw new Error(`[signer-sdk] register(${parsed.id}) insert templates failed: ${insErr.message}`);
      }
    },

    async unregister(id: string): Promise<void> {
      // CASCADE on the FK drops the templates automatically.
      const { error } = await supabase.from('signing_bundles').delete().eq('id', id);
      if (error) throw new Error(`[signer-sdk] unregister(${id}) failed: ${error.message}`);
    },
  };
}
