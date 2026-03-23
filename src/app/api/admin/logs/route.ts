import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: usage_logs 생성 로그 (페이지네이션)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const actionType = url.searchParams.get('action_type') || ''
    const userId = url.searchParams.get('user_id') || ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('usage_logs')
      .select('*, users!inner(email, name)', { count: 'exact' })

    if (actionType) query = query.eq('action_type', actionType)
    if (userId) query = query.eq('user_id', userId)

    const { data, count, error } = await query
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
