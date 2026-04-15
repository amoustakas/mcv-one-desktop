// src/views/FabricEventsView.tsx
//
// Live view over the MCV Core Triangle Fabric audit stream. Shows the
// platform-level events emitted by this app — chat lifecycle, venture
// switches, NAOS sessions, kit install/uninstall, kit tool calls — as a
// complement to the existing storage-focused AuditLogView.tsx.
//
// Source: Fabric GET /audit via core.fabric.queryAudit(). Falls back to an
// empty state + clear "Fabric not configured" hint if the Triangle env vars
// are unset.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, RefreshCw, Loader2, Radio, AlertCircle,
  ArrowRight, MessageSquare, Package, Wrench, LogIn, Send,
} from 'lucide-react';
import {
  PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Badge,
  EmptyState, Input, Button,
} from '../components/ui';
import { useCoreTriangle, useCoreTriangleHealth } from '../hooks/use-core-triangle';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import { fadeInUp, staggerContainer } from '../lib/animations';
import type { AuditEntry } from '../lib/mcv-core/fabric';

// Event-type → icon mapping. Covers the 6 event families we emit today.
const EVENT_ICONS: Record<string, typeof Activity> = {
  'chat.sent': Send,
  'chat.completed': MessageSquare,
  'chat.failed': AlertCircle,
  'chat.message.user_sent': MessageSquare,
  'venture.switched': ArrowRight,
  'naos.session.opened': LogIn,
  'kit.installed': Package,
  'kit.uninstalled': Package,
  'kit.tool_call': Wrench,
};

const EVENT_COLORS: Record<string, string> = {
  'chat.sent': 'var(--cyan)',
  'chat.completed': '#10B981',
  'chat.failed': '#ef4444',
  'chat.message.user_sent': 'var(--cyan)',
  'venture.switched': 'var(--purple)',
  'naos.session.opened': 'var(--purple)',
  'kit.installed': '#10B981',
  'kit.uninstalled': '#F59E0B',
  'kit.tool_call': 'var(--cyan)',
};

function eventAction(e: AuditEntry): string {
  // Fabric audit stores the event identifier in `action`. Older rows may
  // carry the type in metadata.type instead (older emit path).
  return e.action || (e.metadata?.type as string | undefined) || 'unknown';
}

export default function FabricEventsView() {
  const core = useCoreTriangle();
  const health = useCoreTriangleHealth(60_000);
  const { mode, activeVenture } = useNavigation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [ventureFilter, setVentureFilter] = useState(mode === 'venture' ? activeVenture || '' : '');
  const [userSearch, setUserSearch] = useState('');

  const fabricOnline = health.fabric === 'online';
  const fabricConfigured = health.fabric !== 'unknown';

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await core.fabric.queryAudit({
        ventureId: ventureFilter || undefined,
        action: actionFilter || undefined,
        userId: userSearch || undefined,
        limit: 100,
      });
      if (res.ok) {
        setEntries(res.data.entries);
      } else {
        setError(res.error.message || 'Fabric audit query failed');
        setEntries([]);
      }
    } catch (e) {
      setError((e as Error).message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Load on mount + whenever filters change. Debounce the user text field so
  // every keystroke doesn't trigger a network roundtrip.
  useEffect(() => {
    if (!fabricConfigured) return;
    const t = setTimeout(() => { void load(); }, userSearch ? 300 : 0);
    return () => clearTimeout(t);
  }, [ventureFilter, actionFilter, userSearch, fabricConfigured]);

  // Aggregate stats
  const actionCounts = entries.reduce<Record<string, number>>((acc, e) => {
    const a = eventAction(e);
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});
  const uniqueUsers = new Set(entries.map(e => e.userId).filter(Boolean)).size;
  const uniqueVentures = new Set(entries.map(e => e.ventureId).filter(Boolean)).size;
  const lastHour = entries.filter(e => {
    try { return Date.now() - new Date(e.timestamp).getTime() < 3_600_000; } catch { return false; }
  }).length;

  // Group by day for timeline render
  const grouped = entries.reduce<Record<string, AuditEntry[]>>((acc, e) => {
    const date = e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'Unknown';
    (acc[date] ??= []).push(e);
    return acc;
  }, {});

  // Event-type dropdown options — the six families we emit today + a catch-all.
  const ACTION_OPTIONS = [
    '',
    'chat.sent', 'chat.completed', 'chat.failed', 'chat.message.user_sent',
    'venture.switched',
    'naos.session.opened',
    'kit.installed', 'kit.uninstalled', 'kit.tool_call',
  ];

  return (
    <PageShell>
      <PageHeader
        title="Platform Events"
        icon={<Radio size={20} />}
        loading={loading}
        onRefresh={() => { void load(); }}
      >
        <Badge color={fabricOnline ? '#10B981' : fabricConfigured ? '#F59E0B' : 'var(--text-muted)'}>
          Fabric: {fabricOnline ? 'online' : fabricConfigured ? 'offline' : 'not configured'}
        </Badge>
      </PageHeader>

      {!fabricConfigured && (
        <GlassCard style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Triangle Fabric is not reachable from this browser. Set{' '}
              <code>VITE_MCV_CORE_FABRIC_URL</code> in <code>.env.local</code> and rebuild. Once
              Fabric is up, platform events emitted by the app
              (<code>chat.sent</code>, <code>venture.switched</code>, <code>kit.tool_call</code>,
              etc.) will appear here. Audit events are emitted even when this view isn't open —
              they're the observability channel, not a viewer feature.
            </div>
          </div>
        </GlassCard>
      )}

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Activity size={16} />} title="Total Events" value={String(entries.length)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<MessageSquare size={16} />} title="Last Hour" value={String(lastHour)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Package size={16} />} title="Ventures Active" value={String(uniqueVentures)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<LogIn size={16} />} title="Unique Users" value={String(uniqueUsers)} />
          </motion.div>
        </GridLayout>
      </motion.div>

      <GlassCard style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Event Type</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a || 'All event types'}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Venture</label>
            <select value={ventureFilter} onChange={(e) => setVentureFilter(e.target.value)} style={selectStyle}>
              <option value="">All ventures</option>
              {ventures.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>User ID</label>
            <Input
              placeholder="Filter by user"
              value={userSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearch(e.target.value)}
            />
          </div>
        </div>
      </GlassCard>

      {Object.keys(actionCounts).length > 0 && (
        <GlassCard style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)' }}>Event Breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(actionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([action, count]) => (
                <Badge key={action} color={EVENT_COLORS[action] || 'var(--text-muted)'}>
                  {action}: {count}
                </Badge>
              ))}
          </div>
        </GlassCard>
      )}

      <div style={{ padding: '16px 0' }}>
        <GlassCard>
          {loading ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="mcv-spin" /> Querying Fabric...
            </div>
          ) : error ? (
            <EmptyState icon={<AlertCircle size={32} />} title="Fabric query failed" description={error}>
              <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={() => { void load(); }}>
                Retry
              </Button>
            </EmptyState>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Radio size={32} />}
              title="No platform events yet"
              description={
                fabricOnline
                  ? 'As users chat, switch ventures, install kits, or invoke tools, their events will appear here.'
                  : 'Start the Triangle Fabric service and emit a few actions; they will show up here.'
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(grouped).map(([date, dayEntries]) => (
                <div key={date}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    {date} · {dayEntries.length} events
                  </div>
                  {dayEntries.map((e, i) => {
                    const action = eventAction(e);
                    const Icon = EVENT_ICONS[action] || Activity;
                    const color = EVENT_COLORS[action] || 'var(--text-muted)';
                    const summary = e.metadata ? JSON.stringify(e.metadata).slice(0, 80) : '';
                    return (
                      <div
                        key={e.id || i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 180px 1fr 120px',
                          padding: '10px 0',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 13,
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          {new Date(e.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={12} style={{ color }} />
                          <span style={{ color, fontSize: 12, fontFamily: 'var(--font-mono)' }}>{action}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {summary}
                        </span>
                        {e.ventureId && <Badge>{e.ventureId}</Badge>}
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

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  display: 'block',
  marginBottom: 4,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
};
