import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { slideUp } from './variants';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      variants={slideUp}
      initial="hidden"
      animate="show"
      exit="exit"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
