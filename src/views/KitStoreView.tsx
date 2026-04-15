import { useState, useEffect } from 'react';
import { Package, Search, Download, Trash2, RefreshCw, Wrench, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageShell, PageHeader, Tabs, EmptyState, Button } from '../components/ui';
import { listKits, searchKits, installKit, uninstallKit, getInstalledKits } from '../lib/kits/registry-client';
import { useKitStore } from '../stores/kits';
import { useNavigation } from '../stores/navigation';
import { useFabricAudit } from '../hooks/use-fabric-audit';
import type { KitManifest } from '../lib/kits/types';

interface RegistryKitItem {
  kit_id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  manifest?: KitManifest;
  downloads?: number;
}

export default function KitStoreView() {
  const [tab, setTab] = useState('browse');
  const [query, setQuery] = useState('');
  const [kits, setKits] = useState<RegistryKitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKit, setSelectedKit] = useState<RegistryKitItem | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const { getLoadedKits, disableKit, enableKit } = useKitStore();
  const { activeVenture, mode } = useNavigation();
  const audit = useFabricAudit();
  const allLoadedKits = getLoadedKits();
  const loadedKits = mode === 'venture' && activeVenture
    ? allLoadedKits.filter((k) => {
        const scope = k.manifest.ventureScope;
        return scope === '*' || scope.includes(activeVenture);
      })
    : allLoadedKits;

  useEffect(() => {
    loadBrowse();
    loadInstalled();
  }, []);

  async function loadBrowse() {
    setLoading(true);
    try {
      const data = await listKits();
      setKits(data);
    } catch {
      setKits([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadInstalled() {
    try {
      const data = await getInstalledKits();
      setInstalledIds(new Set(data.map((d) => d.kit_id)));
    } catch {
      // Ignore if table doesn't exist yet
    }
  }

  async function handleSearch() {
    if (!query.trim()) {
      loadBrowse();
      return;
    }
    setLoading(true);
    try {
      const data = await searchKits(query);
      setKits(data);
    } catch {
      setKits([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall(kitId: string) {
    try {
      await installKit(kitId, audit);
      setInstalledIds((prev) => new Set(prev).add(kitId));
    } catch {
      // Show error inline
    }
  }

  async function handleUninstall(kitId: string) {
    try {
      await uninstallKit(kitId, audit);
      setInstalledIds((prev) => {
        const next = new Set(prev);
        next.delete(kitId);
        return next;
      });
    } catch {
      // Show error inline
    }
  }

  const tabItems = [
    { id: 'browse', label: 'Browse' },
    { id: 'installed', label: 'Installed', count: loadedKits.length },
  ];

  return (
    <PageShell scroll={false}>
      <PageHeader icon={<Package size={20} />} title="Kit Store">
        <span className="ks-subtitle">Discover and install agent capabilities</span>
      </PageHeader>

      <Tabs tabs={tabItems} active={tab} onChange={setTab} className="ks-tabs-wrap" />

      {tab === 'browse' && (
        <>
          <div className="ks-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search kits..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="ks-search-btn" onClick={handleSearch}>
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="ks-grid">
            {loading && <p className="ks-loading">Loading...</p>}
            {!loading && kits.length === 0 && (
              <EmptyState
                icon={<Package size={32} />}
                title="No kits found in the registry yet"
                description="Built-in kits are loaded automatically. Remote kits will appear here once the registry is populated."
              />
            )}
            {kits.map((kit) => (
              <div
                key={kit.kit_id}
                className={`ks-card ${selectedKit?.kit_id === kit.kit_id ? 'selected' : ''}`}
                onClick={() => setSelectedKit(kit)}
              >
                <div className="ks-card-header">
                  <span className="ks-card-name">{kit.name}</span>
                  <span className="ks-card-version">v{kit.version}</span>
                </div>
                <p className="ks-card-desc">{kit.description}</p>
                <div className="ks-card-footer">
                  <span className="ks-card-author">{kit.author}</span>
                  {kit.downloads != null && (
                    <span className="ks-card-downloads">
                      <Download size={10} /> {kit.downloads}
                    </span>
                  )}
                  {installedIds.has(kit.kit_id) ? (
                    <Button variant="ghost" size="sm" icon={<Trash2 size={10} />} onClick={(e) => { e.stopPropagation(); handleUninstall(kit.kit_id); }}>Uninstall</Button>
                  ) : (
                    <Button variant="secondary" size="sm" icon={<Download size={10} />} onClick={(e) => { e.stopPropagation(); handleInstall(kit.kit_id); }}>Install</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'installed' && (
        <div className="ks-installed">
          {loadedKits.length === 0 && (
            <EmptyState icon={<Wrench size={32} />} title="No kits loaded" />
          )}
          {loadedKits.map((kit) => (
            <div key={kit.manifest.id} className="ks-installed-row">
              <div className="ks-installed-info">
                <div className="ks-installed-name">
                  <span className={`ks-dot ${kit.status}`} />
                  {kit.manifest.name}
                  <span className="ks-card-version">v{kit.manifest.version}</span>
                  <span className="ks-badge">{kit.source}</span>
                </div>
                <p className="ks-installed-desc">{kit.manifest.description}</p>
                <div className="ks-installed-tools">
                  {kit.manifest.tools.map((t) => (
                    <span key={t.name} className="ks-tool-chip">{t.name}</span>
                  ))}
                </div>
              </div>
              <button
                className="ks-toggle"
                onClick={() => kit.status === 'loaded' ? disableKit(kit.manifest.id) : enableKit(kit.manifest.id)}
              >
                {kit.status === 'loaded' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Kit detail panel */}
      {selectedKit && (
        <div className="ks-detail">
          <div className="ks-detail-header">
            <h3>{selectedKit.name}</h3>
            <button className="ks-detail-close" onClick={() => setSelectedKit(null)}>
              &times;
            </button>
          </div>
          <p className="ks-detail-desc">{selectedKit.description}</p>
          <div className="ks-detail-meta">
            <span>Author: {selectedKit.author}</span>
            <span>Version: {selectedKit.version}</span>
            {selectedKit.downloads != null && <span>Downloads: {selectedKit.downloads}</span>}
          </div>
          {selectedKit.manifest?.tools && (
            <div className="ks-detail-tools">
              <h4>Tools</h4>
              {selectedKit.manifest.tools.map((tool) => (
                <div key={tool.name} className="ks-detail-tool">
                  <Wrench size={11} />
                  <span className="ks-detail-tool-name">{tool.name}</span>
                  <span className="ks-detail-tool-desc">{tool.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .ks-subtitle { font-size:var(--text-sm); color:var(--text-secondary); }
        .ks-tabs-wrap { margin:0 var(--space-lg); flex-shrink:0; }

        .ks-search {
          display:flex; align-items:center; gap:var(--space-sm); padding:var(--space-sm);
          background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-md);
          color:var(--text-secondary); flex-shrink:0; margin:0 var(--space-lg);
        }
        .ks-search input { flex:1; background:none; border:none; color:var(--text-primary); font-size:var(--text-sm); }
        .ks-search input:focus { outline:none; }
        .ks-search-btn { padding:4px; border-radius:4px; color:var(--text-muted); transition:color var(--transition-fast); }
        .ks-search-btn:hover { color:var(--cyan); }

        .ks-grid {
          flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
          gap:var(--space-sm); align-content:start; padding:var(--space-md) var(--space-lg);
        }
        .ks-loading { grid-column:1/-1; text-align:center; color:var(--text-muted); padding:var(--space-2xl); }

        .ks-card {
          padding:var(--space-md); background:var(--bg-card); border:1px solid var(--border);
          border-radius:var(--radius-md); cursor:pointer; transition:all var(--transition-fast);
        }
        .ks-card:hover { border-color:var(--border-active); }
        .ks-card.selected { border-color:var(--cyan); background:rgba(0,240,255,0.03); }
        .ks-card-header { display:flex; align-items:baseline; gap:var(--space-sm); margin-bottom:4px; }
        .ks-card-name { font-weight:600; color:var(--text-primary); font-size:var(--text-sm); }
        .ks-card-version { font-size:10px; color:var(--text-muted); }
        .ks-card-desc { font-size:var(--text-xs); color:var(--text-secondary); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ks-card-footer { display:flex; align-items:center; gap:var(--space-sm); margin-top:var(--space-sm); font-size:10px; color:var(--text-muted); }
        .ks-card-author { flex:1; }
        .ks-card-downloads { display:flex; align-items:center; gap:3px; }

        /* Installed tab */
        .ks-installed { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:var(--space-sm); padding:var(--space-md) var(--space-lg); }
        .ks-installed-row { display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); }
        .ks-installed-info { flex:1; min-width:0; }
        .ks-installed-name { display:flex; align-items:center; gap:6px; font-weight:600; font-size:var(--text-sm); color:var(--text-primary); }
        .ks-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .ks-dot.loaded { background:rgb(34,197,94); }
        .ks-dot.disabled { background:var(--text-muted); }
        .ks-dot.error { background:rgb(239,68,68); }
        .ks-badge { font-size:9px; padding:1px 5px; border-radius:3px; background:var(--bg-elevated); color:var(--text-muted); font-weight:500; text-transform:uppercase; }
        .ks-installed-desc { font-size:var(--text-xs); color:var(--text-secondary); margin:2px 0 4px; }
        .ks-installed-tools { display:flex; flex-wrap:wrap; gap:3px; }
        .ks-tool-chip { font-size:10px; padding:1px 6px; border-radius:3px; background:rgba(0,240,255,0.06); color:var(--cyan); border:1px solid rgba(0,240,255,0.12); }
        .ks-toggle { color:var(--text-secondary); transition:color var(--transition-fast); flex-shrink:0; }
        .ks-toggle:hover { color:var(--cyan); }

        /* Detail panel */
        .ks-detail { position:absolute; right:0; top:0; bottom:0; width:320px; background:var(--bg-surface); border-left:1px solid var(--border); padding:var(--space-lg); overflow-y:auto; z-index:10; }
        .ks-detail-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-md); }
        .ks-detail-header h3 { font-size:var(--text-lg); font-weight:700; margin:0; }
        .ks-detail-close { font-size:20px; color:var(--text-muted); padding:4px; }
        .ks-detail-close:hover { color:var(--text-primary); }
        .ks-detail-desc { font-size:var(--text-sm); color:var(--text-secondary); line-height:1.5; margin-bottom:var(--space-md); }
        .ks-detail-meta { display:flex; flex-direction:column; gap:4px; font-size:var(--text-xs); color:var(--text-muted); margin-bottom:var(--space-md); }
        .ks-detail-tools h4 { font-size:var(--text-sm); font-weight:600; margin:0 0 var(--space-sm); }
        .ks-detail-tool { display:flex; align-items:flex-start; gap:6px; padding:4px 0; font-size:var(--text-xs); color:var(--text-secondary); }
        .ks-detail-tool-name { font-weight:600; color:var(--text-primary); white-space:nowrap; }

        @media (max-width:768px) {
          .ks-grid { grid-template-columns:1fr; }
          .ks-detail { width:100%; }
        }
      `}</style>
    </PageShell>
  );
}
