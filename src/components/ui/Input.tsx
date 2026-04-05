import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  variant?: 'default' | 'ghost';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, variant = 'default', className, ...props }, ref) => {
    if (icon) {
      return (
        <div className={cn('mcv-input-wrapper', className)}>
          <span className="mcv-input-icon">{icon}</span>
          <input ref={ref} className={cn('mcv-input', `mcv-input-${variant}`, 'mcv-input-with-icon')} {...props} />
        </div>
      );
    }
    return <input ref={ref} className={cn('mcv-input', `mcv-input-${variant}`, className)} {...props} />;
  },
);

Input.displayName = 'Input';
export default Input;
