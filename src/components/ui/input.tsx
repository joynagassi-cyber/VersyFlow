import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps =
  & React.InputHTMLAttributes<HTMLInputElement>
  & {
    /** Optional label rendered above the input */
    label?: string;
  };

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, type, ...props }, ref) => {
    if (label) {
      return (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">{label}</span>
          <input
            type={type}
            ref={ref}
            className={cn(
              'h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-placeholder focus:border-primary',
              className,
            )}
            {...props}
          />
        </label>
      );
    }
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-placeholder focus:border-primary',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
