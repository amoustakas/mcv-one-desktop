// EdgeIQ Capital — Round detail + commitment grid.
// SPEC-EQC-001 Epic 2.6

import { useMemo, useState } from 'react';
import { Briefcase, Target, Calendar, ArrowLeft, Users, FileText } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useRound, useCommitmentsByRound, useDocumentsByRound, useUpdateRoundStatus, useUpdateCommitmentStatus } from '../hooks/use-capital';
import { PageHeader, PageShell, StatCard, GlassCard, GridLayout, Badge, EmptyState, Button } from '../components/ui';
import InvestorUpdatesPanel from '../components/capital/InvestorUpdatesPanel';
import DistributionsPanel from '../components/capital/DistributionsPanel';
import { formatMoney } from '../lib/utils';
import {
  COMMITMENT_STATUS_TRANSITIONS,
  ROUND_STATUS_TRANSITIONS,
  type CommitmentStatus,
  type RoundStatus,
} from '@mcv/capital-sdk';

const COMMIT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  interest: 'var(--capital-stage-cold)',
  soft_commit: 'var(--capital-stage-warm)',
  reserved: 'var(--capital-stage-engaged)',
  pending_docs: 'var(--capital-stage-soft-commit)',
  signed: 'var(--capital-stage-signed)',
  pending_wire: 'var(--capital-stage-due-diligence)',
  funded: 'var(--capital-stage-funded)',
  token_pending: 'var(--capital-lane-token)',
  token_distributed: 'var(--capital-stage-active-investor)',
  refunded: 'var(--capital-stage-churned)',
  withdrawn: 'var(--capital-stage-dormant)',
};

export default function CapitalRoundDetailView() {
  const setView = useNavigation((s) => s.setView);
  const activeVenture = useNavigation((s) => s.activeVenture);
  const [activeRoundId] = useState(() => sessionStorage.getItem('capital.activeRoundId'));

  const { data: round, isLoading } = useRound(activeRoundId);
  const { data: commitments = [] } = useCommitmentsByRound(activeRoundId);
  const { data: documents = [] } = useDocumentsByRound(activeRoundId);
  const updateRoundStatus = useUpdateRoundStatus();
  const updateCommitStatus = useUpdateCommitmentStatus();

  const sortedCommits = useMemo(() => [...commitments].sort((a, b) => b.amountUsd - a.amountUsd), [commitments]);

  if (!activeRoundId || (!isLoading && !round)) {
    return (
      <PageShell scroll>
        <EmptyState
          icon={<Briefcase size={32} />}
          title="Round not found"
          description="Pick a round from the venture view."
          action={<Button onClick={() => setView('capital-venture')}>Back to venture</Button>}
        />
      </PageShell>
    );
  }

  if (!round) {
    return <PageShell scroll><div style={{ padding: 24 }}>Loading round…</div></PageShell>;
  }

  const progressVal = round.targetRaise > 0 ? (round.totalCommitted / round.targetRaise) * 100 : 0;
  const allowedRoundTransitions = ROUND_STATUS_TRANSITIONS[round.status as RoundStatus] ?? [];

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Briefcase size={20} />}
        title={round.name}
        subtitle={`${activeVenture?.toUpperCase() ?? round.ventureId} · ${round.roundType} · ${round.raiseLane}`}
        loading={isLoading}
      >
        <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => setView('capital-venture')}>Back</Button>
      </PageHeader>

      {/* KPIs */}
      <GridLayout cols={4} gap="md">
        <StatCard icon={<Target size={16} />} label="Target" value={formatMoney(round.targetRaise)} />
        <StatCard icon={<Briefcase size={16} />} label={`Committed (${progressVal.toFixed(1)}%)`} value={formatMoney(round.totalCommitted)} />
        <StatCard icon={<Users size={16} />} label="Investors" value={String(round.totalInvestors)} />
        <StatCard icon={<Calendar size={16} />} label="Status" value={round.status} />
      </GridLayout>

      {/* Status transitions */}
      {allowedRoundTransitions.length > 0 && (
        <GlassCard style={{ padding: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Move round to:</span>
            {allowedRoundTransitions.map((next) => (
              <Button
                key={next}
                variant="ghost"
                onClick={() => updateRoundStatus.mutate({ id: round.id, status: next })}
                disabled={updateRoundStatus.isPending}
              >
                {next}
              </Button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Round details */}
      <div style={{ marginTop: 16 }}><GridLayout cols={2} gap="md">
        <GlassCard style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>Terms</h3>
          <Detail label="Type" value={`${round.roundType} (${round.raiseLane})`} />
          <Detail label="Currency" value={round.currency} />
          {round.preMoneyValuation && <Detail label="Pre-money" value={formatMoney(round.preMoneyValuation)} />}
          {round.valuationCap && <Detail label="Cap" value={formatMoney(round.valuationCap)} />}
          {round.discountRate !== null && <Detail label="Discount" value={`${round.discountRate}%`} />}
          {round.minimumCheck > 0 && <Detail label="Min check" value={formatMoney(round.minimumCheck)} />}
          {round.maximumCheck && <Detail label="Max check" value={formatMoney(round.maximumCheck)} />}
          {round.regulatoryFramework && <Detail label="Framework" value={round.regulatoryFramework} />}
          {round.accreditedOnly && <Detail label="Accredited only" value="Yes" />}
        </GlassCard>

        <GlassCard style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>Timeline</h3>
          {round.openDate && <Detail label="Open" value={new Date(round.openDate).toLocaleDateString()} />}
          {round.closeDate && <Detail label="Close" value={new Date(round.closeDate).toLocaleDateString()} />}
          {round.fundingDeadline && <Detail label="Funding deadline" value={new Date(round.fundingDeadline).toLocaleDateString()} />}
          <Detail label="Created" value={new Date(round.createdAt).toLocaleDateString()} />
        </GlassCard>
      </GridLayout></div>

      {/* Commitment grid */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          Commitments ({sortedCommits.length})
        </h2>
        {!sortedCommits.length ? (
          <EmptyState icon={<Users size={24} />} title="No commitments" description="Add commitments via the chat or NAOS using the capital-kit." />
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Contact</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Amount</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Currency</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Payment</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Move to</th>
                </tr>
              </thead>
              <tbody>
                {sortedCommits.map((c) => {
                  const next = COMMITMENT_STATUS_TRANSITIONS[c.status as CommitmentStatus] ?? [];
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 10, fontSize: 11, fontFamily: 'monospace' }}>{c.contactId.slice(0, 8)}…</td>
                      <td style={{ padding: 10 }}>
                        <Badge color={COMMIT_STATUS_COLORS[c.status as CommitmentStatus]}>{c.status}</Badge>
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 12, color: 'var(--cyan)' }}>{formatMoney(c.amountUsd)}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{c.currency}</td>
                      <td style={{ padding: 10, fontSize: 11 }}>{c.paymentMethod ?? '—'}</td>
                      <td style={{ padding: 10 }}>
                        <select
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) updateCommitStatus.mutate({ id: c.id, status: e.target.value as CommitmentStatus });
                          }}
                        >
                          <option value="">—</option>
                          {next.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* Investor Updates (Content OS-backed) */}
      <div style={{ marginTop: 24 }}>
        <InvestorUpdatesPanel ventureId={round.ventureId} roundId={round.id} />
      </div>

      {/* Distributions (Capital × Ledger × Payments) */}
      <div style={{ marginTop: 24 }}>
        <DistributionsPanel ventureId={round.ventureId} roundId={round.id} currency={round.currency} />
      </div>

      {/* Documents */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
          Documents ({documents.length})
        </h2>
        {!documents.length ? (
          <EmptyState icon={<FileText size={24} />} title="No documents" />
        ) : (
          <GlassCard style={{ padding: 0 }}>
            {documents.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  borderBottom: i < documents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.documentType} · v{d.version}</div>
                </div>
                {d.isInvestorVisible && <Badge color="#10B981">Investor-visible</Badge>}
                <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)' }}>Open</a>
              </div>
            ))}
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
