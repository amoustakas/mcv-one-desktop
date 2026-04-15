import { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { GlassCard, Button } from '../ui';
import { apiPost } from '../../lib/api/client';
import {
  compareSnapshots,
  healthColor,
  type SnapshotSummary,
  type CategoryWinner,
} from '../../lib/ventures/snapshot';

interface PortfolioSnapshot {
  id: string;
  name: string;
  tier: number | null;
  status: string;
  summary: SnapshotSummary;
}

interface Props {
  ventureIds: string[];
  onClose: () => void;
}

export default function VentureCompareDrawer({ ventureIds, onClose }: Props) {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiPost<{ snapshots: PortfolioSnapshot[] }>(
          '/api/ventures',
          { action: 'list-snapshots' },
        );
        if (cancelled) return;
        const idSet = new Set(ventureIds);
        setSnapshots((data.snapshots || []).filter(s => idSet.has(s.id)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load comparison');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ventureIds]);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = snapshots.map(s => ({
    ventureId: s.id,
    ventureName: s.name,
    summary: s.summary,
  }));
  const winners = rows.length >= 2 ? compareSnapshots(rows) : [];

  // Winner counts (shared with VI kit markdown render but inline here to keep
  // the drawer self-contained and avoid importing the kit-level formatter)
  const winnerCounts = new Map<string, number>();
  for (const w of winners) {
    if (w.winnerId) winnerCounts.set(w.winnerId, (winnerCounts.get(w.winnerId) || 0) + 1);
  }
  const rankedLeaders = [...winnerCounts.entries()].sort((a, b) => b[1] - a[1]);
  const nameById = new Map(rows.map(r => [r.ventureId, r.ventureName]));

  return (
    <>
      <div className="vcd-backdrop" onClick={onClose} />
      <div className="vcd-drawer" role="dialog" aria-modal="true" aria-label="Compare ventures">
        <div className="vcd-header">
          <div>
            <div className="vcd-title">Compare Ventures</div>
            <div className="vcd-sub">{ventureIds.length} selected · head-to-head across 5 categories</div>
          </div>
          <button className="vcd-close" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <div className="vcd-body">
          {loading && <div className="vcd-loading">Loading comparison…</div>}

          {error && (
            <GlassCard className="vcd-error">
              <div>Failed to load: {error}</div>
              <Button size="sm" onClick={onClose}>Close</Button>
            </GlassCard>
          )}

          {!loading && !error && snapshots.length < 2 && (
            <GlassCard className="vcd-error">
              Need at least 2 ventures with snapshots — only {snapshots.length} resolved.
              <br />
              Missing may not have been seeded yet.
            </GlassCard>
          )}

          {!loading && !error && snapshots.length >= 2 && (
            <>
              <div className="vcd-headerRow">
                <div className="vcd-metricCol">Metric</div>
                {rows.map(r => {
                  const h = r.summary.health_score;
                  return (
                    <div key={r.ventureId} className="vcd-ventureCol">
                      <div className="vcd-ventureName">{r.ventureName}</div>
                      <div className="vcd-ventureBadge" style={{ color: healthColor(h), borderColor: healthColor(h) }}>
                        {h}
                      </div>
                    </div>
                  );
                })}
              </div>

              {winners.map(w => (
                <MetricRow key={w.metric} winner={w} rows={rows} />
              ))}

              {rankedLeaders.length > 0 && (
                <div className="vcd-leaderboard">
                  <div className="vcd-leaderboard-title">
                    <Trophy size={13} style={{ color: 'var(--gold)' }} />
                    <span>Category Leaders</span>
                  </div>
                  {rankedLeaders.map(([id, count]) => (
                    <div key={id} className="vcd-leader">
                      <span className="vcd-leader-name">{nameById.get(id)}</span>
                      <span className="vcd-leader-count">{count}/{winners.length}</span>
                    </div>
                  ))}
                </div>
              )}

              {rankedLeaders.length === 0 && (
                <div className="vcd-tied">_All categories tied — no clear leader._</div>
              )}
            </>
          )}
        </div>

        <style>{styles}</style>
      </div>
    </>
  );
}

function MetricRow({ winner, rows }: {
  winner: CategoryWinner;
  rows: Array<{ ventureId: string; ventureName: string; summary: SnapshotSummary }>;
}) {
  const max = Math.max(...winner.values.map(v => v.value), 1);
  return (
    <div className="vcd-row">
      <div className="vcd-metricCol vcd-metricLabel">{winner.label}</div>
      {rows.map(r => {
        const val = winner.values.find(v => v.ventureId === r.ventureId)?.value ?? 0;
        const isWinner = winner.winnerId === r.ventureId;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={r.ventureId} className="vcd-cell">
            <div className="vcd-cell-bar" style={{ width: `${pct}%`, background: isWinner ? 'var(--cyan)' : 'var(--bg-input)' }} />
            <div className={`vcd-cell-val ${isWinner ? 'winner' : ''}`}>
              {val}
              {isWinner && <Trophy size={10} style={{ color: 'var(--gold)' }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = `
  .vcd-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: var(--z-overlay, 2000); backdrop-filter: blur(2px); }
  .vcd-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(960px, 90vw); background: var(--bg-shell); border-left: 1px solid var(--border-active); z-index: var(--z-drawer, 2500); display: flex; flex-direction: column; animation: vcd-slide 0.22s ease-out; }
  @keyframes vcd-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .vcd-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border); }
  .vcd-title { font-size: 15px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); }
  .vcd-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .vcd-close { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); width: 28px; height: 28px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s; }
  .vcd-close:hover { border-color: var(--border-active); color: var(--text-primary); }
  .vcd-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
  .vcd-loading { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }
  .vcd-error { padding: 16px; display: flex; flex-direction: column; gap: 10px; color: var(--danger); }

  .vcd-headerRow { display: grid; grid-template-columns: 180px repeat(var(--vcd-cols, 2), 1fr); gap: 10px; padding: 8px 0 12px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
  .vcd-metricCol { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); }
  .vcd-metricLabel { font-size: 12px; color: var(--text-secondary); text-transform: none; letter-spacing: 0; font-weight: 500; padding: 10px 0; }
  .vcd-ventureCol { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .vcd-ventureName { font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
  .vcd-ventureBadge { font-size: 11px; font-family: var(--font-mono); padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid; font-weight: 700; }

  .vcd-row { display: grid; grid-template-columns: 180px repeat(var(--vcd-cols, 2), 1fr); gap: 10px; align-items: center; padding: 4px 0; border-bottom: 1px dashed var(--border); }
  .vcd-cell { position: relative; padding: 10px 10px; background: var(--bg-card); border-radius: var(--radius-sm); min-height: 32px; overflow: hidden; }
  .vcd-cell-bar { position: absolute; top: 0; left: 0; bottom: 0; opacity: 0.25; transition: width 0.4s ease; }
  .vcd-cell-val { position: relative; font-family: var(--font-mono); font-size: 13px; color: var(--text-primary); display: flex; align-items: center; gap: 5px; }
  .vcd-cell-val.winner { font-weight: 700; color: var(--text-primary); }

  .vcd-leaderboard { margin-top: 16px; padding: 14px 16px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.10), transparent 60%); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); }
  .vcd-leaderboard-title { display: flex; align-items: center; gap: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-primary); font-family: var(--font-display); font-weight: 700; margin-bottom: 10px; }
  .vcd-leader { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-top: 1px dashed rgba(245, 158, 11, 0.15); }
  .vcd-leader:first-of-type { border-top: none; }
  .vcd-leader-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .vcd-leader-count { font-size: 12px; font-family: var(--font-mono); color: var(--gold); font-weight: 700; }
  .vcd-tied { padding: 14px; text-align: center; color: var(--text-muted); font-size: 12px; font-style: italic; }
`;
