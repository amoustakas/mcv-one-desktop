import { useState, useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

/* ─── Types ──────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  createdAt: number;
}

/* ─── Store ──────────────────────────────────────────────────────── */

interface ToastStore {
  toasts: Toast[];
  _add: (type: ToastType, message: string, description?: string) => void;
  _remove: (id: string) => void;
}

const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  _add: (type, message, description) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({
      toasts: [...s.toasts.slice(-(4)), { id, type, message, description, createdAt: Date.now() }],
    }));
  },

  _remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/* ─── Public hook ────────────────────────────────────────────────── */

export function useToast() {
  const add = useToastStore((s) => s._add);
  const toast = useCallback(
    (type: ToastType, message: string, description?: string) => add(type, message, description),
    [add],
  );
  return { toast };
}

/* ─── Helpers ────────────────────────────────────────────────────── */

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--cyan)',
};

const AUTO_DISMISS_MS = 4000;

/* ─── Single Toast ───────────────────────────────────────────────── */

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [dismiss]);

  const Icon = ICONS[toast.type];
  const color = COLORS[toast.type];

  return (
    <div
      className={cn('mcv-toast', exiting ? 'mcv-toast-exit' : 'mcv-toast-enter')}
      style={{ '--toast-color': color } as React.CSSProperties}
      role="alert"
    >
      <span className="mcv-toast-icon">
        <Icon size={16} />
      </span>
      <div className="mcv-toast-body">
        <span className="mcv-toast-msg">{toast.message}</span>
        {toast.description && <span className="mcv-toast-desc">{toast.description}</span>}
      </div>
      <button className="mcv-toast-close" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Container ──────────────────────────────────────────────────── */

export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s._remove);

  if (toasts.length === 0) return null;

  return (
    <div className="mcv-toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={remove} />
      ))}

      <style>{`
        .mcv-toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9000;
          display: flex;
          flex-direction: column-reverse;
          gap: 8px;
          pointer-events: none;
          max-height: calc(100vh - 40px);
        }

        .mcv-toast {
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          min-width: 300px;
          max-width: 420px;
          background: rgba(10, 22, 40, 0.82);
          border: 1px solid rgba(0, 245, 255, 0.08);
          border-left: 3px solid var(--toast-color);
          border-radius: var(--radius-md);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.45),
            0 0 1px rgba(0, 245, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        /* Enter animation */
        .mcv-toast-enter {
          animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Exit animation */
        .mcv-toast-exit {
          animation: toastSlideOut 0.28s cubic-bezier(0.5, 0, 0.75, 0) forwards;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
          }
        }

        .mcv-toast-icon {
          color: var(--toast-color);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .mcv-toast-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .mcv-toast-msg {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.35;
        }

        .mcv-toast-desc {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .mcv-toast-close {
          flex-shrink: 0;
          padding: 2px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: color 0.15s, background 0.15s;
          margin-top: 1px;
        }

        .mcv-toast-close:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
