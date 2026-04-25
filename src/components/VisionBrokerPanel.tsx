/**
 * VisionBrokerPanel — Desktop cockpit surface for HITL approval of
 * agent vision actions classified as 'destructive' by the heuristic
 * gate. Mounted at /vision-broker behind the super-admin device gate.
 *
 * Architecture:
 *   - Subscribes to GET /vision/pending-approvals/stream (SSE) on
 *     mount; emits pending-added / pending-decided / pending-timeout
 *     events that drive a small `Map<id, PendingApprovalView>` store.
 *   - Falls back to a 5s GET /vision/pending-approvals poll if the
 *     EventSource emits an error (browser hard-reconnects on its own
 *     too, so this is belt + suspenders).
 *   - 1-second tick `useEffect` advances the countdown clock without
 *     re-fetching state.
 *   - Approve / Reject buttons POST /vision/approvals/:id/decide;
 *     the SSE event-feedback removes the row.
 *
 * Visual:
 *   - Glassmorphism per the MCV design system; Electric Cyan
 *     (#00F5FF) countdown bar transitions to red when <10s remain
 *     (per panel-helpers.countdownColor).
 *   - Diff viewer is single-image at v0.3 (post-snapshot lands when
 *     the snapshot store ships in Session 4); shows a placeholder
 *     panel for "post" so the layout doesn't reflow when populated.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, Clock, ShieldAlert } from 'lucide-react';

import {
  buildDecidePayload,
  countdownColor,
  countdownProgress,
  formatAge,
  formatCountdown,
  remainingMs,
} from '../lib/vision-broker/panel-helpers';

// ---------------------------------------------------------------------------
// Wire types — must structurally match server/vision-broker/pending-store.ts
// PendingApprovalView. Duplicated here (rather than imported across the
// server boundary) to keep the bundle from pulling in node:events etc.
// ---------------------------------------------------------------------------

interface PendingApprovalView {
  id: string;
  req: {
    kind: 'click' | 'type' | 'scroll' | 'wait' | 'navigate';
    refId?: string;
    text?: string;
    url?: string;
    dx?: number;
    dy?: number;
  };
  ctx: {
    sessionId: string;
    agentHandle: string;
    tenantId: string;
    ventureId: string;
    preSnapshotId: string;
  };
  enqueuedAt: number;
  deadlineAt: number;
  preSnapshotUrl: string | null;
  preSnapshotTitle: string | null;
  preSnapshotPngBase64: string | null;
  refDescriptor: string;
}

type PendingStoreEvent =
  | { kind: 'pending-added'; approval: PendingApprovalView }
  | { kind: 'pending-decided'; id: string; verdict: string }
  | { kind: 'pending-timeout'; id: string };

// ---------------------------------------------------------------------------
// Endpoint base — mcv-one-desktop daemon listens on :3100.
// In dev (Vite at :5173), CORS is already permissive on the daemon.
// ---------------------------------------------------------------------------

const BROKER_BASE = (typeof window !== 'undefined' && window.location.port === '3100')
  ? ''
  : 'http://localhost:3100';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VisionBrokerPanel(): React.JSX.Element {
  const [approvals, setApprovals] = useState<Map<string, PendingApprovalView>>(
    () => new Map(),
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  // ── Tick clock at 1Hz so countdowns stay honest. ──
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  // ── SSE subscription with poll fallback. ──
  // No separate initial fetch — the broker's SSE handler replays
  // current pending entries on subscribe (see routes.ts), so opening
  // the EventSource alone hydrates the panel.
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback (used by the SSE error path and by SSR/test env)
  // is a stable callback so the SSE effect doesn't re-arm on each render.
  const pollOnce = useCallback(async () => {
    try {
      const resp = await fetch(`${BROKER_BASE}/vision/pending-approvals`);
      if (!resp.ok) throw new Error(`broker returned ${resp.status}`);
      const json = (await resp.json()) as { pending?: PendingApprovalView[] };
      setApprovals(() => {
        const next = new Map<string, PendingApprovalView>();
        for (const a of json.pending ?? []) next.set(a.id, a);
        return next;
      });
      setError(null);
    } catch (e) {
      setError(`fetch failed: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      // Test / SSR environment — drop to polling only.
      pollTimerRef.current = setInterval(() => void pollOnce(), 5_000);
      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }

    const es = new EventSource(`${BROKER_BASE}/vision/pending-approvals/stream`);

    function applyEvent(ev: PendingStoreEvent): void {
      setApprovals((prev) => {
        const next = new Map(prev);
        if (ev.kind === 'pending-added') {
          next.set(ev.approval.id, ev.approval);
        } else if (ev.kind === 'pending-decided' || ev.kind === 'pending-timeout') {
          next.delete(ev.id);
        }
        return next;
      });
    }

    es.addEventListener('pending-added', (msg) => {
      try {
        applyEvent(JSON.parse((msg as MessageEvent).data));
      } catch {/* malformed */}
    });
    es.addEventListener('pending-decided', (msg) => {
      try {
        applyEvent(JSON.parse((msg as MessageEvent).data));
      } catch {/* malformed */}
    });
    es.addEventListener('pending-timeout', (msg) => {
      try {
        applyEvent(JSON.parse((msg as MessageEvent).data));
      } catch {/* malformed */}
    });

    es.onerror = () => {
      // Browser will auto-reconnect; meanwhile drop to a 5s poll.
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => void refetch(), 5_000);
      }
    };

    return () => {
      es.close();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [pollOnce]);

  // ── Decide handler — POSTs verdict; SSE event removes the row. ──
  const decide = useCallback(
    async (id: string, verdict: 'approved' | 'rejected', note?: string) => {
      try {
        const resp = await fetch(`${BROKER_BASE}/vision/approvals/${id}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildDecidePayload(verdict, note, 'super-admin')),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          setError(`decide failed: ${resp.status} ${txt}`);
        }
      } catch (e) {
        setError(`decide failed: ${(e as Error).message}`);
      }
    },
    [],
  );

  const sortedApprovals = useMemo(
    () => Array.from(approvals.values()).sort((a, b) => a.enqueuedAt - b.enqueuedAt),
    [approvals],
  );

  return (
    <div
      style={{
        padding: 24,
        color: '#E6F4FF',
        background: 'linear-gradient(180deg, #060D14 0%, #0B1620 100%)',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <ShieldAlert size={28} color="#00F5FF" />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.5 }}>
            Vision Broker
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>
            Human-in-the-loop approval queue for agent vision actions.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            border: '1px solid #FF3B30',
            background: 'rgba(255,59,48,0.1)',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {sortedApprovals.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedApprovals.map((a) => (
            <ApprovalCard key={a.id} approval={a} now={now} onDecide={decide} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function EmptyState(): React.JSX.Element {
  return (
    <div
      style={{
        padding: 48,
        textAlign: 'center',
        border: '1px dashed rgba(0,245,255,0.25)',
        borderRadius: 12,
        background: 'rgba(0,245,255,0.03)',
      }}
    >
      <p style={{ margin: 0, opacity: 0.7 }}>No pending approvals.</p>
      <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.5 }}>
        Destructive agent actions will appear here for human review.
      </p>
    </div>
  );
}

interface ApprovalCardProps {
  approval: PendingApprovalView;
  now: number;
  onDecide: (id: string, verdict: 'approved' | 'rejected', note?: string) => void;
}

function ApprovalCard({ approval, now, onDecide }: ApprovalCardProps): React.JSX.Element {
  const [rejectNote, setRejectNote] = useState<string>('');
  const [showRejectField, setShowRejectField] = useState<boolean>(false);

  const remaining = remainingMs(approval.deadlineAt, now);
  const color = countdownColor(remaining);
  const progress = countdownProgress(approval.enqueuedAt, approval.deadlineAt, now);

  return (
    <div
      style={{
        border: '1px solid rgba(0,245,255,0.25)',
        background:
          'linear-gradient(135deg, rgba(11,22,32,0.85) 0%, rgba(6,13,20,0.85) 100%)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 4px 20px rgba(0,245,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {approval.refDescriptor}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65, display: 'flex', gap: 12 }}>
            <span>session: {approval.ctx.sessionId.slice(0, 12)}…</span>
            <span>agent: {approval.ctx.agentHandle}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {formatAge(approval.enqueuedAt, now)}
            </span>
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {formatCountdown(remaining)}
        </div>
      </div>

      {/* Countdown bar */}
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: color,
            transition: 'width 1s linear, background 200ms ease',
          }}
        />
      </div>

      {/* Diff viewer — pre/post side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <SnapshotPreview
          label="Pre-action"
          pngBase64={approval.preSnapshotPngBase64}
          url={approval.preSnapshotUrl}
        />
        <SnapshotPreview
          label="Post-action"
          pngBase64={null}
          url={null}
          placeholder="Available after dispatch."
        />
      </div>

      {showRejectField && (
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor={`reject-note-${approval.id}`}
            style={{ display: 'block', fontSize: 12, opacity: 0.7, marginBottom: 4 }}
          >
            Reason (optional)
          </label>
          <input
            id={`reject-note-${approval.id}`}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. wrong target / agent loop / not now"
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#E6F4FF',
              fontSize: 13,
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {showRejectField ? (
          <>
            <button
              onClick={() => {
                setShowRejectField(false);
                setRejectNote('');
              }}
              style={btnSecondary}
            >
              Cancel
            </button>
            <button
              onClick={() => onDecide(approval.id, 'rejected', rejectNote)}
              style={btnDanger}
            >
              <X size={14} style={{ marginRight: 6 }} /> Confirm reject
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setShowRejectField(true)} style={btnSecondary}>
              <X size={14} style={{ marginRight: 6 }} /> Reject
            </button>
            <button onClick={() => onDecide(approval.id, 'approved')} style={btnPrimary}>
              <Check size={14} style={{ marginRight: 6 }} /> Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface SnapshotPreviewProps {
  label: string;
  pngBase64: string | null;
  url: string | null;
  placeholder?: string;
}

function SnapshotPreview({ label, pngBase64, url, placeholder }: SnapshotPreviewProps): React.JSX.Element {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          opacity: 0.55,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
        {url && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {url}</span>}
      </div>
      <div
        style={{
          height: 180,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {pngBase64 ? (
          <img
            src={`data:image/png;base64,${pngBase64}`}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 12, opacity: 0.4 }}>
            {placeholder ?? 'No image'}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline button styles — keeps the file self-contained until we move
// the cockpit panel into the design system's <Button /> primitive.
// ---------------------------------------------------------------------------

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background 120ms ease',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: '#00F5FF',
  color: '#060D14',
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: '#FF3B30',
  color: '#FFFFFF',
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: '#E6F4FF',
  border: '1px solid rgba(255,255,255,0.15)',
};
