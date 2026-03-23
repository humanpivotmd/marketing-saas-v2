import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { profileUpdateSchema, validateRequest } from '@/lib/validations'

// GET: 프로필 조회
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, status, avatar_url, plan_id, onboarding_done, created_at')
      .eq('id', authUser.userId)
      .single()

    if (error || !data) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Get plan info
    let plan = null
    if (data.plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('name, display_name')
        .eq('id', data.plan_id)
        .single()
      plan = planData
    }

    return Response.json({
      success: true,
      data: {
        ...data,
        plan: plan?.name || 'free',
        plan_display_name: plan?.display_name || 'Free',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: 이름 변경
export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const body = await req.json()
    const { name } = validateRequest(profileUpdateSchema, body)

    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('users')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', authUser.userId)
      .select('id, name, email')
      .single()

    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
