import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '사용 가이드 - MarketingFlow',
  description: '마케팅플로우 사용법을 3단계로 알아보세요. 키워드 분석, B2B/B2C 맞춤 AI 콘텐츠 생성, 이미지·영상 스크립트까지.',
}

const steps = [
  {
    number: '01',
    title: '키워드 분석',
    subtitle: '어떤 키워드가 효과적인지 데이터로 확인하세요',
    description:
      '네이버 검색광고 데이터를 기반으로 월간 검색량, 경쟁도, 클릭 비용을 분석합니다. 업종별 기회 점수와 키워드 등급(S~D)으로 최적의 키워드를 추천합니다.',
    features: [
      '네이버 검색량/경쟁도/CPC 분석',
      '연관 키워드 자동 추출 (최대 50개)',
      'S~D 등급 시스템으로 키워드 평가',
      '12개월 트렌드 차트 비교',
    ],
    color: 'accent-primary',
  },
  {
    number: '02',
    title: 'AI 콘텐츠 생성',
    subtitle: '키워드 기반으로 SEO 최적화 콘텐츠를 자동 생성',
    description:
      'B2B/B2C 맞춤으로 AI가 블로그, Threads, Instagram, Facebook 콘텐츠를 채널 특성에 맞게 생성합니다. 네이버 SEO 점수를 실시간으로 확인하며 편집할 수 있습니다.',
    features: [
      '블로그/Threads/Instagram/Facebook/영상 스크립트 5채널 지원',
      '브랜드 보이스 반영 (톤, 타겟, 금지어)',
      '네이버 SEO 점수 실시간 표시',
      '아웃라인 수정 후 재생성 가능',
    ],
    color: 'accent-secondary',
  },
  {
    number: '03',
    title: '이미지 · 영상 스크립트',
    subtitle: '채널별 이미지 프롬프트와 영상 스토리보드를 자동 생성',
    description:
      'AI 도구(Midjourney, DALL-E 등)에 바로 사용할 수 있는 이미지 프롬프트를 채널별로 생성합니다. 영상 스토리보드도 숏폼/일반 형식으로 자동 제작됩니다.',
    features: [
      '채널별 이미지 프롬프트 3장 + 썸네일',
      '6종 AI 도구 지원 (Midjourney, DALL-E 등)',
      '숏폼/일반 영상 스토리보드',
      '장면별 나레이션/자막/전환 효과',
    ],
    color: 'accent-success',
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-[rgba(240,246,252,0.1)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-base font-semibold text-text-primary">MarketingFlow</span>
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary-hover rounded-lg transition-all min-h-[44px]"
          >
            시작하기
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            3단계로 시작하는 콘텐츠 마케팅
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            키워드 분석부터 AI 콘텐츠 생성, SNS 발행까지.
            <br />
            마케팅플로우와 함께라면 누구나 전문가처럼 마케팅할 수 있습니다.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-24">
          {steps.map((step, index) => (
            <section key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-px h-24 bg-gradient-to-b from-[rgba(240,246,252,0.1)] to-transparent hidden md:block" />
              )}

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:direction-rtl' : ''}`}>
                {/* Content */}
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-sm font-mono font-bold text-${step.color}`}>
                      STEP {step.number}
                    </span>
                    <div className={`h-px flex-1 bg-${step.color}/20`} />
                  </div>

                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {step.title}
                  </h2>
                  <p className={`text-${step.color} text-sm font-medium mb-4`}>
                    {step.subtitle}
                  </p>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {step.description}
                  </p>

                  <ul className="space-y-3">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          className={`text-${step.color} shrink-0 mt-0.5`}
                          aria-hidden="true"
                        >
                          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Placeholder */}
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className={`
                    aspect-[4/3] rounded-2xl border border-[rgba(240,246,252,0.1)]
                    bg-gradient-to-br from-bg-secondary to-bg-tertiary
                    flex items-center justify-center
                  `}>
                    <div className="text-center">
                      <div className={`
                        w-20 h-20 rounded-2xl bg-${step.color}/10
                        flex items-center justify-center mx-auto mb-4
                      `}>
                        <span className={`text-3xl font-bold text-${step.color}`}>
                          {step.number}
                        </span>
                      </div>
                      <p className="text-sm text-text-tertiary">{step.title} 화면 미리보기</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-24 pb-8">
          <h3 className="text-2xl font-bold text-text-primary mb-4">
            지금 바로 시작하세요
          </h3>
          <p className="text-text-secondary mb-8">
            무료로 시작할 수 있습니다. 신용카드 없이 바로 체험해 보세요.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 text-base font-medium text-white bg-accent-primary hover:bg-accent-primary-hover rounded-lg shadow-glow-blue transition-all active:scale-[0.98] min-h-[44px]"
          >
            무료로 시작하기
          </a>
        </div>
      </main>
    </div>
  )
}
