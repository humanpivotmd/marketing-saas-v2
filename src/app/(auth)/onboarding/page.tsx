'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Toast from '@/components/ui/Toast'

const industries = [
  { id: 'cafe', label: '카페/음료', icon: '☕', tone: '친근하고 따뜻한', target: '20-40대 여성' },
  { id: 'shopping', label: '쇼핑몰', icon: '🛒', tone: '트렌디하고 활기찬', target: '20-30대 여성' },
  { id: 'hospital', label: '병원/의료', icon: '🏥', tone: '신뢰감 있고 전문적인', target: '30-50대 남녀' },
  { id: 'beauty', label: '뷰티/미용', icon: '💄', tone: '세련되고 감각적인', target: '20-40대 여성' },
  { id: 'education', label: '교육/학원', icon: '📚', tone: '믿음직하고 친절한', target: '30-50대 학부모' },
  { id: 'tech', label: 'IT/테크', icon: '💻', tone: '전문적이고 명쾌한', target: '25-45대 남녀' },
  { id: 'food', label: '요식업', icon: '🍽️', tone: '맛있고 정감 있는', target: '20-40대 남녀' },
  { id: 'realestate', label: '부동산', icon: '🏠', tone: '신뢰감 있고 정확한', target: '30-50대 남녀' },
  { id: 'fitness', label: '피트니스', icon: '💪', tone: '에너지 넘치고 동기부여하는', target: '20-40대 남녀' },
  { id: 'travel', label: '여행/숙박', icon: '✈️', tone: '설레고 감성적인', target: '20-40대 남녀' },
  { id: 'fashion', label: '패션/의류', icon: '👗', tone: '세련되고 트렌디한', target: '20-30대 여성' },
  { id: 'other', label: '기타', icon: '📌', tone: '친근하고 전문적인', target: '25-45대 남녀' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [keywords, setKeywords] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'success' | 'error' })

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleKeywordChange = (index: number, value: string) => {
    const updated = [...keywords]
    updated[index] = value
    setKeywords(updated)
  }

  const handleStep1Submit = () => {
    if (!selectedIndustry) {
      setToast({ visible: true, message: '업종을 선택해주세요.', variant: 'error' })
      return
    }
    const filledKeywords = keywords.filter((k) => k.trim())
    if (filledKeywords.length === 0) {
      setToast({ visible: true, message: '키워드를 최소 1개 입력해주세요.', variant: 'error' })
      return
    }
    setStep(2)
    setGenerating(true)
    // Simulate Brand Voice generation
    setTimeout(() => setGenerating(false), 2500)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      if (!token) { router.push('/login'); return }

      // Save onboarding data
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { router.push('/login'); return }

      // Mark onboarding complete (via a simple user update)
      // For now, store in sessionStorage and navigate
      const userData = sessionStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        user.onboarding_done = true
        sessionStorage.setItem('user', JSON.stringify(user))
      }

      router.push('/dashboard')
    } catch {
      setToast({ visible: true, message: '오류가 발생했습니다.', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} aria-label={`온보딩 ${step}/2 단계`}>
        <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-accent-primary' : 'bg-bg-tertiary'}`} />
        <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-accent-primary' : 'bg-bg-tertiary'}`} />
      </div>
      <p className="sr-only" aria-live="polite">{step === 1 ? '업종 및 키워드 선택' : 'Brand Voice 생성'} 단계</p>

      {step === 1 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">시작 설정</h1>
            <p className="text-sm text-text-secondary">업종과 키워드를 선택하면 맞춤 콘텐츠를 만들어드립니다.</p>
          </div>

          {/* Industry Selection */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">어떤 업종인가요?</h2>
            <div className="grid grid-cols-3 gap-2">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl text-center
                    transition-all duration-150 min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-accent-primary
                    ${selectedIndustry === ind.id
                      ? 'bg-accent-primary/10 border-2 border-accent-primary text-text-primary'
                      : 'bg-bg-tertiary/50 border-2 border-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }
                  `}
                  aria-pressed={selectedIndustry === ind.id}
                >
                  <span className="text-xl" aria-hidden="true">{ind.icon}</span>
                  <span className="text-xs font-medium">{ind.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Keywords */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-2">어떤 키워드로 고객을 찾고 싶으세요?</h2>
            <p className="text-xs text-text-tertiary mb-4">1~3개의 키워드를 입력해주세요.</p>
            <div className="space-y-3">
              {keywords.map((kw, i) => (
                <Input
                  key={i}
                  placeholder={i === 0 ? '예: 강남 카페 추천' : i === 1 ? '예: 라떼 맛집' : '예: 디저트 카페 (선택)'}
                  value={kw}
                  onChange={(e) => handleKeywordChange(i, e.target.value)}
                />
              ))}
            </div>
          </Card>

          <Button fullWidth onClick={handleStep1Submit}>
            다음 - Brand Voice 생성
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Brand Voice 생성 중</h1>
            <p className="text-sm text-text-secondary">
              {selectedIndustry && industries.find((i) => i.id === selectedIndustry)?.label} 업종에 맞는 톤을 설정하고 있습니다.
            </p>
          </div>

          <Card className="mb-6">
            {generating ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-label="생성 중" />
                <p className="text-sm text-text-secondary">AI가 Brand Voice를 분석하고 있습니다...</p>
                <p className="text-xs text-text-tertiary mt-2">약 30초 소요됩니다</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-12 h-12 rounded-full bg-accent-success/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-success" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary text-center mb-4">Brand Voice 설정 완료</h3>

                <div className="space-y-3 px-2">
                  <div className="flex justify-between items-center py-2 border-b border-[rgba(240,246,252,0.06)]">
                    <span className="text-sm text-text-secondary">업종</span>
                    <span className="text-sm font-medium text-text-primary">
                      {industries.find((i) => i.id === selectedIndustry)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[rgba(240,246,252,0.06)]">
                    <span className="text-sm text-text-secondary">톤</span>
                    <span className="text-sm font-medium text-text-primary">
                      {industries.find((i) => i.id === selectedIndustry)?.tone || '친근하고 전문적인'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[rgba(240,246,252,0.06)]">
                    <span className="text-sm text-text-secondary">키워드</span>
                    <span className="text-sm font-medium text-text-primary">
                      {keywords.filter((k) => k.trim()).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-secondary">타겟</span>
                    <span className="text-sm font-medium text-text-primary">
                      {industries.find((i) => i.id === selectedIndustry)?.target || '20-40대 남녀'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-tertiary text-center mt-4">
                  설정 &gt; Brand Voice에서 언제든 수정할 수 있습니다.
                </p>
              </div>
            )}
          </Card>

          <div className="space-y-3">
            <Button fullWidth onClick={handleComplete} loading={loading} disabled={generating}>
              대시보드로 이동
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setStep(1)} disabled={generating}>
              이전으로
            </Button>
          </div>
        </>
      )}

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
