'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const PLAN_INFO: Record<string, { name: string; description: string }> = {
  starter: { name: 'Starter', description: '본격적인 콘텐츠 마케팅을 시작하세요' },
  pro: { name: 'Pro', description: '성장하는 비즈니스를 위한 최적의 선택' },
  business: { name: 'Business', description: '대규모 팀과 에이전시를 위한 플랜' },
}

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 29000, yearly: 23200 },
  pro: { monthly: 59000, yearly: 47200 },
  business: { monthly: 149000, yearly: 119200 },
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'starter'
  const cycle = searchParams.get('cycle') || 'monthly'

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const plan = PLAN_INFO[planId] || PLAN_INFO.starter
  const prices = PLAN_PRICES[planId] || PLAN_PRICES.starter
  const isYearly = cycle === 'yearly'
  const monthlyPrice = isYearly ? prices.yearly : prices.monthly
  const totalPrice = isYearly ? prices.yearly * 12 : prices.monthly

  useEffect(() => {
    // 토스페이먼츠 SDK 로드 (실제 운영 시)
    // const script = document.createElement('script')
    // script.src = 'https://js.tosspayments.com/v1/payment'
    // document.head.appendChild(script)
  }, [])

  const handlePayment = async () => {
    setStatus('processing')

    // 실제 토스페이먼츠 연동 시:
    // const tossPayments = await loadTossPayments(clientKey)
    // tossPayments.requestPayment('카드', {
    //   amount: totalPrice,
    //   orderId: orderId,
    //   orderName: `마케팅플로우 ${plan.name}`,
    //   successUrl: `${window.location.origin}/pricing/checkout?status=success`,
    //   failUrl: `${window.location.origin}/pricing/checkout?status=fail`,
    // })

    // 현재는 "준비 중" 안내
    setTimeout(() => {
      setStatus('idle')
      setErrorMessage('결제 시스템 준비 중입니다. 곧 서비스될 예정입니다.')
    }, 1500)
  }

  if (status === 'success') {
    return (
      <div className="px-4 lg:px-8 py-16 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-accent-success/10 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-accent-success">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">결제 완료</h1>
        <p className="text-text-secondary mb-8">
          {plan.name} 플랜이 활성화되었습니다. 새로운 기능을 바로 사용해보세요!
        </p>
        <Button onClick={() => window.location.href = '/dashboard'}>
          대시보드로 이동
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-8">결제하기</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-text-primary mb-4">주문 요약</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-text-primary">{plan.name} 플랜</p>
                  <p className="text-sm text-text-tertiary">{plan.description}</p>
                </div>
              </div>

              <div className="border-t border-[rgba(240,246,252,0.1)] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">결제 주기</span>
                  <span className="text-text-primary">{isYearly ? '연간 결제' : '월간 결제'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">월 요금</span>
                  <span className="text-text-primary">{monthlyPrice.toLocaleString()}원</span>
                </div>
                {isYearly && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">할인</span>
                    <span className="text-accent-success">-20% (연간 할인)</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[rgba(240,246,252,0.1)] pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-primary">총 결제 금액</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-text-primary">
                      {totalPrice.toLocaleString()}원
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {isYearly ? '12개월분 일시 결제' : '매월 자동 결제'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Trust Badges */}
          <div className="mt-4 flex items-center gap-4 px-2">
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent-success" aria-hidden="true">
                <path d="M8 2L3 6v5a5 5 0 0010 0V6L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              SSL 암호화
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent-success" aria-hidden="true">
                <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              7일 환불 보장
            </div>
          </div>
        </div>

        {/* Payment Widget Area */}
        <div className="lg:col-span-3">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-text-primary mb-6">결제 수단</h2>

            {/* 토스페이먼츠 결제 위젯 영역 */}
            <div className="border-2 border-dashed border-[rgba(240,246,252,0.15)] rounded-xl p-8 mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-tertiary" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm mb-1">토스페이먼츠 결제 위젯</p>
              <p className="text-text-tertiary text-xs">
                결제 시스템 연동 후 이 영역에 카드 결제 폼이 표시됩니다
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-accent-warning-muted border border-accent-warning/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-warning shrink-0 mt-0.5" aria-hidden="true">
                    <path d="M12 9v4m0 4h.01M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-accent-warning">안내</p>
                    <p className="text-sm text-text-secondary mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <Button
              fullWidth
              size="lg"
              loading={status === 'processing'}
              onClick={handlePayment}
            >
              {status === 'processing'
                ? '처리 중...'
                : `${totalPrice.toLocaleString()}원 결제하기`
              }
            </Button>

            <p className="text-xs text-text-tertiary text-center mt-4">
              결제 시 <a href="/terms" className="text-text-link hover:underline">이용약관</a> 및{' '}
              <a href="/privacy" className="text-text-link hover:underline">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-bg-tertiary rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 h-64 bg-bg-secondary rounded-xl animate-pulse" />
          <div className="lg:col-span-3 h-96 bg-bg-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
