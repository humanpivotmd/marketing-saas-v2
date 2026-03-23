import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: admin_logs 행동 로그 (관리자 액션 추적)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const from = (page - 1) * limit
    const to = from + limit - 1

    // admin_logs may not exist yet, fallback to usage_logs filtered by admin actions
    const { data, count, error } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact' })
      .like('action_type', '%grant%')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
