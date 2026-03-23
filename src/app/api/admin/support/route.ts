import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 문의 목록 (관리자)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') || ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('support_tickets')
      .select('*, users!inner(email, name)', { count: 'exact' })

    if (status) query = query.eq('status', status)

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

// PUT: 답변/상태 변경
export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    const { id, admin_reply, status } = await req.json()

    if (!id) {
      return Response.json({ error: '문의 ID가 필요합니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const updates: Record<string, unknown> = {}
    if (admin_reply) {
      updates.admin_reply = admin_reply
      updates.replied_at = new Date().toISOString()
    }
    if (status) updates.status = status

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
