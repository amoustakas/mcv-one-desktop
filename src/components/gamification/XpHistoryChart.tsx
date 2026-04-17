// src/components/gamification/XpHistoryChart.tsx
// Marathon #3 T9.6 — pure SVG cumulative-XP sparkline. No charting lib dep.

import type { XpEvent } from '../../hooks/use-persona-xp';

interface Props { events: XpEvent[]; height?: number; width?: number }

// Small inline SVG sparkline showing cumulative XP over time.
export function XpHistoryChart({ events, height = 80, width = 300 }: Props) {
  if (events.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-muted)',
          fontSize: 11,
          fontStyle: 'italic',
        }}
      >
        No XP events yet
      </div>
    );
  }

  // Sort ascending by occurred_at for the cumulative line.
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  let running = 0;
  const points = sorted.map((e, i) => {
    running += e.xp;
    return { x: i, y: running, kind: e.event_kind };
  });

  const maxY = Math.max(running, 1);
  const minY = 0;
  const pad = 8;
  const xStep = (width - pad * 2) / Math.max(1, points.length - 1);
  const yScale = (y: number) =>
    height - pad - ((y - minY) / (maxY - minY)) * (height - pad * 2);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep},${yScale(p.y)}`)
    .join(' ');
  const areaPath = `${path} L ${pad + (points.length - 1) * xStep},${height - pad} L ${pad},${height - pad} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="xp-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-electric)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-brand-electric)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#xp-area)" />
      <path
        d={path}
        stroke="var(--color-brand-electric)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={pad + i * xStep}
          cy={yScale(p.y)}
          r={3}
          fill="var(--color-brand-electric)"
          stroke="var(--surface-base)"
          strokeWidth="1.5"
        />
      ))}
      <text
        x={width - pad}
        y={pad + 4}
        textAnchor="end"
        fill="var(--text-muted)"
        fontSize="10"
      >
        {running.toLocaleString()} XP cumulative
      </text>
    </svg>
  );
}

export default XpHistoryChart;
