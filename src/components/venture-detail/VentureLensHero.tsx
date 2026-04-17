// VentureLensHero — hero banner for VentureDetailView (Marathon #3 T7.5).
//
// Shows:
//   - Venture name + brand accent + funding_stage / raising / tier badges
//   - Raise progress bar across all raising rounds (aggregate target/committed)
//   - 4 quick-glance stats (total rounds, open rounds, investors, recent activity)
//
// If PinnedKpiStrip (from Marathon #1 T1) lands in this branch later, it can be
// rendered inline lens-bound to ventureId. Currently absent in this worktree so
// the hero stands alone. The brand gradient pulls from BrandKit when available,
// falling back to Electric Cyan / Neon Purple tokens from the MCV design system.

import type { VentureDetail } from '../../hooks/use-venture-detail';

interface Props {
  detail: VentureDetail;
}

export function VentureLensHero({ detail }: Props) {
  const { venture, brand, rounds, raising_rounds, recent_activities } = detail;
  const accent = brand?.color_primary ?? 'var(--color-brand-electric)';
  const accentAlt = brand?.color_accent ?? 'var(--color-brand-purple)';

  // Aggregate raise progress across all raising rounds.
  const targetSum = raising_rounds.reduce(
    (s, r) => s + Number(r.target_raise || 0),
    0,
  );
  const committedSum = raising_rounds.reduce(
    (s, r) => s + Number(r.total_committed || 0),
    0,
  );
  const progressPct =
    targetSum > 0
      ? Math.min(100, Math.round((committedSum / targetSum) * 100))
      : 0;

  const investors = raising_rounds.reduce(
    (s, r) => s + Number(r.total_investors || 0),
    0,
  );

  return (
    <section
      style={{
        padding: 24,
        borderRadius: 16,
        border: `1px solid ${accent}40`,
        background: `linear-gradient(135deg, ${accent}14, ${accentAlt}08, transparent)`,
        marginBottom: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      {/* Top row: brand identity */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: accent,
                color: 'var(--surface-base)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              {venture.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: accent,
                  fontWeight: 700,
                }}
              >
                {venture.type ?? 'Venture'}
                {venture.category && ` · ${venture.category}`}
              </div>
              <h1
                style={{
                  margin: '2px 0 0',
                  fontSize: 24,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {venture.name}
              </h1>
            </div>
          </div>
          {brand?.primary_domain && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 6,
                fontFamily: 'monospace',
              }}
            >
              {brand.primary_domain}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {venture.funding_stage && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
                background: `${accent}20`,
                color: accent,
              }}
            >
              {venture.funding_stage}
            </span>
          )}
          {venture.is_raising && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
                background: `${accentAlt}20`,
                color: accentAlt,
              }}
            >
              Raising
            </span>
          )}
          {venture.tier && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
                background: 'var(--surface-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {venture.tier}
            </span>
          )}
        </div>
      </header>

      {/* Raise progress (only when raising) */}
      {raising_rounds.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              Active raise · {raising_rounds.length} round
              {raising_rounds.length > 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>
              ${committedSum.toLocaleString()} of ${targetSum.toLocaleString()} (
              {progressPct}%)
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'var(--surface-base)',
              overflow: 'hidden',
              border: `1px solid ${accent}40`,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${accent}, ${accentAlt})`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Quick-glance stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
      >
        <QuickStat label="Rounds" value={rounds.length} />
        <QuickStat label="Open" value={raising_rounds.length} accent={accent} />
        <QuickStat label="Investors" value={investors} />
        <QuickStat label="Activity (30d)" value={recent_activities.length} />
      </div>
    </section>
  );
}

const QuickStat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) => (
  <div
    style={{
      padding: '8px 10px',
      borderRadius: 8,
      background: 'var(--surface-base)',
      border: `1px solid ${accent ? `${accent}40` : 'var(--border-subtle)'}`,
    }}
  >
    <div
      style={{
        fontSize: 9,
        letterSpacing: '.15em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: accent ?? 'var(--text-primary)',
        marginTop: 2,
      }}
    >
      {value}
    </div>
  </div>
);

export default VentureLensHero;
