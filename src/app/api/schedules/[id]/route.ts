import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const scheduleUpdateSchema = z.object({
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['pending', 'published', 'failed', 'cancelled']).optional(),
})

// PUT: 스케줄 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const body = await req.json()
    const updates = validateRequest(scheduleUpdateSchema, body)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('스케줄을 찾을 수 없습니다.')

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: 스케줄 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
