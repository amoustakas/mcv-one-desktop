import { useState, useRef, useEffect, type ReactNode, type ReactElement, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: Side;
  delay?: number;
  className?: string;
}

export default function Tooltip({ content, children, side = 'top', delay = 400, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const gap = 8;
    let top = 0, left = 0;
    switch (side) {
      case 'top':    top = r.top - t.height - gap; left = r.left + r.width / 2 - t.width / 2; break;
      case 'bottom': top = r.bottom + gap;         left = r.left + r.width / 2 - t.width / 2; break;
      case 'left':   top = r.top + r.height / 2 - t.height / 2; left = r.left - t.width - gap; break;
      case 'right':  top = r.top + r.height / 2 - t.height / 2; left = r.right + gap; break;
    }
    setPos({ top: Math.max(4, top), left: Math.max(4, left) });
  }, [open, side]);

  const child = cloneElement(children, {
    ref: (el: HTMLElement) => { triggerRef.current = el; },
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  } as Record<string, unknown>);

  return (
    <>
      {child}
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className={cn('mcv-tooltip', `mcv-tooltip-${side}`, className)}
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
