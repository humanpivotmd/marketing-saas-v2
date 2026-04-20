import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 회원 상세
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !user) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Get plan info
    let plan = null
    if (user.plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', user.plan_id)
        .single()
      plan = planData
    }

    // Get usage stats this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: contentCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('action_type', 'content_create')
      .gte('created_at', monthStart)

    const { count: keywordCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('action_type', 'keyword_analyze')
      .gte('created_at', monthStart)

    return Response.json({
      success: true,
      data: {
        ...user,
        password_hash: undefined,
        plan,
        usage: {
          content: contentCount || 0,
          keyword: keywordCount || 0,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: 회원 수정 (role/plan/status/memo)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const { id } = await params
    const body = await req.json()
    const supabase = createServerSupabase()

    const allowedFields = ['role', 'status', 'plan_id', 'name', 'onboarding_done']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // 변경 전 값 조회 (감사 로그용)
    const { data: before } = await supabase
      .from('users')
      .select('role, status, plan_id')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, name, role, status, plan_id')
      .single()

    if (error || !data) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 감사 로그: 변경된 필드 기준 분기
    try {
      const logs: Array<{ admin_id: string; target_user_id: string; action: string; metadata: Record<string, unknown> }> = []
      if (before && body.role !== undefined && before.role !== body.role) {
        logs.push({ admin_id: authUser.id, target_user_id: id, action: 'role_change', metadata: { before: before.role, after: body.role } })
      }
      if (before && body.status !== undefined && before.status !== body.status) {
        logs.push({ admin_id: authUser.id, target_user_id: id, action: 'status_change', metadata: { before: before.status, after: body.status } })
      }
      if (before && body.plan_id !== undefined && before.plan_id !== body.plan_id) {
        logs.push({ admin_id: authUser.id, target_user_id: id, action: 'plan_limit_change', metadata: { before_plan: before.plan_id, after_plan: body.plan_id } })
      }
      if (logs.length > 0) {
        await supabase.from('action_logs').insert(logs)
      }
    } catch {
      // 로그 실패는 비치명적
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 회원 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    if (authUser.role !== 'super_admin') {
      return Response.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
