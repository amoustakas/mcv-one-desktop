// api/_handlers/identity.ts
//
// MCV ID capture + trust snapshot API. Session 2 of the onboarding + demo-
// gate epic. Produces the step-up signals the identity-sdk's trust engine
// consumes; persists them to identity_captures; materializes the derived
// score into user_trust_snapshots; emits typed events on every mutation.
//
// POST /api/identity { action, ...params }
//
// Actions:
//   start-passkey     → public-ish: returns a WebAuthn challenge + RP id
//                       the browser feeds into navigator.credentials.create()
//   verify-passkey    → authed: persists a successful WebAuthn enrollment,
//                       refreshes trust snapshot, emits enrolled event
//   upload-selfie     → authed: accepts base64 JPEG frame, uploads to the
//                       private identity-captures bucket, persists a face-
//                       landmark capture, refreshes trust, emits enrolled
//   get-status        → authed: the user's active captures + trust snapshot
//                       (hydrates the IdentityStatusCard on the client)
//   refresh-trust     → authed: force a snapshot recompute without a new
//                       capture (useful when trust-engine tuning changes or
//                       a client detects a stale snapshot)
//   revoke-capture    → authed: soft-delete a capture (user-initiated); the
//                       trust snapshot recomputes without that signal.
//                       Super-admin-initiated revocation will land as a
//                       separate admin/identity.ts handler in a later session.
//
// Trust refresh invariant (critical — referenced in the migration comments):
//   Every capture mutation MUST walk identity_captures → reconstruct a
//   TelemetrySignalBatch → call computeTrustScore() → upsert snapshot →
//   emit trust.refreshed. Never write to user_trust_snapshots directly
//   from elsewhere — the snapshot must always be reproducible by re-running
//   the pure engine over the captures.
//
// EXPAND (explicit future work, flagged inline below):
//   · True WebAuthn attestation verification via @simplewebauthn/server
//     (today we trust the browser ceremony and store the credentialId only)
//   · MediaPipe face-landmarker liveness score computation
//     (today we stamp a conservative default 0.7 liveness on accepted frames)
//   · Iris capture kind + associated MediaPipe iris-landmarker
//   · Civic federation kinds (Interac Verified, ePassport chip read, mDL, etc.)
//   · Super-admin / agent revocation path with audit of revoked_by

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  computeTrustScore,
  TRUST_BANDS,
  type StepUpSignal,
  type AmbientSignal,
  type CivicSignal,
  type TelemetrySignalBatch,
  type SignalContribution,
  type IdentityFracture,
} from '@mcv/identity-sdk';
import { createPublisher } from '@mcv/events-sdk';
import { requestLogger } from '../../src/lib/server/logger';

// ─── Auth (mirrors api/_handlers/onboarding.ts) ───────────────────────────
interface ClerkIdentity {
  userId: string;
  email: string | null;
}

async function resolveIdentity(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { userId: 'dev:no-secret', email: null };
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

type IdentityTopic =
  | 'identity.capture.enrolled'
  | 'identity.capture.verified'
  | 'identity.capture.failed'
  | 'identity.capture.revoked'
  | 'identity.trust.refreshed';

async function publish(
  topic: IdentityTopic,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await eventPublisher.publish(topic, payload, {
      ventureId: null,                             // identity is an org-level concern (no venture scope)
      emittedBy: 'api:identity',
    });
  } catch {
    // Best-effort — the DB state transition has already succeeded.
  }
}

// ─── Trust band mapping (derived from @mcv/identity-sdk TRUST_BANDS) ──────
type TrustBand = 'compromised' | 'baseline' | 'verified' | 'elevated' | 'sovereign';

function scoreToBand(score: number): TrustBand {
  if (score <= TRUST_BANDS.COMPROMISED_MAX) return 'compromised';
  if (score <= TRUST_BANDS.BASELINE_MAX) return 'baseline';
  if (score <= TRUST_BANDS.VERIFIED_MAX) return 'verified';
  if (score <= TRUST_BANDS.ELEVATED_MAX) return 'elevated';
  return 'sovereign';
}

// ─── Signal batch reconstruction ──────────────────────────────────────────
// Walks the user's active identity_captures rows, parses the signal_payload
// jsonb into the identity-sdk signal union, and sorts them into the three
// TelemetrySignalBatch buckets. The pure engine then consumes this batch.
//
// Note: the engine's staleness check uses observedAtMs; for persisted
// captures we always pass the stored timestamp so re-runs of the engine
// with a fresh `nowMs` will correctly age out stale signals even if the
// row was never touched.

interface CaptureRow {
  id: string;
  user_id: string;
  capture_kind: string;
  status: string;
  signal_payload: unknown;
  captured_at: string;
  revoked_at: string | null;
}

function reconstructBatch(rows: CaptureRow[]): TelemetrySignalBatch {
  const ambient: AmbientSignal[] = [];
  const stepUp: StepUpSignal[] = [];
  const civic: CivicSignal[] = [];

  for (const row of rows) {
    if (row.revoked_at) continue;
    const payload = row.signal_payload as Record<string, unknown> | null;
    if (!payload || typeof payload !== 'object' || !('kind' in payload)) continue;

    switch (row.capture_kind) {
      case 'passkey':
      case 'face-landmark':
      case 'iris': {
        stepUp.push(payload as unknown as StepUpSignal);
        break;
      }
      case 'interac-verified':
      case 'epassport-chip':
      case 'mobile-drv-lic':
      case 'provincial-oidc':
      case 'login-gov': {
        civic.push(payload as unknown as CivicSignal);
        break;
      }
      default:
        // EXPAND: ambient signals (Play Integrity, reCAPTCHA Enterprise, etc.)
        // will land with their own capture_kinds; push onto `ambient` here.
        break;
    }
  }

  return { ambient, stepUp, civic };
}

// ─── Trust snapshot refresh (the invariant helper) ────────────────────────
// Called from every mutating action. Re-walks identity_captures, re-runs
// the pure trust engine, upserts user_trust_snapshots, emits the event.

interface RefreshResult {
  trustScore: number;
  trustBand: TrustBand;
  civicClearance: 'basic' | 'verified' | 'sovereign';
  contributions: SignalContribution[];
  activeFractures: IdentityFracture[];
  computedAtMs: number;
}

async function refreshTrustSnapshot(
  userId: string,
  trigger: 'capture_enrolled' | 'capture_verified' | 'capture_revoked' | 'manual_refresh' | 'cron_recompute',
  triggerCaptureId: string | null,
): Promise<RefreshResult> {
  const { data: rowsRaw } = await supabase
    .from('identity_captures')
    .select('id, user_id, capture_kind, status, signal_payload, captured_at, revoked_at')
    .eq('user_id', userId)
    .is('revoked_at', null);

  const rows = (rowsRaw ?? []) as unknown as CaptureRow[];
  const batch = reconstructBatch(rows);
  const now = Date.now();

  // Pure call — engine has no I/O; see identity-sdk/trust-engine.ts
  const result = computeTrustScore(batch, { nowMs: now });
  const band = scoreToBand(result.score);

  await supabase
    .from('user_trust_snapshots')
    .upsert({
      user_id: userId,
      trust_score: result.score,
      trust_band: band,
      civic_clearance: result.civicClearance,
      contributions: result.contributions,
      active_fractures: result.fractures,
      computed_at: new Date(result.computedAtMs).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  await publish('identity.trust.refreshed', {
    userId,
    trustScore: result.score,
    trustBand: band,
    civicClearance: result.civicClearance,
    contributions: result.contributions,
    activeFractures: result.fractures,
    trigger,
    triggerCaptureId,
    computedAtMs: result.computedAtMs,
  });

  return {
    trustScore: result.score,
    trustBand: band,
    civicClearance: result.civicClearance,
    contributions: result.contributions,
    activeFractures: result.fractures,
    computedAtMs: result.computedAtMs,
  };
}

// ─── WebAuthn helpers ─────────────────────────────────────────────────────
// Session 2 scope is enrollment persistence + trust-score plumbing. True
// cryptographic attestation verification (COSE-key parse, RP-ID hash
// check, signature verify) is deferred to @simplewebauthn/server — EXPAND.
// The client-side ceremony is still strong (user-presence + authenticator
// attestation); what we defer is server-side adversarial validation.

function generateWebAuthnChallenge(): string {
  // 32 random bytes → base64url. Long enough to resist replay in the
  // ceremony window.
  return crypto.randomBytes(32).toString('base64url');
}

function resolveRpId(req: VercelRequest): string {
  // Browser must see an RP ID that matches (or is a registrable suffix of)
  // the current origin's hostname. In dev we fall back to 'localhost';
  // in prod we read from the request host. EXPAND: pin to VERCEL_URL or
  // a hardcoded domain list when the app is on a known domain.
  const host = (req.headers.host as string | undefined) ?? 'localhost';
  // Strip port so WebAuthn accepts the RP id.
  return host.split(':')[0] ?? 'localhost';
}

// Parse a base64 image payload which may be either a bare base64 string or
// a data URL (the latter is what canvas.toDataURL('image/jpeg') produces).
// Returns { mime, base64, ext }. Uses String.match so the parse sidesteps
// RegExp.exec — equivalent capture-group behaviour either way.
function parseImagePayload(input: string): { mime: string; base64: string; ext: string } {
  const m = input.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
  const mime = m?.[1] ?? 'image/jpeg';
  const base64 = m?.[2] ?? input;
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return { mime, base64, ext };
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

  const identity = await resolveIdentity(req, res);
  if (!identity) return;

  try {
    switch (action) {
      // ─── Passkey enrollment: challenge issue ─────────────────────────
      case 'start-passkey': {
        const rpId = resolveRpId(req);
        const challenge = generateWebAuthnChallenge();
        // We don't persist the challenge server-side yet — the verify step
        // trusts the client round-trip. EXPAND: store a short-TTL row in a
        // dedicated webauthn_challenges table to prevent replay.
        return res.json({
          challenge,                               // base64url
          rpId,
          rpName: 'MCV One',
          userId: identity.userId,
          userName: identity.email ?? identity.userId,
          userDisplayName: identity.email ?? identity.userId,
          // Reasonable defaults; the browser honours these during
          // navigator.credentials.create({ publicKey: ... }).
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },        // ES256
            { type: 'public-key', alg: -257 },      // RS256
          ],
          timeoutMs: 60_000,
          attestation: 'none',                      // EXPAND: 'direct' when we verify attestations
        });
      }

      // ─── Passkey enrollment: persist ─────────────────────────────────
      case 'verify-passkey': {
        const credentialId = p.credentialId as string | undefined;
        const publicKey = p.publicKey as string | undefined;        // base64url COSE key, optional
        const clientData = p.clientDataJSON as string | undefined;
        const attestationObject = p.attestationObject as string | undefined;

        if (!credentialId) {
          return res.status(400).json({ error: 'credentialId required' });
        }

        // EXPAND: verify attestation via @simplewebauthn/server here. Input
        // shape above is already the standard registration response the
        // library accepts. Without the verify call, a client could POST a
        // fabricated credentialId — acceptable in pre-production, not in
        // prod.

        const nowIso = new Date().toISOString();
        const stepUpSignal: StepUpSignal = {
          kind: 'passkey',
          authenticatorId: credentialId,
          observedAtMs: Date.now(),
        };

        // Detect replacement vs. first-time enrollment for the event flag.
        const { data: priorRaw } = await supabase
          .from('identity_captures')
          .select('id')
          .eq('user_id', identity.userId)
          .eq('capture_kind', 'passkey')
          .is('revoked_at', null)
          .maybeSingle();
        const replacedPriorCapture = !!priorRaw;

        const { data: upsertedRaw, error } = await supabase
          .from('identity_captures')
          .upsert({
            user_id: identity.userId,
            capture_kind: 'passkey',
            status: 'enrolled',
            external_credential_id: credentialId,
            credential_public_key: publicKey ?? null,
            signal_payload: stepUpSignal as unknown as Record<string, unknown>,
            metadata: {
              clientDataJSON: clientData ?? null,
              attestationObject: attestationObject ?? null,
              userAgent: req.headers['user-agent'] ?? null,
            },
            captured_at: nowIso,
            updated_at: nowIso,
          }, { onConflict: 'user_id,capture_kind' })
          .select('id')
          .single();
        if (error) throw error;
        const captureId = (upsertedRaw as { id: string }).id;

        await publish('identity.capture.enrolled', {
          captureId,
          userId: identity.userId,
          captureKind: 'passkey',
          enrolledAt: nowIso,
          replacedPriorCapture,
          attestationRef: credentialId,
        });

        const trust = await refreshTrustSnapshot(identity.userId, 'capture_enrolled', captureId);

        return res.json({ captureId, replacedPriorCapture, trust });
      }

      // ─── Selfie capture: upload + persist ────────────────────────────
      case 'upload-selfie': {
        const imageBase64 = p.imageBase64 as string | undefined;
        if (!imageBase64) {
          return res.status(400).json({ error: 'imageBase64 required' });
        }

        const { mime, base64, ext } = parseImagePayload(imageBase64);
        const buffer = Buffer.from(base64, 'base64');

        if (buffer.length > 5 * 1024 * 1024) {
          return res.status(413).json({ error: 'selfie exceeds 5MB cap' });
        }

        const storagePath = `${identity.userId}/face-landmark.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('identity-captures')
          .upload(storagePath, buffer, {
            contentType: mime,
            upsert: true,                          // re-capture overwrites prior frame
          });
        if (uploadErr) {
          log.error({ event: 'selfie_upload_err', err: uploadErr.message });
          return res.status(500).json({ error: `selfie upload failed: ${uploadErr.message}` });
        }

        // Provisional liveness defaults — the identity-sdk engine treats
        // these as a mid-range positive signal (not enough to flip a band on
        // its own, but enough to move score). EXPAND: compute real liveness
        // + micro-expression variance via MediaPipe face-landmarker before
        // persisting, and surface low-confidence frames as capture.failed.
        const stepUpSignal: StepUpSignal = {
          kind: 'face-landmark',
          livenessScore: 0.7,
          microExpressionVariance: 0.1,
          observedAtMs: Date.now(),
        };

        const { data: priorRaw } = await supabase
          .from('identity_captures')
          .select('id')
          .eq('user_id', identity.userId)
          .eq('capture_kind', 'face-landmark')
          .is('revoked_at', null)
          .maybeSingle();
        const replacedPriorCapture = !!priorRaw;

        const nowIso = new Date().toISOString();
        const { data: upsertedRaw, error } = await supabase
          .from('identity_captures')
          .upsert({
            user_id: identity.userId,
            capture_kind: 'face-landmark',
            status: 'enrolled',
            storage_path: storagePath,
            signal_payload: stepUpSignal as unknown as Record<string, unknown>,
            metadata: {
              mime,
              sizeBytes: buffer.length,
              userAgent: req.headers['user-agent'] ?? null,
              provisional: true,                   // EXPAND flag — liveness not truly computed yet
            },
            captured_at: nowIso,
            updated_at: nowIso,
          }, { onConflict: 'user_id,capture_kind' })
          .select('id')
          .single();
        if (error) throw error;
        const captureId = (upsertedRaw as { id: string }).id;

        await publish('identity.capture.enrolled', {
          captureId,
          userId: identity.userId,
          captureKind: 'face-landmark',
          enrolledAt: nowIso,
          replacedPriorCapture,
          attestationRef: storagePath,
        });

        const trust = await refreshTrustSnapshot(identity.userId, 'capture_enrolled', captureId);

        return res.json({ captureId, storagePath, replacedPriorCapture, trust });
      }

      // ─── Aggregate status read ───────────────────────────────────────
      case 'get-status': {
        const [capturesR, snapshotR] = await Promise.all([
          supabase
            .from('identity_captures')
            .select('id, capture_kind, status, external_credential_id, storage_path, captured_at, revoked_at, metadata')
            .eq('user_id', identity.userId)
            .is('revoked_at', null)
            .order('captured_at', { ascending: false }),
          supabase
            .from('user_trust_snapshots')
            .select('*')
            .eq('user_id', identity.userId)
            .maybeSingle(),
        ]);

        // If no snapshot exists yet, seed one now so clients always get a
        // deterministic shape (the baseline score 50 / civic 'basic').
        let snapshot = snapshotR.data as Record<string, unknown> | null;
        if (!snapshot) {
          const trust = await refreshTrustSnapshot(identity.userId, 'manual_refresh', null);
          snapshot = {
            user_id: identity.userId,
            trust_score: trust.trustScore,
            trust_band: trust.trustBand,
            civic_clearance: trust.civicClearance,
            contributions: trust.contributions,
            active_fractures: trust.activeFractures,
            computed_at: new Date(trust.computedAtMs).toISOString(),
          };
        }

        const captures = capturesR.data ?? [];
        const hasPasskey = captures.some((c) => (c as { capture_kind: string }).capture_kind === 'passkey');
        const hasSelfie = captures.some((c) => (c as { capture_kind: string }).capture_kind === 'face-landmark');

        return res.json({
          userId: identity.userId,
          email: identity.email,
          captures,
          snapshot,
          hasPasskey,
          hasSelfie,
        });
      }

      // ─── Force recompute (no capture change) ─────────────────────────
      case 'refresh-trust': {
        const trust = await refreshTrustSnapshot(identity.userId, 'manual_refresh', null);
        return res.json({ trust });
      }

      // ─── User-initiated revoke ───────────────────────────────────────
      case 'revoke-capture': {
        const captureId = p.captureId as string | undefined;
        const reason = (p.reason as string | undefined) ?? null;
        if (!captureId) return res.status(400).json({ error: 'captureId required' });

        // Ownership check — user can only revoke their own captures. Super-
        // admin revocation is a separate flow (EXPAND: admin/identity.ts).
        const { data: rowRaw, error: fetchErr } = await supabase
          .from('identity_captures')
          .select('id, user_id, capture_kind, revoked_at')
          .eq('id', captureId)
          .maybeSingle();
        if (fetchErr) throw fetchErr;
        const row = rowRaw as { id: string; user_id: string; capture_kind: string; revoked_at: string | null } | null;
        if (!row) return res.status(404).json({ error: 'capture not found' });
        if (row.user_id !== identity.userId) {
          return res.status(403).json({ error: 'cannot revoke captures owned by another user' });
        }
        if (row.revoked_at) {
          return res.json({ alreadyRevoked: true, captureId });
        }

        const nowIso = new Date().toISOString();
        await supabase
          .from('identity_captures')
          .update({
            status: 'revoked',
            revoked_at: nowIso,
            revoked_by: identity.userId,
            revoked_reason: reason,
            updated_at: nowIso,
          })
          .eq('id', captureId);

        await publish('identity.capture.revoked', {
          captureId,
          userId: identity.userId,
          captureKind: row.capture_kind,
          revokedAt: nowIso,
          revokedBy: identity.userId,
          reason,
        });

        const trust = await refreshTrustSnapshot(identity.userId, 'capture_revoked', captureId);
        return res.json({ captureId, trust });
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          available: [
            'start-passkey', 'verify-passkey', 'upload-selfie',
            'get-status', 'refresh-trust', 'revoke-capture',
          ],
        });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'request_err', err: msg });
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
