import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 콘텐츠 복제+변형
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const supabase = createServerSupabase()

    // 원본 조회
    const { data: original, error: fetchError } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !original) throw new NotFoundError('콘텐츠를 찾을 수 없습니다.')

    // 복제 생성
    const { data: duplicate, error: insertError } = await supabase
      .from('contents')
      .insert({
        user_id: user.userId,
        keyword_id: original.keyword_id,
        keyword: original.keyword,
        channel: original.channel,
        title: original.title ? `${original.title} (복사본)` : null,
        body: original.body,
        hashtags: original.hashtags,
        seo_score: null,
        status: 'draft',
        meta: { ...original.meta, duplicated_from: id },
      })
      .select()
      .single()

    if (insertError) throw insertError

    return Response.json({ success: true, data: duplicate }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
