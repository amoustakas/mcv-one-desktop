// VentureDetailView — venture god-view shell (Marathon #3 T7.3+T7.4).
//
// Single round-trip render. Uses useVentureDetail (T7.2) to pull the full
// payload in one go, then composes the T7.5 VentureLensHero + three block
// components (Rounds, Activities, Team) over a two-column layout.

import { useVentureDetail } from '../hooks/use-venture-detail';
import {
  VentureLensHero,
  VentureRoundsPanel,
  VentureActivitiesFeed,
  VentureTeamBlock,
} from '../components/venture-detail';
import { PageShell, PageHeader } from '../components/ui';

interface Props { ventureId: string | null }

export function VentureDetailView({ ventureId }: Props) {
  const { data, isLoading, error } = useVentureDetail(ventureId);

  if (!ventureId) {
    return (
      <PageShell>
        <PageHeader title="Ventures" subtitle="Select a venture from the nav to see its god-view." />
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader title="Venture" subtitle="Loading…" />
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading venture detail…</div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <PageHeader title="Venture" subtitle="Not found or error" />
        <div style={{ padding: 24, color: '#FB7185' }}>
          {(error as Error)?.message ?? `Venture ${ventureId} not found.`}
        </div>
      </PageShell>
    );
  }

  const { rounds, raising_rounds, recent_activities, scoped_personas, commitments_summary } = data;
  const brandAccent = data.brand?.color_primary ?? 'var(--color-brand-electric)';

  return (
    <PageShell>
      {/* Hero banner with name + brand accent + aggregate raise progress */}
      <VentureLensHero detail={data} />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, margin: '16px 0 20px' }}>
        <Stat label="Rounds" value={rounds.length} />
        <Stat label="Open" value={raising_rounds.length} accent={brandAccent} />
        <Stat label="Committed USD" value={`$${Math.round(commitments_summary.total_committed_usd).toLocaleString()}`} />
        <Stat label="Funded USD" value={`$${Math.round(commitments_summary.total_funded_usd).toLocaleString()}`} accent="#6EE7B7" />
        <Stat label="Activity (30d)" value={recent_activities.length} />
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 340px)', gap: 20 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <VentureRoundsPanel rounds={rounds} raising={raising_rounds} />
          <VentureActivitiesFeed activities={recent_activities} />
        </div>
        <div style={{ display: 'grid', gap: 20 }}>
          <VentureTeamBlock personas={scoped_personas} />
        </div>
      </div>
    </PageShell>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <div style={{
    padding: 10, borderRadius: 10,
    border: `1px solid ${accent ? `${accent}40` : 'var(--border-subtle)'}`,
    background: accent ? `color-mix(in srgb, ${accent} 10%, transparent)` : 'var(--surface-elevated)',
  }}>
    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: accent ?? 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default VentureDetailView;
