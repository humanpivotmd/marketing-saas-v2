'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-11 w-full px-4 text-base
            bg-bg-tertiary text-text-primary
            border rounded-lg
            placeholder:text-text-tertiary
            transition-all duration-[var(--transition-normal)]
            focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent
            ${hasError
              ? 'border-accent-error focus:ring-accent-error'
              : 'border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.2)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-accent-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
