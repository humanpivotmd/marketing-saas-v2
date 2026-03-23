'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-accent-error/10 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-accent-error">
            <path
              d="M12 9v4m0 4h.01M12 2L2 20h20L12 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">
          문제가 발생했습니다
        </h1>
        <p className="text-text-secondary mb-8">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          <br />
          문제가 계속되면 고객지원에 문의해 주세요.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>
            다시 시도
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            홈으로 돌아가기
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-text-tertiary mt-6">
            오류 코드: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
