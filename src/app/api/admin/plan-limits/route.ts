import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 플랜별 제한값
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: 플랜 제한값 수정
export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    const { id, ...updates } = await req.json()

    if (!id) {
      return Response.json({ error: '플랜 ID가 필요합니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const allowedFields = [
      'display_name', 'price_monthly', 'price_yearly',
      'content_limit', 'keyword_limit', 'image_limit',
      'saved_keyword_limit', 'channel_limit', 'brand_voice_limit',
      'team_member_limit', 'history_days', 'has_api_access',
      'has_priority_support', 'is_active', 'sort_order',
    ]

    const filtered: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filtered[field] = updates[field]
      }
    }

    const { data, error } = await supabase
      .from('plans')
      .update(filtered)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: '플랜을 찾을 수 없습니다.' }, { status: 404 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
