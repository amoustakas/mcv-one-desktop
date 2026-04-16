// Shared Capital compliance reconciliation helper.
//
// Companion to reconcile.ts (payments). Every non-payment inbound
// adapter that screens an investor contact (OFAC, AccreditedInvestor
// verification, KYC vendors) feeds a CapitalComplianceEvent through
// this helper which:
//
//   1. Stamps the result on
//      capital_investor_profile.metadata.compliance.<source>
//      so downstream gates (commit creation, distribution eligibility,
//      portal access) can read a consolidated status without calling
//      each source individually.
//   2. On outcome='match' emits a capital.compliance.match notification
//      so the bell + slack dispatcher surface it to Tony / compliance.
//   3. On outcome='review' emits capital.compliance.review_needed with
//      a lower-severity notification for batch admin triage.
//   4. On outcome='clear' stamps silently — clear screenings shouldn't
//      generate notification noise but still need auditable metadata.
//
// Never throws; webhook / action callers always continue.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CapitalComplianceEvent } from './adapters/types';

export interface ComplianceReconcileOpts {
  supabase: SupabaseClient;
}

export interface ComplianceReconcileResult {
  outcome: CapitalComplianceEvent['outcome'] | 'skipped';
  stampedAt?: string;
}

export async function reconcileCapitalCompliance(
  event: CapitalComplianceEvent | null,
  opts: ComplianceReconcileOpts,
): Promise<ComplianceReconcileResult> {
  if (!event) return { outcome: 'skipped' };

  // ── Stamp the profile ─────────────────────────────────────────────
  try {
    const { data: profile } = await opts.supabase
      .from('capital_investor_profile')
      .select('metadata')
      .eq('contact_id', event.contactId)
      .maybeSingle();
    const currentMeta = (profile?.metadata as Record<string, unknown> | undefined) ?? {};
    const currentCompliance = (currentMeta.compliance as Record<string, unknown> | undefined) ?? {};
    const nextCompliance = {
      ...currentCompliance,
      [event.source]: {
        outcome: event.outcome,
        score: event.score,
        matchedRecord: event.matchedRecord,
        screenedAt: event.screenedAt,
        strategy: event.matchDiagnostics.strategy,
        threshold: event.matchDiagnostics.threshold,
      },
    };
    await opts.supabase
      .from('capital_investor_profile')
      .update({
        metadata: { ...currentMeta, compliance: nextCompliance },
        updated_at: new Date().toISOString(),
      })
      .eq('contact_id', event.contactId);
  } catch (err) {
    console.warn(
      `[${event.source}-reconcile] profile stamp failed:`,
      err instanceof Error ? err.message : err,
    );
  }

  // ── Notify on non-clear outcomes ─────────────────────────────────
  if (event.outcome !== 'clear') {
    try {
      const matched = event.matchedRecord;
      const isMatch = event.outcome === 'match';
      const title = isMatch
        ? `Compliance MATCH on ${event.source.toUpperCase()} — contact screening`
        : `Compliance review needed (${event.source.toUpperCase()})`;
      const description = matched
        ? `${matched.name ?? '—'} (${matched.list ?? event.source}) · programs: ${(matched.programs ?? []).join(', ') || '—'} · score ${event.score.toFixed(2)}`
        : `Score ${event.score.toFixed(2)} (threshold ${event.matchDiagnostics.threshold})`;

      await opts.supabase.from('notifications').insert({
        type: isMatch ? 'error' : 'warning',
        title,
        description,
        source: 'capital',
        metadata: {
          topic: isMatch ? 'capital.compliance.match' : 'capital.compliance.review_needed',
          adapter: event.source,
          contact_id: event.contactId,
          score: event.score,
          matched_record: matched ?? null,
        },
      });
    } catch (err) {
      console.warn(
        `[${event.source}-reconcile] notification emit failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { outcome: event.outcome, stampedAt: event.screenedAt };
}
