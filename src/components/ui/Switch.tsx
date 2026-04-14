import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  className,
  ariaLabel,
}: SwitchProps) {
  const toggle = () => !disabled && onChange(!checked);

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      className={cn(
        'mcv-switch',
        `mcv-switch-${size}`,
        checked && 'mcv-switch-on',
        disabled && 'mcv-switch-disabled'
      )}
      onClick={toggle}
      disabled={disabled}
    >
      <span className="mcv-switch-thumb" />
    </button>
  );

  if (!label && !description) return <span className={className}>{control}</span>;

  return (
    <label className={cn('mcv-switch-field', disabled && 'mcv-switch-field-disabled', className)}>
      {control}
      <span className="mcv-switch-labels">
        {label && <span className="mcv-switch-label">{label}</span>}
        {description && <span className="mcv-switch-desc">{description}</span>}
      </span>
    </label>
  );
}
