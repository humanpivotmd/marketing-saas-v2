import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 현재 구독 정보 조회
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plan_started_at, plan_expires_at, pending_plan_id, pending_plan_at')
      .eq('id', authUser.userId)
      .single()

    if (!user) {
      return Response.json({
        success: true,
        data: { plan: null, subscription: null },
      })
    }

    // 현재 플랜 정보
    let currentPlan = null
    if (user.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', user.plan_id)
        .single()
      currentPlan = plan
    }

    // 대기 중인 플랜 변경
    let pendingPlan = null
    if (user.pending_plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('id, name, display_name')
        .eq('id', user.pending_plan_id)
        .single()
      pendingPlan = plan
    }

    // 최근 결제 정보
    const { data: lastPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', authUser.userId)
      .eq('status', 'completed')
      .order('paid_at', { ascending: false })
      .limit(1)
      .single()

    return Response.json({
      success: true,
      data: {
        plan: currentPlan,
        subscription: {
          started_at: user.plan_started_at,
          expires_at: user.plan_expires_at,
          billing_cycle: lastPayment?.billing_cycle || null,
          last_payment: lastPayment || null,
        },
        pending_change: pendingPlan
          ? { plan: pendingPlan, effective_at: user.pending_plan_at }
          : null,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 구독 생성/변경
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const body = await req.json()
    const { plan_id, billing_cycle, action } = body

    if (!plan_id) {
      throw new ValidationError('plan_id는 필수입니다.')
    }

    const supabase = createServerSupabase()

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      throw new ValidationError('유효하지 않은 플랜입니다.')
    }

    // 현재 사용자 플랜 확인
    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plan_expires_at')
      .eq('id', authUser.userId)
      .single()

    // 다운그레이드: 다음 결제 주기부터 적용
    if (action === 'downgrade') {
      await supabase
        .from('users')
        .update({
          pending_plan_id: plan.id,
          pending_plan_at: user?.plan_expires_at || new Date().toISOString(),
        })
        .eq('id', authUser.userId)

      return Response.json({
        success: true,
        data: {
          message: `${plan.display_name} 플랜으로 변경이 예약되었습니다.`,
          effective_at: user?.plan_expires_at,
        },
      })
    }

    // 업그레이드: 결제 필요 → checkout으로 안내
    const amount = billing_cycle === 'yearly'
      ? plan.price_yearly * 12
      : plan.price_monthly

    return Response.json({
      success: true,
      data: {
        message: '결제가 필요합니다.',
        requires_payment: amount > 0,
        plan: {
          id: plan.id,
          name: plan.display_name,
          amount,
          billing_cycle: billing_cycle || 'monthly',
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
