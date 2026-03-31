import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildChannelPrompt, type PipelineContext } from '@/lib/prompts/pipeline'
import { logUsage } from '@/lib/usage'
import { generateRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, generateRateLimit, '/api/generate/pipeline')
    if (rateLimited) return rateLimited
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    const { project_id } = body
    if (!project_id) {
      return Response.json({ success: false, error: 'project_id가 필요합니다.' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', authUser.userId)
      .single()

    if (!project) {
      return Response.json({ success: false, error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    const snapshot = project.settings_snapshot || {}
    const selectedChannels: string[] = snapshot.selected_channels || ['blog']
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      return Response.json({ success: false, error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 채널 순서: 블로그 있으면 먼저
    const contentChannels = selectedChannels.filter(c => c !== 'video')
    const orderedChannels = contentChannels.includes('blog')
      ? ['blog', ...contentChannels.filter(c => c !== 'blog')]
      : contentChannels

    const ctx: PipelineContext = {
      businessType: project.business_type || 'B2C',
      keyword: project.keyword_text || '',
      companyName: snapshot.company_name,
      serviceName: snapshot.service_name,
      targetAudience: snapshot.target_audience,
      targetGender: snapshot.target_gender,
      tone: snapshot.writing_tone,
      industry: snapshot.industry,
      blogCategory: snapshot.blog_category,
      fixedKeywords: snapshot.fixed_keywords,
      topicType: project.topic_type,
      selectedTitle: project.selected_title || '',
      draftContent: project.draft_content || '',
      userPrompt: project.custom_prompt,
      promptMode: project.prompt_mode,
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const contentIds: Record<string, string> = {}

        try {
          for (const channel of orderedChannels) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'progress', channel, message: `${channel} 생성 중...` })}\n\n`
            ))

            const prompt = buildChannelPrompt(ctx, channel)

            const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey!,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: channel === 'blog' ? 4096 : 2048,
                messages: [{ role: 'user', content: prompt }],
              }),
            })

            if (!claudeRes.ok) {
              const errorBody = await claudeRes.text()
              console.error(`[pipeline] Claude API error for ${channel}:`, {
                status: claudeRes.status,
                body: errorBody,
                apiKeyPrefix: apiKey!.slice(0, 10) + '...',
              })
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'error', channel, message: `${channel} 생성 실패 (${claudeRes.status}): ${errorBody.slice(0, 200)}` })}\n\n`
              ))
              continue
            }

            const result = await claudeRes.json()
            const text = result.content?.[0]?.text || ''
            const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)

            // 블로그 결과를 다음 채널 context로 전달
            if (channel === 'blog') {
              ctx.blogContent = text
            }

            // 해시태그 추출
            const hashtagMatch = text.match(/#[^\s#]+/g)
            const hashtags = hashtagMatch ? hashtagMatch.map((t: string) => t.replace('#', '')) : []

            // DB 저장
            const contentType = channel === 'video' ? 'video_script' : channel
            const { data: saved } = await supabase
              .from('contents')
              .insert({
                user_id: authUser.userId,
                project_id,
                keyword_id: project.keyword_id,
                type: contentType,
                title: project.selected_title,
                body: text,
                hashtags: hashtags.length > 0 ? hashtags : null,
                tone: snapshot.writing_tone,
                word_count: text.length,
                status: 'generated',
                ai_model: 'claude-sonnet-4-20250514',
              })
              .select('id')
              .single()

            if (saved) {
              contentIds[channel] = saved.id
              // 채널 완료 시마다 즉시 content_ids 업데이트 (SSE 이탈 대비)
              await supabase
                .from('projects')
                .update({ content_ids: contentIds })
                .eq('id', project_id)
                .eq('user_id', authUser.userId)
            }

            await logUsage(authUser.userId, 'content_create', contentType, 'claude-sonnet-4-20250514', tokens)

            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'channel_done', channel, contentId: saved?.id, wordCount: text.length })}\n\n`
            ))
          }

          // 전체 완료 시 step_status 업데이트
          await supabase
            .from('projects')
            .update({
              content_ids: contentIds,
              current_step: 5,
              step_status: { ...project.step_status, s5: 'completed' },
            })
            .eq('id', project_id)
            .eq('user_id', authUser.userId)

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done', contentIds })}\n\n`
          ))
        } catch (err) {
          console.error('[pipeline] Unexpected error:', err)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: `콘텐츠 생성 중 오류: ${(err as Error).message}` })}\n\n`
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
  } catch {
    return Response.json({ success: false, error: '인증 실패' }, { status: 401 })
  }
}
