// EdgeIQ Capital — Per-venture cap table + round roster.
// SPEC-EQC-001 Epic 2.5

import { useMemo } from 'react';
import { Briefcase, Plus, TrendingUp, Users, DollarSign, Activity as ActivityIcon } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useVentureSummary, useInvestors, useActivities } from '../hooks/use-capital';
import { PageHeader, PageShell, StatCard, GlassCard, GridLayout, Badge, EmptyState, Button } from '../components/ui';
import { formatMoney, timeAgo } from '../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--capital-status-draft)',
  preview: 'var(--capital-status-draft)',
  open: 'var(--capital-status-open)',
  closing: 'var(--capital-status-closing)',
  closed: 'var(--capital-status-closed)',
  funded: 'var(--capital-status-funded)',
};

export default function CapitalVentureView() {
  const activeVenture = useNavigation((s) => s.activeVenture);
  const setView = useNavigation((s) => s.setView);

  const { data: summary, isLoading, refetch } = useVentureSummary(activeVenture);
  const { data: investors = [] } = useInvestors(activeVenture ?? undefined);
  const { data: activities = [] } = useActivities(activeVenture ?? undefined);

  const sortedRounds = useMemo(() => {
    if (!summary?.rounds) return [];
    return [...summary.rounds].sort((a, b) => b.totalCommitted - a.totalCommitted);
  }, [summary]);

  const topInvestors = useMemo(
    () => [...investors].sort((a, b) => b.totalCommittedUsd - a.totalCommittedUsd).slice(0, 10),
    [investors],
  );

  if (!activeVenture) {
    return (
      <PageShell scroll>
        <EmptyState
          icon={<Briefcase size={32} />}
          title="No venture selected"
          description="Switch to a venture to view its capital structure."
        />
      </PageShell>
    );
  }

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Briefcase size={20} />}
        title={`Capital — ${activeVenture.toUpperCase()}`}
        subtitle="Rounds, commitments, investors"
        loading={isLoading}
        onRefresh={() => refetch()}
      >
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => alert('Round creation wizard — Epic 2.6 follow-up')}>
          New Round
        </Button>
      </PageHeader>

      {/* KPIs */}
      <GridLayout cols={4} gap="md">
        <StatCard icon={<DollarSign size={16} />} label="Raised" value={formatMoney(summary?.totalRaisedUsd ?? 0)} />
        <StatCard icon={<TrendingUp size={16} />} label="Committed" value={formatMoney(summary?.totalCommittedUsd ?? 0)} />
        <StatCard icon={<Briefcase size={16} />} label="Active Rounds" value={String(summary?.activeRoundsCount ?? 0)} />
        <StatCard icon={<Users size={16} />} label="Investors" value={String(summary?.investorCount ?? 0)} />
      </GridLayout>

      {/* Rounds */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          Rounds ({sortedRounds.length})
        </h2>
        {!sortedRounds.length ? (
          <EmptyState icon={<Briefcase size={24} />} title="No rounds yet" description="Create your first round to start tracking commitments." />
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Target</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Committed</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Funded</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Investors</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {sortedRounds.map((r) => {
                  const progressVal = r.targetRaise > 0 ? (r.totalCommitted / r.targetRaise) * 100 : 0;
                  return (
                    <tr
                      key={r.id}
                      style={{ borderTop: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => {
                        sessionStorage.setItem('capital.activeRoundId', r.id);
                        setView('capital-round-detail');
                      }}
                    >
                      <td style={{ padding: 10, fontSize: 12, fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)' }}>{r.roundType} · {r.raiseLane}</td>
                      <td style={{ padding: 10 }}>
                        <Badge color={STATUS_COLORS[r.status] ?? '#6B7280'}>{r.status}</Badge>
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 12 }}>{formatMoney(r.targetRaise)}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 12, color: 'var(--cyan)' }}>{formatMoney(r.totalCommitted)}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 12, color: 'var(--green)' }}>{formatMoney(r.totalFunded)}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 12 }}>{r.totalInvestors}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{progressVal.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* Top investors */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>Top Investors</h2>
        {!topInvestors.length ? (
          <EmptyState icon={<Users size={24} />} title="No investors yet" />
        ) : (
          <GlassCard style={{ padding: 0 }}>
            {topInvestors.map((inv, i) => (
              <div
                key={inv.contactId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  borderBottom: i < topInvestors.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <Badge variant="outline">{inv.contactType}</Badge>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}>Contact {inv.contactId.slice(0, 8)}…</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Stage: {inv.stage} · Lead score: {inv.leadScore}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)' }}>{formatMoney(inv.totalCommittedUsd)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Funded: {formatMoney(inv.totalFundedUsd)}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      {/* Activity */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          <ActivityIcon size={14} style={{ display: 'inline', marginRight: 4 }} />
          Recent Activity
        </h2>
        {!activities.length ? (
          <EmptyState icon={<ActivityIcon size={24} />} title="No activity" />
        ) : (
          <GlassCard style={{ padding: 0 }}>
            {activities.slice(0, 12).map((a, i) => (
              <div key={a.id} style={{ padding: 10, borderBottom: i < 11 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ fontSize: 12 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {a.activityType} · {timeAgo(a.occurredAt)} · {a.actorType}
                </div>
              </div>
            ))}
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
