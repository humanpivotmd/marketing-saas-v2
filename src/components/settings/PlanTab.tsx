'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { authHeaders } from '@/lib/auth-client'

interface UsageData {
  plan: string
  plan_display_name: string
  period: string
  content: { used: number; limit: number }
  keyword: { used: number; limit: number }
  image: { used: number; limit: number }
  saved_keywords: { used: number; limit: number }
  channels: { used: number; limit: number }
  brand_voices: { used: number; limit: number }
}

export default function PlanTab() {
  const [usage, setUsage] = useState<UsageData | null>(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('dashboard_usage') : null
    if (cached) try { return JSON.parse(cached) } catch { /* ignore */ }
    return null
  })

  useEffect(() => {
    fetch('/api/mypage/usage', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsage(res.data)
          sessionStorage.setItem('dashboard_usage', JSON.stringify(res.data))
        }
      })
      .catch(() => {})
  }, [])

  if (!usage) {
    return <Card><div className="animate-pulse space-y-4"><div className="h-4 bg-bg-tertiary rounded w-1/3" /><div className="h-4 bg-bg-tertiary rounded w-full" /></div></Card>
  }

  const usageItems = [
    { label: '콘텐츠 생성', ...usage.content, color: 'bg-accent-primary' },
    { label: '키워드 분석', ...usage.keyword, color: 'bg-purple-500' },
    { label: 'AI 이미지', ...usage.image, color: 'bg-green-500' },
    { label: '저장 키워드', ...usage.saved_keywords, color: 'bg-yellow-500' },
    { label: '채널 연동', ...usage.channels, color: 'bg-pink-500' },
    { label: 'Brand Voice', ...usage.brand_voices, color: 'bg-cyan-500' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">현재 플랜</h2>
            <p className="text-sm text-text-secondary">{usage.period}</p>
          </div>
          <Badge variant="accent" size="md">{usage.plan_display_name}</Badge>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">사용량 현황</h2>
        <div className="space-y-4">
          {usageItems.map((item) => {
            const pct = item.limit > 0 ? Math.min(Math.round((item.used / item.limit) * 100), 100) : 0
            return (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm text-text-primary font-medium">
                    {item.used} / {item.limit === 0 ? '무제한' : item.limit}
                  </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-2">업그레이드</h2>
        <p className="text-sm text-text-secondary mb-4">
          더 많은 콘텐츠를 생성하고 고급 기능을 이용하세요.
        </p>
        <Button onClick={() => (window.location.href = '/pricing')}>플랜 비교하기</Button>
      </Card>
    </div>
  )
}
