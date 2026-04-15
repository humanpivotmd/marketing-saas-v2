'use client';

import { type InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const effectiveType = isPassword && showPassword ? 'text' : type;

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={`
              h-11 w-full px-4 text-base
              ${isPassword ? 'pr-12' : ''}
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
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-pressed={showPassword}
              tabIndex={0}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-text-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-md transition-colors"
            >
              {showPassword ? (
                /* eye-off icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                /* eye icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
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
