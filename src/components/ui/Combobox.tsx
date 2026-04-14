import { useRef, useState, useMemo, useEffect, type ReactNode } from 'react';
import { Search, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Popover from './Popover';
import type { SelectOption } from './Select';

interface ComboboxProps<T extends string | number = string> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export default function Combobox<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  emptyLabel = 'No matches',
  disabled,
  clearable,
  className,
}: ComboboxProps<T>) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => {
      const label = typeof o.label === 'string' ? o.label.toLowerCase() : '';
      return label.includes(q) || String(o.value).toLowerCase().includes(q);
    });
  }, [options, query]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const commit = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const opt = filtered[activeIdx]; if (opt) commit(opt); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <>
      <div ref={triggerRef} className={cn('mcv-combobox', disabled && 'mcv-combobox-disabled', className)}>
        <button
          type="button"
          className="mcv-combobox-trigger"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
        >
          <span className={cn('mcv-combobox-value', !selected && 'mcv-combobox-placeholder')}>
            {selected ? selected.label : placeholder}
          </span>
          {clearable && selected && (
            <button
              type="button"
              className="mcv-combobox-clear"
              aria-label="Clear"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X size={12} />
            </button>
          )}
        </button>
      </div>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} className="mcv-combobox-popover">
        <div className="mcv-combobox-search">
          <Search size={14} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKey}
            placeholder={placeholder}
            className="mcv-combobox-input"
          />
        </div>
        <ul role="listbox" className="mcv-combobox-list">
          {filtered.length === 0 && <li className="mcv-combobox-empty">{emptyLabel}</li>}
          {filtered.map((opt, i) => (
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
              onClick={() => commit(opt)}
            >
              {opt.icon && <span className="mcv-select-icon">{opt.icon}</span>}
              <span className="mcv-select-option-label">{opt.label}</span>
              {opt.value === value && <Check size={14} className="mcv-select-check" />}
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
}
