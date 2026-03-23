import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { brandVoiceCreateSchema, validateRequest } from '@/lib/validations'

// PUT: Brand Voice 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const body = await req.json()
    const updates = validateRequest(brandVoiceCreateSchema.partial(), body)
    const supabase = createServerSupabase()

    if (updates.is_default) {
      await supabase
        .from('brand_voices')
        .update({ is_default: false })
        .eq('user_id', user.userId)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('brand_voices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Brand Voice를 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: Brand Voice 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('brand_voices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
