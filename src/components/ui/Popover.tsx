import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  side?: Side;
  align?: Align;
  className?: string;
}

export default function Popover({ open, onClose, anchorRef, children, side = 'bottom', align = 'start', className }: PopoverProps) {
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      if (!anchorRef.current || !ref.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const p = ref.current.getBoundingClientRect();
      const gap = 6;
      let top = 0, left = 0;
      if (side === 'bottom') top = r.bottom + gap;
      else if (side === 'top') top = r.top - p.height - gap;
      else if (side === 'left') { top = r.top; left = r.left - p.width - gap; }
      else { top = r.top; left = r.right + gap; }
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') left = r.left;
        else if (align === 'end') left = r.right - p.width;
        else left = r.left + r.width / 2 - p.width / 2;
      }
      setPos({
        top: Math.max(4, Math.min(top, window.innerHeight - p.height - 4)),
        left: Math.max(4, Math.min(left, window.innerWidth - p.width - 4)),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, side, align, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div ref={ref} className={cn('mcv-popover', className)} style={{ top: pos.top, left: pos.left }}>
      {children}
    </div>,
    document.body
  );
}
