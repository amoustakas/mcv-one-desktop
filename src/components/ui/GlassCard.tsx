import type { ReactNode, CSSProperties, MouseEvent } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: 'default' | 'neural' | 'elevated';
  glow?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export default function GlassCard({ children, className, style, variant = 'default', glow, onClick }: GlassCardProps) {
  return (
    <div
      className={cn(
        'mcv-glass-card',
        variant === 'neural' && 'mcv-glass-neural',
        variant === 'elevated' && 'mcv-glass-elevated',
        glow && 'mcv-glass-glow',
        onClick && 'mcv-glass-clickable',
        className,
      )}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
