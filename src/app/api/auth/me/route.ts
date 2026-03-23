import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, status, email_verified, avatar_url, plan_id, onboarding_done, experience_level, created_at')
      .eq('id', authUser.userId)
      .single()

    if (!user) {
      return Response.json({ error: '사용자를 찾을 수 없습니다.', code: 'NOT_FOUND' }, { status: 404 })
    }

    let planName = 'free'
    let planDisplayName = 'Free'
    if (user.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('name, display_name')
        .eq('id', user.plan_id)
        .single()
      if (plan) {
        planName = plan.name
        planDisplayName = plan.display_name
      }
    }

    return Response.json({
      success: true,
      user: {
        ...user,
        plan: planName,
        plan_display_name: planDisplayName,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
