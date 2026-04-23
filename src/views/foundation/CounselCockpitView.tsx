// Counsel Cockpit — 3 workstream cards (Corp/Tax · IP · Securities) +
// task swim-lane summary. Each card shows firm engagement status + NDA state +
// budget meter + task count. Click-through to task detail deferred to v2.

import { useEffect } from 'react';
import { Gavel, Briefcase, Shield, Scale } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button } from '../../components/ui';
import { Chip } from './_chip';
import {
  useFoundationStore,
  tasksByWorkstream,
  WORKSTREAM_LABEL,
  criticalPathTasks,
} from '../../stores/foundation';
import type { CounselEngagement, CounselTask } from '../../stores/foundation';

const WORKSTREAM_ORDER: Array<'corp_tax' | 'ip' | 'securities'> = ['corp_tax', 'ip', 'securities'];
const WORKSTREAM_ICON: Record<'corp_tax' | 'ip' | 'securities', React.ReactNode> = {
  corp_tax: <Briefcase size={16} />,
  ip: <Shield size={16} />,
  securities: <Scale size={16} />,
};
const WORKSTREAM_COLOR: Record<'corp_tax' | 'ip' | 'securities', string> = {
  corp_tax: '#06B6D4',
  ip: '#00F5FF',
  securities: '#8B5CF6',
};

export default function CounselCockpitView() {
  const {
    counselEngagements, counselTasks, loading, errors,
    fetchCounselEngagements, fetchCounselTasks,
  } = useFoundationStore();

  useEffect(() => {
    fetchCounselEngagements();
    fetchCounselTasks();
  }, [fetchCounselEngagements, fetchCounselTasks]);

  const tasksByWs = tasksByWorkstream(counselTasks);
  const critical = criticalPathTasks(counselTasks);
  const err = errors.counselEngagements || errors.counselTasks;

  return (
    <PageShell>
      <PageHeader
        title="Counsel Cockpit"
        subtitle={`${counselTasks.length} tasks · ${critical.length} critical-path · ${counselEngagements.length} firms engaged`}
        icon={<Gavel size={20} />}
      />

      {err && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{err}</span>
        </GlassCard>
      )}

      {/* Three workstream cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
        {WORKSTREAM_ORDER.map((ws) => (
          <WorkstreamCard
            key={ws}
            workstream={ws}
            engagements={counselEngagements.filter((e) => e.workstream === ws)}
            tasks={tasksByWs[ws]}
          />
        ))}
      </div>

      {/* Critical path */}
      {critical.length > 0 && (
        <GlassCard style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#00F5FF', marginBottom: 10 }}>
            🔥 Critical Path · {critical.length} open
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
            {critical.map((t) => (
              <div key={t.id} style={{
                padding: 10,
                background: 'rgba(0,245,255,0.04)',
                border: '1px solid rgba(0,245,255,0.2)',
                borderRadius: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <code style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>{t.taskCode}</code>
                  <Chip tone="muted">{t.status}</Chip>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Full task table */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)' }}>
          All counsel tasks · sorted by workstream + priority
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Workstream</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Deliverable</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Critical</th>
            </tr>
          </thead>
          <tbody>
            {counselTasks.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={tdStyle}>
                  <code style={{ fontWeight: 600, color: WORKSTREAM_COLOR[t.workstream] }}>{t.taskCode}</code>
                </td>
                <td style={tdStyle}>{WORKSTREAM_LABEL[t.workstream]}</td>
                <td style={tdStyle}>{t.title}</td>
                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 12, maxWidth: 320 }}>
                  {t.deliverable?.slice(0, 140) ?? t.description?.slice(0, 140) ?? '—'}
                  {((t.deliverable ?? t.description ?? '').length > 140) && '…'}
                </td>
                <td style={tdStyle}><Chip tone="muted">{t.status}</Chip></td>
                <td style={tdStyle}>{t.criticalPath ? '🔥' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {loading.counselTasks && counselTasks.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading counsel tasks…</div>
      )}
    </PageShell>
  );
}

function WorkstreamCard({
  workstream,
  engagements,
  tasks,
}: {
  workstream: 'corp_tax' | 'ip' | 'securities';
  engagements: CounselEngagement[];
  tasks: CounselTask[];
}) {
  const primary = engagements[0];
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const color = WORKSTREAM_COLOR[workstream];

  return (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{WORKSTREAM_ICON[workstream]}</span>
        <span style={{ fontWeight: 600 }}>{WORKSTREAM_LABEL[workstream]}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {primary ? (
          <>
            <strong style={{ color: 'var(--text)' }}>{primary.firmName}</strong>
            {' · '}
            <span>{primary.status}</span>
            {primary.ndaExecutedAt && <span style={{ marginLeft: 6 }}><Chip tone="success">NDA ✓</Chip></span>}
          </>
        ) : (
          <span>No firm engaged yet</span>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>Task progress</span>
          <span>{done}/{total}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
        </div>
      </div>

      <Button variant="secondary" style={{ fontSize: 12, width: '100%' }}>
        Render Hour-3 email →
      </Button>
    </GlassCard>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' };
