import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  count?: number;
  children?: ReactNode; // right-side actions
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function PageHeader({ icon, title, subtitle, count, children, loading, onRefresh, className }: PageHeaderProps) {
  return (
    <div className={cn('mcv-page-header', className)}>
      {icon && <span className="mcv-page-header-icon">{icon}</span>}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <h1 className="mcv-page-header-title">{title}</h1>
        {subtitle && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</span>}
      </div>
      {count !== undefined && <span className="mcv-page-header-count">{count}</span>}
      <div className="mcv-page-header-actions">
        {children}
        {onRefresh && (
          <button className="mcv-page-header-refresh" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'mcv-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
