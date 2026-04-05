import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { cn } from '../../lib/utils';

const DEFAULT_COLORS = [
  'var(--cyan)',
  'var(--purple)',
  'var(--success)',
  'var(--warning)',
  'var(--core-blue)',
];

interface DonutItem {
  name: string;
  value: number;
  color?: string;
}

interface McvDonutChartProps {
  data: DonutItem[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: DonutItem }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="mcv-chart-tooltip">
      <div className="mcv-chart-tooltip-item">
        <span className="mcv-chart-tooltip-dot" style={{ background: entry.payload.color ?? 'var(--cyan)' }} />
        <span>{entry.name}</span>
        <span className="mcv-chart-tooltip-value">{entry.value?.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function McvDonutChart({
  data,
  size = 200,
  innerRadius: innerRadiusProp,
  showLabels = false,
  showLegend = false,
  centerLabel,
  centerValue,
  className,
}: McvDonutChartProps) {
  const outerR = size / 2 - 8;
  const innerR = innerRadiusProp ?? Math.round(outerR * 0.6);

  return (
    <div className={cn('mcv-chart', className)} style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius={outerR}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
            label={showLabels ? ({ name, percent }: { name?: string; percent?: number }) =>
              `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
            : undefined}
            labelLine={showLabels}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {(centerLabel || centerValue) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerValue && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {centerValue}
            </div>
          )}
          {centerLabel && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>
              {centerLabel}
            </div>
          )}
        </div>
      )}

      {showLegend && (
        <div className="mcv-chart-legend">
          {data.map((entry, i) => (
            <div key={entry.name} className="mcv-chart-legend-item">
              <span
                className="mcv-chart-legend-dot"
                style={{ background: entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
