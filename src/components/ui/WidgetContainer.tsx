import { useState, type ReactNode } from 'react';
import { RotateCw, Maximize2, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'glass' | 'neural';
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onMaximize?: () => void;
  collapsible?: boolean;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export default function WidgetContainer({
  title,
  subtitle,
  icon,
  variant = 'default',
  isLoading = false,
  error,
  onRefresh,
  onMaximize,
  collapsible = false,
  flush = false,
  className,
  children,
}: WidgetContainerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'mcv-widget',
        variant === 'glass' && 'mcv-glass-card',
        variant === 'neural' && 'mcv-glass-card mcv-glass-neural',
        variant === 'default' && 'mcv-glass-card',
        collapsed && 'mcv-widget-collapsed',
        className,
      )}
    >
      <div className="mcv-widget-header">
        <span className="mcv-widget-accent" />
        {icon && <span className="mcv-kpi-icon">{icon}</span>}
        <span className="mcv-widget-title">{title}</span>
        {subtitle && <span className="mcv-widget-subtitle">{subtitle}</span>}
        <div className="mcv-widget-actions">
          {onRefresh && (
            <button
              className="mcv-widget-action"
              onClick={onRefresh}
              title="Refresh"
              type="button"
            >
              <RotateCw size={13} className={isLoading ? 'mcv-spin' : undefined} />
            </button>
          )}
          {onMaximize && (
            <button
              className="mcv-widget-action"
              onClick={onMaximize}
              title="Maximize"
              type="button"
            >
              <Maximize2 size={13} />
            </button>
          )}
          {collapsible && (
            <button
              className="mcv-widget-action"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
              type="button"
            >
              <ChevronDown
                size={13}
                style={{
                  transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>
          )}
        </div>
      </div>

      <div className={cn('mcv-widget-body', flush && 'mcv-widget-body-flush')}>
        {isLoading && (
          <div className="mcv-widget-loading">
            <RotateCw size={18} className="mcv-spin" style={{ color: 'var(--cyan)' }} />
          </div>
        )}

        {error ? (
          <div className="mcv-widget-error">
            <AlertCircle size={20} style={{ color: 'var(--error)' }} />
            <span className="mcv-widget-error-msg">{error}</span>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                Retry
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
