import { useState } from 'react';
import {
  GitBranch, Cloud, Globe, Database, Shield, Mic, Volume2,
  Radio, Zap, CheckCircle2, XCircle, Link, Unlink, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, Server,
} from 'lucide-react';
import { Button, Badge } from './ui';
import { cn } from '../lib/utils';
import { useOAuthStatus, useOAuthConnect, useOAuthDisconnect, useOAuthTest } from '../hooks/use-oauth';
import { OAUTH_PROVIDERS, API_KEY_SERVICES, type OAuthProvider } from '../lib/types/oauth';

// ---------------------------------------------------------------------------
// Provider icon mapping
// ---------------------------------------------------------------------------

const PROVIDER_ICONS: Record<string, typeof Cloud> = {
  github: GitBranch,
  google: Globe,
  notion: Database,
  cloudflare: Cloud,
  // API key services
  'Claude API': Zap,
  'Deepgram': Mic,
  'ElevenLabs': Volume2,
  'Google AI': Zap,
  'Google Maps': Globe,
  'Vercel': Radio,
  'n8n': Server,
  'Supabase': Database,
  'Clerk': Shield,
};

// ---------------------------------------------------------------------------
// IntegrationsHub Component
// ---------------------------------------------------------------------------

export default function IntegrationsHub() {
  const { data, isLoading } = useOAuthStatus();
  const connectMutation = useOAuthConnect();
  const disconnectMutation = useOAuthDisconnect();
  const testMutation = useOAuthTest();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; error?: string }>>({});

  const connections = data?.connections ?? [];
  const health = data?.health ?? {};

  function getConnection(provider: string) {
    return connections.find((c) => c.provider === provider);
  }

  async function handleTest(provider: string) {
    const result = await testMutation.mutateAsync(provider);
    setTestResults((prev) => ({
      ...prev,
      [provider]: { success: result.success, latency: result.latency, error: result.error },
    }));
  }

  if (isLoading) {
    return <div className="ih-loading">Loading integrations...</div>;
  }

  return (
    <div className="ih-container">
      {/* OAuth Providers */}
      <div className="ih-section">
        <h4 className="ih-section-title">Connected Accounts</h4>
        <p className="ih-section-desc">Connect your accounts for personalized access. Tokens are encrypted and stored per-user.</p>
        <div className="ih-grid">
          {Object.values(OAUTH_PROVIDERS).map((config) => {
            const conn = getConnection(config.provider);
            const Icon = PROVIDER_ICONS[config.provider] || Cloud;
            const isExpanded = expandedProvider === config.provider;
            const test = testResults[config.provider];

            return (
              <div key={config.provider} className={cn('ih-card', conn?.connected && 'connected')}>
                <div className="ih-card-main">
                  <div className="ih-card-icon"><Icon size={18} /></div>
                  <div className="ih-card-info">
                    <div className="ih-card-name">
                      {config.name}
                      {conn?.connected && <Badge variant="success" size="sm">Connected</Badge>}
                    </div>
                    <div className="ih-card-desc">{config.description}</div>
                    {conn?.connected && conn.userName && (
                      <div className="ih-card-user">Signed in as <strong>{conn.userName}</strong></div>
                    )}
                  </div>
                  <div className="ih-card-actions">
                    {conn?.connected ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(config.provider)}
                          disabled={testMutation.isPending}
                          icon={<RefreshCw size={12} />}
                        >
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectMutation.mutate(config.provider)}
                          disabled={disconnectMutation.isPending}
                          icon={<Unlink size={12} />}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => connectMutation.mutate(config.provider)}
                        disabled={connectMutation.isPending}
                        icon={<Link size={12} />}
                      >
                        Connect
                      </Button>
                    )}
                    <button
                      className="ih-expand-btn"
                      onClick={() => setExpandedProvider(isExpanded ? null : config.provider)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Test result */}
                {test && (
                  <div className={cn('ih-test-result', test.success ? 'success' : 'error')}>
                    {test.success
                      ? `Connection verified (${test.latency}ms)`
                      : `Test failed: ${test.error}`}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="ih-card-details">
                    <div className="ih-detail-row">
                      <span className="ih-detail-label">Scopes</span>
                      <div className="ih-scopes">
                        {(conn?.scopes || config.scopes).map((s) => (
                          <span key={s} className="ih-scope-chip">{s.replace(/https:\/\/www\.googleapis\.com\/auth\//, '')}</span>
                        ))}
                      </div>
                    </div>
                    {conn?.status && (
                      <div className="ih-detail-row">
                        <span className="ih-detail-label">Status</span>
                        <Badge variant={conn.status === 'active' ? 'success' : 'warning'} size="sm">{conn.status}</Badge>
                      </div>
                    )}
                    {conn?.expiresAt && (
                      <div className="ih-detail-row">
                        <span className="ih-detail-label">Token expires</span>
                        <span>{new Date(conn.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* API Key Services */}
      <div className="ih-section">
        <h4 className="ih-section-title">API Key Services</h4>
        <p className="ih-section-desc">Configured via Vercel environment variables.</p>
        <div className="ih-apikeys">
          {API_KEY_SERVICES.map((svc) => {
            const configured = health[svc.envKey];
            const Icon = PROVIDER_ICONS[svc.name] || Zap;
            return (
              <div key={svc.envKey} className={cn('ih-apikey', configured && 'configured')}>
                <Icon size={14} />
                <span className="ih-apikey-name">{svc.name}</span>
                <span className="ih-apikey-desc">{svc.description}</span>
                {configured
                  ? <CheckCircle2 size={13} className="ih-apikey-ok" />
                  : <XCircle size={13} className="ih-apikey-off" />
                }
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .ih-container { display:flex; flex-direction:column; gap:var(--space-lg); }
        .ih-loading { padding:var(--space-2xl); text-align:center; color:var(--text-muted); }

        .ih-section-title { font-size:var(--text-base); font-weight:700; margin:0 0 4px; color:var(--text-primary); }
        .ih-section-desc { font-size:var(--text-xs); color:var(--text-muted); margin:0 0 var(--space-md); }

        .ih-grid { display:flex; flex-direction:column; gap:var(--space-sm); }

        .ih-card {
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md);
          overflow:hidden; transition:border-color var(--transition-fast);
        }
        .ih-card.connected { border-color:rgba(34,197,94,0.2); }
        .ih-card:hover { border-color:var(--border-active); }

        .ih-card-main { display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md); }

        .ih-card-icon {
          width:36px; height:36px; border-radius:var(--radius-sm);
          display:flex; align-items:center; justify-content:center;
          background:var(--bg-elevated); color:var(--text-secondary); flex-shrink:0;
        }
        .ih-card.connected .ih-card-icon { color:var(--cyan); }

        .ih-card-info { flex:1; min-width:0; }
        .ih-card-name { display:flex; align-items:center; gap:6px; font-weight:600; font-size:var(--text-sm); }
        .ih-card-desc { font-size:var(--text-xs); color:var(--text-muted); margin-top:1px; }
        .ih-card-user { font-size:10px; color:var(--text-secondary); margin-top:2px; }

        .ih-card-actions { display:flex; align-items:center; gap:4px; flex-shrink:0; }

        .ih-expand-btn { padding:4px; color:var(--text-muted); border-radius:4px; }
        .ih-expand-btn:hover { color:var(--text-primary); background:var(--bg-elevated); }

        .ih-test-result {
          padding:4px var(--space-md); font-size:10px; border-top:1px solid var(--border);
        }
        .ih-test-result.success { color:rgb(34,197,94); background:rgba(34,197,94,0.04); }
        .ih-test-result.error { color:rgb(239,68,68); background:rgba(239,68,68,0.04); }

        .ih-card-details {
          padding:var(--space-sm) var(--space-md) var(--space-md);
          border-top:1px solid var(--border); display:flex; flex-direction:column; gap:6px;
        }

        .ih-detail-row { display:flex; align-items:flex-start; gap:var(--space-sm); font-size:var(--text-xs); }
        .ih-detail-label { font-weight:600; color:var(--text-muted); min-width:80px; flex-shrink:0; }

        .ih-scopes { display:flex; flex-wrap:wrap; gap:3px; }
        .ih-scope-chip {
          font-size:9px; padding:1px 5px; border-radius:3px;
          background:rgba(0,240,255,0.06); color:var(--cyan); border:1px solid rgba(0,240,255,0.12);
        }

        /* API Key Services */
        .ih-apikeys { display:flex; flex-direction:column; gap:4px; }

        .ih-apikey {
          display:flex; align-items:center; gap:var(--space-sm); padding:6px 10px;
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm);
          font-size:var(--text-xs); color:var(--text-muted);
        }
        .ih-apikey.configured { color:var(--text-secondary); }

        .ih-apikey-name { font-weight:600; color:var(--text-primary); min-width:90px; }
        .ih-apikey-desc { flex:1; }
        .ih-apikey-ok { color:rgb(34,197,94); flex-shrink:0; }
        .ih-apikey-off { color:var(--text-muted); flex-shrink:0; opacity:0.4; }
      `}</style>
    </div>
  );
}
