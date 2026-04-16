// Signing rail router — picks DocuSign vs MCV Sign per venture.
//
// The Capital API's send-signing-envelope action reads this to decide
// which adapter handles the outbound envelope creation. Defaults to
// DocuSign so existing flows keep working when no config row exists;
// Ventures opt in to MCV Sign by inserting a signing_rail_config row.
//
// Global override: MCV_SIGN_FORCE_RAIL=mcv-sign | docusign — useful
// for staging + full-cutover rehearsals.

import type { SupabaseClient } from '@supabase/supabase-js';

export type SigningRail = 'mcv-sign' | 'docusign' | 'eu-sign';

const DEFAULT_RAIL: SigningRail = 'docusign';

export async function pickSigningRail(
  supabase: SupabaseClient,
  ventureId: string | null | undefined,
): Promise<SigningRail> {
  // 1. Env override wins — operations emergency lever.
  const forced = process.env.MCV_SIGN_FORCE_RAIL as SigningRail | undefined;
  if (forced === 'mcv-sign' || forced === 'docusign' || forced === 'eu-sign') return forced;

  // 2. Per-venture config.
  if (ventureId) {
    try {
      const { data } = await supabase
        .from('signing_rail_config')
        .select('rail')
        .eq('venture_id', ventureId)
        .maybeSingle();
      const rail = (data?.rail as SigningRail | undefined);
      if (rail === 'mcv-sign' || rail === 'docusign' || rail === 'eu-sign') return rail;
    } catch (err) {
      console.warn(
        '[signing-rail-router] venture config lookup failed, falling back to default:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 3. Global default — DocuSign today, flip to mcv-sign later via env
  //    DEFAULT_SIGNING_RAIL once we're confident.
  const defaultFromEnv = process.env.DEFAULT_SIGNING_RAIL as SigningRail | undefined;
  if (defaultFromEnv === 'mcv-sign' || defaultFromEnv === 'docusign' || defaultFromEnv === 'eu-sign') {
    return defaultFromEnv;
  }
  return DEFAULT_RAIL;
}
