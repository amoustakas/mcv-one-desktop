import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GridLayoutProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GridLayout({ children, cols = 4, gap = 'md', className }: GridLayoutProps) {
  return (
    <div className={cn('mcv-grid', `mcv-grid-${cols}`, `mcv-grid-gap-${gap}`, className)}>
      {children}
    </div>
  );
}
