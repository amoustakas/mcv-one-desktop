// Launchpad → Capital SDK bridge.
// Read-only anon client that can hit the public-rounds subset of Capital data.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createCapitalEngine, type CapitalEngine } from '@mcv/capital-sdk';

let cached: CapitalEngine | null = null;
let cachedClient: SupabaseClient | null = null;

export function getCapitalEngine(): CapitalEngine {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    console.warn('[launchpad] Supabase env missing — public rounds will be empty');
  }
  cachedClient = url && anonKey ? createClient(url, anonKey) : null;
  cached = createCapitalEngine({ supabase: cachedClient });
  return cached;
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient === null) getCapitalEngine(); // force init
  return cachedClient;
}
