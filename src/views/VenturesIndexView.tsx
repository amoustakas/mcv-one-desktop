import { useEffect, useMemo, useState } from 'react';
import { Plus, Layers, GitCompare, Check, X } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, Button, Toggle } from '../components/ui';
import { ventures as builtinVentures, type Venture, type VentureTier } from '../lib/ventures';
import { apiPost } from '../lib/api/client';
import { healthColor, type SnapshotSummary } from '../lib/ventures/snapshot';
import VentureCompareDrawer from '../components/ventures/VentureCompareDrawer';

interface PortfolioSnapshot { id: string; name: string; tier: number | null; status: string; summary: SnapshotSummary }

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  development: '#00F0FF',
  planned: '#8B5CF6',
  concept: '#6B7280',
};

const TIER_LABEL: Record<VentureTier | 'all', string> = {
  all: 'All',
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
};

interface VenturesIndexProps {
  onSelect?: (venture: Venture) => void;
  onNew?: () => void;
}

const COMPARE_CAP = 6;

export default function VenturesIndexView({ onSelect, onNew }: VenturesIndexProps) {
  const [remote, setRemote] = useState<Venture[] | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, PortfolioSnapshot>>({});
  const [tierFilter, setTierFilter] = useState<VentureTier | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Exit compare mode cleans selection so the next entry starts fresh
  function toggleCompareMode() {
    setCompareMode(prev => {
      if (prev) setSelected(new Set());
      return !prev;
    });
  }

  function toggleVentureSelection(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < COMPARE_CAP) next.add(id);
      return next;
    });
  }

  function openCompare() {
    if (selected.size >= 2) setDrawerOpen(true);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fire both requests in parallel — the ventures list renders even if
        // snapshots fail (e.g. RLS issue). Snapshots just add a health badge.
        const [listData, snapsData] = await Promise.all([
          apiPost<{ ventures: Venture[] }>('/api/ventures', { action: 'list' }),
          apiPost<{ snapshots: PortfolioSnapshot[] }>('/api/ventures', { action: 'list-snapshots' }).catch(() => ({ snapshots: [] })),
        ]);
        if (cancelled) return;
        setRemote(listData.ventures || []);
        const snapMap: Record<string, PortfolioSnapshot> = {};
        for (const s of snapsData.snapshots || []) snapMap[s.id] = s;
        setSnapshots(snapMap);
      } catch {
        // Fall back to builtin if API is unavailable
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ventures: Venture[] = remote && remote.length > 0 ? remote : builtinVentures;

  const filtered = useMemo(() => {
    if (tierFilter === 'all') return ventures;
    return ventures.filter(v => (v.tier ?? 1) === tierFilter);
  }, [ventures, tierFilter]);

  return (
    <PageShell>
      <PageHeader
        title="Ventures"
        subtitle={compareMode
          ? `${selected.size}/${COMPARE_CAP} selected · pick 2–6 to compare head-to-head`
          : `${ventures.length} ventures in the portfolio${loading ? ' (loading…)' : ''}`}
        icon={<Layers size={16} />}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            icon={compareMode ? <X size={12} /> : <GitCompare size={12} />}
            onClick={toggleCompareMode}
            size="sm"
            variant={compareMode ? 'ghost' : 'secondary'}
          >
            {compareMode ? 'Cancel' : 'Compare'}
          </Button>
          {!compareMode && <Button icon={<Plus size={12} />} onClick={onNew} size="sm">New venture</Button>}
        </div>
      </PageHeader>

      <div className="vix-filters">
        {(['all', 1, 2, 3] as const).map(t => (
          <Toggle
            key={t}
            pressed={tierFilter === t}
            onPressedChange={() => setTierFilter(t)}
            size="sm"
          >
            {TIER_LABEL[t]}
          </Toggle>
        ))}
      </div>

      <div className="vix-grid">
        {filtered.map(v => {
          const tier = v.tier ?? 1;
          const snap = snapshots[v.id];
          const health = snap?.summary.health_score;
          const isSelected = selected.has(v.id);
          const atCap = !isSelected && selected.size >= COMPARE_CAP;
          return (
            <GlassCard
              key={v.id}
              className={`vix-card ${compareMode ? 'vix-compare-mode' : ''} ${isSelected ? 'vix-selected' : ''} ${atCap ? 'vix-disabled' : ''}`}
              onClick={() => {
                if (compareMode) {
                  if (!atCap) toggleVentureSelection(v.id);
                } else {
                  onSelect?.(v);
                }
              }}
            >
              {compareMode && (
                <div className={`vix-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <Check size={11} />}
                </div>
              )}
              <div className="vix-card-head">
                <span className="vix-icon" style={{ background: v.color }}>{v.icon}</span>
                <div className="vix-title-col">
                  <div className="vix-title">{v.name}</div>
                  <div className="vix-tagline">{v.tagline}</div>
                </div>
                {typeof health === 'number' && (
                  <div className="vix-health" style={{ borderColor: healthColor(health), color: healthColor(health) }}>
                    {health}
                  </div>
                )}
              </div>
              <div className="vix-meta">
                <Badge color={STATUS_COLORS[v.status]} variant="outline">{v.status}</Badge>
                <Badge color={tier === 1 ? '#00F0FF' : tier === 2 ? '#8B5CF6' : '#6B7280'}>Tier {tier}</Badge>
                {v.clerkOrgId && <Badge color="#10B981" variant="outline">Tenant</Badge>}
              </div>
              {snap && (
                <div className="vix-stats">
                  <span title="Quests done/total">Q {snap.summary.quests.done}/{snap.summary.quests.total}</span>
                  <span title="Confirmed assets">A {snap.summary.assets.confirmed}</span>
                  <span title="Verified domains">D {snap.summary.domains.verified}/{snap.summary.domains.total}</span>
                  <span title="Total docs">Docs {snap.summary.docs.total}</span>
                </div>
              )}
              <div className="vix-domain">{v.domain}</div>
            </GlassCard>
          );
        })}
      </div>

      {compareMode && selected.size > 0 && (
        <div className="vix-compare-bar">
          <span className="vix-compare-count">
            {selected.size} selected{selected.size >= COMPARE_CAP ? ' (max)' : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          <Button
            size="sm"
            icon={<GitCompare size={12} />}
            onClick={openCompare}
            disabled={selected.size < 2}
          >
            Compare {selected.size} ventures
          </Button>
        </div>
      )}

      {drawerOpen && (
        <VentureCompareDrawer
          ventureIds={[...selected]}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <style>{`
        .vix-filters { display: flex; gap: 8px; padding: 0 24px 16px; flex-wrap: wrap; }
        .vix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; padding: 0 24px 24px; }
        .vix-card { padding: 16px; cursor: pointer; transition: transform 0.12s ease, border-color 0.12s ease; position: relative; }
        .vix-card:hover { transform: translateY(-2px); border-color: var(--border-active); }
        .vix-compare-mode { padding-top: 34px; }
        .vix-selected { border-color: var(--cyan); background: var(--cyan-glow); }
        .vix-disabled { opacity: 0.45; cursor: not-allowed; }
        .vix-disabled:hover { transform: none; border-color: var(--border); }
        .vix-checkbox { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-active); background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: transparent; transition: all 0.12s; }
        .vix-checkbox.checked { background: var(--cyan); border-color: var(--cyan); color: var(--bg-deep); }
        .vix-compare-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-active); border-radius: var(--radius-full); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px var(--cyan-glow); z-index: var(--z-sticky, 100); animation: vix-bar-in 0.22s ease-out; }
        @keyframes vix-bar-in { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .vix-compare-count { font-size: 12px; font-family: var(--font-mono); color: var(--text-secondary); padding-right: 6px; border-right: 1px solid var(--border); margin-right: 2px; }
        .vix-card-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
        .vix-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); font-weight: 800; color: var(--bg-deep); font-size: 16px; font-family: var(--font-display); flex-shrink: 0; }
        .vix-title-col { flex: 1; min-width: 0; }
        .vix-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
        .vix-tagline { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vix-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .vix-health { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); border: 2px solid; font-size: 12px; font-weight: 700; font-family: var(--font-display); flex-shrink: 0; }
        .vix-stats { display: flex; gap: 10px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 6px; }
        .vix-stats span { letter-spacing: 0.02em; }
        .vix-domain { font-size: 10px; color: var(--text-secondary); font-family: var(--font-mono); }
      `}</style>
    </PageShell>
  );
}
