import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin, hashPassword } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 최고관리자가 회원 비밀번호 강제 변경
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    // super_admin 전용
    if (authUser.role !== 'super_admin') {
      return Response.json(
        { error: '최고 관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // 자기 자신 변경 금지 (락아웃 방지)
    if (authUser.id === id) {
      return Response.json(
        { error: '자기 자신의 비밀번호는 이 기능으로 변경할 수 없습니다. 프로필 설정을 사용하세요.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const newPassword = body.new_password

    if (!newPassword || typeof newPassword !== 'string') {
      return Response.json(
        { error: '새 비밀번호를 입력해 주세요.' },
        { status: 400 }
      )
    }
    if (newPassword.length < 8) {
      return Response.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }
    if (newPassword.length > 72) {
      return Response.json(
        { error: '비밀번호는 최대 72자까지 입니다.' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: target, error: findErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (findErr || !target) {
      return Response.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const passwordHash = await hashPassword(newPassword)

    const { error: updErr } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updErr) throw updErr

    // action_logs 테이블이 아직 없어 usage_logs에 기록 (action-logs route와 동일 패턴)
    try {
      await supabase.from('usage_logs').insert({
        user_id: id,
        action_type: 'admin_password_reset',
        metadata: { admin_id: authUser.id, target_email: target.email },
      })
    } catch {
      // 로그 실패는 비치명적
    }

    return Response.json({
      success: true,
      data: { id: target.id, email: target.email },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
