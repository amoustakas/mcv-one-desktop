import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selectedCount?: number;
  onClearSelection?: () => void;
  bulkActions?: { label: string; icon?: ReactNode; onClick: () => void; variant?: 'default' | 'danger' }[];
  actions?: ReactNode;
  className?: string;
}

export default function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  actions,
  className,
}: TableToolbarProps) {
  // Bulk action mode
  if (selectedCount > 0) {
    return (
      <div className={cn('mcv-toolbar', className)}>
        <div className="mcv-bulk-bar" style={{ flex: 1 }}>
          <span className="mcv-bulk-count">{selectedCount}</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>selected</span>
          <div className="mcv-bulk-actions">
            {bulkActions?.map((action) => (
              <button
                key={action.label}
                className={cn(
                  'mcv-btn mcv-btn-sm',
                  action.variant === 'danger' ? 'mcv-btn-danger' : 'mcv-btn-ghost',
                )}
                onClick={action.onClick}
                type="button"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {onClearSelection && (
              <>
                <span className="mcv-toolbar-divider" />
                <button
                  className="mcv-btn mcv-btn-ghost mcv-btn-sm"
                  onClick={onClearSelection}
                  type="button"
                >
                  <X size={12} />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal toolbar
  return (
    <div className={cn('mcv-toolbar', className)}>
      {onSearchChange && (
        <div className="mcv-toolbar-search">
          <div className="mcv-input-wrapper">
            <span className="mcv-input-icon"><Search size={13} /></span>
            <input
              className="mcv-input mcv-input-with-icon"
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}
      {actions && (
        <div className="mcv-toolbar-actions">
          {actions}
        </div>
      )}
    </div>
  );
}

export type { TableToolbarProps };
