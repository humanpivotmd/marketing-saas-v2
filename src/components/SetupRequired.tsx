'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface SetupRequiredProps {
  children: React.ReactNode
}

export default function SetupRequired({ children }: SetupRequiredProps) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)

  useEffect(() => {
    const status = sessionStorage.getItem('business_setup')
    if (status === 'done') {
      setNeedsSetup(false)
      return
    }

    const token = sessionStorage.getItem('token')
    if (!token) { setNeedsSetup(false); return }

    fetch('/api/mypage/business-profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const p = data.data
          const done = !!(p.business_type && p.selected_channels?.length > 0 && p.company_name)
          setNeedsSetup(!done)
          sessionStorage.setItem('business_setup', done ? 'done' : 'needed')
        } else {
          setNeedsSetup(false)
        }
      })
      .catch(() => setNeedsSetup(false))
  }, [])

  if (needsSetup === null) return null // 로딩 중
  if (!needsSetup) return <>{children}</>

  return (
    <div className="py-16 text-center max-w-md mx-auto space-y-4">
      <div className="text-5xl mb-2">⚙️</div>
      <h2 className="text-lg font-bold text-text-primary">마이페이지 설정이 필요합니다</h2>
      <p className="text-sm text-text-secondary leading-relaxed">
        이 기능을 사용하려면 먼저 <strong>비즈니스 유형(B2B/B2C)</strong>, <strong>운영 채널</strong>,
        <strong>회사명</strong> 등 기본 정보를 설정해야 합니다.
      </p>
      <p className="text-xs text-text-tertiary">
        설정한 정보는 AI가 맞춤 콘텐츠를 생성할 때 자동으로 반영됩니다.
      </p>
      <a href="/settings#business">
        <Button>마이페이지 설정하기</Button>
      </a>
    </div>
  )
}
