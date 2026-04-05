import { RefreshCw, CheckCircle, Database, Mail, Phone, Calendar, Hash, Radio } from 'lucide-react';
import { GlassCard, Badge, Button } from '../ui';
import { useCommsSync } from '../../hooks/use-comms-sync';

// ---------------------------------------------------------------------------
// Comms Sync Status Widget — shows ingestion pipeline health
// Placed in the CommsHub Status tab
// ---------------------------------------------------------------------------

export default function CommsSyncStatus() {
  const { lastSync, lastResult, syncing, triggerSync } = useCommsSync();

  const lastSyncTime = lastSync
    ? new Date(lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'Never';

  const totalSynced = lastResult?.total || 0;
  const syncDetails = lastResult?.synced || {};

  const syncCategories = [
    { key: 'sync-emails', label: 'Emails', icon: Mail, color: '#EA4335' },
    { key: 'sync-calls', label: 'Calls', icon: Phone, color: '#F22F46' },
    { key: 'sync-calendar', label: 'Calendar', icon: Calendar, color: '#4285F4' },
    { key: 'sync-messaging', label: 'Messaging', icon: Hash, color: '#4A154B' },
    { key: 'sync-social', label: 'Social', icon: Radio, color: '#1DA1F2' },
  ];

  return (
    <GlassCard className="sync-status-card">
      <div className="sync-status-header">
        <Database size={14} style={{ color: 'var(--cyan)' }} />
        <span className="sync-status-title">Data Ingestion Pipeline</span>
        <Badge size="sm" variant={syncing ? 'dot' : 'default'}>
          {syncing ? 'Syncing...' : 'Active'}
        </Badge>
      </div>

      <div className="sync-status-meta">
        <span className="sync-meta-item">
          <CheckCircle size={10} style={{ color: 'var(--success)' }} />
          Last sync: {lastSyncTime}
        </span>
        <span className="sync-meta-item">
          <Database size={10} />
          {totalSynced} items ingested
        </span>
      </div>

      {/* Per-action breakdown */}
      <div className="sync-status-grid">
        {syncCategories.map((cat) => {
          const data = (syncDetails as Record<string, unknown>)[cat.key] as Record<string, number> | undefined;
          const count = data ? Object.values(data).reduce((s, n) => s + n, 0) : 0;
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="sync-status-item">
              <Icon size={12} style={{ color: cat.color }} />
              <span className="sync-item-label">{cat.label}</span>
              <span className="sync-item-count">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Breakdown by target */}
      {totalSynced > 0 && (
        <div className="sync-status-targets">
          <span className="sync-target-label">Routed to:</span>
          {Object.entries(syncDetails).map(([action, data]) => {
            if (typeof data !== 'object') return null;
            return Object.entries(data as Record<string, number>).map(([target, count]) => (
              count > 0 ? (
                <Badge key={`${action}-${target}`} size="sm">{target}: {count}</Badge>
              ) : null
            ));
          })}
        </div>
      )}

      <div className="sync-status-actions">
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={12} className={syncing ? 'mcv-spin' : ''} />}
          onClick={triggerSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
        <span className="sync-interval-note">Auto-syncs every 5 minutes</span>
      </div>

      <style>{`
        .sync-status-card{padding:16px;display:flex;flex-direction:column;gap:12px}
        .sync-status-header{display:flex;align-items:center;gap:8px}
        .sync-status-title{font-size:13px;font-weight:600;flex:1}
        .sync-status-meta{display:flex;gap:16px;font-size:10px;color:var(--text-muted)}
        .sync-meta-item{display:flex;align-items:center;gap:4px}
        .sync-status-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
        .sync-status-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;background:var(--bg-input);border-radius:var(--radius-sm);border:1px solid var(--border)}
        .sync-item-label{font-size:9px;color:var(--text-muted);text-transform:uppercase}
        .sync-item-count{font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--text-primary)}
        .sync-status-targets{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
        .sync-target-label{font-size:10px;color:var(--text-muted)}
        .sync-status-actions{display:flex;align-items:center;gap:10px;padding-top:4px;border-top:1px solid var(--border)}
        .sync-interval-note{font-size:9px;color:var(--text-muted)}
        @media(max-width:640px){.sync-status-grid{grid-template-columns:repeat(3,1fr)}}
      `}</style>
    </GlassCard>
  );
}
