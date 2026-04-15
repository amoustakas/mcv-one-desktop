// @mcv/capital-sdk/ecosystem-bridges — thin adapters to other MCV systems.
// All adapters are OPTIONAL; Capital degrades gracefully when absent.

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 1. Notifications bridge ────────────────────────────────────────────
// Writes to the shared `notifications` table. Pattern mirrors
// api/_handlers/crm.ts:notify().

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotifyInput {
  type?: NotificationType;
  title: string;
  description?: string;
  source?: string;        // default 'capital'
  ventureId?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsBridge {
  notify(input: NotifyInput): Promise<void>;
  publishCapitalEvent(topic: string, payload: Record<string, unknown>, opts?: { title?: string; description?: string; ventureId?: string; type?: NotificationType }): Promise<void>;
}

export function createNotificationsBridge(supabase: SupabaseClient | null): NotificationsBridge {
  return {
    async notify(input) {
      if (!supabase) return;
      try {
        await supabase.from('notifications').insert({
          type: input.type ?? 'info',
          title: input.title,
          description: input.description ?? null,
          source: input.source ?? 'capital',
          venture_id: input.ventureId ?? null,
        });
      } catch (err) {
        // Best-effort; don't break the primary mutation.
        console.warn('[capital/notify] insert failed:', err);
      }
    },

    async publishCapitalEvent(topic, payload, opts) {
      if (!supabase) return;
      const title = opts?.title ?? topic.split('.').slice(1).join(' ');
      const description = opts?.description ?? JSON.stringify(payload).slice(0, 200);
      try {
        await supabase.from('notifications').insert({
          type: opts?.type ?? 'info',
          title,
          description,
          source: 'capital',
          venture_id: opts?.ventureId ?? null,
        });
      } catch (err) {
        console.warn(`[capital/event ${topic}] notify failed:`, err);
      }
      // Future: fan out to Fabric pub-sub when wired. The topic + payload are
      // the protocol-level wire format; topic names are documented in
      // docs/capital/PROTOCOL.md §Event Schema.
    },
  };
}

// ─── 2. Ventures bridge ─────────────────────────────────────────────────
// Resolves venture metadata + enforces FK integrity at the application layer.

export interface VentureRef {
  id: string;
  name: string;
  slug?: string | null;
  domain: string | null;
  color: string | null;
  icon: string | null;
  tier: number | null;
  clerkOrgId: string | null;
  status: string;
  whiteLabel: Record<string, unknown> | null;
  customDomains: Array<Record<string, unknown>>;
}

export interface VenturesBridge {
  getVenture(ventureId: string): Promise<VentureRef | null>;
  listVentures(filters?: { status?: string; tier?: number }): Promise<VentureRef[]>;
  isVentureClerkOrg(ventureId: string, jwtOrgId: string | null | undefined): Promise<boolean>;
}

function mapVentureRow(row: Record<string, unknown>): VentureRef {
  const customDomains = row.custom_domains;
  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) ?? (row.id as string),
    domain: (row.domain as string) ?? null,
    color: (row.color as string) ?? null,
    icon: (row.icon as string) ?? null,
    tier: row.tier === null || row.tier === undefined ? null : Number(row.tier),
    clerkOrgId: (row.clerk_org_id as string) ?? null,
    status: (row.status as string) ?? 'active',
    whiteLabel: (row.white_label as Record<string, unknown>) ?? null,
    customDomains: Array.isArray(customDomains) ? (customDomains as Array<Record<string, unknown>>) : [],
  };
}

export function createVenturesBridge(supabase: SupabaseClient | null): VenturesBridge {
  return {
    async getVenture(ventureId) {
      if (!supabase) return null;
      const { data, error } = await supabase.from('ventures').select().eq('id', ventureId).maybeSingle();
      if (error || !data) return null;
      return mapVentureRow(data);
    },

    async listVentures(filters) {
      if (!supabase) return [];
      let q = supabase.from('ventures').select().order('name', { ascending: true });
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.tier !== undefined) q = q.eq('tier', filters.tier);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []).map(mapVentureRow);
    },

    async isVentureClerkOrg(ventureId, jwtOrgId) {
      if (!jwtOrgId) return false;
      const v = await this.getVenture(ventureId);
      if (!v) return false;
      // When clerk_org_id is null, the venture is on the shared root org.
      // Tony's super-admin JWT satisfies this condition via app-layer check.
      if (v.clerkOrgId === null) return true;
      return v.clerkOrgId === jwtOrgId;
    },
  };
}

// ─── 3. PaymentRouter bridge (shared singleton accessor) ────────────────
// Mirrors @mcv/payments-sdk/shared-router pattern without importing it.

export interface PaymentRouterLike {
  processPayment(request: {
    amount: number;
    currency: string;
    method: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ result: { success: boolean; reference?: string; error?: string }; decision: unknown }>;
}

let sharedRouter: PaymentRouterLike | null = null;

/** Called by host app at startup. */
export function setCapitalPaymentRouter(router: PaymentRouterLike | null): void {
  sharedRouter = router;
}

/** Read the shared router (null if not configured). */
export function getCapitalPaymentRouter(): PaymentRouterLike | null {
  return sharedRouter;
}
