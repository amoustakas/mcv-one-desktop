import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCapitalEngine } from '../../../../lib/capital';

export const revalidate = 60;

type Params = { ventureSlug: string; roundSlug: string };

async function loadRound(params: Params) {
  const engine = getCapitalEngine();
  const round = await engine.rounds.getRoundBySlug(params.ventureSlug, params.roundSlug);
  if (!round || !round.isPublic || (round.status !== 'open' && round.status !== 'closing')) return null;
  return round;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = await params;
  const round = await loadRound(resolved);
  if (!round) return { title: 'Raise not found' };
  return {
    title: `${round.name} · MCV Capital`,
    description: round.description ?? `Raising ${round.targetRaise.toLocaleString('en-US', { style: 'currency', currency: round.currency })}`,
    openGraph: {
      title: round.name,
      description: round.description ?? '',
      url: `https://launchpad.mcv.one/p/${resolved.ventureSlug}/${resolved.roundSlug}`,
      type: 'website',
    },
  };
}

function usd(value: number, currency = 'USD') {
  return value.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

export default async function RoundPage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const round = await loadRound(resolved);
  if (!round) notFound();

  const progress = round.targetRaise > 0 ? Math.min(100, (round.totalCommitted / round.targetRaise) * 100) : 0;

  return (
    <div className="lp-container" style={{ padding: '48px 24px', maxWidth: 960 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {round.ventureId}
      </div>
      <h1 style={{ fontSize: 48, margin: '0 0 16px', lineHeight: 1.1 }}>{round.name}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <span className={`lp-badge lp-badge-${round.raiseLane}`}>{round.raiseLane}</span>
        <span className="lp-badge lp-badge-open">{round.status}</span>
        {round.regulatoryFramework && (
          <span className="lp-badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {round.regulatoryFramework.toUpperCase()}
          </span>
        )}
        {round.accreditedOnly && (
          <span className="lp-badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
            Accredited only
          </span>
        )}
      </div>

      {round.description && <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 32 }}>{round.description}</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{usd(round.totalCommitted, round.currency)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>committed of {usd(round.targetRaise, round.currency)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{round.totalInvestors}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>investors</div>
          </div>
        </div>
        <div className="lp-progress-track"><div className="lp-progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="lp-progress-label"><span>{progress.toFixed(0)}% complete</span><span>{usd(round.allocationRemaining ?? 0, round.currency)} remaining</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Terms</h3>
          <Detail label="Type" value={`${round.roundType} · ${round.raiseLane}`} />
          <Detail label="Currency" value={round.currency} />
          {round.minimumCheck > 0 && <Detail label="Min check" value={usd(round.minimumCheck, round.currency)} />}
          {round.maximumCheck && <Detail label="Max check" value={usd(round.maximumCheck, round.currency)} />}
          {round.preMoneyValuation && <Detail label="Pre-money" value={usd(round.preMoneyValuation, round.currency)} />}
          {round.valuationCap && <Detail label="Cap" value={usd(round.valuationCap, round.currency)} />}
          {round.discountRate !== null && round.discountRate !== undefined && <Detail label="Discount" value={`${round.discountRate}%`} />}
        </div>
        <div>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Timeline</h3>
          {round.openDate && <Detail label="Open" value={new Date(round.openDate).toLocaleDateString()} />}
          {round.closeDate && <Detail label="Close" value={new Date(round.closeDate).toLocaleDateString()} />}
          {round.fundingDeadline && <Detail label="Deadline" value={new Date(round.fundingDeadline).toLocaleDateString()} />}
          {round.jurisdictionRestrictions.length > 0 && (
            <Detail label="Restricted" value={round.jurisdictionRestrictions.join(', ')} />
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <a
          href={`https://invest.mcv.one/capital/${round.ventureId}/${round.slug}`}
          className="lp-btn lp-btn-primary"
          style={{ fontSize: 16, padding: '16px 48px' }}
        >
          Commit to this raise
        </a>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Routes to the MCV Capital investor portal. Accredited-investor verification handled automatically.
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0 16px', borderTop: '1px solid var(--border-subtle)' }}>
        Raise published via <a href="/protocol">MCP-Capital v0.1</a> · Embed: <a href={`/widget/${resolved.ventureSlug}/${resolved.roundSlug}`}>iframe widget</a>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px dotted var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
