'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Toast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import FlowGuard from '@/components/FlowGuard'

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

export default function GeneratingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('초안을 작성하고 있습니다...')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!projectId) return

    // 프로그레스 바 애니메이션
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 85))
    }, 500)

    // 초안 생성 요청
    fetch('/api/generate/draft', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ project_id: projectId }),
    })
      .then(r => r.json())
      .then(data => {
        clearInterval(interval)
        if (!data.success) {
          setError(data.error || '초안 생성 실패')
          return
        }
        setProgress(100)
        setStatus('초안 작성 완료! 채널별 콘텐츠를 생성합니다...')

        // 채널별 생성 페이지로 이동
        setTimeout(() => {
          router.replace(`/create/channel-write?project_id=${projectId}`)
        }, 1000)
      })
      .catch(err => {
        clearInterval(interval)
        setError((err as Error).message || '초안 생성 실패')
      })

    return () => clearInterval(interval)
  }, [projectId, router])

  return (
    <FlowGuard projectId={projectId} requiredStep={4}>
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full text-center p-8">
        {error ? (
          <div className="space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-text-primary font-medium">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" onClick={() => router.back()}>이전으로</Button>
              <Button onClick={() => window.location.reload()}>다시 시도</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 로딩 애니메이션 */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-border-primary" />
              <div
                className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"
              />
            </div>

            <div>
              <p className="text-text-primary font-medium">{status}</p>
              <p className="text-xs text-text-tertiary mt-2">예상 소요시간: 약 30초</p>
            </div>

            {/* 프로그레스 바 */}
            <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-accent-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-text-tertiary">
              맞춤형 콘텐츠는 시간이 걸리지만 채널별 최적화된 결과를 제공합니다
            </p>
          </div>
        )}
      </Card>

      <Toast message={toast?.message || ''} variant={toast?.variant} visible={!!toast} onClose={() => setToast(null)} />
    </div>
    </FlowGuard>
  )
}
