// src/views/DistributionsView.tsx
import { useState } from 'react';
import { useDistributions, useDistributionDetail, useExecuteDistribution } from '../hooks/use-distributions';
import { DistributionRow } from '../components/distributions/DistributionRow';
import { DistributionLegsTable } from '../components/distributions/DistributionLegsTable';
import { DistributionCreateModal } from '../components/distributions/DistributionCreateModal';
import { PageShell, PageHeader } from '../components/ui';

export function DistributionsView() {
  const { data, isLoading } = useDistributions({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const detailQ = useDistributionDetail(selectedId);
  const execute = useExecuteDistribution();
  const [execError, setExecError] = useState<string | null>(null);

  const distributions = data?.distributions ?? [];
  const byStatus = distributions.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const onExecute = async () => {
    if (!selectedId) return;
    setExecError(null);
    try {
      await execute.mutateAsync({ distributionId: selectedId });
    } catch (e) {
      setExecError(e instanceof Error ? e.message : 'Execute failed');
    }
  };

  return (
    <PageShell>
      <PageHeader title="Distributions" subtitle="Money OUT — dividends, yield, buybacks. Driven by each venture's active royalty graph." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Total" value={distributions.length} />
          <Stat label="Scheduled" value={byStatus.scheduled ?? 0} accent="var(--color-brand-electric)" />
          <Stat label="Processing" value={byStatus.processing ?? 0} accent="#FBBF24" />
          <Stat label="Completed" value={byStatus.completed ?? 0} accent="#6EE7B7" />
          <Stat label="Failed" value={byStatus.failed ?? 0} accent="#FB7185" />
        </div>
        <button onClick={() => setCreateOpen(true)}
          style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-brand-purple)', color: 'var(--surface-base)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          + Schedule distribution
        </button>
      </div>

      {isLoading && <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading distributions…</div>}

      {!isLoading && distributions.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
          No distributions yet. Schedule the first one to see it here.
        </div>
      )}

      {distributions.length > 0 && (
        <div style={{ display: 'grid', gap: 6, marginBottom: 24 }}>
          {distributions.map((d) => <DistributionRow key={d.id} distribution={d} onClick={(d2) => setSelectedId(d2.id)} />)}
        </div>
      )}

      {selectedId && detailQ.data && (
        <section style={{ marginTop: 20, padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-elevated)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Detail · {detailQ.data.distribution.id.slice(0, 8)}…
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700 }}>{detailQ.data.distribution.distribution_type} · {detailQ.data.distribution.currency} {Number(detailQ.data.distribution.total_amount).toLocaleString()}</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {detailQ.data.distribution.status === 'scheduled' && (
                <button onClick={onExecute} disabled={execute.isPending}
                  style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--color-brand-electric)', color: 'var(--surface-base)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  {execute.isPending ? 'Executing…' : 'Execute now'}
                </button>
              )}
              <button onClick={() => setSelectedId(null)}
                style={{ padding: '8px 14px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </header>
          {execError && <div style={{ padding: 10, borderRadius: 6, background: '#FB718520', color: '#FB7185', fontSize: 11, marginBottom: 10 }}>{execError}</div>}
          <DistributionLegsTable legs={detailQ.data.legs} />
        </section>
      )}

      {createOpen && <DistributionCreateModal onClose={() => setCreateOpen(false)} onCreated={(id) => setSelectedId(id)} />}
    </PageShell>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: string }) => (
  <div style={{
    padding: 10, borderRadius: 10,
    border: `1px solid ${accent ? `${accent}40` : 'var(--border-subtle)'}`,
    background: accent ? `color-mix(in srgb, ${accent} 10%, transparent)` : 'var(--surface-elevated)',
    minWidth: 88,
  }}>
    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: accent ?? 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default DistributionsView;
