import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'neural' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SectionCard({
  title,
  description,
  icon,
  action,
  footer,
  children,
  variant = 'default',
  padding = 'md',
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'mcv-section-card',
        variant === 'neural' && 'mcv-glass-neural',
        variant === 'elevated' && 'mcv-glass-elevated',
        `mcv-section-pad-${padding}`,
        className,
      )}
    >
      {(title || action) && (
        <header className="mcv-section-header">
          <div className="mcv-section-titles">
            {icon && <span className="mcv-section-icon">{icon}</span>}
            <div>
              {title && <h3 className="mcv-section-title">{title}</h3>}
              {description && <p className="mcv-section-desc">{description}</p>}
            </div>
          </div>
          {action && <div className="mcv-section-action">{action}</div>}
        </header>
      )}
      <div className="mcv-section-body">{children}</div>
      {footer && <footer className="mcv-section-footer">{footer}</footer>}
    </section>
  );
}
