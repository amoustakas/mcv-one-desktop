import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { sheetUp } from './variants';

interface SheetMotionProps {
  children: ReactNode;
  className?: string;
}

export default function SheetMotion({ children, className }: SheetMotionProps) {
  return (
    <motion.div
      className={className}
      variants={sheetUp}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
