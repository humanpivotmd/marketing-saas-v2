import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildPrompt } from '@/lib/prompts'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const outlineSchema = z.object({
  keyword: z.string().min(1).max(200),
  brandVoiceId: z.string().uuid().optional(),
  tone: z.string().max(50).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
})

const OUTLINE_PROMPT = `당신은 한국 SEO에 특화된 블로그 아웃라인 전문가입니다.

아래 키워드에 대한 블로그 글의 아웃라인을 작성하세요.

## 규칙
- 제목 1개 (H1)
- 소제목 4-7개 (H2)
- 각 소제목 아래 핵심 포인트 2-3개
- 네이버 SEO 최적화 구조
- JSON 형식으로 출력

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}
## 길이: {length}

아래 JSON 형식으로 출력:
{
  "title": "제목",
  "sections": [
    { "heading": "소제목", "points": ["포인트1", "포인트2"] }
  ]
}`

// POST: 블로그 아웃라인 생성
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(outlineSchema, body)
    const supabase = createServerSupabase()

    // Brand Voice
    let brandVoiceText = '지정하지 않음'
    if (data.brandVoiceId) {
      const { data: bv } = await supabase
        .from('brand_voices')
        .select('description, tone, target_audience')
        .eq('id', data.brandVoiceId)
        .eq('user_id', user.userId)
        .single()
      if (bv) {
        brandVoiceText = [bv.description, bv.tone, bv.target_audience].filter(Boolean).join(', ')
      }
    }

    const prompt = buildPrompt(OUTLINE_PROMPT, {
      keyword: data.keyword,
      brand_voice: brandVoiceText,
      tone: data.tone || 'professional',
      length: data.length || 'medium',
    })

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      throw new Error(`Claude API error: ${claudeRes.status}`)
    }

    const result = await claudeRes.json()
    const text = result.content?.[0]?.text || ''

    // JSON 추출
    let outline
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      outline = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: data.keyword, sections: [] }
    } catch {
      outline = { title: data.keyword, sections: [], raw: text }
    }

    return Response.json({ success: true, data: outline })
  } catch (error) {
    return handleApiError(error)
  }
}
