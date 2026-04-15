import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Shield, Lock, Upload, Download, Edit3, Trash2,
  Share2, Award, Package, Search, RefreshCw, User, Loader2,
  Activity, Clock,
} from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Badge, Tabs, EmptyState, Input, Button, Tooltip } from '../components/ui';
import { Download } from 'lucide-react';
import { useAuditLog } from '../hooks/use-storage-meta';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import { staggerContainer, fadeInUp } from '../lib/animations';

const ACTION_ICONS: Record<string, typeof FileText> = {
  create: Upload, upload: Upload, read: FileText, download: Download,
  edit: Edit3, update: Edit3, delete: Trash2, share: Share2,
  lock: Lock, unlock: Lock, nft_certify: Award, legal_hold: Shield,
  legal_hold_release: Shield, rag_index: Package, rag_query: Search,
  compartment_add: Package, compartment_remove: Package, version_create: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  create: '#10B981', upload: '#10B981', read: 'var(--text-muted)',
  download: 'var(--cyan)', edit: '#F59E0B', update: '#F59E0B',
  delete: '#ef4444', share: 'var(--cyan)', lock: 'var(--warning)',
  unlock: '#10B981', nft_certify: '#F59E0B', legal_hold: '#ef4444',
  legal_hold_release: '#10B981', rag_index: 'var(--purple)',
  rag_query: 'var(--purple)', compartment_add: 'var(--cyan)',
  compartment_remove: 'var(--text-muted)', version_create: 'var(--cyan)',
};

export default function AuditLogView() {
  const { activeVenture, mode } = useNavigation();
  const [actionFilter, setActionFilter] = useState<string>('');
  const [ventureFilter, setVentureFilter] = useState(mode === 'venture' ? activeVenture || '' : '');
  const [searchUser, setSearchUser] = useState('');

  const auditLog = useAuditLog({
    ventureId: ventureFilter || undefined,
    action: actionFilter || undefined,
    userId: searchUser || undefined,
    limit: 100,
  });

  const entries = auditLog.data?.entries || [];

  const actionCounts = entries.reduce<Record<string, number>>((acc, e) => {
    const a = String((e as Record<string, unknown>).action || 'unknown');
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});

  const uniqueUsers = new Set(entries.map(e => String((e as Record<string, unknown>).user_id))).size;
  const uniqueFiles = new Set(entries.filter(e => (e as Record<string, unknown>).file_id).map(e => String((e as Record<string, unknown>).file_id))).size;
  const criticalActions = entries.filter(e => {
    const a = String((e as Record<string, unknown>).action);
    return ['delete', 'legal_hold', 'nft_certify'].includes(a);
  }).length;

  // Group by date
  const grouped = entries.reduce<Record<string, Array<Record<string, unknown>>>>((acc, e) => {
    const ts = (e as Record<string, unknown>).timestamp || (e as Record<string, unknown>).created_at;
    const date = ts ? new Date(String(ts)).toLocaleDateString() : 'Unknown';
    (acc[date] ??= []).push(e as Record<string, unknown>);
    return acc;
  }, {});

  const ACTION_OPTIONS = ['', 'create', 'read', 'download', 'edit', 'delete', 'share', 'lock', 'legal_hold', 'nft_certify', 'rag_index', 'rag_query', 'compartment_add', 'version_create'];

  return (
    <PageShell>
      <PageHeader title="Audit Log" icon={<Shield size={20} />} loading={auditLog.isLoading} onRefresh={() => auditLog.refetch()}>
        <Tooltip content="Download filtered entries as CSV (compliance-ready)">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={13} />}
            disabled={entries.length === 0}
            onClick={() => {
              const headers = ['"Timestamp","Action","User","File ID","Venture","Details"'];
              const rows = entries.map((e) => {
                const r = e as Record<string, unknown>;
                const ts = (r.timestamp as string) || (r.created_at as string) || '';
                const details = r.details ? JSON.stringify(r.details) : '';
                return [ts, String(r.action || ''), String(r.user_id || ''), String(r.file_id || ''), String(r.venture_id || ''), details]
                  .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                  .join(',');
              });
              const csv = [...headers, ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const stamp = new Date().toISOString().slice(0, 10);
              const v = ventureFilter ? `-${ventureFilter}` : '';
              const act = actionFilter ? `-${actionFilter}` : '';
              a.download = `audit-log${v}${act}-${stamp}.csv`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </Button>
        </Tooltip>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<Activity size={16} />} title="Total Events" value={String(entries.length)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<User size={16} />} title="Unique Users" value={String(uniqueUsers)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<FileText size={16} />} title="Files Touched" value={String(uniqueFiles)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Shield size={16} />} title="Critical Actions" value={String(criticalActions)} /></motion.div>
        </GridLayout>
      </motion.div>

      {/* Filters */}
      <GlassCard style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Action</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a || 'All actions'}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Venture</label>
            <select value={ventureFilter} onChange={(e) => setVentureFilter(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              <option value="">All ventures</option>
              {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>User ID</label>
            <Input placeholder="Filter by user" value={searchUser} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUser(e.target.value)} />
          </div>
        </div>
      </GlassCard>

      {/* Action breakdown */}
      {Object.keys(actionCounts).length > 0 && (
        <GlassCard style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>Action Breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(actionCounts).sort(([, a], [, b]) => b - a).map(([action, count]) => (
              <Badge key={action} color={ACTION_COLORS[action] || 'var(--text-muted)'}>{action}: {count}</Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Timeline */}
      <div style={{ padding: '16px 0' }}>
        <GlassCard>
          {auditLog.isLoading ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="mcv-spin" /> Loading audit entries...
            </div>
          ) : entries.length === 0 ? (
            <EmptyState icon={<Shield size={32} />} title="No audit entries" description="Storage operations will appear here as they occur." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(grouped).map(([date, dayEntries]) => (
                <div key={date}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={11} /> {date} · {dayEntries.length} events
                  </div>
                  {dayEntries.map((e, i) => {
                    const action = String(e.action || 'unknown');
                    const Icon = ACTION_ICONS[action] || Activity;
                    const color = ACTION_COLORS[action] || 'var(--text-muted)';
                    const ts = e.timestamp || e.created_at;
                    const details = e.details as Record<string, unknown> | undefined;
                    return (
                      <div key={String(e.id) || i} style={{ display: 'grid', gridTemplateColumns: '80px 120px 1fr 1fr 100px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 12, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ts ? new Date(String(ts)).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={12} style={{ color }} />
                          <span style={{ color, fontSize: 12, textTransform: 'capitalize' }}>{action.replace(/_/g, ' ')}</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.file_id ? String(e.file_id).slice(0, 20) : '—'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {details ? JSON.stringify(details).slice(0, 60) : ''}
                        </span>
                        {Boolean(e.venture_id) && <Badge>{String(e.venture_id)}</Badge>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
