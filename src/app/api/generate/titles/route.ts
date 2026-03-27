import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { buildTitlePrompt, type PipelineContext } from '@/lib/prompts/pipeline'
import { logUsage } from '@/lib/usage'
import { generateRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'
import { sanitizeInput, sanitizePromptInput } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, generateRateLimit, '/api/generate/titles')
    if (rateLimited) return rateLimited
    const authUser = await requireAuth(req)
    const body = await req.json()

    const ctx: PipelineContext = {
      businessType: body.business_type || 'B2C',
      keyword: sanitizeInput(body.keyword || ''),
      companyName: sanitizeInput(body.company_name || ''),
      serviceName: sanitizeInput(body.service_name || ''),
      targetAudience: sanitizeInput(body.target_audience || ''),
      tone: body.tone,
      topicType: body.topic_type,
      userPrompt: body.custom_prompt ? sanitizePromptInput(body.custom_prompt) : undefined,
      promptMode: body.prompt_mode,
      coreMessage: body.core_message ? sanitizeInput(body.core_message) : undefined,
    }

    if (!ctx.keyword) {
      return Response.json({ success: false, error: '키워드를 입력하세요.' }, { status: 400 })
    }

    const prompt = buildTitlePrompt(ctx)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      return Response.json({ success: false, error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      return Response.json({ success: false, error: `AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.` }, { status: 502 })
    }

    const result = await claudeRes.json()
    const text = result.content?.[0]?.text || ''
    const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)

    // JSON 파싱 시도
    let titles: string[] = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) titles = JSON.parse(jsonMatch[0])
    } catch {
      titles = text.split('\n').filter((l: string) => l.trim().length > 5).slice(0, 5)
    }

    await logUsage(authUser.userId, 'title_generate', 'blog', 'claude-sonnet-4-20250514', tokens)

    return Response.json({ success: true, data: { titles, tokens } })
  } catch (err) {
    return handleApiError(err)
  }
}
