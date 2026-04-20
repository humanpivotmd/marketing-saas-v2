import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 사용량 수동 지급 (usage_logs에 마이너스 레코드 추가)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const { action_type, amount, reason } = await req.json()

    if (!action_type || !amount) {
      return Response.json({ error: 'action_type과 amount는 필수입니다.' }, { status: 400 })
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return Response.json({ error: 'amount는 1~100 사이 정수여야 합니다.' }, { status: 400 })
    }

    const validTypes = ['content_create', 'keyword_analyze', 'image_generate']
    if (!validTypes.includes(action_type)) {
      return Response.json({ error: '유효하지 않은 action_type입니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Verify user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (!user) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Insert grant usage logs (usage.ts의 checkUsageLimit이 이 레코드를 차감함)
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const logs = []
    for (let i = 0; i < amount; i++) {
      logs.push({
        user_id: id,
        action: `${action_type}_grant`,
        step: reason || 'admin_grant',
        tokens: 0,
        year_month: yearMonth,
      })
    }

    const { error } = await supabase.from('usage_logs').insert(logs)
    if (error) throw error

    // 감사 로그
    try {
      await supabase.from('action_logs').insert({
        admin_id: authUser.id,
        target_user_id: id,
        action: 'usage_grant',
        metadata: { action_type, amount, reason: reason || null },
      })
    } catch {
      // 로그 실패는 비치명적
    }

    return Response.json({
      success: true,
      message: `${amount}건의 ${action_type} 사용량이 지급되었습니다.`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
