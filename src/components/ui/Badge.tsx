import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  variant?: 'default' | 'outline' | 'dot';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, color, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'mcv-badge',
        `mcv-badge-${variant}`,
        `mcv-badge-${size}`,
        className,
      )}
      style={color ? {
        '--badge-color': color,
        color: variant === 'outline' ? color : undefined,
        borderColor: variant === 'outline' ? `${color}40` : undefined,
        background: variant === 'default' ? `${color}20` : undefined,
      } as React.CSSProperties : undefined}
    >
      {variant === 'dot' && <span className="mcv-badge-dot" style={color ? { background: color } : undefined} />}
      {children}
    </span>
  );
}
