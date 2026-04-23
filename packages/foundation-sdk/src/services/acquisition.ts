// @mcv/foundation-sdk/services/acquisition — CRUD over acquisition_orders.
//
// Tracks domain / trademark / patent buy queue with urgency-tier routing.
// Red-tier entries (7-day window) drive the DomainPortfolioView's "🔴 ACQUIRE NOW
// — blocks Hunter disclosure" banner and flip blocks_disclosure=true to gate
// external-facing disclosures.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AcquisitionOrder,
  AcquisitionUrgencyTier,
  AcquisitionStatus,
} from '../types';

// ─── Row mapping ────────────────────────────────────────────────────────────

export function mapAcquisitionOrderRow(row: Record<string, unknown>): AcquisitionOrder {
  return {
    id: row.id as string,
    assetKind: row.asset_kind as AcquisitionOrder['assetKind'],
    assetIdentifier: row.asset_identifier as string,
    urgencyTier: row.urgency_tier as AcquisitionOrder['urgencyTier'],
    targetRegistrar: (row.target_registrar as string) ?? null,
    priceCad: row.price_cad != null ? Number(row.price_cad) : null,
    priceUsd: row.price_usd != null ? Number(row.price_usd) : null,
    brokerContact: (row.broker_contact as string) ?? null,
    status: row.status as AcquisitionOrder['status'],
    blocksDisclosure: Boolean(row.blocks_disclosure),
    blocksVentureName: (row.blocks_venture_name as string) ?? null,
    notes: (row.notes as string) ?? null,
    acquiredAt: (row.acquired_at as string) ?? null,
    acquiredRegistrar: (row.acquired_registrar as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface UpsertAcquisitionOrderInput {
  assetKind: AcquisitionOrder['assetKind'];
  assetIdentifier: string;
  urgencyTier: AcquisitionOrder['urgencyTier'];
  targetRegistrar?: string | null;
  priceCad?: number | null;
  priceUsd?: number | null;
  brokerContact?: string | null;
  status?: AcquisitionOrder['status'];
  blocksDisclosure?: boolean;
  blocksVentureName?: string | null;
  notes?: string | null;
}

export interface ListAcquisitionOrdersFilters {
  urgencyTier?: AcquisitionOrder['urgencyTier'];
  status?: AcquisitionOrder['status'];
  assetKind?: AcquisitionOrder['assetKind'];
  blocksDisclosure?: boolean;
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface AcquisitionService {
  list(filters?: ListAcquisitionOrdersFilters): Promise<AcquisitionOrder[]>;
  get(id: string): Promise<AcquisitionOrder | null>;
  upsert(input: UpsertAcquisitionOrderInput): Promise<AcquisitionOrder>;
  markAcquired(id: string, registrar: string, acquiredAtIso?: string): Promise<AcquisitionOrder>;
  kill(id: string, reason: string): Promise<AcquisitionOrder>;
  /** Idempotently seed the 🔴🟠 acquisitions from the T2_Gaps CSV. Re-running inserts 0 rows. */
  seedUrgent(): Promise<{ inserted: number; already: number }>;
}

export interface AcquisitionServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Urgent seed data (Locked — matches T2_Gaps_Urgent.csv) ─────────────────
//
// These 5 entries are the only hand-authored acquisition rows in the codebase —
// included here because they're the marathon's highest-urgency deliverable and
// the T2 CSV inside .docs/counsel is not guaranteed checked into git. The full
// 111-domain portfolio comes from T0 CSV ingestion (scripts/foundation/parsers).

const URGENT_ACQUISITIONS_SEED: ReadonlyArray<UpsertAcquisitionOrderInput> = [
  {
    assetKind: 'domain',
    assetIdentifier: 'futurestate.app',
    urgencyTier: 'red_7day',
    targetRegistrar: 'Namecheap',
    blocksDisclosure: true,
    blocksVentureName: 'futurestate',
    notes: 'Blocks Hunter/Kirill FutureState disclosure per IP Inventory §6.4. Acquire within 7 days.',
  },
  {
    assetKind: 'domain',
    assetIdentifier: 'futurestate.io',
    urgencyTier: 'red_7day',
    targetRegistrar: 'Namecheap',
    blocksDisclosure: true,
    blocksVentureName: 'futurestate',
    notes: 'Blocks FutureState disclosure. Acquire within 7 days.',
  },
  {
    assetKind: 'domain',
    assetIdentifier: 'futurestate.xyz',
    urgencyTier: 'red_7day',
    targetRegistrar: 'Namecheap',
    blocksDisclosure: true,
    blocksVentureName: 'futurestate',
    notes: 'Blocks FutureState disclosure. Acquire within 7 days.',
  },
  {
    assetKind: 'domain',
    assetIdentifier: 'naos.ai',
    urgencyTier: 'orange_30day',
    targetRegistrar: 'Namecheap',
    blocksDisclosure: false,
    blocksVentureName: 'mcv-one',
    notes: 'NAOS patent-value brand. Secure within 30-day window before any external NAOS mention.',
  },
  {
    assetKind: 'domain',
    assetIdentifier: 'coretriangle.com',
    urgencyTier: 'orange_30day',
    targetRegistrar: 'Namecheap',
    blocksDisclosure: false,
    blocksVentureName: 'mcv-one',
    notes: 'Defensive acquisition for Core-Triangle compound trademark. 30-day window.',
  },
] as const;

// ─── Factory ────────────────────────────────────────────────────────────────

export function createAcquisitionService({ supabase }: AcquisitionServiceOptions): AcquisitionService {
  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for AcquisitionService');
    return supabase;
  };

  return {
    async list(filters = {}) {
      const client = requireClient();
      let q = client.from('acquisition_orders').select()
        // red_7day → orange_30day → yellow_90day → green_defensive sort by alpha tier
        .order('urgency_tier', { ascending: true })
        .order('asset_identifier');
      if (filters.urgencyTier) q = q.eq('urgency_tier', filters.urgencyTier);
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.assetKind) q = q.eq('asset_kind', filters.assetKind);
      if (typeof filters.blocksDisclosure === 'boolean') {
        q = q.eq('blocks_disclosure', filters.blocksDisclosure);
      }
      const { data, error } = await q;
      if (error) throw new Error(`AcquisitionService.list failed: ${error.message}`);
      return (data ?? []).map(mapAcquisitionOrderRow);
    },

    async get(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('acquisition_orders').select().eq('id', id).maybeSingle();
      if (error) throw new Error(`AcquisitionService.get failed: ${error.message}`);
      return data ? mapAcquisitionOrderRow(data) : null;
    },

    async upsert(input) {
      const client = requireClient();
      AcquisitionUrgencyTier.parse(input.urgencyTier);
      const row = {
        asset_kind: input.assetKind,
        asset_identifier: input.assetIdentifier,
        urgency_tier: input.urgencyTier,
        target_registrar: input.targetRegistrar ?? null,
        price_cad: input.priceCad ?? null,
        price_usd: input.priceUsd ?? null,
        broker_contact: input.brokerContact ?? null,
        status: input.status ?? 'scoped',
        blocks_disclosure: input.blocksDisclosure ?? false,
        blocks_venture_name: input.blocksVentureName ?? null,
        notes: input.notes ?? null,
      };
      const { data, error } = await client
        .from('acquisition_orders')
        .upsert(row, { onConflict: 'asset_kind,asset_identifier' })
        .select().single();
      if (error) throw new Error(`AcquisitionService.upsert failed: ${error.message}`);
      return mapAcquisitionOrderRow(data);
    },

    async markAcquired(id, registrar, acquiredAtIso) {
      const client = requireClient();
      const { data, error } = await client
        .from('acquisition_orders')
        .update({
          status: 'acquired',
          acquired_at: acquiredAtIso ?? new Date().toISOString(),
          acquired_registrar: registrar,
        })
        .eq('id', id).select().single();
      if (error) throw new Error(`AcquisitionService.markAcquired failed: ${error.message}`);
      return mapAcquisitionOrderRow(data);
    },

    async kill(id, reason) {
      const client = requireClient();
      AcquisitionStatus.parse('killed');
      const { data, error } = await client
        .from('acquisition_orders')
        .update({ status: 'killed', notes: reason })
        .eq('id', id).select().single();
      if (error) throw new Error(`AcquisitionService.kill failed: ${error.message}`);
      return mapAcquisitionOrderRow(data);
    },

    async seedUrgent() {
      const client = requireClient();
      let inserted = 0;
      let already = 0;
      for (const seed of URGENT_ACQUISITIONS_SEED) {
        const { data: existing } = await client
          .from('acquisition_orders')
          .select('id')
          .eq('asset_kind', seed.assetKind)
          .eq('asset_identifier', seed.assetIdentifier)
          .maybeSingle();
        if (existing) {
          already += 1;
          continue;
        }
        const row = {
          asset_kind: seed.assetKind,
          asset_identifier: seed.assetIdentifier,
          urgency_tier: seed.urgencyTier,
          target_registrar: seed.targetRegistrar ?? null,
          blocks_disclosure: seed.blocksDisclosure ?? false,
          blocks_venture_name: seed.blocksVentureName ?? null,
          notes: seed.notes ?? null,
          status: 'scoped',
        };
        const { error } = await client.from('acquisition_orders').insert(row);
        if (error) throw new Error(`AcquisitionService.seedUrgent failed on ${seed.assetIdentifier}: ${error.message}`);
        inserted += 1;
      }
      return { inserted, already };
    },
  };
}

// Re-export seed data so consumers (NamingRatificationBoard empty-state, docs) can inspect.
export { URGENT_ACQUISITIONS_SEED };
