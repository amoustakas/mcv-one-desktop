import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hideClose?: boolean;
  className?: string;
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose,
  className,
}: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} size={size} className={className} ariaLabel={typeof title === 'string' ? title : undefined}>
      {(title || !hideClose) && (
        <div className="mcv-dialog-header">
          <div className="mcv-dialog-titles">
            {title && <h2 className="mcv-dialog-title">{title}</h2>}
            {description && <p className="mcv-dialog-desc">{description}</p>}
          </div>
          {!hideClose && (
            <button
              type="button"
              className="mcv-dialog-close"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {children && <div className={cn('mcv-dialog-body')}>{children}</div>}
      {footer && <div className="mcv-dialog-footer">{footer}</div>}
    </Modal>
  );
}

export function DialogActions({ children, align = 'end' }: { children: ReactNode; align?: 'start' | 'end' | 'between' }) {
  return <div className={cn('mcv-dialog-actions', `mcv-dialog-actions-${align}`)}>{children}</div>;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <DialogActions>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogActions>
      }
    />
  );
}
