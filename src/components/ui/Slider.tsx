import type { ChangeEvent } from 'react';
import { cn } from '../../lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue,
  disabled,
  className,
  ariaLabel,
}: SliderProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));

  return (
    <div className={cn('mcv-slider', disabled && 'mcv-slider-disabled', className)}>
      {(label || showValue) && (
        <div className="mcv-slider-labels">
          {label && <span className="mcv-slider-label">{label}</span>}
          {showValue && (
            <span className="mcv-slider-value">{formatValue ? formatValue(value) : value}</span>
          )}
        </div>
      )}
      <div className="mcv-slider-track-wrap">
        <div className="mcv-slider-track" />
        <div className="mcv-slider-fill" style={{ width: `${pct}%` }} />
        <input
          type="range"
          className="mcv-slider-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handle}
          disabled={disabled}
          aria-label={ariaLabel || label}
        />
      </div>
    </div>
  );
}
