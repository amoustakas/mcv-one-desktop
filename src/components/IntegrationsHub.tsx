import { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, Cloud, Globe, Database, Shield, Mic, Volume2,
  Radio, Zap, XCircle, Link, Unlink, RefreshCw,
  ChevronDown, ChevronUp, Server, Star, StarOff, Search,
  Grid3X3, List, Layers, ExternalLink, Clock, Activity,
  AlertTriangle, Workflow, Layout, X, Eye,
  CreditCard, MessageSquare, Gamepad2, Palette,
  Mail, Phone, Landmark, Users, Plug,
} from 'lucide-react';
import { Button, Badge } from './ui';
import { cn } from '../lib/utils';
import { timeAgo } from '../lib/utils';
import { useOAuthStatus, useOAuthConnect, useOAuthDisconnect, useOAuthTest } from '../hooks/use-oauth';
import {
  OAUTH_PROVIDERS, API_KEY_SERVICES, CATEGORY_META, PROVIDER_CATEGORIES,
  PROVIDER_CONSUMERS, type IntegrationCategory, type EnrichedConnection,
  type ConnectionFlowState,
} from '../lib/types/oauth';
import { useIntegrations } from '../stores/integrations';
import { useNotificationStore } from '../stores/notifications';
import { useMcpStore } from '../stores/mcp';
import McpServerCard from './McpServerCard';
import McpAddServerModal from './McpAddServerModal';
import McpServerDetail from './McpServerDetail';
// McpServerConfig used indirectly via McpServerCard props

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------
const ICONS: Record<string, typeof Cloud> = {
  // OAuth providers
  github: GitBranch, google: Globe, notion: Database, cloudflare: Cloud,
  stripe: CreditCard, slack: MessageSquare, discord: Gamepad2,
  linear: GitBranch, figma: Palette,
  // API key services
  'Claude API': Zap, Deepgram: Mic, ElevenLabs: Volume2,
  'Google AI': Zap, 'Google Maps': Globe, Vercel: Radio, n8n: Server,
  'Twilio': Phone, 'SendGrid': Mail, 'Resend': Mail,
  'Plaid': Landmark, 'Upstash': Database, 'OpenAI': Zap,
  // Category icons
  GitBranch, Layout, Zap: Zap, Cloud, Radio, Mic, Database, Workflow,
  MessageSquare, CreditCard, Palette, Users,
};

const FLOW_STATE_COLORS: Record<ConnectionFlowState, string> = {
  disconnected: 'var(--text-muted)',
  initiating: 'var(--cyan)',
  authenticating: 'var(--cyan)',
  exchanging: 'var(--cyan)',
  active: 'var(--success)',
  refreshing: 'var(--warning)',
  degraded: 'var(--warning)',
  expired: 'var(--error)',
  revoked: 'var(--error)',
  error: 'var(--error)',
};

// ---------------------------------------------------------------------------
// Build enriched connection registry from API data
// ---------------------------------------------------------------------------
function buildEnrichedConnections(
  oauthData: { connections: Array<Record<string, unknown>>; health: Record<string, boolean> } | undefined,
  favorites: string[],
): Record<string, EnrichedConnection> {
  const result: Record<string, EnrichedConnection> = {};

  // OAuth providers
  for (const [key, config] of Object.entries(OAUTH_PROVIDERS)) {
    const conn = oauthData?.connections?.find((c) => c.provider === key);
    const connected = !!conn?.connected;
    result[key] = {
      provider: key,
      name: config.name,
      description: config.description,
      category: PROVIDER_CATEGORIES[key] || 'infrastructure',
      flowState: connected ? 'active' : conn?.status === 'expired' ? 'expired' : conn?.status === 'revoked' ? 'revoked' : 'disconnected',
      connected,
      userName: conn?.userName as string | undefined,
      tokenSource: connected ? 'oauth' : 'env',
      tokenSourceLabel: connected
        ? `OAuth → ${config.name} (user-authorized)`
        : oauthData?.health?.[config.clientIdEnvVar.replace('_CLIENT_ID', '_TOKEN').replace('OAUTH_', '')]
          ? `Env var → Vercel deployment`
          : 'Not configured',
      scopes: (conn?.scopes as string[]) || config.scopes,
      connectedAt: conn?.connectedAt as string | undefined,
      expiresAt: conn?.expiresAt as string | undefined,
      refreshable: key === 'google', // Only Google uses refresh tokens
      consecutiveFailures: 0,
      consumers: PROVIDER_CONSUMERS[key] || [],
      docsUrl: config.authUrl.split('/oauth')[0],
      configuredVia: connected ? 'settings' : 'env',
      favorite: favorites.includes(key),
    };
  }

  // API key services
  for (const svc of API_KEY_SERVICES) {
    const configured = !!oauthData?.health?.[svc.envKey];
    result[svc.name] = {
      provider: svc.name,
      name: svc.name,
      description: svc.description,
      category: svc.category,
      flowState: configured ? 'active' : 'disconnected',
      connected: configured,
      tokenSource: 'env',
      tokenSourceLabel: configured
        ? `Env var → ${svc.envKey} (Vercel project)`
        : `Missing → Set ${svc.envKey} in Vercel`,
      scopes: [],
      refreshable: false,
      consecutiveFailures: 0,
      consumers: PROVIDER_CONSUMERS[svc.name] || [],
      docsUrl: svc.docsUrl,
      configuredVia: 'env',
      favorite: favorites.includes(svc.name),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// IntegrationsHub — Enterprise Integration Command Center
// ---------------------------------------------------------------------------
export default function IntegrationsHub() {
  const { data, isLoading } = useOAuthStatus();
  const connectMutation = useOAuthConnect();
  const disconnectMutation = useOAuthDisconnect();
  const testMutation = useOAuthTest();
  const notify = useNotificationStore((s) => s.addNotification);

  const store = useIntegrations();
  const {
    activeTab, filterState, searchQuery, sortBy, viewMode,
    expandedProvider, detailPanel, favorites,
    setActiveTab, setFilterState, setSearchQuery, setSortBy,
    setViewMode, setExpandedProvider, openDetail, closeDetail,
    toggleFavorite, setConnections, setTestResult,
    getFilteredConnections, getCategoryCounts, getHealthSummary,
  } = store;

  // MCP state
  const mcpStore = useMcpStore();
  const [mcpAddModalOpen, setMcpAddModalOpen] = useState(false);
  const [mcpDetailServerId, setMcpDetailServerId] = useState<string | null>(null);
  const mcpServers = Object.values(mcpStore.serverConfigs);
  const mcpDetailConfig = mcpDetailServerId ? mcpStore.serverConfigs[mcpDetailServerId] : null;

  // Sync API data into store
  useEffect(() => {
    if (data) {
      const enriched = buildEnrichedConnections(data as any, favorites);
      setConnections(enriched);
    }
  }, [data, favorites]);

  const filtered = getFilteredConnections();
  const counts = getCategoryCounts();
  const health = getHealthSummary();

  // Handlers
  const handleConnect = useCallback(async (provider: string) => {
    store.updateFlowState(provider, 'initiating');
    connectMutation.mutate(provider);
  }, []);

  const handleDisconnect = useCallback(async (provider: string) => {
    try {
      await disconnectMutation.mutateAsync(provider);
      store.updateFlowState(provider, 'disconnected');
      notify({ type: 'info', title: `${provider} disconnected`, description: 'OAuth connection removed', source: 'integrations' });
    } catch (err) {
      notify({ type: 'error', title: 'Disconnect failed', description: err instanceof Error ? err.message : 'Unknown error', source: 'integrations' });
    }
  }, []);

  const handleTest = useCallback(async (provider: string) => {
    try {
      const result = await testMutation.mutateAsync(provider);
      setTestResult(provider, { success: result.success, latencyMs: result.latency || 0 });
      notify({
        type: result.success ? 'success' : 'error',
        title: `${provider} ${result.success ? 'verified' : 'failed'}`,
        description: result.success ? `OK (${result.latency}ms)` : (result.error || 'Test failed'),
        source: 'integrations',
      });
    } catch (err) {
      notify({ type: 'error', title: `${provider} test error`, description: err instanceof Error ? err.message : 'Unknown error', source: 'integrations' });
    }
  }, []);

  // Group connections by category for grouped view
  const grouped = filtered.reduce<Record<string, EnrichedConnection[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="ih-loading">Loading integrations...</div>;
  }

  // ───── Category tabs ─────
  const tabItems: Array<{ id: string; label: string; count: number; icon?: typeof Plug }> = [
    { id: 'all', label: 'All', count: counts.all || 0 },
    { id: 'favorites', label: 'Favorites', count: counts.favorites || 0 },
    ...Object.entries(CATEGORY_META)
      .sort(([, a], [, b]) => a.order - b.order)
      .filter(([id]) => (counts[id] ?? 0) > 0)
      .map(([id, meta]) => ({ id, label: meta.label, count: counts[id] ?? 0 })),
    { id: 'mcp', label: 'MCP Servers', count: mcpServers.length, icon: Plug },
  ];

  return (
    <div className="ih2">
      {/* ───── Health bar ───── */}
      <div className="ih2-health">
        <div className="ih2-health-item">
          <Activity size={12} style={{ color: 'var(--success)' }} />
          <span>{health.active} active</span>
        </div>
        {health.degraded > 0 && (
          <div className="ih2-health-item">
            <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />
            <span>{health.degraded} degraded</span>
          </div>
        )}
        {health.error > 0 && (
          <div className="ih2-health-item">
            <XCircle size={12} style={{ color: 'var(--error)' }} />
            <span>{health.error} issues</span>
          </div>
        )}
        <span className="ih2-health-total">{health.total} integrations</span>
      </div>

      {/* ───── Toolbar: tabs + search + view controls ───── */}
      <div className="ih2-toolbar">
        <div className="ih2-tabs">
          {tabItems.map((t) => (
            <button
              key={t.id}
              className={cn('ih2-tab', activeTab === t.id && 'active')}
              onClick={() => setActiveTab(t.id as IntegrationCategory | 'all' | 'favorites')}
            >
              {t.label}
              <span className="ih2-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="ih2-controls">
          <div className="ih2-search">
            <Search size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="ih2-search-input"
            />
            {searchQuery && (
              <button className="ih2-search-clear" onClick={() => setSearchQuery('')}><X size={12} /></button>
            )}
          </div>

          <select className="ih2-select" value={filterState} onChange={(e) => setFilterState(e.target.value as typeof filterState)}>
            <option value="all">All states</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="error">Issues</option>
          </select>

          <select className="ih2-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="category">Sort: Category</option>
            <option value="name">Sort: Name</option>
            <option value="status">Sort: Status</option>
            <option value="lastUsed">Sort: Last Used</option>
          </select>

          <div className="ih2-view-toggle">
            <button className={cn('ih2-vbtn', (viewMode as string) === 'grid' && 'active')} onClick={() => setViewMode('grouped')}><Layers size={13} /></button>
            <button className={cn('ih2-vbtn', (viewMode as string) === 'grid' && 'active')} onClick={() => setViewMode('grid')}><Grid3X3 size={13} /></button>
            <button className={cn('ih2-vbtn', viewMode === 'list' && 'active')} onClick={() => setViewMode('list')}><List size={13} /></button>
          </div>
        </div>
      </div>

      {/* ───── MCP Servers tab ───── */}
      {activeTab === 'mcp' ? (
        <div className="ih2-mcp-section">
          <div className="ih2-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {mcpServers.map((config) => (
              <McpServerCard
                key={config.id}
                config={config}
                status={mcpStore.connectionStatus[config.id] || 'disconnected'}
                tools={mcpStore.serverTools[config.id] || []}
                error={mcpStore.serverErrors[config.id]}
                onConnect={() => mcpStore.connectServer(config.id, {}, {})}
                onDisconnect={() => mcpStore.disconnectServer(config.id)}
                onRemove={() => mcpStore.removeServer(config.id)}
                onConfigure={() => setMcpDetailServerId(config.id)}
              />
            ))}
          </div>

          <button
            onClick={() => setMcpAddModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', marginTop: '16px', padding: '14px',
              background: 'rgba(0,245,255,0.04)', border: '1px dashed rgba(0,245,255,0.2)',
              borderRadius: '12px', color: '#00F5FF', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Plug size={14} /> Add MCP Server
          </button>

          <McpAddServerModal
            open={mcpAddModalOpen}
            onClose={() => setMcpAddModalOpen(false)}
            onAddPreset={(presetId, creds) => mcpStore.addServerFromPreset(presetId, creds)}
            onAddCustom={(config) => mcpStore.addCustomServer(config)}
          />

          {mcpDetailConfig && (
            <McpServerDetail
              config={mcpDetailConfig}
              tools={mcpStore.serverTools[mcpDetailServerId!] || []}
              resources={mcpStore.serverResources[mcpDetailServerId!] || []}
              onToggleTool={(toolName, enabled) => mcpStore.toggleTool(mcpDetailServerId!, toolName, enabled)}
              onUpdateConfig={(updates) => mcpStore.updateServer(mcpDetailServerId!, updates)}
              onClose={() => setMcpDetailServerId(null)}
            />
          )}
        </div>
      ) : null}

      {/* ───── Connection cards (hidden when MCP tab active) ───── */}
      {activeTab !== 'mcp' && (
        <>
          {(viewMode as string) === 'grid' ? (
            Object.entries(grouped)
              .sort(([a], [b]) => (CATEGORY_META[a as IntegrationCategory]?.order ?? 99) - (CATEGORY_META[b as IntegrationCategory]?.order ?? 99))
              .map(([cat, conns]) => (
                <div key={cat} className="ih2-group">
                  <div className="ih2-group-header">
                    <span className="ih2-group-label">{CATEGORY_META[cat as IntegrationCategory]?.label ?? cat}</span>
                    <Badge size="sm" color="var(--text-muted)">{conns.length}</Badge>
                  </div>
                  <div className={(viewMode as string) === 'grid' ? 'ih2-grid' : 'ih2-list'}>
                    {conns.map((conn) => (
                      <ConnectionCard
                        key={conn.provider}
                        conn={conn}
                        expanded={expandedProvider === conn.provider}
                        onExpand={() => setExpandedProvider(expandedProvider === conn.provider ? null : conn.provider)}
                        onConnect={() => handleConnect(conn.provider)}
                        onDisconnect={() => handleDisconnect(conn.provider)}
                        onTest={() => handleTest(conn.provider)}
                        onFavorite={() => toggleFavorite(conn.provider)}
                        onOpenDetail={() => openDetail(conn.provider)}
                        testing={testMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className={(viewMode as string) === 'grid' ? 'ih2-grid' : 'ih2-list'}>
              {filtered.map((conn) => (
                <ConnectionCard
                  key={conn.provider}
                  conn={conn}
                  expanded={expandedProvider === conn.provider}
                  onExpand={() => setExpandedProvider(expandedProvider === conn.provider ? null : conn.provider)}
                  onConnect={() => handleConnect(conn.provider)}
                  onDisconnect={() => handleDisconnect(conn.provider)}
                  onTest={() => handleTest(conn.provider)}
                  onFavorite={() => toggleFavorite(conn.provider)}
                  onOpenDetail={() => openDetail(conn.provider)}
                  testing={testMutation.isPending}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="ih2-empty">No integrations match your filters.</div>
          )}
        </>
      )}

      {/* ───── Detail slide-out panel ───── */}
      {detailPanel && store.connections[detailPanel] && (
        <ConnectionDetailPanel conn={store.connections[detailPanel]} onClose={closeDetail} />
      )}

      <style>{`
        .ih2 { display:flex; flex-direction:column; gap:var(--space-sm); }

        /* Health bar */
        .ih2-health {
          display:flex; align-items:center; gap:var(--space-md); padding:8px var(--space-md);
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm);
          font-size:var(--text-xs);
        }
        .ih2-health-item { display:flex; align-items:center; gap:4px; color:var(--text-secondary); }
        .ih2-health-total { margin-left:auto; color:var(--text-muted); }

        /* Toolbar */
        .ih2-toolbar { display:flex; flex-direction:column; gap:var(--space-sm); }
        .ih2-tabs { display:flex; gap:2px; overflow-x:auto; padding-bottom:2px; }
        .ih2-tab {
          padding:5px 10px; border-radius:var(--radius-sm); font-size:var(--text-xs);
          color:var(--text-muted); white-space:nowrap; display:flex; align-items:center; gap:4px;
          transition:all var(--transition-fast);
        }
        .ih2-tab:hover { color:var(--text-secondary); background:var(--bg-hover); }
        .ih2-tab.active { color:var(--cyan); background:rgba(0,240,255,0.06); }
        .ih2-tab-count { font-family:var(--font-mono); font-size:10px; opacity:0.6; }

        .ih2-controls { display:flex; gap:var(--space-xs); align-items:center; flex-wrap:wrap; }

        .ih2-search {
          display:flex; align-items:center; gap:4px; flex:1; min-width:160px;
          padding:4px 8px; background:var(--bg-input); border:1px solid var(--border);
          border-radius:var(--radius-sm); color:var(--text-secondary);
        }
        .ih2-search-input {
          flex:1; background:none; border:none; outline:none; color:var(--text-primary);
          font-size:var(--text-xs);
        }
        .ih2-search-clear { color:var(--text-muted); }

        .ih2-select {
          padding:4px 8px; background:var(--bg-input); border:1px solid var(--border);
          border-radius:var(--radius-sm); color:var(--text-secondary); font-size:var(--text-xs);
        }

        .ih2-view-toggle { display:flex; gap:1px; background:var(--border); border-radius:var(--radius-sm); overflow:hidden; }
        .ih2-vbtn { padding:4px 6px; background:var(--bg-input); color:var(--text-muted); }
        .ih2-vbtn.active { color:var(--cyan); background:rgba(0,240,255,0.06); }

        /* Groups */
        .ih2-group { margin-top:var(--space-xs); }
        .ih2-group-header {
          display:flex; align-items:center; gap:var(--space-sm); padding:4px 0;
          font-size:var(--text-xs); font-weight:600; color:var(--text-muted);
          text-transform:uppercase; letter-spacing:0.04em;
        }

        /* Cards layout */
        .ih2-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:var(--space-sm); }
        .ih2-list { display:flex; flex-direction:column; gap:4px; }

        /* Card */
        .ih2-card {
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md);
          overflow:hidden; transition:border-color var(--transition-fast);
        }
        .ih2-card:hover { border-color:var(--border-active); }
        .ih2-card.active { border-color:rgba(34,197,94,0.2); }
        .ih2-card.degraded { border-color:rgba(245,158,11,0.2); }
        .ih2-card.error { border-color:rgba(239,68,68,0.2); }

        .ih2-card-main { display:flex; align-items:center; gap:var(--space-sm); padding:10px var(--space-md); }

        .ih2-card-icon {
          width:32px; height:32px; border-radius:var(--radius-sm);
          display:flex; align-items:center; justify-content:center;
          background:var(--bg-elevated); color:var(--text-secondary); flex-shrink:0;
        }
        .ih2-card.active .ih2-card-icon { color:var(--cyan); }

        .ih2-card-info { flex:1; min-width:0; }
        .ih2-card-name { display:flex; align-items:center; gap:4px; font-weight:600; font-size:var(--text-sm); }
        .ih2-card-desc { font-size:10px; color:var(--text-muted); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ih2-card-meta { display:flex; align-items:center; gap:6px; margin-top:3px; font-size:10px; color:var(--text-muted); }
        .ih2-card-meta-item { display:flex; align-items:center; gap:2px; }

        .ih2-card-actions { display:flex; align-items:center; gap:2px; flex-shrink:0; }
        .ih2-card-actions > button { padding:4px; border-radius:4px; color:var(--text-muted); }
        .ih2-card-actions > button:hover { color:var(--text-primary); background:var(--bg-elevated); }

        /* Provenance row */
        .ih2-provenance {
          display:flex; align-items:center; gap:4px; padding:4px var(--space-md);
          font-size:10px; color:var(--text-muted); border-top:1px solid var(--border);
          background:rgba(0,0,0,0.1);
        }
        .ih2-provenance-source { font-family:var(--font-mono); color:var(--text-secondary); }

        /* Expanded panel */
        .ih2-expanded {
          padding:var(--space-sm) var(--space-md) var(--space-md);
          border-top:1px solid var(--border); display:flex; flex-direction:column; gap:8px;
        }
        .ih2-detail-row { display:flex; align-items:flex-start; gap:var(--space-sm); font-size:var(--text-xs); }
        .ih2-detail-label { font-weight:600; color:var(--text-muted); min-width:80px; flex-shrink:0; }
        .ih2-scopes { display:flex; flex-wrap:wrap; gap:3px; }
        .ih2-scope-chip {
          font-size:9px; padding:1px 5px; border-radius:3px;
          background:rgba(0,240,255,0.06); color:var(--cyan); border:1px solid rgba(0,240,255,0.12);
        }
        .ih2-consumers { display:flex; flex-wrap:wrap; gap:3px; }
        .ih2-consumer-chip {
          font-size:9px; padding:1px 5px; border-radius:3px;
          background:rgba(139,92,246,0.06); color:var(--purple); border:1px solid rgba(139,92,246,0.12);
        }

        .ih2-empty { padding:var(--space-2xl); text-align:center; color:var(--text-muted); font-size:var(--text-sm); }

        /* Detail panel overlay */
        .ih2-detail-overlay {
          position:fixed; inset:0; z-index:900; display:flex; justify-content:flex-end;
          background:rgba(2,4,8,0.6); backdrop-filter:blur(4px);
        }
        .ih2-detail-panel {
          width:420px; max-width:90vw; height:100%; background:var(--bg-surface);
          border-left:1px solid var(--border); overflow-y:auto;
          box-shadow:-8px 0 32px rgba(0,0,0,0.3);
        }
        .ih2-dp-header {
          display:flex; align-items:center; gap:var(--space-sm); padding:var(--space-md);
          border-bottom:1px solid var(--border); position:sticky; top:0;
          background:var(--bg-surface); z-index:1;
        }
        .ih2-dp-body { padding:var(--space-md); display:flex; flex-direction:column; gap:var(--space-md); }
        .ih2-dp-section { }
        .ih2-dp-section-title {
          font-size:var(--text-xs); font-weight:600; color:var(--text-muted);
          text-transform:uppercase; letter-spacing:0.04em; margin-bottom:var(--space-xs);
        }
        .ih2-dp-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:6px 0; font-size:var(--text-xs); border-bottom:1px solid rgba(255,255,255,0.03);
        }
        .ih2-dp-label { color:var(--text-muted); }
        .ih2-dp-value { color:var(--text-primary); font-family:var(--font-mono); text-align:right; max-width:60%; overflow:hidden; text-overflow:ellipsis; }

        .ih2-state-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionCard — single integration card
// ---------------------------------------------------------------------------
function ConnectionCard({ conn, expanded, onExpand, onConnect, onDisconnect, onTest, onFavorite, onOpenDetail, testing }: {
  conn: EnrichedConnection;
  expanded: boolean;
  onExpand: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
  onFavorite: () => void;
  onOpenDetail: () => void;
  testing: boolean;
}) {
  const Icon = ICONS[conn.provider] || Cloud;
  const stateColor = FLOW_STATE_COLORS[conn.flowState];
  const isOAuth = conn.configuredVia === 'settings' || Object.keys(OAUTH_PROVIDERS).includes(conn.provider);

  return (
    <div className={cn('ih2-card', conn.connected && 'active', conn.flowState === 'degraded' && 'degraded', (conn.flowState === 'error' || conn.flowState === 'expired') && 'error')}>
      <div className="ih2-card-main">
        <div className="ih2-card-icon"><Icon size={16} /></div>
        <div className="ih2-card-info">
          <div className="ih2-card-name">
            <div className="ih2-state-dot" style={{ background: stateColor }} />
            {conn.name}
            {conn.favorite && <Star size={11} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />}
          </div>
          <div className="ih2-card-desc">{conn.description}</div>
          <div className="ih2-card-meta">
            {conn.userName && <span className="ih2-card-meta-item">{conn.userName}</span>}
            {conn.lastTestResult && (
              <span className="ih2-card-meta-item">
                <Activity size={9} />
                {conn.lastTestResult.latencyMs}ms
              </span>
            )}
            {conn.expiresAt && (
              <span className="ih2-card-meta-item">
                <Clock size={9} />
                {timeAgo(conn.expiresAt)}
              </span>
            )}
            <span className="ih2-card-meta-item" style={{ opacity: 0.6 }}>
              {conn.consumers.length} consumer{conn.consumers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="ih2-card-actions">
          {isOAuth && conn.connected && (
            <>
              <button onClick={onTest} title="Test connection" disabled={testing}><RefreshCw size={13} /></button>
              <button onClick={onDisconnect} title="Disconnect"><Unlink size={13} /></button>
            </>
          )}
          {isOAuth && !conn.connected && (
            <Button variant="primary" size="sm" onClick={onConnect} icon={<Link size={12} />}>Connect</Button>
          )}
          <button onClick={onFavorite} title="Toggle favorite">
            {conn.favorite ? <Star size={13} style={{ color: 'var(--gold)' }} /> : <StarOff size={13} />}
          </button>
          <button onClick={onOpenDetail} title="View details"><Eye size={13} /></button>
          <button onClick={onExpand}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Provenance row — always visible */}
      <div className="ih2-provenance">
        {conn.tokenSource === 'oauth' ? <Shield size={10} style={{ color: 'var(--success)' }} /> : <Database size={10} />}
        <span className="ih2-provenance-source">{conn.tokenSourceLabel}</span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="ih2-expanded">
          {conn.scopes.length > 0 && (
            <div className="ih2-detail-row">
              <span className="ih2-detail-label">Scopes</span>
              <div className="ih2-scopes">
                {conn.scopes.map((s) => (
                  <span key={s} className="ih2-scope-chip">{s.replace(/https:\/\/www\.googleapis\.com\/auth\//, '')}</span>
                ))}
              </div>
            </div>
          )}
          <div className="ih2-detail-row">
            <span className="ih2-detail-label">Used by</span>
            <div className="ih2-consumers">
              {conn.consumers.map((c) => (
                <span key={c} className="ih2-consumer-chip">{c}</span>
              ))}
            </div>
          </div>
          {conn.flowState !== 'disconnected' && (
            <div className="ih2-detail-row">
              <span className="ih2-detail-label">State</span>
              <Badge color={stateColor} size="sm">{conn.flowState}</Badge>
            </div>
          )}
          {conn.docsUrl && (
            <div className="ih2-detail-row">
              <span className="ih2-detail-label">Docs</span>
              <a href={conn.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {conn.docsUrl.replace('https://', '')} <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionDetailPanel — full-depth slide-out
// ---------------------------------------------------------------------------
function ConnectionDetailPanel({ conn, onClose }: { conn: EnrichedConnection; onClose: () => void }) {
  const Icon = ICONS[conn.provider] || Cloud;
  const stateColor = FLOW_STATE_COLORS[conn.flowState];

  return (
    <div className="ih2-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ih2-detail-panel">
        <div className="ih2-dp-header">
          <div className="ih2-card-icon"><Icon size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{conn.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{conn.description}</div>
          </div>
          <button onClick={onClose} style={{ padding: 4, color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="ih2-dp-body">
          {/* Connection State */}
          <div className="ih2-dp-section">
            <div className="ih2-dp-section-title">Connection State</div>
            <div className="ih2-dp-row">
              <span className="ih2-dp-label">Status</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="ih2-state-dot" style={{ background: stateColor }} />
                <Badge color={stateColor} size="sm">{conn.flowState}</Badge>
              </span>
            </div>
            <div className="ih2-dp-row">
              <span className="ih2-dp-label">Source</span>
              <span className="ih2-dp-value">{conn.tokenSource}</span>
            </div>
            <div className="ih2-dp-row">
              <span className="ih2-dp-label">Provenance</span>
              <span className="ih2-dp-value">{conn.tokenSourceLabel}</span>
            </div>
            <div className="ih2-dp-row">
              <span className="ih2-dp-label">Configured via</span>
              <span className="ih2-dp-value">{conn.configuredVia}</span>
            </div>
            {conn.refreshable && (
              <div className="ih2-dp-row">
                <span className="ih2-dp-label">Refreshable</span>
                <span className="ih2-dp-value" style={{ color: 'var(--success)' }}>Yes (auto-refresh)</span>
              </div>
            )}
          </div>

          {/* Identity */}
          {conn.userName && (
            <div className="ih2-dp-section">
              <div className="ih2-dp-section-title">Identity</div>
              <div className="ih2-dp-row">
                <span className="ih2-dp-label">User</span>
                <span className="ih2-dp-value">{conn.userName}</span>
              </div>
              {conn.providerId && (
                <div className="ih2-dp-row">
                  <span className="ih2-dp-label">Provider ID</span>
                  <span className="ih2-dp-value">{conn.providerId}</span>
                </div>
              )}
            </div>
          )}

          {/* Lifecycle */}
          <div className="ih2-dp-section">
            <div className="ih2-dp-section-title">Lifecycle</div>
            {conn.connectedAt && (
              <div className="ih2-dp-row">
                <span className="ih2-dp-label">Connected</span>
                <span className="ih2-dp-value">{timeAgo(conn.connectedAt)}</span>
              </div>
            )}
            {conn.expiresAt && (
              <div className="ih2-dp-row">
                <span className="ih2-dp-label">Expires</span>
                <span className="ih2-dp-value">{new Date(conn.expiresAt).toLocaleString()}</span>
              </div>
            )}
            {conn.lastTestResult && (
              <>
                <div className="ih2-dp-row">
                  <span className="ih2-dp-label">Last test</span>
                  <span className="ih2-dp-value">{timeAgo(conn.lastTestResult.testedAt)}</span>
                </div>
                <div className="ih2-dp-row">
                  <span className="ih2-dp-label">Latency</span>
                  <span className="ih2-dp-value">{conn.lastTestResult.latencyMs}ms</span>
                </div>
              </>
            )}
            <div className="ih2-dp-row">
              <span className="ih2-dp-label">Failures</span>
              <span className="ih2-dp-value" style={{ color: conn.consecutiveFailures > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                {conn.consecutiveFailures}
              </span>
            </div>
          </div>

          {/* Scopes */}
          {conn.scopes.length > 0 && (
            <div className="ih2-dp-section">
              <div className="ih2-dp-section-title">Permissions ({conn.scopes.length} scopes)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {conn.scopes.map((s) => (
                  <span key={s} className="ih2-scope-chip">{s.replace(/https:\/\/www\.googleapis\.com\/auth\//, '')}</span>
                ))}
              </div>
            </div>
          )}

          {/* Consumers */}
          <div className="ih2-dp-section">
            <div className="ih2-dp-section-title">Consumers ({conn.consumers.length})</div>
            {conn.consumers.map((c) => (
              <div key={c} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: '3px 0' }}>
                {c}
              </div>
            ))}
          </div>

          {/* Docs link */}
          {conn.docsUrl && (
            <a
              href={conn.docsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px var(--space-sm)', borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,240,255,0.04)', color: 'var(--cyan)',
                fontSize: 'var(--text-xs)', textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              Open documentation
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
