import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 로그인 잠금 해제
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, email, name, status')
      .single()

    if (error || !data) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 감사 로그
    try {
      await supabase.from('action_logs').insert({
        admin_id: authUser.id,
        target_user_id: id,
        action: 'user_unlock',
        metadata: { target_email: data.email },
      })
    } catch {
      // 로그 실패는 비치명적
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
