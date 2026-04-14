import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import ModalMotion, { BackdropMotion } from '../../lib/motion/ModalMotion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function Modal({
  open,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
  ariaLabel,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) onClose();
      if (e.key === 'Tab' && contentRef.current) {
        const focusables = contentRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    queueMicrotask(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [open, closeOnEsc, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="mcv-modal-root" role="dialog" aria-modal="true" aria-label={ariaLabel}>
          <BackdropMotion
            className="mcv-modal-backdrop"
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <ModalMotion className={cn('mcv-modal-container', `mcv-modal-${size}`, className)}>
            <div ref={contentRef} className="mcv-modal-content">
              {children}
            </div>
          </ModalMotion>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
