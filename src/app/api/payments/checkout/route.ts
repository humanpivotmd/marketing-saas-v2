import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 결제 세션 생성 (토스페이먼츠 SDK 연동 준비)
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const body = await req.json()
    const { plan_id, billing_cycle } = body

    if (!plan_id || !billing_cycle) {
      throw new ValidationError('plan_id와 billing_cycle은 필수입니다.')
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      throw new ValidationError('billing_cycle은 monthly 또는 yearly여야 합니다.')
    }

    const supabase = createServerSupabase()

    // 플랜 정보 조회
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      throw new ValidationError('유효하지 않은 플랜입니다.')
    }

    const amount = billing_cycle === 'yearly'
      ? plan.price_yearly * 12
      : plan.price_monthly

    if (amount <= 0) {
      throw new ValidationError('무료 플랜은 결제가 필요하지 않습니다.')
    }

    // 주문 ID 생성
    const orderId = `MF_${authUser.userId}_${Date.now()}`

    // 결제 세션 정보 반환 (토스페이먼츠 SDK에서 사용)
    // 실제 토스페이먼츠 연동 시 여기서 서버 사이드 세션을 생성할 수 있음
    return Response.json({
      success: true,
      data: {
        orderId,
        orderName: `마케팅플로우 ${plan.display_name} (${billing_cycle === 'yearly' ? '연간' : '월간'})`,
        amount,
        currency: 'KRW',
        plan_id: plan.id,
        plan_name: plan.display_name,
        billing_cycle,
        customerEmail: authUser.email,
        customerName: authUser.name,
        // 토스페이먼츠 클라이언트 키 (실제 운영 시 환경변수에서)
        // clientKey: process.env.TOSS_CLIENT_KEY,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
