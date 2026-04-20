import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { parsePagination, paginatedResponse } from '@/lib/pagination'

// GET: 관리자용 결제 이력 조회
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const params = parsePagination(url, { defaultLimit: 50 })
    const userIdFilter = url.searchParams.get('user_id') || ''
    const statusFilter = url.searchParams.get('status') || ''

    let query = supabase
      .from('payments')
      .select('*, users!inner(email, name), plans(display_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1)

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter)
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, count, error } = await query

    if (error) throw error

    return paginatedResponse(data || [], count, params)
  } catch (error) {
    return handleApiError(error)
  }
}
