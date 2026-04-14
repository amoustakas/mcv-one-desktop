import { useEffect, useMemo, useState } from 'react';
import { Check, X, Globe, Github, Package, FileText, Link2, Hash, Box, Plus } from 'lucide-react';
import { GlassCard, Badge, Button, EmptyState } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture, VentureAsset, VentureAssetKind, VentureTier } from '../../lib/ventures';

const KIND_ICON: Record<VentureAssetKind, typeof Globe> = {
  repo: Github,
  app: Package,
  domain: Globe,
  doc: FileText,
  integration: Link2,
  social: Hash,
  workspace: Box,
};

const TIER_LABEL: Record<VentureTier, string> = {
  1: 'Tier 1 · Portfolio Lead',
  2: 'Tier 2 · Branded Sub-platform',
  3: 'Tier 3 · Supporting Asset',
};

export default function AssetTierGraph({ venture }: { venture: Venture }) {
  const [assets, setAssets] = useState<VentureAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await apiPost<{ assets: VentureAsset[] }>('/api/ventures', { action: 'list-assets', venture_id: venture.id });
      setAssets(data.assets || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [venture.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmAsset(id: string, confirmed: boolean) {
    try {
      await apiPost('/api/ventures', { action: 'confirm-asset', id, confirmed });
      setAssets(prev => prev.map(a => a.id === id ? { ...a, confirmed } : a));
    } catch (e) {
      console.error('confirm-asset failed', e);
    }
  }

  async function removeAsset(id: string) {
    try {
      await apiPost('/api/ventures', { action: 'remove-asset', id });
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('remove-asset failed', e);
    }
  }

  const byTier = useMemo(() => {
    const map: Record<VentureTier, VentureAsset[]> = { 1: [], 2: [], 3: [] };
    for (const a of assets) map[a.tier as VentureTier]?.push(a);
    return map;
  }, [assets]);

  const suggestedCount = assets.filter(a => a.discovered && !a.confirmed).length;

  if (loading) {
    return <GlassCard className="atg-card"><div className="atg-loading">Loading assets for {venture.name}…</div></GlassCard>;
  }
  if (error) {
    return <EmptyState icon={<Box size={18} />} title="Couldn't load assets" description={error} />;
  }
  if (assets.length === 0) {
    return (
      <EmptyState
        icon={<Box size={18} />}
        title={`No assets linked to ${venture.name} yet`}
        description="Run asset discovery (Epic 5) or add repos, domains, and integrations manually."
      />
    );
  }

  return (
    <div className="atg-root">
      {suggestedCount > 0 && (
        <div className="atg-suggested-banner">
          <strong>{suggestedCount}</strong> auto-suggested asset{suggestedCount === 1 ? '' : 's'} — tap ✓ to confirm or ✗ to dismiss.
        </div>
      )}

      {([1, 2, 3] as VentureTier[]).map(tier => {
        const tierAssets = byTier[tier];
        if (tierAssets.length === 0) return null;
        return (
          <GlassCard key={tier} className="atg-card atg-tier">
            <div className="atg-tier-head">
              <h4 className="atg-tier-label">{TIER_LABEL[tier]}</h4>
              <Badge color={tier === 1 ? '#00F0FF' : tier === 2 ? '#8B5CF6' : '#6B7280'}>{tierAssets.length}</Badge>
            </div>
            <ul className="atg-list">
              {tierAssets.map(a => {
                const Icon = KIND_ICON[a.kind] || Box;
                const isSuggestion = a.discovered && !a.confirmed;
                return (
                  <li key={a.id} className={`atg-item ${isSuggestion ? 'atg-item-suggested' : ''}`}>
                    <div className="atg-item-icon"><Icon size={14} /></div>
                    <div className="atg-item-main">
                      <span className="atg-item-name">{a.name}</span>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="atg-item-url">{a.url}</a>
                      )}
                    </div>
                    <span className="atg-item-kind">{a.kind}</span>
                    {isSuggestion ? (
                      <div className="atg-item-actions">
                        <button className="atg-btn atg-btn-confirm" onClick={() => confirmAsset(a.id, true)} aria-label="Confirm"><Check size={12} /></button>
                        <button className="atg-btn atg-btn-dismiss" onClick={() => removeAsset(a.id)} aria-label="Dismiss"><X size={12} /></button>
                      </div>
                    ) : (
                      <button className="atg-btn atg-btn-dismiss" onClick={() => removeAsset(a.id)} aria-label="Remove"><X size={12} /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        );
      })}

      <div className="atg-add-row">
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => console.log('TODO: open add-asset dialog')}>
          Add asset manually
        </Button>
      </div>

      <style>{`
        .atg-root { display: flex; flex-direction: column; gap: 12px; }
        .atg-card { padding: 16px; }
        .atg-loading { color: var(--text-muted); font-size: 13px; }
        .atg-suggested-banner { padding: 10px 14px; background: linear-gradient(90deg, var(--cyan-glow), transparent); border: 1px solid var(--border-active); border-radius: var(--radius-md); font-size: 12px; color: var(--text-secondary); }
        .atg-suggested-banner strong { color: var(--cyan); font-family: var(--font-mono); }
        .atg-tier-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .atg-tier-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0; font-family: var(--font-display); }
        .atg-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .atg-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); transition: background 0.12s; }
        .atg-item:hover { background: var(--bg-hover); }
        .atg-item-suggested { background: var(--cyan-glow); border: 1px dashed var(--border-active); }
        .atg-item-icon { color: var(--text-secondary); width: 20px; display: flex; justify-content: center; }
        .atg-item-main { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .atg-item-name { font-size: 12px; color: var(--text-primary); font-weight: 500; }
        .atg-item-url { font-size: 10px; color: var(--text-muted); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .atg-item-url:hover { color: var(--cyan); }
        .atg-item-kind { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-mono); padding: 2px 6px; background: var(--bg-input); border-radius: var(--radius-full); }
        .atg-item-actions { display: flex; gap: 4px; }
        .atg-btn { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-muted); transition: all 0.12s; }
        .atg-btn:hover { background: var(--bg-input); color: var(--text-primary); }
        .atg-btn-confirm:hover { color: var(--success); border-color: var(--success); }
        .atg-btn-dismiss:hover { color: var(--error); border-color: var(--error); }
        .atg-add-row { display: flex; justify-content: center; margin-top: 4px; }
      `}</style>
    </div>
  );
}
