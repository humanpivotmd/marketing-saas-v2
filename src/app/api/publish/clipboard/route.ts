import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const clipboardSchema = z.object({
  content_id: z.string().uuid(),
})

// POST: 네이버 블로그 원클릭 복사 기록
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(clipboardSchema, body)
    const supabase = createServerSupabase()

    const { data: content } = await supabase
      .from('contents')
      .select('*')
      .eq('id', data.content_id)
      .eq('user_id', user.userId)
      .single()

    if (!content) throw new NotFoundError('콘텐츠를 찾을 수 없습니다.')

    // 복사 기록 저장
    const existingMeta = (content.meta && typeof content.meta === 'object') ? content.meta as Record<string, unknown> : {}
    const prevCopyCount = typeof existingMeta.copy_count === 'number' ? existingMeta.copy_count : 0
    await supabase
      .from('contents')
      .update({
        meta: {
          ...existingMeta,
          last_copied_at: new Date().toISOString(),
          copy_count: prevCopyCount + 1,
        },
      })
      .eq('id', data.content_id)

    return Response.json({
      success: true,
      data: {
        copied: true,
        content_id: data.content_id,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
