import { useRef, type ChangeEvent } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  /**
   * Include time (uses datetime-local instead of date).
   * Value format becomes "YYYY-MM-DDTHH:mm" instead of "YYYY-MM-DD".
   */
  withTime?: boolean;
}

/**
 * Styled wrapper over native <input type="date|datetime-local">.
 * Consistent with our form-state tokens and primitive patterns — no
 * third-party calendar dependency, zero bundle cost, and browser-native
 * keyboard/typeahead support.
 */
export default function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  error,
  clearable = true,
  placeholder,
  size = 'md',
  className,
  ariaLabel,
  withTime = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || null);
  };

  const openPicker = () => {
    if (disabled) return;
    // showPicker() was added in Chrome 99 / Safari 16 / Firefox 101. Fall back
    // to focus() for older browsers — the user can still use the native picker.
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try { input.showPicker(); return; } catch { /* fall through */ }
    }
    input.focus();
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div
      className={cn(
        'mcv-datepicker',
        `mcv-datepicker-${size}`,
        error && 'mcv-datepicker-error',
        disabled && 'mcv-datepicker-disabled',
        !value && 'mcv-datepicker-empty',
        className,
      )}
      onClick={openPicker}
      role="group"
      aria-label={ariaLabel}
    >
      <Calendar size={14} className="mcv-datepicker-icon" />
      <input
        ref={inputRef}
        type={withTime ? 'datetime-local' : 'date'}
        className="mcv-datepicker-input"
        value={value || ''}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {clearable && value && !disabled && (
        <button
          type="button"
          className="mcv-datepicker-clear"
          aria-label="Clear date"
          onClick={clear}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
