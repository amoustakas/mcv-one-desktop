import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '../../lib/utils';

const DEFAULT_COLORS = [
  'var(--cyan)',
  'var(--purple)',
  'var(--success)',
  'var(--warning)',
  'var(--core-blue)',
];

interface McvAreaChartProps {
  data: Record<string, unknown>[];
  dataKeys: { key: string; color?: string; label?: string }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
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

function ChartLegend({ payload }: {
  payload?: { value: string; color: string }[];
}) {
  if (!payload?.length) return null;
  return (
    <div className="mcv-chart-legend">
      {payload.map((entry) => (
        <div key={entry.value} className="mcv-chart-legend-item">
          <span className="mcv-chart-legend-dot" style={{ background: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function McvAreaChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  className,
}: McvAreaChartProps) {
  const gradientIds = useMemo(
    () => dataKeys.map((_, i) => `area-grad-${i}-${Math.random().toString(36).slice(2, 6)}`),
    [dataKeys],
  );

  return (
    <div className={cn('mcv-chart', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
          <defs>
            {dataKeys.map((dk, i) => {
              const color = dk.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <linearGradient key={gradientIds[i]} id={gradientIds[i]} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.4}
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          {showTooltip && (
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
            />
          )}
          {showLegend && <Legend content={<ChartLegend />} />}
          {dataKeys.map((dk, i) => {
            const color = dk.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label ?? dk.key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientIds[i]})`}
                dot={false}
                activeDot={{ r: 3, fill: color, stroke: 'var(--bg-deep)', strokeWidth: 2 }}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
