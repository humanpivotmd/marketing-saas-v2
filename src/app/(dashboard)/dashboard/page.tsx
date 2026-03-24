'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

interface UsageData {
  plan: string
  plan_display_name: string
  period: string
  content: { used: number; limit: number }
  keyword: { used: number; limit: number }
  image: { used: number; limit: number }
  saved_keywords: { used: number; limit: number }
}

interface UserData {
  name: string
  role: string
  plan: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (userData) {
      try { setUser(JSON.parse(userData)) } catch { /* ignore */ }
    }

    const token = sessionStorage.getItem('token')
    if (!token) { setLoading(false); return }

    fetch('/api/mypage/usage', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setUsage(data.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const usageCards = usage
    ? [
        { label: '콘텐츠', used: usage.content.used, limit: usage.content.limit, color: 'text-accent-primary' },
        { label: '키워드 분석', used: usage.keyword.used, limit: usage.keyword.limit, color: 'text-accent-secondary' },
        { label: 'AI 이미지', used: usage.image.used, limit: usage.image.limit, color: 'text-accent-success' },
        { label: '저장 키워드', used: usage.saved_keywords.used, limit: usage.saved_keywords.limit, color: 'text-accent-warning' },
      ]
    : []

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침이에요'
    if (hour < 18) return '좋은 오후에요'
    return '좋은 저녁이에요'
  }

  return (
    <div className="max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        {loading ? (
          <div className="space-y-2">
            <Skeleton variant="title" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-primary">
              {getGreeting()}, {user?.name || '사용자'}님
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-text-secondary">{usage?.period || ''}</p>
              {usage && (
                <Badge variant="accent" size="sm">{usage.plan_display_name}</Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="title" className="mt-2" />
              <Skeleton variant="text" width="40%" className="mt-1" />
            </Card>
          ))
        ) : (
          usageCards.map((card) => {
            const percent = card.limit > 0 ? Math.round((card.used / card.limit) * 100) : 0
            return (
              <Card key={card.label} padding="md">
                <p className="text-sm text-text-secondary mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-bold ${card.color}`}>{card.used}</p>
                  <span className="text-sm text-text-tertiary">/ {card.limit === 0 ? '무제한' : card.limit}</span>
                </div>
                {card.limit > 0 && (
                  <div className="mt-2 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 90 ? 'bg-accent-error' : percent >= 70 ? 'bg-accent-warning' : 'bg-accent-primary'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contents */}
        <div className="lg:col-span-2">
          <Card padding="sm">
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-primary truncate">최근 콘텐츠</h2>
              <a href="/contents" className="flex-shrink-0">
                <Button variant="ghost" size="sm"><span className="whitespace-nowrap">전체 보기</span></Button>
              </a>
            </div>
            {loading ? (
              <div className="px-4 py-3 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="40%" />
                    </div>
                    <Skeleton variant="text" width="60px" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
                title="아직 콘텐츠가 없습니다"
                description="키워드를 분석하고 첫 번째 AI 콘텐츠를 만들어보세요."
                action={
                  <a href="/contents/new">
                    <Button>새 콘텐츠 만들기</Button>
                  </a>
                }
              />
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Top Keywords */}
          <Card padding="sm">
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-text-primary truncate">상위 키워드</h2>
              <a href="/keywords" className="flex-shrink-0">
                <Button variant="ghost" size="sm"><span className="whitespace-nowrap">분석하기</span></Button>
              </a>
            </div>
            {loading ? (
              <div className="px-4 py-3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="30px" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-text-tertiary">아직 분석된 키워드가 없습니다.</p>
                <a href="/keywords" className="text-sm text-text-link hover:underline mt-1 inline-block">
                  키워드 분석 시작하기
                </a>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">빠른 액션</h2>
            <div className="space-y-2.5">
              <a href="/contents/new">
                <Button variant="secondary" fullWidth size="sm">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M8 4v8M4 8h8" />
                  </svg>
                  새 콘텐츠 만들기
                </Button>
              </a>
              <a href="/keywords">
                <Button variant="secondary" fullWidth size="sm" className="mt-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" />
                    <path d="M12 12l-2.5-2.5" />
                  </svg>
                  키워드 분석
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
