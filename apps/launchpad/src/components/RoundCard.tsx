import Link from 'next/link';
import type { Round } from '@mcv/capital-sdk';

function usd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function RoundCard({ round: r }: { round: Round }) {
  const progress = r.targetRaise > 0 ? Math.min(100, (r.totalCommitted / r.targetRaise) * 100) : 0;
  const laneClass = `lp-badge-${r.raiseLane}`;
  const statusClass = r.status === 'open' ? 'lp-badge-open' : 'lp-badge-closing';

  return (
    <Link href={`/p/${r.ventureId}/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="lp-card">
        <div className="lp-card-venture">{r.ventureId}</div>
        <h3>{r.name}</h3>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <span className={`lp-badge ${laneClass}`}>{r.raiseLane}</span>
          <span className={`lp-badge ${statusClass}`}>{r.status}</span>
          {r.regulatoryFramework && (
            <span className="lp-badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {r.regulatoryFramework.toUpperCase()}
            </span>
          )}
        </div>
        <div className="lp-progress-track">
          <div className="lp-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="lp-progress-label">
          <span>{usd(r.totalCommitted)} of {usd(r.targetRaise)}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="lp-card-meta">
          <span>{r.totalInvestors} investors</span>
          {r.fundingDeadline && (
            <span>Closes {new Date(r.fundingDeadline).toLocaleDateString()}</span>
          )}
          {r.minimumCheck > 0 && <span>Min {usd(r.minimumCheck)}</span>}
        </div>
      </div>
    </Link>
  );
}
