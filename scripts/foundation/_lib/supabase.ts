// scripts/foundation/_lib/supabase — service-role Supabase client for ingestion.
//
// The scripts run as Node with service-role credentials (bypasses RLS). This
// mirrors the env-loading convention used by seed-capital-foundation.ts.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Foundation ingestion requires a Supabase URL (SUPABASE_URL | VITE_SUPABASE_URL) and a service-role key (SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SERVICE_KEY) in env.');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
