// src/hooks/use-onboarding-gate.ts
//
// Session 3 state machine for the OnboardingHubView wizard. Unifies the
// Session 1 document pipeline + Session 2 MCV ID trust engine into one
// observable gate that the 4-step wizard reads:
//
//   welcome   → invite looked up (pre-auth) or accepted (post-auth)
//   identity  → at least one capture + trust band above 'compromised'
//   documents → all required requirements signed or waived
//   launchpad → access grants materialized, venture deep-links unlocked
//
// Single entry point — the hook fetches in parallel:
//   · /api/onboarding?action=lookup-invite&code=...   (pre-auth, when signed out)
//   · /api/onboarding?action=get-status               (post-auth aggregate)
//   · /api/identity?action=get-status                 (post-auth captures + snapshot)
//
// The wizard's shell uses `activeStep` to route, and `stepStatus` to
// render the rail. Steps read their scoped data directly from the hook
// rather than prop-drilling — keeps composition one level deep.
//
// All step-derivation lives here so the UI stays declarative: child
// steps never compute gate logic; they just render the current state and
// call `refresh()` after a user action. The hook re-derives.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type WizardStep = 'welcome' | 'identity' | 'documents' | 'launchpad';

export type StepStatus = 'locked' | 'ready' | 'in_progress' | 'complete';

export interface InvitePreview {
  id: string;
  invite_code: string;
  invited_email: string;
  invited_name: string | null;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  instructions_md: string | null;
  target_venture_id: string | null;
  access_tier: string;
  access_levels: string[];
  bundle: {
    id?: string;
    bundle_key: string;
    name: string;
    description?: string;
    tier: string;
  };
  accepted_at?: string | null;
}

export interface Requirement {
  id: string;
  user_id: string;
  invite_id: string;
  bundle_id: string;
  template_id: string;
  envelope_id: string | null;
  status: 'pending' | 'envelope_issued' | 'signed' | 'declined' | 'waived';
  required: boolean;
  display_order: number;
  signed_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  waived_at: string | null;
  template: {
    id: string;
    template_key: string;
    title: string;
    version: string;
    summary: string | null;
    doc_type: string;
  };
}

export interface AccessGrant {
  id: string;
  user_id: string;
  invite_id: string | null;
  venture_id: string | null;
  access_level: string;
  granted_at: string;
  revoked_at: string | null;
}

export interface TrustSnapshot {
  user_id: string;
  trust_score: number;
  trust_band: 'compromised' | 'baseline' | 'verified' | 'elevated' | 'sovereign';
  civic_clearance: 'basic' | 'verified' | 'sovereign';
  computed_at: string;
}

export interface IdentityStatus {
  hasPasskey: boolean;
  hasSelfie: boolean;
  snapshot: TrustSnapshot | null;
}

export interface OnboardingGate {
  // Meta
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userId: string | null;

  // Invite
  inviteCode: string | null;
  invite: InvitePreview | null;
  inviteAccepted: boolean;
  accepting: boolean;
  acceptError: string | null;
  acceptInvite: () => Promise<void>;

  // Identity
  identity: IdentityStatus;
  identitySatisfied: boolean;

  // Documents
  requirements: Requirement[];
  documentsComplete: boolean;
  requiredCount: number;
  satisfiedCount: number;

  // Launchpad
  accessGrants: AccessGrant[];

  // Derived navigation
  activeStep: WizardStep;
  stepStatus: Record<WizardStep, StepStatus>;

  // Control
  refresh: () => Promise<void>;
  refreshKey: number;
}

// ─── API envelopes ────────────────────────────────────────────────────────

interface OnboardingStatusResponse {
  userId: string;
  email: string | null;
  invites: Array<InvitePreview & { bundle: { bundle_key: string; name: string; tier: string } }>;
  requirements: Requirement[];
  accessGrants: AccessGrant[];
}

interface LookupInviteResponse {
  invite: InvitePreview;
}

interface IdentityStatusResponse {
  userId: string;
  email: string | null;
  captures: Array<{ id: string; capture_kind: string; status: string; captured_at: string }>;
  snapshot: TrustSnapshot;
  hasPasskey: boolean;
  hasSelfie: boolean;
}

// ─── URL helpers ──────────────────────────────────────────────────────────

function readInviteCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  // Accept both URL shapes: /onboard?invite=CODE (Session 3 route) and
  // /accept-invite?code=CODE (the admin-invites create-invite handler's
  // default inviteUrl). Either lands here and resolves identically.
  return params.get('invite') ?? params.get('code');
}

// ─── Fetch helpers ────────────────────────────────────────────────────────
// We use fetch directly (not the global `api` wrapper) so we can call pre-auth
// endpoints cleanly when the user isn't signed in. The wrapper in src/lib/api
// requires a token getter which is only set post-auth.

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit, bearer?: string | null): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (typeof body?.error === 'string') message = body.error;
    } catch { /* body not JSON */ }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useOnboardingGate(): OnboardingGate {
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const { user } = useUser();

  const [inviteCode] = useState<string | null>(readInviteCodeFromUrl);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [identity, setIdentity] = useState<IdentityStatus>({
    hasPasskey: false,
    hasSelfie: false,
    snapshot: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Track AbortController for the in-flight fetch so rapid refreshes don't
  // stomp each other (a StrictMode double-mount will trigger two refreshes
  // on first render; this guarantees at most one set of setState calls wins).
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Auth hasn't resolved yet — hold the loading state, don't fire requests.
    if (!authLoaded) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const bearer = isSignedIn ? await getToken() : null;

      if (!isSignedIn) {
        // Pre-auth branch: only try lookup-invite if there's a code in the URL.
        if (inviteCode) {
          const body = await fetchJSON<LookupInviteResponse>(
            `/api/onboarding?action=lookup-invite&code=${encodeURIComponent(inviteCode)}`,
            { signal: ctrl.signal },
          );
          if (ctrl.signal.aborted) return;
          setInvite(normalizeInvite(body.invite));
        } else {
          setInvite(null);
        }
        setRequirements([]);
        setAccessGrants([]);
        setIdentity({ hasPasskey: false, hasSelfie: false, snapshot: null });
        return;
      }

      // Post-auth branch: parallel fetch of onboarding + identity aggregates.
      const [onboarding, identityStatus] = await Promise.all([
        fetchJSON<OnboardingStatusResponse>('/api/onboarding?action=get-status', { signal: ctrl.signal }, bearer),
        // Identity status may return 500 for a user with zero captures (depending on engine
        // handling of empty batches) — fall back to a neutral snapshot in that case.
        fetchJSON<IdentityStatusResponse>('/api/identity?action=get-status', { signal: ctrl.signal }, bearer).catch(
          () => null,
        ),
      ]);

      if (ctrl.signal.aborted) return;

      // Pick the right invite: if URL has ?invite= and it matches an accepted one, use it;
      // otherwise use the most recent accepted invite; if lookup is needed for an unaccepted
      // code, fall back to the pre-auth lookup.
      let selected: InvitePreview | null = null;
      const acceptedInvites = onboarding.invites ?? [];
      if (inviteCode) {
        const match = acceptedInvites.find((i) => i.invite_code === inviteCode);
        if (match) {
          selected = normalizeInvite(match);
        } else {
          try {
            const lookup = await fetchJSON<LookupInviteResponse>(
              `/api/onboarding?action=lookup-invite&code=${encodeURIComponent(inviteCode)}`,
              { signal: ctrl.signal },
            );
            if (ctrl.signal.aborted) return;
            selected = normalizeInvite(lookup.invite);
          } catch {
            // invite not found / expired / revoked — fall through to any accepted invite
          }
        }
      }
      if (!selected && acceptedInvites.length > 0) {
        selected = normalizeInvite(acceptedInvites[0]);
      }

      setInvite(selected);

      // Requirements + grants — scope to the selected invite when possible so
      // the wizard doesn't conflate multiple invites in one view.
      const scopedReqs = selected
        ? (onboarding.requirements ?? []).filter((r) => r.invite_id === selected!.id)
        : onboarding.requirements ?? [];
      setRequirements(scopedReqs);

      const scopedGrants = selected
        ? (onboarding.accessGrants ?? []).filter((g) => g.invite_id === selected!.id || g.venture_id === selected!.target_venture_id)
        : onboarding.accessGrants ?? [];
      setAccessGrants(scopedGrants);

      setIdentity({
        hasPasskey: identityStatus?.hasPasskey ?? false,
        hasSelfie: identityStatus?.hasSelfie ?? false,
        snapshot: identityStatus?.snapshot ?? null,
      });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [authLoaded, isSignedIn, getToken, inviteCode]);

  useEffect(() => {
    // load() is a useCallback — every setState inside it fires from a
    // network callback (after await fetchJSON) or behind an ctrl.signal
    // aborted check, never synchronously in this effect body. React 19's
    // static analysis can't trace across the useCallback boundary, so
    // we silence the rule here with intent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => abortRef.current?.abort();
  }, [load, refreshKey]);

  const refresh = useCallback(async () => {
    setRefreshKey((n) => n + 1);
  }, []);

  const acceptInvite = useCallback(async () => {
    if (!isSignedIn) {
      setAcceptError('Sign in to accept the invite.');
      return;
    }
    if (!invite) {
      setAcceptError('No invite loaded.');
      return;
    }
    setAccepting(true);
    setAcceptError(null);
    try {
      const bearer = await getToken();
      await fetchJSON(
        '/api/onboarding',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'accept-invite', code: invite.invite_code }),
        },
        bearer,
      );
      await refresh();
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : String(err));
    } finally {
      setAccepting(false);
    }
  }, [isSignedIn, getToken, invite, refresh]);

  // ─── Derive active step + step statuses ────────────────────────────────

  const inviteAccepted = !!(invite && invite.status === 'accepted');

  // Identity satisfied: at least one capture AND trust band strictly above 'compromised'.
  // The identity-sdk TRUST_BANDS.COMPROMISED_MAX is 20; baseline is 21-50. A fresh passkey
  // puts most users into baseline immediately.
  const identitySatisfied =
    (identity.hasPasskey || identity.hasSelfie) &&
    (!identity.snapshot || identity.snapshot.trust_band !== 'compromised');

  const requiredRequirements = requirements.filter((r) => r.required);
  const satisfiedRequirements = requiredRequirements.filter(
    (r) => r.status === 'signed' || r.status === 'waived',
  );
  const documentsComplete =
    inviteAccepted &&
    requiredRequirements.length > 0 &&
    satisfiedRequirements.length === requiredRequirements.length;

  const accessGrantsActive = accessGrants.filter((g) => !g.revoked_at);

  const { activeStep, stepStatus } = useMemo<{
    activeStep: WizardStep;
    stepStatus: Record<WizardStep, StepStatus>;
  }>(() => {
    // Step status derivation — the wizard rail renders based on these alone.
    const s: Record<WizardStep, StepStatus> = {
      welcome: inviteAccepted ? 'complete' : invite ? 'ready' : 'locked',
      identity: !inviteAccepted
        ? 'locked'
        : identitySatisfied
          ? 'complete'
          : identity.hasPasskey || identity.hasSelfie
            ? 'in_progress'
            : 'ready',
      documents: !inviteAccepted || !identitySatisfied
        ? 'locked'
        : documentsComplete
          ? 'complete'
          : satisfiedRequirements.length > 0
            ? 'in_progress'
            : 'ready',
      launchpad: !documentsComplete
        ? 'locked'
        : accessGrantsActive.length > 0
          ? 'complete'
          : 'ready',
    };

    // Active = first non-complete step; if all complete, lock focus on launchpad.
    const order: WizardStep[] = ['welcome', 'identity', 'documents', 'launchpad'];
    const firstIncomplete = order.find((step) => s[step] !== 'complete');
    const active = firstIncomplete ?? 'launchpad';

    return { activeStep: active, stepStatus: s };
  }, [
    inviteAccepted,
    invite,
    identitySatisfied,
    identity.hasPasskey,
    identity.hasSelfie,
    documentsComplete,
    satisfiedRequirements.length,
    accessGrantsActive.length,
  ]);

  return {
    loading: loading || !authLoaded,
    error,
    isSignedIn: !!isSignedIn,
    userId: user?.id ?? null,
    inviteCode,
    invite,
    inviteAccepted,
    accepting,
    acceptError,
    acceptInvite,
    identity,
    identitySatisfied,
    requirements,
    documentsComplete,
    requiredCount: requiredRequirements.length,
    satisfiedCount: satisfiedRequirements.length,
    accessGrants: accessGrantsActive,
    activeStep,
    stepStatus,
    refresh,
    refreshKey,
  };
}

// ─── Normalization ────────────────────────────────────────────────────────
// The onboarding API returns `access_levels` as `unknown` JSON; coerce to a
// string[] at the boundary so downstream consumers don't re-check shape.

function normalizeInvite(raw: unknown): InvitePreview {
  const r = raw as Partial<InvitePreview> & {
    access_levels?: unknown;
    bundle?: Partial<InvitePreview['bundle']> | null;
  };
  return {
    id: String(r.id ?? ''),
    invite_code: String(r.invite_code ?? ''),
    invited_email: String(r.invited_email ?? ''),
    invited_name: r.invited_name ?? null,
    invited_by: String(r.invited_by ?? ''),
    status: (r.status ?? 'pending') as InvitePreview['status'],
    expires_at: String(r.expires_at ?? ''),
    instructions_md: r.instructions_md ?? null,
    target_venture_id: r.target_venture_id ?? null,
    access_tier: String(r.access_tier ?? ''),
    access_levels: Array.isArray(r.access_levels) ? (r.access_levels as string[]) : [],
    bundle: {
      bundle_key: String(r.bundle?.bundle_key ?? ''),
      name: String(r.bundle?.name ?? ''),
      description: r.bundle?.description,
      tier: String(r.bundle?.tier ?? ''),
    },
    accepted_at: (r as { accepted_at?: string | null }).accepted_at ?? null,
  };
}
