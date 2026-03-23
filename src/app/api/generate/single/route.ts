import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { checkUsageLimit, logUsage } from '@/lib/usage'
import { getActivePrompt, buildPrompt, STEP_PROMPTS } from '@/lib/prompts'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const singleGenSchema = z.object({
  contentId: z.string().uuid().optional(),
  keyword: z.string().min(1).max(200),
  channel: z.enum(['blog', 'threads', 'instagram', 'script']),
  brandVoiceId: z.string().uuid().optional(),
  tone: z.string().max(50).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  additionalInstructions: z.string().max(1000).optional(),
})

// POST: 개별 채널 재생성
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(singleGenSchema, body)
    const supabase = createServerSupabase()

    // 사용량 체크
    const usage = await checkUsageLimit(user.userId, 'content_create', user.plan)
    if (!usage.allowed) {
      return Response.json({ error: usage.error, code: usage.code }, { status: 403 })
    }

    // Brand Voice
    let brandVoiceText = '지정하지 않음'
    if (data.brandVoiceId) {
      const { data: bv } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('id', data.brandVoiceId)
        .eq('user_id', user.userId)
        .single()
      if (bv) {
        brandVoiceText = [bv.description, bv.tone, bv.target_audience].filter(Boolean).join('\n')
      }
    }

    const adminPrompt = await getActivePrompt(data.channel)
    const template = adminPrompt || STEP_PROMPTS[data.channel] || STEP_PROMPTS.blog
    const prompt = buildPrompt(template, {
      keyword: data.keyword,
      brand_voice: brandVoiceText,
      tone: data.tone || 'professional',
      length: data.length || 'medium',
      additional_instructions: data.additionalInstructions || '',
    })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'AI API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: data.channel === 'threads' ? 1024 : 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) throw new Error(`Claude API error: ${claudeRes.status}`)

    const result = await claudeRes.json()
    const generatedContent = result.content?.[0]?.text || ''
    const titleMatch = generatedContent.match(/^#\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : `${data.keyword} - ${data.channel}`

    // 기존 콘텐츠 업데이트 또는 새로 생성
    let saved
    if (data.contentId) {
      const { data: updated } = await supabase
        .from('contents')
        .update({
          title,
          body: generatedContent,
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.contentId)
        .eq('user_id', user.userId)
        .select()
        .single()
      saved = updated
    } else {
      const { data: created } = await supabase
        .from('contents')
        .insert({
          user_id: user.userId,
          keyword: data.keyword,
          channel: data.channel,
          title,
          body: generatedContent,
          status: 'generated',
          meta: { tone: data.tone, length: data.length, brand_voice_id: data.brandVoiceId },
        })
        .select()
        .single()
      saved = created
    }

    await logUsage(user.userId, 'content_create', data.channel, 'claude-sonnet-4-20250514')

    return Response.json({ success: true, data: saved })
  } catch (error) {
    return handleApiError(error)
  }
}
