// Embeddable widget — lightweight round progress card.
// Used as <iframe src="https://launchpad.mcv.one/widget/{venture}/{round}" width="360" height="200">.

import { getCapitalEngine } from '../../../../lib/capital';

export const revalidate = 30;

type Params = { ventureSlug: string; roundSlug: string };

function usd(value: number, currency = 'USD') {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

export default async function Widget({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const engine = getCapitalEngine();
  const round = await engine.rounds.getRoundBySlug(resolved.ventureSlug, resolved.roundSlug).catch(() => null);

  if (!round || !round.isPublic) {
    return <div style={{ padding: 16, fontFamily: 'sans-serif', color: '#666' }}>Raise unavailable.</div>;
  }

  const progress = round.targetRaise > 0 ? Math.min(100, (round.totalCommitted / round.targetRaise) * 100) : 0;

  return (
    <div style={{
      padding: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #060D14 0%, #0F1720 100%)',
      color: '#E7EEF5',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      minHeight: 'calc(100vh - 32px)',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 10, color: '#8A9AAD', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {round.ventureId}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{round.name}</div>

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
          background: round.raiseLane === 'token' ? 'rgba(139,92,246,0.2)' : 'rgba(0,240,255,0.15)',
          color: round.raiseLane === 'token' ? '#8B5CF6' : '#00F0FF',
        }}>{round.raiseLane}</span>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
          background: 'rgba(16,185,129,0.15)', color: '#10B981',
        }}>{round.status}</span>
      </div>

      <div style={{ height: 8, background: '#1A242F', borderRadius: 4, overflow: 'hidden', marginTop: 16 }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00F0FF, #8B5CF6)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
        <span>{usd(round.totalCommitted, round.currency)} of {usd(round.targetRaise, round.currency)}</span>
        <span style={{ color: '#8A9AAD' }}>{progress.toFixed(0)}%</span>
      </div>

      <div style={{ fontSize: 11, color: '#8A9AAD', marginTop: 12 }}>
        {round.totalInvestors} investors · {round.minimumCheck > 0 && `Min ${usd(round.minimumCheck, round.currency)} · `}
        {round.fundingDeadline && `Closes ${new Date(round.fundingDeadline).toLocaleDateString()}`}
      </div>

      <a
        href={`https://launchpad.mcv.one/p/${resolved.ventureSlug}/${resolved.roundSlug}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'block',
          marginTop: 16,
          padding: '10px 16px',
          background: 'linear-gradient(90deg, #00F0FF, #8B5CF6)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        View full raise →
      </a>

      <div style={{ fontSize: 9, color: '#8A9AAD', textAlign: 'center', marginTop: 12 }}>
        Powered by <strong>MCV Capital</strong> · MCP-Capital v0.1
      </div>
    </div>
  );
}
