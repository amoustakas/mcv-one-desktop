import { useEffect, useState } from 'react';
import { Globe, Plus, Trash2, Check, Clock, AlertTriangle, ExternalLink, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassCard, Button, Input, Badge, EmptyState } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture, VentureCustomDomain } from '../../lib/ventures';
import { computeRequiredDnsRecords } from '../../lib/ventures/white-label';

const PROJECT_CNAME = 'cname.vercel-dns.com';

const STATUS_COLOR: Record<string, string> = {
  verified: '#10B981',
  pending: '#F59E0B',
  verifying: '#00F0FF',
  failed: '#EF4444',
};

const STATUS_ICON: Record<string, typeof Check> = {
  verified: Check,
  pending: Clock,
  verifying: Clock,
  failed: AlertTriangle,
};

export default function VentureDomainsPanel({ venture }: { venture: Venture }) {
  const [domains, setDomains] = useState<VentureCustomDomain[]>(venture.customDomains || []);
  const [loading, setLoading] = useState(true);
  const [newHost, setNewHost] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);

  function copyToClipboard(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
  }

  async function refresh() {
    try {
      const data = await apiPost<{ domains: VentureCustomDomain[] }>('/api/ventures', { action: 'list-domains', venture_id: venture.id });
      setDomains(data.domains || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [venture.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newHost.trim()) return;
    const normalized = newHost.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    setAdding(true);
    setError(null);
    try {
      const data = await apiPost<{ domains: VentureCustomDomain[] }>('/api/ventures', {
        action: 'add-domain',
        venture_id: venture.id,
        domain: { host: normalized, status: 'pending' },
      });
      setDomains(data.domains || []);
      setNewHost('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add domain');
    } finally {
      setAdding(false);
    }
  }

  async function removeDomain(host: string) {
    try {
      const data = await apiPost<{ domains: VentureCustomDomain[] }>('/api/ventures', {
        action: 'remove-domain',
        venture_id: venture.id,
        host,
      });
      setDomains(data.domains || []);
    } catch (e) {
      console.error('remove-domain failed', e);
    }
  }

  async function triggerVerify(host: string) {
    try {
      const data = await apiPost<{ domains: VentureCustomDomain[] }>('/api/ventures', {
        action: 'verify-domain',
        venture_id: venture.id,
        host,
        status: 'verifying',
      });
      setDomains(data.domains || []);
    } catch (e) {
      console.error('verify-domain failed', e);
    }
  }

  return (
    <div className="vdp-root">
      <GlassCard className="vdp-card vdp-add">
        <h4 className="vdp-subtitle">Add a custom domain</h4>
        <p className="vdp-desc">
          Link a domain to <strong>{venture.name}</strong>. Verified domains route through Vercel rewrites (Epic 7) and can be assigned to the Clerk organization for branded auth screens.
        </p>
        <form className="vdp-add-form" onSubmit={addDomain}>
          <Input
            value={newHost}
            onChange={(e) => setNewHost(e.target.value)}
            placeholder="e.g. app.betedge.ai"
            className="vdp-input"
            disabled={adding}
          />
          <Button type="submit" size="sm" icon={<Plus size={12} />} disabled={adding || !newHost.trim()}>
            {adding ? 'Adding…' : 'Add domain'}
          </Button>
        </form>
        {error && <div className="vdp-error">{error}</div>}
      </GlassCard>

      <GlassCard className="vdp-card">
        <div className="vdp-list-head">
          <h4 className="vdp-subtitle">Linked domains</h4>
          <span className="vdp-count">{domains.length}</span>
        </div>
        {loading ? (
          <div className="vdp-loading">Loading domains…</div>
        ) : domains.length === 0 ? (
          <EmptyState
            icon={<Globe size={16} />}
            title="No custom domains yet"
            description={`Primary domain ${venture.domain} is registered on the venture record. Add additional hosts above.`}
          />
        ) : (
          <ul className="vdp-list">
            {domains.map(d => {
              const status = d.status || 'pending';
              const Icon = STATUS_ICON[status] || Clock;
              const color = STATUS_COLOR[status] || 'var(--text-muted)';
              const isExpanded = expandedHost === d.host;
              const dnsRecords = computeRequiredDnsRecords(d.host, PROJECT_CNAME);
              return (
                <li key={d.host} className="vdp-item-wrap">
                  <div className="vdp-item">
                    <button
                      className="vdp-expand"
                      onClick={() => setExpandedHost(isExpanded ? null : d.host)}
                      aria-label={isExpanded ? 'Hide DNS' : 'Show DNS'}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <Globe size={13} className="vdp-item-icon" />
                    <a href={`https://${d.host}`} target="_blank" rel="noreferrer" className="vdp-item-host">
                      {d.host} <ExternalLink size={9} />
                    </a>
                    <Badge color={color} variant="outline">
                      <Icon size={10} style={{ marginRight: 4 }} /> {status}
                    </Badge>
                    <div className="vdp-item-actions">
                      {status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => triggerVerify(d.host)}>Verify</Button>
                      )}
                      <button className="vdp-icon-btn" onClick={() => removeDomain(d.host)} aria-label="Remove">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="vdp-dns">
                      <h5 className="vdp-dns-title">Required DNS records</h5>
                      <p className="vdp-dns-desc">
                        Create these records with your DNS provider. Once propagated (usually &lt;10 min),
                        click <strong>Verify</strong> to complete.
                      </p>
                      <table className="vdp-dns-table">
                        <thead>
                          <tr><th>Type</th><th>Name</th><th>Value</th><th>TTL</th><th></th></tr>
                        </thead>
                        <tbody>
                          {dnsRecords.map((r, i) => (
                            <tr key={i}>
                              <td><Badge color="#00F0FF">{r.type}</Badge></td>
                              <td><code>{r.name}</code></td>
                              <td><code className="vdp-dns-value">{r.value}</code></td>
                              <td>{r.ttl}</td>
                              <td>
                                <button className="vdp-icon-btn" onClick={() => copyToClipboard(r.value)} aria-label="Copy value">
                                  <Copy size={10} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <style>{`
        .vdp-root { display: flex; flex-direction: column; gap: 12px; }
        .vdp-card { padding: 16px; }
        .vdp-subtitle { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); }
        .vdp-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px; }
        .vdp-desc strong { color: var(--text-primary); }
        .vdp-add-form { display: flex; gap: 8px; align-items: center; }
        .vdp-input { flex: 1; }
        .vdp-error { margin-top: 10px; font-size: 11px; color: var(--error); padding: 6px 10px; background: rgba(239,68,68,0.08); border-radius: var(--radius-sm); }
        .vdp-list-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .vdp-count { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); }
        .vdp-loading { color: var(--text-muted); font-size: 12px; }
        .vdp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .vdp-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); transition: background 0.12s; }
        .vdp-item:hover { background: var(--bg-hover); }
        .vdp-item-icon { color: var(--text-secondary); flex-shrink: 0; }
        .vdp-item-host { flex: 1; font-size: 12px; color: var(--text-primary); font-family: var(--font-mono); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vdp-item-host:hover { color: var(--cyan); }
        .vdp-item-actions { display: flex; gap: 4px; align-items: center; }
        .vdp-icon-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); cursor: pointer; transition: all 0.12s; }
        .vdp-icon-btn:hover { color: var(--error); border-color: var(--error); }
      `}</style>
    </div>
  );
}
