'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'

const features = [
  {
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    title: 'AI 키워드 분석',
    description: '네이버 키워드 데이터 기반 기회 점수. 지금 바로 공략할 키워드를 자동 추천합니다.',
  },
  {
    icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    title: 'B2B/B2C 맞춤 콘텐츠',
    description: '블로그, Threads, 인스타그램, 페이스북, 영상 스크립트를 채널 특성에 맞게 자동 생성합니다.',
  },
  {
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    title: '네이버 SEO 점수',
    description: '발행 전 실시간 SEO 점수. 키워드 밀도, 소제목 구조, 도입부 배치, 분포도 등 7개 기준.',
  },
  {
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    title: '채널별 맞춤 생성',
    description: '같은 키워드로 블로그, SNS, 영상까지. 각 채널의 규칙에 맞춰 자동 변환합니다.',
  },
  {
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33',
    title: '커스텀 프롬프트',
    description: '기본 프롬프트에 나만의 지시를 추가. 우선/조합/참고 3가지 모드로 맞춤 콘텐츠를 만듭니다.',
  },
  {
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14',
    title: '이미지/영상 스크립트',
    description: 'AI 이미지 프롬프트와 영상 스토리보드를 자동 생성. 채널별 최적 사이즈로 제공합니다.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '',
    description: 'MarketingFlow를 무료로 체험하세요',
    features: ['콘텐츠 생성 10회/월', '키워드 분석 20회/월', '기본 SEO 점수', '복사하기'],
    cta: '무료로 시작',
    accent: false,
  },
  {
    name: 'Starter',
    price: '19,900',
    period: '/월',
    description: '1인 마케터와 소규모 비즈니스',
    features: ['AI 콘텐츠 50개/월', '키워드 분석 100회/월', '전체 SEO 점수', 'B2B/B2C 맞춤 생성', 'Brand Voice 3개', '이미지/영상 스크립트'],
    cta: 'Starter 시작',
    accent: true,
  },
  {
    name: 'Pro',
    price: '49,900',
    period: '/월',
    description: '성장하는 팀을 위한 플랜',
    features: ['콘텐츠 무제한', '키워드 무제한', '고급 SEO + AI 최적화', '5채널 맞춤 생성', 'Brand Voice 10개', '커스텀 프롬프트', '우선 지원'],
    cta: 'Pro 시작',
    accent: false,
  },
  {
    name: 'Premium',
    price: '협의',
    period: '',
    description: '에이전시 및 기업',
    features: ['Pro 전체 포함', '팀원 10명', '전담 지원'],
    cta: '문의하기',
    accent: false,
  },
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        setIsLoggedIn(true)
        setUserName(parsed.name || parsed.email || '')
      } catch {
        // invalid data
      }
    }
  }, [])

  const [previewKeyword, setPreviewKeyword] = useState('')
  const [previewResult, setPreviewResult] = useState<{
    keyword: string
    monthly_search: number
    competition: string
    grade: string
    opportunity: string
    opportunity_score: number
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'error' | 'info' })

  const handlePreview = async (e: FormEvent) => {
    e.preventDefault()
    if (!previewKeyword.trim()) return

    setPreviewLoading(true)
    try {
      const res = await fetch('/api/public/keyword-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: previewKeyword.trim() }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setPreviewResult(data.data)
      } else {
        setToast({ visible: true, message: data.error || '분석에 실패했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ visible: true, message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MarketingFlow',
    description: '네이버 상위 노출을 위한 AI 콘텐츠 자동화 플랫폼',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  }

  return (
    <div className="min-h-screen w-full bg-bg-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Skip navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg focus:text-sm"
      >
        본문으로 건너뛰기
      </a>

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-[rgba(240,246,252,0.1)]" aria-label="메인 네비게이션">
        <div className="max-w-5xl mx-auto px-8 lg:px-16 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">MarketingFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] flex items-center">기능</a>
            <a href="#pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] flex items-center">요금제</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="메뉴 열기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path d="M4 4l12 12M16 4L4 16" />
                ) : (
                  <path d="M3 5h14M3 10h14M3 15h14" />
                )}
              </svg>
            </button>
            {isLoggedIn ? (
              <>
                <span className="hidden sm:block text-sm text-text-secondary">{userName}님</span>
                <a href="/dashboard"><Button size="sm">대시보드</Button></a>
              </>
            ) : (
              <>
                <a href="/login" className="hidden sm:block"><Button variant="ghost" size="sm">로그인</Button></a>
                <a href="/login"><Button size="sm">시작하기</Button></a>
              </>
            )}
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[rgba(240,246,252,0.1)] bg-bg-secondary/95 backdrop-blur-xl animate-[fade-in_150ms_ease-out]">
            <div className="px-6 py-4 space-y-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 rounded-lg transition-colors min-h-[44px] flex items-center"
              >
                기능
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 rounded-lg transition-colors min-h-[44px] flex items-center"
              >
                요금제
              </a>
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 text-sm text-text-link hover:bg-bg-tertiary/50 rounded-lg transition-colors min-h-[44px] flex items-center"
                >
                  대시보드
                </a>
              ) : (
                <a
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 text-sm text-text-link hover:bg-bg-tertiary/50 rounded-lg transition-colors min-h-[44px] flex items-center"
                >
                  로그인
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="main-content" className="pt-32 pb-20 px-8 lg:px-16 relative overflow-hidden">
        {/* Hero background gradients */}
        <div
          className="absolute top-[-30%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-accent-secondary) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Badge variant="accent" size="md" className="mb-6">
            B2B/B2C 맞춤 AI 콘텐츠 자동화
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
            콘텐츠 자동화로<br />
            <span className="text-accent-primary">네이버 상위 노출</span>
          </h1>
          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            키워드 분석부터 B2B/B2C 맞춤 콘텐츠, 이미지·영상 스크립트까지.
            하나의 키워드로 5채널 콘텐츠를 자동 생성하는 마케팅 플랫폼.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login"><Button size="lg">무료로 시작 - 카드 불필요</Button></a>
            <a href="#features"><Button variant="secondary" size="lg">기능 살펴보기</Button></a>
          </div>
          <p className="text-xs text-text-tertiary mt-6">
            무료 플랜: 콘텐츠 생성 10회/월, 신용카드 불필요
          </p>
        </div>
      </section>

      {/* Keyword Preview */}
      <section className="py-20 px-8 lg:px-16 border-t border-[rgba(240,246,252,0.06)]">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-[rgba(240,246,252,0.1)]">
              <p className="text-sm text-text-secondary mb-3">가입 없이 키워드 분석 체험해보세요</p>
              <form onSubmit={handlePreview} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={previewKeyword}
                    onChange={(e) => setPreviewKeyword(e.target.value)}
                    placeholder="키워드 입력 (예: 홈카페 레시피)"
                    className="w-full h-11 px-4 text-base bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    aria-label="키워드 입력"
                  />
                </div>
                <Button type="submit" loading={previewLoading}>분석</Button>
              </form>
            </div>
            <div className="p-6 bg-bg-primary/50">
              {previewResult ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{previewResult.monthly_search.toLocaleString()}</p>
                    <p className="text-xs text-text-tertiary mt-1">월간 검색량</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${previewResult.grade.startsWith('D') ? 'text-accent-success' : previewResult.grade.startsWith('C') ? 'text-accent-primary' : 'text-accent-danger'}`}>{previewResult.grade}</p>
                    <p className="text-xs text-text-tertiary mt-1">기회 등급</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${previewResult.competition.includes('높음') || previewResult.competition === '포화' ? 'text-accent-danger' : previewResult.competition.includes('보통') ? 'text-accent-warning' : 'text-accent-success'}`}>{previewResult.competition}</p>
                    <p className="text-xs text-text-tertiary mt-1">경쟁도</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-text-primary">12,400</p>
                    <p className="text-xs text-text-tertiary mt-1">월간 검색량</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent-success">A+</p>
                    <p className="text-xs text-text-tertiary mt-1">기회 등급</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent-primary">87</p>
                    <p className="text-xs text-text-tertiary mt-1">SEO 점수</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8 lg:px-16 bg-[rgba(22,27,34,0.6)] border-t border-b border-[rgba(240,246,252,0.06)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              콘텐츠 마케팅에 필요한 모든 것
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              키워드 분석부터 B2B/B2C 맞춤 콘텐츠, 이미지·영상 스크립트까지 - 하나의 플랫폼에서.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} hover padding="lg">
                <div className="text-accent-primary mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              심플하고 투명한 요금제
            </h2>
            <p className="text-text-secondary">
              무료로 시작하고, 준비되면 업그레이드하세요.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`
                  rounded-2xl border p-6 transition-all duration-[var(--transition-normal)]
                  hover:border-[rgba(240,246,252,0.2)] hover:shadow-md hover:-translate-y-1
                  ${plan.accent
                    ? 'border-accent-primary bg-accent-primary/5 shadow-glow-blue'
                    : 'border-[rgba(240,246,252,0.1)] bg-bg-secondary'
                  }
                `}
              >
                {plan.accent && <Badge variant="accent" size="sm" className="mb-3">인기</Badge>}
                <h3 className="text-lg font-semibold text-text-primary">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-text-primary">
                    {plan.price === '0' ? '무료' : `\u20A9${plan.price}`}
                  </span>
                  {plan.period && <span className="text-sm text-text-secondary">{plan.period}</span>}
                </div>
                <p className="text-xs text-text-tertiary mb-6">{plan.description}</p>
                <a href={plan.name === 'Business' ? '/support' : '/login'}>
                  <Button variant={plan.accent ? 'primary' : 'secondary'} fullWidth size="sm">
                    {plan.cta}
                  </Button>
                </a>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <svg className="w-4 h-4 text-accent-success mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 lg:px-16 bg-[rgba(22,27,34,0.6)] border-t border-[rgba(240,246,252,0.06)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            콘텐츠 자동화를 시작할 준비가 되셨나요?
          </h2>
          <p className="text-text-secondary mb-8">
            무료 플랜으로 시작하세요. 신용카드 불필요.
          </p>
          <a href="/login"><Button size="lg">무료로 시작하기</Button></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(240,246,252,0.1)] py-12 px-8 lg:px-16" aria-label="사이트 정보">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-sm font-medium text-text-secondary">MarketingFlow</span>
          </div>
          <div className="flex gap-6">
            <a href="/terms" className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">이용약관</a>
            <a href="/privacy" className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">개인정보처리방침</a>
          </div>
          <p className="text-xs text-text-tertiary">&copy; 2026 MarketingFlow. All rights reserved.</p>
        </div>
      </footer>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
