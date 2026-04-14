import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function Toggle({
  pressed,
  onPressedChange,
  children,
  size = 'md',
  disabled,
  className,
  ariaLabel,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      className={cn('mcv-toggle', `mcv-toggle-${size}`, pressed && 'mcv-toggle-pressed', disabled && 'mcv-toggle-disabled', className)}
      onClick={() => !disabled && onPressedChange(!pressed)}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn('mcv-toggle-group', className)}>
      {options.map((opt) => (
        <Toggle
          key={opt.value}
          pressed={value === opt.value}
          onPressedChange={() => onChange(opt.value)}
          size={size}
        >
          {opt.icon}
          {opt.label}
        </Toggle>
      ))}
    </div>
  );
}
