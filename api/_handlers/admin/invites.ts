// api/_handlers/admin/invites.ts
//
// Super-admin-only invite management for the onboarding + demo-gate pipeline.
//
// POST /api/admin/invites { action, ...params }
//
// Actions (tonight's session 1 scope):
//   list-invites     → all onboarding_invites, filterable by status / email
//   get-invite       → detail view (joins bundle + accepted_user_id context)
//   create-invite    → super-admin issues a new invite
//   revoke-invite    → revoke by id with required reason
//   list-bundles     → active bundles for the invite creation picker
//   get-bundle       → bundle + all its templates in display_order
//   list-templates   → active templates (for ad-hoc bundle construction UI)
//
// EXPAND (future sessions):
//   waive-requirement     — super-admin overrides a specific user requirement
//   grant-access          — direct access grant bypassing invite flow
//   revoke-access         — revoke an active user_access_grant
//   create-bundle         — custom bundle authoring UI
//   update-bundle         — bundle template membership mutation
//   retire-bundle / retire-template — soft-delete flows
//
// Gating: this handler requires super-admin. Identification order:
//   1. Clerk publicMetadata.role === 'super_admin' (preferred long-term)
//   2. env SUPER_ADMIN_USER_IDS contains the Clerk user_id
//   3. env SUPER_ADMIN_EMAILS contains the user's primary email
//   4. Dev escape: CLERK_SECRET_KEY unset → treat all as super-admin
// EXPAND: migrate fully to (1) via Clerk metadata sync; retire env fallback.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { createPublisher } from '@mcv/events-sdk';
import { requestLogger } from '../../../src/lib/server/logger';

// ─── Clerk auth + super-admin gate ────────────────────────────────────────
interface ClerkIdentity {
  userId: string;
  email: string | null;
  role: string | null;
}

async function resolveClerkIdentity(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    // Dev escape — matches the 'no-secret' pattern in api/_handlers/foundation.ts.
    // In local dev without Clerk configured, every caller is treated as dev-admin.
    return { userId: 'dev:no-secret', email: null, role: 'super_admin' };
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
    const email = user.primaryEmailAddress?.emailAddress ?? null;
    const role = (user.publicMetadata?.role as string | undefined) ?? null;
    return { userId, email, role };
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

function isSuperAdmin(identity: ClerkIdentity): boolean {
  if (identity.role === 'super_admin') return true;

  const allowedIds = (process.env.SUPER_ADMIN_USER_IDS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (allowedIds.includes(identity.userId)) return true;

  const allowedEmails = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (identity.email && allowedEmails.includes(identity.email.toLowerCase())) return true;

  // Dev escape inherits from resolveClerkIdentity() — userId 'dev:no-secret'
  // is only produced when CLERK_SECRET_KEY is unset, indicating local dev.
  if (identity.userId === 'dev:no-secret') return true;

  return false;
}

async function requireSuperAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ClerkIdentity | null> {
  const identity = await resolveClerkIdentity(req, res);
  if (!identity) return null;
  if (!isSuperAdmin(identity)) {
    res.status(403).json({
      error: 'Super-admin access required',
      hint: 'Set user publicMetadata.role=super_admin in Clerk, or add userId to SUPER_ADMIN_USER_IDS env.',
    });
    return null;
  }
  return identity;
}

// ─── Supabase + events publisher ─────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const eventPublisher = createPublisher({ supabase });

type OnboardingTopic =
  | 'onboarding.invite.created'
  | 'onboarding.invite.accepted'
  | 'onboarding.invite.revoked'
  | 'onboarding.invite.expired'
  | 'onboarding.requirement.assigned'
  | 'onboarding.requirement.envelope_created'
  | 'onboarding.requirement.signed'
  | 'onboarding.requirement.declined'
  | 'onboarding.requirement.waived'
  | 'onboarding.requirements.completed'
  | 'onboarding.access.granted'
  | 'onboarding.access.revoked';

async function publishOnboardingEvent(
  topic: OnboardingTopic,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await eventPublisher.publish(topic, payload, {
      ventureId: (payload.targetVentureId as string | null) ?? null,
      emittedBy: 'api:admin-invites',
    });
  } catch {
    // Best-effort — state transition already happened; event emission is
    // not allowed to block the HTTP response. Failures flow through the
    // publisher's own error path + DLQ (M-F2 pickup).
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe invite code. 12 bytes → 16 chars base64url, collision
 * probability is negligible for the volumes this gates.
 * EXPAND: if the volume ever justifies, swap to ULID for time-sortable IDs.
 */
function generateInviteCode(): string {
  return crypto.randomBytes(12).toString('base64url');
}

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
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
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

  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const p = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      // ─── Invites ─────────────────────────────────────────────────────
      case 'list-invites': {
        const statusFilter = p.status as string | undefined;
        const emailFilter = p.email as string | undefined;
        let query = supabase
          .from('onboarding_invites')
          .select('*')
          .order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('status', statusFilter);
        if (emailFilter) query = query.ilike('invited_email', `%${emailFilter.toLowerCase()}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ invites: (data ?? []) as InviteRow[] });
      }

      case 'get-invite': {
        const id = p.id as string;
        if (!id) return res.status(400).json({ error: 'id required' });
        const { data, error } = await supabase
          .from('onboarding_invites')
          .select('*, bundle:bundle_id(id, bundle_key, name, description, tier)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'invite not found' });
        // Also return materialized requirements if accepted
        let requirements: unknown[] = [];
        const accepted = (data as { accepted_user_id: string | null }).accepted_user_id;
        if (accepted) {
          const { data: reqs } = await supabase
            .from('user_document_requirements')
            .select('*, template:template_id(id, template_key, title, version)')
            .eq('invite_id', id)
            .order('display_order');
          requirements = reqs ?? [];
        }
        return res.json({ invite: data, requirements });
      }

      case 'create-invite': {
        const email = (p.email as string)?.trim().toLowerCase();
        if (!email) return res.status(400).json({ error: 'email required' });
        const bundleId = p.bundle_id as string;
        if (!bundleId) return res.status(400).json({ error: 'bundle_id required' });

        // Verify bundle exists + is active
        const { data: bundle, error: bundleErr } = await supabase
          .from('document_bundles')
          .select('id, bundle_key, name, retired_at')
          .eq('id', bundleId)
          .maybeSingle();
        if (bundleErr) throw bundleErr;
        if (!bundle) return res.status(404).json({ error: 'bundle not found' });
        if ((bundle as { retired_at: string | null }).retired_at) {
          return res.status(400).json({ error: 'bundle has been retired; pick another' });
        }

        const expiresInDays = Math.max(1, Math.min(90, Number(p.expires_in_days) || 14));
        const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
        const code = generateInviteCode();
        const accessLevelsRaw = p.access_levels;
        const accessLevels: string[] = Array.isArray(accessLevelsRaw)
          ? accessLevelsRaw.map(String)
          : typeof accessLevelsRaw === 'string' ? [accessLevelsRaw] : [];

        const { data: invite, error: insertErr } = await supabase
          .from('onboarding_invites')
          .insert({
            invite_code: code,
            invited_email: email,
            invited_name: (p.name as string) ?? null,
            invited_by: admin.userId,
            bundle_id: bundleId,
            target_venture_id: (p.target_venture_id as string) ?? null,
            access_tier: (p.access_tier as string) ?? 'preview',
            access_levels: accessLevels,
            instructions_md: (p.instructions_md as string) ?? null,
            expires_at: expiresAt,
            status: 'pending',
          })
          .select('*')
          .single();
        if (insertErr) throw insertErr;
        const inviteRow = invite as InviteRow;

        await publishOnboardingEvent('onboarding.invite.created', {
          inviteId: inviteRow.id,
          invitedEmail: inviteRow.invited_email,
          invitedBy: inviteRow.invited_by,
          bundleId: inviteRow.bundle_id,
          bundleKey: (bundle as { bundle_key: string }).bundle_key,
          targetVentureId: inviteRow.target_venture_id,
          accessTier: inviteRow.access_tier,
          accessLevels,
          expiresAt: inviteRow.expires_at,
          hasInstructions: Boolean(inviteRow.instructions_md),
        });

        // Return the full invite + the URL-safe landing link
        const inviteOrigin = process.env.ONBOARDING_ORIGIN
          ?? process.env.VITE_APP_URL
          ?? 'http://localhost:5173';
        const inviteUrl = `${inviteOrigin}/accept-invite?code=${encodeURIComponent(code)}`;

        return res.json({ invite: inviteRow, inviteUrl });
      }

      case 'revoke-invite': {
        const id = p.id as string;
        if (!id) return res.status(400).json({ error: 'id required' });
        const reason = (p.reason as string | null) ?? null;

        // Read current status so the event can report previousStatus correctly.
        const { data: current, error: readErr } = await supabase
          .from('onboarding_invites')
          .select('*, bundle:bundle_id(bundle_key)')
          .eq('id', id)
          .maybeSingle();
        if (readErr) throw readErr;
        if (!current) return res.status(404).json({ error: 'invite not found' });
        const previousStatus = (current as { status: string }).status;
        if (previousStatus === 'revoked') {
          return res.json({ invite: current, already: true });
        }

        const { data: revoked, error: updateErr } = await supabase
          .from('onboarding_invites')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_by: admin.userId,
            revoked_reason: reason,
          })
          .eq('id', id)
          .select('*')
          .single();
        if (updateErr) throw updateErr;
        const revokedRow = revoked as InviteRow;

        await publishOnboardingEvent('onboarding.invite.revoked', {
          inviteId: revokedRow.id,
          invitedEmail: revokedRow.invited_email,
          invitedBy: revokedRow.invited_by,
          bundleId: revokedRow.bundle_id,
          bundleKey: (current as { bundle: { bundle_key: string } }).bundle.bundle_key,
          targetVentureId: revokedRow.target_venture_id,
          accessTier: revokedRow.access_tier,
          accessLevels: Array.isArray(revokedRow.access_levels) ? revokedRow.access_levels : [],
          revokedBy: admin.userId,
          revokedAt: revokedRow.revoked_at,
          reason,
          previousStatus,
        });

        // EXPAND: if previousStatus === 'accepted', also revoke associated
        // user_access_grants for this invite_id in a follow-up call / event
        // subscriber. Deliberately not auto-cascading here — revoke semantics
        // differ by case (are all grants revoked, or does the user keep some?),
        // so the admin dashboard (session 4) will surface the decision.

        return res.json({ invite: revokedRow });
      }

      // ─── Bundles (read-only in session 1) ────────────────────────────
      case 'list-bundles': {
        const includeRetired = p.include_retired === true || p.include_retired === 'true';
        let query = supabase
          .from('document_bundles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!includeRetired) query = query.is('retired_at', null);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ bundles: data ?? [] });
      }

      case 'get-bundle': {
        const id = p.id as string;
        if (!id) return res.status(400).json({ error: 'id required' });
        const { data: bundle, error: bErr } = await supabase
          .from('document_bundles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (bErr) throw bErr;
        if (!bundle) return res.status(404).json({ error: 'bundle not found' });
        const { data: joins, error: jErr } = await supabase
          .from('document_bundle_templates')
          .select('display_order, required, template:template_id(id, template_key, title, version, doc_type, summary)')
          .eq('bundle_id', id)
          .order('display_order');
        if (jErr) throw jErr;
        return res.json({ bundle, templates: joins ?? [] });
      }

      case 'list-templates': {
        const includeRetired = p.include_retired === true || p.include_retired === 'true';
        let query = supabase
          .from('document_templates')
          .select('*')
          .order('created_at', { ascending: false });
        if (!includeRetired) query = query.is('retired_at', null);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ templates: data ?? [] });
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          available: [
            'list-invites', 'get-invite', 'create-invite', 'revoke-invite',
            'list-bundles', 'get-bundle', 'list-templates',
          ],
        });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'request_err', err: msg });
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
