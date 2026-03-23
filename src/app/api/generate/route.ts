import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { checkUsageLimit, logUsage } from '@/lib/usage'
import { getActivePrompt, buildPrompt, STEP_PROMPTS } from '@/lib/prompts'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const generateSchema = z.object({
  keywordId: z.string().uuid().optional(),
  keyword: z.string().min(1).max(200).optional(),
  channels: z.array(z.enum(['blog', 'threads', 'instagram', 'script'])).min(1),
  settings: z.object({
    length: z.enum(['short', 'medium', 'long']).optional(),
    style: z.string().max(50).optional(),
    tone: z.string().max(50).optional(),
  }).optional(),
  brandVoiceId: z.string().uuid().optional(),
  outline: z.string().optional(),
})

// POST: 일괄 생성 (SSE 스트리밍)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(generateSchema, body)
    const supabase = createServerSupabase()

    // 키워드 확인
    let keywordText = data.keyword || ''
    if (data.keywordId) {
      const { data: kw } = await supabase
        .from('keywords')
        .select('keyword')
        .eq('id', data.keywordId)
        .eq('user_id', user.userId)
        .single()
      if (kw) keywordText = kw.keyword
    }
    if (!keywordText) throw new ValidationError('키워드를 입력하세요.')

    // 사용량 체크
    const usage = await checkUsageLimit(user.userId, 'content_create', user.plan)
    if (!usage.allowed) {
      return Response.json(
        { error: usage.error, code: usage.code },
        { status: 403 }
      )
    }

    // Brand Voice 조회
    let brandVoiceText = ''
    if (data.brandVoiceId) {
      const { data: bv } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('id', data.brandVoiceId)
        .eq('user_id', user.userId)
        .single()
      if (bv) {
        brandVoiceText = [
          bv.description,
          bv.tone ? `톤: ${bv.tone}` : '',
          bv.target_audience ? `타깃: ${bv.target_audience}` : '',
          bv.keywords?.length ? `핵심 키워드: ${bv.keywords.join(', ')}` : '',
          bv.banned_words?.length ? `금지어: ${bv.banned_words.join(', ')}` : '',
        ].filter(Boolean).join('\n')
      }
    }

    const settings = data.settings || {}
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const results: Array<{ channel: string; contentId: string }> = []

        try {
          for (let i = 0; i < data.channels.length; i++) {
            const channel = data.channels[i]

            // 진행률 전송
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                channel,
                step: i + 1,
                total: data.channels.length,
                percent: Math.round(((i) / data.channels.length) * 100),
              })}\n\n`
            ))

            // 프롬프트 빌드
            const adminPrompt = await getActivePrompt(channel)
            const template = adminPrompt || STEP_PROMPTS[channel] || STEP_PROMPTS.blog
            const prompt = buildPrompt(template, {
              keyword: keywordText,
              brand_voice: brandVoiceText || '지정하지 않음',
              tone: settings.tone || 'professional',
              length: settings.length || 'medium',
              style: settings.style || '정보 전달',
              additional_instructions: data.outline || '',
            })

            // Claude API 호출
            let generatedContent = ''
            let generatedTitle = ''

            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'error', channel, message: 'AI API 키가 설정되지 않았습니다.' })}\n\n`
              ))
              continue
            }

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
                  max_tokens: channel === 'threads' ? 1024 : 4096,
                  messages: [{ role: 'user', content: prompt }],
                  stream: true,
                }),
              })

              if (!claudeRes.ok) {
                throw new Error(`Claude API error: ${claudeRes.status}`)
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
                          generatedContent += parsed.delta.text
                          controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({
                              type: 'chunk',
                              channel,
                              content: parsed.delta.text,
                            })}\n\n`
                          ))
                        }
                      } catch {
                        // skip non-JSON lines
                      }
                    }
                  }
                }
              }
            } catch {
              // Fallback: 에러 시 placeholder
              generatedContent = `[${channel}] ${keywordText} 관련 콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.`
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'error', channel, message: '콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.' })}\n\n`
              ))
            }

            // 제목 추출
            const titleMatch = generatedContent.match(/^#\s+(.+)/m)
            generatedTitle = titleMatch ? titleMatch[1].trim() : `${keywordText} - ${channel}`

            // DB 저장
            const { data: saved } = await supabase
              .from('contents')
              .insert({
                user_id: user.userId,
                keyword_id: data.keywordId || null,
                keyword: keywordText,
                channel,
                title: generatedTitle,
                body: generatedContent,
                hashtags: extractHashtags(generatedContent),
                status: 'generated',
                meta: {
                  tone: settings.tone,
                  length: settings.length,
                  style: settings.style,
                  brand_voice_id: data.brandVoiceId,
                },
              })
              .select('id')
              .single()

            if (saved) {
              results.push({ channel, contentId: saved.id })
            }

            // 사용량 기록
            await logUsage(user.userId, 'content_create', channel, 'claude-sonnet-4-20250514')

            // 채널 완료 이벤트
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({
                type: 'channel_done',
                channel,
                contentId: saved?.id,
                title: generatedTitle,
              })}\n\n`
            ))
          }

          // 전체 완료
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              results,
              percent: 100,
            })}\n\n`
          ))
        } catch (err) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', channel: 'system', message: '스트리밍 중 예기치 않은 오류가 발생했습니다.' })}\n\n`
          ))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w가-힣]+/g)
  return matches ? [...new Set(matches)].slice(0, 30) : []
}
