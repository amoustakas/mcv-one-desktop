// src/components/ops/OpsHealthWidget.tsx
//
// Live consumer for /api/ops-health. Renders a compact "what's running"
// block you can drop anywhere — payments 24h, RAG state, OAuth health,
// cron freshness with staleness flags. Auto-refreshes every 60s; a manual
// refresh button forces a reload.

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Activity, Zap, FileText, Webhook, AlertCircle } from 'lucide-react';
import { apiGet } from '../../lib/api/client';

// ─── Types mirroring the endpoint's response shape ──────────────────────

interface OpsHealthPayload {
  generated_at: string;
  payments: {
    last_24h: {
      total: number;
      by_type: Record<string, number>;
      by_status: Record<string, number>;
    };
    last_event: { created_at: string; event_type: string; processor: string } | null;
  };
  webhooks: {
    stripe: { last_event_at: string | null; events_last_24h: number };
    plaid: { last_event_at: string | null };
  };
  rag: {
    venture_docs: { total: number; embedded: number; stale: number; last_embed_at: string | null };
    storage_chunks: { total: number; by_source: { file: number; venture_doc: number } };
  };
  oauth: { active: number; expired: number; expiring_soon_1h: number };
  crons: Array<{
    path: string;
    schedule: string;
    budget_seconds: number;
    last_seen_at: string | null;
    stale_by_seconds: number | null;
  }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatAge(seconds: number | null): string {
  if (seconds === null) return 'no signal';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function cronStatusColor(stale: number | null, budget: number): string {
  if (stale === null) return 'var(--text-muted)';
  // Fresh if seen within 1x budget, warm within 2x, stale after.
  if (stale <= budget) return 'var(--success)';
  if (stale <= budget * 2) return 'var(--warning)';
  return 'var(--error)';
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  return formatAge(sec);
}

// ─── Component ─────────────────────────────────────────────────────────

interface Props {
  refreshInterval?: number;   // ms; default 60_000
  compact?: boolean;          // reserved for future minimized variant
}

export default function OpsHealthWidget({ refreshInterval = 60_000, compact: _compact }: Props) {
  const [data, setData] = useState<OpsHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiGet<OpsHealthPayload>('/api/ops-health');
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    if (refreshInterval <= 0) return;
    const timer = setInterval(load, refreshInterval);
    return () => clearInterval(timer);
  }, [load, refreshInterval]);

  if (error && !data) {
    return (
      <div className="opshw-root opshw-empty">
        <AlertCircle size={14} />
        <span>ops-health unavailable: {error}</span>
        <style>{styles}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="opshw-root opshw-empty">
        <RefreshCw size={14} className="opshw-spinner" />
        <span>Loading ops health…</span>
        <style>{styles}</style>
      </div>
    );
  }

  const { payments, webhooks, rag, oauth, crons } = data;
  const paymentsFailed =
    (payments.last_24h.by_status['failed'] ?? 0) +
    (payments.last_24h.by_type['charge.failed'] ?? 0) +
    (payments.last_24h.by_type['refund.failed'] ?? 0) +
    (payments.last_24h.by_type['transfer.failed'] ?? 0);

  return (
    <div className="opshw-root">
      <div className="opshw-header">
        <Activity size={12} />
        <span className="opshw-title">Live Ops</span>
        <span className="opshw-gen">{timeAgo(data.generated_at)}</span>
        <button
          className="opshw-refresh"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={11} className={loading ? 'opshw-spinner' : ''} />
        </button>
      </div>

      {/* Payments 24h */}
      <div className="opshw-row">
        <div className="opshw-key"><Webhook size={11} /> Payments 24h</div>
        <div className="opshw-val">
          <strong>{payments.last_24h.total}</strong> events
          {paymentsFailed > 0 && <span className="opshw-bad"> · {paymentsFailed} failed</span>}
        </div>
      </div>

      {/* Webhook last hit */}
      <div className="opshw-row">
        <div className="opshw-key">Stripe last hit</div>
        <div className="opshw-val opshw-mono">
          {timeAgo(webhooks.stripe.last_event_at)} <span className="opshw-dim">({webhooks.stripe.events_last_24h} in 24h)</span>
        </div>
      </div>
      <div className="opshw-row">
        <div className="opshw-key">Plaid last hit</div>
        <div className="opshw-val opshw-mono">{timeAgo(webhooks.plaid.last_event_at)}</div>
      </div>

      {/* RAG */}
      <div className="opshw-row">
        <div className="opshw-key"><FileText size={11} /> Venture docs</div>
        <div className="opshw-val">
          <strong>{rag.venture_docs.embedded}</strong>/{rag.venture_docs.total} embedded
          {rag.venture_docs.stale > 0 && (
            <span className="opshw-warn"> · {rag.venture_docs.stale} stale</span>
          )}
        </div>
      </div>
      <div className="opshw-row">
        <div className="opshw-key">Storage chunks</div>
        <div className="opshw-val opshw-mono">
          {rag.storage_chunks.total}{' '}
          <span className="opshw-dim">
            ({rag.storage_chunks.by_source.file} file · {rag.storage_chunks.by_source.venture_doc} doc)
          </span>
        </div>
      </div>

      {/* OAuth */}
      <div className="opshw-row">
        <div className="opshw-key"><Zap size={11} /> OAuth</div>
        <div className="opshw-val">
          <strong>{oauth.active}</strong> active
          {oauth.expiring_soon_1h > 0 && (
            <span className="opshw-warn"> · {oauth.expiring_soon_1h} expiring &lt;1h</span>
          )}
          {oauth.expired > 0 && <span className="opshw-bad"> · {oauth.expired} expired</span>}
        </div>
      </div>

      {/* Crons */}
      <div className="opshw-section-label">Crons</div>
      {crons.map((c) => (
        <div key={c.path} className="opshw-cron">
          <span
            className="opshw-dot"
            style={{ background: cronStatusColor(c.stale_by_seconds, c.budget_seconds) }}
          />
          <span className="opshw-cron-path">{c.path.replace('/api/', '')}</span>
          <span className="opshw-dim opshw-mono">{c.schedule}</span>
          <span className="opshw-cron-age opshw-mono">{formatAge(c.stale_by_seconds)}</span>
        </div>
      ))}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .opshw-root {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--text-secondary);
  }
  .opshw-empty {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 14px;
    color: var(--text-muted);
    font-size: 11px;
  }
  .opshw-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .opshw-title { color: var(--text-primary); }
  .opshw-gen { margin-left: auto; font-family: var(--font-mono); font-weight: 400; text-transform: none; letter-spacing: 0; }
  .opshw-refresh {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
  }
  .opshw-refresh:hover:not(:disabled) { color: var(--cyan); }
  .opshw-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    border-bottom: 1px solid var(--border);
  }
  .opshw-key {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
    font-size: 10px;
    min-width: 120px;
  }
  .opshw-val { flex: 1; text-align: right; }
  .opshw-val strong { color: var(--text-primary); }
  .opshw-mono { font-family: var(--font-mono); font-size: 10px; }
  .opshw-dim { color: var(--text-muted); }
  .opshw-warn { color: var(--warning); }
  .opshw-bad { color: var(--error); }
  .opshw-section-label {
    padding: 8px 14px 4px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    font-weight: 600;
  }
  .opshw-cron {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 14px;
    font-size: 10px;
    border-bottom: 1px solid var(--border);
  }
  .opshw-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .opshw-cron-path { flex: 1; color: var(--text-secondary); font-family: var(--font-mono); }
  .opshw-cron-age { color: var(--text-muted); }
  .opshw-spinner { animation: opshw-spin 1s linear infinite; }
  @keyframes opshw-spin { to { transform: rotate(360deg); } }
`;
