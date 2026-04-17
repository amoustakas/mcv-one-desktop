// api/_handlers/venture-stack.ts
// Read-only API for venture + corporate-stack consumption.
// Actions: list-ventures, get-venture, list-jurisdictions, list-accounts, get-brand-kit.
//
// SCHEMA: ventures uses funding_stage (not 'stage') and owner_entity_id (not 'parent_entity_id').
// Both are text. is_raising added in T2.2.
//
// ROUTING: the catchall dispatcher at api/[...slug].ts loads mod.default from here,
// so this file exposes both the pure handleVentureStack (for unit use / hook-reuse)
// AND a default-export handler that wraps it for the HTTP layer.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from './_supabase';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const result = await handleVentureStack(
      getServiceClient(),
      req.body as VentureStackRequest,
    );
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'venture-stack failed';
    console.error('[venture-stack] error:', message);
    return res.status(500).json({ error: message });
  }
}
