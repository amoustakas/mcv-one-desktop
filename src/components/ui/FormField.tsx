import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export default function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
  orientation = 'vertical',
}: FormFieldProps) {
  return (
    <div className={cn('mcv-field', `mcv-field-${orientation}`, error ? 'mcv-field-has-error' : null, className)}>
      {label && (
        <label className="mcv-field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="mcv-field-required" aria-hidden> *</span>}
        </label>
      )}
      <div className="mcv-field-control">
        {children}
        {hint && !error && <span className="mcv-field-hint">{hint}</span>}
        {error && (
          <span className="mcv-field-error" role="alert">
            <AlertCircle size={12} /> {error}
          </span>
        )}
      </div>
    </div>
  );
}
