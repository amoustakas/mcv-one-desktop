// Capital × VerifyInvestor — LegacyAdapter (accreditation-verification).
// Epic 13 Story 9. Second CapitalComplianceEvent-emitting adapter; the
// first one to close the loop between Epic 13 (Legacy Interop) and
// Epic 11 (MCV Identity) by auto-issuing an AccreditedInvestorCredential
// VC when the vendor returns a verified-accredited status.
//
// Shape is outbound-primary with an inbound webhook leg (mirrors the
// DocuSign shape documented in docs/capital/LEGACY_ADAPTERS.md §Outbound):
//
//   Outbound:  createVerificationRequest(contactId, basis) → { url, requestId }
//              Investor visits the URL, uploads tax docs / bank statements.
//   Inbound:   webhook POSTs verification.completed event
//              → adapter.fromForeign → CapitalComplianceEvent
//              → reconcileCapitalCompliance stamps profile
//              → when outcome='clear' (accredited), host-app auto-issues a
//                signed Ed25519 VC via issueAccreditationCredential and
//                stamps capital_investor_profile.metadata.vc so the Epic 11
//                VC gate passes on accredited-only rounds.
//
// Outcome mapping (CapitalComplianceEvent):
//   'clear'  = verified accredited / qualified_purchaser (positive)
//   'match'  = verified non_accredited (hard fail; blocks accredited-only)
//   'review' = docs incomplete, pending, rejected-with-remediable-reason
//
// This interpretation of 'match' extends the compliance-event contract
// beyond sanctions — match = "matched a disqualifying outcome", whatever
// that means for the adapter. The gate logic in compliance-gate.ts
// already treats 'match' as a hard block, which matches the desired
// behavior here: a VerifyInvestor rejection should block accredited-only
// commitments just as an OFAC match blocks all commitments.

import type { LegacyAdapter, CapitalComplianceEvent } from './types';

export type VerifyInvestorStatus = 'approved' | 'rejected' | 'needs_info' | 'expired';

/** Envelope shape we receive from the VerifyInvestor webhook. Field
 *  names follow the vendor's published schema so the mapping is a
 *  straight shallow copy — no translation layer required. */
export interface VerifyInvestorEvent {
  id: string;                         // vendor request id
  type: 'verification.completed' | 'verification.rejected' | 'verification.pending';
  status: VerifyInvestorStatus;
  subject: {
    id: string;                       // vendor-side subject id
    contactId: string;                // our crm_contacts.id (stamped at request creation)
    clerkUserId?: string;
    email?: string;
  };
  /** Basis for the accredited determination when status='approved'.
   *  Omitted on rejections. Maps to the VC's AccreditationCredentialSubject. */
  accreditationBasis?: 'income' | 'net_worth' | 'entity' | 'professional' | 'qualified_purchaser';
  jurisdiction?: 'US' | 'CA' | 'EU' | 'UK' | 'other';
  /** Vendor-provided rejection reason / needs-info checklist items. */
  remediationHints?: string[];
  determinedAt: string;               // ISO
  metadata?: Record<string, unknown>;
}

/** Subset of the outbound-request payload we persist for audit. */
export interface VerificationRequestSummary {
  requestId: string;
  contactId: string;
  hostedUrl: string;
  status: 'pending';
  createdAt: string;
}

export interface VerifyInvestorAdapterOptions {
  /** Reserved for future options — empty today to mirror other adapter
   *  constructors and keep the factory signature uniform. */
  _reserved?: never;
}

/** Map the vendor status to a CapitalComplianceEvent.outcome. Exported
 *  so the gate and UI layers can classify statuses the same way without
 *  duplicating logic. */
export function vendorStatusToOutcome(
  status: VerifyInvestorStatus,
  basis?: VerifyInvestorEvent['accreditationBasis'],
): CapitalComplianceEvent['outcome'] {
  if (status === 'approved') {
    return 'clear'; // accredited or qualified_purchaser — either passes the gate
  }
  if (status === 'rejected') {
    // Rejection without remediation path = verified non-accredited = hard fail
    return 'match';
  }
  // needs_info / expired — actionable by admin or investor; flag for review
  void basis; // reserved for future per-basis routing
  return 'review';
}

export function createVerifyInvestorAdapter(
  _opts?: VerifyInvestorAdapterOptions,
): LegacyAdapter<VerifyInvestorEvent, CapitalComplianceEvent> {
  return {
    id: 'verify-investor',

    async fromForeign(event) {
      if (!event?.id || !event?.subject?.contactId) return null;
      const outcome = vendorStatusToOutcome(event.status, event.accreditationBasis);

      return {
        contactId: event.subject.contactId,
        outcome,
        // Score isn't inherent to accreditation (it's a boolean-like
        // decision); we surface 1.0 for approved, 0.0 for rejected, 0.5
        // for review-requiring states so downstream dashboards can sort.
        score: outcome === 'clear' ? 1 : outcome === 'match' ? 0 : 0.5,
        source: 'verify-investor',
        matchedRecord: outcome === 'clear' ? undefined : {
          name: event.subject.email ?? event.subject.id,
          list: 'VerifyInvestor',
          programs: event.remediationHints ?? [],
          sourceEntryId: event.id,
        },
        screenedAt: event.determinedAt,
        rawEvent: event,
        matchDiagnostics: {
          strategy: 'verify-investor-determination',
          threshold: 1, // binary: approved/other; threshold kept for shape uniformity
        },
      };
    },

    // toForeign is omitted here because outbound goes through
    // createVerificationRequest (below) which handles the API call
    // directly. A future refactor can fold that into toForeign if we
    // standardize on a TRequest type shared across outbound adapters.
  };
}

export interface CreateVerificationRequestInput {
  contactId: string;
  clerkUserId?: string;
  email?: string;
  /** Redirect URL after the investor completes the flow. */
  returnUrl?: string;
}

/**
 * Outbound leg — create a verification request with the VerifyInvestor
 * API. This scaffold returns a mocked request when VERIFY_INVESTOR_API_KEY
 * is absent so dev + tests work without cred procurement. Real API wiring
 * swaps the mock branch for a POST to VerifyInvestor's /requests endpoint.
 */
export async function createVerificationRequest(
  input: CreateVerificationRequestInput,
): Promise<VerificationRequestSummary> {
  const apiKey = process.env.VERIFY_INVESTOR_API_KEY;
  const baseUrl = process.env.VERIFY_INVESTOR_BASE_URL ?? 'https://verifyinvestor.com/api/v2';

  if (!apiKey) {
    // Mock path — sandbox/dev. The request id uses a deterministic
    // prefix so tests can assert the path without spying on fetch.
    return {
      requestId: `mock_${input.contactId}_${Date.now()}`,
      contactId: input.contactId,
      hostedUrl: `${baseUrl}/mock-hosted-flow?contact=${encodeURIComponent(input.contactId)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  const res = await fetch(`${baseUrl}/requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: input.contactId,
      email: input.email,
      return_url: input.returnUrl,
      metadata: { contactId: input.contactId, clerkUserId: input.clerkUserId },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`VerifyInvestor request failed: ${res.status} ${text}`);
  }
  const data = await res.json() as { id: string; hosted_url: string; created_at?: string };
  return {
    requestId: data.id,
    contactId: input.contactId,
    hostedUrl: data.hosted_url,
    status: 'pending',
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}
