// src/components/identity/IdentityStatusCard.tsx
//
// The user's live MCV ID status — the read-side surface over
// user_trust_snapshots + identity_captures. Displays:
//
//   · Trust score (0-100) + band (compromised → sovereign) with a cyan
//     progress bar scaled against the identity-sdk's TRUST_BANDS.
//   · Civic clearance tier (basic | verified | sovereign).
//   · Signal-by-signal contribution list — the audit-grade explain
//     breakdown the trust engine returns so the user can see exactly why
//     their score is where it is.
//   · Active identity fractures (empty in the happy path — populated only
//     when the engine detected a contradiction across signals).
//
// Data is hydrated on mount from GET /api/identity?action=get-status. A
// manual "Recompute" button triggers /refresh-trust. Subscribers can
// instead listen to identity.trust.refreshed events (Session 3 will wire
// that from the events-sdk's realtime subscriber).
//
// Component-level note: we *don't* recompute the score client-side even
// though @mcv/identity-sdk exposes computeTrustScore as a pure function.
// The browser doesn't have all the signals — ambient Play Integrity,
// civic proofs, etc. arrive server-side. The snapshot is the authoritative
// read; the SDK import here is only for TRUST_BANDS + types so band
// thresholds stay synchronized with the engine.

import { useEffect, useState } from 'react';
import { TRUST_BANDS } from '@mcv/identity-sdk';
import type {
  CivicClearance,
  SignalContribution,
  IdentityFracture,
} from '@mcv/identity-sdk';

type TrustBand = 'compromised' | 'baseline' | 'verified' | 'elevated' | 'sovereign';

interface Snapshot {
  user_id: string;
  trust_score: number;
  trust_band: TrustBand;
  civic_clearance: CivicClearance;
  contributions: SignalContribution[];
  active_fractures: IdentityFracture[];
  computed_at: string;
}

interface CaptureRow {
  id: string;
  capture_kind: string;
  status: string;
  captured_at: string;
}

interface StatusResponse {
  userId: string;
  email: string | null;
  captures: CaptureRow[];
  snapshot: Snapshot;
  hasPasskey: boolean;
  hasSelfie: boolean;
}

interface IdentityStatusCardProps {
  /** Optional hint — re-fetch when it changes (e.g. parent saw an enroll). */
  refreshKey?: number | string;
}

export default function IdentityStatusCard({ refreshKey }: IdentityStatusCardProps) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  // Bumps to force a re-fetch after recompute without needing a parent
  // prop change. Combined with refreshKey so either trigger re-runs the
  // effect.
  const [reloadTick, setReloadTick] = useState(0);

  // Data fetching lives entirely inside the effect so every setState call
  // happens inside an async microtask (after `await`), never synchronously
  // in the effect body. AbortController provides cancellation so a second
  // refresh landing before the first resolves can't write stale data.
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch('/api/identity?action=get-status', { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) {
          const err = await safeErrorBody(res);
          throw new Error(err ?? `get-status failed (${res.status})`);
        }
        const body = (await res.json()) as StatusResponse;
        if (controller.signal.aborted) return;
        setData(body);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [refreshKey, reloadTick]);

  async function recompute() {
    setRecomputing(true);
    try {
      const res = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh-trust' }),
      });
      if (!res.ok) {
        const err = await safeErrorBody(res);
        throw new Error(err ?? `refresh-trust failed (${res.status})`);
      }
      // Trigger the effect's re-fetch via key bump — keeps the fetch logic
      // in one place instead of duplicating it in an event handler.
      setReloadTick((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRecomputing(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="mcv-glass-card mcv-glass-neural" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading identity status…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mcv-glass-card mcv-glass-neural" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--error)' }}>Could not load identity status: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { snapshot } = data;
  const band = snapshot.trust_band;
  const color = bandColor(band);

  return (
    <div className="mcv-glass-card mcv-glass-neural" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            MCV ID trust
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Computed from {snapshot.contributions.length}{' '}
            {snapshot.contributions.length === 1 ? 'signal' : 'signals'} · updated{' '}
            {formatRelative(snapshot.computed_at)}
          </p>
        </div>
        <button
          type="button"
          className={
            recomputing
              ? 'mcv-btn mcv-btn-sm mcv-btn-ghost mcv-btn-loading'
              : 'mcv-btn mcv-btn-sm mcv-btn-ghost'
          }
          onClick={recompute}
          disabled={recomputing}
        >
          {recomputing && <span className="mcv-btn-spinner" aria-hidden />}
          Recompute
        </button>
      </div>

      {/* Score + band */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 40, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {snapshot.trust_score}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
        <span
          className="mcv-badge mcv-badge-md mcv-badge-outline"
          style={{ color, borderColor: color, marginLeft: 'auto' }}
        >
          {band}
        </span>
      </div>

      {/* Progress bar with band threshold ticks */}
      <ScoreBar score={snapshot.trust_score} color={color} />

      {/* Civic clearance */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Civic clearance</span>
        <span
          className="mcv-badge mcv-badge-sm mcv-badge-outline"
          style={{ color: civicColor(snapshot.civic_clearance), borderColor: civicColor(snapshot.civic_clearance) }}
        >
          {snapshot.civic_clearance}
        </span>
      </div>

      {/* Fracture warnings */}
      {snapshot.active_fractures.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.24)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--error)', marginBottom: 4 }}>
            Active fractures ({snapshot.active_fractures.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-primary)', fontSize: 11, lineHeight: 1.5 }}>
            {snapshot.active_fractures.map((f) => (
              <li key={`${f.kind}-${f.description}`}>
                <strong>{f.kind}:</strong> {f.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contribution breakdown */}
      {snapshot.contributions.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            Signal contributions
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {snapshot.contributions.map((c, idx) => (
              <li
                key={`${c.signalKind}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.signalKind}</div>
                  <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.reason}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    color: c.delta >= 0 ? 'var(--success, #10b981)' : 'var(--error)',
                    minWidth: 48,
                    textAlign: 'right',
                  }}
                >
                  {c.delta >= 0 ? `+${c.delta}` : c.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No signals yet — enroll a passkey or capture a selfie to start building your trust score.
        </div>
      )}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${Math.max(0, Math.min(100, score))}%`,
          background: color,
          transition: 'width 250ms ease',
        }}
      />
      {/* Threshold ticks taken from identity-sdk's TRUST_BANDS — kept in lockstep. */}
      {[TRUST_BANDS.COMPROMISED_MAX, TRUST_BANDS.BASELINE_MAX, TRUST_BANDS.VERIFIED_MAX, TRUST_BANDS.ELEVATED_MAX].map((threshold) => (
        <div
          key={threshold}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${threshold}%`,
            width: 1,
            background: 'rgba(255, 255, 255, 0.12)',
          }}
        />
      ))}
    </div>
  );
}

function bandColor(band: TrustBand): string {
  switch (band) {
    case 'compromised': return '#ef4444';
    case 'baseline':    return '#eab308';
    case 'verified':    return '#00f5ff';
    case 'elevated':    return '#8b5cf6';
    case 'sovereign':   return '#10b981';
  }
}

function civicColor(c: CivicClearance): string {
  switch (c) {
    case 'basic':     return 'var(--text-muted)';
    case 'verified':  return 'var(--cyan)';
    case 'sovereign': return '#10b981';
  }
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
    return `${Math.round(diff / 86_400_000)}d ago`;
  } catch {
    return iso;
  }
}

async function safeErrorBody(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}
