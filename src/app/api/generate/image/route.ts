import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { checkUsageLimit, logUsage } from '@/lib/usage'
import { imageGenerateSchema, validateRequest } from '@/lib/validations'

// POST: Gemini 이미지 생성
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(imageGenerateSchema, body)
    const supabase = createServerSupabase()

    // 사용량 체크
    const usage = await checkUsageLimit(user.userId, 'image_generate')
    if (!usage.allowed) {
      return Response.json({ error: usage.error, code: usage.code }, { status: 403 })
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return Response.json({ error: 'Gemini API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    // Gemini API 호출
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a marketing image for: ${data.prompt}\nStyle: ${data.style || 'photo'}\nThe image should be professional, clean, and suitable for Korean social media marketing.\nAspect ratio: ${data.size || '1080x1080'}`,
            }],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`)
    }

    const geminiResult = await geminiRes.json()

    // 이미지 데이터 추출
    const imagePart = geminiResult.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string } }) => p.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart?.inlineData) {
      return Response.json({ error: '이미지 생성에 실패했습니다.' }, { status: 500 })
    }

    // Supabase Storage에 업로드
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
    const fileName = `${user.userId}/${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: publicUrl } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    // DB에 기록
    const { data: imageRecord } = await supabase
      .from('images')
      .insert({
        user_id: user.userId,
        content_id: data.content_id || null,
        prompt: data.prompt,
        style: data.style || 'photo',
        size: data.size || '1080x1080',
        public_url: publicUrl.publicUrl,
        storage_path: fileName,
      })
      .select()
      .single()

    await logUsage(user.userId, 'image_generate', 'image', 'gemini-2.0-flash')

    return Response.json({ success: true, data: imageRecord })
  } catch (error) {
    return handleApiError(error)
  }
}
