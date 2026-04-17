'use client';

import { useEffect, useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
  visible: boolean;
}

const variantConfig: Record<
  ToastVariant,
  { bg: string; border: string; icon: string }
> = {
  success: {
    bg: 'bg-accent-success/10',
    border: 'border-accent-success/20',
    icon: '\u2713',
  },
  error: {
    bg: 'bg-accent-error/10',
    border: 'border-accent-error/20',
    icon: '\u2717',
  },
  warning: {
    bg: 'bg-accent-warning/10',
    border: 'border-accent-warning/20',
    icon: '!',
  },
  info: {
    bg: 'bg-accent-primary/10',
    border: 'border-accent-primary/20',
    icon: 'i',
  },
};

const textColors: Record<ToastVariant, string> = {
  success: 'text-accent-success',
  error: 'text-accent-error',
  warning: 'text-accent-warning',
  info: 'text-accent-primary',
};

const iconBgColors: Record<ToastVariant, string> = {
  success: 'bg-accent-success/10',
  error: 'bg-accent-error/10',
  warning: 'bg-accent-warning/10',
  info: 'bg-accent-primary/10',
};

export default function Toast({
  message,
  variant = 'info',
  duration = 4000,
  onClose,
  visible,
}: ToastProps) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, handleClose]);

  if (!visible) return null;

  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
        pb-[env(safe-area-inset-bottom)]
        flex items-center gap-3
        px-5 py-3 rounded-xl
        border ${config.bg} ${config.border}
        shadow-lg backdrop-blur-sm
        ${exiting ? 'animate-[slide-down_200ms_ease-in_forwards]' : 'animate-[slide-up_300ms_ease-out]'}
      `}
    >
      <span
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-bold ${textColors[variant]} ${iconBgColors[variant]}
        `}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <p className="text-sm text-text-primary font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="ml-2 text-text-tertiary hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
        aria-label="알림 닫기"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
