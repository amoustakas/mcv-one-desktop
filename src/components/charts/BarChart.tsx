import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

interface McvBarChartProps {
  data: Record<string, unknown>[];
  dataKeys: { key: string; color?: string; label?: string }[];
  xAxisKey: string;
  height?: number;
  stacked?: boolean;
  horizontal?: boolean;
  showTooltip?: boolean;
  className?: string;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mcv-chart-tooltip">
      <div className="mcv-chart-tooltip-label">{String(label)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mcv-chart-tooltip-item">
          <span className="mcv-chart-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="mcv-chart-tooltip-value">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function McvBarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  stacked = false,
  horizontal = false,
  showTooltip = true,
  className,
}: McvBarChartProps) {
  const layout = horizontal ? 'vertical' : 'horizontal';

  return (
    <div className={cn('mcv-chart', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 4, right: 4, bottom: 0, left: horizontal ? 0 : -12 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.4}
            vertical={!horizontal}
            horizontal={horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey={xAxisKey} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            </>
          )}
          {showTooltip && (
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
          )}
          {dataKeys.map((dk, i) => {
            const color = dk.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label ?? dk.key}
                fill={color}
                radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                maxBarSize={40}
              />
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
