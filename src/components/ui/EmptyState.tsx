import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('mcv-empty', className)}>
      {icon && <span className="mcv-empty-icon">{icon}</span>}
      <h3 className="mcv-empty-title">{title}</h3>
      {description && <p className="mcv-empty-desc">{description}</p>}
      {action && <div className="mcv-empty-action">{action}</div>}
    </div>
  );
}
