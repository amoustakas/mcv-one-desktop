import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Layers, GitCompare, Check, X, FileText, ChevronUp, Loader2, Building2, AlertTriangle } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, Button, Toggle } from '../components/ui';
import { ventures as builtinVentures, type Venture, type VentureTier } from '../lib/ventures';
import { apiPost } from '../lib/api/client';
import { healthColor, type SnapshotSummary } from '../lib/ventures/snapshot';
import VentureCompareDrawer from '../components/ventures/VentureCompareDrawer';
import VentureContextMenu from '../components/ventures/VentureContextMenu';

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
const DEPARTMENTS = ['legal', 'compliance', 'research', 'finance', 'ops', 'product'] as const;
type Department = typeof DEPARTMENTS[number];

export default function VenturesIndexView({ onSelect, onNew }: VenturesIndexProps) {
  const [remote, setRemote] = useState<Venture[] | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, PortfolioSnapshot>>({});
  const [tierFilter, setTierFilter] = useState<VentureTier | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyMenuOpen, setApplyMenuOpen] = useState(false);
  const [applying, setApplying] = useState<Department | null>(null);
  const [applyResult, setApplyResult] = useState<{ dept: Department; success: number; total: number; docs: number; docIds: string[] } | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const applyMenuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ venture: Venture; x: number; y: number } | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState<{ success: number; skipped: number; failed: number; promotedIds: string[] } | null>(null);
  const [undoingPromote, setUndoingPromote] = useState(false);
  const [promoteCountdown, setPromoteCountdown] = useState(0);

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

  async function bulkApplyTemplates(dept: Department) {
    if (selected.size === 0 || applying) return;
    setApplying(dept);
    setApplyMenuOpen(false);
    setApplyResult(null);
    const ids = [...selected];

    // Capture docs from each response so Undo can delete exactly what we
    // created. Failed calls contribute empty arrays so count/docIds align
    // with what actually landed in the DB.
    type ApplyDoc = { id: string };
    const results = await Promise.all(ids.map(venture_id =>
      apiPost<{ docs: ApplyDoc[]; count: number }>('/api/ventures', {
        action: 'apply-doc-template',
        venture_id,
        department: dept,
      }).then(r => ({ ok: true, count: r.count ?? 0, docIds: (r.docs || []).map(d => d.id) }))
        .catch(() => ({ ok: false, count: 0, docIds: [] as string[] }))
    ));

    const success = results.filter(r => r.ok).length;
    const docs = results.reduce((sum, r) => sum + r.count, 0);
    const docIds = results.flatMap(r => r.docIds);
    setApplying(null);
    setApplyResult({ dept, success, total: ids.length, docs, docIds });

    // Refresh snapshots so doc counts update immediately
    try {
      const data = await apiPost<{ snapshots: PortfolioSnapshot[] }>(
        '/api/ventures', { action: 'list-snapshots' },
      );
      const snapMap: Record<string, PortfolioSnapshot> = {};
      for (const s of data.snapshots || []) snapMap[s.id] = s;
      setSnapshots(snapMap);
    } catch {
      // ignore — result toast still surfaces the apply outcome
    }

    // 15s undo window — starts the countdown AND schedules auto-clear
    startUndoCountdown(15);
  }

  function startUndoCountdown(seconds: number) {
    setUndoCountdown(seconds);
  }

  // Tick the countdown each second; auto-dismiss the toast when it hits 0
  useEffect(() => {
    if (undoCountdown <= 0) return;
    const id = setTimeout(() => {
      if (undoCountdown <= 1) {
        setApplyResult(null);
        setUndoCountdown(0);
      } else {
        setUndoCountdown(c => c - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [undoCountdown]);

  async function undoLastApply() {
    if (!applyResult || undoing || applyResult.docIds.length === 0) return;
    setUndoing(true);
    try {
      await apiPost<{ deleted: number }>('/api/ventures', {
        action: 'delete-docs',
        doc_ids: applyResult.docIds,
      });
      // Refresh snapshots so cards reflect the rollback
      const data = await apiPost<{ snapshots: PortfolioSnapshot[] }>(
        '/api/ventures', { action: 'list-snapshots' },
      );
      const snapMap: Record<string, PortfolioSnapshot> = {};
      for (const s of data.snapshots || []) snapMap[s.id] = s;
      setSnapshots(snapMap);
    } catch {
      // leave toast up so user sees we didn't reverse cleanly
    } finally {
      setUndoing(false);
      setApplyResult(null);
      setUndoCountdown(0);
    }
  }

  // Close apply menu on outside click
  useEffect(() => {
    if (!applyMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (applyMenuRef.current && !applyMenuRef.current.contains(e.target as Node)) {
        setApplyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [applyMenuOpen]);

  async function bulkPromoteToTenants() {
    if (selected.size === 0 || promoting) return;
    setPromoting(true);
    setPromoteDialogOpen(false);
    setPromoteResult(null);
    const ids = [...selected];

    // Skip ventures that already have a clerk_org_id — provision-org is
    // idempotent server-side but this avoids noise in the result count.
    // Ventures with a dedicated org still show the "Tenant" badge on the card.
    const toPromote = ids.filter(id => !remote?.find(v => v.id === id)?.clerkOrgId);
    const skipped = ids.length - toPromote.length;

    // Capture venture_ids for successful promotions so Undo can unlink them.
    // We pair the id with the result so a partial-success run doesn't undo
    // ventures that failed to provision in the first place.
    const results = await Promise.all(toPromote.map(venture_id =>
      apiPost<{ clerk_org_id: string }>('/api/ventures', {
        action: 'provision-org',
        venture_id,
        mirror_members: true,
      }).then(() => ({ ok: true as const, venture_id }))
        .catch(() => ({ ok: false as const, venture_id }))
    ));

    const success = results.filter(r => r.ok).length;
    const failed = results.length - success;
    const promotedIds = results.filter(r => r.ok).map(r => r.venture_id);
    setPromoting(false);
    setPromoteResult({ success, skipped, failed, promotedIds });

    // Refresh ventures list so new clerk_org_id values populate + Tenant
    // badges appear on the newly-promoted cards
    try {
      const data = await apiPost<{ ventures: Venture[] }>('/api/ventures', { action: 'list' });
      setRemote(data.ventures || []);
    } catch {
      // ignore
    }

    // Longer undo window than apply-templates (15s → 20s) because tenant
    // promotion is a higher-stakes, more-external action. Operator should
    // have extra beats to notice and reverse.
    setPromoteCountdown(20);
  }

  // Tick the promote-undo countdown
  useEffect(() => {
    if (promoteCountdown <= 0) return;
    const id = setTimeout(() => {
      if (promoteCountdown <= 1) {
        setPromoteResult(null);
        setPromoteCountdown(0);
      } else {
        setPromoteCountdown(c => c - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [promoteCountdown]);

  async function undoLastPromote() {
    if (!promoteResult || undoingPromote || promoteResult.promotedIds.length === 0) return;
    setUndoingPromote(true);
    try {
      // Parallel unlink — idempotent server-side (unlink-org just nulls
      // clerk_org_id). Per-venture failures don't abort the run.
      await Promise.all(promoteResult.promotedIds.map(venture_id =>
        apiPost<{ venture: Venture }>('/api/ventures', { action: 'unlink-org', venture_id })
          .catch(() => null)
      ));
      const data = await apiPost<{ ventures: Venture[] }>('/api/ventures', { action: 'list' });
      setRemote(data.ventures || []);
    } finally {
      setUndoingPromote(false);
      setPromoteResult(null);
      setPromoteCountdown(0);
    }
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
            <div
              key={v.id}
              onContextMenu={(e: React.MouseEvent) => {
                if (compareMode) return;
                e.preventDefault();
                setContextMenu({ venture: v, x: e.clientX, y: e.clientY });
              }}
            >
            <GlassCard
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
            </div>
          );
        })}
      </div>

      {compareMode && selected.size > 0 && (
        <div className="vix-compare-bar">
          <span className="vix-compare-count">
            {selected.size} selected{selected.size >= COMPARE_CAP ? ' (max)' : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>

          <div className="vix-apply-wrap" ref={applyMenuRef}>
            <Button
              size="sm"
              variant="ghost"
              icon={applying ? <Loader2 size={12} className="vix-spin" /> : <FileText size={12} />}
              onClick={() => setApplyMenuOpen(o => !o)}
              disabled={!!applying}
            >
              {applying ? `Applying ${applying}…` : 'Apply templates'}
              <ChevronUp size={10} style={{ marginLeft: 4, transform: applyMenuOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.15s' }} />
            </Button>
            {applyMenuOpen && (
              <div className="vix-apply-menu" role="menu">
                <div className="vix-apply-menu-head">Seed {selected.size} venture{selected.size === 1 ? '' : 's'} with</div>
                {DEPARTMENTS.map(d => (
                  <button key={d} className="vix-apply-menu-item" onClick={() => bulkApplyTemplates(d)}>
                    {d.charAt(0).toUpperCase() + d.slice(1)} templates
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            icon={promoting ? <Loader2 size={12} className="vix-spin" /> : <Building2 size={12} />}
            onClick={() => setPromoteDialogOpen(true)}
            disabled={promoting || selected.size === 0}
            title="Promote selected ventures to dedicated Clerk tenants"
          >
            {promoting ? 'Promoting…' : 'Promote to tenant'}
          </Button>

          <Button
            size="sm"
            icon={<GitCompare size={12} />}
            onClick={openCompare}
            disabled={selected.size < 2}
          >
            Compare {selected.size}
          </Button>
        </div>
      )}

      {promoteDialogOpen && (
        <>
          <div className="vix-modal-backdrop" onClick={() => setPromoteDialogOpen(false)} />
          <div className="vix-modal" role="dialog" aria-modal="true">
            <div className="vix-modal-head">
              <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
              <div className="vix-modal-title">Promote {selected.size} venture{selected.size === 1 ? '' : 's'} to dedicated tenants?</div>
            </div>
            <div className="vix-modal-body">
              <p>Each selected venture will get its own Clerk organization. Current members with access to the venture will be mirrored into the new org. The venture's RLS scope flips from shared root to org-isolated.</p>
              <p className="vix-modal-note">Ventures already promoted are skipped automatically. This is idempotent server-side but not trivially reversible — unlink via venture settings if needed.</p>
            </div>
            <div className="vix-modal-actions">
              <Button variant="ghost" size="sm" onClick={() => setPromoteDialogOpen(false)}>Cancel</Button>
              <Button size="sm" icon={<Building2 size={12} />} onClick={bulkPromoteToTenants}>
                Promote {selected.size}
              </Button>
            </div>
          </div>
        </>
      )}

      {promoteResult && (
        <div className="vix-apply-toast" role="status">
          <Check size={13} style={{ color: promoteResult.failed === 0 ? '#10B981' : '#F59E0B' }} />
          <span>
            Promoted <strong>{promoteResult.success}</strong> venture{promoteResult.success === 1 ? '' : 's'} to dedicated tenants
            {promoteResult.skipped > 0 && ` · ${promoteResult.skipped} already provisioned`}
            {promoteResult.failed > 0 && ` · ${promoteResult.failed} failed`}
          </span>
          {promoteResult.promotedIds.length > 0 && (
            <button
              className="vix-toast-undo"
              onClick={undoLastPromote}
              disabled={undoingPromote}
              title="Unlink just-promoted ventures — Clerk org records remain in the Clerk dashboard until cleaned manually"
            >
              {undoingPromote ? 'Undoing…' : `Undo${promoteCountdown > 0 ? ` · ${promoteCountdown}s` : ''}`}
            </button>
          )}
          <button className="vix-toast-close" onClick={() => { setPromoteResult(null); setPromoteCountdown(0); }}>
            <X size={12} />
          </button>
        </div>
      )}

      {applyResult && (
        <div className="vix-apply-toast" role="status">
          <Check size={13} style={{ color: applyResult.success === applyResult.total ? '#10B981' : '#F59E0B' }} />
          <span>
            Applied <strong>{applyResult.dept}</strong> templates to {applyResult.success}/{applyResult.total} ventures
            {applyResult.docs > 0 && ` · ${applyResult.docs} docs seeded`}
          </span>
          {applyResult.docIds.length > 0 && (
            <button
              className="vix-toast-undo"
              onClick={undoLastApply}
              disabled={undoing}
              title="Delete the documents that were just created"
            >
              {undoing ? 'Undoing…' : `Undo${undoCountdown > 0 ? ` · ${undoCountdown}s` : ''}`}
            </button>
          )}
          <button className="vix-toast-close" onClick={() => { setApplyResult(null); setUndoCountdown(0); }}>
            <X size={12} />
          </button>
        </div>
      )}

      {drawerOpen && (
        <VentureCompareDrawer
          ventureIds={[...selected]}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {contextMenu && (
        <VentureContextMenu
          venture={contextMenu.venture}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
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
        .vix-spin { animation: vix-spin 0.8s linear infinite; }
        @keyframes vix-spin { to { transform: rotate(360deg); } }
        .vix-apply-wrap { position: relative; }
        .vix-apply-menu { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); min-width: 200px; background: var(--bg-card); border: 1px solid var(--border-active); border-radius: var(--radius-md); padding: 6px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); z-index: var(--z-popover, 3500); animation: vix-menu-in 0.15s ease-out; }
        @keyframes vix-menu-in { from { transform: translate(-50%, 8px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .vix-apply-menu-head { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); padding: 8px 10px 6px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
        .vix-apply-menu-item { display: block; width: 100%; text-align: left; padding: 8px 10px; background: transparent; border: none; color: var(--text-secondary); font-size: 13px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s; }
        .vix-apply-menu-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .vix-apply-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-active); border-radius: var(--radius-md); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); z-index: var(--z-toast, 4000); font-size: 12px; color: var(--text-primary); animation: vix-toast-in 0.2s ease-out; }
        @keyframes vix-toast-in { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .vix-apply-toast strong { font-weight: 700; color: var(--cyan); text-transform: capitalize; }
        .vix-toast-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; display: flex; align-items: center; }
        .vix-toast-close:hover { color: var(--text-primary); }
        .vix-toast-undo { background: transparent; border: 1px solid var(--border-active); color: var(--cyan); font-family: var(--font-mono); font-size: 11px; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s; }
        .vix-toast-undo:hover:not(:disabled) { background: var(--cyan-glow); border-color: var(--cyan); color: var(--text-primary); }
        .vix-toast-undo:disabled { opacity: 0.6; cursor: not-allowed; }
        .vix-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: var(--z-overlay, 2000); backdrop-filter: blur(2px); animation: vix-fade-in 0.15s ease-out; }
        @keyframes vix-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .vix-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(480px, 90vw); background: var(--bg-shell); border: 1px solid var(--border-active); border-radius: var(--radius-md); box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6); z-index: var(--z-modal, 3000); padding: 20px; animation: vix-modal-in 0.18s ease-out; }
        @keyframes vix-modal-in { from { transform: translate(-50%, -46%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
        .vix-modal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .vix-modal-title { font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); }
        .vix-modal-body p { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px; }
        .vix-modal-note { color: var(--text-muted); font-size: 11px; }
        .vix-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 14px; }
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
