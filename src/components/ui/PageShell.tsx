import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { slideUp } from '../../lib/motion/variants';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Scrollable content area */
  scroll?: boolean;
  /** Disable the built-in view-entry animation (rarely needed) */
  noMotion?: boolean;
}

/**
 * Every view in the app wraps its content in PageShell. By animating here,
 * all 74+ views get a consistent entrance animation without per-view changes.
 * Respects prefers-reduced-motion via the design-system CSS rule.
 */
export default function PageShell({ children, className, scroll = true, noMotion }: PageShellProps) {
  const classes = cn('mcv-page-shell', scroll && 'mcv-page-shell-scroll', className);

  if (noMotion) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      className={classes}
      variants={slideUp}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}
