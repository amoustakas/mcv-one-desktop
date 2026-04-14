import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BulkAction {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** When true, this action is styled as destructive (red). */
  danger?: boolean;
  /** When true, confirms with window.confirm() before firing. */
  confirm?: boolean | string;
  /** Disable individual action without hiding it. */
  disabled?: boolean;
  onRun: (selectedIds: string[]) => void | Promise<void>;
}

interface BulkActionBarProps {
  /** IDs of currently selected rows */
  selectedIds: string[];
  /** Called when user clicks "Clear selection" or an action finishes. */
  onClear: () => void;
  /** Action buttons — shown left-to-right. Destructive actions group separately on the right by convention. */
  actions: BulkAction[];
  /** Custom selection-count label (default: "N selected"). */
  label?: (count: number) => ReactNode;
  /** Optional "Select all" handler — shown when fewer items selected than a total. */
  onSelectAll?: () => void;
  totalCount?: number;
  /** Where to anchor the bar — 'inline' (in normal flow) or 'floating' (fixed at bottom). Default inline. */
  placement?: 'inline' | 'floating';
  className?: string;
}

/**
 * Appears when at least one row is selected. Slides up from the bottom
 * when placement="floating", or renders inline in the document flow.
 * Actions support `confirm` for destructive operations and auto-clear
 * selection after running.
 */
export default function BulkActionBar({
  selectedIds,
  onClear,
  actions,
  label,
  onSelectAll,
  totalCount,
  placement = 'inline',
  className,
}: BulkActionBarProps) {
  const count = selectedIds.length;
  const visible = count > 0;

  const labelNode = label ? label(count) : `${count} selected`;
  const canSelectAll = onSelectAll && totalCount !== undefined && count < totalCount;

  const runAction = async (action: BulkAction) => {
    if (action.disabled) return;
    if (action.confirm) {
      const msg = typeof action.confirm === 'string'
        ? action.confirm
        : `Run this action on ${count} item${count === 1 ? '' : 's'}?`;
      if (!window.confirm(msg)) return;
    }
    await action.onRun(selectedIds);
    onClear();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn('mcv-bulk-bar', `mcv-bulk-bar-${placement}`, className)}
          initial={{ y: placement === 'floating' ? 40 : 0, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: placement === 'floating' ? 40 : 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="toolbar"
          aria-label={`Bulk actions for ${count} selected items`}
        >
          <div className="mcv-bulk-bar-left">
            <span className="mcv-bulk-bar-count">
              <Check size={12} />
              {labelNode}
            </span>
            {canSelectAll && (
              <button type="button" className="mcv-bulk-bar-selectall" onClick={onSelectAll}>
                Select all {totalCount}
              </button>
            )}
          </div>

          <div className="mcv-bulk-bar-actions">
            {actions.filter((a) => !a.danger).map((a) => (
              <button
                key={a.id}
                type="button"
                className="mcv-bulk-bar-action"
                onClick={() => runAction(a)}
                disabled={a.disabled}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
            {actions.filter((a) => a.danger).length > 0 && <span className="mcv-bulk-bar-sep" aria-hidden />}
            {actions.filter((a) => a.danger).map((a) => (
              <button
                key={a.id}
                type="button"
                className="mcv-bulk-bar-action mcv-bulk-bar-action-danger"
                onClick={() => runAction(a)}
                disabled={a.disabled}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
            <span className="mcv-bulk-bar-sep" aria-hidden />
            <button type="button" className="mcv-bulk-bar-clear" onClick={onClear} aria-label="Clear selection">
              <X size={12} /> Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
