// useVentureDetail — single-roundtrip venture god-view hook (Marathon #3 T7.2).
//
// Consumes the T7.1 handler at POST /api/venture-detail with the shape:
//   { action: 'get_venture_detail', venture_id: string }
//
// One round-trip fetches: venture row, brand kit, corporate stack (jurisdictions +
// accounts), rounds, raising_rounds, recent commitments + summary, recent
// activities, and scoped personas. The view layer uses this to render the
// venture god-view without coordinating N queries.

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export interface VentureRow {
  id: string;
  name: string;
  type: string | null;
  category: string | null;
  funding_stage: string | null;
  owner_entity_id: string | null;
  parent_venture_id: string | null;
  tier: string | null;
  launch_stage: string | null;
  status: string | null;
  is_raising: boolean;
}

export interface BrandKit {
  venture_id: string;
  primary_domain: string | null;
  color_primary: string | null;
  color_accent: string | null;
  brand_kit_version: string | null;
  logo_asset_id: string | null;
}

export interface Jurisdiction {
  venture_id: string;
  jurisdiction_code: string;
  regulatory_frameworks: string[];
  tax_structure: string | null;
  compliance_rule_set_id: string | null;
}

export interface VentureAccount {
  id: string;
  venture_id: string;
  account_type: string;
  provider: string;
  currency: string;
  account_ref: string | null;
  balance_cached: number | null;
  treasury_id: string | null;
}

export interface VentureRound {
  id: string;
  name: string;
  slug: string;
  round_type: string;
  status: string;
  target_raise: number;
  total_committed: number;
  total_funded: number;
  total_investors: number;
  minimum_check: number;
  maximum_check: number | null;
  currency: string;
  is_public: boolean;
  accredited_only: boolean;
  open_date: string | null;
  close_date: string | null;
}

export interface Commitment {
  id: string;
  contact_id: string;
  round_id: string;
  status: string;
  amount: number;
  amount_usd: number;
  currency: string;
  soft_committed_at: string | null;
  funded_at: string | null;
  created_at: string;
}

export interface VentureActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_type: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
  round_id: string | null;
  commitment_id: string | null;
  contact_id: string | null;
}

export interface ScopedPersona {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  department: string;
  seniority: string;
  scope_kind: 'global' | 'venture';
  scope_value: string | null;
  avatar_url: string | null;
  accent_color: string | null;
  dimension: string | null;
  crown_affiliation: string | null;
  xp: number;
  persona_bio: string;
}

export interface VentureDetail {
  venture: VentureRow;
  brand: BrandKit | null;
  corporate_stack: { jurisdictions: Jurisdiction[]; accounts: VentureAccount[] };
  rounds: VentureRound[];
  raising_rounds: VentureRound[];
  recent_commitments: Commitment[];
  commitments_summary: {
    by_status: Record<string, number>;
    total_committed_usd: number;
    total_funded_usd: number;
    count: number;
  };
  recent_activities: VentureActivity[];
  scoped_personas: ScopedPersona[];
}

export function useVentureDetail(ventureId: string | null) {
  return useQuery({
    queryKey: ['venture-detail', ventureId],
    queryFn: () =>
      apiPost<VentureDetail>('/api/venture-detail', {
        action: 'get_venture_detail',
        venture_id: ventureId!,
      }),
    enabled: !!ventureId,
    staleTime: 20_000,
  });
}
