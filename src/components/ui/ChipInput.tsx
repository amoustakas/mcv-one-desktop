import { useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Max chips allowed. */
  max?: number;
  /** Validator — reject new values that fail (e.g. email regex). */
  validate?: (value: string) => boolean | string;
  /** Transform value before adding (e.g. toLowerCase()). */
  normalize?: (value: string) => string;
  /**
   * Keys that finalize a chip. Default: Enter, comma, Tab.
   * Space is intentionally excluded by default so multi-word tags work.
   */
  splitOn?: string[];
  ariaLabel?: string;
}

const DEFAULT_SPLIT = [',', 'Enter', 'Tab'];

/**
 * Tag-style input — users type a value and press Enter/comma/Tab to add
 * it as a chip. Backspace on empty input removes the last chip. Pasting
 * comma-separated text adds all values at once.
 */
export default function ChipInput({
  value,
  onChange,
  placeholder = 'Add tag…',
  disabled,
  error,
  className,
  size = 'md',
  max,
  validate,
  normalize,
  splitOn = DEFAULT_SPLIT,
  ariaLabel,
}: ChipInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const commit = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    const normalized = normalize ? normalize(trimmed) : trimmed;
    if (value.includes(normalized)) { setDraft(''); return false; } // silent dedupe
    if (max !== undefined && value.length >= max) {
      setValidationError(`Max ${max} items allowed`);
      return false;
    }
    if (validate) {
      const result = validate(normalized);
      if (result !== true) {
        setValidationError(typeof result === 'string' ? result : 'Invalid value');
        return false;
      }
    }
    setValidationError(null);
    onChange([...value, normalized]);
    setDraft('');
    return true;
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    setValidationError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (splitOn.includes(e.key)) {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',') || text.includes('\n')) {
      e.preventDefault();
      text.split(/[,\n]+/).forEach((part) => commit(part));
    }
  };

  return (
    <div
      className={cn(
        'mcv-chip-input',
        `mcv-chip-input-${size}`,
        error && 'mcv-chip-input-error',
        validationError && 'mcv-chip-input-error',
        disabled && 'mcv-chip-input-disabled',
        className,
      )}
      onClick={() => inputRef.current?.focus()}
      role="group"
      aria-label={ariaLabel}
    >
      {value.map((chip, idx) => (
        <span key={`${chip}-${idx}`} className="mcv-chip">
          <span className="mcv-chip-label">{chip}</span>
          {!disabled && (
            <button
              type="button"
              className="mcv-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeAt(idx); }}
              aria-label={`Remove ${chip}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="mcv-chip-input-field"
        value={draft}
        onChange={(e) => { setDraft(e.target.value); setValidationError(null); }}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) commit(draft); }}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
      />
      {validationError && <span className="mcv-chip-input-msg">{validationError}</span>}
    </div>
  );
}
