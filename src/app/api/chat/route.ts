import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(10000),
  })).min(1).max(50),
})

const SYSTEM_PROMPT = `당신은 MarketingFlow의 AI 마케팅 어시스턴트입니다.

역할:
- 네이버 SEO 전략 및 키워드 분석 조언
- 블로그, Threads, 인스타그램, 영상 스크립트 콘텐츠 전략 수립
- B2B/B2C 마케팅 콘텐츠 아이디어 제안
- 콘텐츠 작성 팁 및 가이드 제공

규칙:
- 항상 한국어로 응답하세요.
- 마케팅/콘텐츠/SEO 관련 질문에 전문적으로 답변하세요.
- 실용적이고 바로 적용 가능한 조언을 제공하세요.
- 간결하고 명확하게 답변하세요.`

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(chatSchema, body)

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'AI API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              messages: data.messages.map(m => ({
                role: m.role,
                content: m.content,
              })),
              stream: true,
            }),
          })

          if (!claudeRes.ok) {
            await claudeRes.text()
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: `AI 응답 오류: ${claudeRes.status}` })}\n\n`
            ))
            controller.close()
            return
          }

          const reader = claudeRes.body?.getReader()
          const decoder = new TextDecoder()

          if (reader) {
            let buffer = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const eventData = line.slice(6).trim()
                  if (eventData === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(eventData)
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'chunk', content: parsed.delta.text })}\n\n`
                      ))
                    }
                  } catch {
                    // skip non-JSON lines
                  }
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: '응답 생성 중 오류가 발생했습니다.' })}\n\n`
          ))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
