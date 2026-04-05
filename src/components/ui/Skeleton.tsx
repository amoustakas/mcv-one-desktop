import { cn } from '../../lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle';
  className?: string;
}

export default function Skeleton({ width, height, variant = 'text', className }: SkeletonProps) {
  return (
    <div
      className={cn('mcv-skeleton', `mcv-skeleton-${variant}`, 'shimmer', className)}
      style={{ width, height }}
    />
  );
}
