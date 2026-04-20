'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Toast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import FlowGuard from '@/components/FlowGuard'
import { authHeaders } from '@/lib/auth-client'
import { useAsyncAction } from '@/hooks/useAsyncAction'

export default function GeneratingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('초안을 작성하고 있습니다...')
  const [error, setError] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const { toast, clearToast } = useAsyncAction()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!projectId) return

    const controller = new AbortController()

    // 프로그레스 바 애니메이션
    intervalRef.current = setInterval(() => {
      setProgress(p => Math.min(p + 2, 85))
    }, 500)

    // 이미 초안 완료된 프로젝트인지 확인 후 중복 생성 방지
    fetch(`/api/projects/${projectId}`, { headers: authHeaders(), signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.step_status?.s4 === 'completed') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setProgress(100)
          setStatus('이미 초안이 완료되었습니다. 이동 중...')
          setTimeout(() => router.replace(`/create/channel-write?project_id=${projectId}`), 500)
          return
        }
        startDraftGeneration()
      })
      .catch(() => startDraftGeneration())

    function startDraftGeneration() {
      fetch('/api/generate/draft', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ project_id: projectId }),
        signal: controller.signal,
      })
        .then(r => r.json())
        .then(data => {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (!data.success) {
            setError(data.error || '초안 생성 실패')
            return
          }
          setProgress(100)
          setStatus('초안 작성 완료!')
          sessionStorage.removeItem('dashboard_usage')
          window.dispatchEvent(new Event('usage-updated'))
          // 초안 내용을 가져와서 사용자에게 보여주기
          fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
            .then(r => r.json())
            .then(proj => {
              if (proj.success && proj.data.draft_content) {
                setDraftContent(proj.data.draft_content)
              } else {
                // 초안 조회 실패 시 바로 이동
                router.replace(`/create/channel-write?project_id=${projectId}`)
              }
            })
            .catch(() => router.replace(`/create/channel-write?project_id=${projectId}`))
        })
        .catch(err => {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if ((err as Error).name !== 'AbortError') {
            setError((err as Error).message || '초안 생성 실패')
          }
        })
    }

    return () => {
      controller.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectId, router])

  return (
    <FlowGuard projectId={projectId} requiredStep={4}>
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full text-center p-8">
        {draftContent ? (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">초안 완성</p>
              <span className="text-xs text-green-400">완료</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-secondary text-text-secondary text-sm leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {draftContent.slice(0, 1500)}{draftContent.length > 1500 ? '...' : ''}
            </div>
            <p className="text-xs text-text-tertiary">
              이 초안을 기반으로 채널별 콘텐츠가 생성됩니다.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                설정 다시 선택
              </Button>
              <Button size="sm" onClick={() => router.replace(`/create/channel-write?project_id=${projectId}`)}>
                이대로 채널별 생성 시작
              </Button>
            </div>
          </div>
        ) : error ? (
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

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
    </FlowGuard>
  )
}
