'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface FlowGuardProps {
  projectId: string
  requiredStep: number
  children: ReactNode
}

import { getToken } from '@/lib/auth-client'

export default function FlowGuard({ projectId, requiredStep, children }: FlowGuardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'no_project' | 'step_not_ready'>('loading')

  useEffect(() => {
    if (!projectId) {
      setStatus('no_project')
      return
    }

    fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          setStatus('no_project')
          return
        }
        const project = data.data
        const prevStepKey = `s${requiredStep - 1}`
        const prevStepDone =
          requiredStep <= 1 ||
          project.step_status?.[prevStepKey] === 'completed'

        if (project.current_step < requiredStep - 1 || !prevStepDone) {
          setStatus('step_not_ready')
        } else {
          setStatus('ok')
        }
      })
      .catch(() => setStatus('no_project'))
  }, [projectId, requiredStep])

  if (status === 'loading') {
    return <div className="py-12 text-center text-text-tertiary">로딩 중...</div>
  }

  if (status === 'no_project') {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-text-tertiary">프로젝트 정보가 없습니다.</p>
        <Button onClick={() => router.push('/keywords')}>키워드로 돌아가기</Button>
      </div>
    )
  }

  if (status === 'step_not_ready') {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-text-tertiary">이전 단계를 먼저 완료해주세요.</p>
        <Button onClick={() => router.back()}>이전 단계로</Button>
      </div>
    )
  }

  return <>{children}</>
}
