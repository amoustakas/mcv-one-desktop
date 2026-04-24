// api/_handlers/onboarding.ts
//
// User-facing onboarding API — how a prospect claims an invite, sees their
// signing checklist, kicks off signature envelopes, and progresses the
// completion → access-grant pipeline.
//
// POST /api/onboarding { action, ...params }
//
// Actions (tonight's session 1 scope):
//   lookup-invite        → public: validate an invite code pre-auth (shows
//                          what the user's about to accept on a landing page)
//   accept-invite        → authed: claim an invite via its code, materializes
//                          user_document_requirements from the bundle
//   list-my-requirements → authed: user's current signing checklist
//   start-signing        → authed: materialize/return envelope for a specific
//                          requirement (delegates to template-envelope-bridge)
//   check-completion     → authed: recompute status; if all required
//                          requirements signed/waived, emit completed +
//                          materialize access_grants (idempotent)
//   get-status           → authed: full progress snapshot (invite + requirements
//                          + access grants)
//
// This handler is the user's entry point. Super-admin flows live in
// api/_handlers/admin/invites.ts.
//
// EXPAND: MCV Sign completion webhook → subscribes to signing-envelope
// executed events and auto-calls check-completion. Today the UI drives
// the recomputation explicitly after each sign.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublisher } from '@mcv/events-sdk';
import { requestLogger } from '../../src/lib/server/logger';
import { materializeEnvelopeForRequirement } from '../../src/lib/onboarding/template-envelope-bridge';

// ─── Auth (same dev-escape pattern as foundation.ts) ─────────────────────
interface ClerkIdentity {
  userId: string;
  email: string | null;
  name: string | null;
}

async function resolveIdentity(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { userId: 'dev:no-secret', email: null, name: null };
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken, createClerkClient } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    const userId = payload.sub;
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(userId);
    return {
      userId,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    };
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

// ─── Supabase + events ────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const eventPublisher = createPublisher({ supabase });

type OnboardingTopic =
  | 'onboarding.invite.accepted'
  | 'onboarding.requirement.assigned'
  | 'onboarding.requirement.envelope.created'
  | 'onboarding.requirement.signed'
  | 'onboarding.requirements.completed'
  | 'onboarding.access.granted';

async function publish(
  topic: OnboardingTopic,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await eventPublisher.publish(topic, payload, {
      ventureId: (payload.targetVentureId as string | null | undefined) ?? (payload.ventureId as string | null | undefined) ?? null,
      emittedBy: 'api:onboarding',
    });
  } catch {
    // Best-effort — state has already transitioned.
  }
}

// ─── Types ────────────────────────────────────────────────────────────────
interface InviteRow {
  id: string;
  invite_code: string;
  invited_email: string;
  invited_name: string | null;
  invited_by: string;
  bundle_id: string;
  target_venture_id: string | null;
  access_tier: string;
  access_levels: unknown;
  status: string;
  instructions_md: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  created_at: string;
}

interface BundleTemplateJoin {
  template_id: string;
  display_order: number;
  required: boolean;
  template: { id: string; template_key: string; title: string; version: string };
}

interface RequirementRow {
  id: string;
  user_id: string;
  invite_id: string;
  bundle_id: string;
  template_id: string;
  envelope_id: string | null;
  status: string;
  required: boolean;
  display_order: number;
  signed_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  waived_at: string | null;
  created_at: string;
}

// ─── Handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in' });
  res.on('finish', () => {
    log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
  });

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const p = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  // ─── Public action: lookup-invite ─────────────────────────────────────
  // Deliberately pre-auth so the landing page can render "You've been
  // invited by X to review Bundle Y" without requiring sign-in first.
  // Leaks only surface info (invitedEmail, bundle name, tier) — not
  // template bodies.
  if (action === 'lookup-invite') {
    const code = p.code as string;
    if (!code) return res.status(400).json({ error: 'code required' });
    const { data, error } = await supabase
      .from('onboarding_invites')
      .select('id, invite_code, invited_email, invited_name, status, expires_at, instructions_md, target_venture_id, access_tier, access_levels, bundle:bundle_id(id, bundle_key, name, description, tier)')
      .eq('invite_code', code)
      .maybeSingle();
    if (error) {
      log.error({ event: 'lookup_err', err: error.message });
      return res.status(500).json({ error: error.message });
    }
    if (!data) return res.status(404).json({ error: 'invite not found' });
    const row = data as unknown as Record<string, unknown> & { status: string; expires_at: string };
    const now = new Date();
    if (row.status === 'revoked') return res.status(410).json({ error: 'invite revoked' });
    if (new Date(row.expires_at) < now && row.status !== 'accepted') {
      return res.status(410).json({ error: 'invite expired' });
    }
    return res.json({ invite: row });
  }

  // All other actions require auth.
  const identity = await resolveIdentity(req, res);
  if (!identity) return;

  try {
    switch (action) {
      case 'accept-invite': {
        const code = p.code as string;
        if (!code) return res.status(400).json({ error: 'code required' });

        // 1. Load invite + validate.
        const { data: inviteRaw, error: inviteErr } = await supabase
          .from('onboarding_invites')
          .select('*, bundle:bundle_id(bundle_key)')
          .eq('invite_code', code)
          .maybeSingle();
        if (inviteErr) throw inviteErr;
        if (!inviteRaw) return res.status(404).json({ error: 'invite not found' });
        const invite = inviteRaw as InviteRow & { bundle: { bundle_key: string } };

        if (invite.status === 'revoked') {
          return res.status(410).json({ error: 'invite revoked' });
        }
        if (invite.status === 'accepted') {
          // Idempotent — if the same user already accepted, just return.
          if (invite.accepted_user_id === identity.userId) {
            return res.json({ invite, already: true });
          }
          return res.status(409).json({ error: 'invite already claimed by another user' });
        }
        if (new Date(invite.expires_at) < new Date()) {
          return res.status(410).json({ error: 'invite expired' });
        }

        // 2. Load bundle's templates in order.
        const { data: joinsRaw, error: joinsErr } = await supabase
          .from('document_bundle_templates')
          .select('template_id, display_order, required, template:template_id(id, template_key, title, version)')
          .eq('bundle_id', invite.bundle_id)
          .order('display_order');
        if (joinsErr) throw joinsErr;
        const joins = (joinsRaw ?? []) as unknown as BundleTemplateJoin[];
        if (joins.length === 0) {
          return res.status(500).json({ error: 'bundle has no templates — contact super-admin' });
        }

        // 3. Flip invite to accepted + insert requirements atomically.
        //    Supabase doesn't support multi-statement transactions through
        //    PostgREST, so we do it in two calls and rely on the UNIQUE
        //    constraint (user_id, invite_id, template_id) to make re-runs
        //    idempotent.
        const acceptedAt = new Date().toISOString();
        const { error: patchErr } = await supabase
          .from('onboarding_invites')
          .update({
            status: 'accepted',
            accepted_at: acceptedAt,
            accepted_user_id: identity.userId,
          })
          .eq('id', invite.id);
        if (patchErr) throw patchErr;

        const rows = joins.map((j) => ({
          user_id: identity.userId,
          invite_id: invite.id,
          bundle_id: invite.bundle_id,
          template_id: j.template_id,
          required: j.required,
          display_order: j.display_order,
          status: 'pending',
        }));
        const { data: insertedReqs, error: reqInsertErr } = await supabase
          .from('user_document_requirements')
          .upsert(rows, { onConflict: 'user_id,invite_id,template_id', ignoreDuplicates: false })
          .select('id, template_id, display_order, required');
        if (reqInsertErr) throw reqInsertErr;

        // 4. Emit invite.accepted + one requirement.assigned per row.
        const accessLevels = Array.isArray(invite.access_levels)
          ? invite.access_levels as string[]
          : [];
        await publish('onboarding.invite.accepted', {
          inviteId: invite.id,
          invitedEmail: invite.invited_email,
          invitedBy: invite.invited_by,
          bundleId: invite.bundle_id,
          bundleKey: invite.bundle.bundle_key,
          targetVentureId: invite.target_venture_id,
          accessTier: invite.access_tier,
          accessLevels,
          acceptedBy: identity.userId,
          acceptedAt,
          requirementsCount: (insertedReqs ?? []).length,
        });

        for (const req of insertedReqs ?? []) {
          const join = joins.find((j) => j.template_id === (req as { template_id: string }).template_id);
          if (!join) continue;
          await publish('onboarding.requirement.assigned', {
            requirementId: (req as { id: string }).id,
            userId: identity.userId,
            inviteId: invite.id,
            bundleId: invite.bundle_id,
            templateId: join.template.id,
            templateKey: join.template.template_key,
            templateVersion: join.template.version,
            required: (req as { required: boolean }).required,
            displayOrder: (req as { display_order: number }).display_order,
          });
        }

        return res.json({ invite, requirementsCount: (insertedReqs ?? []).length });
      }

      case 'list-my-requirements': {
        const { data, error } = await supabase
          .from('user_document_requirements')
          .select('*, template:template_id(id, template_key, title, version, summary, doc_type), invite:invite_id(id, target_venture_id, access_tier)')
          .eq('user_id', identity.userId)
          .order('created_at', { ascending: false })
          .order('display_order');
        if (error) throw error;
        return res.json({ requirements: data ?? [] });
      }

      case 'start-signing': {
        const requirementId = p.requirement_id as string;
        if (!requirementId) return res.status(400).json({ error: 'requirement_id required' });
        if (!identity.email) {
          return res.status(400).json({ error: 'user email unavailable — cannot route signing URL' });
        }
        const result = await materializeEnvelopeForRequirement(supabase, {
          requirementId,
          userId: identity.userId,
          userEmail: identity.email,
          userName: identity.name ?? undefined,
          correlationId,
        });

        // Emit envelope_created only on fresh issuance (idempotent re-calls don't re-emit).
        if (!result.alreadyIssued) {
          const { data: ctx } = await supabase
            .from('user_document_requirements')
            .select('id, invite_id, bundle_id, template_id, template:template_id(template_key, version)')
            .eq('id', requirementId)
            .maybeSingle();
          const ctxRow = ctx as unknown as {
            id: string; invite_id: string; bundle_id: string; template_id: string;
            template: { template_key: string; version: string };
          } | null;
          if (ctxRow) {
            await publish('onboarding.requirement.envelope.created', {
              requirementId: ctxRow.id,
              userId: identity.userId,
              inviteId: ctxRow.invite_id,
              bundleId: ctxRow.bundle_id,
              templateId: ctxRow.template_id,
              templateKey: ctxRow.template.template_key,
              templateVersion: ctxRow.template.version,
              envelopeId: result.envelopeId,
              envelopePublicId: result.envelopePublicId,
            });
          }
        }

        return res.json({
          envelopeId: result.envelopeId,
          envelopePublicId: result.envelopePublicId,
          signingUrl: result.signingUrl,
          expiresAt: result.expiresAt,
          alreadyIssued: result.alreadyIssued,
        });
      }

      case 'check-completion': {
        const inviteId = p.invite_id as string;
        if (!inviteId) return res.status(400).json({ error: 'invite_id required' });

        // 1. Reconcile any envelopes that have completed but the requirement
        //    hasn't been flipped yet. Reads signing_envelopes.status and
        //    patches the requirement when envelope is 'signed'.
        const { data: reqsRaw, error: reqsErr } = await supabase
          .from('user_document_requirements')
          .select('id, envelope_id, status, required, template_id, bundle_id, template:template_id(template_key, version)')
          .eq('user_id', identity.userId)
          .eq('invite_id', inviteId);
        if (reqsErr) throw reqsErr;
        const reqs = (reqsRaw ?? []) as unknown as Array<RequirementRow & { template: { template_key: string; version: string } }>;

        for (const r of reqs) {
          if (r.status === 'envelope_issued' && r.envelope_id) {
            const { data: env } = await supabase
              .from('signing_envelopes')
              .select('status')
              .eq('id', r.envelope_id)
              .maybeSingle();
            const envStatus = (env as { status: string } | null)?.status;
            if (envStatus === 'signed') {
              const signedAt = new Date().toISOString();
              await supabase
                .from('user_document_requirements')
                .update({ status: 'signed', signed_at: signedAt, updated_at: signedAt })
                .eq('id', r.id);
              r.status = 'signed';
              r.signed_at = signedAt;
              await publish('onboarding.requirement.signed', {
                requirementId: r.id,
                userId: identity.userId,
                inviteId,
                bundleId: r.bundle_id,
                templateId: r.template_id,
                templateKey: r.template.template_key,
                templateVersion: r.template.version,
                envelopeId: r.envelope_id,
                signedAt,
              });
            }
          }
        }

        // 2. Is every required requirement now signed-or-waived?
        const requiredReqs = reqs.filter((r) => r.required);
        const satisfied = requiredReqs.filter((r) => r.status === 'signed' || r.status === 'waived');
        const completed = requiredReqs.length > 0 && satisfied.length === requiredReqs.length;

        if (!completed) {
          return res.json({
            completed: false,
            requiredCount: requiredReqs.length,
            satisfiedCount: satisfied.length,
            pendingCount: requiredReqs.length - satisfied.length,
          });
        }

        // 3. Completion — check if we've already materialized grants for this invite.
        //    The UNIQUE (user_id, venture_id, access_level) WHERE revoked_at IS NULL
        //    partial index guarantees grant insert idempotency.
        const { data: inviteRaw } = await supabase
          .from('onboarding_invites')
          .select('*, bundle:bundle_id(bundle_key)')
          .eq('id', inviteId)
          .maybeSingle();
        const invite = inviteRaw as (InviteRow & { bundle: { bundle_key: string } }) | null;
        if (!invite) return res.status(404).json({ error: 'invite not found' });

        const accessLevels = Array.isArray(invite.access_levels) ? invite.access_levels as string[] : [];
        const completedAt = new Date().toISOString();

        await publish('onboarding.requirements.completed', {
          userId: identity.userId,
          inviteId,
          bundleId: invite.bundle_id,
          bundleKey: invite.bundle.bundle_key,
          completedAt,
          requiredCount: requiredReqs.length,
          signedCount: requiredReqs.filter((r) => r.status === 'signed').length,
          waivedCount: requiredReqs.filter((r) => r.status === 'waived').length,
        });

        // 4. Materialize access_grants (one per access_level on the invite).
        const grantsToInsert = accessLevels.map((level) => ({
          user_id: identity.userId,
          invite_id: inviteId,
          venture_id: invite.target_venture_id,
          access_level: level,
          granted_by: 'system',
        }));

        const newGrants: Array<{ id: string; access_level: string; venture_id: string | null }> = [];
        if (grantsToInsert.length > 0) {
          const { data: grantedRaw, error: grantErr } = await supabase
            .from('user_access_grants')
            .upsert(grantsToInsert, {
              onConflict: 'user_id,venture_id,access_level',
              ignoreDuplicates: true,
            })
            .select('id, access_level, venture_id');
          if (grantErr) {
            log.error({ event: 'grant_upsert_err', err: grantErr.message });
          } else {
            newGrants.push(...((grantedRaw ?? []) as Array<{ id: string; access_level: string; venture_id: string | null }>));
          }
        }

        for (const g of newGrants) {
          await publish('onboarding.access.granted', {
            grantId: g.id,
            userId: identity.userId,
            inviteId,
            ventureId: g.venture_id,
            accessLevel: g.access_level,
            grantedBy: 'system',
            grantedAt: completedAt,
            source: 'invite_completion',
          });
        }

        return res.json({
          completed: true,
          requiredCount: requiredReqs.length,
          satisfiedCount: satisfied.length,
          grantsGranted: newGrants.length,
          accessLevels,
        });
      }

      case 'get-status': {
        // Aggregate snapshot: all invites this user has accepted + their
        // requirements + their active grants. Useful for the onboarding
        // hub dashboard (session 3) and demo-gate checks (session 5).
        const [invitesR, reqsR, grantsR] = await Promise.all([
          supabase
            .from('onboarding_invites')
            .select('*, bundle:bundle_id(bundle_key, name, tier)')
            .eq('accepted_user_id', identity.userId)
            .order('accepted_at', { ascending: false }),
          supabase
            .from('user_document_requirements')
            .select('*, template:template_id(id, template_key, title, version, summary, doc_type)')
            .eq('user_id', identity.userId)
            .order('display_order'),
          supabase
            .from('user_access_grants')
            .select('*')
            .eq('user_id', identity.userId)
            .is('revoked_at', null),
        ]);
        return res.json({
          userId: identity.userId,
          email: identity.email,
          invites: invitesR.data ?? [],
          requirements: reqsR.data ?? [],
          accessGrants: grantsR.data ?? [],
        });
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          available: [
            'lookup-invite', 'accept-invite', 'list-my-requirements',
            'start-signing', 'check-completion', 'get-status',
          ],
        });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'request_err', err: msg });
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
