// api/_handlers/venture-stack.ts
// Read-only API for venture + corporate-stack consumption.
// Actions: list-ventures, get-venture, list-jurisdictions, list-accounts, get-brand-kit.
//
// SCHEMA: ventures uses funding_stage (not 'stage') and owner_entity_id (not 'parent_entity_id').
// Both are text. is_raising added in T2.2.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface VentureStackRequest {
  action:
    | 'list-ventures'
    | 'get-venture'
    | 'list-jurisdictions'
    | 'list-accounts'
    | 'get-brand-kit';
  ventureId?: string;
}

const VENTURE_COLS = 'id, name, is_raising, funding_stage, owner_entity_id, parent_venture_id, tier, launch_stage, status, type, category';

export async function handleVentureStack(supabase: SupabaseClient, req: VentureStackRequest) {
  switch (req.action) {
    case 'list-ventures': {
      const { data, error } = await supabase
        .from('ventures')
        .select(VENTURE_COLS)
        .order('name');
      if (error) throw error;
      return { ventures: data };
    }
    case 'get-venture': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('ventures')
        .select(VENTURE_COLS)
        .eq('id', req.ventureId)
        .maybeSingle();
      if (error) throw error;
      return { venture: data };
    }
    case 'list-jurisdictions': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_jurisdictions')
        .select('*')
        .eq('venture_id', req.ventureId);
      if (error) throw error;
      return { jurisdictions: data };
    }
    case 'list-accounts': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_accounts')
        .select('*')
        .eq('venture_id', req.ventureId);
      if (error) throw error;
      return { accounts: data };
    }
    case 'get-brand-kit': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_brand_kits')
        .select('*')
        .eq('venture_id', req.ventureId)
        .maybeSingle();
      if (error) throw error;
      return { brandKit: data };
    }
  }
}
