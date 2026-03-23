import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const keywordUpdateSchema = z.object({
  keyword: z.string().min(1).max(200).optional(),
  group_name: z.string().max(100).nullable().optional(),
  grade: z.string().max(5).optional(),
  monthly_search: z.number().int().optional(),
  monthly_search_pc: z.number().int().optional(),
  monthly_search_mobile: z.number().int().optional(),
  competition: z.string().max(10).optional(),
  cpc: z.number().int().optional(),
  trend_data: z.record(z.string(), z.unknown()).nullable().optional(),
  last_analyzed: z.string().datetime().optional(),
})

// GET: 키워드 상세
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single()

    if (error || !data) throw new NotFoundError('키워드를 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: 키워드 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const body = await req.json()
    const updates = validateRequest(keywordUpdateSchema, body)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('keywords')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('키워드를 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 키워드 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
