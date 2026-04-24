// src/views/internal/AdminSigningView.tsx
//
// Admin cockpit for the @mcv/signer-sdk signing primitive. Shows:
//
//   · Envelope list hydrated from signing_envelopes (authenticated RLS read)
//   · Live feed of signing.* events via @mcv/events-sdk subscriber +
//     @mcv/signer-sdk/events createSigningObserver
//   · Audit rollup across all envelopes in the current tenant subtree,
//     rendered via server/audit-rollup
//
// Dogfoods the subscriber-template + audit-rollup + envelope status
// invariants in the same session as the SDK ships — proves the full
// loop (envelope → DB → realtime → rollup) works end-to-end before
// downstream ventures adopt.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { createSubscriber } from '@mcv/events-sdk/subscriber';
import { createSigningObserver } from '@mcv/signer-sdk/events';
import { rollupEnvelopes } from '@mcv/signer-sdk/server';
import { emptyRollup, type SigningScope } from '@mcv/signer-sdk/core/tenancy';
import type { SignerEnvelope, EnvelopeStatus } from '@mcv/signer-sdk/core/types';

// Shape returned by the raw Supabase read on signing_envelopes. Maps to
// SignerEnvelope at the adapter boundary below — the DB stores snake_case
// + denormalises the documents into a separate table, so the view
// composes the shape on read.
interface EnvelopeRow {
  id: string;
  public_id: string;
  tenant_id: string;
  parent_venture_id: string;
  child_venture_id: string | null;
  signer_email: string;
  signer_name: string;
  signer_role: string | null;
  signer_display_role: string | null;
  status: EnvelopeStatus;
  envelope_version: number;
  issued_at: string;
  issued_by: string;
  expires_at: string;
  viewed_at: string | null;
  first_signed_at: string | null;
  last_signed_at: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  message: string | null;
  document_count: number;
  access_ip_hashes: string[] | null;
  created_at: string;
  updated_at: string;
}

interface LiveEvent {
  id: string;
  topic: string;
  emittedAt: string;
  summary: string;
}

export default function AdminSigningView() {
  const [rows, setRows] = useState<EnvelopeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [scope, setScope] = useState<SigningScope>({ tenantId: 'mcv', parentVentureId: 'mcv' });

  // Initial hydrate — read envelopes scoped to the current subtree.
  // All setStates live inside the async IIFE so they fire from network
  // callbacks rather than synchronously in the effect body (React 19's
  // react-hooks/set-state-in-effect rule).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        if (!cancelled) {
          setError('Supabase client is not configured (missing SUPABASE_URL / SUPABASE_ANON_KEY).');
          setLoading(false);
        }
        return;
      }
      const query = supabase
        .from('signing_envelopes')
        .select('*')
        .eq('tenant_id', scope.tenantId)
        .eq('parent_venture_id', scope.parentVentureId)
        .order('issued_at', { ascending: false })
        .limit(200);
      // child_venture filter only when narrowing the scope
      if (scope.childVentureId) {
        query.eq('child_venture_id', scope.childVentureId);
      }
      const { data, error: err } = await query;
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setRows((data ?? []) as EnvelopeRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scope.tenantId, scope.parentVentureId, scope.childVentureId]);

  // Live feed — one subscription channel, dispatched per topic via the
  // SDK's subscriber-template scaffold. The refresh-on-event pattern
  // mirrors AdminInvitesView's use-admin-invite-events.
  useEffect(() => {
    if (!supabase) return;
    const subscriber = createSubscriber({ supabase });
    const handle = createSigningObserver({
      subscriber,
      handlers: {
        onCreated: async (envelope) => {
          appendEvent(envelope.topic, envelope.id, envelope.emittedAt,
            `Envelope ${envelope.payload.publicId} issued to ${envelope.payload.signerEmail}`);
        },
        onViewed: async (envelope) => {
          appendEvent(envelope.topic, envelope.id, envelope.emittedAt,
            `${envelope.payload.publicId} viewed`);
        },
        onSigned: async (envelope) => {
          appendEvent(envelope.topic, envelope.id, envelope.emittedAt,
            `${envelope.payload.publicId} document ${envelope.payload.documentId.split(':').pop()} signed`);
        },
        onVoided: async (envelope) => {
          appendEvent(envelope.topic, envelope.id, envelope.emittedAt,
            `${envelope.payload.publicId} voided by ${envelope.payload.voidedBy}`);
        },
        onMutation: async (envelope) => {
          appendEvent(envelope.topic, envelope.id, envelope.emittedAt,
            `⚠️ ${envelope.payload.publicId}: template ${envelope.payload.templateId} moved ${envelope.payload.expectedVersion}→${envelope.payload.actualVersion}`);
        },
      },
    });

    function appendEvent(topic: string, id: string, emittedAt: string, summary: string) {
      setEvents((prev) => [{ id, topic, emittedAt, summary }, ...prev].slice(0, 50));
    }

    return () => {
      void handle.unsubscribe();
      void subscriber.close();
    };
  }, []);

  // Map DB rows → SignerEnvelope shape for the rollup. The DB stores
  // documents separately; the rollup only cares about status + scope
  // tuple + timestamps, so a minimal synthesis is enough here.
  const envelopes = useMemo<SignerEnvelope[]>(() => rows.map(rowToEnvelope), [rows]);

  const rollup = useMemo(() => {
    if (envelopes.length === 0) return emptyRollup(scope);
    return rollupEnvelopes({ coverageScope: scope, envelopes });
  }, [envelopes, scope]);

  return (
    <div className="admin-signing-root">
      <header className="admin-signing-header">
        <h1>Signing cockpit</h1>
        <p>
          Live consumer of <code>@mcv/signer-sdk/events</code> + <code>server/audit-rollup</code>.
          Hydrates from <code>signing_envelopes</code>, subscribes to <code>signing.*</code> via
          the events-sdk realtime channel, and composes a cross-venture rollup for the active
          scope tuple.
        </p>
        <div className="admin-signing-scope">
          <label>
            Tenant
            <input value={scope.tenantId} onChange={(e) => setScope((s) => ({ ...s, tenantId: e.target.value }))} />
          </label>
          <label>
            Parent venture
            <input value={scope.parentVentureId} onChange={(e) => setScope((s) => ({ ...s, parentVentureId: e.target.value }))} />
          </label>
          <label>
            Child venture (optional)
            <input
              value={scope.childVentureId ?? ''}
              onChange={(e) => setScope((s) => ({ ...s, childVentureId: e.target.value || undefined }))}
              placeholder="— whole tree —"
            />
          </label>
        </div>
      </header>

      <section className="admin-signing-kpis">
        <StatusCounter label="Total" count={rollup.totalEnvelopes} tone="neutral" />
        <StatusCounter label="Issued" count={rollup.counts.issued} tone="cyan" />
        <StatusCounter label="Viewed" count={rollup.counts.viewed} tone="cyan" />
        <StatusCounter label="Partial" count={rollup.counts.partial} tone="amber" />
        <StatusCounter label="Signed" count={rollup.counts.signed} tone="emerald" />
        <StatusCounter label="Voided" count={rollup.counts.voided} tone="red" />
        <StatusCounter label="Expired" count={rollup.counts.expired} tone="red" />
      </section>

      <section className="admin-signing-grid">
        <div className="admin-signing-panel">
          <h2>Envelopes <span className="admin-signing-meta">({rollup.totalEnvelopes})</span></h2>
          {loading && <div className="admin-signing-state">Loading…</div>}
          {error && <div className="admin-signing-error">Could not load: {error}</div>}
          {!loading && !error && rows.length === 0 && (
            <div className="admin-signing-state">
              No envelopes in scope. Apply migration-signer-sdk-v0-1-2026-04-24.sql and seed
              via buildEnvelope() or a live consumer.
            </div>
          )}
          {rows.length > 0 && (
            <table className="admin-signing-table">
              <thead>
                <tr>
                  <th>Public id</th>
                  <th>Signer</th>
                  <th>Docs</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-signing-mono">{row.public_id}</td>
                    <td>
                      {row.signer_name}
                      <div className="admin-signing-sub">{row.signer_email}</div>
                    </td>
                    <td>{row.document_count}</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                    <td className="admin-signing-timestamp">{fmtIso(row.issued_at)}</td>
                    <td className="admin-signing-timestamp">{fmtIso(row.last_signed_at ?? row.viewed_at ?? row.issued_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-signing-panel">
          <h2>Live feed <span className="admin-signing-meta">({events.length})</span></h2>
          {events.length === 0 ? (
            <div className="admin-signing-state">No signing.* events yet. Subscribed channel is open.</div>
          ) : (
            <ul className="admin-signing-feed">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="admin-signing-feed-topic">{event.topic}</span>
                  <span className="admin-signing-feed-summary">{event.summary}</span>
                  <span className="admin-signing-feed-time">{fmtIso(event.emittedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AdminSigningStyles />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function rowToEnvelope(row: EnvelopeRow): SignerEnvelope {
  // Rollup only touches status + scope + timestamps, so documents[] can
  // be a deliberately-empty fixture shaped to satisfy the compile-time
  // type. This is a read-side projection, not a round-trip through
  // envelope-builder.
  return {
    publicId: row.public_id,
    tenantId: row.tenant_id,
    parentVentureId: row.parent_venture_id,
    childVentureId: row.child_venture_id ?? undefined,
    envelopeVersion: row.envelope_version,
    documents: [],
    signer: {
      name: row.signer_name,
      email: row.signer_email,
      role: row.signer_role ?? undefined,
      displayRole: row.signer_display_role ?? undefined,
    },
    status: row.status,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    audit: {
      issuedAt: row.issued_at,
      issuedBy: row.issued_by,
      viewedAt: row.viewed_at ?? undefined,
      firstSignedAt: row.first_signed_at ?? undefined,
      lastSignedAt: row.last_signed_at ?? undefined,
      voidedAt: row.voided_at ?? undefined,
      voidedBy: row.voided_by ?? undefined,
      voidReason: row.void_reason ?? undefined,
      accessIpHashes: row.access_ip_hashes ?? undefined,
    },
    message: row.message ?? undefined,
  };
}

function fmtIso(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatusCounter({ label, count, tone }: { label: string; count: number; tone: 'neutral' | 'cyan' | 'amber' | 'emerald' | 'red' }) {
  return (
    <div className={`admin-signing-kpi tone-${tone}`}>
      <div className="admin-signing-kpi-value">{count}</div>
      <div className="admin-signing-kpi-label">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: EnvelopeStatus }) {
  const tone: Record<EnvelopeStatus, string> = {
    draft: '#6b7a8c',
    issued: '#00f5ff',
    viewed: '#00f5ff',
    partial: '#eab308',
    signed: '#10b981',
    voided: '#ef4444',
    expired: '#ef4444',
  };
  return (
    <span
      className="admin-signing-pill"
      style={{ '--pill-tone': tone[status] } as React.CSSProperties}
    >
      {status}
    </span>
  );
}

function AdminSigningStyles() {
  return (
    <style>{`
      .admin-signing-root {
        padding: 24px;
        display: grid;
        gap: 20px;
        max-width: 1280px;
        margin: 0 auto;
      }
      .admin-signing-header h1 { font-size: 22px; margin: 0 0 8px; }
      .admin-signing-header p { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 14px; }
      .admin-signing-header code {
        font-family: var(--font-mono); font-size: 11px;
        padding: 1px 6px; border-radius: 4px;
        background: rgba(255,255,255,0.05);
      }
      .admin-signing-scope {
        display: flex; gap: 12px; flex-wrap: wrap;
      }
      .admin-signing-scope label {
        display: grid; gap: 4px; font-size: 10px;
        color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.2px;
      }
      .admin-signing-scope input {
        padding: 6px 10px; font-size: 12px;
        border: 1px solid var(--border); border-radius: 6px;
        background: rgba(255,255,255,0.02); color: var(--text-primary);
        font-family: var(--font-mono);
        min-width: 140px;
      }

      .admin-signing-kpis {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;
      }
      .admin-signing-kpi {
        padding: 12px; border-radius: 10px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        text-align: center;
      }
      .admin-signing-kpi-value { font-size: 22px; font-weight: 600; }
      .admin-signing-kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 2px; }
      .admin-signing-kpi.tone-cyan .admin-signing-kpi-value { color: #00f5ff; }
      .admin-signing-kpi.tone-amber .admin-signing-kpi-value { color: #eab308; }
      .admin-signing-kpi.tone-emerald .admin-signing-kpi-value { color: #10b981; }
      .admin-signing-kpi.tone-red .admin-signing-kpi-value { color: #ef4444; }

      .admin-signing-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 16px;
      }
      @media (max-width: 1024px) {
        .admin-signing-grid { grid-template-columns: 1fr; }
      }
      .admin-signing-panel {
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: rgba(255,255,255,0.02);
      }
      .admin-signing-panel h2 { font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); }
      .admin-signing-meta { font-weight: 400; color: var(--text-muted); }
      .admin-signing-state { font-size: 12px; color: var(--text-muted); padding: 24px 0; text-align: center; }
      .admin-signing-error { font-size: 12px; color: #ef4444; padding: 12px; border-left: 2px solid #ef4444; background: rgba(239,68,68,0.06); border-radius: 6px; }

      .admin-signing-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .admin-signing-table thead th {
        text-align: left; padding: 8px 10px; font-size: 10px; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 1.2px;
        border-bottom: 1px solid var(--border);
      }
      .admin-signing-table tbody td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .admin-signing-mono { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }
      .admin-signing-sub { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
      .admin-signing-timestamp { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }

      .admin-signing-pill {
        display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 4px;
        border: 1px solid var(--pill-tone, currentColor); color: var(--pill-tone, currentColor);
        text-transform: uppercase; letter-spacing: 1.2px;
      }

      .admin-signing-feed {
        list-style: none; margin: 0; padding: 0;
        display: grid; gap: 6px;
      }
      .admin-signing-feed li {
        display: grid; grid-template-columns: 220px 1fr auto; gap: 10px; align-items: center;
        padding: 8px 10px; border-radius: 6px;
        background: rgba(255,255,255,0.02); font-size: 11px;
      }
      .admin-signing-feed-topic { font-family: var(--font-mono); font-size: 10px; color: #00f5ff; }
      .admin-signing-feed-summary { color: var(--text-secondary); }
      .admin-signing-feed-time { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
    `}</style>
  );
}
