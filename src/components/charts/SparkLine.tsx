import { useMemo } from 'react';
import { cn } from '../../lib/utils';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export default function SparkLine({
  data,
  width = 80,
  height = 24,
  color,
  showArea = false,
  className,
}: SparkLineProps) {
  const gradientId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  const { path, areaPath, lastPoint, resolvedColor } = useMemo(() => {
    if (!data.length) return { path: '', areaPath: '', lastPoint: null, resolvedColor: 'var(--cyan)' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padX = 2;
    const padY = 2;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const points = data.map((v, i) => ({
      x: padX + (i / Math.max(data.length - 1, 1)) * innerW,
      y: padY + innerH - ((v - min) / range) * innerH,
    }));

    // Auto color based on trend unless explicitly provided
    const rc = color ?? (data[data.length - 1] >= data[0] ? 'var(--success)' : 'var(--error)');

    // Build smooth bezier path
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    // Area path closes down to bottom
    const area = `${d} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
    const last = points[points.length - 1];

    return { path: d, areaPath: area, lastPoint: last, resolvedColor: rc };
  }, [data, width, height, color]);

  if (!data.length) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('mcv-sparkline', className)}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill={resolvedColor}
        />
      )}
    </svg>
  );
}
