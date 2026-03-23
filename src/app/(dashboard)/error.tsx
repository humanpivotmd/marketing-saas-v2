'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-accent-error/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-accent-error">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          페이지 로딩 중 오류가 발생했습니다
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          잠시 후 다시 시도하거나, 문제가 계속되면 고객지원에 문의해 주세요.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button size="sm" onClick={reset}>
            다시 시도
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            대시보드로 이동
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-text-tertiary mt-4">
            오류 코드: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
