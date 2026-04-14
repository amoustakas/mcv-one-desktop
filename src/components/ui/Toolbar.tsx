import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  sticky?: boolean;
  dense?: boolean;
  className?: string;
}

export default function Toolbar({ left, center, right, sticky, dense, className }: ToolbarProps) {
  return (
    <div className={cn('mcv-toolbar', sticky && 'mcv-toolbar-sticky', dense && 'mcv-toolbar-dense', className)}>
      {left && <div className="mcv-toolbar-left">{left}</div>}
      {center && <div className="mcv-toolbar-center">{center}</div>}
      {right && <div className="mcv-toolbar-right">{right}</div>}
    </div>
  );
}

export function ToolbarSeparator() {
  return <span className="mcv-toolbar-sep" aria-hidden />;
}
