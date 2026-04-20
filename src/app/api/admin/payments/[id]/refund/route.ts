import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 결제 환불 처리 (수동)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data: payment, error: findErr } = await supabase
      .from('payments')
      .select('id, user_id, status, plan_id')
      .eq('id', id)
      .single()

    if (findErr || !payment) {
      return Response.json({ error: '결제를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (payment.status === 'refunded') {
      return Response.json({ error: '이미 환불된 결제입니다.' }, { status: 400 })
    }

    // 결제 상태를 refunded로 변경
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', id)

    if (updateErr) throw updateErr

    // 사용자 플랜을 free로 다운그레이드
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'free')
      .single()

    if (freePlan && payment.user_id) {
      await supabase
        .from('users')
        .update({
          plan_id: freePlan.id,
          plan_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id)
    }

    // 감사 로그
    try {
      await supabase.from('action_logs').insert({
        admin_id: authUser.id,
        target_user_id: payment.user_id,
        action: 'status_change',
        metadata: { trigger: 'manual_refund', payment_id: id },
      })
    } catch {
      // 로그 실패는 비치명적
    }

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
