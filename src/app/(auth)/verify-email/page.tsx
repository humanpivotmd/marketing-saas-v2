'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('인증 토큰이 없습니다.')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success')
          setMessage(data.message || '이메일 인증이 완료되었습니다.')
        } else {
          setStatus('error')
          setMessage(data.error || '인증에 실패했습니다.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('네트워크 오류가 발생했습니다.')
      })
  }, [token])

  return (
    <div>
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">이메일 인증</h1>
      </div>

      <Card>
        <div className="text-center py-4">
          {status === 'loading' && (
            <>
              <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-label="로딩 중" />
              <p className="text-sm text-text-secondary">이메일 인증을 처리하고 있습니다...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 rounded-full bg-accent-success/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-success" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-medium text-text-primary mb-2">{message}</p>
              <a href="/login?verified=1">
                <Button className="mt-4">로그인하기</Button>
              </a>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-accent-error/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-error" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-base font-medium text-text-primary mb-2">{message}</p>
              <a href="/login">
                <Button variant="secondary" className="mt-4">로그인 페이지로</Button>
              </a>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
