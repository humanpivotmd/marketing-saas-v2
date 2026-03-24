import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const keywordCreateSchema = z.object({
  keyword: z.string().min(1, '키워드를 입력하세요').max(200),
  group_name: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  target: z.string().max(100).optional(),
  purpose: z.string().max(200).optional(),
})

// GET: 저장된 키워드 목록
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const group = url.searchParams.get('group')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('keywords')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (group) {
      query = query.eq('group_name', group)
    }

    const { data, count, error } = await query

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

// POST: 키워드 등록
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(keywordCreateSchema, body)
    const supabase = createServerSupabase()

    const { data: keyword, error } = await supabase
      .from('keywords')
      .insert({
        user_id: user.userId,
        keyword: data.keyword.replace(/<[^>]*>/g, '').trim(),
        group_name: data.group_name || null,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data: keyword }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 키워드 일괄 삭제
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()

    const ids = z.array(z.string().uuid()).min(1).parse(body.ids)
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('user_id', user.userId)
      .in('id', ids)

    if (error) throw error

    return Response.json({ success: true, deleted: ids.length })
  } catch (error) {
    return handleApiError(error)
  }
}
