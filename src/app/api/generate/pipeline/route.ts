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
      .is('deleted_at', null)
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
          // 중복 row cleanup: 컨펌 안 된 contents row를 모두 삭제.
          // 컨펌된 것 (status='confirmed' 또는 confirmed_at IS NOT NULL)은 절대 보호.
          // 과거 race condition 등으로 같은 채널 중복 row가 생긴 것을 영구 정리.
          // pipeline은 idempotent해야 하므로 미컨펌 row는 항상 새로 만드는 게 안전.
          await supabase
            .from('contents')
            .delete()
            .eq('project_id', project_id)
            .eq('user_id', authUser.userId)
            .is('confirmed_at', null)
            .neq('status', 'confirmed')

          // 컨펌된 row만 남은 상태에서 채널 확인 (부분 컨펌 보존)
          const { data: existingContents } = await supabase
            .from('contents')
            .select('channel, id')
            .eq('project_id', project_id)
            .eq('user_id', authUser.userId)
          const existingChannels = new Set(existingContents?.map((c: { channel: string }) => c.channel) || [])
          for (const c of existingContents || []) {
            contentIds[(c as { channel: string; id: string }).channel] = (c as { channel: string; id: string }).id
          }

          for (const channel of orderedChannels) {
            // 이미 생성된 채널 건너뜀
            if (existingChannels.has(channel)) {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'channel_done', channel, skipped: true })}\n\n`
              ))
              continue
            }
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'progress', channel, message: `${channel} 생성 중...` })}\n\n`
            ))

            const prompt = buildChannelPrompt(ctx, channel)

            const claudeBody = JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: channel === 'blog' ? 4096 : 2048,
                messages: [{ role: 'user', content: prompt }],
              })

            const RETRY_DELAYS = [1000, 3000, 5000, 8000, 12000]
            let claudeRes: Response | null = null
            for (let attempt = 1; attempt <= 5; attempt++) {
              claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey!,
                  'anthropic-version': '2023-06-01',
                },
                body: claudeBody,
              })
              if (claudeRes.ok) break
              const retryable = [500, 502, 503, 529].includes(claudeRes.status)
              if (retryable && attempt < 5) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'progress', channel, message: `${channel} 재시도 중... (${attempt}/5)` })}\n\n`
                ))
                await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]))
              } else {
                break
              }
            }

            if (!claudeRes || !claudeRes.ok) {
              const errorBody = claudeRes ? await claudeRes.text() : 'no response'
              console.error(`[pipeline] Claude API error for ${channel}:`, {
                status: claudeRes?.status,
                body: errorBody,
                apiKeyPrefix: apiKey!.slice(0, 10) + '...',
              })
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'error', channel, message: `${channel} 생성 실패 (${claudeRes?.status ?? 'unknown'}): ${errorBody.slice(0, 200)}` })}\n\n`
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
            const { data: saved, error: insertError } = await supabase
              .from('contents')
              .insert({
                user_id: authUser.userId,
                project_id,
                channel: contentType,
                title: project.selected_title,
                body: text,
                keyword: project.keyword_text || '',
                status: 'generated',
                metadata: {
                  tone: snapshot.writing_tone,
                  ai_model: 'claude-sonnet-4-20250514',
                  word_count: text.length,
                  hashtags: hashtags.length > 0 ? hashtags : [],
                },
              })
              .select('id')
              .single()

            if (insertError) {
              console.error(`[pipeline] DB insert error for ${channel}:`, insertError)
            }

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
          // blog가 선택됐으나 저장에 실패한 경우 s5를 completed로 올리지 않음
          const blogOk = !selectedChannels.includes('blog') || !!contentIds['blog']
          await supabase
            .from('projects')
            .update({
              content_ids: contentIds,
              current_step: 5,
              step_status: {
                ...project.step_status,
                s5: blogOk ? 'completed' : (project.step_status?.s5 || 'pending'),
              },
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
