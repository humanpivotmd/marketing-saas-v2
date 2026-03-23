import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 결제 이력 조회
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const offset = (page - 1) * perPage

    // 결제 이력 + 플랜 정보 조인
    const { data: payments, count } = await supabase
      .from('payments')
      .select('*, plans(display_name)', { count: 'exact' })
      .eq('user_id', authUser.userId)
      .order('paid_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    return Response.json({
      success: true,
      data: payments || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
