// Capital compliance gate — consolidated check run before mutations
// that create or transition commitments, distributions, and portal
// access.
//
// Reads from capital_investor_profile.metadata.compliance — the
// canonical location stamped by every compliance adapter via
// reconcileCapitalCompliance. No per-vendor logic lives here; the gate
// simply reads the normalized outcome field.
//
// Gate policy (per LEGACY_ADAPTERS.md §Outcome → downstream gate):
//
//   outcome | commit create | distribution | portal access
//   --------|---------------|--------------|---------------
//   clear   | allow         | allow        | allow
//   review  | allow w/ flag | allow w/ flag| allow
//   match   | 403 block     | 403 block    | read-only
//
// Missing screening (no `compliance.<source>` entry) is treated as
// 'unscreened' — allowed in development (backwards-compat with the
// pre-OFAC flow) and flagged. Production policy is configurable via
// CAPITAL_REQUIRE_OFAC_SCREENING=1 which upgrades missing-screening to
// a 403.

import type { SupabaseClient } from '@supabase/supabase-js';

export type ComplianceGateOutcome =
  | { allow: true; flag?: 'review' | 'unscreened' }
  | { allow: false; code: string; error: string; matchedRecord?: Record<string, unknown> };

export interface CheckOfacGateOpts {
  supabase: SupabaseClient;
  contactId: string;
  /** When true, missing screening → 403 with code=OFAC_UNSCREENED.
   *  Defaults to env CAPITAL_REQUIRE_OFAC_SCREENING === '1'. */
  requireScreening?: boolean;
}

interface ComplianceSourceEntry {
  outcome?: 'clear' | 'review' | 'match';
  score?: number;
  matchedRecord?: Record<string, unknown>;
  screenedAt?: string;
}

/**
 * Gate a commitment / distribution / portal mutation on the contact's
 * OFAC screening result.
 *
 *   match       → 403 OFAC_MATCH (blocks; admin must resolve)
 *   review      → allow but flag (caller should log + warn)
 *   clear       → allow
 *   no record   → 'unscreened' flag, or 403 OFAC_UNSCREENED in prod
 *                 when CAPITAL_REQUIRE_OFAC_SCREENING=1
 */
export async function checkOfacGate(opts: CheckOfacGateOpts): Promise<ComplianceGateOutcome> {
  const requireScreening =
    opts.requireScreening ?? process.env.CAPITAL_REQUIRE_OFAC_SCREENING === '1';

  const { data: profile } = await opts.supabase
    .from('capital_investor_profile')
    .select('metadata')
    .eq('contact_id', opts.contactId)
    .maybeSingle();

  const metadata = (profile?.metadata as Record<string, unknown> | undefined) ?? {};
  const compliance = (metadata.compliance as Record<string, ComplianceSourceEntry> | undefined) ?? {};
  const ofac = compliance.ofac;

  if (!ofac || !ofac.outcome) {
    if (requireScreening) {
      return {
        allow: false,
        code: 'OFAC_UNSCREENED',
        error: 'OFAC screening required before commitment — run screen_investor_ofac on this contact first.',
      };
    }
    return { allow: true, flag: 'unscreened' };
  }

  if (ofac.outcome === 'match') {
    return {
      allow: false,
      code: 'OFAC_MATCH',
      error: `Contact is OFAC-listed; commitments blocked until manual compliance review clears the flag.`,
      matchedRecord: ofac.matchedRecord,
    };
  }

  if (ofac.outcome === 'review') {
    return { allow: true, flag: 'review' };
  }

  return { allow: true };
}
