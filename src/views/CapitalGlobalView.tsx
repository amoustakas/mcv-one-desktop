// EdgeIQ Capital — Global portfolio dashboard.
// Tony's daily driver. Cross-venture roll-up of raised capital, pipeline, top investors, follow-ups.
// SPEC-EQC-001 Epic 2.4

import { useMemo } from 'react';
import { Briefcase, TrendingUp, Users, DollarSign, Activity as ActivityIcon, Target, Calendar } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useGlobalSummary, useRounds, useUpcomingFollowUps } from '../hooks/use-capital';
import { PageHeader, PageShell, StatCard, GlassCard, GridLayout, Badge, EmptyState } from '../components/ui';
import { formatMoney, timeAgo } from '../lib/utils';
import type { ContactStage } from '@mcv/capital-sdk';

const STAGE_COLORS: Record<ContactStage, string> = {
  cold: 'var(--capital-stage-cold)',
  warm: 'var(--capital-stage-warm)',
  engaged: 'var(--capital-stage-engaged)',
  soft_commit: 'var(--capital-stage-soft-commit)',
  due_diligence: 'var(--capital-stage-due-diligence)',
  signed: 'var(--capital-stage-signed)',
  funded: 'var(--capital-stage-funded)',
  active_investor: 'var(--capital-stage-active-investor)',
  churned: 'var(--capital-stage-churned)',
  dormant: 'var(--capital-stage-dormant)',
};

const STAGE_LABELS: Record<ContactStage, string> = {
  cold: 'Cold', warm: 'Warm', engaged: 'Engaged', soft_commit: 'Soft Commit',
  due_diligence: 'Due Diligence', signed: 'Signed', funded: 'Funded',
  active_investor: 'Active', churned: 'Churned', dormant: 'Dormant',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--capital-status-draft)',
  preview: 'var(--capital-status-draft)',
  open: 'var(--capital-status-open)',
  closing: 'var(--capital-status-closing)',
  closed: 'var(--capital-status-closed)',
  funded: 'var(--capital-status-funded)',
  cancelled: 'var(--capital-stage-churned)',
};

export default function CapitalGlobalView() {
  const setView = useNavigation((s) => s.setView);
  const switchToVenture = useNavigation((s) => s.switchToVenture);

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGlobalSummary();
  const { data: rounds = [] } = useRounds(undefined, undefined);
  const { data: followups = [] } = useUpcomingFollowUps(7);

  const activeRounds = useMemo(
    () => rounds.filter((r) => r.status === 'open' || r.status === 'closing'),
    [rounds],
  );

  const funnelTotal = useMemo(() => {
    if (!summary) return 0;
    return Object.values(summary.pipelineFunnel).reduce((a, b) => a + b, 0);
  }, [summary]);

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Briefcase size={20} />}
        title="EdgeIQ Capital — Portfolio"
        subtitle="Cross-venture cap table + investor pipeline"
        loading={loadingSummary}
        onRefresh={() => refetchSummary()}
      />

      {/* ── Headline KPIs ── */}
      <GridLayout cols={4} gap="md">
        <StatCard
          icon={<DollarSign size={16} />}
          label="Total Raised"
          value={formatMoney(summary?.totalRaisedUsd ?? 0)}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Total Committed"
          value={formatMoney(summary?.totalCommittedUsd ?? 0)}
        />
        <StatCard
          icon={<Target size={16} />}
          label="Active Rounds"
          value={String(summary?.activeRounds ?? 0)}
        />
        <StatCard
          icon={<Users size={16} />}
          label="Investors"
          value={String(summary?.totalInvestors ?? 0)}
        />
      </GridLayout>

      {/* ── Pipeline funnel ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>Pipeline Funnel</h2>
        {funnelTotal === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No investor data yet" description="Add contacts via the CRM Investors tab, or run a CSV import to populate the pipeline." />
        ) : (
          <GlassCard style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(Object.keys(STAGE_LABELS) as ContactStage[]).map((stage) => {
                const count = summary?.pipelineFunnel[stage] ?? 0;
                const pctVal = funnelTotal > 0 ? (count / funnelTotal) * 100 : 0;
                return (
                  <div key={stage} style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {STAGE_LABELS[stage]}
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pctVal}%`,
                        background: STAGE_COLORS[stage],
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>

      {/* ── Active rounds ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          Active Rounds ({activeRounds.length})
        </h2>
        {activeRounds.length === 0 ? (
          <EmptyState icon={<Target size={24} />} title="No active rounds" description="Open a round from any venture's capital page." />
        ) : (
          <GridLayout cols={3} gap="md">
            {activeRounds.map((r) => {
              const progressVal = r.targetRaise > 0 ? Math.min(100, (r.totalCommitted / r.targetRaise) * 100) : 0;
              return (
                <GlassCard
                  key={r.id}
                  style={{ padding: 16, cursor: 'pointer' }}
                  onClick={() => {
                    switchToVenture(r.ventureId);
                    setView('capital-round-detail');
                    sessionStorage.setItem('capital.activeRoundId', r.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.ventureId} · {r.roundType}</div>
                    </div>
                    <Badge color={STATUS_COLORS[r.status] || '#6B7280'}>{r.status}</Badge>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{formatMoney(r.totalCommitted)} of {formatMoney(r.targetRaise)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{progressVal.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressVal}%`, background: 'var(--cyan)', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    <span>{r.totalInvestors} investors</span>
                    {r.fundingDeadline && <span>Deadline: {new Date(r.fundingDeadline).toLocaleDateString()}</span>}
                  </div>
                </GlassCard>
              );
            })}
          </GridLayout>
        )}
      </div>

      {/* ── Top investors ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>Top Investors</h2>
        {!summary?.topInvestors?.length ? (
          <EmptyState icon={<Users size={24} />} title="No commitments yet" description="Top investors will appear here once commitments are funded." />
        ) : (
          <GlassCard style={{ padding: 0 }}>
            {summary.topInvestors.map((inv, i) => (
              <div
                key={inv.contactId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  borderBottom: i < summary.topInvestors.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ width: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.name}</div>
                  {inv.organizationName && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.organizationName}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>{formatMoney(inv.totalCommittedUsd)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.ventureCount} venture{inv.ventureCount > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      {/* ── Recent activity + Follow-ups ── */}
      <div style={{ marginTop: 24 }}>
      <GridLayout cols={2} gap="md">
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
            <ActivityIcon size={14} style={{ display: 'inline', marginRight: 4 }} />
            Recent Activity
          </h2>
          {!summary?.recentActivity?.length ? (
            <EmptyState icon={<ActivityIcon size={24} />} title="No activity yet" />
          ) : (
            <GlassCard style={{ padding: 0 }}>
              {summary.recentActivity.slice(0, 8).map((a, i) => (
                <div key={a.id} style={{ padding: 12, borderBottom: i < 7 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ fontSize: 12 }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {a.activityType} · {timeAgo(a.occurredAt)} · {a.ventureId}
                  </div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
            <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
            Upcoming Follow-ups (7d)
          </h2>
          {!followups.length ? (
            <EmptyState icon={<Calendar size={24} />} title="No follow-ups scheduled" />
          ) : (
            <GlassCard style={{ padding: 0 }}>
              {followups.slice(0, 8).map((f, i) => (
                <div key={f.contactId + f.nextFollowUp} style={{ padding: 12, borderBottom: i < 7 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ fontSize: 12 }}>{new Date(f.nextFollowUp).toLocaleDateString()} · {f.ventureId}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Contact: {f.contactId.slice(0, 8)}…</div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </GridLayout>
      </div>
    </PageShell>
  );
}
