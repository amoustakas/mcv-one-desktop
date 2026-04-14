import type { ReactNode, ElementType } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from './variants';

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export default function StaggerList({ children, className, as = 'div' }: StaggerListProps) {
  const Tag = motion(as);
  return (
    <Tag className={className} variants={staggerContainer} initial="hidden" animate="show">
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
