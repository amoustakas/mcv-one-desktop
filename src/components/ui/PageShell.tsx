import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Scrollable content area */
  scroll?: boolean;
}

export default function PageShell({ children, className, scroll = true }: PageShellProps) {
  return (
    <div className={cn('mcv-page-shell', scroll && 'mcv-page-shell-scroll', className)}>
      {children}
    </div>
  );
}
