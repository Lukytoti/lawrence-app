import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-txt-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-bg-surface border ${
              error ? 'border-red-500/80 focus:ring-red-500' : 'border-border-subtle focus:border-wine-primary focus:ring-wine-primary'
            } text-txt-primary placeholder:text-zinc-500 text-sm rounded-md px-3.5 py-2.5 transition-all duration-150 outline-none focus:ring-1 ${
              leftIcon ? 'pl-9' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs text-red-400 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-txt-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
