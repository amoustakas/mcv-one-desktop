import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { modalScale, backdrop } from './variants';

interface ModalMotionProps {
  children: ReactNode;
  className?: string;
}

export default function ModalMotion({ children, className }: ModalMotionProps) {
  return (
    <motion.div
      className={className}
      variants={modalScale}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export function BackdropMotion({ children, className, onClick }: { children?: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      className={className}
      variants={backdrop}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
