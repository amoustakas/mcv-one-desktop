import { useEffect, useState } from 'react';
import { Activity, Package, Globe, FileText, Target, Shield } from 'lucide-react';
import { GlassCard } from '../ui';
import { apiPost } from '../../lib/api/client';
import { summarizeSnapshot, type SnapshotSummary } from '../../lib/kits/builtin/venture-intelligence-kit';
import type { Venture } from '../../lib/ventures';

// Human-visible rendering of the same composite state the venture_snapshot
// NAOS tool returns — reuses summarizeSnapshot() so the health-score math
// stays in one place. If this card and the tool ever diverge on what "health"
// means, users and agents will disagree on launch-readiness.

type VentureRow = { id: string; name: string; tier?: number; clerk_org_id?: string | null; status?: string };
type AssetRow = { id: string; tier: number; confirmed: boolean };
type DomainRow = { host: string; status?: string };
type DocRow = { department: string; status: string };
type QuestRow = { effective_status?: string };

interface Props {
  venture: Venture;
}

export default function VentureSnapshotCard({ venture }: Props) {
  const [summary, setSummary] = useState<SnapshotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vRes, assets, domains, docs, quests] = await Promise.all([
          apiPost<{ venture: VentureRow }>('/api/ventures', { action: 'get', id: venture.id }),
          apiPost<{ assets: AssetRow[] }>('/api/ventures', { action: 'list-assets', venture_id: venture.id }),
          apiPost<{ domains: DomainRow[] }>('/api/ventures', { action: 'list-domains', venture_id: venture.id }),
          apiPost<{ docs: DocRow[] }>('/api/ventures', { action: 'list-docs', venture_id: venture.id }),
          apiPost<{ quests: QuestRow[] }>('/api/ventures', { action: 'list-quests', venture_id: venture.id }),
        ]);
        if (cancelled) return;
        setSummary(summarizeSnapshot({
          venture: vRes.venture,
          assets: assets.assets || [],
          domains: domains.domains || [],
          docs: docs.docs || [],
          quests: quests.quests || [],
        }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load snapshot');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [venture.id]);

  if (loading) {
    return (
      <GlassCard className="vsc-card">
        <div className="vsc-loading">Loading venture snapshot…</div>
        <style>{styles}</style>
      </GlassCard>
    );
  }

  if (error || !summary) {
    return (
      <GlassCard className="vsc-card">
        <div className="vsc-error">Snapshot unavailable: {error || 'no data'}</div>
        <style>{styles}</style>
      </GlassCard>
    );
  }

  const healthColor = summary.health_score >= 75 ? '#10B981'
    : summary.health_score >= 50 ? '#F59E0B'
    : '#EF4444';
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - summary.health_score / 100);

  return (
    <GlassCard className="vsc-card">
      <div className="vsc-head">
        <div className="vsc-title">
          <Activity size={14} style={{ color: 'var(--cyan)' }} />
          <span>Venture Snapshot</span>
        </div>
        <div className="vsc-meta">
          {summary.tier && <span className="vsc-chip">Tier {summary.tier}</span>}
          <span className={`vsc-chip vsc-status-${summary.status}`}>{summary.status}</span>
          {summary.clerk_provisioned && <span className="vsc-chip vsc-chip-success">Dedicated Org</span>}
        </div>
      </div>

      <div className="vsc-body">
        <div className="vsc-health">
          <svg className="vsc-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={healthColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="vsc-health-center">
            <div className="vsc-health-val" style={{ color: healthColor }}>{summary.health_score}</div>
            <div className="vsc-health-label">Health</div>
          </div>
        </div>

        <div className="vsc-tiles">
          <Tile
            icon={<Target size={13} />} label="Quests"
            primary={`${summary.quests.done}/${summary.quests.total}`}
            secondary={`${summary.quests.pct}% · ${summary.quests.in_progress} active`}
            accent="var(--cyan)"
          />
          <Tile
            icon={<Package size={13} />} label="Assets"
            primary={`${summary.assets.confirmed}`}
            secondary={summary.assets.discovered > 0 ? `+${summary.assets.discovered} to confirm` : 'all confirmed'}
            accent="#8B5CF6"
          />
          <Tile
            icon={<Globe size={13} />} label="Domains"
            primary={`${summary.domains.verified}/${summary.domains.total}`}
            secondary={summary.domains.pending > 0 ? `${summary.domains.pending} pending DNS` : 'all verified'}
            accent="#10B981"
          />
          <Tile
            icon={<FileText size={13} />} label="Docs"
            primary={`${summary.docs.total}`}
            secondary={Object.keys(summary.docs.byDept).length
              ? `${Object.keys(summary.docs.byDept).length} depts covered`
              : 'run apply_templates'}
            accent="#F59E0B"
          />
        </div>
      </div>

      <div className="vsc-weights">
        <Shield size={11} style={{ color: 'var(--text-muted)' }} />
        <span>Health is 40% quests · 25% assets · 20% docs · 15% domains</span>
      </div>

      <style>{styles}</style>
    </GlassCard>
  );
}

function Tile({ icon, label, primary, secondary, accent }: { icon: React.ReactNode; label: string; primary: string; secondary: string; accent: string }) {
  return (
    <div className="vsc-tile">
      <div className="vsc-tile-head" style={{ color: accent }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="vsc-tile-primary">{primary}</div>
      <div className="vsc-tile-secondary">{secondary}</div>
    </div>
  );
}

const styles = `
  .vsc-card { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
  .vsc-loading, .vsc-error { font-size: 12px; color: var(--text-muted); text-align: center; padding: 24px; }
  .vsc-error { color: var(--danger); }
  .vsc-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .vsc-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.08em; }
  .vsc-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .vsc-chip { font-size: 10px; padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-input); color: var(--text-secondary); font-family: var(--font-mono); text-transform: lowercase; }
  .vsc-chip-success { background: rgba(16, 185, 129, 0.16); color: #10B981; }
  .vsc-body { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .vsc-health { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .vsc-ring { width: 100%; height: 100%; }
  .vsc-health-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .vsc-health-val { font-size: 22px; font-weight: 800; font-family: var(--font-display); line-height: 1; }
  .vsc-health-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .vsc-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; flex: 1; min-width: 240px; }
  .vsc-tile { padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 2px; }
  .vsc-tile-head { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .vsc-tile-primary { font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); line-height: 1.2; }
  .vsc-tile-secondary { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .vsc-weights { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); padding-top: 8px; border-top: 1px solid var(--border); }
`;
