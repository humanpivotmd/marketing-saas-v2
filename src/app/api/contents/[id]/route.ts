import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const contentUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  seo_score: z.number().min(0).max(100).optional(),
  status: z.enum(['draft', 'generated', 'confirmed', 'edited', 'scheduled', 'published', 'failed']).optional(),
  confirmed_at: z.string().optional(),
  revision_note: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

// GET: 콘텐츠 상세
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single()

    if (error || !data) throw new NotFoundError('콘텐츠를 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: 콘텐츠 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const body = await req.json()
    const updates = validateRequest(contentUpdateSchema, body)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('contents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('콘텐츠를 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 콘텐츠 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('contents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
