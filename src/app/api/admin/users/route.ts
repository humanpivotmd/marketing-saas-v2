import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { parsePagination, paginatedResponse } from '@/lib/pagination'

// GET: 회원 목록 (role/plan/status/검색 필터)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const { page, limit, offset } = parsePagination(url)
    const search = url.searchParams.get('search') || ''
    const role = url.searchParams.get('role') || ''
    const status = url.searchParams.get('status') || ''
    const plan = url.searchParams.get('plan') || ''

    let query = supabase
      .from('users')
      .select('id, email, name, role, status, plan_id, onboarding_done, last_login_at, created_at', { count: 'exact' })

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }
    if (role) query = query.eq('role', role)
    if (status) query = query.eq('status', status)
    if (plan) query = query.eq('plan_id', plan)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return paginatedResponse(data || [], count, { page, limit })
  } catch (error) {
    return handleApiError(error)
  }
}
