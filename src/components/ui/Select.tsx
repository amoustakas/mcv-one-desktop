import { useRef, useState, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import Popover from './Popover';

export interface SelectOption<T = string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectProps<T extends string | number = string> {
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export default function Select<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  error,
  className,
  size = 'md',
  ariaLabel,
}: SelectProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIdx(idx);
  }, [open, options, value]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIdx];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn('mcv-select', `mcv-select-${size}`, error && 'mcv-select-error', disabled && 'mcv-select-disabled', className)}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKey}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={cn('mcv-select-value', !selected && 'mcv-select-placeholder')}>
          {selected ? (
            <>
              {selected.icon && <span className="mcv-select-icon">{selected.icon}</span>}
              {selected.label}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={14} className={cn('mcv-select-chevron', open && 'mcv-select-chevron-open')} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} side="bottom" align="start" className="mcv-select-popover">
        <ul role="listbox" className="mcv-select-list">
          {options.map((opt, i) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              className={cn(
                'mcv-select-option',
                i === activeIdx && 'mcv-select-option-active',
                opt.value === value && 'mcv-select-option-selected',
                opt.disabled && 'mcv-select-option-disabled'
              )}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.icon && <span className="mcv-select-icon">{opt.icon}</span>}
              <span className="mcv-select-option-label">
                {opt.label}
                {opt.description && <span className="mcv-select-option-desc">{opt.description}</span>}
              </span>
              {opt.value === value && <Check size={14} className="mcv-select-check" />}
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
}
