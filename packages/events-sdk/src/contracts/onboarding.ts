// packages/events-sdk/src/contracts/onboarding.ts
//
// Onboarding + Demo-Gate emissions — 3 thematic families on a single bus:
//
//   invites.*       — super-admin issuance lifecycle (created, accepted,
//                     revoked, expired)
//   requirements.*  — per-user signing checklist lifecycle (assigned,
//                     envelope_created, signed, waived, completed)
//   access.*        — post-onboarding access ledger (granted, revoked)
//
// All payloads are strict-validated Zod schemas. If a handler drifts and
// stops including a required field, publish() throws — the compliance
// pipeline stays honest under refactor.
//
// This module is EMIT-ONLY. subscribes: [] — downstream systems (agent
// fleet, cron reapers, analytics dashboards) register their own module
// contracts to listen.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

// ─── Shared vocab ─────────────────────────────────────────────────────────
// InviteStatus is referenced in invite.revoked.previousStatus to show the
// state the invite was in before revocation (pending | accepted). The DB
// CHECK constraint on user_document_requirements.status is the authoritative
// source for requirement-status values — events carry discrete topics per
// transition (signed, declined, waived, completed) rather than a status
// string, so no RequirementStatus enum is exported here.
const InviteStatus = z.enum(['pending', 'accepted', 'expired', 'revoked']);
const AccessLevel = z.string().min(1);   // e.g. "futurestate:invest"; free-form taxonomy
const UserId = z.string().min(1);        // Clerk user_id (text)

// ─── Core invite shape (reused across invite.* topics) ────────────────────
const InviteCore = z.object({
  inviteId: z.string().uuid(),
  invitedEmail: z.string().email(),
  invitedBy: UserId,
  bundleId: z.string().uuid(),
  bundleKey: z.string(),
  targetVentureId: z.string().nullable(),
  accessTier: z.string(),
  accessLevels: z.array(AccessLevel),
});

// ─── Core requirement shape (reused across requirements.* topics) ─────────
const RequirementCore = z.object({
  requirementId: z.string().uuid(),
  userId: UserId,
  inviteId: z.string().uuid(),
  bundleId: z.string().uuid(),
  templateId: z.string().uuid(),
  templateKey: z.string(),
  templateVersion: z.string(),
});

// ─── Core grant shape (reused across access.* topics) ─────────────────────
const GrantCore = z.object({
  grantId: z.string().uuid(),
  userId: UserId,
  inviteId: z.string().uuid().nullable(),
  ventureId: z.string().nullable(),
  accessLevel: AccessLevel,
});


export const OnboardingContract: ContractDeclaration<'onboarding'> = {
  module: 'onboarding',
  version: '1.0',

  emits: [
    // ── Invites ──────────────────────────────────────────────────────────
    {
      topic: 'onboarding.invite.created',
      schemaVersion: '1.0',
      payload: InviteCore.extend({
        expiresAt: z.string(),                  // ISO timestamp
        hasInstructions: z.boolean(),           // true if Tony wrote a personal note
      }),
      description:
        'Super-admin issued a new onboarding invite. Carries bundle + access-tier + TTL.',
    },
    {
      topic: 'onboarding.invite.accepted',
      schemaVersion: '1.0',
      payload: InviteCore.extend({
        acceptedBy: UserId,                     // Clerk user_id of the accepting user
        acceptedAt: z.string(),                 // ISO timestamp
        requirementsCount: z.number().int().nonnegative(),  // how many rows materialized
      }),
      description:
        'User claimed an invite via email link. Materializes user_document_requirements from the bundle atomically.',
    },
    {
      topic: 'onboarding.invite.revoked',
      schemaVersion: '1.0',
      payload: InviteCore.extend({
        revokedBy: UserId,
        revokedAt: z.string(),
        reason: z.string().nullable(),
        previousStatus: InviteStatus,           // was it 'pending' or already 'accepted'?
      }),
      description:
        'Super-admin revoked an invite. If previously accepted, downstream access_grants should also be revoked (handler responsibility, not auto).',
    },
    {
      topic: 'onboarding.invite.expired',
      schemaVersion: '1.0',
      payload: InviteCore.extend({
        expiredAt: z.string(),
        detectedBy: z.enum(['cron', 'read_time_check']),
      }),
      description:
        'Invite TTL elapsed without being accepted. Emitted by the expiration cron or lazily at read-time; duplicate-safe (status check gates emission).',
    },

    // ── Requirements ─────────────────────────────────────────────────────
    {
      topic: 'onboarding.requirement.assigned',
      schemaVersion: '1.0',
      payload: RequirementCore.extend({
        required: z.boolean(),
        displayOrder: z.number().int(),
      }),
      description:
        'A requirement row was materialized for a user from an accepted invite. Fired once per template in the bundle.',
    },
    {
      topic: 'onboarding.requirement.envelope.created',
      schemaVersion: '1.0',
      payload: RequirementCore.extend({
        envelopeId: z.string().uuid(),
        envelopePublicId: z.string(),           // the ?publicId= used in the signer URL
      }),
      description:
        'User clicked "Review & Sign"; a signing_envelopes row was created via MCV Sign and bound to the requirement.',
    },
    {
      topic: 'onboarding.requirement.signed',
      schemaVersion: '1.0',
      payload: RequirementCore.extend({
        envelopeId: z.string().uuid(),
        signedAt: z.string(),
      }),
      description:
        'User completed signing of the envelope. Mirrored from MCV Sign envelope-completed event with requirement context.',
    },
    {
      topic: 'onboarding.requirement.declined',
      schemaVersion: '1.0',
      payload: RequirementCore.extend({
        declinedAt: z.string(),
        reason: z.string().nullable(),
      }),
      description:
        'User rejected a required document in the signer UI. Blocks onboarding completion until the requirement is resolved (re-issued, waived, or the invite is revoked).',
    },
    {
      topic: 'onboarding.requirement.waived',
      schemaVersion: '1.0',
      payload: RequirementCore.extend({
        waivedBy: UserId,                       // super-admin who waived
        waivedAt: z.string(),
        reason: z.string(),                     // required — waivers must be justified for audit
      }),
      description:
        'Super-admin waived a specific requirement for a specific user. Narrow-scope override with mandatory reason for compliance trail.',
    },
    {
      topic: 'onboarding.requirements.completed',
      schemaVersion: '1.0',
      payload: z.object({
        userId: UserId,
        inviteId: z.string().uuid(),
        bundleId: z.string().uuid(),
        bundleKey: z.string(),
        completedAt: z.string(),
        requiredCount: z.number().int().nonnegative(),    // total required (incl. waived)
        signedCount: z.number().int().nonnegative(),
        waivedCount: z.number().int().nonnegative(),
      }),
      description:
        'All required requirements for an invite are now signed or waived. This is the gate-flip moment — handler should automatically emit access.granted for each access_level on the invite.',
    },

    // ── Access grants ────────────────────────────────────────────────────
    {
      topic: 'onboarding.access.granted',
      schemaVersion: '1.0',
      payload: GrantCore.extend({
        grantedBy: UserId,                      // 'system' for auto-grants, user_id for manual super-admin
        grantedAt: z.string(),
        source: z.enum(['invite_completion', 'manual_admin']),
      }),
      description:
        'An access grant became active for a user. Emitted either automatically on requirements.completed (source=invite_completion) or directly by super-admin (source=manual_admin).',
    },
    {
      topic: 'onboarding.access.revoked',
      schemaVersion: '1.0',
      payload: GrantCore.extend({
        revokedBy: UserId,
        revokedAt: z.string(),
        reason: z.string().nullable(),
      }),
      description:
        'An access grant was revoked. Demo gates reading this user/venture/access_level will return false after this event lands.',
    },
  ],

  subscribes: [],   // emit-only; future listeners register via their own contracts
};
