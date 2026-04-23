import { GlassCard, Skeleton } from '../ui';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 3, columns = 5 }: TableSkeletonProps) {
  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr
              key={r}
              style={{ borderTop: r === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
            >
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} style={{ padding: '14px 12px' }}>
                  <Skeleton variant="text" width={c === 0 ? '70%' : '55%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
