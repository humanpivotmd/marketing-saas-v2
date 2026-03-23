import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 구독 취소
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    // 현재 사용자 정보
    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plan_expires_at')
      .eq('id', authUser.userId)
      .single()

    if (!user?.plan_id) {
      throw new ValidationError('활성화된 구독이 없습니다.')
    }

    // Free 플랜 ID 조회
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'free')
      .single()

    // 구독 취소: 현재 결제 주기 끝까지 유지 후 Free로 변경
    await supabase
      .from('users')
      .update({
        pending_plan_id: freePlan?.id || null,
        pending_plan_at: user.plan_expires_at || new Date().toISOString(),
      })
      .eq('id', authUser.userId)

    // -- 실제 토스페이먼츠 자동결제 해지 --
    // const { data: lastPayment } = await supabase
    //   .from('payments')
    //   .select('payment_key')
    //   .eq('user_id', authUser.userId)
    //   .eq('status', 'completed')
    //   .order('paid_at', { ascending: false })
    //   .limit(1)
    //   .single()
    //
    // if (lastPayment?.payment_key) {
    //   await fetch(`https://api.tosspayments.com/v1/billing/authorizations/${billingKey}`, {
    //     method: 'DELETE',
    //     headers: {
    //       Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
    //     },
    //   })
    // }

    return Response.json({
      success: true,
      data: {
        message: '구독이 취소되었습니다. 현재 결제 주기가 끝나면 Free 플랜으로 전환됩니다.',
        expires_at: user.plan_expires_at,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
