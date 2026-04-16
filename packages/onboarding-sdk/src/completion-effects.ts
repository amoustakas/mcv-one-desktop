// Pure-function side-effect planner for journey completion.
// Given a completed journey + its prospect, returns an array of intent
// objects describing what the API handler should write into ecosystem
// tables (contacts, capital_investor_profile, etc.).
//
// Mirrors the orchestrator pattern (DB-agnostic, unit-testable). Both
// the Desktop API (api/_handlers/prospects.ts) and the wizard API
// (apps/onboarding/src/app/api/prospect/route.ts) call this and translate
// intents to writes — the rules live here, exactly once.

import type { ProspectJourney, ProspectProfile, TrackName } from './types';
import type { VentureId } from './assignments';
import { TRACKS } from './tracks';

// ───────────────────────────────────────────────────────────────────────────
// Intent shapes the API handler consumes.
// ───────────────────────────────────────────────────────────────────────────

export interface UpsertContactIntent {
  kind: 'upsert_contact';
  /** Idempotency key — handler uses contacts.metadata.prospect_id to find existing. */
  prospect_id: string;
  email: string;
  name: string;
  venture_id: string | null;
  type: 'investor' | 'partner' | 'creator' | 'team' | 'ally' | 'lead';
  status: 'active' | 'lead';
  source: 'onboarding_wizard';
  lifecycle_stage: 'qualified_lead' | 'customer' | 'evangelist';
  lead_score: number;
  /** Synthetic owner used until the prospect becomes a real Clerk user. */
  user_id: string;
  metadata: Record<string, unknown>;
}

// Aligned with capital_investor_profile CHECK constraints in prod.
export type InvestorContactType =
  | 'prospect' | 'angel' | 'vc' | 'lp' | 'institutional'
  | 'strategic_partner' | 'advisor' | 'key_person'
  | 'transfer_agent' | 'legal' | 'service_provider';
export type InvestorStage =
  | 'cold' | 'warm' | 'engaged' | 'soft_commit' | 'due_diligence'
  | 'signed' | 'funded' | 'active_investor' | 'churned' | 'dormant';
export type AccreditationStatus =
  | 'unknown' | 'not_accredited' | 'self_certified'
  | 'verified_accredited' | 'qualified_purchaser' | 'institutional' | 'exempt';
export type KycStatus =
  | 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';

export interface UpsertInvestorProfileIntent {
  kind: 'upsert_investor_profile';
  /** Resolved by the handler after it creates/finds the contact. */
  prospect_id: string;
  venture_id: string;
  contact_type: InvestorContactType;
  stage: InvestorStage;
  accreditation_status: AccreditationStatus;
  kyc_status: KycStatus;
  portal_enabled: boolean;
  lead_score: number;
  metadata: Record<string, unknown>;
}

export type CompletionIntent = UpsertContactIntent | UpsertInvestorProfileIntent;

// ───────────────────────────────────────────────────────────────────────────
// Idempotency check
// ───────────────────────────────────────────────────────────────────────────

export function effectsAlreadyApplied(journey: ProspectJourney): boolean {
  return Boolean((journey.metadata as { effects_applied?: boolean }).effects_applied);
}

// ───────────────────────────────────────────────────────────────────────────
// Main rule: track → intents
// ───────────────────────────────────────────────────────────────────────────

export function runJourneyCompletionEffects(opts: {
  journey: ProspectJourney;
  profile: ProspectProfile;
  venture_id: VentureId;
}): CompletionIntent[] {
  const { journey, profile } = opts;

  // Skip if already run.
  if (effectsAlreadyApplied(journey)) return [];

  const intents: CompletionIntent[] = [];
  const ventureId = opts.venture_id;
  const track = journey.track as TrackName;
  const trackDef = TRACKS[track];
  const baseName = profile.full_name?.trim() || profile.email;

  // Universal: every completed journey produces a contacts row.
  // Type derived from track's role_hint with a fallback.
  const contactType = roleHintToContactType(trackDef.role_hint, track);

  intents.push({
    kind: 'upsert_contact',
    prospect_id: profile.id,
    email: profile.email,
    name: baseName,
    venture_id: ventureId,
    type: contactType,
    status: 'active',
    source: 'onboarding_wizard',
    lifecycle_stage: 'qualified_lead',
    lead_score: leadScoreFor(track),
    user_id: `prospect:${profile.id}`,
    metadata: {
      prospect_id: profile.id,
      completion_journey_id: journey.id,
      track,
      country: profile.country,
      role_hint: profile.role_hint,
    },
  });

  // Investor tracks → also produce a capital_investor_profile row.
  // Requires ventureId because the table is venture-scoped.
  if (track === 'investor_retail' || track === 'investor_accredited') {
    if (ventureId) {
      intents.push({
        kind: 'upsert_investor_profile',
        prospect_id: profile.id,
        venture_id: ventureId,
        // Onboarding completion = warm prospect; not a real money commitment yet.
        contact_type: 'prospect',
        // 'engaged' = they completed onboarding but haven't soft-committed to a round.
        stage: 'engaged',
        // accredited track → pending real verification; retail track → not_accredited.
        accreditation_status: track === 'investor_accredited' ? 'unknown' : 'not_accredited',
        // kyc_basic passed in journey → 'pending' (full KYC still required for some actions).
        kyc_status: 'pending',
        portal_enabled: false,        // credentials_issued is stubbed in Phase 2
        lead_score: leadScoreFor(track),
        metadata: {
          completion_journey_id: journey.id,
          track,
          source_channel: profile.source_channel,
        },
      });
    }
    // No ventureId → investor_profile is meaningless without venture scope.
    // The contact alone preserves the lead; admin can re-engage later.
  }

  return intents;
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function roleHintToContactType(
  roleHint: string | null,
  track: TrackName,
): UpsertContactIntent['type'] {
  switch (roleHint) {
    case 'investor': return 'investor';
    case 'partner':  return 'partner';
    case 'creator':  return 'creator';
    case 'team':     return 'team';
    case 'ally':     return 'ally';
    default:
      // waitlist + unknown → 'lead' (preserves the relationship without overcommitting)
      return track === 'waitlist' ? 'lead' : 'lead';
  }
}

function leadScoreFor(track: TrackName): number {
  switch (track) {
    case 'investor_accredited': return 80;
    case 'investor_retail':     return 60;
    case 'partner':             return 70;
    case 'creator':             return 60;
    case 'team_member':         return 90;
    case 'ally':                return 95;
    case 'waitlist':            return 30;
  }
}
