import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}

export default function Button({
  children, variant = 'secondary', size = 'md', icon, loading, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'mcv-btn',
        `mcv-btn-${variant}`,
        `mcv-btn-${size}`,
        loading && 'mcv-btn-loading',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="mcv-btn-spinner" /> : icon}
      {children}
    </button>
  );
}
