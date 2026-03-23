import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 결제 승인 (UI만, 실제 토스페이먼츠 API 호출 주석 처리)
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const body = await req.json()
    const { paymentKey, orderId, amount, plan_id, billing_cycle } = body

    if (!paymentKey || !orderId || !amount || !plan_id) {
      throw new ValidationError('결제 정보가 불완전합니다.')
    }

    if (billing_cycle && !['monthly', 'yearly'].includes(billing_cycle)) {
      throw new ValidationError('billing_cycle은 monthly 또는 yearly여야 합니다.')
    }

    const supabase = createServerSupabase()

    // 플랜 정보 확인
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      throw new ValidationError('유효하지 않은 플랜입니다.')
    }

    // 서버 사이드 금액 검증 (클라이언트 전달 금액 위변조 방지)
    const expectedAmount = billing_cycle === 'yearly'
      ? plan.price_yearly * 12
      : plan.price_monthly

    if (amount !== expectedAmount) {
      throw new ValidationError('결제 금액이 일치하지 않습니다.')
    }

    // -- 실제 토스페이먼츠 결제 승인 API 호출 --
    // const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ paymentKey, orderId, amount }),
    // })
    // const tossData = await tossResponse.json()
    // if (!tossResponse.ok) throw new Error(tossData.message)

    // 결제일 기준 만료일 계산
    const now = new Date()
    const expiresAt = new Date(now)
    if (billing_cycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // 결제 내역 저장
    await supabase.from('payments').insert({
      user_id: authUser.userId,
      plan_id: plan.id,
      amount,
      billing_cycle: billing_cycle || 'monthly',
      payment_method: 'card',
      payment_key: paymentKey,
      status: 'completed',
      paid_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    // 사용자 플랜 업데이트
    await supabase
      .from('users')
      .update({
        plan_id: plan.id,
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
        pending_plan_id: null,
        pending_plan_at: null,
      })
      .eq('id', authUser.userId)

    return Response.json({
      success: true,
      data: {
        message: '결제가 완료되었습니다.',
        plan: plan.display_name,
        expires_at: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
