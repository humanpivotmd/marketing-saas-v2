'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getToken, authHeaders } from '@/lib/auth-client'

const Badge = dynamic(() => import('@/components/ui/Badge'), { ssr: false })

interface PlanData {
  id: string
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  content_limit: number
  keyword_limit: number
  image_limit: number
  saved_keyword_limit: number
  channel_limit: number
  brand_voice_limit: number
  team_member_limit: number
  has_api_access: boolean
  has_priority_support: boolean
}

const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'free', name: 'free', display_name: 'Free',
    price_monthly: 0, price_yearly: 0,
    content_limit: 10, keyword_limit: 20, image_limit: 5,
    saved_keyword_limit: 20, channel_limit: 1, brand_voice_limit: 1,
    team_member_limit: 0, has_api_access: false, has_priority_support: false,
  },
  {
    id: 'starter', name: 'starter', display_name: 'Starter',
    price_monthly: 19900, price_yearly: 199000,
    content_limit: 50, keyword_limit: 100, image_limit: 30,
    saved_keyword_limit: 100, channel_limit: 3, brand_voice_limit: 3,
    team_member_limit: 0, has_api_access: true, has_priority_support: false,
  },
  {
    id: 'pro', name: 'pro', display_name: 'Pro',
    price_monthly: 49900, price_yearly: 499000,
    content_limit: -1, keyword_limit: -1, image_limit: -1,
    saved_keyword_limit: -1, channel_limit: 10, brand_voice_limit: 10,
    team_member_limit: 3, has_api_access: true, has_priority_support: false,
  },
  {
    id: 'premium', name: 'premium', display_name: 'Premium',
    price_monthly: 0, price_yearly: 0,
    content_limit: -1, keyword_limit: -1, image_limit: -1,
    saved_keyword_limit: -1, channel_limit: -1, brand_voice_limit: -1,
    team_member_limit: 10, has_api_access: true, has_priority_support: true,
  },
]

const PLAN_COLORS: Record<string, string> = {
  free: 'text-text-secondary',
  starter: 'text-accent-primary',
  pro: 'text-accent-secondary',
  premium: 'text-accent-warning',
}

const PLAN_BORDERS: Record<string, string> = {
  free: 'border-[rgba(240,246,252,0.1)]',
  starter: 'border-accent-primary/30',
  pro: 'border-accent-secondary/30 ring-1 ring-accent-secondary/20',
  premium: 'border-accent-warning/30',
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: '마케팅플로우를 시작해보세요',
  starter: '본격적인 콘텐츠 마케팅',
  pro: '성장하는 비즈니스를 위한 최적의 선택',
  premium: '에이전시 및 기업',
}

function formatPrice(price: number): string {
  if (price <= 0) return '무료'
  return price.toLocaleString('ko-KR')
}

function formatLimit(limit: number): string {
  if (limit < 0) return '무제한'
  return `${limit.toLocaleString()}회`
}

const FEATURES = [
  { key: 'content_limit', label: '콘텐츠 생성', unit: '/월' },
  { key: 'keyword_limit', label: '키워드 분석', unit: '/월' },
  { key: 'image_limit', label: 'AI 이미지 생성', unit: '/월' },
  { key: 'saved_keyword_limit', label: '저장 키워드', unit: '개' },
  { key: 'channel_limit', label: 'SNS 채널', unit: '개' },
  { key: 'brand_voice_limit', label: '브랜드 보이스', unit: '개' },
  { key: 'team_member_limit', label: '팀 멤버', unit: '명' },
  { key: 'has_api_access', label: 'API 접근', unit: '' },
  { key: 'has_priority_support', label: '전담 지원', unit: '' },
] as const

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
    <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_PLANS)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setCurrentPlan(parsed.plan || 'free')
      } catch { /* ignore */ }
    }

    // 서버에서 플랜 정보 조회 시도 (admin만 호출)
    const token = getToken()
    if (token) {
      try {
        const userParsed = JSON.parse(userData || '{}')
        const isAdmin = userParsed.role === 'admin' || userParsed.role === 'super_admin'
        if (isAdmin) {
          fetch('/api/admin/plan-limits', {
            headers: authHeaders(),
          })
            .then(r => r.json())
            .then(data => {
              if (data.success && data.data?.length > 0) {
                setPlans(data.data)
              }
            })
            .catch(() => { /* fallback to defaults */ })
        }
      } catch { /* fallback to defaults */ }
    }
  }, [])

  const handleUpgrade = (plan: PlanData) => {
    if (plan.price_monthly === 0) return
    const billingCycle = isYearly ? 'yearly' : 'monthly'
    window.location.href = `/pricing/checkout?plan=${plan.id}&cycle=${billingCycle}`
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          딱 맞는 요금제를 선택하세요
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          모든 플랜에서 핵심 기능을 사용할 수 있습니다. 비즈니스 규모에 맞게 업그레이드하세요.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!isYearly ? 'text-text-primary' : 'text-text-tertiary'}`}>
            월간
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`
              relative w-14 h-7 rounded-full transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary
              ${isYearly ? 'bg-accent-primary' : 'bg-bg-tertiary'}
            `}
            role="switch"
            aria-checked={isYearly}
            aria-label="연간 결제 토글"
          >
            <span
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200
                ${isYearly ? 'translate-x-7.5' : 'translate-x-0.5'}
              `}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? 'text-text-primary' : 'text-text-tertiary'}`}>
            연간
          </span>
          {isYearly && (
            <Badge variant="success" size="sm">20% 할인</Badge>
          )}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.name
          const isPopular = plan.name === 'pro'
          const price = isYearly ? plan.price_yearly : plan.price_monthly

          return (
            <div key={plan.id} className="relative">
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="accent" size="sm">
                    가장 인기
                  </Badge>
                </div>
              )}
              <Card
                padding="lg"
                className={`
                  relative flex flex-col h-full
                  ${PLAN_BORDERS[plan.name] || 'border-[rgba(240,246,252,0.1)]'}
                  ${isCurrent ? 'bg-bg-tertiary/50' : ''}
                  ${isPopular ? 'shadow-glow-purple' : ''}
                `}
              >
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${PLAN_COLORS[plan.name] || 'text-text-primary'}`}>
                    {plan.display_name}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {PLAN_DESCRIPTIONS[plan.name] || ''}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {price > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">
                          {formatPrice(price)}
                        </span>
                        <span className="text-sm text-text-tertiary">원/월</span>
                      </div>
                      {isYearly && (
                        <p className="text-xs text-text-tertiary mt-1">
                          연 {formatPrice(price * 12)}원 (월 {formatPrice(plan.price_monthly)}원 대비 20% 할인)
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text-primary">무료</span>
                      <span className="text-sm text-text-tertiary">영구 무료</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    <span className="text-text-secondary">
                      콘텐츠 생성 {formatLimit(plan.content_limit)}/월
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    <span className="text-text-secondary">
                      키워드 분석 {formatLimit(plan.keyword_limit)}/월
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    <span className="text-text-secondary">
                      AI 이미지 {formatLimit(plan.image_limit)}/월
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckIcon />
                    <span className="text-text-secondary">
                      SNS 채널 {plan.channel_limit < 0 ? '무제한' : `${plan.channel_limit}개`}
                    </span>
                  </li>
                  {plan.team_member_limit > 0 && (
                    <li className="flex items-center gap-2 text-sm">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
                        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-text-secondary">
                        팀 멤버 {plan.team_member_limit}명
                      </span>
                    </li>
                  )}
                  {plan.has_api_access && (
                    <li className="flex items-center gap-2 text-sm">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
                        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-text-secondary">API 접근</span>
                    </li>
                  )}
                  {plan.has_priority_support && (
                    <li className="flex items-center gap-2 text-sm">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0" aria-hidden="true">
                        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-text-secondary">전담 지원</span>
                    </li>
                  )}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button variant="secondary" fullWidth disabled>
                    현재 플랜
                  </Button>
                ) : plan.price_monthly === 0 ? (
                  <Button variant="secondary" fullWidth disabled>
                    무료 사용 중
                  </Button>
                ) : (
                  <Button
                    variant={isPopular ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.name === 'premium' ? '문의하기' : '업그레이드'}
                  </Button>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Toggle */}
      <div className="text-center mb-8">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 text-sm text-accent-primary hover:text-accent-primary-hover transition-colors min-h-[44px]"
        >
          기능 비교 테이블 {showComparison ? '접기' : '펼치기'}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-transform ${showComparison ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <Card padding="sm" className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(240,246,252,0.1)]">
                <th className="text-left py-4 px-4 text-text-tertiary font-medium">기능</th>
                {plans.map(plan => (
                  <th key={plan.id} className={`text-center py-4 px-4 font-semibold ${PLAN_COLORS[plan.name]}`}>
                    {plan.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature.key} className="border-b border-[rgba(240,246,252,0.05)]">
                  <td className="py-3 px-4 text-text-secondary">{feature.label}</td>
                  {plans.map(plan => {
                    const value = plan[feature.key as keyof PlanData]
                    let display: string
                    if (typeof value === 'boolean') {
                      display = value ? 'O' : '-'
                    } else if (typeof value === 'number') {
                      if (value < 0) display = '무제한'
                      else if (value === 0) display = '-'
                      else display = `${value.toLocaleString()}${feature.unit}`
                    } else {
                      display = String(value)
                    }
                    return (
                      <td key={plan.id} className="text-center py-3 px-4 text-text-primary">
                        {display}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* FAQ / Trust */}
      <div className="text-center space-y-4 pb-8">
        <div className="flex items-center justify-center gap-6 text-text-tertiary text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success" aria-hidden="true">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 0v7l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            7일 환불 보장
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success" aria-hidden="true">
              <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            언제든 해지 가능
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success" aria-hidden="true">
              <path d="M8 2L3 6v5a5 5 0 0010 0V6L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            안전한 결제
          </span>
        </div>
      </div>
    </div>
  )
}
