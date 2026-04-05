import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercentage } from '../../lib/utils';
import Skeleton from './Skeleton';
import SparkLine from '../charts/SparkLine';

interface KpiCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  sparklineData?: number[];
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'neural';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

export default function KpiCard({
  title,
  value,
  prefix,
  suffix,
  change,
  trend,
  sparklineData,
  icon,
  size = 'md',
  variant = 'default',
  isLoading = false,
  onClick,
  className,
}: KpiCardProps) {
  const resolvedTrend = trend ?? (change != null ? (change > 0 ? 'up' : change < 0 ? 'down' : 'flat') : undefined);
  const TrendIcon = resolvedTrend ? trendIcons[resolvedTrend] : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          'mcv-kpi',
          size !== 'md' && `mcv-kpi-${size}`,
          variant === 'glass' && 'mcv-glass-card',
          variant === 'neural' && 'mcv-glass-card mcv-glass-neural',
          variant === 'default' && 'mcv-glass-card',
          className,
        )}
      >
        <div className="mcv-kpi-header">
          <Skeleton width={80} height={10} />
        </div>
        <div className="mcv-kpi-body">
          <Skeleton width={100} height={size === 'lg' ? 28 : size === 'sm' ? 16 : 22} />
        </div>
        <div className="mcv-kpi-footer">
          <Skeleton width={50} height={12} />
          {sparklineData && <Skeleton width={80} height={24} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mcv-kpi',
        size !== 'md' && `mcv-kpi-${size}`,
        variant === 'glass' && 'mcv-glass-card',
        variant === 'neural' && 'mcv-glass-card mcv-glass-neural',
        variant === 'default' && 'mcv-glass-card',
        onClick && 'mcv-kpi-clickable',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="mcv-kpi-header">
        <span className="mcv-kpi-label">{title}</span>
        {icon && <span className="mcv-kpi-icon">{icon}</span>}
      </div>

      <div className="mcv-kpi-body">
        {prefix && <span className="mcv-kpi-prefix">{prefix}</span>}
        <span className="mcv-kpi-value">{value}</span>
        {suffix && <span className="mcv-kpi-suffix">{suffix}</span>}
      </div>

      {(resolvedTrend || sparklineData) && (
        <div className="mcv-kpi-footer">
          {resolvedTrend && change != null && (
            <span className={cn('mcv-kpi-trend', `mcv-kpi-trend-${resolvedTrend}`)}>
              {TrendIcon && <TrendIcon size={12} />}
              {formatPercentage(change)}
            </span>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <span className="mcv-kpi-sparkline">
              <SparkLine data={sparklineData} showArea />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
