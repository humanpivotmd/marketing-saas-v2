import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildVideoScriptPrompt, type PipelineContext } from '@/lib/prompts/pipeline'
import { logUsage } from '@/lib/usage'
import { generateRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, generateRateLimit, '/api/generate/video-script')
    if (rateLimited) return rateLimited
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    const { project_id, format, target_channel, scene_count, scene_duration, image_style, style_detail } = body

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

    // 블로그 콘텐츠 조회 (있으면 참조)
    const blogContentId = project.content_ids?.blog
    let blogBody = ''
    if (blogContentId) {
      const { data: content } = await supabase.from('contents').select('body').eq('id', blogContentId).eq('user_id', authUser.userId).single()
      if (content) blogBody = content.body
    }

    const snapshot = project.settings_snapshot || {}
    const ctx: PipelineContext & { format: 'short' | 'normal'; targetChannel: string; sceneCount: number; sceneDuration: number } = {
      businessType: project.business_type || 'B2C',
      keyword: project.keyword_text || '',
      companyName: snapshot.company_name,
      serviceName: snapshot.service_name,
      selectedTitle: project.selected_title || '',
      blogContent: blogBody || '',
      draftContent: project.draft_content || '',
      format: format || 'short',
      targetChannel: target_channel || 'youtube',
      sceneCount: scene_count || 4,
      sceneDuration: scene_duration || 5,
    }

    const prompt = buildVideoScriptPrompt(ctx)
    const apiKey = process.env.ANTHROPIC_API_KEY
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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      return Response.json({ success: false, error: `AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.` }, { status: 502 })
    }

    const result = await claudeRes.json()
    const text = result.content?.[0]?.text || ''
    const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)

    // JSON 파싱
    let storyboard = []
    let fullScript = text
    let title = ''
    let totalDuration = (scene_count || 4) * (scene_duration || 5)
    try {
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
      storyboard = parsed.scenes || []
      title = parsed.title || ''
      totalDuration = parsed.total_duration || totalDuration
      fullScript = text
    } catch { /* use raw text */ }

    // DB 저장
    const { data: saved, error: saveError } = await supabase
      .from('video_scripts')
      .insert({
        project_id,
        user_id: authUser.userId,
        format: format || 'short',
        target_channel: target_channel || 'youtube',
        scene_count: scene_count || 4,
        scene_duration: scene_duration || 5,
        total_duration: totalDuration,
        image_style: image_style || 'photo',
        style_detail: style_detail || '모던',
        storyboard,
        full_script: fullScript,
        status: 'generated',
      })
      .select('id')
      .single()

    if (saveError) throw saveError

    // step_status s7 업데이트 + 중복 방지 (기존 삭제)
    await supabase.from('video_scripts').delete().eq('project_id', project_id).eq('user_id', authUser.userId).neq('id', saved?.id || '')

    await supabase
      .from('projects')
      .update({ step_status: { ...project.step_status, s7: 'completed' } })
      .eq('id', project_id)
      .eq('user_id', authUser.userId)

    await logUsage(authUser.userId, 'video_script_generate', 'video', 'claude-sonnet-4-20250514', tokens)

    return Response.json({
      success: true,
      data: { id: saved?.id, title, totalDuration, storyboard, tokens },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
