import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
  color?: string;
  className?: string;
}

export default function StatCard({ icon, label, value, trend, color, className }: StatCardProps) {
  return (
    <div className={cn('mcv-stat-card', className)}>
      {icon && <span className="mcv-stat-icon" style={color ? { color } : undefined}>{icon}</span>}
      <div className="mcv-stat-body">
        <span className="mcv-stat-value">{value}</span>
        <span className="mcv-stat-label">{label}</span>
      </div>
      {trend && (
        <span className={cn('mcv-stat-trend', trend.value >= 0 ? 'mcv-stat-trend-up' : 'mcv-stat-trend-down')}>
          {trend.value >= 0 ? '+' : ''}{trend.value}%
          {trend.label && <span className="mcv-stat-trend-label">{trend.label}</span>}
        </span>
      )}
    </div>
  );
}
