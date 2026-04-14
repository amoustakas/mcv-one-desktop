import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import SheetMotion from '../../lib/motion/SheetMotion';
import { BackdropMotion } from '../../lib/motion/ModalMotion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  side?: 'bottom' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export default function Sheet({
  open,
  onClose,
  children,
  title,
  side = 'bottom',
  size = 'md',
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('mcv-sheet-root', `mcv-sheet-side-${side}`)} role="dialog" aria-modal="true">
          <BackdropMotion className="mcv-modal-backdrop" onClick={onClose} />
          <SheetMotion className={cn('mcv-sheet', `mcv-sheet-${size}`, className)}>
            {title && (
              <div className="mcv-sheet-header">
                <h3 className="mcv-sheet-title">{title}</h3>
                <button type="button" className="mcv-dialog-close" aria-label="Close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="mcv-sheet-body">{children}</div>
          </SheetMotion>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
