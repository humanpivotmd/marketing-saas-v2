import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const publishSchema = z.object({
  content_id: z.string().uuid(),
  image_url: z.string().url().optional(),
})

// POST: Instagram Graph API 발행
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(publishSchema, body)
    const supabase = createServerSupabase()

    // 콘텐츠 조회
    const { data: content } = await supabase
      .from('contents')
      .select('*')
      .eq('id', data.content_id)
      .eq('user_id', user.userId)
      .single()

    if (!content) throw new NotFoundError('콘텐츠를 찾을 수 없습니다.')

    // 채널 연동 정보 조회
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.userId)
      .eq('platform', 'instagram')
      .single()

    if (!channel?.access_token) {
      throw new ValidationError('Instagram 계정이 연동되지 않았습니다. 설정에서 연동해주세요.')
    }

    const igUserId = channel.platform_user_id
    const accessToken = channel.access_token

    // Step 1: 미디어 컨테이너 생성
    const containerParams: Record<string, string> = {
      caption: content.body || '',
      access_token: accessToken,
    }

    if (data.image_url) {
      containerParams.image_url = data.image_url
    } else {
      // 이미지 없으면 캐러셀 없이 텍스트만 - Instagram은 이미지 필수
      throw new ValidationError('Instagram 발행에는 이미지가 필요합니다.')
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerParams),
      }
    )

    const containerData = await containerRes.json()
    if (containerData.error) {
      throw new Error(containerData.error.message)
    }

    // Step 2: 미디어 발행
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      }
    )

    const publishData = await publishRes.json()
    if (publishData.error) {
      throw new Error(publishData.error.message)
    }

    // 콘텐츠 상태 업데이트
    await supabase
      .from('contents')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        meta: {
          ...content.meta,
          platform_post_id: publishData.id,
          platform: 'instagram',
        },
      })
      .eq('id', data.content_id)

    return Response.json({
      success: true,
      data: {
        published_at: new Date().toISOString(),
        platform_post_id: publishData.id,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
